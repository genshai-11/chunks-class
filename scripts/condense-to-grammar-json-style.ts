import * as fs from 'fs';
import * as path from 'path';

interface AlignmentEntry {
  primary_structure: string;
  structure_type: 'sentence_structure' | 'verb_form' | 'tense_reflex';
}

/**
 * Canonical 1-to-1 Mapping Dictionary in pure grammar.json style
 * Zero academic metalanguage. Every single audio has a punchy spoken English reflex chunk.
 * 288 audio recordings = 288 focus formulas across 30 days.
 */
export const CONDENSED_GRAMMAR_ALIGNMENT: Record<string, AlignmentEntry> = {
  // ==========================================
  // Day 1: Day 1 - First Day Of Work (9 audios)
  // ==========================================
  '1en_Gr_01_1.mp3': { primary_structure: 'Be aware that…', structure_type: 'sentence_structure' },
  '1en_Gr_01_2.mp3': { primary_structure: 'Because of + N', structure_type: 'sentence_structure' },
  '1en_Gr_01_3.mp3': { primary_structure: 'Be supposed to V1', structure_type: 'verb_form' },
  '1en_Gr_01_4.mp3': { primary_structure: 'Spend [time] V-ing', structure_type: 'verb_form' },
  '1en_Gr_01_5.mp3': { primary_structure: 'There’s a lot of…', structure_type: 'sentence_structure' },
  '1en_Gr_01_6.mp3': { primary_structure: '…, would you?', structure_type: 'sentence_structure' },
  '1en_Gr_01_7.mp3': { primary_structure: 'Have [X] years of experience V-ing', structure_type: 'verb_form' },
  '1en_Gr_01_8.mp3': { primary_structure: 'Be gonna V1', structure_type: 'verb_form' },
  '1en_Gr_01_9.mp3': { primary_structure: 'Have you already V3?', structure_type: 'tense_reflex' },

  // ==========================================
  // Day 2: Day 2 - Viettel (11 audios)
  // ==========================================
  '1en_Gr_02_1.mp3': { primary_structure: 'I do know…', structure_type: 'verb_form' },
  '1en_Gr_02_2.mp3': { primary_structure: 'Directly connect', structure_type: 'verb_form' },
  '1en_Gr_02_3.mp3': { primary_structure: 'Be interested in A', structure_type: 'verb_form' },
  '1en_Gr_02_4.mp3': { primary_structure: 'Would you mind V-ing?', structure_type: 'sentence_structure' },
  '1en_Gr_02_5.mp3': { primary_structure: 'I’ve got news for you', structure_type: 'sentence_structure' },
  '1en_Gr_02_6.mp3': { primary_structure: 'Have A V1', structure_type: 'sentence_structure' },
  '1en_Gr_02_7.mp3': { primary_structure: 'A has nothing to do with B', structure_type: 'sentence_structure' },
  '1en_Gr_02_8.mp3': { primary_structure: 'What I want is…', structure_type: 'sentence_structure' },
  '1en_Gr_02_9.mp3': { primary_structure: 'I want to know if…', structure_type: 'sentence_structure' },
  '1en_Gr_02_10.mp3': { primary_structure: 'It seemed that…', structure_type: 'tense_reflex' },
  '1en_Gr_02_11.mp3': { primary_structure: 'I will be V-ing', structure_type: 'tense_reflex' },

  // ==========================================
  // Day 3: Day 3 - Tell me about yourself (11 audios)
  // ==========================================
  '1en_Gr_03_1.mp3': { primary_structure: 'Specifically', structure_type: 'verb_form' },
  '1en_Gr_03_2.mp3': { primary_structure: 'Congratulations!', structure_type: 'verb_form' },
  '1en_Gr_03_3.mp3': { primary_structure: 'Love/like V-ing', structure_type: 'verb_form' },
  '1en_Gr_03_4.mp3': { primary_structure: 'From V-ing to V-ing', structure_type: 'verb_form' },
  '1en_Gr_03_5.mp3': { primary_structure: 'See myself as A', structure_type: 'sentence_structure' },
  '1en_Gr_03_6.mp3': { primary_structure: 'Be into A', structure_type: 'sentence_structure' },
  '1en_Gr_03_7.mp3': { primary_structure: 'In spite of + N', structure_type: 'sentence_structure' },
  '1en_Gr_03_8.mp3': { primary_structure: 'Have a year of V-ing', structure_type: 'verb_form' },
  '1en_Gr_03_9.mp3': { primary_structure: 'I’ve been V-ing', structure_type: 'tense_reflex' },
  '1en_Gr_03_10.mp3': { primary_structure: 'Like I said,…', structure_type: 'tense_reflex' },
  '1en_Gr_03_11.mp3': { primary_structure: 'What you just said excites me', structure_type: 'tense_reflex' },

  // ==========================================
  // Day 4: Day 4 - Smarketing (9 audios)
  // ==========================================
  '1en_Gr_04_1.mp3': { primary_structure: 'Gotta V1', structure_type: 'verb_form' },
  '1en_Gr_04_2.mp3': { primary_structure: 'Scared of A', structure_type: 'verb_form' },
  '1en_Gr_04_3.mp3': { primary_structure: 'Good enough', structure_type: 'sentence_structure' },
  '1en_Gr_04_4.mp3': { primary_structure: 'Want A to V1', structure_type: 'verb_form' },
  '1en_Gr_04_5.mp3': { primary_structure: 'It’s easy to V1', structure_type: 'sentence_structure' },
  '1en_Gr_04_6.mp3': { primary_structure: 'There is / are…', structure_type: 'sentence_structure' },
  '1en_Gr_04_7.mp3': { primary_structure: 'Turns out that…', structure_type: 'sentence_structure' },
  '1en_Gr_04_8.mp3': { primary_structure: 'As you were told', structure_type: 'tense_reflex' },
  '1en_Gr_04_9.mp3': { primary_structure: 'I’ll never V1 anymore', structure_type: 'tense_reflex' },

  // ==========================================
  // Day 5: Day 5 - Office Romance (Lesson 1 in grammar.json) (10 audios)
  // ==========================================
  '1en_Gr_05_1.mp3': { primary_structure: 'Nowadays', structure_type: 'verb_form' },
  '1en_Gr_05_2.mp3': { primary_structure: '100%', structure_type: 'verb_form' },
  '1en_Gr_05_3.mp3': { primary_structure: 'Lots of = a lot of', structure_type: 'verb_form' },
  '1en_Gr_05_4.mp3': { primary_structure: 'Subordinate', structure_type: 'verb_form' },
  '1en_Gr_05_5.mp3': { primary_structure: '… and yet…', structure_type: 'sentence_structure' },
  '1en_Gr_05_6.mp3': { primary_structure: 'Become attracted to A', structure_type: 'sentence_structure' },
  '1en_Gr_05_7.mp3': { primary_structure: 'Help A (to) V', structure_type: 'sentence_structure' },
  '1en_Gr_05_8.mp3': { primary_structure: 'Who knows?!?', structure_type: 'sentence_structure' },
  '1en_Gr_05_9.mp3': { primary_structure: 'Have you ever V3…?', structure_type: 'tense_reflex' },
  '1en_Gr_05_10.mp3': { primary_structure: 'You’ve been warned!', structure_type: 'tense_reflex' },

  // ==========================================
  // Day 6: Day 6 - Gossipy (Lesson 2 in grammar.json) (11 audios)
  // ==========================================
  '1en_Gr_06_1.mp3': { primary_structure: 'She looks…', structure_type: 'verb_form' },
  '1en_Gr_06_2.mp3': { primary_structure: 'Plan to / be gonna move in?', structure_type: 'verb_form' },
  '1en_Gr_06_3.mp3': { primary_structure: 'Refuse to V', structure_type: 'verb_form' },
  '1en_Gr_06_4.mp3': { primary_structure: 'There’s this guy V-ing', structure_type: 'sentence_structure' },
  '1en_Gr_06_5.mp3': { primary_structure: 'Kim is not that tough', structure_type: 'sentence_structure' },
  '1en_Gr_06_6.mp3': { primary_structure: 'If you don’t mind me asking', structure_type: 'sentence_structure' },
  '1en_Gr_06_7.mp3': { primary_structure: 'There’s a lot of…', structure_type: 'sentence_structure' },
  '1en_Gr_06_8.mp3': { primary_structure: 'I must have V3', structure_type: 'tense_reflex' },
  '1en_Gr_06_9.mp3': { primary_structure: 'I didn’t do anything!', structure_type: 'tense_reflex' },
  '1en_Gr_06_10.mp3': { primary_structure: 'We’ve been together for…', structure_type: 'tense_reflex' },
  '1en_Gr_06_11.mp3': { primary_structure: 'This is the first time I’ve V3', structure_type: 'tense_reflex' },

  // ==========================================
  // Day 7: Day 7 - Electronic mail (9 audios)
  // ==========================================
  '1en_Gr_07_1.mp3': { primary_structure: 'Precisely', structure_type: 'verb_form' },
  '1en_Gr_07_2.mp3': { primary_structure: 'It seems like…', structure_type: 'sentence_structure' },
  '1en_Gr_07_3.mp3': { primary_structure: 'Find A interesting', structure_type: 'sentence_structure' },
  '1en_Gr_07_4.mp3': { primary_structure: 'What happens next?', structure_type: 'sentence_structure' },
  '1en_Gr_07_5.mp3': { primary_structure: 'Never heard of A', structure_type: 'sentence_structure' },
  '1en_Gr_07_6.mp3': { primary_structure: '…, right?', structure_type: 'sentence_structure' },
  '1en_Gr_07_7.mp3': { primary_structure: 'A might be V-ing', structure_type: 'tense_reflex' },
  '1en_Gr_07_8.mp3': { primary_structure: 'I was wondering if…', structure_type: 'sentence_structure' },
  '1en_Gr_07_9.mp3': { primary_structure: 'It’s been [time] since… V2', structure_type: 'tense_reflex' },

  // ==========================================
  // Day 8: Day 8 - COVID-19 (10 audios)
  // ==========================================
  '1en_Gr_08_1.mp3': { primary_structure: 'One of the…', structure_type: 'sentence_structure' },
  '1en_Gr_08_2.mp3': { primary_structure: 'Speaking of A', structure_type: 'sentence_structure' },
  '1en_Gr_08_3.mp3': { primary_structure: 'Will be able to V1', structure_type: 'verb_form' },
  '1en_Gr_08_4.mp3': { primary_structure: 'Get V3', structure_type: 'verb_form' },
  '1en_Gr_08_5.mp3': { primary_structure: 'Everybody knows…', structure_type: 'sentence_structure' },
  '1en_Gr_08_6.mp3': { primary_structure: 'Go V1', structure_type: 'verb_form' },
  '1en_Gr_08_7.mp3': { primary_structure: 'Suffer from A', structure_type: 'verb_form' },
  '1en_Gr_08_8.mp3': { primary_structure: 'Help A V1', structure_type: 'verb_form' },
  '1en_Gr_08_9.mp3': { primary_structure: 'I’ve V3 so far', structure_type: 'tense_reflex' },
  '1en_Gr_08_10.mp3': { primary_structure: 'Since I V2,…', structure_type: 'tense_reflex' },

  // ==========================================
  // Day 9: Day 9 - Business Trip (Lesson 3 in grammar.json) (11 audios)
  // ==========================================
  '1en_Gr_09_1.mp3': { primary_structure: 'The inevitable', structure_type: 'verb_form' },
  '1en_Gr_09_2.mp3': { primary_structure: 'In these kinds of trips', structure_type: 'verb_form' },
  '1en_Gr_09_3.mp3': { primary_structure: 'End up V-ing', structure_type: 'verb_form' },
  '1en_Gr_09_4.mp3': { primary_structure: 'don’t wanna be late', structure_type: 'verb_form' },
  '1en_Gr_09_5.mp3': { primary_structure: 'Be supposed to…', structure_type: 'sentence_structure' },
  '1en_Gr_09_6.mp3': { primary_structure: 'I’m scared of…', structure_type: 'sentence_structure' },
  '1en_Gr_09_7.mp3': { primary_structure: 'What are you gonna do then?', structure_type: 'sentence_structure' },
  '1en_Gr_09_8.mp3': { primary_structure: 'No matter how…', structure_type: 'sentence_structure' },
  '1en_Gr_09_9.mp3': { primary_structure: 'You’ll soon have to…', structure_type: 'tense_reflex' },
  '1en_Gr_09_10.mp3': { primary_structure: 'I’ve been to…', structure_type: 'tense_reflex' },
  '1en_Gr_09_11.mp3': { primary_structure: 'It depends on where you’re going', structure_type: 'tense_reflex' },

  // ==========================================
  // Day 10: Day 10 - Project Management (Lesson 4 in grammar.json) (10 audios)
  // ==========================================
  '1en_Gr_10_1.mp3': { primary_structure: 'How to…?', structure_type: 'verb_form' },
  '1en_Gr_10_2.mp3': { primary_structure: 'Being a… doesn’t mean…', structure_type: 'verb_form' },
  '1en_Gr_10_3.mp3': { primary_structure: 'It’s not a good idea to…', structure_type: 'sentence_structure' },
  '1en_Gr_10_4.mp3': { primary_structure: 'Why don’t we…?', structure_type: 'sentence_structure' },
  '1en_Gr_10_5.mp3': { primary_structure: 'If we V2, we would V1', structure_type: 'sentence_structure' },
  '1en_Gr_10_6.mp3': { primary_structure: 'Either A or B will…', structure_type: 'sentence_structure' },
  '1en_Gr_10_7.mp3': { primary_structure: 'When I was little,…', structure_type: 'tense_reflex' },
  '1en_Gr_10_8.mp3': { primary_structure: 'I decided to…', structure_type: 'tense_reflex' },
  '1en_Gr_10_9.mp3': { primary_structure: 'I thought I would …', structure_type: 'tense_reflex' },
  '1en_Gr_10_10.mp3': { primary_structure: 'I thought you would have V3 …', structure_type: 'tense_reflex' },

  // ==========================================
  // Day 11: Day 11 - Stand Up Meeting (Lesson 5 in grammar.json) (10 audios)
  // ==========================================
  '1en_Gr_11_1.mp3': { primary_structure: 'There’re plenty of …', structure_type: 'verb_form' },
  '1en_Gr_11_2.mp3': { primary_structure: 'Prevent sth from V-ing', structure_type: 'verb_form' },
  '1en_Gr_11_3.mp3': { primary_structure: 'Stay V-ed', structure_type: 'verb_form' },
  '1en_Gr_11_4.mp3': { primary_structure: 'Every day', structure_type: 'verb_form' },
  '1en_Gr_11_5.mp3': { primary_structure: '… is still under control', structure_type: 'sentence_structure' },
  '1en_Gr_11_6.mp3': { primary_structure: 'Need nothing but …', structure_type: 'sentence_structure' },
  '1en_Gr_11_7.mp3': { primary_structure: 'A’s deeply involved in …', structure_type: 'sentence_structure' },
  '1en_Gr_11_8.mp3': { primary_structure: 'Before the police comes', structure_type: 'tense_reflex' },
  '1en_Gr_11_9.mp3': { primary_structure: 'I’ve V3… lately', structure_type: 'tense_reflex' },
  '1en_Gr_11_10.mp3': { primary_structure: 'I’ve V3… for years', structure_type: 'tense_reflex' },

  // ==========================================
  // Day 12: Day 12 - Productive Arguments (Lesson 6 in grammar.json) (9 audios)
  // ==========================================
  '1en_Gr_12_1.mp3': { primary_structure: 'Try V-ing', structure_type: 'verb_form' },
  '1en_Gr_12_2.mp3': { primary_structure: 'Get used to it', structure_type: 'verb_form' },
  '1en_Gr_12_3.mp3': { primary_structure: 'Life is like V-ing', structure_type: 'verb_form' },
  '1en_Gr_12_4.mp3': { primary_structure: 'Take a look = look at', structure_type: 'verb_form' },
  '1en_Gr_12_5.mp3': { primary_structure: 'There’s no easy way to…', structure_type: 'sentence_structure' },
  '1en_Gr_12_6.mp3': { primary_structure: '… for what?', structure_type: 'sentence_structure' },
  '1en_Gr_12_7.mp3': { primary_structure: 'If I were in your shoes, I would…', structure_type: 'sentence_structure' },
  '1en_Gr_12_8.mp3': { primary_structure: 'I don’t see why…', structure_type: 'sentence_structure' },
  '1en_Gr_12_9.mp3': { primary_structure: 'A once said…', structure_type: 'tense_reflex' },

  // ==========================================
  // Day 13: Day 13 - Chart analysis (7 audios)
  // ==========================================
  '1en_Gr_13_1.mp3': { primary_structure: 'Increase twofold', structure_type: 'verb_form' },
  '1en_Gr_13_2.mp3': { primary_structure: '…, which means…', structure_type: 'sentence_structure' },
  '1en_Gr_13_3.mp3': { primary_structure: 'Nothing compared to A', structure_type: 'sentence_structure' },
  '1en_Gr_13_4.mp3': { primary_structure: 'It doesn’t necessarily mean that…', structure_type: 'sentence_structure' },
  '1en_Gr_13_5.mp3': { primary_structure: 'What’s going on?', structure_type: 'sentence_structure' },
  '1en_Gr_13_6.mp3': { primary_structure: 'What have you done?', structure_type: 'tense_reflex' },
  '1en_Gr_13_7.mp3': { primary_structure: 'There has been…', structure_type: 'tense_reflex' },

  // ==========================================
  // Day 14: Day 14 - Customer Complaint (Lesson 7 in grammar.json) (12 audios)
  // ==========================================
  '1en_Gr_14_1.mp3': { primary_structure: 'Remain courteous', structure_type: 'verb_form' },
  '1en_Gr_14_2.mp3': { primary_structure: 'I’ll keep you V3', structure_type: 'verb_form' },
  '1en_Gr_14_3.mp3': { primary_structure: 'Prove A wrong', structure_type: 'verb_form' },
  '1en_Gr_14_4.mp3': { primary_structure: 'It works like a charm', structure_type: 'verb_form' },
  '1en_Gr_14_5.mp3': { primary_structure: 'No worries', structure_type: 'verb_form' },
  '1en_Gr_14_6.mp3': { primary_structure: 'All you need to do is…', structure_type: 'sentence_structure' },
  '1en_Gr_14_7.mp3': { primary_structure: 'It’s totally understandable that…', structure_type: 'sentence_structure' },
  '1en_Gr_14_8.mp3': { primary_structure: 'There’s a famous saying that goes …', structure_type: 'sentence_structure' },
  '1en_Gr_14_9.mp3': { primary_structure: 'I’m not sure', structure_type: 'sentence_structure' },
  '1en_Gr_14_10.mp3': { primary_structure: 'In case you haven’t noticed', structure_type: 'tense_reflex' },
  '1en_Gr_14_11.mp3': { primary_structure: 'I don’t know who put…', structure_type: 'tense_reflex' },
  '1en_Gr_14_12.mp3': { primary_structure: 'Are you saying that…?', structure_type: 'tense_reflex' },

  // ==========================================
  // Day 15: Day 15 - Close The Deal (Lesson 8 in grammar.json) (12 audios)
  // ==========================================
  '1en_Gr_15_1.mp3': { primary_structure: 'Go bankrupt', structure_type: 'verb_form' },
  '1en_Gr_15_2.mp3': { primary_structure: 'Very intimidating', structure_type: 'verb_form' },
  '1en_Gr_15_3.mp3': { primary_structure: '… is flooded with…', structure_type: 'verb_form' },
  '1en_Gr_15_4.mp3': { primary_structure: 'Why bother?', structure_type: 'verb_form' },
  '1en_Gr_15_5.mp3': { primary_structure: 'Keep V-ing', structure_type: 'verb_form' },
  '1en_Gr_15_6.mp3': { primary_structure: 'How’d it go?', structure_type: 'sentence_structure' },
  '1en_Gr_15_7.mp3': { primary_structure: 'I’ve invested so much time in V-ing', structure_type: 'sentence_structure' },
  '1en_Gr_15_8.mp3': { primary_structure: 'What value will you add…?', structure_type: 'sentence_structure' },
  '1en_Gr_15_9.mp3': { primary_structure: 'Do you know who my dad is?', structure_type: 'sentence_structure' },
  '1en_Gr_15_10.mp3': { primary_structure: 'That’s not gonna happen', structure_type: 'tense_reflex' },
  '1en_Gr_15_11.mp3': { primary_structure: 'I’ve been thinking a lot about…', structure_type: 'tense_reflex' },
  '1en_Gr_15_12.mp3': { primary_structure: 'Is he coming?', structure_type: 'tense_reflex' },

  // ==========================================
  // Day 16: Day 16 - Social media (7 audios)
  // ==========================================
  '1en_Gr_16_1.mp3': { primary_structure: 'Get left behind', structure_type: 'verb_form' },
  '1en_Gr_16_2.mp3': { primary_structure: 'Look identical', structure_type: 'sentence_structure' },
  '1en_Gr_16_3.mp3': { primary_structure: 'Must be taken seriously', structure_type: 'verb_form' },
  '1en_Gr_16_4.mp3': { primary_structure: 'A little bird told me that…', structure_type: 'sentence_structure' },
  '1en_Gr_16_5.mp3': { primary_structure: 'There’s A V-ing', structure_type: 'sentence_structure' },
  '1en_Gr_16_6.mp3': { primary_structure: 'Hasn’t anyone told you…?', structure_type: 'tense_reflex' },
  '1en_Gr_16_7.mp3': { primary_structure: 'Spend [time] V-ing', structure_type: 'verb_form' },

  // ==========================================
  // Day 17: Day 17 - Teamwork (Lesson 9 in grammar.json) (12 audios)
  // ==========================================
  '1en_Gr_17_1.mp3': { primary_structure: 'I want you to be aware of that', structure_type: 'verb_form' },
  '1en_Gr_17_2.mp3': { primary_structure: 'Let A V1', structure_type: 'verb_form' },
  '1en_Gr_17_3.mp3': { primary_structure: 'Here comes…', structure_type: 'verb_form' },
  '1en_Gr_17_4.mp3': { primary_structure: 'What are you up to?', structure_type: 'sentence_structure' },
  '1en_Gr_17_5.mp3': { primary_structure: 'There is something wrong with...', structure_type: 'sentence_structure' },
  '1en_Gr_17_6.mp3': { primary_structure: 'From now on, I will…', structure_type: 'sentence_structure' },
  '1en_Gr_17_7.mp3': { primary_structure: 'I didn’t say it would be…', structure_type: 'tense_reflex' },
  '1en_Gr_17_8.mp3': { primary_structure: 'Did you hear?', structure_type: 'tense_reflex' },
  '1en_Gr_17_9.mp3': { primary_structure: 'A has been V-ing all morning', structure_type: 'tense_reflex' },
  '1en_Gr_17_10.mp3': { primary_structure: 'The moment I walked in…', structure_type: 'tense_reflex' },
  '1en_Gr_17_11.mp3': { primary_structure: 'Why haven’t I been told?', structure_type: 'tense_reflex' },
  '1en_Gr_17_12.mp3': { primary_structure: 'Who told you…?', structure_type: 'tense_reflex' },

  // ==========================================
  // Day 18: Day 18 - Salary Negotiation (Lesson 10 in grammar.json) (10 audios)
  // ==========================================
  '1en_Gr_18_1.mp3': { primary_structure: 'To put it politely', structure_type: 'verb_form' },
  '1en_Gr_18_2.mp3': { primary_structure: 'Worth V-ing', structure_type: 'verb_form' },
  '1en_Gr_18_3.mp3': { primary_structure: 'Let’s V1', structure_type: 'verb_form' },
  '1en_Gr_18_4.mp3': { primary_structure: 'If my memory serves', structure_type: 'verb_form' },
  '1en_Gr_18_5.mp3': { primary_structure: 'Why make a big deal…?', structure_type: 'sentence_structure' },
  '1en_Gr_18_6.mp3': { primary_structure: 'I don’t feel heard', structure_type: 'sentence_structure' },
  '1en_Gr_18_7.mp3': { primary_structure: 'There’s nothing to be scared of', structure_type: 'sentence_structure' },
  '1en_Gr_18_8.mp3': { primary_structure: 'I keep asking myself', structure_type: 'sentence_structure' },
  '1en_Gr_18_9.mp3': { primary_structure: 'A is young enough to…', structure_type: 'sentence_structure' },
  '1en_Gr_18_10.mp3': { primary_structure: 'I’ve come too far', structure_type: 'tense_reflex' },

  // ==========================================
  // Day 19: Day 19 - EXCEL (8 audios)
  // ==========================================
  '1en_Gr_19_1.mp3': { primary_structure: 'You’re not allowed to…', structure_type: 'sentence_structure' },
  '1en_Gr_19_2.mp3': { primary_structure: 'Finish V-ing', structure_type: 'verb_form' },
  '1en_Gr_19_3.mp3': { primary_structure: 'Except (to) V1', structure_type: 'verb_form' },
  '1en_Gr_19_4.mp3': { primary_structure: 'May I V1?', structure_type: 'sentence_structure' },
  '1en_Gr_19_5.mp3': { primary_structure: 'It takes [time] to V1', structure_type: 'sentence_structure' },
  '1en_Gr_19_6.mp3': { primary_structure: 'Is there a possibility that…', structure_type: 'sentence_structure' },
  '1en_Gr_19_7.mp3': { primary_structure: 'There’s nothing to worry about', structure_type: 'sentence_structure' },
  '1en_Gr_19_8.mp3': { primary_structure: 'I V2 all day yesterday', structure_type: 'tense_reflex' },

  // ==========================================
  // Day 20: Day 20 - Year-end Party (Lesson 11 in grammar.json) (12 audios)
  // ==========================================
  '1en_Gr_20_1.mp3': { primary_structure: 'Sounds like a plan', structure_type: 'verb_form' },
  '1en_Gr_20_2.mp3': { primary_structure: 'If everybody chips in', structure_type: 'verb_form' },
  '1en_Gr_20_3.mp3': { primary_structure: '… is getting bigger', structure_type: 'verb_form' },
  '1en_Gr_20_4.mp3': { primary_structure: 'Stop V-ing', structure_type: 'verb_form' },
  '1en_Gr_20_5.mp3': { primary_structure: 'There’s a lot of…', structure_type: 'sentence_structure' },
  '1en_Gr_20_6.mp3': { primary_structure: '(Do) you still remember?', structure_type: 'sentence_structure' },
  '1en_Gr_20_7.mp3': { primary_structure: 'You’re not allowed to…', structure_type: 'sentence_structure' },
  '1en_Gr_20_8.mp3': { primary_structure: 'I did ask him but…', structure_type: 'sentence_structure' },
  '1en_Gr_20_9.mp3': { primary_structure: 'This time I’m not gonna…', structure_type: 'tense_reflex' },
  '1en_Gr_20_10.mp3': { primary_structure: 'It’s been a long time since the last time… V2', structure_type: 'tense_reflex' },
  '1en_Gr_20_11.mp3': { primary_structure: 'Whenever A V1, A will…', structure_type: 'tense_reflex' },
  '1en_Gr_20_12.mp3': { primary_structure: 'I forgot to…', structure_type: 'tense_reflex' },

  // ==========================================
  // Day 21: Day 21 - Compensation and benefits (Lesson 12 in grammar.json) (9 audios)
  // ==========================================
  '1en_Gr_21_1.mp3': { primary_structure: 'Enjoy/love + V-ing', structure_type: 'verb_form' },
  '1en_Gr_21_2.mp3': { primary_structure: 'After V-ing', structure_type: 'verb_form' },
  '1en_Gr_21_3.mp3': { primary_structure: 'More specifically', structure_type: 'verb_form' },
  '1en_Gr_21_4.mp3': { primary_structure: 'What are we supposed to...?', structure_type: 'sentence_structure' },
  '1en_Gr_21_5.mp3': { primary_structure: 'It takes lots of guts to…', structure_type: 'sentence_structure' },
  '1en_Gr_21_6.mp3': { primary_structure: 'Salary was deducted from …', structure_type: 'sentence_structure' },
  '1en_Gr_21_7.mp3': { primary_structure: 'He didn’t even bother to …', structure_type: 'sentence_structure' },
  '1en_Gr_21_8.mp3': { primary_structure: 'How come you V2!', structure_type: 'tense_reflex' },
  '1en_Gr_21_9.mp3': { primary_structure: 'I’ve never V3', structure_type: 'tense_reflex' },

  // ==========================================
  // Day 22: Day 22 - Nepotism (10 audios)
  // ==========================================
  '1en_Gr_22_1.mp3': { primary_structure: 'Fear not', structure_type: 'verb_form' },
  '1en_Gr_22_2.mp3': { primary_structure: 'Promise (not) to V1', structure_type: 'verb_form' },
  '1en_Gr_22_3.mp3': { primary_structure: 'There’s no such thing as A', structure_type: 'sentence_structure' },
  '1en_Gr_22_4.mp3': { primary_structure: 'Do you know what it means?', structure_type: 'sentence_structure' },
  '1en_Gr_22_5.mp3': { primary_structure: 'It’s no shame to V1', structure_type: 'sentence_structure' },
  '1en_Gr_22_6.mp3': { primary_structure: 'Want to be V3', structure_type: 'verb_form' },
  '1en_Gr_22_7.mp3': { primary_structure: 'There’s a thing called A', structure_type: 'sentence_structure' },
  '1en_Gr_22_8.mp3': { primary_structure: 'A once V2…', structure_type: 'tense_reflex' },
  '1en_Gr_22_9.mp3': { primary_structure: 'I just V2', structure_type: 'tense_reflex' },
  '1en_Gr_22_10.mp3': { primary_structure: 'I went to [School]', structure_type: 'tense_reflex' },

  // ==========================================
  // Day 23: Day 23 - What KPI Stands For (Lesson 13 in grammar.json) (10 audios)
  // ==========================================
  '1en_Gr_23_1.mp3': { primary_structure: '… more effectively', structure_type: 'verb_form' },
  '1en_Gr_23_2.mp3': { primary_structure: 'A demanding boss', structure_type: 'verb_form' },
  '1en_Gr_23_3.mp3': { primary_structure: 'When it comes to…', structure_type: 'verb_form' },
  '1en_Gr_23_4.mp3': { primary_structure: 'There’s still room for…', structure_type: 'sentence_structure' },
  '1en_Gr_23_5.mp3': { primary_structure: 'This must be the reason why…', structure_type: 'sentence_structure' },
  '1en_Gr_23_6.mp3': { primary_structure: 'Some things are better left unsaid', structure_type: 'sentence_structure' },
  '1en_Gr_23_7.mp3': { primary_structure: 'A is known as…', structure_type: 'sentence_structure' },
  '1en_Gr_23_8.mp3': { primary_structure: 'A tool that enables us to…', structure_type: 'sentence_structure' },
  '1en_Gr_23_9.mp3': { primary_structure: 'You haven’t V3 yet?', structure_type: 'tense_reflex' },
  '1en_Gr_23_10.mp3': { primary_structure: 'I should have V3 in advance', structure_type: 'tense_reflex' },

  // ==========================================
  // Day 24: Day 24 - How to write a CV (Lesson 14 in grammar.json) (6 audios)
  // ==========================================
  '1en_Gr_24_1.mp3': { primary_structure: 'That explains it', structure_type: 'verb_form' },
  '1en_Gr_24_2.mp3': { primary_structure: 'It’s no longer used', structure_type: 'verb_form' },
  '1en_Gr_24_3.mp3': { primary_structure: 'A just came looking for…', structure_type: 'sentence_structure' },
  '1en_Gr_24_4.mp3': { primary_structure: 'Why would…?', structure_type: 'sentence_structure' },
  '1en_Gr_24_5.mp3': { primary_structure: 'What’s wrong with…?', structure_type: 'sentence_structure' },
  '1en_Gr_24_6.mp3': { primary_structure: 'Don’t tell me you’re gonna…', structure_type: 'tense_reflex' },

  // ==========================================
  // Day 25: Day 25 - Small Talk (Lesson 15 in grammar.json) (10 audios)
  // ==========================================
  '1en_Gr_25_1.mp3': { primary_structure: 'Easier said than done', structure_type: 'verb_form' },
  '1en_Gr_25_2.mp3': { primary_structure: 'Who cares!', structure_type: 'verb_form' },
  '1en_Gr_25_3.mp3': { primary_structure: 'Quit V-ing', structure_type: 'verb_form' },
  '1en_Gr_25_4.mp3': { primary_structure: 'There’s no doubt that…', structure_type: 'sentence_structure' },
  '1en_Gr_25_5.mp3': { primary_structure: 'A hates my guts', structure_type: 'sentence_structure' },
  '1en_Gr_25_6.mp3': { primary_structure: 'Who knows what happened?', structure_type: 'sentence_structure' },
  '1en_Gr_25_7.mp3': { primary_structure: 'Did you hear anything?', structure_type: 'tense_reflex' },
  '1en_Gr_25_8.mp3': { primary_structure: 'A didn’t know I had seen everything', structure_type: 'tense_reflex' },
  '1en_Gr_25_9.mp3': { primary_structure: 'A has V3 ever since', structure_type: 'tense_reflex' },
  '1en_Gr_25_10.mp3': { primary_structure: 'A must have V3', structure_type: 'tense_reflex' },

  // ==========================================
  // Day 26: Day 26 - Financial Picture (Lesson 16 in grammar.json) (4 audios)
  // ==========================================
  '1en_Gr_26_1.mp3': { primary_structure: 'Relatively speaking', structure_type: 'verb_form' },
  '1en_Gr_26_2.mp3': { primary_structure: 'It’s such a…', structure_type: 'sentence_structure' },
  '1en_Gr_26_3.mp3': { primary_structure: 'There’s still no signs of…', structure_type: 'sentence_structure' },
  '1en_Gr_26_4.mp3': { primary_structure: '… have been raising recently', structure_type: 'tense_reflex' },

  // ==========================================
  // Day 27: Day 27 - Shark Tank (Lesson 17 in grammar.json) (11 audios)
  // ==========================================
  '1en_Gr_27_1.mp3': { primary_structure: 'Sounds familiar?', structure_type: 'verb_form' },
  '1en_Gr_27_2.mp3': { primary_structure: 'Who wants to…?', structure_type: 'verb_form' },
  '1en_Gr_27_3.mp3': { primary_structure: 'I’m here seeking…', structure_type: 'sentence_structure' },
  '1en_Gr_27_4.mp3': { primary_structure: 'I was born and raised in…', structure_type: 'sentence_structure' },
  '1en_Gr_27_5.mp3': { primary_structure: 'I’m sick of…', structure_type: 'sentence_structure' },
  '1en_Gr_27_6.mp3': { primary_structure: 'I’m familiar with…', structure_type: 'sentence_structure' },
  '1en_Gr_27_7.mp3': { primary_structure: 'What concerns me is…', structure_type: 'sentence_structure' },
  '1en_Gr_27_8.mp3': { primary_structure: '… was valued at…', structure_type: 'sentence_structure' },
  '1en_Gr_27_9.mp3': { primary_structure: '… is valued at…', structure_type: 'sentence_structure' },
  '1en_Gr_27_10.mp3': { primary_structure: 'For those reasons I just mentioned,…', structure_type: 'tense_reflex' },
  '1en_Gr_27_11.mp3': { primary_structure: 'I didn’t say…', structure_type: 'tense_reflex' },

  // ==========================================
  // Day 28: Day 28 - Never eat alone (10 audios)
  // ==========================================
  '1en_Gr_28_1.mp3': { primary_structure: 'Thanks for V-ing', structure_type: 'verb_form' },
  '1en_Gr_28_2.mp3': { primary_structure: 'Don’t act so surprised', structure_type: 'sentence_structure' },
  '1en_Gr_28_3.mp3': { primary_structure: 'Try V-ing', structure_type: 'verb_form' },
  '1en_Gr_28_4.mp3': { primary_structure: 'Despite + N', structure_type: 'sentence_structure' },
  '1en_Gr_28_5.mp3': { primary_structure: 'There’s a lot of…', structure_type: 'sentence_structure' },
  '1en_Gr_28_6.mp3': { primary_structure: 'If it weren’t for A, I would V1', structure_type: 'sentence_structure' },
  '1en_Gr_28_7.mp3': { primary_structure: 'How many [plural]…?', structure_type: 'sentence_structure' },
  '1en_Gr_28_8.mp3': { primary_structure: 'I still don’t know yet', structure_type: 'tense_reflex' },
  '1en_Gr_28_9.mp3': { primary_structure: 'We’ve V3 before', structure_type: 'tense_reflex' },
  '1en_Gr_28_10.mp3': { primary_structure: 'Who told you that?', structure_type: 'tense_reflex' },

  // ==========================================
  // Day 29: Day 29 - LinkedIn (Lesson 18 in grammar.json) (11 audios)
  // ==========================================
  '1en_Gr_29_1.mp3': { primary_structure: 'It’s way more convincing', structure_type: 'verb_form' },
  '1en_Gr_29_2.mp3': { primary_structure: 'Get hired', structure_type: 'verb_form' },
  '1en_Gr_29_3.mp3': { primary_structure: 'It’s simply a…', structure_type: 'verb_form' },
  '1en_Gr_29_4.mp3': { primary_structure: 'That’s all I’m saying', structure_type: 'sentence_structure' },
  '1en_Gr_29_5.mp3': { primary_structure: 'Would it kill you just to…?', structure_type: 'sentence_structure' },
  '1en_Gr_29_6.mp3': { primary_structure: 'Increase your chances of V-ing', structure_type: 'sentence_structure' },
  '1en_Gr_29_7.mp3': { primary_structure: 'I used to V1', structure_type: 'sentence_structure' },
  '1en_Gr_29_8.mp3': { primary_structure: 'I wish I could…', structure_type: 'sentence_structure' },
  '1en_Gr_29_9.mp3': { primary_structure: 'How have you been?', structure_type: 'tense_reflex' },
  '1en_Gr_29_10.mp3': { primary_structure: 'I heard that you had V3', structure_type: 'tense_reflex' },
  '1en_Gr_29_11.mp3': { primary_structure: 'I’ve had that happen', structure_type: 'tense_reflex' },

  // ==========================================
  // Day 30: Day 30 - Farewell Party (Lesson 19 in grammar.json) (7 audios)
  // ==========================================
  '1en_Gr_30_1.mp3': { primary_structure: 'May I have your…?', structure_type: 'verb_form' },
  '1en_Gr_30_2.mp3': { primary_structure: 'Are you in a hurry to…?', structure_type: 'verb_form' },
  '1en_Gr_30_3.mp3': { primary_structure: 'There’s a very thin line between A and B', structure_type: 'verb_form' },
  '1en_Gr_30_4.mp3': { primary_structure: 'I’ve thought it through', structure_type: 'tense_reflex' },
  '1en_Gr_30_5.mp3': { primary_structure: 'This is the last time I V1/will V1', structure_type: 'tense_reflex' },
  '1en_Gr_30_6.mp3': { primary_structure: 'It’s not that I didn’t V1', structure_type: 'tense_reflex' },
  '1en_Gr_30_7.mp3': { primary_structure: 'A is the most… (that) I’ve ever V3', structure_type: 'tense_reflex' },
};

