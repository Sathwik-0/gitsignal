"use client";

const LABEL_COLORS = {
  red:   { bg: "rgba(244,63,94,0.12)",  border: "rgba(244,63,94,0.3)",  text: "#f43f5e" },
  amber: { bg: "rgba(245,158,11,0.12)", border: "rgba(245,158,11,0.3)", text: "#f59e0b" },
  blue:  { bg: "rgba(59,130,246,0.12)", border: "rgba(59,130,246,0.3)", text: "#3b82f6" },
  green: { bg: "rgba(34,211,160,0.12)", border: "rgba(34,211,160,0.3)", text: "#22d3a0" },
};

const HIRING_CONFIG = {
  pass:    { bg: "rgba(244,63,94,0.1)",  border: "rgba(244,63,94,0.3)",  text: "#f43f5e", label: "Pass",    icon: "✗" },
  maybe:   { bg: "rgba(245,158,11,0.1)", border: "rgba(245,158,11,0.3)", text: "#f59e0b", label: "Maybe",   icon: "~" },
  proceed: { bg: "rgba(34,211,160,0.1)", border: "rgba(34,211,160,0.3)", text: "#22d3a0", label: "Proceed", icon: "✓" },
};

const EFFORT_COLOR = { low: "#22d3a0", medium: "#f59e0b", high: "#f43f5e" };
const PRIORITY_ORDER = { high: 0, medium: 1, low: 2 };

/* ── Shared primitives ─────────────────────────────────────────── */

function ScoreRing({ score }) {
  const size = 120, radius = 44, cx = 60, cy = 60;
  const circ = 2 * Math.PI * radius;
  const fill = (Math.min(score, 10) / 10) * circ;
  const color = score >= 7 ? "#22d3a0" : score >= 4.5 ? "#f59e0b" : "#f43f5e";
  return (
    <svg width={size} height={size} style={{ transform: "rotate(-90deg)", flexShrink: 0 }}>
      <circle cx={cx} cy={cy} r={radius} fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth="8" />
      <circle cx={cx} cy={cy} r={radius} fill="none" stroke={color} strokeWidth="8"
        strokeDasharray={`${fill} ${circ}`} strokeLinecap="round"
        style={{ transition: "stroke-dasharray 1s ease" }} />
      <text x={cx} y={cy} textAnchor="middle" dominantBaseline="central"
        style={{ transform: `rotate(90deg)`, transformOrigin: `${cx}px ${cy}px` }}
        fill={color} fontSize="26" fontWeight="700" fontFamily="'Syne',sans-serif">{score}</text>
      <text x={cx} y={cy + 18} textAnchor="middle"
        style={{ transform: `rotate(90deg)`, transformOrigin: `${cx}px ${cy}px` }}
        fill="rgba(255,255,255,0.35)" fontSize="10" fontFamily="'Inter',sans-serif">/ 10</text>
    </svg>
  );
}

function ScoreBar({ label, score, reason }) {
  const color = score >= 7 ? "#22d3a0" : score >= 4.5 ? "#f59e0b" : "#f43f5e";
  return (
    <div style={{ marginBottom: 18 }}>
      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 5 }}>
        <span style={{ fontSize: 13, color: "rgba(255,255,255,0.75)" }}>{label}</span>
        <span style={{ fontSize: 13, fontWeight: 600, color, fontFamily: "var(--font-mono)" }}>{score}</span>
      </div>
      <div style={{ height: 4, background: "rgba(255,255,255,0.07)", borderRadius: 3, overflow: "hidden", marginBottom: 5 }}>
        <div style={{ height: "100%", width: `${(score / 10) * 100}%`, background: color, borderRadius: 3, transition: "width 1.1s ease" }} />
      </div>
      {reason && <div style={{ fontSize: 12, color: "var(--text-muted)", lineHeight: 1.55 }}>{reason}</div>}
    </div>
  );
}

function Card({ title, emoji, children, delay = 0 }) {
  return (
    <div className={`fade-up-${delay}`} style={{
      background: "var(--bg3)", border: "1px solid var(--border)",
      borderRadius: 14, padding: "20px 22px", marginBottom: 14,
    }}>
      <div style={{
        fontSize: 11, fontWeight: 600, letterSpacing: "0.1em", color: "var(--text-muted)",
        textTransform: "uppercase", marginBottom: 16,
        fontFamily: "var(--font-display)", display: "flex", alignItems: "center", gap: 7,
      }}>
        <span>{emoji}</span>{title}
      </div>
      {children}
    </div>
  );
}

