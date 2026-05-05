import OpenAI from "openai";
import { GoogleGenerativeAI } from "@google/generative-ai";

// Route to Gemini if README is large OR if we want full-detail analysis
// Groq is fast but has a tighter context window (~32k tokens total input+output)
const GEMINI_THRESHOLD = 4000; // chars — use Gemini above this for reliability

// Compact prompt for Groq (fast, tight context)
function buildGroqPrompt(data) {
  const { repoInfo, readme, fileTree, dependencyFile, dependencyFileName, commits, languages, testSignals, redFlags } = data;

  const commitMessages = commits.slice(0, 20)
    .map((c, i) => `${i + 1}. "${c.message}" (${c.date?.slice(0, 10)})`)
    .join("\n");

  const langList = Object.entries(languages).map(([l, b]) => `${l}: ${b}b`).join(", ");

  const depCount = dependencyFile
    ? dependencyFileName === "package.json"
      ? (dependencyFile.match(/"[^"]+"\s*:/g) || []).length
      : dependencyFile.split("\n").filter((l) => l.trim() && !l.startsWith("#")).length
    : "unknown";

  const commitDates = commits.map(c => new Date(c.date)).filter(d => !isNaN(d));
  const daySpan = commitDates.length >= 2
    ? Math.round((Math.max(...commitDates) - Math.min(...commitDates)) / 86400000)
    : null;

  return `You are a senior engineer doing a brutally honest code review of a GitHub repo. Return ONLY valid JSON, no markdown, no backticks.

REPO: ${repoInfo.fullName}
Description: ${repoInfo.description || "none"}
Language: ${repoInfo.language} | Languages: ${langList}
Stars: ${repoInfo.stars} | Forks: ${repoInfo.forks} | Size: ${repoInfo.size}KB
Created: ${repoInfo.createdAt?.slice(0, 10)} | Pushed: ${repoInfo.pushedAt?.slice(0, 10)}
Commit span: ${daySpan !== null ? daySpan + " days" : "unknown"}
Topics: ${repoInfo.topics?.join(", ") || "none"}

README (first 1500 chars):
${readme.slice(0, 1500)}

FILE TREE (root):
${fileTree.slice(0, 40).join("\n")}

DEPS (${dependencyFileName || "none"}): count=${depCount}
${dependencyFile ? dependencyFile.slice(0, 600) : "none"}

COMMITS (last 20):
${commitMessages}

TESTS: ${testSignals.join(", ") || "none"}
PRE-DETECTED FLAGS: ${redFlags.join("; ") || "none"}

Score calibration:
1-3 = tutorial/abandoned, 4-5 = common beginner, 6-7 = genuine effort + some original decisions,
8-9 = production-adjacent thinking, 10 = exceptional

Tutorial signals: all commits in <48h, generic names, exact boilerplate structure, no iteration evidence
Impresses seniors: custom error handling, edge case thinking, commit story, WHY in README, tests that test behavior, minimal justified deps

Return this exact JSON (all fields required, be specific to THIS repo — no generic statements):

{
  "verdict": "one sharp sentence referencing something specific in this repo",
  "overallScore": 6.2,
  "label": "Solid Work",
  "labelColor": "blue",
  "scores": {
    "signalVsNoise":    { "score": 6.0, "reason": "specific evidence from repo" },
    "originality":      { "score": 4.5, "reason": "specific evidence" },
    "codeQuality":      { "score": 7.0, "reason": "specific evidence" },
    "commitQuality":    { "score": 3.5, "reason": "quote or describe actual commit patterns" },
    "recruiterImpact":  { "score": 5.8, "reason": "specific portfolio signal" }
  },
  "signalNoisePercent": { "signal": 35, "noise": 65 },
  "tutorialDetection": {
    "isTutorial": true,
    "confidence": "high",
    "reason": "specific evidence: commit timing, dep fingerprint, folder match"
  },
  "whatImpresses": ["specific thing 1 — name the file or pattern", "specific thing 2"],
  "whatConcerns":  ["specific concern 1 — reference real file or absence", "specific concern 2"],
  "skillSignals": {
    "demonstrated": ["skill — specific qualifier"],
    "missing":      ["skill — why absence is notable here"]
  },
  "commitAnalysis": {
    "totalAnalyzed": 20,
    "meaningfulCount": 4,
    "pattern": "one sentence on observable pattern",
    "verdict": "one honest sentence",
    "bestCommit": "quote or describe most meaningful commit, or null",
    "worstPattern": "describe weakest pattern with example, or null"
  },
  "dependencyAnalysis": {
    "count": 34,
    "verdict": "specific — name actual deps",
    "redFlags":   ["dep name and why"],
    "greenFlags": ["dep name and why"]
  },
  "readmeQuality": {
    "score": 6.0,
    "hasPurpose": true,
    "hasSetupInstructions": true,
    "hasScreenshots": false,
    "hasTechStack": true,
    "verdict": "specific — what's present and what one addition would most help",
    "missingElements": ["specific missing element"]
  },
  "testCoverage": {
    "hasTests": false,
    "verdict": "specific — what to test in THIS project, not generic advice"
  },
  "redFlags": ["flag 1", "flag 2"],
  "improvements": [
    { "priority": "high",   "title": "short specific title", "what": "exactly what to do — reference actual files", "why": "why recruiter cares", "effort": "low" },
    { "priority": "high",   "title": "title 2", "what": "what to do", "why": "why it matters", "effort": "medium" },
    { "priority": "medium", "title": "title 3", "what": "what to do", "why": "why it matters", "effort": "medium" },
    { "priority": "medium", "title": "title 4", "what": "what to do", "why": "why it matters", "effort": "medium" },
    { "priority": "low",    "title": "title 5", "what": "what to do", "why": "why it rounds out signal", "effort": "low" }
  ],
  "recruiterPOV": "2-3 sentences as a senior engineer who just spent 90 seconds here. specific. end with pass/maybe/proceed reasoning.",
  "hiringSignal": "maybe",
  "hiringSignalReason": "one sentence — specific evidence for this bucket"
}

Label: "Tutorial Clone"=red | "Decent but Common"=amber | "Solid Work"=blue | "Impressive"=green | "Exceptional"=green
hiringSignal: "pass"=tutorial/abandoned | "maybe"=some signal needs more | "proceed"=clear original thinking`;
}

// Full detail prompt for Gemini (1M context, more thorough)
function buildPrompt(data) {
  const {
    repoInfo,
    readme,
    fileTree,
    dependencyFile,
    dependencyFileName,
    commits,
    languages,
    testSignals,
    redFlags,
  } = data;

  const commitMessages = commits
    .map((c, i) => `${i + 1}. "${c.message}" (${c.date?.slice(0, 10)}) by ${c.author}`)
    .join("\n");

  const langList = Object.entries(languages)
    .map(([l, b]) => `${l}: ${b} bytes`)
    .join(", ");

  const depCount = dependencyFile
    ? dependencyFileName === "package.json"
      ? (dependencyFile.match(/"[^"]+"\s*:/g) || []).length
      : dependencyFile.split("\n").filter((l) => l.trim() && !l.startsWith("#")).length
    : "unknown";

  // Detect commit time span
  const commitDates = commits.map(c => new Date(c.date)).filter(d => !isNaN(d));
  const daySpan = commitDates.length >= 2
    ? Math.round((Math.max(...commitDates) - Math.min(...commitDates)) / (1000 * 60 * 60 * 24))
    : null;

  return `You are a principal engineer at a top-tier tech company (Stripe, Vercel, Linear caliber) who also leads technical interviews. You have reviewed thousands of GitHub portfolios. You are NOT being nice — you are being useful. Your job is to give the kind of specific, honest, actionable feedback that a great mentor gives behind closed doors.

You have access to the following repo data. Read ALL of it before scoring anything.

=== REPOSITORY DATA ===
Name: ${repoInfo.fullName}
Description: ${repoInfo.description || "None provided"}
Primary Language: ${repoInfo.language}
All Languages: ${langList || "unknown"}
Stars: ${repoInfo.stars} | Forks: ${repoInfo.forks} | Open Issues: ${repoInfo.openIssues}
Created: ${repoInfo.createdAt?.slice(0, 10)} | Last pushed: ${repoInfo.pushedAt?.slice(0, 10)}
Repo size: ${repoInfo.size} KB
Topics: ${repoInfo.topics?.join(", ") || "none"}
Commit time span: ${daySpan !== null ? `${daySpan} days` : "unknown"}

README (first 3000 chars):
---
${readme.slice(0, 3000)}
---

FILE STRUCTURE (root level):
${fileTree.slice(0, 80).join("\n")}

DEPENDENCY FILE (${dependencyFileName || "none found"}):
---
${dependencyFile ? dependencyFile.slice(0, 2000) : "Not found"}
---
Estimated dependency count: ${depCount}

LAST ${commits.length} COMMITS (newest first):
${commitMessages}

TEST FILES DETECTED: ${testSignals.length > 0 ? testSignals.join(", ") : "None found"}

PRE-DETECTED RED FLAGS: ${redFlags.length > 0 ? redFlags.join("; ") : "None"}

=== YOUR EVALUATION FRAMEWORK ===

Before scoring, work through these 5 questions internally:
1. Does this person know what they're building and why? (README clarity, stated purpose, description)
2. Did they make real architectural decisions or just follow a tutorial? (structure, abstractions, naming)
3. Can they ship and maintain? (commit history, dep hygiene, project completion)
4. Do they write code other engineers can work with? (naming, modularity, test presence)
5. Does this project show curiosity and ownership, or checkbox completion?

=== SCORING CALIBRATION ===
Score 1-3: Tutorial clone, no original thought, abandoned, or clearly broken
Score 4-5: Common beginner project, functional but no depth signal
Score 6-7: Genuine effort, some original decisions, usable and maintained
Score 8-9: Production-adjacent thinking, clear architecture, maintainable
Score 10: Exceptional — original, well-documented, tested, tells a story

=== WHAT IMPRESSES SENIOR ENGINEERS (look for these) ===
- Custom error handling beyond basic try/catch
- Evidence of thinking about edge cases (validation, empty states, loading states)
- Separation of concerns that wasn't required by any tutorial
- Commit messages that tell a story of problem-solving
- A README that explains WHY, not just HOW to run it
- Tests that test behavior (what it does) not just implementation (how it does it)
- Config/env handling done properly (.env.example present, no hardcoded secrets)
- Thoughtful dependency choices — minimal, justified, up to date

=== WHAT SIGNALS TUTORIAL WORK ===
- All commits within 24-72 hours of each other
- Generic names: MyComponent, TestPage, App.js with 400+ lines
- Dependencies that exactly mirror a course's package.json
- README copied from the tutorial
- No evidence of debugging or iteration in commits ("initial commit" then "done")
- Folder structure identical to a boilerplate with no adaptation
- Features that don't connect to each other (isolated modules)

=== IMPROVEMENT RULES — CRITICAL ===
Every improvement MUST:
- Be specific to THIS repo (name files, folders, patterns you actually saw)
- Tell them exactly WHAT to do with enough detail to act on immediately
- Explain WHY it matters to a reviewer/recruiter looking at their portfolio
- Be prioritized: high = will meaningfully change recruiter perception, medium = good signal, low = polish
- Never say "add tests" without saying what to test and why it matters for this specific project
- Never say "improve README" without saying what's missing and what a strong version includes
- Never give generic advice that could apply to any repo

=== OUTPUT REQUIREMENTS ===
Return ONLY a valid JSON object. No markdown. No backticks. No explanation outside the JSON.
Every text field must reference something SPECIFIC from the repo data above — a filename, a commit message, a dependency name, a README section. Generic statements are NOT acceptable.

{
  "verdict": "One sentence. Brutally honest, specific — must reference something you actually saw (a file, commit pattern, a dep choice, a structural decision). NOT generic. Written like a mentor who respects the person enough to be honest.",
  "overallScore": 6.2,
  "label": "Solid Work",
  "labelColor": "blue",

  "scores": {
    "signalVsNoise": {
      "score": 6.0,
      "reason": "Specific sentence referencing actual evidence — name files, dep choices, or commit patterns you observed"
    },
    "originality": {
      "score": 4.5,
      "reason": "Specific evidence: did you see original architecture decisions or signs this follows a template exactly?"
    },
    "codeQuality": {
      "score": 7.0,
      "reason": "Reference structural decisions visible from the file tree, README, or dep file"
    },
    "commitQuality": {
      "score": 3.5,
      "reason": "Reference specific commit message patterns — quote actual good or bad messages you saw"
    },
    "recruiterImpact": {
      "score": 5.8,
      "reason": "What signal does this portfolio entry send and why — be specific about what's present or absent"
    }
  },

  "signalNoisePercent": { "signal": 35, "noise": 65 },

  "tutorialDetection": {
    "isTutorial": true,
    "confidence": "high",
    "reason": "Specific evidence: commit timing (e.g. all 23 commits in 2 days), dep fingerprint, folder match, or README language"
  },

  "whatImpresses": [
    "Specific thing a senior engineer would notice positively — name the exact file or pattern. Only include if genuinely present.",
    "Specific thing 2 — only include if real evidence exists",
    "Specific thing 3 — omit this if only 2 genuine things found"
  ],

  "whatConcerns": [
    "Specific concern with why it matters to a reviewer — reference a real file, pattern, or absence",
    "Specific concern 2",
    "Specific concern 3"
  ],

  "skillSignals": {
    "demonstrated": [
      "Skill name — brief specific qualifier (e.g. 'REST API design — clean route separation in /api/analyze')"
    ],
    "missing": [
      "Missing skill — why its absence is notable here (e.g. 'Input validation — /api/analyze route accepts any string without sanitization')"
    ]
  },

  "commitAnalysis": {
    "totalAnalyzed": 30,
    "meaningfulCount": 4,
    "pattern": "One sentence on the observable pattern: burst upload, steady iteration, abandoned, WIP dumps, etc.",
    "verdict": "One honest sentence. If commits are poor, describe what good commit history for this type of project looks like.",
    "bestCommit": "Quote or closely describe the single most meaningful commit message if one exists, else null",
    "worstPattern": "Describe the weakest commit pattern with a quoted example message, else null"
  },

  "dependencyAnalysis": {
    "count": 34,
    "verdict": "Specific: name bloated, outdated, redundant, or well-chosen deps. Flag anything that raises questions.",
    "redFlags": ["specific dep name and why it's a concern"],
    "greenFlags": ["specific dep name and why it shows good judgment"]
  },

  "readmeQuality": {
    "score": 6.0,
    "hasPurpose": true,
    "hasSetupInstructions": true,
    "hasScreenshots": false,
    "hasTechStack": true,
    "verdict": "Specific: what's present, what's missing, what ONE addition would most improve recruiter impression",
    "missingElements": ["specific element that would make this README recruiter-grade"]
  },

  "testCoverage": {
    "hasTests": false,
    "verdict": "Specific: what should be tested in THIS project (name the actual functions/routes/flows), not generic advice"
  },

  "improvements": [
    {
      "priority": "high",
      "title": "Short specific title — not generic",
      "what": "Exactly what to do — reference actual files or patterns from this repo. Enough detail to act on today.",
      "why": "Why a senior engineer or recruiter cares about this for THIS project specifically.",
      "effort": "low"
    },
    {
      "priority": "high",
      "title": "Second high-priority improvement",
      "what": "Exactly what to do — specific to this repo",
      "why": "Why it matters for recruiter signal",
      "effort": "medium"
    },
    {
      "priority": "medium",
      "title": "Third improvement",
      "what": "Exactly what to do",
      "why": "Why it matters",
      "effort": "medium"
    },
    {
      "priority": "medium",
      "title": "Fourth improvement",
      "what": "Exactly what to do",
      "why": "Why it matters",
      "effort": "medium"
    },
    {
      "priority": "low",
      "title": "Fifth improvement — polish level",
      "what": "Exactly what to do",
      "why": "Why it rounds out the portfolio signal",
      "effort": "low"
    }
  ],

  "recruiterPOV": "2-3 sentences written as a senior engineer who just spent 90 seconds on this repo. Direct, specific, references something real. End with whether you'd move forward with this candidate and why.",

  "hiringSignal": "maybe",
  "hiringSignalReason": "One sentence. What specific evidence pushes this into pass / maybe / proceed."
}

Label values: "Tutorial Clone" | "Decent but Common" | "Solid Work" | "Impressive" | "Exceptional"
labelColor values: "red" for Tutorial Clone | "amber" for Decent but Common | "blue" for Solid Work | "green" for Impressive or Exceptional
hiringSignal values: "pass" | "maybe" | "proceed"
- pass: tutorial clone, no original thinking, or abandoned
- maybe: some signal but needs more work or conversation to evaluate  
- proceed: clear original thinking, maintainable code, or impressive scope`;
}

export async function analyzeWithAI(data) {
  const readmeLength = data.readmeLength || 0;

  // Use Gemini for large repos OR when only Gemini key is available
  if (readmeLength > GEMINI_THRESHOLD || (!process.env.GROQ_API_KEY && process.env.GEMINI_API_KEY)) {
    const prompt = buildPrompt(data);
    return analyzeWithGemini(prompt);
  }

  // Try Groq first with compact prompt, fall back to Gemini on any failure
  try {
    const prompt = buildGroqPrompt(data);
    return await analyzeWithGroq(prompt);
  } catch (groqError) {
    console.warn("Groq failed, falling back to Gemini:", groqError.message);
    if (process.env.GEMINI_API_KEY) {
      const prompt = buildPrompt(data);
      return analyzeWithGemini(prompt);
    }
    throw groqError;
  }
}

async function analyzeWithGroq(prompt) {
  const client = new OpenAI({
    apiKey: process.env.GROQ_API_KEY,
    baseURL: "https://api.groq.com/openai/v1",
  });

  const completion = await client.chat.completions.create({
    model: "llama-3.3-70b-versatile",
    messages: [
      {
        role: "system",
        content: "You are a senior engineer doing repo reviews. Return ONLY valid JSON. No markdown. No backticks. No text outside the JSON object. Be specific to the repo data — never generic.",
      },
      { role: "user", content: prompt },
    ],
    temperature: 0.1,
    max_tokens: 1800,
  });

  const raw = completion.choices[0]?.message?.content;
  if (!raw) throw new Error("Groq returned empty response");
  return parseAIResponse(raw);
}

async function analyzeWithGemini(prompt) {
  const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
  const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

  const result = await model.generateContent(
    `${prompt}\n\nCRITICAL: Return ONLY valid JSON. No markdown backticks. No text before or after the JSON object. Every field must reference specific evidence from the repo data.`
  );
  const text = result.response.text();
  if (!text) throw new Error("Gemini returned empty response");
  return parseAIResponse(text);
}

function parseAIResponse(raw) {
  let cleaned = raw.trim();
  if (cleaned.startsWith("```")) {
    cleaned = cleaned.replace(/^```(?:json)?\n?/, "").replace(/\n?```$/, "").trim();
  }
  const start = cleaned.indexOf("{");
  const end = cleaned.lastIndexOf("}");
  if (start !== -1 && end !== -1) {
    cleaned = cleaned.slice(start, end + 1);
  }
  try {
    return JSON.parse(cleaned);
  } catch (e) {
    throw new Error("AI returned malformed JSON. Please try again.");
  }
}
