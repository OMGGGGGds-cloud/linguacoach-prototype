(function (root) {
  'use strict';

  const LC = (root.LinguaCoach = root.LinguaCoach || {});

  const CORE_SYSTEM_PROMPT = [
    'You are LinguaCoach, a scoped, text-based conversational language-practice partner for university students (CCC8015 prototype).',
    'Core identity: You are a supportive practice partner, NOT an official assessor, grader, or ghostwriter.',
    '',
    '## 8-Step Practice Loop',
    '1. Goal & Context: Invite or receive the learner’s communication goal and context.',
    '2. Clarify Gently: If key details are missing, ask ONE short diagnostic question at a time. Never guess unconfirmed facts.',
    '3. Confirm Practice Brief: Before starting role-play, confirm the Practice Brief — target language, speaking goal, self-rated CEFR level (A2/B1/B2/C1), scenario, available time (minutes), and feedback focus.',
    '4. Short Role-Play: Run a concise, realistic role-play ONE turn at a time, staying in role with level-appropriate language.',
    '5. Targeted Feedback: After the learner’s turn, give focused, actionable feedback containing:',
    '   - 2 concrete strengths,',
    '   - 2 priority fixes with concrete original -> improved examples (avoid overwhelming lists),',
    '   - 1 clear retry prompt.',
    '6. Focused Retry: Let the learner retry ONE revised response to consolidate uptake.',
    '7. Brief Reflection & Next Step: Acknowledge concrete improvement and propose one clear next step.',
    '8. Dynamic Adaptation: If constraints change (less time, anxiety, difficulty), immediately adapt the task type and provide a revised short time plan.',
    '',
    '## Mandatory Guardrails',
    '1. One question at a time: Ask at most one short diagnostic question per turn; never invent or assume unconfirmed learner details.',
    '2. No fake scores or impossible promises: Never invent official CEFR, IELTS, TOEFL, or proficiency scores, and never guarantee exam outcomes. If asked for unrealistic timelines (e.g., reaching C1 in 2 days), explain honestly why that is not realistic and offer a focused diagnostic or practical preparation step.',
    '3. Academic integrity: Never write graded assignments, essays, or coursework for direct submission. Refuse politely without lecturing and offer legitimate language practice on the learner’s own ideas, outline, or short draft.',
    '4. Privacy & data minimization: Never ask for real names, student IDs, phone numbers, emails, or personal identifiers. If the learner shares personal data, remind them not to share personal data and continue safely WITHOUT repeating or echoing the personal data.',
    '5. Emotional safety & distress: If the learner expresses distress, hopelessness, panic, or self-harm risk, IMMEDIATELY pause role-play, respond with warmth and zero shaming or performance pressure, and suggest appropriate human support (their teacher/instructor, a trusted peer, or university campus counselling / student support services).',
    '6. Grounded explanations & transparency: Ground grammar and usage advice in any retrieved reference rules provided below. State assumptions and limitations transparently (this is text-based practice only — spoken pronunciation, accent, and pacing cannot be scored).'
  ].join('\n');

  const STATE_BLOCK_INSTRUCTIONS = [
    '## Conversational Style & Structured State Block',
    '- Keep conversational replies warm, concise, and easy to scan (no walls of text).',
    '- At the very end of your response, append a fenced JSON metadata block using the exact tag `linguacoach-state` so the practice dashboard stays synchronized:',
    '```linguacoach-state',
    '{',
    '  "phase": "clarify|confirm|roleplay|feedback|retry|reflect|adapt|refusal|support",',
    '  "brief": { "targetLanguage": "", "goal": "", "level": "", "scenario": "", "timeMinutes": null, "feedbackFocus": "" },',
    '  "feedback": { "strengths": [], "priorityFixes": [{ "original": "", "improved": "", "note": "" }], "retryPrompt": "", "assumptions": [] },',
    '  "revisedPlan": [{ "time": "", "activity": "" }],',
    '  "progress": { "targetPhrasesUsed": 0, "revisionsCount": 0, "nextStep": "" },',
    '  "guardrailTriggered": null',
    '}',
    '```',
    '- Set `"feedback"` to `null` when you are not giving turn feedback; set `"revisedPlan"` to `null` unless adapting time/task constraints.',
    '- Set `"guardrailTriggered"` to `null`, or one of `"academic_integrity"`, `"privacy"`, `"unrealistic_timeline"`, `"distress"`.',
    '- Output valid JSON with double quotes and no trailing commas inside the `linguacoach-state` block.'
  ].join('\n');

  function formatBriefSection(brief, phase) {
    const b = brief || {};
    const lines = [
      '## Current Session State',
      '- Current loop phase: ' + (phase || 'clarify'),
      '- Target language: ' + (b.targetLanguage || '(not confirmed yet)'),
      '- Speaking goal: ' + (b.goal || '(not confirmed yet)'),
      '- Self-rated level: ' + (b.level || '(not confirmed yet)'),
      '- Scenario: ' + (b.scenario || '(not confirmed yet)'),
      '- Available time: ' + (b.timeMinutes != null && b.timeMinutes !== '' ? b.timeMinutes + ' min' : '(not confirmed yet)'),
      '- Feedback focus: ' + (b.feedbackFocus || '(not confirmed yet)')
    ];
    return lines.join('\n');
  }

  function formatRagSection(ragHits) {
    if (!Array.isArray(ragHits) || ragHits.length === 0) return '';
    const lines = ['## Retrieved Syllabus & Grammar References (Ground feedback in these when relevant)'];
    for (let i = 0; i < ragHits.length; i++) {
      const hit = ragHits[i];
      const item = hit && hit.item ? hit.item : hit;
      if (!item || !item.topic) continue;
      lines.push(
        '- [' + (item.id || 'REF') + '] ' + item.topic +
        ' (' + (item.language || 'General') + ', ' + (item.level || 'All') + '): ' +
        (item.rule || '') +
        (item.exampleWrong && item.exampleRight
          ? ' | Example: "' + item.exampleWrong + '" -> "' + item.exampleRight + '"'
          : '') +
        (item.source ? ' [Source: ' + item.source + ']' : '')
      );
    }
    return lines.length > 1 ? lines.join('\n') : '';
  }

  function formatGuardrailHints(guardrailHints) {
    if (!guardrailHints) return '';
    const items = [];

    if (typeof guardrailHints === 'string' && guardrailHints.trim()) {
      items.push(guardrailHints.trim());
    } else if (Array.isArray(guardrailHints)) {
      for (let i = 0; i < guardrailHints.length; i++) {
        const hint = String(guardrailHints[i] || '').trim();
        if (hint) items.push(hint);
      }
    } else if (typeof guardrailHints === 'object') {
      if (guardrailHints.piiDetected || guardrailHints.hasPII) {
        items.push(
          'PRIVACY ALERT: The learner message contained personal data (which may have been redacted). Gently remind them not to share names, student IDs, emails, or phone numbers, do NOT repeat any personal details, and continue helping safely.'
        );
      }
      if (guardrailHints.distressDetected || guardrailHints.hasDistressSignal) {
        items.push(
          'DISTRESS ALERT: Emotional distress or hopelessness signals were detected. IMMEDIATELY pause role-play, respond warmly with zero pressure or shaming, and suggest speaking with a teacher, trusted peer, or university campus counselling services.'
        );
      }
      if (Array.isArray(guardrailHints.notes)) {
        for (let i = 0; i < guardrailHints.notes.length; i++) {
          const note = String(guardrailHints.notes[i] || '').trim();
          if (note) items.push(note);
        }
      }
    }

    if (!items.length) return '';
    return '## Pre-Flight Guardrail Alerts\n' + items.map(function (h) { return '- ' + h; }).join('\n');
  }

  function buildSystemPrompt(options) {
    const opts = options || {};
    const sections = [
      CORE_SYSTEM_PROMPT,
      formatBriefSection(opts.brief, opts.phase),
      formatRagSection(opts.ragHits),
      formatGuardrailHints(opts.guardrailHints),
      STATE_BLOCK_INSTRUCTIONS
    ].filter(Boolean);

    return sections.join('\n\n');
  }

  function tryParseRelaxedJson(rawJson) {
    if (typeof rawJson !== 'string') return null;
    const trimmed = rawJson.trim();
    if (!trimmed) return null;

    // 1. Direct strict parse
    try {
      const parsed = JSON.parse(trimmed);
      return parsed && typeof parsed === 'object' ? parsed : null;
    } catch (_e1) {
      // continue to relaxed cleanup
    }

    // 2. Isolate outermost { ... } and remove trailing commas / single-line comments
    const firstBrace = trimmed.indexOf('{');
    const lastBrace = trimmed.lastIndexOf('}');
    if (firstBrace === -1 || lastBrace <= firstBrace) return null;

    let candidate = trimmed.slice(firstBrace, lastBrace + 1);
    candidate = candidate
      .replace(/,\s*([}\]])/g, '$1')
      .replace(/^\s*\/\/.*$/gm, '');

    try {
      const parsed = JSON.parse(candidate);
      return parsed && typeof parsed === 'object' ? parsed : null;
    } catch (_e2) {
      return null;
    }
  }

  function looksLikeCoachState(obj) {
    if (!obj || typeof obj !== 'object' || Array.isArray(obj)) return false;
    return (
      'phase' in obj ||
      'brief' in obj ||
      'feedback' in obj ||
      'revisedPlan' in obj ||
      'progress' in obj ||
      'guardrailTriggered' in obj
    );
  }

  function coerceToRawText(input) {
    if (typeof input === 'string') return input;
    if (input && typeof input === 'object') {
      if (typeof input.rawText === 'string') return input.rawText;
      if (typeof input.content === 'string') return input.content;
      if (typeof input.text === 'string') return input.text;
      if (typeof input.displayText === 'string') return input.displayText;
    }
    return '';
  }

  function parseCoachResponse(rawInput) {
    const rawText = coerceToRawText(rawInput);
    if (!rawText) {
      return { displayText: '', state: null };
    }

    // 1. Match complete ```linguacoach-state ... ``` fence (prefer the last occurrence)
    const namedFenceRe = /```[ \t]*linguacoach-state[ \t]*\r?\n([\s\S]*?)```/gi;
    let lastMatch = null;
    let m;
    while ((m = namedFenceRe.exec(rawText)) !== null) {
      lastMatch = m;
    }

    if (lastMatch) {
      const state = tryParseRelaxedJson(lastMatch[1]);
      const before = rawText.slice(0, lastMatch.index);
      const after = rawText.slice(lastMatch.index + lastMatch[0].length);
      const displayText = (before + after).replace(/\n{3,}/g, '\n\n').trim();
      return { displayText: displayText, state: state };
    }

    // 2. Match unclosed/incomplete ```linguacoach-state fence at end of output
    const unclosedNamedRe = /```[ \t]*linguacoach-state[ \t]*(?:\r?\n([\s\S]*))?$/i;
    const unclosedMatch = unclosedNamedRe.exec(rawText);
    if (unclosedMatch) {
      const state = unclosedMatch[1] ? tryParseRelaxedJson(unclosedMatch[1]) : null;
      const displayText = rawText.slice(0, unclosedMatch.index).trim();
      return { displayText: displayText, state: state };
    }

    // 3. Fallback: trailing ```json ... ``` or ``` ... ``` block containing state keys
    const trailingJsonRe = /```[ \t]*(?:json)?[ \t]*\r?\n([\s\S]*?)```[ \t]*$/i;
    const trailingMatch = trailingJsonRe.exec(rawText);
    if (trailingMatch) {
      const candidate = tryParseRelaxedJson(trailingMatch[1]);
      if (looksLikeCoachState(candidate)) {
        const displayText = rawText.slice(0, trailingMatch.index).trim();
        return { displayText: displayText, state: candidate };
      }
    }

    return { displayText: rawText.trim(), state: null };
  }

  function stripStateBlockForStreaming(partialInput) {
    const text = coerceToRawText(partialInput);
    if (!text) return '';

    // 1. Strip from the start of any ```linguacoach-state block (complete or streaming)
    const namedIdx = text.search(/```[ \t]*linguacoach-state\b/i);
    if (namedIdx !== -1) {
      return text.slice(0, namedIdx).trimEnd();
    }

    // 2. Strip a trailing ```json block that already shows state keys
    const jsonFenceMatch = /```[ \t]*json[ \t]*\r?\n([\s\S]*)$/i.exec(text);
    if (jsonFenceMatch) {
      const body = jsonFenceMatch[1];
      if (/"(?:phase|brief|feedback|revisedPlan|guardrailTriggered)"/.test(body) || /^\s*\{\s*$/.test(body)) {
        return text.slice(0, jsonFenceMatch.index).trimEnd();
      }
    }

    // 3. Hide partial opening fence prefix at the very end while tokens arrive (e.g., "```", "```lin", "```linguacoach-")
    const tailFenceMatch = /(?:^|\r?\n)[ \t]*(```[ \t]*[a-z-]*)$/i.exec(text);
    if (tailFenceMatch) {
      const fenceText = tailFenceMatch[1].replace(/^```[ \t]*/, '').toLowerCase();
      const targetTag = 'linguacoach-state';
      if (
        fenceText === '' ||
        targetTag.indexOf(fenceText) === 0 ||
        'json'.indexOf(fenceText) === 0
      ) {
        const cutAt = tailFenceMatch.index;
        return text.slice(0, cutAt).trimEnd();
      }
    }

    // 4. Also hide 1-2 trailing backticks on a brand-new line while triple backticks are still forming
    const partialTicksMatch = /(?:^|\r?\n)[ \t]*`{1,2}$/.exec(text);
    if (partialTicksMatch) {
      return text.slice(0, partialTicksMatch.index).trimEnd();
    }

    return text;
  }

  LC.Prompt = {
    CORE_SYSTEM_PROMPT: CORE_SYSTEM_PROMPT,
    buildSystemPrompt: buildSystemPrompt,
    parseCoachResponse: parseCoachResponse,
    stripStateBlockForStreaming: stripStateBlockForStreaming
  };

  if (typeof module !== 'undefined' && module.exports) {
    module.exports = LC.Prompt;
  }
})(typeof window !== 'undefined' ? window : globalThis);
