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
// SET 01: Wandering Souls (Airport & Travel Reflex)
// Based on Level B ERES Day 2
// -------------------------------------------------------------

// Session 1: 15 items, hcTotal = 2, hintTypes: ['Keyword', 'Ending']
const s1_items_set1: ItemDef[] = [
  {
    hints: [
      { text: 'customs officer', translation: 'nhân viên hải quan', typeFunction: 'Keyword' },
      { text: 'asked for my passport', translation: 'đã yêu cầu xem hộ chiếu', typeFunction: 'Ending' }
    ]
  },
  {
    hints: [
      { text: 'boarding pass', translation: 'thẻ lên máy bay', typeFunction: 'Keyword' },
      { text: 'handed to the agent', translation: 'đã đưa cho nhân viên', typeFunction: 'Ending' }
    ]
  },
  {
    hints: [
      { text: 'loose change', translation: 'tiền lẻ', typeFunction: 'Keyword' },
      { text: 'left in front pocket', translation: 'còn sót trong túi trước', typeFunction: 'Ending' }
    ]
  },
  {
    hints: [
      { text: 'sleeping bag', translation: 'túi ngủ du lịch', typeFunction: 'Keyword' },
      { text: 'rolled up neatly', translation: 'được cuộn gọn gàng', typeFunction: 'Ending' }
    ]
  },
  {
    hints: [
      { text: 'luggage cart', translation: 'xe đẩy hành lý', typeFunction: 'Keyword' },
      { text: 'pushed to exit door', translation: 'được đẩy ra cửa thoát', typeFunction: 'Ending' }
    ]
  },
  {
    hints: [
      { text: 'flip-flops', translation: 'đôi dép lào', typeFunction: 'Keyword' },
      { text: 'packed for the beach', translation: 'xếp sẵn cho chuyến đi biển', typeFunction: 'Ending' }
    ]
  },
  {
    hints: [
      { text: 'check-in counter', translation: 'quầy làm thủ tục', typeFunction: 'Keyword' },
      { text: 'crowded with travelers', translation: 'chật kín khách du lịch', typeFunction: 'Ending' }
    ]
  },
  {
    hints: [
      { text: 'hotel address', translation: 'địa chỉ khách sạn', typeFunction: 'Keyword' },
      { text: 'saved on phone', translation: 'được lưu trong điện thoại', typeFunction: 'Ending' }
    ]
  },
  {
    hints: [
      { text: 'painkillers', translation: 'thuốc giảm đau', typeFunction: 'Keyword' },
      { text: 'taken after the flight', translation: 'được uống sau chuyến bay', typeFunction: 'Ending' }
    ]
  },
  {
    hints: [
      { text: 'window seat', translation: 'ghế cạnh cửa sổ', typeFunction: 'Keyword' },
      { text: 'booked in advance', translation: 'đã được đặt chỗ trước', typeFunction: 'Ending' }
    ]
  },
  {
    hints: [
      { text: 'departure time', translation: 'giờ máy bay cất cánh', typeFunction: 'Keyword' },
      { text: 'delayed by one hour', translation: 'bị hoãn lại một tiếng', typeFunction: 'Ending' }
    ]
  },
  {
    hints: [
      { text: 'local night market', translation: 'chợ đêm địa phương', typeFunction: 'Keyword' },
      { text: 'packed with food stalls', translation: 'đầy ắp các quầy ăn uống', typeFunction: 'Ending' }
    ]
  },
  {
    hints: [
      { text: 'tuktuk ride', translation: 'chuyến xe tuktuk', typeFunction: 'Keyword' },
      { text: 'hailed near the station', translation: 'được vẫy gần ga tàu', typeFunction: 'Ending' }
    ]
  },
  {
    hints: [
      { text: 'ancient temple', translation: 'ngôi đền cổ kính', typeFunction: 'Keyword' },
      { text: 'visited in early morning', translation: 'được ghé thăm từ sớm', typeFunction: 'Ending' }
    ]
  },
  {
    hints: [
      { text: 'flight transit', translation: 'chuyến bay quá cảnh', typeFunction: 'Keyword' },
      { text: 'lasted four long hours', translation: 'kéo dài suốt bốn tiếng', typeFunction: 'Ending' }
    ]
  }
];

// Session 2: 15 items, hcTotal = 3, hintTypes: ['Keyword', 'Logic word', 'Ending']
const s2_items_set1: ItemDef[] = [
  {
    hints: [
      { text: 'rush hour detour', translation: 'đường vòng giờ cao điểm', typeFunction: 'Keyword' },
      { text: 'because of the', translation: 'chính vì...', typeFunction: 'Logic word' },
      { text: 'missed final boarding', translation: 'lỡ mất giờ lên máy bay', typeFunction: 'Ending' }
    ]
  },
  {
    hints: [
      { text: 'overslept in hotel', translation: 'ngủ quên ở khách sạn', typeFunction: 'Keyword' },
      { text: 'as a result of', translation: 'kết quả là do...', typeFunction: 'Logic word' },
      { text: 'sprinted across terminal', translation: 'chạy thục mạng qua nhà ga', typeFunction: 'Ending' }
    ]
  },
  {
    hints: [
      { text: 'misread gate number', translation: 'đọc nhầm số cổng bay', typeFunction: 'Keyword' },
      { text: 'and consequently', translation: 'và do đó đã...', typeFunction: 'Logic word' },
      { text: 'waited at wrong gate', translation: 'đứng chờ nhầm ở cổng khác', typeFunction: 'Ending' }
    ]
  },
  {
    hints: [
      { text: 'terrible seasick feeling', translation: 'cảm giác say sóng dữ dội', typeFunction: 'Keyword' },
      { text: 'due to the', translation: 'bởi vì gặp phải...', typeFunction: 'Logic word' },
      { text: 'rested inside the cabin', translation: 'phải nằm nghỉ trong khoang tàu', typeFunction: 'Ending' }
    ]
  },
  {
    hints: [
      { text: 'left luggage behind', translation: 'bỏ quên hành lý lại', typeFunction: 'Keyword' },
      { text: 'right after realizing', translation: 'ngay sau khi nhận ra...', typeFunction: 'Logic word' },
      { text: 'ran back to customs', translation: 'chạy vội quay lại hải quan', typeFunction: 'Ending' }
    ]
  },
  {
    hints: [
      { text: 'severe food allergy', translation: 'dị ứng thức ăn nghiêm trọng', typeFunction: 'Keyword' },
      { text: 'owing to', translation: 'bởi vì dính phải...', typeFunction: 'Logic word' },
      { text: 'checked local hospital', translation: 'phải vào viện địa phương kiểm tra', typeFunction: 'Ending' }
    ]
  },
  {
    hints: [
      { text: 'lost hotel address', translation: 'làm mất địa chỉ khách sạn', typeFunction: 'Keyword' },
      { text: 'so in order to', translation: 'nên để có thể...', typeFunction: 'Logic word' },
      { text: 'asked nearby locals', translation: 'hỏi thăm người dân xung quanh', typeFunction: 'Ending' }
    ]
  },
  {
    hints: [
      { text: 'airport power outage', translation: 'sự cố mất điện sân bay', typeFunction: 'Keyword' },
      { text: 'which suddenly led to', translation: 'điều đó bất ngờ dẫn đến...', typeFunction: 'Logic word' },
      { text: 'halted luggage screening', translation: 'đình trệ khâu soi chiếu hành lý', typeFunction: 'Ending' }
    ]
  },
  {
    hints: [
      { text: 'dead phone battery', translation: 'điện thoại cạn sạch pin', typeFunction: 'Keyword' },
      { text: 'since I had', translation: 'vì bản thân bị...', typeFunction: 'Logic word' },
      { text: 'searched for charging station', translation: 'ráo riết tìm trạm sạc điện thoại', typeFunction: 'Ending' }
    ]
  },
  {
    hints: [
      { text: 'broken suitcase wheel', translation: 'bánh xe vali bị gãy', typeFunction: 'Keyword' },
      { text: 'despite having a', translation: 'mặc dù bị...', typeFunction: 'Logic word' },
      { text: 'dragged it through lobby', translation: 'vẫn kéo lê qua sảnh lớn', typeFunction: 'Ending' }
    ]
  },
  {
    hints: [
      { text: 'unexpected flight cancellation', translation: 'chuyến bay bị hủy bất ngờ', typeFunction: 'Keyword' },
      { text: 'prompted by', translation: 'bắt nguồn từ việc...', typeFunction: 'Logic word' },
      { text: 'queued for rebooking', translation: 'xếp hàng đổi vé máy bay', typeFunction: 'Ending' }
    ]
  },
  {
    hints: [
      { text: 'confusing airport signs', translation: 'biển chỉ dẫn khó hiểu', typeFunction: 'Keyword' },
      { text: 'because of those', translation: 'vì những tấm biển đó...', typeFunction: 'Logic word' },
      { text: 'took long detour', translation: 'đi một vòng đường thật xa', typeFunction: 'Ending' }
    ]
  },
  {
    hints: [
      { text: 'overweight baggage fee', translation: 'phí phạt hành lý quá ký', typeFunction: 'Keyword' },
      { text: 'in order to avoid', translation: 'để tránh bị...', typeFunction: 'Logic word' },
      { text: 'rearranged winter coats', translation: 'phải mở ra soạn lại áo ấm', typeFunction: 'Ending' }
    ]
  },
  {
    hints: [
      { text: 'spilled hot coffee', translation: 'lỡ làm đổ cà phê nóng', typeFunction: 'Keyword' },
      { text: 'right before the', translation: 'ngay trước khi...', typeFunction: 'Logic word' },
      { text: 'changed into clean shirt', translation: 'phải thay ngay áo sạch mới', typeFunction: 'Ending' }
    ]
  },
  {
    hints: [
      { text: 'lost boarding pass', translation: 'làm rơi thẻ lên tàu bay', typeFunction: 'Keyword' },
      { text: 'therefore we had to', translation: 'vì thế chúng tôi đành phải...', typeFunction: 'Logic word' },
      { text: 'request emergency reprint', translation: 'xin in lại vé khẩn cấp', typeFunction: 'Ending' }
    ]
  }
];

