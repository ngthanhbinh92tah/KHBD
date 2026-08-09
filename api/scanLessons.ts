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
Nhiệm vụ của bạn là đọc nội dung tài liệu sau và xác định xem tài liệu có chứa bao nhiêu bài dạy (giáo án) khác nhau. Đọc kỹ file tôi gửi và phân tích ĐÚNG dựa trên nội dung thực tế trong file, TUYỆT ĐỐI KHÔNG được bịa đặt (hallucinate) hay suy diễn.
Lưu ý quan trọng: "Bài tập cuối chương" và "Ôn tập giữa kì" cũng được tính là 1 bài học riêng biệt. Bắt buộc phải đọc từ đầu đến cuối file và không được bỏ sót bất kỳ bài nào!

Nội dung:
"""
${lessonPlan}
"""

Yêu cầu đầu ra:
Bạn PHẢI trả về ĐÚNG MỘT MẢNG JSON hợp lệ (không có markdown formatting, chỉ text JSON thuần túy) chứa danh sách các bài dạy được tìm thấy. Mỗi phần tử là một chuỗi tên bài. Nếu chỉ có 1 bài, trả về mảng 1 phần tử.
Ví dụ: ["Bài 1: Giới thiệu", "Bài 2: Thực hành", "Bài tập cuối chương", "Ôn tập giữa kì"]
Nếu không tìm thấy bài nào rõ ràng, trả về mảng rỗng: []`;

    const response = await ai.models.generateContent({
      model: 'gemini-3.6-flash',
      contents: prompt,
    });

    let text = response.text || '[]';
    text = text.replace(/```json/g, '').replace(/```/g, '').trim();

    let lessons = [];
    try {
      lessons = JSON.parse(text);
    } catch (e) {
      console.error('Failed to parse lessons JSON:', text);
      lessons = ['Bài học (Không xác định tên)'];
    }

    res.json({ lessons });
  } catch (error: any) {
    console.error('Error scanning lessons:', error);
    res.status(500).json({ error: error.message || 'Có lỗi xảy ra.' });
  }
}