function Pill({ text, type = "neutral" }) {
  const map = {
    good:    { bg: "rgba(34,211,160,0.1)",  border: "rgba(34,211,160,0.25)",  color: "#22d3a0" },
    bad:     { bg: "rgba(244,63,94,0.1)",   border: "rgba(244,63,94,0.25)",   color: "#f43f5e" },
    neutral: { bg: "rgba(255,255,255,0.05)", border: "rgba(255,255,255,0.1)", color: "var(--text-muted)" },
  };
  const s = map[type] || map.neutral;
  return (
    <span style={{
      display: "inline-block", padding: "3px 10px", borderRadius: 20,
      fontSize: 12, background: s.bg, border: `1px solid ${s.border}`, color: s.color,
      margin: "3px 4px 3px 0", lineHeight: 1.6,
    }}>{text}</span>
  );
}

function BulletRow({ text, type }) {
  const borderColor = type === "good" ? "rgba(34,211,160,0.35)" : "rgba(244,63,94,0.35)";
  return (
    <div style={{
      fontSize: 13, color: "var(--text-muted)", marginBottom: 10,
      paddingLeft: 13, borderLeft: `2px solid ${borderColor}`, lineHeight: 1.6,
    }}>{text}</div>
  );
}

function MiniBox({ label, value, color, children }) {
  return (
    <div style={{ background: "rgba(255,255,255,0.03)", borderRadius: 10, padding: "12px 14px" }}>
      <div style={{ fontSize: 11, color: "var(--text-dim)", marginBottom: 5, textTransform: "uppercase", letterSpacing: "0.07em" }}>{label}</div>
      <div style={{ fontSize: 22, fontWeight: 800, fontFamily: "var(--font-display)", color: color || "var(--text)", marginBottom: 4 }}>{value ?? "—"}</div>
      {children}
    </div>
  );
}

/* ── Main component ────────────────────────────────────────────── */

