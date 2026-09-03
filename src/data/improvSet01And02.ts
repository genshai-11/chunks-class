import { ImprovPackage } from '../types/improv';

// Helper to construct items
interface HintDef {
  text: string;
  translation: string;
  typeFunction: string;
}

interface ItemDef {
  hints: HintDef[];
}

// -------------------------------------------------------------
// SET 01: Wandering Souls (Airport, Travel, Flight, Belongings, Transit)
// Based on Level B ERES Day 2
// -------------------------------------------------------------

// Session 1: 15 items, hcTotal = 2, hintTypes: ['Keyword', 'Ending']
const s1_items_set1: ItemDef[] = [
  {
    hints: [
      { text: 'cơm tối', translation: 'dinner', typeFunction: 'Danh từ · Keyword' },
      { text: 'nấu', translation: 'cook', typeFunction: 'Động từ · Ending' }
    ]
  },
  {
    hints: [
      { text: 'thẻ lên máy bay', translation: 'boarding pass', typeFunction: 'Danh từ · Keyword' },
      { text: 'làm mất', translation: 'lose / lost', typeFunction: 'Động từ · Ending' }
    ]
  },
  {
    hints: [
      { text: 'tiền lẻ', translation: 'loose change', typeFunction: 'Danh từ · Keyword' },
      { text: 'túi trước', translation: 'front pocket', typeFunction: 'Danh từ · Ending' }
    ]
  },
  {
    hints: [
      { text: 'xe đẩy hành lý', translation: 'luggage cart', typeFunction: 'Danh từ · Keyword' },
      { text: 'nặng', translation: 'heavy', typeFunction: 'Tính từ · Ending' }
    ]
  },
  {
    hints: [
      { text: 'nhân viên hải quan', translation: 'customs officer', typeFunction: 'Danh từ · Keyword' },
      { text: 'kiểm tra', translation: 'check', typeFunction: 'Động từ · Ending' }
    ]
  },
  {
    hints: [
      { text: 'túi ngủ', translation: 'sleeping bag', typeFunction: 'Danh từ · Keyword' },
      { text: 'ấm áp', translation: 'warm', typeFunction: 'Tính từ · Ending' }
    ]
  },
  {
    hints: [
      { text: 'khách sạn', translation: 'hotel', typeFunction: 'Danh từ · Keyword' },
      { text: 'đặt trước', translation: 'book in advance', typeFunction: 'Động từ · Ending' }
    ]
  },
  {
    hints: [
      { text: 'chuyến bay', translation: 'flight', typeFunction: 'Danh từ · Keyword' },
      { text: 'hoãn', translation: 'delayed', typeFunction: 'Tính từ · Ending' }
    ]
  },
  {
    hints: [
      { text: 'hộ chiếu', translation: 'passport', typeFunction: 'Danh từ · Keyword' },
      { text: 'cất kỹ', translation: 'keep safe', typeFunction: 'Động từ · Ending' }
    ]
  },
  {
    hints: [
      { text: 'vali', translation: 'suitcase', typeFunction: 'Danh từ · Keyword' },
      { text: 'khóa', translation: 'lock', typeFunction: 'Động từ · Ending' }
    ]
  },
  {
    hints: [
      { text: 'dép lào', translation: 'flip-flops', typeFunction: 'Danh từ · Keyword' },
      { text: 'đi biển', translation: 'beach trip', typeFunction: 'Danh từ · Ending' }
    ]
  },
  {
    hints: [
      { text: 'cửa khởi hành', translation: 'boarding gate', typeFunction: 'Danh từ · Keyword' },
      { text: 'tìm', translation: 'find', typeFunction: 'Động từ · Ending' }
    ]
  },
  {
    hints: [
      { text: 'đồ ăn nhẹ', translation: 'snacks', typeFunction: 'Danh từ · Keyword' },
      { text: 'mang theo', translation: 'bring along', typeFunction: 'Động từ · Ending' }
    ]
  },
  {
    hints: [
      { text: 'thời gian quá cảnh', translation: 'layover time', typeFunction: 'Danh từ · Keyword' },
      { text: 'dài', translation: 'long', typeFunction: 'Tính từ · Ending' }
    ]
  },
  {
    hints: [
      { text: 'tài xế taxi', translation: 'taxi driver', typeFunction: 'Danh từ · Keyword' },
      { text: 'thân thiện', translation: 'friendly', typeFunction: 'Tính từ · Ending' }
    ]
  }
];

