const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const { validateBackendUrl, readBackendOverride } = require('./backend-config.cjs');

test('only absolute HTTP(S) API URLs without credentials are accepted', () => {
  assert.equal(validateBackendUrl(' https://api.example.com/api/v1/ '), 'https://api.example.com/api/v1');
  assert.equal(validateBackendUrl('http://127.0.0.1:8000/api/v1'), 'http://127.0.0.1:8000/api/v1');
  for (const value of ['', undefined, '/api/v1', 'file:///tmp/api', 'https://user:secret@api.example.com', 'https://api.example.com?key=secret', 'https://api.example.com/#key']) {
    assert.throws(() => validateBackendUrl(value));
  }
});

test('environment overrides runtime file; missing file retains build default', () => {
  const directory = fs.mkdtempSync(path.join(os.tmpdir(), 'ri-config-'));
  const file = path.join(directory, 'backend.json');
  try {
    assert.equal(readBackendOverride(file, {}), undefined);
    fs.writeFileSync(file, JSON.stringify({ apiBaseUrl: 'http://localhost:8001/api/v1/' }));
    assert.equal(readBackendOverride(file, {}), 'http://localhost:8001/api/v1');
    assert.equal(readBackendOverride(file, { REAL_IRON_API_BASE_URL: 'https://example.com/api/v1' }), 'https://example.com/api/v1');
    fs.writeFileSync(file, '{broken');
    assert.throws(() => readBackendOverride(file, {}));
    fs.writeFileSync(file, '{}');
    assert.throws(() => readBackendOverride(file, {}));
  } finally {
    fs.rmSync(directory, { recursive: true, force: true });
  }
});
