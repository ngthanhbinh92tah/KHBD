import React, { useState, useRef } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import mammoth from 'mammoth';
import { Upload, BookOpen, Send, Loader2, Sparkles, AlertCircle, FileText, Clock, Heart, BarChart3, Plus, Trash2, Settings, List } from 'lucide-react';

const GRADES = ['Lớp 6', 'Lớp 7', 'Lớp 8', 'Lớp 9'];
const SUBJECTS = [
  'Toán',
  'Hoạt động trải nghiệm, hướng nghiệp'
];
const OTHER_TOPICS = ['An toàn giao thông', 'Biến đổi khí hậu', 'Phòng chống ma túy - thuốc lá', 'Giáo dục quốc phòng an ninh', 'Bảo vệ môi trường', 'Giáo dục địa phương', 'Khác'];

const AI_CURRICULUM: Record<string, Record<string, string[]>> = {
  'Lớp 6': {
    'A. Tư duy lấy con người làm trung tâm': [
      'Con người tạo và điều khiển AI',
      'AI hoạt động theo lập trình',
      'Con người ra quyết định với AI',
      'Học hỏi và phát triển với AI',
      'Quyền sở hữu và quyền riêng tư',
      'Bảo vệ cá nhân trong thời đại AI'
    ],
    'B. Đạo đức AI': [
      'Mặt tốt và mặt xấu của AI',
      'An toàn khi sử dụng AI'
    ],
    'C. Các kĩ thuật và ứng dụng AI': [
      'Các thành phần và cách hoạt động cơ bản của AI',
      'Tác động tích cực và tiêu cực của AI',
      'Làm quen với ứng dụng AI',
      'Một số công nghệ AI quen thuộc và đơn giản'
    ],
    'D. Thiết kế hệ thống AI': [
      'Nên hay không nên sử dụng AI?',
      'Khi nào không nên dùng AI?'
    ]
  },
  'Lớp 7': {
    'A. Tư duy lấy con người làm trung tâm': [
      'Quyền ra quyết định',
      'Xác thực kết quả',
      'Hậu quả khi AI quyết định',
      'Ngăn chặn công cụ AI có hại',
      'Quyền tự chủ của AI và con người',
      'Bảo vệ quyền tự chủ của con người'
    ],
    'B. Đạo đức AI': [
      'Đánh giá và hành động vì một AI tốt đẹp hơn',
      'Trách nhiệm khi sử dụng AI'
    ],
    'C. Các kĩ thuật và ứng dụng AI': [
      'Các khía cạnh đạo đức liên quan đến dữ liệu huấn luyện AI',
      'Tìm hiểu một số cách học của AI'
    ],
    'D. Thiết kế hệ thống AI': [
      'Ý tưởng dự án AI từ thực tiễn',
      'Dự án tạo sản phẩm từ AI'
    ]
  },
  'Lớp 8': {
    'A. Tư duy lấy con người làm trung tâm': [
      'AI không thay thế con người',
      'Rủi ro khi lạm dụng AI',
      'Nguy cơ bị AI kiểm soát',
      'Người dùng và người tạo AI',
      'Trách nhiệm pháp lý',
      'Trách nhiệm giải trình'
    ],
    'B. Đạo đức AI': [
      'Rủi ro với AI',
      'Phòng tránh rủi ro dữ liệu',
      'Trách nhiệm phát triển AI'
    ],
    'C. Các kĩ thuật và ứng dụng AI': [
      'Cách AI thực hiện một số chức năng cơ bản',
      'Cách AI nhận diện cảm xúc'
    ],
    'D. Thiết kế hệ thống AI': [
      'Kế hoạch dự án AI',
      'Dự án AI đơn giản của em'
    ]
  },
  'Lớp 9': {
    'A. Tư duy lấy con người làm trung tâm': [
      'Thách thức xã hội trong kỉ nguyên AI',
      'AI tác động đến xã hội',
      'Thiên vị và thành kiến trong AI',
      'Định hướng học tập trong kỉ nguyên AI',
      'AI giúp thể hiện bản thân',
      'Nghề nghiệp tương lai'
    ],
    'B. Đạo đức AI': [
      'Trách nhiệm khi sử dụng AI',
      'Kiến tạo AI công bằng'
    ],
    'C. Các kĩ thuật và ứng dụng AI': [
      'Thực hành vận dụng AI giải quyết vấn đề, tạo ra sản phẩm',
      'Cách cải thiện dữ liệu, nâng cao chất lượng sản phẩm AI'
    ],
    'D. Thiết kế hệ thống AI': [
      'Con người dẫn dắt AI',
      'Đánh giá và cải tiến sản phẩm AI'
    ]
  }
};

