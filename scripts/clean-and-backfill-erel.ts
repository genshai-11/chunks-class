import * as fs from "fs";
import * as path from "path";
import { CURRICULUM_CATALOG_LEVEL_B_EREL } from "../src/data/levelBErelData";
import { LessonDoc } from "../src/types";

// Clone existing data
const lessons: LessonDoc[] = JSON.parse(JSON.stringify(CURRICULUM_CATALOG_LEVEL_B_EREL));

// 1. Day 3 Vietnamese Translations (29 chunks)
const D3_TRANSLATIONS: Record<number, { en?: string; vi: string }> = {
  1: { en: "What is this movie about?", vi: "Bộ phim này nói về cái gì?" },
  2: { en: "98. Go into labor", vi: "Chuyển dạ / đau đẻ" },
  3: { en: "508. Manslaughter", vi: "Tội ngộ sát" },
  4: { en: "162. Mesh undies", vi: "Quần lót lưới" },
  5: { en: "166. Face towel", vi: "Khăn lau mặt" },
  6: { en: "172. Take meds", vi: "Uống thuốc" },
  7: { en: "175. Sterilize", vi: "Khử trùng / tiệt trùng" },
  8: { en: "183. I’m taking a dump!", vi: "Tôi đang đi vệ sinh nặng!" },
  9: { en: "194. Turnabout", vi: "Sự xoay chuyển tình thế" },
  10: { en: "218. Get pickpocketed", vi: "Bị móc túi" },
  11: { en: "570. No need to mock me!", vi: "Không cần phải mỉa mai tôi đâu!" },
  12: { en: "476. Snatch", vi: "Cướp giật / chộp lấy" },
  13: { en: "25. I’m pissed", vi: "Tôi bực mình / điên máu quá" },
  14: { en: "55. Abortion", vi: "Nạo phá thai" },
  15: { en: "304. Slam on the brakes", vi: "Đạp phanh gấp" },
  16: { en: "324. Deserted", vi: "Hoang vắng / vắng tanh" },
  17: { en: "326. Shortcut", vi: "Đường tắt" },
  18: { en: "337. Transgender surgery", vi: "Phẫu thuật chuyển giới" },
  19: { en: "434. Chubby", vi: "Mũm mĩm / tròn trịa" },
  20: { en: "231. Inconveniencing", vi: "Gây bất tiện / làm phiền" },
  21: { en: "232. Catching up to do", vi: "Có nhiều chuyện cần tâm sự bù" },
  22: { en: "281. Don’t be nosy!", vi: "Đừng có nhiều chuyện / tọc mạch!" },
  23: { en: "302. From afar", vi: "Từ đằng xa" },
  24: { en: "449. Go halfsies", vi: "Cưa đôi tiền / chia đôi" },
  25: { en: "449. Blood oath", vi: "Lời thề máu" },
  26: { en: "452. Food poisoning", vi: "Ngộ độc thực phẩm" },
  27: { en: "464. Greedy", vi: "Tham lam" },
  28: { en: "469. Handcuff", vi: "Còng tay" },
  29: { en: "Thank you for opening your mind", vi: "Cảm ơn bạn đã mở lòng lắng nghe" }
};

