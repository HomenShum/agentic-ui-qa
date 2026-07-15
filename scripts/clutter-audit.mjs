#!/usr/bin/env node
/**
 * clutter-audit.mjs — conservative rendered-DOM inventory for DECLUTTER.md.
 *
 * This script surfaces review candidates. It never calls a component useless, infers
 * event-handler liveness, clicks audited controls, or emits a composite clutter score.
 * Lower counts are descriptive only. Protected-selector loss or a reachability
 * regression makes a baseline comparison UNSAFE_REDUCTION.
 *
 * Dependency-free: resolve Playwright from a target repo, like pixels.cjs.
 *
 * Usage:
 *   node <skill>/scripts/clutter-audit.mjs <config.json>
 *   node <skill>/scripts/clutter-audit.mjs <url>
 *
 * Config:
 * {
 *   "repo": "D:/repo-with-playwright",
 *   "url": "https://app.example.com/",
 *   "outDir": ".qa/evidence/declutter",
 *   "contextKey": "anonymous-public",
 *   "rootSelector": "main",
 *   "readySelector": "[data-testid=workspace-ready]",
 *   "storageState": ".auth/state.json",
 *   "ignoreSelectors": ["[data-qa-ignore]"],
 *   "protected": [{ "name": "receipt", "selector": "[data-testid=receipt]", "minCount": 1, "assertText": ["Receipt"] }],
 *   "assertText": [{ "name": "workspace-title", "text": "Workspace" }],
 *   "states": [{ "name": "mobile-light", "viewport": { "width": 390, "height": 844 }, "scheme": "light", "clicks": [] }],
 *   "baselineReport": ".qa/evidence/declutter/baseline/clutter-audit.json",
 *   "enforceProtected": true,
 *   "allowRedirects": false,
 *   "includeRawSelectors": false,
 *   "includeRawPaths": false,
 *   "textMode": "hash"
 * }
 *
 * Reports omit query strings, hashes, console text, request headers, and storage data.
 */
import fs from 'node:fs';
import path from 'node:path';
import { createRequire } from 'node:module';
import { createHash } from 'node:crypto';

