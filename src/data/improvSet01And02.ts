import { ImprovPackage } from '../types/improv';

// Helper interface
interface HintDef {
  text: string;
  translation: string;
  typeFunction: string;
}

interface ItemDef {
  hints: HintDef[];
}

// ============================================================================
// SET 01: Wandering Souls (Airport & Travel Reflex)
// Based on Level B ERES Day 2 (Airport, Travel, Customs, Transit, Exploration)
// ============================================================================

// Session 1: 15 items, hcTotal = 2, hintTypes: ['Keyword', 'Ending']
const s1_items_set1: ItemDef[] = [
  {
    hints: [
      { text: 'boarding pass', translation: 'thẻ lên máy bay', typeFunction: 'Danh từ · Keyword' },
      { text: 'lost', translation: 'làm mất', typeFunction: 'Động từ · Ending' }
    ]
  },
  {
    hints: [
      { text: 'loose change', translation: 'tiền lẻ', typeFunction: 'Danh từ · Keyword' },
      { text: 'front pocket', translation: 'túi trước', typeFunction: 'Danh từ · Ending' }
    ]
  },
  {
    hints: [
      { text: 'luggage cart', translation: 'xe đẩy hành lý', typeFunction: 'Danh từ · Keyword' },
      { text: 'heavy', translation: 'nặng', typeFunction: 'Tính từ · Ending' }
    ]
  },
  {
    hints: [
      { text: 'customs officer', translation: 'nhân viên hải quan', typeFunction: 'Danh từ · Keyword' },
      { text: 'check', translation: 'kiểm tra', typeFunction: 'Động từ · Ending' }
    ]
  },
  {
    hints: [
      { text: 'sleeping bag', translation: 'túi ngủ', typeFunction: 'Danh từ · Keyword' },
      { text: 'warm', translation: 'ấm áp', typeFunction: 'Tính từ · Ending' }
    ]
  },
  {
    hints: [
      { text: 'hotel', translation: 'khách sạn', typeFunction: 'Danh từ · Keyword' },
      { text: 'book in advance', translation: 'đặt trước', typeFunction: 'Động từ · Ending' }
    ]
  },
  {
    hints: [
      { text: 'flight', translation: 'chuyến bay', typeFunction: 'Danh từ · Keyword' },
      { text: 'delayed', translation: 'hoãn', typeFunction: 'Tính từ · Ending' }
    ]
  },
  {
    hints: [
      { text: 'passport', translation: 'hộ chiếu', typeFunction: 'Danh từ · Keyword' },
      { text: 'forget', translation: 'quên', typeFunction: 'Động từ · Ending' }
    ]
  },
  {
    hints: [
      { text: 'suitcase', translation: 'vali', typeFunction: 'Danh từ · Keyword' },
      { text: 'lock', translation: 'khóa', typeFunction: 'Động từ · Ending' }
    ]
  },
  {
    hints: [
      { text: 'flip-flops', translation: 'dép lào', typeFunction: 'Danh từ · Keyword' },
      { text: 'beach trip', translation: 'đi biển', typeFunction: 'Danh từ · Ending' }
    ]
  },
  {
    hints: [
      { text: 'boarding gate', translation: 'cửa khởi hành', typeFunction: 'Danh từ · Keyword' },
      { text: 'find', translation: 'tìm', typeFunction: 'Động từ · Ending' }
    ]
  },
  {
    hints: [
      { text: 'snacks', translation: 'đồ ăn nhẹ', typeFunction: 'Danh từ · Keyword' },
      { text: 'bring along', translation: 'mang theo', typeFunction: 'Động từ · Ending' }
    ]
  },
  {
    hints: [
      { text: 'layover time', translation: 'thời gian quá cảnh', typeFunction: 'Danh từ · Keyword' },
      { text: 'long', translation: 'dài', typeFunction: 'Tính từ · Ending' }
    ]
  },
  {
    hints: [
      { text: 'taxi driver', translation: 'tài xế taxi', typeFunction: 'Danh từ · Keyword' },
      { text: 'friendly', translation: 'thân thiện', typeFunction: 'Tính từ · Ending' }
    ]
  },
  {
    hints: [
      { text: 'rice cooker', translation: 'nồi cơm điện', typeFunction: 'Danh từ · Keyword' },
      { text: 'cook rice', translation: 'nấu cơm', typeFunction: 'Động từ · Ending' }
    ]
  }
];

