import { ImprovPackage } from '../types';

export const DEFAULT_IMPROV_PACKAGES: ImprovPackage[] = [
  {
    id: 'pkg_level_b_reflex_mastery',
    title: 'Level B • Spoken Reflex & Fluency Masterclass',
    description: '30 high-impact conversational items across 2-hint and 3-hint progressive deduction drills.',
    totalItems: 30,
    sessionsCount: 2,
    createdAt: '2026-09-01T08:00:00.000Z',
    updatedAt: '2026-09-02T12:00:00.000Z',
    sourceCourseLevel: 'LEVEL_B_ERES',
    sessions: [
      {
        sessionNumber: 1,
        title: 'Session 1 • 2 Hints (Rapid Reaction & Core Phrasing)',
        hcTotal: 2,
        hintTypes: ['Keyword', 'Ending'],
        items: [
          {
            id: 'item_s1_i1_shot',
            itemNumber: 1,
            sessionNumber: 1,
            hcTotal: 2,
            hints: [
              {
                id: 'h_1_1_1',
                itemIndex: 1,
                text: 'give it a shot',
                translation: 'thử làm xem sao / thử một phen',
                typeFunction: 'Keyword'
              },
              {
                id: 'h_1_1_2',
                itemIndex: 2,
                text: "why don't you",
                translation: 'sao bạn không...',
                typeFunction: 'Logic word'
              }
            ]
          },
          {
            id: 'item_s1_i2_traffic',
            itemNumber: 2,
            sessionNumber: 1,
            hcTotal: 2,
            hints: [
              {
                id: 'h_1_2_1',
                itemIndex: 1,
                text: 'stuck in traffic',
                translation: 'bị kẹt xe / tắc đường',
                typeFunction: 'Keyword'
              },
              {
                id: 'h_1_2_2',
                itemIndex: 2,
                text: 'because I was',
                translation: 'bởi vì tôi bị...',
                typeFunction: 'Logic word'
              }
            ]
          },
          {
            id: 'item_s1_i3_day',
            itemNumber: 3,
            sessionNumber: 1,
            hcTotal: 2,
            hints: [
              {
                id: 'h_1_3_1',
                itemIndex: 1,
                text: 'call it a day',
                translation: 'kết thúc ngày làm việc / nghỉ ngơi',
                typeFunction: 'Keyword'
              },
              {
                id: 'h_1_3_2',
                itemIndex: 2,
                text: "let's wrap up and",
                translation: 'chúng ta hãy chốt lại và...',
                typeFunction: 'Ending'
              }
            ]
          },
          {
            id: 'item_s1_i4_page',
            itemNumber: 4,
            sessionNumber: 1,
            hcTotal: 2,
            hints: [
              {
                id: 'h_1_4_1',
                itemIndex: 1,
                text: 'on the same page',
                translation: 'cùng chung quan điểm / thống nhất ý kiến',
                typeFunction: 'Keyword'
              },
              {
                id: 'h_1_4_2',
                itemIndex: 2,
                text: "make sure we're",
                translation: 'đảm bảo rằng chúng ta...',
                typeFunction: 'Logic word'
              }
            ]
          },
          {
            id: 'item_s1_i5_time',
            itemNumber: 5,
            sessionNumber: 1,
            hcTotal: 2,
            hints: [
              {
                id: 'h_1_5_1',
                itemIndex: 1,
                text: 'run out of time',
                translation: 'hết sạch thời gian',
                typeFunction: 'Keyword'
              },
              {
                id: 'h_1_5_2',
                itemIndex: 2,
                text: "we're about to",
                translation: 'chúng ta sắp sửa...',
                typeFunction: 'Logic word'
              }
            ]
          },
          {
            id: 'item_s1_i6_sleep',
            itemNumber: 6,
            sessionNumber: 1,
            hcTotal: 2,
            hints: [
              {
                id: 'h_1_6_1',
                itemIndex: 1,
                text: 'sleep on it',
                translation: 'suy nghĩ thêm qua đêm / chưa quyết vội',
                typeFunction: 'Keyword'
              },
              {
                id: 'h_1_6_2',
                itemIndex: 2,
                text: 'I need to',
                translation: 'tôi cần phải...',
                typeFunction: 'Logic word'
              }
            ]
          },
          {
            id: 'item_s1_i7_posted',
            itemNumber: 7,
            sessionNumber: 1,
            hcTotal: 2,
            hints: [
              {
                id: 'h_1_7_1',
                itemIndex: 1,
                text: 'keep me posted',
                translation: 'liên tục cập nhật tin tức cho tôi',
                typeFunction: 'Keyword'
              },
              {
                id: 'h_1_7_2',
                itemIndex: 2,
                text: 'please remember to',
                translation: 'xin hãy nhớ...',
                typeFunction: 'Ending'
              }
            ]
          },
          {
            id: 'item_s1_i8_point',
            itemNumber: 8,
            sessionNumber: 1,
            hcTotal: 2,
            hints: [
              {
                id: 'h_1_8_1',
                itemIndex: 1,
                text: 'get straight to the point',
                translation: 'đi thẳng vào trọng tâm vấn đề',
                typeFunction: 'Keyword'
              },
              {
                id: 'h_1_8_2',
                itemIndex: 2,
                text: "let's not waste time and",
                translation: 'đừng lãng phí thời gian và hãy...',
                typeFunction: 'Logic word'
              }
            ]
          },
          {
            id: 'item_s1_i9_weather',
            itemNumber: 9,
            sessionNumber: 1,
            hcTotal: 2,
            hints: [
              {
                id: 'h_1_9_1',
                itemIndex: 1,
                text: 'under the weather',
                translation: 'cảm thấy mệt mỏi / không khỏe trong người',
                typeFunction: 'Keyword'
              },
              {
                id: 'h_1_9_2',
                itemIndex: 2,
                text: 'feeling a bit',
                translation: 'cảm thấy hơi...',
                typeFunction: 'Logic word'
              }
            ]
          },
          {
            id: 'item_s1_i10_bullet',
            itemNumber: 10,
            sessionNumber: 1,
            hcTotal: 2,
            hints: [
              {
                id: 'h_1_10_1',
                itemIndex: 1,
                text: 'bite the bullet',
                translation: 'cắn răng chịu đựng / quyết định làm việc khó',
                typeFunction: 'Keyword'
              },
              {
                id: 'h_1_10_2',
                itemIndex: 2,
                text: 'we just have to',
                translation: 'chúng ta đành phải...',
                typeFunction: 'Logic word'
              }
            ]
          },
          {
            id: 'item_s1_i11_blue',
            itemNumber: 11,
            sessionNumber: 1,
            hcTotal: 2,
            hints: [
              {
                id: 'h_1_11_1',
                itemIndex: 1,
                text: 'out of the blue',
                translation: 'bất thình lình / không báo trước',
                typeFunction: 'Keyword'
              },
              {
                id: 'h_1_11_2',
                itemIndex: 2,
                text: 'it happened completely',
                translation: 'nó đã diễn ra hoàn toàn...',
                typeFunction: 'Ending'
              }
            ]
          },
          {
            id: 'item_s1_i12_running',
            itemNumber: 12,
            sessionNumber: 1,
            hcTotal: 2,
            hints: [
              {
                id: 'h_1_12_1',
                itemIndex: 1,
                text: 'hit the ground running',
                translation: 'bắt tay vào việc một cách năng nổ ngay lập tức',
                typeFunction: 'Keyword'
              },
              {
                id: 'h_1_12_2',
                itemIndex: 2,
                text: 'ready to',
                translation: 'sẵn sàng để...',
                typeFunction: 'Logic word'
              }
            ]
          },
          {
            id: 'item_s1_i13_run',
            itemNumber: 13,
            sessionNumber: 1,
            hcTotal: 2,
            hints: [
              {
                id: 'h_1_13_1',
                itemIndex: 1,
                text: 'in the long run',
                translation: 'về lâu về dài / trong tương lai xa',
                typeFunction: 'Keyword'
              },
              {
                id: 'h_1_13_2',
                itemIndex: 2,
                text: 'it will pay off',
                translation: 'nó sẽ mang lại thành quả xứng đáng...',
                typeFunction: 'Ending'
              }
            ]
          },
          {
            id: 'item_s1_i14_base',
            itemNumber: 14,
            sessionNumber: 1,
            hcTotal: 2,
            hints: [
              {
                id: 'h_1_14_1',
                itemIndex: 1,
                text: 'touch base',
                translation: 'liên lạc trao đổi ngắn gọn',
                typeFunction: 'Keyword'
              },
              {
                id: 'h_1_14_2',
                itemIndex: 2,
                text: "let's find time to",
                translation: 'hãy tìm thời gian để...',
                typeFunction: 'Logic word'
              }
            ]
          },
          {
            id: 'item_s1_i15_board',
            itemNumber: 15,
            sessionNumber: 1,
            hcTotal: 2,
            hints: [
              {
                id: 'h_1_15_1',
                itemIndex: 1,
                text: 'back to the drawing board',
                translation: 'bắt đầu lại từ đầu / lên lại kế hoạch mới',
                typeFunction: 'Keyword'
              },
              {
                id: 'h_1_15_2',
                itemIndex: 2,
                text: 'we have to go',
                translation: 'chúng ta phải...',
                typeFunction: 'Ending'
              }
            ]
          }
        ]
      },
      {
        sessionNumber: 2,
        title: 'Session 2 • 3 Hints (Complex Logic & Cause-Effect)',
        hcTotal: 3,
        hintTypes: ['Keyword', 'Logic word', 'Ending'],
        items: [
          {
            id: 'item_s2_i1_flight',
            itemNumber: 1,
            sessionNumber: 2,
            hcTotal: 3,
            hints: [
              {
                id: 'h_2_1_1',
                itemIndex: 1,
                text: 'heavy traffic jam',
                translation: 'tình trạng kẹt xe nghiêm trọng',
                typeFunction: 'Keyword'
              },
              {
                id: 'h_2_1_2',
                itemIndex: 2,
                text: 'because of the',
                translation: 'chính vì...',
                typeFunction: 'Logic word'
              },
              {
                id: 'h_2_1_3',
                itemIndex: 3,
                text: 'missed my flight',
                translation: 'tôi đã bị lỡ chuyến bay',
                typeFunction: 'Ending'
              }
            ]
          },
          {
            id: 'item_s2_i2_deadline',
            itemNumber: 2,
            sessionNumber: 2,
            hcTotal: 3,
            hints: [
              {
                id: 'h_2_2_1',
                itemIndex: 1,
                text: 'tight deadline',
                translation: 'hạn chót vô cùng gấp gáp',
                typeFunction: 'Keyword'
              },
              {
                id: 'h_2_2_2',
                itemIndex: 2,
                text: 'due to the',
                translation: 'do...',
                typeFunction: 'Logic word'
              },
              {
                id: 'h_2_2_3',
                itemIndex: 3,
                text: 'worked overtime all week',
                translation: 'đã phải làm việc tăng ca cả tuần',
                typeFunction: 'Ending'
              }
            ]
          },
          {
            id: 'item_s2_i3_power',
            itemNumber: 3,
            sessionNumber: 2,
            hcTotal: 3,
            hints: [
              {
                id: 'h_2_3_1',
                itemIndex: 1,
                text: 'power outage',
                translation: 'sự cố mất điện đột ngột',
                typeFunction: 'Keyword'
              },
              {
                id: 'h_2_3_2',
                itemIndex: 2,
                text: 'unexpected',
                translation: 'bất ngờ / không báo trước',
                typeFunction: 'Fancy word'
              },
              {
                id: 'h_2_3_3',
                itemIndex: 3,
                text: 'lost all unsaved work',
                translation: 'mất sạch dữ liệu chưa kịp lưu',
                typeFunction: 'Ending'
              }
            ]
          },
          {
            id: 'item_s2_i4_budget',
            itemNumber: 4,
            sessionNumber: 2,
            hcTotal: 3,
            hints: [
              {
                id: 'h_2_4_1',
                itemIndex: 1,
                text: 'budget constraints',
                translation: 'các giới hạn về ngân sách',
                typeFunction: 'Keyword'
              },
              {
                id: 'h_2_4_2',
                itemIndex: 2,
                text: 'as a result of',
                translation: 'kết quả là do...',
                typeFunction: 'Logic word'
              },
              {
                id: 'h_2_4_3',
                itemIndex: 3,
                text: 'delayed the product launch',
                translation: 'đã phải hoãn ngày ra mắt sản phẩm',
                typeFunction: 'Ending'
              }
            ]
          },
          {
            id: 'item_s2_i5_conflict',
            itemNumber: 5,
            sessionNumber: 2,
            hcTotal: 3,
            hints: [
              {
                id: 'h_2_5_1',
                itemIndex: 1,
                text: 'miscommunication',
                translation: 'sự bất đồng / thiếu truyền thông rõ ràng',
                typeFunction: 'Keyword'
              },
              {
                id: 'h_2_5_2',
                itemIndex: 2,
                text: 'led to serious',
                translation: 'đã dẫn tới...',
                typeFunction: 'Fancy word'
              },
              {
                id: 'h_2_5_3',
                itemIndex: 3,
                text: 'caused the team conflict',
                translation: 'gây ra mâu thuẫn trong nội bộ nhóm',
                typeFunction: 'Ending'
              }
            ]
          },
          {
            id: 'item_s2_i6_internet',
            itemNumber: 6,
            sessionNumber: 2,
            hcTotal: 3,
            hints: [
              {
                id: 'h_2_6_1',
                itemIndex: 1,
                text: 'internet connection',
                translation: 'đường truyền kết nối mạng internet',
                typeFunction: 'Keyword'
              },
              {
                id: 'h_2_6_2',
                itemIndex: 2,
                text: 'suddenly dropped',
                translation: 'bất ngờ bị ngắt kết nối',
                typeFunction: 'Logic word'
              },
              {
                id: 'h_2_6_3',
                itemIndex: 3,
                text: 'disconnected from the call',
                translation: 'bị ngắt khỏi cuộc gọi hội nghị',
                typeFunction: 'Ending'
              }
            ]
          },
          {
            id: 'item_s2_i7_demand',
            itemNumber: 7,
            sessionNumber: 2,
            hcTotal: 3,
            hints: [
              {
                id: 'h_2_7_1',
                itemIndex: 1,
                text: 'market demand',
                translation: 'nhu cầu gia tăng của thị trường',
                typeFunction: 'Keyword'
              },
              {
                id: 'h_2_7_2',
                itemIndex: 2,
                text: 'in response to growing',
                translation: 'để đáp ứng kịp thời...',
                typeFunction: 'Fancy word'
              },
              {
                id: 'h_2_7_3',
                itemIndex: 3,
                text: 'expanded our engineering team',
                translation: 'mở rộng quy mô đội ngũ kỹ sư',
                typeFunction: 'Ending'
              }
            ]
          },
          {
            id: 'item_s2_i8_overslept',
            itemNumber: 8,
            sessionNumber: 2,
            hcTotal: 3,
            hints: [
              {
                id: 'h_2_8_1',
                itemIndex: 1,
                text: 'overslept this morning',
                translation: 'ngủ quên sáng hôm nay',
                typeFunction: 'Keyword'
              },
              {
                id: 'h_2_8_2',
                itemIndex: 2,
                text: "because my alarm didn't ring",
                translation: 'vì chuông báo thức không reo',
                typeFunction: 'Logic word'
              },
              {
                id: 'h_2_8_3',
                itemIndex: 3,
                text: 'arrived late for the briefing',
                translation: 'đã đến muộn buổi họp ngắn',
                typeFunction: 'Ending'
              }
            ]
          },
          {
            id: 'item_s2_i9_delay',
            itemNumber: 9,
            sessionNumber: 2,
            hcTotal: 3,
            hints: [
              {
                id: 'h_2_9_1',
                itemIndex: 1,
                text: 'flight delay',
                translation: 'sự cố chuyến bay bị trễ giờ',
                typeFunction: 'Keyword'
              },
              {
                id: 'h_2_9_2',
                itemIndex: 2,
                text: 'due to severe storm',
                translation: 'do cơn bão nghiêm trọng',
                typeFunction: 'Logic word'
              },
              {
                id: 'h_2_9_3',
                itemIndex: 3,
                text: 'rescheduled client meeting',
                translation: 'dời lại lịch hẹn với khách hàng',
                typeFunction: 'Ending'
              }
            ]
          },
          {
            id: 'item_s2_i10_feedback',
            itemNumber: 10,
            sessionNumber: 2,
            hcTotal: 3,
            hints: [
              {
                id: 'h_2_10_1',
                itemIndex: 1,
                text: 'customer feedback',
                translation: 'ý kiến đóng góp từ khách hàng',
                typeFunction: 'Keyword'
              },
              {
                id: 'h_2_10_2',
                itemIndex: 2,
                text: 'based on invaluable',
                translation: 'dựa trên những đóng góp vô giá...',
                typeFunction: 'Fancy word'
              },
              {
                id: 'h_2_10_3',
                itemIndex: 3,
                text: 'revamped user interface',
                translation: 'tái thiết kế toàn bộ giao diện người dùng',
                typeFunction: 'Ending'
              }
            ]
          },
          {
            id: 'item_s2_i11_workload',
            itemNumber: 11,
            sessionNumber: 2,
            hcTotal: 3,
            hints: [
              {
                id: 'h_2_11_1',
                itemIndex: 1,
                text: 'heavy workload',
                translation: 'khối lượng công việc quá tải',
                typeFunction: 'Keyword'
              },
              {
                id: 'h_2_11_2',
                itemIndex: 2,
                text: 'struggling with overwhelming',
                translation: 'đang chật vật với...',
                typeFunction: 'Logic word'
              },
              {
                id: 'h_2_11_3',
                itemIndex: 3,
                text: 'requested additional resources',
                translation: 'yêu cầu bổ sung thêm nhân sự',
                typeFunction: 'Ending'
              }
            ]
          },
          {
            id: 'item_s2_i12_deal',
            itemNumber: 12,
            sessionNumber: 2,
            hcTotal: 3,
            hints: [
              {
                id: 'h_2_12_1',
                itemIndex: 1,
                text: 'price negotiation',
                translation: 'quá trình đàm phán giá cả',
                typeFunction: 'Keyword'
              },
              {
                id: 'h_2_12_2',
                itemIndex: 2,
                text: 'after hours of tough',
                translation: 'sau hàng giờ căng thẳng...',
                typeFunction: 'Fancy word'
              },
              {
                id: 'h_2_12_3',
                itemIndex: 3,
                text: 'closed an outstanding deal',
                translation: 'chốt thành công một hợp đồng xuất sắc',
                typeFunction: 'Ending'
              }
            ]
          },
          {
            id: 'item_s2_i13_update',
            itemNumber: 13,
            sessionNumber: 2,
            hcTotal: 3,
            hints: [
              {
                id: 'h_2_13_1',
                itemIndex: 1,
                text: 'system update',
                translation: 'bản nâng cấp hệ thống phần mềm',
                typeFunction: 'Keyword'
              },
              {
                id: 'h_2_13_2',
                itemIndex: 2,
                text: 'right after completing',
                translation: 'ngay sau khi hoàn thành...',
                typeFunction: 'Logic word'
              },
              {
                id: 'h_2_13_3',
                itemIndex: 3,
                text: 'performance improved drastically',
                translation: 'hiệu năng đã tăng vọt một cách rõ rệt',
                typeFunction: 'Ending'
              }
            ]
          },
          {
            id: 'item_s2_i14_slides',
            itemNumber: 14,
            sessionNumber: 2,
            hcTotal: 3,
            hints: [
              {
                id: 'h_2_14_1',
                itemIndex: 1,
                text: 'presentation slides',
                translation: 'tài liệu các trang trình chiếu',
                typeFunction: 'Keyword'
              },
              {
                id: 'h_2_14_2',
                itemIndex: 2,
                text: 'forgot to bring',
                translation: 'quên mang theo...',
                typeFunction: 'Logic word'
              },
              {
                id: 'h_2_14_3',
                itemIndex: 3,
                text: 'delivered pitch from memory',
                translation: 'thuyết trình dự án hoàn toàn bằng trí nhớ',
                typeFunction: 'Ending'
              }
            ]
          },
          {
            id: 'item_s2_i15_career',
            itemNumber: 15,
            sessionNumber: 2,
            hcTotal: 3,
            hints: [
              {
                id: 'h_2_12_1',
                itemIndex: 1,
                text: 'career opportunity',
                translation: 'cơ hội phát triển sự nghiệp',
                typeFunction: 'Keyword'
              },
              {
                id: 'h_2_12_2',
                itemIndex: 2,
                text: 'seized the unprecedented',
                translation: 'nắm bắt cơ hội chưa từng có...',
                typeFunction: 'Fancy word'
              },
              {
                id: 'h_2_12_3',
                itemIndex: 3,
                text: 'relocated to Tokyo headquarters',
                translation: 'chuyển công tác đến trụ sở tại Tokyo',
                typeFunction: 'Ending'
              }
            ]
          }
        ]
      }
    ]
  },
  {
    id: 'pkg_business_executive_improv',
    title: 'Business Executive • High-Stakes Workplace Q&A',
    description: 'Executive-level rapid response chunks for meetings, negotiations, and strategy sessions.',
    totalItems: 12,
    sessionsCount: 1,
    createdAt: '2026-09-01T09:00:00.000Z',
    updatedAt: '2026-09-02T14:00:00.000Z',
    sourceCourseLevel: 'BUSINESS_CHUNK_PRO',
    sessions: [
      {
        sessionNumber: 1,
        title: 'Session 1 • 3 Hints (Strategic Alignment & KPIs)',
        hcTotal: 3,
        hintTypes: ['Keyword', 'Logic word', 'Ending'],
        items: [
          {
            id: 'item_b1_i1',
            itemNumber: 1,
            sessionNumber: 1,
            hcTotal: 3,
            hints: [
              {
                id: 'h_b1_1_1',
                itemIndex: 1,
                text: 'competitive advantage',
                translation: 'lợi thế cạnh tranh cốt lõi',
                typeFunction: 'Keyword'
              },
              {
                id: 'h_b1_1_2',
                itemIndex: 2,
                text: 'to sustain our long-term',
                translation: 'để duy trì... lâu dài của chúng ta',
                typeFunction: 'Logic word'
              },
              {
                id: 'h_b1_1_3',
                itemIndex: 3,
                text: 'invest heavily in AI automation',
                translation: 'đầu tư mạnh mẽ vào tự động hóa bằng AI',
                typeFunction: 'Ending'
              }
            ]
          },
          {
            id: 'item_b1_i2',
            itemNumber: 2,
            sessionNumber: 1,
            hcTotal: 3,
            hints: [
              {
                id: 'h_b1_2_1',
                itemIndex: 1,
                text: 'quarterly revenue targets',
                translation: 'chỉ tiêu doanh thu theo từng quý',
                typeFunction: 'Keyword'
              },
              {
                id: 'h_b1_2_2',
                itemIndex: 2,
                text: 'in order to exceed',
                translation: 'nhằm mục đích vượt qua...',
                typeFunction: 'Logic word'
              },
              {
                id: 'h_b1_2_3',
                itemIndex: 3,
                text: 'optimized enterprise sales pipeline',
                translation: 'tối ưu hóa toàn bộ quy trình bán hàng doanh nghiệp',
                typeFunction: 'Ending'
              }
            ]
          },
          {
            id: 'item_b1_i3',
            itemNumber: 3,
            sessionNumber: 1,
            hcTotal: 3,
            hints: [
              {
                id: 'h_b1_3_1',
                itemIndex: 1,
                text: 'stakeholder expectations',
                translation: 'kỳ vọng của các bên liên quan',
                typeFunction: 'Keyword'
              },
              {
                id: 'h_b1_3_2',
                itemIndex: 2,
                text: 'perfectly aligned with',
                translation: 'đồng nhất hoàn toàn với...',
                typeFunction: 'Fancy word'
              },
              {
                id: 'h_b1_3_3',
                itemIndex: 3,
                text: 'delivered comprehensive project report',
                translation: 'bàn giao bản báo cáo dự án toàn diện',
                typeFunction: 'Ending'
              }
            ]
          },
          {
            id: 'item_b1_i4',
            itemNumber: 4,
            sessionNumber: 1,
            hcTotal: 3,
            hints: [
              {
                id: 'h_b1_4_1',
                itemIndex: 1,
                text: 'risk mitigation strategy',
                translation: 'chiến lược giảm thiểu rủi ro',
                typeFunction: 'Keyword'
              },
              {
                id: 'h_b1_4_2',
                itemIndex: 2,
                text: 'as part of our robust',
                translation: 'như một phần trong... vững chắc của chúng ta',
                typeFunction: 'Logic word'
              },
              {
                id: 'h_b1_4_3',
                itemIndex: 3,
                text: 'diversified global supply chains',
                translation: 'đa dạng hóa các chuỗi cung ứng toàn cầu',
                typeFunction: 'Ending'
              }
            ]
          }
        ]
      }
    ]
  }
];