// 2. Day 12 Vietnamese Translations (108 chunks)
const D12_TRANSLATIONS: Record<number, string> = {
  1: "Luyện nghe tự do",
  2: "Luyện nghe và nhại giọng",
  3: "Phương pháp nhại giọng Banana",
  4: "Cô Gái Đan Mạch",
  5: "Luyện nghe và nhại giọng",
  6: "Em hẳn phải rất tự hào về anh ấy",
  7: "Anh ấy không phải giỏi nhất, nhưng luôn nằm trong nhóm xuất sắc nhất",
  8: "Chỉ là do anh ấy say rượu thôi mà",
  9: "Trật tự nào! Mọi người đang ngủ đấy",
  10: "Anh có biết mấy giờ rồi không?",
  11: "Em muốn anh mở lời nhẹ nhàng hơn, để em không cảm thấy mình quá dễ dãi",
  12: "Tôi đã hôn anh ấy và cảm giác như đang hôn chính bản thân mình vậy",
  13: "Anh đã thử uống trứng gà sống chưa?",
  14: "Làm đi mà! Vì em được không!",
  15: "Có điều gì em muốn biết sao?",
  16: "Em cứ nghĩ anh đã hoàn thành từ tuần trước rồi chứ",
  17: "Tôi hy vọng chồng cô không phiền lòng",
  18: "Em là vợ anh, em biết tất cả mọi chuyện",
  19: "Kiểu công việc này thực sự không hợp với tôi lắm",
  20: "Anh hoàn toàn có thể trở thành họa sĩ bậc thầy nếu tìm đúng đề tài",
  21: "Tôi không hiểu sao anh có thể vẽ đi vẽ lại cùng một thứ như thế",
  22: "Có một khoảnh khắc tôi đã không còn là chính mình",
  23: "Công việc của tôi là chuyện riêng của tôi",
  24: "Anh có thể giúp em một việc được không?",
  25: "Đây không phải cơ thể của tôi, tôi phải buông bỏ nó thôi",
  26: "Em là người duy nhất thực sự hiểu được con người tôi",
  27: "Vậy chúng ta không cần phải bận tâm về anh ấy nữa",
  28: "Tôi không có ý làm phiền bạn đâu",
  29: "Có điều gì anh muốn tâm sự với em không?",
  30: "Bọn tôi chỉ giả vờ ngạc nhiên để động viên cậu thôi đấy",
  31: "Tôi biết mà. Đó là lý do hai bạn là cặp vợ chồng duy nhất trong bữa tiệc của tôi",
  32: "Không bao giờ có chuyện đó đâu / Không đời nào",
  33: "Đó sẽ là một vụ tai tiếng chấn động đấy",
  34: "Đó là lần đầu tiên chúng tôi gặp nhau, và cô ấy đang ngồi trên cầu thang",
  35: "Khi tôi chào anh ấy, anh ấy thực sự đã đỏ mặt ngượng ngùng",
  36: "Anh ấy quá nhút nhát, nên tôi đã chủ động rủ anh ấy đi chơi",
  37: "Cô ấy đã thuyết phục tôi. Trông cô ấy vô cùng quả quyết",
  38: "Hồi đó anh mặt dày ghê luôn",
  39: "Xin lỗi, em không ngủ được. Em cứ suy nghĩ băn khoăn nhiều chuyện",
  40: "Em nghĩ sao?",
  41: "Xưa nay em lúc nào chẳng xinh. Chỉ là anh chưa bao giờ để ý thôi",
  42: "Sao không cho em thử một điều gì đó khác biệt hơn?",
  43: "Anh đang nghĩ đến ai cụ thể trong đầu sao?",
  44: "Em tự hỏi anh đã đi đâu? Muộn lắm rồi đấy",
  45: "Chúng ta còn nhiều thời gian mà",
  46: "Rồi anh sẽ phải làm quen với điều đó thôi",
  47: "Tại sao họ lại nói như vậy chứ?",
  48: "Cô đang đi cùng ai ở đây à, Lily?",
  49: "Đến bao giờ cậu mới thôi bận tâm xem người khác nghĩ gì?",
  50: "Anh ấy tốt hơn rất nhiều so với những gì người ta nghĩ",
  51: "Đừng quay trở lại đó nữa",
  52: "Tôi không có ý gì xấu đâu, nhưng tôi đã dõi theo cô suốt từ nãy",
  53: "Em thật khác biệt so với phần lớn những cô gái khác",
  54: "Anh đúng là người theo lối cổ hủ / truyền thống rồi",
  55: "Tôi mới chuyển đến thành phố này thôi",
  56: "Có thể anh ấy đang đợi chúng ta đấy",
  57: "Tôi xin lỗi, tôi không hiểu chuyện gì vừa xảy ra nữa",
  58: "Mọi chuyện không đơn giản như vậy đâu",
  59: "Tôi biết là anh đang đùa cợt / chơi trò chơi mà.",
  60: "Em cứ ngỡ là anh sẽ không quay về nữa",
  61: "Tôi chẳng thích tất cả những lời dối trá này chút nào",
  62: "Sao anh không nói thẳng với họ về mối quan hệ của chúng ta đi?",
  63: "Xin lỗi, anh không muốn làm em buồn lòng đâu",
  64: "Anh cần em phải tin tưởng anh",
  65: "Em chẳng biết phải nói gì bây giờ nữa",
  66: "Hai người kết hôn được bao lâu rồi?",
  67: "Tôi nhận ra tôi và bạn có cùng chung một tâm sự",
  68: "Giọng của cô ấy không hẳn là một giọng nói hay",
  69: "Nó sẽ triệt tiêu những điều xấu xa và giữ lại những điều tốt lành",
  70: "Tôi tin chắc là mọi chuyện sẽ kết thúc nhanh thôi",
  71: "Đừng nghĩ về chuyện đó theo cách tiêu cực như vậy chứ",
  72: "Đây chính là khoảnh khắc của em. Em đã chờ đợi quá lâu rồi",
  73: "Chắc chắn là không cần phải vội vàng đâu",
  74: "Anh không thể làm giúp em duy nhất một việc này sao?",
  75: "Ông ta muốn nhốt tôi lại",
  76: "Mọi chuyện rồi sẽ êm xuôi với chúng ta thôi",
  77: "Tôi không còn nhớ nổi khung cảnh ấy nữa rồi",
  78: "Cảm ơn bác sĩ đã chịu gặp tôi",
  79: "Đừng vội cảm ơn, tôi chưa thể nhận làm đại diện cho cô được đâu",
  80: "Những lời đánh giá về buổi triển lãm của em thực sự quá tuyệt vời",
  81: "Nếu anh chịu để em nói, mọi việc sẽ rõ ràng hơn nhiều",
  82: "Ngay sau đó, bố anh ấy đã đuổi tôi ra khỏi nhà",
  83: "Em muốn anh gặp bố của em",
  84: "Có lẽ chúng ta nên gọi món trước mà không cần đợi Tom đâu",
  85: "Tôi có thể quay lại vào lúc khác, nếu cô thấy tiện hơn",
  86: "Em không thể tưởng tượng nổi anh đang hạnh phúc đến nhường nào đâu",
  87: "Thật ra chúng ta đã từng gặp nhau một lần trước đây rồi",
  88: "Nhưng chắc là anh không còn nhớ đâu",
  89: "Dạo này tôi thấy lạnh lẽo trong người quá.",
  90: "Chúng ta từng có những ước mơ thật lớn lao",
  91: "Anh muốn được lắng nghe nhiều hơn về con người em",
  92: "Tôi đã quá quen với thói quen cố hữu của mình rồi",
  93: "Tôi đã sống một mình suốt một thời gian dài rồi.",
  94: "Tôi nghĩ hôn nhân chính là điều duy nhất mà tất cả chúng ta nên hy vọng trong đời",
  95: "Không, Chúa đã tạo ra tôi là một người phụ nữ",
  96: "Thật là đáng tiếc / Thật tiếc quá",
  97: "Tôi có làm điều gì khiến bạn phật lòng không?",
  98: "Em không biết chúng ta có thể tiếp tục như thế này được bao lâu nữa",
  99: "Tôi tự hứa với bản thân sẽ dành trọn vẹn ngày hôm nay để sống như một người đàn ông",
  100: "Tôi e rằng đây không phải là tin tốt lành",
  101: "Em có nghĩ là anh bị điên không?",
  102: "Có những người cho rằng tôi bị điên rồ",
  103: "Tôi đã từng gặp một người đàn ông khác cũng giống như anh",
  104: "Đó là niềm hy vọng duy nhất của tôi",
  105: "Tôi thực sự tin rằng mình có thể giúp đỡ gia đình anh",
  106: "Cô Gái Đan Mạch",
  107: "Phương pháp nhại giọng Banana",
  108: "Nhân vật tâm điểm của ngày hôm nay"
};