// Session 2: 15 items, hcTotal = 3, hintTypes: ['Keyword', 'Logic word', 'Ending']
const s2_items_set1: ItemDef[] = [
  {
    hints: [
      { text: 'heavy luggage', translation: 'hành lý nặng', typeFunction: 'Danh từ · Keyword' },
      { text: 'therefore', translation: 'do đó', typeFunction: 'Từ nối · Logic word' },
      { text: 'exhausted', translation: 'mệt lử', typeFunction: 'Tính từ · Ending' }
    ]
  },
  {
    hints: [
      { text: 'passport renewal', translation: 'gia hạn hộ chiếu', typeFunction: 'Danh từ · Keyword' },
      { text: 'before that', translation: 'trước đó', typeFunction: 'Từ nối · Logic word' },
      { text: 'urgent', translation: 'khẩn cấp', typeFunction: 'Tính từ · Ending' }
    ]
  },
  {
    hints: [
      { text: 'flight delay', translation: 'chuyến bay hoãn', typeFunction: 'Danh từ · Keyword' },
      { text: 'meanwhile', translation: 'đồng thời', typeFunction: 'Từ nối · Logic word' },
      { text: 'rest', translation: 'nghỉ ngơi', typeFunction: 'Động từ · Ending' }
    ]
  },
  {
    hints: [
      { text: 'taxi fare', translation: 'tiền taxi', typeFunction: 'Danh từ · Keyword' },
      { text: 'in addition', translation: 'hơn nữa', typeFunction: 'Từ nối · Logic word' },
      { text: 'expensive', translation: 'đắt đỏ', typeFunction: 'Tính từ · Ending' }
    ]
  },
  {
    hints: [
      { text: 'boarding gate', translation: 'cửa ra máy bay', typeFunction: 'Danh từ · Keyword' },
      { text: 'next', translation: 'tiếp theo', typeFunction: 'Từ nối · Logic word' },
      { text: 'sprint', translation: 'chạy nước rút', typeFunction: 'Động từ · Ending' }
    ]
  },
  {
    hints: [
      { text: 'window seat', translation: 'ghế cạnh cửa sổ', typeFunction: 'Danh từ · Keyword' },
      { text: 'otherwise', translation: 'nếu không', typeFunction: 'Từ nối · Logic word' },
      { text: 'cramped', translation: 'chật chội', typeFunction: 'Tính từ · Ending' }
    ]
  },
  {
    hints: [
      { text: 'travel insurance', translation: 'bảo hiểm du lịch', typeFunction: 'Danh từ · Keyword' },
      { text: 'if', translation: 'nếu', typeFunction: 'Từ nối · Logic word' },
      { text: 'secure', translation: 'an tâm', typeFunction: 'Tính từ · Ending' }
    ]
  },
  {
    hints: [
      { text: 'broken wheel', translation: 'bánh xe bị gãy', typeFunction: 'Danh từ · Keyword' },
      { text: 'nevertheless', translation: 'dù vậy', typeFunction: 'Từ nối · Logic word' },
      { text: 'manageable', translation: 'xoay xở được', typeFunction: 'Tính từ · Ending' }
    ]
  },
  {
    hints: [
      { text: 'foreign currency', translation: 'ngoại tệ', typeFunction: 'Danh từ · Keyword' },
      { text: 'in other words', translation: 'nói cách khác', typeFunction: 'Từ nối · Logic word' },
      { text: 'exchange', translation: 'đổi tiền', typeFunction: 'Động từ · Ending' }
    ]
  },
  {
    hints: [
      { text: 'hotel room', translation: 'phòng khách sạn', typeFunction: 'Danh từ · Keyword' },
      { text: 'eventually', translation: 'sau cùng', typeFunction: 'Từ nối · Logic word' },
      { text: 'confirmed', translation: 'xác nhận', typeFunction: 'Tính từ · Ending' }
    ]
  },
  {
    hints: [
      { text: 'street market', translation: 'chợ đường phố', typeFunction: 'Danh từ · Keyword' },
      { text: 'however', translation: 'tuy nhiên', typeFunction: 'Từ nối · Logic word' },
      { text: 'crowded', translation: 'đông đúc', typeFunction: 'Tính từ · Ending' }
    ]
  },
  {
    hints: [
      { text: 'transit flight', translation: 'chuyến bay quá cảnh', typeFunction: 'Danh từ · Keyword' },
      { text: 'as long as', translation: 'miễn là', typeFunction: 'Từ nối · Logic word' },
      { text: 'on time', translation: 'đúng giờ', typeFunction: 'Tính từ · Ending' }
    ]
  },
  {
    hints: [
      { text: 'power bank', translation: 'sạc dự phòng', typeFunction: 'Danh từ · Keyword' },
      { text: 'for example', translation: 'ví dụ', typeFunction: 'Từ nối · Logic word' },
      { text: 'essential', translation: 'thiết yếu', typeFunction: 'Tính từ · Ending' }
    ]
  },
  {
    hints: [
      { text: 'sudden rain', translation: 'mưa bất chợt', typeFunction: 'Danh từ · Keyword' },
      { text: 'then', translation: 'sau đó', typeFunction: 'Từ nối · Logic word' },
      { text: 'take shelter', translation: 'trú mưa', typeFunction: 'Động từ · Ending' }
    ]
  },
  {
    hints: [
      { text: 'tour guide', translation: 'hướng dẫn viên', typeFunction: 'Danh từ · Keyword' },
      { text: 'besides', translation: 'ngoài ra', typeFunction: 'Từ nối · Logic word' },
      { text: 'knowledgeable', translation: 'am hiểu', typeFunction: 'Tính từ · Ending' }
    ]
  }
];

// Session 3: 15 items, hcTotal = 4, hintTypes: ['Keyword', 'Logic word', 'Fancy word', 'Ending']
const s3_items_set1: ItemDef[] = [
  {
    hints: [
      { text: 'customs check', translation: 'kiểm tra hải quan', typeFunction: 'Danh từ · Keyword' },
      { text: 'while', translation: 'trong khi', typeFunction: 'Từ nối · Logic word' },
      { text: 'red flag', translation: 'dấu hiệu khả nghi', typeFunction: 'Ẩn dụ · Fancy word' },
      { text: 'strict', translation: 'nghiêm ngặt', typeFunction: 'Tính từ · Ending' }
    ]
  },
  {
    hints: [
      { text: 'airport terminal', translation: 'nhà ga sân bay', typeFunction: 'Danh từ · Keyword' },
      { text: 'however', translation: 'tuy nhiên', typeFunction: 'Từ nối · Logic word' },
      { text: 'lifeline', translation: 'phao cứu trợ', typeFunction: 'Ẩn dụ · Fancy word' },
      { text: 'helpful', translation: 'hữu ích', typeFunction: 'Tính từ · Ending' }
    ]
  },
  {
    hints: [
      { text: 'Which flight', translation: 'Chuyến bay nào', typeFunction: 'Cụm nghi vấn · WH word' },
      { text: 'otherwise', translation: 'nếu không', typeFunction: 'Từ nối · Logic word' },
      { text: 'last call', translation: 'loa gọi chót', typeFunction: 'Cụm gợi hình · Fancy word' },
      { text: 'missed', translation: 'bị lỡ', typeFunction: 'Tính từ · Ending' }
    ]
  },
  {
    hints: [
      { text: 'lost baggage', translation: 'thất lạc hành lý', typeFunction: 'Danh từ · Keyword' },
      { text: 'therefore', translation: 'do đó', typeFunction: 'Từ nối · Logic word' },
      { text: 'headache', translation: 'cơn đau đầu', typeFunction: 'Ẩn dụ · Fancy word' },
      { text: 'stressful', translation: 'căng thẳng', typeFunction: 'Tính từ · Ending' }
    ]
  },
  {
    hints: [
      { text: 'flight cancellation', translation: 'chuyến bay bị hủy', typeFunction: 'Danh từ · Keyword' },
      { text: 'in contrast', translation: 'ngược lại', typeFunction: 'Từ nối · Logic word' },
      { text: 'dead stop', translation: 'dừng hẳn', typeFunction: 'Ẩn dụ · Fancy word' },
      { text: 'refunded', translation: 'được bồi hoàn', typeFunction: 'Tính từ · Ending' }
    ]
  },
  {
    hints: [
      { text: 'Why delay', translation: 'Tại sao lại hoãn', typeFunction: 'Cụm nghi vấn · WH word' },
      { text: 'finally', translation: 'sau cùng', typeFunction: 'Từ nối · Logic word' },
      { text: 'safe harbor', translation: 'bến đỗ an toàn', typeFunction: 'Ẩn dụ · Fancy word' },
      { text: 'relieved', translation: 'thở phào', typeFunction: 'Tính từ · Ending' }
    ]
  },
  {
    hints: [
      { text: 'overseas travel', translation: 'du lịch nước ngoài', typeFunction: 'Danh từ · Keyword' },
      { text: 'as long as', translation: 'miễn là', typeFunction: 'Từ nối · Logic word' },
      { text: 'Better safe than sorry', translation: 'cẩn tắc vô áy náy', typeFunction: 'Tục ngữ · Proverb' },
      { text: 'prepared', translation: 'chuẩn bị kỹ', typeFunction: 'Tính từ · Ending' }
    ]
  },
  {
    hints: [
      { text: 'midnight layover', translation: 'quá cảnh nửa đêm', typeFunction: 'Danh từ · Keyword' },
      { text: 'meanwhile', translation: 'đồng thời', typeFunction: 'Từ nối · Logic word' },
      { text: 'empty chairs', translation: 'ghế trống trơn', typeFunction: 'Cụm gợi hình · Fancy word' },
      { text: 'freezing', translation: 'lạnh cóng', typeFunction: 'Tính từ · Ending' }
    ]
  },
  {
    hints: [
      { text: 'How long', translation: 'Bao lâu', typeFunction: 'Cụm nghi vấn · WH word' },
      { text: 'if', translation: 'nếu', typeFunction: 'Từ nối · Logic word' },
      { text: 'green light', translation: 'bật đèn xanh', typeFunction: 'Ẩn dụ · Fancy word' },
      { text: 'smooth', translation: 'trơn tru', typeFunction: 'Tính từ · Ending' }
    ]
  },
  {
    hints: [
      { text: 'budget airline', translation: 'hãng bay giá rẻ', typeFunction: 'Danh từ · Keyword' },
      { text: 'nevertheless', translation: 'dù vậy', typeFunction: 'Từ nối · Logic word' },
      { text: 'hidden cost', translation: 'chi phí ngầm', typeFunction: 'Ẩn dụ · Fancy word' },
      { text: 'pricey', translation: 'đắt đỏ', typeFunction: 'Tính từ · Ending' }
    ]
  },
  {
    hints: [
      { text: 'commuter train', translation: 'tàu trung chuyển', typeFunction: 'Danh từ · Keyword' },
      { text: 'before that', translation: 'trước đó', typeFunction: 'Từ nối · Logic word' },
      { text: 'rush hour', translation: 'giờ cao điểm', typeFunction: 'Cụm gợi hình · Fancy word' },
      { text: 'packed', translation: 'chật ních', typeFunction: 'Tính từ · Ending' }
    ]
  },
  {
    hints: [
      { text: 'travel SIM', translation: 'SIM du lịch', typeFunction: 'Danh từ · Keyword' },
      { text: 'in addition', translation: 'hơn nữa', typeFunction: 'Từ nối · Logic word' },
      { text: 'game changer', translation: 'bước đột phá', typeFunction: 'Ẩn dụ · Fancy word' },
      { text: 'connected', translation: 'thông suốt', typeFunction: 'Tính từ · Ending' }
    ]
  },
  {
    hints: [
      { text: 'Where to go', translation: 'Đi đâu bây giờ', typeFunction: 'Cụm nghi vấn · WH word' },
      { text: 'next', translation: 'tiếp theo', typeFunction: 'Từ nối · Logic word' },
      { text: 'hidden gem', translation: 'viên ngọc ẩn', typeFunction: 'Ẩn dụ · Fancy word' },
      { text: 'breathtaking', translation: 'tuyệt đẹp', typeFunction: 'Tính từ · Ending' }
    ]
  },
  {
    hints: [
      { text: 'emergency exit', translation: 'cửa thoát hiểm', typeFunction: 'Danh từ · Keyword' },
      { text: 'for that reason', translation: 'chính vì thế', typeFunction: 'Từ nối · Logic word' },
      { text: 'watchful eye', translation: 'ánh mắt quan sát', typeFunction: 'Ẩn dụ · Fancy word' },
      { text: 'alert', translation: 'cảnh giác', typeFunction: 'Tính từ · Ending' }
    ]
  },
  {
    hints: [
      { text: 'night market', translation: 'khu chợ đêm', typeFunction: 'Danh từ · Keyword' },
      { text: 'then', translation: 'sau đó', typeFunction: 'Từ nối · Logic word' },
      { text: 'food heaven', translation: 'thiên đường món ngon', typeFunction: 'Ẩn dụ · Fancy word' },
      { text: 'bustling', translation: 'nhộn nhịp', typeFunction: 'Tính từ · Ending' }
    ]
  }
];

