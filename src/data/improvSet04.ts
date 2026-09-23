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
// Set 04 • Excel & Office Data (Spreadsheets & Productivity Reflex)
// Based on LEVEL_B_ERES (level_b_eres_day_6)
// -------------------------------------------------------------

// Session 1: 30 items, hcTotal = 2, hintTypes: ['Keyword', 'Ending']
const s1_items: ItemDef[] = [
  {
    hints: [
        { text: 'Báo cáo tài chính', translation: 'financial report', typeFunction: 'Danh từ · Keyword' },
        { text: 'nộp trễ hạn', translation: 'overdue', typeFunction: 'Tính từ · Ending' }
    ]
  },
  {
    hints: [
        { text: 'Tính tay', translation: 'manual calculation', typeFunction: 'Danh từ · Keyword' },
        { text: 'dễ sai sót', translation: 'error-prone', typeFunction: 'Tính từ · Ending' }
    ]
  },
  {
    hints: [
        { text: 'Phím escape', translation: 'escape key', typeFunction: 'Danh từ · Keyword' },
        { text: 'nhấn vội vã', translation: 'press frantically', typeFunction: 'Động từ · Ending' }
    ]
  },
  {
    hints: [
        { text: 'Màn hình đơ', translation: 'frozen screen', typeFunction: 'Danh từ · Keyword' },
        { text: 'bất lực', translation: 'helpless', typeFunction: 'Tính từ · Ending' }
    ]
  },
  {
    hints: [
        { text: 'File dung lượng lớn', translation: 'huge spreadsheet file', typeFunction: 'Danh từ · Keyword' },
        { text: 'tải cực chậm', translation: 'load painfully slow', typeFunction: 'Trạng từ · Ending' }
    ]
  },
  {
    hints: [
        { text: 'Bậc thầy Excel', translation: 'Excel guru', typeFunction: 'Danh từ · Keyword' },
        { text: 'hướng dẫn tận tình', translation: 'mentor patiently', typeFunction: 'Động từ · Ending' }
    ]
  },
  {
    hints: [
        { text: 'Gỡ phần mềm', translation: 'uninstall software', typeFunction: 'Động từ · Keyword' },
        { text: 'giải phóng ổ cứng', translation: 'free up space', typeFunction: 'Động từ · Ending' }
    ]
  },
  {
    hints: [
        { text: 'Thanh tác vụ', translation: 'taskbar', typeFunction: 'Danh từ · Keyword' },
        { text: 'bị ẩn đi', translation: 'hidden away', typeFunction: 'Tính từ · Ending' }
    ]
  },
  {
    hints: [
        { text: 'Công thức bảng tính', translation: 'spreadsheet formula', typeFunction: 'Danh từ · Keyword' },
        { text: 'báo lỗi cú pháp', translation: 'syntax error', typeFunction: 'Danh từ · Ending' }
    ]
  },
  {
    hints: [
        { text: 'Từng ô dữ liệu', translation: 'every single cell', typeFunction: 'Danh từ · Keyword' },
        { text: 'định dạng chuẩn', translation: 'reformat correctly', typeFunction: 'Động từ · Ending' }
    ]
  },
  {
    hints: [
        { text: 'Lăn chuột xuống', translation: 'scroll down', typeFunction: 'Động từ · Keyword' },
        { text: 'đối chiếu số liệu', translation: 'cross-check figures', typeFunction: 'Động từ · Ending' }
    ]
  },
  {
    hints: [
        { text: 'Rất cùi Excel', translation: 'suck at Excel', typeFunction: 'Cụm chêm · Keyword' },
        { text: 'lo lắng', translation: 'anxious', typeFunction: 'Tính từ · Ending' }
    ]
  },
  {
    hints: [
        { text: 'Rất giỏi Excel', translation: 'expert at Excel', typeFunction: 'Cụm chêm · Keyword' },
        { text: 'tự tin', translation: 'confident', typeFunction: 'Tính từ · Ending' }
    ]
  },
  {
    hints: [
        { text: 'Ổ đĩa C', translation: 'local disk C', typeFunction: 'Danh từ · Keyword' },
        { text: 'đầy ắp', translation: 'full storage', typeFunction: 'Tính từ · Ending' }
    ]
  },
  {
    hints: [
        { text: 'Khởi động lại máy', translation: 'reboot PC', typeFunction: 'Động từ · Keyword' },
        { text: 'sửa lỗi tạm thời', translation: 'quick fix', typeFunction: 'Danh từ · Ending' }
    ]
  },
  {
    hints: [
        { text: 'Sao lưu tự động', translation: 'auto-save feature', typeFunction: 'Danh từ · Keyword' },
        { text: 'kích hoạt sẵn', translation: 'enabled', typeFunction: 'Tính từ · Ending' }
    ]
  },
  {
    hints: [
        { text: 'Bảng tính phức tạp', translation: 'complex sheet', typeFunction: 'Danh từ · Keyword' },
        { text: 'rối mắt', translation: 'convoluted', typeFunction: 'Tính từ · Ending' }
    ]
  },
  {
    hints: [
        { text: 'Trà sữa full toppings', translation: 'boba with toppings', typeFunction: 'Danh từ · Keyword' },
        { text: 'khao cả phòng', translation: 'treat office', typeFunction: 'Động từ · Ending' }
    ]
  },
  {
    hints: [
        { text: 'Phím tắt bàn phím', translation: 'keyboard shortcut', typeFunction: 'Danh từ · Keyword' },
        { text: 'thuộc làu làu', translation: 'memorize by heart', typeFunction: 'Động từ · Ending' }
    ]
  },
  {
    hints: [
        { text: 'Mất file gốc', translation: 'lost source file', typeFunction: 'Danh từ · Keyword' },
        { text: 'tá hỏa', translation: 'freak out', typeFunction: 'Động từ · Ending' }
    ]
  },
  {
    hints: [
        { text: 'Lỗi tham chiếu ô', translation: 'cell reference error', typeFunction: 'Danh từ · Keyword' },
        { text: 'dò từng bước', translation: 'trace step-by-step', typeFunction: 'Động từ · Ending' }
    ]
  },
  {
    hints: [
        { text: 'Khôi phục tài liệu', translation: 'document recovery', typeFunction: 'Danh từ · Keyword' },
        { text: 'thành công', translation: 'successful', typeFunction: 'Tính từ · Ending' }
    ]
  },
  {
    hints: [
        { text: 'Biểu đồ trực quan', translation: 'visual chart', typeFunction: 'Danh từ · Keyword' },
        { text: 'dễ hiểu', translation: 'crystal clear', typeFunction: 'Tính từ · Ending' }
    ]
  },
  {
    hints: [
        { text: 'Dân văn phòng', translation: 'office workers', typeFunction: 'Danh từ · Keyword' },
        { text: 'than vãn', translation: 'complain', typeFunction: 'Động từ · Ending' }
    ]
  },
  {
    hints: [
        { text: 'Nhập liệu thủ công', translation: 'data entry', typeFunction: 'Danh từ · Keyword' },
        { text: 'mỏi nhừ mắt', translation: 'eye strain', typeFunction: 'Danh từ · Ending' }
    ]
  },
  {
    hints: [
        { text: 'Hạn chót dí sát', translation: 'tight deadline', typeFunction: 'Danh từ · Keyword' },
        { text: 'chạy nước rút', translation: 'scramble', typeFunction: 'Động từ · Ending' }
    ]
  },
  {
    hints: [
        { text: 'Máy tính sập nguồn', translation: 'system crash', typeFunction: 'Danh từ · Keyword' },
        { text: 'ức chế', translation: 'frustrated', typeFunction: 'Tính từ · Ending' }
    ]
  },
  {
    hints: [
        { text: 'Bộ lọc tự động', translation: 'auto filter', typeFunction: 'Danh từ · Keyword' },
        { text: 'phân loại nhanh', translation: 'sort quickly', typeFunction: 'Động từ · Ending' }
    ]
  },
  {
    hints: [
        { text: 'Chốt số liệu tháng', translation: 'finalize figures', typeFunction: 'Động từ · Keyword' },
        { text: 'đúng tiến độ', translation: 'on schedule', typeFunction: 'Trạng từ · Ending' }
    ]
  },
  {
    hints: [
        { text: 'Phần mềm kế toán', translation: 'accounting tool', typeFunction: 'Danh từ · Keyword' },
        { text: 'nâng cấp', translation: 'upgrade', typeFunction: 'Động từ · Ending' }
    ]
  }
];