export default function ResultCard({ data }) {
  const { owner, repo, repoInfo, analysis: a, modelUsed, analyzedAt } = data;

  const labelStyle  = LABEL_COLORS[a.labelColor]   || LABEL_COLORS.amber;
  const hiringCfg   = HIRING_CONFIG[a.hiringSignal] || null;

  const improvements = a.improvements
    ? [...a.improvements].sort((x, y) =>
        (PRIORITY_ORDER[x.priority] ?? 1) - (PRIORITY_ORDER[y.priority] ?? 1)
      )
    : [];

  function copyLink() {
    const u = `${window.location.origin}?repo=${encodeURIComponent(`https://github.com/${owner}/${repo}`)}`;
    navigator.clipboard.writeText(u).then(() => alert("Link copied!"));
  }

  /* ── Render ─────────────────────────────────────────── */
  return (
    <div>

      {/* ── Repo Header ── */}
      <div className="fade-up" style={{ marginBottom: 20 }}>
        <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 16, flexWrap: "wrap" }}>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 6, flexWrap: "wrap" }}>
              <a href={`https://github.com/${owner}/${repo}`} target="_blank" rel="noopener noreferrer"
                style={{ fontFamily: "var(--font-display)", fontSize: 22, fontWeight: 700, color: "var(--text)", textDecoration: "none" }}>
                {owner}/{repo}
              </a>
              <span style={{ padding: "3px 10px", borderRadius: 20, fontSize: 12, fontWeight: 600,
                background: labelStyle.bg, border: `1px solid ${labelStyle.border}`, color: labelStyle.text }}>
                {a.label}
              </span>
              {hiringCfg && (
                <span style={{ padding: "3px 10px", borderRadius: 20, fontSize: 12, fontWeight: 600,
                  background: hiringCfg.bg, border: `1px solid ${hiringCfg.border}`, color: hiringCfg.text }}>
                  {hiringCfg.icon} {hiringCfg.label}
                </span>
              )}
            </div>
            {repoInfo.description && (
              <p style={{ fontSize: 13, color: "var(--text-muted)", marginBottom: 8, maxWidth: 520 }}>{repoInfo.description}</p>
            )}
            <div style={{ display: "flex", gap: 14, fontSize: 12, color: "var(--text-dim)", flexWrap: "wrap" }}>
              {repoInfo.language && <span>● {repoInfo.language}</span>}
              <span>★ {repoInfo.stars?.toLocaleString()}</span>
              <span>⑂ {repoInfo.forks?.toLocaleString()}</span>
              <span style={{ fontFamily: "var(--font-mono)" }}>via {modelUsed}</span>
            </div>
          </div>
          <button onClick={copyLink} style={{
            padding: "8px 16px", borderRadius: 8, fontSize: 12,
            background: "var(--bg3)", border: "1px solid var(--border)",
            color: "var(--text-muted)", cursor: "pointer", flexShrink: 0,
          }}>Share ↗</button>
        </div>
      </div>

      {/* ── Red Flags (top) ── */}
      {a.redFlags?.length > 0 && (
        <div className="fade-up-1" style={{
          background: "rgba(244,63,94,0.07)", border: "1px solid rgba(244,63,94,0.2)",
          borderRadius: 12, padding: "14px 18px", marginBottom: 14,
          display: "flex", gap: 10, alignItems: "flex-start",
        }}>
          <span style={{ fontSize: 16, flexShrink: 0 }}>🚩</span>
          <div>
            <div style={{ fontSize: 11, fontWeight: 600, color: "#f43f5e", marginBottom: 7,
              textTransform: "uppercase", letterSpacing: "0.07em" }}>Red Flags</div>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
              {a.redFlags.map((f, i) => <Pill key={i} text={f} type="bad" />)}
            </div>
          </div>
        </div>
      )}

      {/* ── Verdict + Ring ── */}
      <div className="fade-up-1" style={{
        background: "var(--bg3)", border: "1px solid var(--border)",
        borderRadius: 14, padding: "22px", marginBottom: 14,
        display: "flex", gap: 20, alignItems: "center", flexWrap: "wrap",
      }}>
        <ScoreRing score={a.overallScore} />
        <div style={{ flex: 1, minWidth: 200 }}>
          <div style={{ fontSize: 11, fontWeight: 600, color: "var(--accent)",
            textTransform: "uppercase", letterSpacing: "0.1em",
            marginBottom: 8, fontFamily: "var(--font-mono)" }}>Engineer's Verdict</div>
          <p style={{ fontSize: 15, lineHeight: 1.7, color: "var(--text)", fontStyle: "italic", marginBottom: 10 }}>
            "{a.verdict}"
          </p>
          {a.hiringSignalReason && (
            <p style={{ fontSize: 12, color: "var(--text-muted)", lineHeight: 1.55 }}>
              {a.hiringSignalReason}
            </p>
          )}
        </div>
      </div>

      {/* ── Score Breakdown ── */}
      <Card title="Score Breakdown" emoji="📊" delay={2}>
        <ScoreBar label="Signal vs Noise"  score={a.scores?.signalVsNoise?.score}    reason={a.scores?.signalVsNoise?.reason} />
        <ScoreBar label="Originality"      score={a.scores?.originality?.score}       reason={a.scores?.originality?.reason} />
        <ScoreBar label="Code Quality"     score={a.scores?.codeQuality?.score}       reason={a.scores?.codeQuality?.reason} />
        <ScoreBar label="Commit Quality"   score={a.scores?.commitQuality?.score}     reason={a.scores?.commitQuality?.reason} />
        <ScoreBar label="Recruiter Impact" score={a.scores?.recruiterImpact?.score}   reason={a.scores?.recruiterImpact?.reason} />

        {a.signalNoisePercent && (
          <div style={{ marginTop: 18 }}>
            <div style={{ fontSize: 11, color: "var(--text-dim)", marginBottom: 7, textTransform: "uppercase", letterSpacing: "0.07em" }}>
              Signal vs Noise
            </div>
            <div style={{ height: 22, borderRadius: 6, overflow: "hidden", display: "flex", fontSize: 11, fontWeight: 600 }}>
              {a.signalNoisePercent.signal > 0 && (
                <div style={{
                  width: `${a.signalNoisePercent.signal}%`, background: "rgba(34,211,160,0.65)",
                  display: "flex", alignItems: "center", justifyContent: "center",
                  color: "#fff", transition: "width 1s ease",
                }}>
                  {a.signalNoisePercent.signal > 12 && `${a.signalNoisePercent.signal}% Signal`}
                </div>
              )}
              <div style={{
                flex: 1, background: "rgba(244,63,94,0.45)",
                display: "flex", alignItems: "center", justifyContent: "center", color: "#fff",
              }}>
                {a.signalNoisePercent.noise}% Noise
              </div>
            </div>
          </div>
        )}
      </Card>

      {/* ── Originality Check ── */}
      <Card title="Originality Check" emoji="🔍" delay={3}>
        <div style={{ display: "flex", alignItems: "flex-start", gap: 12 }}>
          <span style={{ fontSize: 22, flexShrink: 0 }}>{a.tutorialDetection?.isTutorial ? "⚠️" : "✅"}</span>
          <div>
            <div style={{
              fontSize: 14, fontWeight: 600,
              color: a.tutorialDetection?.isTutorial ? "#f59e0b" : "#22d3a0", marginBottom: 5,
            }}>
              {a.tutorialDetection?.isTutorial ? "Likely tutorial-based" : "Appears original"}
              {a.tutorialDetection?.confidence && (
                <span style={{ fontSize: 11, fontWeight: 400, color: "var(--text-dim)", marginLeft: 8 }}>
                  ({a.tutorialDetection.confidence} confidence)
                </span>
              )}
            </div>
            <div style={{ fontSize: 13, color: "var(--text-muted)", lineHeight: 1.6 }}>
              {a.tutorialDetection?.reason}
            </div>
          </div>
        </div>
      </Card>

      {/* ── What Impresses / Concerns ── */}
      <div className="fade-up-3" style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14, marginBottom: 14 }}>
        <div style={{ background: "var(--bg3)", border: "1px solid var(--border)", borderRadius: 14, padding: "18px 20px" }}>
          <div style={{ fontSize: 11, fontWeight: 600, color: "#22d3a0", textTransform: "uppercase",
            letterSpacing: "0.09em", marginBottom: 13, fontFamily: "var(--font-display)" }}>
            ✓ What Impresses
          </div>
          {(a.whatImpresses || a.strengths || []).map((s, i) => <BulletRow key={i} text={s} type="good" />)}
        </div>
        <div style={{ background: "var(--bg3)", border: "1px solid var(--border)", borderRadius: 14, padding: "18px 20px" }}>
          <div style={{ fontSize: 11, fontWeight: 600, color: "#f43f5e", textTransform: "uppercase",
            letterSpacing: "0.09em", marginBottom: 13, fontFamily: "var(--font-display)" }}>
            ✗ What Concerns
          </div>
          {(a.whatConcerns || a.weaknesses || []).map((w, i) => <BulletRow key={i} text={w} type="bad" />)}
        </div>
      </div>

      {/* ── Skill Signals ── */}
      <Card title="Skill Signals" emoji="🧠" delay={4}>
        <div style={{ marginBottom: 12 }}>
          <div style={{ fontSize: 12, color: "#22d3a0", fontWeight: 500, marginBottom: 7 }}>Demonstrated</div>
          <div>{(a.skillSignals?.demonstrated || []).map((s, i) => <Pill key={i} text={s} type="good" />)}</div>
        </div>
        <div>
          <div style={{ fontSize: 12, color: "#f43f5e", fontWeight: 500, marginBottom: 7 }}>Missing / Not Evident</div>
          <div>{(a.skillSignals?.missing || []).map((s, i) => <Pill key={i} text={s} type="bad" />)}</div>
        </div>
      </Card>

      {/* ── Commit Analysis ── */}
      <Card title="Commit Analysis" emoji="📈" delay={4}>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 10, marginBottom: 16 }}>
          <MiniBox label="Total analyzed"   value={a.commitAnalysis?.totalAnalyzed} />
          <MiniBox label="Meaningful msgs"  value={a.commitAnalysis?.meaningfulCount} />
          <MiniBox label="Quality ratio"    value={
            a.commitAnalysis?.totalAnalyzed
              ? `${Math.round((a.commitAnalysis.meaningfulCount / a.commitAnalysis.totalAnalyzed) * 100)}%`
              : "—"
          } />
        </div>

        <div style={{ fontSize: 13, color: "var(--text-muted)", lineHeight: 1.6, marginBottom: 6 }}>
          <strong style={{ color: "var(--text)", fontWeight: 500 }}>Pattern: </strong>
          {a.commitAnalysis?.pattern}
        </div>
        <div style={{ fontSize: 13, color: "var(--text-muted)", lineHeight: 1.6, fontStyle: "italic", marginBottom: 12 }}>
          "{a.commitAnalysis?.verdict}"
        </div>

        {(a.commitAnalysis?.bestCommit || a.commitAnalysis?.worstPattern) && (
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
            {a.commitAnalysis.bestCommit && (
              <div style={{
                background: "rgba(34,211,160,0.06)", border: "1px solid rgba(34,211,160,0.15)",
                borderRadius: 8, padding: "10px 13px",
              }}>
                <div style={{ fontSize: 10, color: "#22d3a0", textTransform: "uppercase",
                  letterSpacing: "0.08em", marginBottom: 5 }}>Best Commit</div>
                <div style={{ fontSize: 12, color: "var(--text-muted)", fontFamily: "var(--font-mono)", lineHeight: 1.5 }}>
                  {a.commitAnalysis.bestCommit}
                </div>
              </div>
            )}
            {a.commitAnalysis.worstPattern && (
              <div style={{
                background: "rgba(244,63,94,0.06)", border: "1px solid rgba(244,63,94,0.15)",
                borderRadius: 8, padding: "10px 13px",
              }}>
                <div style={{ fontSize: 10, color: "#f43f5e", textTransform: "uppercase",
                  letterSpacing: "0.08em", marginBottom: 5 }}>Weakest Pattern</div>
                <div style={{ fontSize: 12, color: "var(--text-muted)", fontFamily: "var(--font-mono)", lineHeight: 1.5 }}>
                  {a.commitAnalysis.worstPattern}
                </div>
              </div>
            )}
          </div>
        )}
      </Card>

      {/* ── Deps / Tests / README ── */}
      <div className="fade-up-5" style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 14, marginBottom: 14 }}>
        {/* Dependencies */}
        <div style={{ background: "var(--bg3)", border: "1px solid var(--border)", borderRadius: 14, padding: "18px 20px" }}>
          <div style={{ fontSize: 11, color: "var(--text-dim)", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 8 }}>Dependencies</div>
          <div style={{ fontSize: 28, fontWeight: 800, fontFamily: "var(--font-display)", marginBottom: 8,
            color: (a.dependencyAnalysis?.count ?? 0) > 20 ? "#f59e0b" : "#22d3a0" }}>
            {a.dependencyAnalysis?.count ?? "—"}
          </div>
          <div style={{ fontSize: 12, color: "var(--text-muted)", lineHeight: 1.5, marginBottom: 8 }}>
            {a.dependencyAnalysis?.verdict}
          </div>
          {a.dependencyAnalysis?.greenFlags?.map((f, i) => (
            <div key={i} style={{ fontSize: 11, color: "#22d3a0", marginTop: 3 }}>✓ {f}</div>
          ))}
          {a.dependencyAnalysis?.redFlags?.map((f, i) => (
            <div key={i} style={{ fontSize: 11, color: "#f43f5e", marginTop: 3 }}>✗ {f}</div>
          ))}
        </div>

        {/* Tests */}
        <div style={{ background: "var(--bg3)", border: "1px solid var(--border)", borderRadius: 14, padding: "18px 20px" }}>
          <div style={{ fontSize: 11, color: "var(--text-dim)", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 8 }}>Tests</div>
          <div style={{ fontSize: 28, fontWeight: 800, fontFamily: "var(--font-display)", marginBottom: 8,
            color: a.testCoverage?.hasTests ? "#22d3a0" : "#f43f5e" }}>
            {a.testCoverage?.hasTests ? "Yes" : "None"}
          </div>
          <div style={{ fontSize: 12, color: "var(--text-muted)", lineHeight: 1.5 }}>{a.testCoverage?.verdict}</div>
        </div>

        {/* README */}
        <div style={{ background: "var(--bg3)", border: "1px solid var(--border)", borderRadius: 14, padding: "18px 20px" }}>
          <div style={{ fontSize: 11, color: "var(--text-dim)", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 8 }}>README</div>
          <div style={{ fontSize: 28, fontWeight: 800, fontFamily: "var(--font-display)", marginBottom: 8,
            color: (a.readmeQuality?.score ?? 0) >= 7 ? "#22d3a0" : (a.readmeQuality?.score ?? 0) >= 4 ? "#f59e0b" : "#f43f5e" }}>
            {a.readmeQuality?.score ?? "—"}/10
          </div>
          <div style={{ fontSize: 12, color: "var(--text-muted)", lineHeight: 1.5, marginBottom: 8 }}>
            {a.readmeQuality?.verdict}
          </div>
          {a.readmeQuality?.missingElements?.map((el, i) => (
            <div key={i} style={{ fontSize: 11, color: "#f59e0b", marginTop: 3 }}>⊘ {el}</div>
          ))}
        </div>
      </div>

      {/* ── Recruiter POV ── */}
      <Card title="Recruiter POV" emoji="🎯" delay={5}>
        <p style={{ fontSize: 14, lineHeight: 1.8, color: "var(--text-muted)", fontStyle: "italic" }}>
          "{a.recruiterPOV}"
        </p>
      </Card>

      {/* ── Improvements ── */}
      <Card title="How to Improve" emoji="🚀" delay={6}>
        {improvements.length === 0 && (
          <div style={{ fontSize: 13, color: "var(--text-dim)" }}>No improvement data available.</div>
        )}
        {improvements.map((imp, i) => {
          // Handle both new object format and old string format
          if (typeof imp === "string") {
            return (
              <div key={i} style={{
                marginBottom: 10, padding: "13px 16px",
                background: "rgba(124,106,255,0.05)", border: "1px solid rgba(124,106,255,0.12)",
                borderRadius: 10,
              }}>
                <span style={{ fontSize: 13, fontWeight: 700, color: "var(--accent)",
                  fontFamily: "var(--font-mono)", marginRight: 10 }}>
                  {String(i + 1).padStart(2, "0")}
                </span>
                <span style={{ fontSize: 13, color: "var(--text-muted)", lineHeight: 1.6 }}>{imp}</span>
              </div>
            );
          }

          const priorityColor = imp.priority === "high" ? "#f43f5e" : imp.priority === "medium" ? "#f59e0b" : "#22d3a0";
          const effortColor   = EFFORT_COLOR[imp.effort] || "var(--text-muted)";

          return (
            <div key={i} style={{
              marginBottom: 12, padding: "15px 17px",
              background: "rgba(124,106,255,0.05)", border: "1px solid rgba(124,106,255,0.12)",
              borderRadius: 10,
            }}>
              {/* Header row */}
              <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 9, flexWrap: "wrap" }}>
                <span style={{ fontSize: 13, fontWeight: 700, color: "var(--accent)",
                  fontFamily: "var(--font-mono)", flexShrink: 0 }}>
                  {String(i + 1).padStart(2, "0")}
                </span>
                <span style={{ fontSize: 14, fontWeight: 600, color: "var(--text)", flex: 1 }}>
                  {imp.title}
                </span>
                {imp.priority && (
                  <span style={{
                    fontSize: 10, fontWeight: 700, color: priorityColor,
                    textTransform: "uppercase", letterSpacing: "0.08em",
                    background: `${priorityColor}18`, padding: "2px 8px", borderRadius: 10,
                    border: `1px solid ${priorityColor}40`,
                  }}>
                    {imp.priority}
                  </span>
                )}
                {imp.effort && (
                  <span style={{ fontSize: 10, color: effortColor, textTransform: "uppercase", letterSpacing: "0.06em" }}>
                    {imp.effort} effort
                  </span>
                )}
              </div>

              {/* What */}
              {imp.what && (
                <div style={{ fontSize: 13, color: "var(--text)", lineHeight: 1.65, marginBottom: 7 }}>
                  <span style={{ color: "var(--text-muted)", fontWeight: 500 }}>What: </span>
                  {imp.what}
                </div>
              )}

              {/* Why */}
              {imp.why && (
                <div style={{
                  fontSize: 12, color: "var(--text-dim)", lineHeight: 1.6,
                  paddingTop: 7, borderTop: "1px solid rgba(255,255,255,0.05)",
                  fontStyle: "italic",
                }}>
                  Why it matters: {imp.why}
                </div>
              )}
            </div>
          );
        })}
      </Card>

      {/* ── Footer ── */}
      <div style={{ textAlign: "center", fontSize: 11, color: "var(--text-dim)", marginTop: 24, fontFamily: "var(--font-mono)" }}>
        Analyzed {new Date(analyzedAt).toLocaleString()} · {modelUsed}
      </div>
    </div>
  );
}