// Session 3: 15 items, hcTotal = 4, hintTypes: ['Keyword', 'Logic word', 'Fancy word', 'Ending']
const s3_items_set1: ItemDef[] = [
  {
    hints: [
      { text: 'customs checkpoint', translation: 'khu vực kiểm tra hải quan', typeFunction: 'Keyword' },
      { text: 'approaching the', translation: 'khi tiến vào...', typeFunction: 'Logic word' },
      { text: 'stern-looking officer', translation: 'viên chức mặt mày nghiêm nghị', typeFunction: 'Fancy word' },
      { text: 'scrutinized every single stamp', translation: 'săm soi kiểm tra từng con dấu', typeFunction: 'Ending' }
    ]
  },
  {
    hints: [
      { text: 'trolley jam', translation: 'ùn tắc xe đẩy hàng', typeFunction: 'Keyword' },
      { text: 'amid the', translation: 'ngay giữa...', typeFunction: 'Logic word' },
      { text: 'chaotic baggage claim', translation: 'khu trả hành lý hỗn loạn', typeFunction: 'Fancy word' },
      { text: 'retrieved heavy backpack', translation: 'kéo được chiếc balo nặng ra', typeFunction: 'Ending' }
    ]
  },
  {
    hints: [
      { text: 'overseas detour', translation: 'chuyến đi đường vòng nơi xứ người', typeFunction: 'Keyword' },
      { text: 'following an', translation: 'sau khi theo một...', typeFunction: 'Logic word' },
      { text: 'unfamiliar country alley', translation: 'con hẻm lạ hoắc miền quê', typeFunction: 'Fancy word' },
      { text: 'stumbled upon night market', translation: 'tình cờ lạc vào khu chợ đêm', typeFunction: 'Ending' }
    ]
  },
  {
    hints: [
      { text: 'severe carsickness', translation: 'cơn say xe dữ dội', typeFunction: 'Keyword' },
      { text: 'suffering from', translation: 'bị hành hạ bởi...', typeFunction: 'Logic word' },
      { text: 'winding mountain pass', translation: 'đoạn đèo quanh co uốn khúc', typeFunction: 'Fancy word' },
      { text: 'swallowed two painkillers', translation: 'uống liền hai viên thuốc giảm đau', typeFunction: 'Ending' }
    ]
  },
  {
    hints: [
      { text: 'delayed departure', translation: 'giờ cất cánh bị trễ', typeFunction: 'Keyword' },
      { text: 'irritated by the', translation: 'bực mình vì...', typeFunction: 'Logic word' },
      { text: 'prolonged technical glitch', translation: 'sự cố kỹ thuật kéo dài lê thê', typeFunction: 'Fancy word' },
      { text: 'dozed in sleeping bag', translation: 'chợp mắt luôn trong túi ngủ', typeFunction: 'Ending' }
    ]
  },
  {
    hints: [
      { text: 'lost room key', translation: 'chìa khóa phòng biến mất', typeFunction: 'Keyword' },
      { text: 'frantically realizing', translation: 'hốt hoảng phát hiện...', typeFunction: 'Logic word' },
      { text: 'unlocked hotel suite', translation: 'căn phòng khách sạn chưa khóa', typeFunction: 'Fancy word' },
      { text: 'alerted front desk manager', translation: 'báo ngay cho quản lý lễ tân', typeFunction: 'Ending' }
    ]
  },
  {
    hints: [
      { text: 'aisle seat swap', translation: 'đổi chỗ ngồi gần lối đi', typeFunction: 'Keyword' },
      { text: 'politely requesting an', translation: 'lịch sự mở lời xin...', typeFunction: 'Logic word' },
      { text: 'accommodating flight attendant', translation: 'tiếp viên hàng không niềm nở', typeFunction: 'Fancy word' },
      { text: 'stretched tired legs comfortably', translation: 'duỗi thẳng chân thoải mái nghỉ ngơi', typeFunction: 'Ending' }
    ]
  },
  {
    hints: [
      { text: 'misplaced passport', translation: 'để thất lạc cuốn hộ chiếu', typeFunction: 'Keyword' },
      { text: 'panicking over', translation: 'hoảng loạn vì...', typeFunction: 'Logic word' },
      { text: 'essential travel credential', translation: 'giấy tờ xuất ngoại quan trọng nhất', typeFunction: 'Fancy word' },
      { text: 'checked back pocket thoroughly', translation: 'lục tung kỹ lại túi quần sau', typeFunction: 'Ending' }
    ]
  },
  {
    hints: [
      { text: 'tuktuk scam', translation: 'cú lừa cước xe tuktuk', typeFunction: 'Keyword' },
      { text: 'wary of a', translation: 'cảnh giác trước...', typeFunction: 'Logic word' },
      { text: 'suspiciously steep price', translation: 'mức giá cao một cách đáng ngờ', typeFunction: 'Fancy word' },
      { text: 'firmly bargained fare down', translation: 'nhất quyết trả giá xuống đúng mức', typeFunction: 'Ending' }
    ]
  },
  {
    hints: [
      { text: 'monsoon downpour', translation: 'trận mưa rào nhiệt đới tầm tã', typeFunction: 'Keyword' },
      { text: 'trapped under the', translation: 'mắc kẹt dưới...', typeFunction: 'Logic word' },
      { text: 'crumbling ancient pagoda', translation: 'mái chùa cổ kính rêu phong', typeFunction: 'Fancy word' },
      { text: 'shared umbrella with monks', translation: 'che chung ô cùng các nhà sư', typeFunction: 'Ending' }
    ]
  },
  {
    hints: [
      { text: 'food court hunt', translation: 'công cuộc tìm kiếm khu ẩm thực', typeFunction: 'Keyword' },
      { text: 'navigating towards the', translation: 'dò dẫm bước về phía...', typeFunction: 'Logic word' },
      { text: 'bustling transit concourse', translation: 'sảnh trung chuyển nhộn nhịp', typeFunction: 'Fancy word' },
      { text: 'ordered steaming noodle soup', translation: 'gọi ngay bát mì nóng hổi', typeFunction: 'Ending' }
    ]
  },
  {
    hints: [
      { text: 'foreign socket adapter', translation: 'đầu chuyển ổ cắm điện nước ngoài', typeFunction: 'Keyword' },
      { text: 'struggling without a', translation: 'chật vật xoay sở vì thiếu...', typeFunction: 'Logic word' },
      { text: 'universal power converter', translation: 'bộ chuyển đổi phích cắm đa năng', typeFunction: 'Fancy word' },
      { text: 'borrowed one from reception', translation: 'mượn tạm một cái từ quầy tiếp tân', typeFunction: 'Ending' }
    ]
  },
  {
    hints: [
      { text: 'loose change pouch', translation: 'túi vải nhỏ đựng tiền lẻ', typeFunction: 'Keyword' },
      { text: 'emptying out the', translation: 'dốc hết...', typeFunction: 'Logic word' },
      { text: 'foreign metal currency', translation: 'tiền xu ngoại tệ lỉnh kỉnh', typeFunction: 'Fancy word' },
      { text: 'bought chilled herbal drink', translation: 'mua lon nước sâm ướp lạnh giải khát', typeFunction: 'Ending' }
    ]
  },
  {
    hints: [
      { text: 'overnight transit', translation: 'chuyến bay quá cảnh qua đêm', typeFunction: 'Keyword' },
      { text: 'enduring the', translation: 'chịu đựng...', typeFunction: 'Logic word' },
      { text: 'freezing airport terminal', translation: 'nhà ga sân bay lạnh buốt người', typeFunction: 'Fancy word' },
      { text: 'wrapped tight in jacket', translation: 'quấn chặt mình trong chiếc áo khoác dày', typeFunction: 'Ending' }
    ]
  },
  {
    hints: [
      { text: 'lost destination shuttle', translation: 'chuyến xe buýt trung chuyển bị lạc', typeFunction: 'Keyword' },
      { text: 'confused inside the', translation: 'hoang mang giữa...', typeFunction: 'Logic word' },
      { text: 'labyrinthine arrival corridor', translation: 'hành lang ga đến như mê cung', typeFunction: 'Fancy word' },
      { text: 'followed airline ground staff', translation: 'bám theo nhân viên mặt đất dẫn đường', typeFunction: 'Ending' }
    ]
  }
];