// Session 2: 15 items, hcTotal = 3, hintTypes: ['Keyword', 'Logic word', 'Ending']
const s2_items_set1: ItemDef[] = [
  {
    hints: [
      { text: 'Chuyến bay đêm', translation: 'red-eye flight', typeFunction: 'Danh từ · Keyword' },
      { text: 'tuy nhiên', translation: 'however', typeFunction: 'Từ nối · Logic word' },
      { text: 'mệt mỏi', translation: 'exhausted', typeFunction: 'Tính từ · Ending' }
    ]
  },
  {
    hints: [
      { text: 'Đổi vé', translation: 'rebook ticket', typeFunction: 'Động từ · Keyword' },
      { text: 'trước đó', translation: 'before that', typeFunction: 'Từ nối · Logic word' },
      { text: 'miễn phí', translation: 'free of charge', typeFunction: 'Tính từ · Ending' }
    ]
  },
  {
    hints: [
      { text: 'Quầy thủ tục', translation: 'check-in desk', typeFunction: 'Danh từ · Keyword' },
      { text: 'hơn nữa', translation: 'moreover', typeFunction: 'Từ nối · Logic word' },
      { text: 'đông đúc', translation: 'crowded', typeFunction: 'Tính từ · Ending' }
    ]
  },
  {
    hints: [
      { text: 'Hành lý xách tay', translation: 'carry-on bag', typeFunction: 'Danh từ · Keyword' },
      { text: 'nếu không', translation: 'otherwise', typeFunction: 'Từ nối · Logic word' },
      { text: 'quá cước', translation: 'overweight', typeFunction: 'Tính từ · Ending' }
    ]
  },
  {
    hints: [
      { text: 'Thẻ lên tàu', translation: 'boarding pass', typeFunction: 'Danh từ · Keyword' },
      { text: 'sau cùng', translation: 'eventually', typeFunction: 'Từ nối · Logic word' },
      { text: 'tìm thấy', translation: 'found', typeFunction: 'Động từ · Ending' }
    ]
  },
  {
    hints: [
      { text: 'Giờ khởi hành', translation: 'departure time', typeFunction: 'Danh từ · Keyword' },
      { text: 'do đó', translation: 'therefore', typeFunction: 'Từ nối · Logic word' },
      { text: 'vội vã', translation: 'rush', typeFunction: 'Động từ · Ending' }
    ]
  },
  {
    hints: [
      { text: 'Lối thoát hiểm', translation: 'emergency exit', typeFunction: 'Danh từ · Keyword' },
      { text: 'nếu', translation: 'if', typeFunction: 'Từ nối · Logic word' },
      { text: 'rộng rãi', translation: 'spacious', typeFunction: 'Tính từ · Ending' }
    ]
  },
  {
    hints: [
      { text: 'Đổi tiền', translation: 'currency exchange', typeFunction: 'Danh từ · Keyword' },
      { text: 'tiếp theo', translation: 'next', typeFunction: 'Từ nối · Logic word' },
      { text: 'thuận tiện', translation: 'convenient', typeFunction: 'Tính từ · Ending' }
    ]
  },
  {
    hints: [
      { text: 'Khách sạn', translation: 'hotel room', typeFunction: 'Danh từ · Keyword' },
      { text: 'nói cách khác', translation: 'in other words', typeFunction: 'Từ nối · Logic word' },
      { text: 'kín phòng', translation: 'fully booked', typeFunction: 'Tính từ · Ending' }
    ]
  },
  {
    hints: [
      { text: 'Bản đồ sân bay', translation: 'terminal map', typeFunction: 'Danh từ · Keyword' },
      { text: 'dù vậy', translation: 'nevertheless', typeFunction: 'Từ nối · Logic word' },
      { text: 'hữu ích', translation: 'helpful', typeFunction: 'Tính từ · Ending' }
    ]
  },
  {
    hints: [
      { text: 'Khu miễn thuế', translation: 'duty-free shop', typeFunction: 'Danh từ · Keyword' },
      { text: 'ví dụ', translation: 'for example', typeFunction: 'Từ nối · Logic word' },
      { text: 'đắt đỏ', translation: 'pricey', typeFunction: 'Tính từ · Ending' }
    ]
  },
  {
    hints: [
      { text: 'Xe buýt sân bay', translation: 'shuttle bus', typeFunction: 'Danh từ · Keyword' },
      { text: 'đúng lúc', translation: 'just in time', typeFunction: 'Trạng từ · Logic word' },
      { text: 'khởi hành', translation: 'depart', typeFunction: 'Động từ · Ending' }
    ]
  },
  {
    hints: [
      { text: 'Thất lạc đồ', translation: 'lost luggage', typeFunction: 'Danh từ · Keyword' },
      { text: 'đồng thời', translation: 'meanwhile', typeFunction: 'Từ nối · Logic word' },
      { text: 'lo lắng', translation: 'anxious', typeFunction: 'Tính từ · Ending' }
    ]
  },
  {
    hints: [
      { text: 'Băng chuyền hành lý', translation: 'baggage carousel', typeFunction: 'Danh từ · Keyword' },
      { text: 'cuối cùng', translation: 'finally', typeFunction: 'Từ nối · Logic word' },
      { text: 'dừng lại', translation: 'stop', typeFunction: 'Động từ · Ending' }
    ]
  },
  {
    hints: [
      { text: 'Thẻ tín dụng', translation: 'credit card', typeFunction: 'Danh từ · Keyword' },
      { text: 'ngoài ra', translation: 'in addition', typeFunction: 'Từ nối · Logic word' },
      { text: 'chấp nhận', translation: 'accepted', typeFunction: 'Tính từ · Ending' }
    ]
  }
];

// Session 3: 15 items, hcTotal = 4, hintTypes: ['Keyword', 'Logic word', 'Fancy word', 'Ending']
const s3_items_set1: ItemDef[] = [
  {
    hints: [
      { text: 'Hộ chiếu', translation: 'passport', typeFunction: 'Danh từ · Keyword' },
      { text: 'trong khi', translation: 'while', typeFunction: 'Từ nối · Logic word' },
      { text: 'săm soi', translation: 'scrutinize', typeFunction: 'Cụm gợi hình · Fancy word' },
      { text: 'hải quan', translation: 'customs', typeFunction: 'Danh từ · Ending' }
    ]
  },
  {
    hints: [
      { text: 'Nồi cơm điện', translation: 'rice cooker', typeFunction: 'Danh từ · Keyword' },
      { text: 'nhưng', translation: 'but', typeFunction: 'Từ nối · Logic word' },
      { text: 'cồng kềnh', translation: 'bulky item', typeFunction: 'Cụm gợi hình · Fancy word' },
      { text: 'xách tay', translation: 'carry on', typeFunction: 'Động từ · Ending' }
    ]
  },
  {
    hints: [
      { text: 'Bao lâu', translation: 'How long', typeFunction: 'Cụm nghi vấn · WH word' },
      { text: 'nếu không', translation: 'otherwise', typeFunction: 'Từ nối · Logic word' },
      { text: 'ùn tắc', translation: 'bottleneck', typeFunction: 'Ẩn dụ · Fancy word' },
      { text: 'lỡ chuyến', translation: 'miss the flight', typeFunction: 'Động từ · Ending' }
    ]
  },
  {
    hints: [
      { text: 'Xe đẩy hành lý', translation: 'luggage cart', typeFunction: 'Danh từ · Keyword' },
      { text: 'tuy nhiên', translation: 'however', typeFunction: 'Từ nối · Logic word' },
      { text: 'kẹt cứng', translation: 'dead stop', typeFunction: 'Cụm gợi hình · Fancy word' },
      { text: 'sảnh đến', translation: 'arrival hall', typeFunction: 'Danh từ · Ending' }
    ]
  },
  {
    hints: [
      { text: 'Quá cảnh', translation: 'layover', typeFunction: 'Danh từ · Keyword' },
      { text: 'do đó', translation: 'therefore', typeFunction: 'Từ nối · Logic word' },
      { text: 'mỏi mòn', translation: 'endless wait', typeFunction: 'Cụm gợi hình · Fancy word' },
      { text: 'phòng chờ', translation: 'lounge', typeFunction: 'Danh từ · Ending' }
    ]
  },
  {
    hints: [
      { text: 'Tại sao', translation: 'Why', typeFunction: 'Cụm nghi vấn · WH word' },
      { text: 'ngược lại', translation: 'in contrast', typeFunction: 'Từ nối · Logic word' },
      { text: 'bặt vô âm tín', translation: 'vanished', typeFunction: 'Ẩn dụ · Fancy word' },
      { text: 'hành lý ký gửi', translation: 'checked bag', typeFunction: 'Danh từ · Ending' }
    ]
  },
  {
    hints: [
      { text: 'Say xe', translation: 'carsick', typeFunction: 'Tính từ · Keyword' },
      { text: 'bởi thế', translation: 'for that reason', typeFunction: 'Từ nối · Logic word' },
      { text: 'choáng váng', translation: 'dizzy spell', typeFunction: 'Cụm gợi hình · Fancy word' },
      { text: 'dầu gió', translation: 'medicated oil', typeFunction: 'Danh từ · Ending' }
    ]
  },
  {
    hints: [
      { text: 'Cửa khởi hành', translation: 'gate', typeFunction: 'Danh từ · Keyword' },
      { text: 'mặc dù', translation: 'although', typeFunction: 'Từ nối · Logic word' },
      { text: 'xa tít', translation: 'miles away', typeFunction: 'Cụm gợi hình · Fancy word' },
      { text: 'kịp giờ', translation: 'in time', typeFunction: 'Trạng từ · Ending' }
    ]
  },
  {
    hints: [
      { text: 'Giờ cất cánh', translation: 'takeoff time', typeFunction: 'Danh từ · Keyword' },
      { text: 'tiếp theo', translation: 'next', typeFunction: 'Từ nối · Logic word' },
      { text: 'thông báo khẩn', translation: 'red alert', typeFunction: 'Ẩn dụ · Fancy word' },
      { text: 'hoãn bay', translation: 'postponed', typeFunction: 'Tính từ · Ending' }
    ]
  },
  {
    hints: [
      { text: 'Tiền lẻ', translation: 'loose change', typeFunction: 'Danh từ · Keyword' },
      { text: 'hơn nữa', translation: 'in addition', typeFunction: 'Từ nối · Logic word' },
      { text: 'leng keng', translation: 'clinking sound', typeFunction: 'Từ tượng thanh · Fancy word' },
      { text: 'khay kiểm tra', translation: 'scanner tray', typeFunction: 'Danh từ · Ending' }
    ]
  },
  {
    hints: [
      { text: 'Khi nào', translation: 'When', typeFunction: 'Cụm nghi vấn · WH word' },
      { text: 'sau đó', translation: 'then', typeFunction: 'Từ nối · Logic word' },
      { text: 'thở phào', translation: 'sigh of relief', typeFunction: 'Ẩn dụ · Fancy word' },
      { text: 'hạ cánh', translation: 'touch down', typeFunction: 'Động từ · Ending' }
    ]
  },
  {
    hints: [
      { text: 'Chợ đêm địa phương', translation: 'night market', typeFunction: 'Danh từ · Keyword' },
      { text: 'ví dụ', translation: 'for instance', typeFunction: 'Từ nối · Logic word' },
      { text: 'ấm bụng', translation: 'comfort food', typeFunction: 'Ẩn dụ · Fancy word' },
      { text: 'thưởng thức', translation: 'enjoy', typeFunction: 'Động từ · Ending' }
    ]
  },
  {
    hints: [
      { text: 'Đôi dép lào', translation: 'flip-flops', typeFunction: 'Danh từ · Keyword' },
      { text: 'miễn là', translation: 'as long as', typeFunction: 'Từ nối · Logic word' },
      { text: 'êm chân', translation: 'cushiony feel', typeFunction: 'Cụm gợi hình · Fancy word' },
      { text: 'dạo biển', translation: 'stroll', typeFunction: 'Động từ · Ending' }
    ]
  },
  {
    hints: [
      { text: 'Sim du lịch', translation: 'travel SIM', typeFunction: 'Danh từ · Keyword' },
      { text: 'sau cùng', translation: 'eventually', typeFunction: 'Từ nối · Logic word' },
      { text: 'thông suốt', translation: 'smooth signal', typeFunction: 'Ẩn dụ · Fancy word' },
      { text: 'kích hoạt', translation: 'activate', typeFunction: 'Động từ · Ending' }
    ]
  },
  {
    hints: [
      { text: 'Thời tiết xấu', translation: 'bad weather', typeFunction: 'Danh từ · Keyword' },
      { text: 'cho nên', translation: 'so that', typeFunction: 'Từ nối · Logic word' },
      { text: 'giông bão', translation: 'turbulent sky', typeFunction: 'Ẩn dụ · Fancy word' },
      { text: 'rung lắc', translation: 'bumpy ride', typeFunction: 'Cụm gợi hình · Ending' }
    ]
  }
];

