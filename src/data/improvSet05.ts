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
// Set 05 • E-commerce & Retail (Market Dynamics & Shopping Reflex)
// Based on LEVEL_B_ERES (level_b_eres_day_8)
// -------------------------------------------------------------

// Session 1: 30 items, hcTotal = 2, hintTypes: ['Keyword', 'Ending']
const s1_items: ItemDef[] = [
  {
    hints: [
        { text: 'Ngành thương mại điện tử', translation: 'e-commerce industry', typeFunction: 'Danh từ · Keyword' },
        { text: 'cạnh tranh khốc liệt', translation: 'fiercely competitive', typeFunction: 'Tính từ · Ending' }
    ]
  },
  {
    hints: [
        { text: 'Săn sale nửa đêm', translation: 'midnight deal hunting', typeFunction: 'Danh từ · Keyword' },
        { text: 'thức trắng', translation: 'stay up late', typeFunction: 'Động từ · Ending' }
    ]
  },
  {
    hints: [
        { text: 'Ví điện tử', translation: 'digital wallet', typeFunction: 'Danh từ · Keyword' },
        { text: 'liên kết ngân hàng', translation: 'linked to bank', typeFunction: 'Tính từ · Ending' }
    ]
  },
  {
    hints: [
        { text: 'Trò chơi đốt tiền', translation: 'cash-burning game', typeFunction: 'Danh từ · Keyword' },
        { text: 'kiệt quệ tài chính', translation: 'financially drained', typeFunction: 'Tính từ · Ending' }
    ]
  },
  {
    hints: [
        { text: 'Mức giá cạnh tranh', translation: 'competitive pricing', typeFunction: 'Danh từ · Keyword' },
        { text: 'hút khách', translation: 'draw customers', typeFunction: 'Động từ · Ending' }
    ]
  },
  {
    hints: [
        { text: 'Người tiêu dùng tùy hứng', translation: 'impulsive spender', typeFunction: 'Danh từ · Keyword' },
        { text: 'chốt đơn nhanh', translation: 'buy on impulse', typeFunction: 'Động từ · Ending' }
    ]
  },
  {
    hints: [
        { text: 'Đi lượn lờ ngó nghiêng', translation: 'window shopping', typeFunction: 'Động từ · Keyword' },
        { text: 'xả stress', translation: 'unwind', typeFunction: 'Động từ · Ending' }
    ]
  },
  {
    hints: [
        { text: 'Thị trường sôi động', translation: 'vibrant marketplace', typeFunction: 'Danh từ · Keyword' },
        { text: 'tăng trưởng nóng', translation: 'grow rapidly', typeFunction: 'Động từ · Ending' }
    ]
  },
  {
    hints: [
        { text: 'Giỏ hàng trực tuyến', translation: 'shopping cart', typeFunction: 'Danh từ · Keyword' },
        { text: 'chất đầy ắp', translation: 'overflowing', typeFunction: 'Tính từ · Ending' }
    ]
  },
  {
    hints: [
        { text: 'Phễu bán hàng', translation: 'sales funnel', typeFunction: 'Danh từ · Keyword' },
        { text: 'tối ưu hóa', translation: 'optimized', typeFunction: 'Tính từ · Ending' }
    ]
  },
  {
    hints: [
        { text: 'Tỉ lệ chuyển đổi đơn', translation: 'conversion rate', typeFunction: 'Danh từ · Keyword' },
        { text: 'tăng vọt', translation: 'skyrocket', typeFunction: 'Động từ · Ending' }
    ]
  },
  {
    hints: [
        { text: 'Mã giảm giá độc quyền', translation: 'exclusive voucher', typeFunction: 'Danh từ · Keyword' },
        { text: 'hết hạn sớm', translation: 'expired quickly', typeFunction: 'Tính từ · Ending' }
    ]
  },
  {
    hints: [
        { text: 'Phí giao hàng', translation: 'shipping fee', typeFunction: 'Danh từ · Keyword' },
        { text: 'miễn phí hoàn toàn', translation: 'zero cost', typeFunction: 'Tính từ · Ending' }
    ]
  },
  {
    hints: [
        { text: 'Giao hàng tận cửa', translation: 'doorstep delivery', typeFunction: 'Danh từ · Keyword' },
        { text: 'nhanh như chớp', translation: 'express fast', typeFunction: 'Tính từ · Ending' }
    ]
  },
  {
    hints: [
        { text: 'Khách hàng thân thiết', translation: 'loyal shopper', typeFunction: 'Danh từ · Keyword' },
        { text: 'tích lũy điểm', translation: 'earn reward points', typeFunction: 'Động từ · Ending' }
    ]
  },
  {
    hints: [
        { text: 'Kênh bán sỉ', translation: 'wholesale channel', typeFunction: 'Danh từ · Keyword' },
        { text: 'chiết khấu cao', translation: 'high discount', typeFunction: 'Tính từ · Ending' }
    ]
  },
  {
    hints: [
        { text: 'Cửa hàng bán lẻ', translation: 'retail outlet', typeFunction: 'Danh từ · Keyword' },
        { text: 'đông đúc', translation: 'packed with shoppers', typeFunction: 'Tính từ · Ending' }
    ]
  },
  {
    hints: [
        { text: 'Chính sách đổi trả', translation: 'return policy', typeFunction: 'Danh từ · Keyword' },
        { text: 'linh hoạt', translation: 'hassle-free', typeFunction: 'Tính từ · Ending' }
    ]
  },
  {
    hints: [
        { text: 'Mảng thời trang nhanh', translation: 'fast fashion sector', typeFunction: 'Danh từ · Keyword' },
        { text: 'bắt kịp xu hướng', translation: 'trendsetting', typeFunction: 'Tính từ · Ending' }
    ]
  },
  {
    hints: [
        { text: 'Hoa hồng bán hàng', translation: 'sales commission', typeFunction: 'Danh từ · Keyword' },
        { text: 'hấp dẫn', translation: 'lucrative', typeFunction: 'Tính từ · Ending' }
    ]
  },
  {
    hints: [
        { text: 'Đánh giá sản phẩm', translation: 'customer reviews', typeFunction: 'Danh từ · Keyword' },
        { text: 'năm sao', translation: 'five stars', typeFunction: 'Tính từ · Ending' }
    ]
  },
  {
    hints: [
        { text: 'Phiên phát trực tiếp', translation: 'livestream session', typeFunction: 'Danh từ · Keyword' },
        { text: 'cháy sạch hàng', translation: 'sold out completely', typeFunction: 'Tính từ · Ending' }
    ]
  },
  {
    hints: [
        { text: 'Trải nghiệm mua sắm', translation: 'shopping experience', typeFunction: 'Danh từ · Keyword' },
        { text: 'mượt mà', translation: 'seamless', typeFunction: 'Tính từ · Ending' }
    ]
  },
  {
    hints: [
        { text: 'Quảng cáo bắt mắt', translation: 'catchy commercial', typeFunction: 'Danh từ · Keyword' },
        { text: 'gây ấn tượng mạnh', translation: 'memorable', typeFunction: 'Tính từ · Ending' }
    ]
  },
  {
    hints: [
        { text: 'Hành vi người mua', translation: 'consumer behavior', typeFunction: 'Danh từ · Keyword' },
        { text: 'thay đổi nhanh', translation: 'shift rapidly', typeFunction: 'Động từ · Ending' }
    ]
  },
  {
    hints: [
        { text: 'Kích cầu tiêu dùng', translation: 'stimulate demand', typeFunction: 'Động từ · Keyword' },
        { text: 'hiệu quả cao', translation: 'highly effective', typeFunction: 'Tính từ · Ending' }
    ]
  },
  {
    hints: [
        { text: 'Nhà phân phối độc quyền', translation: 'exclusive distributor', typeFunction: 'Danh từ · Keyword' },
        { text: 'cam kết chất lượng', translation: 'guarantee quality', typeFunction: 'Động từ · Ending' }
    ]
  },
  {
    hints: [
        { text: 'Hàng giả hàng nhái', translation: 'counterfeit goods', typeFunction: 'Danh từ · Keyword' },
        { text: 'tẩy chay gắt gao', translation: 'strictly boycotted', typeFunction: 'Tính từ · Ending' }
    ]
  },
  {
    hints: [
        { text: 'Cổng thanh toán online', translation: 'online payment gateway', typeFunction: 'Danh từ · Keyword' },
        { text: 'bảo mật cao', translation: 'ironclad security', typeFunction: 'Tính từ · Ending' }
    ]
  },
  {
    hints: [
        { text: 'Doanh số ngày hội', translation: 'shopping fest revenue', typeFunction: 'Danh từ · Keyword' },
        { text: 'lập kỷ lục mới', translation: 'break records', typeFunction: 'Động từ · Ending' }
    ]
  }
];