// Session 4: 15 items, hcTotal = 5, hintTypes: ['Intro', 'Keyword', 'Logic word', 'Fancy word', 'Ending']
const s4_items_set1: ItemDef[] = [
  {
    hints: [
      { text: 'Just so you know', translation: 'nói trước cho bạn biết là', typeFunction: 'Intro' },
      { text: 'customs interrogation', translation: 'việc hải quan tra hỏi', typeFunction: 'Keyword' },
      { text: 'became tense because', translation: 'trở nên căng thẳng do...', typeFunction: 'Logic word' },
      { text: 'suspicious baggage contents', translation: 'kiện hành lý có dấu hiệu nghi vấn', typeFunction: 'Fancy word' },
      { text: 'opened bags for inspection', translation: 'đã phải mở toang vali cho họ kiểm tra', typeFunction: 'Ending' }
    ]
  },
  {
    hints: [
      { text: 'It seems that', translation: 'hình như là', typeFunction: 'Intro' },
      { text: 'cheap flip-flops', translation: 'đôi dép lào giá rẻ', typeFunction: 'Keyword' },
      { text: 'snapped suddenly while', translation: 'bị đứt phựt khi đang...', typeFunction: 'Logic word' },
      { text: 'sprinting through terminal', translation: 'chạy thục mạng qua nhà ga vắng', typeFunction: 'Fancy word' },
      { text: 'barely caught departing flight', translation: 'vừa vặn kịp bước lên chuyến bay', typeFunction: 'Ending' }
    ]
  },
  {
    hints: [
      { text: 'No wonder', translation: 'hèn chi / chả trách', typeFunction: 'Intro' },
      { text: 'wandering tourist soul', translation: 'kẻ du lịch lạc bước', typeFunction: 'Keyword' },
      { text: 'felt exhausted after', translation: 'thấm mệt sau khi...', typeFunction: 'Logic word' },
      { text: 'aimless urban detour', translation: 'chuyến đi vòng quanh phố không định hướng', typeFunction: 'Fancy word' },
      { text: 'collapsed onto hotel bed', translation: 'ngã vật xuống giường khách sạn', typeFunction: 'Ending' }
    ]
  },
  {
    hints: [
      { text: "What'd you mean", translation: 'ý bạn là sao khi bảo', typeFunction: 'Intro' },
      { text: 'missing boarding pass', translation: 'thẻ lên tàu bay biến mất', typeFunction: 'Keyword' },
      { text: 'was swallowed inside', translation: 'đã bị kẹt sâu trong...', typeFunction: 'Logic word' },
      { text: 'faulty automated kiosk', translation: 'máy in vé tự động bị lỗi', typeFunction: 'Fancy word' },
      { text: 'called airline duty officer', translation: 'phải gọi nhân viên trực quầy ra xử lý', typeFunction: 'Ending' }
    ]
  },
  {
    hints: [
      { text: 'Forget about it', translation: 'thôi bỏ qua chuyện đó đi', typeFunction: 'Intro' },
      { text: 'overpriced airport snack', translation: 'món ăn vặt đắt đỏ ở sân bay', typeFunction: 'Keyword' },
      { text: 'wasted money unless', translation: 'chỉ tổ phí tiền trừ khi...', typeFunction: 'Logic word' },
      { text: 'famished starving traveler', translation: 'người lữ hành đói lả ruột gan', typeFunction: 'Fancy word' },
      { text: 'settles for stale sandwich', translation: 'chấp nhận ăn tạm ổ bánh mì nguội', typeFunction: 'Ending' }
    ]
  },
  {
    hints: [
      { text: 'Seriously now', translation: 'nói nghiêm túc nhé', typeFunction: 'Intro' },
      { text: 'luggage trolley collision', translation: 'cú va quẹt xe đẩy hành lý', typeFunction: 'Keyword' },
      { text: 'happened solely due to', translation: 'xảy ra chỉ vì...', typeFunction: 'Logic word' },
      { text: 'reckless crowded maneuvering', translation: 'cú luồn lách bất cẩn giữa đám đông', typeFunction: 'Fancy word' },
      { text: 'scattered souvenirs everywhere', translation: 'làm quà lưu niệm rơi vãi khắp sàn', typeFunction: 'Ending' }
    ]
  },
  {
    hints: [
      { text: 'How come you', translation: 'sao bạn lại có thể', typeFunction: 'Intro' },
      { text: 'packed huge rice cooker', translation: 'nhét nguyên chiếc nồi cơm điện to', typeFunction: 'Keyword' },
      { text: 'inside carry-on before', translation: 'vào hành lý xách tay trước khi...', typeFunction: 'Logic word' },
      { text: 'strict security scan', translation: 'khâu kiểm tra an ninh nghiêm ngặt', typeFunction: 'Fancy word' },
      { text: 'aroused total officer suspicion', translation: 'khiến nhân viên hải quan nghi ngờ ngay', typeFunction: 'Ending' }
    ]
  },
  {
    hints: [
      { text: 'Any chance that', translation: 'liệu có khả năng nào', typeFunction: 'Intro' },
      { text: 'flight departure time', translation: 'giờ cất cánh chuyến bay', typeFunction: 'Keyword' },
      { text: 'gets postponed because of', translation: 'bị dời lại vì...', typeFunction: 'Logic word' },
      { text: 'approaching tropical typhoon', translation: 'cơn bão nhiệt đới đang tiến tới gần', typeFunction: 'Fancy word' },
      { text: 'stranded us overnight inside', translation: 'khiến cả nhóm kẹt lại qua đêm', typeFunction: 'Ending' }
    ]
  },
  {
    hints: [
      { text: 'Sounds like a plan', translation: 'nghe có vẻ là kế hoạch hay', typeFunction: 'Intro' },
      { text: 'renting riverside tuktuk', translation: 'thuê xe tuktuk dọc bờ sông', typeFunction: 'Keyword' },
      { text: 'so we can escape', translation: 'để chúng ta thoát khỏi...', typeFunction: 'Logic word' },
      { text: 'sweltering tropical heat', translation: 'cái nóng oi ả nhiệt đới', typeFunction: 'Fancy word' },
      { text: 'enjoy local night market', translation: 'thỏa thích dạo chợ đêm bản địa', typeFunction: 'Ending' }
    ]
  },
  {
    hints: [
      { text: 'Lemme tell you', translation: 'để tôi kể thẳng cho bạn', typeFunction: 'Intro' },
      { text: 'allergic peanut reaction', translation: 'cơn sốc dị ứng đậu phộng', typeFunction: 'Keyword' },
      { text: 'hit immediately after eating', translation: 'tái phát ngay sau khi ăn...', typeFunction: 'Logic word' },
      { text: 'mysterious street delicacy', translation: 'món đặc sản đường phố lạ mắt', typeFunction: 'Fancy word' },
      { text: 'rushed for medical help', translation: 'phải hối hả đi tìm trạm sơ cứu', typeFunction: 'Ending' }
    ]
  },
  {
    hints: [
      { text: 'No question that', translation: 'không còn nghi ngờ gì nữa', typeFunction: 'Intro' },
      { text: 'ancient temple detour', translation: 'chuyến rẽ vào thăm ngôi chùa cổ', typeFunction: 'Keyword' },
      { text: 'became unforgettable once', translation: 'trở nên khó quên khi...', typeFunction: 'Logic word' },
      { text: 'serene chanting monks', translation: 'những nhà sư tụng kinh thanh tịnh', typeFunction: 'Fancy word' },
      { text: 'offered peaceful blessings', translation: 'trao tặng lời chúc phúc an lành', typeFunction: 'Ending' }
    ]
  },
  {
    hints: [
      { text: 'At that time', translation: 'vào đúng thời điểm ấy', typeFunction: 'Intro' },
      { text: 'lost hotel keycard', translation: 'chiếc thẻ phòng khách sạn bị mất', typeFunction: 'Keyword' },
      { text: 'caused severe panic until', translation: 'gây nên một phen hoảng sợ cho tới khi...', typeFunction: 'Logic word' },
      { text: 'observant friendly housekeeper', translation: 'cô lao công tốt bụng và tinh mắt', typeFunction: 'Fancy word' },
      { text: 'returned it with smile', translation: 'trao trả lại với nụ cười tươi', typeFunction: 'Ending' }
    ]
  },
  {
    hints: [
      { text: 'Just leave it', translation: 'cứ để nguyên nó trên bàn', typeFunction: 'Intro' },
      { text: 'spare change coins', translation: 'mấy đồng tiền xu lẻ thừa', typeFunction: 'Keyword' },
      { text: 'intended specifically for', translation: 'để dành riêng cho...', typeFunction: 'Logic word' },
      { text: 'generous hotel tip', translation: 'khoản tiền boa xứng đáng cho khách sạn', typeFunction: 'Fancy word' },
      { text: 'before checking out early', translation: 'trước khi làm thủ tục trả phòng sớm', typeFunction: 'Ending' }
    ]
  },
  {
    hints: [
      { text: 'It appears that', translation: 'có vẻ như là', typeFunction: 'Intro' },
      { text: 'unfamiliar transit terminal', translation: 'nhà ga trung chuyển xa lạ', typeFunction: 'Keyword' },
      { text: 'confused passengers due to', translation: 'làm hành khách bối rối bởi...', typeFunction: 'Logic word' },
      { text: 'abrupt gate relocation', translation: 'sự thay đổi cổng bay đột ngột', typeFunction: 'Fancy word' },
      { text: 'forced crowd to sprint', translation: 'khiến đám đông phải chạy đua vội vã', typeFunction: 'Ending' }
    ]
  },
  {
    hints: [
      { text: 'For what reason', translation: 'vì lý do gì mà', typeFunction: 'Intro' },
      { text: 'bulky winter sleeping bag', translation: 'chiếc túi ngủ mùa đông cồng kềnh', typeFunction: 'Keyword' },
      { text: 'was brought along when', translation: 'lại được mang theo trong khi...', typeFunction: 'Logic word' },
      { text: 'sweltering tropical island', translation: 'hòn đảo nhiệt đới nắng gắt', typeFunction: 'Fancy word' },
      { text: 'only requires light flip-flops', translation: 'chỉ cần một đôi dép lào nhẹ tênh', typeFunction: 'Ending' }
    ]
  }
];