// 3. Day 6 English & Vietnamese Mapping (247 chunks)
const D6_MAPPING: Record<number, { en: string; vi: string }> = {
  1: { en: "What is this movie about?", vi: "Bộ phim này nói về cái gì?" },
  2: { en: "Phrases learned today", vi: "Các cụm từ học được hôm nay" },
  3: { en: "I was the one who had to", vi: "Tôi mới là người phải chịu trách nhiệm" },
  4: { en: "I was the one who had to", vi: "Tôi mới là cái đứa phải làm" },
  5: { en: "Where are you taking me?", vi: "Anh đang đưa tôi đi đâu đấy?" },
  6: { en: "Where are you taking me?", vi: "Anh đang chở tôi đi đâu vậy?" },
  7: { en: "What exactly are you trying to do?", vi: "Chính xác thì anh đang tính làm gì?" },
  8: { en: "What exactly are you trying to do?", vi: "Chính xác là anh đang làm cái gì thế?" },
  9: { en: "I'm new to this", vi: "Tôi không quen với việc này lắm" },
  10: { en: "I'm new to this", vi: "Tôi mới làm quen món này thôi" },
  11: { en: "Give me a high five", vi: "Đập tay cái nào" },
  12: { en: "Give me a high five", vi: "Đập tay ăn mừng nào" },
  13: { en: "You'll get used to that", vi: "Anh sẽ quen với điều đó thôi" },
  14: { en: "You'll get used to that", vi: "Rồi anh sẽ dần thích nghi được thôi" },
  15: { en: "That's what I'm afraid of", vi: "Đó chính là điều mà tôi lo sợ" },
  16: { en: "That's what I'm afraid of", vi: "Đó là điều làm tôi thấy sợ nhất" },
  17: { en: "The joke's on me", vi: "Hóa ra chính tôi mới là trò cười" },
  18: { en: "The joke's on me", vi: "Chính tôi mới là đứa ngớ ngẩn làm trò hề" },
  19: { en: "That's the date that...", vi: "Đó chính là cái ngày mà..." },
  20: { en: "That's the date that...", vi: "Đó là ngày định mệnh mà..." },
  21: { en: "I knew you would say that", vi: "Tôi biết ngay anh sẽ nói thế mà" },
  22: { en: "I knew you would say that", vi: "Tôi thừa biết cậu sẽ trả lời như vậy" },
  23: { en: "Phrases learned today", vi: "Các cụm từ học được hôm nay" },
  24: { en: "I meant every word of that", vi: "Tôi hoàn toàn thật lòng với từng lời nói đó" },
  25: { en: "I meant every word of that", vi: "Tôi thành thật với từng từ tôi vừa nói" },
  26: { en: "Way too sentimental right now", vi: "Giờ sến sẩm và ướt át quá rồi đấy" },
  27: { en: "Way too sentimental right now", vi: "Lúc này đang ủy mị quá mức rồi đấy" },
  28: { en: "You're under arrest", vi: "Anh đã bị bắt giữ" },
  29: { en: "You're under arrest", vi: "Anh chính thức bị tra tay vào còng" },
  30: { en: "Cripple my brother", vi: "Làm em trai tôi bị tàn phế" },
  31: { en: "Cripple my brother", vi: "Khiến em tôi phải nằm liệt giường" },
  32: { en: "Watch your head!", vi: "Cẩn thận cái đầu!" },
  33: { en: "Watch your head!", vi: "Coi chừng đụng trúng đầu kìa!" },
  34: { en: "We're gonna be late", vi: "Chúng ta sẽ trễ mất thôi" },
  35: { en: "We're gonna be late", vi: "Chúng ta sắp muộn giờ rồi" },
  36: { en: "Let him settle in", vi: "Cứ để cho anh ấy ổn định chỗ đã" },
  37: { en: "Let him settle in", vi: "Cứ để cho ảnh nghỉ ngơi ổn định đã" },
  38: { en: "Give him time", vi: "Hãy cho cậu ấy thêm chút thời gian" },
  39: { en: "Give him time", vi: "Cho nó chút thời gian để nguôi ngoai" },
  40: { en: "You're the best thing that's ever happened to me", vi: "Em là điều tuyệt vời nhất từng xảy đến trong đời anh" },
  41: { en: "You're the best thing that's ever happened to me", vi: "Em là món quà quý giá nhất mà anh từng có" },
  42: { en: "Phrases learned today", vi: "Các cụm từ học được hôm nay" },
  43: { en: "Things have changed", vi: "Mọi thứ bây giờ đã thay đổi rồi" },
  44: { en: "Things have changed", vi: "Thời thế nay đã đổi thay" },
  45: { en: "Regain his consciousness", vi: "Hồi phục lại ý thức / tỉnh lại" },
  46: { en: "Risk life and limb", vi: "Đánh cược cả tính mạng / liều mạng" },
  47: { en: "It ain't that bad", vi: "Nó không tệ đến mức như vậy đâu" },
  48: { en: "It ain't that bad", vi: "Mọi chuyện không đến nỗi tệ thế đâu" },
  49: { en: "Kick your ass", vi: "Đập cho một trận nhừ tử" },
  50: { en: "Kick your ass", vi: "Đánh bại và cho một trận tơi bời" },
  51: { en: "Watch your mouth", vi: "Ăn nói cho cẩn thận đấy" },
  52: { en: "Watch your mouth", vi: "Cẩn thận cái miệng của cậu" },
  53: { en: "Who did this?", vi: "Ai đã làm ra chuyện này đây?" },
  54: { en: "Who did this?", vi: "Kẻ nào đã gây ra chuyện này?" },
  55: { en: "Take a look at this", vi: "Hãy nhìn qua cái này đi" },
  56: { en: "Take a look at this", vi: "Xem kỹ cái này một chút đi" },
  57: { en: "That's the date that...", vi: "Đó chính là ngày mà..." },
  58: { en: "That's the date that...", vi: "Đó là ngày mà sự việc xảy ra..." },
  59: { en: "They decided he was unnecessary", vi: "Họ quyết định anh ấy không còn cần thiết nữa" },
  60: { en: "They decided he was unnecessary", vi: "Họ cho rằng anh ta không còn giá trị" },
  61: { en: "They decided he was unnecessary", vi: "Họ kết luận ảnh không còn cần thiết nữa" },
  62: { en: "Phrases learned today", vi: "Các cụm từ học được hôm nay" },
  63: { en: "Asset became liability", vi: "Từ chỗ là tài sản quý báu bỗng hóa thành gánh nợ" },
  64: { en: "Asset became liability", vi: "Tài sản đắc lực bỗng biến thành của nợ" },
  65: { en: "That was 6 years ago", vi: "Đó là câu chuyện của 6 năm về trước" },
  66: { en: "That was 6 years ago", vi: "Chuyện đó đã xảy ra từ 6 năm trước rồi" },
  67: { en: "He's been a ghost ever since", vi: "Anh ấy đã sống như một bóng ma kể từ dạo đó" },
  68: { en: "He's been a ghost ever since", vi: "Ảnh đã bặt vô âm tín như bóng ma từ dạo ấy" },
  69: { en: "My official answer", vi: "Câu trả lời chính thức của tôi dành cho anh là..." },
  70: { en: "My official answer", vi: "Lời phúc đáp chính thức của tôi là thế này..." },
  71: { en: "Brother-to-brother", vi: "Như những người huynh đệ ruột thịt" },
  72: { en: "Brother-to-brother", vi: "Tâm sự như hai người anh em với nhau" },
  73: { en: "Anyone messes with you, they mess with me", vi: "Bất kỳ ai dám đụng đến bạn, là đụng đến tôi" },
  74: { en: "Anyone messes with you, they mess with me", vi: "Đứa nào đụng vào anh, là động vào cả gia đình này" },
  75: { en: "Like a fortress", vi: "Kiên cố hệt như một pháo đài" },
  76: { en: "Like a fortress", vi: "Vững chắc như một bức tường thành" },
  77: { en: "Who's after us?", vi: "Ai đang đuổi theo chúng ta vậy?" },
  78: { en: "Who's after us?", vi: "Kẻ nào đang bám đuôi theo dõi chúng ta?" },
  79: { en: "Phrases learned today", vi: "Các cụm từ học được hôm nay" },
  80: { en: "Just watch out for him", vi: "Cứ trông chừng và để mắt tới anh ta" },
  81: { en: "Just watch out for him", vi: "Cứ coi chừng và cảnh giác với hắn" },
  82: { en: "I'll see you in 2 days", vi: "Tôi sẽ gặp lại anh sau hai ngày nữa" },
  83: { en: "I'll see you in 2 days", vi: "Hẹn gặp lại anh trong vòng hai ngày tới" },
  84: { en: "Determine the motive behind it", vi: "Xác định động cơ thực sự đằng sau vụ việc" },
  85: { en: "Determine the motive behind it", vi: "Làm rõ động cơ ẩn giấu phía sau..." },
  86: { en: "A daring attack", vi: "Một cuộc tấn công vô cùng táo bạo" },
  87: { en: "A daring attack", vi: "Một pha đột kích đầy liều lĩnh" },
  88: { en: "This guy is just relentless", vi: "Tên này thực sự dai như đỉa, không biết mệt mỏi" },
  89: { en: "This guy is just relentless", vi: "Thằng này nó lì lợm và không biết bỏ cuộc" },
  90: { en: "Screwed up so many things", vi: "Đã làm hỏng bét quá nhiều chuyện" },
  91: { en: "Screwed up so many things", vi: "Đã phá hỏng rất nhiều kế hoạch" },
  92: { en: "I won't let you down", vi: "Anh sẽ không làm em phải thất vọng đâu" },
  93: { en: "I won't let you down", vi: "Tôi nhất định sẽ không phụ lòng tin của bạn" },
  94: { en: "This dude over here", vi: "Anh bạn đang đứng bên này" },
  95: { en: "This dude over here", vi: "Gã đàn ông bên này này" },
  96: { en: "There wasn't much left", vi: "Chẳng còn lại được bao nhiêu cả" },
  97: { en: "There wasn't much left", vi: "Đống đổ nát chẳng còn lại gì đáng kể" },
  98: { en: "Must have meant something", vi: "Hẳn là điều đó phải mang ý nghĩa gì đó" },
  99: { en: "Must have meant something", vi: "Chắc chắn nó không phải ngẫu nhiên đâu" },
  100: { en: "Phrases learned today", vi: "Các cụm từ học được hôm nay" },
  101: { en: "Your mistake!", vi: "Đó là sai lầm chết người của bạn!" },
  102: { en: "We're from different worlds", vi: "Chúng ta thuộc về hai thế giới hoàn toàn khác nhau" },
  103: { en: "We're from different worlds", vi: "Xuất thân của chúng ta quá khác biệt" },
  104: { en: "Street fight", vi: "Một trận ẩu đả đường phố" },
  105: { en: "Street fight", vi: "Đánh nhau tay đôi kiểu đường phố" },
  106: { en: "Calm down, everyone!", vi: "Bình tĩnh lại nào mọi người!" },
  107: { en: "We're on the same team", vi: "Chúng ta cùng chung một chiến tuyến mà" },
  108: { en: "We're on the same team", vi: "Chúng ta ở cùng một đội mà" },
  109: { en: "When it comes to beer", vi: "Khi nhắc đến chuyện bia bọt" },
  110: { en: "When it comes to beer", vi: "Nói đến chuyện uống bia" },
  111: { en: "You're welcome to join me", vi: "Anh cứ tự nhiên tham gia cùng tôi nếu thích" },
  112: { en: "You're welcome to join me", vi: "Rất hoan nghênh anh cùng nhập cuộc" },
  113: { en: "Mutual friend", vi: "Người bạn chung của cả hai" },
  114: { en: "Let him get away", vi: "Để cho hắn ta tẩu thoát mất" },
  115: { en: "Let him get away", vi: "Để sổng mất tên tội phạm nguy hiểm" },
  116: { en: "I don't give a shit about it", vi: "Tôi cóc thèm bận tâm về cái thứ đó" },
  117: { en: "I don't give a shit about it", vi: "Tôi đếch quan tâm chút nào về chuyện đó" },
  118: { en: "Phrases learned today", vi: "Các cụm từ học được hôm nay" },
  119: { en: "I'm listening", vi: "Tôi vẫn đang chăm chú lắng nghe đây" },
  120: { en: "I'm listening", vi: "Cứ nói đi, tôi đang nghe đây" },
  121: { en: "A wanted terrorist", vi: "Một tên khủng bố đang bị truy nã gắt gao" },
  122: { en: "A wanted terrorist", vi: "Kẻ khủng bố quốc tế bị truy nã đỏ" },
  123: { en: "Known by the name of A", vi: "Được biết đến với bí danh A" },
  124: { en: "Known by the name of A", vi: "Thường gọi bằng mật danh A" },
  125: { en: "Bring it up!", vi: "Chiếu dữ liệu lên màn hình đi!" },
  126: { en: "Bring it up!", vi: "Bật nó lên ngay!" },
  127: { en: "A tracking device", vi: "Một thiết bị định vị theo dõi" },
  128: { en: "A tracking device", vi: "Con chip theo dõi hành trình" },
  129: { en: "In the wrong hands", vi: "Nếu rơi vào tay kẻ xấu" },
  130: { en: "In the wrong hands", vi: "Khi bị kẻ ác lợi dụng" },
  131: { en: "Let me put it to you this way", vi: "Để tôi giải thích cho anh theo cách này nhé" },
  132: { en: "Let me put it to you this way", vi: "Nói một cách dễ hiểu thì thế này..." },
  133: { en: "Like it or not", vi: "Dù anh có thích hay không" },
  134: { en: "Like it or not", vi: "Dù muốn hay không thì sự thật là vậy" },
  135: { en: "There's no place on earth", vi: "Chẳng có nơi nào trên thế giới này" },
  136: { en: "There's no place on earth", vi: "Không một xó xỉnh nào trên trái đất" },
  137: { en: "So let me get this straight", vi: "Vậy để tôi nói thẳng thắn cho rõ ràng nhé" },
  138: { en: "So let me get this straight", vi: "Để tôi tóm tắt lại cho chuẩn xác xem nào" },
  139: { en: "Phrases learned today", vi: "Các cụm từ học được hôm nay" },
  140: { en: "Break into a police station", vi: "Đột nhập vào đồn cảnh sát" },
  141: { en: "You're missing my point", vi: "Anh đang hiểu sai ý chính của tôi rồi" },
  142: { en: "You're missing my point", vi: "Hiểu chệch hoàn toàn thông điệp của tôi" },
  143: { en: "Count me out / I'm out", vi: "Tôi xin rút lui (không tham gia)" },
  144: { en: "What do you got?", vi: "Anh đã nắm được thông tin gì rồi?" },
  145: { en: "What do you got?", vi: "Trong tay anh đang có manh mối gì?" },
  146: { en: "At some point", vi: "Vào một thời điểm nào đó" },
  147: { en: "At some point", vi: "Sớm muộn gì vào lúc nào đấy" },
  148: { en: "Getting on the road", vi: "Bắt đầu lên đường triển khai" },
  149: { en: "Getting on the road", vi: "Bắt đầu xuất kích lên đường" },
  150: { en: "I was impressed with what you have done", vi: "Tôi rất ấn tượng với những gì anh đã làm" },
  151: { en: "I was impressed with what you have done", vi: "Thành quả của anh khiến tôi vô cùng nể phục" },
  152: { en: "You've truly got a gift", vi: "Quả thật cậu có một tài năng thiên bẩm" },
  153: { en: "You've truly got a gift", vi: "Trời phú cho anh một năng khiếu đặc biệt đấy" },
  154: { en: "Extremely appealing", vi: "Vô cùng hấp dẫn và cuốn hút" },
  155: { en: "Extremely appealing", vi: "Cực kỳ kích thích và lôi cuốn" },
  156: { en: "Phrases learned today", vi: "Các cụm từ học được hôm nay" },
  157: { en: "Scared the shit out of me", vi: "Làm tôi sợ chết khiếp luôn đấy" },
  158: { en: "Scared the shit out of me", vi: "Hú hồn, làm tôi sợ đứng tim luôn" },
  159: { en: "Embrace your feelings", vi: "Hãy làm chủ và đối diện với cảm xúc của mình" },
  160: { en: "Embrace your feelings", vi: "Học cách chấp nhận cảm xúc chân thật đó" },
  161: { en: "I'm concerned about it", vi: "Tôi thực sự lo ngại về điều đó" },
  162: { en: "I'm concerned about it", vi: "Tôi có mối quan tâm sâu sắc tới vấn đề này" },
  163: { en: "Chill out, man!", vi: "Bình tĩnh lại đi, anh bạn!" },
  164: { en: "Chill out, man!", vi: "Hạ hỏa đi nào ông bạn!" },
  165: { en: "Could you walk me through it?", vi: "Anh có thể giải thích từng bước cho tôi nghe không?" },
  166: { en: "Could you walk me through it?", vi: "Hướng dẫn chi tiết từng khâu cho tôi với?" },
  167: { en: "Time to move! / Showtime!", vi: "Đến giờ hành động rồi!" },
  168: { en: "We're running out of time", vi: "Chúng ta sắp sửa hết thời gian rồi" },
  169: { en: "We're running out of time", vi: "Thời gian không còn nhiều nữa đâu" },
  170: { en: "That ain't gonna happen!", vi: "Chuyện đó sẽ không bao giờ xảy ra đâu!" },
  171: { en: "That ain't gonna happen!", vi: "Chuyện đó còn khuya mới thành sự thật!" },
  172: { en: "Put on your helmet", vi: "Đội mũ bảo hiểm vào mau" },
  173: { en: "Put on your helmet", vi: "Đội nón bảo hiểm cẩn thận vào" },
  174: { en: "Phrases learned today", vi: "Các cụm từ học được hôm nay" },
  175: { en: "Are your ears ringing?", vi: "Tai anh có bị ù lùng bùng không?" },
  176: { en: "Are your ears ringing?", vi: "Có nghe thấy tiếng vo ve trong tai không?" },
  177: { en: "Experience any of those things", vi: "Từng trải qua bất kỳ cảm giác nào như vậy chưa" },
  178: { en: "Experience any of those things", vi: "Nếm trải bất kỳ cảm giác thót tim nào thế này" },
  179: { en: "Throw me off a cliff", vi: "Quăng tôi xuống vực thẳm" },
  180: { en: "Throw me off a cliff", vi: "Đẩy tôi rơi khỏi vách đá" },
  181: { en: "You barely know us", vi: "Cậu mới chỉ vừa biết mặt tụi này thôi mà" },
  182: { en: "You barely know us", vi: "Cậu hiểu tụi này được bao nhiêu đâu" },
  183: { en: "I don't see a drop of fear among you guys", vi: "Tôi không nhìn thấy một chút sợ sệt nào nơi các bạn cả" },
  184: { en: "I don't see a drop of fear among you guys", vi: "Không một ai trong các bạn tỏ vẻ sợ hãi" },
  185: { en: "She's so off", vi: "Cô ta cư xử kỳ quặc và thô lỗ quá" },
  186: { en: "She's so off", vi: "Tính khí cổ bất thường và ngang ngược thật" },
  187: { en: "You're gonna roll with it?", vi: "Cậu cứ thế thích nghi và xuôi theo thôi à?" },
  188: { en: "You're gonna roll with it?", vi: "Cô vẫn quyết định tiếp tục cuốn theo tình huống này sao?" },
  189: { en: "Everyone's looking for some thrills", vi: "Ai ai cũng đang mải miết kiếm tìm sự kích thích" },
  190: { en: "Everyone's looking for some thrills", vi: "Mọi người đều muốn trải nghiệm cảm giác thăng hoa mạo hiểm" },
  191: { en: "Phrases learned today", vi: "Các cụm từ học được hôm nay" },
  192: { en: "Short-tempered", vi: "Nóng như lửa / nóng tính" },
  193: { en: "Bulletproof", vi: "Chống đạn / bất khả xâm phạm" },
  194: { en: "Am I the only one aroused?", vi: "Chẳng lẽ chỉ có mỗi mình tôi là cảm thấy phấn khích thôi sao?" },
  195: { en: "Am I the only one aroused?", vi: "Có phải mỗi mình tôi là rạo rực hào hứng không?" },
  196: { en: "I'm new to this", vi: "Tôi chưa rành món này lắm đâu" },
  197: { en: "I'm new to this", vi: "Tôi mới chập chững bước vào trò này" },
  198: { en: "It reminds me of something", vi: "Nó gợi cho tôi nhớ về một chuyện xưa" },
  199: { en: "It reminds me of something", vi: "Nó làm tôi liên tưởng đến một kỷ niệm cũ" },
  200: { en: "Move in sync", vi: "Hành động ăn khớp và nhịp nhàng cùng nhau" },
  201: { en: "Move in sync", vi: "Phối hợp tác chiến đồng bộ" },
  202: { en: "Pull this off", vi: "Làm nên chuyện / chốt hạ phi vụ thành công" },
  203: { en: "Pull this off", vi: "Ăn trọn phi vụ này và toàn mạng rút lui" },
  204: { en: "There's nothing sadder than that", vi: "Chẳng có điều gì buồn bã hơn thế nữa" },
  205: { en: "There's nothing sadder than that", vi: "Không có nỗi đau nào xót xa bằng" },
  206: { en: "Punch him in the face", vi: "Đấm thẳng vào mặt hắn ta" },
  207: { en: "Punch him in the face", vi: "Tặng cho nó một cú đấm ngay giữa mặt" },
  208: { en: "You gotta hurry up!", vi: "Cậu phải khẩn trương lên nhanh!" },
  209: { en: "You gotta hurry up!", vi: "Nhanh cái chân lên, không kịp đâu!" },
  210: { en: "Phrases learned today", vi: "Các cụm từ học được hôm nay" },
  211: { en: "Bore me to death", vi: "Làm tôi chán ngắt đến phát điên" },
  212: { en: "Bore me to death", vi: "Chán muốn xỉu luôn vậy đó" },
  213: { en: "Unleash the beast", vi: "Giải phóng con thú hoang bên trong bạn" },
  214: { en: "Unleash the beast", vi: "Khai phá sức mạnh quái vật ẩn sâu" },
  215: { en: "I thought we had an understanding", vi: "Tôi cứ ngỡ là chúng ta đã ngầm hiểu ý nhau rồi chứ" },
  216: { en: "I thought we had an understanding", vi: "Tưởng hai bên đã đạt được sự thấu hiểu từ trước" },
  217: { en: "With all due respect", vi: "Với tất cả sự tôn trọng chân thành" },
  218: { en: "With all due respect", vi: "Thứ lỗi nếu tôi nói thẳng, nhưng..." },
  219: { en: "Can I do this real quick?", vi: "Tôi có thể nói nhanh một chút được không?" },
  220: { en: "Can I do this real quick?", vi: "Cho tôi xin vài giây để làm cái này thật nhanh nhé?" },
  221: { en: "You'll get used to that", vi: "Rồi anh sẽ quen với điều đó thôi mà" },
  222: { en: "You'll get used to that", vi: "Chuyện thường ở huyện, rồi cậu sẽ quen ngay" },
  223: { en: "Dawn's up in two hours", vi: "Bình minh sẽ lên sau hai tiếng nữa" },
  224: { en: "Dawn's up in two hours", vi: "Chỉ còn hai tiếng nữa là trời sáng rạng" },
  225: { en: "Go get changed", vi: "Đi thay đồ nhanh lên đi" },
  226: { en: "Go get changed", vi: "Mau đi thay trang phục khác đi" },
  227: { en: "I'm not leaving you", vi: "Tôi nhất quyết sẽ không bỏ anh lại đâu" },
  228: { en: "I'm not leaving you", vi: "Tôi không bao giờ để anh ở lại một mình" },
  229: { en: "Phrases learned today", vi: "Các cụm từ học được hôm nay" },
  230: { en: "I ain't scared or nothing", vi: "Tôi chẳng có gì phải sợ sệt cả đâu" },
  231: { en: "I ain't scared or nothing", vi: "Bản lĩnh này không biết run sợ là gì" },
  232: { en: "I didn't plan on dying today", vi: "Tôi không có kế hoạch bỏ mạng vào ngày hôm nay" },
  233: { en: "I didn't plan on dying today", vi: "Tôi không có định lên dĩa hôm nay đâu" },
  234: { en: "I'm sorry I didn't tell you before", vi: "Em xin lỗi vì đã không báo trước với anh" },
  235: { en: "I'm sorry I didn't tell you before", vi: "Anh xin lỗi vì đã giấu em chuyện này" },
  236: { en: "Domestic life", vi: "Cuộc sống gia đình êm ấm" },
  237: { en: "Domestic life", vi: "Những tháng ngày bình yên bên mái ấm" },
  238: { en: "Pull over", vi: "Tấp xe vào lề đường ngay" },
  239: { en: "Be mobile enough", vi: "Đủ cơ động để di chuyển linh hoạt" },
  240: { en: "Engage in a high-speed pursuit", vi: "Tham gia vào một cuộc rượt đuổi tốc độ cao" },
  241: { en: "High-speed pursuit", vi: "Cuộc rượt đuổi tốc độ nghẹt thở" },
  242: { en: "Engage in a high-speed pursuit", vi: "Tham gia vào một cuộc truy đuổi tốc độ cao" },
  243: { en: "There has to be another way!", vi: "Chắc chắn phải có cách khác chứ!" },
  244: { en: "There has to be another way!", vi: "Phải còn con đường nào khác chứ!" },
  245: { en: "Where are we heading?", vi: "Chúng ta đang hướng về đâu thế này?" },
  246: { en: "Where are we heading?", vi: "Ta đang đi tới nơi quái quỷ nào vậy?" },
  247: { en: "Thank you for opening your mind", vi: "Cảm ơn bạn đã mở lòng lắng nghe" }
};

