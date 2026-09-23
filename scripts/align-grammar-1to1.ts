import * as fs from 'fs';
import * as path from 'path';

interface AlignmentEntry {
  primary_structure: string;
  structure_type: 'sentence_structure' | 'verb_form' | 'tense_reflex';
}

/**
 * Canonical 1-to-1 Mapping Dictionary
 * Every audio file (and curated manual item) has EXACTLY ONE primary focus grammar structure
 * and a single type: 'sentence_structure' | 'verb_form' | 'tense_reflex'.
 */
export const GRAMMAR_1TO1_ALIGNMENT: Record<string, AlignmentEntry> = {
  // ==========================================
  // Day 1: Day 1 - First Day Of Work (9 audios)
  // ==========================================
  '1en_Gr_01_1.mp3': {
    primary_structure: 'S + be + aware that...',
    structure_type: 'sentence_structure'
  },
  '1en_Gr_01_2.mp3': {
    primary_structure: 'because + clause vs because of + Noun / V-ing',
    structure_type: 'sentence_structure'
  },
  '1en_Gr_01_3.mp3': {
    primary_structure: 'be supposed to + V1',
    structure_type: 'verb_form'
  },
  '1en_Gr_01_4.mp3': {
    primary_structure: 'spend + [time] + V-ing',
    structure_type: 'verb_form'
  },
  '1en_Gr_01_5.mp3': {
    primary_structure: "There's a lot of + N",
    structure_type: 'sentence_structure'
  },
  '1en_Gr_01_6.mp3': {
    primary_structure: '..., would you? (Polite tag questions with imperatives)',
    structure_type: 'sentence_structure'
  },
  '1en_Gr_01_7.mp3': {
    primary_structure: 'have [X] years of experience V-ing',
    structure_type: 'verb_form'
  },
  '1en_Gr_01_8.mp3': {
    primary_structure: "be gonna + V1 (I'm gonna V1)",
    structure_type: 'verb_form'
  },
  '1en_Gr_01_9.mp3': {
    primary_structure: 'Have you already V3?',
    structure_type: 'tense_reflex'
  },

  // ==========================================
  // Day 2: Day 2 - Viettel (11 audios)
  // ==========================================
  '1en_Gr_02_1.mp3': {
    primary_structure: 'S + do/does/did + V1 (Emphatic affirmative)',
    structure_type: 'verb_form'
  },
  '1en_Gr_02_2.mp3': {
    primary_structure: 'V + Adverb (directly connect / conduct)',
    structure_type: 'verb_form'
  },
  '1en_Gr_02_3.mp3': {
    primary_structure: 'be interested in + N / V-ing',
    structure_type: 'verb_form'
  },
  '1en_Gr_02_4.mp3': {
    primary_structure: 'Would you mind + V-ing?',
    structure_type: 'sentence_structure'
  },
  '1en_Gr_02_5.mp3': {
    primary_structure: "have got news for you (uncountable 'news')",
    structure_type: 'sentence_structure'
  },
  '1en_Gr_02_6.mp3': {
    primary_structure: 'have + O + V1 vs ask + O + to V1 (Causative)',
    structure_type: 'sentence_structure'
  },
  '1en_Gr_02_7.mp3': {
    primary_structure: 'A has nothing to do with B',
    structure_type: 'sentence_structure'
  },
  '1en_Gr_02_8.mp3': {
    primary_structure: 'What + S + V + was/is... (Pseudo-cleft)',
    structure_type: 'sentence_structure'
  },
  '1en_Gr_02_9.mp3': {
    primary_structure: 'S + want to know + if/whether + clause',
    structure_type: 'sentence_structure'
  },
  '1en_Gr_02_10.mp3': {
    primary_structure: 'It seemed that + S + V (Past Simple)',
    structure_type: 'tense_reflex'
  },
  '1en_Gr_02_11.mp3': {
    primary_structure: 'S + would/will be + V-ing (Future Continuous)',
    structure_type: 'tense_reflex'
  },

  // ==========================================
  // Day 3: Day 3 - Tell me about yourself (11 audios)
  // ==========================================
  '1en_Gr_03_1.mp3': {
    primary_structure: '-ically pronunciation: /ɪkli/ (specifically, basically)',
    structure_type: 'verb_form'
  },
  '1en_Gr_03_2.mp3': {
    primary_structure: 'congratulations (always plural -s)',
    structure_type: 'verb_form'
  },
  '1en_Gr_03_3.mp3': {
    primary_structure: 'love / like / hate + V-ing vs to V1',
    structure_type: 'verb_form'
  },
  '1en_Gr_03_4.mp3': {
    primary_structure: 'preposition + V-ing (from listening to reading)',
    structure_type: 'verb_form'
  },
  '1en_Gr_03_5.mp3': {
    primary_structure: "consider / see myself as + N (no redundant 'is')",
    structure_type: 'sentence_structure'
  },
  '1en_Gr_03_6.mp3': {
    primary_structure: 'be in love with / be into + N',
    structure_type: 'sentence_structure'
  },
  '1en_Gr_03_7.mp3': {
    primary_structure: 'Although + clause vs In spite of / Despite + N/V-ing',
    structure_type: 'sentence_structure'
  },
  '1en_Gr_03_8.mp3': {
    primary_structure: 'had a year of V-ing (working as...)',
    structure_type: 'verb_form'
  },
  '1en_Gr_03_9.mp3': {
    primary_structure: 'have been V-ing (Present Perfect Continuous)',
    structure_type: 'tense_reflex'
  },
  '1en_Gr_03_10.mp3': {
    primary_structure: 'Like I said / mentioned (Past Simple)',
    structure_type: 'tense_reflex'
  },
  '1en_Gr_03_11.mp3': {
    primary_structure: 'What S just said excites me (Past action + Present impact)',
    structure_type: 'tense_reflex'
  },

  // ==========================================
  // Day 4: Day 4 - Smarketing (9 audios)
  // ==========================================
  '1en_Gr_04_1.mp3': {
    primary_structure: 'have got to + V1 / gotta + V1',
    structure_type: 'verb_form'
  },
  '1en_Gr_04_2.mp3': {
    primary_structure: 'be afraid of / scared of + N/V-ing',
    structure_type: 'verb_form'
  },
  '1en_Gr_04_3.mp3': {
    primary_structure: 'adjective / adverb + enough',
    structure_type: 'sentence_structure'
  },
  '1en_Gr_04_4.mp3': {
    primary_structure: 'want / need + someone + to V1',
    structure_type: 'verb_form'
  },
  '1en_Gr_04_5.mp3': {
    primary_structure: "It's + adj + (for someone) + to V1",
    structure_type: 'sentence_structure'
  },
  '1en_Gr_04_6.mp3': {
    primary_structure: 'There is / There are (Existence reflex)',
    structure_type: 'sentence_structure'
  },
  '1en_Gr_04_7.mp3': {
    primary_structure: 'It turns out that + clause / Turns out...',
    structure_type: 'sentence_structure'
  },
  '1en_Gr_04_8.mp3': {
    primary_structure: 'as you were told (was/were + V3 Passive)',
    structure_type: 'tense_reflex'
  },
  '1en_Gr_04_9.mp3': {
    primary_structure: "I'll never + V1 + anymore (Future Simple negation)",
    structure_type: 'tense_reflex'
  },

  // ==========================================
  // Day 5: Day 5 - Office Romance (10 audios)
  // ==========================================
  '1en_Gr_05_1.mp3': {
    primary_structure: 'nowadays vs these days (adverbs of time)',
    structure_type: 'verb_form'
  },
  '1en_Gr_05_2.mp3': {
    primary_structure: 'a hundred percent / bucks (a hundred vs one hundred)',
    structure_type: 'verb_form'
  },
  '1en_Gr_05_3.mp3': {
    primary_structure: 'lots of / a lot of + N vs a lot (adv)',
    structure_type: 'sentence_structure'
  },
  '1en_Gr_05_4.mp3': {
    primary_structure: '-ate pronunciation: /eɪt/ (verb) vs /ət/ (noun/adj)',
    structure_type: 'verb_form'
  },
  '1en_Gr_05_5.mp3': {
    primary_structure: '... and yet ... (concession conjunction)',
    structure_type: 'sentence_structure'
  },
  '1en_Gr_05_6.mp3': {
    primary_structure: 'become attracted to + N',
    structure_type: 'verb_form'
  },
  '1en_Gr_05_7.mp3': {
    primary_structure: 'help + (someone) + (to) V1',
    structure_type: 'verb_form'
  },
  '1en_Gr_05_8.mp3': {
    primary_structure: 'Who knows?!? (singular verb with Who)',
    structure_type: 'sentence_structure'
  },
  '1en_Gr_05_9.mp3': {
    primary_structure: 'Have you ever + V3...?',
    structure_type: 'tense_reflex'
  },
  '1en_Gr_05_10.mp3': {
    primary_structure: "S + have/has been + V3 (You've been warned!)",
    structure_type: 'tense_reflex'
  },

  // ==========================================
  // Day 6: Day 6 - Gossipy (11 audios)
  // ==========================================
  '1en_Gr_06_1.mp3': {
    primary_structure: 'S + look + adjective (look chubby)',
    structure_type: 'verb_form'
  },
  '1en_Gr_06_2.mp3': {
    primary_structure: 'plan to / intend to + V1 vs be going to + V1',
    structure_type: 'verb_form'
  },
  '1en_Gr_06_3.mp3': {
    primary_structure: 'refuse + to V1 vs deny + V-ing',
    structure_type: 'verb_form'
  },
  '1en_Gr_06_4.mp3': {
    primary_structure: 'Noun + V-ing (Reduced relative clause)',
    structure_type: 'sentence_structure'
  },
  '1en_Gr_06_5.mp3': {
    primary_structure: 'not that + adjective (degree intensifier)',
    structure_type: 'sentence_structure'
  },
  '1en_Gr_06_6.mp3': {
    primary_structure: 'Do you mind + my/me V-ing?',
    structure_type: 'sentence_structure'
  },
  '1en_Gr_06_7.mp3': {
    primary_structure: "There's a lot of + N",
    structure_type: 'sentence_structure'
  },
  '1en_Gr_06_8.mp3': {
    primary_structure: 'S + must have + V3 (Past deduction)',
    structure_type: 'tense_reflex'
  },
  '1en_Gr_06_9.mp3': {
    primary_structure: "I didn't do anything (Past negative action)",
    structure_type: 'tense_reflex'
  },
  '1en_Gr_06_10.mp3': {
    primary_structure: "We've been friends for [time]",
    structure_type: 'tense_reflex'
  },
  '1en_Gr_06_11.mp3': {
    primary_structure: 'This is the first time + S + have/has V3',
    structure_type: 'tense_reflex'
  },

  // ==========================================
  // Day 7: Day 7 - Electronic mail (9 audios)
  // ==========================================
  '1en_Gr_07_1.mp3': {
    primary_structure: 'precise (adj) vs precisely (adv)',
    structure_type: 'verb_form'
  },
  '1en_Gr_07_2.mp3': {
    primary_structure: 'It seems / appears / looks like + clause',
    structure_type: 'sentence_structure'
  },
  '1en_Gr_07_3.mp3': {
    primary_structure: 'find + O + adjective (I find it surprising)',
    structure_type: 'sentence_structure'
  },
  '1en_Gr_07_4.mp3': {
    primary_structure: 'Wh-subject + V-s/es (Who knows / What happens)',
    structure_type: 'sentence_structure'
  },
  '1en_Gr_07_5.mp3': {
    primary_structure: 'never heard of / about + N',
    structure_type: 'sentence_structure'
  },
  '1en_Gr_07_6.mp3': {
    primary_structure: '..., right? / Tag questions',
    structure_type: 'sentence_structure'
  },
  '1en_Gr_07_7.mp3': {
    primary_structure: 'S + might be + V-ing (Modal Continuous)',
    structure_type: 'tense_reflex'
  },
  '1en_Gr_07_8.mp3': {
    primary_structure: 'wondering if + S + would/could V1',
    structure_type: 'sentence_structure'
  },
  '1en_Gr_07_9.mp3': {
    primary_structure: 'It has been [time] since + S + V2',
    structure_type: 'tense_reflex'
  },

  // ==========================================
  // Day 8: Day 8 - COVID-19 (10 audios)
  // ==========================================
  '1en_Gr_08_1.mp3': {
    primary_structure: 'one of the + plural Nouns',
    structure_type: 'sentence_structure'
  },
  '1en_Gr_08_2.mp3': {
    primary_structure: 'speaking of / when it comes to + N',
    structure_type: 'sentence_structure'
  },
  '1en_Gr_08_3.mp3': {
    primary_structure: 'will be able to + V1',
    structure_type: 'verb_form'
  },
  '1en_Gr_08_4.mp3': {
    primary_structure: 'get + V3 (Passive voice with get)',
    structure_type: 'verb_form'
  },
  '1en_Gr_08_5.mp3': {
    primary_structure: 'everybody / everyone + V-s/es',
    structure_type: 'sentence_structure'
  },
  '1en_Gr_08_6.mp3': {
    primary_structure: 'go + bare verb (go check / go get)',
    structure_type: 'verb_form'
  },
  '1en_Gr_08_7.mp3': {
    primary_structure: 'suffer from + illness (bị bệnh)',
    structure_type: 'verb_form'
  },
  '1en_Gr_08_8.mp3': {
    primary_structure: 'help + (someone) + V1',
    structure_type: 'verb_form'
  },
  '1en_Gr_08_9.mp3': {
    primary_structure: 'S + have/has V3 + so far',
    structure_type: 'tense_reflex'
  },
  '1en_Gr_08_10.mp3': {
    primary_structure: 'since + S + V2 / past time',
    structure_type: 'tense_reflex'
  },

  // ==========================================
  // Day 9: Day 9 - Business trip (11 audios)
  // ==========================================
  '1en_Gr_09_1.mp3': {
    primary_structure: 'make an effort to + V1 / on + N',
    structure_type: 'verb_form'
  },
  '1en_Gr_09_2.mp3': {
    primary_structure: 'come up with + idea/solution',
    structure_type: 'verb_form'
  },
  '1en_Gr_09_3.mp3': {
    primary_structure: 'end up + V-ing',
    structure_type: 'verb_form'
  },
  '1en_Gr_09_4.mp3': {
    primary_structure: 'be late / get late (adjective usage of late)',
    structure_type: 'verb_form'
  },
  '1en_Gr_09_5.mp3': {
    primary_structure: 'be not supposed to + V1',
    structure_type: 'verb_form'
  },
  '1en_Gr_09_6.mp3': {
    primary_structure: "I'm afraid of / scared of + N",
    structure_type: 'verb_form'
  },
  '1en_Gr_09_7.mp3': {
    primary_structure: 'What are you gonna do then?',
    structure_type: 'sentence_structure'
  },
  '1en_Gr_09_8.mp3': {
    primary_structure: 'No matter how + adj/adv + S + V',
    structure_type: 'sentence_structure'
  },
  '1en_Gr_09_9.mp3': {
    primary_structure: 'S + will soon have to + V1',
    structure_type: 'tense_reflex'
  },
  '1en_Gr_09_10.mp3': {
    primary_structure: 'have been to (returned) vs have gone to (not yet returned)',
    structure_type: 'tense_reflex'
  },
  '1en_Gr_09_11.mp3': {
    primary_structure: "be + V-ing (Near future: where you're going)",
    structure_type: 'tense_reflex'
  },

  // ==========================================
  // Day 10: Day 10 - Project management (10 audios)
  // ==========================================
  '1en_Gr_10_1.mp3': {
    primary_structure: 'how / what / where + to V1',
    structure_type: 'verb_form'
  },
  '1en_Gr_10_2.mp3': {
    primary_structure: "Being + N/adj + doesn't mean + clause",
    structure_type: 'sentence_structure'
  },
  '1en_Gr_10_3.mp3': {
    primary_structure: "It's a good idea to + V1 / have no idea",
    structure_type: 'sentence_structure'
  },
  '1en_Gr_10_4.mp3': {
    primary_structure: "Why don't we + V1? / Let's + V1",
    structure_type: 'sentence_structure'
  },
  '1en_Gr_10_5.mp3': {
    primary_structure: 'If + S + V2/ed, S + would + V1 (Conditional Type 2)',
    structure_type: 'sentence_structure'
  },
  '1en_Gr_10_6.mp3': {
    primary_structure: 'Either A or B + verb agreement',
    structure_type: 'sentence_structure'
  },
  '1en_Gr_10_7.mp3': {
    primary_structure: 'When I was young / little + Past Simple',
    structure_type: 'tense_reflex'
  },
  '1en_Gr_10_8.mp3': {
    primary_structure: 'decided to + V1 (Past Simple of decide)',
    structure_type: 'tense_reflex'
  },
  '1en_Gr_10_9.mp3': {
    primary_structure: 'thought + S + would + V1 (Future in the Past)',
    structure_type: 'tense_reflex'
  },
  '1en_Gr_10_10.mp3': {
    primary_structure: 'thought + S + would have + V3 (Past modal expectation)',
    structure_type: 'tense_reflex'
  },

  // ==========================================
  // Day 11: Day 11 - Stand up meeting (10 audios)
  // ==========================================
  '1en_Gr_11_1.mp3': {
    primary_structure: 'plenty of + N (countable / uncountable)',
    structure_type: 'sentence_structure'
  },
  '1en_Gr_11_2.mp3': {
    primary_structure: 'prevent + O + from + V-ing',
    structure_type: 'verb_form'
  },
  '1en_Gr_11_3.mp3': {
    primary_structure: 'stay + adjective / V3 (stay focused / tuned)',
    structure_type: 'verb_form'
  },
  '1en_Gr_11_4.mp3': {
    primary_structure: 'every day (adv) vs everyday (adj)',
    structure_type: 'verb_form'
  },
  '1en_Gr_11_5.mp3': {
    primary_structure: 'under control / out of control',
    structure_type: 'sentence_structure'
  },
  '1en_Gr_11_6.mp3': {
    primary_structure: 'all but / anything but / nothing but',
    structure_type: 'sentence_structure'
  },
  '1en_Gr_11_7.mp3': {
    primary_structure: 'be involved in + N / V-ing',
    structure_type: 'verb_form'
  },
  '1en_Gr_11_8.mp3': {
    primary_structure: 'The police are / will be + V',
    structure_type: 'sentence_structure'
  },
  '1en_Gr_11_9.mp3': {
    primary_structure: 'S + have/has V3 + lately / recently',
    structure_type: 'tense_reflex'
  },
  '1en_Gr_11_10.mp3': {
    primary_structure: 'S + have/has been V-ing + for years',
    structure_type: 'tense_reflex'
  },

  // ==========================================
  // Day 12: Day 12 - Electronic mail (Advanced) (9 audios)
  // ==========================================
  '1en_Gr_12_1.mp3': {
    primary_structure: 'try to V1 vs try V-ing',
    structure_type: 'verb_form'
  },
  '1en_Gr_12_2.mp3': {
    primary_structure: 'get used to + V-ing / Noun',
    structure_type: 'verb_form'
  },
  '1en_Gr_12_3.mp3': {
    primary_structure: 'like + V-ing (general preference)',
    structure_type: 'verb_form'
  },
  '1en_Gr_12_4.mp3': {
    primary_structure: 'take a look at + N (delexical verb)',
    structure_type: 'verb_form'
  },
  '1en_Gr_12_5.mp3': {
    primary_structure: "There's no easy way to + V1",
    structure_type: 'sentence_structure'
  },
  '1en_Gr_12_6.mp3': {
    primary_structure: '... for what? (Asking purpose)',
    structure_type: 'sentence_structure'
  },
  '1en_Gr_12_7.mp3': {
    primary_structure: 'If I were you, I would + V1',
    structure_type: 'sentence_structure'
  },
  '1en_Gr_12_8.mp3': {
    primary_structure: "I don't see why + S + V",
    structure_type: 'sentence_structure'
  },
  '1en_Gr_12_9.mp3': {
    primary_structure: 'S + V2 + once (Single past occurrence)',
    structure_type: 'tense_reflex'
  },

  // ==========================================
  // Day 13: Day 13 - Chart analysis (7 audios)
  // ==========================================
  '1en_Gr_13_1.mp3': {
    primary_structure: 'increase twofold / twofold increase',
    structure_type: 'verb_form'
  },
  '1en_Gr_13_2.mp3': {
    primary_structure: ', which means + clause (sentential relative)',
    structure_type: 'sentence_structure'
  },
  '1en_Gr_13_3.mp3': {
    primary_structure: 'S + be + nothing compared to + N',
    structure_type: 'sentence_structure'
  },
  '1en_Gr_13_4.mp3': {
    primary_structure: "It doesn't necessarily mean that + S + V",
    structure_type: 'sentence_structure'
  },
  '1en_Gr_13_5.mp3': {
    primary_structure: "What's going on (with)...?",
    structure_type: 'sentence_structure'
  },
  '1en_Gr_13_6.mp3': {
    primary_structure: 'What did you do? vs What have you done?',
    structure_type: 'tense_reflex'
  },
  '1en_Gr_13_7.mp3': {
    primary_structure: 'There has been + N (Present Perfect existence)',
    structure_type: 'tense_reflex'
  },

  // ==========================================
  // Day 14: Day 14 - Customer complaint (12 audios)
  // ==========================================
  '1en_Gr_14_1.mp3': {
    primary_structure: 'remain / keep + adjective',
    structure_type: 'verb_form'
  },
  '1en_Gr_14_2.mp3': {
    primary_structure: 'keep + someone + posted / updated (V3)',
    structure_type: 'verb_form'
  },
  '1en_Gr_14_3.mp3': {
    primary_structure: 'prove somebody wrong',
    structure_type: 'verb_form'
  },
  '1en_Gr_14_4.mp3': {
    primary_structure: 'work like a charm (Idiom & Present Simple)',
    structure_type: 'verb_form'
  },
  '1en_Gr_14_5.mp3': {
    primary_structure: "no worries vs don't worry",
    structure_type: 'sentence_structure'
  },
  '1en_Gr_14_6.mp3': {
    primary_structure: 'All you need to do is + V1',
    structure_type: 'sentence_structure'
  },
  '1en_Gr_14_7.mp3': {
    primary_structure: "It's totally understandable that...",
    structure_type: 'sentence_structure'
  },
  '1en_Gr_14_8.mp3': {
    primary_structure: "There's a saying that goes...",
    structure_type: 'sentence_structure'
  },
  '1en_Gr_14_9.mp3': {
    primary_structure: "I'm not sure if/whether + clause",
    structure_type: 'sentence_structure'
  },
  '1en_Gr_14_10.mp3': {
    primary_structure: 'in case + S + have/has V3',
    structure_type: 'tense_reflex'
  },
  '1en_Gr_14_11.mp3': {
    primary_structure: "who put... (Past Simple of irregular 'put')",
    structure_type: 'tense_reflex'
  },
  '1en_Gr_14_12.mp3': {
    primary_structure: 'You mean... / Are you saying that...?',
    structure_type: 'sentence_structure'
  },

  // ==========================================
  // Day 15: Day 15 - Close the deal! (12 audios)
  // ==========================================
  '1en_Gr_15_1.mp3': {
    primary_structure: 'close the deal / go bankrupt',
    structure_type: 'verb_form'
  },
  '1en_Gr_15_2.mp3': {
    primary_structure: "It's very intimidating (Participle adjective)",
    structure_type: 'verb_form'
  },
  '1en_Gr_15_3.mp3': {
    primary_structure: 'be flooded with + N (Passive expression)',
    structure_type: 'verb_form'
  },
  '1en_Gr_15_4.mp3': {
    primary_structure: 'Why / Why not + base verb?',
    structure_type: 'sentence_structure'
  },
  '1en_Gr_15_5.mp3': {
    primary_structure: 'keep / stop + V-ing',
    structure_type: 'verb_form'
  },
  '1en_Gr_15_6.mp3': {
    primary_structure: 'How did it go? (Asking past outcome)',
    structure_type: 'sentence_structure'
  },
  '1en_Gr_15_7.mp3': {
    primary_structure: 'have invested time/effort in + V-ing',
    structure_type: 'tense_reflex'
  },
  '1en_Gr_15_8.mp3': {
    primary_structure: 'Wh-word + Noun (What time, which option)',
    structure_type: 'sentence_structure'
  },
  '1en_Gr_15_9.mp3': {
    primary_structure: 'Do you know + Wh-word + S + V? (Embedded question)',
    structure_type: 'sentence_structure'
  },
  '1en_Gr_15_10.mp3': {
    primary_structure: "That's not gonna happen (Future negation)",
    structure_type: 'tense_reflex'
  },
  '1en_Gr_15_11.mp3': {
    primary_structure: "I've been thinking about + N/V-ing",
    structure_type: 'tense_reflex'
  },
  '1en_Gr_15_12.mp3': {
    primary_structure: 'be + V-ing (Present Continuous for future)',
    structure_type: 'tense_reflex'
  },

  // ==========================================
  // Day 16: Day 16 - Social media (7 audios)
  // ==========================================
  '1en_Gr_16_1.mp3': {
    primary_structure: 'get left behind (get + V3)',
    structure_type: 'verb_form'
  },
  '1en_Gr_16_2.mp3': {
    primary_structure: 'look + Adj (look identical)',
    structure_type: 'sentence_structure'
  },
  '1en_Gr_16_3.mp3': {
    primary_structure: 'must be V3 (must be taken seriously)',
    structure_type: 'verb_form'
  },
  '1en_Gr_16_4.mp3': {
    primary_structure: 'A little bird told me that + clause',
    structure_type: 'sentence_structure'
  },
  '1en_Gr_16_5.mp3': {
    primary_structure: "There's [Noun] + V-ing (Participial clause)",
    structure_type: 'sentence_structure'
  },
  '1en_Gr_16_6.mp3': {
    primary_structure: "Hasn't anyone told you...? (Present Perfect question)",
    structure_type: 'tense_reflex'
  },
  '1en_Gr_16_7.mp3': {
    primary_structure: 'spend + [time] + (in) V-ing',
    structure_type: 'verb_form'
  },

  // ==========================================
  // Day 17: Day 17 - Teamwork (12 audios)
  // ==========================================
  '1en_Gr_17_1.mp3': {
    primary_structure: 'want someone to be + adj (aware)',
    structure_type: 'verb_form'
  },
  '1en_Gr_17_2.mp3': {
    primary_structure: 'let / make + someone + V1 (Causative)',
    structure_type: 'verb_form'
  },
  '1en_Gr_17_3.mp3': {
    primary_structure: 'Here comes + N / Here is + N (Inversion)',
    structure_type: 'sentence_structure'
  },
  '1en_Gr_17_4.mp3': {
    primary_structure: 'What are you up to?',
    structure_type: 'sentence_structure'
  },
  '1en_Gr_17_5.mp3': {
    primary_structure: "There's something wrong with + N",
    structure_type: 'sentence_structure'
  },
  '1en_Gr_17_6.mp3': {
    primary_structure: 'From now on, I will + V1',
    structure_type: 'sentence_structure'
  },
  '1en_Gr_17_7.mp3': {
    primary_structure: "didn't say it would + V1 (Reported speech backshift)",
    structure_type: 'tense_reflex'
  },
  '1en_Gr_17_8.mp3': {
    primary_structure: "You know what I'm saying? / You know what I mean?",
    structure_type: 'sentence_structure'
  },
  '1en_Gr_17_9.mp3': {
    primary_structure: 'S + has/have been V-ing + all morning',
    structure_type: 'tense_reflex'
  },
  '1en_Gr_17_10.mp3': {
    primary_structure: 'The moment + S + V2, S + V2',
    structure_type: 'tense_reflex'
  },
  '1en_Gr_17_11.mp3': {
    primary_structure: "Why haven't I been told (about)...?",
    structure_type: 'tense_reflex'
  },
  '1en_Gr_17_12.mp3': {
    primary_structure: 'Who told you that...? (Past Simple subject question)',
    structure_type: 'tense_reflex'
  },

  // ==========================================
  // Day 18: Day 18 - Salary negotiation (10 audios)
  // ==========================================
  '1en_Gr_18_1.mp3': {
    primary_structure: 'to put it bluntly / mildly (adv modifying verb)',
    structure_type: 'verb_form'
  },
  '1en_Gr_18_2.mp3': {
    primary_structure: 'be worth + V-ing / Noun',
    structure_type: 'verb_form'
  },
  '1en_Gr_18_3.mp3': {
    primary_structure: "Let's + V1 (Suggestions)",
    structure_type: 'sentence_structure'
  },
  '1en_Gr_18_4.mp3': {
    primary_structure: 'if my memory serves me right',
    structure_type: 'sentence_structure'
  },
  '1en_Gr_18_5.mp3': {
    primary_structure: 'Why + V1 (Why make a big deal out of it?)',
    structure_type: 'sentence_structure'
  },
  '1en_Gr_18_6.mp3': {
    primary_structure: 'feel hurt / offended (feel + participle adjective)',
    structure_type: 'verb_form'
  },
  '1en_Gr_18_7.mp3': {
    primary_structure: "There's nothing to be scared of",
    structure_type: 'sentence_structure'
  },
  '1en_Gr_18_8.mp3': {
    primary_structure: 'keep + V-ing (keep asking myself)',
    structure_type: 'verb_form'
  },
  '1en_Gr_18_9.mp3': {
    primary_structure: 'adj + enough + to V1',
    structure_type: 'sentence_structure'
  },
  '1en_Gr_18_10.mp3': {
    primary_structure: 'have come too far (Present Perfect)',
    structure_type: 'tense_reflex'
  },

  // ==========================================
  // Day 19: Day 19 - EXCEL (8 audios)
  // ==========================================
  '1en_Gr_19_1.mp3': {
    primary_structure: "be not allowed to + V1 / won't allow me to + V1",
    structure_type: 'verb_form'
  },
  '1en_Gr_19_2.mp3': {
    primary_structure: 'finish + V-ing',
    structure_type: 'verb_form'
  },
  '1en_Gr_19_3.mp3': {
    primary_structure: 'except + V1 / except + to V1',
    structure_type: 'verb_form'
  },
  '1en_Gr_19_4.mp3': {
    primary_structure: 'May I + V1? (Polite request)',
    structure_type: 'sentence_structure'
  },
  '1en_Gr_19_5.mp3': {
    primary_structure: 'It usually takes + [time] + to V1',
    structure_type: 'sentence_structure'
  },
  '1en_Gr_19_6.mp3': {
    primary_structure: 'Is there a possibility that + clause?',
    structure_type: 'sentence_structure'
  },
  '1en_Gr_19_7.mp3': {
    primary_structure: "There's nothing to + V1 (worry about / be scared of)",
    structure_type: 'sentence_structure'
  },
  '1en_Gr_19_8.mp3': {
    primary_structure: 'S + V2 + all day yesterday (Past Simple duration)',
    structure_type: 'tense_reflex'
  },

  // ==========================================
  // Day 20: Day 20 - Year-end party (12 audios)
  // ==========================================
  '1en_Gr_20_1.mp3': {
    primary_structure: 'Sounds like a plan / Sounds good',
    structure_type: 'sentence_structure'
  },
  '1en_Gr_20_2.mp3': {
    primary_structure: 'chip in (Phrasal verb)',
    structure_type: 'verb_form'
  },
  '1en_Gr_20_3.mp3': {
    primary_structure: 'getting + comparative + and + comparative',
    structure_type: 'verb_form'
  },
  '1en_Gr_20_4.mp3': {
    primary_structure: 'stop + V-ing',
    structure_type: 'verb_form'
  },
  '1en_Gr_20_5.mp3': {
    primary_structure: "There's a lot of + N",
    structure_type: 'sentence_structure'
  },
  '1en_Gr_20_6.mp3': {
    primary_structure: '(Do) you still remember?',
    structure_type: 'sentence_structure'
  },
  '1en_Gr_20_7.mp3': {
    primary_structure: 'be not allowed to + V1',
    structure_type: 'verb_form'
  },
  '1en_Gr_20_8.mp3': {
    primary_structure: 'I did ask him, but... (Emphatic did)',
    structure_type: 'verb_form'
  },
  '1en_Gr_20_9.mp3': {
    primary_structure: "This time I won't + V1 (Future negation)",
    structure_type: 'tense_reflex'
  },
  '1en_Gr_20_10.mp3': {
    primary_structure: 'since the last time + S + V2',
    structure_type: 'tense_reflex'
  },
  '1en_Gr_20_11.mp3': {
    primary_structure: 'Whenever + S + V, S + will V',
    structure_type: 'tense_reflex'
  },
  '1en_Gr_20_12.mp3': {
    primary_structure: 'forgot to bring / forgot + O (Past Simple)',
    structure_type: 'tense_reflex'
  },

  // ==========================================
  // Day 21: Day 21 - Compensation and benefits (9 audios)
  // ==========================================
  '1en_Gr_21_1.mp3': {
    primary_structure: 'enjoy / love + V-ing',
    structure_type: 'verb_form'
  },
  '1en_Gr_21_2.mp3': {
    primary_structure: 'after / before + V-ing',
    structure_type: 'verb_form'
  },
  '1en_Gr_21_3.mp3': {
    primary_structure: 'more specifically (adv discourse marker)',
    structure_type: 'sentence_structure'
  },
  '1en_Gr_21_4.mp3': {
    primary_structure: 'be brilliant / supposed to + V1',
    structure_type: 'verb_form'
  },
  '1en_Gr_21_5.mp3': {
    primary_structure: 'It takes + [courage/effort] + to V1',
    structure_type: 'sentence_structure'
  },
  '1en_Gr_21_6.mp3': {
    primary_structure: 'must be based on + N (Passive modal deduction)',
    structure_type: 'verb_form'
  },
  '1en_Gr_21_7.mp3': {
    primary_structure: "didn't even bother to V1",
    structure_type: 'verb_form'
  },
  '1en_Gr_21_8.mp3': {
    primary_structure: 'How come + S + V? (Why...)',
    structure_type: 'sentence_structure'
  },
  '1en_Gr_21_9.mp3': {
    primary_structure: "I've never + V3 (Present Perfect experience)",
    structure_type: 'tense_reflex'
  },

  // ==========================================
  // Day 22: Day 22 - Nepotism (10 audios)
  // ==========================================
  '1en_Gr_22_1.mp3': {
    primary_structure: 'Verb + not (fear not / worry not)',
    structure_type: 'verb_form'
  },
  '1en_Gr_22_2.mp3': {
    primary_structure: 'promise + (not) + to V1',
    structure_type: 'verb_form'
  },
  '1en_Gr_22_3.mp3': {
    primary_structure: "There's no such thing as + N",
    structure_type: 'sentence_structure'
  },
  '1en_Gr_22_4.mp3': {
    primary_structure: 'Do you know what it means? (it means)',
    structure_type: 'sentence_structure'
  },
  '1en_Gr_22_5.mp3': {
    primary_structure: "It's no shame to + V1",
    structure_type: 'sentence_structure'
  },
  '1en_Gr_22_6.mp3': {
    primary_structure: 'want + to be V3 (Passive infinitive)',
    structure_type: 'verb_form'
  },
  '1en_Gr_22_7.mp3': {
    primary_structure: "There's a thing called + N (Reduced relative)",
    structure_type: 'sentence_structure'
  },
  '1en_Gr_22_8.mp3': {
    primary_structure: 'S + once + V2 (Single past occurrence)',
    structure_type: 'tense_reflex'
  },
  '1en_Gr_22_9.mp3': {
    primary_structure: 'S + just + V2 vs have/has just + V3',
    structure_type: 'tense_reflex'
  },
  '1en_Gr_22_10.mp3': {
    primary_structure: 'S + went to + [School/University] (Past Simple)',
    structure_type: 'tense_reflex'
  },

  // ==========================================
  // Day 23: Day 23 - What KPI stands for? (10 audios)
  // ==========================================
  '1en_Gr_23_1.mp3': {
    primary_structure: 'V + more effectively (Verb + Adverb)',
    structure_type: 'verb_form'
  },
  '1en_Gr_23_2.mp3': {
    primary_structure: 'demanding (participle adjective: a demanding boss)',
    structure_type: 'verb_form'
  },
  '1en_Gr_23_3.mp3': {
    primary_structure: 'speaking of / in terms of + N',
    structure_type: 'sentence_structure'
  },
  '1en_Gr_23_4.mp3': {
    primary_structure: "There's still room for + N/V-ing",
    structure_type: 'sentence_structure'
  },
  '1en_Gr_23_5.mp3': {
    primary_structure: 'This must be the reason why + clause',
    structure_type: 'sentence_structure'
  },
  '1en_Gr_23_6.mp3': {
    primary_structure: 'better left unsaid (Idiom)',
    structure_type: 'sentence_structure'
  },
  '1en_Gr_23_7.mp3': {
    primary_structure: 'be known as + N',
    structure_type: 'verb_form'
  },
  '1en_Gr_23_8.mp3': {
    primary_structure: 'S + enable + O + to V1',
    structure_type: 'verb_form'
  },
  '1en_Gr_23_9.mp3': {
    primary_structure: "S + haven't/hasn't V3 + yet",
    structure_type: 'tense_reflex'
  },
  '1en_Gr_23_10.mp3': {
    primary_structure: 'S + should have + V3 (Past regret)',
    structure_type: 'tense_reflex'
  },

  // ==========================================
  // Day 24: Day 24 - How to write a CV? (6 audios)
  // ==========================================
  '1en_Gr_24_1.mp3': {
    primary_structure: 'That explains it (No wonder)',
    structure_type: 'sentence_structure'
  },
  '1en_Gr_24_2.mp3': {
    primary_structure: 'be no longer used (Passive with no longer)',
    structure_type: 'verb_form'
  },
  '1en_Gr_24_3.mp3': {
    primary_structure: 'came looking for + someone',
    structure_type: 'verb_form'
  },
  '1en_Gr_24_4.mp3': {
    primary_structure: 'Why would + S + V1...?',
    structure_type: 'sentence_structure'
  },
  '1en_Gr_24_5.mp3': {
    primary_structure: "What's wrong with + N/Pronoun?",
    structure_type: 'sentence_structure'
  },
  '1en_Gr_24_6.mp3': {
    primary_structure: "Don't tell me you're gonna + V1",
    structure_type: 'tense_reflex'
  },

  // ==========================================
  // Day 25: Day 25 - Small talk (10 audios)
  // ==========================================
  '1en_Gr_25_1.mp3': {
    primary_structure: 'Easier said than done (Idiom)',
    structure_type: 'sentence_structure'
  },
  '1en_Gr_25_2.mp3': {
    primary_structure: 'Who cares?!? (Subject-verb agreement)',
    structure_type: 'sentence_structure'
  },
  '1en_Gr_25_3.mp3': {
    primary_structure: 'quit + V-ing',
    structure_type: 'verb_form'
  },
  '1en_Gr_25_4.mp3': {
    primary_structure: "There's no doubt that + clause",
    structure_type: 'sentence_structure'
  },
  '1en_Gr_25_5.mp3': {
    primary_structure: "hate someone's guts (Idiom)",
    structure_type: 'verb_form'
  },
  '1en_Gr_25_6.mp3': {
    primary_structure: 'Who knows what happened? (Embedded question)',
    structure_type: 'sentence_structure'
  },
  '1en_Gr_25_7.mp3': {
    primary_structure: 'Did you hear anything? vs Have you heard anything?',
    structure_type: 'tense_reflex'
  },
  '1en_Gr_25_8.mp3': {
    primary_structure: "didn't know S had V3 (Past Perfect)",
    structure_type: 'tense_reflex'
  },
  '1en_Gr_25_9.mp3': {
    primary_structure: 'has been ... ever since (Present Perfect)',
    structure_type: 'tense_reflex'
  },
  '1en_Gr_25_10.mp3': {
    primary_structure: 'must have + V3 (Past deduction)',
    structure_type: 'tense_reflex'
  },

  // ==========================================
  // Day 26: Day 26 - Financial picture (4 audios)
  // ==========================================
  '1en_Gr_26_1.mp3': {
    primary_structure: 'relatively speaking (adverbial participle)',
    structure_type: 'verb_form'
  },
  '1en_Gr_26_2.mp3': {
    primary_structure: 'such a + adj + N vs so + adj',
    structure_type: 'sentence_structure'
  },
  '1en_Gr_26_3.mp3': {
    primary_structure: 'no sign of + N (sign of vs size of)',
    structure_type: 'sentence_structure'
  },
  '1en_Gr_26_4.mp3': {
    primary_structure: 'have/has been V-ing recently (Present Perfect Continuous)',
    structure_type: 'tense_reflex'
  },

  // ==========================================
  // Day 27: Day 27 - Shark Tank (11 audios)
  // ==========================================
  '1en_Gr_27_1.mp3': {
    primary_structure: 'sounds familiar (sound + adj)',
    structure_type: 'verb_form'
  },
  '1en_Gr_27_2.mp3': {
    primary_structure: "Who wants to + V1? / Who doesn't want to + V1?",
    structure_type: 'sentence_structure'
  },
  '1en_Gr_27_3.mp3': {
    primary_structure: 'be here + V-ing (Expressing purpose)',
    structure_type: 'verb_form'
  },
  '1en_Gr_27_4.mp3': {
    primary_structure: 'was/were born and raised in [place]',
    structure_type: 'verb_form'
  },
  '1en_Gr_27_5.mp3': {
    primary_structure: 'be sick of + N/V-ing',
    structure_type: 'verb_form'
  },
  '1en_Gr_27_6.mp3': {
    primary_structure: 'be familiar with + N/V-ing',
    structure_type: 'verb_form'
  },
  '1en_Gr_27_7.mp3': {
    primary_structure: 'What + V + O + is + Complement (What-clause subject)',
    structure_type: 'sentence_structure'
  },
  '1en_Gr_27_8.mp3': {
    primary_structure: 'was valued at [amount] (Valuation passive)',
    structure_type: 'tense_reflex'
  },
  '1en_Gr_27_9.mp3': {
    primary_structure: 'was valued at vs is valued at',
    structure_type: 'tense_reflex'
  },
  '1en_Gr_27_10.mp3': {
    primary_structure: 'For those reasons I just mentioned',
    structure_type: 'sentence_structure'
  },
  '1en_Gr_27_11.mp3': {
    primary_structure: "didn't say (that) S would + V1 (Reported speech)",
    structure_type: 'tense_reflex'
  },

  // ==========================================
  // Day 28: Day 28 - Never eat alone (10 audios)
  // ==========================================
  '1en_Gr_28_1.mp3': {
    primary_structure: 'thanks for + V-ing',
    structure_type: 'verb_form'
  },
  '1en_Gr_28_2.mp3': {
    primary_structure: "Don't act so + Adj (Don't act so surprised)",
    structure_type: 'sentence_structure'
  },
  '1en_Gr_28_3.mp3': {
    primary_structure: 'try + V-ing (experiment vs effort)',
    structure_type: 'verb_form'
  },
  '1en_Gr_28_4.mp3': {
    primary_structure: 'Despite + N / V-ing vs Although + clause',
    structure_type: 'sentence_structure'
  },
  '1en_Gr_28_5.mp3': {
    primary_structure: "There's a lot of + N",
    structure_type: 'sentence_structure'
  },
  '1en_Gr_28_6.mp3': {
    primary_structure: "If it weren't for + N, S + would/wouldn't + V1",
    structure_type: 'sentence_structure'
  },
  '1en_Gr_28_7.mp3': {
    primary_structure: 'How many + plural noun...?',
    structure_type: 'sentence_structure'
  },
  '1en_Gr_28_8.mp3': {
    primary_structure: "S + still don't/doesn't + V1 + yet (Present Simple with yet)",
    structure_type: 'tense_reflex'
  },
  '1en_Gr_28_9.mp3': {
    primary_structure: 'S + have/has + V3 + before (Present Perfect experience)',
    structure_type: 'tense_reflex'
  },
  '1en_Gr_28_10.mp3': {
    primary_structure: 'Who told you that? (Past Simple subject question)',
    structure_type: 'tense_reflex'
  },

  // ==========================================
  // Day 29: Day 29 - LinkedIn (11 audios)
  // ==========================================
  '1en_Gr_29_1.mp3': {
    primary_structure: 'convincing (active/thing) vs convinced (passive/person)',
    structure_type: 'verb_form'
  },
  '1en_Gr_29_2.mp3': {
    primary_structure: 'get hired / get employed (Passive with get)',
    structure_type: 'verb_form'
  },
  '1en_Gr_29_3.mp3': {
    primary_structure: "simply + Noun phrase (It's simply a rule)",
    structure_type: 'sentence_structure'
  },
  '1en_Gr_29_4.mp3': {
    primary_structure: "That's all I'm saying",
    structure_type: 'sentence_structure'
  },
  '1en_Gr_29_5.mp3': {
    primary_structure: 'Would it kill you just to + V1?',
    structure_type: 'sentence_structure'
  },
  '1en_Gr_29_6.mp3': {
    primary_structure: 'increase chances of + V-ing',
    structure_type: 'verb_form'
  },
  '1en_Gr_29_7.mp3': {
    primary_structure: 'used to + V1 (Past habit/state)',
    structure_type: 'tense_reflex'
  },
  '1en_Gr_29_8.mp3': {
    primary_structure: 'I wish + S + could/would + V1 (Subjunctive wish)',
    structure_type: 'sentence_structure'
  },
  '1en_Gr_29_9.mp3': {
    primary_structure: 'How have you been? vs How are you?',
    structure_type: 'tense_reflex'
  },
  '1en_Gr_29_10.mp3': {
    primary_structure: 'heard that S had V3 (Past Perfect)',
    structure_type: 'tense_reflex'
  },
  '1en_Gr_29_11.mp3': {
    primary_structure: 'have had that happen (Causative/experiential have)',
    structure_type: 'tense_reflex'
  },

  // ==========================================
  // Day 30: Day 30 - Farewell party (7 audios)
  // ==========================================
  '1en_Gr_30_1.mp3': {
    primary_structure: 'May I have your [Noun]?',
    structure_type: 'sentence_structure'
  },
  '1en_Gr_30_2.mp3': {
    primary_structure: 'Are you in a hurry to + V1?',
    structure_type: 'sentence_structure'
  },
  '1en_Gr_30_3.mp3': {
    primary_structure: "There's a very thin line between A and B",
    structure_type: 'sentence_structure'
  },
  '1en_Gr_30_4.mp3': {
    primary_structure: 'thought it through (think through in Past Simple)',
    structure_type: 'tense_reflex'
  },
  '1en_Gr_30_5.mp3': {
    primary_structure: 'This is the last time + S + will V / be V-ing',
    structure_type: 'tense_reflex'
  },
  '1en_Gr_30_6.mp3': {
    primary_structure: "It's not that I didn't + V1",
    structure_type: 'tense_reflex'
  },
  '1en_Gr_30_7.mp3': {
    primary_structure: "the most [adj] I've ever V3 (Superlative + Present Perfect)",
    structure_type: 'tense_reflex'
  }
};

