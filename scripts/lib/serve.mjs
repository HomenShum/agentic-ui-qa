/**
 * Serving the demo surface over HTTP, for the checks that cannot use file://.
 *
 * Lighthouse refuses a file:// URL outright, and the axe CLI's driver will not
 * navigate one either, so both audits need an origin. The surface is a single
 * self-contained document with no assets, so this is one file on one port and
 * deliberately not a static file server.
 *
 * Header note, learned the hard way: the first version sent
 * `cache-control: no-store` out of habit, and Lighthouse correctly failed the
 * page on `bf-cache` — "Page prevented back/forward cache restoration". That was
 * the harness, not the surface. A measurement rig must not author the defect it
 * then reports, so this sends only content-type.
 */
import fs from 'node:fs';
import http from 'node:http';

/**
 * @param {string} file  absolute path to the HTML document to serve at /
 * @param {number} port
 * @returns {Promise<{server: import('node:http').Server, url: string}>}
 */
export function serveFile(file, port) {
  const html = fs.readFileSync(file);
  const server = http.createServer((req, res) => {
    res.writeHead(200, { 'content-type': 'text/html; charset=utf-8' });
    res.end(html);
  });
  return new Promise((resolve, reject) => {
    server.once('error', reject);
    server.listen(port, '127.0.0.1', () => resolve({ server, url: `http://127.0.0.1:${port}/` }));
  });
}
