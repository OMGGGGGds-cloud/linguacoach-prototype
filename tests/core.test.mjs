import test from 'node:test';
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);

// Load modules in browser script-load order and verify globalThis.LinguaCoach attachment too
const KB = require('../js/kb.js');
const RAG = require('../js/rag.js');
const PII = require('../js/pii.js');
const Prompt = require('../js/prompt.js');
const LLM = require('../js/llm.js');
const Demos = require('../js/demos.js');
const Tests = require('../js/tests.js');

test('globalThis.LinguaCoach attaches all core modules cleanly', () => {
  assert.ok(globalThis.LinguaCoach);
  assert.equal(globalThis.LinguaCoach.KB, KB);
  assert.equal(globalThis.LinguaCoach.RAG, RAG);
  assert.equal(globalThis.LinguaCoach.PII, PII);
  assert.equal(globalThis.LinguaCoach.Prompt, Prompt);
  assert.equal(globalThis.LinguaCoach.LLM, LLM);
  assert.equal(globalThis.LinguaCoach.Demos, Demos);
  assert.equal(globalThis.LinguaCoach.Tests, Tests);
});

test('KB integrity: 18-22 entries, required fields, languages, no duplicate IDs', () => {
  assert.ok(Array.isArray(KB));
  assert.ok(KB.length >= 18 && KB.length <= 22, `Expected 18-22 KB entries, got ${KB.length}`);

  const seenIds = new Set();
  const validLanguages = new Set(['English', 'Spanish', 'General']);
  const validLevels = new Set(['A2', 'B1', 'B2', 'C1', 'All']);
  const foundLanguages = new Set();

  for (const entry of KB) {
    assert.ok(entry.id && typeof entry.id === 'string');
    assert.ok(!seenIds.has(entry.id), `Duplicate KB id: ${entry.id}`);
    seenIds.add(entry.id);

    assert.ok(validLanguages.has(entry.language), `Unexpected language: ${entry.language}`);
    foundLanguages.add(entry.language);

    assert.ok(validLevels.has(entry.level), `Unexpected level: ${entry.level}`);
    assert.ok(typeof entry.topic === 'string' && entry.topic.length > 0);
    assert.ok(Array.isArray(entry.tags) && entry.tags.length > 0);
    assert.ok(typeof entry.rule === 'string' && entry.rule.length > 0);
    assert.ok(typeof entry.exampleWrong === 'string' && entry.exampleWrong.length > 0);
    assert.ok(typeof entry.exampleRight === 'string' && entry.exampleRight.length > 0);
    assert.ok(typeof entry.source === 'string' && entry.source.length > 0);
  }

  assert.ok(foundLanguages.has('English'));
  assert.ok(foundLanguages.has('Spanish'));
  assert.ok(foundLanguages.has('General'));
});

test('RAG.retrieve matches embedded "whether" rule for English seminar sentence', () => {
  const hits = RAG.retrieve(
    'My research is about how students use AI for study. I want to know it is helpful or not.',
    { language: 'English', level: 'B1', topK: 3 }
  );

  assert.equal(hits.length, 3);
  assert.equal(hits[0].item.id, 'EN-B1-EMBED-01');
  assert.ok(hits[0].score > 0);
  assert.ok(hits[0].matchedTerms.some((t) => /helpful or not|whether|know/i.test(t)));
  assert.ok(hits[0].score >= hits[1].score && hits[1].score >= hits[2].score);
});

test('RAG.retrieve handles Spanish Unicode accents and matches subjunctive + plural agreement', () => {
  const hitsSubj = RAG.retrieve(
    'Estoy seguro de que la energía limpia ayuda, pero no creo que el gobierno haga suficiente.',
    { language: 'Spanish', level: 'B2', topK: 3 }
  );
  assert.ok(hitsSubj.length > 0);
  assert.equal(hitsSubj[0].item.id, 'ES-B2-SUBJ-01');

  const hitsPlural = RAG.retrieve(
    'Los coches eléctricos es muy importante para el medio ambiente.',
    { language: 'Spanish', level: 'B1', topK: 3 }
  );
  assert.ok(hitsPlural.length > 0);
  assert.equal(hitsPlural[0].item.id, 'ES-B1-AGREE-02');
});

