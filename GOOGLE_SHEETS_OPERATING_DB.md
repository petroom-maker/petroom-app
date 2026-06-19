# PET ROOM 신청관리 운영DB 연동

## 운영DB

- Google Sheet: `PETROOM_신청관리_운영DB`
- URL: https://docs.google.com/spreadsheets/d/1jw7mcPFhZ1AJwyBamfCqB0t8oqWLLfEilgaJcOHN860/edit
- Spreadsheet ID: `1jw7mcPFhZ1AJwyBamfCqB0t8oqWLLfEilgaJcOHN860`

## 탭 매핑

- `requests` -> `01_신청DB`
- `bids` -> `02_업체견적DB`
- `images` -> `03_이미지DB`
- `contractors` -> `04_업체DB`
- `statuses` -> `05_상태관리`
- `notification_logs` -> `06_알림로그`
- `assignments` -> `07_업체배정DB`
- `customer_actions` -> `08_고객액션DB`

## Apps Script 배포

Apps Script 프로젝트는 `clasp`로 생성했습니다.

- Script URL: https://script.google.com/d/1564-BQzgW1kWQJgDXcw4yCXs38H0X-cvh7XhYsiI6t6BL6qKbQkVg2n5/edit
- Web App URL: https://script.google.com/macros/s/AKfycby8n2yYbQi70p8h8dascicc5QcDQ9cuKPFnDRHPLgQYXMT8FC6eQu5bzO5fVlTj4aLD/exec

현재 완료 상태:

1. Apps Script 프로젝트 생성 완료
2. `setupPetroomOperatingDb()` 권한 승인 완료
3. Script Properties 설정 완료
4. Web App URL JSON 응답 확인 완료
5. Vercel Production 환경변수 `GOOGLE_SHEETS_WEBHOOK_URL` 교체 완료
6. Production 배포 완료: https://petroom-app.vercel.app
7. 고객 결과 토큰·개별 링크·고객 액션 저장 기능 배포 완료

## Script Properties

- `NOTIFY_EMAIL`: 알림 받을 이메일
- `KAKAO_REST_API_KEY`: 카카오 REST API 키
- `KAKAO_CLIENT_SECRET`: 카카오 앱 client secret이 켜져 있을 때만 입력
- `KAKAO_REFRESH_TOKEN`: 카카오 나에게 보내기용 refresh token
- `WEBHOOK_SECRET`: Vercel 서버 요청만 허용하는 서버 간 비밀키

## Vercel 환경변수

- `GOOGLE_SHEETS_WEBHOOK_URL`: 새 Apps Script Web App URL
- `GOOGLE_SHEETS_SERVER_SECRET`: Apps Script의 `WEBHOOK_SECRET`과 같은 값
- `ADMIN_ACCESS_TOKEN`: 관리자 화면/API 접근 토큰

Apps Script Web App은 익명 실행 URL이지만 모든 GET/POST 요청에서 `WEBHOOK_SECRET`을 검사합니다.
비밀키가 없는 직접 조회는 `서버 인증에 실패했습니다.` 응답만 반환합니다.

## 고객 결과 링크

- URL: `/requests/[신청ID]?token=[고객접근토큰]`
- 신청 시 `고객접근토큰`, `고객결과URL`, 연락처, 결과 안내 동의를 `01_신청DB`에 저장
- 승인된 견적만 고객 결과 페이지에 노출
- 실제 업체명과 업체 연락처는 고객 API 응답에서 제거
- 고객 액션은 `08_고객액션DB`에 저장

고객 액션:

- `CONNECT_REQUESTED`: 특정 업체 연결 요청
- `CONSULT_REQUESTED`: 추가 상담 요청
- `DECIDED_LATER`: 결정 보류

기존 테스트 시트 URL을 계속 사용하면 새 신청도 기존 시트에 쌓입니다. 새 운영DB 배포 후 반드시 이 값을 새 Web App URL로 교체해야 합니다.

현재 Production 환경변수는 새 Web App URL로 교체되었습니다.

## 테스트

### 일반 가정

- 신청유형: 일반 가정
- 주거유형: 오피스텔
- 현재상황: 이사 전 원상복구가 필요해요
- 손상부위: 벽지, 장판/바닥
- 필수 사진: 전체공간, 훼손범위, 근접사진 3장
- 지역: 경기 성남시 분당구 / 수내1동
- 희망시기: 1주 이내

확인:

- `01_신청DB`에 `PR-YYYY-0001` 형태로 저장
- `03_이미지DB`에 사진 3장이 각각 저장
- Drive URL 열림
- 이메일 알림 수신
- 카카오 나에게 알림 수신
- `06_알림로그`에 EMAIL/KAKAO_ME 결과 기록

2026-06-14 테스트 결과:

- `PR-2026-0001`: 운영DB 저장, Drive 사진 저장, 이메일 성공, 카카오 설정 전 실패 로그 확인
- `PR-2026-0002`: 운영DB 저장, Drive 사진 저장, 이메일 성공, 카카오 성공

### 운영 공간

- 신청유형: 운영 공간
- 운영공간유형: 애견유치원
- 손상부위: 장판/바닥, 문 또는 문틀
- 필수 사진: 전체공간, 훼손범위, 근접사진 3장
- 희망예산: 50~100만원
- 지역: 경기 광주시 / 오포1동
- 시공가능시간: 휴무일
- 희망시기: 한 달 이내

확인:

- `01_신청DB`에 운영 공간 값 저장
- `03_이미지DB`에 사진 저장
- 이메일/카카오 알림 수신
- `06_알림로그`에 알림 성공/실패 기록