// Session 2: 30 items, hcTotal = 3, hintTypes: ['Keyword', 'Logic word', 'Ending']
const s2_items: ItemDef[] = [
  {
    hints: [
        { text: 'File báo cáo tài chính', translation: 'financial spreadsheet', typeFunction: 'Danh từ · Keyword' },
        { text: 'tuy nhiên', translation: 'however', typeFunction: 'Từ nối · Logic word' },
        { text: 'quá nặng', translation: 'overly heavy', typeFunction: 'Tính từ · Ending' }
    ]
  },
  {
    hints: [
        { text: 'Tính tay số liệu', translation: 'manual calculation', typeFunction: 'Danh từ · Keyword' },
        { text: 'trước đó', translation: 'before that', typeFunction: 'Từ nối · Logic word' },
        { text: 'tốn thời gian', translation: 'time consuming', typeFunction: 'Tính từ · Ending' }
    ]
  },
  {
    hints: [
        { text: 'Nhấn phím escape', translation: 'press escape key', typeFunction: 'Động từ · Keyword' },
        { text: 'đồng thời', translation: 'meanwhile', typeFunction: 'Từ nối · Logic word' },
        { text: 'chờ phản hồi', translation: 'wait for response', typeFunction: 'Động từ · Ending' }
    ]
  },
  {
    hints: [
        { text: 'Màn hình đơ cứng', translation: 'frozen screen', typeFunction: 'Danh từ · Keyword' },
        { text: 'do đó', translation: 'therefore', typeFunction: 'Từ nối · Logic word' },
        { text: 'phải tắt ứng dụng', translation: 'force quit', typeFunction: 'Động từ · Ending' }
    ]
  },
  {
    hints: [
        { text: 'Gỡ phần mềm nặng', translation: 'uninstall heavy app', typeFunction: 'Động từ · Keyword' },
        { text: 'nếu không', translation: 'otherwise', typeFunction: 'Từ nối · Logic word' },
        { text: 'máy bị treo', translation: 'computer hangs', typeFunction: 'Động từ · Ending' }
    ]
  },
  {
    hints: [
        { text: 'Bậc thầy bảng tính', translation: 'spreadsheet guru', typeFunction: 'Danh từ · Keyword' },
        { text: 'hơn nữa', translation: 'in addition', typeFunction: 'Từ nối · Logic word' },
        { text: 'rất nhiệt tình', translation: 'warmhearted', typeFunction: 'Tính từ · Ending' }
    ]
  },
  {
    hints: [
        { text: 'Thanh tác vụ biến mất', translation: 'taskbar gone', typeFunction: 'Danh từ · Keyword' },
        { text: 'sau đó', translation: 'then', typeFunction: 'Từ nối · Logic word' },
        { text: 'tìm cách phục hồi', translation: 'restore it', typeFunction: 'Động từ · Ending' }
    ]
  },
  {
    hints: [
        { text: 'Công thức lồng nhau', translation: 'nested formula', typeFunction: 'Danh từ · Keyword' },
        { text: 'ví dụ', translation: 'for example', typeFunction: 'Từ nối · Logic word' },
        { text: 'hàm VLOOKUP', translation: 'lookup function', typeFunction: 'Danh từ · Ending' }
    ]
  },
  {
    hints: [
        { text: 'Từng ô bảng tính', translation: 'each cell', typeFunction: 'Danh từ · Keyword' },
        { text: 'miễn là', translation: 'as long as', typeFunction: 'Từ nối · Logic word' },
        { text: 'đúng công thức', translation: 'accurate syntax', typeFunction: 'Tính từ · Ending' }
    ]
  },
  {
    hints: [
        { text: 'Lăn chuột kiểm tra', translation: 'scroll down to check', typeFunction: 'Động từ · Keyword' },
        { text: 'sau cùng', translation: 'eventually', typeFunction: 'Từ nối · Logic word' },
        { text: 'phát hiện lỗi sai', translation: 'spot errors', typeFunction: 'Động từ · Ending' }
    ]
  },
  {
    hints: [
        { text: 'Kỹ năng Excel', translation: 'Excel skills', typeFunction: 'Danh từ · Keyword' },
        { text: 'bởi vì', translation: 'because', typeFunction: 'Từ nối · Logic word' },
        { text: 'rất cần thiết', translation: 'vital for job', typeFunction: 'Tính từ · Ending' }
    ]
  },
  {
    hints: [
        { text: 'Dung lượng ổ C', translation: 'disk C capacity', typeFunction: 'Danh từ · Keyword' },
        { text: 'ngoài ra', translation: 'besides', typeFunction: 'Từ nối · Logic word' },
        { text: 'sắp cạn kiệt', translation: 'almost full', typeFunction: 'Tính từ · Ending' }
    ]
  },
  {
    hints: [
        { text: 'Khởi động lại máy tính', translation: 'restart computer', typeFunction: 'Động từ · Keyword' },
        { text: 'tiếp theo', translation: 'next', typeFunction: 'Từ nối · Logic word' },
        { text: 'mở lại tập tin', translation: 'reopen file', typeFunction: 'Động từ · Ending' }
    ]
  },
  {
    hints: [
        { text: 'Tính năng lưu tự động', translation: 'autosave option', typeFunction: 'Danh từ · Keyword' },
        { text: 'nói cách khác', translation: 'in other words', typeFunction: 'Từ nối · Logic word' },
        { text: 'cứu cánh tuyệt vời', translation: 'great lifesaver', typeFunction: 'Danh từ · Ending' }
    ]
  },
  {
    hints: [
        { text: 'Ly trà sữa full toppings', translation: 'topped boba cup', typeFunction: 'Danh từ · Keyword' },
        { text: 'trái lại', translation: 'in contrast', typeFunction: 'Từ nối · Logic word' },
        { text: 'giúp tỉnh táo', translation: 'keep alert', typeFunction: 'Động từ · Ending' }
    ]
  },
  {
    hints: [
        { text: 'Phím tắt hữu ích', translation: 'handy shortcut', typeFunction: 'Danh từ · Keyword' },
        { text: 'cho nên', translation: 'so that', typeFunction: 'Từ nối · Logic word' },
        { text: 'tăng tốc độ gõ', translation: 'speed up work', typeFunction: 'Động từ · Ending' }
    ]
  },
  {
    hints: [
        { text: 'Mất dữ liệu quý', translation: 'data loss', typeFunction: 'Danh từ · Keyword' },
        { text: 'thay vào đó', translation: 'instead', typeFunction: 'Từ nối · Logic word' },
        { text: 'dùng bản sao lưu', translation: 'use backup copy', typeFunction: 'Động từ · Ending' }
    ]
  },
  {
    hints: [
        { text: 'Lỗi tham chiếu vòng', translation: 'circular reference', typeFunction: 'Danh từ · Keyword' },
        { text: 'dù vậy', translation: 'nevertheless', typeFunction: 'Từ nối · Logic word' },
        { text: 'dễ khắc phục', translation: 'easy to patch', typeFunction: 'Tính từ · Ending' }
    ]
  },
  {
    hints: [
        { text: 'Dân chuyên phân tích', translation: 'data analysts', typeFunction: 'Danh từ · Keyword' },
        { text: 'đặc biệt là', translation: 'especially', typeFunction: 'Từ nối · Logic word' },
        { text: 'thích bảng biểu', translation: 'love charts', typeFunction: 'Động từ · Ending' }
    ]
  },
  {
    hints: [
        { text: 'Hạn chót báo cáo', translation: 'report deadline', typeFunction: 'Danh từ · Keyword' },
        { text: 'cùng lắm', translation: 'at worst', typeFunction: 'Từ nối · Logic word' },
        { text: 'xin gia hạn thêm', translation: 'request extension', typeFunction: 'Động từ · Ending' }
    ]
  },
  {
    hints: [
        { text: 'Tự động tính toán lại', translation: 'auto recalculate', typeFunction: 'Động từ · Keyword' },
        { text: 'ngay sau đó', translation: 'right afterwards', typeFunction: 'Từ nối · Logic word' },
        { text: 'cập nhật kết quả', translation: 'refresh numbers', typeFunction: 'Động từ · Ending' }
    ]
  },
  {
    hints: [
        { text: 'Biểu đồ tròn trực quan', translation: 'visual pie chart', typeFunction: 'Danh từ · Keyword' },
        { text: 'thực ra', translation: 'actually', typeFunction: 'Từ nối · Logic word' },
        { text: 'rất thuyết phục', translation: 'compelling', typeFunction: 'Tính từ · Ending' }
    ]
  },
  {
    hints: [
        { text: 'Khôi phục văn bản', translation: 'recover doc', typeFunction: 'Động từ · Keyword' },
        { text: 'sau hết', translation: 'after all', typeFunction: 'Từ nối · Logic word' },
        { text: 'không mất gì cả', translation: 'intact', typeFunction: 'Tính từ · Ending' }
    ]
  },
  {
    hints: [
        { text: 'Thao tác nhập liệu', translation: 'data entry steps', typeFunction: 'Danh từ · Keyword' },
        { text: 'miễn sao', translation: 'provided that', typeFunction: 'Từ nối · Logic word' },
        { text: 'chuẩn xác tuyệt đối', translation: 'spot on', typeFunction: 'Tính từ · Ending' }
    ]
  },
  {
    hints: [
        { text: 'Phần mềm bảng tính', translation: 'spreadsheet suite', typeFunction: 'Danh từ · Keyword' },
        { text: 'kể từ đó', translation: 'since then', typeFunction: 'Từ nối · Logic word' },
        { text: 'chạy trơn tru', translation: 'run smoothly', typeFunction: 'Trạng từ · Ending' }
    ]
  },
  {
    hints: [
        { text: 'Tập tin bị hỏng', translation: 'corrupted file', typeFunction: 'Danh từ · Keyword' },
        { text: 'chính vì thế', translation: 'for that reason', typeFunction: 'Từ nối · Logic word' },
        { text: 'phải gửi kỹ thuật', translation: 'call IT support', typeFunction: 'Động từ · Ending' }
    ]
  },
  {
    hints: [
        { text: 'Đồng nghiệp kế bên', translation: 'desk neighbor', typeFunction: 'Danh từ · Keyword' },
        { text: 'rốt cuộc', translation: 'in the end', typeFunction: 'Từ nối · Logic word' },
        { text: 'giải cứu kịp thời', translation: 'save the day', typeFunction: 'Động từ · Ending' }
    ]
  },
  {
    hints: [
        { text: 'Bộ nhớ tạm thời', translation: 'RAM buffer', typeFunction: 'Danh từ · Keyword' },
        { text: 'tóm lại', translation: 'in short', typeFunction: 'Từ nối · Logic word' },
        { text: 'cần dọn dẹp', translation: 'needs clearing', typeFunction: 'Động từ · Ending' }
    ]
  },
  {
    hints: [
        { text: 'Số liệu cuối tháng', translation: 'month-end figures', typeFunction: 'Danh từ · Keyword' },
        { text: 'nói chung', translation: 'on the whole', typeFunction: 'Từ nối · Logic word' },
        { text: 'khớp hoàn toàn', translation: 'match perfectly', typeFunction: 'Động từ · Ending' }
    ]
  },
  {
    hints: [
        { text: 'Khao trà sữa', translation: 'treat boba', typeFunction: 'Động từ · Keyword' },
        { text: 'kết quả là', translation: 'as a result', typeFunction: 'Từ nối · Logic word' },
        { text: 'cả phòng vui vẻ', translation: 'team delighted', typeFunction: 'Tính từ · Ending' }
    ]
  }
];

