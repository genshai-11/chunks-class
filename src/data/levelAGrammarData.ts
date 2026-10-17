import { LessonGrammarDoc } from '../types';

/**
 * Level A - Foundation (10 Lessons + Grammar Session + Free Talks) Canonical Grammar Catalog
 * Grounded 100% in "Level A - Grammar - Chunker.pdf"
 * ENGLISH-ONLY DISPLAY (Vietnamese translation column omitted as required)
 */
export const LEVEL_A_GRAMMAR_CATALOG: LessonGrammarDoc[] = [
  {
    id: "grammar_level_a_day_1",
    lesson_id: "level_a_day_1",
    course_id: "course_level_a",
    day_number: 1,
    lesson_title: "Day 1 - Lesson 0 Orientation",
    grammar_points: [
      {
        title: "1. NOUN PHRASE (Adj + N)*",
        items: [
          "Black coffee",
          "Big fly",
          "My black coffee",
          "Your big fly"
        ],
        notes: "Modifiers (adjectives, possessives) strictly precede the head noun in English."
      },
      {
        title: "2. WH 1st",
        items: [
          "What you want?",
          "What you want to drink?",
          "Why you usually drink coffee?",
          "Actually, where you usually drink?"
        ],
        notes: "Place the question word at the very front of the spoken reflex sentence."
      },
      {
        title: "3. V2V (Verb to Verb)",
        items: [
          "Like to drink",
          "Like to sit",
          "Want to think",
          "Want to drink"
        ],
        notes: "Connecting two action verbs using the infinitive marker 'to'."
      }
    ],
    verb_forms: [
      "Like to drink",
      "Like to sit",
      "Want to think",
      "Want to drink"
    ],
    sentence_structures: [
      "Black coffee",
      "Big fly",
      "My black coffee",
      "Your big fly"
    ],
    tense: [
      "What you want?",
      "What you want to drink?",
      "Why you usually drink coffee?",
      "Actually, where you usually drink?"
    ],
    notes: "- **Noun Phrase (Adj + N)\\***: Modifiers (adjectives, possessives) strictly precede the head noun in English.\n  *Examples*: Black coffee, Big fly, My black coffee, Your big fly.\n- **WH 1st (Wh-question words placed first)**: Place the question word at the very front of the spoken reflex sentence.\n  *Examples*: What you want?, What you want to drink?, Why you usually drink coffee?, Actually, where you usually drink?\n- **V2V (Verb to Verb linking)**: Connecting two action verbs using the infinitive marker 'to'.\n  *Examples*: Like to drink, Like to sit, Want to think, Want to drink."
  },
  {
    id: "grammar_level_a_day_2",
    lesson_id: "level_a_day_2",
    course_id: "course_level_a",
    day_number: 2,
    lesson_title: "Day 2 - Lesson 1 How to survive",
    grammar_points: [
      {
        title: "1. BE (am / is / are)",
        items: [
          "I am coffee",
          "That is black coffee",
          "That coffee is black",
          "Tomorrow, I will be black coffee"
        ],
        notes: "Used for identity, classification, and states."
      },
      {
        title: "2. Negation (BE vs Action Verbs)",
        items: [
          "My coffee is not black",
          "I don't like coffee",
          "I am not black",
          "I don't drink black coffee"
        ],
        notes: "Contrast 'BE + not' with auxiliary 'don't / doesn't + V1'."
      },
      {
        title: "3. To... (Purpose)",
        items: [
          "I have to sit to think",
          "To think, I will have to drink coffee"
        ],
        notes: "Infinitive of purpose: expressing reason or goal of an action."
      }
    ],
    verb_forms: [
      "My coffee is not black",
      "I don't like coffee",
      "I am not black",
      "I don't drink black coffee"
    ],
    sentence_structures: [
      "I am coffee",
      "That is black coffee",
      "That coffee is black",
      "Tomorrow, I will be black coffee"
    ],
    tense: [
      "I have to sit to think",
      "To think, I will have to drink coffee"
    ],
    notes: "- **BE (am / is / are)**: Used for identity, classification, and states.\n  *Examples*: I am coffee, That is black coffee, That coffee is black, Tomorrow, I will be black coffee.\n- **Negation Contrast: BE vs Action Verbs**: Use 'BE + not' with to be (My coffee is not black, I am not black), but use auxiliary 'don't / doesn't + V1' with normal verbs (I don't like coffee, I don't drink black coffee).\n- **To... (Infinitive of Purpose)**: Use 'to + base verb' to express the reason or goal of an action.\n  *Examples*: I have to sit to think, To think, I will have to drink coffee."
  },
  {
    id: "grammar_level_a_day_3",
    lesson_id: "level_a_day_3",
    course_id: "course_level_a",
    day_number: 3,
    lesson_title: "Day 3 - Lesson 2 What you'd like to do?",
    grammar_points: [
      {
        title: "1. There is (no) / there are (no)",
        items: [
          "I have a cup",
          "I don't have 3 cups",
          "There is a cup",
          "There is no cup",
          "There are 3 cups",
          "There are no cups"
        ],
        notes: "Expressing existence or non-existence of items vs personal possession."
      },
      {
        title: "2. MODAL VERBS (CAN / SHOULD / WILL)",
        items: [
          "I can drink coffee",
          "I cannot drink coffee",
          "Can I drink coffee?"
        ],
        notes: "Modal verbs express ability, recommendation, or future certainty + bare verb."
      }
    ],
    verb_forms: [
      "I can drink coffee",
      "I cannot drink coffee",
      "Can I drink coffee?"
    ],
    sentence_structures: [
      "There is a cup",
      "There is no cup",
      "There are 3 cups",
      "There are no cups"
    ],
    tense: [
      "I have a cup",
      "I don't have 3 cups",
      "Modal auxiliary: Can / Should / Will"
    ],
    notes: "- **There is (no) / There are (no)**: Expressing the existence or non-existence of items. Contrast with personal possession 'I have / I don't have'.\n  *Examples*: There is a cup, There is no cup, There are 3 cups, There are no cups (vs. I have a cup, I don't have 3 cups).\n- **Modal Verbs (CAN / SHOULD / WILL)**: Modal verbs express ability, recommendation, or future certainty, followed directly by base verb V1 without 'to'.\n  *Examples*: I can drink coffee, I cannot drink coffee, Can I drink coffee?"
  },
  {
    id: "grammar_level_a_day_4",
    lesson_id: "level_a_day_4",
    course_id: "course_level_a",
    day_number: 4,
    lesson_title: "Day 4 - Lesson 3 I'm a hitchhiker",
    grammar_points: [
      {
        title: "1. Pronoun circle",
        items: [
          "I like you",
          "You like him",
          "He likes her",
          "She likes us",
          "We like them",
          "They like me"
        ],
        notes: "Master reciprocal subject-object pronoun pairs."
      },
      {
        title: "2. Possession circle",
        items: [
          "My cup / your cup / his cup / her cup / our cup / their cup",
          "Peter's cup / My fly's cup",
          "That is my cup",
          "That cup is mine",
          "Your & yours / his & his / her & hers / our & ours / their & theirs"
        ],
        notes: "Possessive adjectives precede nouns; possessive pronouns stand alone."
      },
      {
        title: "3. WH + to...? (No subject!)",
        items: [
          "What to drink now?",
          "What to think now?",
          "Who to like now?",
          "Where to sit now?",
          "I don't know what to drink now",
          "I know where to sit"
        ],
        notes: "Compact questions for quick spoken decision-making."
      }
    ],
    verb_forms: [
      "What to drink now?",
      "What to think now?",
      "Where to sit now?",
      "I don't know what to drink now"
    ],
    sentence_structures: [
      "I like you / you like him / he likes her",
      "That is my cup -> That cup is mine"
    ],
    tense: [
      "My cup / your cup / his cup / Peter's cup",
      "I know where to sit"
    ],
    notes: "- **Pronoun Circle**: Master reciprocal subject-object pronoun pairs.\n  *Examples*: I like you / you like him / he likes her / she likes us / we like them / they like me.\n- **Possession Circle & Pronoun Shift**: Possessive adjectives precede nouns (My cup / your cup / his cup / her cup / our cup / their cup / Peter's cup / My fly's cup). When the noun is fronted, use possessive pronouns: 'That is my cup' shifts to 'That cup is mine' (your & yours / his & his / her & hers / our & ours / their & theirs).\n- **WH + to V1 (No Subject Spoken Reflex)**: Compact questions for quick decision-making.\n  *Examples*: What to drink now?, What to think now?, Who to like now?, Where to sit now?, I don't know what to drink now, I know where to sit."
  },
  {
    id: "grammar_level_a_day_5",
    lesson_id: "level_a_day_5",
    course_id: "course_level_a",
    day_number: 5,
    lesson_title: "Day 5 - Lesson 4 Food and everything",
    grammar_points: [
      {
        title: "1. Verb form (ING / Let)",
        items: [
          "Stop drinking coffee",
          "Keep drinking coffee",
          "I don't mind drinking coffee",
          "I don't let Peter drink coffee"
        ],
        notes: "Gerunds after Stop/Keep/Mind; bare infinitive after causative Let."
      }
    ],
    verb_forms: [
      "Stop drinking coffee",
      "Keep drinking coffee",
      "I don't mind drinking coffee"
    ],
    sentence_structures: [
      "I don't let Peter drink coffee"
    ],
    tense: [
      "Stop / Keep + V-ing",
      "Let + Object + V1 (bare infinitive)"
    ],
    notes: "- **Verbs followed by Gerund (-ing form)**: 'Stop', 'Keep', and 'Mind' trigger gerunds rather than infinitives.\n  *Examples*: Stop drinking coffee, Keep drinking coffee, I don't mind drinking coffee.\n- **Causative / Permission with 'Let'**: 'Let' is followed by an object and a bare infinitive (V1 without 'to').\n  *Example*: I don't let Peter drink coffee."
  },
  {
    id: "grammar_level_a_day_6",
    lesson_id: "level_a_day_6",
    course_id: "course_level_a",
    day_number: 6,
    lesson_title: "Day 6 - Free Talk 1 (Lesson 1-2-3-4)",
    grammar_points: [
      {
        title: "1. Review Lessons 1 & 2 (Noun phrase, WH 1st, V2V, BE)",
        items: [
          "Black coffee",
          "Big fly",
          "My black coffee",
          "Your big fly",
          "What you want?",
          "What you want to drink?",
          "Like to drink",
          "Like to sit",
          "I am coffee",
          "That is black coffee",
          "Tomorrow, I will be black coffee",
          "My coffee is not black",
          "I don't like coffee"
        ],
        notes: "Consolidated patterns from Day 1 & Day 2."
      },
      {
        title: "2. Review Lessons 2 & 3 (Purpose, There is/are, Modals)",
        items: [
          "I have to sit to think",
          "To think, I will have to drink coffee",
          "I have a cup",
          "I don't have 3 cups",
          "There is a cup",
          "There is no cup",
          "There are 3 cups",
          "There are no cups",
          "I can drink coffee",
          "I cannot drink coffee",
          "Can I drink coffee?"
        ],
        notes: "Consolidated patterns from Day 2 & Day 3."
      },
      {
        title: "3. Review Lessons 3 & 4 (Pronouns, Possession, WH+to, Verb forms)",
        items: [
          "I like you / you like him / he likes her / she likes us",
          "My cup / your cup / his cup / Peter's cup",
          "That is my cup / That cup is mine",
          "What to drink now?",
          "Where to sit now?",
          "I don't know what to drink now",
          "Stop drinking coffee",
          "Keep drinking coffee",
          "I don't mind drinking coffee",
          "I don't let Peter drink coffee"
        ],
        notes: "Consolidated patterns from Day 4 & Day 5."
      }
    ],
    verb_forms: [
      "Like to drink",
      "Stop drinking coffee",
      "Keep drinking coffee",
      "I don't let Peter drink coffee"
    ],
    sentence_structures: [
      "Black coffee",
      "What you want to drink?",
      "That is black coffee",
      "That is my cup -> That cup is mine"
    ],
    tense: [
      "I have to sit to think",
      "There is a cup",
      "I can drink coffee",
      "Tomorrow, I will be black coffee"
    ],
    notes: "- **Consolidated Review: Lessons 1 to 4**:\n  1. **Noun Phrases**: Black coffee, Big fly, My black coffee, Your big fly.\n  2. **WH 1st**: What you want?, What you want to drink?, Why you usually drink coffee?, Actually, where you usually drink?\n  3. **V2V**: Like to drink, Like to sit, Want to think, Want to drink.\n  4. **BE vs Action verbs**: I am coffee, That coffee is black, Tomorrow I will be black coffee vs My coffee is not black, I don't drink black coffee.\n  5. **Purpose To...**: I have to sit to think, To think I will have to drink coffee.\n  6. **There is / are**: There is a cup, There is no cup, There are 3 cups, There are no cups.\n  7. **Modals**: I can drink coffee, I cannot drink coffee, Can I drink coffee?\n  8. **Pronoun circles & Possession**: That is my cup vs That cup is mine.\n  9. **WH + to**: What to drink now?, Where to sit now?.\n  10. **Verb forms**: Stop drinking coffee, Keep drinking coffee, I don't let Peter drink coffee."
  },
  {
    id: "grammar_level_a_day_7",
    lesson_id: "level_a_day_7",
    course_id: "course_level_a",
    day_number: 7,
    lesson_title: "Day 7 - Lesson 5 Physical things",
    grammar_points: [
      {
        title: "1. BE + (Not) + ADJ",
        items: [
          "Peter is black",
          "This cup is very big",
          "My table is not plastic",
          "It's very amazing to drink coffee"
        ],
        notes: "Connect subjects to physical attributes using 'to be' without redundant verbs."
      }
    ],
    verb_forms: [
      "It's very amazing to drink coffee"
    ],
    sentence_structures: [
      "Peter is black",
      "This cup is very big",
      "My table is not plastic"
    ],
    tense: [
      "Present Simple state with BE + (Not) + ADJ"
    ],
    notes: "- **Describing Physical Things with BE + ADJ**: Connect subjects to physical attributes using 'to be' without redundant verbs.\n  *Examples*: Peter is black, This cup is very big, My table is not plastic.\n- **Evaluative 'It's + ADJ + to V1' Pattern**: Standard English spoken pattern to evaluate actions.\n  *Example*: It's very amazing to drink coffee."
  },
  {
    id: "grammar_level_a_day_8",
    lesson_id: "level_a_day_8",
    course_id: "course_level_a",
    day_number: 8,
    lesson_title: "Day 8 - Day 8 Grammar session 4 BIG PROBLEMS",
    grammar_points: [
      {
        title: "1. Problem 1 & 2: Small & Medium Structures (1D & 2D)",
        items: [
          "1D Fundamental verbs (V1 - V2 - V3): give/gave/given, drink/drank/drunk, sit/sat/sat",
          "2D Noun phrase: My black table, That black table",
          "2D Purpose & Existence: I have to sit to think, There is a cup",
          "2D Verb forms: Like to drink (V2V), Stop drinking coffee (V-ing), I don't let Peter drink coffee"
        ],
        notes: "138 Fundamental verbs and collocations with other word types."
      },
      {
        title: "2. Problem 3: 3 Big Structures (+ / - / ?) (3D)",
        items: [
          "BE (+/-/?) : I am a table, I am not a table, Am I a table?, Who am I?",
          "Normal Verbs (+/-/?) : I sit on a table, I do not sit on a table, Do I sit on a table?",
          "WH-Subject: What makes you think?, Who makes you think?",
          "Passive Voice (Reverse Subject): Coffee is drunk (by me), That table is sat on (by me)"
        ],
        notes: "12 cases across normal, interrogative, reverse, and subjectless sentences."
      },
      {
        title: "3. Problem 4: Verb in 4D - Twisted Structures (TENSE)",
        items: [
          "Yesterday (Past): Peter was a table, Peter sat on a table, Peter did not sit on a table",
          "Today (Present): Peter is a table, Peter sits on a table, Peter does not sit on a table",
          "Tomorrow (Future): Peter will be a table, Peter will sit on a table, Peter will not sit on a table",
          "Now (Continuous): Peter is being a table, Peter is sitting on a table, Peter is not sitting on a table"
        ],
        notes: "4 key tenses: Past, Present, Future, Continuous."
      }
    ],
    verb_forms: [
      "V1 - V2 - V3 Fundamental Verbs",
      "Like to drink (V2V)",
      "Stop drinking coffee (V-ing)",
      "I don't let Peter drink coffee (Causative)"
    ],
    sentence_structures: [
      "BE: I am a table / I am not a table / Am I a table?",
      "Normal: I sit on a table / I do not sit on a table / Do I sit on a table?",
      "WH-Subject: What makes you think? / Who makes you think?"
    ],
    tense: [
      "Yesterday: Peter sat on a table",
      "Today: Peter sits on a table",
      "Tomorrow: Peter will sit on a table",
      "Now: Peter is sitting on a table"
    ],
    notes: "- **The 4 Linguistic Problems ('All the troubles come from verbs')**:\n  - **PROBLEM 1: Verb in 1D (Single Verbs)**: 138 core irregular and regular verbs across V1 (Base), V2 (Past), and V3 (Past Participle).\n  - **PROBLEM 2: Verb in 2D (Verbs and Other Word Types)**:\n    * Noun phrase dilemma: My black table, That black table.\n    * Subject-Verb agreement: 20 black tables, The table is black vs 20 tables are black; The fly drinks coffee vs 20 flies drink coffee.\n    * Verb collocations: V2V (Like to drink, Want to think), Gerund (Stop drinking, Keep drinking), Causative (Let Peter drink).\n  - **PROBLEM 3: Verb in 3D (Verbs and Subjects - 3 Big Structures)**:\n    * BE: I am a table / I am not a table / Am I a table? / Who am I? / Why is Peter a table?\n    * Normal Verbs: I sit on a table / I do not sit on a table / Do I sit on a table? / Where does that fly sit?\n    * WH-subject: What makes you think?, Who makes you think?.\n    * Passive voice: Coffee is drunk (by me), That table is sat on (by me).\n    * No subject: Who to drink with?, What to think?, Where to put?, How to sit?.\n  - **PROBLEM 4: Verb in 4D (Verbs and Time - Tenses)**:\n    * Yesterday: Peter was / sat / was not / did not sit.\n    * Today: Peter is / sits / is not / does not sit.\n    * Tomorrow: Peter will be / sit / will not be / will not sit.\n    * Now: Peter is being / sitting / is not being / is not sitting."
  },
  {
    id: "grammar_level_a_day_9",
    lesson_id: "level_a_day_9",
    course_id: "course_level_a",
    day_number: 9,
    lesson_title: "Day 9 - Lesson 6 Interviews matter",
    grammar_points: [
      {
        title: "1. Make / Let (Bắt / Để cho)",
        items: [
          "I let Peter drink coffee",
          "I don't let Peter think",
          "I make the fly drink coffee",
          "I make the fly sit"
        ],
        notes: "Both patterns take an object pronoun followed by a base form (V1 without 'to')."
      }
    ],
    verb_forms: [
      "I make the fly drink coffee",
      "I make the fly sit"
    ],
    sentence_structures: [
      "I let Peter drink coffee",
      "I don't let Peter think"
    ],
    tense: [
      "Present Simple causative reflexes (Make / Let)"
    ],
    notes: "- **Causative Verbs 'Make' and 'Let'**: Both patterns take an object pronoun followed by a base form (V1 without 'to').\n- **'Let' (Permission / Allowance)**:\n  *Examples*: I let Peter drink coffee, I don't let Peter think.\n- **'Make' (Compulsion / Obligation)**:\n  *Examples*: I make the fly drink coffee, I make the fly sit."
  },
  {
    id: "grammar_level_a_day_10",
    lesson_id: "level_a_day_10",
    course_id: "course_level_a",
    day_number: 10,
    lesson_title: "Day 10 - Lesson 7 Diseases",
    grammar_points: [
      {
        title: "1. Review adverb usage (Trạng từ)",
        items: [
          "Peter is (really) active",
          "Peter sits (really) actively",
          "Peter is black",
          "Peter is black actively",
          "Actively, Peter sits"
        ],
        notes: "Adjectives modify nouns/BE; adverbs modify action verbs (-ly) or fronted for emphasis."
      }
    ],
    verb_forms: [
      "Peter is black actively",
      "Actively, Peter sits"
    ],
    sentence_structures: [
      "Peter is (really) active",
      "Peter sits (really) actively"
    ],
    tense: [
      "Adjective to Adverb conversion (-ly) collocations"
    ],
    notes: "- **Adjective vs Adverb Usage**:\n  - Adjectives modify nouns or follow linking verbs (like BE):\n    *Example*: Peter is (really) active; Peter is black.\n  - Adverbs modify action verbs, describing how an action is performed (typically formed with suffix '-ly'):\n    *Example*: Peter sits (really) actively; Peter is black actively.\n- **Fronted Adverbs for Emphasis**:\n  *Example*: Actively, Peter sits."
  },
  {
    id: "grammar_level_a_day_11",
    lesson_id: "level_a_day_11",
    course_id: "course_level_a",
    day_number: 11,
    lesson_title: "Day 11 - Lesson 8 Human description",
    grammar_points: [
      {
        title: "1. Look / seem + ADJ",
        items: [
          "Your coffee looks very amazing",
          "Your cup seems big"
        ],
        notes: "Linking verbs of appearance followed directly by adjectives."
      },
      {
        title: "2. Review TENSE (Past / Present / Future / Continuous)",
        items: [
          "Yesterday, Peter drank black coffee",
          "Yesterday, I had to think",
          "Peter drinks black coffee",
          "I have to think",
          "Peter will drink black coffee",
          "Tomorrow, I will have to think",
          "Peter is drinking black coffee",
          "I'm having to think"
        ],
        notes: "Tense transformations across 4 timelines."
      }
    ],
    verb_forms: [
      "Yesterday, Peter drank black coffee",
      "Peter drinks black coffee",
      "Peter will drink black coffee"
    ],
    sentence_structures: [
      "Your coffee looks very amazing",
      "Your cup seems big"
    ],
    tense: [
      "Yesterday: drank, had to",
      "Today: drinks, have to",
      "Tomorrow: will drink, will have to",
      "Now: is drinking, having to"
    ],
    notes: "- **Linking Verbs of Appearance (Look / Seem + ADJ)**: Followed directly by adjectives (not adverbs) to describe appearance or impression.\n  *Examples*: Your coffee looks very amazing, Your cup seems big.\n- **Tense Transformation across 4 Timelines**:\n  - **Past Simple (Yesterday)**: Yesterday, Peter drank black coffee / Yesterday, I had to think.\n  - **Present Simple (Today)**: Peter drinks black coffee / I have to think.\n  - **Future Simple (Tomorrow)**: Peter will drink black coffee / Tomorrow, I will have to think.\n  - **Present Continuous (Now)**: Peter is drinking black coffee / I'm having to think."
  },
  {
    id: "grammar_level_a_day_12",
    lesson_id: "level_a_day_12",
    course_id: "course_level_a",
    day_number: 12,
    lesson_title: "Day 12 - Free Talk 2 (Lesson 5-6-7-8)",
    grammar_points: [
      {
        title: "1. Review Lessons 5 & 6 (BE + ADJ & Make / Let)",
        items: [
          "Peter is black",
          "This cup is very big",
          "My table is not plastic",
          "It's very amazing to drink coffee",
          "I let Peter drink coffee",
          "I don't let Peter think",
          "I make the fly drink coffee",
          "I make the fly sit"
        ],
        notes: "Consolidated patterns from Day 7 & Day 9."
      },
      {
        title: "2. Review Lessons 7 & 8 (Adverbs & Look/Seem)",
        items: [
          "Peter is (really) active",
          "Peter sits (really) actively",
          "Peter is black actively",
          "Actively, Peter sits",
          "Your coffee looks very amazing",
          "Your cup seems big"
        ],
        notes: "Consolidated patterns from Day 10 & Day 11."
      },
      {
        title: "3. Review TENSE (Past / Present / Future / Continuous)",
        items: [
          "Yesterday, Peter drank black coffee",
          "Yesterday, I had to think",
          "Peter drinks black coffee",
          "I have to think",
          "Peter will drink black coffee",
          "Tomorrow, I will have to think",
          "Peter is drinking black coffee",
          "I'm having to think"
        ],
        notes: "Consolidated tense reflex transformations."
      }
    ],
    verb_forms: [
      "I let Peter drink coffee",
      "I make the fly drink coffee",
      "Peter sits actively",
      "Your cup seems big"
    ],
    sentence_structures: [
      "Peter is black",
      "This cup is very big",
      "It's very amazing to drink coffee",
      "Your coffee looks very amazing"
    ],
    tense: [
      "Yesterday: Peter drank black coffee",
      "Today: Peter drinks black coffee",
      "Tomorrow: Peter will drink black coffee",
      "Now: Peter is drinking black coffee"
    ],
    notes: "- **Consolidated Review: Lessons 5 to 8**:\n  5. **BE + (Not) + ADJ**: Peter is black, This cup is very big, My table is not plastic, It's very amazing to drink coffee.\n  6. **Make / Let**: I let Peter drink coffee, I don't let Peter think, I make the fly drink coffee, I make the fly sit.\n  7. **Adverb Usage**: Peter is really active, Peter sits really actively, Peter is black actively, Actively, Peter sits.\n  8. **Look / Seem + ADJ**: Your coffee looks very amazing, Your cup seems big.\n  9. **Tense Review across 4 timelines**: Yesterday Peter drank / had to think; Peter drinks / has to think; Tomorrow Peter will drink / will have to think; Peter is drinking / having to think."
  },
  {
    id: "grammar_level_a_day_13",
    lesson_id: "level_a_day_13",
    course_id: "course_level_a",
    day_number: 13,
    lesson_title: "Day 13 - Lesson 9 Society",
    grammar_points: [
      {
        title: "1. Conjunctions (Liên từ)",
        items: [
          "Actually, I like black coffee",
          "However, I don't like black fly"
        ],
        notes: "Transition words connecting spoken ideas."
      },
      {
        title: "2. Relative clause (THAT / who / which)",
        items: [
          "Peter is the doctor who drank my coffee",
          "This is the fly which I don't like",
          "This is the coffee that I like"
        ],
        notes: "Connecting qualifying clauses: who (people), which (things), that (both)."
      }
    ],
    verb_forms: [
      "Peter is the doctor who drank my coffee",
      "This is the fly which I don't like",
      "This is the coffee that I like"
    ],
    sentence_structures: [
      "Actually, I like black coffee",
      "However, I don't like black fly"
    ],
    tense: [
      "Relative clause agreement: who drank, which I don't like, that I like"
    ],
    notes: "- **Conjunctions & Spoken Discourse Connectors**: Transition words that connect ideas.\n  *Examples*: Actually, I like black coffee; However, I don't like black fly.\n- **Relative Clauses (who / which / that)**: Connecting a qualifying description to a noun without starting a new sentence.\n  - **Who (for people)**: Peter is the doctor who drank my coffee.\n  - **Which (for things / animals)**: This is the fly which I don't like.\n  - **That (for people, animals, or things)**: This is the coffee that I like."
  },
  {
    id: "grammar_level_a_day_14",
    lesson_id: "level_a_day_14",
    course_id: "course_level_a",
    day_number: 14,
    lesson_title: "Day 14 - Lesson 10 Vietnam culture",
    grammar_points: [
      {
        title: "1. Comparison (ER / EST + than...)",
        items: [
          "The table is bigger than the cup",
          "The cup is not bigger than the table",
          "The table is more amazing than the cup",
          "The cup is not more amazing than the table",
          "This is the biggest table",
          "This is not the biggest cup",
          "This is the most amazing table",
          "This is not the most amazing cup"
        ],
        notes: "Short adjectives (-er/-est) and long adjectives (more/most)."
      },
      {
        title: "2. Although / because + clause",
        items: [
          "Although I don't like the cup,...",
          "Because I don't like the cup,..."
        ],
        notes: "Subordinate clauses introducing concession or cause."
      },
      {
        title: "3. IT TOOK sb some time to do sth",
        items: [
          "It took Peter 2 days to drink coffee"
        ],
        notes: "Expressing time duration taken by someone to complete an action."
      }
    ],
    verb_forms: [
      "Although I don't like the cup,...",
      "Because I don't like the cup,...",
      "It took Peter 2 days to drink coffee"
    ],
    sentence_structures: [
      "The table is bigger than the cup",
      "The table is more amazing than the cup",
      "This is the biggest table",
      "This is the most amazing table"
    ],
    tense: [
      "Comparative & Superlative states",
      "It took + person + duration + to V1"
    ],
    notes: "- **Comparatives and Superlatives**:\n  - **Short Adjectives (-er / -est)**:\n    *Examples*: The table is bigger than the cup, The cup is not bigger than the table, This is the biggest table, This is not the biggest cup.\n  - **Long Adjectives (more / most)**:\n    *Examples*: The table is more amazing than the cup, The cup is not more amazing than the table, This is the most amazing table, This is not the most amazing cup.\n- **Conjunction Clauses (Although / Because + clause)**:\n  *Examples*: Although I don't like the cup, ..., Because I don't like the cup, ...\n- **Duration with 'It took'**:\n  *Structure*: It took + Person + duration + to-infinitive.\n  *Example*: It took Peter 2 days to drink coffee."
  },
  {
    id: "grammar_level_a_day_15",
    lesson_id: "level_a_day_15",
    course_id: "course_level_a",
    day_number: 15,
    lesson_title: "Day 15 - Day 15 Final Test",
    grammar_points: [
      {
        title: "1. 3 Big Structures & Reflex Circles",
        items: [
          "Affirmative (+), Negative (-), Interrogative (?)",
          "Pronoun circle: I like you / you like him / he likes her",
          "Possession circle: That is my cup / That cup is mine",
          "WH 1st & Subjectless: What you want? / What to drink now?"
        ],
        notes: "Core structural patterns across Level A."
      },
      {
        title: "2. Verbs & Verb Forms (V2V, Gerunds, Modals, Causatives)",
        items: [
          "Like to drink / Want to think (V2V)",
          "Stop drinking coffee / Keep drinking coffee (V-ing)",
          "I can drink coffee / Can I drink coffee? (Modals)",
          "I let Peter drink coffee / I make the fly sit (Make / Let)"
        ],
        notes: "Major verb collocations and linking forms."
      },
      {
        title: "3. Clauses, Tenses & Comparisons",
        items: [
          "Peter is the doctor who drank my coffee (Relative clause)",
          "Although I don't like the cup,... (Conjunctions)",
          "The table is bigger than the cup (Comparisons)",
          "Yesterday (V2) / Today (V1) / Tomorrow (Will+V1) / Now (Be+Ving)"
        ],
        notes: "Comprehensive synthesis of complex structures and timelines."
      }
    ],
    verb_forms: [
      "Like to drink (V2V)",
      "Stop drinking coffee (V-ing)",
      "I can drink coffee (Modal)",
      "I let Peter drink coffee (Causative)"
    ],
    sentence_structures: [
      "Affirmative (+), Negative (-), Interrogative (?)",
      "That is my cup -> That cup is mine",
      "What you want? / What to drink now?"
    ],
    tense: [
      "Peter is the doctor who drank my coffee",
      "The table is bigger than the cup",
      "Yesterday, Today, Tomorrow, Now"
    ],
    notes: "- **Comprehensive Level A Grammar Synthesis**:\n  - 3 Big Structures: Affirmative (+), Negative (-), Interrogative (?) across BE and Action Verbs.\n  - Core Verb Collocations: V2V infinitives, gerunds after Stop/Keep/Mind, causative Make/Let.\n  - Noun & Pronoun Patterns: Noun phrase pre-modification, pronoun circles, possessive pronoun shifts, subjectless WH-questions.\n  - Linking & Subordinate Clauses: Look/Seem sensory verbs, relative clauses (who/which/that), conjunctions (although/because), and comparatives/superlatives."
  }
];

