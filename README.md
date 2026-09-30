# Real Iron Frontend · Electron

React 화면을 웹 또는 설치형 Electron 앱으로 빌드합니다. Electron 설치 파일에는 화면과 Electron 런타임이 포함되며, FastAPI 백엔드·Python·Ollama·DB는 포함하지 않습니다. 설치 앱은 설정한 백엔드에 HTTP API로 연결합니다.

## 한국어·영어 전환

다크 모드 버튼 옆의 번역 아이콘으로 한국어와 영어를 전환합니다. 번역 원본은 `translations/translations.xlsx`이며, 개발 서버와 빌드가 이 파일을 읽어 적용합니다. 편집 방법과 배포 반영 절차는 [번역 관리 안내](translations/README.md)를 참고하세요.

## 개발 실행

```bash
npm ci
npm run electron:dev
```

백엔드는 별도 터미널에서 실행합니다.

```bash
cd ../ri-back
/Users/seokjincheol/.pyenv/versions/3.13.1/bin/python3 -m uvicorn app.main:app --host 127.0.0.1 --port 8000 --reload
```

Python 경로는 현재 macOS 개발 머신 기준입니다. 다른 환경은 [백엔드 실행 안내](../ri-back/README.md)를 참고하세요.

## 설치 파일 빌드

`ri-front` 디렉터리에서 실행합니다.

```bash
# 현재 운영체제와 CPU 아키텍처용 설치 파일
npm run electron:build

# macOS: DMG와 ZIP (현재 머신의 아키텍처)
npm run electron:build:mac

# Windows: x64 NSIS 설치 EXE (Windows 빌드 머신 권장)
npm run electron:build:win

# Linux: AppImage (Linux 빌드 머신 권장)
npm run electron:build:linux

# 설치 이미지 없이 실행 가능한 앱 디렉터리만 생성
npm run electron:pack
```

결과는 `release/`에 생성됩니다. macOS Intel에서는 `Real-Iron-1.0.0-mac-x64.dmg`, Windows에서는 `Real-Iron-1.0.0-win-x64.exe` 형태입니다. macOS DMG를 열어 **Real Iron.app을 Applications로 복사**한 뒤 실행합니다.

Apple Silicon용 빌드는 다음 명령을 사용합니다. 해당 아키텍처의 Electron 다운로드가 필요하며 실행 검증은 Apple Silicon에서 수행하세요.

```bash
npm run build:electron
npx electron-builder --mac --arm64 --publish never
```

Electron 전용 빌드는 상대 정적 자산 경로(`./`)와 HashRouter를 사용하므로 설치 후 `file://` 화면 이동·새로고침이 가능합니다. 웹의 `npm run build:nginx`는 기존 `/ri-rag/` 경로를 유지합니다. 빌드 결과 디렉터리를 공유하므로 각 배포 직전에 해당 명령으로 다시 빌드하세요.

## 백엔드 API 주소 설정

기본 API 주소는 `http://true-iron.co.kr/ri-rag/api/v1/`입니다. Electron과 웹 프론트는 이 서버의 Nginx를 통해 백엔드를 호출합니다. `/ri-rag`는 배포 경로이고 `/api/v1`은 백엔드 API 접두사입니다. 로컬 백엔드 연결은 개발 모드에서만 재설정할 수 있습니다.

### 배포 빌드 주소 고정

`npm run build:electron`과 모든 `electron:build:*`, `electron:pack` 명령은
`electron/backend-config.cjs`의 `RELEASE_API_BASE_URL`을 사용합니다.
현재 값은 `http://true-iron.co.kr/ri-rag/api/v1/`입니다.
배포 앱은 `.env.electron.local`, 셸의 `VITE_API_BASE_URL`, 실행 환경의
`REAL_IRON_API_BASE_URL`, 기존 `backend.json`에 localhost가 남아 있어도 이 주소로 연결합니다.
배포 서버를 바꾸려면 `RELEASE_API_BASE_URL`을 수정하고 다시 빌드하세요.

```bash
npm run electron:build:mac
npm run electron:build:win
```

결과는 `release/`에 생성됩니다. 설치 파일은 GitHub Releases에 업로드합니다.
새 버전은 `npm version patch --no-git-tag-version`으로 올린 뒤 빌드합니다.
macOS Intel용은 `.dmg`, Windows x64용은 `.exe`를 배포합니다.

### 개발 중 다른 서버 사용