// Session 4: 15 items, hcTotal = 5, hintTypes: ['Intro', 'Keyword', 'Logic word', 'Fancy word', 'Ending']
const s4_items_set1: ItemDef[] = [
  {
    hints: [
      { text: 'Just so you know', translation: 'Nói trước cho bạn hay', typeFunction: 'Cụm mào đầu · Intro' },
      { text: 'boarding gate', translation: 'cửa lên tàu bay', typeFunction: 'Danh từ · Keyword' },
      { text: 'meanwhile', translation: 'đồng thời', typeFunction: 'Từ nối · Logic word' },
      { text: 'final call', translation: 'hiệu lệnh cuối', typeFunction: 'Cụm gợi hình · Fancy word' },
      { text: 'hurry', translation: 'khẩn trương', typeFunction: 'Động từ · Ending' }
    ]
  },
  {
    hints: [
      { text: 'To tell you the truth', translation: 'Thật lòng mà nói', typeFunction: 'Cụm mào đầu · Intro' },
      { text: 'rough turbulence', translation: 'nhiễu động dữ dội', typeFunction: 'Danh từ · Keyword' },
      { text: 'while', translation: 'trong khi', typeFunction: 'Từ nối · Logic word' },
      { text: 'roller coaster', translation: 'tàu lượn rung giật', typeFunction: 'Ẩn dụ · Fancy word' },
      { text: 'scary', translation: 'đáng sợ', typeFunction: 'Tính từ · Ending' }
    ]
  },
  {
    hints: [
      { text: 'It seems that', translation: 'Có vẻ như là', typeFunction: 'Cụm mào đầu · Intro' },
      { text: 'customs officer', translation: 'nhân viên hải quan', typeFunction: 'Danh từ · Keyword' },
      { text: 'however', translation: 'tuy nhiên', typeFunction: 'Từ nối · Logic word' },
      { text: 'eagle eye', translation: 'mắt đại bàng', typeFunction: 'Ẩn dụ · Fancy word' },
      { text: 'thorough', translation: 'kỹ lưỡng', typeFunction: 'Tính từ · Ending' }
    ]
  },
  {
    hints: [
      { text: 'As far as I know', translation: 'Theo chỗ tôi biết', typeFunction: 'Cụm mào đầu · Intro' },
      { text: 'entry visa', translation: 'thị thực nhập cảnh', typeFunction: 'Danh từ · Keyword' },
      { text: 'otherwise', translation: 'nếu không', typeFunction: 'Từ nối · Logic word' },
      { text: 'red tape', translation: 'thủ tục quan liêu', typeFunction: 'Ẩn dụ · Fancy word' },
      { text: 'delayed', translation: 'bị ách lại', typeFunction: 'Tính từ · Ending' }
    ]
  },
  {
    hints: [
      { text: 'Believe it or not', translation: 'Tin hay không tùy bạn', typeFunction: 'Cụm mào đầu · Intro' },
      { text: 'baggage carousel', translation: 'băng chuyền hành lý', typeFunction: 'Danh từ · Keyword' },
      { text: 'eventually', translation: 'sau cùng', typeFunction: 'Từ nối · Logic word' },
      { text: 'dead end', translation: 'chỗ kẹt nghẽn', typeFunction: 'Ẩn dụ · Fancy word' },
      { text: 'jammed', translation: 'bị kẹt cứng', typeFunction: 'Tính từ · Ending' }
    ]
  },
  {
    hints: [
      { text: 'From my perspective', translation: 'Theo góc nhìn của tôi', typeFunction: 'Cụm mào đầu · Intro' },
      { text: 'sleeping pod', translation: 'buồng ngủ sân bay', typeFunction: 'Danh từ · Keyword' },
      { text: 'in addition', translation: 'hơn nữa', typeFunction: 'Từ nối · Logic word' },
      { text: 'godsend', translation: 'món quà cứu cánh', typeFunction: 'Ẩn dụ · Fancy word' },
      { text: 'comfortable', translation: 'dễ chịu', typeFunction: 'Tính từ · Ending' }
    ]
  },
  {
    hints: [
      { text: 'In my opinion', translation: 'Theo quan điểm của tôi', typeFunction: 'Cụm mào đầu · Intro' },
      { text: 'street food', translation: 'món ăn đường phố', typeFunction: 'Danh từ · Keyword' },
      { text: 'if', translation: 'nếu', typeFunction: 'Từ nối · Logic word' },
      { text: 'gold mine', translation: 'mỏ vàng ẩm thực', typeFunction: 'Ẩn dụ · Fancy word' },
      { text: 'authentic', translation: 'chuẩn vị', typeFunction: 'Tính từ · Ending' }
    ]
  },
  {
    hints: [
      { text: "Don't get me wrong", translation: 'Đừng hiểu sai ý tôi', typeFunction: 'Cụm mào đầu · Intro' },
      { text: 'souvenir shop', translation: 'cửa hàng lưu niệm', typeFunction: 'Danh từ · Keyword' },
      { text: 'nevertheless', translation: 'dù vậy', typeFunction: 'Từ nối · Logic word' },
      { text: 'tourist trap', translation: 'cái bẫy du khách', typeFunction: 'Ẩn dụ · Fancy word' },
      { text: 'pricey', translation: 'đắt đỏ', typeFunction: 'Tính từ · Ending' }
    ]
  },
  {
    hints: [
      { text: 'As a matter of fact', translation: 'Thực tế là', typeFunction: 'Cụm mào đầu · Intro' },
      { text: 'flight attendant', translation: 'tiếp viên hàng không', typeFunction: 'Danh từ · Keyword' },
      { text: 'therefore', translation: 'do đó', typeFunction: 'Từ nối · Logic word' },
      { text: 'lifesaver', translation: 'vị cứu tinh', typeFunction: 'Ẩn dụ · Fancy word' },
      { text: 'supportive', translation: 'tận tình', typeFunction: 'Tính từ · Ending' }
    ]
  },
  {
    hints: [
      { text: 'First of all', translation: 'Trước hết là', typeFunction: 'Cụm mào đầu · Intro' },
      { text: 'medical insurance', translation: 'bảo hiểm y tế', typeFunction: 'Danh từ · Keyword' },
      { text: 'before that', translation: 'trước đó', typeFunction: 'Từ nối · Logic word' },
      { text: 'safety net', translation: 'lưới bảo hiểm an toàn', typeFunction: 'Ẩn dụ · Fancy word' },
      { text: 'vital', translation: 'sống còn', typeFunction: 'Tính từ · Ending' }
    ]
  },
  {
    hints: [
      { text: 'By the way', translation: 'Nhân tiện đây', typeFunction: 'Cụm mào đầu · Intro' },
      { text: 'hotel reception', translation: 'tiếp tân khách sạn', typeFunction: 'Danh từ · Keyword' },
      { text: 'next', translation: 'tiếp theo', typeFunction: 'Từ nối · Logic word' },
      { text: 'warm welcome', translation: 'chào đón ấm áp', typeFunction: 'Cụm gợi hình · Fancy word' },
      { text: 'hospitable', translation: 'hiếu khách', typeFunction: 'Tính từ · Ending' }
    ]
  },
  {
    hints: [
      { text: 'Honestly speaking', translation: 'Thành thật mà nói', typeFunction: 'Cụm mào đầu · Intro' },
      { text: 'overweight luggage', translation: 'hành lý quá cước', typeFunction: 'Danh từ · Keyword' },
      { text: 'in other words', translation: 'nói cách khác', typeFunction: 'Từ nối · Logic word' },
      { text: 'money pit', translation: 'hố ngốn tiền', typeFunction: 'Ẩn dụ · Fancy word' },
      { text: 'costly', translation: 'hao tốn', typeFunction: 'Tính từ · Ending' }
    ]
  },
  {
    hints: [
      { text: 'Keep in mind', translation: 'Hãy luôn ghi nhớ', typeFunction: 'Cụm mào đầu · Intro' },
      { text: 'meter taxi', translation: 'taxi có đồng hồ', typeFunction: 'Danh từ · Keyword' },
      { text: 'as long as', translation: 'miễn là', typeFunction: 'Từ nối · Logic word' },
      { text: 'fair play', translation: 'chơi đẹp minh bạch', typeFunction: 'Ẩn dụ · Fancy word' },
      { text: 'honest', translation: 'trung thực', typeFunction: 'Tính từ · Ending' }
    ]
  },
  {
    hints: [
      { text: 'You can bet that', translation: 'Bạn cứ yên tâm rằng', typeFunction: 'Cụm mào đầu · Intro' },
      { text: 'ocean sunrise', translation: 'bình minh biển', typeFunction: 'Danh từ · Keyword' },
      { text: 'then', translation: 'sau đó', typeFunction: 'Từ nối · Logic word' },
      { text: 'postcard view', translation: 'khung cảnh như tranh', typeFunction: 'Cụm gợi hình · Fancy word' },
      { text: 'stunning', translation: 'đẹp ngỡ ngàng', typeFunction: 'Tính từ · Ending' }
    ]
  },
  {
    hints: [
      { text: 'All things considered', translation: 'Cân nhắc mọi mặt', typeFunction: 'Cụm mào đầu · Intro' },
      { text: 'solo trip', translation: 'chuyến du hành độc hành', typeFunction: 'Danh từ · Keyword' },
      { text: 'finally', translation: 'cuối cùng', typeFunction: 'Từ nối · Logic word' },
      { text: 'eye opener', translation: 'trải nghiệm mở rộng tầm mắt', typeFunction: 'Ẩn dụ · Fancy word' },
      { text: 'unforgettable', translation: 'khó quên', typeFunction: 'Tính từ · Ending' }
    ]
  }
];

