# TRACE-WATERFALL.md — scalable execution traces for agentic applications

This is the visual and behavioral contract for agent traces that must remain useful from one model call to a durable run containing hundreds or thousands of spans, tool calls, retrievals, approvals, retries, and repairs. It extends B2, B5, B6, B8, B9, and D1–D4.

## Applicability and adaptive shape

Do not force every run into one oversized visualization.

| Run size | Default presentation |
|---|---|
| 0 records | An honest empty state. Never draw synthetic activity. |
| 1–12 records | Compact chronological summary with durations and terminal proof. |
| 13–100 records | Hierarchical waterfall is the default trace view. |
| 101+ records | Virtualized waterfall with minimap, filters, cursor pagination, and collapsed subtrees. |

The thresholds are guidance, not a license to hide complexity. A deeply nested eight-span run can merit a waterfall; a flat 20-message conversation can remain a compact ledger.

## Required anatomy

1. **Sticky run header** — run status, instruction or trigger, provider/model, start time, wall duration, active compute duration, human-wait duration, record count, cost, tokens, and trace/run ID.
2. **Aggregate minimap** — a low-detail overview of the full observed run, including errors and open work. It remains useful when the visible row window is virtualized.
3. **Hierarchical split view** — expandable service/agent/span tree on the left and a shared-time-axis waterfall on the right. Parent-child depth and parallelism must be legible without opening every row.
4. **Event markers** — approvals, checkpoints, retries, exceptions, citations, and validation receipts are points or diamonds, not fake duration bars.
5. **Selected-span inspector** — exact timestamps, duration, status, provider/model/tool, token and cost accounting, attributes, events, links, source evidence, receipt/digest, and raw payload access when authorized.

## Citation and evidence binding

- Bind evidence to the exact retrieval or reasoning span with stable source IDs. A source list attached only to the whole run must be labeled **run-level evidence; not span-bound**.
- Web/PDF evidence shows title, canonical URL, retrieved-at timestamp, excerpt or page range, content digest, and the claims or output elements it supports.
- Spreadsheet/database evidence shows dataset/file identity, sheet/table, range or query, row/column bounds, and digest/version.
- Slide/document evidence shows source artifact, page/slide/element IDs, and the generated or edited element IDs it supports.
- Tool evidence shows tool name, input/output digest, retry number, and error state. Never render secrets or unrestricted raw tool payloads.
- Private sources and raw payloads require the same authorization boundary as the underlying data. A public share view must not inherit owner-only trace evidence.

## Truthful time semantics

- Use server-recorded timestamps. Never invent evenly spaced bars or client-timer progress.
- An open span extends only to the latest observed server checkpoint and uses a distinct unfinished treatment such as hatching. It must not imply completion.
- If duration is unknown, render a sequence tick or event marker and label the duration unknown.
- Preserve real parallelism. Retries are separate attempts linked to the original span, not overwritten history.
- Distinguish wall time, active compute time, and human-wait time. Long approvals must not look like slow model inference.
- State whether the displayed time range is complete or a paginated/filtered subset.

## Scale contract

The trace remains operable at 1,000+ records.

- Virtualize rows and cap overscan; do not mount every hidden span.
- Fetch older/newer records with a server cursor and deduplicate by stable record ID.
- Keep the minimap aggregated so it does not scale one DOM node per span.
- Collapse subtrees by default at high volume and expose expand-all only with a clear performance warning.
- Search and filters operate over loaded data; when results may be partial, say so.
- Preserve selected span, scroll position, filters, and expansion state across polling, pagination, and compact/expanded view changes.
- A graph view can be optional for causal topology. It is not the default substitute for a time-based trace.

## Responsive and progressive disclosure

- A narrow inspector shows a compact run summary and selected-span preview.
- One deliberate action expands the trace into a main-workspace observability view. It must not permanently consume the editing canvas.
- Closing the expanded view restores the prior editor state and selection.
- The trace is read-only. Mutation approval belongs in the proposal/review surface, even when an approval event is visible in the trace.

### Compact sidebar contract

