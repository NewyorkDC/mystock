// pages/api/ocr.js
// 서버에서 Anthropic API 호출 (CORS 없음)
export const config = { api: { bodyParser: { sizeLimit: "10mb" } } };
export default async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).end();
  const { imageBase64, mediaType = "image/jpeg" } = req.body;
  if (!imageBase64) return res.status(400).json({ error: "이미지가 없어요" });
  try {
    const apiKey = process.env.ANTHROPIC_API_KEY || "";
    console.log("API key present:", apiKey.length > 0, "length:", apiKey.length);
    const response = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": process.env.ANTHROPIC_API_KEY || "",
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify({
        model: "claude-opus-4-5",
        max_tokens: 1500,
        messages: [{
          role: "user",
          content: [
            {
              type: "image",
              source: { type: "base64", media_type: mediaType, data: imageBase64 }
            },
            {
              type: "text",
              text: `이 증권사 앱 캡처 이미지에서 보유 종목 정보를 추출해주세요.
JSON 배열만 반환하세요. 마크다운 없이 순수 JSON만.
형식:
[{"name":"종목명","buyPrice":매수평균가,"qty":보유수량,"ticker":"티커","sector":"섹터"}]

ticker 규칙 (매우 중요):
- 한국 주식: 이미지에 종목코드가 보이면 그걸 우선 사용. 코드.KS(코스피) 또는 코드.KQ(코스닥) 형식
  - 이미지에 코드가 없으면 종목명으로 추론 (확실한 경우만):
  - 삼성전자=005930.KS, SK하이닉스=000660.KS, LG에너지솔루션=373220.KS
  - 현대차=005380.KS, 기아=000270.KS, POSCO홀딩스=005490.KS
  - 셀트리온=068270.KS, 카카오=035720.KS, 네이버=035420.KS
  - 삼성바이오로직스=207940.KS, 삼성SDI=006400.KS, LG화학=051910.KS
  - 현대모비스=012330.KS, KB금융=105560.KS, 신한지주=055550.KS
  - 하나금융지주=086790.KS, 우리금융지주=316140.KS, 한국전력=015760.KS
  - 대한조선=439260.KS, 삼성중공업=010140.KS, HD한국조선해양=009540.KS
  - HJ중공업=097230.KS, 휴스틸=005010.KS, 유니퀘스트=077500.KQ
  - 확실하지 않으면 null (틀린 코드보다 null이 낫습니다)
- 미국 주식: 영문 티커 그대로 (TSM, AAPL, NVDA 등)
- ETF: 티커 그대로 (TQQQ, SOXL, SPY 등)
- 일본 주식: 종목코드.T 형식 (도쿄증권거래소). 확실한 경우만:
  - 이비덴(Ibiden)=4062.T, 미쓰비시중공업=7011.T, 간포생명보험=7181.T
  - 소니=6758.T, 도요타=7203.T, 소프트뱅크=9984.T, 닌텐도=7974.T
  - 키엔스=6861.T, 신에츠화학=4063.T, 도쿄일렉트론=8035.T
  - 확실하지 않으면 null
- 모르면 반드시 null

sector 규칙:
- 조선/건설 관련 → "건설"
- 배터리/2차전지 → "배터리"
- 반도체 → "반도체"
- 통신 → "통신"
- 바이오/제약 → "바이오"
- 금융/은행/보험 → "금융"
- IT/소프트웨어 → "IT"
- 미국주식 → "미국"
- ETF → "ETF"
- 나머지 → "기타"

기타 규칙:
- buyPrice, qty는 숫자만 (쉼표 제거)
- 확인 불가한 값은 null
- 종목이 없으면 빈 배열 []`
            }
          ]
        }]
      })
    });
    if (!response.ok) {
      const err = await response.text();
      console.error("Anthropic API error:", response.status, err);
      return res.status(500).json({ error: "API 오류 " + response.status + ": " + err.slice(0, 200) });
    }
    const data = await response.json();
    const text = data.content?.[0]?.text || "";
    const clean = text.replace(/```json|```/g, "").trim();
    
    try {
      const stocks = JSON.parse(clean);
      return res.status(200).json({ stocks: Array.isArray(stocks) ? stocks : [] });
    } catch {
      return res.status(200).json({ stocks: [], raw: text });
    }
  } catch (e) {
    return res.status(500).json({ error: e.message });
  }
}
