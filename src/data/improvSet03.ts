import { ImprovPackage } from '../types/improv';

// Helper types matching CHUNKS data contracts
interface HintDef {
  text: string;
  translation: string;
  typeFunction: string;
}

interface ItemDef {
  hints: HintDef[];
}

// -------------------------------------------------------------
// Set 03 • Rendezvous (Business Deals & Workplace Reflex)
// Based on LEVEL_B_ERES (level_b_eres_day_5)
// -------------------------------------------------------------

// Session 1: 30 items, hcTotal = 2, hintTypes: ['Keyword', 'Ending']
const s1_items: ItemDef[] = [
  {
    hints: [
        { text: 'Đàm phán', translation: 'negotiate', typeFunction: 'Động từ · Keyword' },
        { text: 'căng thẳng', translation: 'tense', typeFunction: 'Tính từ · Ending' }
    ]
  },
  {
    hints: [
        { text: 'Thư cảnh cáo', translation: 'warning letter', typeFunction: 'Danh từ · Keyword' },
        { text: 'gửi đi', translation: 'sent out', typeFunction: 'Động từ · Ending' }
    ]
  },
  {
    hints: [
        { text: 'Ngân sách', translation: 'budget', typeFunction: 'Danh từ · Keyword' },
        { text: 'cạn kiệt', translation: 'run out', typeFunction: 'Động từ · Ending' }
    ]
  },
  {
    hints: [
        { text: 'Sếp trực tiếp', translation: 'line manager', typeFunction: 'Danh từ · Keyword' },
        { text: 'phê duyệt', translation: 'approve', typeFunction: 'Động từ · Ending' }
    ]
  },
  {
    hints: [
        { text: 'Ban giám đốc', translation: 'board of directors', typeFunction: 'Danh từ · Keyword' },
        { text: 'họp khẩn', translation: 'emergency meeting', typeFunction: 'Danh từ · Ending' }
    ]
  },
  {
    hints: [
        { text: 'Đất quy hoạch', translation: 'developed land', typeFunction: 'Danh từ · Keyword' },
        { text: 'đầu tư', translation: 'invest', typeFunction: 'Động từ · Ending' }
    ]
  },
  {
    hints: [
        { text: 'Nút thắt cổ chai', translation: 'bottleneck', typeFunction: 'Danh từ · Keyword' },
        { text: 'tháo gỡ', translation: 'resolve', typeFunction: 'Động từ · Ending' }
    ]
  },
  {
    hints: [
        { text: 'Email khẩn', translation: 'urgent email', typeFunction: 'Danh từ · Keyword' },
        { text: 'trả lời ngay', translation: 'reply promptly', typeFunction: 'Động từ · Ending' }
    ]
  },
  {
    hints: [
        { text: 'Cổ phiếu', translation: 'shares / stock', typeFunction: 'Danh từ · Keyword' },
        { text: 'sụt giảm', translation: 'plummet', typeFunction: 'Động từ · Ending' }
    ]
  },
  {
    hints: [
        { text: 'Đối tác chiến lược', translation: 'strategic partner', typeFunction: 'Danh từ · Keyword' },
        { text: 'ký kết', translation: 'sign off', typeFunction: 'Động từ · Ending' }
    ]
  },
  {
    hints: [
        { text: 'Có năng lực', translation: 'competent', typeFunction: 'Tính từ · Keyword' },
        { text: 'thăng tiến', translation: 'promoted', typeFunction: 'Động từ · Ending' }
    ]
  },
  {
    hints: [
        { text: 'Sếp cũ', translation: 'former boss', typeFunction: 'Danh từ · Keyword' },
        { text: 'liên lạc', translation: 'reach out', typeFunction: 'Động từ · Ending' }
    ]
  },
  {
    hints: [
        { text: 'Trợ cấp bên lề', translation: 'fringe benefit', typeFunction: 'Danh từ · Keyword' },
        { text: 'hấp dẫn', translation: 'attractive', typeFunction: 'Tính từ · Ending' }
    ]
  },
  {
    hints: [
        { text: 'Chuyên môn', translation: 'expertise', typeFunction: 'Danh từ · Keyword' },
        { text: 'đánh giá cao', translation: 'highly valued', typeFunction: 'Động từ · Ending' }
    ]
  },
  {
    hints: [
        { text: 'Biểu đồ tròn', translation: 'pie chart', typeFunction: 'Danh từ · Keyword' },
        { text: 'trình bày', translation: 'present', typeFunction: 'Động từ · Ending' }
    ]
  },
  {
    hints: [
        { text: 'Thâm niên', translation: 'seniority', typeFunction: 'Danh từ · Keyword' },
        { text: 'ưu tiên', translation: 'prioritized', typeFunction: 'Động từ · Ending' }
    ]
  },
  {
    hints: [
        { text: 'Bức tranh tài chính', translation: 'financial picture', typeFunction: 'Danh từ · Keyword' },
        { text: 'khởi sắc', translation: 'promising', typeFunction: 'Tính từ · Ending' }
    ]
  },
  {
    hints: [
        { text: 'Nhà tài trợ', translation: 'sponsor', typeFunction: 'Danh từ · Keyword' },
        { text: 'rút lui', translation: 'withdraw', typeFunction: 'Động từ · Ending' }
    ]
  },
  {
    hints: [
        { text: 'Cuộc cãi lộn', translation: 'heated argument', typeFunction: 'Danh từ · Keyword' },
        { text: 'bùng nổ', translation: 'break out', typeFunction: 'Động từ · Ending' }
    ]
  },
  {
    hints: [
        { text: 'Tình huống khó xử', translation: 'awkward dilemma', typeFunction: 'Danh từ · Keyword' },
        { text: 'né tránh', translation: 'avoid', typeFunction: 'Động từ · Ending' }
    ]
  },
  {
    hints: [
        { text: 'Hợp cạ', translation: 'compatible', typeFunction: 'Tính từ · Keyword' },
        { text: 'làm việc chung', translation: 'collaborate', typeFunction: 'Động từ · Ending' }
    ]
  },
  {
    hints: [
        { text: 'Lập trình viên IT', translation: 'IT developer', typeFunction: 'Danh từ · Keyword' },
        { text: 'tuyển gấp', translation: 'recruit urgently', typeFunction: 'Động từ · Ending' }
    ]
  },
  {
    hints: [
        { text: 'Show thực tế', translation: 'reality show', typeFunction: 'Danh từ · Keyword' },
        { text: 'tài trợ', translation: 'sponsor', typeFunction: 'Động từ · Ending' }
    ]
  },
  {
    hints: [
        { text: 'Nhà máy sản xuất', translation: 'production plant', typeFunction: 'Danh từ · Keyword' },
        { text: 'vận hành', translation: 'operate', typeFunction: 'Động từ · Ending' }
    ]
  },
  {
    hints: [
        { text: 'Đất công', translation: 'public land', typeFunction: 'Danh từ · Keyword' },
        { text: 'đấu thầu', translation: 'bid', typeFunction: 'Động từ · Ending' }
    ]
  },
  {
    hints: [
        { text: 'Email lừa đảo', translation: 'phishing email', typeFunction: 'Danh từ · Keyword' },
        { text: 'cảnh giác', translation: 'watch out', typeFunction: 'Động từ · Ending' }
    ]
  },
  {
    hints: [
        { text: 'Chướng ngại vật', translation: 'roadblock', typeFunction: 'Danh từ · Keyword' },
        { text: 'vượt qua', translation: 'overcome', typeFunction: 'Động từ · Ending' }
    ]
  },
  {
    hints: [
        { text: 'Dự án trọng điểm', translation: 'flagship project', typeFunction: 'Danh từ · Keyword' },
        { text: 'chấm dứt', translation: 'terminate', typeFunction: 'Động từ · Ending' }
    ]
  },
  {
    hints: [
        { text: 'Tầm nhìn hạn hẹp', translation: 'tunnel vision', typeFunction: 'Danh từ · Keyword' },
        { text: 'thay đổi', translation: 'change', typeFunction: 'Động từ · Ending' }
    ]
  },
  {
    hints: [
        { text: 'Hợp đồng mới', translation: 'new contract', typeFunction: 'Danh từ · Keyword' },
        { text: 'hoàn tất', translation: 'finalize', typeFunction: 'Động từ · Ending' }
    ]
  }
];

