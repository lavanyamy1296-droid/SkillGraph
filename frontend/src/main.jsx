import React, { useEffect, useState } from "react";
import { createRoot } from "react-dom/client";
import {
  Radar,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  ResponsiveContainer,
  Tooltip,
} from "recharts";
import {
  BrainCircuit,
  Target,
  TrendingUp,
  Clock3,
  Download,
  Sparkles,
  CheckCircle2,
  CircleAlert,
  ArrowRight,
  BookOpen,
  RefreshCw,
} from "lucide-react";
import "./style.css";

const API = "http://127.0.0.1:8000/api";

function App() {
  const [roles, setRoles] = useState([]);
  const [roleSkills, setRoleSkills] = useState({});
  const [role, setRole] = useState("AI Engineer");
  const [skills, setSkills] = useState({});
  const [experience, setExperience] = useState("Beginner");
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [custom, setCustom] = useState("");

  useEffect(() => {
    fetch(`${API}/roles`)
      .then((response) => {
        if (!response.ok) throw new Error();
        return response.json();
      })
      .then((data) => {
        setRoles(data.roles || []);
        setRoleSkills(data.role_skills || {});
      })
      .catch(() => {
        setError(
          "Could not connect to backend. Start the FastAPI server at port 8000."
        );
      });
  }, []);

  const target = roleSkills[role] || {};

  const setSkill = (name, value) => {
    setSkills((previous) => ({
      ...previous,
      [name]: Number(value),
    }));
  };

  const addCustom = () => {
    const name = custom.trim();

    if (name && !Object.prototype.hasOwnProperty.call(target, name)) {
      setSkills((previous) => ({
        ...previous,
        [name]: 1,
      }));
      setCustom("");
    }
  };

  async function analyze() {
    setLoading(true);
    setError("");
    setResult(null);

    try {
      const response = await fetch(`${API}/analyze`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          role,
          experience,
          skills,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.detail || "Analysis failed");
      }

      setResult(data);
    } catch (err) {
      setError(
        err.message || "Unable to analyze. Check that backend is running."
      );
    } finally {
      setLoading(false);
    }
  }

  async function downloadReport() {
    setError("");

    try {
      const response = await fetch(`${API}/report/pdf`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          role,
          experience,
          skills,
        }),
      });

      if (!response.ok) {
        throw new Error("Report generation failed");
      }

      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");

      link.href = url;
      link.download = "skillgraph-career-report.pdf";
      document.body.appendChild(link);
      link.click();
      link.remove();

      URL.revokeObjectURL(url);
    } catch (err) {
      setError(err.message || "Unable to download report.");
    }
  }

  const pct = result?.readiness ?? 0;
  const gapHours = result?.total_hours ?? 0;

  return (
    <div className="app-shell">
      <aside className="sidebar">
        <div className="brand">
          <span className="brand-icon">
            <BrainCircuit size={23} />
          </span>
          <span>
            SkillGraph<span className="brand-ai">AI</span>
          </span>
        </div>

        <div className="side-label">WORKSPACE</div>

        <div className="side-item active">
          <Target size={17} />
          Skill analysis
        </div>

        <div className="side-item">
          <BookOpen size={17} />
          Career roadmap
        </div>

        <div className="sidebar-bottom">
          <div className="avatar">SG</div>
          <div>
            <strong>Career Explorer</strong>
            <small>Personal development</small>
          </div>
        </div>
      </aside>

      <main className="main">
        <header className="topbar">
          <div>
            <div className="eyebrow">CAREER INTELLIGENCE</div>

            <h1>
              Find your skill gaps. <span>Build your future.</span>
            </h1>

            <p className="subhead">
              Turn your current skills into a clear, actionable career roadmap.
            </p>
          </div>

          <div className="top-badge">
            <Sparkles size={15} />
            Smart skill analysis
          </div>
        </header>

        <section className="setup-card">
          <div className="section-heading">
            <div className="section-icon">
              <Target size={18} />
            </div>

            <div>
              <h2>Career profile</h2>
              <p>Choose your goal and rate your current skill level.</p>
            </div>
          </div>

          <div className="profile-grid">
            <label className="field">
              <span>Target career role</span>

              <select
                value={role}
                onChange={(event) => {
                  setRole(event.target.value);
                  setResult(null);
                }}
              >
                {(roles.length ? roles : Object.keys(roleSkills)).map((item) => (
                  <option key={item} value={item}>
                    {item}
                  </option>
                ))}
              </select>
            </label>

            <label className="field">
              <span>Current experience</span>

              <select
                value={experience}
                onChange={(event) => setExperience(event.target.value)}
              >
                {[
                  "Beginner",
                  "Student",
                  "Intermediate",
                  "Career switcher",
                ].map((item) => (
                  <option key={item} value={item}>
                    {item}
                  </option>
                ))}
              </select>
            </label>
          </div>

          <div className="skills-header">
            <div>
              <h3>Rate your skills</h3>
              <p>1 = New to it · 5 = Confident</p>
            </div>

            <div className="skill-count">{Object.keys(target).length} role skills</div>
          </div>

          <div className="skills-grid">
            {Object.entries(target).map(([name, required]) => (
              <div className="skill-control" key={name}>
                <div className="skill-top">
                  <strong>{name}</strong>
                  <span className="req">Target {required}/5</span>
                </div>

                <div className="range-row">
                  <input
                    aria-label={`${name} rating`}
                    type="range"
                    min="0"
                    max="5"
                    step="1"
                    value={skills[name] ?? 0}
                    onChange={(event) => setSkill(name, event.target.value)}
                  />

                  <span className="level-num">{skills[name] ?? 0}</span>
                </div>

                <div className="range-labels">
                  <span>Not started</span>
                  <span>Expert</span>
                </div>
              </div>
            ))}
          </div>

          <div className="custom-skill">
            <input
              placeholder="Add a skill not listed (optional)"
              value={custom}
              onChange={(event) => setCustom(event.target.value)}
              onKeyDown={(event) => {
                if (event.key === "Enter") addCustom();
              }}
            />

            <button className="add-btn" onClick={addCustom}>
              Add skill
            </button>
          </div>

          {Object.keys(skills).filter((key) => !target[key]).length > 0 && (
            <div className="custom-added">
              Added skills:{" "}
              {Object.keys(skills)
                .filter((key) => !target[key])
                .join(", ")}

              <span>
                Note: added skills are tracked in your profile; role scoring uses
                role-specific skill benchmarks.
              </span>
            </div>
          )}

          <button className="analyze-btn" onClick={analyze} disabled={loading}>
            {loading ? (
              <>
                <RefreshCw className="spin" size={18} />
                Analyzing skills...
              </>
            ) : (
              <>
                <Sparkles size={18} />
                Analyze my skill gaps
                <ArrowRight size={18} />
              </>
            )}
          </button>

          {error && (
            <div className="error">
              <CircleAlert size={16} />
              {error}
            </div>
          )}
        </section>

        {result && (
          <section className="results">
            <div className="result-title">
              <div>
                <div className="eyebrow">YOUR ANALYSIS</div>
                <h2>Career readiness overview</h2>
              </div>

              <button className="download" onClick={downloadReport}>
                <Download size={16} />
                Download PDF report
              </button>
            </div>

            <div className="metrics">
              <div className="metric-card readiness">
                <div className="metric-label">
                  Career readiness <TrendingUp size={17} />
                </div>

                <div className="metric-value">
                  {pct}
                  <small>%</small>
                </div>

                <div className="progress">
                  <span style={{ width: `${pct}%` }} />
                </div>

                <p>Based on role skill requirements</p>
              </div>

              <div className="metric-card">
                <div className="metric-label">
                  Skills meeting target <CheckCircle2 size={17} />
                </div>

                <div className="metric-value">
                  {result.ready_skills}
                  <small>/{result.total_skills}</small>
                </div>

                <p>Skills at or above required level</p>
              </div>

              <div className="metric-card">
                <div className="metric-label">
                  Estimated learning time <Clock3 size={17} />
                </div>

                <div className="metric-value">
                  {gapHours}
                  <small> hrs</small>
                </div>

                <p>Approximate time to address identified gaps</p>
              </div>
            </div>

            <div className="result-grid">
              <div className="panel chart-panel">
                <h3>Skill profile</h3>
                <p>Current level vs target level</p>

                <ResponsiveContainer width="100%" height={300}>
                  <RadarChart data={result.chart}>
                    <PolarGrid />

                    <PolarAngleAxis
                      dataKey="skill"
                      tick={{ fontSize: 11, fill: "#b7c2d8" }}
                    />

                    <PolarRadiusAxis
                      angle={30}
                      domain={[0, 5]}
                      tick={{ fontSize: 10, fill: "#77849e" }}
                    />

                    <Radar
                      name="Current"
                      dataKey="current"
                      stroke="#8c7bff"
                      fill="#8c7bff"
                      fillOpacity={0.42}
                    />

                    <Radar
                      name="Target"
                      dataKey="required"
                      stroke="#35c6b0"
                      fill="#35c6b0"
                      fillOpacity={0.16}
                    />

                    <Tooltip />
                  </RadarChart>
                </ResponsiveContainer>

                <div className="chart-legend">
                  <span>
                    <i className="dot purple" /> Current level
                  </span>

                  <span>
                    <i className="dot teal" /> Target level
                  </span>
                </div>
              </div>

              <div className="panel gap-panel">
                <h3>Priority skill gaps</h3>
                <p>Focus on these skills to improve your readiness</p>

                {result.gaps.length === 0 ? (
                  <div className="no-gaps">
                    Great work! Your rated skills meet the target benchmark.
                  </div>
                ) : (
                  result.gaps.slice(0, 6).map((gap) => (
                    <div className="gap-row" key={gap.skill}>
                      <div className="gap-name">
                        <strong>{gap.skill}</strong>

                        <span className={`priority ${gap.priority.toLowerCase()}`}>
                          {gap.priority}
                        </span>
                      </div>

                      <div className="gap-bar">
                        <span
                          style={{
                            width: `${(gap.current / gap.required) * 100}%`,
                          }}
                        />
                      </div>

                      <div className="gap-meta">
                        <span>
                          Level {gap.current} → {gap.required}
                        </span>

                        <span>{gap.hours} hrs</span>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>

            <div className="panel roadmap">
              <div className="roadmap-heading">
                <div>
                  <h3>Personal learning roadmap</h3>
                  <p>Suggested order to work on your gaps</p>
                </div>

                <span className="roadmap-chip">
                  <BookOpen size={15} />
                  {result.gaps.length} skills
                </span>
              </div>

              {result.roadmap.length === 0 ? (
                <p className="no-gaps">
                  You're meeting all skill benchmarks. Consider building a portfolio
                  project or exploring advanced topics.
                </p>
              ) : (
                <div className="phases">
                  {result.roadmap.map((phase, index) => (
                    <div className="phase" key={phase.phase}>
                      <div className="phase-head">
                        <span className="phase-num">
                          {String(index + 1).padStart(2, "0")}
                        </span>

                        <strong>{phase.phase}</strong>
                      </div>

                      {phase.items.map((item) => (
                        <div className="road-item" key={item.skill}>
                          <div className="road-dot" />

                          <div className="road-content">
                            <strong>{item.skill}</strong>
                            <p>{item.suggestion}</p>

                            <span className="hours">
                              <Clock3 size={13} />
                              ~{item.hours} hours
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="disclaimer">
              SkillGraph AI provides educational guidance based on illustrative
              benchmarks. Compare these suggestions with real job descriptions and
              adjust the roadmap to your goals.
            </div>
          </section>
        )}
        
        <footer>
          SkillGraph AI <span>Career growth, made actionable.</span>
        </footer>
      </main>
    </div>
  );
}

createRoot(document.getElementById("root")).render(<App />);