// Session 4: 15 items, hcTotal = 5, hintTypes: ['Intro / Setup', 'Keyword', 'Logic word', 'Fancy word', 'Ending']
const s4_items_set1: ItemDef[] = [
  {
    hints: [
      { text: 'Trước tiên', translation: 'First off', typeFunction: 'Cụm mào đầu · Intro' },
      { text: 'thủ tục an ninh', translation: 'security check', typeFunction: 'Danh từ · Keyword' },
      { text: 'hơn nữa', translation: 'moreover', typeFunction: 'Từ nối · Logic word' },
      { text: 'xếp hàng dài', translation: 'snaking line', typeFunction: 'Cụm gợi hình · Fancy word' },
      { text: 'kiên nhẫn', translation: 'patient', typeFunction: 'Tính từ · Ending' }
    ]
  },
  {
    hints: [
      { text: 'Thú thật', translation: 'Honestly', typeFunction: 'Cụm mào đầu · Intro' },
      { text: 'vé máy bay', translation: 'airfare', typeFunction: 'Danh từ · Keyword' },
      { text: 'tuy nhiên', translation: 'however', typeFunction: 'Từ nối · Logic word' },
      { text: 'giá trên trời', translation: 'sky-high price', typeFunction: 'Ẩn dụ · Fancy word' },
      { text: 'cân nhắc', translation: 'reconsider', typeFunction: 'Động từ · Ending' }
    ]
  },
  {
    hints: [
      { text: 'Để ý xem', translation: 'Notice that', typeFunction: 'Cụm mào đầu · Intro' },
      { text: 'khu vực quá cảnh', translation: 'transit area', typeFunction: 'Danh từ · Keyword' },
      { text: 'nếu không', translation: 'otherwise', typeFunction: 'Từ nối · Logic word' },
      { text: 'mê cung', translation: 'maze-like corridor', typeFunction: 'Ẩn dụ · Fancy word' },
      { text: 'lạc đường', translation: 'get lost', typeFunction: 'Động từ · Ending' }
    ]
  },
  {
    hints: [
      { text: 'Tin tôi đi', translation: 'Trust me', typeFunction: 'Cụm mào đầu · Intro' },
      { text: 'gói bảo hiểm', translation: 'travel insurance', typeFunction: 'Danh từ · Keyword' },
      { text: 'trong khi', translation: 'while', typeFunction: 'Từ nối · Logic word' },
      { text: 'phao cứu sinh', translation: 'lifesaver', typeFunction: 'Ẩn dụ · Fancy word' },
      { text: 'cần thiết', translation: 'essential', typeFunction: 'Tính từ · Ending' }
    ]
  },
  {
    hints: [
      { text: 'Nghe này', translation: 'Listen up', typeFunction: 'Cụm mào đầu · Intro' },
      { text: 'đồ dùng cá nhân', translation: 'personal belongings', typeFunction: 'Danh từ · Keyword' },
      { text: 'trước đó', translation: 'before that', typeFunction: 'Từ nối · Logic word' },
      { text: 'cất kỹ', translation: 'lock tight', typeFunction: 'Cụm gợi hình · Fancy word' },
      { text: 'an toàn', translation: 'secure', typeFunction: 'Tính từ · Ending' }
    ]
  },
  {
    hints: [
      { text: 'Bạn biết đấy', translation: 'You know', typeFunction: 'Cụm mào đầu · Intro' },
      { text: 'chỗ ngồi', translation: 'seat reservation', typeFunction: 'Danh từ · Keyword' },
      { text: 'do đó', translation: 'therefore', typeFunction: 'Từ nối · Logic word' },
      { text: 'vị trí vàng', translation: 'prime spot', typeFunction: 'Ẩn dụ · Fancy word' },
      { text: 'thoải mái', translation: 'comfortable', typeFunction: 'Tính từ · Ending' }
    ]
  },
  {
    hints: [
      { text: 'May mắn thay', translation: 'Luckily', typeFunction: 'Cụm mào đầu · Intro' },
      { text: 'chuyến bay nối chuyến', translation: 'connecting flight', typeFunction: 'Danh từ · Keyword' },
      { text: 'mặc dù', translation: 'although', typeFunction: 'Từ nối · Logic word' },
      { text: 'chạy đua thời gian', translation: 'race against time', typeFunction: 'Ẩn dụ · Fancy word' },
      { text: 'kịp giờ', translation: 'on time', typeFunction: 'Trạng từ · Ending' }
    ]
  },
  {
    hints: [
      { text: 'Rõ ràng là', translation: 'Obviously', typeFunction: 'Cụm mào đầu · Intro' },
      { text: 'tài xế đón', translation: 'airport pickup', typeFunction: 'Danh từ · Keyword' },
      { text: 'tiếp theo', translation: 'next', typeFunction: 'Từ nối · Logic word' },
      { text: 'biển tên', translation: 'signboard', typeFunction: 'Danh từ · Fancy word' },
      { text: 'chờ sẵn', translation: 'wait outside', typeFunction: 'Động từ · Ending' }
    ]
  },
  {
    hints: [
      { text: 'Theo tôi thấy', translation: 'In my view', typeFunction: 'Cụm mào đầu · Intro' },
      { text: 'thẻ lên tàu điện tử', translation: 'mobile pass', typeFunction: 'Danh từ · Keyword' },
      { text: 'đồng thời', translation: 'meanwhile', typeFunction: 'Từ nối · Logic word' },
      { text: 'cứu cánh', translation: 'game changer', typeFunction: 'Ẩn dụ · Fancy word' },
      { text: 'tiện lợi', translation: 'convenient', typeFunction: 'Tính từ · Ending' }
    ]
  },
  {
    hints: [
      { text: 'Thử tưởng tượng', translation: 'Imagine that', typeFunction: 'Cụm mào đầu · Intro' },
      { text: 'băng chuyền hành lý', translation: 'baggage carousel', typeFunction: 'Danh từ · Keyword' },
      { text: 'cuối cùng', translation: 'finally', typeFunction: 'Từ nối · Logic word' },
      { text: 'trống trơn', translation: 'empty belt', typeFunction: 'Cụm gợi hình · Fancy word' },
      { text: 'thất vọng', translation: 'disappointed', typeFunction: 'Tính từ · Ending' }
    ]
  },
  {
    hints: [
      { text: 'Đừng lo', translation: "Don't worry", typeFunction: 'Cụm mào đầu · Intro' },
      { text: 'nhân viên hỗ trợ', translation: 'ground staff', typeFunction: 'Danh từ · Keyword' },
      { text: 'ví dụ', translation: 'for example', typeFunction: 'Từ nối · Logic word' },
      { text: 'nhiệt tình', translation: 'warm-hearted', typeFunction: 'Cụm gợi hình · Fancy word' },
      { text: 'giải quyết', translation: 'resolve', typeFunction: 'Động từ · Ending' }
    ]
  },
  {
    hints: [
      { text: 'Về cơ bản', translation: 'Basically', typeFunction: 'Cụm mào đầu · Intro' },
      { text: 'quy định hải quan', translation: 'customs rule', typeFunction: 'Danh từ · Keyword' },
      { text: 'nếu', translation: 'if', typeFunction: 'Từ nối · Logic word' },
      { text: 'rào cản', translation: 'barrier', typeFunction: 'Ẩn dụ · Fancy word' },
      { text: 'tuân thủ', translation: 'comply', typeFunction: 'Động từ · Ending' }
    ]
  },
  {
    hints: [
      { text: 'Thú thật là', translation: 'To be frank', typeFunction: 'Cụm mào đầu · Intro' },
      { text: 'lệch múi giờ', translation: 'jet lag', typeFunction: 'Danh từ · Keyword' },
      { text: 'sau cùng', translation: 'eventually', typeFunction: 'Từ nối · Logic word' },
      { text: 'kiệt sức', translation: 'dead tired', typeFunction: 'Cụm gợi hình · Fancy word' },
      { text: 'chợp mắt', translation: 'take a nap', typeFunction: 'Động từ · Ending' }
    ]
  },
  {
    hints: [
      { text: 'Nói thật nhé', translation: 'Truth be told', typeFunction: 'Cụm mào đầu · Intro' },
      { text: 'vali hành lý', translation: 'hard suitcase', typeFunction: 'Danh từ · Keyword' },
      { text: 'ngoài ra', translation: 'besides', typeFunction: 'Từ nối · Logic word' },
      { text: 'bền bỉ', translation: 'built to last', typeFunction: 'Cụm gợi hình · Fancy word' },
      { text: 'bảo vệ', translation: 'protect', typeFunction: 'Động từ · Ending' }
    ]
  },
  {
    hints: [
      { text: 'Không nghi ngờ gì', translation: 'No doubt', typeFunction: 'Cụm mào đầu · Intro' },
      { text: 'cẩm nang du lịch', translation: 'travel guide', typeFunction: 'Danh từ · Keyword' },
      { text: 'bởi thế', translation: 'for that reason', typeFunction: 'Từ nối · Logic word' },
      { text: 'kim chỉ nam', translation: 'compass', typeFunction: 'Ẩn dụ · Fancy word' },
      { text: 'hữu ích', translation: 'useful', typeFunction: 'Tính từ · Ending' }
    ]
  }
];

