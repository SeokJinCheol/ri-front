const assert = require('node:assert/strict');
const axios = require('axios');

async function main() {
  const production = axios.create({ baseURL: 'http://true-iron.co.kr/ri-rag/api/v1/' });
  // Validate URL composition without sending any request to the domain.
  assert.equal(production.getUri({ url: '/health' }), 'http://true-iron.co.kr/ri-rag/api/v1/health');
  const local = axios.create({ baseURL: 'http://localhost/ri-rag/api/v1/', timeout: 5000, proxy: false });
  const response = await local.get('/health');
  assert.equal(response.status, 200);
  assert.deepEqual(response.data, { status: 'ok' });
  console.log('PASS: API 경로 결합; localhost Nginx → backend health 200 OK');
}
main().catch((error) => { console.error(error.message); process.exitCode = 1; });
