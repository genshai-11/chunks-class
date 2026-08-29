import { LessonDoc, ChunkItem } from '../types';

export const CURRICULUM_CATALOG_LEVEL_B: LessonDoc[] = [
  {
    id: "level_b_day_1",
    level_code: "B",
    day_number: 1,
    lesson_title: "Day 1 - Lesson 0 Orientation & Survival Phrases",
    lesson_type: "Orientation",
    total_chunks: 12,
    categories: ["vocab", "phrase", "sentence", "review"],
    created_at: "2026-01-10T00:00:00Z",
    chunks: [
      {
        chunk_id: "b1_01",
        item_number: 1,
        category: "vocab",
        english: "Chunking method",
        vietnamese: "Phương pháp học theo cụm từ tự nhiên",
        speaker: "Teacher",
        ipa: "/ˈtʃʌŋ.kɪŋ ˈmeθ.əd/",
        beat_prosody: "CHUNK-ing ME-thod"
      },
      {
        chunk_id: "b1_02",
        item_number: 2,
        category: "phrase",
        english: "get the hang of it",
        vietnamese: "dần nắm bắt và quen thuộc với điều gì",
        speaker: "Native",
        ipa: "/ɡet ðə hæŋ əv ɪt/",
        beat_prosody: "get the HANG of it"
      },
      {
        chunk_id: "b1_03",
        item_number: 3,
        category: "sentence",
        english: "Once you master these chunks, speaking English becomes second nature.",
        vietnamese: "Một khi bạn nắm vững các cụm từ này, việc nói tiếng Anh sẽ trở thành phản xạ tự nhiên.",
        speaker: "Coach",
        ipa: "/wʌns juː ˈmæs.tər ðiːz tʃʌŋks...",
        beat_prosody: "Once you MAS-ter these CHUNKS | speaking English becomes SECOND NA-ture"
      },
      {
        chunk_id: "b1_04",
        item_number: 4,
        category: "phrase",
        english: "hit the ground running",
        vietnamese: "bắt đầu ngay lập tức với đầy đủ năng lượng và hiệu quả",
        speaker: "Native",
        ipa: "/hɪt ðə ɡraʊnd ˈrʌn.ɪŋ/",
        beat_prosody: "hit the GROUND RUN-ning"
      },
      {
        chunk_id: "b1_05",
        item_number: 5,
        category: "dialogue",
        english: "Could you please speak a little slower so I can catch up?",
        vietnamese: "Bạn có thể nói chậm lại một chút để tôi theo kịp được không?",
        speaker: "Student",
        ipa: "/kʊd juː pliːz spiːk...",
        beat_prosody: "Could you please SPEAK a little SLOW-er | so I can CATCH UP?"
      },
      {
        chunk_id: "b1_06",
        item_number: 6,
        category: "grammar",
        english: "I am used to speaking in chunks rather than translating word by word.",
        vietnamese: "Tôi đã quen với việc nói theo cụm thay vì dịch từng từ một.",
        speaker: "Teacher",
        ipa: "/aɪ æm juːzd tuː...",
        beat_prosody: "I am USED to SPEAK-ing in CHUNKS | rather than trans-LAT-ing WORD by WORD"
      },
      {
        chunk_id: "b1_07",
        item_number: 7,
        category: "slang",
        english: "No biggie!",
        vietnamese: "Chuyện nhỏ, không sao đâu!",
        speaker: "Native",
        ipa: "/noʊ ˈbɪɡ.i/",
        beat_prosody: "No BIG-gie!"
      },
      {
        chunk_id: "b1_08",
        item_number: 8,
        category: "idiom",
        english: "break the ice",
        vietnamese: "phá vỡ bầu không khí ngượng ngùng ban đầu",
        speaker: "Native",
        ipa: "/breɪk ði aɪs/",
        beat_prosody: "break the ICE"
      },
      {
        chunk_id: "b1_09",
        item_number: 9,
        category: "verb",
        english: "kick off the session",
        vietnamese: "bắt đầu/khởi động buổi học",
        speaker: "Teacher",
        ipa: "/kɪk ɔːf ðə ˈseʃ.ən/",
        beat_prosody: "KICK off the SES-sion"
      },
      {
        chunk_id: "b1_10",
        item_number: 10,
        category: "sentence",
        english: "Don't worry about making mistakes; accuracy comes with repetition.",
        vietnamese: "Đừng lo lắng về việc mắc lỗi; sự chuẩn xác đến từ việc lặp lại liên tục.",
        speaker: "Coach",
        ipa: "/doʊnt ˈwʌr.i əˈbaʊt...",
        beat_prosody: "Don't WOR-ry about making mis-TAKES | AC-curacy comes with rep-e-TI-tion"
      },
      {
        chunk_id: "b1_11",
        item_number: 11,
        category: "word_family",
        english: "fluent - fluency - fluently",
        vietnamese: "trôi chảy (tính từ) - sự trôi chảy (danh từ) - một cách trôi chảy (trạng từ)",
        speaker: "Teacher",
        ipa: "/ˈfluː.ənt - ˈfluː.ən.si - ˈfluː.ənt.li/",
        beat_prosody: "FLU-ent | FLU-en-cy | FLU-ent-ly"
      },
      {
        chunk_id: "b1_12",
        item_number: 12,
        category: "review",
        english: "Repeat after me with full vocal projection and natural rhythm.",
        vietnamese: "Lặp lại theo tôi với âm lượng vang và nhịp điệu tự nhiên.",
        speaker: "Teacher",
        ipa: "/rɪˈpiːt ˈæf.tər miː...",
        beat_prosody: "re-PEAT after ME | with full VO-cal pro-JEC-tion and NAT-u-ral RHYTHM"
      }
    ]
  },
  {
    id: "level_b_day_2",
    level_code: "B",
    day_number: 2,
    lesson_title: "Day 2 - Lesson 1 How to survive & Wandering",
    lesson_type: "Standard Lesson",
    total_chunks: 10,
    categories: ["phrase", "sentence", "dialogue", "slang"],
    created_at: "2026-01-11T00:00:00Z",
    chunks: [
      {
        chunk_id: "b2_01",
        item_number: 1,
        category: "phrase",
        english: "wander around the city center",
        vietnamese: "đi dạo quanh trung tâm thành phố",
        speaker: "Speaker A",
        ipa: "/ˈwɑːn.dər əˈraʊnd ðə ˈsɪt.i ˈsen.tər/",
        beat_prosody: "WAN-der around the CIT-y CEN-ter"
      },
      {
        chunk_id: "b2_02",
        item_number: 2,
        category: "dialogue",
        english: "Excuse me, I seem to be completely lost. Where is the nearest metro station?",
        vietnamese: "Xin lỗi, hình như tôi bị lạc đường hoàn toàn rồi. Ga tàu điện ngầm gần nhất ở đâu ạ?",
        speaker: "Speaker B",
        ipa: "/ɪkˈskjuːz miː...",
        beat_prosody: "Ex-CUSE me | I seem to be com-PLETE-ly LOST | Where is the NEAR-est MET-ro STA-tion?"
      },
      {
        chunk_id: "b2_03",
        item_number: 3,
        category: "phrase",
        english: "grab a quick bite to eat",
        vietnamese: "tìm món gì ăn nhanh gọn",
        speaker: "Native",
        ipa: "/ɡræb ə kwɪk baɪt tuː iːt/",
        beat_prosody: "GRAB a quick BITE to eat"
      },
      {
        chunk_id: "b2_04",
        item_number: 4,
        category: "sentence",
        english: "It is located just right around the corner across from the convenience store.",
        vietnamese: "Nó nằm ngay góc phố đối diện với cửa hàng tiện lợi.",
        speaker: "Local",
        ipa: "/ɪt ɪz loʊˈkeɪ.tɪd...",
        beat_prosody: "It is lo-CAT-ed | just right around the COR-ner | a-CROSS from the store"
      },
      {
        chunk_id: "b2_05",
        item_number: 5,
        category: "slang",
        english: "I'm starving to death!",
        vietnamese: "Tôi đói rã ruột / đói sắp lả đi rồi!",
        speaker: "Speaker A",
        ipa: "/aɪm ˈstɑːr.vɪŋ tuː deθ/",
        beat_prosody: "I'm STARV-ing to DEATH!"
      },
      {
        chunk_id: "b2_06",
        item_number: 6,
        category: "vocab",
        english: "pedestrian walkway",
        vietnamese: "lối đi bộ dành riêng cho người đi bộ",
        speaker: "Guide",
        ipa: "/pəˈdes.tri.ən ˈwɔːk.weɪ/",
        beat_prosody: "pe-DES-tri-an WALK-way"
      },
      {
        chunk_id: "b2_07",
        item_number: 7,
        category: "sentence",
        english: "Keep walking straight until you see a roundabout with a clock tower.",
        vietnamese: "Cứ tiếp tục đi thẳng cho đến khi bạn thấy bùng binh có tháp đồng hồ.",
        speaker: "Local",
        ipa: "/kiːp ˈwɔː.kɪŋ streɪt...",
        beat_prosody: "Keep WALK-ing STRAIGHT | un-TIL you see a ROUND-about | with a CLOCK TOW-er"
      },
      {
        chunk_id: "b2_08",
        item_number: 8,
        category: "phrase",
        english: "on a shoestring budget",
        vietnamese: "với ngân sách vô cùng eo hẹp / tiết kiệm",
        speaker: "Backpacker",
        ipa: "/ɒn ə ˈʃuː.strɪŋ ˈbʌdʒ.ɪt/",
        beat_prosody: "on a SHOE-string BUD-get"
      },
      {
        chunk_id: "b2_09",
        item_number: 9,
        category: "idiom",
        english: "off the beaten track",
        vietnamese: "ở nơi hoang sơ, ít người biết đến, xa chốn đông người",
        speaker: "Traveler",
        ipa: "/ɔːf ðə ˈbiː.tən træk/",
        beat_prosody: "off the BEA-ten TRACK"
      },
      {
        chunk_id: "b2_10",
        item_number: 10,
        category: "sentence",
        english: "Always keep a digital copy of your passport on your phone for safety.",
        vietnamese: "Hãy luôn lưu một bản sao hộ chiếu kỹ thuật số trong điện thoại để đảm bảo an toàn.",
        speaker: "Teacher",
        ipa: "/ˈɔːl.weɪz kiːp ə ˈdɪdʒ.ə.təl...",
        beat_prosody: "AL-ways keep a DIG-i-tal COP-y of your PASS-port | on your PHONE for SAFE-ty"
      }
    ]
  },
  {
    id: "level_b_day_3",
    level_code: "B",
    day_number: 3,
    lesson_title: "Day 3 - Lesson 2 Tell Me About Yourself & Aspirations",
    lesson_type: "Standard Lesson",
    total_chunks: 10,
    categories: ["monologue", "phrase", "sentence", "grammar"],
    created_at: "2026-01-12T00:00:00Z",
    chunks: [
      {
        chunk_id: "b3_01",
        item_number: 1,
        category: "phrase",
        english: "have a passion for technology",
        vietnamese: "có niềm đam mê mãnh liệt đối với công nghệ",
        speaker: "Candidate",
        ipa: "/hæv ə ˈpæʃ.ən fɔːr tekˈnɑː.lə.dʒi/",
        beat_prosody: "have a PAS-sion for tech-NOL-o-gy"
      },
      {
        chunk_id: "b3_02",
        item_number: 2,
        category: "monologue",
        english: "I have over four years of hands-on experience in project management and team leadership.",
        vietnamese: "Tôi có hơn 4 năm kinh nghiệm thực chiến trong việc quản lý dự án và dẫn dắt đội nhóm.",
        speaker: "Candidate",
        ipa: "/aɪ hæv ˈoʊ.vər fɔːr jɪərz...",
        beat_prosody: "I have O-ver FOUR YEARS | of HANDS-ON ex-PE-rience | in PRO-ject MAN-age-ment"
      },
      {
        chunk_id: "b3_03",
        item_number: 3,
        category: "phrase",
        english: "thrive under pressure",
        vietnamese: "làm việc rất tốt và phát huy năng lực dưới áp lực cao",
        speaker: "Candidate",
        ipa: "/θraɪv ˈʌn.dər ˈpreʃ.ər/",
        beat_prosody: "THRIVE un-der PRES-sure"
      },
      {
        chunk_id: "b3_04",
        item_number: 4,
        category: "sentence",
        english: "My primary strength lies in my ability to communicate complex ideas clearly.",
        vietnamese: "Điểm mạnh cốt lõi của tôi nằm ở khả năng truyền đạt các ý tưởng phức tạp một cách rõ ràng.",
        speaker: "Candidate",
        ipa: "/maɪ ˈpraɪ.mer.i streŋθ...",
        beat_prosody: "My PRI-ma-ry STRENGTH lies | in my a-BIL-i-ty to com-MU-ni-cate CLEAR-ly"
      },
      {
        chunk_id: "b3_05",
        item_number: 5,
        category: "grammar",
        english: "What I would really like to do is step into a managerial position in the next two years.",
        vietnamese: "Điều tôi thực sự mong muốn làm là đảm nhận vị trí quản lý trong vòng hai năm tới.",
        speaker: "Candidate",
        ipa: "/wʌt aɪ wʊd ˈrɪə.li laɪk...",
        beat_prosody: "What I would REAL-ly LIKE to do | is STEP IN-TO a man-a-GE-ri-al po-SI-tion"
      },
      {
        chunk_id: "b3_06",
        item_number: 6,
        category: "vocab",
        english: "career trajectory",
        vietnamese: "lộ trình và định hướng phát triển sự nghiệp",
        speaker: "Interviewer",
        ipa: "/kəˈrɪər trəˈdʒek.tər.i/",
        beat_prosody: "ca-REER tra-JEC-to-ry"
      },
      {
        chunk_id: "b3_07",
        item_number: 7,
        category: "phrase",
        english: "align with company values",
        vietnamese: "đồng điệu và phù hợp với giá trị cốt lõi của công ty",
        speaker: "Candidate",
        ipa: "/əˈlaɪn wɪð ˈkʌm.pə.ni ˈvæl.juːz/",
        beat_prosody: "a-LIGN with COM-pa-ny VAL-ues"
      },
      {
        chunk_id: "b3_08",
        item_number: 8,
        category: "idiom",
        english: "go the extra mile",
        vietnamese: "nỗ lực vượt bậc, làm nhiều hơn mức được kỳ vọng",
        speaker: "Manager",
        ipa: "/ɡoʊ ði ˈek.strə maɪl/",
        beat_prosody: "go the EX-tra MILE"
      },
      {
        chunk_id: "b3_09",
        item_number: 9,
        category: "sentence",
        english: "I am constantly seeking opportunities to upskill and broaden my horizon.",
        vietnamese: "Tôi không ngừng tìm kiếm các cơ hội để nâng cao kỹ năng và mở rộng tầm nhìn của mình.",
        speaker: "Candidate",
        ipa: "/aɪ æm ˈkɑːn.stənt.li ˈsiː.kɪŋ...",
        beat_prosody: "I am CON-stant-ly SEEK-ing op-por-TU-ni-ties | to UP-skill and BROAD-en my ho-RI-zon"
      },
      {
        chunk_id: "b3_10",
        item_number: 10,
        category: "review",
        english: "Keep your answers structured using the STAR method: Situation, Task, Action, Result.",
        vietnamese: "Hãy giữ câu trả lời có cấu trúc theo phương pháp STAR: Tình huống, Nhiệm vụ, Hành động, Kết quả.",
        speaker: "Teacher",
        ipa: "/kiːp jɔːr ˈæn.sərz ˈstrʌk.tʃərd...",
        beat_prosody: "Keep your AN-swers STRUC-tured | using the STAR ME-thod"
      }
    ]
  },
  {
    id: "level_b_day_4",
    level_code: "B",
    day_number: 4,
    lesson_title: "Day 4 - Free Talk 1 & Lesson 3 I'm a hitchhiker",
    lesson_type: "Free Talk & Standard Lesson",
    total_chunks: 10,
    categories: ["slang", "dialogue", "phrase", "sentence"],
    created_at: "2026-01-13T00:00:00Z",
    chunks: [
      {
        chunk_id: "b4_01",
        item_number: 1,
        category: "phrase",
        english: "thumb a ride along the highway",
        vietnamese: "vẫy xe đi nhờ dọc theo đường cao tốc",
        speaker: "Hitchhiker",
        ipa: "/θʌm ə raɪd...",
        beat_prosody: "THUMB a RIDE | a-LONG the HIGH-way"
      },
      {
        chunk_id: "b4_02",
        item_number: 2,
        category: "dialogue",
        english: "Where are you headed? I can drop you off at the next intersection if that works.",
        vietnamese: "Bạn đang đi về hướng nào? Tôi có thể thả bạn ở ngã tư kế tiếp nếu tiện.",
        speaker: "Driver",
        ipa: "/wer ɑːr juː ˈhed.ɪd...",
        beat_prosody: "Where are you HEAD-ed? | I can DROP you OFF | at the NEXT in-ter-SEC-tion"
      },
      {
        chunk_id: "b4_03",
        item_number: 3,
        category: "slang",
        english: "That would be a lifesaver!",
        vietnamese: "Thế thì cứu tinh cho tôi quá rồi!",
        speaker: "Hitchhiker",
        ipa: "/ðæt wʊd biː ə ˈlaɪfˌseɪ.vər/",
        beat_prosody: "That would be a LIFE-sa-ver!"
      },
      {
        chunk_id: "b4_04",
        item_number: 4,
        category: "sentence",
        english: "Hitchhiking taught me how to strike up spontaneous conversations with total strangers.",
        vietnamese: "Việc đi nhờ xe đã dạy tôi cách bắt đầu những cuộc trò chuyện ngẫu hứng với người lạ hoàn toàn.",
        speaker: "Narrator",
        ipa: "/ˈhɪtʃ.haɪ.kɪŋ tɔːt miː...",
        beat_prosody: "Hitch-hi-king TAUGHT me | how to STRIKE UP spon-TA-neous con-ver-SA-tions"
      },
      {
        chunk_id: "b4_05",
        item_number: 5,
        category: "phrase",
        english: "hop in the front seat",
        vietnamese: "nhảy lên ghế trước ngồi",
        speaker: "Driver",
        ipa: "/hɒp ɪn ðə frʌnt siːt/",
        beat_prosody: "HOP in the FRONT SEAT"
      },
      {
        chunk_id: "b4_06",
        item_number: 6,
        category: "idiom",
        english: "take a leap of faith",
        vietnamese: "dũng cảm chấp nhận rủi ro và tin tưởng vào điều tốt đẹp",
        speaker: "Coach",
        ipa: "/teɪk ə liːp əv feɪθ/",
        beat_prosody: "take a LEAP of FAITH"
      },
      {
        chunk_id: "b4_07",
        item_number: 7,
        category: "verb",
        english: "pull over to the side of the road",
        vietnamese: "tấp xe vào lề đường",
        speaker: "Driver",
        ipa: "/pʊl ˈoʊ.vər tuː...",
        beat_prosody: "PULL O-ver to the SIDE of the ROAD"
      },
      {
        chunk_id: "b4_08",
        item_number: 8,
        category: "sentence",
        english: "Whenever you travel solo, trust your gut instinct about unfamiliar situations.",
        vietnamese: "Bất cứ khi nào bạn đi du lịch một mình, hãy tin vào trực giác của mình trước những tình huống lạ lẫm.",
        speaker: "Teacher",
        ipa: "/wenˈev.ər juː ˈtræv.əl ˈsoʊ.loʊ...",
        beat_prosody: "Trust your GUT IN-stinct | a-BOUT un-fa-MIL-iar sit-u-A-tions"
      },
      {
        chunk_id: "b4_09",
        item_number: 9,
        category: "word_family",
        english: "spontaneous - spontaneity - spontaneously",
        vietnamese: "tự phát (tính từ) - tính tự phát (danh từ) - một cách tự phát (trạng từ)",
        speaker: "Teacher",
        ipa: "/spɒnˈteɪ.ni.əs...",
        beat_prosody: "spon-TA-ne-ous | spon-ta-NE-i-ty | spon-TA-ne-ous-ly"
      },
      {
        chunk_id: "b4_10",
        item_number: 10,
        category: "review",
        english: "Now pair up with your partner and practice the driver-hitchhiker dialogue.",
        vietnamese: "Bây giờ hãy bắt cặp với bạn cùng bàn và luyện tập đoạn hội thoại giữa tài xế và người xin đi nhờ.",
        speaker: "Teacher",
        ipa: "/naʊ per ʌp...",
        beat_prosody: "Pair UP with your PART-ner | and PRAC-tice the DI-a-logue"
      }
    ]
  },
  {
    id: "level_b_day_5",
    level_code: "B",
    day_number: 5,
    lesson_title: "Day 5 - Lesson 3 Rendezvous & Lesson 4 Food and Culinary Culture",
    lesson_type: "Standard Lesson",
    total_chunks: 10,
    categories: ["vocab", "dialogue", "phrase", "sentence"],
    created_at: "2026-01-14T00:00:00Z",
    chunks: [
      {
        chunk_id: "b5_01",
        item_number: 1,
        category: "phrase",
        english: "set up a rendezvous point",
        vietnamese: "thiết lập điểm hẹn gặp mặt",
        speaker: "Speaker A",
        ipa: "/set ʌp ə ˈrɑːn.deɪ.vuː pɔɪnt/",
        beat_prosody: "SET UP a RON-de-vous POINT"
      },
      {
        chunk_id: "b5_02",
        item_number: 2,
        category: "dialogue",
        english: "Could we book a table for four at seven-thirty this Friday evening?",
        vietnamese: "Chúng tôi có thể đặt bàn 4 người vào lúc 7 giờ 30 tối thứ Sáu này được không?",
        speaker: "Customer",
        ipa: "/kʊd wiː bʊk ə ˈteɪ.bəl...",
        beat_prosody: "Could we BOOK a TA-ble for FOUR | at SEV-en THIR-ty this FRI-day EVE-ning?"
      },
      {
        chunk_id: "b5_03",
        item_number: 3,
        category: "vocab",
        english: "culinary delicacy",
        vietnamese: "món ăn đặc sản tinh hoa ẩm thực",
        speaker: "Chef",
        ipa: "/ˈkʌl.ə.ner.i ˈdel.ɪ.kə.si/",
        beat_prosody: "CUL-i-nar-y DEL-i-ca-cy"
      },
      {
        chunk_id: "b5_04",
        item_number: 4,
        category: "phrase",
        english: "bursting with rich flavor",
        vietnamese: "bùng nổ hương vị đậm đà thơm ngon",
        speaker: "Food Critic",
        ipa: "/ˈbɜː.stɪŋ wɪð rɪtʃ ˈfleɪ.vər/",
        beat_prosody: "BURST-ing with RICH FLA-vor"
      },
      {
        chunk_id: "b5_05",
        item_number: 5,
        category: "sentence",
        english: "Vietnamese Pho features a slow-simmered aromatic broth infused with cinnamon and star anise.",
        vietnamese: "Phở Việt Nam nổi bật với nước dùng ninh kỹ thơm nức hương quế và hoa hồi.",
        speaker: "Chef",
        ipa: "/viːˌet.nəˈmiːz fɜː...",
        beat_prosody: "Pho FEA-tures a SLOW-SIM-mered broth | in-FUSED with CIN-na-mon"
      },
      {
        chunk_id: "b5_06",
        item_number: 6,
        category: "slang",
        english: "This dish is to die for!",
        vietnamese: "Món này ngon xuất sắc không chê vào đâu được!",
        speaker: "Guest",
        ipa: "/ðɪs dɪʃ ɪz tuː daɪ fɔːr/",
        beat_prosody: "This DISH is to DIE FOR!"
      },
      {
        chunk_id: "b5_07",
        item_number: 7,
        category: "grammar",
        english: "Not only is street food affordable, but it also reflects authentic local traditions.",
        vietnamese: "Không những ẩm thực đường phố có giá cả phải chăng, mà nó còn phản ánh truyền thống bản địa chân thực.",
        speaker: "Teacher",
        ipa: "/nɑːt ˈoʊn.li ɪz striːt fuːd...",
        beat_prosody: "NOT ON-LY is street food af-FORD-a-ble | but it AL-SO re-FLECTS tra-DI-tions"
      },
      {
        chunk_id: "b5_08",
        item_number: 8,
        category: "phrase",
        english: "cater to diverse dietary preferences",
        vietnamese: "đáp ứng nhu cầu ăn uống đa dạng (như ăn chay, kiêng gluten)",
        speaker: "Manager",
        ipa: "/ˈkeɪ.tər tuː daɪˈvɜːs...",
        beat_prosody: "CA-ter to di-VERSE di-e-TAR-y pref-er-EN-ces"
      },
      {
        chunk_id: "b5_09",
        item_number: 9,
        category: "idiom",
        english: "whet your appetite",
        vietnamese: "kích thích vị giác / làm dấy lên sự thèm ăn",
        speaker: "Host",
        ipa: "/wet jɔːr ˈæp.ə.taɪt/",
        beat_prosody: "WHET your AP-pe-tite"
      },
      {
        chunk_id: "b5_10",
        item_number: 10,
        category: "review",
        english: "Practice describing your all-time favorite comfort food with sensory adjectives.",
        vietnamese: "Hãy luyện tập miêu tả món ăn an ủi yêu thích nhất của bạn bằng các tính từ chỉ giác quan.",
        speaker: "Teacher",
        ipa: "/ˈpræk.tɪs dɪˈskraɪ.bɪŋ...",
        beat_prosody: "PRAC-tice de-SCRIB-ing | your FAVOR-ite COM-fort FOOD"
      }
    ]
  },
  {
    id: "level_b_day_6",
    level_code: "B",
    day_number: 6,
    lesson_title: "Day 6 - Free Talk 1 & Lesson 4 Excel and Workplace Productivity",
    lesson_type: "Free Talk & Standard Lesson",
    total_chunks: 10,
    categories: ["vocab", "sentence", "phrase", "grammar"],
    created_at: "2026-01-15T00:00:00Z",
    chunks: [
      {
        chunk_id: "b6_01",
        item_number: 1,
        category: "vocab",
        english: "spreadsheet automation",
        vietnamese: "tự động hóa bảng tính dữ liệu",
        speaker: "Analyst",
        ipa: "/ˈspred.ʃiːt ˌɔː.təˈmeɪ.ʃən/",
        beat_prosody: "SPREAD-sheet au-to-MA-tion"
      },
      {
        chunk_id: "b6_02",
        item_number: 2,
        category: "phrase",
        english: "crunch the numbers",
        vietnamese: "xử lý và tính toán các con số tài chính/thống kê phức tạp",
        speaker: "Accountant",
        ipa: "/krʌntʃ ðə ˈnʌm.bərz/",
        beat_prosody: "CRUNCH the NUM-bers"
      },
      {
        chunk_id: "b6_03",
        item_number: 3,
        category: "sentence",
        english: "Pivot tables allow us to summarize quarterly revenue trends with just a few clicks.",
        vietnamese: "Bảng Pivot cho phép chúng ta tổng hợp xu hướng doanh thu hàng quý chỉ với vài cú nhấp chuột.",
        speaker: "Manager",
        ipa: "/ˈpɪv.ət ˈteɪ.bəlz əˈlaʊ ʌs...",
        beat_prosody: "PI-VOT TA-BLES al-low us to SUM-ma-rize | QUAR-ter-ly REV-e-nue TRENDS"
      },
      {
        chunk_id: "b6_04",
        item_number: 4,
        category: "phrase",
        english: "streamline workflow bottlenecks",
        vietnamese: "tối ưu hóa và loại bỏ các điểm nghẽn trong quy trình làm việc",
        speaker: "Consultant",
        ipa: "/ˈstriːm.laɪn ˈwɜːk.floʊ...",
        beat_prosody: "STREAM-line WORK-flow BOT-tle-necks"
      },
      {
        chunk_id: "b6_05",
        item_number: 5,
        category: "dialogue",
        english: "Could you walk me through the formulas used in column F?",
        vietnamese: "Bạn có thể hướng dẫn qua cho tôi các công thức được dùng ở cột F không?",
        speaker: "Colleague",
        ipa: "/kʊd juː wɔːk miː θruː...",
        beat_prosody: "Could you WALK ME THROUGH | the FOR-mu-las used in COL-umn F?"
      },
      {
        chunk_id: "b6_06",
        item_number: 6,
        category: "slang",
        english: "It's a complete game-changer!",
        vietnamese: "Nó là một bước ngoặt thay đổi hoàn toàn cục diện!",
        speaker: "Lead",
        ipa: "/ɪts ə kəmˈpliːt ɡeɪmˌtʃeɪn.dʒər/",
        beat_prosody: "It's a com-PLETE GAME-CHAN-ger!"
      },
      {
        chunk_id: "b6_07",
        item_number: 7,
        category: "idiom",
        english: "on the same page",
        vietnamese: "cùng chung quan điểm, hiểu rõ sự tình như nhau",
        speaker: "Manager",
        ipa: "/ɒn ðə seɪm peɪdʒ/",
        beat_prosody: "on the SAME PAGE"
      },
      {
        chunk_id: "b6_08",
        item_number: 8,
        category: "verb",
        english: "reconcile discrepancies in the ledger",
        vietnamese: "đối chiếu và xử lý sự chênh lệch trong sổ cái kế toán",
        speaker: "Auditor",
        ipa: "/ˈrek.ən.saɪl dɪˈskrep.ən.siz...",
        beat_prosody: "REC-on-cile dis-CREP-an-cies in the LED-ger"
      },
      {
        chunk_id: "b6_09",
        item_number: 9,
        category: "sentence",
        english: "Mastering shortcuts will easily save you two hours of repetitive manual data entry every day.",
        vietnamese: "Nắm vững phím tắt sẽ dễ dàng tiết kiệm cho bạn 2 tiếng nhập dữ liệu thủ công lặp lại mỗi ngày.",
        speaker: "Teacher",
        ipa: "/ˈmæs.tər.ɪŋ ˈʃɔːrt.kʌts...",
        beat_prosody: "MAS-ter-ing SHORT-cuts | will EA-si-ly SAVE you TWO HOURS"
      },
      {
        chunk_id: "b6_10",
        item_number: 10,
        category: "review",
        english: "Deliver your elevator pitch explaining how Excel formulas solved a real problem at work.",
        vietnamese: "Hãy trình bày bài thuyết trình ngắn gọn giải thích cách các công thức Excel giải quyết vấn đề thực tế trong công việc.",
        speaker: "Teacher",
        ipa: "/dɪˈlɪv.ər jɔːr ˈel.ə.veɪ.tər pɪtʃ...",
        beat_prosody: "De-LIV-er your EL-e-va-tor PITCH | ex-PLAIN-ing how EX-CEL solved a PROB-lem"
      }
    ]
  },
  {
    id: "level_b_day_7",
    level_code: "B",
    day_number: 7,
    lesson_title: "Day 7 - Lesson 5 Physical things & Free Talk 2",
    lesson_type: "Standard Lesson & Free Talk",
    total_chunks: 10,
    categories: ["vocab", "phrase", "sentence", "monologue"],
    created_at: "2026-01-16T00:00:00Z",
    chunks: [
      {
        chunk_id: "b7_01",
        item_number: 1,
        category: "vocab",
        english: "ergonomic workspace setup",
        vietnamese: "sắp đặt không gian làm việc chuẩn công thái học",
        speaker: "Ergonomist",
        ipa: "/ˌɜː.ɡəˈnɑː.mɪk ˈwɜːk.speɪs...",
        beat_prosody: "er-go-NOM-ic WORK-space SET-up"
      },
      {
        chunk_id: "b7_02",
        item_number: 2,
        category: "phrase",
        english: "declutter your physical surroundings",
        vietnamese: "dọn dẹp và loại bỏ đồ đạc bừa bộn xung quanh",
        speaker: "Minimalist",
        ipa: "/diːˈklʌt.ər jɔːr ˈfɪz.ɪ.kəl...",
        beat_prosody: "de-CLUT-ter your PHYS-i-cal sur-ROUND-ings"
      },
      {
        chunk_id: "b7_03",
        item_number: 3,
        category: "sentence",
        english: "A minimalist workstation helps eliminate visual distractions and heightens deep mental focus.",
        vietnamese: "Một bàn làm việc tối giản giúp loại bỏ sự phân tâm về thị giác và nâng cao khả năng tập trung sâu.",
        speaker: "Coach",
        ipa: "/ə ˈmɪn.ə.məl.ɪst ˈwɜːkˌsteɪ.ʃən...",
        beat_prosody: "A MIN-i-mal-ist WORK-sta-tion | e-LIM-i-nates dis-TRAC-tions | and HEIGHT-ens FO-cus"
      },
      {
        chunk_id: "b7_04",
        item_number: 4,
        category: "monologue",
        english: "This mechanical keyboard features tactile brown switches that provide satisfying auditory and sensory feedback.",
        vietnamese: "Bàn phím cơ này sử dụng switch xúc giác màu nâu mang lại cảm giác phản hồi âm thanh và xúc giác rất đã tay.",
        speaker: "Reviewer",
        ipa: "/ðɪs məˈkæn.ɪ.kəl ˈkiː.bɔːrd...",
        beat_prosody: "This me-CHAN-i-cal KEY-board | pro-VIDES sat-is-FY-ing FEED-back"
      },
      {
        chunk_id: "b7_05",
        item_number: 5,
        category: "phrase",
        english: "built to withstand daily wear and tear",
        vietnamese: "được chế tạo để chịu được sự hao mòn và sử dụng liên tục hàng ngày",
        speaker: "Engineer",
        ipa: "/bɪlt tuː wɪðˈstænd...",
        beat_prosody: "BUILT to with-STAND | DAI-ly WEAR and TEAR"
      },
      {
        chunk_id: "b7_06",
        item_number: 6,
        category: "slang",
        english: "It's sleek as hell!",
        vietnamese: "Trông nó cực kỳ mượt mà và sang xịn mịn!",
        speaker: "User",
        ipa: "/ɪts sliːk æz hel/",
        beat_prosody: "It's SLEEK as HELL!"
      },
      {
        chunk_id: "b7_07",
        item_number: 7,
        category: "grammar",
        english: "The more organized your desk is, the clearer your thought process becomes.",
        vietnamese: "Bàn làm việc của bạn càng ngăn nắp, quá trình tư duy của bạn càng mạch lạc và thông suốt.",
        speaker: "Teacher",
        ipa: "/ðə mɔːr ˈɔːr.ɡən.aɪzd...",
        beat_prosody: "The MORE or-gan-ized your DESK is | the CLEAR-er your THOUGHT be-COMES"
      },
      {
        chunk_id: "b7_08",
        item_number: 8,
        category: "idiom",
        english: "stand the test of time",
        vietnamese: "bền vững và giữ vững giá trị qua thử thách của thời gian",
        speaker: "Historian",
        ipa: "/stænd ðə test əv taɪm/",
        beat_prosody: "STAND the TEST of TIME"
      },
      {
        chunk_id: "b7_09",
        item_number: 9,
        category: "word_family",
        english: "durable - durability - durably",
        vietnamese: "bền chắc (tính từ) - độ bền (danh từ) - một cách bền vững (trạng từ)",
        speaker: "Teacher",
        ipa: "/ˈdʊr.ə.bəl...",
        beat_prosody: "DUR-a-ble | dur-a-BIL-i-ty | DUR-a-bly"
      },
      {
        chunk_id: "b7_10",
        item_number: 10,
        category: "review",
        english: "Conduct a 2-minute unboxing commentary describing a prized possession you carry every day.",
        vietnamese: "Thực hiện bài bình luận đập hộp 2 phút mô tả món đồ quý giá bạn mang theo hàng ngày.",
        speaker: "Teacher",
        ipa: "/kənˈdʌkt ə tuː ˈmɪn.ɪt...",
        beat_prosody: "Con-DUCT an UN-box-ing com-men-ta-ry | de-SCRIB-ing a prized pos-SES-sion"
      }
    ]
  },
  {
    id: "level_b_day_8",
    level_code: "B",
    day_number: 8,
    lesson_title: "Day 8 - Grammar Session & Lesson 5 E-Commerce & Retail",
    lesson_type: "Grammar Session & Standard Lesson",
    total_chunks: 10,
    categories: ["grammar", "vocab", "sentence", "phrase"],
    created_at: "2026-01-17T00:00:00Z",
    chunks: [
      {
        chunk_id: "b8_01",
        item_number: 1,
        category: "grammar",
        english: "Had the company optimized its checkout flow, conversion rates would have surged by 25%.",
        vietnamese: "Nếu công ty tối ưu hóa quy trình thanh toán, tỷ lệ chuyển đổi đã tăng vọt 25%.",
        speaker: "Growth Lead",
        ipa: "/hæd ðə ˈkʌm.pə.ni ˈɑːp.tə.maɪzd...",
        beat_prosody: "HAD the com-pa-ny OP-ti-mized | CHECK-out flow | con-VER-sion would have SURGED"
      },
      {
        chunk_id: "b8_02",
        item_number: 2,
        category: "vocab",
        english: "cart abandonment rate",
        vietnamese: "tỷ lệ người dùng bỏ dở giỏ hàng mà không hoàn tất thanh toán",
        speaker: "Analyst",
        ipa: "/kɑːrt əˈbæn.dən.mənt reɪt/",
        beat_prosody: "CART a-BAN-don-ment RATE"
      },
      {
        chunk_id: "b8_03",
        item_number: 3,
        category: "phrase",
        english: "seamless omnichannel shopping experience",
        vietnamese: "trải nghiệm mua sắm đa kênh liền mạch và tiện lợi",
        speaker: "Retail Director",
        ipa: "/ˈsiːm.ləs ˈɑːm.niˌtʃæn.əl...",
        beat_prosody: "SEAM-less om-ni-CHAN-nel SHOP-ping ex-PE-rience"
      },
      {
        chunk_id: "b8_04",
        item_number: 4,
        category: "dialogue",
        english: "Can customers track their real-time shipment status via SMS notifications?",
        vietnamese: "Khách hàng có thể theo dõi tình trạng đơn hàng theo thời gian thực qua tin nhắn SMS không?",
        speaker: "Product Manager",
        ipa: "/kæn ˈkʌs.tə.mərz træk...",
        beat_prosody: "Can CUS-tom-ers TRACK ship-ment STA-tus | vi-a SMS no-ti-fi-CA-tions?"
      },
      {
        chunk_id: "b8_05",
        item_number: 5,
        category: "phrase",
        english: "offer hassle-free returns and refunds",
        vietnamese: "cung cấp chính sách đổi trả và hoàn tiền nhanh chóng, không phiền hà",
        speaker: "Support Lead",
        ipa: "/ˈɒf.ər ˈhæs.əl friː rɪˈtɜːnz...",
        beat_prosody: "OF-fer HAS-sle-free RE-turns and RE-funds"
      },
      {
        chunk_id: "b8_06",
        item_number: 6,
        category: "slang",
        english: "It sold out in a flash!",
        vietnamese: "Nó cháy hàng trong chớp mắt!",
        speaker: "Influencer",
        ipa: "/ɪt soʊld aʊt ɪn ə flæʃ/",
        beat_prosody: "It SOLD OUT in a FLASH!"
      },
      {
        chunk_id: "b8_07",
        item_number: 7,
        category: "idiom",
        english: "ring up the sale",
        vietnamese: "tính tiền / chốt hóa đơn bán hàng cho khách",
        speaker: "Cashier",
        ipa: "/rɪŋ ʌp ðə seɪl/",
        beat_prosody: "RING UP the SALE"
      },
      {
        chunk_id: "b8_08",
        item_number: 8,
        category: "verb",
        english: "capitalize on flash sale discounts",
        vietnamese: "tận dụng tối đa ưu đãi từ các đợt giảm giá chớp nhoáng",
        speaker: "Shopper",
        ipa: "/ˈkæp.ə.t̬əl.aɪz ɒn flæʃ...",
        beat_prosody: "CAP-i-tal-ize on FLASH SALE DIS-counts"
      },
      {
        chunk_id: "b8_09",
        item_number: 9,
        category: "sentence",
        english: "Personalized product recommendations drive higher average order value across e-commerce platforms.",
        vietnamese: "Gợi ý sản phẩm được cá nhân hóa thúc đẩy giá trị đơn hàng trung bình cao hơn trên các sàn thương mại điện tử.",
        speaker: "Marketer",
        ipa: "/ˈpɜː.sən.əl.aɪzd ˈprɑː.dʌkt...",
        beat_prosody: "Per-son-al-ized REC-om-men-da-tions | DRIVE high-er OR-der VAL-ue"
      },
      {
        chunk_id: "b8_10",
        item_number: 10,
        category: "review",
        english: "Drill inverted conditional clauses: 'Should you require further assistance, do not hesitate to contact us.'",
        vietnamese: "Luyện câu điều kiện đảo ngữ: 'Nếu quý khách cần hỗ trợ thêm, đừng ngần ngại liên hệ chúng tôi.'",
        speaker: "Teacher",
        ipa: "/ʃʊd juː rɪˈkwaɪər...",
        beat_prosody: "SHOULD you re-QUIRE as-SIS-tance | do NOT HES-i-tate to con-TACT us"
      }
    ]
  },
  {
    id: "level_b_day_9",
    level_code: "B",
    day_number: 9,
    lesson_title: "Day 9 - Lesson 6 Interviews matter & Smarketing Alignment",
    lesson_type: "Standard Lesson",
    total_chunks: 10,
    categories: ["monologue", "phrase", "sentence", "vocab"],
    created_at: "2026-01-18T00:00:00Z",
    chunks: [
      {
        chunk_id: "b9_01",
        item_number: 1,
        category: "vocab",
        english: "smarketing alignment",
        vietnamese: "sự phối hợp đồng bộ chặt chẽ giữa bộ phận Bán hàng (Sales) và Tiếp thị (Marketing)",
        speaker: "VP Sales",
        ipa: "/ˈsmɑːr.kɪ.tɪŋ əˈlaɪn.mənt/",
        beat_prosody: "SMAR-ket-ing a-LIGN-ment"
      },
      {
        chunk_id: "b9_02",
        item_number: 2,
        category: "phrase",
        english: "nurture high-intent sales leads",
        vietnamese: "chăm sóc và nuôi dưỡng các khách hàng tiềm năng có ý định mua hàng cao",
        speaker: "Sales Director",
        ipa: "/ˈnɜː.tʃər haɪ ɪnˈtent...",
        beat_prosody: "NUR-ture HIGH-IN-TENT sales LEADS"
      },
      {
        chunk_id: "b9_03",
        item_number: 3,
        category: "monologue",
        english: "When asked about my biggest professional setback, I openly shared how I pivoted strategy and recovered lost market share.",
        vietnamese: "Khi được hỏi về thất bại lớn nhất trong công việc, tôi đã cởi mở chia sẻ cách mình xoay chuyển chiến lược và giành lại thị phần đã mất.",
        speaker: "Executive",
        ipa: "/wen æskt əˈbaʊt maɪ ˈbɪɡ.ɪst...",
        beat_prosody: "When asked a-bout my BIG-gest SET-back | I PIV-ot-ed STRA-te-gy and RE-cov-ered"
      },
      {
        chunk_id: "b9_04",
        item_number: 4,
        category: "sentence",
        english: "Closing the loop between inbound marketing campaigns and sales pipeline velocity is vital.",
        vietnamese: "Việc khép kín vòng tròn giữa các chiến dịch tiếp thị thu hút và tốc độ chuyển đổi của kênh bán hàng là điều sống còn.",
        speaker: "Chief Marketing Officer",
        ipa: "/ˈkloʊ.zɪŋ ðə luːp...",
        beat_prosody: "CLOS-ing the LOOP | be-tween IN-bound MAR-ket-ing | and SALES VE-loc-i-ty"
      },
      {
        chunk_id: "b9_05",
        item_number: 5,
        category: "idiom",
        english: "seal the deal",
        vietnamese: "chốt hạ hợp đồng / ký kết thành công thỏa thuận",
        speaker: "Account Exec",
        ipa: "/siːl ðə diːl/",
        beat_prosody: "SEAL the DEAL"
      },
      {
        chunk_id: "b9_06",
        item_number: 6,
        category: "phrase",
        english: "overcome buyer hesitation",
        vietnamese: "giải tỏa và vượt qua sự đắn đo do dự của người mua hàng",
        speaker: "Closer",
        ipa: "/ˌoʊ.vərˈkʌm ˈbaɪ.ər...",
        beat_prosody: "o-ver-COME BUY-er hes-i-TA-tion"
      },
      {
        chunk_id: "b9_07",
        item_number: 7,
        category: "slang",
        english: "He knocked it out of the park!",
        vietnamese: "Anh ấy đã làm xuất sắc vượt mức mong đợi / lập chiến công vang dội!",
        speaker: "Headhunter",
        ipa: "/hiː nɑːkt ɪt aʊt...",
        beat_prosody: "He KNOCKED IT out of the PARK!"
      },
      {
        chunk_id: "b9_08",
        item_number: 8,
        category: "grammar",
        english: "It was not until the third round of interviews that they revealed the executive salary package.",
        vietnamese: "Mãi cho đến vòng phỏng vấn thứ ba thì họ mới tiết lộ gói lương thưởng dành cho cấp điều hành.",
        speaker: "Teacher",
        ipa: "/ɪt wʌz nɑːt ʌnˈtɪl...",
        beat_prosody: "It was NOT un-til the THIRD ROUND | that they re-VEALED the SAL-a-ry PACK-age"
      },
      {
        chunk_id: "b9_09",
        item_number: 9,
        category: "verb",
        english: "leverage customer testimonials",
        vietnamese: "tận dụng những lời đánh giá phản hồi tích cực của khách hàng",
        speaker: "Marketer",
        ipa: "/ˈlev.ɚ.ɪdʒ ˈkʌs.tə.mər...",
        beat_prosody: "LEV-er-age CUS-tom-er tes-ti-MO-ni-als"
      },
      {
        chunk_id: "b9_10",
        item_number: 10,
        category: "review",
        english: "Roleplay answering the difficult curveball interview question: 'Why should we hire you over other qualified candidates?'",
        vietnamese: "Đóng vai trả lời câu hỏi phỏng vấn hóc búa: 'Tại sao chúng tôi nên tuyển bạn thay vì các ứng viên sáng giá khác?'",
        speaker: "Teacher",
        ipa: "/ˈroʊl.pleɪ ˈæn.sər.ɪŋ...",
        beat_prosody: "Why should we HIRE YOU | o-ver O-ther QUAL-i-fied CAN-di-dates?"
      }
    ]
  },
  {
    id: "level_b_day_10",
    level_code: "B",
    day_number: 10,
    lesson_title: "Day 10 - Free Talk 3 & Lesson 7 Diseases & Healthcare Wellness",
    lesson_type: "Free Talk & Standard Lesson",
    total_chunks: 10,
    categories: ["vocab", "dialogue", "phrase", "sentence"],
    created_at: "2026-01-19T00:00:00Z",
    chunks: [
      {
        chunk_id: "b10_01",
        item_number: 1,
        category: "vocab",
        english: "chronic health condition",
        vietnamese: "tình trạng bệnh lý mãn tính kéo dài",
        speaker: "Doctor",
        ipa: "/ˈkrɑː.nɪk helθ kənˈdɪʃ.ən/",
        beat_prosody: "CHRON-ic HEALTH con-DI-tion"
      },
      {
        chunk_id: "b10_02",
        item_number: 2,
        category: "phrase",
        english: "boost immune system defense",
        vietnamese: "tăng cường hàng rào phòng thủ của hệ miễn dịch",
        speaker: "Nutritionist",
        ipa: "/buːst ɪˈmjuːn ˈsɪs.təm...",
        beat_prosody: "BOOST im-MUNE SYS-tem de-FENSE"
      },
      {
        chunk_id: "b10_03",
        item_number: 3,
        category: "dialogue",
        english: "I have been experiencing a persistent throbbing migraine accompanied by light sensitivity for two days.",
        vietnamese: "Tôi bị đau nửa đầu dữ dội âm ỉ kèm theo triệu chứng sợ ánh sáng suốt hai ngày nay.",
        speaker: "Patient",
        ipa: "/aɪ hæv biːn ɪkˈspɪr.i.ən.sɪŋ...",
        beat_prosody: "per-SIS-tent THROB-bing MI-graine | ac-COM-pa-nied by LIGHT sen-si-TIV-i-ty"
      },
      {
        chunk_id: "b10_04",
        item_number: 4,
        category: "sentence",
        english: "Preventative checkups and balanced nutrition are far more effective than relying solely on medication.",
        vietnamese: "Khám sức khỏe định kỳ phòng ngừa và dinh dưỡng cân đối hiệu quả hơn nhiều so với việc chỉ dựa vào thuốc tây.",
        speaker: "Physician",
        ipa: "/prɪˈven.tə.tɪv ˈtʃek.ʌps...",
        beat_prosody: "Pre-VEN-ta-tive CHECK-ups | are FAR MORE ef-FEC-tive | than med-i-CA-tion"
      },
      {
        chunk_id: "b10_05",
        item_number: 5,
        category: "idiom",
        english: "under the weather",
        vietnamese: "cảm thấy trong người hơi mệt, khó ở, không khỏe",
        speaker: "Colleague",
        ipa: "/ˈʌn.dər ðə ˈweð.ər/",
        beat_prosody: "un-der the WEATH-er"
      },
      {
        chunk_id: "b10_06",
        item_number: 6,
        category: "slang",
        english: "I feel completely wiped out!",
        vietnamese: "Tôi cảm thấy kiệt quệ sức lực hoàn toàn!",
        speaker: "Patient",
        ipa: "/aɪ fiːl kəmˈpliːt.li waɪpt aʊt/",
        beat_prosody: "I feel com-PLETE-ly WIPED OUT!"
      },
      {
        chunk_id: "b10_07",
        item_number: 7,
        category: "verb",
        english: "prescribe a regimen of antibiotics",
        vietnamese: "kê đơn phác đồ điều trị bằng thuốc kháng sinh",
        speaker: "Doctor",
        ipa: "/prɪˈskraɪb ə ˈredʒ.ə.mən...",
        beat_prosody: "pre-SCRIBE a REG-i-men of an-ti-bi-OT-ics"
      },
      {
        chunk_id: "b10_08",
        item_number: 8,
        category: "grammar",
        english: "It is strongly recommended that patients undergo cardiovascular screening annually.",
        vietnamese: "Các chuyên gia khuyến cáo mạnh mẽ rằng người bệnh nên đi tầm soát tim mạch hàng năm.",
        speaker: "Teacher",
        ipa: "/ɪt ɪz ˈstrɑːŋ.li ˌrek.əˈmen.dɪd...",
        beat_prosody: "It is RE-com-MEN-ded | that PA-tients un-der-GO screen-ing AN-nu-al-ly"
      },
      {
        chunk_id: "b10_09",
        item_number: 9,
        category: "phrase",
        english: "adopt mindful meditation practices",
        vietnamese: "áp dụng các bài thực hành thiền chánh niệm để xoa dịu tâm trí",
        speaker: "Wellness Coach",
        ipa: "/əˈdɑːpt ˈmaɪnd.fəl ˌmed.əˈteɪ.ʃən...",
        beat_prosody: "a-DOPT MIND-ful med-i-TA-tion"
      },
      {
        chunk_id: "b10_10",
        item_number: 10,
        category: "review",
        english: "Practice giving empathy and medical consultation in a doctor-patient mock scenario.",
        vietnamese: "Luyện tập thể hiện sự đồng cảm và tư vấn sức khỏe trong tình huống giả định bác sĩ - bệnh nhân.",
        speaker: "Teacher",
        ipa: "/ˈpræk.tɪs ˈɡɪv.ɪŋ ˈem.pə.θi...",
        beat_prosody: "PRAC-tice GIV-ing EM-pa-thy | in a DOC-tor PA-tient sce-NAR-i-o"
      }
    ]
  },
  {
    id: "level_b_day_11",
    level_code: "B",
    day_number: 11,
    lesson_title: "Day 11 - Lesson 7 Chart analysis & Lesson 8 Human description",
    lesson_type: "Standard Lesson",
    total_chunks: 10,
    categories: ["vocab", "phrase", "sentence", "monologue"],
    created_at: "2026-01-20T00:00:00Z",
    chunks: [
      {
        chunk_id: "b11_01",
        item_number: 1,
        category: "phrase",
        english: "experience an exponential upward trajectory",
        vietnamese: "trải qua một đà tăng trưởng theo cấp số nhân",
        speaker: "Data Analyst",
        ipa: "/ɪkˈspɪr.i.əns ən ˌek.spoʊˈnen.ʃəl...",
        beat_prosody: "ex-PE-rience an ex-po-NEN-tial UP-ward tra-JEC-to-ry"
      },
      {
        chunk_id: "b11_02",
        item_number: 2,
        category: "sentence",
        english: "As illustrated by the line graph, user retention plateaued before rebounding sharply in Q4.",
        vietnamese: "Như được minh họa bởi biểu đồ đường, tỷ lệ giữ chân người dùng đi ngang trước khi bật tăng mạnh mẽ vào quý 4.",
        speaker: "Analyst",
        ipa: "/æz ˈɪl.ə.streɪ.tɪd baɪ...",
        beat_prosody: "re-TEN-tion PLA-teaued | be-FORE re-BOUND-ing SHARP-ly in Q4"
      },
      {
        chunk_id: "b11_03",
        item_number: 3,
        category: "vocab",
        english: "charismatic demeanor",
        vietnamese: "phong thái cuốn hút đầy uy tín và sức hấp dẫn",
        speaker: "Observer",
        ipa: "/ˌker.ɪzˈmæt̬.ɪk dɪˈmiː.nɚ/",
        beat_prosody: "char-is-MAT-ic de-MEAN-or"
      },
      {
        chunk_id: "b11_04",
        item_number: 4,
        category: "phrase",
        english: "possess sharp analytical acumen",
        vietnamese: "sở hữu nhãn quan và tư duy phân tích vô cùng sắc bén",
        speaker: "Lead",
        ipa: "/pəˈzes ʃɑːrp ˌæn.əlˈɪt̬.ɪ.kəl əˈkjuː.mən/",
        beat_prosody: "pos-SESS SHARP an-a-LYT-i-cal a-CU-men"
      },
      {
        chunk_id: "b11_05",
        item_number: 5,
        category: "monologue",
        english: "She is a tall, articulate professional with piercing hazel eyes and an unwavering sense of composure.",
        vietnamese: "Cô ấy là một chuyên gia cao ráo, hoạt ngôn với đôi mắt màu hạt dẻ sắc sảo và sự điềm tĩnh kiên định.",
        speaker: "Interviewer",
        ipa: "/ʃiː ɪz ə tɔːl ɑːrˈtɪk.jə.lət...",
        beat_prosody: "ar-TIC-u-late pro-FES-sion-al | with un-WA-ver-ing COM-po-sure"
      },
      {
        chunk_id: "b11_06",
        item_number: 6,
        category: "idiom",
        english: "paint a vivid picture",
        vietnamese: "khắc họa một bức tranh sống động, rõ nét đến từng chi tiết",
        speaker: "Presenter",
        ipa: "/peɪnt ə ˈvɪv.ɪd ˈpɪk.tʃər/",
        beat_prosody: "PAINT a VIV-id PIC-ture"
      },
      {
        chunk_id: "b11_07",
        item_number: 7,
        category: "slang",
        english: "The numbers are through the roof!",
        vietnamese: "Các con số tăng vọt chạm trần luôn!",
        speaker: "Director",
        ipa: "/ðə ˈnʌm.bərz ɑːr θruː ðə ruːf/",
        beat_prosody: "The NUM-bers are THROUGH the ROOF!"
      },
      {
        chunk_id: "b11_08",
        item_number: 8,
        category: "grammar",
        english: "In contrast to the slight dip in Europe, Asian sales soared dramatically.",
        vietnamese: "Trái ngược với sự sụt giảm nhẹ tại châu Âu, doanh số khu vực châu Á đã tăng vọt đầy ấn tượng.",
        speaker: "Teacher",
        ipa: "/ɪn ˈkɑːn.træst tuː...",
        beat_prosody: "In CON-trast to the SLIGHT DIP | A-sian SALES SOARED dra-MAT-i-cal-ly"
      },
      {
        chunk_id: "b11_09",
        item_number: 9,
        category: "verb",
        english: "fluctuate within a narrow margin",
        vietnamese: "dao động trong một biên độ hẹp",
        speaker: "Economist",
        ipa: "/ˈflʌk.tʃu.eɪt ˈwɪð.ɪn...",
        beat_prosody: "FLUC-tu-ate with-in a NAR-row MAR-gin"
      },
      {
        chunk_id: "b11_10",
        item_number: 10,
        category: "review",
        english: "Deliver a 3-minute executive presentation interpreting bar charts and pie charts.",
        vietnamese: "Trình bày bài thuyết trình cấp cao 3 phút phân tích biểu đồ cột và biểu đồ tròn.",
        speaker: "Teacher",
        ipa: "/dɪˈlɪv.ər ə θriː ˈmɪn.ɪt...",
        beat_prosody: "De-LIV-er an ex-EC-u-tive PRE-sen-ta-tion | in-TER-pret-ing CHARTS"
      }
    ]
  },
  {
    id: "level_b_day_12",
    level_code: "B",
    day_number: 12,
    lesson_title: "Day 12 - Free Talk 2 & Lesson 8 Corporate Innovation & Telecommunications",
    lesson_type: "Free Talk & Standard Lesson",
    total_chunks: 10,
    categories: ["vocab", "phrase", "sentence", "dialogue"],
    created_at: "2026-01-21T00:00:00Z",
    chunks: [
      {
        chunk_id: "b12_01",
        item_number: 1,
        category: "vocab",
        english: "telecommunication infrastructure",
        vietnamese: "cơ sở hạ tầng mạng lưới viễn thông",
        speaker: "Telecom Engineer",
        ipa: "/ˌtel.ə.kəˌmjuː.nəˈkeɪ.ʃən...",
        beat_prosody: "tel-e-com-mu-ni-CA-tion in-fra-STRUC-ture"
      },
      {
        chunk_id: "b12_02",
        item_number: 2,
        category: "phrase",
        english: "expand 5G broadband connectivity",
        vietnamese: "mở rộng vùng phủ sóng kết nối băng thông rộng 5G",
        speaker: "Network Specialist",
        ipa: "/ɪkˈspænd faɪv dʒiː...",
        beat_prosody: "ex-PAND FIVE-G broad-band con-nec-TIV-i-ty"
      },
      {
        chunk_id: "b12_03",
        item_number: 3,
        category: "sentence",
        english: "Global telecommunication conglomerates are investing heavily in low-latency satellite networks.",
        vietnamese: "Các tập đoàn viễn thông toàn cầu đang đầu tư mạnh mẽ vào các mạng vệ tinh độ trễ cực thấp.",
        speaker: "Tech Strategist",
        ipa: "/ˈɡloʊ.bəl ˌtel.ə.kəˌmjuː.nəˈkeɪ.ʃən...",
        beat_prosody: "IN-vest-ing HEAV-i-ly | in LOW-LA-ten-cy sat-el-LITE NET-works"
      },
      {
        chunk_id: "b12_04",
        item_number: 4,
        category: "dialogue",
        english: "How do we ensure cross-border data security while scaling our cloud infrastructure?",
        vietnamese: "Làm thế nào để chúng ta đảm bảo an ninh dữ liệu xuyên biên giới trong khi mở rộng hạ tầng đám mây?",
        speaker: "Security Architect",
        ipa: "/haʊ duː wiː ɪnˈʃʊr...",
        beat_prosody: "How do we en-SURE DA-TA se-CU-ri-ty | while SCA-ling CLOUD in-fra-STRUC-ture?"
      },
      {
        chunk_id: "b12_05",
        item_number: 5,
        category: "phrase",
        english: "spearhead digital transformation initiatives",
        vietnamese: "tiên phong dẫn đầu các sáng kiến chuyển đổi số doanh nghiệp",
        speaker: "Chief Information Officer",
        ipa: "/ˈspɪr.hed ˈdɪdʒ.ə.təl...",
        beat_prosody: "SPEAR-head DIG-i-tal trans-for-MA-tion"
      },
      {
        chunk_id: "b12_06",
        item_number: 6,
        category: "slang",
        english: "State-of-the-art tech!",
        vietnamese: "Công nghệ tối tân hiện đại bậc nhất!",
        speaker: "Tech Lead",
        ipa: "/steɪt əv ðiː ɑːrt tek/",
        beat_prosody: "STATE-of-the-ART TECH!"
      },
      {
        chunk_id: "b12_07",
        item_number: 7,
        category: "idiom",
        english: "ahead of the curve",
        vietnamese: "đi trước thời đại, nắm bắt xu hướng đi đầu",
        speaker: "Strategist",
        ipa: "/əˈhed əv ðə kɜːrv/",
        beat_prosody: "a-HEAD of the CURVE"
      },
      {
        chunk_id: "b12_08",
        item_number: 8,
        category: "verb",
        english: "foster a culture of agile experimentation",
        vietnamese: "nuôi dưỡng văn hóa thử nghiệm linh hoạt và thích ứng nhanh",
        speaker: "CEO",
        ipa: "/ˈfɑː.stər ə ˈkʌl.tʃər...",
        beat_prosody: "FOS-ter a CUL-ture | of A-GILE ex-per-i-men-TA-tion"
      },
      {
        chunk_id: "b12_09",
        item_number: 9,
        category: "grammar",
        english: "No sooner had the new fiber-optic network launched than demand surpassed initial forecasts.",
        vietnamese: "Ngay khi mạng cáp quang mới vừa được ra mắt thì nhu cầu đã lập tức vượt qua các dự báo ban đầu.",
        speaker: "Teacher",
        ipa: "/noʊ ˈsuː.nər hæd ðə...",
        beat_prosody: "NO SOON-er had the NET-work LAUNCHED | than de-MAND sur-PASSED fore-CASTS"
      },
      {
        chunk_id: "b12_10",
        item_number: 10,
        category: "review",
        english: "Debate the social and economic impact of hyper-connectivity on modern society.",
        vietnamese: "Tranh biện về tác động kinh tế và xã hội của việc siêu kết nối đối với xã hội hiện đại.",
        speaker: "Teacher",
        ipa: "/dɪˈbeɪt ðə ˈsoʊ.ʃəl...",
        beat_prosody: "DE-bate the IM-pact of hy-per-con-nec-TIV-i-ty"
      }
    ]
  },
  {
    id: "level_b_day_13",
    level_code: "B",
    day_number: 13,
    lesson_title: "Day 13 - Free Talk 4 & Lesson 9 Society & Global Challenges",
    lesson_type: "Free Talk & Standard Lesson",
    total_chunks: 10,
    categories: ["vocab", "sentence", "phrase", "monologue"],
    created_at: "2026-01-22T00:00:00Z",
    chunks: [
      {
        chunk_id: "b13_01",
        item_number: 1,
        category: "vocab",
        english: "socioeconomic disparity",
        vietnamese: "sự chênh lệch và khoảng cách bất bình đẳng về kinh tế - xã hội",
        speaker: "Sociologist",
        ipa: "/ˌsoʊ.si.oʊˌek.əˈnɑː.mɪk dɪˈspær.ə.t̬i/",
        beat_prosody: "so-ci-o-ec-o-NOM-ic dis-PAR-i-ty"
      },
      {
        chunk_id: "b13_02",
        item_number: 2,
        category: "phrase",
        english: "champion environmental sustainability",
        vietnamese: "cổ vũ và bảo vệ sự phát triển bền vững của môi trường",
        speaker: "Activist",
        ipa: "/ˈtʃæm.pi.ən ɪnˌvaɪ.rənˈmen.təl...",
        beat_prosody: "CHAM-pi-on en-vi-ron-MEN-tal sus-tain-a-BIL-i-ty"
      },
      {
        chunk_id: "b13_03",
        item_number: 3,
        category: "sentence",
        english: "Transitioning toward renewable green energy requires concerted cooperation between governments and private enterprises.",
        vietnamese: "Quá trình chuyển đổi sang năng lượng xanh tái tạo đòi hỏi sự phối hợp đồng lòng giữa các chính phủ và doanh nghiệp tư nhân.",
        speaker: "Policy Maker",
        ipa: "/trænˈzɪʃ.ən.ɪŋ təˈwɔːrd...",
        beat_prosody: "Tran-SI-tion-ing to-ward GREEN EN-er-gy | re-QUIRES con-CERT-ed co-op-er-A-tion"
      },
      {
        chunk_id: "b13_04",
        item_number: 4,
        category: "monologue",
        english: "Urbanization presents unprecedented challenges, ranging from housing affordability crises to traffic congestion and carbon emissions.",
        vietnamese: "Đô thị hóa đặt ra những thách thức chưa từng có, từ khủng hoảng giá nhà ở cho đến ùn tắc giao thông và khí thải carbon.",
        speaker: "Urban Planner",
        ipa: "/ˌɜː.bən.aɪˈzeɪ.ʃən...",
        beat_prosody: "Ur-ban-i-ZA-tion pre-sents CHAL-len-ges | from HOUS-ing to CON-ges-tion"
      },
      {
        chunk_id: "b13_05",
        item_number: 5,
        category: "idiom",
        english: "the tip of the iceberg",
        vietnamese: "phần nổi của tảng băng chìm (chỉ là bề nổi của vấn đề lớn hơn)",
        speaker: "Researcher",
        ipa: "/ðə tɪp əv ði ˈaɪs.bɜːɡ/",
        beat_prosody: "the TIP of the ICE-berg"
      },
      {
        chunk_id: "b13_06",
        item_number: 6,
        category: "slang",
        english: "It's a wake-up call for everyone!",
        vietnamese: "Đó là một hồi chuông cảnh tỉnh cho tất cả mọi người!",
        speaker: "Speaker",
        ipa: "/ɪts ə ˈweɪk.ʌp kɔːl...",
        beat_prosody: "It's a WAKE-UP CALL for EV-ery-one!"
      },
      {
        chunk_id: "b13_07",
        item_number: 7,
        category: "verb",
        english: "mitigate climate change repercussions",
        vietnamese: "giảm thiểu các hệ lụy và tác động tiêu cực của biến đổi khí hậu",
        speaker: "Scientist",
        ipa: "/ˈmɪt̬.ə.ɡeɪt ˈklaɪ.mət tʃeɪndʒ...",
        beat_prosody: "MIT-i-gate CLI-mate CHANGE re-per-CUS-sions"
      },
      {
        chunk_id: "b13_08",
        item_number: 8,
        category: "grammar",
        english: "Were nations to pool their research budgets, breakthrough clean technologies could emerge twice as fast.",
        vietnamese: "Nếu các quốc gia cùng góp chung ngân sách nghiên cứu, các công nghệ sạch đột phá có thể ra đời nhanh gấp đôi.",
        speaker: "Teacher",
        ipa: "/wɜːr ˈneɪ.ʃənz tuː puːl...",
        beat_prosody: "WERE na-tions to POOL bud-gets | TECH-nol-o-gies could e-MERGE TWICE as FAST"
      },
      {
        chunk_id: "b13_09",
        item_number: 9,
        category: "phrase",
        english: "foster inclusive community dialogue",
        vietnamese: "xúc tiến đối thoại cộng đồng mang tính dung hòa và bao hàm",
        speaker: "Community Leader",
        ipa: "/ˈfɑː.stər ɪnˈkluː.sɪv...",
        beat_prosody: "FOS-ter in-CLU-sive com-MU-ni-ty DI-a-logue"
      },
      {
        chunk_id: "b13_10",
        item_number: 10,
        category: "review",
        english: "Formulate a policy brief proposing actionable solutions for reducing plastic waste in urban rivers.",
        vietnamese: "Soạn thảo bản tóm tắt chính sách đề xuất các giải pháp khả thi để giảm thiểu rác thải nhựa ở các dòng sông đô thị.",
        speaker: "Teacher",
        ipa: "/ˈfɔːr.mjə.leɪt ə ˈpɑː.lə.si briːf...",
        beat_prosody: "FOR-mu-late a POL-i-cy BRIEF | pro-POS-ing AC-tion-a-ble so-LU-tions"
      }
    ]
  },
  {
    id: "level_b_day_14",
    level_code: "B",
    day_number: 14,
    lesson_title: "Day 14 - Lesson 9 Professional Email & Lesson 10 Vietnamese Cultural Heritage",
    lesson_type: "Standard Lesson",
    total_chunks: 10,
    categories: ["phrase", "sentence", "vocab", "monologue"],
    created_at: "2026-01-23T00:00:00Z",
    chunks: [
      {
        chunk_id: "b14_01",
        item_number: 1,
        category: "phrase",
        english: "I am writing to formally request clarification regarding...",
        vietnamese: "Tôi viết thư này để chính thức xin ý kiến giải thích rõ hơn về...",
        speaker: "Manager",
        ipa: "/aɪ æm ˈraɪ.tɪŋ tuː...",
        beat_prosody: "I am WRIT-ing to FOR-mal-ly RE-quest clar-i-fi-CA-tion"
      },
      {
        chunk_id: "b14_02",
        item_number: 2,
        category: "phrase",
        english: "Please find the attached revised quarterly projections for your perusal.",
        vietnamese: "Xin vui lòng xem tài liệu dự báo quý đã được hiệu chỉnh đính kèm để nghiên cứu kỹ lưỡng.",
        speaker: "Executive Assistant",
        ipa: "/pliːz faɪnd ði əˈtætʃt...",
        beat_prosody: "Please FIND the at-TACHED pro-JEC-tions | for your per-U-sal"
      },
      {
        chunk_id: "b14_03",
        item_number: 3,
        category: "vocab",
        english: "intangible cultural heritage",
        vietnamese: "di sản văn hóa phi vật thể",
        speaker: "Historian",
        ipa: "/ɪnˈtæn.dʒə.bəl ˈkʌl.tʃɚ.əl ˈher.ɪ.t̬ɪdʒ/",
        beat_prosody: "in-TAN-gi-ble CUL-tur-al HER-i-tage"
      },
      {
        chunk_id: "b14_04",
        item_number: 4,
        category: "sentence",
        english: "The elegant traditional Ao Dai epitomizes the grace, dignity, and aesthetic subtlety of Vietnamese identity.",
        vietnamese: "Tà áo dài truyền thống thướt tha là biểu tượng cho nét duyên dáng, phẩm giá và vẻ đẹp tinh tế của bản sắc Việt Nam.",
        speaker: "Cultural Envoy",
        ipa: "/ði ˈel.ə.ɡənt trəˈdɪʃ.ən.əl...",
        beat_prosody: "The AO DAI e-PIT-o-mizes GRACE | DIG-ni-ty and sub-TLE-ty"
      },
      {
        chunk_id: "b14_05",
        item_number: 5,
        category: "phrase",
        english: "preserve age-old ancestral folklore",
        vietnamese: "gìn giữ và bảo tồn các câu chuyện dân gian lâu đời của tổ tiên",
        speaker: "Elder",
        ipa: "/prɪˈzɜːrv eɪdʒ oʊld...",
        beat_prosody: "pre-SERVE AGE-OLD an-CES-tral FOLK-lore"
      },
      {
        chunk_id: "b14_06",
        item_number: 6,
        category: "slang",
        english: "Keep me in the loop!",
        vietnamese: "Hãy luôn cập nhật thông tin cho tôi nhé!",
        speaker: "Colleague",
        ipa: "/kiːp miː ɪn ðə luːp/",
        beat_prosody: "Keep me in the LOOP!"
      },
      {
        chunk_id: "b14_07",
        item_number: 7,
        category: "idiom",
        english: "touch base with someone",
        vietnamese: "liên lạc ngắn gọn để kiểm tra tình hình hoặc cập nhật tiến độ",
        speaker: "Project Lead",
        ipa: "/tʌtʃ beɪs wɪð...",
        beat_prosody: "TOUCH BASE with some-one"
      },
      {
        chunk_id: "b14_08",
        item_number: 8,
        category: "sentence",
        english: "I look forward to hearing from you at your earliest convenience.",
        vietnamese: "Tôi rất mong sớm nhận được phản hồi từ bạn khi bạn thuận tiện nhất.",
        speaker: "Sender",
        ipa: "/aɪ lʊk ˈfɔːr.wɚd tuː...",
        beat_prosody: "I LOOK FOR-ward to HEAR-ing from you | at your EAR-li-est con-VEN-ience"
      },
      {
        chunk_id: "b14_09",
        item_number: 9,
        category: "verb",
        english: "pay homage to heroic ancestors",
        vietnamese: "bày tỏ lòng thành kính và tri ân sâu sắc tới các bậc tiền nhân anh hùng",
        speaker: "Speaker",
        ipa: "/peɪ ˈhɑː.mɪdʒ tuː...",
        beat_prosody: "PAY HOM-age to he-RO-ic an-CES-tors"
      },
      {
        chunk_id: "b14_10",
        item_number: 10,
        category: "review",
        english: "Draft an impeccably structured corporate email proposing a partnership with an international cultural exchange fund.",
        vietnamese: "Soạn một email trang trọng đề xuất quan hệ đối tác với quỹ trao đổi văn hóa quốc tế.",
        speaker: "Teacher",
        ipa: "/dræft ən ɪmˈpek.ə.bli ˈstrʌk.tʃərd...",
        beat_prosody: "Draft an im-PEC-ca-bly STRUC-tured EMAIL | pro-POS-ing a PART-ner-ship"
      }
    ]
  },
  {
    id: "level_b_day_15",
    level_code: "B",
    day_number: 15,
    lesson_title: "Day 15 - Lesson 10 Food Experience & Final Mastery Drill Test",
    lesson_type: "Final Test & Review",
    total_chunks: 12,
    categories: ["review", "monologue", "sentence", "phrase", "idiom"],
    created_at: "2026-01-24T00:00:00Z",
    chunks: [
      {
        chunk_id: "b15_01",
        item_number: 1,
        category: "review",
        english: "Congratulations on completing all 15 intensive chunking sessions!",
        vietnamese: "Xin chúc mừng bạn đã hoàn thành xuất sắc toàn bộ 15 buổi học luyện cụm chuyên sâu!",
        speaker: "Lead Teacher",
        ipa: "/kənˌɡrætʃ.əˈleɪ.ʃənz ɒn...",
        beat_prosody: "Con-grat-u-LA-tions on com-PLET-ing | all FIF-TEEN in-TEN-sive SES-sions!"
      },
      {
        chunk_id: "b15_02",
        item_number: 2,
        category: "phrase",
        english: "achieve unhesitating conversational fluency",
        vietnamese: "đạt được sự trôi chảy trong giao tiếp mà không còn ngập ngừng hay do dự",
        speaker: "Master Coach",
        ipa: "/əˈtʃiːv ʌnˈhez.ə.teɪ.tɪŋ...",
        beat_prosody: "a-CHIEVE un-hes-i-TA-ting con-ver-sa-tion-al FLU-en-cy"
      },
      {
        chunk_id: "b15_03",
        item_number: 3,
        category: "monologue",
        english: "From survival directions to high-stakes board presentations, chunking has transformed how I internalize English syntax.",
        vietnamese: "Từ hỏi đường sinh tồn đến những bài thuyết trình cấp cao, phương pháp học theo cụm đã thay đổi hoàn toàn cách tôi tiếp thu ngữ pháp tiếng Anh.",
        speaker: "Graduate",
        ipa: "/frʌm sərˈvaɪ.vəl dəˈrek.ʃənz...",
        beat_prosody: "From SUR-vi-val di-REC-tions | to BOARD pre-sen-TA-tions | CHUNK-ing trans-FORMED my mind"
      },
      {
        chunk_id: "b15_04",
        item_number: 4,
        category: "sentence",
        english: "Fluency is not about memorizing isolated vocabulary lists; it is about automating natural chunk collocations.",
        vietnamese: "Sự lưu loát không nằm ở việc học vẹt danh sách từ vựng đơn lẻ; nó là việc tự động hóa các cụm từ kết hợp tự nhiên.",
        speaker: "Author",
        ipa: "/ˈfluː.ən.si ɪz nɑːt əˈbaʊt...",
        beat_prosody: "FLU-en-cy is NOT a-bout MEM-o-riz-ing | it is a-bout AU-to-ma-ting CHUNKS"
      },
      {
        chunk_id: "b15_05",
        item_number: 5,
        category: "idiom",
        english: "the sky is the limit",
        vietnamese: "không có giới hạn nào cho tiềm năng và thành công của bạn",
        speaker: "Mentor",
        ipa: "/ðə skaɪ ɪz ðə ˈlɪm.ɪt/",
        beat_prosody: "the SKY is the LIM-it"
      },
      {
        chunk_id: "b15_06",
        item_number: 6,
        category: "slang",
        english: "You aced the exam!",
        vietnamese: "Bạn đã vượt qua bài thi xuất sắc điểm 10 tuyệt đối!",
        speaker: "Teacher",
        ipa: "/juː eɪst ði ɪɡˈzæm/",
        beat_prosody: "You ACED the ex-AM!"
      },
      {
        chunk_id: "b15_07",
        item_number: 7,
        category: "phrase",
        english: "maintain continuous daily shadowing practice",
        vietnamese: "duy trì thói quen luyện nói nhại (shadowing) hàng ngày liên tục",
        speaker: "Coach",
        ipa: "/meɪnˈteɪn kənˈtɪn.ju.əs...",
        beat_prosody: "main-TAIN con-TIN-u-ous DAI-ly SHAD-ow-ing"
      },
      {
        chunk_id: "b15_08",
        item_number: 8,
        category: "grammar",
        english: "The more consistently you vocalize these speech patterns, the more effortless your accent becomes.",
        vietnamese: "Bạn càng kiên trì phát âm các mẫu câu này, ngữ điệu giọng nói của bạn sẽ càng trở nên tự nhiên và nhẹ nhàng.",
        speaker: "Teacher",
        ipa: "/ðə mɔːr kənˈsɪs.tənt.li juː...",
        beat_prosody: "The MORE con-SIS-tent-ly you VO-cal-ize | the MORE EF-fort-less your AC-cent"
      },
      {
        chunk_id: "b15_09",
        item_number: 9,
        category: "verb",
        english: "unlock international career opportunities",
        vietnamese: "mở khóa vô vàn cơ hội phát triển sự nghiệp trên đấu trường quốc tế",
        speaker: "Advisor",
        ipa: "/ʌnˈlɑːk ˌɪn.t̬ɚˈnæʃ.ən.əl...",
        beat_prosody: "un-LOCK in-ter-NA-tion-al ca-REER op-por-TU-ni-ties"
      },
      {
        chunk_id: "b15_10",
        item_number: 10,
        category: "sentence",
        english: "Never stop learning, challenging your comfort zone, and expressing your genuine voice to the world.",
        vietnamese: "Đừng bao giờ ngừng học hỏi, không ngừng bứt phá khỏi vùng an toàn và cất lên tiếng nói chân thật của mình với thế giới.",
        speaker: "Mentor",
        ipa: "/ˈnev.ər stɑːp ˈlɜːr.nɪŋ...",
        beat_prosody: "NEV-er STOP LEARN-ing | CHAL-lenge your COM-fort ZONE | and EX-press your VOICE"
      },
      {
        chunk_id: "b15_11",
        item_number: 11,
        category: "word_family",
        english: "master - mastery - masterful",
        vietnamese: "làm chủ/bậc thầy (danh từ/động từ) - sự tinh thông (danh từ) - tài ba điêu luyện (tính từ)",
        speaker: "Teacher",
        ipa: "/ˈmæs.tər - ˈmæs.tər.i - ˈmæs.tər.fəl/",
        beat_prosody: "MAS-ter | MAS-ter-y | MAS-ter-ful"
      },
      {
        chunk_id: "b15_12",
        item_number: 12,
        category: "review",
        english: "Graduation ceremony: Receive your Certificate of Mastery in Chunking English Pedagogy.",
        vietnamese: "Lễ bế giảng tốt nghiệp: Trao Chứng nhận Tinh thông Phương pháp Giảng dạy Tiếng Anh theo Cụm.",
        speaker: "Dean",
        ipa: "/ˌɡrædʒ.uˈeɪ.ʃən ˈser.ə.mə.ni...",
        beat_prosody: "GRAD-u-a-tion CER-e-mo-ny | Cer-TIF-i-cate of MAS-ter-y"
      }
    ]
  }
];

export function getLessonById(lessonId: string): LessonDoc | undefined {
  return CURRICULUM_CATALOG_LEVEL_B.find(l => l.id === lessonId);
}

export function getAllChunks(): ChunkItem[] {
  return CURRICULUM_CATALOG_LEVEL_B.flatMap(l => l.chunks);
}