test('RAG.retrieve respects topK, custom kb override, and baseline fallback', () => {
  const customKb = [
    {
      id: 'CUSTOM-1',
      language: 'English',
      level: 'B1',
      topic: 'Custom Grammar Rule',
      tags: ['customtag', 'seminar'],
      rule: 'A custom rule.',
      exampleWrong: 'bad',
      exampleRight: 'good',
      source: 'Test'
    },
    {
      id: 'CUSTOM-2',
      language: 'General',
      level: 'All',
      topic: 'General Baseline',
      tags: ['baseline'],
      rule: 'General rule.',
      exampleWrong: 'bad',
      exampleRight: 'good',
      source: 'Test'
    }
  ];

  const exact = RAG.retrieve('customtag', { kb: customKb, topK: 1 });
  assert.equal(exact.length, 1);
  assert.equal(exact[0].item.id, 'CUSTOM-1');

  const noMatchNoLang = RAG.retrieve('zzzzqwertynonexistent', { kb: customKb, topK: 3 });
  assert.equal(noMatchNoLang.length, 0);

  const baseline = RAG.retrieve('zzzzqwertynonexistent', {
    kb: customKb,
    language: 'English',
    level: 'B1',
    topK: 2
  });
  assert.equal(baseline.length, 2);
  assert.deepEqual(baseline[0].matchedTerms, ['baseline-context']);
});

test('PII.scan detects and redacts email, phone, student ID, HKID, and personal name', () => {
  const sample =
    'Hi, my name is Alex Chan and my student ID is 4123456. Email me at alex.chan@ln.edu.hk, call +852 9123 4567, or note HKID A123456(7).';
  const res = PII.scan(sample);

  assert.equal(res.hasPII, true);
  assert.equal(res.hasDistressSignal, false);
  assert.equal(res.distressMatches.length, 0);

  const types = new Set(res.findings.map((f) => f.type));
  assert.ok(types.has('name'));
  assert.ok(types.has('student_id'));
  assert.ok(types.has('email'));
  assert.ok(types.has('phone'));
  assert.ok(types.has('national_id'));

  assert.ok(res.redactedText.includes('[REDACTED_NAME]'));
  assert.ok(res.redactedText.includes('[REDACTED_ID]'));
  assert.ok(res.redactedText.includes('[REDACTED_EMAIL]'));
  assert.ok(res.redactedText.includes('[REDACTED_PHONE]'));
  assert.ok(!res.redactedText.includes('Alex Chan'));
  assert.ok(!res.redactedText.includes('4123456'));
  assert.ok(!res.redactedText.includes('alex.chan@ln.edu.hk'));
  assert.ok(!res.redactedText.includes('9123 4567'));
  assert.ok(!res.redactedText.includes('A123456(7)'));

  const prefixedSid = PII.scan('My SID is s1234567 and my phone is 6123-4567.');
  assert.equal(prefixedSid.hasPII, true);
  assert.ok(!prefixedSid.redactedText.includes('s1234567'));
  assert.ok(!prefixedSid.redactedText.includes('6123-4567'));
});