Do not squeeze the desktop waterfall into a 280–360px rail. In the unexpanded agent/chat sidebar:

- Show status, provider/model, cost/tokens, duration, record/error/source counts, and at most six readable activity rows.
- Keep the root span plus the newest work when more than six spans exist. State exactly how many earlier steps are hidden or still available through server pagination.
- Render tool, model, retrieval, validation, memory, and human-input steps as compact typed rows with honest streaming/error/completed states.
- Use one explicit **Full timeline** action to open the hierarchical waterfall. Preserve the selected run, filters, and editor state.
- Keep generated artifacts in a neighboring preview/workspace rather than embedding them inside trace rows. Trace rows link to the artifact/tool result and its evidence.
- Memory retrieval/storage is visible and manageable as agent activity, with privacy controls; it is not silently injected context.
- Human tool UI (forms, date selection, approvals) reports its pending/result state and sends the user result back as a distinct event.

## Accessibility and agent operability

- Use `role="tree"` and `role="treeitem"`, accurate `aria-level`, `aria-expanded`, and explicit accessible names for collapse controls.
- Support keyboard row navigation, subtree expansion, filtering, and opening selected-span details.
- Do not encode status only with hue; include icons, text, or patterns. Respect reduced motion.
- Keep stable test IDs for the run header, waterfall, row, minimap, load-more control, and selected-span evidence.
- DOM order must remain chronological/hierarchical even when CSS positions timeline bars visually.

## OpenTelemetry-grade mapping

Prefer a lossless mapping to trace ID, span ID, parent span ID, operation name, span kind, status, start/end timestamps, attributes, events, links, resource/service identity, and instrumentation scope. For model spans, retain provider, model, input/output tokens, cost, tool call IDs, finish reason, and reasoning controls using the OpenTelemetry Generative AI semantic conventions where available.

Product language can be friendlier than telemetry vocabulary, but the underlying values must remain inspectable and exportable.

## QA matrix

Every scalable trace revamp must exercise and artifact these cases:

1. Honest zero-record state.
2. One-span success and one-span failure.
3. Exact 4-span, 10-span, and 100-span fixtures in compact and expanded modes; verify row caps, hidden-count honesty, no oversized empty canvas, and no clipped final axis label.
4. Nested model → tool → retrieval → validation chain.
5. Parallel tools with overlapping spans.
6. Open durable run that survives reload and resumes from server events.
7. Retry, timeout, and deterministic/degraded fallback.
8. Human approval wait separated from active compute.
9. Exact web citation and exact uploaded-file/data-range citation.
10. Legacy run-level evidence clearly labeled as not span-bound.
11. 250-span and 1,000-span fixtures: virtualization, subtree collapse, search, minimap, and cursor pagination.
12. Compact inspector and expanded workspace at narrow/wide viewports, light/dark themes, keyboard-only use, and reduced motion.

Record DOM node count and interaction latency for the 1,000-span fixture. A screenshot alone cannot prove scalability.

## P0 failures

- Synthetic or fabricated timing, attribution, source binding, cost, tokens, digest, or success state.
- A filtered or paginated subset presented as the complete trace.
- Owner-only evidence leaked into a public or collaborator view.
- The UI freezes, mounts all rows, loses selection, or cannot reach the terminal receipt on a long run.
- A compact trace consumes the editing workspace without an intentional expand action.
- Citations exist in storage but cannot be traced from the exact span to the supported claim/output.

## Reference vocabulary

Use Tinybird and Grafana Tempo as visual references for hierarchical span waterfalls, OpenTelemetry as the semantic contract, Langfuse as an LLM-observability reference, Agent Prism as the human-readable custody layer, and NodeRoom as the product reference for source-aware agent traces. Use assistant-ui's Mem0, Artifacts, and Generative UI examples for inspectable memory, side-by-side artifact iteration, typed tool rows, streaming state, and human tool results. Use the assistant-ui + LangGraph + FastAPI example as an integration reference for preserving streamed backend events across the frontend boundary. Borrow mechanisms, not brand skins.