// Session 3: 30 items, hcTotal = 4, hintTypes: ['Keyword', 'Logic word', 'Fancy word', 'Ending']
const s3_items: ItemDef[] = [
  {
    hints: [
        { text: 'Báo cáo tài chính', translation: 'financial spreadsheet', typeFunction: 'Danh từ · Keyword' },
        { text: 'trong khi', translation: 'while', typeFunction: 'Từ nối · Logic word' },
        { text: 'mớ bòng bong', translation: 'tangled mess', typeFunction: 'Ẩn dụ · Fancy word' },
        { text: 'gỡ rối từng dòng', translation: 'untangle row by row', typeFunction: 'Động từ · Ending' }
    ]
  },
  {
    hints: [
        { text: 'Khi nào', translation: 'When', typeFunction: 'Cụm nghi vấn · WH word' },
        { text: 'nếu không', translation: 'otherwise', typeFunction: 'Từ nối · Logic word' },
        { text: 'đơ như đá', translation: 'frozen solid', typeFunction: 'Ẩn dụ · Fancy word' },
        { text: 'mất hết công sức', translation: 'all gone', typeFunction: 'Tính từ · Ending' }
    ]
  },
  {
    hints: [
        { text: 'Phím escape', translation: 'escape key', typeFunction: 'Danh từ · Keyword' },
        { text: 'tuy nhiên', translation: 'however', typeFunction: 'Từ nối · Logic word' },
        { text: 'phao cứu sinh', translation: 'lifeline', typeFunction: 'Ẩn dụ · Fancy word' },
        { text: 'dừng kịp lệnh treo', translation: 'halt freeze', typeFunction: 'Động từ · Ending' }
    ]
  },
  {
    hints: [
        { text: 'Bậc thầy Excel', translation: 'Excel guru', typeFunction: 'Danh từ · Keyword' },
        { text: 'do đó', translation: 'therefore', typeFunction: 'Từ nối · Logic word' },
        { text: 'viên đạn bạc', translation: 'silver bullet', typeFunction: 'Ẩn dụ · Fancy word' },
        { text: 'hóa giải mọi lỗi', translation: 'fix all bugs', typeFunction: 'Động từ · Ending' }
    ]
  },
  {
    hints: [
        { text: 'File dung lượng khủng', translation: 'monstrous spreadsheet', typeFunction: 'Danh từ · Keyword' },
        { text: 'mặc dù', translation: 'although', typeFunction: 'Từ nối · Logic word' },
        { text: 'ác mộng số liệu', translation: 'data nightmare', typeFunction: 'Ẩn dụ · Fancy word' },
        { text: 'vẫn phải xử lý', translation: 'must crunch', typeFunction: 'Động từ · Ending' }
    ]
  },
  {
    hints: [
        { text: 'Vì sao', translation: 'Why', typeFunction: 'Cụm nghi vấn · WH word' },
        { text: 'hơn nữa', translation: 'moreover', typeFunction: 'Từ nối · Logic word' },
        { text: 'công dã tràng', translation: 'wild goose chase', typeFunction: 'Thành ngữ · Fancy word' },
        { text: 'nếu quên bấm lưu', translation: 'if forget saving', typeFunction: 'Trạng từ · Ending' }
    ]
  },
  {
    hints: [
        { text: 'Thanh tác vụ', translation: 'taskbar', typeFunction: 'Danh từ · Keyword' },
        { text: 'sau đó', translation: 'then', typeFunction: 'Từ nối · Logic word' },
        { text: 'biến mất không dấu vết', translation: 'vanish into thin air', typeFunction: 'Ẩn dụ · Fancy word' },
        { text: 'gây lúng túng', translation: 'baffle user', typeFunction: 'Động từ · Ending' }
    ]
  },
  {
    hints: [
        { text: 'Từng ô tính', translation: 'data cell', typeFunction: 'Danh từ · Keyword' },
        { text: 'thay vào đó', translation: 'instead', typeFunction: 'Từ nối · Logic word' },
        { text: 'mò kim đáy bể', translation: 'needle in haystack', typeFunction: 'Thành ngữ · Fancy word' },
        { text: 'tìm ô sai lệch', translation: 'hunt wrong entry', typeFunction: 'Động từ · Ending' }
    ]
  },
  {
    hints: [
        { text: 'Bao lâu', translation: 'How long', typeFunction: 'Cụm nghi vấn · WH word' },
        { text: 'nếu', translation: 'if', typeFunction: 'Từ nối · Logic word' },
        { text: 'rùa bò', translation: 'at snail pace', typeFunction: 'Ẩn dụ · Fancy word' },
        { text: 'chờ máy tính toán', translation: 'wait for recalculate', typeFunction: 'Động từ · Ending' }
    ]
  },
  {
    hints: [
        { text: 'Gỡ bỏ phần mềm', translation: 'uninstall bloatware', typeFunction: 'Động từ · Keyword' },
        { text: 'cho nên', translation: 'so that', typeFunction: 'Từ nối · Logic word' },
        { text: 'liều thuốc trợ tim', translation: 'shot in the arm', typeFunction: 'Ẩn dụ · Fancy word' },
        { text: 'máy mượt mà lại', translation: 'speed restored', typeFunction: 'Tính từ · Ending' }
    ]
  },
  {
    hints: [
        { text: 'Ổ cứng C đầy', translation: 'drive C full', typeFunction: 'Danh từ · Keyword' },
        { text: 'trái lại', translation: 'in contrast', typeFunction: 'Từ nối · Logic word' },
        { text: 'quả bom nổ chậm', translation: 'ticking time bomb', typeFunction: 'Ẩn dụ · Fancy word' },
        { text: 'cần dọn ngay', translation: 'purge immediately', typeFunction: 'Động từ · Ending' }
    ]
  },
  {
    hints: [
        { text: 'Hàm tính thông minh', translation: 'smart macro', typeFunction: 'Danh từ · Keyword' },
        { text: 'miễn là', translation: 'as long as', typeFunction: 'Từ nối · Logic word' },
        { text: 'đũa thần công nghệ', translation: 'magic wand', typeFunction: 'Ẩn dụ · Fancy word' },
        { text: 'tự động hoàn tất', translation: 'auto complete', typeFunction: 'Động từ · Ending' }
    ]
  },
  {
    hints: [
        { text: 'Lỗi cú pháp', translation: 'formula error', typeFunction: 'Danh từ · Keyword' },
        { text: 'tiếp theo', translation: 'next', typeFunction: 'Từ nối · Logic word' },
        { text: 'vết nứt nhỏ', translation: 'tiny crack', typeFunction: 'Ẩn dụ · Fancy word' },
        { text: 'làm hỏng cả bảng', translation: 'ruin entire sheet', typeFunction: 'Động từ · Ending' }
    ]
  },
  {
    hints: [
        { text: 'Ở đâu', translation: 'Where', typeFunction: 'Cụm nghi vấn · WH word' },
        { text: 'đồng thời', translation: 'meanwhile', typeFunction: 'Từ nối · Logic word' },
        { text: 'chìa khóa vàng', translation: 'golden key', typeFunction: 'Ẩn dụ · Fancy word' },
        { text: 'mở khóa file khóa', translation: 'unlock sheet', typeFunction: 'Động từ · Ending' }
    ]
  },
  {
    hints: [
        { text: 'Sao mặt đưa đám', translation: 'why the long face', typeFunction: 'Cụm chêm · Keyword' },
        { text: 'bởi thế', translation: 'for that reason', typeFunction: 'Từ nối · Logic word' },
        { text: 'sét đánh ngang tai', translation: 'bolt from blue', typeFunction: 'Ẩn dụ · Fancy word' },
        { text: 'file chưa kịp lưu', translation: 'unsaved work', typeFunction: 'Danh từ · Ending' }
    ]
  },
  {
    hints: [
        { text: 'Khôi phục tập tin', translation: 'file restore', typeFunction: 'Danh từ · Keyword' },
        { text: 'dẫu vậy', translation: 'even so', typeFunction: 'Từ nối · Logic word' },
        { text: 'tia hi vọng cuối', translation: 'ray of hope', typeFunction: 'Ẩn dụ · Fancy word' },
        { text: 'cứu vãn tình hình', translation: 'salvage day', typeFunction: 'Động từ · Ending' }
    ]
  },
  {
    hints: [
        { text: 'Nhập liệu thủ công', translation: 'manual entry', typeFunction: 'Danh từ · Keyword' },
        { text: 'sau cùng', translation: 'eventually', typeFunction: 'Từ nối · Logic word' },
        { text: 'gánh nặng ngàn cân', translation: 'crushing burden', typeFunction: 'Ẩn dụ · Fancy word' },
        { text: 'kiệt sức hoàn toàn', translation: 'burned out', typeFunction: 'Tính từ · Ending' }
    ]
  },
  {
    hints: [
        { text: 'Trà sữa trân châu', translation: 'boba reward', typeFunction: 'Danh từ · Keyword' },
        { text: 'ngoài ra', translation: 'besides', typeFunction: 'Từ nối · Logic word' },
        { text: 'nguồn năng lượng ngọt', translation: 'sweet fuel', typeFunction: 'Ẩn dụ · Fancy word' },
        { text: 'giải tỏa căng thẳng', translation: 'melt away stress', typeFunction: 'Động từ · Ending' }
    ]
  },
  {
    hints: [
        { text: 'Tại sao', translation: 'Why', typeFunction: 'Cụm nghi vấn · WH word' },
        { text: 'trừ khi', translation: 'unless', typeFunction: 'Từ nối · Logic word' },
        { text: 'bức tường kiên cố', translation: 'stone wall', typeFunction: 'Ẩn dụ · Fancy word' },
        { text: 'mật khẩu mã hóa', translation: 'locked cell', typeFunction: 'Danh từ · Ending' }
    ]
  },
  {
    hints: [
        { text: 'Dân văn phòng', translation: 'corporate staff', typeFunction: 'Danh từ · Keyword' },
        { text: 'trước hết', translation: 'first of all', typeFunction: 'Từ nối · Logic word' },
        { text: 'chuột bạch thí nghiệm', translation: 'guinea pig', typeFunction: 'Ẩn dụ · Fancy word' },
        { text: 'thử phần mềm mới', translation: 'test beta tool', typeFunction: 'Động từ · Ending' }
    ]
  },
  {
    hints: [
        { text: 'Hạn chót dí sát', translation: 'brutal deadline', typeFunction: 'Danh từ · Keyword' },
        { text: 'rốt cuộc', translation: 'in the end', typeFunction: 'Từ nối · Logic word' },
        { text: 'nước sôi lửa bỏng', translation: 'in hot water', typeFunction: 'Thành ngữ · Fancy word' },
        { text: 'thức trắng cả đêm', translation: 'pull all-nighter', typeFunction: 'Động từ · Ending' }
    ]
  },
  {
    hints: [
        { text: 'Phím tắt bàn phím', translation: 'hotkeys', typeFunction: 'Danh từ · Keyword' },
        { text: 'nói cách khác', translation: 'in other words', typeFunction: 'Từ nối · Logic word' },
        { text: 'đôi cánh tốc độ', translation: 'wings of speed', typeFunction: 'Ẩn dụ · Fancy word' },
        { text: 'nâng tầm năng suất', translation: 'boost productivity', typeFunction: 'Động từ · Ending' }
    ]
  },
  {
    hints: [
        { text: 'Bảng tính doanh số', translation: 'sales spreadsheet', typeFunction: 'Danh từ · Keyword' },
        { text: 'dù sao', translation: 'anyway', typeFunction: 'Từ nối · Logic word' },
        { text: 'xương sống công ty', translation: 'backbone', typeFunction: 'Ẩn dụ · Fancy word' },
        { text: 'phải tuyệt đối chuẩn', translation: 'flawless', typeFunction: 'Tính từ · Ending' }
    ]
  },
  {
    hints: [
        { text: 'Bằng cách nào', translation: 'How', typeFunction: 'Cụm nghi vấn · WH word' },
        { text: 'nếu như', translation: 'in case', typeFunction: 'Từ nối · Logic word' },
        { text: 'chớp mắt', translation: 'in a flash', typeFunction: 'Ẩn dụ · Fancy word' },
        { text: 'lọc cả triệu dòng', translation: 'filter million rows', typeFunction: 'Động từ · Ending' }
    ]
  },
  {
    hints: [
        { text: 'Đội ngũ IT', translation: 'IT support', typeFunction: 'Danh từ · Keyword' },
        { text: 'tuy vậy', translation: 'nonetheless', typeFunction: 'Từ nối · Logic word' },
        { text: 'người hùng thầm lặng', translation: 'unsung heroes', typeFunction: 'Ẩn dụ · Fancy word' },
        { text: 'khắc phục sự cố', translation: 'resolve crash', typeFunction: 'Động từ · Ending' }
    ]
  },
  {
    hints: [
        { text: 'Sập nguồn đột ngột', translation: 'power outage', typeFunction: 'Danh từ · Keyword' },
        { text: 'chính vì vậy', translation: 'hence', typeFunction: 'Từ nối · Logic word' },
        { text: 'vỡ trận', translation: 'total chaos', typeFunction: 'Ẩn dụ · Fancy word' },
        { text: 'phải hoãn cuộc họp', translation: 'postpone meeting', typeFunction: 'Động từ · Ending' }
    ]
  },
  {
    hints: [
        { text: 'Báo cáo hợp nhất', translation: 'consolidated report', typeFunction: 'Danh từ · Keyword' },
        { text: 'sau đó', translation: 'afterwards', typeFunction: 'Từ nối · Logic word' },
        { text: 'bức tranh hoàn chỉnh', translation: 'complete mosaic', typeFunction: 'Ẩn dụ · Fancy word' },
        { text: 'gửi lên sếp tổng', translation: 'submit to CEO', typeFunction: 'Động từ · Ending' }
    ]
  },
  {
    hints: [
        { text: 'Chi phí phần mềm', translation: 'software licenses', typeFunction: 'Danh từ · Keyword' },
        { text: 'cuối cùng', translation: 'ultimately', typeFunction: 'Từ nối · Logic word' },
        { text: 'khoản đầu tư vàng', translation: 'golden investment', typeFunction: 'Ẩn dụ · Fancy word' },
        { text: 'tiết kiệm tiền tỷ', translation: 'save fortunes', typeFunction: 'Động từ · Ending' }
    ]
  },
  {
    hints: [
        { text: 'Công cụ tự động hóa', translation: 'automation script', typeFunction: 'Danh từ · Keyword' },
        { text: 'trái lại', translation: 'on the contrary', typeFunction: 'Từ nối · Logic word' },
        { text: 'người khổng lồ', translation: 'workhorse powerhouse', typeFunction: 'Ẩn dụ · Fancy word' },
        { text: 'gánh hết việc nặng', translation: 'bear heavy burden', typeFunction: 'Động từ · Ending' }
    ]
  },
  {
    hints: [
        { text: 'Có vậy thôi đó', translation: 'simple as that', typeFunction: 'Cụm chêm · Keyword' },
        { text: 'kết quả là', translation: 'as a result', typeFunction: 'Từ nối · Logic word' },
        { text: 'thở phào nhẹ nhõm', translation: 'sigh of relief', typeFunction: 'Ẩn dụ · Fancy word' },
        { text: 'về nhà đúng giờ', translation: 'leave on time', typeFunction: 'Động từ · Ending' }
    ]
  }
];

