import express from 'express';
import path from 'path';
import fs from 'fs';
import { createServer as createViteServer } from 'vite';
import { GoogleGenAI } from '@google/genai';

function getGoogleGenAI(req: express.Request) {
  const apiKey = req.headers['x-gemini-api-key'] as string || process.env.GEMINI_API_KEY;
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

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json({ limit: '10mb' }));

  // API Route for analyzing lesson plans
  app.post('/api/analyze', async (req, res) => {
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
  });

  // API Route for scanning lessons in the document
  app.post('/api/scanLessons', async (req, res) => {
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
        // Fallback if parsing fails
        lessons = ["Bài học (Không xác định tên)"];
      }

      res.json({ lessons });
    } catch (error: any) {
      console.error('Error scanning lessons:', error);
      res.status(500).json({ error: error.message || 'Có lỗi xảy ra.' });
    }
  });

  // API Route for checking time duration multiple lessons
  app.post('/api/checkTimeMulti', async (req, res) => {
    try {
      const ai = getGoogleGenAI(req);
      const { lessonPlan, lessonConfigs } = req.body;

      if (!lessonPlan) {
        return res.status(400).json({ error: 'Nội dung kế hoạch bài dạy là bắt buộc.' });
      }

      let configText = '';
      if (lessonConfigs && lessonConfigs.length > 0) {
        configText = "Thông tin số tiết cho từng bài như sau:\n";
        lessonConfigs.forEach((c: any) => {
          configText += `- ${c.name}: ${c.numLessons} tiết (Tổng: ${c.numLessons * 45} phút)\n`;
        });
      } else {
        configText = "Mặc định sử dụng 1 tiết (45 phút) cho bài học nếu không rõ.";
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
  });

  // API Route for integrating other topics (ATGT, BDKH, etc.)
  app.post('/api/integrateOther', async (req, res) => {
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
  });

  // API Route for checking special needs content
  app.post('/api/checkSpecialNeeds', async (req, res) => {
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
  });

  // API Route for analyzing test results
  app.post('/api/analyzeTestResults', async (req, res) => {
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
  });

  // API Route for statistics
  app.post('/api/statistics', async (req, res) => {
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
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