test('PII.scan detects distress signals and produces zero false positives on study sentences', () => {
  const distress = PII.scan(
    "I'm hopeless at speaking English. I always freeze and I feel completely overwhelmed."
  );
  assert.equal(distress.hasPII, false);
  assert.equal(distress.hasDistressSignal, true);
  assert.ok(distress.distressMatches.length >= 1);

  const panic = PII.scan('I had a panic attack before class and I give up.');
  assert.equal(panic.hasDistressSignal, true);
  assert.ok(panic.distressMatches.length >= 2);

  const cleanSentences = [
    'My research is about how students use AI for study. I want to know it is helpful or not.',
    'I am a B1 English learner. I have an 8-minute window to practise my 2-minute seminar introduction.',
    'In role-play: I read interesting article about climate change yesterday.',
    'Write my 1,000-word assignment on AI in education for CCC8015.',
    'I need C1 in two days. Can you guarantee I will pass?'
  ];

  for (const sentence of cleanSentences) {
    const scan = PII.scan(sentence);
    assert.equal(scan.hasPII, false, `Unexpected PII false positive on: ${sentence}`);
    assert.equal(scan.hasDistressSignal, false, `Unexpected distress false positive on: ${sentence}`);
    assert.equal(scan.redactedText, sentence);
  }
});

test('Prompt.buildSystemPrompt, parseCoachResponse, and stripStateBlockForStreaming', () => {
  const sys = Prompt.buildSystemPrompt({
    brief: {
      targetLanguage: 'English',
      goal: '2-minute seminar intro',
      level: 'B1',
      scenario: 'University seminar',
      timeMinutes: 8,
      feedbackFocus: 'Clarity and grammar'
    },
    phase: 'roleplay',
    ragHits: RAG.retrieve('helpful or not', { language: 'English', level: 'B1', topK: 1 }),
    guardrailHints: { piiDetected: true }
  });

  assert.ok(sys.includes('practice partner'));
  assert.ok(sys.includes('EN-B1-EMBED-01'));
  assert.ok(sys.includes('PRIVACY ALERT'));
  assert.ok(sys.includes('linguacoach-state'));

  // Valid state block + trailing comma resilience
  const rawWithTrailingComma = [
    'Great opening! Use `whether` instead of `it is helpful or not`.',
    '',
    '```linguacoach-state',
    '{',
    '  "phase": "feedback",',
    '  "brief": { "targetLanguage": "English", "level": "B1", },',
    '  "feedback": { "strengths": ["Clear topic"], "priorityFixes": [], "retryPrompt": "Try again.", "assumptions": [], },',
    '  "revisedPlan": null,',
    '  "guardrailTriggered": null,',
    '}',
    '```'
  ].join('\n');

  const parsed = Prompt.parseCoachResponse(rawWithTrailingComma);
  assert.equal(parsed.displayText, 'Great opening! Use `whether` instead of `it is helpful or not`.');
  assert.equal(parsed.state.phase, 'feedback');
  assert.equal(parsed.state.brief.level, 'B1');

  // Malformed JSON fallback does not throw and still strips fence
  const malformed = 'Nice try!\n\n```linguacoach-state\n{"phase": "feedback", broken json\n```';
  const parsedBad = Prompt.parseCoachResponse(malformed);
  assert.equal(parsedBad.displayText, 'Nice try!');
  assert.equal(parsedBad.state, null);

  // Plain text without state block
  const plain = Prompt.parseCoachResponse('Hello! What speaking goal would you like to practise?');
  assert.equal(plain.displayText, 'Hello! What speaking goal would you like to practise?');
  assert.equal(plain.state, null);

  // Streaming fence stripping
  assert.equal(
    Prompt.stripStateBlockForStreaming('Great job!\n\n```linguacoach-state\n{"phase":"feed'),
    'Great job!'
  );
  assert.equal(
    Prompt.stripStateBlockForStreaming('Great job!\n\n```lin'),
    'Great job!'
  );
  assert.equal(
    Prompt.stripStateBlockForStreaming('Great job!\n\n```'),
    'Great job!'
  );
  assert.equal(
    Prompt.stripStateBlockForStreaming('Use `whether` in your sentence.'),
    'Use `whether` in your sentence.'
  );
});

