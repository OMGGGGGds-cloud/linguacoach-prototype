(function (root) {
  'use strict';

  const LC = (root.LinguaCoach = root.LinguaCoach || {});

  const NON_NAME_WORDS = new Set([
    'a', 'an', 'the', 'and', 'or', 'but', 'so', 'if', 'as', 'at', 'by', 'for', 'from', 'in', 'into',
    'of', 'on', 'to', 'with', 'about', 'that', 'this', 'here', 'there', 'today', 'tomorrow', 'now',
    'i', 'me', 'my', 'we', 'our', 'you', 'your', 'please', 'thanks', 'thank', 'hello', 'hi',
    'english', 'spanish', 'chinese', 'cantonese', 'mandarin', 'french', 'german', 'japanese', 'korean',
    'hong', 'kong', 'china', 'lingnan', 'university', 'college', 'school', 'campus', 'department',
    'student', 'learner', 'teacher', 'professor', 'tutor', 'beginner', 'intermediate', 'advanced',
    'ielts', 'toefl', 'cefr', 'ai', 'ccc8015', 'research', 'seminar', 'presentation', 'interview',
    'nervous', 'anxious', 'hopeless', 'overwhelmed', 'worried', 'sorry', 'ready', 'happy', 'tired',
    'confused', 'stuck', 'excited', 'interested', 'trying', 'studying', 'learning', 'preparing',
    'practising', 'practicing', 'working', 'looking', 'going', 'wanting', 'having', 'doing', 'taking',
    'really', 'very', 'quite', 'just', 'only', 'also', 'still', 'not', 'currently', 'actually',
    'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday',
    'january', 'february', 'march', 'april', 'may', 'june', 'july', 'august',
    'september', 'october', 'november', 'december'
  ]);

  const DISTRESS_PATTERNS = [
    /\bi['’]?m\s+(?:so\s+|completely\s+|totally\s+)?hopeless\b/gi,
    /\bi\s+am\s+(?:so\s+|completely\s+|totally\s+)?hopeless\b/gi,
    /\bfeel(?:ing)?\s+(?:so\s+|completely\s+|totally\s+)?hopeless\b/gi,
    /\bi\s+(?:just\s+)?give\s+up\b/gi,
    /\bwant\s+to\s+give\s+up\b/gi,
    /\bi\s+(?:can['’]?t|cannot)\s+do\s+anything\b/gi,
    /\b(?:can['’]?t|cannot)\s+do\s+this\s+anymore\b/gi,
    /\bpanic\s+attack\b/gi,
    /\bhate\s+myself\b/gi,
    /\b(?:i['’]?m|i\s+am|feel(?:ing)?)\s+(?:so\s+|completely\s+)?worthless\b/gi,
    /\bworthless\b/gi,
    /\boverwhelmed\s+and\s+crying\b/gi,
    /\bcrying\s+and\s+overwhelmed\b/gi,
    /\bfeel(?:ing)?\s+(?:so\s+|completely\s+|totally\s+)?overwhelmed\b/gi,
    /\bcompletely\s+overwhelmed\b/gi,
    /\b(?:can['’]?t|cannot)\s+stop\s+crying\b/gi,
    /\bwant\s+to\s+hurt\s+myself\b/gi,
    /\bhurt\s+myself\b/gi,
    /\bharm\s+myself\b/gi,
    /\bself[-\s]?harm\b/gi,
    /\bsuicidal\b/gi,
    /\bkill\s+myself\b/gi,
    /\bend\s+my\s+life\b/gi,
    /\b(?:don['’]?t|do\s+not)\s+want\s+to\s+live\b/gi,
    /\bataque\s+de\s+p[áa]nico\b/gi,
    /\bno\s+sirvo\s+para\s+nada\b/gi,
    /\bquiero\s+hacerme\s+da[ñn]o\b/gi,
    /\bsuicida\b/gi
  ];

  function countDigits(str) {
    const digits = String(str || '').match(/\d/g);
    return digits ? digits.length : 0;
  }

  function hasOverlap(spans, start, end) {
    for (let i = 0; i < spans.length; i++) {
      if (start < spans[i].end && end > spans[i].start) {
        return true;
      }
    }
    return false;
  }

  function addSpan(spans, start, end, type, label, match, placeholder) {
    if (start < 0 || end <= start) return false;
    if (hasOverlap(spans, start, end)) return false;
    spans.push({ start, end, type, label, match, placeholder });
    return true;
  }

  function collectGroupMatches(text, regex, groupIndex, onMatch) {
    regex.lastIndex = 0;
    let m;
    while ((m = regex.exec(text)) !== null) {
      const value = groupIndex === 0 ? m[0] : m[groupIndex];
      if (!value) {
        if (regex.lastIndex === m.index) regex.lastIndex++;
        continue;
      }
      const offsetInFull = groupIndex === 0 ? 0 : m[0].lastIndexOf(value);
      const start = m.index + (offsetInFull >= 0 ? offsetInFull : 0);
      const end = start + value.length;
      onMatch(value, start, end, m);
      if (regex.lastIndex === m.index) regex.lastIndex++;
    }
  }

  function trimNameCandidate(rawCandidate) {
    const words = rawCandidate.trim().split(/\s+/);
    // Stop at first clear connector/non-name word
    const kept = [];
    for (let i = 0; i < words.length; i++) {
      const cleaned = words[i].replace(/^['’-]+|['’-]+$/g, '');
      const lower = cleaned.toLowerCase();
      if (!cleaned || NON_NAME_WORDS.has(lower)) {
        break;
      }
      kept.push(words[i]);
    }
    if (!kept.length) return '';
    return kept.join(' ');
  }

  function scan(input) {
    const text = typeof input === 'string' ? input : String(input == null ? '' : input);
    if (!text) {
      return {
        hasPII: false,
        findings: [],
        redactedText: '',
        hasDistressSignal: false,
        distressMatches: []
      };
    }

    const spans = [];

    // 1. Email addresses
    collectGroupMatches(
      text,
      /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}\b/g,
      0,
      function (val, start, end) {
        addSpan(spans, start, end, 'email', 'Email address', val, '[REDACTED_EMAIL]');
      }
    );

    // 2. HKID / National ID patterns
    collectGroupMatches(
      text,
      /\b[A-Z]{1,2}\d{6}\s*\([0-9A]\)/gi,
      0,
      function (val, start, end) {
        addSpan(spans, start, end, 'national_id', 'HKID / National ID', val, '[REDACTED_ID]');
      }
    );

    collectGroupMatches(
      text,
      /\b(?:hkid|hk\s*id|id\s*(?:card|number|no\.?)|national\s*id|passport(?:\s*(?:no\.?|number))?)\s*(?:is\s+|[:#=-]\s*)?([A-Z]{1,2}\d{6}(?:\s*\([0-9A]\)|[0-9A])?|\d{6,18}[Xx]?)\b/gi,
      1,
      function (val, start, end) {
        addSpan(spans, start, end, 'national_id', 'HKID / National ID', val, '[REDACTED_ID]');
      }
    );

    collectGroupMatches(
      text,
      /\b\d{3}-\d{2}-\d{4}\b/g,
      0,
      function (val, start, end) {
        addSpan(spans, start, end, 'national_id', 'National ID / SSN', val, '[REDACTED_ID]');
      }
    );

    collectGroupMatches(
      text,
      /\b[1-9]\d{16}[\dXx]\b/g,
      0,
      function (val, start, end) {
        addSpan(spans, start, end, 'national_id', 'National ID', val, '[REDACTED_ID]');
      }
    );

    // 3. Labeled Student IDs (checked before generic phones so "student ID is 91234567" stays student_id)
    collectGroupMatches(
      text,
      /\b(?:student\s*(?:id|number|no\.?)|sid|university\s*id|uni\s*id|school\s*id)\s*(?:is\s+|[:#=-]\s*)?([A-Za-z]?\d{6,10})\b/gi,
      1,
      function (val, start, end) {
        addSpan(spans, start, end, 'student_id', 'Student ID', val, '[REDACTED_ID]');
      }
    );

    collectGroupMatches(
      text,
      /\bID\s*(?:is\s+|[:#=-]\s*)([A-Za-z]?\d{6,10})\b/gi,
      1,
      function (val, start, end) {
        addSpan(spans, start, end, 'student_id', 'Student ID', val, '[REDACTED_ID]');
      }
    );

    collectGroupMatches(
      text,
      /\b[suSU]\d{7,9}\b/g,
      0,
      function (val, start, end) {
        addSpan(spans, start, end, 'student_id', 'Student ID', val, '[REDACTED_ID]');
      }
    );

    // 4. Phone numbers (HK 8-digit & international formats)
    collectGroupMatches(
      text,
      /\b(?:phone|tel(?:ephone)?|mobile|cell|whatsapp|contact(?:\s+number)?|call\s+me(?:\s+at)?)\s*(?:number\s*)?(?:is\s+|[:#=-]\s*)?(\+?\d[\d\s().-]{6,17}\d)\b/gi,
      1,
      function (val, start, end) {
        const d = countDigits(val);
        if (d >= 8 && d <= 15) {
          addSpan(spans, start, end, 'phone', 'Phone number', val, '[REDACTED_PHONE]');
        }
      }
    );

    collectGroupMatches(
      text,
      /(?:^|[^\d])(\+\d{1,3}[\s.-]?(?:\(?\d{2,4}\)?[\s.-]?){2,4}\d{2,4})(?=$|[^\d])/g,
      1,
      function (val, start, end) {
        const d = countDigits(val);
        if (d >= 8 && d <= 15) {
          addSpan(spans, start, end, 'phone', 'Phone number', val, '[REDACTED_PHONE]');
        }
      }
    );

    collectGroupMatches(
      text,
      /\b((?:\(\d{3}\)|\d{3})[\s.-]\d{3}[\s.-]\d{4})\b/g,
      1,
      function (val, start, end) {
        addSpan(spans, start, end, 'phone', 'Phone number', val, '[REDACTED_PHONE]');
      }
    );

    collectGroupMatches(
      text,
      /\b([2356789]\d{3}[\s-]\d{4})\b/g,
      1,
      function (val, start, end) {
        addSpan(spans, start, end, 'phone', 'Phone number', val, '[REDACTED_PHONE]');
      }
    );

    collectGroupMatches(
      text,
      /\b([2356789]\d{7})\b/g,
      1,
      function (val, start, end) {
        const prevChar = start > 0 ? text[start - 1] : '';
        if (/[$€£¥.,]/.test(prevChar)) return;
        addSpan(spans, start, end, 'phone', 'Phone number', val, '[REDACTED_PHONE]');
      }
    );

    // 5. Bare 7-10 digit numeric Student IDs (excluding currency or decimal values)
    collectGroupMatches(
      text,
      /\b(\d{7,10})\b/g,
      1,
      function (val, start, end) {
        const prevChar = start > 0 ? text[start - 1] : '';
        const nextChar = end < text.length ? text[end] : '';
        if (/[$€£¥.,]/.test(prevChar) || /[.,]/.test(nextChar)) return;
        addSpan(spans, start, end, 'student_id', 'Student ID', val, '[REDACTED_ID]');
      }
    );

    // 6. Self-disclosed personal names
    collectGroupMatches(
      text,
      /\b(?:my\s+(?:full\s+)?name\s+is|call\s+me|you\s+can\s+call\s+me)\s+([A-Za-z\u00C0-\u00FF'-]+(?:\s+[A-Za-z\u00C0-\u00FF'-]+){0,2})/gi,
      1,
      function (val, start) {
        const trimmed = trimNameCandidate(val);
        if (!trimmed) return;
        const end = start + trimmed.length;
        addSpan(spans, start, end, 'name', 'Personal name', trimmed, '[REDACTED_NAME]');
      }
    );

    // Case-sensitive "I am [First Last]" / "I'm [First Last]" (strict Title-Case multi-word name)
    collectGroupMatches(
      text,
      /(?:^|[\s,;.!?])(?:I am|I['’]m)\s+([A-Z\u00C0-\u00DE][a-z\u00DF-\u00FF'-]{1,20}(?:\s+[A-Z\u00C0-\u00DE][a-z\u00DF-\u00FF'-]{1,20}){1,2})\b/g,
      1,
      function (val, start, end) {
        const parts = val.split(/\s+/);
        for (let i = 0; i < parts.length; i++) {
          if (NON_NAME_WORDS.has(parts[i].toLowerCase())) {
            return;
          }
        }
        addSpan(spans, start, end, 'name', 'Personal name', val, '[REDACTED_NAME]');
      }
    );

    // Sort spans left-to-right and build redactedText
    spans.sort(function (a, b) {
      return a.start - b.start;
    });

    let redactedText = '';
    let cursor = 0;
    const findings = [];
    for (let i = 0; i < spans.length; i++) {
      const sp = spans[i];
      redactedText += text.slice(cursor, sp.start) + sp.placeholder;
      cursor = sp.end;
      findings.push({
        type: sp.type,
        label: sp.label,
        match: sp.match
      });
    }
    redactedText += text.slice(cursor);

    // 7. Emotional distress signal detection
    const distressMatches = [];
    const seenDistress = new Set();
    for (let i = 0; i < DISTRESS_PATTERNS.length; i++) {
      const re = DISTRESS_PATTERNS[i];
      re.lastIndex = 0;
      let m;
      while ((m = re.exec(text)) !== null) {
        const snippet = m[0].trim();
        const key = snippet.toLowerCase();
        if (snippet && !seenDistress.has(key)) {
          seenDistress.add(key);
          distressMatches.push(snippet);
        }
        if (re.lastIndex === m.index) re.lastIndex++;
      }
    }

    return {
      hasPII: findings.length > 0,
      findings: findings,
      redactedText: redactedText,
      hasDistressSignal: distressMatches.length > 0,
      distressMatches: distressMatches
    };
  }

  LC.PII = {
    scan: scan
  };

  if (typeof module !== 'undefined' && module.exports) {
    module.exports = LC.PII;
  }
})(typeof window !== 'undefined' ? window : globalThis);
