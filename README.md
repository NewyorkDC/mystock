# MyStock — 내 주식 포트폴리오

실시간 시세 조회가 되는 주식 포트폴리오 앱입니다.
한국 주식(네이버 증권), 미국 주식(Finnhub) 실시간 시세 지원.

---

## 🚀 5분 배포 방법 (Vercel, 완전 무료)

### 1단계 — GitHub에 올리기

1. [github.com](https://github.com) 회원가입/로그인
2. 우측 상단 `+` → **New repository** 클릭
3. Repository name: `mystock` → **Create repository**
4. 아래 코드 복사해서 터미널에 붙여넣기:

```bash
cd mystock
git init
git add .
git commit -m "first commit"
git branch -M main
git remote add origin https://github.com/YOUR_USERNAME/mystock.git
git push -u origin main
```
> `YOUR_USERNAME` 부분을 본인 GitHub 아이디로 바꾸세요

### 2단계 — Vercel 배포

1. [vercel.com](https://vercel.com) 접속 → GitHub 계정으로 로그인
2. **Add New Project** 클릭
3. `mystock` 저장소 선택 → **Import**
4. 아무것도 건드리지 말고 **Deploy** 클릭
5. 1-2분 후 `https://mystock-xxx.vercel.app` 주소 생성 완료!

### (선택) 환경변수 설정
- Vercel 프로젝트 → Settings → Environment Variables
- `FINNHUB_KEY` = `d7ou9apr01qmthudj7fgd7ou9apr01qmthudj7g0`

---

## 💻 로컬에서 실행

```bash
npm install
npm run dev
# → http://localhost:3000 접속
```

---

## 📱 기능

- 한국/미국 주식 실시간 시세 (서버에서 조회, CORS 없음)
- 섹터별 그룹핑
- 매수가/수량 입력 → 수익률/평가액 자동 계산
- 총 자산 KRW 환산
- 종목 추가/수정/삭제
- 브라우저 localStorage 저장 (새로고침해도 유지)

## 티커 형식
- 🇰🇷 한국 코스피: `005930.KS` (종목코드.KS)
- 🇰🇷 한국 코스닥: `082920.KQ` (종목코드.KQ)
- 🇺🇸 미국: `TSM`, `AAPL`, `NVDA` 등