// Session 4: 30 items, hcTotal = 5, hintTypes: ['Intro / Setup', 'Keyword', 'Logic word', 'Fancy word', 'Ending']
const s4_items: ItemDef[] = [
  {
    hints: [
        { text: 'Sao mặt đưa đám vậy', translation: 'Why the long face', typeFunction: 'Cụm mào đầu · Intro' },
        { text: 'file báo cáo tài chính', translation: 'financial spreadsheet', typeFunction: 'Danh từ · Keyword' },
        { text: 'tuy nhiên', translation: 'however', typeFunction: 'Từ nối · Logic word' },
        { text: 'đơ như cây cơ', translation: 'frozen solid', typeFunction: 'Ẩn dụ · Fancy word' },
        { text: 'chưa kịp lưu', translation: 'not yet saved', typeFunction: 'Tính từ · Ending' }
    ]
  },
  {
    hints: [
        { text: 'Trong những lúc như vầy', translation: 'In times like these', typeFunction: 'Cụm mào đầu · Intro' },
        { text: 'phím escape', translation: 'escape key', typeFunction: 'Danh từ · Keyword' },
        { text: 'do đó', translation: 'therefore', typeFunction: 'Từ nối · Logic word' },
        { text: 'phao cứu sinh', translation: 'lifesaver', typeFunction: 'Ẩn dụ · Fancy word' },
        { text: 'giúp hủy tác vụ', translation: 'abort frozen task', typeFunction: 'Động từ · Ending' }
    ]
  },
  {
    hints: [
        { text: 'Chuyện là vầy', translation: 'Here is the thing', typeFunction: 'Cụm mào đầu · Intro' },
        { text: 'tính tay số liệu', translation: 'manual calculations', typeFunction: 'Danh từ · Keyword' },
        { text: 'mặc dù', translation: 'although', typeFunction: 'Từ nối · Logic word' },
        { text: 'con sâu làm rầu nồi canh', translation: 'bad apple bug', typeFunction: 'Thành ngữ · Fancy word' },
        { text: 'dễ sai lệch', translation: 'wildly inaccurate', typeFunction: 'Tính từ · Ending' }
    ]
  },
  {
    hints: [
        { text: 'Có vậy thôi đó', translation: 'There you have it', typeFunction: 'Cụm mào đầu · Intro' },
        { text: 'bậc thầy Excel', translation: 'Excel wizard', typeFunction: 'Danh từ · Keyword' },
        { text: 'hơn nữa', translation: 'moreover', typeFunction: 'Từ nối · Logic word' },
        { text: 'búng tay một cái', translation: 'in a snap', typeFunction: 'Cụm gợi hình · Fancy word' },
        { text: 'xong luôn bảng tính', translation: 'sheet finished', typeFunction: 'Tính từ · Ending' }
    ]
  },
  {
    hints: [
        { text: 'Tui biết ngay mà', translation: 'I knew it', typeFunction: 'Cụm mào đầu · Intro' },
        { text: 'ổ cứng C đầy ắp', translation: 'drive C crammed', typeFunction: 'Danh từ · Keyword' },
        { text: 'sau đó', translation: 'then', typeFunction: 'Từ nối · Logic word' },
        { text: 'rùa bò', translation: 'snail pace', typeFunction: 'Ẩn dụ · Fancy word' },
        { text: 'máy treo cứng ngắc', translation: 'stuck completely', typeFunction: 'Tính từ · Ending' }
    ]
  },
  {
    hints: [
        { text: 'Đừng có hối tui', translation: 'Don not push me', typeFunction: 'Cụm mào đầu · Intro' },
        { text: 'công thức phức tạp', translation: 'nested formula', typeFunction: 'Danh từ · Keyword' },
        { text: 'thực chất là', translation: 'actually', typeFunction: 'Từ nối · Logic word' },
        { text: 'mớ bòng bong', translation: 'tangled web', typeFunction: 'Ẩn dụ · Fancy word' },
        { text: 'cần kiên nhẫn sửa', translation: 'fix patiently', typeFunction: 'Động từ · Ending' }
    ]
  },
  {
    hints: [
        { text: 'Nếu cần', translation: 'If need be', typeFunction: 'Cụm mào đầu · Intro' },
        { text: 'gỡ bỏ phần mềm', translation: 'uninstall app', typeFunction: 'Động từ · Keyword' },
        { text: 'miễn là', translation: 'as long as', typeFunction: 'Từ nối · Logic word' },
        { text: 'liều thuốc giải độc', translation: 'clean detox', typeFunction: 'Ẩn dụ · Fancy word' },
        { text: 'cho hệ thống chạy êm', translation: 'smooth sailing', typeFunction: 'Tính từ · Ending' }
    ]
  },
  {
    hints: [
        { text: 'Hết 9 trên 10 lần', translation: 'Nine times out of ten', typeFunction: 'Cụm mào đầu · Intro' },
        { text: 'người dùng mới', translation: 'novice users', typeFunction: 'Danh từ · Keyword' },
        { text: 'nếu không', translation: 'otherwise', typeFunction: 'Từ nối · Logic word' },
        { text: 'ngã ngửa', translation: 'caught off guard', typeFunction: 'Cụm gợi hình · Fancy word' },
        { text: 'quên bật sao lưu', translation: 'forget backup', typeFunction: 'Động từ · Ending' }
    ]
  },
  {
    hints: [
        { text: 'Ý cậu sao', translation: 'What do you say', typeFunction: 'Cụm mào đầu · Intro' },
        { text: 'ly trà sữa trân châu', translation: 'boba treat', typeFunction: 'Danh từ · Keyword' },
        { text: 'đồng thời', translation: 'meanwhile', typeFunction: 'Từ nối · Logic word' },
        { text: 'phần thưởng ngọt ngào', translation: 'sweet reward', typeFunction: 'Ẩn dụ · Fancy word' },
        { text: 'sau giờ tăng ca', translation: 'after overtime', typeFunction: 'Danh từ · Ending' }
    ]
  },
  {
    hints: [
        { text: 'Ủa lạ vậy', translation: 'Wait that is strange', typeFunction: 'Cụm mào đầu · Intro' },
        { text: 'thanh tác vụ', translation: 'desktop taskbar', typeFunction: 'Danh từ · Keyword' },
        { text: 'cho nên', translation: 'so that', typeFunction: 'Từ nối · Logic word' },
        { text: 'tàng hình', translation: 'invisible cloak', typeFunction: 'Ẩn dụ · Fancy word' },
        { text: 'không thấy nút start', translation: 'start button gone', typeFunction: 'Tính từ · Ending' }
    ]
  },
  {
    hints: [
        { text: 'Vào lúc này', translation: 'At the moment', typeFunction: 'Cụm mào đầu · Intro' },
        { text: 'file dung lượng lớn', translation: 'huge spreadsheet', typeFunction: 'Danh từ · Keyword' },
        { text: 'trái lại', translation: 'in contrast', typeFunction: 'Từ nối · Logic word' },
        { text: 'cỗ xe nặng trĩu', translation: 'heavy carriage', typeFunction: 'Ẩn dụ · Fancy word' },
        { text: 'ngốn sạch bộ nhớ', translation: 'eat up RAM', typeFunction: 'Động từ · Ending' }
    ]
  },
  {
    hints: [
        { text: 'Nói thiệt lòng', translation: 'Truth be told', typeFunction: 'Cụm mào đầu · Intro' },
        { text: 'rất cùi Excel', translation: 'bad at Excel', typeFunction: 'Cụm chêm · Keyword' },
        { text: 'dù vậy', translation: 'even so', typeFunction: 'Từ nối · Logic word' },
        { text: 'cần cù bù thông minh', translation: 'slow and steady', typeFunction: 'Thành ngữ · Fancy word' },
        { text: 'học hỏi mỗi ngày', translation: 'learn daily', typeFunction: 'Động từ · Ending' }
    ]
  },
  {
    hints: [
        { text: 'Để ý xem', translation: 'Observe closely', typeFunction: 'Cụm mào đầu · Intro' },
        { text: 'lăn chuột xuống dưới', translation: 'scroll to bottom', typeFunction: 'Động từ · Keyword' },
        { text: 'tiếp theo', translation: 'next', typeFunction: 'Từ nối · Logic word' },
        { text: 'hố sâu số liệu', translation: 'deep data pit', typeFunction: 'Ẩn dụ · Fancy word' },
        { text: 'sẽ thấy dòng tổng', translation: 'spot total row', typeFunction: 'Động từ · Ending' }
    ]
  },
  {
    hints: [
        { text: 'Nói cách khác', translation: 'In other words', typeFunction: 'Cụm mào đầu · Intro' },
        { text: 'phím tắt định dạng', translation: 'format hotkey', typeFunction: 'Danh từ · Keyword' },
        { text: 'bởi vì', translation: 'because', typeFunction: 'Từ nối · Logic word' },
        { text: 'cây đũa thần kỳ', translation: 'magic wand', typeFunction: 'Ẩn dụ · Fancy word' },
        { text: 'tiết kiệm cả tiếng', translation: 'save hours', typeFunction: 'Động từ · Ending' }
    ]
  },
  {
    hints: [
        { text: 'Thực tế thì', translation: 'As a matter of fact', typeFunction: 'Cụm mào đầu · Intro' },
        { text: 'lỗi tham chiếu ô', translation: 'reference glitch', typeFunction: 'Danh từ · Keyword' },
        { text: 'ngoài ra', translation: 'besides', typeFunction: 'Từ nối · Logic word' },
        { text: 'quả cầu tuyết lăn', translation: 'snowball effect', typeFunction: 'Ẩn dụ · Fancy word' },
        { text: 'sai dây chuyền', translation: 'chain reaction', typeFunction: 'Tính từ · Ending' }
    ]
  },
  {
    hints: [
        { text: 'Đừng lo lắng', translation: 'Do not panic', typeFunction: 'Cụm mào đầu · Intro' },
        { text: 'tính năng khôi phục', translation: 'recovery option', typeFunction: 'Danh từ · Keyword' },
        { text: 'thay vào đó', translation: 'instead', typeFunction: 'Từ nối · Logic word' },
        { text: 'chiếc phao cứu sinh', translation: 'safety net', typeFunction: 'Ẩn dụ · Fancy word' },
        { text: 'lấy lại văn bản', translation: 'retrieve files', typeFunction: 'Động từ · Ending' }
    ]
  },
  {
    hints: [
        { text: 'Tui cũng rứa', translation: 'Same here', typeFunction: 'Cụm mào đầu · Intro' },
        { text: 'ngồi dò từng ô', translation: 'check cell by cell', typeFunction: 'Động từ · Keyword' },
        { text: 'sau cùng', translation: 'eventually', typeFunction: 'Từ nối · Logic word' },
        { text: 'mắt hoa mày chóng', translation: 'blurred vision', typeFunction: 'Cụm gợi hình · Fancy word' },
        { text: 'phải nghỉ giải lao', translation: 'take a break', typeFunction: 'Động từ · Ending' }
    ]
  },
  {
    hints: [
        { text: 'Tin hay không tùy', translation: 'Believe it or not', typeFunction: 'Cụm mào đầu · Intro' },
        { text: 'khởi động lại máy tính', translation: 'rebooting PC', typeFunction: 'Động từ · Keyword' },
        { text: 'tuy vậy', translation: 'nonetheless', typeFunction: 'Từ nối · Logic word' },
        { text: 'phép màu đơn giản', translation: 'simple miracle', typeFunction: 'Ẩn dụ · Fancy word' },
        { text: 'xong 90% lỗi', translation: 'fix most bugs', typeFunction: 'Động từ · Ending' }
    ]
  },
  {
    hints: [
        { text: 'Trước tiên', translation: 'First and foremost', typeFunction: 'Cụm mào đầu · Intro' },
        { text: 'định dạng bảng tính', translation: 'sheet template', typeFunction: 'Danh từ · Keyword' },
        { text: 'trước hết', translation: 'to begin with', typeFunction: 'Từ nối · Logic word' },
        { text: 'bộ mặt tài chính', translation: 'fiscal facade', typeFunction: 'Ẩn dụ · Fancy word' },
        { text: 'phải rõ ràng', translation: 'spotless', typeFunction: 'Tính từ · Ending' }
    ]
  },
  {
    hints: [
        { text: 'Nói tóm lại', translation: 'In a nutshell', typeFunction: 'Cụm mào đầu · Intro' },
        { text: 'báo cáo tổng kết', translation: 'final summary', typeFunction: 'Danh từ · Keyword' },
        { text: 'rốt cuộc', translation: 'in the end', typeFunction: 'Từ nối · Logic word' },
        { text: 'trái ngọt thu về', translation: 'fruit of labor', typeFunction: 'Ẩn dụ · Fancy word' },
        { text: 'sếp rất hài lòng', translation: 'boss thrilled', typeFunction: 'Tính từ · Ending' }
    ]
  },
  {
    hints: [
        { text: 'Nhìn chung', translation: 'All things considered', typeFunction: 'Cụm mào đầu · Intro' },
        { text: 'dân văn phòng hiện đại', translation: 'modern staff', typeFunction: 'Danh từ · Keyword' },
        { text: 'miễn sao', translation: 'provided that', typeFunction: 'Từ nối · Logic word' },
        { text: 'thuần thục công cụ', translation: 'master tools', typeFunction: 'Ẩn dụ · Fancy word' },
        { text: 'làm việc thảnh thơi', translation: 'work breezy', typeFunction: 'Trạng từ · Ending' }
    ]
  },
  {
    hints: [
        { text: 'Nói chuẩn xác', translation: 'Spot on', typeFunction: 'Cụm mào đầu · Intro' },
        { text: 'bậc thầy Excel phòng mình', translation: 'our Excel ace', typeFunction: 'Danh từ · Keyword' },
        { text: 'khi mà', translation: 'whenever', typeFunction: 'Từ nối · Logic word' },
        { text: 'ra tay hiệp nghĩa', translation: 'lends a hand', typeFunction: 'Cụm gợi hình · Fancy word' },
        { text: 'ai cũng ngưỡng mộ', translation: 'universally admired', typeFunction: 'Tính từ · Ending' }
    ]
  },
  {
    hints: [
        { text: 'Đáng chú ý là', translation: 'Notably', typeFunction: 'Cụm mào đầu · Intro' },
        { text: 'tính năng lưu đám mây', translation: 'cloud autosave', typeFunction: 'Danh từ · Keyword' },
        { text: 'chính vì thế', translation: 'for that reason', typeFunction: 'Từ nối · Logic word' },
        { text: 'tấm lá chắn thép', translation: 'steel shield', typeFunction: 'Ẩn dụ · Fancy word' },
        { text: 'bảo vệ an toàn', translation: 'safe and sound', typeFunction: 'Tính từ · Ending' }
    ]
  },
  {
    hints: [
        { text: 'Thành thật mà nói', translation: 'Frankly speaking', typeFunction: 'Cụm mào đầu · Intro' },
        { text: 'việc tính tay sổ sách', translation: 'manual ledger keeping', typeFunction: 'Danh từ · Keyword' },
        { text: 'không chỉ', translation: 'not only', typeFunction: 'Từ nối · Logic word' },
        { text: 'lối mòn cũ kỹ', translation: 'beaten path', typeFunction: 'Ẩn dụ · Fancy word' },
        { text: 'mà còn tụt hậu', translation: 'far behind', typeFunction: 'Tính từ · Ending' }
    ]
  },
  {
    hints: [
        { text: 'Theo quan sát', translation: 'From observation', typeFunction: 'Cụm mào đầu · Intro' },
        { text: 'hệ thống bị gián đoạn', translation: 'system glitch', typeFunction: 'Danh từ · Keyword' },
        { text: 'nhưng bù lại', translation: 'yet conversely', typeFunction: 'Từ nối · Logic word' },
        { text: 'khoảng lặng vàng ngọc', translation: 'golden breather', typeFunction: 'Ẩn dụ · Fancy word' },
        { text: 'để uống cà phê', translation: 'grab coffee', typeFunction: 'Động từ · Ending' }
    ]
  },
  {
    hints: [
        { text: 'Nói thẳng ra', translation: 'Bluntly put', typeFunction: 'Cụm mào đầu · Intro' },
        { text: 'file bảng tính khổng lồ', translation: 'gargantuan sheet', typeFunction: 'Danh từ · Keyword' },
        { text: 'nếu cứ để nguyên', translation: 'if left bloated', typeFunction: 'Từ nối · Logic word' },
        { text: 'quả tạ ngàn cân', translation: 'thousand-pound weight', typeFunction: 'Ẩn dụ · Fancy word' },
        { text: 'sẽ làm đơ máy', translation: 'freeze laptop', typeFunction: 'Động từ · Ending' }
    ]
  },
  {
    hints: [
        { text: 'Điều bất ngờ là', translation: 'Surprise twist', typeFunction: 'Cụm mào đầu · Intro' },
        { text: 'ly trà sữa full topping', translation: 'loaded boba', typeFunction: 'Danh từ · Keyword' },
        { text: 'sau khi uống xong', translation: 'after drinking', typeFunction: 'Từ nối · Logic word' },
        { text: 'nguồn năng lượng dồi dào', translation: 'burst of energy', typeFunction: 'Ẩn dụ · Fancy word' },
        { text: 'tăng tốc vượt bậc', translation: 'boost speed', typeFunction: 'Động từ · Ending' }
    ]
  },
  {
    hints: [
        { text: 'Rút kinh nghiệm', translation: 'Take note', typeFunction: 'Cụm mào đầu · Intro' },
        { text: 'phím tắt thường dùng', translation: 'common hotkeys', typeFunction: 'Danh từ · Keyword' },
        { text: 'bằng cách', translation: 'by means of', typeFunction: 'Từ nối · Logic word' },
        { text: 'vũ khí sắc bén', translation: 'sharp weapon', typeFunction: 'Ẩn dụ · Fancy word' },
        { text: 'làm việc siêu nhanh', translation: 'lightning fast', typeFunction: 'Trạng từ · Ending' }
    ]
  },
  {
    hints: [
        { text: 'Về cơ bản', translation: 'Essentially', typeFunction: 'Cụm mào đầu · Intro' },
        { text: 'tinh thần đồng đội', translation: 'team solidarity', typeFunction: 'Danh từ · Keyword' },
        { text: 'chính là', translation: 'namely', typeFunction: 'Từ nối · Logic word' },
        { text: 'ngọn lửa sưởi ấm', translation: 'warm flame', typeFunction: 'Ẩn dụ · Fancy word' },
        { text: 'vượt qua deadline', translation: 'crush deadline', typeFunction: 'Động từ · Ending' }
    ]
  },
  {
    hints: [
        { text: 'Tóm lại là', translation: 'In short', typeFunction: 'Cụm mào đầu · Intro' },
        { text: 'toàn bộ số liệu', translation: 'entire dataset', typeFunction: 'Danh từ · Keyword' },
        { text: 'sau hết', translation: 'in the end', typeFunction: 'Từ nối · Logic word' },
        { text: 'bức tranh tài chính đẹp', translation: 'picture-perfect sheet', typeFunction: 'Ẩn dụ · Fancy word' },
        { text: 'đã nộp thành công', translation: 'delivered safely', typeFunction: 'Tính từ · Ending' }
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

  const prefix = 'set04';

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

export const IMPROV_SET_04: ImprovPackage = buildPackage(
  'improv_set_04_excel_and_office_data',
  'Set 04 • Excel & Office Data (Spreadsheets & Productivity Reflex)',
  '120 progressive deduction items for financial calculations, spreadsheet troubleshooting, and office productivity based on Level B Day 6.',
  'LEVEL_B_ERES',
  ["level_b_eres_day_6"],
  s1_items,
  s2_items,
  s3_items,
  s4_items
);