// Session 2: 30 items, hcTotal = 3, hintTypes: ['Keyword', 'Logic word', 'Ending']
const s2_items: ItemDef[] = [
  {
    hints: [
        { text: 'Ngân sách hạn hẹp', translation: 'tight budget', typeFunction: 'Danh từ · Keyword' },
        { text: 'tuy nhiên', translation: 'however', typeFunction: 'Từ nối · Logic word' },
        { text: 'khả thi', translation: 'feasible', typeFunction: 'Tính từ · Ending' }
    ]
  },
  {
    hints: [
        { text: 'Kế hoạch đàm phán', translation: 'negotiation plan', typeFunction: 'Danh từ · Keyword' },
        { text: 'trước đó', translation: 'before that', typeFunction: 'Từ nối · Logic word' },
        { text: 'chuẩn bị kỹ', translation: 'well prepared', typeFunction: 'Tính từ · Ending' }
    ]
  },
  {
    hints: [
        { text: 'Sếp trực tiếp', translation: 'direct manager', typeFunction: 'Danh từ · Keyword' },
        { text: 'do đó', translation: 'therefore', typeFunction: 'Từ nối · Logic word' },
        { text: 'nhắc nhở', translation: 'remind', typeFunction: 'Động từ · Ending' }
    ]
  },
  {
    hints: [
        { text: 'Nút thắt cổ chai', translation: 'bottleneck', typeFunction: 'Danh từ · Keyword' },
        { text: 'ngoài ra', translation: 'in addition', typeFunction: 'Từ nối · Logic word' },
        { text: 'giải quyết xong', translation: 'settled', typeFunction: 'Tính từ · Ending' }
    ]
  },
  {
    hints: [
        { text: 'Hợp đồng đối tác', translation: 'partner contract', typeFunction: 'Danh từ · Keyword' },
        { text: 'đồng thời', translation: 'meanwhile', typeFunction: 'Từ nối · Logic word' },
        { text: 'rà soát lại', translation: 'review', typeFunction: 'Động từ · Ending' }
    ]
  },
  {
    hints: [
        { text: 'Báo cáo tài chính', translation: 'financial report', typeFunction: 'Danh từ · Keyword' },
        { text: 'nếu không', translation: 'otherwise', typeFunction: 'Từ nối · Logic word' },
        { text: 'bị khiển trách', translation: 'reprimanded', typeFunction: 'Tính từ · Ending' }
    ]
  },
  {
    hints: [
        { text: 'Thư cảnh cáo', translation: 'warning letter', typeFunction: 'Danh từ · Keyword' },
        { text: 'hơn nữa', translation: 'moreover', typeFunction: 'Từ nối · Logic word' },
        { text: 'nghiêm trọng', translation: 'serious', typeFunction: 'Tính từ · Ending' }
    ]
  },
  {
    hints: [
        { text: 'Đất quy hoạch', translation: 'developed land', typeFunction: 'Danh từ · Keyword' },
        { text: 'miễn là', translation: 'as long as', typeFunction: 'Từ nối · Logic word' },
        { text: 'sinh lời', translation: 'profitable', typeFunction: 'Tính từ · Ending' }
    ]
  },
  {
    hints: [
        { text: 'Cổ phiếu nội bộ', translation: 'company shares', typeFunction: 'Danh từ · Keyword' },
        { text: 'dù vậy', translation: 'nevertheless', typeFunction: 'Từ nối · Logic word' },
        { text: 'giữ lại', translation: 'hold on', typeFunction: 'Động từ · Ending' }
    ]
  },
  {
    hints: [
        { text: 'Biểu đồ doanh thu', translation: 'revenue chart', typeFunction: 'Danh từ · Keyword' },
        { text: 'ví dụ', translation: 'for example', typeFunction: 'Từ nối · Logic word' },
        { text: 'tăng trưởng', translation: 'grow steadily', typeFunction: 'Động từ · Ending' }
    ]
  },
  {
    hints: [
        { text: 'Trợ cấp thâm niên', translation: 'seniority allowance', typeFunction: 'Danh từ · Keyword' },
        { text: 'sau cùng', translation: 'eventually', typeFunction: 'Từ nối · Logic word' },
        { text: 'thông qua', translation: 'approved', typeFunction: 'Tính từ · Ending' }
    ]
  },
  {
    hints: [
        { text: 'Nhân viên có năng lực', translation: 'competent staff', typeFunction: 'Danh từ · Keyword' },
        { text: 'bởi vì', translation: 'because', typeFunction: 'Từ nối · Logic word' },
        { text: 'giữ chân', translation: 'retain', typeFunction: 'Động từ · Ending' }
    ]
  },
  {
    hints: [
        { text: 'Dự án mở rộng', translation: 'expansion project', typeFunction: 'Danh từ · Keyword' },
        { text: 'tiếp theo', translation: 'next', typeFunction: 'Từ nối · Logic word' },
        { text: 'triển khai', translation: 'roll out', typeFunction: 'Động từ · Ending' }
    ]
  },
  {
    hints: [
        { text: 'Ban giám đốc', translation: 'board members', typeFunction: 'Danh từ · Keyword' },
        { text: 'nói cách khác', translation: 'in other words', typeFunction: 'Từ nối · Logic word' },
        { text: 'đồng thuận', translation: 'unanimous', typeFunction: 'Tính từ · Ending' }
    ]
  },
  {
    hints: [
        { text: 'Email khẩn', translation: 'urgent email', typeFunction: 'Danh từ · Keyword' },
        { text: 'sau đó', translation: 'then', typeFunction: 'Từ nối · Logic word' },
        { text: 'phản hồi', translation: 'respond', typeFunction: 'Động từ · Ending' }
    ]
  },
  {
    hints: [
        { text: 'Cuộc họp bất thường', translation: 'emergency meeting', typeFunction: 'Danh từ · Keyword' },
        { text: 'trái lại', translation: 'in contrast', typeFunction: 'Từ nối · Logic word' },
        { text: 'suôn sẻ', translation: 'smooth', typeFunction: 'Tính từ · Ending' }
    ]
  },
  {
    hints: [
        { text: 'Tình huống khó xử', translation: 'awkward dilemma', typeFunction: 'Danh từ · Keyword' },
        { text: 'thay vào đó', translation: 'instead', typeFunction: 'Từ nối · Logic word' },
        { text: 'thỏa hiệp', translation: 'compromise', typeFunction: 'Động từ · Ending' }
    ]
  },
  {
    hints: [
        { text: 'Chi phí phát sinh', translation: 'extra expense', typeFunction: 'Danh từ · Keyword' },
        { text: 'tóm lại', translation: 'in short', typeFunction: 'Từ nối · Logic word' },
        { text: 'vượt mức', translation: 'over budget', typeFunction: 'Tính từ · Ending' }
    ]
  },
  {
    hints: [
        { text: 'Đối tác tiềm năng', translation: 'potential partner', typeFunction: 'Danh từ · Keyword' },
        { text: 'mặc dù', translation: 'although', typeFunction: 'Từ nối · Logic word' },
        { text: 'còn e ngại', translation: 'hesitant', typeFunction: 'Tính từ · Ending' }
    ]
  },
  {
    hints: [
        { text: 'Chuyên môn kỹ thuật', translation: 'technical expertise', typeFunction: 'Danh từ · Keyword' },
        { text: 'cho nên', translation: 'so that', typeFunction: 'Từ nối · Logic word' },
        { text: 'đáng tin cậy', translation: 'reliable', typeFunction: 'Tính từ · Ending' }
    ]
  },
  {
    hints: [
        { text: 'Nhà tài trợ chính', translation: 'primary sponsor', typeFunction: 'Danh từ · Keyword' },
        { text: 'cùng lắm', translation: 'at worst', typeFunction: 'Từ nối · Logic word' },
        { text: 'cắt giảm vốn', translation: 'cut funding', typeFunction: 'Động từ · Ending' }
    ]
  },
  {
    hints: [
        { text: 'Thỏa thuận sơ bộ', translation: 'tentative deal', typeFunction: 'Danh từ · Keyword' },
        { text: 'ngay lập tức', translation: 'right away', typeFunction: 'Từ nối · Logic word' },
        { text: 'ký hợp đồng', translation: 'sign off', typeFunction: 'Động từ · Ending' }
    ]
  },
  {
    hints: [
        { text: 'Vấn đề nhân sự', translation: 'staffing issue', typeFunction: 'Danh từ · Keyword' },
        { text: 'thật ra', translation: 'actually', typeFunction: 'Từ nối · Logic word' },
        { text: 'phức tạp', translation: 'complicated', typeFunction: 'Tính từ · Ending' }
    ]
  },
  {
    hints: [
        { text: 'Cắt giảm chi tiêu', translation: 'spending cuts', typeFunction: 'Danh từ · Keyword' },
        { text: 'đặc biệt là', translation: 'especially', typeFunction: 'Từ nối · Logic word' },
        { text: 'quý này', translation: 'this quarter', typeFunction: 'Danh từ · Ending' }
    ]
  },
  {
    hints: [
        { text: 'Tiến độ nhà máy', translation: 'factory schedule', typeFunction: 'Danh từ · Keyword' },
        { text: 'miễn sao', translation: 'provided that', typeFunction: 'Từ nối · Logic word' },
        { text: 'kịp hạn', translation: 'on time', typeFunction: 'Tính từ · Ending' }
    ]
  },
  {
    hints: [
        { text: 'Rủi ro pháp lý', translation: 'legal risk', typeFunction: 'Danh từ · Keyword' },
        { text: 'chính vì thế', translation: 'for this reason', typeFunction: 'Từ nối · Logic word' },
        { text: 'thận trọng', translation: 'cautious', typeFunction: 'Tính từ · Ending' }
    ]
  },
  {
    hints: [
        { text: 'Đề xuất dự án', translation: 'project proposal', typeFunction: 'Danh từ · Keyword' },
        { text: 'sau hết', translation: 'after all', typeFunction: 'Từ nối · Logic word' },
        { text: 'được duyệt', translation: 'accepted', typeFunction: 'Tính từ · Ending' }
    ]
  },
  {
    hints: [
        { text: 'Chỉ tiêu doanh số', translation: 'sales quota', typeFunction: 'Danh từ · Keyword' },
        { text: 'kể từ đó', translation: 'since then', typeFunction: 'Từ nối · Logic word' },
        { text: 'vượt mong đợi', translation: 'exceeded', typeFunction: 'Tính từ · Ending' }
    ]
  },
  {
    hints: [
        { text: 'Tranh chấp hợp đồng', translation: 'contract dispute', typeFunction: 'Danh từ · Keyword' },
        { text: 'rốt cuộc', translation: 'in the end', typeFunction: 'Từ nối · Logic word' },
        { text: 'hòa giải', translation: 'settled', typeFunction: 'Tính từ · Ending' }
    ]
  },
  {
    hints: [
        { text: 'Lợi nhuận ròng', translation: 'net profit', typeFunction: 'Danh từ · Keyword' },
        { text: 'nói chung', translation: 'on the whole', typeFunction: 'Từ nối · Logic word' },
        { text: 'khả quan', translation: 'promising', typeFunction: 'Tính từ · Ending' }
    ]
  }
];