`npm run electron:dev`에서는 `.env.electron.local`의 `VITE_API_BASE_URL`로 개발 서버를
설정할 수 있습니다. 개발 앱의 우선순위는 `REAL_IRON_API_BASE_URL` 환경변수 →
사용자 데이터 폴더의 `backend.json` (`apiBaseUrl`) → `.env.electron` 설정입니다.
이 재정의는 설치한 배포 앱에는 적용되지 않습니다.

## 백엔드 연결 확인

```bash
curl --fail http://localhost/ri-rag/api/v1/health
```

정상 응답은 `{"status":"ok"}`입니다. 설치 앱의 `file://` 요청 Origin은 `null`이므로 백엔드 `RAG_CORS_ORIGINS`에 `"null"`이 포함되어야 합니다. 현재 백엔드 기본 설정에는 포함되어 있습니다. Electron의 `webSecurity`를 끄지 않습니다.

외부 서버에 연결할 때는 백엔드의 수신 주소·방화벽·HTTPS를 별도로 구성해야 합니다. 현행 프로젝트의 `X-User-Email`은 임시 로그인 식별값이므로 인터넷 공개 운영에는 서버 인증과 전체 API 접근 제어가 추가로 필요합니다.

## 서명 및 검증 범위

빌드 명령은 자동 업로드나 배포를 하지 않습니다(`--publish never`). Apple Developer 서명·공증이나 Windows 코드 서명 인증서는 이 저장소에 포함하지 않습니다. 서명된 정식 배포는 배포 환경의 인증서 설정이 필요합니다. 다른 운영체제용 명령이 있다는 사실은 해당 설치 파일의 실행 검증을 의미하지 않습니다.

```bash
npm run test:electron-config
./node_modules/.bin/tsc --noEmit
```

설치 확인 시 로그인 → 프로젝트 목록 → Chat/설정 이동 → 새로고침 → 백엔드 조회를 확인하세요. 백엔드 미실행 상태에서는 화면에 연결 오류와 재시도가 표시됩니다.

## 로컬 실행과 API 테스트

배포 기본값은 `http://true-iron.co.kr/ri-rag/api/v1/`을 유지합니다.
헬스 체크 테스트는 localhost로 로컬 Nginx를 호출합니다. 개발 화면과 Electron 앱의 API endpoint는 실행 위치와 관계없이 도메인을 사용합니다.

```bash
# Axios 경로 결합과 localhost Nginx 헬스 체크 검증
npm run test:api-local

# 도메인 API에 연결한 웹 개발 화면 (http://localhost:5174)
npm run dev:local
```

`dev`, `electron:dev`, `dev:local`과 배포 빌드는 모두 기본적으로 `http://true-iron.co.kr/ri-rag/api/v1/`을 사용합니다. 이 PC처럼 hosts에 `127.0.0.1 true-iron.co.kr`을 등록하면 같은 도메인 주소로 로컬 Nginx에 연결됩니다. 배포 앱은 기존 `backend.json`과 관계없이 지정된 도메인 API를 사용합니다.

## 앱 헤더

- 홈: React Router로 `/` 이동 (기존 라우팅에 따라 대시보드 또는 로그인으로 연결).
- 새로고침: 현재 경로를 유지한 채 화면을 다시 로드.
- 창 내림: 현재 Electron 창 최소화.
- 전체화면: 전체화면 진입/해제. `F11`로 전환하고 `Esc`로 해제 가능.
- 닫기: 현재 창 닫기.

헤더는 Electron에서 표시됩니다. 변경된 창 제어 기능은 새 설치 파일에 반영되므로 기존 앱은 업데이트 후 다시 실행하세요.

## 코드 포맷

`.prettierrc.json`과 `scripts/format.mjs`를 기준으로 소스와 설정 파일을 포맷합니다.
4칸 들여쓰기, 기본 줄 너비 100자, JavaScript/TypeScript 작은따옴표를 사용합니다.
JSX 전용 플러그인은 중괄호 안쪽 공백, 자식 태그와 동적 표현식의 줄바꿈,
여러 속성의 줄바꿈을 적용하며 화면 텍스트와 의미 있는 공백을 보존합니다.
긴 문자열은 의미를 바꾸어 나누지 않습니다.

```sh
npm run format
npm run format:check
npm run test:format
```

Git에서 관리하거나 아직 추가하지 않은 파일 중 지원하는 텍스트 파일을 처리합니다.
Git에서 무시하는 의존성·빌드 결과물, 바이너리 파일과 자동 생성 잠금 파일은 제외합니다.