// -------------------------------------------------------------
// SET 02: Tell Me About Yourself (Self Pitch & Work Experience)
// Based on Level B ERES Day 3
// -------------------------------------------------------------

// Session 1: 15 items, hcTotal = 2, hintTypes: ['Keyword', 'Ending']
const s1_items_set2: ItemDef[] = [
  {
    hints: [
      { text: 'work experience', translation: 'kinh nghiệm làm việc thực tế', typeFunction: 'Keyword' },
      { text: 'detailed in my resume', translation: 'được trình bày rõ trong hồ sơ', typeFunction: 'Ending' }
    ]
  },
  {
    hints: [
      { text: 'energetic mindset', translation: 'tinh thần làm việc năng nổ', typeFunction: 'Keyword' },
      { text: 'brought to every project', translation: 'được mang vào từng dự án', typeFunction: 'Ending' }
    ]
  },
  {
    hints: [
      { text: 'accounting function', translation: 'nghiệp vụ kế toán tài chính', typeFunction: 'Keyword' },
      { text: 'handled with high accuracy', translation: 'được xử lý với độ chuẩn xác cao', typeFunction: 'Ending' }
    ]
  },
  {
    hints: [
      { text: 'guide newcomers', translation: 'hướng dẫn nhân viên mới', typeFunction: 'Keyword' },
      { text: 'during onboarding week', translation: 'trong tuần đầu hội nhập', typeFunction: 'Ending' }
    ]
  },
  {
    hints: [
      { text: 'man of the month', translation: 'nhân viên xuất sắc của tháng', typeFunction: 'Keyword' },
      { text: 'awarded two times consecutively', translation: 'được trao tặng hai lần liên tiếp', typeFunction: 'Ending' }
    ]
  },
  {
    hints: [
      { text: 'senior student', translation: 'sinh viên năm cuối', typeFunction: 'Keyword' },
      { text: 'graduating top of class', translation: 'chuẩn bị tốt nghiệp thủ khoa', typeFunction: 'Ending' }
    ]
  },
  {
    hints: [
      { text: 'daily transactions', translation: 'các giao dịch kế toán hằng ngày', typeFunction: 'Keyword' },
      { text: 'reconciled before evening', translation: 'được đối chiếu xong trước buổi tối', typeFunction: 'Ending' }
    ]
  },
  {
    hints: [
      { text: 'risk management', translation: 'nghiệp vụ quản trị rủi ro', typeFunction: 'Keyword' },
      { text: 'implemented across department', translation: 'được áp dụng khắp phòng ban', typeFunction: 'Ending' }
    ]
  },
  {
    hints: [
      { text: 'monthly balance sheet', translation: 'bảng cân đối kế toán hàng tháng', typeFunction: 'Keyword' },
      { text: 'audited without discrepancies', translation: 'được kiểm toán không sai sót', typeFunction: 'Ending' }
    ]
  },
  {
    hints: [
      { text: 'top company', translation: 'doanh nghiệp hàng đầu thị trường', typeFunction: 'Keyword' },
      { text: 'recruited for internship', translation: 'được tuyển vào làm thực tập sinh', typeFunction: 'Ending' }
    ]
  },
  {
    hints: [
      { text: 'core strengths', translation: 'những điểm mạnh then chốt', typeFunction: 'Keyword' },
      { text: 'aligned with job requirements', translation: 'phù hợp hoàn hảo với vị trí ứng tuyển', typeFunction: 'Ending' }
    ]
  },
  {
    hints: [
      { text: 'open-ended questions', translation: 'những câu hỏi phỏng vấn mở', typeFunction: 'Keyword' },
      { text: 'answered with calm confidence', translation: 'được trả lời bằng sự tự tin điềm đạm', typeFunction: 'Ending' }
    ]
  },
  {
    hints: [
      { text: 'workplace integrity', translation: 'sự chính trực trong công việc', typeFunction: 'Keyword' },
      { text: 'valued above all else', translation: 'được coi trọng trên hết mọi thứ', typeFunction: 'Ending' }
    ]
  },
  {
    hints: [
      { text: 'creative ideas', translation: 'những sáng kiến đổi mới', typeFunction: 'Keyword' },
      { text: 'pitched to executive board', translation: 'được trình bày trước ban giám đốc', typeFunction: 'Ending' }
    ]
  },
  {
    hints: [
      { text: 'convince recruiters', translation: 'thuyết phục các nhà tuyển dụng', typeFunction: 'Keyword' },
      { text: 'through proven accomplishments', translation: 'thông qua thành tích đã được chứng minh', typeFunction: 'Ending' }
    ]
  }
];