// ============================================================================
// SET 02: Tell Me About Yourself (Professional & Accounting Reflex)
// Based on Level B ERES Day 3 (Interview, Accounting, Risk, Projects, Skills)
// ============================================================================

// Session 1: 15 items, hcTotal = 2, hintTypes: ['Keyword', 'Ending']
const s1_items_set2: ItemDef[] = [
  {
    hints: [
      { text: 'experience', translation: 'kinh nghiệm', typeFunction: 'Danh từ · Keyword' },
      { text: 'gain', translation: 'tích lũy', typeFunction: 'Động từ · Ending' }
    ]
  },
  {
    hints: [
      { text: 'financial report', translation: 'báo cáo tài chính', typeFunction: 'Danh từ · Keyword' },
      { text: 'finish', translation: 'hoàn thành', typeFunction: 'Động từ · Ending' }
    ]
  },
  {
    hints: [
      { text: 'proactive', translation: 'năng động', typeFunction: 'Tính từ · Keyword' },
      { text: 'work', translation: 'làm việc', typeFunction: 'Động từ · Ending' }
    ]
  },
  {
    hints: [
      { text: 'skills', translation: 'kỹ năng', typeFunction: 'Danh từ · Keyword' },
      { text: 'improve', translation: 'cải thiện', typeFunction: 'Động từ · Ending' }
    ]
  },
  {
    hints: [
      { text: 'risk management', translation: 'quản lý rủi ro', typeFunction: 'Danh từ · Keyword' },
      { text: 'careful', translation: 'cẩn thận', typeFunction: 'Tính từ · Ending' }
    ]
  },
  {
    hints: [
      { text: 'colleagues', translation: 'đồng nghiệp', typeFunction: 'Danh từ · Keyword' },
      { text: 'support', translation: 'hỗ trợ', typeFunction: 'Động từ · Ending' }
    ]
  },
  {
    hints: [
      { text: 'job interview', translation: 'phỏng vấn', typeFunction: 'Danh từ · Keyword' },
      { text: 'confident', translation: 'tự tin', typeFunction: 'Tính từ · Ending' }
    ]
  },
  {
    hints: [
      { text: 'transactions', translation: 'giao dịch', typeFunction: 'Danh từ · Keyword' },
      { text: 'reconcile', translation: 'đối soát', typeFunction: 'Động từ · Ending' }
    ]
  },
  {
    hints: [
      { text: 'creative', translation: 'sáng tạo', typeFunction: 'Tính từ · Keyword' },
      { text: 'solutions', translation: 'giải pháp', typeFunction: 'Danh từ · Ending' }
    ]
  },
  {
    hints: [
      { text: 'balance sheet', translation: 'bảng cân đối kế toán', typeFunction: 'Danh từ · Keyword' },
      { text: 'accurate', translation: 'chính xác', typeFunction: 'Tính từ · Ending' }
    ]
  },
  {
    hints: [
      { text: 'deadline', translation: 'hạn chót', typeFunction: 'Danh từ · Keyword' },
      { text: 'meet', translation: 'kịp thời hạn', typeFunction: 'Động từ · Ending' }
    ]
  },
  {
    hints: [
      { text: 'accounting system', translation: 'hệ thống kế toán', typeFunction: 'Danh từ · Keyword' },
      { text: 'upgrade', translation: 'nâng cấp', typeFunction: 'Động từ · Ending' }
    ]
  },
  {
    hints: [
      { text: 'leadership', translation: 'năng lực lãnh đạo', typeFunction: 'Danh từ · Keyword' },
      { text: 'demonstrate', translation: 'thể hiện', typeFunction: 'Động từ · Ending' }
    ]
  },
  {
    hints: [
      { text: 'audit team', translation: 'đoàn kiểm toán', typeFunction: 'Danh từ · Keyword' },
      { text: 'coordinate', translation: 'phối hợp', typeFunction: 'Động từ · Ending' }
    ]
  },
  {
    hints: [
      { text: 'career path', translation: 'định hướng nghề nghiệp', typeFunction: 'Danh từ · Keyword' },
      { text: 'clear', translation: 'rõ ràng', typeFunction: 'Tính từ · Ending' }
    ]
  }
];