// Session 2: 30 items, hcTotal = 3, hintTypes: ['Keyword', 'Logic word', 'Ending']
const s2_items: ItemDef[] = [
  {
    hints: [
        { text: 'Thị trường thương mại điện tử', translation: 'e-commerce landscape', typeFunction: 'Danh từ · Keyword' },
        { text: 'tuy nhiên', translation: 'however', typeFunction: 'Từ nối · Logic word' },
        { text: 'bão hòa nhanh', translation: 'saturates quickly', typeFunction: 'Tính từ · Ending' }
    ]
  },
  {
    hints: [
        { text: 'Chiến dịch săn sale', translation: 'flash sale drive', typeFunction: 'Danh từ · Keyword' },
        { text: 'trước đó', translation: 'before that', typeFunction: 'Từ nối · Logic word' },
        { text: 'quảng bá rầm rộ', translation: 'hyped up', typeFunction: 'Tính từ · Ending' }
    ]
  },
  {
    hints: [
        { text: 'Thanh toán ví điện tử', translation: 'e-wallet checkout', typeFunction: 'Danh từ · Keyword' },
        { text: 'đồng thời', translation: 'meanwhile', typeFunction: 'Từ nối · Logic word' },
        { text: 'nhận mã hoàn tiền', translation: 'get cashback', typeFunction: 'Động từ · Ending' }
    ]
  },
  {
    hints: [
        { text: 'Chiêu trò đốt tiền', translation: 'cash burning tactics', typeFunction: 'Danh từ · Keyword' },
        { text: 'do đó', translation: 'therefore', typeFunction: 'Từ nối · Logic word' },
        { text: 'không bền lâu', translation: 'unsustainable', typeFunction: 'Tính từ · Ending' }
    ]
  },
  {
    hints: [
        { text: 'Chiến lược giá cạnh tranh', translation: 'competitive pricing', typeFunction: 'Danh từ · Keyword' },
        { text: 'nếu không', translation: 'otherwise', typeFunction: 'Từ nối · Logic word' },
        { text: 'mất thị phần', translation: 'lose market share', typeFunction: 'Động từ · Ending' }
    ]
  },
  {
    hints: [
        { text: 'Khách mua sắm tùy hứng', translation: 'impulsive shoppers', typeFunction: 'Danh từ · Keyword' },
        { text: 'hơn nữa', translation: 'in addition', typeFunction: 'Từ nối · Logic word' },
        { text: 'thích quà tặng kèm', translation: 'love freebies', typeFunction: 'Động từ · Ending' }
    ]
  },
  {
    hints: [
        { text: 'Người dạo phố ngắm đồ', translation: 'window shoppers', typeFunction: 'Danh từ · Keyword' },
        { text: 'sau đó', translation: 'then', typeFunction: 'Từ nối · Logic word' },
        { text: 'quay lại mua online', translation: 'buy online later', typeFunction: 'Động từ · Ending' }
    ]
  },
  {
    hints: [
        { text: 'Nền tảng mua bán', translation: 'shopping platform', typeFunction: 'Danh từ · Keyword' },
        { text: 'ví dụ', translation: 'for instance', typeFunction: 'Từ nối · Logic word' },
        { text: 'tích hợp livestream', translation: 'embeds livestream', typeFunction: 'Động từ · Ending' }
    ]
  },
  {
    hints: [
        { text: 'Sản phẩm trong giỏ hàng', translation: 'items in cart', typeFunction: 'Danh từ · Keyword' },
        { text: 'miễn là', translation: 'as long as', typeFunction: 'Từ nối · Logic word' },
        { text: 'còn đủ số lượng', translation: 'in stock', typeFunction: 'Tính từ · Ending' }
    ]
  },
  {
    hints: [
        { text: 'Tối ưu phễu chuyển đổi', translation: 'funnel optimization', typeFunction: 'Danh từ · Keyword' },
        { text: 'sau cùng', translation: 'eventually', typeFunction: 'Từ nối · Logic word' },
        { text: 'nhân đôi doanh thu', translation: 'double sales', typeFunction: 'Động từ · Ending' }
    ]
  },
  {
    hints: [
        { text: 'Giao dịch không tiền mặt', translation: 'cashless payments', typeFunction: 'Danh từ · Keyword' },
        { text: 'bởi vì', translation: 'because', typeFunction: 'Từ nối · Logic word' },
        { text: 'tiện lợi vượt trội', translation: 'supremely convenient', typeFunction: 'Tính từ · Ending' }
    ]
  },
  {
    hints: [
        { text: 'Mã ưu đãi vận chuyển', translation: 'free shipping coupon', typeFunction: 'Danh từ · Keyword' },
        { text: 'ngoài ra', translation: 'besides', typeFunction: 'Từ nối · Logic word' },
        { text: 'kích thích đặt thêm', translation: 'nudge more orders', typeFunction: 'Động từ · Ending' }
    ]
  },
  {
    hints: [
        { text: 'Dịch vụ giao hỏa tốc', translation: 'instant delivery', typeFunction: 'Danh từ · Keyword' },
        { text: 'tiếp theo', translation: 'next', typeFunction: 'Từ nối · Logic word' },
        { text: 'mở rộng toàn quốc', translation: 'expand nationwide', typeFunction: 'Động từ · Ending' }
    ]
  },
  {
    hints: [
        { text: 'Chương trình tri ân', translation: 'loyalty rewards', typeFunction: 'Danh từ · Keyword' },
        { text: 'nói cách khác', translation: 'in other words', typeFunction: 'Từ nối · Logic word' },
        { text: 'giữ chân người mua', translation: 'retain customer base', typeFunction: 'Động từ · Ending' }
    ]
  },
  {
    hints: [
        { text: 'Nhà phân phối bán sỉ', translation: 'wholesale distributor', typeFunction: 'Danh từ · Keyword' },
        { text: 'trái lại', translation: 'in contrast', typeFunction: 'Từ nối · Logic word' },
        { text: 'ưu tiên số lượng', translation: 'prioritize volume', typeFunction: 'Động từ · Ending' }
    ]
  },
  {
    hints: [
        { text: 'Hệ thống chuỗi bán lẻ', translation: 'retail store chain', typeFunction: 'Danh từ · Keyword' },
        { text: 'cho nên', translation: 'so that', typeFunction: 'Từ nối · Logic word' },
        { text: 'phủ sóng khắp nơi', translation: 'omnipresent', typeFunction: 'Tính từ · Ending' }
    ]
  },
  {
    hints: [
        { text: 'Thủ tục đổi trả hàng', translation: 'product returns', typeFunction: 'Danh từ · Keyword' },
        { text: 'thay vào đó', translation: 'instead', typeFunction: 'Từ nối · Logic word' },
        { text: 'giải quyết qua app', translation: 'processed via app', typeFunction: 'Tính từ · Ending' }
    ]
  },
  {
    hints: [
        { text: 'Bộ sưu tập thời trang', translation: 'fashion collection', typeFunction: 'Danh từ · Keyword' },
        { text: 'dù vậy', translation: 'nevertheless', typeFunction: 'Từ nối · Logic word' },
        { text: 'bán chạy như tôm tươi', translation: 'sell like hotcakes', typeFunction: 'Động từ · Ending' }
    ]
  },
  {
    hints: [
        { text: 'Mức chiết khấu hấp dẫn', translation: 'generous commissions', typeFunction: 'Danh từ · Keyword' },
        { text: 'đặc biệt là', translation: 'especially', typeFunction: 'Từ nối · Logic word' },
        { text: 'cho cộng tác viên', translation: 'for affiliate partners', typeFunction: 'Danh từ · Ending' }
    ]
  },
  {
    hints: [
        { text: 'Đánh giá kém chất lượng', translation: 'negative reviews', typeFunction: 'Danh từ · Keyword' },
        { text: 'cùng lắm', translation: 'at worst', typeFunction: 'Từ nối · Logic word' },
        { text: 'được hoàn tiền ngay', translation: 'refunded on spot', typeFunction: 'Tính từ · Ending' }
    ]
  },
  {
    hints: [
        { text: 'Người bán hàng livestream', translation: 'livestream streamer', typeFunction: 'Danh từ · Keyword' },
        { text: 'ngay lập tức', translation: 'right away', typeFunction: 'Từ nối · Logic word' },
        { text: 'chốt ngàn đơn hàng', translation: 'close thousand deals', typeFunction: 'Động từ · Ending' }
    ]
  },
  {
    hints: [
        { text: 'Trải nghiệm giao diện app', translation: 'in-app UI experience', typeFunction: 'Danh từ · Keyword' },
        { text: 'thật ra', translation: 'actually', typeFunction: 'Từ nối · Logic word' },
        { text: 'rất thân thiện', translation: 'user-friendly', typeFunction: 'Tính từ · Ending' }
    ]
  },
  {
    hints: [
        { text: 'Video quảng cáo lan truyền', translation: 'viral commercial', typeFunction: 'Danh từ · Keyword' },
        { text: 'sau hết', translation: 'after all', typeFunction: 'Từ nối · Logic word' },
        { text: 'thu hút triệu lượt xem', translation: 'pull millions views', typeFunction: 'Động từ · Ending' }
    ]
  },
  {
    hints: [
        { text: 'Xu hướng mua sắm mới', translation: 'emerging shopping trends', typeFunction: 'Danh từ · Keyword' },
        { text: 'miễn sao', translation: 'provided that', typeFunction: 'Từ nối · Logic word' },
        { text: 'đón đầu thị hiếu', translation: 'ahead of curve', typeFunction: 'Tính từ · Ending' }
    ]
  },
  {
    hints: [
        { text: 'Chiến dịch khuyến mại lớn', translation: 'mega promotion fest', typeFunction: 'Danh từ · Keyword' },
        { text: 'kể từ đó', translation: 'since then', typeFunction: 'Từ nối · Logic word' },
        { text: 'tạo tiếng vang lớn', translation: 'make big waves', typeFunction: 'Động từ · Ending' }
    ]
  },
  {
    hints: [
        { text: 'Nguồn hàng nhập khẩu', translation: 'imported goods source', typeFunction: 'Danh từ · Keyword' },
        { text: 'chính vì thế', translation: 'for this reason', typeFunction: 'Từ nối · Logic word' },
        { text: 'kiểm định nghiêm ngặt', translation: 'strictly vetted', typeFunction: 'Tính từ · Ending' }
    ]
  },
  {
    hints: [
        { text: 'Gian hàng trực tuyến', translation: 'online store profile', typeFunction: 'Danh từ · Keyword' },
        { text: 'rốt cuộc', translation: 'in the end', typeFunction: 'Từ nối · Logic word' },
        { text: 'đạt chuẩn thương hiệu', translation: 'brand certified', typeFunction: 'Tính từ · Ending' }
    ]
  },
  {
    hints: [
        { text: 'Mã bảo mật OTP', translation: 'secure OTP code', typeFunction: 'Danh từ · Keyword' },
        { text: 'tóm lại', translation: 'in short', typeFunction: 'Từ nối · Logic word' },
        { text: 'ngăn chặn lừa đảo', translation: 'prevent fraud', typeFunction: 'Động từ · Ending' }
    ]
  },
  {
    hints: [
        { text: 'Doanh số bán lẻ', translation: 'retail gross sales', typeFunction: 'Danh từ · Keyword' },
        { text: 'nói chung', translation: 'on the whole', typeFunction: 'Từ nối · Logic word' },
        { text: 'vượt mức kỳ vọng', translation: 'exceed forecast', typeFunction: 'Động từ · Ending' }
    ]
  },
  {
    hints: [
        { text: 'Ngày hội siêu mua sắm', translation: 'mega shopping day', typeFunction: 'Danh từ · Keyword' },
        { text: 'kết quả là', translation: 'as a result', typeFunction: 'Từ nối · Logic word' },
        { text: 'bội thu đơn hàng', translation: 'harvest big orders', typeFunction: 'Động từ · Ending' }
    ]
  }
];

