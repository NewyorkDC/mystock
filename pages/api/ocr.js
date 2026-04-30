// pages/api/ocr.js
// 서버에서 Anthropic API 호출 (CORS 없음)

export const config = { api: { bodyParser: { sizeLimit: "10mb" } } };

export default async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).end();

  const { imageBase64, mediaType = "image/jpeg" } = req.body;
  if (!imageBase64) return res.status(400).json({ error: "이미지가 없어요" });

  try {
    const response = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": process.env.ANTHROPIC_API_KEY || "",
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify({
        model: "claude-3-5-haiku-20241022",
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

규칙:
- ticker: 한국주식은 종목코드.KS(코스피) 또는 종목코드.KQ(코스닥), 미국주식은 영문티커(TSM, AAPL 등), 모르면 null
- sector: 건설/배터리/반도체/통신/바이오/금융/IT/미국/ETF/기타 중 하나
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
      return res.status(500).json({ error: "API 오류: " + err.slice(0, 100) });
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