// Session 2: 15 items, hcTotal = 3, hintTypes: ['Keyword', 'Logic word', 'Ending']
const s2_items_set2: ItemDef[] = [
  {
    hints: [
      { text: 'tax audit', translation: 'kiểm toán thuế', typeFunction: 'Danh từ · Keyword' },
      { text: 'before that', translation: 'trước đó', typeFunction: 'Từ nối · Logic word' },
      { text: 'prepare', translation: 'chuẩn bị kỹ', typeFunction: 'Động từ · Ending' }
    ]
  },
  {
    hints: [
      { text: 'financial data', translation: 'dữ liệu tài chính', typeFunction: 'Danh từ · Keyword' },
      { text: 'therefore', translation: 'do đó', typeFunction: 'Từ nối · Logic word' },
      { text: 'reliable', translation: 'đáng tin cậy', typeFunction: 'Tính từ · Ending' }
    ]
  },
  {
    hints: [
      { text: 'team performance', translation: 'hiệu suất nhóm', typeFunction: 'Danh từ · Keyword' },
      { text: 'in addition', translation: 'hơn nữa', typeFunction: 'Từ nối · Logic word' },
      { text: 'exceed', translation: 'vượt chỉ tiêu', typeFunction: 'Động từ · Ending' }
    ]
  },
  {
    hints: [
      { text: 'cash flow', translation: 'dòng tiền', typeFunction: 'Danh từ · Keyword' },
      { text: 'meanwhile', translation: 'đồng thời', typeFunction: 'Từ nối · Logic word' },
      { text: 'healthy', translation: 'dồi dào lành mạnh', typeFunction: 'Tính từ · Ending' }
    ]
  },
  {
    hints: [
      { text: 'data discrepancy', translation: 'chênh lệch số liệu', typeFunction: 'Danh từ · Keyword' },
      { text: 'however', translation: 'tuy nhiên', typeFunction: 'Từ nối · Logic word' },
      { text: 'resolved', translation: 'được xử lý', typeFunction: 'Tính từ · Ending' }
    ]
  },
  {
    hints: [
      { text: 'job promotion', translation: 'thăng tiến công việc', typeFunction: 'Danh từ · Keyword' },
      { text: 'as long as', translation: 'miễn là', typeFunction: 'Từ nối · Logic word' },
      { text: 'dedicated', translation: 'tận tụy', typeFunction: 'Tính từ · Ending' }
    ]
  },
  {
    hints: [
      { text: 'annual budget', translation: 'ngân sách năm', typeFunction: 'Danh từ · Keyword' },
      { text: 'next', translation: 'tiếp theo', typeFunction: 'Từ nối · Logic word' },
      { text: 'approved', translation: 'được thông qua', typeFunction: 'Tính từ · Ending' }
    ]
  },
  {
    hints: [
      { text: 'internal control', translation: 'kiểm soát nội bộ', typeFunction: 'Danh từ · Keyword' },
      { text: 'otherwise', translation: 'nếu không', typeFunction: 'Từ nối · Logic word' },
      { text: 'risky', translation: 'rủi ro cao', typeFunction: 'Tính từ · Ending' }
    ]
  },
  {
    hints: [
      { text: 'professional growth', translation: 'phát triển chuyên môn', typeFunction: 'Danh từ · Keyword' },
      { text: 'if', translation: 'nếu', typeFunction: 'Từ nối · Logic word' },
      { text: 'persistent', translation: 'kiên trì', typeFunction: 'Tính từ · Ending' }
    ]
  },
  {
    hints: [
      { text: 'accounting books', translation: 'sổ sách kế toán', typeFunction: 'Danh từ · Keyword' },
      { text: 'eventually', translation: 'sau cùng', typeFunction: 'Từ nối · Logic word' },
      { text: 'transparent', translation: 'minh bạch', typeFunction: 'Tính từ · Ending' }
    ]
  },
  {
    hints: [
      { text: 'market analysis', translation: 'phân tích thị trường', typeFunction: 'Danh từ · Keyword' },
      { text: 'in other words', translation: 'nói cách khác', typeFunction: 'Từ nối · Logic word' },
      { text: 'strategic', translation: 'có tính chiến lược', typeFunction: 'Tính từ · Ending' }
    ]
  },
  {
    hints: [
      { text: 'heavy workload', translation: 'khối lượng công việc lớn', typeFunction: 'Danh từ · Keyword' },
      { text: 'nevertheless', translation: 'dù vậy', typeFunction: 'Từ nối · Logic word' },
      { text: 'manageable', translation: 'xoay xở ổn', typeFunction: 'Tính từ · Ending' }
    ]
  },
  {
    hints: [
      { text: 'software training', translation: 'đào tạo phần mềm', typeFunction: 'Danh từ · Keyword' },
      { text: 'for example', translation: 'ví dụ', typeFunction: 'Từ nối · Logic word' },
      { text: 'productive', translation: 'năng suất', typeFunction: 'Tính từ · Ending' }
    ]
  },
  {
    hints: [
      { text: 'client relationship', translation: 'quan hệ khách hàng', typeFunction: 'Danh từ · Keyword' },
      { text: 'then', translation: 'sau đó', typeFunction: 'Từ nối · Logic word' },
      { text: 'strengthen', translation: 'củng cố vững chắc', typeFunction: 'Động từ · Ending' }
    ]
  },
  {
    hints: [
      { text: 'project milestone', translation: 'mốc tiến độ dự án', typeFunction: 'Danh từ · Keyword' },
      { text: 'besides', translation: 'ngoài ra', typeFunction: 'Từ nối · Logic word' },
      { text: 'completed', translation: 'hoàn tất', typeFunction: 'Tính từ · Ending' }
    ]
  }
];