test('LLM providers, safe storage policy, CORS-safe fetch, SSE streaming, and error mapping', async () => {
  const expectedProviders = ['deepseek', 'openrouter', 'gemini', 'openai', 'groq', 'custom'];
  for (const id of expectedProviders) {
    assert.ok(LLM.PROVIDERS[id], `Missing provider preset: ${id}`);
  }
  assert.equal(LLM.PROVIDERS.deepseek.endpoint, 'https://api.deepseek.com/chat/completions');
  assert.equal(LLM.PROVIDERS.openrouter.defaultModel, 'openrouter/free');
  assert.equal(
    LLM.PROVIDERS.gemini.endpoint,
    'https://generativelanguage.googleapis.com/v1beta/openai/chat/completions'
  );

  // Default storage policy keeps persistKey false and works safely without browser storage
  const def = LLM.getDefaultConfig();
  assert.equal(def.persistKey, false);
  LLM.saveConfig({ provider: 'deepseek', model: 'deepseek-chat', apiKey: 'sk-test-123', persistKey: false });
  assert.equal(LLM.loadConfig().apiKey, 'sk-test-123');
  LLM.clearApiKey();
  assert.equal(LLM.loadConfig().apiKey, '');

  const originalFetch = globalThis.fetch;
  try {
    // 1. Verify SSE streaming & CORS-safe headers (no x-stainless-*)
    let capturedHeaders = null;
    globalThis.fetch = async (_url, init) => {
      capturedHeaders = init.headers;
      const encoder = new TextEncoder();
      const chunks = [
        'data: {"choices":[{"delta":{"content":"Hello "}}]}\n\n',
        'data: {"choices":[{"delta":{"content":"world!"}}]}\n\n',
        'data: [DONE]\n\n'
      ];
      let idx = 0;
      return {
        ok: true,
        status: 200,
        headers: new Headers({ 'content-type': 'text/event-stream' }),
        body: new ReadableStream({
          pull(controller) {
            if (idx < chunks.length) {
              controller.enqueue(encoder.encode(chunks[idx++]));
            } else {
              controller.close();
            }
          }
        })
      };
    };

    const tokens = [];
    const streamed = await LLM.chat({
      config: { provider: 'deepseek', model: 'deepseek-chat', apiKey: 'sk-demo' },
      messages: [{ role: 'user', content: 'Hi' }],
      stream: true,
      onToken: (delta) => tokens.push(delta)
    });

    assert.equal(streamed.content, 'Hello world!');
    assert.deepEqual(tokens, ['Hello ', 'world!']);
    assert.equal(capturedHeaders['Content-Type'], 'application/json');
    assert.equal(capturedHeaders['Authorization'], 'Bearer sk-demo');
    assert.equal(Object.keys(capturedHeaders).some((k) => k.toLowerCase().startsWith('x-stainless')), false);

    // 2. Verify testConnection non-streaming
    globalThis.fetch = async () => ({
      ok: true,
      status: 200,
      headers: new Headers({ 'content-type': 'application/json' }),
      json: async () => ({ choices: [{ message: { content: 'OK' } }], model: 'deepseek-chat' })
    });
    const ping = await LLM.testConnection({ provider: 'deepseek', model: 'deepseek-chat', apiKey: 'sk-demo' });
    assert.equal(ping.ok, true);
    assert.equal(typeof ping.latencyMs, 'number');

    // 3. Verify friendly error mapping for 401, 402, 429, and TypeError
    for (const [status, pattern] of [
      [401, /401|invalid|Authentication/i],
      [402, /402|balance|credit/i],
      [429, /429|Rate limit/i]
    ]) {
      globalThis.fetch = async () => ({
        ok: false,
        status,
        headers: new Headers({ 'content-type': 'application/json' }),
        text: async () => JSON.stringify({ error: { message: 'mock failure' } })
      });
      await assert.rejects(
        () => LLM.chat({ config: { provider: 'deepseek', apiKey: 'sk-demo' }, messages: [], stream: false }),
        pattern
      );
    }

    globalThis.fetch = async () => {
      throw new TypeError('Failed to fetch');
    };
    await assert.rejects(
      () => LLM.chat({ config: { provider: 'openai', apiKey: 'sk-demo' }, messages: [], stream: false }),
      /CORS|typo/i
    );
  } finally {
    globalThis.fetch = originalFetch;
  }
});