// -------------------------------------------------------------
// SET 02: Tell Me About Yourself (Self Intro, Accounting, Finance, Skills, Experience)
// Based on Level B ERES Day 3
// -------------------------------------------------------------

// Session 1: 15 items, hcTotal = 2, hintTypes: ['Keyword', 'Ending']
const s1_items_set2: ItemDef[] = [
  {
    hints: [
      { text: 'kinh nghiệm', translation: 'experience', typeFunction: 'Danh từ · Keyword' },
      { text: 'tích lũy', translation: 'gain', typeFunction: 'Động từ · Ending' }
    ]
  },
  {
    hints: [
      { text: 'báo cáo tài chính', translation: 'financial report', typeFunction: 'Danh từ · Keyword' },
      { text: 'hoàn thành', translation: 'finish', typeFunction: 'Động từ · Ending' }
    ]
  },
  {
    hints: [
      { text: 'năng động', translation: 'proactive', typeFunction: 'Tính từ · Keyword' },
      { text: 'làm việc', translation: 'work', typeFunction: 'Động từ · Ending' }
    ]
  },
  {
    hints: [
      { text: 'kỹ năng', translation: 'skills', typeFunction: 'Danh từ · Keyword' },
      { text: 'cải thiện', translation: 'improve', typeFunction: 'Động từ · Ending' }
    ]
  },
  {
    hints: [
      { text: 'quản lý rủi ro', translation: 'risk management', typeFunction: 'Danh từ · Keyword' },
      { text: 'cẩn thận', translation: 'careful', typeFunction: 'Tính từ · Ending' }
    ]
  },
  {
    hints: [
      { text: 'đồng nghiệp', translation: 'colleagues', typeFunction: 'Danh từ · Keyword' },
      { text: 'hỗ trợ', translation: 'support', typeFunction: 'Động từ · Ending' }
    ]
  },
  {
    hints: [
      { text: 'phỏng vấn', translation: 'job interview', typeFunction: 'Danh từ · Keyword' },
      { text: 'tự tin', translation: 'confident', typeFunction: 'Tính từ · Ending' }
    ]
  },
  {
    hints: [
      { text: 'giao dịch', translation: 'transactions', typeFunction: 'Danh từ · Keyword' },
      { text: 'đối soát', translation: 'reconcile', typeFunction: 'Động từ · Ending' }
    ]
  },
  {
    hints: [
      { text: 'sáng tạo', translation: 'creative', typeFunction: 'Tính từ · Keyword' },
      { text: 'giải pháp', translation: 'solutions', typeFunction: 'Danh từ · Ending' }
    ]
  },
  {
    hints: [
      { text: 'mục tiêu nghề nghiệp', translation: 'career goals', typeFunction: 'Danh từ · Keyword' },
      { text: 'theo đuổi', translation: 'pursue', typeFunction: 'Động từ · Ending' }
    ]
  },
  {
    hints: [
      { text: 'bảng cân đối kế toán', translation: 'balance sheet', typeFunction: 'Danh từ · Keyword' },
      { text: 'chính xác', translation: 'accurate', typeFunction: 'Tính từ · Ending' }
    ]
  },
  {
    hints: [
      { text: 'áp lực công việc', translation: 'work pressure', typeFunction: 'Danh từ · Keyword' },
      { text: 'thích nghi', translation: 'adapt', typeFunction: 'Động từ · Ending' }
    ]
  },
  {
    hints: [
      { text: 'dự án mới', translation: 'new project', typeFunction: 'Danh từ · Keyword' },
      { text: 'bắt đầu', translation: 'launch', typeFunction: 'Động từ · Ending' }
    ]
  },
  {
    hints: [
      { text: 'khách hàng', translation: 'clients', typeFunction: 'Danh từ · Keyword' },
      { text: 'hài lòng', translation: 'satisfied', typeFunction: 'Tính từ · Ending' }
    ]
  },
  {
    hints: [
      { text: 'văn hóa công ty', translation: 'company culture', typeFunction: 'Danh từ · Keyword' },
      { text: 'phù hợp', translation: 'fit in', typeFunction: 'Động từ · Ending' }
    ]
  }
];

