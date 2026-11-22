(function (root) {
  'use strict';

  const LC = (root.LinguaCoach = root.LinguaCoach || {});

  const BODY_STOPWORDS = new Set([
    // English high-frequency fillers (excluding key grammar words like whether, if, a, an, the, for, to, not)
    'the', 'is', 'are', 'was', 'were', 'be', 'been', 'being', 'am',
    'and', 'or', 'but', 'so', 'of', 'in', 'on', 'at', 'by', 'with', 'from', 'about', 'into', 'as',
    'this', 'that', 'these', 'those', 'it', 'its', 'they', 'them', 'their', 'we', 'our', 'you', 'your',
    'i', 'me', 'my', 'he', 'she', 'his', 'her', 'do', 'does', 'did', 'have', 'has', 'had', 'will', 'would',
    'can', 'could', 'should', 'very', 'just', 'more', 'most', 'some', 'any', 'all', 'also', 'when', 'where',
    'what', 'which', 'who', 'how', 'one', 'two', 'use', 'using', 'used', 'like', 'want',
    // Spanish high-frequency fillers (excluding por, para, ser, estar, son, es, no, que, aunque)
    'el', 'la', 'los', 'las', 'un', 'una', 'unos', 'unas', 'de', 'del', 'al', 'y', 'o', 'pero',
    'en', 'con', 'se', 'su', 'sus', 'mi', 'mis', 'tu', 'tus', 'me', 'te', 'lo', 'le', 'les',
    'muy', 'mas', 'más', 'como', 'cómo', 'esto', 'esta', 'este', 'eso', 'esa', 'ese', 'hay', 'yo', 'tú'
  ]);

  const CEFR_ORDER = ['A2', 'B1', 'B2', 'C1'];

  function foldAccents(str) {
    return String(str || '')
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '');
  }

  function normalizeSpace(str) {
    return String(str || '')
      .toLowerCase()
      .replace(/[^\p{L}\p{N}]+/gu, ' ')
      .trim();
  }

  function tokenize(text) {
    const cleaned = normalizeSpace(text);
    if (!cleaned) return [];
    return cleaned.split(/\s+/).filter(Boolean);
  }

  function getBigrams(tokens) {
    const out = [];
    for (let i = 0; i < tokens.length - 1; i++) {
      out.push(tokens[i] + ' ' + tokens[i + 1]);
    }
    return out;
  }

  function isAdjacentLevel(a, b) {
    const idxA = CEFR_ORDER.indexOf(String(a || '').toUpperCase());
    const idxB = CEFR_ORDER.indexOf(String(b || '').toUpperCase());
    if (idxA === -1 || idxB === -1) return false;
    return Math.abs(idxA - idxB) === 1;
  }

  function containsWholePhrase(haystackNorm, needleNorm) {
    if (!haystackNorm || !needleNorm) return false;
    return (' ' + haystackNorm + ' ').indexOf(' ' + needleNorm + ' ') !== -1;
  }

  function resolveKB(options) {
    if (options && Array.isArray(options.kb)) {
      return options.kb;
    }
    if (Array.isArray(LC.KB)) {
      return LC.KB;
    }
    if (typeof require === 'function') {
      try {
        return require('./kb.js');
      } catch (_err) {
        return [];
      }
    }
    return [];
  }

  function scoreEntry(entry, queryData, options) {
    const matchedTerms = [];
    const matchedSet = new Set();
    let lexicalScore = 0;

    function addMatch(term, weight) {
      lexicalScore += weight;
      const key = term.toLowerCase();
      if (!matchedSet.has(key)) {
        matchedSet.add(key);
        matchedTerms.push(term);
      }
    }

    const tags = Array.isArray(entry.tags) ? entry.tags : [];
    for (let i = 0; i < tags.length; i++) {
      const rawTag = String(tags[i] || '').trim();
      if (!rawTag) continue;
      const tagNorm = normalizeSpace(rawTag);
      const tagFolded = foldAccents(tagNorm);
      if (!tagNorm) continue;

      const isPhrase = tagNorm.indexOf(' ') !== -1;
      if (isPhrase) {
        const phraseWords = tagNorm.split(' ').length;
        const phraseWeight = 4.0 + Math.min(phraseWords, 5) * 1.25;
        if (containsWholePhrase(queryData.norm, tagNorm)) {
          addMatch(rawTag, phraseWeight);
        } else if (containsWholePhrase(queryData.folded, tagFolded)) {
          addMatch(rawTag, phraseWeight * 0.88);
        }
      } else {
        if (queryData.tokenSet.has(tagNorm)) {
          addMatch(rawTag, 3.0);
        } else if (queryData.foldedTokenSet.has(tagFolded)) {
          addMatch(rawTag, 2.5);
        }
      }
    }

    // Topic token overlap
    const topicTokens = tokenize(entry.topic);
    let topicHits = 0;
    for (let i = 0; i < topicTokens.length; i++) {
      const tok = topicTokens[i];
      if (tok.length < 2 || BODY_STOPWORDS.has(tok)) continue;
      const tokFolded = foldAccents(tok);
      if (queryData.tokenSet.has(tok)) {
        addMatch(tok, 1.8);
        topicHits++;
      } else if (queryData.foldedTokenSet.has(tokFolded)) {
        addMatch(tok, 1.4);
        topicHits++;
      }
      if (topicHits >= 4) break;
    }

    // ExampleWrong / ExampleRight bigram overlap (catches real learner error patterns directly)
    const exampleWrongTokens = tokenize(entry.exampleWrong);
    const exampleRightTokens = tokenize(entry.exampleRight);
    const wrongBigrams = getBigrams(exampleWrongTokens);
    let bigramHits = 0;
    for (let i = 0; i < wrongBigrams.length; i++) {
      const bg = wrongBigrams[i];
      const parts = bg.split(' ');
      if (BODY_STOPWORDS.has(parts[0]) && BODY_STOPWORDS.has(parts[1])) continue;
      if (containsWholePhrase(queryData.norm, bg)) {
        addMatch(bg, 2.2);
        bigramHits++;
      } else if (containsWholePhrase(queryData.folded, foldAccents(bg))) {
        addMatch(bg, 1.8);
        bigramHits++;
      }
      if (bigramHits >= 3) break;
    }

    // Rule & examples content-word overlap (capped so long prose does not drown exact tags)
    const bodyTokens = tokenize(
      (entry.rule || '') + ' ' + (entry.exampleWrong || '') + ' ' + (entry.exampleRight || '')
    );
    const seenBody = new Set();
    let bodyScore = 0;
    for (let i = 0; i < bodyTokens.length; i++) {
      const tok = bodyTokens[i];
      if (tok.length < 3 || BODY_STOPWORDS.has(tok) || seenBody.has(tok)) continue;
      seenBody.add(tok);
      const tokFolded = foldAccents(tok);
      if (queryData.tokenSet.has(tok)) {
        bodyScore += 0.7;
        if (!matchedSet.has(tok)) {
          matchedSet.add(tok);
          matchedTerms.push(tok);
        }
      } else if (queryData.foldedTokenSet.has(tokFolded)) {
        bodyScore += 0.55;
        if (!matchedSet.has(tok)) {
          matchedSet.add(tok);
          matchedTerms.push(tok);
        }
      }
      if (bodyScore >= 3.0) {
        bodyScore = 3.0;
        break;
      }
    }
    lexicalScore += bodyScore;

    if (lexicalScore <= 0) {
      return { item: entry, score: 0, matchedTerms: [] };
    }

    let finalScore = lexicalScore;
    const reqLang = options.language ? String(options.language).trim().toLowerCase() : '';
    const entryLang = String(entry.language || '').trim().toLowerCase();

    if (reqLang) {
      if (entryLang === reqLang) {
        finalScore = finalScore * 1.35 + 0.5;
      } else if (entryLang === 'general') {
        finalScore = finalScore * 1.0;
      } else {
        finalScore = finalScore * 0.45;
      }
    }

    const reqLevel = options.level ? String(options.level).trim().toUpperCase() : '';
    const entryLevel = String(entry.level || '').trim().toUpperCase();
    if (reqLevel) {
      if (entryLevel === reqLevel) {
        finalScore += 0.75;
      } else if (entryLevel === 'ALL' || isAdjacentLevel(reqLevel, entryLevel)) {
        finalScore += 0.25;
      }
    }

    return {
      item: entry,
      score: Math.round(finalScore * 100) / 100,
      matchedTerms: matchedTerms.slice(0, 8)
    };
  }

  function getBaselineEntries(entries, options, topK) {
    const reqLang = options.language ? String(options.language).trim().toLowerCase() : '';
    if (!reqLang || topK <= 0) return [];

    const reqLevel = options.level ? String(options.level).trim().toUpperCase() : '';
    const maxBaseline = Math.min(topK, 2);
    const chosen = [];

    // 1. Prefer an entry matching requested language (+ level if available)
    const langMatches = entries.filter(
      (e) => String(e.language || '').trim().toLowerCase() === reqLang
    );
    if (langMatches.length > 0) {
      const exactLevel = reqLevel
        ? langMatches.find((e) => String(e.level || '').trim().toUpperCase() === reqLevel)
        : null;
      chosen.push({
        item: exactLevel || langMatches[0],
        score: 0.5,
        matchedTerms: ['baseline-context']
      });
    }

    // 2. Pair with a General pedagogical baseline entry
    if (chosen.length < maxBaseline) {
      const generalEntry = entries.find(
        (e) => String(e.language || '').trim().toLowerCase() === 'general'
      );
      if (generalEntry) {
        chosen.push({
          item: generalEntry,
          score: 0.4,
          matchedTerms: ['baseline-context']
        });
      }
    }

    return chosen;
  }

  function retrieve(query, options) {
    const opts = options || {};
    const topK = typeof opts.topK === 'number' && opts.topK >= 0 ? opts.topK : 3;
    const entries = resolveKB(opts);
    if (!entries.length || topK === 0) return [];

    const norm = normalizeSpace(query);
    if (!norm) {
      return getBaselineEntries(entries, opts, topK);
    }

    const folded = foldAccents(norm);
    const tokens = norm.split(/\s+/).filter(Boolean);
    const foldedTokens = folded.split(/\s+/).filter(Boolean);

    const queryData = {
      norm: norm,
      folded: folded,
      tokens: tokens,
      tokenSet: new Set(tokens),
      foldedTokenSet: new Set(foldedTokens)
    };

    const scored = [];
    for (let i = 0; i < entries.length; i++) {
      const res = scoreEntry(entries[i], queryData, opts);
      if (res.score > 0) {
        scored.push(res);
      }
    }

    scored.sort(function (a, b) {
      if (b.score !== a.score) return b.score - a.score;
      return String(a.item.id || '').localeCompare(String(b.item.id || ''));
    });

    const top = scored.slice(0, topK);
    if (top.length > 0) {
      return top;
    }

    return getBaselineEntries(entries, opts, topK);
  }

  LC.RAG = {
    retrieve: retrieve,
    tokenize: tokenize,
    foldAccents: foldAccents
  };

  if (typeof module !== 'undefined' && module.exports) {
    module.exports = LC.RAG;
  }
})(typeof window !== 'undefined' ? window : globalThis);