// Session 3: 15 items, hcTotal = 4, hintTypes: ['Keyword', 'Logic word', 'Fancy word', 'Ending']
const s3_items_set2: ItemDef[] = [
  {
    hints: [
      { text: 'risk assessment', translation: 'đánh giá rủi ro', typeFunction: 'Danh từ · Keyword' },
      { text: 'while', translation: 'trong khi', typeFunction: 'Từ nối · Logic word' },
      { text: 'red flag', translation: 'dấu hiệu cảnh báo', typeFunction: 'Ẩn dụ · Fancy word' },
      { text: 'investigate', translation: 'điều tra kỹ', typeFunction: 'Động từ · Ending' }
    ]
  },
  {
    hints: [
      { text: 'audit season', translation: 'mùa kiểm toán', typeFunction: 'Danh từ · Keyword' },
      { text: 'however', translation: 'tuy nhiên', typeFunction: 'Từ nối · Logic word' },
      { text: 'lifeline', translation: 'phao cứu cánh', typeFunction: 'Ẩn dụ · Fancy word' },
      { text: 'supportive', translation: 'tương trợ đắc lực', typeFunction: 'Tính từ · Ending' }
    ]
  },
  {
    hints: [
      { text: 'Why accounting', translation: 'Tại sao chọn kế toán', typeFunction: 'Cụm nghi vấn · WH word' },
      { text: 'finally', translation: 'sau cùng', typeFunction: 'Từ nối · Logic word' },
      { text: 'stepping stone', translation: 'bước đệm vững chắc', typeFunction: 'Ẩn dụ · Fancy word' },
      { text: 'rewarding', translation: 'xứng đáng', typeFunction: 'Tính từ · Ending' }
    ]
  },
  {
    hints: [
      { text: 'financial discrepancy', translation: 'bất thường tài chính', typeFunction: 'Danh từ · Keyword' },
      { text: 'therefore', translation: 'do đó', typeFunction: 'Từ nối · Logic word' },
      { text: 'wake-up call', translation: 'hồi chuông cảnh tỉnh', typeFunction: 'Ẩn dụ · Fancy word' },
      { text: 'corrected', translation: 'đã sửa chữa', typeFunction: 'Tính từ · Ending' }
    ]
  },
  {
    hints: [
      { text: 'balance sheet', translation: 'bảng cân đối kế toán', typeFunction: 'Danh từ · Keyword' },
      { text: 'in contrast', translation: 'ngược lại', typeFunction: 'Từ nối · Logic word' },
      { text: 'rock solid', translation: 'vững như bàn thạch', typeFunction: 'Ẩn dụ · Fancy word' },
      { text: 'accurate', translation: 'chuẩn xác', typeFunction: 'Tính từ · Ending' }
    ]
  },
  {
    hints: [
      { text: 'Which strength', translation: 'Điểm mạnh nào', typeFunction: 'Cụm nghi vấn · WH word' },
      { text: 'otherwise', translation: 'nếu không', typeFunction: 'Từ nối · Logic word' },
      { text: 'trump card', translation: 'con bài chiến lược', typeFunction: 'Ẩn dụ · Fancy word' },
      { text: 'outstanding', translation: 'vượt trội', typeFunction: 'Tính từ · Ending' }
    ]
  },
  {
    hints: [
      { text: 'budget deficit', translation: 'thâm hụt ngân sách', typeFunction: 'Danh từ · Keyword' },
      { text: 'nevertheless', translation: 'dù vậy', typeFunction: 'Từ nối · Logic word' },
      { text: 'game plan', translation: 'chiến lược bài bản', typeFunction: 'Ẩn dụ · Fancy word' },
      { text: 'solved', translation: 'được tháo gỡ', typeFunction: 'Tính từ · Ending' }
    ]
  },
  {
    hints: [
      { text: 'data integrity', translation: 'tính toàn vẹn dữ liệu', typeFunction: 'Danh từ · Keyword' },
      { text: 'as long as', translation: 'miễn là', typeFunction: 'Từ nối · Logic word' },
      { text: 'cornerstone', translation: 'hòn đá tảng', typeFunction: 'Ẩn dụ · Fancy word' },
      { text: 'intact', translation: 'nguyên vẹn', typeFunction: 'Tính từ · Ending' }
    ]
  },
  {
    hints: [
      { text: 'How much value', translation: 'Đem lại bao nhiêu giá trị', typeFunction: 'Cụm nghi vấn · WH word' },
      { text: 'if', translation: 'nếu', typeFunction: 'Từ nối · Logic word' },
      { text: 'win-win', translation: 'đôi bên cùng có lợi', typeFunction: 'Ẩn dụ · Fancy word' },
      { text: 'measurable', translation: 'đo lường được', typeFunction: 'Tính từ · Ending' }
    ]
  },
  {
    hints: [
      { text: 'executive pitch', translation: 'bài thuyết trình ban giám đốc', typeFunction: 'Danh từ · Keyword' },
      { text: 'before that', translation: 'trước đó', typeFunction: 'Từ nối · Logic word' },
      { text: 'dry run', translation: 'buổi tập dượt kỹ', typeFunction: 'Cụm gợi hình · Fancy word' },
      { text: 'persuasive', translation: 'thuyết phục', typeFunction: 'Tính từ · Ending' }
    ]
  },
  {
    hints: [
      { text: 'system bottleneck', translation: 'nút thắt cổ chai', typeFunction: 'Danh từ · Keyword' },
      { text: 'in addition', translation: 'hơn nữa', typeFunction: 'Từ nối · Logic word' },
      { text: 'silver bullet', translation: 'phương thuốc đặc trị', typeFunction: 'Ẩn dụ · Fancy word' },
      { text: 'streamlined', translation: 'tinh gọn', typeFunction: 'Tính từ · Ending' }
    ]
  },
  {
    hints: [
      { text: 'probation period', translation: 'giai đoạn thử việc', typeFunction: 'Danh từ · Keyword' },
      { text: 'next', translation: 'tiếp theo', typeFunction: 'Từ nối · Logic word' },
      { text: 'acid test', translation: 'phép thử thực tế', typeFunction: 'Ẩn dụ · Fancy word' },
      { text: 'passed', translation: 'vượt qua xuất sắc', typeFunction: 'Tính từ · Ending' }
    ]
  },
  {
    hints: [
      { text: 'Where to improve', translation: 'Nên cải thiện mặt nào', typeFunction: 'Cụm nghi vấn · WH word' },
      { text: 'then', translation: 'sau đó', typeFunction: 'Từ nối · Logic word' },
      { text: 'learning curve', translation: 'quá trình tiếp thu', typeFunction: 'Ẩn dụ · Fancy word' },
      { text: 'accelerated', translation: 'được đẩy nhanh', typeFunction: 'Tính từ · Ending' }
    ]
  },
  {
    hints: [
      { text: 'unethical practice', translation: 'hành vi phi đạo đức', typeFunction: 'Danh từ · Keyword' },
      { text: 'for that reason', translation: 'chính vì thế', typeFunction: 'Từ nối · Logic word' },
      { text: 'line in the sand', translation: 'ranh giới bất khả xâm phạm', typeFunction: 'Ẩn dụ · Fancy word' },
      { text: 'rejected', translation: 'bị khước từ dứt khoát', typeFunction: 'Tính từ · Ending' }
    ]
  },
  {
    hints: [
      { text: 'career opportunity', translation: 'cơ hội nghề nghiệp', typeFunction: 'Danh từ · Keyword' },
      { text: 'besides', translation: 'ngoài ra', typeFunction: 'Từ nối · Logic word' },
      { text: 'golden ticket', translation: 'tấm vé vàng đổi đời', typeFunction: 'Ẩn dụ · Fancy word' },
      { text: 'seized', translation: 'được nắm bắt', typeFunction: 'Tính từ · Ending' }
    ]
  }
];