// Session 3: 30 items, hcTotal = 4, hintTypes: ['Keyword', 'Logic word', 'Fancy word', 'Ending']
const s3_items: ItemDef[] = [
  {
    hints: [
        { text: 'Ngành thương mại điện tử', translation: 'e-commerce arena', typeFunction: 'Danh từ · Keyword' },
        { text: 'trong khi', translation: 'while', typeFunction: 'Từ nối · Logic word' },
        { text: 'miếng bánh màu mỡ', translation: 'lucrative pie', typeFunction: 'Ẩn dụ · Fancy word' },
        { text: 'ai cũng muốn chia phần', translation: 'everyone wants slice', typeFunction: 'Động từ · Ending' }
    ]
  },
  {
    hints: [
        { text: 'Khi nào', translation: 'When', typeFunction: 'Cụm nghi vấn · WH word' },
        { text: 'nếu không', translation: 'otherwise', typeFunction: 'Từ nối · Logic word' },
        { text: 'cơn bão săn sale', translation: 'shopping frenzy', typeFunction: 'Ẩn dụ · Fancy word' },
        { text: 'sẽ làm sập hệ thống', translation: 'crash servers', typeFunction: 'Động từ · Ending' }
    ]
  },
  {
    hints: [
        { text: 'Ví điện tử liên kết', translation: 'linked e-wallet', typeFunction: 'Danh từ · Keyword' },
        { text: 'tuy nhiên', translation: 'however', typeFunction: 'Từ nối · Logic word' },
        { text: 'thỏi nam châm hút khách', translation: 'customer magnet', typeFunction: 'Ẩn dụ · Fancy word' },
        { text: 'tăng độ gắn kết', translation: 'boost retention', typeFunction: 'Động từ · Ending' }
    ]
  },
  {
    hints: [
        { text: 'Trò chơi đốt tiền', translation: 'cash-burning war', typeFunction: 'Danh từ · Keyword' },
        { text: 'do đó', translation: 'therefore', typeFunction: 'Từ nối · Logic word' },
        { text: 'hố sâu không đáy', translation: 'bottomless pit', typeFunction: 'Ẩn dụ · Fancy word' },
        { text: 'nuốt trọn nguồn vốn', translation: 'swallow capital', typeFunction: 'Động từ · Ending' }
    ]
  },
  {
    hints: [
        { text: 'Giá cả cạnh tranh', translation: 'aggressive price cuts', typeFunction: 'Danh từ · Keyword' },
        { text: 'mặc dù', translation: 'although', typeFunction: 'Từ nối · Logic word' },
        { text: 'con dao hai lưỡi', translation: 'double-edged blade', typeFunction: 'Ẩn dụ · Fancy word' },
        { text: 'bào mòn lợi nhuận', translation: 'erode profit margins', typeFunction: 'Động từ · Ending' }
    ]
  },
  {
    hints: [
        { text: 'Vì sao', translation: 'Why', typeFunction: 'Cụm nghi vấn · WH word' },
        { text: 'hơn nữa', translation: 'moreover', typeFunction: 'Từ nối · Logic word' },
        { text: 'con nghiện mua sắm', translation: 'shopaholic instinct', typeFunction: 'Ẩn dụ · Fancy word' },
        { text: 'vung tay quá trán', translation: 'overspend wildly', typeFunction: 'Động từ · Ending' }
    ]
  },
  {
    hints: [
        { text: 'Đi lượn lờ ngắm đồ', translation: 'window shopping stroll', typeFunction: 'Động từ · Keyword' },
        { text: 'sau đó', translation: 'then', typeFunction: 'Từ nối · Logic word' },
        { text: 'mồi câu hấp dẫn', translation: 'sweet bait', typeFunction: 'Ẩn dụ · Fancy word' },
        { text: 'khiến chốt đơn ngay', translation: 'trigger instant buy', typeFunction: 'Động từ · Ending' }
    ]
  },
  {
    hints: [
        { text: 'Giỏ hàng đầy ắp', translation: 'stuffed cart', typeFunction: 'Danh từ · Keyword' },
        { text: 'thay vào đó', translation: 'instead', typeFunction: 'Từ nối · Logic word' },
        { text: 'nỗi sợ bỏ lỡ', translation: 'FOMO fever', typeFunction: 'Ẩn dụ · Fancy word' },
        { text: 'thúc giục thanh toán', translation: 'rush to checkout', typeFunction: 'Động từ · Ending' }
    ]
  },
  {
    hints: [
        { text: 'Bao lâu', translation: 'How long', typeFunction: 'Cụm nghi vấn · WH word' },
        { text: 'nếu', translation: 'if', typeFunction: 'Từ nối · Logic word' },
        { text: 'rò rỉ dữ liệu', translation: 'data leak breach', typeFunction: 'Ẩn dụ · Fancy word' },
        { text: 'mất hết uy tín', translation: 'lose trust entirely', typeFunction: 'Động từ · Ending' }
    ]
  },
  {
    hints: [
        { text: 'Phễu bán hàng hiện đại', translation: 'smart sales funnel', typeFunction: 'Danh từ · Keyword' },
        { text: 'cho nên', translation: 'so that', typeFunction: 'Từ nối · Logic word' },
        { text: 'cỗ máy in tiền', translation: 'cash generator machine', typeFunction: 'Ẩn dụ · Fancy word' },
        { text: 'hoạt động tự động', translation: 'run on autopilot', typeFunction: 'Trạng từ · Ending' }
    ]
  },
  {
    hints: [
        { text: 'Tỉ lệ chuyển đổi đơn', translation: 'conversion rate', typeFunction: 'Danh từ · Keyword' },
        { text: 'trái lại', translation: 'in contrast', typeFunction: 'Từ nối · Logic word' },
        { text: 'thước đo sinh tử', translation: 'vital heartbeat', typeFunction: 'Ẩn dụ · Fancy word' },
        { text: 'quyết định sống còn', translation: 'make or break', typeFunction: 'Động từ · Ending' }
    ]
  },
  {
    hints: [
        { text: 'Mã miễn phí giao hàng', translation: 'free ship coupon', typeFunction: 'Danh từ · Keyword' },
        { text: 'miễn là', translation: 'as long as', typeFunction: 'Từ nối · Logic word' },
        { text: 'cú hích tâm lý', translation: 'psychological nudge', typeFunction: 'Ẩn dụ · Fancy word' },
        { text: 'thuyết phục khách mua', translation: 'seal the deal', typeFunction: 'Động từ · Ending' }
    ]
  },
  {
    hints: [
        { text: 'Giao hàng hỏa tốc', translation: 'superfast delivery', typeFunction: 'Danh từ · Keyword' },
        { text: 'tiếp theo', translation: 'next', typeFunction: 'Từ nối · Logic word' },
        { text: 'vũ khí sát thương', translation: 'killer feature', typeFunction: 'Ẩn dụ · Fancy word' },
        { text: 'đánh bạt đối thủ', translation: 'crush competition', typeFunction: 'Động từ · Ending' }
    ]
  },
  {
    hints: [
        { text: 'Ở đâu', translation: 'Where', typeFunction: 'Cụm nghi vấn · WH word' },
        { text: 'đồng thời', translation: 'meanwhile', typeFunction: 'Từ nối · Logic word' },
        { text: 'vùng đất hứa', translation: 'promised land', typeFunction: 'Ẩn dụ · Fancy word' },
        { text: 'thương mại nông thôn', translation: 'rural e-commerce', typeFunction: 'Danh từ · Ending' }
    ]
  },
  {
    hints: [
        { text: 'Tin hay không tùy', translation: 'believe it or not', typeFunction: 'Cụm chêm · Keyword' },
        { text: 'bởi thế', translation: 'for that reason', typeFunction: 'Từ nối · Logic word' },
        { text: 'cơn sốt mua sắm', translation: 'buying tsunami', typeFunction: 'Ẩn dụ · Fancy word' },
        { text: 'bùng nổ mạnh mẽ', translation: 'erupt violently', typeFunction: 'Động từ · Ending' }
    ]
  },
  {
    hints: [
        { text: 'Mảng thời trang trẻ', translation: 'youth fashion sector', typeFunction: 'Danh từ · Keyword' },
        { text: 'dẫu vậy', translation: 'even so', typeFunction: 'Từ nối · Logic word' },
        { text: 'vòng quay chóng mặt', translation: 'dizzying churn', typeFunction: 'Ẩn dụ · Fancy word' },
        { text: 'đào thải cực nhanh', translation: 'weed out swiftly', typeFunction: 'Động từ · Ending' }
    ]
  },
  {
    hints: [
        { text: 'Hàng tồn kho chất đống', translation: 'backlog inventory', typeFunction: 'Danh từ · Keyword' },
        { text: 'sau cùng', translation: 'eventually', typeFunction: 'Từ nối · Logic word' },
        { text: 'cục nợ đè nặng', translation: 'albatross stone', typeFunction: 'Ẩn dụ · Fancy word' },
        { text: 'phải đại hạ giá', translation: 'slash prices deep', typeFunction: 'Động từ · Ending' }
    ]
  },
  {
    hints: [
        { text: 'Hoa hồng bán hàng cao', translation: 'juicy affiliate cut', typeFunction: 'Danh từ · Keyword' },
        { text: 'ngoài ra', translation: 'besides', typeFunction: 'Từ nối · Logic word' },
        { text: 'miếng mồi béo bở', translation: 'fat bait', typeFunction: 'Ẩn dụ · Fancy word' },
        { text: 'hút ngàn streamer', translation: 'draw streamers', typeFunction: 'Động từ · Ending' }
    ]
  },
  {
    hints: [
        { text: 'Tại sao', translation: 'Why', typeFunction: 'Cụm nghi vấn · WH word' },
        { text: 'trừ khi', translation: 'unless', typeFunction: 'Từ nối · Logic word' },
        { text: 'bức tường nghi ngờ', translation: 'wall of skepticism', typeFunction: 'Ẩn dụ · Fancy word' },
        { text: 'khách kiểm tra kỹ', translation: 'inspect thoroughly', typeFunction: 'Động từ · Ending' }
    ]
  },
  {
    hints: [
        { text: 'Livestream chốt đơn khủng', translation: 'mega livestream sale', typeFunction: 'Danh từ · Keyword' },
        { text: 'trước hết', translation: 'first of all', typeFunction: 'Từ nối · Logic word' },
        { text: 'cơn mưa đơn hàng', translation: 'shower of orders', typeFunction: 'Ẩn dụ · Fancy word' },
        { text: 'nổ dồn dập', translation: 'pour in nonstop', typeFunction: 'Động từ · Ending' }
    ]
  },
  {
    hints: [
        { text: 'Hàng nhái kém chất lượng', translation: 'cheap counterfeit', typeFunction: 'Danh từ · Keyword' },
        { text: 'rốt cuộc', translation: 'in the end', typeFunction: 'Từ nối · Logic word' },
        { text: 'con sâu làm rầu nồi canh', translation: 'bad apple taint', typeFunction: 'Thành ngữ · Fancy word' },
        { text: 'hủy hoại nền tảng', translation: 'poison platform', typeFunction: 'Động từ · Ending' }
    ]
  },
  {
    hints: [
        { text: 'Khách hàng trung thành', translation: 'loyal consumers', typeFunction: 'Danh từ · Keyword' },
        { text: 'nói cách khác', translation: 'in other words', typeFunction: 'Từ nối · Logic word' },
        { text: 'mỏ vàng vô tận', translation: 'infinite goldmine', typeFunction: 'Ẩn dụ · Fancy word' },
        { text: 'mang lại doanh số đều', translation: 'steady recurring cash', typeFunction: 'Động từ · Ending' }
    ]
  },
  {
    hints: [
        { text: 'Hệ sinh thái bán lẻ', translation: 'retail ecosystem', typeFunction: 'Danh từ · Keyword' },
        { text: 'dù sao', translation: 'anyway', typeFunction: 'Từ nối · Logic word' },
        { text: 'mạng lưới chân rết', translation: 'vast spiderweb', typeFunction: 'Ẩn dụ · Fancy word' },
        { text: 'lan tỏa khắp ngõ ngách', translation: 'reach every corner', typeFunction: 'Động từ · Ending' }
    ]
  },
  {
    hints: [
        { text: 'Bằng cách nào', translation: 'How', typeFunction: 'Cụm nghi vấn · WH word' },
        { text: 'nếu như', translation: 'in case', typeFunction: 'Từ nối · Logic word' },
        { text: 'thuật toán gợi ý', translation: 'smart AI algorithm', typeFunction: 'Ẩn dụ · Fancy word' },
        { text: 'đọc vị tâm lý khách', translation: 'read buyers minds', typeFunction: 'Động từ · Ending' }
    ]
  },
  {
    hints: [
        { text: 'Thương hiệu nội địa', translation: 'local brand power', typeFunction: 'Danh từ · Keyword' },
        { text: 'tuy vậy', translation: 'nonetheless', typeFunction: 'Từ nối · Logic word' },
        { text: 'ngựa ô bứt phá', translation: 'dark horse breakout', typeFunction: 'Ẩn dụ · Fancy word' },
        { text: 'chiếm lĩnh vị trí đầu', translation: 'take top spot', typeFunction: 'Động từ · Ending' }
    ]
  },
  {
    hints: [
        { text: 'Sự cố nghẽn mạng', translation: 'network bandwidth choke', typeFunction: 'Danh từ · Keyword' },
        { text: 'chính vì vậy', translation: 'hence', typeFunction: 'Từ nối · Logic word' },
        { text: 'nút thắt cổ chai', translation: 'gateway bottleneck', typeFunction: 'Ẩn dụ · Fancy word' },
        { text: 'làm rớt nghìn khách', translation: 'drop thousand visits', typeFunction: 'Động từ · Ending' }
    ]
  },
  {
    hints: [
        { text: 'Quảng cáo phong cách Thái', translation: 'Thai style humor ad', typeFunction: 'Danh từ · Keyword' },
        { text: 'sau đó', translation: 'afterwards', typeFunction: 'Từ nối · Logic word' },
        { text: 'cú hích cảm xúc', translation: 'emotional punch', typeFunction: 'Ẩn dụ · Fancy word' },
        { text: 'chạm vào trái tim', translation: 'touch hearts deeply', typeFunction: 'Động từ · Ending' }
    ]
  },
  {
    hints: [
        { text: 'Chi phí quảng cáo số', translation: 'digital ad spend', typeFunction: 'Danh từ · Keyword' },
        { text: 'cuối cùng', translation: 'ultimately', typeFunction: 'Từ nối · Logic word' },
        { text: 'cỗ máy ngốn tiền', translation: 'money burner furnace', typeFunction: 'Ẩn dụ · Fancy word' },
        { text: 'cần đo lường ROI', translation: 'must track ROI', typeFunction: 'Động từ · Ending' }
    ]
  },
  {
    hints: [
        { text: 'Dịch vụ hậu mãi tốt', translation: 'after-sales support', typeFunction: 'Danh từ · Keyword' },
        { text: 'trái lại', translation: 'on the contrary', typeFunction: 'Từ nối · Logic word' },
        { text: 'chìa khóa giữ chân', translation: 'golden padlock', typeFunction: 'Ẩn dụ · Fancy word' },
        { text: 'tạo niềm tin sắt đá', translation: 'build rock faith', typeFunction: 'Động từ · Ending' }
    ]
  },
  {
    hints: [
        { text: 'Chứ còn gì nữa', translation: 'tell me about it', typeFunction: 'Cụm chêm · Keyword' },
        { text: 'kết quả là', translation: 'as a result', typeFunction: 'Từ nối · Logic word' },
        { text: 'hốt bạc rủng rỉnh', translation: 'rake in gold', typeFunction: 'Ẩn dụ · Fancy word' },
        { text: 'thắng lợi giòn giã', translation: 'triumphant win', typeFunction: 'Tính từ · Ending' }
    ]
  }
];