// Paths
const CATALOG_JSON_PATH = path.resolve('scripts/grammar-boost-catalog.json');
const GROUPED_JSON_PATH = path.resolve('scripts/grammar-grouped-catalog.json');
const LEVEL_B_DATA_PATH = path.resolve('src/data/levelBGrammarData.ts');

function alignGrammar() {
  console.log('=====================================================');
  console.log('CHUNKS 1-TO-1 GRAMMAR ALIGNMENT & DE-BLOATING ENGINE');
  console.log('=====================================================\n');

  if (!fs.existsSync(CATALOG_JSON_PATH)) {
    throw new Error(`Missing ${CATALOG_JSON_PATH}`);
  }
  if (!fs.existsSync(GROUPED_JSON_PATH)) {
    throw new Error(`Missing ${GROUPED_JSON_PATH}`);
  }
  if (!fs.existsSync(LEVEL_B_DATA_PATH)) {
    throw new Error(`Missing ${LEVEL_B_DATA_PATH}`);
  }

  const catalog = JSON.parse(fs.readFileSync(CATALOG_JSON_PATH, 'utf8'));
  const grouped = JSON.parse(fs.readFileSync(GROUPED_JSON_PATH, 'utf8'));

  let totalMatched = 0;
  let totalMissing = 0;
  const missingFiles: string[] = [];

  // 1. Update mini-lessons and topic summaries in grammar-boost-catalog.json
  catalog.topics.forEach((t: any) => {
    const topicSentences: string[] = [];
    const topicVerbs: string[] = [];
    const topicTenses: string[] = [];

    t.mini_lessons.forEach((m: any) => {
      const alignment = GRAMMAR_1TO1_ALIGNMENT[m.file];
      if (!alignment) {
        console.error(`❌ [Day ${t.day_number}] Missing alignment for file: ${m.file}`);
        totalMissing++;
        missingFiles.push(m.file);
        return;
      }

      totalMatched++;
      // Set 1-to-1 canonical properties on mini-lesson
      m.primary_structure = alignment.primary_structure;
      m.structure_type = alignment.structure_type;

      // Group into corresponding topic bucket
      if (alignment.structure_type === 'sentence_structure') {
        topicSentences.push(alignment.primary_structure);
      } else if (alignment.structure_type === 'verb_form') {
        topicVerbs.push(alignment.primary_structure);
      } else if (alignment.structure_type === 'tense_reflex') {
        topicTenses.push(alignment.primary_structure);
      }
    });

    // Replace topic-level arrays with exact 1-to-1 partitions
    t.sentence_structures = topicSentences;
    t.verb_forms = topicVerbs;
    t.tense = topicTenses;

    // Verify mathematical invariant
    const totalPartitioned = topicSentences.length + topicVerbs.length + topicTenses.length;
    if (totalPartitioned !== t.mini_lessons.length) {
      throw new Error(`Topic Day ${t.day_number} length mismatch: mini_lessons=${t.mini_lessons.length}, partitioned=${totalPartitioned}`);
    }
  });

  if (totalMissing > 0) {
    throw new Error(`Failed! ${totalMissing} files missing 1-to-1 alignment: ${missingFiles.join(', ')}`);
  }

  console.log(`✅ Verified all ${totalMatched} mini-lessons mapped 1-to-1!`);

  // Update catalog metadata
  catalog.metadata = {
    ...catalog.metadata,
    source_directory: "C:\\Users\\gensh\\Downloads\\chunks-grammar\\FULL 30 Topic_P@W\\Grammar Boost\\Grammar Boost",
    last_audit: new Date().toISOString(),
    audit_status: '1_to_1_aligned_verified',
    total_topics: 30,
    audio_topics_count: 30,
    pending_topics_count: 0,
    total_audio_files: 288,
    total_structures: 288,
    one_to_one_rule: '1 audio file = exactly 1 primary target grammar structure'
  };

  // Write updated grammar-boost-catalog.json
  fs.writeFileSync(CATALOG_JSON_PATH, JSON.stringify(catalog, null, 2), 'utf8');
  console.log(`💾 Saved updated: ${CATALOG_JSON_PATH}`);

  // Write to src/data/grammarBoostCatalog.json
  const SRC_DATA_CATALOG_PATH = path.resolve('src/data/grammarBoostCatalog.json');
  fs.writeFileSync(SRC_DATA_CATALOG_PATH, JSON.stringify(catalog, null, 2), 'utf8');
  console.log(`💾 Saved updated: ${SRC_DATA_CATALOG_PATH}`);

  // 2. Update grammar-grouped-catalog.json
  const topicMap = new Map<number, any>();
  catalog.topics.forEach((t: any) => topicMap.set(t.day_number, t));

  grouped.lessons.forEach((l: any) => {
    const t = topicMap.get(l.day_number);
    if (t) {
      l.sentence_structures = [...t.sentence_structures];
      l.verb_forms = [...t.verb_forms];
      l.tense = [...t.tense];
      l.updated_at = new Date().toISOString();
    }
    if ([16, 19, 22, 28].includes(l.day_number)) {
      l.status = 'active';
      l.data_group = 'supplemental_11_lessons';
      if (t && t.notes) {
        l.notes = t.notes;
      }
    }
  });

  grouped.metadata = {
    ...grouped.metadata,
    generated_at: new Date().toISOString(),
    total_topics: 30,
    total_structures: 288,
    groups: {
      core_19_lessons: {
        count: 19,
        description: 'Verified lessons from grammar.json mapped to 15-day intensive cohort schedule'
      },
      supplemental_11_lessons: {
        count: 11,
        description: 'Lessons transcribed from Audio Boost with reflex-oriented 1-to-1 canonical structures'
      },
      pending_0_lessons: {
        count: 0,
        description: 'All 30 lessons audio verified with zero pending'
      }
    }
  };

  fs.writeFileSync(GROUPED_JSON_PATH, JSON.stringify(grouped, null, 2), 'utf8');
  console.log(`💾 Saved updated: ${GROUPED_JSON_PATH}`);

  // 3. Update levelBGrammarData.ts
  const tsEntries = catalog.topics.map((t: any) => {
    return `  {
    id: "grammar_level_b_day_${t.day_number}",
    lesson_id: "${t.lesson_id}",
    course_id: "course_level_b",
    day_number: ${t.day_number},
    lesson_title: ${JSON.stringify(t.lesson_title)},
    verb_forms: ${JSON.stringify(t.verb_forms, null, 6)},
    sentence_structures: ${JSON.stringify(t.sentence_structures, null, 6)},
    tense: ${JSON.stringify(t.tense, null, 6)},
    notes: ${JSON.stringify(t.notes || '')}
  }`;
  });

  const tsContent = `import { LessonGrammarDoc } from '../types';

/**
 * Level B - ERE (English Reflexes Enhancement - 30 Topics) Canonical Grammar Catalog
 * STRICT 1-TO-1 ALIGNMENT: 1 Audio Recording = Exactly 1 Primary Target Grammar Structure
 * Total 30 Days: 288 Audio Mini-Lessons = 288 Total Focus Formulas (Zero Pending)
 * Partitioned cleanly into sentence_structures, verb_forms, and tense without duplicate bloat.
 * Last Audit & Update: ${new Date().toISOString()}
 */
export const LEVEL_B_ERE_GRAMMAR_CATALOG: LessonGrammarDoc[] = [
${tsEntries.join(',\n')}
];

/**
 * Fast lookup helper for grammar by day number (1..30)
 */
export function getGrammarForDay(dayNumber: number): LessonGrammarDoc | undefined {
  return LEVEL_B_ERE_GRAMMAR_CATALOG.find(g => g.day_number === dayNumber);
}

/**
 * Fast lookup helper for grammar by lesson ID (e.g. "level_b_day_5", "level_b_ere_day_5", "day 5")
 */
export function getGrammarForLesson(lessonId: string): LessonGrammarDoc | undefined {
  if (!lessonId) return undefined;
  const clean = lessonId.trim().toLowerCase();

  // 1. Direct match by lesson_id or id
  const direct = LEVEL_B_ERE_GRAMMAR_CATALOG.find(g => 
    g.lesson_id.toLowerCase() === clean || 
    g.id.toLowerCase() === clean
  );
  if (direct) return direct;

  // 2. Extract day number from id (e.g. "level_b_day_1", "level_b_ere_day_1", "day_1", "day 1")
  const dayMatch = clean.match(/day[_\\s-]*(\\d+)/i);
  if (dayMatch) {
    const dayNum = parseInt(dayMatch[1], 10);
    return getGrammarForDay(dayNum);
  }

  return undefined;
}
`;

  fs.writeFileSync(LEVEL_B_DATA_PATH, tsContent, 'utf8');
  console.log(`💾 Saved updated: ${LEVEL_B_DATA_PATH}`);

  // 4. Regenerate Markdown Catalogs
  generateBoostMarkdown(catalog);
  generateGroupedMarkdown(grouped);

  console.log('\n=====================================================');
  console.log(`🎉 SUCCESS: All 30 Topics & ${totalMatched} Mini-Lessons are now 1-to-1 aligned!`);
  console.log('=====================================================');
}

