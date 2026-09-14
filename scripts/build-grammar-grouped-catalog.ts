import * as fs from 'fs';
import * as path from 'path';
import { LEVEL_B_ERE_GRAMMAR_CATALOG } from '../src/data/levelBGrammarData';

const GRAMMAR_JSON_PATH = 'C:/Users/gensh/Downloads/chunks-grammar/grammar.json';
const OUTPUT_JSON_PATH = path.resolve('scripts/grammar-grouped-catalog.json');
const OUTPUT_MD_PATH = path.resolve('scripts/grammar-grouped-catalog.md');
const LEVEL_B_DATA_PATH = path.resolve('src/data/levelBGrammarData.ts');

const grammarJson = JSON.parse(fs.readFileSync(GRAMMAR_JSON_PATH, 'utf8'));

// 1. Define Module Mapping (5 days per module = 30 days across 6 modules)
const MODULE_MAPPING: Record<number, string> = {
  1: 'Onboarding',
  2: 'Onboarding',
  3: 'Onboarding',
  4: 'Onboarding',
  5: 'Onboarding',
  6: 'Office Culture',
  7: 'Office Culture',
  8: 'Office Culture',
  9: 'Office Culture',
  10: 'Office Culture',
  11: 'Operations & Management',
  12: 'Operations & Management',
  13: 'Operations & Management',
  14: 'Operations & Management',
  15: 'Operations & Management',
  16: 'Team & Leadership',
  17: 'Team & Leadership',
  18: 'Team & Leadership',
  19: 'Team & Leadership',
  20: 'Team & Leadership',
  21: 'Professional Acumen',
  22: 'Professional Acumen',
  23: 'Professional Acumen',
  24: 'Professional Acumen',
  25: 'Professional Acumen',
  26: 'Business & Sales',
  27: 'Business & Sales',
  28: 'Business & Sales',
  29: 'Business & Sales',
  30: 'Business & Sales'
};

// 2. Exact mapping for Core 19 Lessons in grammar.json
const CORE_19_MAPPING: Record<number, { gj_index: number; cohort_day_15: number; lesson_number_19: number }> = {
  5: { gj_index: 0, cohort_day_15: 1, lesson_number_19: 1 },
  6: { gj_index: 1, cohort_day_15: 1, lesson_number_19: 2 },
  9: { gj_index: 2, cohort_day_15: 2, lesson_number_19: 3 },
  10: { gj_index: 3, cohort_day_15: 2, lesson_number_19: 4 },
  11: { gj_index: 4, cohort_day_15: 4, lesson_number_19: 5 },
  12: { gj_index: 5, cohort_day_15: 4, lesson_number_19: 6 },
  14: { gj_index: 6, cohort_day_15: 5, lesson_number_19: 7 },
  15: { gj_index: 7, cohort_day_15: 5, lesson_number_19: 8 },
  17: { gj_index: 8, cohort_day_15: 7, lesson_number_19: 9 },
  18: { gj_index: 9, cohort_day_15: 7, lesson_number_19: 10 },
  20: { gj_index: 10, cohort_day_15: 8, lesson_number_19: 11 },
  21: { gj_index: 11, cohort_day_15: 8, lesson_number_19: 12 },
  23: { gj_index: 12, cohort_day_15: 10, lesson_number_19: 13 },
  24: { gj_index: 13, cohort_day_15: 10, lesson_number_19: 14 },
  25: { gj_index: 14, cohort_day_15: 11, lesson_number_19: 15 },
  26: { gj_index: 15, cohort_day_15: 11, lesson_number_19: 16 },
  27: { gj_index: 16, cohort_day_15: 13, lesson_number_19: 17 },
  29: { gj_index: 17, cohort_day_15: 13, lesson_number_19: 18 },
  30: { gj_index: 18, cohort_day_15: 14, lesson_number_19: 19 }
};