// 4. Prompt translations for regular and review days
const PROMPT_TRANSLATIONS: Record<string, string> = {
  // Day 1
  "Rumor has it that Linda is having eyes for Tom the handsome mechanic guy, this is a piece of advice from her best buddy, Morgan.":
    "Nghe đồn Linda đang để mắt tới Tom anh chàng thợ máy đẹp trai, đây là lời khuyên từ Morgan - bạn thân chí cốt của cô ấy.",
  "Let's see how Ducky reacts after a down-to-earth conversation with Linda, her best friend":
    "Cùng xem Ducky phản ứng ra sao sau cuộc nói chuyện thẳng thắn, chân thành với cô bạn thân Linda nhé.",
  // Day 2
  "Have you ever had a thought about how to have a productive and enjoyable work trip? Take a look.":
    "Bạn đã từng nghĩ làm sao để có một chuyến công tác vừa năng suất vừa vui vẻ chưa? Xem thử nhé.",
  "Linda is about to have her first business trip to an unfamiliar place":
    "Linda sắp sửa có chuyến công tác đầu tiên tới một nơi hoàn toàn xa lạ.",
  "The following is a short inspirational speech from a captain to-be of a challenging project.":
    "Dưới đây là bài phát biểu truyền cảm hứng ngắn từ vị thủ lĩnh tương lai của một dự án đầy thử thách.",
  "Sparks really fly whenever this tough Project Manager get together with Morgan, the most important stakeholder.":
    "Tia lửa thực sự bắn tung tóe mỗi khi vị Quản lý dự án khó tính này làm việc với Morgan - bên liên quan quan trọng nhất.",
  // Day 4
  "Is stand up meeting one of your biggest pain points? If yes, check this out.":
    "Họp nhanh đầu ngày (standup) có phải là một trong những nỗi ám ảnh lớn nhất của bạn? Nếu đúng, xem cái này ngay.",
  "What you're gonna see below is a short dialogue taken from a typical stand up meeting.":
    "Những gì bạn sắp thấy dưới đây là một đoạn đối thoại ngắn trích từ một buổi họp standup điển hình.",
  "Not all arguments are bad. In fact, there's a thing called productive argument.":
    "Không phải mọi cuộc tranh cãi đều xấu. Thật ra, có một thứ gọi là tranh luận hiệu quả (productive argument).",
  "It's hard to see eye-to-eye when we talk business, especially when things is in a pickle.":
    "Thật khó để tìm được tiếng nói chung khi bàn chuyện kinh doanh, nhất là khi mọi việc đang lâm vào thế kẹt.",
  // Day 5
  "If you have never been through a customer complaint, this is for you.":
    "Nếu bạn chưa từng trải qua cảm giác bị khách hàng khiếu nại, đoạn này dành cho bạn.",
  "Below, Elise wants to ask for her refund after she's noticed something in her receipt.":
    "Dưới đây, Elise muốn yêu cầu hoàn tiền sau khi cô ấy phát hiện điều bất thường trong hóa đơn.",
  "Here are some tips to help you become the best closer.":
    "Dưới đây là một số mẹo giúp bạn trở thành người chốt đơn cừ khôi nhất.",
  "When the going gets tough, the tough get going. How about you?":
    "Lửa thử vàng, gian nan thử sức - người bản lĩnh luôn vững vàng khi khó khăn. Còn bạn thì sao?",
  // Day 7
  "A stranger has just showed up and undertook a mega project which is nothing but a complete mess.":
    "Một người lạ mặt vừa mới xuất hiện và tiếp quản một đại dự án không khác gì một mớ bòng bong.",
  "What would you do if you were in Lộc's shoes in the context below?":
    "Bạn sẽ làm gì nếu ở trong hoàn cảnh của Lộc dưới đây?",
  "Morgan decided to spill his guts with Kim through a short watercooler chat.":
    "Morgan quyết định trút hết nỗi lòng với Kim qua một cuộc tán gẫu ngắn bên bình nước văn phòng.",
  "The following verbal salary negotiation is a real deal.":
    "Cuộc đàm phán lương trực tiếp dưới đây thực sự là một màn đấu trí đỉnh cao.",
  // Day 8
  "I don't know about you but for me, I can share this pal's views.":
    "Tôi không biết bạn thế nào, nhưng với tôi, tôi hoàn toàn đồng cảm với quan điểm của anh bạn này.",
  "Hosting a year end party sure requires a lot of prep and the following story is no exception.":
    "Tổ chức tiệc tất niên chắc chắn đòi hỏi rất nhiều khâu chuẩn bị, và câu chuyện sau đây cũng không ngoại lệ.",
  "Sometimes you'd better call your boss instead of dropping him a message.":
    "Đôi khi tốt hơn hết bạn nên gọi điện trực tiếp cho sếp thay vì chỉ nhắn một tin nhắn.",
  "Shooting the breeze about law- related stuff with your colleagues is always fun.":
    "Tám chuyện trên trời dưới biển về luật lá với đồng nghiệp lúc nào cũng thú vị.",
  // Day 9
  "Thank for opening your":
    "Cảm ơn bạn đã mở lòng lắng nghe",
  // Day 10
  "This is supposed to be a very first performance review of Linda.":
    "Đây được xem là buổi đánh giá hiệu suất công việc đầu tiên của Linda.",
  "At the end of the day, when in rome, do as the Romans do.":
    "Suy cho cùng, nhập gia thì phải tùy tục thôi.",
  "No one knows what's wrong with their resume until someone points it out.":
    "Không ai biết CV của mình có vấn đề gì cho đến khi có người chỉ tận tay day tận trán.",
  'Not many people know that ATS is the abbreviation for "Applicant Tracking System."':
    'Không nhiều người biết rằng ATS là từ viết tắt của "Applicant Tracking System" (Hệ thống quản lý ứng viên).',
  // Day 11
  "If I were the speaker in the story below, I would try to clear up misunderstandings.":
    "Nếu tôi là người nói trong câu chuyện dưới đây, tôi sẽ cố gắng làm sáng tỏ những hiểu lầm.",
  'Sad but true, Morgan had me at "Before dying of obesity, we would have died of some kind of cancer."':
    'Đau lòng nhưng là sự thật, Morgan đã khiến tôi thấm thía với câu: "Trước khi chết vì béo phì, ta đã chết vì ung thư rồi."',
  "Is it a good idea to become a property speculator at the moment?":
    "Liệu có phải là ý hay nếu trở thành một nhà đầu cơ bất động sản vào thời điểm hiện tại?",
  "The conversation between a chief accountant with his CFO is always appealling.":
    "Cuộc trò chuyện giữa kế toán trưởng và giám đốc tài chính (CFO) lúc nào cũng đầy kịch tính và lôi cuốn.",
  // Day 13
  "I don't know if the sharks are gonna bite but this is a real deal.":
    "Tôi không biết liệu các 'cá mập' có chịu chốt deal không, nhưng thương vụ này thực sự rất triển vọng.",
  "Let's hope that her sales will skyrocket after this show aired.":
    "Hy vọng doanh số của cô ấy sẽ tăng vọt như tên lửa sau khi chương trình này phát sóng.",
  "I gotta say it does look like a piece of advertising for LinkedIn.":
    "Phải công nhận là đoạn này trông không khác gì một bài quảng cáo cho LinkedIn cả.",
  "Like it or not, each of us has to equip ourselves with a premium account from LinkedIn.":
    "Dù thích hay không, mỗi chúng ta đều nên tự trang bị cho mình một tài khoản LinkedIn trả phí (Premium).",
  // Day 14 & 15
  "What is the cool thing to say at your farewell party?":
    "Nói câu gì cho thật ngầu và ý nghĩa trong buổi tiệc chia tay của mình?",
  "I personally believe that Linda really understand exactly what she's doing.":
    "Cá nhân tôi tin rằng Linda thực sự hiểu rất rõ những gì cô ấy đang làm.",
  "Thanks for choosing":
    "Cảm ơn bạn đã đồng hành và lựa chọn"
};