export default function App() {
  const [activeTab, setActiveTab] = useState<'integrate' | 'checkTime' | 'integrateOther' | 'checkSpecialNeeds' | 'analyzeTestResults' | 'statistics'>('integrate');
  const [lessonPlan, setLessonPlan] = useState('');
  const [fileName, setFileName] = useState('');
  const [grade, setGrade] = useState(GRADES[0]); // Default Lớp 6
  const [subject, setSubject] = useState(SUBJECTS[0]);
  const [theme, setTheme] = useState('auto');
  const [topic, setTopic] = useState('auto');
  const [otherTopic, setOtherTopic] = useState(OTHER_TOPICS[0]);
  const [lessonsToCheck, setLessonsToCheck] = useState<{name: string; numLessons: number}[]>([]);
  const [isScanningLessons, setIsScanningLessons] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [result, setResult] = useState('');
  const [error, setError] = useState('');
  const [showSettings, setShowSettings] = useState(false);
  const [apiKey, setApiKey] = useState(() => localStorage.getItem('gemini_api_key') || '');
  const [tempApiKey, setTempApiKey] = useState('');

  const getHeaders = () => {
    const headers: Record<string, string> = { 'Content-Type': 'application/json' };
    if (apiKey) {
      headers['x-gemini-api-key'] = apiKey;
    }
    return headers;
  };

  // Test Results State
  const [classes, setClasses] = useState<{id: string; name: string; totalStudents: number | ''; excellent: number | ''; good: number | ''; average: number | ''; weak: number | ''}[]>([
    { id: '1', name: '', totalStudents: '', excellent: '', good: '', average: '', weak: '' }
  ]);
  
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleGradeChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newGrade = e.target.value;
    setGrade(newGrade);
    if (theme !== 'auto') {
      const firstTheme = Object.keys(AI_CURRICULUM[newGrade] || {})[0];
      if (firstTheme) {
        setTheme(firstTheme);
        setTopic(AI_CURRICULUM[newGrade][firstTheme]?.[0] || 'Khác');
      } else {
        setTheme('');
        setTopic('Khác');
      }
    }
  };

  const handleThemeChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newTheme = e.target.value;
    setTheme(newTheme);
    if (newTheme === 'auto') {
      setTopic('auto');
    } else {
      setTopic(AI_CURRICULUM[grade][newTheme]?.[0] || 'Khác');
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.name.endsWith('.txt') || file.name.endsWith('.md')) {
      const reader = new FileReader();
      reader.onload = (event) => {
        if (event.target?.result) {
          setLessonPlan(event.target.result as string);
          setFileName(file.name);
          setError('');
        }
      };
      reader.readAsText(file);
    } else if (file.name.endsWith('.docx')) {
      try {
        const arrayBuffer = await file.arrayBuffer();
        const result = await mammoth.extractRawText({ arrayBuffer });
        setLessonPlan(result.value);
        setFileName(file.name);
        setError('');
      } catch (err) {
        setError('Lỗi khi đọc file Word. Vui lòng thử copy-paste nội dung.');
      }
    } else {
      setError('Vui lòng tải lên tệp định dạng .txt, .md, hoặc .docx (Word).');
    }
    
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleAnalyze = async () => {
    if (!lessonPlan.trim()) {
      setError('Vui lòng nhập nội dung kế hoạch bài dạy.');
      return;
    }
    
    setIsAnalyzing(true);
    setError('');
    
    try {
      const response = await fetch('/api/analyze', {
        method: 'POST',
        headers: getHeaders(),
        body: JSON.stringify({ lessonPlan, grade, subject, theme, topic }),
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || 'Lỗi kết nối tới máy chủ');
      }
      
      setResult(data.result);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleCheckTime = async () => {
    if (!lessonPlan.trim()) {
      setError('Vui lòng nhập nội dung kế hoạch bài dạy.');
      return;
    }
    
    if (lessonsToCheck.length === 0) {
      setIsScanningLessons(true);
      setError('');
      try {
        const response = await fetch('/api/scanLessons', {
          method: 'POST',
          headers: getHeaders(),
          body: JSON.stringify({ lessonPlan }),
        });
        const data = await response.json();
        if (!response.ok) throw new Error(data.error);
        
        let scanned = data.lessons || [];
        if (scanned.length === 0) {
          scanned = ["Bài học"];
        }
        
        setLessonsToCheck(scanned.map((name: string) => ({ name, numLessons: 1 })));
        
        if (scanned.length > 1) {
          setError('Vui lòng điền số tiết cho từng bài học được phát hiện ở trên, sau đó nhấn Phân bổ thời lượng.');
        } else {
          setError('Đã phát hiện bài học. Vui lòng xác nhận/điều chỉnh số tiết, sau đó nhấn Phân bổ thời lượng.');
        }
      } catch (err: any) {
        setError(err.message);
      } finally {
        setIsScanningLessons(false);
      }
      return;
    }
    
    setIsAnalyzing(true);
    setError('');
    
    try {
      const response = await fetch('/api/checkTimeMulti', {
        method: 'POST',
        headers: getHeaders(),
        body: JSON.stringify({ lessonPlan, lessonConfigs: lessonsToCheck }),
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || 'Lỗi kết nối tới máy chủ');
      }
      
      setResult(data.result);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleIntegrateOther = async () => {
    if (!lessonPlan.trim()) {
      setError('Vui lòng nhập nội dung kế hoạch bài dạy.');
      return;
    }
    
    setIsAnalyzing(true);
    setError('');
    
    try {
      const response = await fetch('/api/integrateOther', {
        method: 'POST',
        headers: getHeaders(),
        body: JSON.stringify({ lessonPlan, topic: otherTopic }),
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || 'Lỗi kết nối tới máy chủ');
      }
      
      setResult(data.result);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleCheckSpecialNeeds = async () => {
    if (!lessonPlan.trim()) {
      setError('Vui lòng nhập nội dung kế hoạch bài dạy.');
      return;
    }
    
    setIsAnalyzing(true);
    setError('');
    
    try {
      const response = await fetch('/api/checkSpecialNeeds', {
        method: 'POST',
        headers: getHeaders(),
        body: JSON.stringify({ lessonPlan }),
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || 'Lỗi kết nối tới máy chủ');
      }
      
      setResult(data.result);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleStatistics = async () => {
    if (!lessonPlan.trim()) {
      setError('Vui lòng nhập nội dung kế hoạch bài dạy.');
      return;
    }
    
    setIsAnalyzing(true);
    setError('');
    
    try {
      const response = await fetch('/api/statistics', {
        method: 'POST',
        headers: getHeaders(),
        body: JSON.stringify({ lessonPlan }),
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || 'Lỗi kết nối tới máy chủ');
      }
      
      setResult(data.result);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleAnalyzeTestResults = async () => {
    for (let i = 0; i < classes.length; i++) {
      const c = classes[i];
      if (!c.totalStudents || c.totalStudents <= 0) {
        setError(`Lớp thứ ${i + 1} (${c.name || 'Không tên'}): Vui lòng nhập tổng số học sinh hợp lệ.`);
        return;
      }
      
      const total = (Number(c.excellent) || 0) + (Number(c.good) || 0) + (Number(c.average) || 0) + (Number(c.weak) || 0);
      if (total !== Number(c.totalStudents)) {
        setError(`Lớp thứ ${i + 1} (${c.name || 'Không tên'}): Tổng số điểm phân loại (${total}) không khớp với tổng số học sinh (${c.totalStudents}).`);
        return;
      }
    }
    
    setIsAnalyzing(true);
    setError('');
    
    try {
      const response = await fetch('/api/analyzeTestResults', {
        method: 'POST',
        headers: getHeaders(),
        body: JSON.stringify({ classes }),
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || 'Lỗi kết nối tới máy chủ');
      }
      
      setResult(data.result);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleSaveApiKey = () => {
    setApiKey(tempApiKey);
    localStorage.setItem('gemini_api_key', tempApiKey);
    setShowSettings(false);
  };

  return (
    <div className="min-h-screen bg-slate-50 font-sans text-slate-800">
      {/* Header */}
      <header className="bg-white border-b border-slate-200 sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-indigo-600 rounded-lg flex items-center justify-center text-white shrink-0">
              <Sparkles className="w-6 h-6" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-slate-900 leading-tight">AI Trợ Giảng</h1>
              <p className="text-sm text-slate-500">Hệ thống lồng ghép AI vào Kế hoạch bài dạy (CV 3439)</p>
            </div>
          </div>
          <button 
            onClick={() => {
              setTempApiKey(apiKey);
              setShowSettings(true);
            }}
            className="p-2 text-slate-500 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors"
            title="Cài đặt API Key"
          >
            <Settings className="w-5 h-5" />
          </button>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex border-b border-slate-200 mb-8">
          <button
            className={`px-6 py-3 font-medium text-sm flex items-center gap-2 border-b-2 transition-colors ${
              activeTab === 'integrate' 
                ? 'border-indigo-600 text-indigo-600' 
                : 'border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300'
            }`}
            onClick={() => { setActiveTab('integrate'); setResult(''); setError(''); }}
          >
            <Sparkles className="w-4 h-4" />
            Lồng ghép AI
          </button>
          <button
            className={`px-6 py-3 font-medium text-sm flex items-center gap-2 border-b-2 transition-colors ${
              activeTab === 'checkTime' 
                ? 'border-indigo-600 text-indigo-600' 
                : 'border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300'
            }`}
            onClick={() => { setActiveTab('checkTime'); setResult(''); setError(''); }}
          >
            <Clock className="w-4 h-4" />
            Kiểm tra thời lượng
          </button>
          <button
            className={`px-6 py-3 font-medium text-sm flex items-center gap-2 border-b-2 transition-colors ${
              activeTab === 'integrateOther' 
                ? 'border-indigo-600 text-indigo-600' 
                : 'border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300'
            }`}
            onClick={() => { setActiveTab('integrateOther'); setResult(''); setError(''); }}
          >
            <BookOpen className="w-4 h-4" />
            Lồng ghép nội dung khác
          </button>
          <button
            className={`px-6 py-3 font-medium text-sm flex items-center gap-2 border-b-2 transition-colors ${
              activeTab === 'checkSpecialNeeds' 
                ? 'border-indigo-600 text-indigo-600' 
                : 'border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300'
            }`}
            onClick={() => { setActiveTab('checkSpecialNeeds'); setResult(''); setError(''); }}
          >
            <Heart className="w-4 h-4" />
            Nội dung khuyết tật trí tuệ
          </button>
          <button
            className={`px-6 py-3 font-medium text-sm flex items-center gap-2 border-b-2 transition-colors ${
              activeTab === 'analyzeTestResults' 
                ? 'border-indigo-600 text-indigo-600' 
                : 'border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300'
            }`}
            onClick={() => { setActiveTab('analyzeTestResults'); setResult(''); setError(''); }}
          >
            <BarChart3 className="w-4 h-4" />
            Thống kê bài kiểm tra
          </button>
          <button
            className={`px-6 py-3 font-medium text-sm flex items-center gap-2 border-b-2 transition-colors ${
              activeTab === 'statistics' 
                ? 'border-indigo-600 text-indigo-600' 
                : 'border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300'
            }`}
            onClick={() => { setActiveTab('statistics'); setResult(''); setError(''); }}
          >
            <List className="w-4 h-4" />
            Thống kê bài học
          </button>
        </div>

        <div className="flex flex-col lg:flex-row gap-8">
          
          {/* Left Column: Input Form */}
          <div className="w-full lg:w-1/2 flex flex-col gap-6">
            {activeTab !== 'analyzeTestResults' && (
              <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
                <div className="flex justify-between items-end mb-4">
                  <h2 className="text-lg font-semibold flex items-center gap-2">
                    <FileText className="w-5 h-5 text-indigo-600" />
                    Nội dung Kế hoạch bài dạy (Giáo án)
                  </h2>
                  <div>
                    <input 
                      type="file" 
                      accept=".txt,.md,.docx" 
                      ref={fileInputRef}
                      onChange={handleFileUpload}
                      className="hidden" 
                    />
                    <button 
                      onClick={() => fileInputRef.current?.click()}
                      className="text-sm flex items-center gap-1.5 text-indigo-600 hover:text-indigo-700 font-medium transition-colors"
                    >
                      <Upload className="w-4 h-4" />
                      Tải lên file (.txt, .docx)
                    </button>
                  </div>
                </div>
                {lessonPlan && fileName ? (
                  <div className="w-full p-4 bg-emerald-50 border border-emerald-200 rounded-lg flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <FileText className="w-6 h-6 text-emerald-600" />
                      <div>
                        <p className="font-medium text-emerald-900">{fileName}</p>
                        <p className="text-xs text-emerald-600">Đã tải nội dung thành công ({lessonPlan.length} ký tự)</p>
                      </div>
                    </div>
                    <button onClick={() => { setLessonPlan(''); setFileName(''); setLessonsToCheck([]); }} className="text-sm text-emerald-700 hover:text-emerald-800 font-medium px-2 py-1 bg-emerald-100 rounded">Xóa</button>
                  </div>
                ) : (
                  <textarea
                    value={lessonPlan}
                    onChange={(e) => { setLessonPlan(e.target.value); setFileName(''); setLessonsToCheck([]); }}
                    placeholder="Dán toàn bộ nội dung giáo án vào đây, hoặc nhấn 'Tải lên file' để đọc từ tệp văn bản (.txt) hoặc Word (.docx)..."
                    className="w-full p-4 bg-slate-50 border border-slate-200 rounded-lg resize-none focus:outline-none focus:ring-2 focus:ring-indigo-500 font-mono text-sm h-[200px]"
                  />
                )}
              </div>
            )}

            <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
              <h2 className="text-lg font-semibold flex items-center gap-2 mb-6">
                <BookOpen className="w-5 h-5 text-indigo-600" />
                {activeTab === 'integrate' ? 'Thông tin bài dạy & Lồng ghép AI' : activeTab === 'checkTime' ? 'Thông tin bài dạy & Kiểm tra thời lượng' : activeTab === 'integrateOther' ? 'Lồng ghép chuyên đề khác' : activeTab === 'checkSpecialNeeds' ? 'Kiểm tra nội dung học sinh hòa nhập' : activeTab === 'analyzeTestResults' ? 'Thống kê kết quả kiểm tra' : 'Thống kê bài học'}
              </h2>
              
              {activeTab === 'integrate' ? (
                <>
                  <div className="grid grid-cols-2 gap-4 mb-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Cấp lớp</label>
                  <select 
                    value={grade} 
                    onChange={handleGradeChange}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  >
                    {GRADES.map(g => <option key={g} value={g}>{g}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Môn học</label>
                  <select 
                    value={subject} 
                    onChange={(e) => setSubject(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  >
                    {SUBJECTS.map(s => <option key={s} value={s}>{s}</option>)}
                  </select>
                </div>
              </div>

              <div className="mb-4">
                <label className="block text-sm font-medium text-slate-700 mb-1">Chủ đề giáo dục AI</label>
                <select 
                  value={theme} 
                  onChange={handleThemeChange}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                >
                  <option value="auto">✨ Tự động phân tích và chọn phù hợp nhất</option>
                  {Object.keys(AI_CURRICULUM[grade] || {}).map(t => <option key={t} value={t}>{t}</option>)}
                </select>
              </div>

              <div className="mb-6">
                <label className="block text-sm font-medium text-slate-700 mb-1">Nội dung lồng ghép</label>
                <select 
                  value={topic} 
                  onChange={(e) => setTopic(e.target.value)}
                  disabled={theme === 'auto'}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <option value="auto">✨ Tự động phân tích và chọn phù hợp nhất</option>
                  {theme !== 'auto' && (AI_CURRICULUM[grade]?.[theme] || []).map(t => <option key={t} value={t}>{t}</option>)}
                </select>
              </div>

                </>
              ) : activeTab === 'checkTime' ? (
                <div className="mb-6">
                  {lessonsToCheck.length > 0 ? (
                    <div>
                      <div className="flex justify-between items-center mb-2">
                        <label className="block text-sm font-medium text-slate-700">Thông tin các bài học đã phát hiện</label>
                        <button onClick={() => setLessonsToCheck([])} className="text-xs text-indigo-600 hover:text-indigo-800">Quét lại</button>
                      </div>
                      <div className="space-y-3 max-h-48 overflow-y-auto pr-1 custom-scrollbar">
                        {lessonsToCheck.map((lesson, idx) => (
                          <div key={idx} className="flex items-center justify-between gap-3 p-3 bg-slate-50 border border-slate-200 rounded-lg">
                            <span className="text-sm font-medium text-slate-700 flex-1 truncate" title={lesson.name}>{lesson.name}</span>
                            <div className="flex items-center gap-2">
                              <span className="text-xs text-slate-500 whitespace-nowrap">Số tiết:</span>
                              <input 
                                type="number" 
                                min="1" 
                                value={lesson.numLessons} 
                                onChange={(e) => {
                                  const newLessons = [...lessonsToCheck];
                                  newLessons[idx].numLessons = parseInt(e.target.value) || 1;
                                  setLessonsToCheck(newLessons);
                                }}
                                className="w-16 px-2 py-1 bg-white border border-slate-200 rounded focus:outline-none focus:ring-1 focus:ring-indigo-500 text-center"
                              />
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  ) : (
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-2">Số tiết của bài học</label>
                      <p className="text-sm text-slate-600 bg-slate-50 border border-slate-200 p-3 rounded-lg">
                        Hệ thống sẽ tự động quét giáo án để đếm số bài dạy và yêu cầu bạn nhập số tiết tương ứng cho từng bài để phân bổ thời gian. Nhấn nút <strong>"Quét bài học trong giáo án"</strong> bên dưới.
                      </p>
                    </div>
                  )}
                </div>
              ) : activeTab === 'integrateOther' ? (
                <div className="mb-6">
                  <label className="block text-sm font-medium text-slate-700 mb-1">Chuyên đề cần lồng ghép</label>
                  <select 
                    value={otherTopic} 
                    onChange={(e) => setOtherTopic(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  >
                    {OTHER_TOPICS.map(t => <option key={t} value={t}>{t}</option>)}
                  </select>
                </div>
              ) : activeTab === 'analyzeTestResults' ? (
                <div className="mb-6">
                  <div className="flex justify-between items-center mb-3">
                    <label className="block text-sm font-medium text-slate-700">Dữ liệu các lớp</label>
                    <button
                      onClick={() => setClasses([...classes, { id: Date.now().toString(), name: '', totalStudents: '', excellent: '', good: '', average: '', weak: '' }])}
                      className="text-sm flex items-center gap-1.5 text-indigo-600 hover:text-indigo-700 font-medium transition-colors"
                    >
                      <Plus className="w-4 h-4" />
                      Thêm lớp
                    </button>
                  </div>
                  <div className="overflow-x-auto rounded-lg border border-slate-200">
                    <table className="w-full text-sm text-left">
                      <thead className="bg-slate-50 text-slate-600 border-b border-slate-200">
                        <tr>
                          <th className="px-3 py-2 font-medium">Tên Lớp</th>
                          <th className="px-3 py-2 font-medium text-center">Sĩ số</th>
                          <th className="px-3 py-2 font-medium text-center">Giỏi</th>
                          <th className="px-3 py-2 font-medium text-center">Khá</th>
                          <th className="px-3 py-2 font-medium text-center">TB</th>
                          <th className="px-3 py-2 font-medium text-center">Yếu/Kém</th>
                          <th className="px-3 py-2 font-medium text-center w-10"></th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-200">
                        {classes.map((cls, index) => (
                          <tr key={cls.id} className="bg-white">
                            <td className="px-2 py-2">
                              <input 
                                type="text"
                                placeholder="VD: 6A1"
                                value={cls.name}
                                onChange={(e) => {
                                  const newClasses = [...classes];
                                  newClasses[index].name = e.target.value;
                                  setClasses(newClasses);
                                }}
                                className="w-full px-2 py-1.5 bg-slate-50 border border-slate-200 rounded focus:outline-none focus:ring-1 focus:ring-indigo-500"
                              />
                            </td>
                            <td className="px-2 py-2">
                              <input 
                                type="number" min="1"
                                value={cls.totalStudents}
                                onChange={(e) => {
                                  const newClasses = [...classes];
                                  newClasses[index].totalStudents = e.target.value === '' ? '' : parseInt(e.target.value);
                                  setClasses(newClasses);
                                }}
                                className="w-16 px-2 py-1.5 bg-slate-50 border border-slate-200 rounded focus:outline-none focus:ring-1 focus:ring-indigo-500 text-center mx-auto block"
                              />
                            </td>
                            <td className="px-2 py-2">
                              <input 
                                type="number" min="0"
                                value={cls.excellent}
                                onChange={(e) => {
                                  const newClasses = [...classes];
                                  newClasses[index].excellent = e.target.value === '' ? '' : parseInt(e.target.value);
                                  setClasses(newClasses);
                                }}
                                className="w-14 px-2 py-1.5 bg-slate-50 border border-slate-200 rounded focus:outline-none focus:ring-1 focus:ring-indigo-500 text-center mx-auto block"
                              />
                            </td>
                            <td className="px-2 py-2">
                              <input 
                                type="number" min="0"
                                value={cls.good}
                                onChange={(e) => {
                                  const newClasses = [...classes];
                                  newClasses[index].good = e.target.value === '' ? '' : parseInt(e.target.value);
                                  setClasses(newClasses);
                                }}
                                className="w-14 px-2 py-1.5 bg-slate-50 border border-slate-200 rounded focus:outline-none focus:ring-1 focus:ring-indigo-500 text-center mx-auto block"
                              />
                            </td>
                            <td className="px-2 py-2">
                              <input 
                                type="number" min="0"
                                value={cls.average}
                                onChange={(e) => {
                                  const newClasses = [...classes];
                                  newClasses[index].average = e.target.value === '' ? '' : parseInt(e.target.value);
                                  setClasses(newClasses);
                                }}
                                className="w-14 px-2 py-1.5 bg-slate-50 border border-slate-200 rounded focus:outline-none focus:ring-1 focus:ring-indigo-500 text-center mx-auto block"
                              />
                            </td>
                            <td className="px-2 py-2">
                              <input 
                                type="number" min="0"
                                value={cls.weak}
                                onChange={(e) => {
                                  const newClasses = [...classes];
                                  newClasses[index].weak = e.target.value === '' ? '' : parseInt(e.target.value);
                                  setClasses(newClasses);
                                }}
                                className="w-14 px-2 py-1.5 bg-slate-50 border border-slate-200 rounded focus:outline-none focus:ring-1 focus:ring-indigo-500 text-center mx-auto block"
                              />
                            </td>
                            <td className="px-2 py-2 text-center">
                              {classes.length > 1 && (
                                <button 
                                  onClick={() => setClasses(classes.filter((_, i) => i !== index))}
                                  className="p-1.5 text-slate-400 hover:text-red-500 rounded transition-colors"
                                  title="Xóa lớp"
                                >
                                  <Trash2 className="w-4 h-4" />
                                </button>
                              )}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              ) : null}
              
              {error && (
                <div className="mt-4 p-3 bg-red-50 text-red-700 rounded-lg flex items-start gap-2 text-sm border border-red-100">
                  <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                  <p>{error}</p>
                </div>
              )}

              <button
                onClick={activeTab === 'integrate' ? handleAnalyze : activeTab === 'checkTime' ? handleCheckTime : activeTab === 'integrateOther' ? handleIntegrateOther : activeTab === 'checkSpecialNeeds' ? handleCheckSpecialNeeds : activeTab === 'analyzeTestResults' ? handleAnalyzeTestResults : handleStatistics}
                disabled={isAnalyzing || isScanningLessons}
                className="mt-6 w-full py-3 px-4 bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-400 text-white font-medium rounded-lg shadow-sm flex items-center justify-center gap-2 transition-colors"
              >
                {isAnalyzing || isScanningLessons ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    {isScanningLessons ? 'Đang quét bài học...' : 'Đang xử lý...'}
                  </>
                ) : activeTab === 'integrate' ? (
                  <>
                    <Send className="w-5 h-5" />
                    Phân tích & Lồng ghép AI
                  </>
                ) : activeTab === 'checkTime' ? (
                  <>
                    <Clock className="w-5 h-5" />
                    {lessonsToCheck.length === 0 ? 'Quét bài học trong giáo án' : 'Phân bổ thời lượng'}
                  </>
                ) : activeTab === 'integrateOther' ? (
                  <>
                    <BookOpen className="w-5 h-5" />
                    Lồng ghép chuyên đề
                  </>
                ) : activeTab === 'checkSpecialNeeds' ? (
                  <>
                    <Heart className="w-5 h-5" />
                    Kiểm tra nội dung HSHN
                  </>
                ) : activeTab === 'analyzeTestResults' ? (
                  <>
                    <BarChart3 className="w-5 h-5" />
                    Phân tích kết quả
                  </>
                ) : (
                  <>
                    <List className="w-5 h-5" />
                    Thống kê bài học
                  </>
                )}
              </button>
            </div>
          </div>

          {/* Right Column: Results */}
          <div className="w-full lg:w-1/2 flex flex-col">
            <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 flex-1 h-[670px] overflow-hidden flex flex-col">
              <h2 className="text-lg font-semibold flex items-center gap-2 mb-4 shrink-0 border-b border-slate-100 pb-4">
                <FileText className="w-5 h-5 text-emerald-600" />
                {activeTab === 'integrate' ? 'Kết quả phân tích & Gợi ý' : activeTab === 'checkTime' ? 'Kết quả kiểm tra thời lượng' : activeTab === 'integrateOther' ? 'Kết quả lồng ghép chuyên đề' : activeTab === 'checkSpecialNeeds' ? 'Kết quả kiểm tra nội dung HSHN' : activeTab === 'analyzeTestResults' ? 'Kết quả nhận xét bài kiểm tra' : 'Thống kê kết quả'}
              </h2>
              
              <div className="flex-1 overflow-y-auto pr-2 custom-scrollbar">
                {result ? (
                  <div className="prose prose-slate prose-sm sm:prose-base max-w-none prose-headings:text-indigo-900 prose-a:text-indigo-600">
                    <ReactMarkdown remarkPlugins={[remarkGfm]}>
                      {result}
                    </ReactMarkdown>
                  </div>
                ) : (
                  <div className="h-full flex flex-col items-center justify-center text-slate-400 gap-4">
                    {activeTab === 'integrate' ? (
                      <>
                        <Sparkles className="w-12 h-12 text-slate-200" />
                        <p className="text-center max-w-xs">
                          Kết quả gợi ý lồng ghép AI theo tiêu chí CV 3439 sẽ xuất hiện tại đây sau khi phân tích.
                        </p>
                      </>
                    ) : activeTab === 'checkTime' ? (
                      <>
                        <Clock className="w-12 h-12 text-slate-200" />
                        <p className="text-center max-w-xs">
                          Kết quả thống kê thời gian các hoạt động trong giáo án sẽ xuất hiện tại đây.
                        </p>
                      </>
                    ) : activeTab === 'integrateOther' ? (
                      <>
                        <BookOpen className="w-12 h-12 text-slate-200" />
                        <p className="text-center max-w-xs">
                          Kết quả gợi ý lồng ghép chuyên đề sẽ xuất hiện tại đây sau khi phân tích.
                        </p>
                      </>
                    ) : activeTab === 'checkSpecialNeeds' ? (
                      <>
                        <Heart className="w-12 h-12 text-slate-200" />
                        <p className="text-center max-w-xs">
                          Kết quả kiểm tra nội dung dành cho học sinh khuyết tật trí tuệ (HSHN/HSKT) sẽ xuất hiện tại đây.
                        </p>
                      </>
                    ) : activeTab === 'analyzeTestResults' ? (
                      <>
                        <BarChart3 className="w-12 h-12 text-slate-200" />
                        <p className="text-center max-w-xs">
                          Kết quả thống kê, nhận xét và đề xuất biện pháp cho bài kiểm tra sẽ xuất hiện tại đây.
                        </p>
                      </>
                    ) : (
                      <>
                        <List className="w-12 h-12 text-slate-200" />
                        <p className="text-center max-w-xs">
                          Kết quả thống kê tên bài, số tiết và số tuần của các bài trong giáo án sẽ xuất hiện tại đây.
                        </p>
                      </>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>
          
        </div>
      </main>

      {/* Settings Modal */}
      {showSettings && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-md overflow-hidden">
            <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between">
              <h2 className="text-lg font-semibold text-slate-800 flex items-center gap-2">
                <Settings className="w-5 h-5 text-indigo-600" />
                Cài đặt
              </h2>
              <button 
                onClick={() => setShowSettings(false)}
                className="text-slate-400 hover:text-slate-600"
              >
                &times;
              </button>
            </div>
            <div className="p-6">
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Gemini API Key
              </label>
              <input
                type="password"
                value={tempApiKey}
                onChange={(e) => setTempApiKey(e.target.value)}
                placeholder="Nhập API Key của bạn..."
                className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 font-mono text-sm"
              />
              <p className="mt-2 text-xs text-slate-500">
                Khóa API sẽ được lưu cục bộ trên trình duyệt của bạn (localStorage).
              </p>
            </div>
            <div className="px-6 py-4 border-t border-slate-200 bg-slate-50 flex justify-end gap-3">
              <button 
                onClick={() => setShowSettings(false)}
                className="px-4 py-2 text-sm font-medium text-slate-700 hover:text-slate-900 bg-white border border-slate-300 rounded-lg shadow-sm hover:bg-slate-50"
              >
                Hủy
              </button>
              <button 
                onClick={handleSaveApiKey}
                className="px-4 py-2 text-sm font-medium text-white bg-indigo-600 rounded-lg shadow-sm hover:bg-indigo-700"
              >
                Lưu cài đặt
              </button>
            </div>
          </div>
        </div>
      )}

      <style dangerouslySetInnerHTML={{__html: `
        .custom-scrollbar::-webkit-scrollbar {
          width: 6px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: #f1f5f9; 
          border-radius: 4px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: #cbd5e1; 
          border-radius: 4px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: #94a3b8; 
        }
      `}} />
    </div>
  );
}