// Session 2: 15 items, hcTotal = 3, hintTypes: ['Keyword', 'Logic word', 'Ending']
const s2_items_set2: ItemDef[] = [
  {
    hints: [
      { text: 'Báo cáo quý', translation: 'quarterly report', typeFunction: 'Danh từ · Keyword' },
      { text: 'trước đó', translation: 'before that', typeFunction: 'Từ nối · Logic word' },
      { text: 'phê duyệt', translation: 'approved', typeFunction: 'Tính từ · Ending' }
    ]
  },
  {
    hints: [
      { text: 'Chuyên môn kế toán', translation: 'accounting expertise', typeFunction: 'Danh từ · Keyword' },
      { text: 'hơn nữa', translation: 'in addition', typeFunction: 'Từ nối · Logic word' },
      { text: 'vững chắc', translation: 'solid', typeFunction: 'Tính từ · Ending' }
    ]
  },
  {
    hints: [
      { text: 'Dòng tiền', translation: 'cash flow', typeFunction: 'Danh từ · Keyword' },
      { text: 'tuy nhiên', translation: 'however', typeFunction: 'Từ nối · Logic word' },
      { text: 'biến động', translation: 'volatile', typeFunction: 'Tính từ · Ending' }
    ]
  },
  {
    hints: [
      { text: 'Đào tạo nội bộ', translation: 'internal training', typeFunction: 'Danh từ · Keyword' },
      { text: 'tiếp theo', translation: 'next', typeFunction: 'Từ nối · Logic word' },
      { text: 'hiệu quả', translation: 'effective', typeFunction: 'Tính từ · Ending' }
    ]
  },
  {
    hints: [
      { text: 'Chi phí vận hành', translation: 'operating expenses', typeFunction: 'Danh từ · Keyword' },
      { text: 'do đó', translation: 'therefore', typeFunction: 'Từ nối · Logic word' },
      { text: 'cắt giảm', translation: 'cut down', typeFunction: 'Động từ · Ending' }
    ]
  },
  {
    hints: [
      { text: 'Sổ cái tổng hợp', translation: 'general ledger', typeFunction: 'Danh từ · Keyword' },
      { text: 'nếu', translation: 'if', typeFunction: 'Từ nối · Logic word' },
      { text: 'cân bằng', translation: 'balanced', typeFunction: 'Tính từ · Ending' }
    ]
  },
  {
    hints: [
      { text: 'Làm việc nhóm', translation: 'teamwork', typeFunction: 'Danh từ · Keyword' },
      { text: 'nói cách khác', translation: 'in other words', typeFunction: 'Từ nối · Logic word' },
      { text: 'hợp tác', translation: 'collaborative', typeFunction: 'Tính từ · Ending' }
    ]
  },
  {
    hints: [
      { text: 'Thử việc', translation: 'probation period', typeFunction: 'Danh từ · Keyword' },
      { text: 'sau cùng', translation: 'eventually', typeFunction: 'Từ nối · Logic word' },
      { text: 'vượt qua', translation: 'pass', typeFunction: 'Động từ · Ending' }
    ]
  },
  {
    hints: [
      { text: 'Kiểm toán độc lập', translation: 'external audit', typeFunction: 'Danh từ · Keyword' },
      { text: 'mặc dù', translation: 'although', typeFunction: 'Từ nối · Logic word' },
      { text: 'nghiêm ngặt', translation: 'strict', typeFunction: 'Tính từ · Ending' }
    ]
  },
  {
    hints: [
      { text: 'Hạn chót', translation: 'deadline', typeFunction: 'Danh từ · Keyword' },
      { text: 'vì thế', translation: 'so', typeFunction: 'Từ nối · Logic word' },
      { text: 'hoàn thành sớm', translation: 'finish early', typeFunction: 'Động từ · Ending' }
    ]
  },
  {
    hints: [
      { text: 'Phần mềm kế toán', translation: 'accounting software', typeFunction: 'Danh từ · Keyword' },
      { text: 'ví dụ', translation: 'for example', typeFunction: 'Từ nối · Logic word' },
      { text: 'tự động hóa', translation: 'automate', typeFunction: 'Động từ · Ending' }
    ]
  },
  {
    hints: [
      { text: 'Thuế doanh nghiệp', translation: 'corporate tax', typeFunction: 'Danh từ · Keyword' },
      { text: 'ngoài ra', translation: 'besides', typeFunction: 'Từ nối · Logic word' },
      { text: 'tuân thủ', translation: 'comply', typeFunction: 'Động từ · Ending' }
    ]
  },
  {
    hints: [
      { text: 'Hiệu suất công việc', translation: 'work performance', typeFunction: 'Danh từ · Keyword' },
      { text: 'đồng thời', translation: 'meanwhile', typeFunction: 'Từ nối · Logic word' },
      { text: 'đánh giá cao', translation: 'highly rated', typeFunction: 'Tính từ · Ending' }
    ]
  },
  {
    hints: [
      { text: 'Đàm phán hợp đồng', translation: 'contract negotiation', typeFunction: 'Danh từ · Keyword' },
      { text: 'dù vậy', translation: 'nevertheless', typeFunction: 'Từ nối · Logic word' },
      { text: 'linh hoạt', translation: 'flexible', typeFunction: 'Tính từ · Ending' }
    ]
  },
  {
    hints: [
      { text: 'Tăng trưởng doanh thu', translation: 'revenue growth', typeFunction: 'Danh từ · Keyword' },
      { text: 'cuối cùng', translation: 'finally', typeFunction: 'Từ nối · Logic word' },
      { text: 'đạt mục tiêu', translation: 'reach targets', typeFunction: 'Động từ · Ending' }
    ]
  }
];