// Session 2: 15 items, hcTotal = 3, hintTypes: ['Keyword', 'Logic word', 'Ending']
const s2_items_set2: ItemDef[] = [
  {
    hints: [
      { text: 'years of experience', translation: 'nhiều năm kinh nghiệm làm việc', typeFunction: 'Keyword' },
      { text: 'leveraging solid', translation: 'tận dụng nền tảng...', typeFunction: 'Logic word' },
      { text: 'optimized department budget', translation: 'tối ưu hóa ngân sách phòng ban', typeFunction: 'Ending' }
    ]
  },
  {
    hints: [
      { text: 'company restructuring', translation: 'đợt tái cơ cấu doanh nghiệp', typeFunction: 'Keyword' },
      { text: 'following the sudden', translation: 'ngay sau khi diễn ra...', typeFunction: 'Logic word' },
      { text: 'assumed expanded leadership role', translation: 'đảm nhận vai trò lãnh đạo mở rộng', typeFunction: 'Ending' }
    ]
  },
  {
    hints: [
      { text: 'financial discrepancies', translation: 'các sai lệch trong sổ sách tài chính', typeFunction: 'Keyword' },
      { text: 'in order to eliminate', translation: 'nhằm mục đích dẹp bỏ...', typeFunction: 'Logic word' },
      { text: 'redesigned verification system', translation: 'thiết kế lại hệ thống đối soát dữ liệu', typeFunction: 'Ending' }
    ]
  },
  {
    hints: [
      { text: 'tight deadline pressure', translation: 'áp lực thời hạn bàn giao gấp gáp', typeFunction: 'Keyword' },
      { text: 'despite working under', translation: 'mặc dù luôn phải chịu...', typeFunction: 'Logic word' },
      { text: 'delivered quarterly report flawlessly', translation: 'hoàn thành báo cáo quý không tì vết', typeFunction: 'Ending' }
    ]
  },
  {
    hints: [
      { text: 'training new recruits', translation: 'việc đào tạo nhân sự mới vào', typeFunction: 'Keyword' },
      { text: 'being responsible for', translation: 'chịu trách nhiệm chính trong việc...', typeFunction: 'Logic word' },
      { text: 'boosted team productivity greatly', translation: 'nâng cao đáng kể hiệu suất toàn đội ngũ', typeFunction: 'Ending' }
    ]
  },
  {
    hints: [
      { text: 'e-commerce campaign', translation: 'chiến dịch bán hàng thương mại điện tử', typeFunction: 'Keyword' },
      { text: 'while managing the', translation: 'trong lúc điều hành...', typeFunction: 'Logic word' },
      { text: 'doubled monthly sales revenue', translation: 'tăng gấp đôi doanh số bán hàng tháng', typeFunction: 'Ending' }
    ]
  },
  {
    hints: [
      { text: 'academic research honors', translation: 'giải thưởng nghiên cứu học thuật', typeFunction: 'Keyword' },
      { text: 'as a result of winning', translation: 'nhờ đạt được...', typeFunction: 'Logic word' },
      { text: 'secured full scholarship grant', translation: 'nhận được suất học bổng toàn phần', typeFunction: 'Ending' }
    ]
  },
  {
    hints: [
      { text: 'clearance sales campaign', translation: 'chiến dịch xả hàng tồn kho lớn', typeFunction: 'Keyword' },
      { text: 'specifically focusing on', translation: 'tập trung mũi nhọn vào...', typeFunction: 'Logic word' },
      { text: 'liquidated surplus inventory fast', translation: 'giải phóng sạch lượng hàng tồn nhanh chóng', typeFunction: 'Ending' }
    ]
  },
  {
    hints: [
      { text: 'unrelated interview questions', translation: 'những câu hỏi phỏng vấn lạc đề', typeFunction: 'Keyword' },
      { text: 'when confronted with', translation: 'khi bất ngờ đối mặt với...', typeFunction: 'Logic word' },
      { text: 'steered back to core skills', translation: 'khéo léo dẫn dắt về kỹ năng trọng tâm', typeFunction: 'Ending' }
    ]
  },
  {
    hints: [
      { text: 'interpersonal team conflict', translation: 'bất đồng quan điểm giữa đồng nghiệp', typeFunction: 'Keyword' },
      { text: 'stepped in to resolve', translation: 'chủ động đứng ra hòa giải...', typeFunction: 'Logic word' },
      { text: 'restored productive workspace harmony', translation: 'lấy lại bầu không khí làm việc hiệu quả', typeFunction: 'Ending' }
    ]
  },
  {
    hints: [
      { text: 'cross-department collaboration', translation: 'sự phối hợp giữa các phòng ban', typeFunction: 'Keyword' },
      { text: 'by actively promoting', translation: 'bằng cách thúc đẩy mạnh mẽ...', typeFunction: 'Logic word' },
      { text: 'accelerated product launch timeline', translation: 'đẩy nhanh tiến độ tung sản phẩm mới', typeFunction: 'Ending' }
    ]
  },
  {
    hints: [
      { text: 'unexpected budget cuts', translation: 'việc cắt giảm ngân sách bất ngờ', typeFunction: 'Keyword' },
      { text: 'adapting quickly to', translation: 'nhanh chóng thích nghi trước...', typeFunction: 'Logic word' },
      { text: 'automated manual accounting tasks', translation: 'tự động hóa các thao tác kế toán thủ công', typeFunction: 'Ending' }
    ]
  },
  {
    hints: [
      { text: 'demanding client expectations', translation: 'kỳ vọng khắt khe từ phía khách hàng', typeFunction: 'Keyword' },
      { text: 'in order to exceed', translation: 'với quyết tâm vượt qua...', typeFunction: 'Logic word' },
      { text: 'provided continuous project updates', translation: 'liên tục báo cáo tiến độ minh bạch', typeFunction: 'Ending' }
    ]
  },
  {
    hints: [
      { text: 'new software rollout', translation: 'việc triển khai phần mềm nghiệp vụ mới', typeFunction: 'Keyword' },
      { text: 'prior to executing', translation: 'trước thời điểm đưa vào vận hành...', typeFunction: 'Logic word' },
      { text: 'conducted hands-on user training', translation: 'trực tiếp hướng dẫn thao tác cho người dùng', typeFunction: 'Ending' }
    ]
  },
  {
    hints: [
      { text: 'interview anxiety jitters', translation: 'cảm giác hồi hộp lo lắng khi phỏng vấn', typeFunction: 'Keyword' },
      { text: 'managed to overcome', translation: 'đã hoàn toàn chiến thắng...', typeFunction: 'Logic word' },
      { text: 'delivered convincing personal pitch', translation: 'trình bày bài giới thiệu bản thân thuyết phục', typeFunction: 'Ending' }
    ]
  }
];

