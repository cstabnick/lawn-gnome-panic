// Regression: /admin/profiler (no trailing slash) made nginx answer 301 Location: https://host:8080/admin/profiler/,
// the pod's internal port. The site config must redirect with a relative Location (absolute_redirect off).
import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

describe('deploy/nginx.conf', () => {
  const conf = readFileSync(new URL('../../../deploy/nginx.conf', import.meta.url), 'utf8');

  it('never builds an absolute redirect with the listen port', () => {
    expect(conf).toMatch(/^\s*listen\s+8080;/m);
    expect(conf).toMatch(/^\s*absolute_redirect\s+off;/m);
  });
});
