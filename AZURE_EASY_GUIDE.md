# Azure 연결 쉬운 안내서

이 문서는 버릴제 프론트엔드와 백엔드가 Azure에서 어떻게 동작하는지, 공공데이터 API 주소와 인증키를 어디에 등록하는지 쉽게 설명합니다.

## 1. 현재 서비스 주소

- 프론트엔드: <https://stboriljedev09.z12.web.core.windows.net/>
- 백엔드 API: <https://func-borilje-dev-09.azurewebsites.net/api>
- Azure 리소스 그룹: `rg-borilje-dev`
- Azure Function App: `func-borilje-dev-09`

현재는 제주시 클린하우스 공공데이터 API 연결과 첫 수집이 완료되어 장소 1,401건을 보여줍니다.

## 2. 내 컴퓨터가 꺼져 있어도 실행되나요?

네. 이미 배포된 서비스는 내 컴퓨터와 관계없이 Azure에서 실행됩니다.

- 프론트엔드 파일은 Azure Storage가 제공합니다.
- 백엔드 API는 요청이 들어오면 Azure Functions가 실행합니다.
- 데이터 수집 함수는 매일 오전 3시 10분에 Azure가 실행합니다.
- 내 컴퓨터에서 터미널을 켜 둘 필요가 없습니다.

단, 코드를 수정한 내용은 자동으로 Azure에 올라가지 않습니다. 지금은 코드를 수정한 후 직접 배포해야 합니다.

또한 Azure 구독이 중지되거나 학생용 크레딧이 만료되면 서비스가 중단될 수 있습니다.

## 3. 서비스가 동작하는 순서

1. 사용자가 프론트엔드 주소에 접속합니다.
2. 브라우저가 Azure 백엔드의 `/spots` API를 호출합니다.
3. 백엔드가 저장된 장소 데이터를 검색합니다.
4. 검색 결과를 JSON으로 프론트엔드에 전달합니다.
5. 프론트엔드가 장소 이름, 주소, 운영 시간과 수거 품목을 화면에 표시합니다.

정기 수집 함수는 별도로 매일 실행됩니다.

1. 공공데이터 API에서 최신 데이터를 받습니다.
2. 빈 데이터, 중복 ID와 잘못된 좌표를 검사합니다.
3. 정상 데이터만 Azure Blob Storage에 저장합니다.
4. 이후 프론트엔드는 새로 저장된 데이터를 조회합니다.

## 4. 준비할 값

공공데이터포털에서 다음 두 가지를 준비합니다.

### API 요청주소

환경 변수 이름은 `DATA_SOURCE_URL`입니다.

예시는 다음과 같습니다.

```text
https://apis.data.go.kr/기관명/서비스명/기능명
```

공공데이터 소개 페이지 주소가 아니라 API 설명에 표시된 **요청주소**를 사용해야 합니다.

주소에 `serviceKey`를 직접 붙이지 않습니다. API에 꼭 필요한 추가 조건이 있다면 해당 조건만 주소에 포함합니다.

### 인증키

환경 변수 이름은 `DATA_GO_KR_SERVICE_KEY`입니다.

공공데이터포털에서 발급받은 **일반 인증키(Decoding)** 값을 사용합니다. 현재 코드는 이 값을 요청에 맞게 자동으로 URL 인코딩합니다.

인증키는 다음 위치에 작성하거나 공유하지 않습니다.

- GitHub
- 소스 코드
- `README.md`
- `local.settings.example.json`
- 메신저 또는 채팅

## 5. Azure Portal에 등록하기

가장 쉬운 방법입니다.

1. <https://portal.azure.com>에 로그인합니다.
2. 상단 검색창에서 `rg-borilje-dev`를 검색합니다.
3. 리소스 그룹 안에서 `func-borilje-dev-09`를 선택합니다.
4. 왼쪽 메뉴에서 `Settings`를 선택합니다.
5. `Environment variables`를 선택합니다.
6. `App settings`에 아래 세 항목을 추가하거나 수정합니다.

| 이름 | 입력할 값 |
|---|---|
| `DATA_SOURCE_URL` | 공공데이터 API 요청주소 |
| `DATA_GO_KR_SERVICE_KEY` | 일반 인증키(Decoding) |
| `ALLOW_SAMPLE_DATA` | 처음에는 기존 값인 `true` 유지 |