// Session 3: 15 items, hcTotal = 4, hintTypes: ['Keyword', 'Logic word', 'Fancy word', 'Ending']
const s3_items_set2: ItemDef[] = [
  {
    hints: [
      { text: 'accounting function', translation: 'chức năng kế toán doanh nghiệp', typeFunction: 'Keyword' },
      { text: 'overseeing the entire', translation: 'chịu trách nhiệm bao quát toàn bộ...', typeFunction: 'Logic word' },
      { text: 'complex corporate ledger', translation: 'hệ thống sổ cái doanh nghiệp phức tạp', typeFunction: 'Fancy word' },
      { text: 'eliminated costly financial errors', translation: 'loại bỏ sạch các sai sót tài chính tốn kém', typeFunction: 'Ending' }
    ]
  },
  {
    hints: [
      { text: 'mentoring junior staff', translation: 'việc dẫn dắt kèm cặp nhân viên mới', typeFunction: 'Keyword' },
      { text: 'dedicatedly committing to', translation: 'tận tâm cống hiến cho...', typeFunction: 'Logic word' },
      { text: 'structured onboarding curriculum', translation: 'giáo trình đào tạo hội nhập bài bản', typeFunction: 'Fancy word' },
      { text: 'received man of the month award', translation: 'được nhận danh hiệu nhân viên của tháng', typeFunction: 'Ending' }
    ]
  },
  {
    hints: [
      { text: 'promotional sales campaign', translation: 'chiến dịch khuyến mãi kích cầu', typeFunction: 'Keyword' },
      { text: 'strategically designing a', translation: 'lên chiến lược thiết kế một...', typeFunction: 'Logic word' },
      { text: 'viral like-farming promotion', translation: 'chiến dịch tương tác lan tỏa mạnh mẽ', typeFunction: 'Fancy word' },
      { text: 'drove massive online conversions', translation: 'kéo về lượng đơn hàng trực tuyến khổng lồ', typeFunction: 'Ending' }
    ]
  },
  {
    hints: [
      { text: 'rigorous audit preparation', translation: 'công tác chuẩn bị kiểm toán gắt gao', typeFunction: 'Keyword' },
      { text: 'meticulously completing the', translation: 'hoàn thành tỉ mỉ từng hạng mục của...', typeFunction: 'Logic word' },
      { text: 'monthly balance sheet', translation: 'bảng cân đối kế toán hàng tháng', typeFunction: 'Fancy word' },
      { text: 'earned praise from senior partners', translation: 'được các đối tác cấp cao hết lời khen ngợi', typeFunction: 'Ending' }
    ]
  },
  {
    hints: [
      { text: 'senior student leader', translation: 'thủ lĩnh sinh viên năm cuối', typeFunction: 'Keyword' },
      { text: 'excelling consistently as a', translation: 'luôn giữ vững phong độ xuất sắc của một...', typeFunction: 'Logic word' },
      { text: 'top economics university scholar', translation: 'sinh viên ưu tú trường đại học kinh tế', typeFunction: 'Fancy word' },
      { text: 'transitioned smoothly into full-time role', translation: 'chuyển tiếp suôn sẻ sang vị trí chính thức', typeFunction: 'Ending' }
    ]
  },
  {
    hints: [
      { text: 'unforeseen corporate restructuring', translation: 'việc tái cấu trúc doanh nghiệp bất ngờ', typeFunction: 'Keyword' },
      { text: 'successfully weathering the', translation: 'vượt qua trọn vẹn giai đoạn...', typeFunction: 'Logic word' },
      { text: 'turbulent managerial transition', translation: 'chuyển giao bộ máy quản lý đầy biến động', typeFunction: 'Fancy word' },
      { text: 'retained key client accounts intact', translation: 'giữ vững các hợp đồng khách hàng trọng điểm', typeFunction: 'Ending' }
    ]
  },
  {
    hints: [
      { text: 'uncompromising workplace integrity', translation: 'tính chính trực tuyệt đối trong công sở', typeFunction: 'Keyword' },
      { text: 'firmly upholding our', translation: 'luôn kiên định giữ vững...', typeFunction: 'Logic word' },
      { text: 'transparent governance standards', translation: 'những chuẩn mực quản trị minh bạch', typeFunction: 'Fancy word' },
      { text: 'earned trust from executive directors', translation: 'tạo dựng niềm tin vững chắc từ hội đồng quản trị', typeFunction: 'Ending' }
    ]
  },
  {
    hints: [
      { text: 'behavioral interview pitch', translation: 'phần trả lời phỏng vấn hành vi', typeFunction: 'Keyword' },
      { text: 'delivering an articulate', translation: 'trình bày một cách mạch lạc trong...', typeFunction: 'Logic word' },
      { text: 'compelling professional narrative', translation: 'câu chuyện phát triển sự nghiệp đầy thuyết phục', typeFunction: 'Fancy word' },
      { text: 'impressed recruitment committee deeply', translation: 'gây ấn tượng sâu sắc với hội đồng tuyển dụng', typeFunction: 'Ending' }
    ]
  },
  {
    hints: [
      { text: 'cross-functional team synergy', translation: 'sức mạnh gắn kết liên phòng ban', typeFunction: 'Keyword' },
      { text: 'actively fostering strong', translation: 'tích cực gây dựng và nuôi dưỡng...', typeFunction: 'Logic word' },
      { text: 'harmonious workplace collaboration', translation: 'sự cộng tác hài hòa nơi công sở', typeFunction: 'Fancy word' },
      { text: 'surpassed annual departmental goals', translation: 'hoàn thành vượt mức chỉ tiêu năm của phòng', typeFunction: 'Ending' }
    ]
  },
  {
    hints: [
      { text: 'high-stakes client negotiation', translation: 'cuộc đàm phán hợp đồng cân não', typeFunction: 'Keyword' },
      { text: 'leading the crucial', translation: 'dẫn dắt trực tiếp phiên...', typeFunction: 'Logic word' },
      { text: 'strategic enterprise partnership', translation: 'hợp tác chiến lược cấp doanh nghiệp', typeFunction: 'Fancy word' },
      { text: 'secured multi-year service contract', translation: 'ký kết thành công hợp đồng dài hạn nhiều năm', typeFunction: 'Ending' }
    ]
  },
  {
    hints: [
      { text: 'proactive workflow automation', translation: 'chủ động tự động hóa luồng công việc', typeFunction: 'Keyword' },
      { text: 'spearheading modern', translation: 'tiên phong dẫn dắt quá trình...', typeFunction: 'Logic word' },
      { text: 'innovative software integration', translation: 'tích hợp phần mềm đổi mới công nghệ', typeFunction: 'Fancy word' },
      { text: 'slashed transaction processing time', translation: 'cắt giảm một nửa thời gian xử lý giao dịch', typeFunction: 'Ending' }
    ]
  },
  {
    hints: [
      { text: 'challenging open-ended questions', translation: 'những câu hỏi mở đầy thử thách', typeFunction: 'Keyword' },
      { text: 'deftly unpacking each', translation: 'khéo léo bóc tách và phân tích từng...', typeFunction: 'Logic word' },
      { text: 'intricate scenario dilemma', translation: 'tình huống nghiệp vụ hóc búa', typeFunction: 'Fancy word' },
      { text: 'convinced interview panel decisively', translation: 'thuyết phục hoàn toàn các vị giám khảo', typeFunction: 'Ending' }
    ]
  },
  {
    hints: [
      { text: 'rapid market downturn', translation: 'thời kỳ thị trường suy thoái nhanh', typeFunction: 'Keyword' },
      { text: 'remaining agile during', translation: 'giữ vững sự linh hoạt bén nhạy giữa...', typeFunction: 'Logic word' },
      { text: 'severe industry headwind', translation: 'những cơn sóng gió ngành khốc liệt', typeFunction: 'Fancy word' },
      { text: 'maintained positive operating margins', translation: 'duy trì tốt biên lợi nhuận hoạt động dương', typeFunction: 'Ending' }
    ]
  },
  {
    hints: [
      { text: 'dynamic project management', translation: 'năng lực điều phối dự án linh hoạt', typeFunction: 'Keyword' },
      { text: 'effectively utilizing modern', translation: 'vận dụng hiệu quả những...', typeFunction: 'Logic word' },
      { text: 'agile delivery methodologies', translation: 'phương pháp quản trị dự án tinh gọn', typeFunction: 'Fancy word' },
      { text: 'delivered milestone ahead of schedule', translation: 'bàn giao cột mốc công việc trước tiến độ', typeFunction: 'Ending' }
    ]
  },
  {
    hints: [
      { text: 'long-term career roadmap', translation: 'lộ trình phát triển sự nghiệp lâu dài', typeFunction: 'Keyword' },
      { text: 'clearly presenting a', translation: 'trình bày rõ ràng và mạch lạc một...', typeFunction: 'Logic word' },
      { text: 'purposeful leadership trajectory', translation: 'định hướng phát triển năng lực lãnh đạo', typeFunction: 'Fancy word' },
      { text: 'demonstrated strong company commitment', translation: 'khẳng định cam kết gắn bó lâu dài cùng công ty', typeFunction: 'Ending' }
    ]
  }
];

