(function (root) {
  'use strict';

  const LC = (root.LinguaCoach = root.LinguaCoach || {});

  const KB = [
    // === English (A2 / B1 / B2) ===
    {
      id: 'EN-B1-EMBED-01',
      language: 'English',
      level: 'B1',
      topic: 'Embedded Yes/No Questions (whether / if)',
      tags: ['grammar', 'whether', 'if', 'embedded question', 'indirect question', 'seminar', 'clause', 'it is helpful or not', 'helpful or not', 'know'],
      rule: 'Use "whether" (or "if") to introduce an indirect yes/no question after verbs like "know", "ask", "explore", or "wonder", keeping normal subject-verb word order.',
      exampleWrong: 'I want to know it is helpful or not.',
      exampleRight: 'I want to know whether it is helpful.',
      source: 'CEFR Companion Volume (Council of Europe, 2020) — Grammatical Accuracy B1'
    },
    {
      id: 'EN-A2-ART-02',
      language: 'English',
      level: 'A2',
      topic: 'Articles with Singular Countable Nouns (a / an / the)',
      tags: ['grammar', 'articles', 'a', 'an', 'the', 'countable noun', 'interesting article', 'article', 'seminar'],
      rule: 'Singular countable nouns in English require a determiner such as "a", "an" (before a vowel sound), or "the". Use "an" before words beginning with a vowel sound like "interesting".',
      exampleWrong: 'I read interesting article about climate change yesterday.',
      exampleRight: 'I read an interesting article about climate change yesterday.',
      source: 'CEFR Companion Volume (Council of Europe, 2020) — Grammatical Accuracy A2'
    },
    {
      id: 'EN-B1-INTRO-03',
      language: 'English',
      level: 'B1',
      topic: 'Seminar Introduction Opening Frames',
      tags: ['seminar', 'introduction', 'opening', 'presentation', 'research', 'topic', 'AI', 'study'],
      rule: 'Open a short seminar introduction by stating your topic clearly in one sentence, then naming your specific focus or guiding question.',
      exampleWrong: 'Today I talk my research AI students.',
      exampleRight: 'Today I am going to share my research on how university students use AI for studying.',
      source: 'CEFR Companion Volume (Council of Europe, 2020) — Addressing Audiences B1'
    },
    {
      id: 'EN-B1-PREP-04',
      language: 'English',
      level: 'B1',
      topic: 'Prepositions & Gerunds for Purpose (for + -ing / to + verb)',
      tags: ['grammar', 'prepositions', 'gerund', 'for study', 'for studying', 'purpose', 'academic'],
      rule: 'After "for" to express general purpose, use a gerund (-ing form) such as "for studying", or use an infinitive phrase such as "to support their studies".',
      exampleWrong: 'Many students use AI for study every day.',
      exampleRight: 'Many students use AI for studying every day.',
      source: 'Cambridge Academic English B1+ — Prepositional Patterns'
    },
    {
      id: 'EN-B1-SIGN-05',
      language: 'English',
      level: 'B1',
      topic: 'Signposting Structure in Short Presentations',
      tags: ['signposting', 'structure', 'clarity', 'coherence', 'seminar', 'presentation', 'first', 'next', 'finally'],
      rule: 'Use concise signposting phrases ("First, I will outline...", "Next, I want to examine...", "Finally, I will share...") so listeners can follow a 2-minute talk effortlessly.',
      exampleWrong: 'And then another thing is the survey and after that is my point.',
      exampleRight: 'First, I will outline our survey findings; then, I will highlight two key takeaways.',
      source: 'CEFR Companion Volume (Council of Europe, 2020) — Coherence and Cohesion B1'
    },
    {
      id: 'EN-B2-HEDGE-06',
      language: 'English',
      level: 'B2',
      topic: 'Academic Hedging and Measured Stance',
      tags: ['hedging', 'stance', 'academic', 'claim', 'suggests', 'may', 'evidence', 'research', 'cautious'],
      rule: 'Avoid absolute claims in academic speaking. Use cautious verbs and modals ("suggests that", "tends to", "may help when...") to match the strength of your evidence.',
      exampleWrong: 'This study proves that AI always makes every student perform better.',
      exampleRight: 'These initial findings suggest that AI tools may support students when paired with critical review.',
      source: 'CEFR Companion Volume (Council of Europe, 2020) — Propositional Precision B2'
    },
    {
      id: 'EN-B1-QA-07',
      language: 'English',
      level: 'B1',
      topic: 'Q&A Transitions and Buying Thinking Time',
      tags: ['Q&A', 'questions', 'audience', 'nervous', 'seminar', 'transition', 'rehearsal', 'thinking time', 'confidence'],
      rule: 'When answering audience questions under pressure, open with a calm acknowledging phrase to buy thinking time, give one direct answer, and add one brief example.',
      exampleWrong: 'Uh... wait... I do not know, maybe yes.',
      exampleRight: 'That is a great question. From what I have observed so far, the main benefit is faster drafting feedback.',
      source: 'CEFR Companion Volume (Council of Europe, 2020) — Formal Discussion & Q&A B1'
    },
    {
      id: 'EN-B1-REASON-08',
      language: 'English',
      level: 'B1',
      topic: 'Supporting Claims with Reasons and Concrete Examples',
      tags: ['reasons', 'examples', 'because', 'for instance', 'clarity', 'explanation', 'argument', 'evidence'],
      rule: 'Strengthen short spoken answers by pairing a claim with one reason ("because...", "since...") and one concrete illustration ("for instance...", "a common case is...").',
      exampleWrong: 'It is helpful. Many students use it every day.',
      exampleRight: 'It is helpful because it gives immediate feedback; for instance, students can test whether their thesis statement is clear.',
      source: 'CEFR Companion Volume (Council of Europe, 2020) — Sustained Monologue: Putting a Case B1'
    },
    {
      id: 'EN-B2-TURN-09',
      language: 'English',
      level: 'B2',
      topic: 'Academic Discussion Turn-Taking and Constructive Disagreement',
      tags: ['discussion', 'turn-taking', 'seminar', 'agree', 'disagree', 'polite', 'peer', 'interaction'],
      rule: 'In seminar discussions, acknowledge a peer’s contribution before adding a nuance or counter-perspective ("I see your point about..., though I wonder whether...").',
      exampleWrong: 'No, that is wrong. Students just copy from AI.',
      exampleRight: 'I see your point about over-reliance, though I wonder whether structured guidelines could encourage more critical use.',
      source: 'CEFR Companion Volume (Council of Europe, 2020) — Turntaking & Cooperating B2'
    },
    {
      id: 'EN-B1-INTERVIEW-10',
      language: 'English',
      level: 'B1',
      topic: 'Concise STAR Framing for Interviews and Formal Introductions',
      tags: ['interview', 'job', 'job interview', 'STAR', 'experience', 'formal', 'clarity', 'fluency'],
      rule: 'Structure interview answers around Situation, Task, Action, and Result in 3–4 crisp sentences so your contribution and measurable outcome stand out clearly.',
      exampleWrong: 'I did a group project in university and worked hard and it went well.',
      exampleRight: 'In a four-person course project, I coordinated our research schedule, which helped our team submit two days ahead of deadline.',
      source: 'CEFR Companion Volume (Council of Europe, 2020) — Interviewing and Being Interviewed B1'
    },

    // === Spanish (B1 / B2) ===
    {
      id: 'ES-B2-SUBJ-01',
      language: 'Spanish',
      level: 'B2',
      topic: 'Certainty (Indicative) vs. Doubt/Negation (Subjunctive)',
      tags: ['subjunctive', 'subjuntivo', 'indicative', 'indicativo', 'estoy seguro de que', 'pienso que', 'creo que', 'no creo que', 'dudo que', 'doubt', 'certainty', 'spanish'],
      rule: 'Expressions of certainty or affirmative belief ("estoy seguro de que", "pienso que", "creo que") take the indicative, whereas negated belief or doubt ("no creo que", "dudo que", "no estoy seguro de que") trigger the present subjunctive.',
      exampleWrong: 'No creo que el gobierno hace suficiente, aunque estoy seguro de que sean buenas medidas.',
      exampleRight: 'Estoy seguro de que estas medidas ayudan, pero no creo que el gobierno haga suficiente.',
      source: 'Instituto Cervantes — Plan Curricular (PCIC), B2 Gramática: Subjuntivo en subordinadas sustantivas'
    },
    {
      id: 'ES-B1-AGREE-02',
      language: 'Spanish',
      level: 'B1',
      topic: 'Subject-Verb and Adjective Agreement in Plural',
      tags: ['agreement', 'concordancia', 'plural', 'subject-verb', 'adjective', 'coches eléctricos', 'eléctricos', 'importantes', 'son', 'es muy importante', 'spanish', 'grammar'],
      rule: 'In Spanish, plural subjects require a third-person plural verb ("son", "reducen") and adjectives matching in both gender and number ("los coches eléctricos son muy importantes").',
      exampleWrong: 'Los coches eléctricos es muy importante para el medio ambiente.',
      exampleRight: 'Los coches eléctricos son muy importantes para el medio ambiente.',
      source: 'Instituto Cervantes — Plan Curricular (PCIC), B1 Concordancia nominal y verbal'
    },
    {
      id: 'ES-B1-PORPARA-03',
      language: 'Spanish',
      level: 'B1',
      topic: 'Prepositions "por" vs. "para" in Policy Explanations',
      tags: ['por', 'para', 'prepositions', 'purpose', 'cause', 'medio ambiente', 'spanish', 'grammar'],
      rule: 'Use "para" to express purpose, goals, recipients, or deadlines ("para reducir emisiones"); use "por" for cause, reason, means, duration, or exchange ("por la contaminación").',
      exampleWrong: 'Necesitamos subsidios por reducir la contaminación urbana.',
      exampleRight: 'Necesitamos subsidios para reducir la contaminación urbana.',
      source: 'Instituto Cervantes — Plan Curricular (PCIC), B1 Preposiciones por y para'
    },
    {
      id: 'ES-B1-SERESTAR-04',
      language: 'Spanish',
      level: 'B1',
      topic: 'Distinguishing "ser" vs. "estar" in Evaluations and States',
      tags: ['ser', 'estar', 'verbs', 'state', 'definition', 'spanish', 'grammar', 'debate'],
      rule: 'Use "ser" for definitions, inherent qualities, and general evaluations ("es fundamental"); use "estar" for locations, temporary states, and resulting conditions ("está contaminada", "estoy convencido").',
      exampleWrong: 'El transporte público está fundamental y los ciudadanos son preocupados.',
      exampleRight: 'El transporte público es fundamental y los ciudadanos están preocupados por la calidad del aire.',
      source: 'Instituto Cervantes — Plan Curricular (PCIC), B1 Usos contrastivos de ser y estar'
    },
    {
      id: 'ES-B2-CONN-05',
      language: 'Spanish',
      level: 'B2',
      topic: 'Discourse Connectors for Environmental and Policy Debate',
      tags: ['conectores', 'connectors', 'debate', 'política', 'medio ambiente', 'sin embargo', 'además', 'por lo tanto', 'aunque', 'spanish', 'coherence'],
      rule: 'Connect policy arguments smoothly using markers of addition ("además"), contrast ("sin embargo", "no obstante"), concession ("aunque"), and consequence ("por lo tanto", "en consecuencia").',
      exampleWrong: 'Los subsidios cuestan mucho. También ayudan al clima. Entonces hay que apoyarlos.',
      exampleRight: 'Aunque los subsidios exigen inversión inicial, además impulsan la innovación; por lo tanto, resultan rentables a largo plazo.',
      source: 'CEFR Companion Volume (Council of Europe, 2020) — Coherence and Cohesion B2'
    },
    {
      id: 'ES-B2-OPIN-06',
      language: 'Spanish',
      level: 'B2',
      topic: 'Framing Balanced Opinions in Spanish Debates',
      tags: ['opinión', 'debate', 'desde mi punto de vista', 'conviene', 'política ambiental', 'sostenibilidad', 'spanish', 'argument'],
      rule: 'Signal a nuanced B2 viewpoint with frames like "desde mi punto de vista", "conviene señalar que", or "si bien es cierto que..." before introducing a trade-off.',
      exampleWrong: 'Yo digo que el gobierno debe prohibir todos los coches ahora.',
      exampleRight: 'Desde mi punto de vista, conviene combinar incentivos para coches eléctricos con una red de transporte público más eficiente.',
      source: 'Instituto Cervantes — PCIC B2 Funciones comunicativas: Expresar y matizar opiniones'
    },

    // === General / Pedagogy (All Levels) ===
    {
      id: 'GEN-PED-LOOP-01',
      language: 'General',
      level: 'All',
      topic: 'Deliberate Practice Loop: Focused Feedback and Immediate Retry',
      tags: ['pedagogy', 'feedback', 'retry', 'deliberate practice', 'revision', 'scaffold', 'loop', 'uptake'],
      rule: 'Limit feedback to 2 strengths and 2 high-impact priority fixes with concrete examples, then prompt 1 immediate retry so learners consolidate corrected language without cognitive overload.',
      exampleWrong: 'Listing 10 minor grammar errors at once without inviting the learner to try revising.',
      exampleRight: 'Highlighting 2 strengths + 2 concrete fixes, then prompting one focused 1-turn retry.',
      source: 'Ericsson (2008) Deliberate Practice & Lyster et al. (2013) Corrective Feedback and Learner Uptake'
    },
    {
      id: 'GEN-PED-AFF-02',
      language: 'General',
      level: 'All',
      topic: 'Affective Filter and Low-Stakes Speaking Adaptation',
      tags: ['anxiety', 'nervous', 'affective filter', 'confidence', 'distress', 'low-stakes', 'pause', 'support', 'emotional', 'overwhelmed'],
      rule: 'Speaking anxiety narrows working memory. Lower pressure by shortening tasks into micro-rehearsals (e.g., 5-minute Q&A warm-ups), normalizing pauses, and halting role-play warmly if the learner shows distress.',
      exampleWrong: 'Forcing an anxious student through an uninterrupted 10-minute high-stakes mock assessment.',
      exampleRight: 'Switching to a 5-minute two-question Q&A rehearsal with a brief confidence check and supportive retry.',
      source: 'Krashen (1982) Affective Filter Hypothesis & Horwitz et al. (1986) Foreign Language Classroom Anxiety'
    },
    {
      id: 'GEN-PED-CEFR-03',
      language: 'General',
      level: 'All',
      topic: 'CEFR Action-Oriented Task Alignment and Realistic Progression',
      tags: ['CEFR', 'action-oriented', 'level', 'A2', 'B1', 'B2', 'C1', 'timeline', 'realistic', 'goal', 'brief', 'exam'],
      rule: 'Anchor every practice session in a concrete communicative scenario, self-rated level, and available time. Advancing a full CEFR band requires sustained guided hours—never promise rapid band jumps or fabricate official scores.',
      exampleWrong: 'Guaranteeing a jump to C1 in two days or awarding an estimated IELTS score from a brief text chat.',
      exampleRight: 'Clarifying one realistic immediate goal (e.g., a 2-minute seminar opening) and tracking observable practice gains.',
      source: 'CEFR Companion Volume (Council of Europe, 2020) — Action-Oriented Approach'
    },
    {
      id: 'GEN-PED-INTEG-04',
      language: 'General',
      level: 'All',
      topic: 'Academic Integrity and Ethical Scaffolding Boundaries',
      tags: ['integrity', 'academic integrity', 'assignment', 'essay', 'ethics', 'refusal', 'draft', 'homework', 'submission'],
      rule: 'A conversational language coach builds learner autonomy rather than ghostwriting graded work. Politely refuse requests to write submissions and pivot to rehearsing or revising the learner’s own ideas.',
      exampleWrong: 'Writing a 1,000-word essay ready for the student to submit for course credit.',
      exampleRight: 'Declining to write the assignment and inviting the student to share 2–3 sentences of their own outline for language practice.',
      source: 'UNESCO (2023) Guidance for Generative AI in Education and Research & Lingnan University CCC8015'
    }
  ];

  LC.KB = KB;

  if (typeof module !== 'undefined' && module.exports) {
    module.exports = LC.KB;
  }
})(typeof window !== 'undefined' ? window : globalThis);
