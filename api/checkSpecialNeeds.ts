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

    const prompt = `Bạn là một chuyên gia giáo dục phân tích giáo án.
Nhiệm vụ của bạn là kiểm tra nội dung dành cho học sinh khuyết tật trí tuệ (hoặc học sinh hòa nhập) trong kế hoạch bài dạy dưới đây. Các nội dung này thường được ký hiệu bằng chữ "HSHN" hoặc "HSKT" ở phía trước.

Nội dung kế hoạch bài dạy:
"""
${lessonPlan}
"""

Yêu cầu đầu ra (Format bằng Markdown, TRỰC TIẾP ĐI VÀO VẤN ĐỀ, KHÔNG MỞ BÀI HAY KẾT LUẬN, KHÔNG GIẢI THÍCH THÊM):
- Tìm và liệt kê tất cả các hoạt động, nội dung, yêu cầu, hoặc câu hỏi có ký hiệu "HSHN" hoặc "HSKT".
- Đánh giá sơ bộ xem các nội dung đó đã phù hợp, dễ hiểu và dễ thực hiện đối với học sinh khuyết tật trí tuệ hay chưa.
- NẾU KHÔNG TÌM THẤY bất kỳ nội dung nào có ký hiệu "HSHN" hoặc "HSKT", hãy thông báo rõ ràng là không tìm thấy, sau đó CHỦ ĐỘNG ĐỀ XUẤT 1-2 hoạt động hoặc câu hỏi điều chỉnh đơn giản (dành cho HSHN/HSKT) cho các phần chính của bài học.
- Trình bày ngắn gọn, rõ ràng bằng danh sách gạch đầu dòng, không giải thích dài dòng.`;

    const response = await ai.models.generateContent({
      model: 'gemini-3.6-flash',
      contents: prompt,
    });

    res.json({ result: response.text });
  } catch (error: any) {
    console.error('Error checking special needs:', error);
    res.status(500).json({ error: error.message || 'Có lỗi xảy ra khi xử lý yêu cầu.' });
  }
}
