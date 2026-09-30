# 프런트엔드 작업 가이드 (초안)

이 문서는 `ri-front` 전체에 적용하는 작업 규칙 초안이다. 실제 구현과 설정 파일을 우선 확인하고, 구조나 명령이 바뀌면 이 문서도 갱신한다.

## 기술과 구조

- React 19, TypeScript 7, Vite 8 기반이며 웹과 Electron 44 데스크톱 앱을 함께 지원한다.
- React Router로 화면을 구성하고 Zustand로 공유 상태를 관리한다.
- UI는 Radix UI, Tailwind CSS, SCSS, Lucide 아이콘과 기존 공통 컴포넌트를 사용한다.
- HTTP 요청은 Axios를 사용한다. 정확한 의존성 버전은 `package.json`과 `package-lock.json`을 기준으로 한다.
- `src/pages`: 기능별 화면. `src/routes`: 라우팅과 진입 조건.
- `src/components`: atoms, molecules, organisms, templates 계층의 재사용 UI.
- `src/api`: 도메인별 API 요청. `src/lib/api.ts`: 공통 Axios 인스턴스와 오류 메시지 처리.
- `src/stores`, `src/hooks`, `src/providers`: 공유 상태, 재사용 로직, 컨텍스트 제공자.
- `src/i18n`, `translations/translations.xlsx`: 번역 연동 코드와 한국어·영어 번역 원본.
- `electron`: 메인 프로세스, preload, 백엔드 주소 설정. `deploy/nginx`: 웹 배포 설정.
- 내부 소스 import는 기존 `@/` 경로 별칭을 활용한다.

## 구현 규칙

- 기존 컴포넌트와 상태 관리 방식을 먼저 확인하고 재사용한다. 요청 범위 밖의 구조 변경이나 의존성 추가는 피한다.
- TypeScript의 strict 설정을 유지하고, API 입력·응답과 공통 컴포넌트의 타입을 명시한다. 오류 값은 `unknown`에서 좁혀 처리한다.
- API 호출은 공통 Axios 인스턴스를 사용한다. 화면마다 서버 주소를 하드코딩하지 않는다.
- 데이터 조회 화면은 로딩·빈 결과·실패 상태와 필요한 재시도 동작을 제공한다.
- 프로젝트·서비스 전환 시 기존 선택값과 상태의 범위를 확인한다. 다른 프로젝트의 데이터가 섞이지 않게 한다.
- 사용자에게 표시하는 문구는 기존 번역 키와 `t` 사용 방식을 따른다. 새 문구는 Excel 원본의 한국어·영어를 함께 갱신한다.
- 웹과 Electron의 라우팅·API 주소 설정을 함께 고려한다. Electron의 상대 자산 경로와 HashRouter, Nginx의 `/ri-rag/` 경로를 유지한다.
- Electron의 `webSecurity`를 끄지 않는다. 창 제어는 기존 preload 인터페이스를 사용한다.
- `VITE_` 환경변수는 클라이언트에 노출된다. API 키·비밀번호를 넣지 않는다.
- `X-User-Email` 기반 임시 사용자 식별을 신뢰할 수 있는 서버 인증으로 간주하지 않는다.

## 코드 가독성과 포맷

기준 파일은 `.prettierrc.json`과 `scripts/format.mjs`이다. JSX 세부 규칙은 `scripts/prettier-jsx.mjs`에서 처리한다.

- 들여쓰기는 스페이스 4칸, 기본 줄 너비는 100자를 사용한다.
- JavaScript/TypeScript 문자열은 작은따옴표를 사용한다. 긴 문자열을 의미가 바뀌도록 강제로 나누지 않는다.
- import, 구조 분해, 객체, JSX 속성의 중괄호 안쪽에 공백 1칸을 둔다: `{ value }`.
- 연산자 양옆에 공백을 두고 여러 실행문을 한 줄에 붙이지 않는다.
- JSX 자식 태그와 여닫는 태그는 각각 줄로 구분한다.
- JSX 자식의 동적 표현식은 `{`, 표현식, `}`를 별도 줄에 배치한다.
- 짧은 단일 속성 태그는 한 줄로 유지할 수 있다. 여러 속성은 속성별로 줄을 나누고 `>` 또는 `/>`는 별도 줄에 둔다.
- 의미 있는 공백을 유지하는 `{ ' ' }`와 짧은 문자열 표현식은 한 줄로 유지할 수 있다.
- 포맷만을 이유로 화면 텍스트, HTML 엔티티의 의미, 문자열이나 공백을 바꾸지 않는다.
- 포맷터 변경 시 의미 보존과 재실행 안정성을 `scripts/format.test.mjs`로 검증한다.

## 실행과 검증

명령은 `ri-front` 루트에서 실행한다.

```sh
npm ci
npm run dev
npm run electron:dev
npm run format
npm run format:check
npm run test:format
npm run test:i18n
npm run test:electron-config
npm run test:installer
npm run build
```

- 타입 변경은 `./node_modules/.bin/tsc --noEmit`으로 확인한다. Vite 빌드 성공을 타입 검사 성공으로 간주하지 않는다.
- 변경한 영역에 해당하는 테스트를 실행한다. 포맷 변경은 포맷 검사와 포맷 테스트, 번역 변경은 i18n 테스트를 포함한다.
- 웹 배포 경로를 변경하면 `npm run build:nginx`, Electron 설정을 변경하면 `npm run build:electron`도 확인한다.
- `npm run test:api-local`은 로컬 Nginx와 백엔드가 필요한 연결 테스트다. 서버가 없어서 실행하지 못하면 그 사실을 결과에 적는다.
- 빌드 결과는 `dist`, `dist-electron`, 설치 파일은 `release`에 생성된다. 결과물과 `node_modules`, 로컬 환경 파일, Excel 임시 잠금 파일은 커밋하지 않는다.
- Windows NSIS 빌드는 `beforePack`에서 macOS의 제거 프로그램 추출 체크섬을 보정하고, `artifactBuildCompleted`에서 설치·제거 파일의 CRC를 검사한다. 무결성 검사를 끄지 않는다. 이 훅은 Node.js의 `zlib.crc32`(Node 22.2 이상)가 필요하다.
- 의존성을 변경하면 `package-lock.json`을 함께 갱신한다. 잠금 파일을 수동 포맷하지 않는다.
- 커밋 전 `git diff --check`와 변경 범위를 확인하고, 실행한 검증과 남은 제약을 작업 결과에 기록한다.