// Session 4: 15 items, hcTotal = 5, hintTypes: ['Intro', 'Keyword', 'Logic word', 'Fancy word', 'Ending']
const s4_items_set2: ItemDef[] = [
  {
    hints: [
      { text: 'Tell me about yourself', translation: 'hãy giới thiệu về bản thân bạn', typeFunction: 'Intro' },
      { text: '18 years of experience', translation: '18 năm kinh nghiệm trong ngành', typeFunction: 'Keyword' },
      { text: 'demonstrates how I', translation: 'chứng minh rõ việc tôi đã...', typeFunction: 'Logic word' },
      { text: 'mastered accounting functions', translation: 'làm chủ các nghiệp vụ kế toán chuyên sâu', typeFunction: 'Fancy word' },
      { text: 'drove organizational excellence', translation: 'thúc đẩy tổ chức phát triển vượt bậc', typeFunction: 'Ending' }
    ]
  },
  {
    hints: [
      { text: "I'm not bragging but", translation: 'không phải tôi khoe khoang đâu nhưng', typeFunction: 'Intro' },
      { text: 'man of the month', translation: 'nhân viên xuất sắc của tháng', typeFunction: 'Keyword' },
      { text: 'was awarded because of', translation: 'đã được trao tặng nhờ...', typeFunction: 'Logic word' },
      { text: 'exceptional newcomer mentoring', translation: 'thành tích kèm cặp người mới xuất chúng', typeFunction: 'Fancy word' },
      { text: 'raised overall department output', translation: 'nâng tầm năng suất cho cả phòng ban', typeFunction: 'Ending' }
    ]
  },
  {
    hints: [
      { text: 'Specifically speaking', translation: 'nói một cách cụ thể hơn', typeFunction: 'Intro' },
      { text: 'reconciliation of transactions', translation: 'khâu đối chiếu các giao dịch', typeFunction: 'Keyword' },
      { text: 'requires strict diligence and', translation: 'đòi hỏi sự cẩn trọng cao độ và...', typeFunction: 'Logic word' },
      { text: 'flawless bookkeeping precision', translation: 'độ chuẩn xác tuyệt đối trong lưu giữ sổ sách', typeFunction: 'Fancy word' },
      { text: 'prevented multi-million audits', translation: 'ngăn chặn các rủi ro kiểm toán hàng triệu đô', typeFunction: 'Ending' }
    ]
  },
  {
    hints: [
      { text: 'Besides that point', translation: 'bên cạnh điểm sáng đó ra', typeFunction: 'Intro' },
      { text: 'energetic senior student', translation: 'sinh viên năm cuối đầy nhiệt huyết', typeFunction: 'Keyword' },
      { text: 'balanced coursework while', translation: 'đã cân bằng việc học tại trường trong khi...', typeFunction: 'Logic word' },
      { text: 'leading e-commerce sales', translation: 'dẫn dắt các chiến dịch bán hàng trực tuyến', typeFunction: 'Fancy word' },
      { text: 'surpassed quarterly target goals', translation: 'vượt xa các chỉ tiêu doanh số theo quý', typeFunction: 'Ending' }
    ]
  },
  {
    hints: [
      { text: 'Soon after that', translation: 'ngay sau cột mốc đó', typeFunction: 'Intro' },
      { text: 'company restructure plan', translation: 'kế hoạch tái cơ cấu doanh nghiệp', typeFunction: 'Keyword' },
      { text: 'opened new avenues to', translation: 'đã mở ra cơ hội lớn để...', typeFunction: 'Logic word' },
      { text: 'eliminate redundant procedures', translation: 'loại bỏ các quy trình thừa thãi rườm rà', typeFunction: 'Fancy word' },
      { text: 'streamlined overall workflow', translation: 'tinh gọn toàn bộ guồng quay công việc', typeFunction: 'Ending' }
    ]
  },
  {
    hints: [
      { text: 'In other words', translation: 'nói theo một cách khác', typeFunction: 'Intro' },
      { text: 'uncompromising integrity', translation: 'sự chính trực không bao giờ thỏa hiệp', typeFunction: 'Keyword' },
      { text: 'serves as my', translation: 'đóng vai trò là...', typeFunction: 'Logic word' },
      { text: 'intangible internal anchor', translation: 'điểm tựa nội lực vô hình vững chắc', typeFunction: 'Fancy word' },
      { text: 'guides every ethical decision', translation: 'dẫn lối cho mọi quyết định chuẩn mực đạo đức', typeFunction: 'Ending' }
    ]
  },
  {
    hints: [
      { text: 'As long as', translation: 'miễn là chúng ta', typeFunction: 'Intro' },
      { text: 'open-ended questions', translation: 'những câu hỏi phỏng vấn mở', typeFunction: 'Keyword' },
      { text: 'are answered with honest', translation: 'được đối đáp bằng sự chân thành cùng...', typeFunction: 'Logic word' },
      { text: 'proven track record', translation: 'những chiến tích thực tế đã được kiểm chứng', typeFunction: 'Fancy word' },
      { text: 'convince any hiring panel', translation: 'chắc chắn thuyết phục được mọi nhà tuyển dụng', typeFunction: 'Ending' }
    ]
  },
  {
    hints: [
      { text: 'Fortunately enough', translation: 'thật may mắn khi mà', typeFunction: 'Intro' },
      { text: 'monthly balance sheet', translation: 'bảng cân đối kế toán hàng tháng', typeFunction: 'Keyword' },
      { text: 'was verified thoroughly through', translation: 'đã được thẩm định kỹ lưỡng nhờ...', typeFunction: 'Logic word' },
      { text: 'rigorous internal review', translation: 'quy trình rà soát nội bộ gắt gao', typeFunction: 'Fancy word' },
      { text: 'passed external audit smoothly', translation: 'vượt qua kỳ kiểm toán bên ngoài trơn tru', typeFunction: 'Ending' }
    ]
  },
  {
    hints: [
      { text: 'For better or worse', translation: 'dù tình thế có ra sao', typeFunction: 'Intro' },
      { text: 'unpredictable market shifts', translation: 'những biến động thị trường khôn lường', typeFunction: 'Keyword' },
      { text: 'demanded that we adopt', translation: 'đòi hỏi chúng tôi phải áp dụng...', typeFunction: 'Logic word' },
      { text: 'innovative digital strategies', translation: 'những chiến lược chuyển đổi số đột phá', typeFunction: 'Fancy word' },
      { text: 'strengthened long-term resilience', translation: 'gia tăng sức bền bỉ dài hạn cho công ty', typeFunction: 'Ending' }
    ]
  },
  {
    hints: [
      { text: 'To be specific', translation: 'nói cụ thể hơn nữa nhé', typeFunction: 'Intro' },
      { text: 'clearance sales promotion', translation: 'đợt khuyến mãi xả hàng quy mô lớn', typeFunction: 'Keyword' },
      { text: 'succeeded mainly because of', translation: 'thành công vang dội chủ yếu nhờ...', typeFunction: 'Logic word' },
      { text: 'persuasive marketing copy', translation: 'nội dung quảng bá đánh trúng tâm lý người mua', typeFunction: 'Fancy word' },
      { text: 'cleared aging warehouse inventory', translation: 'dọn sạch hàng lưu kho lâu ngày trong kho', typeFunction: 'Ending' }
    ]
  },
  {
    hints: [
      { text: 'Take your time', translation: 'cứ thong thả xem xét', typeFunction: 'Intro' },
      { text: 'academic credentials portfolio', translation: 'bộ hồ sơ thành tích học tập', typeFunction: 'Keyword' },
      { text: 'proves how thoroughly I', translation: 'chứng minh việc tôi đã...', typeFunction: 'Logic word' },
      { text: 'mastered economic principles', translation: 'lĩnh hội sâu sắc các nguyên lý kinh tế học', typeFunction: 'Fancy word' },
      { text: 'ready for senior responsibilities', translation: 'hoàn toàn sẵn sàng cho các trọng trách lớn', typeFunction: 'Ending' }
    ]
  },
  {
    hints: [
      { text: 'People often say', translation: 'người ta thường hay nói rằng', typeFunction: 'Intro' },
      { text: 'harmonious office collaboration', translation: 'sự đồng lòng gắn kết trong văn phòng', typeFunction: 'Keyword' },
      { text: 'flourishes only when we', translation: 'chỉ đơm hoa kết trái một khi chúng ta...', typeFunction: 'Logic word' },
      { text: 'cultivate mutual respect', translation: 'biết tôn trọng và lắng nghe lẫn nhau', typeFunction: 'Fancy word' },
      { text: 'elevates overall team morale', translation: 'vực dậy tinh thần cho toàn thể đồng đội', typeFunction: 'Ending' }
    ]
  },
  {
    hints: [
      { text: 'No worries at all', translation: 'hoàn toàn không có gì phải lo', typeFunction: 'Intro' },
      { text: 'temporary budget constraint', translation: 'những hạn chế ngân sách tạm thời', typeFunction: 'Keyword' },
      { text: 'can be managed by', translation: 'đều có thể được tháo gỡ nhờ...', typeFunction: 'Logic word' },
      { text: 'optimizing core resources', translation: 'việc tối ưu hóa các nguồn lực cốt lõi', typeFunction: 'Fancy word' },
      { text: 'delivers all project targets', translation: 'vẫn hoàn thành mọi mục tiêu dự án đề ra', typeFunction: 'Ending' }
    ]
  },
  {
    hints: [
      { text: 'What do you say', translation: 'bạn nghĩ thế nào nếu', typeFunction: 'Intro' },
      { text: 'restructuring accounting team', translation: 'việc tái tổ chức lại bộ phận kế toán', typeFunction: 'Keyword' },
      { text: 'empowers our staff with', translation: 'sẽ trao quyền cho đội ngũ với...', typeFunction: 'Logic word' },
      { text: 'cutting-edge automation tools', translation: 'những công cụ tự động hóa hàng đầu', typeFunction: 'Fancy word' },
      { text: 'doubles monthly operational efficiency', translation: 'nhân đôi hiệu quả vận hành hằng tháng', typeFunction: 'Ending' }
    ]
  },
  {
    hints: [
      { text: 'Shall we conclude', translation: 'chúng ta cùng khép lại bằng việc', typeFunction: 'Intro' },
      { text: 'consistent work experience', translation: 'bề dày kinh nghiệm công tác vững vàng', typeFunction: 'Keyword' },
      { text: 'combined harmoniously with', translation: 'kết hợp hài hòa cùng với...', typeFunction: 'Logic word' },
      { text: 'unrelenting proactive energy', translation: 'nguồn năng lượng chủ động không ngừng nghỉ', typeFunction: 'Fancy word' },
      { text: 'makes me ideal candidate', translation: 'giúp tôi trở thành ứng viên sáng giá nhất', typeFunction: 'Ending' }
    ]
  }
];

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
        ? 'Session 1 • 2 Hints (Rapid Reaction & Airport Reflex)'
        : 'Session 1 • 2 Hints (Rapid Reaction & Self Pitch)',
      hcTotal: 2,
      hintTypes: ['Keyword', 'Ending'],
      itemsData: s1_items
    },
    {
      sessionNumber: 2,
      title: id.includes('01')
        ? 'Session 2 • 3 Hints (Cause-Effect & Travel Situations)'
        : 'Session 2 • 3 Hints (Cause-Effect & Career Context)',
      hcTotal: 3,
      hintTypes: ['Keyword', 'Logic word', 'Ending'],
      itemsData: s2_items
    },
    {
      sessionNumber: 3,
      title: id.includes('01')
        ? 'Session 3 • 4 Hints (Nuance & Travel Mishaps)'
        : 'Session 3 • 4 Hints (Nuance & Professional Skills)',
      hcTotal: 4,
      hintTypes: ['Keyword', 'Logic word', 'Fancy word', 'Ending'],
      itemsData: s3_items
    },
    {
      sessionNumber: 4,
      title: 'Session 4 • 5 Hints (Full Spoken Reflex Flow)',
      hcTotal: 5,
      hintTypes: ['Intro', 'Keyword', 'Logic word', 'Fancy word', 'Ending'],
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
