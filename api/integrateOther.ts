import type { VercelRequest, VercelResponse } from '@vercel/node';
import { GoogleGenAI } from '@google/genai';

function getGoogleGenAI(req: VercelRequest) {
  const apiKey = (req.headers['x-gemini-api-key'] as string) || process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error('Thiếu Gemini API Key. Vui lòng cung cấp trong phần Cài đặt.');
  }
  return new GoogleGenAI({
    apiKey,
    httpOptions: {
      headers: {
        'User-Agent': 'aistudio-build',
      },
    },
  });
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const ai = getGoogleGenAI(req);
    const { lessonPlan, topic } = req.body;

    if (!lessonPlan || !topic) {
      return res.status(400).json({ error: 'Nội dung kế hoạch bài dạy và chủ đề lồng ghép là bắt buộc.' });
    }

    const prompt = `Bạn là một chuyên gia giáo dục phân tích giáo án.
Nhiệm vụ của bạn là đọc nội dung kế hoạch bài dạy dưới đây và đề xuất cách lồng ghép nội dung giáo dục về "${topic}" vào bài dạy một cách hợp lý và tự nhiên nhất.

Nội dung kế hoạch bài dạy:
"""
${lessonPlan}
"""

Yêu cầu đầu ra (Format bằng Markdown, TRỰC TIẾP ĐI VÀO VẤN ĐỀ, KHÔNG MỞ BÀI HAY KẾT LUẬN, KHÔNG GIẢI THÍCH THÊM):
Hãy chỉ ra một hoặc hai hoạt động phù hợp nhất trong giáo án (ví dụ: Khởi động, Khám phá, Luyện tập, Vận dụng) để lồng ghép nội dung "${topic}".
Trình bày theo cấu trúc sau cho từng hoạt động được chọn:

**Hoạt động: [Tên hoạt động]**
- **Mục tiêu lồng ghép:** [Mục tiêu của việc lồng ghép nội dung này]
- **Cách thức thực hiện:** [Giáo viên cần làm gì, nói gì, đưa ra câu hỏi/tình huống gì cho học sinh liên quan đến ${topic}]
- **Hoạt động của học sinh:** [Học sinh làm gì, thảo luận gì, trả lời thế nào]

Trình bày ngắn gọn, chuyên nghiệp, ngôn ngữ sư phạm. Tuyệt đối không phân tích dài dòng.`;

    const response = await ai.models.generateContent({
      model: 'gemini-3.6-flash',
      contents: prompt,
    });

    res.json({ result: response.text });
  } catch (error: any) {
    console.error('Error integrating other topics:', error);
    res.status(500).json({ error: error.message || 'Có lỗi xảy ra khi xử lý yêu cầu.' });
  }
}