// Session 3: 15 items, hcTotal = 4, hintTypes: ['Keyword', 'Logic word', 'Fancy word', 'Ending']
const s3_items_set2: ItemDef[] = [
  {
    hints: [
      { text: 'Bảng cân đối', translation: 'balance sheet', typeFunction: 'Danh từ · Keyword' },
      { text: 'trong khi', translation: 'while', typeFunction: 'Từ nối · Logic word' },
      { text: 'lệch sổ', translation: 'mismatch', typeFunction: 'Cụm gợi hình · Fancy word' },
      { text: 'rà soát', translation: 're-check', typeFunction: 'Động từ · Ending' }
    ]
  },
  {
    hints: [
      { text: 'Dòng tiền dự phòng', translation: 'cash reserve', typeFunction: 'Danh từ · Keyword' },
      { text: 'nhưng', translation: 'but', typeFunction: 'Từ nối · Logic word' },
      { text: 'tấm đệm êm', translation: 'safety cushion', typeFunction: 'Ẩn dụ · Fancy word' },
      { text: 'ổn định', translation: 'stable', typeFunction: 'Tính từ · Ending' }
    ]
  },
  {
    hints: [
      { text: 'Quản lý rủi ro', translation: 'risk management', typeFunction: 'Danh từ · Keyword' },
      { text: 'do đó', translation: 'therefore', typeFunction: 'Từ nối · Logic word' },
      { text: 'lá chắn thép', translation: 'strong shield', typeFunction: 'Ẩn dụ · Fancy word' },
      { text: 'an toàn', translation: 'secure', typeFunction: 'Tính từ · Ending' }
    ]
  },
  {
    hints: [
      { text: 'Tại sao', translation: 'Why', typeFunction: 'Cụm nghi vấn · WH word' },
      { text: 'ngược lại', translation: 'in contrast', typeFunction: 'Từ nối · Logic word' },
      { text: 'thâm hụt', translation: 'in the red', typeFunction: 'Ẩn dụ · Fancy word' },
      { text: 'kiểm soát', translation: 'control', typeFunction: 'Động từ · Ending' }
    ]
  },
  {
    hints: [
      { text: 'Nhân viên mới', translation: 'new recruit', typeFunction: 'Danh từ · Keyword' },
      { text: 'tuy nhiên', translation: 'however', typeFunction: 'Từ nối · Logic word' },
      { text: 'hạt giống tiềm năng', translation: 'rising star', typeFunction: 'Ẩn dụ · Fancy word' },
      { text: 'hòa nhập', translation: 'adapt', typeFunction: 'Động từ · Ending' }
    ]
  },
  {
    hints: [
      { text: 'Khi nào', translation: 'When', typeFunction: 'Cụm nghi vấn · WH word' },
      { text: 'sau đó', translation: 'then', typeFunction: 'Từ nối · Logic word' },
      { text: 'bước ngoặt', translation: 'game changer', typeFunction: 'Ẩn dụ · Fancy word' },
      { text: 'thăng tiến', translation: 'promoted', typeFunction: 'Tính từ · Ending' }
    ]
  },
  {
    hints: [
      { text: 'Lợi nhuận ròng', translation: 'net profit', typeFunction: 'Danh từ · Keyword' },
      { text: 'hơn nữa', translation: 'moreover', typeFunction: 'Từ nối · Logic word' },
      { text: 'tăng vọt', translation: 'skyrocket', typeFunction: 'Cụm gợi hình · Fancy word' },
      { text: 'ấn tượng', translation: 'impressive', typeFunction: 'Tính từ · Ending' }
    ]
  },
  {
    hints: [
      { text: 'Kiểm toán nội bộ', translation: 'internal audit', typeFunction: 'Danh từ · Keyword' },
      { text: 'nếu không', translation: 'otherwise', typeFunction: 'Từ nối · Logic word' },
      { text: 'hồi chuông cảnh báo', translation: 'red flag', typeFunction: 'Ẩn dụ · Fancy word' },
      { text: 'khắc phục', translation: 'resolve', typeFunction: 'Động từ · Ending' }
    ]
  },
  {
    hints: [
      { text: 'Bao nhiêu', translation: 'How much', typeFunction: 'Cụm nghi vấn · WH word' },
      { text: 'bởi thế', translation: 'for that reason', typeFunction: 'Từ nối · Logic word' },
      { text: 'thắt lưng buộc bụng', translation: 'belt-tightening', typeFunction: 'Ẩn dụ · Fancy word' },
      { text: 'ngân sách', translation: 'budget', typeFunction: 'Danh từ · Ending' }
    ]
  },
  {
    hints: [
      { text: 'Kỹ năng giao tiếp', translation: 'interpersonal skills', typeFunction: 'Danh từ · Keyword' },
      { text: 'đồng thời', translation: 'meanwhile', typeFunction: 'Từ nối · Logic word' },
      { text: 'chìa khóa vàng', translation: 'golden key', typeFunction: 'Ẩn dụ · Fancy word' },
      { text: 'kết nối', translation: 'connect', typeFunction: 'Động từ · Ending' }
    ]
  },
  {
    hints: [
      { text: 'Mục tiêu kinh doanh', translation: 'business goal', typeFunction: 'Danh từ · Keyword' },
      { text: 'tiếp theo', translation: 'next', typeFunction: 'Từ nối · Logic word' },
      { text: 'tầm nhìn xa', translation: 'big picture', typeFunction: 'Ẩn dụ · Fancy word' },
      { text: 'bứt phá', translation: 'breakthrough', typeFunction: 'Danh từ · Ending' }
    ]
  },
  {
    hints: [
      { text: 'Sai lệch số liệu', translation: 'data discrepancy', typeFunction: 'Danh từ · Keyword' },
      { text: 'mặc dù', translation: 'although', typeFunction: 'Từ nối · Logic word' },
      { text: 'lỗ hổng nhỏ', translation: 'tiny leak', typeFunction: 'Ẩn dụ · Fancy word' },
      { text: 'chấn chỉnh', translation: 'rectify', typeFunction: 'Động từ · Ending' }
    ]
  },
  {
    hints: [
      { text: 'Giải pháp sáng tạo', translation: 'creative solution', typeFunction: 'Danh từ · Keyword' },
      { text: 'sau cùng', translation: 'eventually', typeFunction: 'Từ nối · Logic word' },
      { text: 'luồng gió mới', translation: 'breath of fresh air', typeFunction: 'Ẩn dụ · Fancy word' },
      { text: 'thành công', translation: 'succeed', typeFunction: 'Động từ · Ending' }
    ]
  },
  {
    hints: [
      { text: 'Áp lực doanh số', translation: 'sales pressure', typeFunction: 'Danh từ · Keyword' },
      { text: 'cho nên', translation: 'so that', typeFunction: 'Từ nối · Logic word' },
      { text: 'tôi luyện', translation: 'forge ahead', typeFunction: 'Ẩn dụ · Fancy word' },
      { text: 'kiên cường', translation: 'resilient', typeFunction: 'Tính từ · Ending' }
    ]
  },
  {
    hints: [
      { text: 'Cơ hội việc làm', translation: 'career opening', typeFunction: 'Danh từ · Keyword' },
      { text: 'miễn là', translation: 'as long as', typeFunction: 'Từ nối · Logic word' },
      { text: 'nắm bắt', translation: 'seize the day', typeFunction: 'Tục ngữ · Proverb' },
      { text: 'phát triển', translation: 'thrive', typeFunction: 'Động từ · Ending' }
    ]
  }
];