// 3. Reflex entries for Supplemental 7 Lessons (Extracted from Audio Boost)
const SUPPLEMENTAL_7_REFLEX: Record<number, { verb_forms: string[]; sentence_structures: string[]; tense: string[] }> = {
  1: {
    verb_forms: [
      "Spend + time + V-ing",
      "Spend + time + on Noun",
      "Be supposed to V1",
      "Gonna = going to"
    ],
    sentence_structures: [
      "Because of + Noun / V-ing",
      "There’s a lot of…",
      "Have [X] years of experience V-ing",
      "…, would you?"
    ],
    tense: [
      "Have you already V3…?",
      "I’m gonna V1",
      "I’ve been V-ing for [time]",
      "You were supposed to V1"
    ]
  },
  2: {
    verb_forms: [
      "Interested in + V-ing",
      "Has nothing to do with…",
      "Piss me off / Drive me crazy",
      "About to V1"
    ],
    sentence_structures: [
      "Would you mind V-ing?",
      "I do V1 (emphasis)",
      "Have someone V1",
      "What pissed me off was…"
    ],
    tense: [
      "It seemed that S + V2",
      "I would be V-ing if…",
      "Did you actually V1?",
      "I’ve got something for you"
    ]
  },
  3: {
    verb_forms: [
      "Love / like / hate + V-ing",
      "Be into Noun / V-ing",
      "Consider / see myself as…",
      "My cup of tea"
    ],
    sentence_structures: [
      "In spite of / Despite + V-ing",
      "I had a year V-ing…",
      "Like I said / mentioned,…",
      "What excites me the most is…"
    ],
    tense: [
      "I’ve been V-ing for [X] years",
      "What I just said was…",
      "Have you ever considered V-ing?",
      "I used to V1"
    ]
  },
  4: {
    verb_forms: [
      "You gotta = you have got to V1",
      "Scared / afraid of + V-ing",
      "Want / need someone to V1",
      "Turns out that…"
    ],
    sentence_structures: [
      "It’s [Adj] for someone to V1",
      "Adjective + enough to V1",
      "There is / are plenty of…",
      "Why don’t you just V1?"
    ],
    tense: [
      "As you were told,…",
      "I’ll never V1 anymore",
      "Have you got to V1?",
      "I didn't expect you to V1"
    ]
  },
  7: {
    verb_forms: [
      "To be more precise",
      "Find someone / sth + Adj",
      "Might be V-ing",
      "Who cares / Who matters"
    ],
    sentence_structures: [
      "It seems / appears like…",
      "What matters is…",
      "You never know how [Adj] S + V2",
      "…, don't you?"
    ],
    tense: [
      "I’ve never heard of… before",
      "It’s been [time] since I last V2",
      "Did you send it already?",
      "I might have V3"
    ]
  },
  8: {
    verb_forms: [
      "Speaking of / in terms of…",
      "When it comes to…",
      "Be able to V1",
      "Suffering from…",
      "Go V1 (go buy / go see)"
    ],
    sentence_structures: [
      "One of the [plural nouns]",
      "Help someone (to) V1",
      "Get / be V3 (vaccinated)",
      "Why can’t we just V1?"
    ],
    tense: [
      "Since I last V2…",
      "You will be able to V1",
      "Have you been V3 yet?",
      "I’ve had to V1 for months"
    ]
  },
  13: {
    verb_forms: [
      "Twofold = two times",
      "Which means + clause",
      "Compared to…",
      "Doesn’t necessarily mean…"
    ],
    sentence_structures: [
      "I’m nothing compared to…",
      "What’s going on / happening?",
      "There’s been a sharp increase in…",
      "As shown in the chart,…"
    ],
    tense: [
      "There has been [Noun] recently"
    , "What have you done so far?"
    , "Numbers have V3 significantly"
    , "Did it double last quarter?"
    ]
  }
};

// 4. Provisional reflex entries for Pending 4 Lessons (Missing Audio - Take it step by step / "từ từ")
const PENDING_4_REFLEX: Record<number, { verb_forms: string[]; sentence_structures: string[]; tense: string[] }> = {
  16: {
    verb_forms: [
      "Benefit from + V-ing",
      "Get left behind",
      "Follow in one’s footsteps",
      "Spend [time] on social media"
    ],
    sentence_structures: [
      "Unlike A, B will…",
      "If my calculations are right,…",
      "Why don’t we leverage…?",
      "What’s that supposed to mean?"
    ],
    tense: [
      "Hasn’t anyone told you that…?",
      "A has been V-ing rapidly",
      "It must be V3 seriously",
      "Have you checked the metrics yet?"
    ]
  },
  19: {
    verb_forms: [
      "Try V-ing (experiment)",
      "Keep V-ing (over and over)",
      "Prevent A from being V3",
      "Switch to…"
    ],
    sentence_structures: [
      "Why the long face?",
      "Nine times out of 10,…",
      "May I ask you a favor?",
      "It usually takes [time] to V1"
    ],
    tense: [
      "I’ve been stuck with this sheet all day",
      "The file won’t allow me to V1",
      "Has it been recalculated yet?",
      "I should have saved the backup"
    ]
  },
  22: {
    verb_forms: [
      "Pull strings",
      "Land an internship / job",
      "Pave the way for…",
      "Spill the beans"
    ],
    sentence_structures: [
      "There is no such thing as…",
      "If you can’t beat them, join them",
      "It’s no shame to V1",
      "Don’t be surprised if…"
    ],
    tense: [
      "A once V2… (past habit)",
      "No one is gonna suspect a thing",
      "He has been promoted three times",
      "I didn’t buy what they said"
    ]
  },
  28: {
    verb_forms: [
      "Mistake A for B",
      "Look past something",
      "Take responsibility for V-ing",
      "Out of one’s hands"
    ],
    sentence_structures: [
      "If it weren’t for A, I would V1",
      "It takes two to tango",
      "There’s really not much we can do",
      "Is there any way that you can V1?"
    ],
    tense: [
      "I thought you had V3… for someone else",
      "Don’t act so surprised when S + V1",
      "Have you ever reached out to them?",
      "We’ve had no issues so far"
    ]
  }
};

