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
    const { lessonPlan } = req.body;

    if (!lessonPlan) {
      return res.status(400).json({ error: 'Nội dung kế hoạch bài dạy là bắt buộc.' });
    }

    const prompt = `Bạn là một chuyên gia giáo dục.
Nhiệm vụ của bạn là kiểm tra và thống kê danh sách các bài học có trong nội dung giáo án được cung cấp dưới đây. Đọc kỹ file tôi gửi và phân tích ĐÚNG dựa trên nội dung thực tế trong file, TUYỆT ĐỐI KHÔNG được bịa đặt (hallucinate) hay suy diễn thông tin không có.
Lưu ý quan trọng: "Bài tập cuối chương" và "Ôn tập giữa kì" cũng được tính là 1 bài học riêng biệt. Bắt buộc phải đọc từ đầu đến cuối file và không được bỏ sót bất kỳ bài nào!

Với mỗi bài học, hãy xác định:
1. Tên bài học
2. Số tiết của bài học (nếu có)
3. Số tuần của bài học hoặc tuần thực hiện (nếu có)

Nội dung giáo án:
"""
${lessonPlan}
"""

Yêu cầu đầu ra (Format bằng Markdown):
- Sử dụng bảng (table) để trình bày kết quả với các cột: "STT", "Tên bài", "Số tiết", "Tuần".
- NẾU giáo án KHÔNG ghi rõ số tiết hoặc tuần cho bài nào đó, hãy ghi "Không xác định" hoặc để trống (tùy ngữ cảnh nhưng bảng phải rõ ràng).
- Nếu phát hiện nhiều bài, liệt kê đầy đủ.
- Cuối cùng, tổng hợp lại: "Tổng số bài:", "Tổng số tiết (đã xác định):" ở bên dưới bảng.
- Chỉ đưa ra bảng và kết quả tổng hợp, trình bày chuyên nghiệp, không giải thích dài dòng.`;

    const response = await ai.models.generateContent({
      model: 'gemini-3.6-flash',
      contents: prompt,
    });

    res.json({ result: response.text });
  } catch (error: any) {
    console.error('Error generating statistics:', error);
    res.status(500).json({ error: error.message || 'Có lỗi xảy ra khi xử lý yêu cầu.' });
  }
}
