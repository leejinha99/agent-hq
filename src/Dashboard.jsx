import { useState } from "react";
import { useNotion } from "./hooks/useNotion";

const COMPANIES = [
  { id: "ssikda", name: "씻다", sub: "IoT · 비데", accent: "#6B8FC2", accentDark: "#4B607F" },
  { id: "wellasu", name: "웰라수", sub: "B2B · 정수기", accent: "#6FA98A", accentDark: "#4F7864" },
  { id: "safer", name: "세이퍼", sub: "Safety · App", accent: "#E08A47", accentDark: "#B8632A" },
];

/* ---------------- REAL DATA MAPPING ----------------
   useNotion(company)이 돌려주는 agents를 조직도가 기대하는
   { name, agents: [{ name, type, status, runState, desc, pc, storage, last, subAgents }] } 형태로 변환.
----------------------------------------------------- */

const RUN_STATE_MAP = { working: "running", blocked: "error", resting: "idle", inactive: "idle" };
const TYPE_KEYS = ["VS코드", "에이전트", "자동화"];

function mapType(types) {
  return TYPE_KEYS.find((k) => types?.includes(k)) ?? "자동화";
}

function formatLast(iso) {
  if (!iso) return "—";
  const d = new Date(iso);
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  const hh = String(d.getHours()).padStart(2, "0");
  const mi = String(d.getMinutes()).padStart(2, "0");
  return `${mm}.${dd} ${hh}:${mi}`;
}

function mapAgent(a) {
  const inactive = a.computedStatus === "inactive";
  return {
    id: a.id,
    name: a.name,
    type: mapType(a.type),
    status: inactive ? "비활성" : "활성",
    runState: RUN_STATE_MAP[a.computedStatus] ?? "idle",
    desc: a.description || a.task || "",
    pc: a.pc || "—",
    storage: a.storage || "—",
    last: formatLast(a.lastRun),
  };
}

function buildDepts(agents) {
  const order = [];
  const byDept = new Map();
  for (const a of agents) {
    const dept = a.department || "미분류";
    if (!byDept.has(dept)) { byDept.set(dept, []); order.push(dept); }
    byDept.get(dept).push(a);
  }
  return order.map((name) => ({ name, agents: byDept.get(name).map(mapAgent) }));
}

/* ---------------- THEME ---------------- */

const THEMES = {
  light: {
    bg: "#FAFAFB", panel: "#FFFFFF", border: "#EDEEF0", borderSoft: "#ECEDEF",
    textPrimary: "#22262B", textSecondary: "#9AA0A6", textFaint: "#C2C6CC",
    tabInactive: "#B5B9BF", subCardBg: "#FAFAFB",
  },
  dark: {
    bg: "#0E1014", panel: "#16181D", border: "#262A30", borderSoft: "#21242A",
    textPrimary: "#ECEEF0", textSecondary: "#8A8F96", textFaint: "#5C6066",
    tabInactive: "#5C6066", subCardBg: "#1B1E24",
  },
};

const TYPE_CFG = {
  light: {
    "자동화": { bg: "#EEF1F5", text: "#5B6472" },
    "에이전트": { bg: "#F1EEF7", text: "#6B5C8F" },
    "VS코드": { bg: "#EEF1EE", text: "#55624F" },
  },
  dark: {
    "자동화": { bg: "#23262E", text: "#9AA3B5" },
    "에이전트": { bg: "#272332", text: "#B4A4D6" },
    "VS코드": { bg: "#212621", text: "#A6B59C" },
  },
};

const RUN_CFG = {
  running: { color: "#3B82F6", label: "실행 중", glow: true },
  idle:    { color: "#9CA3AF", label: "대기",    glow: false },
  error:   { color: "#EF4444", label: "오류",    glow: true },
};

/* ---------------- CONNECTORS ---------------- */

function VLine({ h = 16, color }) {
  return <svg width="100%" height={h} style={{ display: "block" }}><line x1="50%" y1="0" x2="50%" y2={h} stroke={color} strokeWidth="1.5" /></svg>;
}

