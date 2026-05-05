"use client";
import { useState } from "react";
import ResultCard from "@/components/ResultCard";

const EXAMPLE_REPOS = [
  { url: "https://github.com/vercel/next.js", label: "next.js", type: "Exceptional" },
  { url: "https://github.com/facebook/react", label: "react", type: "Exceptional" },
  { url: "https://github.com/bradtraversy/50projects50days", label: "50projects50days", type: "Tutorial" },
];

export default function Home() {
  const [url, setUrl] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);
  const [loadingStep, setLoadingStep] = useState(0);

  const loadingSteps = [
    "Fetching repository data...",
    "Reading commits and structure...",
    "Checking dependencies and tests...",
    "Running AI analysis...",
    "Generating your report...",
  ];

  async function analyze(repoUrl) {
    const target = repoUrl || url;
    if (!target.trim()) return;

    setLoading(true);
    setError(null);
    setResult(null);
    setLoadingStep(0);

    const stepInterval = setInterval(() => {
      setLoadingStep((s) => Math.min(s + 1, loadingSteps.length - 1));
    }, 2200);

    try {
      const res = await fetch("/api/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ repoUrl: target }),
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        setError(data.error || "Analysis failed. Please try again.");
      } else {
        setResult(data);
        if (repoUrl) setUrl(repoUrl);
      }
    } catch (e) {
      setError("Network error. Please check your connection and try again.");
    } finally {
      clearInterval(stepInterval);
      setLoading(false);
    }
  }

  function handleKey(e) {
    if (e.key === "Enter") analyze();
  }

  return (
    <div style={{ minHeight: "100vh", background: "var(--bg)" }}>
      {/* Header */}
      <header style={{
        borderBottom: "1px solid var(--border)",
        padding: "0 24px",
        height: 56,
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        position: "sticky",
        top: 0,
        background: "rgba(10,10,15,0.9)",
        backdropFilter: "blur(12px)",
        zIndex: 100,
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <div style={{
            width: 28, height: 28, borderRadius: 8,
            background: "linear-gradient(135deg, var(--accent), var(--accent2))",
            display: "flex", alignItems: "center", justifyContent: "center",
            fontSize: 14,
          }}>⚡</div>
          <span style={{ fontFamily: "var(--font-display)", fontWeight: 700, fontSize: 17, letterSpacing: "-0.02em" }}>
            GitSignal
          </span>
        </div>
        <span style={{ fontSize: 12, color: "var(--text-muted)", fontFamily: "var(--font-mono)" }}>
          Brutally honest repo analysis
        </span>
      </header>

      {/* Hero */}
      {!result && !loading && (
        <div style={{ padding: "80px 24px 40px", maxWidth: 700, margin: "0 auto", textAlign: "center" }}>
          <div className="fade-up" style={{
            display: "inline-block",
            fontSize: 11, fontWeight: 500, letterSpacing: "0.12em",
            color: "var(--accent)", textTransform: "uppercase",
            background: "rgba(124,106,255,0.12)", border: "1px solid rgba(124,106,255,0.25)",
            padding: "4px 12px", borderRadius: 20, marginBottom: 24,
            fontFamily: "var(--font-mono)",
          }}>
            AI-Powered Repo Analysis
          </div>

          <h1 className="fade-up-1" style={{
            fontSize: "clamp(2rem, 6vw, 3.5rem)",
            fontWeight: 800, lineHeight: 1.1,
            letterSpacing: "-0.03em", marginBottom: 20,
          }}>
            See what your GitHub<br />
            <span style={{
              background: "linear-gradient(135deg, var(--accent), var(--accent2))",
              WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent",
            }}>
              actually says about you
            </span>
          </h1>

          <p className="fade-up-2" style={{
            fontSize: 17, color: "var(--text-muted)", marginBottom: 40,
            lineHeight: 1.7, maxWidth: 520, margin: "0 auto 40px",
          }}>
            Not just stats. Real judgment — score, tutorial detection, commit quality, recruiter POV.
            Know if your project actually stands out.
          </p>

          <div className="fade-up-3" style={{ display: "flex", gap: 10, maxWidth: 580, margin: "0 auto 20px" }}>
            <input
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              onKeyDown={handleKey}
              placeholder="https://github.com/username/repo"
              style={{
                flex: 1, padding: "14px 18px",
                background: "var(--bg3)", border: "1px solid var(--border)",
                borderRadius: 10, color: "var(--text)",
                fontFamily: "var(--font-mono)", fontSize: 13,
                outline: "none", transition: "border 0.2s",
              }}
              onFocus={(e) => (e.target.style.borderColor = "var(--accent)")}
              onBlur={(e) => (e.target.style.borderColor = "var(--border)")}
            />
            <button
              onClick={() => analyze()}
              disabled={!url.trim()}
              style={{
                padding: "14px 24px", borderRadius: 10,
                background: url.trim()
                  ? "linear-gradient(135deg, var(--accent), var(--accent2))"
                  : "var(--bg3)",
                border: "none", color: "#fff", fontFamily: "var(--font-display)",
                fontWeight: 600, fontSize: 14,
                cursor: url.trim() ? "pointer" : "not-allowed",
                transition: "all 0.2s", whiteSpace: "nowrap",
                opacity: url.trim() ? 1 : 0.5,
              }}
            >
              Analyze →
            </button>
          </div>

          <div className="fade-up-4" style={{
            display: "flex", gap: 8, justifyContent: "center", flexWrap: "wrap", marginTop: 20,
          }}>
            <span style={{ fontSize: 12, color: "var(--text-dim)", alignSelf: "center" }}>Try:</span>
            {EXAMPLE_REPOS.map((ex) => (
              <button
                key={ex.url}
                onClick={() => { setUrl(ex.url); analyze(ex.url); }}
                style={{
                  padding: "5px 12px", borderRadius: 20, fontSize: 12,
                  background: "var(--bg3)", border: "1px solid var(--border)",
                  color: "var(--text-muted)", cursor: "pointer",
                  fontFamily: "var(--font-mono)", transition: "all 0.2s",
                }}
                onMouseEnter={(e) => { e.target.style.borderColor = "var(--accent)"; e.target.style.color = "var(--text)"; }}
                onMouseLeave={(e) => { e.target.style.borderColor = "var(--border)"; e.target.style.color = "var(--text-muted)"; }}
              >
                {ex.label}
              </button>
            ))}
          </div>

          <div className="fade-up-5" style={{
            display: "flex", gap: 8, justifyContent: "center", flexWrap: "wrap", marginTop: 60,
          }}>
            {[
              "Score 0–10", "Tutorial Detection", "Commit Quality",
              "Dependency Analysis", "Recruiter POV", "Red Flag Detector",
              "Skill Signals", "README Grade", "Hiring Signal",
            ].map((f) => (
              <span key={f} style={{
                padding: "5px 12px", borderRadius: 20, fontSize: 12,
                border: "1px solid var(--border)", color: "var(--text-dim)",
              }}>
                {f}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Loading */}
      {loading && (
        <div style={{ padding: "80px 24px", maxWidth: 500, margin: "0 auto", textAlign: "center" }}>
          <div style={{ marginBottom: 32, position: "relative", display: "inline-block" }}>
            <div style={{
              width: 72, height: 72, borderRadius: "50%",
              border: "2px solid var(--border)",
              borderTop: "2px solid var(--accent)",
              animation: "spin-slow 1s linear infinite",
            }} />
            <div style={{
              position: "absolute", inset: 0,
              display: "flex", alignItems: "center", justifyContent: "center",
              fontSize: 24,
            }}>⚡</div>
          </div>

          <div style={{ fontFamily: "var(--font-display)", fontSize: 20, fontWeight: 600, marginBottom: 12 }}>
            Analyzing repository...
          </div>
          <div style={{ fontSize: 14, color: "var(--accent)", fontFamily: "var(--font-mono)", marginBottom: 32 }}>
            {loadingSteps[loadingStep]}
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            {[200, 120, 160, 100].map((w, i) => (
              <div key={i} style={{ display: "flex", gap: 12, alignItems: "center" }}>
                <div className="skeleton" style={{ width: 40, height: 40, borderRadius: 8, flexShrink: 0 }} />
                <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: 6 }}>
                  <div className="skeleton" style={{ height: 12, width: `${w}px`, maxWidth: "100%" }} />
                  <div className="skeleton" style={{ height: 10, width: `${w * 0.6}px`, maxWidth: "80%" }} />
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Error */}
      {error && !loading && (
        <div style={{ padding: "40px 24px", maxWidth: 600, margin: "0 auto" }}>
          <div style={{
            background: "rgba(244,63,94,0.1)", border: "1px solid rgba(244,63,94,0.3)",
            borderRadius: 12, padding: "16px 20px", display: "flex", gap: 12, alignItems: "flex-start",
          }}>
            <span style={{ fontSize: 18, flexShrink: 0 }}>⚠️</span>
            <div>
              <div style={{ fontWeight: 500, marginBottom: 4, color: "var(--red)" }}>Analysis failed</div>
              <div style={{ fontSize: 13, color: "var(--text-muted)" }}>{error}</div>
            </div>
          </div>
          <button
            onClick={() => setError(null)}
            style={{
              marginTop: 16, padding: "10px 20px", borderRadius: 8,
              background: "var(--bg3)", border: "1px solid var(--border)",
              color: "var(--text)", cursor: "pointer", fontSize: 13,
            }}
          >
            ← Try another repo
          </button>
        </div>
      )}

      {/* Results */}
      {result && !loading && (
        <div style={{ maxWidth: 780, margin: "0 auto", padding: "32px 24px 80px" }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 28 }}>
            <button
              onClick={() => { setResult(null); setError(null); }}
              style={{
                padding: "8px 16px", borderRadius: 8, fontSize: 13,
                background: "var(--bg3)", border: "1px solid var(--border)",
                color: "var(--text-muted)", cursor: "pointer",
              }}
            >
              ← Analyze another
            </button>
            <div style={{ display: "flex", gap: 8, flex: 1, maxWidth: 400, marginLeft: 16 }}>
              <input
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                onKeyDown={handleKey}
                placeholder="Try another repo URL..."
                style={{
                  flex: 1, padding: "8px 12px", borderRadius: 8,
                  background: "var(--bg3)", border: "1px solid var(--border)",
                  color: "var(--text)", fontSize: 12,
                  fontFamily: "var(--font-mono)", outline: "none",
                }}
              />
              <button
                onClick={() => analyze()}
                style={{
                  padding: "8px 14px", borderRadius: 8, fontSize: 12,
                  background: "var(--accent)", border: "none",
                  color: "#fff", cursor: "pointer", fontWeight: 600,
                }}
              >
                Go
              </button>
            </div>
          </div>

          <ResultCard data={result} />
        </div>
      )}
    </div>
  );
}
