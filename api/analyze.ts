import type { VercelRequest, VercelResponse } from '@vercel/node';
import fs from 'fs';
import path from 'path';
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
    const { lessonPlan, grade, subject, theme, topic } = req.body;

    if (!lessonPlan) {
      return res.status(400).json({ error: 'Nội dung kế hoạch bài dạy là bắt buộc.' });
    }

    const cv3439Content = fs.readFileSync(path.join(process.cwd(), '3439.txt'), 'utf8');

    const themeText = theme === 'auto' ? 'AI tự động phân tích và lựa chọn chủ đề phù hợp nhất từ CV 3439' : theme;
    const topicText = topic === 'auto' ? 'AI tự động phân tích và lựa chọn nội dung phù hợp nhất từ CV 3439' : topic;

    const prompt = `Bạn là một chuyên gia giáo dục và công nghệ thông tin tại Việt Nam, am hiểu sâu sắc về Công văn 5512/BGDĐT-GDTrH (về xây dựng kế hoạch giáo dục) và Công văn 3439/BGDĐT-GDTrH, cũng như các chủ trương đổi mới phương pháp dạy học.
Nhiệm vụ của bạn là phân tích kế hoạch bài dạy dưới đây và đưa ra các đề xuất cụ thể để lồng ghép trí tuệ nhân tạo (AI) vào các chuỗi hoạt động học, nhằm nâng cao tính tương tác, cá nhân hóa học tập và giảm tải công việc cho giáo viên, đáp ứng các tiêu chí đánh giá giáo án tiên tiến, ĐẶC BIỆT LÀ PHẢI TUÂN THỦ NGHIÊM NGẶT HƯỚNG DẪN TRONG CÔNG VĂN 3439 SAU ĐÂY:

--- NỘI DUNG CÔNG VĂN 3439/QĐ-BGDĐT ---
${cv3439Content.substring(0, 10000)} // Giới hạn một phần nội dung nếu quá dài
... (Đã được nạp dưới nền)
----------------------------------------

Thông tin bài dạy:
- Lớp: ${grade || 'Không xác định'}
- Môn học: ${subject || 'Không xác định'}
- Chủ đề giáo dục AI: ${themeText}
- Nội dung giáo dục AI cần lồng ghép: ${topicText}

Nội dung kế hoạch bài dạy do giáo viên cung cấp:
"""
${lessonPlan}
"""

Yêu cầu đầu ra (Format bằng Markdown, TUYỆT ĐỐI KHÔNG CÓ PHẦN MỞ BÀI HAY KẾT LUẬN, KHÔNG GIẢI THÍCH GÌ THÊM):
Đầu tiên, liệt kê tất cả các năng lực AI đã lồng ghép trong bài. Trình bày chính xác theo dạng:
[Mã năng lực] Chủ đề: Mô tả năng lực (ví dụ: [7.D2.1] Cấu trúc & tương tác, cải tiến hệ thống: Học sinh lập được kế hoạch cho một dự án sáng tạo có sử dụng AI theo nhóm nhỏ...)
(Lưu ý: Mã năng lực được quy ước là [Khối lớp.Ký hiệu chủ đề.Số thứ tự nội dung]. Các Ký hiệu chủ đề CHỈ BAO GỒM: A1, A2, A3, B1, B2, B3, C1, C2, C3, C4, C5, D1, D2. TUYỆT ĐỐI KHÔNG tự bịa ra ký hiệu khác như TA, HC, ET. Ví dụ: Khối 6, Chủ đề A1, nội dung "AI hoạt động theo lập trình" (là nội dung thứ 2 trong A1) thì mã là [6.A1.2])

Sau đó chi tiết nội dung nào. Trình bày theo cấu trúc sau cho mỗi hoạt động:
**Mục tiêu:** [Mục tiêu lồng ghép AI]
**Hoạt động giáo viên:** [Các thao tác của giáo viên]
**Hoạt động học sinh:** [Các thao tác của học sinh]

LƯU Ý ĐẶC BIỆT: 
- ${theme === 'auto' ? 'Tự động chọn ra năng lực AI phù hợp nhất với kế hoạch bài dạy này từ chương trình quy định trong CV 3439.' : `Lồng ghép nội dung giáo dục AI đã chọn (Chủ đề: "${theme}", Nội dung: "${topic}") vào bài dạy.`}
- Ngoài ra tuyệt đối không phân tích và giải thích gì thêm.`;

    const response = await ai.models.generateContent({
      model: 'gemini-3.6-flash',
      contents: prompt,
    });

    res.json({ result: response.text });
  } catch (error: any) {
    console.error('Error analyzing lesson plan:', error);
    res.status(500).json({ error: error.message || 'Có lỗi xảy ra khi xử lý yêu cầu.' });
  }
}
