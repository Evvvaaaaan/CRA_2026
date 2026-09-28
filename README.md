# 버릴제 (BORILJE)

제주 여행자가 가까운 클린 스팟과 품목별 배출 방법을 찾는 서비스입니다. 프런트엔드는 정적 웹사이트이고, 백엔드는 Node.js 22 기반 Azure Functions입니다.

## 현재 Azure 개발 환경

- 프런트엔드: <https://stboriljedev09.z12.web.core.windows.net/>
- 백엔드: <https://func-borilje-dev-09.azurewebsites.net/api>
- 리소스 그룹: `rg-borilje-dev`
- 데이터 저장소: 비공개 Blob 컨테이너 `borilje-data`
- 실행 계획: Azure Functions Flex Consumption, Korea Central

현재 Azure 환경은 제주시 클린하우스 공공데이터 API와 연결되어 있으며, 마지막 수집에서 좌표 오류 3건을 제외한 장소 1,401건을 게시했습니다.

## 구조

```text
index.html + app.js
        │
        └── GET /api/spots, /api/sync-status
                          │
                    Azure Functions
                    ├── HTTP 조회 함수
                    └── 매일 03:10 KST Timer 수집 함수
                          │
                    Azure Blob Storage
                    ├── raw/<version>.json
                    └── published/*.json
```

수집 데이터가 비어 있거나 중복 ID 또는 제주 밖 좌표를 포함하면 게시하지 않기 때문에 기존 정상 데이터가 유지됩니다.

## 로컬 실행

필수 도구는 Node.js 22, Azure Functions Core Tools 4, Azurite입니다.

```bash
cd api
npm install
cp local.settings.example.json local.settings.json
npm run storage
```

다른 터미널에서 Functions와 프런트를 실행합니다.

```bash
cd api
npm start

# 저장소 루트의 다른 터미널
python3 -m http.server 4173
```

브라우저에서 <http://localhost:4173>을 엽니다. 로컬 프런트는 자동으로 `http://localhost:7071/api`를 사용합니다.

## 테스트

```bash
cd api
npm test
npm audit --omit=dev
```

## 환경 변수

| 이름 | 용도 |
|---|---|
| `SPOTS_SYNC_SCHEDULE` | Timer NCRONTAB. 기본값 `0 10 18 * * *`은 UTC 18:10, KST 03:10입니다. |
| `DATA_SOURCE_URL` | 공공데이터 OpenAPI 엔드포인트입니다. |
| `DATA_GO_KR_SERVICE_KEY` | 공공데이터포털 일반 인증키입니다. |
| `AZURE_STORAGE_ACCOUNT_URL` | Managed Identity로 접근할 Blob 계정 URL입니다. |
| `SPOTS_CONTAINER_NAME` | 기본값은 `borilje-data`입니다. |
| `FRONTEND_ORIGIN` | API 응답에서 허용할 정확한 프런트 Origin입니다. |
| `ALLOW_SAMPLE_DATA` | 개발 단계에서만 `true`로 설정합니다. |

키는 `local.settings.json` 또는 Azure 앱 설정에만 두고 Git에 커밋하지 않습니다.

## 재배포

백엔드는 개발 의존성을 제외한 별도 산출물을 만든 뒤 배포합니다.

```bash
cd api
npm run release
cd ../dist/api-release
func azure functionapp publish func-borilje-dev-09 --no-build --javascript
```

프런트는 빌드 시 Azure API 주소를 주입하고 Storage 정적 웹사이트에 업로드합니다.

```bash
node scripts/build-frontend.mjs \
  https://func-borilje-dev-09.azurewebsites.net/api

az storage blob upload-batch \
  --account-name stboriljedev09 \
  --destination '$web' \
  --source dist/frontend \
  --overwrite true \
  --auth-mode key
```

Static Web Apps 무료 리소스 `swa-borilje-dev-09`도 생성되어 있지만, ARM Mac용 배포 클라이언트가 제공되지 않아 현재 프런트는 Storage 정적 웹사이트에서 서비스합니다.

## 협업 안내

변경 작업은 이슈를 먼저 등록한 뒤 브랜치와 Pull Request를 통해 진행합니다. 자세한 규칙은 [기여 가이드](CONTRIBUTING.md)를 확인해 주세요.