interface UnifiedGrammarItem {
  id: string;
  lesson_id: string;
  course_id: string;
  day_number: number;
  lesson_title: string;
  thematic_module: string;
  data_group: 'core_19_lessons' | 'supplemental_7_lessons' | 'pending_4_lessons';
  status: 'active' | 'pending_audio';
  cohort_day_15: number | null;
  lesson_number_19: number | null;
  verb_forms: string[];
  sentence_structures: string[];
  tense: string[];
  notes: string;
  updated_at?: string;
}

const existingNotesMap = new Map<number, string>();
LEVEL_B_ERE_GRAMMAR_CATALOG.forEach(item => {
  existingNotesMap.set(item.day_number, item.notes || '');
});

const unifiedCatalog: UnifiedGrammarItem[] = [];

for (let day = 1; day <= 30; day++) {
  const existingDoc = LEVEL_B_ERE_GRAMMAR_CATALOG.find(x => x.day_number === day);
  const lesson_title = existingDoc?.lesson_title || `Day ${day}`;
  const thematic_module = MODULE_MAPPING[day];
  let notes = existingNotesMap.get(day) || '';

  if (CORE_19_MAPPING[day]) {
    const core = CORE_19_MAPPING[day];
    const gjItem = grammarJson[core.gj_index];
    unifiedCatalog.push({
      id: `grammar_level_b_day_${day}`,
      lesson_id: `level_b_day_${day}`,
      course_id: 'course_level_b',
      day_number: day,
      lesson_title,
      thematic_module,
      data_group: 'core_19_lessons',
      status: 'active',
      cohort_day_15: core.cohort_day_15,
      lesson_number_19: core.lesson_number_19,
      verb_forms: gjItem.verb_forms,
      sentence_structures: gjItem.sentence_structures,
      tense: gjItem.tense,
      notes,
      updated_at: new Date().toISOString()
    });
  } else if (SUPPLEMENTAL_7_REFLEX[day]) {
    const supp = SUPPLEMENTAL_7_REFLEX[day];
    unifiedCatalog.push({
      id: `grammar_level_b_day_${day}`,
      lesson_id: `level_b_day_${day}`,
      course_id: 'course_level_b',
      day_number: day,
      lesson_title,
      thematic_module,
      data_group: 'supplemental_7_lessons',
      status: 'active',
      cohort_day_15: null,
      lesson_number_19: null,
      verb_forms: supp.verb_forms,
      sentence_structures: supp.sentence_structures,
      tense: supp.tense,
      notes,
      updated_at: new Date().toISOString()
    });
  } else if (PENDING_4_REFLEX[day]) {
    const pend = PENDING_4_REFLEX[day];
    // Append notice to notes if not already present
    if (!notes.includes('Pending Teacher Audio')) {
      notes = `> [!NOTE]\n> **Status: Pending Teacher Audio Recording**\n> Grammar reflex bullets below are provisional patterns extracted from verified lesson chunks.\n\n` + notes;
    }
    unifiedCatalog.push({
      id: `grammar_level_b_day_${day}`,
      lesson_id: `level_b_day_${day}`,
      course_id: 'course_level_b',
      day_number: day,
      lesson_title,
      thematic_module,
      data_group: 'pending_4_lessons',
      status: 'pending_audio',
      cohort_day_15: null,
      lesson_number_19: null,
      verb_forms: pend.verb_forms,
      sentence_structures: pend.sentence_structures,
      tense: pend.tense,
      notes,
      updated_at: new Date().toISOString()
    });
  }
}