// Session 4: 15 items, hcTotal = 5, hintTypes: ['Intro', 'Keyword', 'Logic word', 'Fancy word', 'Ending']
const s4_items_set2: ItemDef[] = [
  {
    hints: [
      { text: 'First and foremost', translation: 'Trước hết và quan trọng nhất', typeFunction: 'Cụm mào đầu · Intro' },
      { text: 'professional ethics', translation: 'đạo đức nghề nghiệp', typeFunction: 'Danh từ · Keyword' },
      { text: 'while', translation: 'trong khi', typeFunction: 'Từ nối · Logic word' },
      { text: 'moral compass', translation: 'kim chỉ nam dẫn đường', typeFunction: 'Ẩn dụ · Fancy word' },
      { text: 'unbending', translation: 'không nhân nhượng', typeFunction: 'Tính từ · Ending' }
    ]
  },
  {
    hints: [
      { text: 'To tell you the truth', translation: 'Thành thật giãi bày', typeFunction: 'Cụm mào đầu · Intro' },
      { text: 'financial modeling', translation: 'mô hình hóa tài chính', typeFunction: 'Danh từ · Keyword' },
      { text: 'however', translation: 'tuy nhiên', typeFunction: 'Từ nối · Logic word' },
      { text: 'hard nut', translation: 'bài toán hóc búa', typeFunction: 'Ẩn dụ · Fancy word' },
      { text: 'conquered', translation: 'được chinh phục', typeFunction: 'Tính từ · Ending' }
    ]
  },
  {
    hints: [
      { text: 'In my humble opinion', translation: 'Theo ý kiến khiêm tốn của tôi', typeFunction: 'Cụm mào đầu · Intro' },
      { text: 'cross-functional team', translation: 'nhóm liên phòng ban', typeFunction: 'Danh từ · Keyword' },
      { text: 'otherwise', translation: 'nếu không', typeFunction: 'Từ nối · Logic word' },
      { text: 'silo mentality', translation: 'tư duy cục bộ', typeFunction: 'Ẩn dụ · Fancy word' },
      { text: 'collaborative', translation: 'hợp tác khăng khít', typeFunction: 'Tính từ · Ending' }
    ]
  },
  {
    hints: [
      { text: "As far as I'm concerned", translation: 'Theo góc nhìn chuyên môn của tôi', typeFunction: 'Cụm mào đầu · Intro' },
      { text: 'cost reduction', translation: 'cắt giảm chi phí', typeFunction: 'Danh từ · Keyword' },
      { text: 'therefore', translation: 'do đó', typeFunction: 'Từ nối · Logic word' },
      { text: 'low-hanging fruit', translation: 'thành quả dễ gặt hái', typeFunction: 'Ẩn dụ · Fancy word' },
      { text: 'optimized', translation: 'được tối ưu', typeFunction: 'Tính từ · Ending' }
    ]
  },
  {
    hints: [
      { text: 'Believe it or not', translation: 'Dù tin hay không', typeFunction: 'Cụm mào đầu · Intro' },
      { text: 'cloud migration', translation: 'chuyển đổi dữ liệu đám mây', typeFunction: 'Danh từ · Keyword' },
      { text: 'eventually', translation: 'sau cùng', typeFunction: 'Từ nối · Logic word' },
      { text: 'smooth sailing', translation: 'thuận buồm xuôi gió', typeFunction: 'Ẩn dụ · Fancy word' },
      { text: 'seamless', translation: 'liền mạch trơn tru', typeFunction: 'Tính từ · Ending' }
    ]
  },
  {
    hints: [
      { text: 'From my experience', translation: 'Từ kinh nghiệm thực tế của tôi', typeFunction: 'Cụm mào đầu · Intro' },
      { text: 'quarterly closing', translation: 'chốt sổ kế toán quý', typeFunction: 'Danh từ · Keyword' },
      { text: 'meanwhile', translation: 'đồng thời', typeFunction: 'Từ nối · Logic word' },
      { text: 'cool head', translation: 'cái đầu lạnh điềm tĩnh', typeFunction: 'Ẩn dụ · Fancy word' },
      { text: 'focused', translation: 'tập trung cao độ', typeFunction: 'Tính từ · Ending' }
    ]
  },
  {
    hints: [
      { text: 'Honestly speaking', translation: 'Nói một cách chân thành', typeFunction: 'Cụm mào đầu · Intro' },
      { text: 'junior analyst', translation: 'chuyên viên phân tích trẻ', typeFunction: 'Danh từ · Keyword' },
      { text: 'if', translation: 'nếu', typeFunction: 'Từ nối · Logic word' },
      { text: 'eager beaver', translation: 'người chăm chỉ nhiệt thành', typeFunction: 'Ẩn dụ · Fancy word' },
      { text: 'promising', translation: 'đầy triển vọng', typeFunction: 'Tính từ · Ending' }
    ]
  },
  {
    hints: [
      { text: "Don't get me wrong", translation: 'Đừng hiểu sai ý tôi', typeFunction: 'Cụm mào đầu · Intro' },
      { text: 'internal audit', translation: 'kiểm toán nội bộ', typeFunction: 'Danh từ · Keyword' },
      { text: 'nevertheless', translation: 'dù vậy', typeFunction: 'Từ nối · Logic word' },
      { text: 'fine-tooth comb', translation: 'soi kỹ từng chân tơ kẽ tóc', typeFunction: 'Ẩn dụ · Fancy word' },
      { text: 'rigorous', translation: 'ngặt nghèo chuẩn chỉ', typeFunction: 'Tính từ · Ending' }
    ]
  },
  {
    hints: [
      { text: 'As a matter of fact', translation: 'Trên thực tế kiểm chứng', typeFunction: 'Cụm mào đầu · Intro' },
      { text: 'budget variance', translation: 'chênh lệch ngân sách', typeFunction: 'Danh từ · Keyword' },
      { text: 'before that', translation: 'trước đó', typeFunction: 'Từ nối · Logic word' },
      { text: 'smoking gun', translation: 'bằng chứng rõ mười mươi', typeFunction: 'Ẩn dụ · Fancy word' },
      { text: 'detected', translation: 'được phát hiện', typeFunction: 'Tính từ · Ending' }
    ]
  },
  {
    hints: [
      { text: 'Just to clarify', translation: 'Chỉ để làm rõ hơn', typeFunction: 'Cụm mào đầu · Intro' },
      { text: 'emergency reserve', translation: 'khoản dự phòng khẩn cấp', typeFunction: 'Danh từ · Keyword' },
      { text: 'in addition', translation: 'hơn nữa', typeFunction: 'Từ nối · Logic word' },
      { text: 'financial cushion', translation: 'tấm đệm tài chính', typeFunction: 'Ẩn dụ · Fancy word' },
      { text: 'safe', translation: 'an toàn tuyệt đối', typeFunction: 'Tính từ · Ending' }
    ]
  },
  {
    hints: [
      { text: 'By all accounts', translation: 'Theo đánh giá chung', typeFunction: 'Cụm mào đầu · Intro' },
      { text: 'project leader', translation: 'người dẫn dắt dự án', typeFunction: 'Danh từ · Keyword' },
      { text: 'next', translation: 'tiếp theo', typeFunction: 'Từ nối · Logic word' },
      { text: 'driving force', translation: 'đầu tàu kéo tiến độ', typeFunction: 'Ẩn dụ · Fancy word' },
      { text: 'inspirational', translation: 'truyền cảm hứng', typeFunction: 'Tính từ · Ending' }
    ]
  },
  {
    hints: [
      { text: 'To put it another way', translation: 'Nói bằng cách khác', typeFunction: 'Cụm mào đầu · Intro' },
      { text: 'client trust', translation: 'niềm tin của khách hàng', typeFunction: 'Danh từ · Keyword' },
      { text: 'in other words', translation: 'nói cách khác', typeFunction: 'Từ nối · Logic word' },
      { text: 'bread and butter', translation: 'miếng cơm manh áo cốt lõi', typeFunction: 'Ẩn dụ · Fancy word' },
      { text: 'vital', translation: 'sống còn', typeFunction: 'Tính từ · Ending' }
    ]
  },
  {
    hints: [
      { text: 'Keep in mind', translation: 'Hãy luôn ghi nhớ', typeFunction: 'Cụm mào đầu · Intro' },
      { text: 'compliance regulation', translation: 'quy định tuân thủ pháp lý', typeFunction: 'Danh từ · Keyword' },
      { text: 'as long as', translation: 'miễn là', typeFunction: 'Từ nối · Logic word' },
      { text: 'ahead of curve', translation: 'đi trước đón đầu', typeFunction: 'Ẩn dụ · Fancy word' },
      { text: 'bulletproof', translation: 'vững vàng không sơ hở', typeFunction: 'Tính từ · Ending' }
    ]
  },
  {
    hints: [
      { text: 'You can be sure that', translation: 'Bạn có thể chắc chắn rằng', typeFunction: 'Cụm mào đầu · Intro' },
      { text: 'final report', translation: 'báo cáo quyết toán cuối cùng', typeFunction: 'Danh từ · Keyword' },
      { text: 'then', translation: 'sau đó', typeFunction: 'Từ nối · Logic word' },
      { text: 'clean sheet', translation: 'hồ sơ sạch tinh tươm', typeFunction: 'Cụm gợi hình · Fancy word' },
      { text: 'flawless', translation: 'hoàn hảo', typeFunction: 'Tính từ · Ending' }
    ]
  },
  {
    hints: [
      { text: 'All in all', translation: 'Tóm lại mọi điều', typeFunction: 'Cụm mào đầu · Intro' },
      { text: 'finance career', translation: 'con đường sự nghiệp tài chính', typeFunction: 'Danh từ · Keyword' },
      { text: 'finally', translation: 'cuối cùng', typeFunction: 'Từ nối · Logic word' },
      { text: 'true calling', translation: 'tiếng gọi đam mê đích thực', typeFunction: 'Ẩn dụ · Fancy word' },
      { text: 'fulfilling', translation: 'viên mãn trọn vẹn', typeFunction: 'Tính từ · Ending' }
    ]
  }
];

