import { LessonDoc } from '../types';

export const CURRICULUM_CATALOG_LEVEL_A: LessonDoc[] = [
  {
    id: "level_a_day_1",
    level_code: "LEVEL_A",
    day_number: 1,
    course_title: "Level A - Foundation English Chunks",
    lesson_title: "Day 1 - Essential Greetings & Daily Check-ins",
    lesson_type: "Orientation & Foundation",
    total_chunks: 10,
    categories: ["vocab", "phrase", "dialogue", "sentence"],
    created_at: "2026-01-05T00:00:00Z",
    chunks: [
      {
        chunk_id: "a1_01",
        item_number: 1,
        category: "vocab",
        english: "Nice to meet you",
        vietnamese: "Rất vui được gặp bạn",
        speaker: "Speaker A",
        ipa: "/naɪs tuː miːt juː/",
        beat_prosody: "NICE to MEET you"
      },
      {
        chunk_id: "a1_02",
        item_number: 2,
        category: "phrase",
        english: "How's your day going?",
        vietnamese: "Hôm nay của bạn thế nào rồi?",
        speaker: "Speaker B",
        ipa: "/haʊz jɔːr deɪ ˈɡoʊ.ɪŋ/",
        beat_prosody: "How's your DAY GO-ing?"
      },
      {
        chunk_id: "a1_03",
        item_number: 3,
        category: "dialogue",
        english: "I'm doing well, thanks for asking! How about yourself?",
        vietnamese: "Tôi vẫn khỏe, cảm ơn bạn đã hỏi thăm! Còn bạn thì sao?",
        speaker: "Speaker A",
        ipa: "/aɪm ˈduː.ɪŋ wel...",
        beat_prosody: "I'm DO-ing WELL | thanks for ASK-ing | How a-BOUT your-SELF?"
      },
      {
        chunk_id: "a1_04",
        item_number: 4,
        category: "phrase",
        english: "Could you repeat that slowly?",
        vietnamese: "Bạn có thể nhắc lại chậm một chút được không?",
        speaker: "Student",
        ipa: "/kʊd juː rɪˈpiːt...",
        beat_prosody: "Could you re-PEAT that SLOW-ly?"
      },
      {
        chunk_id: "a1_05",
        item_number: 5,
        category: "sentence",
        english: "English is easier when you practice in meaningful chunks.",
        vietnamese: "Tiếng Anh sẽ dễ hơn khi bạn luyện tập theo từng cụm từ có nghĩa.",
        speaker: "Teacher",
        ipa: "/ˈɪŋ.ɡlɪʃ ɪz ˈiː.zi.ər...",
        beat_prosody: "ENG-lish is EAS-i-er | when you PRAC-tice in CHUNKS"
      },
      {
        chunk_id: "a1_06",
        item_number: 6,
        category: "vocab",
        english: "take a short break",
        vietnamese: "nghỉ giải lao một lát",
        speaker: "Teacher",
        ipa: "/teɪk ə ʃɔːrt breɪk/",
        beat_prosody: "TAKE a SHORT BREAK"
      },
      {
        chunk_id: "a1_07",
        item_number: 7,
        category: "phrase",
        english: "See you next time!",
        vietnamese: "Hẹn gặp lại bạn lần tới nhé!",
        speaker: "Native",
        ipa: "/siː juː nekst taɪm/",
        beat_prosody: "SEE you NEXT TIME!"
      },
      {
        chunk_id: "a1_08",
        item_number: 8,
        category: "slang",
        english: "Catch you later!",
        vietnamese: "Gặp lại sau nhé!",
        speaker: "Friend",
        ipa: "/kætʃ juː ˈleɪ.tər/",
        beat_prosody: "CATCH you LA-ter!"
      },
      {
        chunk_id: "a1_09",
        item_number: 9,
        category: "sentence",
        english: "Please make sure to review today's chunks before bedtime.",
        vietnamese: "Hãy nhớ ôn lại các cụm từ hôm nay trước khi đi ngủ nhé.",
        speaker: "Coach",
        ipa: "/pliːz meɪk ʃʊr...",
        beat_prosody: "Please MAKE SURE to re-VIEW to-day's CHUNKS"
      },
      {
        chunk_id: "a1_10",
        item_number: 10,
        category: "review",
        english: "Great job today! You're making solid progress.",
        vietnamese: "Hôm nay làm tốt lắm! Bạn đang tiến bộ rất vững chắc.",
        speaker: "Teacher",
        ipa: "/ɡreɪt dʒɑːb...",
        beat_prosody: "GREAT JOB to-DAY! | You're MA-king PRO-gress"
      }
    ]
  },
  {
    id: "level_a_day_2",
    level_code: "LEVEL_A",
    day_number: 2,
    course_title: "Level A - Foundation English Chunks",
    lesson_title: "Day 2 - Ordering Food & Daily Shopping",
    lesson_type: "Practical Life",
    total_chunks: 10,
    categories: ["phrase", "dialogue", "vocab", "sentence"],
    created_at: "2026-01-06T00:00:00Z",
    chunks: [
      {
        chunk_id: "a2_01",
        item_number: 1,
        category: "phrase",
        english: "Can I get an iced Americano, please?",
        vietnamese: "Cho tôi một ly Americano đá được không ạ?",
        speaker: "Customer",
        ipa: "/kæn aɪ ɡet ən aɪst...",
        beat_prosody: "Can I GET an ICED A-mer-i-CA-no, please?"
      },
      {
        chunk_id: "a2_02",
        item_number: 2,
        category: "dialogue",
        english: "For here or to go? — To go, please.",
        vietnamese: "Dùng tại quán hay mang về ạ? — Mang về giúp tôi nhé.",
        speaker: "Barista",
        ipa: "/fɔːr hɪər ɔːr tuː ɡoʊ...",
        beat_prosody: "For HERE or to GO? | To GO, please."
      },
      {
        chunk_id: "a2_03",
        item_number: 3,
        category: "phrase",
        english: "How much does this cost?",
        vietnamese: "Cái này giá bao nhiêu tiền vậy ạ?",
        speaker: "Customer",
        ipa: "/haʊ mʌtʃ dʌz...",
        beat_prosody: "How MUCH does this COST?"
      },
      {
        chunk_id: "a2_04",
        item_number: 4,
        category: "vocab",
        english: "pay with credit card",
        vietnamese: "thanh toán bằng thẻ tín dụng",
        speaker: "Shopper",
        ipa: "/peɪ wɪð ˈkred.ɪt kɑːrd/",
        beat_prosody: "PAY with CRED-it CARD"
      },
      {
        chunk_id: "a2_05",
        item_number: 5,
        category: "sentence",
        english: "Keep the receipt in case you want to return the item.",
        vietnamese: "Hãy giữ lại hóa đơn phòng khi bạn muốn đổi trả sản phẩm.",
        speaker: "Cashier",
        ipa: "/kiːp ðə rɪˈsiːt...",
        beat_prosody: "KEEP the re-CEIPT | in CASE you want to RE-turn"
      },
      {
        chunk_id: "a2_06",
        item_number: 6,
        category: "slang",
        english: "It's on sale!",
        vietnamese: "Món này đang được giảm giá đấy!",
        speaker: "Friend",
        ipa: "/ɪts ɒn seɪl/",
        beat_prosody: "It's ON SALE!"
      },
      {
        chunk_id: "a2_07",
        item_number: 7,
        category: "phrase",
        english: "Can I try this on?",
        vietnamese: "Tôi có thể mặc thử món đồ này được không?",
        speaker: "Shopper",
        ipa: "/kæn aɪ traɪ ðɪs ɒn/",
        beat_prosody: "Can I TRY THIS ON?"
      },
      {
        chunk_id: "a2_08",
        item_number: 8,
        category: "dialogue",
        english: "The fitting room is right over there.",
        vietnamese: "Phòng thử đồ ở ngay đằng kia ạ.",
        speaker: "Clerk",
        ipa: "/ðə ˈfɪt.ɪŋ ruːm...",
        beat_prosody: "The FIT-ting room is RIGHT O-ver THERE"
      },
      {
        chunk_id: "a2_09",
        item_number: 9,
        category: "phrase",
        english: "Keep the change",
        vietnamese: "Khỏi cần trả lại tiền thừa đâu nhé",
        speaker: "Customer",
        ipa: "/kiːp ðə tʃeɪndʒ/",
        beat_prosody: "KEEP the CHANGE"
      },
      {
        chunk_id: "a2_10",
        item_number: 10,
        category: "review",
        english: "Practice asking for the check with confidence in English.",
        vietnamese: "Hãy luyện tập yêu cầu tính tiền một cách tự tin bằng tiếng Anh.",
        speaker: "Teacher",
        ipa: "/ˈpræk.tɪs ˈæsk.ɪŋ...",
        beat_prosody: "PRAC-tice ASK-ing for the CHECK with CON-fi-dence"
      }
    ]
  },
  {
    id: "level_a_day_3",
    level_code: "LEVEL_A",
    day_number: 3,
    course_title: "Level A - Foundation English Chunks",
    lesson_title: "Day 3 - Asking for Directions & Navigation",
    lesson_type: "Travel & Daily Navigation",
    total_chunks: 10,
    categories: ["phrase", "dialogue", "sentence", "vocab"],
    created_at: "2026-01-07T00:00:00Z",
    chunks: [
      {
        chunk_id: "a3_01",
        item_number: 1,
        category: "phrase",
        english: "Excuse me, how do I get to the bus station?",
        vietnamese: "Xin lỗi, làm thế nào để tôi đi đến bến xe buýt vậy ạ?",
        speaker: "Traveler",
        ipa: "/ɪkˈskjuːz miː haʊ duː aɪ ɡet...",
        beat_prosody: "Ex-CUSE me | how do I GET to the BUS STA-tion?"
      },
      {
        chunk_id: "a3_02",
        item_number: 2,
        category: "dialogue",
        english: "Go straight ahead for two blocks, then turn left at the traffic light.",
        vietnamese: "Đi thẳng qua hai dãy nhà, sau đó rẽ trái ở cột đèn giao thông.",
        speaker: "Local",
        ipa: "/ɡoʊ streɪt əˈhed...",
        beat_prosody: "Go STRAIGHT a-HEAD for two BLOCKS | then TURN LEFT at the LIGHT"
      },
      {
        chunk_id: "a3_03",
        item_number: 3,
        category: "phrase",
        english: "Is it within walking distance?",
        vietnamese: "Chỗ đó có nằm trong khoảng cách đi bộ được không?",
        speaker: "Tourist",
        ipa: "/ɪz ɪt wɪˈðɪn ˈwɔː.kɪŋ ˈdɪs.təns/",
        beat_prosody: "Is it with-IN WALK-ing DIS-tance?"
      },
      {
        chunk_id: "a3_04",
        item_number: 4,
        category: "sentence",
        english: "It takes about ten minutes on foot or five minutes by taxi.",
        vietnamese: "Mất khoảng 10 phút đi bộ hoặc 5 phút nếu đi taxi.",
        speaker: "Local",
        ipa: "/ɪt teɪks əˈbaʊt ten ˈmɪn.ɪts...",
        beat_prosody: "It takes TEN MIN-utes on FOOT | or FIVE MIN-utes by TAX-i"
      },
      {
        chunk_id: "a3_05",
        item_number: 5,
        category: "vocab",
        english: "pedestrian crossing",
        vietnamese: "vạch kẻ sang đường cho người đi bộ",
        speaker: "Guide",
        ipa: "/pəˈdes.tri.ən ˈkrɒs.ɪŋ/",
        beat_prosody: "pe-DES-tri-an CROSS-ing"
      },
      {
        chunk_id: "a3_06",
        item_number: 6,
        category: "phrase",
        english: "You can't miss it!",
        vietnamese: "Bạn không thể đi lạc/nhầm được đâu (nó rất dễ thấy)!",
        speaker: "Local",
        ipa: "/juː kænt mɪs ɪt/",
        beat_prosody: "You CAN'T MISS it!"
      },
      {
        chunk_id: "a3_07",
        item_number: 7,
        category: "dialogue",
        english: "Which bus goes downtown? — Take bus number 12.",
        vietnamese: "Xe buýt nào đi về trung tâm thành phố vậy? — Đi xe số 12 nhé.",
        speaker: "Commuter",
        ipa: "/wɪtʃ bʌs ɡoʊz...",
        beat_prosody: "Which BUS goes DOWN-town? | Take BUS num-ber TWELVE"
      },
      {
        chunk_id: "a3_08",
        item_number: 8,
        category: "idiom",
        english: "around the corner",
        vietnamese: "ở ngay góc cua / rất gần đây thôi",
        speaker: "Native",
        ipa: "/əˈraʊnd ðə ˈkɔːr.nər/",
        beat_prosody: "a-ROUND the COR-ner"
      },
      {
        chunk_id: "a3_09",
        item_number: 9,
        category: "sentence",
        english: "Download an offline map on your smartphone before heading out.",
        vietnamese: "Hãy tải bản đồ ngoại tuyến về điện thoại trước khi bắt đầu ra ngoài.",
        speaker: "Teacher",
        ipa: "/ˌdaʊnˈloʊd ən ˌɒfˈlaɪn mæp...",
        beat_prosody: "Down-load an OFF-line MAP | be-fore HEAD-ing OUT"
      },
      {
        chunk_id: "a3_10",
        item_number: 10,
        category: "review",
        english: "Shadow this route description three times with energetic rhythm.",
        vietnamese: "Hãy nhại lại đoạn hướng dẫn đường này ba lần với nhịp điệu dứt khoát.",
        speaker: "Teacher",
        ipa: "/ˈʃæd.oʊ ðɪs ruːt...",
        beat_prosody: "SHAD-ow this ROUTE de-scrip-tion | THREE TIMES with EN-er-gy"
      }
    ]
  }
];

