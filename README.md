# LinguaCoach — Conversational Language-Practice Agent Prototype

> **A practice partner, not an assessor.**  
> A short, structured conversational practice prototype designed for **CCC8015 — Topic 1: Design a Conversational AI Agent for Real-world Problem Solving** (Lingnan University).

LinguaCoach is a **zero-backend, static web prototype** built for **GitHub Pages** using a **Bring Your Own API Key (BYOK)** model. Users open the site, enter their own LLM API key (e.g., **DeepSeek**, **OpenRouter**, **Google Gemini**, **OpenAI**, **Groq**, or any custom OpenAI-compatible endpoint), and run structured speaking-practice loops directly in the browser—or explore the built-in **Sandbox Mode** with zero setup.

---

## Key Features

- **8-Step Deliberate Practice Loop**: Goal → Clarify (one question at a time) → Confirm Practice Brief → Short Role-play → Actionable Feedback (**2 strengths, 2 priority fixes with examples, 1 retry prompt**) → Immediate Retry → Next-Step Plan → Live Constraint Adaptation.
- **Live Practice Companion**: Real-time right-hand panel showing the editable **Practice Brief** (6 fields), **Actionable Feedback & Retry** card, **Revised Plan** when time/anxiety changes, and progress counters.
- **Transparent Client-Side RAG Grounding**: Lightweight lexical/tag retrieval over a curated CEFR English & Spanish grammar/pedagogy knowledge base (`js/kb.js`), with retrieved rules, examples, and source citations visible in the **RAG Inspector** panel.
- **Built-in Safety & Ethical Guardrails**:
  - **Client-side PII Pre-flight Scanner** (`js/pii.js`): Detects accidental emails, phone numbers, student IDs, and self-disclosed names *before* sending to any LLM, offering one-click redaction.
  - **Academic Integrity Refusal**: Refuses assignment/essay writing requests and pivots to language practice on the learner's own draft.
  - **Distress & Wellbeing Protocol**: Stops role-play if the learner expresses severe distress and surfaces calm support guidance.
  - **Honest Scope Limits**: Never invents official CEFR/IELTS scores, never guarantees exam outcomes, and explicitly discloses text-only limitations (no pronunciation scoring).
- **7-Case Evaluation Lab**: Interactive test runner implementing all 7 planned evaluation cases (`Normal`, `Ambiguous`, `Conflict`, `Academic integrity`, `Privacy`, `Error correction`, `Emotional risk`) with automated observable checks, manual reviewer override, and **Markdown / JSON report export**.
- **Sandbox Mode (No API Key Required)**: Includes 4 clickable demo scenarios (CCC8015 Demos 1–3 + Spanish B2 Debate) and an offline deterministic simulator so visitors can preview the interface and guardrails immediately.

---

## Bring Your Own API Key (BYOK) & Privacy

- **No backend server**: All requests go directly from your browser via HTTPS to the provider endpoint you choose.
- **Key storage**: By default, your API key is stored only in `sessionStorage` and cleared automatically when you close the browser tab. You can optionally check *"Remember API key in this browser"* to keep it in `localStorage`, or clear it anytime.
- **Supported browser-CORS providers**:
  - **DeepSeek** (`https://api.deepseek.com/chat/completions`, default `deepseek-chat`)
  - **OpenRouter** (`https://openrouter.ai/api/v1/chat/completions`, includes free models like `openrouter/free`)
  - **Google Gemini** (`https://generativelanguage.googleapis.com/v1beta/openai/chat/completions`, e.g., `gemini-2.5-flash`)
  - **OpenAI** (`https://api.openai.com/v1/chat/completions`, e.g., `gpt-4o-mini`)
  - **Groq** (`https://api.groq.com/openai/v1/chat/completions`, e.g., `llama-3.3-70b-versatile`)
  - **Custom OpenAI-Compatible Endpoint** (e.g., local Ollama, LM Studio, or your own proxy)

> **Security note**: Never hardcode or commit an API key into this repository. Keep `.env` files out of Git.

---

## Deploy to GitHub Pages (2 Minutes, Zero Build Step)

1. Create a new public repository on GitHub (e.g., `linguacoach-prototype`).
2. Upload or push the contents of this folder to the `main` branch:
   ```bash
   git init
   git add .
   git commit -m "Initial LinguaCoach BYOK prototype"
   git branch -M main
   git remote add origin https://github.com/<your-username>/<your-repo>.git
   git push -u origin main
   ```
3. In your GitHub repository, open **Settings → Pages**.
4. Under **Build and deployment**, set **Source** to **Deploy from a branch**, select branch **`main`** and folder **`/ (root)`**, then click **Save**.
5. After ~1 minute, your live prototype will be available at:
   `https://<your-username>.github.io/<your-repo>/`

---

## Run Locally

Because this prototype has zero build steps or external npm dependencies:

- **Option 1 (Quickest)**: Double-click `index.html` to open directly in your browser.
- **Option 2 (Local HTTP server — recommended for best browser API compatibility)**:
  ```bash
  # Using Python
  python -m http.server 8080
  # or using Node.js
  npx serve .
  ```
  Then open `http://localhost:8080`.

### Run Automated Unit Tests

Requires Node.js 18+:

```bash
node --test tests/core.test.mjs
```

---

## Project Structure

```text
linguacoach-prototype/
├── index.html           # Main application layout (Studio + Evaluation Lab + Modals)
├── css/
│   └── styles.css       # CCC8015 design system (#0B2545 Navy, #0F766E Teal, #F59E0B Amber)
├── js/
│   ├── kb.js            # Curated CEFR English & Spanish grammar/pedagogy knowledge base
│   ├── rag.js           # Client-side weighted lexical/tag RAG retriever
│   ├── pii.js           # Pre-flight PII detector/redactor & distress signal scanner
│   ├── prompt.js        # System prompt builder, guardrails & structured state parser
│   ├── llm.js           # Direct browser BYOK fetch client (SSE streaming + presets)
│   ├── demos.js         # 4 demo walkthroughs & offline Sandbox Mode simulator
│   ├── tests.js         # 7-case CCC8015 evaluation suite & Markdown report exporter
│   └── app.js           # UI controller & state synchronization
├── tests/
│   └── core.test.mjs    # Automated Node.js unit tests
├── LICENSE
└── README.md
```

---

## Scope Limitations & Disclosure

- **Text-based practice partner**: Optional browser Speech-to-Text (Web Speech API) is provided purely for convenience where supported; LinguaCoach does **not** perform pronunciation scoring or official CEFR assessment.
- **Fictional demos & sandbox**: Built-in demo scenarios and Sandbox Mode use fictional data and deterministic rules. Report live evaluation findings only from actual API runs exported from the Evaluation Lab.

---

## References

- Council of Europe. (2020). *Common European Framework of Reference for Languages: Learning, teaching, assessment – Companion volume*. Council of Europe Publishing.
- MacIntyre, P. D., & Gregersen, T. (2012). Affect: The role of language anxiety and other emotions in language learning. In S. Mercer, S. Ryan, & M. Williams (Eds.), *Psychology for language learning* (pp. 103–118). Palgrave Macmillan.
- National Institute of Standards and Technology. (2024). *Artificial intelligence risk management framework: Generative AI profile* (NIST AI 600-1).
- UNESCO. (2023). *Guidance for generative AI in education and research*. UNESCO.