/**
 * Fast lookup helper for Level A grammar by day number (1..15)
 */
export function getLevelAGrammarForDay(dayNumber: number): LessonGrammarDoc | undefined {
  return LEVEL_A_GRAMMAR_CATALOG.find(g => g.day_number === dayNumber);
}

/**
 * Fast lookup helper for Level A grammar by lesson ID (e.g. "level_a_day_1", "day_1", "day 1")
 */
export function getLevelAGrammarForLesson(lessonId: string): LessonGrammarDoc | undefined {
  if (!lessonId) return undefined;
  const clean = lessonId.trim().toLowerCase();

  // 1. Direct match by lesson_id or id
  const direct = LEVEL_A_GRAMMAR_CATALOG.find(g => 
    g.lesson_id.toLowerCase() === clean || 
    g.id.toLowerCase() === clean
  );
  if (direct) return direct;

  // 2. Extract day number from id (e.g. "level_a_day_1", "day_1", "day 1")
  const dayMatch = clean.match(/day[_\s-]*(\d+)/i);
  if (dayMatch) {
    const dayNum = parseInt(dayMatch[1], 10);
    return getLevelAGrammarForDay(dayNum);
  }

  return undefined;
}

/**
 * Alias helper matching getGrammarForLesson naming convention
 */
export const getGrammarForLesson = getLevelAGrammarForLesson;