// Generate Days 4-15 for Level A dynamically to complete full 15-Day curriculum
const LEVEL_A_TOPICS = [
  "Day 4 - Time & Scheduling Appointments",
  "Day 5 - Hobbies & Weekend Activities",
  "Day 6 - Expressing Feelings & Emotions",
  "Day 7 - Health, Doctor Visits & Pharmacy",
  "Day 8 - Weather, Climate & Clothing",
  "Day 9 - Making Phone Calls & Leaving Messages",
  "Day 10 - Hotel Check-in & Travel Essentials",
  "Day 11 - Workplace Communication & Daily Emails",
  "Day 12 - Making Plans with Friends & Invitations",
  "Day 13 - Problem Solving & Asking for Assistance",
  "Day 14 - Expressing Opinions & Polite Disagreement",
  "Day 15 - Final Level A Milestone & Conversation Review"
];

LEVEL_A_TOPICS.forEach((topic, idx) => {
  const dayNum = idx + 4;
  CURRICULUM_CATALOG_LEVEL_A.push({
    id: `level_a_day_${dayNum}`,
    level_code: "LEVEL_A",
    day_number: dayNum,
    course_title: "Level A - Foundation English Chunks",
    lesson_title: topic,
    lesson_type: dayNum === 15 ? "Milestone Review & Speaking Test" : "Standard Interactive Lesson",
    total_chunks: 10,
    categories: ["phrase", "dialogue", "sentence", "vocab", "slang", "review"],
    created_at: `2026-01-${String(dayNum + 7).padStart(2, '0')}T00:00:00Z`,
    chunks: [
      {
        chunk_id: `a${dayNum}_01`,
        item_number: 1,
        category: "vocab",
        english: `master foundational English chunks for ${topic.split(' - ')[1]}`,
        vietnamese: `nắm vững các cụm từ nền tảng cho chủ đề ${topic.split(' - ')[1]}`,
        speaker: "Teacher",
        beat_prosody: `MAS-ter foun-da-tion-al CHUNKS for DAY ${dayNum}`
      },
      {
        chunk_id: `a${dayNum}_02`,
        item_number: 2,
        category: "phrase",
        english: "take it one step at a time",
        vietnamese: "từng bước một, không nóng vội",
        speaker: "Coach",
        beat_prosody: "TAKE it ONE STEP at a TIME"
      },
      {
        chunk_id: `a${dayNum}_03`,
        item_number: 3,
        category: "dialogue",
        english: "What do you suggest we do next? — Let's review the main points.",
        vietnamese: "Bạn gợi ý chúng ta nên làm gì tiếp theo? — Hãy ôn lại các ý chính nhé.",
        speaker: "Speaker A",
        beat_prosody: "What do you sug-GEST we DO NEXT? | Let's re-VIEW the MAIN POINTS"
      },
      {
        chunk_id: `a${dayNum}_04`,
        item_number: 4,
        category: "sentence",
        english: "Clear communication comes from speaking simple chunks with accurate stress.",
        vietnamese: "Giao tiếp rõ ràng đến từ việc nói các cụm từ đơn giản với trọng âm chính xác.",
        speaker: "Teacher",
        beat_prosody: "CLEAR com-mu-ni-ca-tion COMES from sim-ple CHUNKS"
      },
      {
        chunk_id: `a${dayNum}_05`,
        item_number: 5,
        category: "slang",
        english: "You nailed it!",
        vietnamese: "Bạn đã làm chuẩn xác xuất sắc rồi!",
        speaker: "Coach",
        beat_prosody: "You NAILED IT!"
      },
      {
        chunk_id: `a${dayNum}_06`,
        item_number: 6,
        category: "phrase",
        english: "get straight to the point",
        vietnamese: "đi thẳng vào vấn đề chính",
        speaker: "Manager",
        beat_prosody: "GET STRAIGHT to the POINT"
      },
      {
        chunk_id: `a${dayNum}_07`,
        item_number: 7,
        category: "idiom",
        english: "practice makes perfect",
        vietnamese: "có công mài sắt có ngày nên kim / rèn luyện tạo nên sự hoàn hảo",
        speaker: "Proverb",
        beat_prosody: "PRAC-tice MAKES PER-fect"
      },
      {
        chunk_id: `a${dayNum}_08`,
        item_number: 8,
        category: "dialogue",
        english: "Are you ready to practice? — Yes, let's get started right away!",
        vietnamese: "Bạn đã sẵn sàng luyện tập chưa? — Rồi, bắt đầu ngay thôi!",
        speaker: "Student",
        beat_prosody: "Are you READ-y to PRAC-tice? | YES, let's GET START-ed!"
      },
      {
        chunk_id: `a${dayNum}_09`,
        item_number: 9,
        category: "sentence",
        english: "Consistently shadowing native speakers will rapidly boost your vocal fluency.",
        vietnamese: "Thường xuyên nhại giọng người bản xứ sẽ nhanh chóng nâng cao độ trôi chảy của bạn.",
        speaker: "Teacher",
        beat_prosody: "SHAD-ow-ing na-tive SPEAK-ers | BOOSTS your FLU-en-cy"
      },
      {
        chunk_id: `a${dayNum}_10`,
        item_number: 10,
        category: "review",
        english: `Consolidate all chunks learned in Session ${dayNum} with your partner.`,
        vietnamese: `Củng cố toàn bộ các cụm từ đã học trong Buổi ${dayNum} cùng bạn học.`,
        speaker: "Teacher",
        beat_prosody: `CON-sol-i-date all CHUNKS from SES-sion ${dayNum}`
      }
    ]
  });
});