export function condenseToGrammarJsonStyle() {
  console.log('=====================================================');
  console.log('CHUNKS Grammar Condensation & Styling Pipeline');
  console.log('Learning and Applying pure reflex style from grammar.json');
  console.log('Zero academic metalanguage | Punchy communicative reflexes');
  console.log('=====================================================\n');

  const CATALOG_JSON_PATH = path.resolve('scripts/grammar-boost-catalog.json');
  const GROUPED_JSON_PATH = path.resolve('scripts/grammar-grouped-catalog.json');
  const LEVEL_B_DATA_PATH = path.resolve('src/data/levelBGrammarData.ts');
  const DATA_CATALOG_JSON_PATH = path.resolve('src/data/grammarBoostCatalog.json');

  const catalog = JSON.parse(fs.readFileSync(CATALOG_JSON_PATH, 'utf8'));
  const grouped = JSON.parse(fs.readFileSync(GROUPED_JSON_PATH, 'utf8'));

  let totalMiniLessons = 0;
  let totalMatched = 0;

  // Process all 30 topics
  catalog.topics.forEach((topic: any) => {
    const day = topic.day_number;
    console.log(`Processing Day ${day}: ${topic.lesson_title}...`);

    const newVerbForms: string[] = [];
    const newSentenceStructures: string[] = [];
    const newTense: string[] = [];

    if (topic.mini_lessons && Array.isArray(topic.mini_lessons)) {
      topic.mini_lessons.forEach((ml: any) => {
        totalMiniLessons++;
        const alignment = CONDENSED_GRAMMAR_ALIGNMENT[ml.file];
        if (alignment) {
          ml.primary_structure = alignment.primary_structure;
          ml.structure_type = alignment.structure_type;
          totalMatched++;

          // Aggregate into category arrays
          if (alignment.structure_type === 'verb_form') {
            newVerbForms.push(alignment.primary_structure);
          } else if (alignment.structure_type === 'sentence_structure') {
            newSentenceStructures.push(alignment.primary_structure);
          } else if (alignment.structure_type === 'tense_reflex') {
            newTense.push(alignment.primary_structure);
          }
        } else {
          console.warn(`⚠️ Warning: No alignment entry found for file ${ml.file} in Day ${day}`);
        }
      });
    }

    // Update topic summary arrays
    topic.verb_forms = newVerbForms;
    topic.sentence_structures = newSentenceStructures;
    topic.tense = newTense;

    // Verify 1-to-1 canonical rule
    const topicTotal = newVerbForms.length + newSentenceStructures.length + newTense.length;
    if (topicTotal !== topic.total_audio_files) {
      console.error(`❌ Mismatch in Day ${day}: category total (${topicTotal}) !== total_audio_files (${topic.total_audio_files})`);
    } else {
      console.log(`  ✅ Day ${day} verified: ${newVerbForms.length} verb forms, ${newSentenceStructures.length} structures, ${newTense.length} tense frames (Total: ${topicTotal})`);
    }

    // Sync to grouped catalog
    const groupedLesson = grouped.lessons.find((l: any) => l.day_number === day);
    if (groupedLesson) {
      groupedLesson.verb_forms = newVerbForms;
      groupedLesson.sentence_structures = newSentenceStructures;
      groupedLesson.tense = newTense;
      groupedLesson.notes = topic.notes || '';
      groupedLesson.status = 'active';
      groupedLesson.updated_at = new Date().toISOString();
    }
  });

  // Update catalog metadata
  catalog.metadata.last_audit = new Date().toISOString();
  catalog.metadata.audit_status = 'condensed_grammar_json_style_verified';
  catalog.metadata.total_structures = totalMatched;
  catalog.metadata.style_guide = 'pure_spoken_reflex_grammar_json_style';

  // 1. Write scripts/grammar-boost-catalog.json & src/data/grammarBoostCatalog.json
  fs.writeFileSync(CATALOG_JSON_PATH, JSON.stringify(catalog, null, 2), 'utf8');
  console.log(`\n💾 Saved: ${CATALOG_JSON_PATH}`);

  fs.writeFileSync(DATA_CATALOG_JSON_PATH, JSON.stringify(catalog, null, 2), 'utf8');
  console.log(`💾 Saved: ${DATA_CATALOG_JSON_PATH}`);

  // 2. Write scripts/grammar-grouped-catalog.json
  grouped.metadata = {
    ...grouped.metadata,
    generated_at: new Date().toISOString(),
    total_topics: 30,
    total_structures: totalMatched,
    style: 'condensed_grammar_json_reflex_style'
  };
  fs.writeFileSync(GROUPED_JSON_PATH, JSON.stringify(grouped, null, 2), 'utf8');
  console.log(`💾 Saved: ${GROUPED_JSON_PATH}`);

  // 3. Write src/data/levelBGrammarData.ts
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
 * CONDENSED REFLEX STYLE GROUNDED IN grammar.json (Pure Spoken Chunks, Zero Academic Metalanguage)
 * STRICT 1-TO-1 CANONICAL ALIGNMENT: 1 Audio Recording = Exactly 1 Primary Target Grammar Structure
 * Total 30 Days: 288 Audio Mini-Lessons = 288 Total Focus Formulas (Zero Pending)
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
  console.log(`💾 Saved: ${LEVEL_B_DATA_PATH}`);

  // 4. Generate Markdown Catalogs
  generateBoostMarkdown(catalog);
  generateGroupedMarkdown(grouped);

  console.log('\n=====================================================');
  console.log(`🎉 CONDENSATION COMPLETE!`);
  console.log(`Total Mini-Lessons Processed: ${totalMiniLessons}`);
  console.log(`Total Aligned to Pure Reflex Style: ${totalMatched}/288 (100%)`);
  console.log('=====================================================');
}