7. 화면 위쪽의 `Apply` 또는 `Save`를 누릅니다.
8. 확인 창이 나오면 `Confirm`을 누릅니다.

다음 기존 설정은 삭제하거나 변경하지 않습니다.

- `AzureWebJobsStorage`
- `AZURE_STORAGE_ACCOUNT_URL`
- `SPOTS_CONTAINER_NAME`
- `FRONTEND_ORIGIN`
- `SPOTS_SYNC_SCHEDULE`

저장하면 Azure Function App이 설정을 다시 읽습니다. 코드를 다시 배포할 필요는 없습니다.

실데이터가 저장되기 전에 `ALLOW_SAMPLE_DATA`를 `false`로 바꾸면 조회 API가 일시적으로 오류를 반환할 수 있습니다. 먼저 수집 성공을 확인한 다음 변경하는 것이 안전합니다.

## 6. 등록 후 확인하기

환경 변수를 등록했다고 바로 실데이터가 나타나는 것은 아닙니다. 다음 정기 수집이 성공한 후 화면에 반영됩니다.

현재 수집 시간은 매일 오전 3시 10분입니다.

수집 후 다음 주소를 확인합니다.

```text
https://func-borilje-dev-09.azurewebsites.net/api/sync-status
```

정상적으로 수집되었다면 응답에서 다음 내용을 확인할 수 있습니다.

```json
{
  "status": "success",
  "source": "data.go.kr"
}
```

수집 성공을 확인한 후 Azure Portal의 `Environment variables`에서 `ALLOW_SAMPLE_DATA`를 `false`로 바꾸고 다시 저장합니다.

마지막으로 프론트엔드 주소를 새로고침했을 때 `샘플 데이터 · 공공 API 연결 전` 문구가 사라지는지 확인합니다.

## 7. 문제가 생겼을 때 확인할 것

### 계속 샘플 데이터가 표시되는 경우

- `/api/sync-status`의 `status`가 `success`인지 먼저 확인합니다.
- 수집 성공 후 `ALLOW_SAMPLE_DATA`를 `false`로 변경했는지 확인합니다.
- `DATA_SOURCE_URL`이 소개 페이지가 아닌 실제 API 요청주소인지 확인합니다.
- 인증키가 일반 인증키(Decoding)인지 확인합니다.
- 공공데이터포털에서 해당 API의 활용 신청이 승인되었는지 확인합니다.
- 다음 오전 3시 10분 수집이 실행되었는지 확인합니다.

### API 오류가 발생하는 경우

Azure Portal에서 다음 순서로 로그를 확인합니다.

1. `func-borilje-dev-09`를 엽니다.
2. `Monitoring`을 선택합니다.
3. `Log stream` 또는 `Application Insights`를 선택합니다.
4. `syncSpots` 오류 내용을 확인합니다.

### 프론트엔드가 열리지 않는 경우

- Azure 구독과 학생용 크레딧 상태를 확인합니다.
- Storage Account `stboriljedev09`가 삭제되거나 중지되지 않았는지 확인합니다.
- 프론트엔드 주소의 응답을 확인합니다.

## 8. 코드에서 담당하는 파일

- `app.js`: 프론트엔드에서 Azure API를 호출하고 결과를 화면에 표시합니다.
- `api/src/functions/getSpots.ts`: 장소 조회 API입니다.
- `api/src/functions/getSyncStatus.ts`: 마지막 수집 상태를 보여주는 API입니다.
- `api/src/functions/syncSpots.ts`: 매일 실행되는 수집 함수입니다.
- `api/src/services/collectSpots.ts`: 공공 API 호출, 데이터 변환과 검사를 담당합니다.
- `api/src/services/spotStore.ts`: 데이터를 Azure Blob Storage에 저장하고 읽습니다.

## 9. 한 줄 요약

Azure Portal의 `func-borilje-dev-09`에 API 요청주소와 일반 인증키(Decoding)를 저장하고, 첫 수집 성공을 확인한 뒤 `ALLOW_SAMPLE_DATA=false`로 바꾸면 실제 공공데이터를 사용합니다.