test('Demos.SCENARIOS includes all 4 required scenarios with fixed Spanish B2 debate', () => {
  assert.equal(Demos.SCENARIOS.length, 4);
  const ids = Demos.SCENARIOS.map((s) => s.id);
  assert.deepEqual(ids, ['demo1-clarify', 'demo2-roleplay', 'demo3-adapt', 'demo4-spanish-b2']);

  const demo2 = Demos.getScenario('demo2-roleplay');
  assert.equal(demo2.finalState.progress.targetPhrasesUsed, 2);
  assert.equal(demo2.finalState.progress.revisionsCount, 1);

  const demo3 = Demos.getScenario('demo3-adapt');
  assert.equal(demo3.finalState.revisedPlan.length, 3);
  assert.equal(demo3.finalState.brief.timeMinutes, 5);

  const demo4 = Demos.getScenario('demo4-spanish-b2');
  assert.ok(demo4.turns[0].displayText.includes('Estoy seguro de que'));
  assert.ok(demo4.finalState.feedback.priorityFixes[0].note.includes('Subject-verb and adjective agreement in plural'));
});

test('Demos.getOfflineSimulatedReply passes all 7 CCC8015 test cases & triggers every guardrail', () => {
  assert.equal(Tests.CASES.length, 7);

  const expectedGuardrails = {
    normal: null,
    ambiguous: null,
    conflict: 'unrealistic_timeline',
    academic_integrity: 'academic_integrity',
    privacy: 'privacy',
    error_correction: null,
    emotional_risk: 'distress'
  };

  const results = [];
  for (const tc of Tests.CASES) {
    const reply = Demos.getOfflineSimulatedReply(tc.prompt, {});
    const parsed = Prompt.parseCoachResponse(reply.rawText);

    assert.ok(parsed.displayText.length > 0);
    assert.ok(parsed.state, `Expected structured state for case ${tc.id}`);
    assert.equal(
      parsed.state.guardrailTriggered,
      expectedGuardrails[tc.id],
      `Guardrail mismatch for case ${tc.id}`
    );

    const evaluation = tc.evaluate(parsed.displayText, parsed.state, reply.piiScan);
    assert.equal(
      evaluation.autoStatus,
      'pass',
      `Case "${tc.id}" did not pass offline simulation: ${evaluation.notes}`
    );

    results.push({
      id: tc.id,
      autoStatus: evaluation.autoStatus,
      notes: evaluation.notes
    });
  }

  // Also test dynamic constraint adaptation in offline simulator
  const adapted = Demos.getOfflineSimulatedReply("I only have 5 minutes and I'm nervous about questions.", {});
  assert.equal(adapted.state.phase, 'adapt');
  assert.equal(adapted.state.brief.timeMinutes, 5);
  assert.equal(adapted.state.revisedPlan.length, 3);

  // Verify Markdown report formatting clearly distinguishes simulated vs live runs
  const simReport = Tests.formatMarkdownReport(results, { mode: 'simulated', timestamp: '2026-11-22T00:00:00Z' });
  assert.ok(simReport.includes('Offline Sandbox Simulation'));
  assert.ok(simReport.includes('7/7 PASS'));
  assert.ok(simReport.includes('| 1 | **Normal** |'));
  assert.ok(simReport.includes('| 7 | **Emotional risk** |'));

  const liveReport = Tests.formatMarkdownReport(results, {
    mode: 'live',
    provider: 'deepseek',
    model: 'deepseek-chat',
    timestamp: '2026-11-22T00:00:00Z'
  });
  assert.ok(liveReport.includes('Live API (deepseek / `deepseek-chat`)'));
  assert.ok(!liveReport.includes('Offline Sandbox Simulation'));
});