console.log(`Unified catalog prepared: ${unifiedCatalog.length} lessons`);
console.log(`- Core 19: ${unifiedCatalog.filter(x => x.data_group === 'core_19_lessons').length}`);
console.log(`- Supplemental 7: ${unifiedCatalog.filter(x => x.data_group === 'supplemental_7_lessons').length}`);
console.log(`- Pending 4: ${unifiedCatalog.filter(x => x.data_group === 'pending_4_lessons').length}`);

// 1. Output JSON Catalog
const jsonOutput = {
  metadata: {
    version: '2.0.0',
    generated_at: new Date().toISOString(),
    total_topics: 30,
    groups: {
      core_19_lessons: {
        count: 19,
        description: 'Verified lessons from grammar.json mapped to 15-day intensive cohort schedule'
      },
      supplemental_7_lessons: {
        count: 7,
        description: 'Lessons transcribed from Audio Boost with reflex-oriented condensation'
      },
      pending_4_lessons: {
        count: 4,
        description: 'Lessons pending teacher audio recording with provisional chunk-derived reflexes'
      }
    },
    thematic_modules: [
      'Onboarding',
      'Office Culture',
      'Operations & Management',
      'Team & Leadership',
      'Professional Acumen',
      'Business & Sales'
    ]
  },
  lessons: unifiedCatalog
};

fs.writeFileSync(OUTPUT_JSON_PATH, JSON.stringify(jsonOutput, null, 2), 'utf8');
console.log(`Wrote JSON catalog to ${OUTPUT_JSON_PATH}`);

// 2. Output Markdown Report
let mdContent = `# CHUNKS Level B ERE: Grammar Grouping & Partitioning Catalog
**Canonical Reflex Structure & Dual-Index Curriculum Map**  
*Audited and Generated: ${new Date().toISOString()}*

---

## 1. Executive Overview & Data Partitioning

This catalog establishes the canonical grammar structure for all 30 days of the **Level B - ERE (English Reflexes Enhancement)** course, aligning with the punchy, reflex-oriented format of \`grammar.json\` (3–5 bullets per category with \`V1/V2/V3\` notations, eliminating academic jargon).

### 📊 Dataset Breakdown

| Data Group | Count | Status | Description & Pedagogy |
| :--- | :---: | :---: | :--- |
| **Group 1: Core 19 Lessons** | 19 | \`active\` | Directly extracted and verified from \`grammar.json\`. Maps to 10 teaching sessions in a 15-day cohort schedule. |
| **Group 2: Supplemental 7 Lessons** | 7 | \`active\` | Transcribed from Grammar Boost audio, condensed into reflex-oriented patterns matching \`grammar.json\` format. |
| **Group 3: Pending 4 Lessons** | 4 | \`pending_audio\` | Topics missing teacher audio recordings (Days 16, 19, 22, 28). Equipped with provisional chunk-derived reflex items marked \`pending_audio\`. |
| **Total Curriculum** | **30** | - | **100% complete coverage across 6 thematic modules.** |

---

## 2. Dual-Index Master Curriculum Map

Every lesson possesses a dual index:
- **30-Day Master Schedule**: Sequential days 1 through 30.
- **15-Day Cohort Schedule**: Intensive 2-lesson format covering 10 teaching days (Days 1, 2, 4, 5, 7, 8, 10, 11, 13, 14), with review/milestone days on Days 3, 6, 9, 12, 15.

| Day (1–30) | Lesson Title | Thematic Module | Data Group | Status | 15-Day Cohort | 19-Lesson Index |
| :---: | :--- | :--- | :---: | :---: | :---: | :---: |
`;

unifiedCatalog.forEach(l => {
  const cohortDay = l.cohort_day_15 ? `Day ${l.cohort_day_15}` : '—';
  const lessonIdx = l.lesson_number_19 ? `Lesson ${l.lesson_number_19}` : '—';
  const statusBadge = l.status === 'active' ? '🟢 `active`' : '🟡 `pending_audio`';
  mdContent += `| **Day ${l.day_number}** | ${l.lesson_title} | ${l.thematic_module} | \`${l.data_group}\` | ${statusBadge} | ${cohortDay} | ${lessonIdx} |\n`;
});

mdContent += `\n---\n\n## 3. Thematic Pedagogical Modules (6 Modules)\n\n`;

const modules = [
  'Onboarding',
  'Office Culture',
  'Operations & Management',
  'Team & Leadership',
  'Professional Acumen',
  'Business & Sales'
];