// Standard parts for 14-block regular days
const REGULAR_DAY_PARTS = [
  "Part 1 - Vietnamese Slangs",
  "Part 2 - Vocab Check",
  "Part 3 - Phrase Check",
  "Part 4 - Sentence Check",
  "Part 5 - Monologue",
  "Part 6 - Dialogue",
  "Part 7 - 5s Review",
  "Part 8 - Vietnamese Slangs",
  "Part 9 - Vocab Check",
  "Part 10 - Phrase Check",
  "Part 11 - Sentence Check",
  "Part 12 - Monologue",
  "Part 13 - Dialogue",
  "Part 14 - 5s Review"
];

// Clean speech clutter helper
function stripPedagogicalClutter(text: string): string {
  if (!text) return "";
  let clean = text.trim();
  clean = clean.replace(/^A\.\s*Teamwork\s*B\.\s*Emotion\s*assessment\s*EMOTION\s*/i, "");
  clean = clean.replace(/^REFLEXES\s*A\.\s*Context\s*mp3\s*B\.\s*Back\s*&\s*Forth\s*/i, "");
  clean = clean.replace(/^(?:Speaker\s*)?[AB]\s*[-–—:]\s*/i, "");
  return clean.trim();
}

console.log("Starting data cleaning and part backfilling for 15 lessons in EREL...");

