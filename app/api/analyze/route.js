import { parseRepoUrl, fetchRepoData } from "@/lib/github";
import { analyzeWithAI } from "@/lib/ai";

export const maxDuration = 60;

export async function POST(req) {
  try {
    const { repoUrl } = await req.json();

    if (!repoUrl || typeof repoUrl !== "string") {
      return Response.json(
        { error: "Please provide a valid GitHub repository URL." },
        { status: 400 }
      );
    }

    let owner, repo;
    try {
      ({ owner, repo } = parseRepoUrl(repoUrl));
    } catch (e) {
      return Response.json({ error: e.message }, { status: 400 });
    }

    const hasGroq   = !!process.env.GROQ_API_KEY;
    const hasGemini = !!process.env.GEMINI_API_KEY;
    const hasGithub = !!process.env.GITHUB_TOKEN;

    console.log("[GitSignal] Keys — GROQ:", hasGroq, "| GEMINI:", hasGemini, "| GITHUB:", hasGithub);

    if (!hasGroq && !hasGemini) {
      return Response.json({
        error: "No AI API keys found. Make sure GROQ_API_KEY or GEMINI_API_KEY is in your .env.local and you RESTARTED the dev server after adding them.",
      }, { status: 500 });
    }

    let githubData;
    try {
      console.log(`[GitSignal] Fetching ${owner}/${repo}...`);
      githubData = await fetchRepoData(owner, repo);
      console.log(`[GitSignal] Fetched. README: ${githubData.readmeLength} chars, Commits: ${githubData.commits?.length}`);
    } catch (e) {
      console.error("[GitSignal] GitHub error:", e.message);
      return Response.json({ error: e.message }, { status: 400 });
    }

    let analysis;
    try {
      console.log("[GitSignal] Running AI analysis...");
      analysis = await analyzeWithAI(githubData);
      console.log("[GitSignal] Done. Keys:", Object.keys(analysis || {}).join(", "));
    } catch (e) {
      console.error("[GitSignal] AI ERROR:", e.message);
      console.error("[GitSignal] Full:", JSON.stringify(e, Object.getOwnPropertyNames(e)));
      return Response.json({ error: `AI analysis failed: ${e.message}` }, { status: 500 });
    }

    if (!analysis || typeof analysis !== "object") {
      return Response.json({ error: "AI returned invalid response. Please try again." }, { status: 500 });
    }

    const safeAnalysis = {
      verdict:            analysis.verdict            || "Analysis completed.",
      overallScore:       analysis.overallScore       ?? 5.0,
      label:              analysis.label              || "Decent but Common",
      labelColor:         analysis.labelColor         || "amber",
      scores:             analysis.scores             || {},
      signalNoisePercent: analysis.signalNoisePercent || { signal: 50, noise: 50 },
      tutorialDetection:  analysis.tutorialDetection  || { isTutorial: false, confidence: "low", reason: "Insufficient data." },
      whatImpresses:      analysis.whatImpresses      || analysis.strengths  || [],
      whatConcerns:       analysis.whatConcerns       || analysis.weaknesses || [],
      skillSignals:       analysis.skillSignals       || { demonstrated: [], missing: [] },
      commitAnalysis:     analysis.commitAnalysis     || {
        totalAnalyzed:   githubData.commits?.length || 0,
        meaningfulCount: 0,
        pattern:     "Not analyzed.",
        verdict:     "Not analyzed.",
        bestCommit:   null,
        worstPattern: null,
      },
      dependencyAnalysis: analysis.dependencyAnalysis || { count: 0, verdict: "Not analyzed.", redFlags: [], greenFlags: [] },
      readmeQuality:      analysis.readmeQuality      || { score: 5, verdict: "Not analyzed.", missingElements: [] },
      testCoverage:       analysis.testCoverage       || { hasTests: false, verdict: "Not analyzed." },
      redFlags:           analysis.redFlags           || [],
      improvements:       analysis.improvements       || [],
      recruiterPOV:       analysis.recruiterPOV       || "Analysis completed.",
      hiringSignal:       analysis.hiringSignal       || "maybe",
      hiringSignalReason: analysis.hiringSignalReason || "",
    };

    return Response.json({
      success: true,
      owner,
      repo,
      repoInfo: githubData.repoInfo,
      analysis: safeAnalysis,
      modelUsed: githubData.readmeLength > 6000 ? "gemini-1.5-flash" : "llama-3.3-70b",
      analyzedAt: new Date().toISOString(),
    });

  } catch (err) {
    console.error("[GitSignal] Uncaught:", err.message, err.stack);
    return Response.json({ error: `Something went wrong: ${err.message}` }, { status: 500 });
  }
}

// GET /api/analyze — verify your keys without running a full analysis
export async function GET() {
  return Response.json({
    status: "ok",
    env: {
      GROQ_API_KEY:   process.env.GROQ_API_KEY   ? `set (${process.env.GROQ_API_KEY.slice(0,8)}...)`   : "MISSING",
      GEMINI_API_KEY: process.env.GEMINI_API_KEY ? `set (${process.env.GEMINI_API_KEY.slice(0,8)}...)` : "MISSING",
      GITHUB_TOKEN:   process.env.GITHUB_TOKEN   ? `set (${process.env.GITHUB_TOKEN.slice(0,8)}...)`   : "not set (optional but recommended)",
    },
  });
}