function BranchLine({ count, color, h = 16 }) {
  if (count <= 1) return <VLine h={h} color={color} />;
  const centers = Array.from({ length: count }, (_, i) => (i + 0.5) / count * 100);
  const mid = h * 0.5;
  return (
    <svg width="100%" height={h} style={{ display: "block", overflow: "visible" }}>
      <line x1="50%" y1="0" x2="50%" y2={mid} stroke={color} strokeWidth="1.5" />
      <line x1={`${centers[0]}%`} y1={mid} x2={`${centers[count - 1]}%`} y2={mid} stroke={color} strokeWidth="1.5" />
      {centers.map((cx, i) => (
        <line key={i} x1={`${cx}%`} y1={mid} x2={`${cx}%`} y2={h} stroke={color} strokeWidth="1.5" />
      ))}
    </svg>
  );
}

/* ---------------- COMPONENTS ---------------- */

function RunDot({ runState }) {
  const cfg = RUN_CFG[runState] || RUN_CFG.idle;
  return (
    <span style={{
      width: 7, height: 7, borderRadius: "50%",
      background: cfg.color, flexShrink: 0,
      boxShadow: cfg.glow ? `0 0 5px ${cfg.color}AA` : "none",
      animation: runState === "running" ? "pulseDot 1.6s infinite" : "none",
    }} />
  );
}

function SubAgentCard({ sub, theme }) {
  return (
    <div style={{
      flex: "1 1 0", minWidth: 90,
      background: theme.subCardBg, border: `1px solid ${theme.borderSoft}`,
      borderRadius: 9, padding: "8px 9px",
    }}>
      <div style={{ display: "flex", alignItems: "center", gap: 5, marginBottom: 3 }}>
        <RunDot runState={sub.runState} />
        <span style={{ fontSize: 11.5, fontWeight: 700, color: theme.textPrimary }}>{sub.name}</span>
      </div>
      <div style={{ fontSize: 10, color: theme.textSecondary, lineHeight: 1.45 }}>{sub.desc}</div>
    </div>
  );
}

function ToggleArrow({ open, accent }) {
  return (
    <span style={{
      width: 22, height: 22, borderRadius: "50%",
      background: open ? accent : accent + "1F",
      display: "flex", alignItems: "center", justifyContent: "center",
      flexShrink: 0,
      transition: "background .15s, transform .2s",
    }}>
      <span style={{
        fontSize: 21, lineHeight: 1, color: open ? "white" : accent,
        transform: open ? "rotate(180deg)" : "none", transition: "transform .2s",
      }}>
        ▾
      </span>
    </span>
  );
}

function AgentBox({ agent, accent, mode, theme, companyName }) {
  const [open, setOpen] = useState(false);
  const [subAgents, setSubAgents] = useState(null); // null = 아직 조회 안 함
  const [loadingSubs, setLoadingSubs] = useState(false);
  const inactive = agent.status === "비활성";
  const typeCfg = TYPE_CFG[mode][agent.type];

  const toggleOpen = async () => {
    const next = !open;
    setOpen(next);
    if (next && subAgents === null) {
      setLoadingSubs(true);
      try {
        const res = await fetch(`/api/subagents?company=${encodeURIComponent(companyName)}&pageId=${encodeURIComponent(agent.id)}`);
        setSubAgents(res.ok ? await res.json() : []);
      } catch {
        setSubAgents([]);
      }
      setLoadingSubs(false);
    }
  };

  return (
    <div style={{ width: "100%" }}>
      <div
        onClick={toggleOpen}
        style={{
          background: inactive ? theme.panel : (mode === "dark" ? accent + "1C" : accent + "0F"),
          border: `1px solid ${inactive ? theme.border : accent + "55"}`,
          borderRadius: 11,
          padding: "10px 10px 10px 12px",
          cursor: "pointer",
          opacity: inactive ? 0.6 : 1,
          transition: "border-color .15s, background .15s",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 6.4 }}>
          <RunDot runState={agent.runState} />
          <span style={{
            fontSize: 12, fontWeight: 700, color: theme.textPrimary,
            flex: 1, minWidth: 0, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
          }}>
            {agent.name}
          </span>
          <ToggleArrow open={open} accent={accent} />
        </div>
        <div style={{ fontSize: 11, color: theme.textSecondary, lineHeight: 1.45, marginBottom: 7 }}>
          {agent.desc}
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 6, flexWrap: "wrap" }}>
          <span style={{
            fontSize: 10, fontWeight: 600, padding: "3px 6px", lineHeight: 1,
            display: "inline-flex", alignItems: "center", borderRadius: 5,
            background: typeCfg.bg, color: typeCfg.text,
          }}>
            {agent.type}
          </span>
          <span style={{ fontSize: 10, color: theme.textFaint }}>{agent.pc}</span>
          <span style={{ fontSize: 10, color: theme.textFaint }}>· {agent.storage}</span>
          <span style={{ fontSize: 10, color: theme.textFaint, marginLeft: "auto" }}>{agent.last}</span>
        </div>
      </div>

      {open && (
        <>
          <BranchLine count={Math.max(subAgents?.length ?? 1, 1)} color={accent + "70"} h={14} />
          {loadingSubs && (
            <div style={{ fontSize: 10.5, color: theme.textFaint, padding: "2px 2px 4px" }}>불러오는 중...</div>
          )}
          {!loadingSubs && subAgents?.length === 0 && (
            <div style={{ fontSize: 10.5, color: theme.textFaint, padding: "2px 2px 4px" }}>서브에이전트 없음</div>
          )}
          {!loadingSubs && subAgents?.length > 0 && (
            <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
              {subAgents.map((sub) => <SubAgentCard key={sub.id} sub={sub} theme={theme} />)}
            </div>
          )}
        </>
      )}
    </div>
  );
}