for (const lesson of lessons) {
  // 1. Ensure doc.title = doc.lesson_title
  lesson.title = lesson.lesson_title;
  console.log(`\nProcessing Day ${lesson.day_number}: ${lesson.lesson_title} (${lesson.chunks.length} chunks)...`);

  // 2. Specific lesson fixes & cleanups
  const isFreeListening = [3, 6, 9, 12, 15].includes(lesson.day_number);

  if (!isFreeListening) {
    // Regular Days: Backfill parts using 14-block structure (or 7 blocks for Day 14)
    let curCat = "";
    let blockIndex = -1;

    for (const chunk of lesson.chunks) {
      if (chunk.category !== curCat) {
        curCat = chunk.category;
        blockIndex++;
      }
      chunk.part = REGULAR_DAY_PARTS[blockIndex] || `Part ${blockIndex + 1}`;
    }
  } else {
    // Free Listening Days: Assign Part 1, Part 2, Part 3
    if (lesson.day_number === 3) {
      for (const chunk of lesson.chunks) {
        if (chunk.item_number <= 2) chunk.part = "Part 1 - Scene Introduction";
        else if (chunk.item_number <= 23) chunk.part = "Part 2 - Movie Shadowing";
        else chunk.part = "Part 3 - Rapid Review";
      }
    } else if (lesson.day_number === 6) {
      for (const chunk of lesson.chunks) {
        if (chunk.item_number <= 22) chunk.part = "Part 1 - Scene Introduction";
        else if (chunk.item_number <= 209) chunk.part = "Part 2 - Movie Shadowing";
        else chunk.part = "Part 3 - Rapid Review";
      }
    } else if (lesson.day_number === 9) {
      for (const chunk of lesson.chunks) {
        if (chunk.item_number <= 11) chunk.part = "Part 1 - Scene Introduction";
        else if (chunk.item_number <= 36) chunk.part = "Part 2 - Movie Shadowing";
        else chunk.part = "Part 3 - Rapid Review";
      }
    } else if (lesson.day_number === 12) {
      for (const chunk of lesson.chunks) {
        if (chunk.item_number <= 5) chunk.part = "Part 1 - Scene Introduction";
        else if (chunk.item_number <= 95) chunk.part = "Part 2 - Movie Shadowing";
        else chunk.part = "Part 3 - Rapid Review";
      }
    } else if (lesson.day_number === 15) {
      for (const chunk of lesson.chunks) {
        if (chunk.item_number <= 21) chunk.part = "Part 1 - Scene Introduction";
        else if (chunk.item_number <= 53) chunk.part = "Part 2 - Movie Shadowing";
        else chunk.part = "Part 3 - Rapid Review";
      }
    }
  }

  // 3. Process every chunk in the lesson
  for (const chunk of lesson.chunks) {
    // Fix Speaker Prefix in dialogue lines if present
    const speakerPrefixMatch = chunk.english.match(/^(?:Speaker\s*)?([AB])\s*[-–—:]\s*(.*)$/i);
    if (speakerPrefixMatch) {
      if (!chunk.speaker) chunk.speaker = speakerPrefixMatch[1].toUpperCase();
      chunk.english = speakerPrefixMatch[2].trim();
      if (chunk.beat_prosody) {
        chunk.beat_prosody = chunk.beat_prosody.replace(/^(?:Speaker\s*)?[AB]\s*[-–—:]\s*/i, "").trim();
      }
    }

    // Strip pedagogical clutter
    chunk.english = stripPedagogicalClutter(chunk.english);
    if (chunk.beat_prosody) {
      chunk.beat_prosody = stripPedagogicalClutter(chunk.beat_prosody);
    }

    // Fix 4 corrupted strings
    if (lesson.day_number === 4 && chunk.item_number === 108) {
      chunk.english = "Make a sacrifice / Sacrifice";
      chunk.vietnamese = "Hi sinh";
      chunk.beat_prosody = "Make a sacrifice // Sacrifice";
    } else if (lesson.day_number === 5 && chunk.item_number === 22) {
      chunk.english = "Purchase / Buy / get / shop / acquire";
      chunk.vietnamese = "Mua";
      chunk.beat_prosody = "Purchase // Buy // get // shop // acquire";
    } else if (lesson.day_number === 8 && chunk.item_number === 8) {
      chunk.english = "While / Meanwhile / in the meantime / whereas";
      chunk.vietnamese = "Trong khi";
      chunk.beat_prosody = "While // Meanwhile // in the meantime // whereas";
    } else if (lesson.day_number === 10 && chunk.item_number === 11) {
      chunk.english = "Go through / Skim through / scan through";
      chunk.vietnamese = "Xem qua";
      chunk.beat_prosody = "Go through // Skim through // scan through";
    }

    // Fix Day 7 Chunk 77 split
    if (lesson.day_number === 7 && chunk.item_number === 77) {
      chunk.english = "What would you do if you were in Lộc's shoes in the context below?";
      chunk.vietnamese = "Bạn sẽ làm gì nếu ở trong hoàn cảnh của Lộc dưới đây?";
      chunk.beat_prosody = "What would you do if you were in Lộc's shoes in the context below?";
    }

    // Apply Day 3 Translations
    if (lesson.day_number === 3 && D3_TRANSLATIONS[chunk.item_number]) {
      const trans = D3_TRANSLATIONS[chunk.item_number];
      if (trans.en) chunk.english = trans.en;
      chunk.vietnamese = trans.vi;
      if (!chunk.beat_prosody || chunk.beat_prosody === chunk.english) {
        chunk.beat_prosody = chunk.english;
      }
    }

    // Apply Day 12 Translations
    if (lesson.day_number === 12 && D12_TRANSLATIONS[chunk.item_number]) {
      chunk.vietnamese = D12_TRANSLATIONS[chunk.item_number];
    }

    // Apply Day 6 Mapping
    if (lesson.day_number === 6 && D6_MAPPING[chunk.item_number]) {
      const map = D6_MAPPING[chunk.item_number];
      chunk.english = map.en;
      chunk.vietnamese = map.vi;
      chunk.beat_prosody = map.en;
    }

    // Check prompt translations lookup
    if ((!chunk.vietnamese || !chunk.vietnamese.trim()) && PROMPT_TRANSLATIONS[chunk.english]) {
      chunk.vietnamese = PROMPT_TRANSLATIONS[chunk.english];
    }

    // Sync beat_prosody if empty or missing
    if (!chunk.beat_prosody) {
      chunk.beat_prosody = chunk.english;
    }
  }

  // Update total chunks
  lesson.total_chunks = lesson.chunks.length;
}