// Session 3: 30 items, hcTotal = 4, hintTypes: ['Keyword', 'Logic word', 'Fancy word', 'Ending']
const s3_items: ItemDef[] = [
  {
    hints: [
        { text: 'Đàm phán giá', translation: 'price talk', typeFunction: 'Danh từ · Keyword' },
        { text: 'trong khi', translation: 'while', typeFunction: 'Từ nối · Logic word' },
        { text: 'lá bài tẩy', translation: 'trump card', typeFunction: 'Ẩn dụ · Fancy word' },
        { text: 'lật ngược thế cờ', translation: 'turn the tables', typeFunction: 'Động từ · Ending' }
    ]
  },
  {
    hints: [
        { text: 'Khi nào', translation: 'When', typeFunction: 'Cụm nghi vấn · WH word' },
        { text: 'nếu không', translation: 'otherwise', typeFunction: 'Từ nối · Logic word' },
        { text: 'nút thắt cổ chai', translation: 'bottleneck', typeFunction: 'Ẩn dụ · Fancy word' },
        { text: 'đình trệ hoàn toàn', translation: 'grind to a halt', typeFunction: 'Động từ · Ending' }
    ]
  },
  {
    hints: [
        { text: 'Sếp trực tiếp', translation: 'line manager', typeFunction: 'Danh từ · Keyword' },
        { text: 'tuy nhiên', translation: 'however', typeFunction: 'Từ nối · Logic word' },
        { text: 'hồi chuông cảnh báo', translation: 'wake-up call', typeFunction: 'Ẩn dụ · Fancy word' },
        { text: 'siết chặt kỷ luật', translation: 'tighten control', typeFunction: 'Động từ · Ending' }
    ]
  },
  {
    hints: [
        { text: 'Cổ phiếu giảm', translation: 'stock drop', typeFunction: 'Danh từ · Keyword' },
        { text: 'do đó', translation: 'therefore', typeFunction: 'Từ nối · Logic word' },
        { text: 'phao cứu sinh', translation: 'lifeline', typeFunction: 'Ẩn dụ · Fancy word' },
        { text: 'rót vốn', translation: 'inject cash', typeFunction: 'Động từ · Ending' }
    ]
  },
  {
    hints: [
        { text: 'Dự án bất động sản', translation: 'property project', typeFunction: 'Danh từ · Keyword' },
        { text: 'mặc dù', translation: 'although', typeFunction: 'Từ nối · Logic word' },
        { text: 'con gà đẻ trứng vàng', translation: 'cash cow', typeFunction: 'Ẩn dụ · Fancy word' },
        { text: 'chậm tiến độ', translation: 'fall behind', typeFunction: 'Tính từ · Ending' }
    ]
  },
  {
    hints: [
        { text: 'Vì sao', translation: 'Why', typeFunction: 'Cụm nghi vấn · WH word' },
        { text: 'hơn nữa', translation: 'moreover', typeFunction: 'Từ nối · Logic word' },
        { text: 'con sâu làm rầu nồi canh', translation: 'bad apple', typeFunction: 'Thành ngữ · Fancy word' },
        { text: 'sa thải thẳng tay', translation: 'fire promptly', typeFunction: 'Động từ · Ending' }
    ]
  },
  {
    hints: [
        { text: 'Thư cảnh cáo', translation: 'warning letter', typeFunction: 'Danh từ · Keyword' },
        { text: 'sau đó', translation: 'then', typeFunction: 'Từ nối · Logic word' },
        { text: 'giọt nước tràn ly', translation: 'last straw', typeFunction: 'Ẩn dụ · Fancy word' },
        { text: 'nghỉ việc ngay', translation: 'resign instantly', typeFunction: 'Động từ · Ending' }
    ]
  },
  {
    hints: [
        { text: 'Ngân sách cạn kiệt', translation: 'drained budget', typeFunction: 'Danh từ · Keyword' },
        { text: 'thay vào đó', translation: 'instead', typeFunction: 'Từ nối · Logic word' },
        { text: 'thắt lưng buộc bụng', translation: 'belt tightening', typeFunction: 'Thành ngữ · Fancy word' },
        { text: 'vượt qua khủng hoảng', translation: 'survive', typeFunction: 'Động từ · Ending' }
    ]
  },
  {
    hints: [
        { text: 'Bao lâu', translation: 'How long', typeFunction: 'Cụm nghi vấn · WH word' },
        { text: 'nếu', translation: 'if', typeFunction: 'Từ nối · Logic word' },
        { text: 'ngõ cụt', translation: 'dead end', typeFunction: 'Ẩn dụ · Fancy word' },
        { text: 'hủy bỏ hợp đồng', translation: 'call off deal', typeFunction: 'Động từ · Ending' }
    ]
  },
  {
    hints: [
        { text: 'Ban giám đốc', translation: 'board of directors', typeFunction: 'Danh từ · Keyword' },
        { text: 'cho nên', translation: 'so that', typeFunction: 'Từ nối · Logic word' },
        { text: 'bức tranh toàn cảnh', translation: 'big picture', typeFunction: 'Ẩn dụ · Fancy word' },
        { text: 'định hướng rõ', translation: 'steer ahead', typeFunction: 'Động từ · Ending' }
    ]
  },
  {
    hints: [
        { text: 'Báo cáo kiểm toán', translation: 'audit report', typeFunction: 'Danh từ · Keyword' },
        { text: 'trái lại', translation: 'in contrast', typeFunction: 'Từ nối · Logic word' },
        { text: 'quả bom hẹn giờ', translation: 'ticking bomb', typeFunction: 'Ẩn dụ · Fancy word' },
        { text: 'xử lý khẩn cấp', translation: 'defuse right away', typeFunction: 'Động từ · Ending' }
    ]
  },
  {
    hints: [
        { text: 'Hợp tác liên doanh', translation: 'joint venture', typeFunction: 'Danh từ · Keyword' },
        { text: 'miễn là', translation: 'as long as', typeFunction: 'Từ nối · Logic word' },
        { text: 'đôi bên cùng có lợi', translation: 'win-win deal', typeFunction: 'Cụm gợi hình · Fancy word' },
        { text: 'bền vững', translation: 'sustainable', typeFunction: 'Tính từ · Ending' }
    ]
  },
  {
    hints: [
        { text: 'Email nặc danh', translation: 'anonymous email', typeFunction: 'Danh từ · Keyword' },
        { text: 'tiếp theo', translation: 'next', typeFunction: 'Từ nối · Logic word' },
        { text: 'mồi nhử', translation: 'phishing bait', typeFunction: 'Ẩn dụ · Fancy word' },
        { text: 'vạch trần thủ đoạn', translation: 'expose scam', typeFunction: 'Động từ · Ending' }
    ]
  },
  {
    hints: [
        { text: 'Ở đâu', translation: 'Where', typeFunction: 'Cụm nghi vấn · WH word' },
        { text: 'đồng thời', translation: 'meanwhile', typeFunction: 'Từ nối · Logic word' },
        { text: 'mắt xích yếu', translation: 'weak link', typeFunction: 'Ẩn dụ · Fancy word' },
        { text: 'gia cố ngay', translation: 'reinforce', typeFunction: 'Động từ · Ending' }
    ]
  },
  {
    hints: [
        { text: 'Ai dè', translation: 'unexpectedly', typeFunction: 'Trạng từ · Keyword' },
        { text: 'bởi thế', translation: 'for that reason', typeFunction: 'Từ nối · Logic word' },
        { text: 'cú lội ngược dòng', translation: 'stunning comeback', typeFunction: 'Ẩn dụ · Fancy word' },
        { text: 'bất ngờ', translation: 'surprising', typeFunction: 'Tính từ · Ending' }
    ]
  },
  {
    hints: [
        { text: 'Thị trường ngách', translation: 'niche market', typeFunction: 'Danh từ · Keyword' },
        { text: 'dẫu vậy', translation: 'even so', typeFunction: 'Từ nối · Logic word' },
        { text: 'canh bạc lớn', translation: 'high-stakes gamble', typeFunction: 'Ẩn dụ · Fancy word' },
        { text: 'đầy mạo hiểm', translation: 'risky', typeFunction: 'Tính từ · Ending' }
    ]
  },
  {
    hints: [
        { text: 'Chi nhánh phụ', translation: 'subsidiary branch', typeFunction: 'Danh từ · Keyword' },
        { text: 'sau cùng', translation: 'eventually', typeFunction: 'Từ nối · Logic word' },
        { text: 'gánh nặng', translation: 'dead weight', typeFunction: 'Ẩn dụ · Fancy word' },
        { text: 'cắt giảm triệt để', translation: 'sever ties', typeFunction: 'Động từ · Ending' }
    ]
  },
  {
    hints: [
        { text: 'Trợ cấp thâm niên', translation: 'seniority perks', typeFunction: 'Danh từ · Keyword' },
        { text: 'ngoài ra', translation: 'besides', typeFunction: 'Từ nối · Logic word' },
        { text: 'miếng bánh ngọt', translation: 'sweet incentive', typeFunction: 'Ẩn dụ · Fancy word' },
        { text: 'giữ chân nhân tài', translation: 'retain talent', typeFunction: 'Động từ · Ending' }
    ]
  },
  {
    hints: [
        { text: 'Tại sao', translation: 'Why', typeFunction: 'Cụm nghi vấn · WH word' },
        { text: 'trừ khi', translation: 'unless', typeFunction: 'Từ nối · Logic word' },
        { text: 'đòn bẩy tài chính', translation: 'leverage', typeFunction: 'Ẩn dụ · Fancy word' },
        { text: 'nhượng bộ', translation: 'yield', typeFunction: 'Động từ · Ending' }
    ]
  },
  {
    hints: [
        { text: 'Đề bạt nhân sự', translation: 'staff promotion', typeFunction: 'Danh từ · Keyword' },
        { text: 'trước hết', translation: 'first of all', typeFunction: 'Từ nối · Logic word' },
        { text: 'viên ngọc thô', translation: 'rough diamond', typeFunction: 'Ẩn dụ · Fancy word' },
        { text: 'tỏa sáng', translation: 'shine', typeFunction: 'Động từ · Ending' }
    ]
  },
  {
    hints: [
        { text: 'Thỏa thuận ngầm', translation: 'backdoor deal', typeFunction: 'Danh từ · Keyword' },
        { text: 'rốt cuộc', translation: 'in the end', typeFunction: 'Từ nối · Logic word' },
        { text: 'gậy ông đập lưng ông', translation: 'backfire', typeFunction: 'Thành ngữ · Fancy word' },
        { text: 'trả giá đắt', translation: 'pay dearly', typeFunction: 'Động từ · Ending' }
    ]
  },
  {
    hints: [
        { text: 'Khách hàng VIP', translation: 'VIP client', typeFunction: 'Danh từ · Keyword' },
        { text: 'nói cách khác', translation: 'in other words', typeFunction: 'Từ nối · Logic word' },
        { text: 'mỏ vàng', translation: 'gold mine', typeFunction: 'Ẩn dụ · Fancy word' },
        { text: 'chăm sóc chu đáo', translation: 'pamper', typeFunction: 'Động từ · Ending' }
    ]
  },
  {
    hints: [
        { text: 'Hợp đồng nguyên tắc', translation: 'framework contract', typeFunction: 'Danh từ · Keyword' },
        { text: 'dù sao', translation: 'anyway', typeFunction: 'Từ nối · Logic word' },
        { text: 'bệ phóng vững chắc', translation: 'solid springboard', typeFunction: 'Ẩn dụ · Fancy word' },
        { text: 'phát triển mạnh', translation: 'thrive', typeFunction: 'Động từ · Ending' }
    ]
  },
  {
    hints: [
        { text: 'Bằng cách nào', translation: 'How', typeFunction: 'Cụm nghi vấn · WH word' },
        { text: 'nếu như', translation: 'in case', typeFunction: 'Từ nối · Logic word' },
        { text: 'nước đến chân', translation: 'eleventh hour', typeFunction: 'Thành ngữ · Fancy word' },
        { text: 'xoay xở kịp', translation: 'manage in time', typeFunction: 'Động từ · Ending' }
    ]
  },
  {
    hints: [
        { text: 'Đội ngũ nòng cốt', translation: 'core team', typeFunction: 'Danh từ · Keyword' },
        { text: 'tuy vậy', translation: 'nonetheless', typeFunction: 'Từ nối · Logic word' },
        { text: 'mũi nhọn tiên phong', translation: 'spearhead', typeFunction: 'Ẩn dụ · Fancy word' },
        { text: 'dẫn đầu thị trường', translation: 'lead market', typeFunction: 'Động từ · Ending' }
    ]
  },
  {
    hints: [
        { text: 'Khủng hoảng truyền thông', translation: 'PR crisis', typeFunction: 'Danh từ · Keyword' },
        { text: 'chính vì vậy', translation: 'hence', typeFunction: 'Từ nối · Logic word' },
        { text: 'dập lửa', translation: 'damage control', typeFunction: 'Ẩn dụ · Fancy word' },
        { text: 'ổn định dư luận', translation: 'calm public', typeFunction: 'Động từ · Ending' }
    ]
  },
  {
    hints: [
        { text: 'Đấu thầu dự án', translation: 'project bidding', typeFunction: 'Danh từ · Keyword' },
        { text: 'sau đó', translation: 'afterwards', typeFunction: 'Từ nối · Logic word' },
        { text: 'quân cờ quyết định', translation: 'game changer', typeFunction: 'Ẩn dụ · Fancy word' },
        { text: 'giành thắng lợi', translation: 'win bid', typeFunction: 'Động từ · Ending' }
    ]
  },
  {
    hints: [
        { text: 'Chi phí ẩn', translation: 'hidden fees', typeFunction: 'Danh từ · Keyword' },
        { text: 'cuối cùng', translation: 'ultimately', typeFunction: 'Từ nối · Logic word' },
        { text: 'hố đen tài chính', translation: 'money pit', typeFunction: 'Ẩn dụ · Fancy word' },
        { text: 'ngốn sạch vốn', translation: 'drain capital', typeFunction: 'Động từ · Ending' }
    ]
  },
  {
    hints: [
        { text: 'Cố vấn tài chính', translation: 'financial adviser', typeFunction: 'Danh từ · Keyword' },
        { text: 'trái lại', translation: 'on the other hand', typeFunction: 'Từ nối · Logic word' },
        { text: 'ngọn hải đăng', translation: 'guiding beacon', typeFunction: 'Ẩn dụ · Fancy word' },
        { text: 'soi sáng lộ trình', translation: 'illuminate path', typeFunction: 'Động từ · Ending' }
    ]
  },
  {
    hints: [
        { text: 'Tính ra', translation: 'all things considered', typeFunction: 'Cụm chêm · Keyword' },
        { text: 'kết quả là', translation: 'as a result', typeFunction: 'Từ nối · Logic word' },
        { text: 'quả ngọt', translation: 'sweet fruit', typeFunction: 'Ẩn dụ · Fancy word' },
        { text: 'gặt hái thành công', translation: 'reap success', typeFunction: 'Động từ · Ending' }
    ]
  }
];