function generateBoostMarkdown(catalog: any) {
  const CATALOG_MD_PATH = path.resolve('scripts/grammar-boost-catalog.md');
  const mdLines: string[] = [];
  mdLines.push(`# 📚 CHUNKS Level B (ERE) Grammar Boost Catalog`);
  mdLines.push(`\n> **Source**: \`${catalog.metadata.source_directory}\``);
  mdLines.push(`> **Model**: \`gemini-2.5-flash\` | **Generated**: ${new Date().toLocaleDateString('vi-VN')}`);
  mdLines.push(`> **Coverage**: ${catalog.topics.filter((s: any) => s.source_type === 'audio_boost').length}/30 Topics with native teacher audio (${catalog.metadata.total_audio_files} MP3 mini-lessons).\n`);

  mdLines.push(`## 📊 Executive Summary Table\n`);
  mdLines.push(`| Day | Lesson Title | Audio Files | Key Topics Covered | Top Structures / Patterns |`);
  mdLines.push(`| :---: | :--- | :---: | :--- | :--- |`);

  for (const s of catalog.topics) {
    if (s.source_type === 'audio_boost') {
      const topTopics = s.mini_lessons.map((m: any) => m.topic).filter(Boolean).slice(0, 3).join(', ');
      const topStructs = s.sentence_structures.slice(0, 2).join('; ') || s.verb_forms.slice(0, 2).join('; ') || 'N/A';
      mdLines.push(`| **Day ${s.day_number}** | ${s.lesson_title} | **${s.total_audio_files}** | ${topTopics} | \`${topStructs}\` |`);
    } else {
      mdLines.push(`| **Day ${s.day_number}** | ${s.lesson_title} | *0 (Pending)* | *Curriculum Chunks (Pending)* | *Pending* |`);
    }
  }

  mdLines.push(`\n---\n`);
  mdLines.push(`## 📖 Detailed Grammar Points by Topic\n`);

  for (const s of catalog.topics) {
    mdLines.push(`### Day ${s.day_number}: ${s.lesson_title}`);
    if (s.source_type === 'pending') {
      mdLines.push(`\n*Audio not included in Grammar Boost package. Curriculum chunk extraction pending for this topic.*\n`);
      continue;
    }

    mdLines.push(`\n- **Audio Mini-Lessons**: ${s.total_audio_files} recordings`);
    if (s.sentence_structures.length > 0) {
      mdLines.push(`- **Sentence Structures**: ${s.sentence_structures.map((x: string) => `\`${x}\``).join(', ')}`);
    }
    if (s.verb_forms.length > 0) {
      mdLines.push(`- **Verb Forms / Patterns**: ${s.verb_forms.map((x: string) => `\`${x}\``).join(', ')}`);
    }
    if (s.tense.length > 0) {
      mdLines.push(`- **Tense & Aspect**: ${s.tense.map((x: string) => `\`${x}\``).join(', ')}`);
    }

    mdLines.push(`\n#### 🎙️ Verbatim Audio Lessons & Transcripts\n`);

    for (let i = 0; i < s.mini_lessons.length; i++) {
      const ml = s.mini_lessons[i];
      mdLines.push(`##### ${i + 1}. \`${ml.file}\` — ${ml.primary_structure || ml.topic || 'Grammar Point'}`);
      mdLines.push(`\n**Verbatim Teacher Explanation (Vietnamese + English):**`);
      mdLines.push(`> "${ml.transcript}"\n`);

      if (ml.structures && ml.structures.length > 0) {
        mdLines.push(`- **Structures**: ${ml.structures.map((x: string) => `\`${x}\``).join(', ')}`);
      }
      if (ml.verb_forms && ml.verb_forms.length > 0) {
        mdLines.push(`- **Verb Forms**: ${ml.verb_forms.map((x: string) => `\`${x}\``).join(', ')}`);
      }
      if (ml.tense && ml.tense.length > 0) {
        mdLines.push(`- **Tense**: ${ml.tense.map((x: string) => `\`${x}\``).join(', ')}`);
      }

      if (ml.examples && ml.examples.length > 0) {
        mdLines.push(`\n**Examples:**`);
        for (const ex of ml.examples) {
          mdLines.push(`- 🇬🇧 *${ex.en}* ${ex.vi ? `— 🇻🇳 ${ex.vi}` : ''}`);
        }
      }

      if (ml.notes) {
        mdLines.push(`\n**Teacher Notes:** ${ml.notes}`);
      }
      mdLines.push(`\n`);
    }

    mdLines.push(`\n---\n`);
  }

  fs.writeFileSync(CATALOG_MD_PATH, mdLines.join('\n'), 'utf-8');
  console.log(`💾 Saved updated: ${CATALOG_MD_PATH}`);
}

function generateGroupedMarkdown(grouped: any) {
  const OUTPUT_MD_PATH = path.resolve('scripts/grammar-grouped-catalog.md');
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
| **Group 2: Supplemental 11 Lessons** | 11 | \`active\` | Transcribed from Grammar Boost audio, condensed into reflex-oriented patterns matching \`grammar.json\` format (Days 1, 2, 3, 4, 7, 8, 13, 16, 19, 22, 28). |
| **Total Curriculum** | **30** | \`active\` | **100% complete coverage across 6 thematic modules with zero pending audio.** |

---

## 2. Dual-Index Master Curriculum Map

Every lesson possesses a dual index:
- **30-Day Master Schedule**: Sequential days 1 through 30.
- **15-Day Cohort Schedule**: Intensive 2-lesson format covering 10 teaching days (Days 1, 2, 4, 5, 7, 8, 10, 11, 13, 14), with review/milestone days on Days 3, 6, 9, 12, 15.

| Day (1–30) | Lesson Title | Thematic Module | Data Group | Status | 15-Day Cohort | 19-Lesson Index |
| :---: | :--- | :--- | :---: | :---: | :---: | :---: |
`;

  grouped.lessons.forEach((l: any) => {
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
    const modLessons = grouped.lessons.filter((l: any) => l.thematic_module === mod);
    if (modLessons.length === 0) return;
    mdContent += `### Module ${modIdx + 1}: ${mod} (Days ${modLessons[0].day_number}–${modLessons[modLessons.length - 1].day_number})\n\n`;
    modLessons.forEach((l: any) => {
      mdContent += `#### 📌 Day ${l.day_number}: ${l.lesson_title}\n`;
      mdContent += `- **Group**: \`${l.data_group}\` | **Status**: \`${l.status}\`${l.lesson_number_19 ? ` | **Cohort**: Day ${l.cohort_day_15} (Lesson ${l.lesson_number_19})` : ''}\n`;
      mdContent += `- **Verb Forms & Phrases**:\n`;
      l.verb_forms.forEach((v: string) => mdContent += `  - \`${v}\`\n`);
      mdContent += `- **Sentence Structures**:\n`;
      if (l.sentence_structures.length === 0) {
        mdContent += `  - *(Integrated into verb forms / no separate structures)*\n`;
      } else {
        l.sentence_structures.forEach((s: string) => mdContent += `  - \`${s}\`\n`);
      }
      mdContent += `- **Tense & Reflex Frames**:\n`;
      l.tense.forEach((t: string) => mdContent += `  - \`${t}\`\n`);
      mdContent += `\n`;
    });
  });

  mdContent += `\n---\n\n## 4. Pedagogical Guidelines for Classroom Presentation

1. **High-Contrast Slide 0 Presentation**:
   - Each slide presents clean, readable cards for Sentence Structures, Verb Forms, and Tense & Reflex Frames.
   - Elimination of academic labels enables students to drill oral reflexes directly without cognitive overload.
2. **Pedagogical Drawer Notes**:
   - Rich teacher guidance notes are preserved in the platform's data layer, accessible via drawers and tooltips without cluttering the projector stage.
3. **Audio Boost Integration**:
   - All 30 topics are 100% verified with native teacher audio recordings (288 mini-lessons). All structures map 1-to-1 to audio recordings.

`;

  fs.writeFileSync(OUTPUT_MD_PATH, mdContent, 'utf8');
  console.log(`💾 Saved updated: ${OUTPUT_MD_PATH}`);
}

alignGrammar();