// 5. Verification Gate
console.log("\n==================================================");
console.log("RUNNING VERIFICATION CHECKS ACROSS ALL 15 LESSONS");
console.log("==================================================");

let hasErrors = false;
let totalChunksCount = 0;

for (const lesson of lessons) {
  totalChunksCount += lesson.chunks.length;
  if (!lesson.title || lesson.title !== lesson.lesson_title) {
    console.error(`❌ Lesson ${lesson.id} has invalid title: ${lesson.title}`);
    hasErrors = true;
  }

  for (const chunk of lesson.chunks) {
    if (!chunk.english || !chunk.english.trim()) {
      console.error(`❌ Empty english in ${lesson.id} item ${chunk.item_number}`);
      hasErrors = true;
    }
    if (!chunk.vietnamese || !chunk.vietnamese.trim()) {
      console.error(`❌ Empty vietnamese in ${lesson.id} item ${chunk.item_number}: ${chunk.english}`);
      hasErrors = true;
    }
    if (!chunk.part || !chunk.part.trim()) {
      console.error(`❌ Empty part in ${lesson.id} item ${chunk.item_number}`);
      hasErrors = true;
    }
    if (
      chunk.english.includes("A. Teamwork") ||
      chunk.english.includes("Emotion assessment") ||
      chunk.english.includes("REFLEXES A. Context")
    ) {
      console.error(`❌ Residual clutter in ${lesson.id} item ${chunk.item_number}: ${chunk.english}`);
      hasErrors = true;
    }
    if (
      chunk.beat_prosody &&
      (chunk.beat_prosody.includes("A. Teamwork") ||
        chunk.beat_prosody.includes("Emotion assessment") ||
        chunk.beat_prosody.includes("REFLEXES A. Context"))
    ) {
      console.error(`❌ Residual clutter in beat_prosody ${lesson.id} item ${chunk.item_number}`);
      hasErrors = true;
    }
  }
}

if (hasErrors) {
  console.error("\n❌ Verification FAILED! Aborting file write.");
  process.exit(1);
}

console.log(`✅ All verification checks PASSED! Total chunks: ${totalChunksCount}`);
console.log("Writing updated CURRICULUM_CATALOG_LEVEL_B_EREL to src/data/levelBErelData.ts...");

const targetPath = path.resolve(__dirname, "../src/data/levelBErelData.ts");
const fileContent = `import { LessonDoc } from "../types";

export const CURRICULUM_CATALOG_LEVEL_B_EREL: LessonDoc[] = ${JSON.stringify(lessons, null, 2)};
`;

fs.writeFileSync(targetPath, fileContent, "utf-8");
console.log(`✅ Successfully written to ${targetPath}`);