// Session 4: 30 items, hcTotal = 5, hintTypes: ['Intro / Setup', 'Keyword', 'Logic word', 'Fancy word', 'Ending']
const s4_items: ItemDef[] = [
  {
    hints: [
        { text: 'Vấn đề là', translation: 'The point is', typeFunction: 'Cụm mào đầu · Intro' },
        { text: 'ngành thương mại điện tử', translation: 'e-commerce arena', typeFunction: 'Danh từ · Keyword' },
        { text: 'tuy nhiên', translation: 'however', typeFunction: 'Từ nối · Logic word' },
        { text: 'trò chơi đốt tiền', translation: 'cash-burning game', typeFunction: 'Ẩn dụ · Fancy word' },
        { text: 'khó duy trì mãi', translation: 'hard to sustain', typeFunction: 'Tính từ · Ending' }
    ]
  },
  {
    hints: [
        { text: 'Làm gì có chuyện đó', translation: 'No way', typeFunction: 'Cụm mào đầu · Intro' },
        { text: 'mã giảm giá 90%', translation: '90% promo voucher', typeFunction: 'Danh từ · Keyword' },
        { text: 'do đó', translation: 'therefore', typeFunction: 'Từ nối · Logic word' },
        { text: 'miếng pho mát trong bẫy', translation: 'cheese in mousetrap', typeFunction: 'Ẩn dụ · Fancy word' },
        { text: 'phải hết sức cẩn thận', translation: 'proceed with caution', typeFunction: 'Tính từ · Ending' }
    ]
  },
  {
    hints: [
        { text: 'Cậu biết sao không', translation: 'You know what', typeFunction: 'Cụm mào đầu · Intro' },
        { text: 'khách mua hàng tùy hứng', translation: 'impulsive shoppers', typeFunction: 'Danh từ · Keyword' },
        { text: 'mặc dù', translation: 'although', typeFunction: 'Từ nối · Logic word' },
        { text: 'con mồi dễ dãi', translation: 'easy targets', typeFunction: 'Ẩn dụ · Fancy word' },
        { text: 'đem lại doanh thu khủng', translation: 'drive giant profits', typeFunction: 'Động từ · Ending' }
    ]
  },
  {
    hints: [
        { text: 'Tin hay không tùy', translation: 'Believe it or not', typeFunction: 'Cụm mào đầu · Intro' },
        { text: 'phiên livestream bán hàng', translation: 'live shopping show', typeFunction: 'Danh từ · Keyword' },
        { text: 'hơn nữa', translation: 'moreover', typeFunction: 'Từ nối · Logic word' },
        { text: 'cỗ máy in tiền', translation: 'money printing machine', typeFunction: 'Ẩn dụ · Fancy word' },
        { text: 'cháy hàng trong phút mốt', translation: 'cleared out in seconds', typeFunction: 'Tính từ · Ending' }
    ]
  },
  {
    hints: [
        { text: 'Chứ còn gì nữa', translation: 'Tell me about it', typeFunction: 'Cụm mào đầu · Intro' },
        { text: 'ví điện tử tiện lợi', translation: 'seamless e-wallet', typeFunction: 'Danh từ · Keyword' },
        { text: 'sau đó', translation: 'then', typeFunction: 'Từ nối · Logic word' },
        { text: 'cú chạm tay ma thuật', translation: 'magic tap touch', typeFunction: 'Ẩn dụ · Fancy word' },
        { text: 'tiền bay vèo vèo', translation: 'funds vanish effortlessly', typeFunction: 'Trạng từ · Ending' }
    ]
  },
  {
    hints: [
        { text: 'Bằng mọi giá', translation: 'At all costs', typeFunction: 'Cụm mào đầu · Intro' },
        { text: 'tỉ lệ chuyển đổi giỏ hàng', translation: 'checkout conversion', typeFunction: 'Danh từ · Keyword' },
        { text: 'thực chất là', translation: 'actually', typeFunction: 'Từ nối · Logic word' },
        { text: 'huyết mạch sống còn', translation: 'vital lifeline', typeFunction: 'Ẩn dụ · Fancy word' },
        { text: 'phải giữ vững', translation: 'must defend fiercely', typeFunction: 'Động từ · Ending' }
    ]
  },
  {
    hints: [
        { text: 'Chuyện là vầy', translation: 'Here is the story', typeFunction: 'Cụm mào đầu · Intro' },
        { text: 'quảng cáo Thái Lan', translation: 'Thai commercial ad', typeFunction: 'Danh từ · Keyword' },
        { text: 'miễn là', translation: 'as long as', typeFunction: 'Từ nối · Logic word' },
        { text: 'nước mắt hòa nụ cười', translation: 'tears and laughter', typeFunction: 'Ẩn dụ · Fancy word' },
        { text: 'chắc chắn viral mạng', translation: 'guaranteed viral hit', typeFunction: 'Tính từ · Ending' }
    ]
  },
  {
    hints: [
        { text: 'Để ý xem', translation: 'Look closely', typeFunction: 'Cụm mào đầu · Intro' },
        { text: 'phí giao hàng hỏa tốc', translation: 'express shipping fee', typeFunction: 'Danh từ · Keyword' },
        { text: 'nếu không', translation: 'otherwise', typeFunction: 'Từ nối · Logic word' },
        { text: 'hòn đá cản đường', translation: 'stumbling block', typeFunction: 'Ẩn dụ · Fancy word' },
        { text: 'khiến khách bỏ giỏ hàng', translation: 'prompt cart abandonment', typeFunction: 'Động từ · Ending' }
    ]
  },
  {
    hints: [
        { text: 'Như tôi đã nói', translation: 'Like I mentioned', typeFunction: 'Cụm mào đầu · Intro' },
        { text: 'thị trường bán lẻ', translation: 'retail landscape', typeFunction: 'Danh từ · Keyword' },
        { text: 'đồng thời', translation: 'meanwhile', typeFunction: 'Từ nối · Logic word' },
        { text: 'miếng bánh thị phần', translation: 'market share pie', typeFunction: 'Ẩn dụ · Fancy word' },
        { text: 'chia lại cho kẻ nhanh chân', translation: 'carved by agile players', typeFunction: 'Tính từ · Ending' }
    ]
  },
  {
    hints: [
        { text: 'Nói thiệt lòng', translation: 'Honestly speaking', typeFunction: 'Cụm mào đầu · Intro' },
        { text: 'mảng thời trang nhanh', translation: 'fast fashion sector', typeFunction: 'Danh từ · Keyword' },
        { text: 'cho nên', translation: 'so that', typeFunction: 'Từ nối · Logic word' },
        { text: 'cơn sốt nhất thời', translation: 'fleeting fad', typeFunction: 'Ẩn dụ · Fancy word' },
        { text: 'qua đi rất nhanh', translation: 'fade quickly', typeFunction: 'Động từ · Ending' }
    ]
  },
  {
    hints: [
        { text: 'Thú thật là', translation: 'Frankly speaking', typeFunction: 'Cụm mào đầu · Intro' },
        { text: 'người đi lượn ngắm đồ', translation: 'casual window shoppers', typeFunction: 'Danh từ · Keyword' },
        { text: 'trái lại', translation: 'in contrast', typeFunction: 'Từ nối · Logic word' },
        { text: 'mồi lửa âm ỉ', translation: 'slow simmer fire', typeFunction: 'Ẩn dụ · Fancy word' },
        { text: 'sẽ bùng nổ khi sale', translation: 'erupt when discounted', typeFunction: 'Động từ · Ending' }
    ]
  },
  {
    hints: [
        { text: 'Ai dè', translation: 'Who would have thought', typeFunction: 'Cụm mào đầu · Intro' },
        { text: 'món đồ săn sale 1k', translation: 'flash sale grab item', typeFunction: 'Danh từ · Keyword' },
        { text: 'dù vậy', translation: 'even so', typeFunction: 'Từ nối · Logic word' },
        { text: 'đồ giả mạo', translation: 'cheap counterfeit', typeFunction: 'Ẩn dụ · Fancy word' },
        { text: 'hỏng ngay ngày đầu', translation: 'broke immediately', typeFunction: 'Tính từ · Ending' }
    ]
  },
  {
    hints: [
        { text: 'Hóa ra', translation: 'Turned out', typeFunction: 'Cụm mào đầu · Intro' },
        { text: 'chính sách đổi trả 7 ngày', translation: '7-day return guarantee', typeFunction: 'Danh từ · Keyword' },
        { text: 'tiếp theo', translation: 'next', typeFunction: 'Từ nối · Logic word' },
        { text: 'chiếc phao bảo hiểm', translation: 'comforting cushion', typeFunction: 'Ẩn dụ · Fancy word' },
        { text: 'giúp khách an tâm', translation: 'put minds at ease', typeFunction: 'Động từ · Ending' }
    ]
  },
  {
    hints: [
        { text: 'Nhớ kỹ nè', translation: 'Mark my words', typeFunction: 'Cụm mào đầu · Intro' },
        { text: 'hoa hồng tiếp thị liên kết', translation: 'affiliate commissions', typeFunction: 'Danh từ · Keyword' },
        { text: 'bởi vì', translation: 'because', typeFunction: 'Từ nối · Logic word' },
        { text: 'đòn bẩy tăng trưởng', translation: 'turbocharged growth', typeFunction: 'Ẩn dụ · Fancy word' },
        { text: 'cực kỳ hiệu quả', translation: 'insanely potent', typeFunction: 'Tính từ · Ending' }
    ]
  },
  {
    hints: [
        { text: 'Nghe nè', translation: 'Listen closely', typeFunction: 'Cụm mào đầu · Intro' },
        { text: 'đánh giá 1 sao', translation: 'one-star review strike', typeFunction: 'Danh từ · Keyword' },
        { text: 'ngoài ra', translation: 'besides', typeFunction: 'Từ nối · Logic word' },
        { text: 'vết nhọ thương hiệu', translation: 'stain on reputation', typeFunction: 'Ẩn dụ · Fancy word' },
        { text: 'phải xử lý khéo léo', translation: 'defuse diplomatically', typeFunction: 'Động từ · Ending' }
    ]
  },
  {
    hints: [
        { text: 'Theo tôi thấy', translation: 'The way I see it', typeFunction: 'Cụm mào đầu · Intro' },
        { text: 'trải nghiệm người mua sắm', translation: 'buyer journey touchpoints', typeFunction: 'Danh từ · Keyword' },
        { text: 'thay vào đó', translation: 'instead', typeFunction: 'Từ nối · Logic word' },
        { text: 'kim chỉ nam hành động', translation: 'guiding northern star', typeFunction: 'Ẩn dụ · Fancy word' },
        { text: 'phải đặt lên hàng đầu', translation: 'prized above all', typeFunction: 'Tính từ · Ending' }
    ]
  },
  {
    hints: [
        { text: 'Tính ra', translation: 'Looking back', typeFunction: 'Cụm mào đầu · Intro' },
        { text: 'ngày hội siêu sale 11.11', translation: 'single day mega blowout', typeFunction: 'Danh từ · Keyword' },
        { text: 'sau cùng', translation: 'eventually', typeFunction: 'Từ nối · Logic word' },
        { text: 'cơn bão doanh thu', translation: 'golden revenue flood', typeFunction: 'Ẩn dụ · Fancy word' },
        { text: 'đem về lợi nhuận lớn', translation: 'deliver bumper profits', typeFunction: 'Động từ · Ending' }
    ]
  },
  {
    hints: [
        { text: 'Cùng lắm', translation: 'In the worst case', typeFunction: 'Cụm mào đầu · Intro' },
        { text: 'hàng giao chậm trễ', translation: 'delayed delivery shipment', typeFunction: 'Danh từ · Keyword' },
        { text: 'tuy vậy', translation: 'nonetheless', typeFunction: 'Từ nối · Logic word' },
        { text: 'lời xin lỗi chân thành', translation: 'olive branch voucher', typeFunction: 'Ẩn dụ · Fancy word' },
        { text: 'xoa dịu khách hàng', translation: 'pacify angry buyers', typeFunction: 'Động từ · Ending' }
    ]
  },
  {
    hints: [
        { text: 'Trước tiên', translation: 'First and foremost', typeFunction: 'Cụm mào đầu · Intro' },
        { text: 'chất lượng sản phẩm gốc', translation: 'genuine product quality', typeFunction: 'Danh từ · Keyword' },
        { text: 'trước hết', translation: 'to begin with', typeFunction: 'Từ nối · Logic word' },
        { text: 'nền móng kiên cố', translation: 'granite cornerstone', typeFunction: 'Ẩn dụ · Fancy word' },
        { text: 'không thể đánh đổi', translation: 'non-negotiable', typeFunction: 'Tính từ · Ending' }
    ]
  },
  {
    hints: [
        { text: 'Nói cách khác', translation: 'To rephrase it', typeFunction: 'Cụm mào đầu · Intro' },
        { text: 'khách hàng trung thành', translation: 'retained brand devotees', typeFunction: 'Danh từ · Keyword' },
        { text: 'rốt cuộc', translation: 'in the end', typeFunction: 'Từ nối · Logic word' },
        { text: 'lá chắn bảo vệ', translation: 'impenetrable shield', typeFunction: 'Ẩn dụ · Fancy word' },
        { text: 'giúp vượt qua bão giá', translation: 'weather price storms', typeFunction: 'Động từ · Ending' }
    ]
  },
  {
    hints: [
        { text: 'Thực tế thì', translation: 'In reality', typeFunction: 'Cụm mào đầu · Intro' },
        { text: 'mạng lưới phân phối sỉ', translation: 'wholesale retail network', typeFunction: 'Danh từ · Keyword' },
        { text: 'miễn sao', translation: 'provided that', typeFunction: 'Từ nối · Logic word' },
        { text: 'chân rết vững chắc', translation: 'sturdy tentacle grip', typeFunction: 'Ẩn dụ · Fancy word' },
        { text: 'luôn dồi dào nguồn cung', translation: 'keeps supply flowing', typeFunction: 'Tính từ · Ending' }
    ]
  },
  {
    hints: [
        { text: 'Đừng quên', translation: 'Never forget', typeFunction: 'Cụm mào đầu · Intro' },
        { text: 'bảo mật cổng thanh toán', translation: 'checkout gateway vault', typeFunction: 'Danh từ · Keyword' },
        { text: 'khi mà', translation: 'whenever', typeFunction: 'Từ nối · Logic word' },
        { text: 'tường lửa vững chắc', translation: 'firewall fortress', typeFunction: 'Ẩn dụ · Fancy word' },
        { text: 'ngăn chặn tin tặc', translation: 'repel hackers', typeFunction: 'Động từ · Ending' }
    ]
  },
  {
    hints: [
        { text: 'Chuyện thiệt luôn', translation: 'True story no joke', typeFunction: 'Cụm mào đầu · Intro' },
        { text: 'video quảng cáo ngắn', translation: 'short reel commercial', typeFunction: 'Danh từ · Keyword' },
        { text: 'chính vì thế', translation: 'for that reason', typeFunction: 'Từ nối · Logic word' },
        { text: 'cơn địa chấn mạng', translation: 'social media shockwave', typeFunction: 'Ẩn dụ · Fancy word' },
        { text: 'khiến máy chủ quá tải', translation: 'overwhelmed checkout', typeFunction: 'Tính từ · Ending' }
    ]
  },
  {
    hints: [
        { text: 'Nhìn chung', translation: 'All things considered', typeFunction: 'Cụm mào đầu · Intro' },
        { text: 'xu hướng mua sắm mới', translation: 'modern consumer habits', typeFunction: 'Danh từ · Keyword' },
        { text: 'không chỉ', translation: 'not only', typeFunction: 'Từ nối · Logic word' },
        { text: 'làn gió đổi mới', translation: 'fresh wind of change', typeFunction: 'Ẩn dụ · Fancy word' },
        { text: 'mà còn mở lối đi riêng', translation: 'unlocked uncharted paths', typeFunction: 'Tính từ · Ending' }
    ]
  },
  {
    hints: [
        { text: 'Nói ngắn gọn', translation: 'In short words', typeFunction: 'Cụm mào đầu · Intro' },
        { text: 'cuộc đua hạ giá sốc', translation: 'destructive price race', typeFunction: 'Danh từ · Keyword' },
        { text: 'nhưng bù lại', translation: 'yet in return', typeFunction: 'Từ nối · Logic word' },
        { text: 'trò chơi sinh tử', translation: 'hunger games standoff', typeFunction: 'Ẩn dụ · Fancy word' },
        { text: 'loại bỏ kẻ yếu thế', translation: 'cull the weak', typeFunction: 'Động từ · Ending' }
    ]
  },
  {
    hints: [
        { text: 'Nói thẳng ra', translation: 'Put simply', typeFunction: 'Cụm mào đầu · Intro' },
        { text: 'chi phí quảng cáo đắt đỏ', translation: 'soaring ad expenditure', typeFunction: 'Danh từ · Keyword' },
        { text: 'nếu không kiểm soát', translation: 'if left unchecked', typeFunction: 'Từ nối · Logic word' },
        { text: 'hố đen hút tiền', translation: 'black hole drain', typeFunction: 'Ẩn dụ · Fancy word' },
        { text: 'làm cạn kiệt ngân sách', translation: 'exhausts reserves', typeFunction: 'Động từ · Ending' }
    ]
  },
  {
    hints: [
        { text: 'Điều bất ngờ là', translation: 'The shocker is', typeFunction: 'Cụm mào đầu · Intro' },
        { text: 'chương trình khách hàng VIP', translation: 'VIP tier privilege', typeFunction: 'Danh từ · Keyword' },
        { text: 'sau khi áp dụng', translation: 'post implementation', typeFunction: 'Từ nối · Logic word' },
        { text: 'cú lội ngược dòng', translation: 'miracle turnaround', typeFunction: 'Ẩn dụ · Fancy word' },
        { text: 'tăng gấp đôi đơn hàng', translation: 'doubled checkout count', typeFunction: 'Động từ · Ending' }
    ]
  },
  {
    hints: [
        { text: 'Rút kinh nghiệm', translation: 'Lesson learned', typeFunction: 'Cụm mào đầu · Intro' },
        { text: 'người bán hàng uy tín', translation: 'verified top merchant', typeFunction: 'Danh từ · Keyword' },
        { text: 'bằng cách', translation: 'by means of', typeFunction: 'Từ nối · Logic word' },
        { text: 'tấm lòng thành thực', translation: 'golden honesty coin', typeFunction: 'Ẩn dụ · Fancy word' },
        { text: 'giữ chân khách trọn đời', translation: 'wins lifetime loyalty', typeFunction: 'Động từ · Ending' }
    ]
  },
  {
    hints: [
        { text: 'Về cơ bản', translation: 'At its core', typeFunction: 'Cụm mào đầu · Intro' },
        { text: 'sự tiện lợi của TMĐT', translation: 'convenience of e-retail', typeFunction: 'Danh từ · Keyword' },
        { text: 'chính là', translation: 'namely', typeFunction: 'Từ nối · Logic word' },
        { text: 'đòn bẩy thay đổi thói quen', translation: 'habit altering lever', typeFunction: 'Ẩn dụ · Fancy word' },
        { text: 'chinh phục người tiêu dùng', translation: 'captivates millions', typeFunction: 'Động từ · Ending' }
    ]
  },
  {
    hints: [
        { text: 'Tóm lại là', translation: 'Bottom line is', typeFunction: 'Cụm mào đầu · Intro' },
        { text: 'chiến lược bán lẻ thông minh', translation: 'clever omnichannel plan', typeFunction: 'Danh từ · Keyword' },
        { text: 'sau hết', translation: 'above all else', typeFunction: 'Từ nối · Logic word' },
        { text: 'quả ngọt đầu mùa', translation: 'bountiful first harvest', typeFunction: 'Ẩn dụ · Fancy word' },
        { text: 'thống lĩnh thị trường', translation: 'rules the retail roost', typeFunction: 'Tính từ · Ending' }
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

  const prefix = 'set05';

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

export const IMPROV_SET_05: ImprovPackage = buildPackage(
  'improv_set_05_ecommerce_and_retail',
  'Set 05 • E-commerce & Retail (Market Dynamics & Shopping Reflex)',
  '120 progressive deduction items for e-commerce trends, bargain hunting, and retail consumer reflexes based on Level B Day 8.',
  'LEVEL_B_ERES',
  ["level_b_eres_day_8"],
  s1_items,
  s2_items,
  s3_items,
  s4_items
);
