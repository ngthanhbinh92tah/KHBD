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
    const { classes } = req.body;

    if (!classes || !Array.isArray(classes) || classes.length === 0) {
      return res.status(400).json({ error: 'Dữ liệu các lớp không hợp lệ.' });
    }

    const classesDataStr = classes.map((c: any) =>
      `- Lớp ${c.name || 'Không tên'}: Sĩ số ${c.totalStudents}, Giỏi ${c.excellent}, Khá ${c.good}, Trung bình ${c.average}, Yếu/Kém ${c.weak}`
    ).join('\n');

    const prompt = `Bạn là một chuyên gia giáo dục.
Nhiệm vụ của bạn là nhận xét và đánh giá kết quả bài kiểm tra của các lớp học dựa trên số liệu thống kê sau:

${classesDataStr}

Yêu cầu đầu ra (Format bằng Markdown, TRỰC TIẾP ĐI VÀO VẤN ĐỀ, KHÔNG MỞ BÀI HAY KẾT LUẬN):
1. **Thống kê và so sánh**: Tính tỷ lệ phần trăm các loại điểm cho từng lớp và tổng thể (nếu có nhiều lớp). Có thể dùng bảng để trình bày. So sánh chất lượng giữa các lớp (nếu có nhiều hơn 1 lớp).
2. **Ưu điểm**: Nhận xét về những điểm tích cực chung và riêng (nếu nổi bật) dựa trên số liệu.
3. **Hạn chế/Khuyết điểm**: Nhận xét về những điểm chưa đạt.
4. **Biện pháp khắc phục và nâng cao**: Đề xuất các biện pháp sư phạm để cải thiện kết quả cho nhóm yếu kém và phát huy cho nhóm khá giỏi.
Trình bày rõ ràng, súc tích, chuyên nghiệp.`;

    const response = await ai.models.generateContent({
      model: 'gemini-3.6-flash',
      contents: prompt,
    });

    res.json({ result: response.text });
  } catch (error: any) {
    console.error('Error analyzing test results:', error);
    res.status(500).json({ error: error.message || 'Có lỗi xảy ra khi xử lý yêu cầu.' });
  }
}
