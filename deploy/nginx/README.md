# RI RAG nginx 배포

접속 주소: http://localhost/ri-rag/

- nginx: 80 (여동과 경로로 분리)
- RI API: 127.0.0.1:8000 (여동 API: 8001)
- RI Vite 개발 서버: 5174 (여동: 5173)

프런트엔드 폴더에서 `npm run build:nginx`로 빌드합니다. 이 모드는
Electron 없이 `/ri-rag/` 경로로 빌드하고 `/ri-rag/api/v1`로 API를 요청합니다.

백엔드는 `ri-back` 폴더에서 실행합니다:

```sh
python -m uvicorn app.main:app --host 127.0.0.1 --port 8000
```

`ri-rag.locations.conf`를 `/usr/local/etc/nginx/snippets/ri-rag.locations.conf`에
복사하고, 기존 `/usr/local/etc/nginx/servers/yeodong.conf`의 `server` 블록 안에
다음 설정을 넣습니다. 별도 `server` 블록을 중복 생성하지 않습니다.

```nginx
include /usr/local/etc/nginx/snippets/ri-rag.locations.conf;
```

```sh
nginx -t -e stderr
nginx -s reload -e stderr
```

설정의 정적 파일 경로는 이 Mac의 절대 경로입니다. 다른 환경에서는 수정해야 합니다.
백엔드 실행은 별도 관리하며 nginx가 백엔드를 시작하지 않습니다.