// Session 4: 15 items, hcTotal = 5, hintTypes: ['Intro / Setup', 'Keyword', 'Logic word', 'Fancy word', 'Ending']
const s4_items_set2: ItemDef[] = [
  {
    hints: [
      { text: 'Về cơ bản', translation: 'Basically', typeFunction: 'Cụm mào đầu · Intro' },
      { text: 'kiểm soát tài chính', translation: 'financial control', typeFunction: 'Danh từ · Keyword' },
      { text: 'hơn nữa', translation: 'moreover', typeFunction: 'Từ nối · Logic word' },
      { text: 'xương sống doanh nghiệp', translation: 'backbone', typeFunction: 'Ẩn dụ · Fancy word' },
      { text: 'vững chắc', translation: 'solid', typeFunction: 'Tính từ · Ending' }
    ]
  },
  {
    hints: [
      { text: 'Theo tôi thấy', translation: 'In my view', typeFunction: 'Cụm mào đầu · Intro' },
      { text: 'đạo đức nghề nghiệp', translation: 'professional ethics', typeFunction: 'Danh từ · Keyword' },
      { text: 'luôn luôn', translation: 'always', typeFunction: 'Trạng từ · Logic word' },
      { text: 'kim chỉ nam', translation: 'guiding compass', typeFunction: 'Ẩn dụ · Fancy word' },
      { text: 'chuẩn mực', translation: 'standard', typeFunction: 'Tính từ · Ending' }
    ]
  },
  {
    hints: [
      { text: 'Thú thật rằng', translation: 'To be frank', typeFunction: 'Cụm mào đầu · Intro' },
      { text: 'khối lượng công việc', translation: 'workload', typeFunction: 'Danh từ · Keyword' },
      { text: 'tuy nhiên', translation: 'however', typeFunction: 'Từ nối · Logic word' },
      { text: 'thử lửa', translation: 'baptism by fire', typeFunction: 'Ẩn dụ · Fancy word' },
      { text: 'trưởng thành', translation: 'mature', typeFunction: 'Động từ · Ending' }
    ]
  },
  {
    hints: [
      { text: 'Điểm mấu chốt', translation: 'The key point', typeFunction: 'Cụm mào đầu · Intro' },
      { text: 'tối ưu hóa quy trình', translation: 'process optimization', typeFunction: 'Danh từ · Keyword' },
      { text: 'trước đó', translation: 'before that', typeFunction: 'Từ nối · Logic word' },
      { text: 'bàn đạp vững', translation: 'launchpad', typeFunction: 'Ẩn dụ · Fancy word' },
      { text: 'hiệu quả', translation: 'efficient', typeFunction: 'Tính từ · Ending' }
    ]
  },
  {
    hints: [
      { text: 'Bạn biết đấy', translation: 'As you know', typeFunction: 'Cụm mào đầu · Intro' },
      { text: 'quản trị dòng tiền', translation: 'cash flow management', typeFunction: 'Danh từ · Keyword' },
      { text: 'do đó', translation: 'therefore', typeFunction: 'Từ nối · Logic word' },
      { text: 'huyết mạch', translation: 'lifeblood', typeFunction: 'Ẩn dụ · Fancy word' },
      { text: 'sống còn', translation: 'vital', typeFunction: 'Tính từ · Ending' }
    ]
  },
  {
    hints: [
      { text: 'Để tôi giải thích', translation: 'Let me explain', typeFunction: 'Cụm mào đầu · Intro' },
      { text: 'phân tích dữ liệu', translation: 'data analytics', typeFunction: 'Danh từ · Keyword' },
      { text: 'đồng thời', translation: 'meanwhile', typeFunction: 'Từ nối · Logic word' },
      { text: 'đòn bẩy mạnh', translation: 'powerful leverage', typeFunction: 'Ẩn dụ · Fancy word' },
      { text: 'chính xác', translation: 'accurate', typeFunction: 'Tính từ · Ending' }
    ]
  },
  {
    hints: [
      { text: 'Rõ ràng là', translation: 'Clearly', typeFunction: 'Cụm mào đầu · Intro' },
      { text: 'năng lực cốt lõi', translation: 'core competency', typeFunction: 'Danh từ · Keyword' },
      { text: 'tiếp theo', translation: 'next', typeFunction: 'Từ nối · Logic word' },
      { text: 'bước đệm tốt', translation: 'stepping stone', typeFunction: 'Ẩn dụ · Fancy word' },
      { text: 'nâng cao', translation: 'elevate', typeFunction: 'Động từ · Ending' }
    ]
  },
  {
    hints: [
      { text: 'Đáng chú ý là', translation: 'Notably', typeFunction: 'Cụm mào đầu · Intro' },
      { text: 'rủi ro thanh khoản', translation: 'liquidity risk', typeFunction: 'Danh từ · Keyword' },
      { text: 'nếu không', translation: 'otherwise', typeFunction: 'Từ nối · Logic word' },
      { text: 'vết dầu loang', translation: 'spillover', typeFunction: 'Ẩn dụ · Fancy word' },
      { text: 'kiểm soát', translation: 'mitigate', typeFunction: 'Động từ · Ending' }
    ]
  },
  {
    hints: [
      { text: 'Thật lòng mà nói', translation: 'Honestly speaking', typeFunction: 'Cụm mào đầu · Intro' },
      { text: 'môi trường làm việc', translation: 'work environment', typeFunction: 'Danh từ · Keyword' },
      { text: 'mặc dù', translation: 'although', typeFunction: 'Từ nối · Logic word' },
      { text: 'lò luyện thép', translation: 'crucible', typeFunction: 'Ẩn dụ · Fancy word' },
      { text: 'gắn bó', translation: 'committed', typeFunction: 'Tính từ · Ending' }
    ]
  },
  {
    hints: [
      { text: 'Nhìn chung', translation: 'Overall', typeFunction: 'Cụm mào đầu · Intro' },
      { text: 'kế hoạch tài chính', translation: 'financial planning', typeFunction: 'Danh từ · Keyword' },
      { text: 'ví dụ', translation: 'for example', typeFunction: 'Từ nối · Logic word' },
      { text: 'bản thiết kế', translation: 'blueprint', typeFunction: 'Ẩn dụ · Fancy word' },
      { text: 'khả thi', translation: 'feasible', typeFunction: 'Tính từ · Ending' }
    ]
  },
  {
    hints: [
      { text: 'Tin tôi đi', translation: 'Believe me', typeFunction: 'Cụm mào đầu · Intro' },
      { text: 'tinh thần đồng đội', translation: 'team synergy', typeFunction: 'Danh từ · Keyword' },
      { text: 'sau cùng', translation: 'eventually', typeFunction: 'Từ nối · Logic word' },
      { text: 'sức mạnh tổng hợp', translation: 'multiplier effect', typeFunction: 'Ẩn dụ · Fancy word' },
      { text: 'bứt phá', translation: 'excel', typeFunction: 'Động từ · Ending' }
    ]
  },
  {
    hints: [
      { text: 'Tôi nhận thấy', translation: 'I noticed', typeFunction: 'Cụm mào đầu · Intro' },
      { text: 'tự động hóa báo cáo', translation: 'report automation', typeFunction: 'Danh từ · Keyword' },
      { text: 'ngoài ra', translation: 'besides', typeFunction: 'Từ nối · Logic word' },
      { text: 'cánh tay phải', translation: 'right hand', typeFunction: 'Ẩn dụ · Fancy word' },
      { text: 'tiết kiệm', translation: 'time-saving', typeFunction: 'Tính từ · Ending' }
    ]
  },
  {
    hints: [
      { text: 'Không nghi ngờ gì', translation: 'Undoubtedly', typeFunction: 'Cụm mào đầu · Intro' },
      { text: 'kinh nghiệm thực chiến', translation: 'hands-on experience', typeFunction: 'Danh từ · Keyword' },
      { text: 'cho nên', translation: 'so that', typeFunction: 'Từ nối · Logic word' },
      { text: 'nền móng vững', translation: 'bedrock', typeFunction: 'Ẩn dụ · Fancy word' },
      { text: 'tự tin', translation: 'confident', typeFunction: 'Tính từ · Ending' }
    ]
  },
  {
    hints: [
      { text: 'Đặt trường hợp', translation: 'Suppose that', typeFunction: 'Cụm mào đầu · Intro' },
      { text: 'thị trường biến động', translation: 'market volatility', typeFunction: 'Danh từ · Keyword' },
      { text: 'nếu', translation: 'if', typeFunction: 'Từ nối · Logic word' },
      { text: 'tay chèo lái', translation: 'steady helm', typeFunction: 'Ẩn dụ · Fancy word' },
      { text: 'an toàn', translation: 'secure', typeFunction: 'Tính từ · Ending' }
    ]
  },
  {
    hints: [
      { text: 'Cuối cùng là', translation: 'Last but not least', typeFunction: 'Cụm mào đầu · Intro' },
      { text: 'khát vọng phát triển', translation: 'growth mindset', typeFunction: 'Danh từ · Keyword' },
      { text: 'bởi thế', translation: 'for that reason', typeFunction: 'Từ nối · Logic word' },
      { text: 'ngọn lửa đam mê', translation: 'inner drive', typeFunction: 'Ẩn dụ · Fancy word' },
      { text: 'bền bỉ', translation: 'relentless', typeFunction: 'Tính từ · Ending' }
    ]
  }
];

