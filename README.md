# MyStock v2 — 계정 기능 + 기기 동기화

## 설정 순서

### 1. MongoDB Atlas 무료 DB 만들기
1. https://cloud.mongodb.com 접속 → 회원가입
2. **Create a FREE cluster** (M0 Free 선택)
3. Username/Password 설정 (기억해두기)
4. **Network Access** → Add IP Address → **Allow Access from Anywhere** (0.0.0.0/0)
5. **Database** → **Connect** → **Drivers** → Connection string 복사
   - 형식: `mongodb+srv://USERNAME:PASSWORD@cluster0.xxxxx.mongodb.net/`

### 2. GitHub에 코드 올리기
이 폴더의 파일들을 기존 mystock 저장소에 올리거나 새 저장소 생성

### 3. Vercel 환경변수 설정
Vercel 프로젝트 → Settings → Environment Variables에 아래 3개 추가:

| 이름 | 값 |
|------|-----|
| `MONGODB_URI` | mongodb+srv://... (복사한 연결 문자열) |
| `NEXTAUTH_SECRET` | 아무 랜덤 문자열 (예: mystock-secret-2024-xyz) |
| `NEXTAUTH_URL` | https://mystock-lake.vercel.app (본인 Vercel 주소) |
| `FINNHUB_KEY` | d7ou9apr01qmthudj7fgd7ou9apr01qmthudj7g0 |

### 4. Redeploy
환경변수 추가 후 Vercel → Deployments → 최신 배포 → **Redeploy**

---

## 기능
- 로그인/회원가입 (계정별 완전 분리)
- PC/모바일 실시간 동기화 (MongoDB)
- 실시간 시세 조회 (한국: 네이버, 미국: Finnhub)
- 계좌별/종목별 관리
- 섹터 직접 입력 + 메모
- 꾹 눌러서 순서 변경
- 자산 추이 그래프
