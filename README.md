# GitSignal — GitHub Repository Analyzer

AI-powered repo analyzer that tells you what your GitHub actually says about you as a developer.

## What it does

Paste any public GitHub repo URL and get:

- **Overall score (0–10)** with circular ring UI
- **Engineer's verdict** — one honest sentence from a senior engineer's POV
- **Hiring signal** — Pass / Maybe / Proceed
- **Tutorial clone detection** — with specific evidence, not just a guess
- **Score breakdown** — Signal vs Noise, Originality, Code Quality, Commit Quality, Recruiter Impact
- **What impresses / what concerns** — specific to the actual repo, not generic
- **Skill signals** — demonstrated skills and notably absent ones
- **Commit analysis** — pattern, best commit, worst commit pattern
- **Dependency analysis** — count, red flags, green flags by name
- **Test coverage** — presence + specific advice on what to test
- **README quality** — score + what's missing
- **Recruiter POV** — 2–3 sentences as a real senior engineer
- **Improvements** — prioritized, specific (What + Why + Effort), never generic

## Setup

### 1. Clone and install
```bash
git clone https://github.com/yourusername/gitsignal
cd gitsignal
npm install
```

### 2. Set up environment variables
```bash
cp .env.example .env.local
```

Fill in `.env.local`:
```
GROQ_API_KEY=your_groq_key        # from console.groq.com
GEMINI_API_KEY=your_gemini_key    # from aistudio.google.com
GITHUB_TOKEN=your_github_token    # from github.com/settings/tokens
```

### 3. Run locally
```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

## Deploy to Vercel

1. Push to GitHub (`.env.local` is gitignored — keys are safe)
2. Import repo at [vercel.com](https://vercel.com)
3. Add environment variables in the Vercel dashboard
4. Deploy — then click **Redeploy** after adding env vars

## API Keys

| Key | Where to get | Free tier |
|-----|-------------|-----------|
| `GROQ_API_KEY` | [console.groq.com](https://console.groq.com) | Yes — generous |
| `GEMINI_API_KEY` | [aistudio.google.com](https://aistudio.google.com) | Yes — 1M context |
| `GITHUB_TOKEN` | [github.com/settings/tokens](https://github.com/settings/tokens) | Yes — public repos |

## AI Routing

- **Small repos** (README < 6000 chars): Groq → LLaMA 3.3 70B (fast)
- **Large repos** (README ≥ 6000 chars): Gemini 1.5 Flash (1M context window)

## Tech Stack

- Next.js 15 (App Router)
- Groq (LLaMA 3.3 70B) — primary AI
- Gemini 1.5 Flash — large repo fallback
- GitHub REST API
- Zero database (stateless MVP)