// Session 4: 30 items, hcTotal = 5, hintTypes: ['Intro / Setup', 'Keyword', 'Logic word', 'Fancy word', 'Ending']
const s4_items: ItemDef[] = [
  {
    hints: [
        { text: 'Chuyện là vầy', translation: 'Here is the deal', typeFunction: 'Cụm mào đầu · Intro' },
        { text: 'hợp đồng đối tác', translation: 'partner contract', typeFunction: 'Danh từ · Keyword' },
        { text: 'tuy nhiên', translation: 'however', typeFunction: 'Từ nối · Logic word' },
        { text: 'nút thắt cổ chai', translation: 'bottleneck', typeFunction: 'Ẩn dụ · Fancy word' },
        { text: 'chưa tháo gỡ', translation: 'unresolved', typeFunction: 'Tính từ · Ending' }
    ]
  },
  {
    hints: [
        { text: 'Như tôi đã nói', translation: 'Like I said', typeFunction: 'Cụm mào đầu · Intro' },
        { text: 'ngân sách dự án', translation: 'project budget', typeFunction: 'Danh từ · Keyword' },
        { text: 'do đó', translation: 'therefore', typeFunction: 'Từ nối · Logic word' },
        { text: 'phao cứu sinh', translation: 'lifeline', typeFunction: 'Ẩn dụ · Fancy word' },
        { text: 'cực kỳ cấp thiết', translation: 'urgently needed', typeFunction: 'Tính từ · Ending' }
    ]
  },
  {
    hints: [
        { text: 'Thú thật', translation: 'Honestly', typeFunction: 'Cụm mào đầu · Intro' },
        { text: 'sếp trực tiếp', translation: 'line manager', typeFunction: 'Danh từ · Keyword' },
        { text: 'mặc dù', translation: 'although', typeFunction: 'Từ nối · Logic word' },
        { text: 'khắt khe', translation: 'hard-nosed', typeFunction: 'Cụm gợi hình · Fancy word' },
        { text: 'rất công tâm', translation: 'fair-minded', typeFunction: 'Tính từ · Ending' }
    ]
  },
  {
    hints: [
        { text: 'Nói thiệt', translation: 'To tell the truth', typeFunction: 'Cụm mào đầu · Intro' },
        { text: 'thư cảnh cáo', translation: 'warning letter', typeFunction: 'Danh từ · Keyword' },
        { text: 'hơn nữa', translation: 'in addition', typeFunction: 'Từ nối · Logic word' },
        { text: 'hồi chuông cảnh tỉnh', translation: 'wake-up call', typeFunction: 'Ẩn dụ · Fancy word' },
        { text: 'giúp tỉnh ngộ', translation: 'open eyes', typeFunction: 'Động từ · Ending' }
    ]
  },
  {
    hints: [
        { text: 'Ai dè', translation: 'Unexpectedly', typeFunction: 'Cụm mào đầu · Intro' },
        { text: 'cổ phiếu công ty', translation: 'company shares', typeFunction: 'Danh từ · Keyword' },
        { text: 'sau đó', translation: 'then', typeFunction: 'Từ nối · Logic word' },
        { text: 'lao dốc không phanh', translation: 'free fall', typeFunction: 'Cụm gợi hình · Fancy word' },
        { text: 'gây chấn động', translation: 'cause panic', typeFunction: 'Động từ · Ending' }
    ]
  },
  {
    hints: [
        { text: 'Hóa ra', translation: 'Turns out', typeFunction: 'Cụm mào đầu · Intro' },
        { text: 'email khẩn', translation: 'urgent email', typeFunction: 'Danh từ · Keyword' },
        { text: 'thực chất là', translation: 'actually', typeFunction: 'Từ nối · Logic word' },
        { text: 'mồi câu lừa đảo', translation: 'phishing bait', typeFunction: 'Ẩn dụ · Fancy word' },
        { text: 'bẫy nhân viên', translation: 'trap employees', typeFunction: 'Động từ · Ending' }
    ]
  },
  {
    hints: [
        { text: 'Nhớ kỹ nè', translation: 'Keep this in mind', typeFunction: 'Cụm mào đầu · Intro' },
        { text: 'đất quy hoạch', translation: 'zoned land', typeFunction: 'Danh từ · Keyword' },
        { text: 'miễn là', translation: 'as long as', typeFunction: 'Từ nối · Logic word' },
        { text: 'con gà đẻ trứng vàng', translation: 'cash cow', typeFunction: 'Ẩn dụ · Fancy word' },
        { text: 'phải giữ chặt', translation: 'hold firmly', typeFunction: 'Động từ · Ending' }
    ]
  },
  {
    hints: [
        { text: 'Nghe nè', translation: 'Listen up', typeFunction: 'Cụm mào đầu · Intro' },
        { text: 'đàm phán đối tác', translation: 'partner negotiation', typeFunction: 'Danh từ · Keyword' },
        { text: 'nếu không', translation: 'otherwise', typeFunction: 'Từ nối · Logic word' },
        { text: 'lá bài tẩy', translation: 'trump card', typeFunction: 'Ẩn dụ · Fancy word' },
        { text: 'sẽ bị vô hiệu', translation: 'rendered useless', typeFunction: 'Tính từ · Ending' }
    ]
  },
  {
    hints: [
        { text: 'Vấn đề là', translation: 'The point is', typeFunction: 'Cụm mào đầu · Intro' },
        { text: 'ban giám đốc', translation: 'board of directors', typeFunction: 'Danh từ · Keyword' },
        { text: 'đồng thời', translation: 'meanwhile', typeFunction: 'Từ nối · Logic word' },
        { text: 'tầm nhìn hạn hẹp', translation: 'tunnel vision', typeFunction: 'Ẩn dụ · Fancy word' },
        { text: 'bỏ lỡ cơ hội', translation: 'miss out', typeFunction: 'Động từ · Ending' }
    ]
  },
  {
    hints: [
        { text: 'Theo tôi thấy', translation: 'In my view', typeFunction: 'Cụm mào đầu · Intro' },
        { text: 'chuyên môn kỹ thuật', translation: 'technical expertise', typeFunction: 'Danh từ · Keyword' },
        { text: 'cho nên', translation: 'so that', typeFunction: 'Từ nối · Logic word' },
        { text: 'vũ khí bí mật', translation: 'secret weapon', typeFunction: 'Ẩn dụ · Fancy word' },
        { text: 'thắng thầu', translation: 'win bid', typeFunction: 'Động từ · Ending' }
    ]
  },
  {
    hints: [
        { text: 'Tính ra', translation: 'All in all', typeFunction: 'Cụm mào đầu · Intro' },
        { text: 'trợ cấp thâm niên', translation: 'seniority bonus', typeFunction: 'Danh từ · Keyword' },
        { text: 'trái lại', translation: 'in contrast', typeFunction: 'Từ nối · Logic word' },
        { text: 'miếng bánh ngon', translation: 'sweet incentive', typeFunction: 'Ẩn dụ · Fancy word' },
        { text: 'rất công bằng', translation: 'totally fair', typeFunction: 'Tính từ · Ending' }
    ]
  },
  {
    hints: [
        { text: 'Cùng lắm', translation: 'At worst', typeFunction: 'Cụm mào đầu · Intro' },
        { text: 'nhà tài trợ', translation: 'sponsor', typeFunction: 'Danh từ · Keyword' },
        { text: 'dù vậy', translation: 'nevertheless', typeFunction: 'Từ nối · Logic word' },
        { text: 'rút lui êm thấm', translation: 'quiet exit', typeFunction: 'Cụm gợi hình · Fancy word' },
        { text: 'không bồi thường', translation: 'no penalty', typeFunction: 'Tính từ · Ending' }
    ]
  },
  {
    hints: [
        { text: 'Để ý xem', translation: 'Notice this', typeFunction: 'Cụm mào đầu · Intro' },
        { text: 'biểu đồ tròn', translation: 'pie chart', typeFunction: 'Danh từ · Keyword' },
        { text: 'tiếp theo', translation: 'next', typeFunction: 'Từ nối · Logic word' },
        { text: 'lát cắt then chốt', translation: 'key slice', typeFunction: 'Ẩn dụ · Fancy word' },
        { text: 'chỉ rõ chi phí', translation: 'clarify costs', typeFunction: 'Động từ · Ending' }
    ]
  },
  {
    hints: [
        { text: 'Nói cách khác', translation: 'In other words', typeFunction: 'Cụm mào đầu · Intro' },
        { text: 'nhân viên có năng lực', translation: 'competent employee', typeFunction: 'Danh từ · Keyword' },
        { text: 'bởi vì', translation: 'because', typeFunction: 'Từ nối · Logic word' },
        { text: 'viên ngọc quý', translation: 'gem of team', typeFunction: 'Ẩn dụ · Fancy word' },
        { text: 'cần trọng dụng', translation: 'cherish dearly', typeFunction: 'Động từ · Ending' }
    ]
  },
  {
    hints: [
        { text: 'Thực tế thì', translation: 'As a matter of fact', typeFunction: 'Cụm mào đầu · Intro' },
        { text: 'nhà máy sản xuất', translation: 'production facility', typeFunction: 'Danh từ · Keyword' },
        { text: 'ngoài ra', translation: 'besides', typeFunction: 'Từ nối · Logic word' },
        { text: 'cỗ máy kiếm tiền', translation: 'money spinner', typeFunction: 'Ẩn dụ · Fancy word' },
        { text: 'chạy hết công suất', translation: 'at full blast', typeFunction: 'Trạng từ · Ending' }
    ]
  },
  {
    hints: [
        { text: 'Đừng quên', translation: 'Do not forget', typeFunction: 'Cụm mào đầu · Intro' },
        { text: 'chướng ngại vật', translation: 'roadblock', typeFunction: 'Danh từ · Keyword' },
        { text: 'thay vào đó', translation: 'instead', typeFunction: 'Từ nối · Logic word' },
        { text: 'bàn đạp tiến bước', translation: 'stepping stone', typeFunction: 'Ẩn dụ · Fancy word' },
        { text: 'rèn luyện bản lĩnh', translation: 'forge resilience', typeFunction: 'Động từ · Ending' }
    ]
  },
  {
    hints: [
        { text: 'Chuyện thiệt luôn', translation: 'True story', typeFunction: 'Cụm mào đầu · Intro' },
        { text: 'sếp cũ', translation: 'former manager', typeFunction: 'Danh từ · Keyword' },
        { text: 'sau cùng', translation: 'eventually', typeFunction: 'Từ nối · Logic word' },
        { text: 'giang tay chào đón', translation: 'open arms', typeFunction: 'Cụm gợi hình · Fancy word' },
        { text: 'mời quay lại', translation: 'rehire', typeFunction: 'Động từ · Ending' }
    ]
  },
  {
    hints: [
        { text: 'Tin hay không tùy', translation: 'Believe it or not', typeFunction: 'Cụm mào đầu · Intro' },
        { text: 'show thực tế', translation: 'reality series', typeFunction: 'Danh từ · Keyword' },
        { text: 'tuy vậy', translation: 'even so', typeFunction: 'Từ nối · Logic word' },
        { text: 'cơn sốt phòng vé', translation: 'blockbuster craze', typeFunction: 'Ẩn dụ · Fancy word' },
        { text: 'thu hút tài trợ', translation: 'draw sponsors', typeFunction: 'Động từ · Ending' }
    ]
  },
  {
    hints: [
        { text: 'Trước tiên', translation: 'First of all', typeFunction: 'Cụm mào đầu · Intro' },
        { text: 'bức tranh tài chính', translation: 'financial roadmap', typeFunction: 'Danh từ · Keyword' },
        { text: 'trước hết', translation: 'to begin with', typeFunction: 'Từ nối · Logic word' },
        { text: 'kim chỉ nam', translation: 'guiding compass', typeFunction: 'Ẩn dụ · Fancy word' },
        { text: 'phải minh bạch', translation: 'crystal clear', typeFunction: 'Tính từ · Ending' }
    ]
  },
  {
    hints: [
        { text: 'Nói ngắn gọn', translation: 'Long story short', typeFunction: 'Cụm mào đầu · Intro' },
        { text: 'tình huống khó xử', translation: 'moral dilemma', typeFunction: 'Danh từ · Keyword' },
        { text: 'rốt cuộc', translation: 'in the end', typeFunction: 'Từ nối · Logic word' },
        { text: 'con dao hai lưỡi', translation: 'double-edged sword', typeFunction: 'Ẩn dụ · Fancy word' },
        { text: 'phải xử lý khéo', translation: 'tread lightly', typeFunction: 'Động từ · Ending' }
    ]
  },
  {
    hints: [
        { text: 'Nhìn chung', translation: 'On the whole', typeFunction: 'Cụm mào đầu · Intro' },
        { text: 'đất công đấu thầu', translation: 'public land bidding', typeFunction: 'Danh từ · Keyword' },
        { text: 'miễn sao', translation: 'provided that', typeFunction: 'Từ nối · Logic word' },
        { text: 'sân chơi sòng phẳng', translation: 'level field', typeFunction: 'Ẩn dụ · Fancy word' },
        { text: 'rất công bằng', translation: 'equitable', typeFunction: 'Tính từ · Ending' }
    ]
  },
  {
    hints: [
        { text: 'Nói hay lắm', translation: 'Well said', typeFunction: 'Cụm mào đầu · Intro' },
        { text: 'lập trình viên IT', translation: 'software engineer', typeFunction: 'Danh từ · Keyword' },
        { text: 'khi mà', translation: 'while', typeFunction: 'Từ nối · Logic word' },
        { text: 'xương sống hệ thống', translation: 'backbone of tech', typeFunction: 'Ẩn dụ · Fancy word' },
        { text: 'làm việc ngày đêm', translation: 'toil tirelessly', typeFunction: 'Trạng từ · Ending' }
    ]
  },
  {
    hints: [
        { text: 'Đáng chú ý là', translation: 'Remarkably', typeFunction: 'Cụm mào đầu · Intro' },
        { text: 'cuộc cãi lộn', translation: 'heated argument', typeFunction: 'Danh từ · Keyword' },
        { text: 'chính vì thế', translation: 'for that reason', typeFunction: 'Từ nối · Logic word' },
        { text: 'ngòi nổ căng thẳng', translation: 'fuse of conflict', typeFunction: 'Ẩn dụ · Fancy word' },
        { text: 'đã được dập tắt', translation: 'defused quickly', typeFunction: 'Tính từ · Ending' }
    ]
  },
  {
    hints: [
        { text: 'Thành thật mà nói', translation: 'Frankly speaking', typeFunction: 'Cụm mào đầu · Intro' },
        { text: 'thâm niên làm việc', translation: 'seniority record', typeFunction: 'Danh từ · Keyword' },
        { text: 'không chỉ', translation: 'not only', typeFunction: 'Từ nối · Logic word' },
        { text: 'tấm thẻ bài', translation: 'hallmark pass', typeFunction: 'Ẩn dụ · Fancy word' },
        { text: 'mà còn uy tín', translation: 'built reputation', typeFunction: 'Tính từ · Ending' }
    ]
  },
  {
    hints: [
        { text: 'Theo quan sát', translation: 'From observation', typeFunction: 'Cụm mào đầu · Intro' },
        { text: 'dự án chấm dứt', translation: 'terminated project', typeFunction: 'Danh từ · Keyword' },
        { text: 'nhưng bù lại', translation: 'yet in return', typeFunction: 'Từ nối · Logic word' },
        { text: 'bài học xương máu', translation: 'costly lesson', typeFunction: 'Ẩn dụ · Fancy word' },
        { text: 'rất vô giá', translation: 'priceless gain', typeFunction: 'Tính từ · Ending' }
    ]
  },
  {
    hints: [
        { text: 'Nói trắng ra', translation: 'Put bluntly', typeFunction: 'Cụm mào đầu · Intro' },
        { text: 'nút thắt cổ chai', translation: 'supply bottleneck', typeFunction: 'Danh từ · Keyword' },
        { text: 'nếu cứ để', translation: 'if neglected', typeFunction: 'Từ nối · Logic word' },
        { text: 'vết dầu loang', translation: 'spreading rot', typeFunction: 'Ẩn dụ · Fancy word' },
        { text: 'sẽ gây tê liệt', translation: 'paralyze system', typeFunction: 'Động từ · Ending' }
    ]
  },
  {
    hints: [
        { text: 'Điều bất ngờ là', translation: 'The twist is', typeFunction: 'Cụm mào đầu · Intro' },
        { text: 'đối tác chiến lược', translation: 'strategic partner', typeFunction: 'Danh từ · Keyword' },
        { text: 'sau khi bàn bạc', translation: 'after talks', typeFunction: 'Từ nối · Logic word' },
        { text: 'cái bắt tay vàng', translation: 'golden handshake', typeFunction: 'Ẩn dụ · Fancy word' },
        { text: 'đồng ý ký kết', translation: 'agree to terms', typeFunction: 'Động từ · Ending' }
    ]
  },
  {
    hints: [
        { text: 'Rút kinh nghiệm', translation: 'Learn from this', typeFunction: 'Cụm mào đầu · Intro' },
        { text: 'kế hoạch đàm phán', translation: 'bargaining plan', typeFunction: 'Danh từ · Keyword' },
        { text: 'bằng cách', translation: 'by means of', typeFunction: 'Từ nối · Logic word' },
        { text: 'nắm đằng chuôi', translation: 'hold upper hand', typeFunction: 'Thành ngữ · Fancy word' },
        { text: 'luôn chủ động', translation: 'stay proactive', typeFunction: 'Tính từ · Ending' }
    ]
  },
  {
    hints: [
        { text: 'Về cơ bản', translation: 'Basically', typeFunction: 'Cụm mào đầu · Intro' },
        { text: 'hợp cạ trong việc', translation: 'workplace chemistry', typeFunction: 'Danh từ · Keyword' },
        { text: 'chính là', translation: 'namely', typeFunction: 'Từ nối · Logic word' },
        { text: 'chất xúc tác', translation: 'catalyst', typeFunction: 'Ẩn dụ · Fancy word' },
        { text: 'thúc đẩy hiệu suất', translation: 'boost output', typeFunction: 'Động từ · Ending' }
    ]
  },
  {
    hints: [
        { text: 'Tóm lại là', translation: 'The bottom line is', typeFunction: 'Cụm mào đầu · Intro' },
        { text: 'thỏa thuận cuối cùng', translation: 'final settlement', typeFunction: 'Danh từ · Keyword' },
        { text: 'sau hết', translation: 'in the end', typeFunction: 'Từ nối · Logic word' },
        { text: 'quả ngọt đầu mùa', translation: 'sweet fruit', typeFunction: 'Ẩn dụ · Fancy word' },
        { text: 'thành công rực rỡ', translation: 'grand success', typeFunction: 'Tính từ · Ending' }
    ]
  }
];

