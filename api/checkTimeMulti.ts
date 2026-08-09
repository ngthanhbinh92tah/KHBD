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
    const { lessonPlan, lessonConfigs } = req.body;

    if (!lessonPlan) {
      return res.status(400).json({ error: 'Nội dung kế hoạch bài dạy là bắt buộc.' });
    }

    let configText = '';
    if (lessonConfigs && lessonConfigs.length > 0) {
      configText = 'Thông tin số tiết cho từng bài như sau:\n';
      lessonConfigs.forEach((c: any) => {
        configText += `- ${c.name}: ${c.numLessons} tiết (Tổng: ${c.numLessons * 45} phút)\n`;
      });
    } else {
      configText = 'Mặc định sử dụng 1 tiết (45 phút) cho bài học nếu không rõ.';
    }

    const prompt = `Bạn là một chuyên gia giáo dục phân tích giáo án.
Nhiệm vụ của bạn là kiểm tra và thống kê thời lượng (thời gian) được phân bổ cho các hoạt động trong kế hoạch bài dạy.
Hãy tìm và tổng hợp thời gian cho các mục A (Khởi động/Mở đầu), B (Hình thành kiến thức mới/Khám phá), C (Luyện tập), D (Vận dụng) hoặc các mục tương đương.

ĐẶC BIỆT QUAN TRỌNG: Ở mục "Hình thành kiến thức" (hoặc mục tương đương), bạn PHẢI hiển thị chi tiết các hoạt động con bên trong nó kèm theo thời gian (nếu có).

${configText}

Nội dung kế hoạch bài dạy:
"""
${lessonPlan}
"""

Yêu cầu đầu ra (Format bằng Markdown):
- Nếu có nhiều bài, hãy dùng tiêu đề rõ ràng cho từng bài (Ví dụ: ### Bài 1: Tên bài).
- Với mỗi bài, liệt kê thời gian cho từng mục HIỆN CÓ trong giáo án.
- Riêng phần "Hình thành kiến thức mới", liệt kê các hoạt động chi tiết bên trong nó dưới dạng list con (ví dụ: - Hoạt động 1: 10 phút, - Hoạt động 2: 15 phút).
- Tính tổng thời gian của cả bài hiện tại.
- NẾU có bất kỳ phần nào (hoặc cả bài) KHÔNG ghi rõ thời gian (Không xác định), bạn PHẢI đưa ra đề xuất phân bổ thời gian hợp lý cho TỪNG mục dựa trên số tiết đã được chỉ định (hoặc 45 phút/tiết).
- Đề xuất phân bổ nên hợp lý theo chuẩn sư phạm (ví dụ: Khởi động ~10%, Hình thành kiến thức ~40-50%, Luyện tập ~30%, Vận dụng ~10%).
- Trình bày ngắn gọn, rõ ràng bằng danh sách gạch đầu dòng, không giải thích dài dòng.`;

    const response = await ai.models.generateContent({
      model: 'gemini-3.6-flash',
      contents: prompt,
    });

    res.json({ result: response.text });
  } catch (error: any) {
    console.error('Error checking time:', error);
    res.status(500).json({ error: error.message || 'Có lỗi xảy ra khi xử lý yêu cầu.' });
  }
}