// ============================================================================
// Builder function to assemble full ImprovPackage
// ============================================================================
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
      title: id.includes('01') 
        ? 'Session 1 • 2 Hints (Airport & Travel Rapid Reflex)' 
        : 'Session 1 • 2 Hints (Self Pitch & Core Accounting Reflex)',
      hcTotal: 2,
      hintTypes: ['Danh từ · Keyword', 'Động từ · Ending'],
      itemsData: s1_items
    },
    {
      sessionNumber: 2,
      title: id.includes('01')
        ? 'Session 2 • 3 Hints (Cause-Effect & Travel Situations)'
        : 'Session 2 • 3 Hints (Cause-Effect & Career Context)',
      hcTotal: 3,
      hintTypes: ['Danh từ · Keyword', 'Từ nối · Logic word', 'Tính từ · Ending'],
      itemsData: s2_items
    },
    {
      sessionNumber: 3,
      title: id.includes('01')
        ? 'Session 3 • 4 Hints (Nuance & Travel Mishaps)'
        : 'Session 3 • 4 Hints (Nuance & Professional Skills)',
      hcTotal: 4,
      hintTypes: ['Danh từ · Keyword', 'Từ nối · Logic word', 'Ẩn dụ · Fancy word', 'Tính từ · Ending'],
      itemsData: s3_items
    },
    {
      sessionNumber: 4,
      title: 'Session 4 • 5 Hints (Full Spoken Reflex Flow)',
      hcTotal: 5,
      hintTypes: ['Cụm mào đầu · Intro', 'Danh từ · Keyword', 'Từ nối · Logic word', 'Ẩn dụ · Fancy word', 'Tính từ · Ending'],
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