modules.forEach((mod, modIdx) => {
  const modLessons = unifiedCatalog.filter(l => l.thematic_module === mod);
  mdContent += `### Module ${modIdx + 1}: ${mod} (Days ${modLessons[0].day_number}–${modLessons[modLessons.length - 1].day_number})\n\n`;
  modLessons.forEach(l => {
    mdContent += `#### 📌 Day ${l.day_number}: ${l.lesson_title}\n`;
    mdContent += `- **Group**: \`${l.data_group}\` | **Status**: \`${l.status}\`${l.lesson_number_19 ? ` | **Cohort**: Day ${l.cohort_day_15} (Lesson ${l.lesson_number_19})` : ''}\n`;
    mdContent += `- **Verb Forms & Phrases**:\n`;
    l.verb_forms.forEach(v => mdContent += `  - \`${v}\`\n`);
    mdContent += `- **Sentence Structures**:\n`;
    if (l.sentence_structures.length === 0) {
      mdContent += `  - *(Integrated into verb forms / no separate structures)*\n`;
    } else {
      l.sentence_structures.forEach(s => mdContent += `  - \`${s}\`\n`);
    }
    mdContent += `- **Tense & Reflex Frames**:\n`;
    l.tense.forEach(t => mdContent += `  - \`${t}\`\n`);
    mdContent += `\n`;
  });
});

mdContent += `\n---\n\n## 4. Pedagogical Guidelines for Classroom Presentation

1. **High-Contrast Slide 0 Presentation**:
   - Each slide presents clean, readable cards for Sentence Structures, Verb Forms, and Tense & Reflex Frames.
   - Elimination of academic labels (e.g. replacing *"Present Perfect Continuous"* with *"\`A has been V-ing all morning\`"*) enables students to drill oral reflexes directly without cognitive overload.
2. **Pedagogical Drawer Notes**:
   - Rich teacher guidance notes are preserved in the platform's data layer, accessible via drawers and tooltips without cluttering the projector stage.
3. **Pending Audio Protocol**:
   - Days 16, 19, 22, and 28 are clearly flagged as \`pending_audio\`. Once teacher recordings are processed, the audio pipeline will automatically ingest them into permanent GCS storage.

`;

fs.writeFileSync(OUTPUT_MD_PATH, mdContent, 'utf8');
console.log(`Wrote Markdown catalog to ${OUTPUT_MD_PATH}`);

// 3. Update src/data/levelBGrammarData.ts
let tsContent = `import { LessonGrammarDoc } from '../types';

/**
 * Level B - ERE (English Reflexes Enhancement - 30 Topics) Canonical Grammar Catalog
 * Refactored and partitioned into 3 Data Groups:
 *   - Group 1 (19 topics): Core lessons verified from grammar.json (15-day cohort aligned)
 *   - Group 2 (7 topics):  Supplemental lessons transcribed from Audio Boost
 *   - Group 3 (4 topics):  Pending teacher audio recordings (provisional chunk reflexes)
 * Structured across 6 Thematic Modules: Onboarding, Office Culture, Operations & Management,
 * Team & Leadership, Professional Acumen, Business & Sales.
 * Last Audit & Update: ${new Date().toISOString()}
 */
export const LEVEL_B_ERE_GRAMMAR_CATALOG: LessonGrammarDoc[] = ${JSON.stringify(unifiedCatalog, null, 2)};

/**
 * Fast lookup map by lesson_id or day_number
 */
const GRAMMAR_BY_LESSON_ID = new Map<string, LessonGrammarDoc>();
const GRAMMAR_BY_DAY_NUMBER = new Map<number, LessonGrammarDoc>();

LEVEL_B_ERE_GRAMMAR_CATALOG.forEach(doc => {
  GRAMMAR_BY_LESSON_ID.set(doc.lesson_id, doc);
  GRAMMAR_BY_DAY_NUMBER.set(doc.day_number, doc);
});

export function getGrammarForLesson(lessonIdOrDay: string | number): LessonGrammarDoc | null {
  if (typeof lessonIdOrDay === 'number') {
    return GRAMMAR_BY_DAY_NUMBER.get(lessonIdOrDay) || null;
  }
  if (!lessonIdOrDay) return null;
  const direct = GRAMMAR_BY_LESSON_ID.get(lessonIdOrDay);
  if (direct) return direct;

  // Handle formats like "level_b_day_1", "day_1", "1"
  const match = lessonIdOrDay.match(/\\d+/);
  if (match) {
    const day = parseInt(match[0], 10);
    return GRAMMAR_BY_DAY_NUMBER.get(day) || null;
  }
  return null;
}
`;

fs.writeFileSync(LEVEL_B_DATA_PATH, tsContent, 'utf8');
console.log(`Updated ${LEVEL_B_DATA_PATH} successfully!`);