const require = createRequire(import.meta.url);
const hashValue = (value) => createHash('sha256').update(Buffer.isBuffer(value) ? value : String(value)).digest('hex').slice(0, 20);
const safeErrorMessage = (error) => String(error?.message || error)
  .split('\n')[0]
  .replace(/https?:\/\/[^\s'"<>]+/gi, '(redacted-url)');

async function resolvePlaywright(repoHint) {
  const roots = [];
  if (repoHint) roots.push(path.resolve(repoHint));
  let dir = process.cwd();
  for (let i = 0; i < 7; i += 1) {
    roots.push(dir);
    const parent = path.dirname(dir);
    if (parent === dir) break;
    dir = parent;
  }
  for (const root of roots) {
    const candidate = path.join(root, 'node_modules', 'playwright');
    if (fs.existsSync(candidate)) return require(candidate);
  }
  try {
    return require('playwright');
  } catch {
    console.error('FATAL: playwright not found. Set "repo" to a repo with Playwright installed.');
    process.exit(1);
  }
}

function readConfig(arg) {
  if (!arg) {
    console.error('Usage: node clutter-audit.mjs <config.json | url>');
    process.exit(1);
  }
  if (/^https?:\/\//i.test(arg)) return { url: arg };
  const file = path.resolve(arg);
  const cfg = JSON.parse(fs.readFileSync(file, 'utf8'));
  cfg.__configDir = path.dirname(file);
  return cfg;
}

function resolveConfigPath(cfg, value) {
  if (!value || path.isAbsolute(value)) return value;
  return path.resolve(cfg.__configDir || process.cwd(), value);
}

function routeKey(value) {
  const parsed = new URL(value);
  return `${parsed.origin}${parsed.pathname}`;
}

function navigationIdentityKey(value) {
  const parsed = new URL(value);
  return `${parsed.origin}${parsed.pathname}${parsed.search}${parsed.hash}`;
}

function safeUrl(value, includeRawPaths = false) {
  try {
    const parsed = new URL(value);
    if (parsed.protocol === 'http:' || parsed.protocol === 'https:') {
      if (includeRawPaths) return { origin: parsed.origin, pathname: parsed.pathname };
      return {
        protocol: parsed.protocol,
        hostHash: `sha256-${hashValue(parsed.host)}`,
        pathnameHash: `sha256-${hashValue(parsed.pathname)}`,
        pathSegments: parsed.pathname.split('/').filter(Boolean).length,
      };
    }
    return { protocol: parsed.protocol, pathname: '(redacted)' };
  } catch {
    return { pathname: '(invalid)' };
  }
}

function normalizeAssertions(entries = []) {
  return entries.map((entry, index) => {
    if (typeof entry === 'string') return { name: `assert-${index + 1}`, expected: entry, scope: 'root' };
    return {
      name: entry.name || `assert-${index + 1}`,
      expected: entry.text ?? entry.expected ?? '',
      scope: entry.scope === 'document' ? 'document' : 'root',
    };
  });
}

function normalizeClicks(entries = []) {
  return entries.map((entry, index) => {
    if (typeof entry === 'string') return { name: `setup-${index + 1}`, selector: entry };
    return { name: entry.name || `setup-${index + 1}`, selector: entry.selector };
  });
}

function validateNamedEntries(entries, label) {
  const names = new Set();
  for (const entry of entries) {
    if (!entry?.name || typeof entry.name !== 'string') throw new Error(`${label} entries need a non-empty name`);
    if (names.has(entry.name)) throw new Error(`duplicate ${label} name: ${entry.name}`);
    names.add(entry.name);
  }
}

function sanitizeProbe(probe, cfg) {
  const sanitizeSelector = (value) => cfg.includeRawSelectors ? value : `selector-sha256-${hashValue(value)}`;
  const sanitizePath = (value) => cfg.includeRawPaths ? value : `path-sha256-${hashValue(value)}`;
  const sanitizeText = (value) => cfg.textMode === 'sample' ? String(value).slice(0, 80) : `text-sha256-${hashValue(value)}`;
  const visit = (value, key = '') => {
    if (Array.isArray(value)) {
      if (key === 'selectors') return value.map(sanitizeSelector);
      return value.map((item) => visit(item));
    }
    if (!value || typeof value !== 'object') {
      if (typeof value !== 'string') return value;
      if (key === 'selector') return sanitizeSelector(value);
      if (key === 'hrefPath') return sanitizePath(value);
      if (key === 'label' || key === 'text') return sanitizeText(value);
      return value;
    }
    return Object.fromEntries(Object.entries(value).map(([childKey, child]) => [childKey, visit(child, childKey)]));
  };
  return visit(probe);
}

function pageProbe(options) {
  const root = document.querySelector(options.rootSelector || 'body');
  if (!root) return { rootFound: false };

  const interactiveSelector = [
    'a[href]', 'button', 'input:not([type="hidden"])', 'select', 'textarea', 'summary',
    '[role="button"]', '[role="link"]', '[role="checkbox"]', '[role="radio"]',
    '[role="switch"]', '[role="tab"]', '[role="menuitem"]', '[role="menuitemcheckbox"]',
    '[role="menuitemradio"]', '[role="combobox"]', '[role="slider"]', '[role="spinbutton"]',
    '[role="textbox"]', '[role="treeitem"]', '[contenteditable="true"]',
    '[tabindex]:not([tabindex="-1"])',
  ].join(',');
  const mediaSelector = 'img,video,audio,canvas,picture,svg:not([aria-hidden="true"])';
  const ignoreSelectors = options.ignoreSelectors || [];

  const hiddenByClosedDetails = (el) => {
    let node = el;
    while (node && node !== document.documentElement) {
      if (node.tagName === 'DETAILS' && !node.open) {
        const summary = Array.from(node.children).find((child) => child.tagName === 'SUMMARY');
        if (!summary || !summary.contains(el)) return true;
      }
      node = node.parentElement;
    }
    return false;
  };

  const ignored = (el) => ignoreSelectors.some((selector) => {
    try { return Boolean(el.closest(selector)); } catch { return false; }
  });

  const visible = (el) => {
    if (!(el instanceof Element) || ignored(el) || hiddenByClosedDetails(el)) return false;
    const rect = el.getBoundingClientRect();
    if (rect.width < 1 || rect.height < 1) return false;
    const style = getComputedStyle(el);
    if (style.display === 'none' || style.visibility === 'hidden' || Number(style.opacity) === 0) return false;
    if (el.closest('[hidden],[inert],[aria-hidden="true"]')) return false;
    if (typeof el.checkVisibility === 'function') {
      try {
        if (!el.checkVisibility({ checkOpacity: true, checkVisibilityCSS: true })) return false;
      } catch {}
    }
    return true;
  };

  const selectorOf = (el) => {
    if (el.id) return `#${CSS.escape(el.id)}`;
    const testId = el.getAttribute('data-testid');
    if (testId) return `${el.tagName.toLowerCase()}[data-testid="${testId.replaceAll('"', '\\"')}"]`;
    const role = el.getAttribute('role');
    const classes = Array.from(el.classList).filter(Boolean).slice(0, 2);
    let selector = el.tagName.toLowerCase();
    if (role) selector += `[role="${role}"]`;
    if (classes.length) selector += `.${classes.map((value) => CSS.escape(value)).join('.')}`;
    const parent = el.parentElement;
    if (parent) {
      const peers = Array.from(parent.children).filter((child) => child.tagName === el.tagName);
      if (peers.length > 1) selector += `:nth-of-type(${peers.indexOf(el) + 1})`;
    }
    return selector;
  };

  const normalizedText = (value) => String(value || '').trim().replace(/\s+/g, ' ');
  const renderedText = (container) => {
    if (!container) return '';
    const parts = [];
    const walker = document.createTreeWalker(container, NodeFilter.SHOW_TEXT);
    let node = walker.nextNode();
    while (node) {
      if (node.parentElement && visible(node.parentElement) && normalizedText(node.textContent)) {
        parts.push(node.textContent);
      }
      node = walker.nextNode();
    }
    return normalizedText(parts.join(' '));
  };
  const accessibleName = (el) => {
    const labelledBy = el.getAttribute('aria-labelledby');
    if (labelledBy) {
      const text = labelledBy.split(/\s+/).map((id) => document.getElementById(id)?.textContent || '').join(' ');
      if (normalizedText(text)) return normalizedText(text);
    }
    const labelText = Array.from(el.labels || []).map((label) => label.textContent || '').join(' ');
    if (normalizedText(labelText)) return normalizedText(labelText);
    return normalizedText(
      el.getAttribute('aria-label') ||
      el.getAttribute('alt') ||
      el.getAttribute('title') ||
      el.getAttribute('placeholder') ||
      el.textContent ||
      el.getAttribute('name') || '',
    );
  };

  const all = [root, ...root.querySelectorAll('*')].filter(visible);
  const interactives = all.filter((el) => {
    try { return el.matches(interactiveSelector); } catch { return false; }
  });
  const media = all.filter((el) => {
    try { return el.matches(mediaSelector); } catch { return false; }
  });
  const headings = all.filter((el) => /^H[1-6]$/.test(el.tagName) || el.getAttribute('role') === 'heading');
  const statuses = all.filter((el) => ['status', 'alert'].includes(el.getAttribute('role')) || el.hasAttribute('aria-live'));
  const directText = all.filter((el) => Array.from(el.childNodes).some((node) => node.nodeType === Node.TEXT_NODE && normalizedText(node.textContent)));
  const semanticUnits = new Set([...interactives, ...media, ...headings, ...statuses, ...directText]);

  const isEnabled = (el) => !el.matches(':disabled') && el.getAttribute('aria-disabled') !== 'true' && !el.closest('[inert]');
  const aboveFold = (el) => {
    const rect = el.getBoundingClientRect();
    return rect.bottom > 0 && rect.top < innerHeight && rect.right > 0 && rect.left < innerWidth;
  };

  const actionGroups = new Map();
  const unlabeledControls = [];
  for (const el of interactives) {
    const name = accessibleName(el);
    if (!name) {
      unlabeledControls.push({ selector: selectorOf(el), tag: el.tagName.toLowerCase() });
      continue;
    }
    const key = name.toLowerCase();
    const item = {
      selector: selectorOf(el),
      kind: el.getAttribute('role') || el.tagName.toLowerCase(),
      hrefPath: (() => {
        const href = el.getAttribute('href');
        if (!href) return undefined;
        try { return new URL(href, location.href).pathname; } catch { return undefined; }
      })(),
      type: el.getAttribute('type') || undefined,
    };
    if (!actionGroups.has(key)) actionGroups.set(key, { name, items: [] });
    actionGroups.get(key).items.push(item);
  }

  const duplicateActions = Array.from(actionGroups.values())
    .filter((group) => group.items.length > 1)
    .map((group) => {
      const signatures = new Set(group.items.map((item) => `${item.kind}|${item.hrefPath || ''}|${item.type || ''}`));
      return {
        label: group.name,
        count: group.items.length,
        confidence: signatures.size === 1 ? 'medium' : 'low',
        items: group.items.slice(0, 8),
        note: 'Repeated names may be legitimate in rows/lists; trace outcomes before MERGE/REMOVE.',
      };
    })
    .sort((a, b) => b.count - a.count)
    .slice(0, 20);

  const leafTextGroups = new Map();
  for (const el of directText) {
    const text = normalizedText(Array.from(el.childNodes)
      .filter((node) => node.nodeType === Node.TEXT_NODE)
      .map((node) => node.textContent).join(' '));
    if (text.length < 12) continue;
    const key = text.toLowerCase();
    if (!leafTextGroups.has(key)) leafTextGroups.set(key, { text, selectors: [] });
    leafTextGroups.get(key).selectors.push(selectorOf(el));
  }
  const duplicateTextBlocks = Array.from(leafTextGroups.values())
    .filter((group) => group.selectors.length > 1)
    .map((group) => ({ text: group.text, count: group.selectors.length, selectors: group.selectors.slice(0, 8), confidence: 'low' }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 20);

  const descendantControls = (el) => interactives.filter((control) => el === control || el.contains(control));
  const descendantMedia = (el) => media.filter((item) => el === item || el.contains(item));
  const containerSelector = 'nav,form,header,footer,section,aside,article,[role="toolbar"],[role="region"],[role="group"],div';
  const clusterCandidates = all.filter((el) => {
    try { return el.matches(containerSelector) && !el.closest('details:not([open])'); } catch { return false; }
  }).map((el) => ({ el, controls: descendantControls(el) }))
    .filter(({ controls }) => controls.length >= (options.controlClusterMin || 6));

  const controlClusters = [];
  const seenControlSets = new Set();
  for (const candidate of clusterCandidates.sort((a, b) => a.el.getBoundingClientRect().width * a.el.getBoundingClientRect().height - b.el.getBoundingClientRect().width * b.el.getBoundingClientRect().height)) {
    const signature = candidate.controls.map(selectorOf).sort().join('|');
    if (seenControlSets.has(signature)) continue;
    seenControlSets.add(signature);
    const rect = candidate.el.getBoundingClientRect();
    controlClusters.push({ selector: selectorOf(candidate.el), controls: candidate.controls.length, areaViewportFraction: Math.round((rect.width * rect.height / (innerWidth * innerHeight)) * 1000) / 1000, confidence: 'low' });
    if (controlClusters.length >= 12) break;
  }

  const horizontalControlScrollers = [];
  for (const el of all) {
    const style = getComputedStyle(el);
    if (!['auto', 'scroll'].includes(style.overflowX) || el.scrollWidth <= el.clientWidth + 2) continue;
    const controls = descendantControls(el);
    if (controls.length < 3) continue;
    horizontalControlScrollers.push({ selector: selectorOf(el), controls: controls.length, clientWidth: el.clientWidth, scrollWidth: el.scrollWidth });
  }

  const hasScrollableAncestor = (el) => {
    let parent = el.parentElement;
    while (parent && parent !== root.parentElement) {
      const style = getComputedStyle(parent);
      if (['auto', 'scroll'].includes(style.overflowX) && parent.scrollWidth > parent.clientWidth + 2) return true;
      if (parent === root) break;
      parent = parent.parentElement;
    }
    return false;
  };

  const clippedControls = interactives.filter((el) => {
    const rect = el.getBoundingClientRect();
    return (rect.left < -1 || rect.right > innerWidth + 1) && !hasScrollableAncestor(el);
  }).map((el) => {
    const rect = el.getBoundingClientRect();
    return { selector: selectorOf(el), left: Math.round(rect.left), right: Math.round(rect.right), viewportWidth: innerWidth };
  });

  const regionCandidates = all.filter((el) => {
    try { return el.matches('section,aside,article,[role="region"],main,div'); } catch { return false; }
  });
  const passive = [];
  const empty = [];
  for (const el of regionCandidates) {
    const rect = el.getBoundingClientRect();
    const fraction = rect.width * rect.height / (innerWidth * innerHeight);
    if (fraction < (options.largeRegionFraction || 0.18)) continue;
    const controls = descendantControls(el).length;
    const mediaCount = descendantMedia(el).length;
    const textLength = normalizedText(el.textContent).length;
    const item = {
      selector: selectorOf(el),
      areaViewportFraction: Math.round(fraction * 1000) / 1000,
      height: Math.round(rect.height),
      textLength,
      controls,
      media: mediaCount,
      confidence: 'low',
    };
    if (controls === 0 && mediaCount === 0 && textLength === 0) empty.push(item);
    else if (controls === 0 && mediaCount === 0) passive.push(item);
  }
  const dedupeRegions = (items) => {
    const selected = [];
    for (const item of items.sort((a, b) => b.areaViewportFraction - a.areaViewportFraction)) {
      if (selected.some((other) => other.selector === item.selector)) continue;
      selected.push(item);
      if (selected.length >= 12) break;
    }
    return selected;
  };

  const fixedSticky = all.map((el) => ({ el, position: getComputedStyle(el).position }))
    .filter(({ position }) => position === 'fixed' || position === 'sticky')
    .map(({ el, position }) => {
      const rect = el.getBoundingClientRect();
      return { selector: selectorOf(el), position, areaViewportFraction: Math.round((rect.width * rect.height / (innerWidth * innerHeight)) * 1000) / 1000 };
    })
    .filter((item) => item.areaViewportFraction > 0.01)
    .sort((a, b) => b.areaViewportFraction - a.areaViewportFraction)
    .slice(0, 16);

  const disclosures = all.filter((el) => el.tagName === 'DETAILS');
  const protectedInventory = (options.protected || []).map((entry) => {
    let matches = [];
    const scope = entry.scope === 'document' ? document : root;
    try {
      matches = [
        ...(scope instanceof Element && scope.matches(entry.selector) ? [scope] : []),
        ...scope.querySelectorAll(entry.selector),
      ].filter(visible);
    } catch {}
    const assertText = (entry.assertText || []).map((assertion, index) => {
      const expected = typeof assertion === 'string' ? assertion : assertion.text ?? assertion.expected ?? '';
      const name = typeof assertion === 'string' ? `assert-${index + 1}` : assertion.name || `assert-${index + 1}`;
      return { name, present: matches.some((el) => renderedText(el).includes(expected)) };
    });
    const minCount = Number.isFinite(entry.minCount) ? entry.minCount : 1;
    return { name: entry.name, selector: entry.selector, scope: entry.scope === 'document' ? 'document' : 'root', minCount, count: matches.length, ok: matches.length >= minCount && assertText.every((item) => item.present), assertText };
  });

  const bodyText = renderedText(root);
  const mojibakeCount = (bodyText.match(/Â·|â|Ã[-¿]/g) || []).length;
  const asserts = (options.assertText || []).map((assertion) => {
    const scope = assertion.scope === 'document' ? document.body : root;
    return { name: assertion.name, scope: assertion.scope, present: renderedText(scope).includes(assertion.expected) };
  });
  const doc = document.documentElement;
  const largePassiveRegions = dedupeRegions(passive);
  const emptyRegions = dedupeRegions(empty);
  const candidates = [
    ...duplicateActions.map((item) => ({ kind: 'duplicate-action', confidence: item.confidence, count: item.count, label: item.label })),
    ...duplicateTextBlocks.map((item) => ({ kind: 'duplicate-text', confidence: item.confidence, count: item.count, text: item.text })),
    ...controlClusters.map((item) => ({ kind: 'exposed-control-cluster', confidence: item.confidence, selector: item.selector, controls: item.controls })),
    ...largePassiveRegions.map((item) => ({ kind: 'large-passive-region', confidence: item.confidence, selector: item.selector, areaViewportFraction: item.areaViewportFraction })),
    ...emptyRegions.map((item) => ({ kind: 'large-empty-region', confidence: item.confidence, selector: item.selector, areaViewportFraction: item.areaViewportFraction })),
    ...horizontalControlScrollers.map((item) => ({ kind: 'horizontal-control-scroller', confidence: 'medium', selector: item.selector, controls: item.controls })),
    ...clippedControls.map((item) => ({ kind: 'clipped-control', confidence: 'medium', selector: item.selector })),
    ...unlabeledControls.map((item) => ({ kind: 'unlabeled-control', confidence: 'medium', selector: item.selector })),
  ];

  return {
    rootFound: true,
    geometry: {
      documentWidth: doc.scrollWidth,
      documentHeight: doc.scrollHeight,
      viewportWidth: innerWidth,
      viewportHeight: innerHeight,
      scrollScreens: Math.round((doc.scrollHeight / innerHeight) * 100) / 100,
      hOverflow: doc.scrollWidth > innerWidth + 1,
    },
    counts: {
      renderedElements: all.length,
      semanticUnits: semanticUnits.size,
      interactive: interactives.length,
      interactiveAboveFold: interactives.filter(aboveFold).length,
      enabled: interactives.filter(isEnabled).length,
      disabled: interactives.filter((el) => !isEnabled(el)).length,
      headings: headings.length,
      media: media.length,
      statuses: statuses.length,
      closedDisclosures: disclosures.filter((el) => !el.open).length,
      openDisclosures: disclosures.filter((el) => el.open).length,
    },
    densities: {
      semanticAboveFold: Array.from(semanticUnits).filter(aboveFold).length,
      controlsAboveFold: interactives.filter(aboveFold).length,
    },
    repetition: { duplicateActions, duplicateTextBlocks },
    exposure: { controlClusters },
    footprint: { largePassiveRegions, emptyRegions, fixedSticky },
    reachability: { horizontalControlScrollers, clippedControls, unlabeledControls },
    protectedInventory,
    asserts,
    mojibakeCount,
    candidates,
    limitations: [
      'Static rendered-DOM inventory; usefulness and handler liveness are not inferred.',
      'Repeated names/text may be legitimate in lists, tables, or responsive duplicate navigation.',
      'Large passive/empty region detection is low-confidence and requires pixel inspection.',
      'Setup clicks are explicit; audited controls are never auto-clicked.',
      'Lower counts are descriptive and cannot prove a better interface.',
    ],
  };
}

function compareReports(baseline, current) {
  const baselineStates = baseline.states || [];
  const baselineByName = new Map(baselineStates.map((state) => [state.name, state]));
  const comparisons = [];
  const contractIssues = [];
  if (baseline.schemaVersion !== current.schemaVersion) contractIssues.push('schema-version-mismatch');
  if (baselineByName.size !== baselineStates.length) contractIssues.push('duplicate-baseline-state-name');
  let unsafe = contractIssues.length > 0;
  for (const state of current.states) {
    const before = baselineByName.get(state.name);
    if (!before) {
      unsafe = true;
      comparisons.push({ name: state.name, verdict: 'NO_BASELINE' });
      continue;
    }
    const countKeys = ['renderedElements', 'semanticUnits', 'interactive', 'interactiveAboveFold', 'enabled', 'disabled', 'headings', 'closedDisclosures'];
    const deltas = Object.fromEntries(countKeys.map((key) => {
      const previous = before.counts?.[key] ?? 0;
      const next = state.counts?.[key] ?? 0;
      return [key, { before: previous, after: next, absolute: next - previous, percent: previous ? Math.round(((next - previous) / previous) * 1000) / 10 : null }];
    }));
    const currentProtected = new Map((state.protectedInventory || []).map((item) => [item.name, item]));
    const protectedLosses = Array.from(new Set([
      ...(before.protectedInventory || [])
        .filter((item) => !item.ok || !currentProtected.get(item.name)?.ok)
        .map((item) => `${item.ok ? 'lost' : 'invalid-baseline'}:${item.name}`),
      ...(state.protectedInventory || []).filter((item) => !item.ok).map((item) => item.name),
    ]));
    const currentAsserts = new Map((state.readiness?.asserts || []).map((item) => [item.name, item]));
    const assertFailures = Array.from(new Set([
      ...(before.readiness?.asserts || [])
        .filter((item) => !item.present || !currentAsserts.get(item.name)?.present)
        .map((item) => `${item.present ? 'lost' : 'invalid-baseline'}:${item.name}`),
      ...(state.readiness?.asserts || []).filter((item) => !item.present).map((item) => item.name),
    ]));
    const identityMismatch = before.auditIdentity?.fingerprint !== state.auditIdentity?.fingerprint
      ? ['audit-identity-mismatch']
      : [];
    const reachabilityRegressions = [];
    if ((before.readiness?.setupClicks || []).some((item) => !item.ok)) reachabilityRegressions.push('invalid-baseline-setup-click');
    if ((state.readiness?.setupClicks || []).some((item) => !item.ok)) reachabilityRegressions.push('setup-click-failed');
    if ((state.readiness?.consoleErrorCount || 0) > (before.readiness?.consoleErrorCount || 0)) reachabilityRegressions.push('more-console-errors');
    if ((state.readiness?.mojibakeCount || 0) > (before.readiness?.mojibakeCount || 0)) reachabilityRegressions.push('more-mojibake');
    if (String(state.readiness?.charset || '').toUpperCase() !== 'UTF-8') reachabilityRegressions.push('non-utf8-charset');
    if (String(before.readiness?.charset || '').toUpperCase() !== String(state.readiness?.charset || '').toUpperCase()) reachabilityRegressions.push('charset-changed');
    if (!before.geometry?.hOverflow && state.geometry?.hOverflow) reachabilityRegressions.push('new-horizontal-overflow');
    if ((state.reachability?.clippedControls?.length || 0) > (before.reachability?.clippedControls?.length || 0)) reachabilityRegressions.push('more-clipped-controls');
    if ((state.reachability?.unlabeledControls?.length || 0) > (before.reachability?.unlabeledControls?.length || 0)) reachabilityRegressions.push('more-unlabeled-controls');
    const verdict = protectedLosses.length || assertFailures.length || identityMismatch.length || reachabilityRegressions.length ? 'UNSAFE_REDUCTION' : 'REVIEWABLE';
    if (verdict === 'UNSAFE_REDUCTION') unsafe = true;
    comparisons.push({ name: state.name, verdict, deltas, protectedLosses, assertFailures, identityMismatch, reachabilityRegressions });
  }
  const currentNames = new Set((current.states || []).map((state) => state.name));
  for (const before of baseline.states || []) {
    if (currentNames.has(before.name)) continue;
    unsafe = true;
    comparisons.push({ name: before.name, verdict: 'MISSING_CURRENT_STATE' });
  }
  return { verdict: unsafe ? 'UNSAFE_REDUCTION' : 'REVIEWABLE', contractIssues, states: comparisons };
}

async function auditState(chromium, cfg, state) {
  const viewport = state.viewport || cfg.viewport || { width: 1512, height: 900 };
  const scheme = state.scheme ?? cfg.scheme ?? 'light';
  const reducedMotion = state.reducedMotion ?? cfg.reducedMotion ?? false;
  const rootSelector = state.rootSelector || cfg.rootSelector || 'body';
  const readySelector = state.readySelector || cfg.readySelector;
  const contextKey = state.contextKey ?? cfg.contextKey ?? null;
  const ignoreSelectors = [...(cfg.ignoreSelectors || []), ...(state.ignoreSelectors || [])];
  const protectedEntries = [...(cfg.protected || []), ...(state.protected || [])].map((entry) => ({
    ...entry,
    minCount: entry.minCount ?? 1,
    assertText: normalizeAssertions(entry.assertText || []),
  }));
  const assertions = normalizeAssertions([...(cfg.assertText || []), ...(state.assertText || [])]);
  const clicks = normalizeClicks([...(cfg.clicks || []), ...(state.clicks || [])]);
  if (contextKey !== null && (typeof contextKey !== 'string' || !contextKey.trim())) throw new Error('contextKey must be a non-empty string');
  validateNamedEntries(protectedEntries, 'protected');
  validateNamedEntries(assertions, 'assertion');
  validateNamedEntries(clicks, 'setup click');
  if (protectedEntries.some((entry) => !entry.selector || typeof entry.selector !== 'string')) throw new Error('protected entries need a selector');
  if (protectedEntries.some((entry) => !Number.isInteger(entry.minCount) || entry.minCount < 1)) throw new Error('protected minCount must be a positive integer');
  for (const entry of protectedEntries) {
    validateNamedEntries(entry.assertText, `protected ${entry.name} assertion`);
    if (entry.assertText.some((assertion) => !assertion.expected || typeof assertion.expected !== 'string')) {
      throw new Error(`protected ${entry.name} assertText entries need non-empty text`);
    }
  }
  if (assertions.some((entry) => !entry.expected || typeof entry.expected !== 'string')) throw new Error('assertText entries need text');
  if (clicks.some((entry) => !entry.selector || typeof entry.selector !== 'string')) throw new Error('setup click entries need a selector');
  if (ignoreSelectors.some((selector) => !selector || typeof selector !== 'string')) throw new Error('ignoreSelectors entries need a selector');
  const storageStatePath = cfg.storageState ? resolveConfigPath(cfg, cfg.storageState) : null;
  const storageStateHash = storageStatePath ? `sha256-${hashValue(fs.readFileSync(storageStatePath))}` : null;
  const contextOptions = {
    viewport,
    colorScheme: scheme === 'dark' ? 'dark' : 'light',
    reducedMotion: reducedMotion ? 'reduce' : 'no-preference',
    deviceScaleFactor: 1,
  };
  if (storageStatePath) contextOptions.storageState = storageStatePath;
  const browser = await chromium.launch();
  const context = await browser.newContext(contextOptions);
  const page = await context.newPage();
  let consoleErrorCount = 0;
  const setupClicks = [];
  page.on('console', (message) => { if (message.type() === 'error') consoleErrorCount += 1; });
  page.on('pageerror', () => { consoleErrorCount += 1; });
  const targetUrl = state.url || cfg.url;
  try {
    const navigation = await page.goto(targetUrl, { waitUntil: state.waitUntil || cfg.waitUntil || 'networkidle', timeout: state.timeoutMs || cfg.timeoutMs || 45000 });
    const responseStatus = navigation?.status();
    if (!Number.isFinite(responseStatus)) throw new Error('navigation returned no HTTP response');
    if (responseStatus >= 400) throw new Error(`navigation returned HTTP ${responseStatus}`);
    const redirectedUrl = page.url();
    const allowRedirects = state.allowRedirects ?? cfg.allowRedirects ?? false;
    if (!allowRedirects && routeKey(redirectedUrl) !== routeKey(targetUrl)) {
      throw new Error('navigation redirected away from the configured origin/path; set allowRedirects only for an expected redirect');
    }
    if (readySelector) await page.waitForSelector(readySelector, { state: 'visible', timeout: state.readyTimeoutMs || cfg.readyTimeoutMs || 15000 });
    await page.waitForTimeout(state.waitMs ?? cfg.waitMs ?? 800);
    for (const click of clicks) {
      try {
        await page.click(click.selector, { timeout: state.clickTimeoutMs || cfg.clickTimeoutMs || 4000 });
        await page.waitForTimeout(state.clickWaitMs ?? cfg.clickWaitMs ?? 500);
        setupClicks.push({ name: click.name, ok: true });
      } catch {
        // A missing setup click is readiness evidence, not permission to click alternatives.
        setupClicks.push({ name: click.name, ok: false });
      }
    }
    await page.waitForTimeout(state.settleMs ?? cfg.settleMs ?? 400);
    const probe = await page.evaluate(pageProbe, {
      rootSelector,
      ignoreSelectors,
      protected: protectedEntries,
      assertText: assertions,
      controlClusterMin: cfg.controlClusterMin || 6,
      largeRegionFraction: cfg.largeRegionFraction || 0.18,
    });
    if (!probe.rootFound) throw new Error(`root selector not found (sha256-${hashValue(rootSelector)})`);
    const finalUrl = page.url();
    const identityPayload = {
      requestedRoute: navigationIdentityKey(targetUrl),
      finalRoute: navigationIdentityKey(finalUrl),
      responseStatus,
      viewport,
      scheme,
      reducedMotion,
      contextKey,
      rootSelector,
      readySelector: readySelector || null,
      ignoreSelectors,
      allowRedirects,
      waitUntil: state.waitUntil || cfg.waitUntil || 'networkidle',
      waitMs: state.waitMs ?? cfg.waitMs ?? 800,
      clickWaitMs: state.clickWaitMs ?? cfg.clickWaitMs ?? 500,
      settleMs: state.settleMs ?? cfg.settleMs ?? 400,
      controlClusterMin: cfg.controlClusterMin || 6,
      largeRegionFraction: cfg.largeRegionFraction || 0.18,
      setupSelectors: clicks.map((click) => click.selector),
      protectedContract: protectedEntries.map((entry) => ({
        name: entry.name,
        selector: entry.selector,
        scope: entry.scope === 'document' ? 'document' : 'root',
        minCount: Number.isFinite(entry.minCount) ? entry.minCount : 1,
        assertText: entry.assertText || [],
      })),
      assertionContract: assertions,
      storageStateHash,
    };
    const auditIdentity = {
      fingerprint: `sha256-${hashValue(JSON.stringify(identityPayload))}`,
      requestedUrl: safeUrl(targetUrl, cfg.includeRawPaths),
      finalUrl: safeUrl(finalUrl, cfg.includeRawPaths),
      responseStatus,
      rootSelectorHash: `sha256-${hashValue(rootSelector)}`,
      readySelectorHash: readySelector ? `sha256-${hashValue(readySelector)}` : null,
      setupContract: clicks.map((click) => click.name),
      viewport,
      scheme,
      reducedMotion,
      contextKeyHash: contextKey ? `sha256-${hashValue(contextKey)}` : null,
      storageStateHash,
    };
    const reportProbe = sanitizeProbe(probe, cfg);
    return {
      name: state.name || `${scheme}-${viewport.width}x${viewport.height}`,
      url: safeUrl(targetUrl, cfg.includeRawPaths),
      viewport,
      scheme,
      reducedMotion,
      auditIdentity,
      readiness: {
        rootFound: true,
        charset: await page.evaluate(() => document.characterSet),
        consoleErrorCount,
        mojibakeCount: reportProbe.mojibakeCount,
        setupClicks,
        asserts: reportProbe.asserts,
      },
      geometry: reportProbe.geometry,
      counts: reportProbe.counts,
      densities: reportProbe.densities,
      repetition: reportProbe.repetition,
      exposure: reportProbe.exposure,
      footprint: reportProbe.footprint,
      reachability: reportProbe.reachability,
      protectedInventory: reportProbe.protectedInventory,
      candidates: reportProbe.candidates,
      limitations: reportProbe.limitations,
    };
  } finally {
    await context.close();
    await browser.close();
  }
}

async function main() {
  const cfg = readConfig(process.argv[2]);
  if (!cfg.url || typeof cfg.url !== 'string') {
    console.error('FATAL: config needs "url".');
    process.exit(1);
  }
  try {
    const parsed = new URL(cfg.url);
    if (!['http:', 'https:'].includes(parsed.protocol)) throw new Error('unsupported protocol');
  } catch {
    console.error('FATAL: config "url" must be an absolute HTTP(S) URL.');
    process.exit(1);
  }
  for (const key of ['states', 'protected', 'assertText', 'clicks', 'ignoreSelectors']) {
    if (cfg[key] !== undefined && !Array.isArray(cfg[key])) {
      console.error(`FATAL: config "${key}" must be an array.`);
      process.exit(1);
    }
  }
  const states = cfg.states?.length ? cfg.states : [{ name: 'default', viewport: cfg.viewport, scheme: cfg.scheme, clicks: [] }];
  for (const state of states) {
    for (const key of ['protected', 'assertText', 'clicks', 'ignoreSelectors']) {
      if (state[key] !== undefined && !Array.isArray(state[key])) {
        console.error(`FATAL: state "${state.name || 'unnamed'}" ${key} must be an array.`);
        process.exit(1);
      }
    }
  }
  const stateNames = states.map((state) => state.name || `${state.scheme ?? cfg.scheme ?? 'light'}-${(state.viewport || cfg.viewport || { width: 1512, height: 900 }).width}x${(state.viewport || cfg.viewport || { width: 1512, height: 900 }).height}`);
  if (new Set(stateNames).size !== stateNames.length) {
    console.error('FATAL: audit state names must be unique.');
    process.exit(1);
  }
  if (cfg.baselineReport && states.some((state) => !(state.readySelector || cfg.readySelector))) {
    console.error('FATAL: baseline comparisons require readySelector for every state.');
    process.exit(1);
  }
  if (cfg.baselineReport && states.some((state) => !String(state.contextKey ?? cfg.contextKey ?? '').trim())) {
    console.error('FATAL: baseline comparisons require a stable contextKey for every state (for example "anonymous" or "qa-editor").');
    process.exit(1);
  }
  if (cfg.baselineReport && states.some((state) => [...(cfg.protected || []), ...(state.protected || [])].length === 0)) {
    console.error('FATAL: baseline comparisons require at least one protected contract entry for every state.');
    process.exit(1);
  }
  if (cfg.includeRawSelectors || cfg.includeRawPaths || cfg.textMode === 'sample') {
    console.warn('WARNING: raw evidence opt-in is enabled; redact the report before sharing or committing it.');
  }
  const { chromium } = await resolvePlaywright(resolveConfigPath(cfg, cfg.repo));
  const report = {
    schemaVersion: 2,
    generatedAt: new Date().toISOString(),
    privacy: {
      rawSelectors: Boolean(cfg.includeRawSelectors),
      rawPaths: Boolean(cfg.includeRawPaths),
      sampledText: cfg.textMode === 'sample',
    },
    states: [],
  };

  for (const state of states) {
    try {
      report.states.push(await auditState(chromium, cfg, state));
    } catch (error) {
      console.error(`FATAL ${state.name || 'state'}: ${safeErrorMessage(error)}`);
      process.exit(1);
    }
  }

  let baselinePath = null;
  if (cfg.baselineReport) {
    baselinePath = resolveConfigPath(cfg, cfg.baselineReport);
    const baseline = JSON.parse(fs.readFileSync(baselinePath, 'utf8'));
    report.comparison = compareReports(baseline, report);
  }

  const outputDir = resolveConfigPath(cfg, cfg.outDir);
  if (outputDir) {
    fs.mkdirSync(outputDir, { recursive: true });
    const outputFile = path.join(outputDir, cfg.outputFile || 'clutter-audit.json');
    const canonical = (value) => {
      const resolved = path.resolve(value);
      return process.platform === 'win32' ? resolved.toLowerCase() : resolved;
    };
    if (baselinePath && canonical(outputFile) === canonical(baselinePath)) {
      throw new Error('candidate outputFile must not overwrite baselineReport');
    }
    fs.writeFileSync(outputFile, JSON.stringify(report, null, 2));
    console.log(`WROTE ${outputFile}`);
  }

  console.log('\n=== DECLUTTER AUDIT (advisory; candidates require ledger + runtime proof) ===');
  for (const state of report.states) {
    const protectedOk = state.protectedInventory.filter((item) => item.ok).length;
    console.log(`${state.name} ${state.viewport.width}x${state.viewport.height} ${state.scheme}`);
    console.log(`  rendered ${state.counts.renderedElements} | semantic ${state.counts.semanticUnits} | controls ${state.counts.interactive} (${state.counts.interactiveAboveFold} above fold)`);
    console.log(`  scroll ${state.geometry.scrollScreens} screens | hOverflow ${state.geometry.hOverflow} | clipped ${state.reachability.clippedControls.length} | unlabeled ${state.reachability.unlabeledControls.length}`);
    console.log(`  duplicate actions ${state.repetition.duplicateActions.length} | duplicate text ${state.repetition.duplicateTextBlocks.length} | clusters ${state.exposure.controlClusters.length} | passive regions ${state.footprint.largePassiveRegions.length} | candidates ${state.candidates.length}`);
    console.log(`  protected ${protectedOk}/${state.protectedInventory.length} | console errors ${state.readiness.consoleErrorCount} | mojibake ${state.readiness.mojibakeCount} | charset ${state.readiness.charset}`);
  }
  if (report.comparison) console.log(`COMPARISON ${report.comparison.verdict}`);
  console.log('(No composite score. Lower counts do not prove a better UI.)\n');

  const protectedFailure = report.states.some((state) => state.protectedInventory.some((item) => !item.ok) || state.readiness.asserts.some((item) => !item.present));
  const encodingFailure = report.states.some((state) => String(state.readiness.charset || '').toUpperCase() !== 'UTF-8' || state.readiness.mojibakeCount > 0);
  const comparisonFailure = report.comparison?.verdict === 'UNSAFE_REDUCTION';
  if (encodingFailure || comparisonFailure || (cfg.enforceProtected && protectedFailure)) process.exit(2);
}

main().catch((error) => {
  console.error(`FATAL: ${safeErrorMessage(error)}`);
  process.exit(1);
});