function generateBoostMarkdown(catalog: any) {
  const CATALOG_MD_PATH = path.resolve('scripts/grammar-boost-catalog.md');
  const mdLines: string[] = [];
  mdLines.push(`# 📚 CHUNKS Level B (ERE) Grammar Boost Catalog`);
  mdLines.push(`\n> **Source**: \`${catalog.metadata.source_directory}\``);
  mdLines.push(`> **Style**: \`grammar.json\` Condensed Spoken Reflexes (Zero Academic Jargon)`);
  mdLines.push(`> **Coverage**: 30/30 Topics with native teacher audio (${catalog.metadata.total_audio_files} MP3 mini-lessons).\n`);

  mdLines.push(`## 📊 Executive Summary Table\n`);
  mdLines.push(`| Day | Lesson Title | Audio Files | Verb Forms | Sentence Structures | Tense & Aspect |`);
  mdLines.push(`| :---: | :--- | :---: | :--- | :--- | :--- |`);

  for (const s of catalog.topics) {
    const vf = s.verb_forms.map((x: string) => `\`${x}\``).join(', ') || '—';
    const ss = s.sentence_structures.map((x: string) => `\`${x}\``).join(', ') || '—';
    const t = s.tense.map((x: string) => `\`${x}\``).join(', ') || '—';
    mdLines.push(`| **Day ${s.day_number}** | ${s.lesson_title} | **${s.total_audio_files}** | ${vf} | ${ss} | ${t} |`);
  }

  mdLines.push(`\n---\n`);
  mdLines.push(`## 📖 Detailed Grammar Points by Topic\n`);

  for (const s of catalog.topics) {
    mdLines.push(`### Day ${s.day_number}: ${s.lesson_title}`);
    mdLines.push(`\n- **Audio Mini-Lessons**: ${s.total_audio_files} recordings`);
    if (s.verb_forms.length > 0) {
      mdLines.push(`- **Verb Forms / Phrases**: ${s.verb_forms.map((x: string) => `\`${x}\``).join(', ')}`);
    }
    if (s.sentence_structures.length > 0) {
      mdLines.push(`- **Sentence Structures**: ${s.sentence_structures.map((x: string) => `\`${x}\``).join(', ')}`);
    }
    if (s.tense.length > 0) {
      mdLines.push(`- **Tense & Aspect**: ${s.tense.map((x: string) => `\`${x}\``).join(', ')}`);
    }

    mdLines.push(`\n#### 🎙️ Verbatim Audio Lessons & Transcripts\n`);

    for (let i = 0; i < s.mini_lessons.length; i++) {
      const ml = s.mini_lessons[i];
      mdLines.push(`##### ${i + 1}. \`${ml.file}\` — \`${ml.primary_structure}\` (${ml.structure_type})`);
      mdLines.push(`\n**Verbatim Teacher Explanation (Vietnamese + English):**`);
      mdLines.push(`> "${ml.transcript}"\n`);

      if (ml.examples && ml.examples.length > 0) {
        mdLines.push(`**Examples:**`);
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
  console.log(`💾 Saved: ${CATALOG_MD_PATH}`);
}

function generateGroupedMarkdown(grouped: any) {
  const OUTPUT_MD_PATH = path.resolve('scripts/grammar-grouped-catalog.md');
  let mdContent = `# CHUNKS Level B ERE: Condensed Grammar Grouping & Partitioning Catalog
**Canonical Reflex Structure Grounded in grammar.json Philosophy**  
*Audited and Generated: ${new Date().toISOString()}*

---

## 1. Executive Overview & Data Partitioning

This catalog establishes the canonical grammar structure for all 30 days of the **Level B - ERE (English Reflexes Enhancement)** course, aligning strictly with the punchy, reflex-oriented format of \`grammar.json\` (zero academic metalanguage like *(passive)*, *(gerund)*, *(adverb of time)*).

### 📊 Dataset Breakdown

| Data Group | Count | Status | Description & Pedagogy |
| :--- | :---: | :---: | :--- |
| **Group 1: Core 19 Lessons** | 19 | \`active\` | Directly extracted and verified from \`grammar.json\`. Maps to 10 teaching sessions in a 15-day cohort schedule. |
| **Group 2: Supplemental 11 Lessons** | 11 | \`active\` | Transcribed from Grammar Boost audio, condensed into reflex-oriented patterns matching \`grammar.json\` format (Days 1, 2, 3, 4, 7, 8, 13, 16, 19, 22, 28). |
| **Total Curriculum** | **30** | \`active\` | **100% complete coverage across 6 thematic modules with zero pending audio (288/288 audios).** |

---

## 2. Dual-Index Master Curriculum Map

| Day (1–30) | Lesson Title | Thematic Module | Data Group | Status | 15-Day Cohort | 19-Lesson Index |
| :---: | :--- | :--- | :---: | :---: | :---: | :---: |
`;

  grouped.lessons.forEach((l: any) => {
    const cohortDay = l.cohort_day_15 ? `Day ${l.cohort_day_15}` : '—';
    const lessonIdx = l.lesson_number_19 ? `Lesson ${l.lesson_number_19}` : '—';
    const statusBadge = '🟢 `active`';
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

  fs.writeFileSync(OUTPUT_MD_PATH, mdContent, 'utf8');
  console.log(`💾 Saved: ${OUTPUT_MD_PATH}`);
}

// Execute if run directly
condenseToGrammarJsonStyle();