function buildPackage(
  id: string,
  title: string,
  description: string,
  sourceCourseLevel: string,
  sourceLessonIds: string[],
  s1: ItemDef[],
  s2: ItemDef[],
  s3: ItemDef[],
  s4: ItemDef[]
): ImprovPackage {
  const sessionsConfig = [
    {
      sessionNumber: 1,
      title: 'Session 1 • 2 Hints (Core Vocab Pairs & Rapid Reactions)',
      hcTotal: 2,
      hintTypes: ['Keyword', 'Ending'],
      itemsData: s1
    },
    {
      sessionNumber: 2,
      title: 'Session 2 • 3 Hints (Spoken Connectors & Phrasal Chains)',
      hcTotal: 3,
      hintTypes: ['Keyword', 'Logic word', 'Ending'],
      itemsData: s2
    },
    {
      sessionNumber: 3,
      title: 'Session 3 • 4 Hints (Fancy Metaphors & Idiomatic Reflex)',
      hcTotal: 4,
      hintTypes: ['Keyword', 'Logic word', 'Fancy word', 'Ending'],
      itemsData: s3
    },
    {
      sessionNumber: 4,
      title: 'Session 4 • 5 Hints (Full Spoken Reflex Flow)',
      hcTotal: 5,
      hintTypes: ['Intro / Setup', 'Keyword', 'Logic word', 'Fancy word', 'Ending'],
      itemsData: s4
    }
  ];

  const prefix = 'set03';

  const sessions = sessionsConfig.map((sConfig) => {
    const items = sConfig.itemsData.map((itemDef, idx) => {
      const itemNumber = idx + 1;
      const itemId = `${prefix}_s${sConfig.sessionNumber}_i${itemNumber.toString().padStart(2, '0')}`;
      const hints = itemDef.hints.map((hintDef, hIdx) => {
        const itemIndex = hIdx + 1;
        const hintId = `h_${prefix}_s${sConfig.sessionNumber}_i${itemNumber}_${itemIndex}`;
        return {
          id: hintId,
          text: hintDef.text,
          translation: hintDef.translation,
          typeFunction: hintDef.typeFunction,
          itemIndex
        };
      });

      return {
        id: itemId,
        itemNumber,
        sessionNumber: sConfig.sessionNumber,
        hcTotal: sConfig.hcTotal,
        hints
      };
    });

    return {
      sessionNumber: sConfig.sessionNumber,
      title: sConfig.title,
      hcTotal: sConfig.hcTotal,
      hintTypes: sConfig.hintTypes,
      items
    };
  });

  return {
    id,
    title,
    description,
    totalItems: 120,
    sessionsCount: 4,
    sessions,
    createdAt: '2026-09-05T00:00:00.000Z',
    updatedAt: '2026-09-05T00:00:00.000Z',
    sourceCourseLevel,
    sourceLessonIds
  };
}

export const IMPROV_SET_03: ImprovPackage = buildPackage(
  'improv_set_03_rendezvous',
  'Set 03 • Rendezvous (Business Deals & Workplace Reflex)',
  '120 progressive deduction items for business negotiations, office dynamics, and partnership reflexes based on Level B Day 5.',
  'LEVEL_B_ERES',
  ["level_b_eres_day_5"],
  s1_items,
  s2_items,
  s3_items,
  s4_items
);
