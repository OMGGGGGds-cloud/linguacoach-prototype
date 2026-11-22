(function (root) {
  'use strict';

  const LC = (root.LinguaCoach = root.LinguaCoach || {});

  function getPII() {
    if (LC.PII) return LC.PII;
    if (typeof require === 'function') {
      try { return require('./pii.js'); } catch (_e) { return null; }
    }
    return null;
  }

  function getRAG() {
    if (LC.RAG) return LC.RAG;
    if (typeof require === 'function') {
      try { return require('./rag.js'); } catch (_e) { return null; }
    }
    return null;
  }

  function getKB() {
    if (Array.isArray(LC.KB)) return LC.KB;
    if (typeof require === 'function') {
      try { return require('./kb.js'); } catch (_e) { return []; }
    }
    return [];
  }

  function buildRawWithState(displayText, state) {
    return (
      displayText.trim() +
      '\n\n```linguacoach-state\n' +
      JSON.stringify(state, null, 2) +
      '\n```'
    );
  }

  function cloneBrief(brief) {
    const b = brief || {};
    return {
      targetLanguage: b.targetLanguage || '',
      goal: b.goal || '',
      level: b.level || '',
      scenario: b.scenario || '',
      timeMinutes: b.timeMinutes != null ? b.timeMinutes : null,
      feedbackFocus: b.feedbackFocus || ''
    };
  }

  function ragByIds(ids) {
    const kb = getKB();
    const out = [];
    for (let i = 0; i < ids.length; i++) {
      const found = kb.find(function (entry) { return entry.id === ids[i]; });
      if (found) {
        out.push({ item: found, score: 8 - i, matchedTerms: ['scenario-reference'] });
      }
    }
    return out;
  }

  const SCENARIOS = [
    {
      id: 'demo1-clarify',
      badge: 'Demo 1',
      title: 'Clarify Brief',
      subtitle: 'B1 English · 2-min seminar intro (Slide 7)',
      description: 'Coach avoids guessing missing details, asks one focused diagnostic question at a time, and confirms a structured Practice Brief before role-play.',
      language: 'English',
      level: 'B1',
      initialBrief: {
        targetLanguage: 'English',
        goal: '',
        level: '',
        scenario: '',
        timeMinutes: null,
        feedbackFocus: ''
      },
      ragIds: ['GEN-PED-CEFR-03', 'EN-B1-INTRO-03'],
      turns: [
        {
          role: 'user',
          text: 'I want to practise a 2-minute seminar introduction in English about my research on AI in university study.',
          content: 'I want to practise a 2-minute seminar introduction in English about my research on AI in university study.'
        },
        {
          role: 'assistant',
          displayText: 'That sounds like a practical and timely seminar topic! Before we start, I want to avoid guessing your setup—what is your self-rated English level right now (A2, B1, B2, or C1)?',
          text: 'That sounds like a practical and timely seminar topic! Before we start, I want to avoid guessing your setup—what is your self-rated English level right now (A2, B1, B2, or C1)?',
          content: 'That sounds like a practical and timely seminar topic! Before we start, I want to avoid guessing your setup—what is your self-rated English level right now (A2, B1, B2, or C1)?',
          state: {
            phase: 'clarify',
            brief: {
              targetLanguage: 'English',
              goal: 'Deliver a clear 2-minute seminar introduction on AI in university study',
              level: '',
              scenario: 'University seminar opening',
              timeMinutes: null,
              feedbackFocus: ''
            },
            feedback: null,
            revisedPlan: null,
            progress: {
              targetPhrasesUsed: 0,
              revisionsCount: 0,
              nextStep: 'Confirm self-rated level, available time, and feedback focus'
            },
            guardrailTriggered: null
          }
        },
        {
          role: 'user',
          text: "I'm around B1, I have 8 minutes today, and please focus on clarity and grammar.",
          content: "I'm around B1, I have 8 minutes today, and please focus on clarity and grammar."
        },
        {
          role: 'assistant',
          displayText: 'Practice Brief confirmed!\n\n- **Language & Level:** English (self-rated B1)\n- **Goal & Scenario:** 2-minute university seminar introduction on AI in study\n- **Time & Focus:** 8 minutes · Clarity & grammar\n\nI will play a friendly seminar chair (text-based practice only—I cannot score spoken pronunciation). Whenever you are ready, go ahead with your opening 2–3 sentences!',
          text: 'Practice Brief confirmed!\n\n- **Language & Level:** English (self-rated B1)\n- **Goal & Scenario:** 2-minute university seminar introduction on AI in study\n- **Time & Focus:** 8 minutes · Clarity & grammar\n\nI will play a friendly seminar chair (text-based practice only—I cannot score spoken pronunciation). Whenever you are ready, go ahead with your opening 2–3 sentences!',
          content: 'Practice Brief confirmed!\n\n- **Language & Level:** English (self-rated B1)\n- **Goal & Scenario:** 2-minute university seminar introduction on AI in study\n- **Time & Focus:** 8 minutes · Clarity & grammar\n\nI will play a friendly seminar chair (text-based practice only—I cannot score spoken pronunciation). Whenever you are ready, go ahead with your opening 2–3 sentences!',
          state: {
            phase: 'confirm',
            brief: {
              targetLanguage: 'English',
              goal: 'Deliver a clear 2-minute seminar introduction on AI in university study',
              level: 'B1',
              scenario: 'University seminar opening',
              timeMinutes: 8,
              feedbackFocus: 'Clarity and grammar'
            },
            feedback: null,
            revisedPlan: null,
            progress: {
              targetPhrasesUsed: 0,
              revisionsCount: 0,
              nextStep: 'Deliver opening 2–3 sentences in seminar role-play'
            },
            guardrailTriggered: null
          }
        }
      ],
      finalState: {
        phase: 'confirm',
        brief: {
          targetLanguage: 'English',
          goal: 'Deliver a clear 2-minute seminar introduction on AI in university study',
          level: 'B1',
          scenario: 'University seminar opening',
          timeMinutes: 8,
          feedbackFocus: 'Clarity and grammar'
        },
        feedback: null,
        revisedPlan: null,
        progress: {
          targetPhrasesUsed: 0,
          revisionsCount: 0,
          nextStep: 'Deliver opening 2–3 sentences in seminar role-play'
        },
        guardrailTriggered: null
      }
    },
    {
      id: 'demo2-roleplay',
      badge: 'Demo 2',
      title: 'Role-play & Feedback',
      subtitle: 'B1 English · Targeted fixes & retry (Slide 8)',
      description: 'Runs a short seminar turn and returns 2 strengths, 2 grounded priority fixes ("whether it is helpful"), 1 retry prompt, and progress metrics.',
      language: 'English',
      level: 'B1',
      initialBrief: {
        targetLanguage: 'English',
        goal: 'Deliver a clear 2-minute seminar introduction on AI in university study',
        level: 'B1',
        scenario: 'University seminar opening',
        timeMinutes: 8,
        feedbackFocus: 'Clarity and grammar'
      },
      ragIds: ['EN-B1-EMBED-01', 'EN-B1-PREP-04', 'GEN-PED-LOOP-01'],
      turns: [
        {
          role: 'assistant',
          displayText: '*(In role as seminar chair)* Welcome everyone! Next up, please introduce your research topic in 2–3 sentences.',
          text: '*(In role as seminar chair)* Welcome everyone! Next up, please introduce your research topic in 2–3 sentences.',
          content: '*(In role as seminar chair)* Welcome everyone! Next up, please introduce your research topic in 2–3 sentences.',
          state: {
            phase: 'roleplay',
            brief: {
              targetLanguage: 'English',
              goal: 'Deliver a clear 2-minute seminar introduction on AI in university study',
              level: 'B1',
              scenario: 'University seminar opening',
              timeMinutes: 8,
              feedbackFocus: 'Clarity and grammar'
            },
            feedback: null,
            revisedPlan: null,
            progress: {
              targetPhrasesUsed: 0,
              revisionsCount: 0,
              nextStep: 'Deliver opening sentences'
            },
            guardrailTriggered: null
          }
        },
        {
          role: 'user',
          text: 'My research is about how students use AI for study. I want to know it is helpful or not.',
          content: 'My research is about how students use AI for study. I want to know it is helpful or not.'
        },
        {
          role: 'assistant',
          displayText: 'Good opening—your topic comes across right away! Here is your targeted feedback:\n\n**2 Strengths**\n1. Direct, clear topic framing so your audience immediately knows your focus.\n2. Clean, concise two-sentence rhythm suited to a B1 seminar opening.\n\n**2 Priority Fixes**\n1. **Embedded yes/no question:** `"I want to know it is helpful or not."` → `"I want to know whether it is helpful."` *(Use "whether" after "know" instead of a direct clause.)*\n2. **Natural academic phrasing:** `"use AI for study"` → `"use AI for studying"` *(or "to support their studies").*\n\n**1 Retry Prompt**\nTry your two opening sentences again using **"whether"** and **"for studying"**, and add one brief signposting clause if you like.',
          text: 'Good opening—your topic comes across right away! Here is your targeted feedback:\n\n**2 Strengths**\n1. Direct, clear topic framing so your audience immediately knows your focus.\n2. Clean, concise two-sentence rhythm suited to a B1 seminar opening.\n\n**2 Priority Fixes**\n1. **Embedded yes/no question:** `"I want to know it is helpful or not."` → `"I want to know whether it is helpful."` *(Use "whether" after "know" instead of a direct clause.)*\n2. **Natural academic phrasing:** `"use AI for study"` → `"use AI for studying"` *(or "to support their studies").*\n\n**1 Retry Prompt**\nTry your two opening sentences again using **"whether"** and **"for studying"**, and add one brief signposting clause if you like.',
          content: 'Good opening—your topic comes across right away! Here is your targeted feedback:\n\n**2 Strengths**\n1. Direct, clear topic framing so your audience immediately knows your focus.\n2. Clean, concise two-sentence rhythm suited to a B1 seminar opening.\n\n**2 Priority Fixes**\n1. **Embedded yes/no question:** `"I want to know it is helpful or not."` → `"I want to know whether it is helpful."` *(Use "whether" after "know" instead of a direct clause.)*\n2. **Natural academic phrasing:** `"use AI for study"` → `"use AI for studying"` *(or "to support their studies").*\n\n**1 Retry Prompt**\nTry your two opening sentences again using **"whether"** and **"for studying"**, and add one brief signposting clause if you like.',
          state: {
            phase: 'feedback',
            brief: {
              targetLanguage: 'English',
              goal: 'Deliver a clear 2-minute seminar introduction on AI in university study',
              level: 'B1',
              scenario: 'University seminar opening',
              timeMinutes: 8,
              feedbackFocus: 'Clarity and grammar'
            },
            feedback: {
              strengths: [
                'Clear, direct topic statement that helps listeners immediately understand your research focus.',
                'Concise two-sentence structure appropriate for a B1 seminar opening.'
              ],
              priorityFixes: [
                {
                  original: 'I want to know it is helpful or not.',
                  improved: 'I want to know whether it is helpful.',
                  note: 'Use "whether" (or "if") to introduce an embedded yes/no question after "know" [EN-B1-EMBED-01].'
                },
                {
                  original: 'how students use AI for study',
                  improved: 'how students use AI for studying',
                  note: 'Use a gerund ("for studying") or infinitive ("to support their studies") after "for" for purpose [EN-B1-PREP-04].'
                }
              ],
              retryPrompt: 'Retry your opening using "whether it is helpful" and "for studying".',
              assumptions: [
                'Text-based practice only — spoken pacing, stress, and pronunciation cannot be assessed.',
                'Calibrated to your self-rated B1 goal; not an official CEFR evaluation.'
              ]
            },
            revisedPlan: null,
            progress: {
              targetPhrasesUsed: 0,
              revisionsCount: 0,
              nextStep: 'Retry opening with "whether" and "for studying"'
            },
            guardrailTriggered: null
          }
        },
        {
          role: 'user',
          text: 'My research is about how students use AI for studying, and I want to know whether it is helpful for academic writing.',
          content: 'My research is about how students use AI for studying, and I want to know whether it is helpful for academic writing.'
        },
        {
          role: 'assistant',
          displayText: 'Much clearer and more natural! You smoothly applied both **"for studying"** and **"whether it is helpful"** in a single fluent opening.\n\n**Progress:** 2 target phrases used · 1 revision · **Next:** answer one audience question. Ready for a quick follow-up question from a classmate?',
          text: 'Much clearer and more natural! You smoothly applied both **"for studying"** and **"whether it is helpful"** in a single fluent opening.\n\n**Progress:** 2 target phrases used · 1 revision · **Next:** answer one audience question. Ready for a quick follow-up question from a classmate?',
          content: 'Much clearer and more natural! You smoothly applied both **"for studying"** and **"whether it is helpful"** in a single fluent opening.\n\n**Progress:** 2 target phrases used · 1 revision · **Next:** answer one audience question. Ready for a quick follow-up question from a classmate?',
          state: {
            phase: 'reflect',
            brief: {
              targetLanguage: 'English',
              goal: 'Deliver a clear 2-minute seminar introduction on AI in university study',
              level: 'B1',
              scenario: 'University seminar opening',
              timeMinutes: 8,
              feedbackFocus: 'Clarity and grammar'
            },
            feedback: {
              strengths: [
                'Clear, direct topic statement that helps listeners immediately understand your research focus.',
                'Successful revision combining "for studying" and "whether it is helpful" naturally.'
              ],
              priorityFixes: [
                {
                  original: 'I want to know it is helpful or not.',
                  improved: 'I want to know whether it is helpful.',
                  note: 'Resolved in revision [EN-B1-EMBED-01].'
                },
                {
                  original: 'how students use AI for study',
                  improved: 'how students use AI for studying',
                  note: 'Resolved in revision [EN-B1-PREP-04].'
                }
              ],
              retryPrompt: 'Next step: try answering one short audience question.',
              assumptions: [
                'Text-based practice only — spoken delivery and pronunciation are not scored.'
              ]
            },
            revisedPlan: null,
            progress: {
              targetPhrasesUsed: 2,
              revisionsCount: 1,
              nextStep: 'answer one audience question'
            },
            guardrailTriggered: null
          }
        }
      ],
      finalState: {
        phase: 'reflect',
        brief: {
          targetLanguage: 'English',
          goal: 'Deliver a clear 2-minute seminar introduction on AI in university study',
          level: 'B1',
          scenario: 'University seminar opening',
          timeMinutes: 8,
          feedbackFocus: 'Clarity and grammar'
        },
        feedback: {
          strengths: [
            'Clear, direct topic statement that helps listeners immediately understand your research focus.',
            'Successful revision combining "for studying" and "whether it is helpful" naturally.'
          ],
          priorityFixes: [
            {
              original: 'I want to know it is helpful or not.',
              improved: 'I want to know whether it is helpful.',
              note: 'Resolved in revision [EN-B1-EMBED-01].'
            },
            {
              original: 'how students use AI for study',
              improved: 'how students use AI for studying',
              note: 'Resolved in revision [EN-B1-PREP-04].'
            }
          ],
          retryPrompt: 'Next step: try answering one short audience question.',
          assumptions: [
            'Text-based practice only — spoken delivery and pronunciation are not scored.'
          ]
        },
        revisedPlan: null,
        progress: {
          targetPhrasesUsed: 2,
          revisionsCount: 1,
          nextStep: 'answer one audience question'
        },
        guardrailTriggered: null
      }
    },
    {
      id: 'demo3-adapt',
      badge: 'Demo 3',
      title: 'Adapt Constraints',
      subtitle: '5-min Q&A rehearsal · Lower pressure (Slide 9)',
      description: 'When time shrinks and anxiety rises, LinguaCoach switches from a full talk to a structured 5-minute Q&A micro-rehearsal.',
      language: 'English',
      level: 'B1',
      initialBrief: {
        targetLanguage: 'English',
        goal: 'Handle seminar Q&A calmly',
        level: 'B1',
        scenario: 'University seminar opening',
        timeMinutes: 8,
        feedbackFocus: 'Clarity and grammar'
      },
      ragIds: ['EN-B1-QA-07', 'GEN-PED-AFF-02'],
      turns: [
        {
          role: 'user',
          text: "I only have 5 minutes and I'm nervous about questions.",
          content: "I only have 5 minutes and I'm nervous about questions."
        },
        {
          role: 'assistant',
          displayText: 'Totally understandable—let’s shorten the task and keep it low-pressure. Instead of a full talk, we’ll switch to a **5-minute Q&A rehearsal**:\n\n- **1 min:** Goal & confidence check\n- **3 min:** Two-question Q&A rehearsal (one short question at a time)\n- **1 min:** Targeted feedback & 1 quick retry\n\nHere is one handy starter to buy thinking time: *"That’s a great question—from what I’ve seen so far..."*\n\n*(In role as a friendly classmate, Question 1 of 2)*: **What is one way students in your study use AI that surprised you?**',
          text: 'Totally understandable—let’s shorten the task and keep it low-pressure. Instead of a full talk, we’ll switch to a **5-minute Q&A rehearsal**:\n\n- **1 min:** Goal & confidence check\n- **3 min:** Two-question Q&A rehearsal (one short question at a time)\n- **1 min:** Targeted feedback & 1 quick retry\n\nHere is one handy starter to buy thinking time: *"That’s a great question—from what I’ve seen so far..."*\n\n*(In role as a friendly classmate, Question 1 of 2)*: **What is one way students in your study use AI that surprised you?**',
          content: 'Totally understandable—let’s shorten the task and keep it low-pressure. Instead of a full talk, we’ll switch to a **5-minute Q&A rehearsal**:\n\n- **1 min:** Goal & confidence check\n- **3 min:** Two-question Q&A rehearsal (one short question at a time)\n- **1 min:** Targeted feedback & 1 quick retry\n\nHere is one handy starter to buy thinking time: *"That’s a great question—from what I’ve seen so far..."*\n\n*(In role as a friendly classmate, Question 1 of 2)*: **What is one way students in your study use AI that surprised you?**',
          state: {
            phase: 'adapt',
            brief: {
              targetLanguage: 'English',
              goal: 'Answer two seminar audience questions calmly',
              level: 'B1',
              scenario: '5-minute seminar Q&A rehearsal',
              timeMinutes: 5,
              feedbackFocus: 'Calm Q&A transitions and clarity'
            },
            feedback: null,
            revisedPlan: [
              { time: '1 min', activity: 'Goal & confidence check' },
              { time: '3 min', activity: 'Two-question Q&A rehearsal' },
              { time: '1 min', activity: 'Feedback & retry' }
            ],
            progress: {
              targetPhrasesUsed: 0,
              revisionsCount: 0,
              nextStep: 'Answer Q&A Question 1 using a calm thinking-time starter'
            },
            guardrailTriggered: null
          }
        }
      ],
      finalState: {
        phase: 'adapt',
        brief: {
          targetLanguage: 'English',
          goal: 'Answer two seminar audience questions calmly',
          level: 'B1',
          scenario: '5-minute seminar Q&A rehearsal',
          timeMinutes: 5,
          feedbackFocus: 'Calm Q&A transitions and clarity'
        },
        feedback: null,
        revisedPlan: [
          { time: '1 min', activity: 'Goal & confidence check' },
          { time: '3 min', activity: 'Two-question Q&A rehearsal' },
          { time: '1 min', activity: 'Feedback & retry' }
        ],
        progress: {
          targetPhrasesUsed: 0,
          revisionsCount: 0,
          nextStep: 'Answer Q&A Question 1 using a calm thinking-time starter'
        },
        guardrailTriggered: null
      }
    },
    {
      id: 'demo4-spanish-b2',
      badge: 'Bonus',
      title: 'Spanish B2 Debate',
      subtitle: 'Spanish B2 · Environmental policy & grammar',
      description: 'Clean, grounded Spanish B2 debate contrasting certainty ("estoy seguro de que" + indicative) with doubt ("no creo que" + subjunctive) and plural agreement.',
      language: 'Spanish',
      level: 'B2',
      initialBrief: {
        targetLanguage: 'Spanish',
        goal: 'Defend a balanced stance on environmental policy and electric vehicles',
        level: 'B2',
        scenario: 'University Spanish B2 policy debate',
        timeMinutes: 10,
        feedbackFocus: 'Subjunctive vs. indicative and plural agreement'
      },
      ragIds: ['ES-B2-SUBJ-01', 'ES-B1-AGREE-02', 'ES-B2-CONN-05'],
      turns: [
        {
          role: 'assistant',
          displayText: '*(En el papel de compañero de debate B2)* **Estoy seguro de que** la transición energética es urgente, pero **no creo que** los subsidios por sí solos resuelvan la contaminación urbana. ¿Qué opinas tú sobre el papel de los coches eléctricos?',
          text: '*(En el papel de compañero de debate B2)* **Estoy seguro de que** la transición energética es urgente, pero **no creo que** los subsidios por sí solos resuelvan la contaminación urbana. ¿Qué opinas tú sobre el papel de los coches eléctricos?',
          content: '*(En el papel de compañero de debate B2)* **Estoy seguro de que** la transición energética es urgente, pero **no creo que** los subsidios por sí solos resuelvan la contaminación urbana. ¿Qué opinas tú sobre el papel de los coches eléctricos?',
          state: {
            phase: 'roleplay',
            brief: {
              targetLanguage: 'Spanish',
              goal: 'Defend a balanced stance on environmental policy and electric vehicles',
              level: 'B2',
              scenario: 'University Spanish B2 policy debate',
              timeMinutes: 10,
              feedbackFocus: 'Subjunctive vs. indicative and plural agreement'
            },
            feedback: null,
            revisedPlan: null,
            progress: {
              targetPhrasesUsed: 0,
              revisionsCount: 0,
              nextStep: 'Respond with a balanced B2 opinion on electric vehicles'
            },
            guardrailTriggered: null
          }
        },
        {
          role: 'user',
          text: 'Pienso que los coches eléctricos es muy importante para el medio ambiente, pero no creo que el gobierno hace suficiente.',
          content: 'Pienso que los coches eléctricos es muy importante para el medio ambiente, pero no creo que el gobierno hace suficiente.'
        },
        {
          role: 'assistant',
          displayText: '¡Muy buena postura equilibrada para un debate B2! Aquí tienes tu retroalimentación focalizada:\n\n**2 Strengths**\n1. Balanced argument structure contrasting *"Pienso que..."* (indicative for belief) with *"pero..."* to weigh policy limits.\n2. Accurate topic vocabulary (*coches eléctricos*, *medio ambiente*, *gobierno*) suited to B2 environmental policy.\n\n**2 Priority Fixes**\n1. **Subject-verb and adjective agreement in plural:** `"los coches eléctricos es muy importante"` → `"los coches eléctricos son muy importantes"` *(plural subject takes plural verb "son" and plural adjective "importantes").*\n2. **Subjunctive after negated belief:** `"no creo que el gobierno hace suficiente"` → `"no creo que el gobierno haga suficiente"` *(expressions of certainty like "estoy seguro de que" take indicative, whereas "no creo que" triggers present subjunctive).*\n\n**1 Retry Prompt**\nIntenta reformular tu respuesta en 1–2 frases usando **"son muy importantes"** y **"no creo que el gobierno haga suficiente"**, y si puedes añade un conector como **"sin embargo"** o **"por lo tanto"**.',
          text: '¡Muy buena postura equilibrada para un debate B2! Aquí tienes tu retroalimentación focalizada:\n\n**2 Strengths**\n1. Balanced argument structure contrasting *"Pienso que..."* (indicative for belief) with *"pero..."* to weigh policy limits.\n2. Accurate topic vocabulary (*coches eléctricos*, *medio ambiente*, *gobierno*) suited to B2 environmental policy.\n\n**2 Priority Fixes**\n1. **Subject-verb and adjective agreement in plural:** `"los coches eléctricos es muy importante"` → `"los coches eléctricos son muy importantes"` *(plural subject takes plural verb "son" and plural adjective "importantes").*\n2. **Subjunctive after negated belief:** `"no creo que el gobierno hace suficiente"` → `"no creo que el gobierno haga suficiente"` *(expressions of certainty like "estoy seguro de que" take indicative, whereas "no creo que" triggers present subjunctive).*\n\n**1 Retry Prompt**\nIntenta reformular tu respuesta en 1–2 frases usando **"son muy importantes"** y **"no creo que el gobierno haga suficiente"**, y si puedes añade un conector como **"sin embargo"** o **"por lo tanto"**.',
          content: '¡Muy buena postura equilibrada para un debate B2! Aquí tienes tu retroalimentación focalizada:\n\n**2 Strengths**\n1. Balanced argument structure contrasting *"Pienso que..."* (indicative for belief) with *"pero..."* to weigh policy limits.\n2. Accurate topic vocabulary (*coches eléctricos*, *medio ambiente*, *gobierno*) suited to B2 environmental policy.\n\n**2 Priority Fixes**\n1. **Subject-verb and adjective agreement in plural:** `"los coches eléctricos es muy importante"` → `"los coches eléctricos son muy importantes"` *(plural subject takes plural verb "son" and plural adjective "importantes").*\n2. **Subjunctive after negated belief:** `"no creo que el gobierno hace suficiente"` → `"no creo que el gobierno haga suficiente"` *(expressions of certainty like "estoy seguro de que" take indicative, whereas "no creo que" triggers present subjunctive).*\n\n**1 Retry Prompt**\nIntenta reformular tu respuesta en 1–2 frases usando **"son muy importantes"** y **"no creo que el gobierno haga suficiente"**, y si puedes añade un conector como **"sin embargo"** o **"por lo tanto"**.',
          state: {
            phase: 'feedback',
            brief: {
              targetLanguage: 'Spanish',
              goal: 'Defend a balanced stance on environmental policy and electric vehicles',
              level: 'B2',
              scenario: 'University Spanish B2 policy debate',
              timeMinutes: 10,
              feedbackFocus: 'Subjunctive vs. indicative and plural agreement'
            },
            feedback: {
              strengths: [
                'Clear balanced debate stance using "Pienso que..." and "pero..." to weigh policy trade-offs.',
                'Relevant B2 environmental policy vocabulary ("coches eléctricos", "medio ambiente", "gobierno").'
              ],
              priorityFixes: [
                {
                  original: 'los coches eléctricos es muy importante',
                  improved: 'los coches eléctricos son muy importantes',
                  note: 'Subject-verb and adjective agreement in plural [ES-B1-AGREE-02].'
                },
                {
                  original: 'no creo que el gobierno hace suficiente',
                  improved: 'no creo que el gobierno haga suficiente',
                  note: 'Use indicative after certainty ("estoy seguro de que" / "pienso que") and present subjunctive after negated belief ("no creo que") [ES-B2-SUBJ-01].'
                }
              ],
              retryPrompt: 'Retry your argument using "son muy importantes" and "no creo que el gobierno haga suficiente", optionally adding "sin embargo" or "por lo tanto".',
              assumptions: [
                'Text-based practice only — spoken Spanish pronunciation and intonation are not assessed.',
                'Feedback grounded in CEFR B2 / PCIC Spanish reference entries.'
              ]
            },
            revisedPlan: null,
            progress: {
              targetPhrasesUsed: 2,
              revisionsCount: 0,
              nextStep: 'Retry debate turn with plural agreement and subjunctive'
            },
            guardrailTriggered: null
          }
        }
      ],
      finalState: {
        phase: 'feedback',
        brief: {
          targetLanguage: 'Spanish',
          goal: 'Defend a balanced stance on environmental policy and electric vehicles',
          level: 'B2',
          scenario: 'University Spanish B2 policy debate',
          timeMinutes: 10,
          feedbackFocus: 'Subjunctive vs. indicative and plural agreement'
        },
        feedback: {
          strengths: [
            'Clear balanced debate stance using "Pienso que..." and "pero..." to weigh policy trade-offs.',
            'Relevant B2 environmental policy vocabulary ("coches eléctricos", "medio ambiente", "gobierno").'
          ],
          priorityFixes: [
            {
              original: 'los coches eléctricos es muy importante',
              improved: 'los coches eléctricos son muy importantes',
              note: 'Subject-verb and adjective agreement in plural [ES-B1-AGREE-02].'
            },
            {
              original: 'no creo que el gobierno hace suficiente',
              improved: 'no creo que el gobierno haga suficiente',
              note: 'Use indicative after certainty ("estoy seguro de que" / "pienso que") and present subjunctive after negated belief ("no creo que") [ES-B2-SUBJ-01].'
            }
          ],
          retryPrompt: 'Retry your argument using "son muy importantes" and "no creo que el gobierno haga suficiente", optionally adding "sin embargo" or "por lo tanto".',
          assumptions: [
            'Text-based practice only — spoken Spanish pronunciation and intonation are not assessed.',
            'Feedback grounded in CEFR B2 / PCIC Spanish reference entries.'
          ]
        },
        revisedPlan: null,
        progress: {
          targetPhrasesUsed: 2,
          revisionsCount: 0,
          nextStep: 'Retry debate turn with plural agreement and subjunctive'
        },
        guardrailTriggered: null
      }
    }
  ];

  // Extract only explicitly stated practice-brief details from learner text (never guess)
  function extractExplicitBrief(text, existingBrief) {
    const brief = cloneBrief(existingBrief);
    const lower = text.toLowerCase();

    if (/\b(?:spanish|español|espanol|coches el[eé]ctricos|medio ambiente|estoy seguro|no creo que)\b/i.test(text)) {
      brief.targetLanguage = 'Spanish';
    } else if (/\benglish\b/i.test(text)) {
      brief.targetLanguage = 'English';
    }

    const levelMatch = /\b(A2|B1|B2|C1)\b/i.exec(text);
    if (levelMatch) {
      brief.level = levelMatch[1].toUpperCase();
    }

    const timeMatch = /\b(\d{1,2})\s*[-\s]?min(?:ute)?s?\b/i.exec(text);
    if (timeMatch) {
      const mins = parseInt(timeMatch[1], 10);
      if (mins > 0 && mins <= 60) {
        // Prefer session window if both "8-minute window" and "2-minute seminar" appear
        const windowMatch = /\b(\d{1,2})\s*[-\s]?min(?:ute)?\s*(?:window|session|available|today|left)\b/i.exec(text) ||
          /\b(?:have|only have)\s+(\d{1,2})\s*min/i.exec(text);
        brief.timeMinutes = windowMatch ? parseInt(windowMatch[1], 10) : mins;
      }
    }

    if (/\bseminar\s+intro(?:duction)?\b/i.test(lower)) {
      brief.scenario = 'University seminar introduction';
      if (!brief.goal) brief.goal = 'Practise a concise seminar introduction';
    } else if (/\bjob\s+interview\b/i.test(lower)) {
      brief.scenario = 'Job interview';
      if (!brief.goal) brief.goal = 'Practise clear job interview answers';
    } else if (/\bq&a|audience\s+questions|nervous\s+about\s+questions\b/i.test(lower)) {
      brief.scenario = 'Seminar Q&A rehearsal';
      if (!brief.goal) brief.goal = 'Answer audience questions calmly';
    } else if (/\bdebate|pol[ií]tica|medio ambiente\b/i.test(lower)) {
      brief.scenario = 'Policy debate';
      if (!brief.goal) brief.goal = 'Express and defend a balanced opinion';
    }

    if (/\bclarity\s+and\s+grammar\b/i.test(lower)) {
      brief.feedbackFocus = 'Clarity and grammar';
    } else if (/\bgrammar\b/i.test(lower) && !brief.feedbackFocus) {
      brief.feedbackFocus = 'Grammar accuracy';
    } else if (/\bclarity\b/i.test(lower) && !brief.feedbackFocus) {
      brief.feedbackFocus = 'Clarity and structure';
    } else if (/\bfluency\b/i.test(lower) && !brief.feedbackFocus) {
      brief.feedbackFocus = 'Fluency and natural phrasing';
    }

    return brief;
  }

  function detectLanguageForRag(text, brief) {
    if (brief && brief.targetLanguage) return brief.targetLanguage;
    if (/\b(?:español|coches|el[eé]ctricos|medio ambiente|estoy seguro|no creo que|pienso que|gobierno|pol[ií]tica|muy importante)\b/i.test(text)) {
      return 'Spanish';
    }
    return 'English';
  }

  function isAcademicIntegrityRequest(text) {
    return (
      /\b(?:write|do|complete|draft|generate|finish)\s+(?:my|this|an?|the)\s+(?:[\d,]+\s*[-\s]?word\s+)?(?:assignment|essay|homework|term\s+paper|paper|report|dissertation|coursework|thesis|submission)\b/i.test(text) ||
      /\bso\s+i\s+can\s+submit\s+it\b/i.test(text) ||
      /\bwrite\b.*\bfor\s+me\b.*\bsubmit\b/i.test(text)
    );
  }

  function isUnrealisticTimelineRequest(text) {
    return (
      /\b(?:c1|c2|b2|fluent|native|ielts\s*[789](?:\.5)?|band\s*[789](?:\.5)?)\s+(?:in|within)\s+(?:1|2|3|one|two|three|a\s+few)\s+(?:days?|hours?|nights?)\b/i.test(text) ||
      /\bfluent\s+overnight\b/i.test(text) ||
      /\bguarantee\s+(?:that\s+)?(?:i\s+will\s+pass|a\s+pass|band|c1|c2|my\s+score|results?)\b/i.test(text)
    );
  }

  function isConstraintAdaptationRequest(text) {
    return (
      /\b(?:only\s+have\s+\d+\s*min|only\s+have\s+five\s+min|5\s*min(?:ute)?s?\s+and|less\s+time|short\s+on\s+time|shorter\s+session)\b/i.test(text) ||
      /\b(?:nervous|anxious|scared)\s+about\s+(?:questions|q&a|the\s+audience)\b/i.test(text)
    );
  }

  function isAmbiguousRequest(text, brief) {
    const trimmed = text.trim();
    const wordCount = trimmed.split(/\s+/).filter(Boolean).length;

    // If user explicitly provided a roleplay/practice utterance, not ambiguous
    if (/(?:here is my|in role-?play:|my research is|i read|i want to know|pienso que|estoy seguro|no creo que|los coches)/i.test(trimmed)) {
      return false;
    }

    if (/^(?:hi|hello|hey|hola|start|help|help me|help me improve(?: english| spanish)?|let['’]?s talk|i want to practise|i want to practice|practice english|practise english|practice spanish)\W*$/i.test(trimmed)) {
      return true;
    }

    if (wordCount <= 6 && !brief.scenario && !brief.level) {
      return true;
    }

    return false;
  }

  function buildFeedbackResponse(text, brief, ragHits, prevProgress) {
    const lang = detectLanguageForRag(text, brief);
    const isSpanish = lang === 'Spanish';
    const fixes = [];
    const strengths = [];

    // Inspect concrete, verifiable linguistic patterns
    if (/\b(?:know|wonder|ask|see)\s+it\s+is\b.*?\bor\s+not\b/i.test(text) || /\bit\s+is\s+helpful\s+or\s+not\b/i.test(text)) {
      fixes.push({
        original: 'I want to know it is helpful or not.',
        improved: 'I want to know whether it is helpful.',
        note: 'Use "whether" (or "if") after "know" to form an embedded yes/no question [EN-B1-EMBED-01].'
      });
    }

    if (/\bread\s+interesting\s+article\b/i.test(text)) {
      fixes.push({
        original: 'I read interesting article about climate change yesterday',
        improved: 'I read an interesting article about climate change yesterday',
        note: 'Singular countable nouns need an article—use "an" before the vowel sound in "interesting" [EN-A2-ART-02].'
      });
    } else if (/\b(?:have|give|prepare)\s+(?:seminar|presentation|interview)\b/i.test(text)) {
      const m = /\b((?:have|give|prepare)\s+(seminar|presentation|interview))\b/i.exec(text);
      if (m) {
        const noun = m[2].toLowerCase();
        const art = /^[aeiou]/.test(noun) ? 'an' : 'a';
        fixes.push({
          original: m[1],
          improved: m[1].replace(new RegExp(m[2] + '$', 'i'), art + ' ' + m[2]),
          note: 'Include an indefinite article ("a"/"an") before singular countable nouns [EN-A2-ART-02].'
        });
      }
    }

    if (/\bfor\s+study\b/i.test(text)) {
      fixes.push({
        original: 'use AI for study',
        improved: 'use AI for studying',
        note: 'Use a gerund ("for studying") or "to support their studies" for academic purpose [EN-B1-PREP-04].'
      });
    }

    if (/\blos\s+coches\s+el[eé]ctricos\s+es\s+muy\s+importante\b/i.test(text)) {
      fixes.push({
        original: 'los coches eléctricos es muy importante',
        improved: 'los coches eléctricos son muy importantes',
        note: 'Subject-verb and adjective agreement in plural ("son muy importantes") [ES-B1-AGREE-02].'
      });
    }

    if (/\bno\s+creo\s+que\b[^.!?]*\b(?:hace|es|son|tiene|puede)\b/i.test(text)) {
      const mSubj = /\b(no\s+creo\s+que\s+[^.!?]*\b(hace|es|son|tiene|puede)\b[^.!?]*)/i.exec(text);
      const mapSubj = { hace: 'haga', es: 'sea', son: 'sean', tiene: 'tenga', puede: 'pueda' };
      const origVerb = mSubj ? mSubj[2].toLowerCase() : 'hace';
      const origClause = mSubj ? mSubj[1].trim() : 'no creo que el gobierno hace suficiente';
      const fixedClause = origClause.replace(new RegExp('\\b' + origVerb + '\\b', 'i'), mapSubj[origVerb] || 'haga');
      fixes.push({
        original: origClause,
        improved: fixedClause,
        note: 'Negated belief ("no creo que") triggers present subjunctive, whereas certainty ("estoy seguro de que") takes indicative [ES-B2-SUBJ-01].'
      });
    }

    const detectedErrorsCount = fixes.length;

    // Check if this turn looks like a successful retry already containing corrected forms
    const isSuccessfulRetry =
      /\bwhether\s+it\s+is\s+helpful\b/i.test(text) ||
      /\ban\s+interesting\s+article\b/i.test(text) ||
      /\bson\s+muy\s+importantes\b/i.test(text);

    // Supplement to always provide 2 grounded priority fixes
    if (fixes.length < 2) {
      if (isSpanish) {
        if (fixes.length === 0) {
          fixes.push({
            original: text.slice(0, 90),
            improved: 'Desde mi punto de vista, ' + text.slice(0, 75),
            note: 'Frame B2 policy arguments with a formal stance marker ("Desde mi punto de vista...") [ES-B2-OPIN-06].'
          });
        }
        if (fixes.length < 2) {
          fixes.push({
            original: 'Adding a logical transition between points',
            improved: 'Use "sin embargo" (contrast) or "por lo tanto" (consequence) to link clauses.',
            note: 'Explicit discourse connectors raise B2 coherence in policy debate [ES-B2-CONN-05].'
          });
        }
      } else {
        if (fixes.length === 0) {
          fixes.push({
            original: 'Opening directly without signposting',
            improved: 'Today I will briefly share... First, I will outline...',
            note: 'Adding one short signposting cue helps seminar listeners track your structure [EN-B1-SIGN-05].'
          });
        }
        if (fixes.length < 2) {
          fixes.push({
            original: 'Stating a claim without a brief example',
            improved: 'Add "for instance, ..." or "because ..." in one short follow-up clause.',
            note: 'Pairing a point with one reason or example improves spoken clarity [EN-B1-REASON-08].'
          });
        }
      }
    }

    const priorityFixes = fixes.slice(0, 2);

    if (isSpanish) {
      strengths.push('Clear communicative stance with relevant Spanish topic vocabulary.');
      strengths.push('Concise turn length that keeps the debate interactive and easy to follow.');
    } else {
      strengths.push('Clear core message—your listener immediately understands your topic and question.');
      strengths.push('Concise, well-paced turn length suited to interactive speaking practice.');
    }

    const retryPrompt = isSpanish
      ? 'Try rewriting your 1–2 sentences incorporating "' + priorityFixes[0].improved + '"' +
        (priorityFixes[1] && priorityFixes[1].improved.length < 70 ? ' and "' + priorityFixes[1].improved + '".' : '.')
      : 'Retry your sentence in one short turn applying "' + priorityFixes[0].improved + '"' +
        (priorityFixes[1] && priorityFixes[1].improved.length < 70 ? ' and "' + priorityFixes[1].improved + '".' : '.');

    const assumptions = [
      'Text-based practice only — spoken pronunciation, pacing, and intonation cannot be assessed here.',
      'Offline sandbox feedback grounded in retrieved CEFR/PCIC reference entries (not an official score).'
    ];

    const prevRevs = prevProgress && typeof prevProgress.revisionsCount === 'number' ? prevProgress.revisionsCount : 0;
    const prevPhrases = prevProgress && typeof prevProgress.targetPhrasesUsed === 'number' ? prevProgress.targetPhrasesUsed : 0;

    if (isSuccessfulRetry && detectedErrorsCount === 0) {
      const display = isSpanish
        ? '¡Excelente revisión! Aplicaste las correcciones con naturalidad y claridad.\n\n**Next step:** Ready to answer one follow-up counter-argument in role-play?'
        : 'Great revision! You applied the target structure cleanly and your phrasing sounds much more natural.\n\n**Progress:** ' + (prevPhrases + 2) + ' target phrases used · ' + (prevRevs + 1) + ' revision · **Next:** answer one audience question.';

      return {
        displayText: display,
        state: {
          phase: 'reflect',
          brief: brief,
          feedback: {
            strengths: strengths,
            priorityFixes: priorityFixes,
            retryPrompt: 'Ready for one short follow-up question in role-play?',
            assumptions: assumptions
          },
          revisedPlan: null,
          progress: {
            targetPhrasesUsed: prevPhrases + 2,
            revisionsCount: prevRevs + 1,
            nextStep: 'answer one audience question'
          },
          guardrailTriggered: null
        }
      };
    }

    const introLine = brief.level && brief.timeMinutes
      ? 'Got your **' + brief.level + ' ' + lang + '** practice brief (' + brief.timeMinutes + ' min' + (brief.feedbackFocus ? ', focus: ' + brief.feedbackFocus : '') + '). Here is targeted feedback on your turn:'
      : 'Nice effort—here is targeted feedback on your turn:';

    const displayText = [
      introLine,
      '',
      '**2 Strengths**',
      '1. ' + strengths[0],
      '2. ' + strengths[1],
      '',
      '**2 Priority Fixes**',
      '1. `' + priorityFixes[0].original + '` → **"' + priorityFixes[0].improved + '"** — ' + priorityFixes[0].note,
      '2. `' + priorityFixes[1].original + '` → **"' + priorityFixes[1].improved + '"** — ' + priorityFixes[1].note,
      '',
      '**1 Retry Prompt**',
      retryPrompt,
      '',
      '*Note: Text-based practice only—I cannot assess spoken pronunciation or award official CEFR/IELTS scores.*'
    ].join('\n');

    return {
      displayText: displayText,
      state: {
        phase: 'feedback',
        brief: brief,
        feedback: {
          strengths: strengths,
          priorityFixes: priorityFixes,
          retryPrompt: retryPrompt,
          assumptions: assumptions
        },
        revisedPlan: null,
        progress: {
          targetPhrasesUsed: Math.max(prevPhrases, 1),
          revisionsCount: prevRevs,
          nextStep: 'Retry one revised response using the two priority fixes'
        },
        guardrailTriggered: null
      }
    };
  }

  function getOfflineSimulatedReply(userText, appState) {
    const rawUserText = String(userText == null ? '' : userText);
    const stateIn = appState || {};
    const piiMod = getPII();
    const ragMod = getRAG();

    const piiScan = piiMod
      ? piiMod.scan(rawUserText)
      : { hasPII: false, findings: [], redactedText: rawUserText, hasDistressSignal: false, distressMatches: [] };

    const safeText = piiScan.hasPII ? piiScan.redactedText : rawUserText;
    const brief = extractExplicitBrief(safeText, stateIn.brief);
    const detectedLang = detectLanguageForRag(safeText, brief);
    const prevProgress = stateIn.progress || { targetPhrasesUsed: 0, revisionsCount: 0, nextStep: '' };

    let displayText = '';
    let nextState = null;
    let ragHits = [];

    // 1. Emotional Distress Guardrail (highest priority)
    if (piiScan.hasDistressSignal) {
      ragHits = ragMod
        ? ragMod.retrieve('emotional distress overwhelmed pause low-stakes affective filter', { language: 'General', topK: 2 })
        : ragByIds(['GEN-PED-AFF-02']);

      const urgentSelfHarm = /\b(?:hurt\s+myself|harm\s+myself|self[-\s]?harm|suicidal|kill\s+myself|end\s+my\s+life|hacerme\s+da[ñn]o|suicida)\b/i.test(rawUserText);

      displayText = [
        'Let’s pause the practice right here—there is zero rush and no pressure at all.',
        '',
        'Feeling overwhelmed or freezing up when speaking another language is really tough, and you do not have to push through it alone. You are not failing; speaking anxiety happens to many university learners.',
        '',
        urgentSelfHarm
          ? 'Because you mentioned feeling unsafe or wanting to hurt yourself, please reach out right away to a trusted person, your university campus counselling / student support services, or local emergency support (in Hong Kong, Samaritans 24-hour hotline: 2389 2222 / emergency: 999).'
          : 'It can really help to step back and talk with someone supportive—such as your course teacher, a trusted peer, or your university campus counselling and student support services.',
        '',
        'We can stop completely for today, or whenever you feel ready later we can try one tiny, zero-pressure step together. Take care of yourself first.'
      ].join('\n');

      nextState = {
        phase: 'support',
        brief: brief,
        feedback: null,
        revisedPlan: null,
        progress: {
          targetPhrasesUsed: prevProgress.targetPhrasesUsed || 0,
          revisionsCount: prevProgress.revisionsCount || 0,
          nextStep: 'Paused for learner wellbeing — resume only when ready'
        },
        guardrailTriggered: 'distress'
      };
    }
    // 2. Academic Integrity Guardrail
    else if (isAcademicIntegrityRequest(safeText)) {
      ragHits = ragMod
        ? ragMod.retrieve('academic integrity assignment essay submission refusal', { language: 'General', topK: 2 })
        : ragByIds(['GEN-PED-INTEG-04']);

      displayText = [
        'I cannot write or complete an assignment or essay for submission—as a language-practice partner, I need to respect academic integrity and keep your coursework genuinely yours.',
        '',
        'What I *can* do is help you build confidence with your own ideas! For example, we can:',
        '- Practise pitching your main argument on AI in education in 2–3 spoken sentences, or',
        '- Review a short paragraph from **your own draft** for clarity, academic tone, and grammar.',
        '',
        'Would you like to share your main thesis idea in 1–2 sentences so we can practise refining it together?'
      ].join('\n');

      nextState = {
        phase: 'refusal',
        brief: brief,
        feedback: null,
        revisedPlan: null,
        progress: {
          targetPhrasesUsed: prevProgress.targetPhrasesUsed || 0,
          revisionsCount: prevProgress.revisionsCount || 0,
          nextStep: 'Practise expressing learner’s own thesis or draft'
        },
        guardrailTriggered: 'academic_integrity'
      };
    }
    // 3. Privacy / PII Guardrail (never repeat detected PII!)
    else if (piiScan.hasPII) {
      ragHits = ragMod
        ? ragMod.retrieve(safeText, { language: detectedLang, level: brief.level || undefined, topK: 2 })
        : ragByIds(['EN-B1-INTERVIEW-10']);

      const scenarioText = brief.scenario
        ? 'for your **' + brief.scenario + '**'
        : 'on your speaking goal';

      displayText = [
        'Quick privacy reminder: please avoid sharing personal data such as your real name, student ID, email, or phone number here—we do not need personal details to practise safely, so I will continue without repeating them.',
        '',
        'I’d be happy to help you practise ' + (brief.targetLanguage || 'English') + ' ' + scenarioText + '! Before we start role-play, what is your self-rated level (A2, B1, B2, or C1) and how many minutes do you have today?'
      ].join('\n');

      nextState = {
        phase: 'clarify',
        brief: brief,
        feedback: null,
        revisedPlan: null,
        progress: {
          targetPhrasesUsed: prevProgress.targetPhrasesUsed || 0,
          revisionsCount: prevProgress.revisionsCount || 0,
          nextStep: 'Confirm level & time safely without personal data'
        },
        guardrailTriggered: 'privacy'
      };
    }
    // 4. Unrealistic Timeline / Guaranteed Score Guardrail
    else if (isUnrealisticTimelineRequest(safeText)) {
      ragHits = ragMod
        ? ragMod.retrieve('CEFR timeline realistic exam C1 level', { language: 'General', topK: 2 })
        : ragByIds(['GEN-PED-CEFR-03']);

      displayText = [
        'I want to be completely honest with you: reaching **C1 in two days is not realistic**, and as a text-based practice partner (not an official assessor), I **cannot guarantee** that you will pass an exam or estimate an official CEFR/IELTS score.',
        '',
        'Moving up a full CEFR level takes sustained guided practice over months. However, we *can* make the next two days count with a realistic, high-impact step—such as a short diagnostic check and focused rehearsal on your highest-priority speaking task.',
        '',
        'Which specific speaking task or question format do you have to face in two days?'
      ].join('\n');

      nextState = {
        phase: 'clarify',
        brief: brief,
        feedback: null,
        revisedPlan: null,
        progress: {
          targetPhrasesUsed: prevProgress.targetPhrasesUsed || 0,
          revisionsCount: prevProgress.revisionsCount || 0,
          nextStep: 'Identify highest-priority speaking task for realistic short-term rehearsal'
        },
        guardrailTriggered: 'unrealistic_timeline'
      };
    }
    // 5. Dynamic Constraint Adaptation
    else if (isConstraintAdaptationRequest(safeText)) {
      ragHits = ragMod
        ? ragMod.retrieve('nervous questions Q&A rehearsal affective filter', { language: detectedLang, level: brief.level || 'B1', topK: 3 })
        : ragByIds(['EN-B1-QA-07', 'GEN-PED-AFF-02']);

      const mins = brief.timeMinutes && brief.timeMinutes <= 10 ? brief.timeMinutes : 5;
      brief.timeMinutes = mins;
      brief.scenario = mins + '-minute seminar Q&A rehearsal';
      brief.feedbackFocus = 'Calm Q&A transitions and concise answers';
      if (!brief.targetLanguage) brief.targetLanguage = detectedLang;

      const revisedPlan = [
        { time: '1 min', activity: 'Goal & confidence check' },
        { time: Math.max(1, mins - 2) + ' min', activity: 'Two-question Q&A rehearsal' },
        { time: '1 min', activity: 'Feedback & retry' }
      ];

      displayText = [
        'No problem at all—let’s adapt right away so it feels manageable and low-pressure. Here is our revised **' + mins + '-minute Q&A rehearsal**:',
        '',
        '- **' + revisedPlan[0].time + ':** ' + revisedPlan[0].activity,
        '- **' + revisedPlan[1].time + ':** ' + revisedPlan[1].activity,
        '- **' + revisedPlan[2].time + ':** ' + revisedPlan[2].activity,
        '',
        'Try opening with a calm phrase to buy thinking time: *"That’s a great question—from what I’ve observed so far..."*',
        '',
        '*(Question 1 of 2)*: **What is one main reason your topic matters to students today?**'
      ].join('\n');

      nextState = {
        phase: 'adapt',
        brief: brief,
        feedback: null,
        revisedPlan: revisedPlan,
        progress: {
          targetPhrasesUsed: prevProgress.targetPhrasesUsed || 0,
          revisionsCount: prevProgress.revisionsCount || 0,
          nextStep: 'Answer Q&A Question 1 using a thinking-time starter'
        },
        guardrailTriggered: null
      };
    }
    // 6. Ambiguous / Under-specified Request
    else if (isAmbiguousRequest(safeText, brief)) {
      ragHits = ragMod
        ? ragMod.retrieve('CEFR action-oriented brief goal level', { language: detectedLang, topK: 2 })
        : ragByIds(['GEN-PED-CEFR-03']);

      const langLabel = brief.targetLanguage || 'your target language';
      displayText = 'I’d be glad to help you practise ' + langLabel + '! So I don’t guess your needs, what specific speaking situation would you like to work on today (for example, a seminar introduction, Q&A, or a job interview)?';

      nextState = {
        phase: 'clarify',
        brief: brief,
        feedback: null,
        revisedPlan: null,
        progress: {
          targetPhrasesUsed: prevProgress.targetPhrasesUsed || 0,
          revisionsCount: prevProgress.revisionsCount || 0,
          nextStep: 'Clarify speaking scenario before confirming Practice Brief'
        },
        guardrailTriggered: null
      };
    }
    // 6b. Explicit Practice Brief Confirmation / Start Role-Play Request
    else if (/(?:confirm\s+this\s+practice\s+brief|start\s+(?:the\s+)?role-?play|let['’]?s\s+debate)/i.test(safeText)) {
      const isEs = detectedLang === 'Spanish';
      ragHits = ragMod
        ? ragMod.retrieve(
            isEs ? 'debate opinión política ambiental coches eléctricos' : (brief.scenario || 'seminar introduction opening'),
            { language: detectedLang, level: brief.level || (isEs ? 'B2' : 'B1'), topK: 2 }
          )
        : ragByIds(isEs ? ['ES-B2-OPIN-06', 'ES-B2-SUBJ-01'] : ['EN-B1-INTRO-03', 'EN-B1-SIGN-05']);

      if (isEs) {
        if (!brief.targetLanguage) brief.targetLanguage = 'Spanish';
        if (!brief.level) brief.level = 'B2';
        if (!brief.scenario) brief.scenario = 'Environmental policy debate';
        displayText =
          '¡Perfecto! Breve confirmado (**Spanish · ' + brief.level + '**). Empecemos el juego de rol.\n\n' +
          '*(En el papel de compañero de debate)* **Estoy seguro de que** las ciudades necesitan políticas más estrictas contra la contaminación, pero **no creo que** prohibir los coches de gasolina de inmediato sea realista. ¿Cuál es tu postura sobre los coches eléctricos?';
      } else {
        if (!brief.targetLanguage) brief.targetLanguage = 'English';
        if (!brief.level) brief.level = 'B1';
        if (!brief.scenario) brief.scenario = 'University seminar introduction';
        displayText =
          'Practice Brief confirmed (**' + brief.targetLanguage + ' · ' + brief.level + '**' +
          (brief.timeMinutes ? ' · ' + brief.timeMinutes + ' min' : '') + '). Let’s begin the role-play!\n\n' +
          '*(In role as a friendly classmate in your ' + brief.scenario.toLowerCase() + ')*: **Welcome! Go ahead and introduce your topic in 2–3 sentences, and tell us what main question you want to explore.**';
      }

      nextState = {
        phase: 'roleplay',
        brief: brief,
        feedback: null,
        revisedPlan: null,
        progress: {
          targetPhrasesUsed: prevProgress.targetPhrasesUsed || 0,
          revisionsCount: prevProgress.revisionsCount || 0,
          nextStep: isEs
            ? 'Reply in Spanish with 1–2 debate sentences for targeted feedback'
            : 'Reply with 2–3 opening sentences for targeted feedback'
        },
        guardrailTriggered: null
      };
    }
    // 7. Substantive Practice Turn -> RAG-grounded Targeted Feedback
    else {
      ragHits = ragMod
        ? ragMod.retrieve(safeText, { language: detectedLang, level: brief.level || undefined, topK: 3 })
        : [];
      const built = buildFeedbackResponse(safeText, brief, ragHits, prevProgress);
      displayText = built.displayText;
      nextState = built.state;
    }

    const rawText = buildRawWithState(displayText, nextState);

    return {
      rawText: rawText,
      displayText: displayText,
      state: nextState,
      ragHits: ragHits,
      piiScan: piiScan,
      simulated: true
    };
  }

  function getScenario(id) {
    return SCENARIOS.find(function (s) { return s.id === id; }) || null;
  }

  LC.Demos = {
    SCENARIOS: SCENARIOS,
    getScenario: getScenario,
    getOfflineSimulatedReply: getOfflineSimulatedReply
  };

  if (typeof module !== 'undefined' && module.exports) {
    module.exports = LC.Demos;
  }
})(typeof window !== 'undefined' ? window : globalThis);
