const fs = require('node:fs');

function validateBackendUrl(value) {
  if (typeof value !== 'string' || !value.trim()) throw new Error('백엔드 API 주소를 입력하세요.');
  const url = new URL(value.trim());
  if (!['http:', 'https:'].includes(url.protocol) || url.username || url.password || url.search || url.hash) {
    throw new Error('백엔드 주소는 인증정보·쿼리·해시가 없는 HTTP(S) URL이어야 합니다.');
  }
  return url.href.replace(/\/+$/, '');
}

function readBackendOverride(configPath, environment = process.env) {
  if (environment.REAL_IRON_API_BASE_URL) return validateBackendUrl(environment.REAL_IRON_API_BASE_URL);
  if (!fs.existsSync(configPath)) return undefined;
  const config = JSON.parse(fs.readFileSync(configPath, 'utf8'));
  return validateBackendUrl(config.apiBaseUrl);
}

module.exports = { validateBackendUrl, readBackendOverride };