function DeptColumn({ dept, accent, accentDark, mode, theme, companyName }) {
  return (
    <div style={{ minWidth: 172, flex: "1 0 172px" }}>
      <div style={{
        background: mode === "dark" ? accent : accentDark,
        color: "white",
        borderRadius: 999,
        padding: "8px 0",
        textAlign: "center",
        fontSize: 12,
        fontWeight: 700,
        letterSpacing: "0.01em",
        position: "sticky", top: 0, zIndex: 1,
      }}>
        {dept.name}
        <span style={{ fontWeight: 600, fontSize: 10, opacity: 0.7, marginLeft: 4 }}>
          {dept.agents.length}
        </span>
      </div>
      <VLine h={14} color={accent + "80"} />
      <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
        {dept.agents.map((agent) => (
          <AgentBox key={agent.id} agent={agent} accent={accent} mode={mode} theme={theme} companyName={companyName} />
        ))}
      </div>
    </div>
  );
}

function OrgChart({ company, mode, theme }) {
  const totalAgents = company.depts.reduce((s, d) => s + d.agents.length, 0);

  return (
    <div style={{ overflowX: "auto", paddingBottom: 8 }}>
      <div style={{ minWidth: 1320 }}>
        <div style={{ display: "flex", justifyContent: "center", marginBottom: 0 }}>
          <div style={{
            position: "relative",
            width: 92, height: 92,
            borderRadius: "50%",
            background: company.accent + "1A",
            display: "flex", alignItems: "center", justifyContent: "center",
          }}>
            <div style={{
              width: 70, height: 70, borderRadius: "50%",
              background: company.accent,
              display: "flex", flexDirection: "column",
              alignItems: "center", justifyContent: "center",
              color: "white", textAlign: "center",
              boxShadow: `0 4px 14px ${company.accent}40`,
            }}>
              <div style={{ fontSize: 14, fontWeight: 800 }}>{company.name}</div>
              <div style={{ fontSize: 8.5, opacity: 0.85, marginTop: 1 }}>{totalAgents}개</div>
            </div>
          </div>
        </div>
        <div style={{ textAlign: "center", fontSize: 10.5, color: theme.textFaint, margin: "18px 0 6px" }}>
          {company.sub} · 부서 {company.depts.length}개
        </div>

        <BranchLine count={company.depts.length} color={theme.border} h={18} />

        <div style={{ display: "flex", gap: 10 }}>
          {company.depts.map((dept) => (
            <DeptColumn key={dept.name} dept={dept} accent={company.accent} accentDark={company.accentDark} mode={mode} theme={theme} companyName={company.name} />
          ))}
        </div>
      </div>
    </div>
  );
}

function ThemeToggle({ mode, setMode }) {
  const isDark = mode === "dark";
  return (
    <button
      onClick={() => setMode(isDark ? "light" : "dark")}
      style={{
        width: 52, height: 28, borderRadius: 99,
        background: isDark ? "#3A3F47" : "#E7E9EC",
        border: "none", cursor: "pointer", position: "relative",
        transition: "background .2s", flexShrink: 0,
      }}
    >
      <span style={{
        position: "absolute", top: 3, left: isDark ? 27 : 3,
        width: 22, height: 22, borderRadius: "50%",
        background: isDark ? "#16181D" : "white",
        display: "flex", alignItems: "center", justifyContent: "center",
        fontSize: 12, transition: "left .2s",
        boxShadow: "0 1px 3px rgba(0,0,0,0.2)",
      }}>
        {isDark ? "🌙" : "☀️"}
      </span>
    </button>
  );
}

