(function (root) {
  'use strict';

  const LC = (root.LinguaCoach = root.LinguaCoach || {});

  const SETTINGS_KEY = 'linguacoach_settings_v1';
  const API_KEY_STORAGE_KEY = 'linguacoach_api_key_v1';

  const PROVIDERS = {
    deepseek: {
      id: 'deepseek',
      name: 'DeepSeek',
      endpoint: 'https://api.deepseek.com/chat/completions',
      baseUrl: 'https://api.deepseek.com/chat/completions',
      defaultModel: 'deepseek-chat',
      models: ['deepseek-chat', 'deepseek-reasoner'],
      keyUrl: 'https://platform.deepseek.com/api_keys',
      requiresKey: true,
      note: 'Direct browser CORS supported. Fast and affordable multilingual coaching.'
    },
    openrouter: {
      id: 'openrouter',
      name: 'OpenRouter',
      endpoint: 'https://openrouter.ai/api/v1/chat/completions',
      baseUrl: 'https://openrouter.ai/api/v1/chat/completions',
      defaultModel: 'openrouter/free',
      models: [
        'openrouter/free',
        'deepseek/deepseek-chat',
        'openai/gpt-4o-mini',
        'google/gemini-2.5-flash'
      ],
      keyUrl: 'https://openrouter.ai/keys',
      requiresKey: true,
      note: 'Multi-provider gateway with free tier (openrouter/free) and browser CORS.'
    },
    gemini: {
      id: 'gemini',
      name: 'Google Gemini',
      endpoint: 'https://generativelanguage.googleapis.com/v1beta/openai/chat/completions',
      baseUrl: 'https://generativelanguage.googleapis.com/v1beta/openai/chat/completions',
      defaultModel: 'gemini-2.5-flash',
      models: ['gemini-2.5-flash', 'gemini-2.0-flash'],
      keyUrl: 'https://aistudio.google.com/apikey',
      requiresKey: true,
      note: 'Uses Gemini OpenAI-compatible endpoint with standard CORS headers.'
    },
    openai: {
      id: 'openai',
      name: 'OpenAI',
      endpoint: 'https://api.openai.com/v1/chat/completions',
      baseUrl: 'https://api.openai.com/v1/chat/completions',
      defaultModel: 'gpt-4o-mini',
      models: ['gpt-4o-mini', 'gpt-4.1-mini', 'gpt-4o'],
      keyUrl: 'https://platform.openai.com/api-keys',
      requiresKey: true,
      note: 'Direct browser CORS supported with a valid API key.'
    },
    groq: {
      id: 'groq',
      name: 'Groq',
      endpoint: 'https://api.groq.com/openai/v1/chat/completions',
      baseUrl: 'https://api.groq.com/openai/v1/chat/completions',
      defaultModel: 'llama-3.3-70b-versatile',
      models: ['llama-3.3-70b-versatile', 'llama-3.1-8b-instant'],
      keyUrl: 'https://console.groq.com/keys',
      requiresKey: true,
      note: 'Low-latency inference via OpenAI-compatible browser CORS endpoint.'
    },
    custom: {
      id: 'custom',
      name: 'Custom OpenAI-Compatible',
      endpoint: '',
      baseUrl: '',
      defaultModel: '',
      models: [],
      keyUrl: '',
      requiresKey: false,
      note: 'For local Ollama (http://localhost:11434/v1/chat/completions), LM Studio, or a CORS-enabled proxy.'
    }
  };

  // Safe storage wrapper with in-memory fallback (for Node tests or strict browser privacy modes)
  function createMemoryStore() {
    const map = new Map();
    return {
      getItem: function (k) { return map.has(k) ? map.get(k) : null; },
      setItem: function (k, v) { map.set(k, String(v)); },
      removeItem: function (k) { map.delete(k); }
    };
  }

  const memoryLocal = createMemoryStore();
  const memorySession = createMemoryStore();

  function getSafeStorage(kind) {
    const fallback = kind === 'session' ? memorySession : memoryLocal;
    try {
      const store = kind === 'session' ? root.sessionStorage : root.localStorage;
      if (!store) return fallback;
      const probe = '__lc_probe__';
      store.setItem(probe, '1');
      store.removeItem(probe);
      return store;
    } catch (_err) {
      return fallback;
    }
  }

  function getDefaultConfig() {
    return {
      provider: 'deepseek',
      model: PROVIDERS.deepseek.defaultModel,
      baseUrl: '',
      apiKey: '',
      persistKey: false
    };
  }

  function getProvider(providerId) {
    return PROVIDERS[providerId] || PROVIDERS.deepseek;
  }

  function loadConfig() {
    const defaults = getDefaultConfig();
    const localStore = getSafeStorage('local');
    const sessionStore = getSafeStorage('session');

    let saved = {};
    try {
      const raw = localStore.getItem(SETTINGS_KEY);
      if (raw) {
        const parsed = JSON.parse(raw);
        if (parsed && typeof parsed === 'object') saved = parsed;
      }
    } catch (_err) {
      saved = {};
    }

    const providerId = PROVIDERS[saved.provider] ? saved.provider : defaults.provider;
    const preset = PROVIDERS[providerId];
    const persistKey = Boolean(saved.persistKey);

    let apiKey = '';
    try {
      if (persistKey) {
        apiKey = localStore.getItem(API_KEY_STORAGE_KEY) || sessionStore.getItem(API_KEY_STORAGE_KEY) || '';
      } else {
        apiKey = sessionStore.getItem(API_KEY_STORAGE_KEY) || '';
      }
    } catch (_err) {
      apiKey = '';
    }

    return {
      provider: providerId,
      model: typeof saved.model === 'string' && saved.model.trim() ? saved.model.trim() : preset.defaultModel,
      baseUrl: typeof saved.baseUrl === 'string' ? saved.baseUrl.trim() : '',
      apiKey: apiKey,
      persistKey: persistKey
    };
  }

  function saveConfig(config) {
    const merged = Object.assign({}, getDefaultConfig(), config || {});
    const providerId = PROVIDERS[merged.provider] ? merged.provider : 'deepseek';
    const persistKey = Boolean(merged.persistKey);
    const trimmedKey = typeof merged.apiKey === 'string' ? merged.apiKey.trim() : '';

    const localStore = getSafeStorage('local');
    const sessionStore = getSafeStorage('session');

    const nonSecret = {
      provider: providerId,
      model: typeof merged.model === 'string' ? merged.model.trim() : '',
      baseUrl: typeof merged.baseUrl === 'string' ? merged.baseUrl.trim() : '',
      persistKey: persistKey
    };

    try {
      localStore.setItem(SETTINGS_KEY, JSON.stringify(nonSecret));
    } catch (_err) {
      // ignore storage quota errors
    }

    try {
      if (!trimmedKey) {
        sessionStore.removeItem(API_KEY_STORAGE_KEY);
        localStore.removeItem(API_KEY_STORAGE_KEY);
      } else if (persistKey) {
        localStore.setItem(API_KEY_STORAGE_KEY, trimmedKey);
        sessionStore.removeItem(API_KEY_STORAGE_KEY);
      } else {
        sessionStore.setItem(API_KEY_STORAGE_KEY, trimmedKey);
        localStore.removeItem(API_KEY_STORAGE_KEY);
      }
    } catch (_err) {
      // ignore storage quota errors
    }

    return Object.assign({}, nonSecret, { apiKey: trimmedKey });
  }

  function clearApiKey() {
    const localStore = getSafeStorage('local');
    const sessionStore = getSafeStorage('session');
    try {
      sessionStore.removeItem(API_KEY_STORAGE_KEY);
      localStore.removeItem(API_KEY_STORAGE_KEY);
    } catch (_err) {
      // ignore
    }
  }

  function hasApiKey(config) {
    if (!config) return false;
    const providerId = config.provider || 'deepseek';
    const key = typeof config.apiKey === 'string' ? config.apiKey.trim() : '';
    if (providerId === 'custom') {
      const endpoint = resolveEndpoint(config);
      return Boolean(endpoint && (config.model && String(config.model).trim()));
    }
    return Boolean(key);
  }

  function resolveEndpoint(config) {
    const cfg = config || {};
    const providerId = cfg.provider || 'deepseek';
    const preset = PROVIDERS[providerId] || PROVIDERS.custom;

    let rawUrl = '';
    if (providerId === 'custom') {
      rawUrl = String(cfg.baseUrl || cfg.endpoint || '').trim();
    } else {
      rawUrl = String(cfg.endpoint || cfg.baseUrl || preset.endpoint || '').trim();
    }

    if (!rawUrl) return '';
    rawUrl = rawUrl.replace(/\/+$/, '');

    if (/\/chat\/completions$/i.test(rawUrl)) {
      return rawUrl;
    }
    if (/\/(?:v1|v1beta\/openai|openai)$/i.test(rawUrl)) {
      return rawUrl + '/chat/completions';
    }
    return rawUrl;
  }

  function buildHeaders(providerId, apiKey) {
    // Strictly CORS-safe headers only (never send x-stainless-* or SDK telemetry headers)
    const headers = {
      'Content-Type': 'application/json'
    };

    if (apiKey) {
      headers['Authorization'] = 'Bearer ' + apiKey;
    }

    if (providerId === 'openrouter') {
      let referer = 'https://linguacoach.github.io';
      try {
        if (typeof window !== 'undefined' && window.location && window.location.origin && window.location.origin !== 'null') {
          referer = window.location.origin;
        }
      } catch (_err) {
        // use default referer
      }
      headers['HTTP-Referer'] = referer;
      headers['X-Title'] = 'LinguaCoach (CCC8015 Prototype)';
    }

    return headers;
  }

  function extractServerErrorDetail(bodyText) {
    if (!bodyText) return '';
    try {
      const parsed = JSON.parse(bodyText);
      const msg =
        (parsed && parsed.error && (parsed.error.message || parsed.error.code)) ||
        (parsed && parsed.message) ||
        '';
      return typeof msg === 'string' ? msg.trim().slice(0, 220) : '';
    } catch (_err) {
      return String(bodyText).trim().slice(0, 180);
    }
  }

  function formatHttpError(status, detail, providerName) {
    const suffix = detail ? ' (' + detail + ')' : '';
    if (status === 401) {
      return 'Authentication failed (HTTP 401): Your ' + providerName + ' API key appears invalid or expired. Check for extra spaces or generate a new key.' + suffix;
    }
    if (status === 402) {
      return 'Insufficient credit or balance (HTTP 402): Your ' + providerName + ' account has no remaining balance. Top up credits or switch to OpenRouter with "openrouter/free".' + suffix;
    }
    if (status === 429) {
      return 'Rate limit or quota reached (HTTP 429): ' + providerName + ' is temporarily throttling requests. Wait a few seconds and retry, or try another model.' + suffix;
    }
    if (status === 404) {
      return 'Endpoint or model not found (HTTP 404): Verify the selected model name and endpoint URL for ' + providerName + '.' + suffix;
    }
    if (status === 400) {
      return 'Bad request (HTTP 400): ' + providerName + ' rejected the request parameters or model name.' + suffix;
    }
    return providerName + ' API error (HTTP ' + status + ').' + suffix;
  }

  function formatNetworkError(providerId, providerName) {
    if (providerId === 'openai') {
      return 'Network or CORS error connecting to OpenAI: Check your internet connection and verify there is no typo in your API key (invalid keys or browser extensions can surface as network errors in browser fetch).';
    }
    if (providerId === 'custom') {
      return 'Network or CORS error connecting to your Custom endpoint: Confirm the server is running and enables browser CORS (e.g., OLLAMA_ORIGINS=* for Ollama, or use a CORS-enabled proxy).';
    }
    return 'Network or CORS error connecting to ' + providerName + ': Check your internet connection, API key formatting, or browser extensions blocking cross-origin API calls.';
  }

  function parseSseDataLine(line) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.charAt(0) === ':') return { done: false, delta: '', usage: null };
    if (trimmed.indexOf('data:') !== 0) return { done: false, delta: '', usage: null };

    const payload = trimmed.slice(5).trim();
    if (!payload) return { done: false, delta: '', usage: null };
    if (payload === '[DONE]') return { done: true, delta: '', usage: null };

    try {
      const parsed = JSON.parse(payload);
      const choice = parsed && Array.isArray(parsed.choices) ? parsed.choices[0] : null;
      const delta =
        (choice && choice.delta && typeof choice.delta.content === 'string' && choice.delta.content) ||
        (choice && choice.message && typeof choice.message.content === 'string' && choice.message.content) ||
        '';
      return {
        done: false,
        delta: delta,
        usage: parsed && parsed.usage ? parsed.usage : null
      };
    } catch (_err) {
      return { done: false, delta: '', usage: null };
    }
  }

  async function readSseStream(response, onToken) {
    const reader = response.body.getReader();
    const decoder = new TextDecoder('utf-8');
    let buffer = '';
    let fullText = '';
    let usage = null;

    try {
      while (true) {
        const chunk = await reader.read();
        if (chunk.done) break;

        buffer += decoder.decode(chunk.value, { stream: true });
        const lines = buffer.split(/\r?\n/);
        buffer = lines.pop() || '';

        for (let i = 0; i < lines.length; i++) {
          const parsed = parseSseDataLine(lines[i]);
          if (parsed.usage) usage = parsed.usage;
          if (parsed.delta) {
            fullText += parsed.delta;
            if (typeof onToken === 'function') {
              onToken(parsed.delta, fullText);
            }
          }
          if (parsed.done) {
            return { fullText: fullText, usage: usage };
          }
        }
      }

      buffer += decoder.decode();
      if (buffer.trim()) {
        const tailLines = buffer.split(/\r?\n/);
        for (let i = 0; i < tailLines.length; i++) {
          const parsed = parseSseDataLine(tailLines[i]);
          if (parsed.usage) usage = parsed.usage;
          if (parsed.delta) {
            fullText += parsed.delta;
            if (typeof onToken === 'function') {
              onToken(parsed.delta, fullText);
            }
          }
        }
      }
    } finally {
      try {
        reader.releaseLock();
      } catch (_err) {
        // ignore
      }
    }

    return { fullText: fullText, usage: usage };
  }

  async function chat(options) {
    const opts = options || {};
    const cfg = opts.config || loadConfig();
    const providerId = PROVIDERS[cfg.provider] ? cfg.provider : 'custom';
    const preset = PROVIDERS[providerId];
    const endpoint = resolveEndpoint(cfg);
    const model = String(cfg.model || preset.defaultModel || '').trim();
    const apiKey = String(cfg.apiKey || '').trim();
    const stream = opts.stream !== undefined ? Boolean(opts.stream) : true;
    const messages = Array.isArray(opts.messages) ? opts.messages : [];

    if (!endpoint) {
      throw new Error('Missing API endpoint URL. Select a provider or enter a Custom OpenAI-compatible endpoint.');
    }
    if (!model) {
      throw new Error('Missing model name. Select or enter a model for ' + preset.name + '.');
    }
    if (preset.requiresKey && !apiKey) {
      throw new Error('No API key provided for ' + preset.name + '. Add your key in API Settings or use Offline Sandbox mode.');
    }

    const body = {
      model: model,
      messages: messages,
      stream: stream
    };

    if (typeof opts.temperature === 'number') {
      body.temperature = opts.temperature;
    } else {
      body.temperature = 0.6;
    }
    if (typeof opts.maxTokens === 'number' && opts.maxTokens > 0) {
      body.max_tokens = opts.maxTokens;
    }

    const headers = buildHeaders(providerId, apiKey);
    const fetchFn = typeof root.fetch === 'function' ? root.fetch.bind(root) : fetch;
    const startMs = Date.now();

    let response;
    try {
      response = await fetchFn(endpoint, {
        method: 'POST',
        headers: headers,
        body: JSON.stringify(body),
        signal: opts.signal
      });
    } catch (err) {
      if (err && err.name === 'AbortError') {
        const abortErr = new Error('Request cancelled.');
        abortErr.name = 'AbortError';
        abortErr.code = 'ABORTED';
        throw abortErr;
      }
      if (err instanceof TypeError || (err && err.name === 'TypeError')) {
        const netErr = new Error(formatNetworkError(providerId, preset.name));
        netErr.code = 'NETWORK_OR_CORS';
        netErr.cause = err;
        throw netErr;
      }
      throw err;
    }

    if (!response.ok) {
      let errorBody = '';
      try {
        errorBody = await response.text();
      } catch (_err) {
        errorBody = '';
      }
      const detail = extractServerErrorDetail(errorBody);
      const httpErr = new Error(formatHttpError(response.status, detail, preset.name));
      httpErr.status = response.status;
      throw httpErr;
    }

    const contentType = (response.headers && typeof response.headers.get === 'function'
      ? (response.headers.get('content-type') || '')
      : '').toLowerCase();

    const canStream =
      stream &&
      response.body &&
      typeof response.body.getReader === 'function' &&
      contentType.indexOf('application/json') === -1;

    if (canStream) {
      const streamed = await readSseStream(response, opts.onToken);
      return {
        content: streamed.fullText,
        text: streamed.fullText,
        model: model,
        provider: providerId,
        usage: streamed.usage,
        latencyMs: Date.now() - startMs
      };
    }

    const data = await response.json();
    const choice = data && Array.isArray(data.choices) ? data.choices[0] : null;
    const content =
      (choice && choice.message && typeof choice.message.content === 'string' && choice.message.content) ||
      (choice && typeof choice.text === 'string' && choice.text) ||
      '';

    if (content && typeof opts.onToken === 'function') {
      opts.onToken(content, content);
    }

    return {
      content: content,
      text: content,
      model: (data && data.model) || model,
      provider: providerId,
      usage: (data && data.usage) || null,
      latencyMs: Date.now() - startMs
    };
  }

  async function testConnection(config) {
    const startMs = Date.now();
    const cfg = config || loadConfig();
    const preset = getProvider(cfg.provider);
    const model = String(cfg.model || preset.defaultModel || '').trim();

    try {
      const result = await chat({
        config: cfg,
        messages: [{ role: 'user', content: 'Reply with OK.' }],
        stream: false,
        maxTokens: 16,
        temperature: 0
      });
      const latencyMs = Date.now() - startMs;
      return {
        ok: true,
        message: 'Connected to ' + preset.name + ' (' + (result.model || model) + ') in ' + latencyMs + ' ms.',
        latencyMs: latencyMs
      };
    } catch (err) {
      return {
        ok: false,
        message: (err && err.message) ? err.message : 'Connection test failed.',
        latencyMs: Date.now() - startMs
      };
    }
  }

  LC.LLM = {
    PROVIDERS: PROVIDERS,
    getDefaultConfig: getDefaultConfig,
    getProvider: getProvider,
    loadConfig: loadConfig,
    saveConfig: saveConfig,
    clearApiKey: clearApiKey,
    hasApiKey: hasApiKey,
    resolveEndpoint: resolveEndpoint,
    chat: chat,
    testConnection: testConnection
  };

  if (typeof module !== 'undefined' && module.exports) {
    module.exports = LC.LLM;
  }
})(typeof window !== 'undefined' ? window : globalThis);