// Helper to construct ImprovPackage
function buildPackage(
  id: string,
  title: string,
  description: string,
  sourceCourseLevel: string,
  sourceLessonIds: string[],
  s1_items: ItemDef[],
  s2_items: ItemDef[],
  s3_items: ItemDef[],
  s4_items: ItemDef[]
): ImprovPackage {
  const sessionsConfig = [
    {
      sessionNumber: 1,
      title: 'Session 1 • 2 Hints (Rapid Reaction & Core Phrasing)',
      hcTotal: 2,
      hintTypes: ['Keyword', 'Ending'],
      itemsData: s1_items
    },
    {
      sessionNumber: 2,
      title: 'Session 2 • 3 Hints (Logic Transitions & Phrasing)',
      hcTotal: 3,
      hintTypes: ['Keyword', 'Logic word', 'Ending'],
      itemsData: s2_items
    },
    {
      sessionNumber: 3,
      title: 'Session 3 • 4 Hints (Fancy Metaphors & Idiomatic Reflex)',
      hcTotal: 4,
      hintTypes: ['Keyword', 'Logic word', 'Fancy word', 'Ending'],
      itemsData: s3_items
    },
    {
      sessionNumber: 4,
      title: 'Session 4 • 5 Hints (Full Spoken Reflex Flow)',
      hcTotal: 5,
      hintTypes: ['Intro / Setup', 'Keyword', 'Logic word', 'Fancy word', 'Ending'],
      itemsData: s4_items
    }
  ];

  const prefix = id.includes('01') ? 'set01' : 'set02';

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
    totalItems: 60,
    sessionsCount: 4,
    sessions,
    createdAt: '2026-09-03T00:00:00.000Z',
    updatedAt: '2026-09-03T00:00:00.000Z',
    sourceCourseLevel,
    sourceLessonIds
  };
}

export const IMPROV_SET_01: ImprovPackage = buildPackage(
  'improv_set_01_wandering_souls',
  'Set 01 • Wandering Souls (Airport & Travel Reflex)',
  '60 progressive deduction items for travel, airport mishaps, and casual spoken reactions based on Level B Day 2.',
  'LEVEL_B_ERES',
  ['level_b_eres_day_2'],
  s1_items_set1,
  s2_items_set1,
  s3_items_set1,
  s4_items_set1
);

export const IMPROV_SET_02: ImprovPackage = buildPackage(
  'improv_set_02_tell_me_about_yourself',
  'Set 02 • Tell Me About Yourself (Self Pitch & Work Experience)',
  '60 progressive deduction items for self-introductions, professional skills, and interview reflexes based on Level B Day 3.',
  'LEVEL_B_ERES',
  ['level_b_eres_day_3'],
  s1_items_set2,
  s2_items_set2,
  s3_items_set2,
  s4_items_set2
);