function Legend({ theme }) {
  return (
    <div style={{ display: "flex", gap: 14, alignItems: "center", flexWrap: "wrap" }}>
      {Object.entries(RUN_CFG).map(([key, cfg]) => (
        <div key={key} style={{ display: "flex", alignItems: "center", gap: 5 }}>
          <span style={{ width: 7, height: 7, borderRadius: "50%", background: cfg.color }} />
          <span style={{ fontSize: 11, color: theme.textSecondary }}>{cfg.label}</span>
        </div>
      ))}
    </div>
  );
}

/* ---------------- MAIN ---------------- */

export default function Dashboard() {
  const [tab, setTab] = useState("ssikda");
  const [mode, setMode] = useState("light");
  const baseCompany = COMPANIES.find(c => c.id === tab);
  const theme = THEMES[mode];
  const { agents, fetchError } = useNotion(baseCompany.name);
  const company = { ...baseCompany, depts: buildDepts(agents) };
  const loading = !fetchError && agents.length === 0;

  return (
    <div style={{
      minHeight: "100vh",
      background: theme.bg,
      fontFamily: "'Pretendard', 'Apple SD Gothic Neo', -apple-system, sans-serif",
      color: theme.textPrimary,
      padding: "24px 16px 50px",
      transition: "background .2s, color .2s",
    }}>
      <style>{`
        @import url('https://cdn.jsdelivr.net/gh/orioncactus/pretendard@v1.3.9/dist/web/static/pretendard.css');
        * { box-sizing: border-box; margin:0; padding:0; }
        @keyframes pulseDot { 0%,100% { opacity:1 } 50% { opacity:0.45 } }
      `}</style>

      <div style={{ marginBottom: 18 }}>
        <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: 3 }}>
          <div style={{ fontSize: 11, fontWeight: 600, color: theme.textFaint, letterSpacing: "0.06em" }}>
            AGENT OPS
          </div>
          <ThemeToggle mode={mode} setMode={setMode} />
        </div>
        <div style={{ fontSize: 19, fontWeight: 800, marginBottom: 30 }}>에이전트 조직도</div>
        <Legend theme={theme} />

        <div style={{ display: "flex", gap: 22, borderBottom: `1px solid ${theme.border}`, marginTop: 14 }}>
          {COMPANIES.map(c => {
            const isActive = tab === c.id;
            return (
              <button key={c.id} onClick={() => setTab(c.id)} style={{
                background: "none", border: "none", cursor: "pointer",
                padding: "0 0 10px 0",
                borderBottom: isActive ? `2px solid ${c.accent}` : "2px solid transparent",
                marginBottom: -1,
              }}>
                <span style={{ fontSize: 14.5, fontWeight: isActive ? 800 : 600, color: isActive ? theme.textPrimary : theme.tabInactive }}>
                  {c.name}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      <div style={{
        background: theme.panel, border: `1px solid ${theme.border}`,
        borderRadius: 14, padding: "26px 16px 20px",
      }}>
        {fetchError && (
          <div style={{
            background: mode === "dark" ? "#3A1F22" : "#FDECEC", color: "#C0392B",
            border: `1px solid ${mode === "dark" ? "#5A2B2E" : "#F5C6C6"}`,
            borderRadius: 9, padding: "10px 14px", fontSize: 12, marginBottom: 16,
          }}>
            ⚠ {fetchError}
          </div>
        )}
        {loading && !fetchError && (
          <div style={{ textAlign: "center", padding: "40px 0", fontSize: 13, color: theme.textSecondary }}>
            불러오는 중...
          </div>
        )}
        {!loading && <OrgChart company={company} mode={mode} theme={theme} />}
      </div>

      <div style={{ marginTop: 14, fontSize: 11, color: theme.textFaint, textAlign: "center" }}>
        부서 {company.depts.length}개 · 에이전트 {agents.length}개 · 가로 스크롤로 전체 확인 가능
      </div>
    </div>
  );
}
