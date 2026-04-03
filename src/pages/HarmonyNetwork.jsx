import { useEffect, useRef, useState, useCallback, useMemo } from "react";
import { base44 } from "@/api/base44Client";
import { motion, AnimatePresence } from "framer-motion";
import { GitBranch, Loader2, Zap, Users, TrendingUp, X, LogOut } from "lucide-react";

// ── Constants ─────────────────────────────────────────────────────────────
const FREQ_COLORS = {
  unity:"#c4a35a", creation:"#a78bfa", transformation:"#f472b6",
  healing:"#34d399", awakening:"#60a5fa", remembrance:"#fb923c",
  vision:"#e879f9", connection:"#2dd4bf",
};
const FREQ_COMPAT = {
  unity:          ["creation","connection","healing"],
  creation:       ["unity","vision","transformation"],
  transformation: ["creation","awakening","remembrance"],
  healing:        ["unity","connection","peace"],
  awakening:      ["transformation","vision","remembrance"],
  remembrance:    ["awakening","transformation","unity"],
  vision:         ["creation","awakening","connection"],
  connection:     ["unity","healing","vision"],
};
const SR_MODES = [7.83,14.3,20.8,27.3,33.8,39.0,45.0,51.0];

function liveSR() {
  const h = new Date().getUTCHours();
  const d = 0.5 + 0.5*Math.sin((h-6)*Math.PI/12);
  const m = Math.max(1,Math.min(8,Math.round(1+d*6)));
  return { mode: m, hz: +(SR_MODES[m-1]+(Math.random()-0.5)*0.3).toFixed(2) };
}

// Compute amplified score: base + bonus from each compatible linked node
function computeAmplified(node, allNodes) {
  const linked = allNodes.filter(n => (node.linked_node_ids||[]).includes(n.id));
  let bonus = 0;
  for (const ln of linked) {
    const compat = (FREQ_COMPAT[node.frequency]||[]).includes(ln.frequency);
    const sameFreq = ln.frequency === node.frequency;
    bonus += compat ? ln.resonance_score * 0.18 : sameFreq ? ln.resonance_score * 0.10 : ln.resonance_score * 0.04;
  }
  return Math.min(100, Math.round(node.resonance_score + bonus));
}

// ── Force-directed graph on canvas ────────────────────────────────────────
function useForceGraph(canvasRef, nodes, myNodeId) {
  const simRef = useRef({ positions: {}, velocities: {} });

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || !nodes.length) return;

    const W = canvas.offsetWidth, H = canvas.offsetHeight;
    canvas.width = W; canvas.height = H;
    const ctx = canvas.getContext("2d");
    const sim = simRef.current;

    // Initialize positions for new nodes
    nodes.forEach(n => {
      if (!sim.positions[n.id]) {
        const angle = Math.random() * Math.PI * 2;
        const r = 60 + Math.random() * Math.min(W, H) * 0.25;
        sim.positions[n.id]  = { x: W/2 + r*Math.cos(angle), y: H/2 + r*Math.sin(angle) };
        sim.velocities[n.id] = { x: 0, y: 0 };
      }
    });

    let running = true;
    let t = 0;

    const tick = () => {
      if (!running) return;
      t += 0.016;

      // Force simulation
      for (const a of nodes) {
        const pa = sim.positions[a.id]; if (!pa) continue;
        let fx = 0, fy = 0;

        // Repulsion from all other nodes
        for (const b of nodes) {
          if (b.id === a.id) continue;
          const pb = sim.positions[b.id]; if (!pb) continue;
          const dx = pa.x - pb.x, dy = pa.y - pb.y;
          const dist = Math.sqrt(dx*dx + dy*dy) || 1;
          const force = 2200 / (dist * dist);
          fx += (dx/dist) * force;
          fy += (dy/dist) * force;
        }

        // Attraction along edges (linked nodes)
        for (const linkedId of (a.linked_node_ids || [])) {
          const pb = sim.positions[linkedId]; if (!pb) continue;
          const dx = pb.x - pa.x, dy = pb.y - pa.y;
          const dist = Math.sqrt(dx*dx + dy*dy) || 1;
          const target = 140;
          const force = (dist - target) * 0.035;
          fx += (dx/dist) * force;
          fy += (dy/dist) * force;
        }

        // Gravity toward center
        fx += (W/2 - pa.x) * 0.012;
        fy += (H/2 - pa.y) * 0.012;

        const vel = sim.velocities[a.id];
        vel.x = (vel.x + fx * 0.016) * 0.82;
        vel.y = (vel.y + fy * 0.016) * 0.82;
        pa.x = Math.max(40, Math.min(W-40, pa.x + vel.x));
        pa.y = Math.max(40, Math.min(H-40, pa.y + vel.y));
      }

      // Draw
      ctx.clearRect(0, 0, W, H);

      // Edges
      for (const a of nodes) {
        const pa = sim.positions[a.id]; if (!pa) continue;
        for (const linkedId of (a.linked_node_ids || [])) {
          const b = nodes.find(n => n.id === linkedId);
          const pb = sim.positions[linkedId]; if (!pb || !b) continue;
          const compat = (FREQ_COMPAT[a.frequency]||[]).includes(b.frequency);
          const sameFreq = a.frequency === b.frequency;
          const alpha = compat ? 0.55 : sameFreq ? 0.35 : 0.15;
          const pulse = 0.5 + 0.5*Math.sin(t*2 + a.id.charCodeAt(0)*0.3);

          ctx.beginPath();
          ctx.moveTo(pa.x, pa.y);
          ctx.lineTo(pb.x, pb.y);
          const c = FREQ_COLORS[a.frequency] || "#888";
          ctx.strokeStyle = c + Math.round((alpha + pulse*0.15)*255).toString(16).padStart(2,"0");
          ctx.lineWidth = compat ? 2 : 1;
          ctx.stroke();

          // Flow particle along edge
          const ft = (t * 0.5) % 1;
          const px = pa.x + (pb.x - pa.x) * ft, py = pa.y + (pb.y - pa.y) * ft;
          ctx.beginPath();
          ctx.arc(px, py, 2.5, 0, Math.PI*2);
          ctx.fillStyle = c + "cc";
          ctx.fill();
        }
      }

      // Nodes
      for (const node of nodes) {
        const p = sim.positions[node.id]; if (!p) continue;
        const color = FREQ_COLORS[node.frequency] || "#888";
        const isMe = node.id === myNodeId;
        const r = isMe ? 18 : 13 + (node.amplified_score||node.resonance_score)/100*7;
        const pulse = isMe ? 1 + 0.08*Math.sin(t*3) : 1;

        // Glow
        const grd = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, r*3*pulse);
        grd.addColorStop(0, color+"55"); grd.addColorStop(1, "transparent");
        ctx.fillStyle = grd;
        ctx.beginPath(); ctx.arc(p.x, p.y, r*3*pulse, 0, Math.PI*2); ctx.fill();

        // Core
        ctx.beginPath(); ctx.arc(p.x, p.y, r*pulse, 0, Math.PI*2);
        ctx.fillStyle = color + "cc"; ctx.fill();
        ctx.strokeStyle = isMe ? "#fff" : color;
        ctx.lineWidth = isMe ? 2.5 : 1.5; ctx.stroke();

        // Label
        ctx.fillStyle = "#ffffffcc";
        ctx.font = `${isMe ? "bold " : ""}10px Inter, sans-serif`;
        ctx.textAlign = "center";
        ctx.fillText(node.alias?.slice(0,8) || "·", p.x, p.y + r*pulse + 14);

        // Score badge
        const amp = node.amplified_score || node.resonance_score;
        ctx.fillStyle = color + "dd";
        ctx.fillText(`${amp}%`, p.x, p.y + 3.5);
      }

      requestAnimationFrame(tick);
    };
    tick();

    const onResize = () => { canvas.width = canvas.offsetWidth; canvas.height = canvas.offsetHeight; };
    window.addEventListener("resize", onResize);
    return () => { running = false; window.removeEventListener("resize", onResize); };
  }, [nodes, myNodeId]);
}

// ── Main Component ─────────────────────────────────────────────────────────
const FREQUENCIES = ["unity","creation","transformation","healing","awakening","remembrance","vision","connection"];
const EMOTIONS    = ["love","wonder","peace","joy","gratitude","clarity","longing","awe","compassion","transcendence"];

export default function HarmonyNetwork() {
  const canvasRef    = useRef(null);
  const [loading,    setLoading]    = useState(true);
  const [nodes,      setNodes]      = useState([]);
  const [myNode,     setMyNode]     = useState(null);
  const [participant,setParticipant]= useState(null);
  const [joining,    setJoining]    = useState(false);
  const [form,       setForm]       = useState({ frequency: "healing", emotion: "peace", resonance_score: 65 });
  const [sr,         setSR]         = useState(livesr => livesr || livesr);
  const [selected,   setSelected]   = useState(null);

  // Init SR
  useEffect(() => { setSR(liveSR()); }, []);

  // Load participant
  useEffect(() => {
    const init = async () => {
      const me = await base44.auth.me();
      const parts = await base44.entities.Participant.filter({ user_email: me.email }, "-created_date", 1);
      setParticipant(parts[0] || null);
      setLoading(false);
    };
    init();
  }, []);

  // Load active nodes + subscribe to real-time updates
  useEffect(() => {
    base44.entities.HarmonyNode.filter({ status: "active" }, "-created_date", 100)
      .then(data => {
        const enriched = data.map(n => ({ ...n, amplified_score: computeAmplified(n, data) }));
        setNodes(enriched);
      });

    const unsub = base44.entities.HarmonyNode.subscribe(event => {
      setNodes(prev => {
        let updated;
        if (event.type === "create") updated = [...prev, event.data];
        else if (event.type === "update") updated = prev.map(n => n.id === event.id ? event.data : n);
        else if (event.type === "delete") updated = prev.filter(n => n.id !== event.id);
        else updated = prev;
        // Recompute amplification for all
        return updated.map(n => ({ ...n, amplified_score: computeAmplified(n, updated) }));
      });
    });

    return () => unsub();
  }, []);

  // Auto-compute links when nodes change
  useEffect(() => {
    if (!myNode) return;
    const compatibles = nodes
      .filter(n => n.id !== myNode.id && n.status === "active" &&
        ((FREQ_COMPAT[myNode.frequency]||[]).includes(n.frequency) || n.frequency === myNode.frequency))
      .map(n => n.id);

    if (JSON.stringify(compatibles.sort()) !== JSON.stringify((myNode.linked_node_ids||[]).sort())) {
      base44.entities.HarmonyNode.update(myNode.id, { linked_node_ids: compatibles }).then(updated => {
        setMyNode(updated);
        setNodes(prev => prev.map(n => n.id === updated.id ? { ...updated, amplified_score: computeAmplified(updated, prev) } : n));
      });
    }
  }, [nodes.length]);

  const handleJoin = async () => {
    if (!participant) return;
    setJoining(true);
    const sessionId = `session_${Date.now()}`;
    const node = await base44.entities.HarmonyNode.create({
      atomic_id: participant.atomic_consciousness_number,
      alias: participant.alias || "Anonymous",
      frequency: form.frequency,
      emotion: form.emotion,
      resonance_score: form.resonance_score,
      session_id: sessionId,
      status: "active",
      sr_mode: sr.mode,
      linked_node_ids: [],
    });
    setMyNode(node);
    setJoining(false);
  };

  const handleLeave = async () => {
    if (!myNode) return;
    await base44.entities.HarmonyNode.update(myNode.id, { status: "inactive" });
    setMyNode(null);
  };

  useForceGraph(canvasRef, nodes.filter(n => n.status === "active"), myNode?.id);

  const activeNodes = nodes.filter(n => n.status === "active");
  const myAmpScore  = myNode ? (nodes.find(n => n.id === myNode.id)?.amplified_score || myNode.resonance_score) : null;
  const myLinked    = myNode ? (nodes.find(n => n.id === myNode.id)?.linked_node_ids || []) : [];
  const netBonus    = myNode ? (myAmpScore - myNode.resonance_score) : 0;

  if (loading) return (
    <div className="flex items-center justify-center min-h-screen">
      <Loader2 className="w-6 h-6 text-primary animate-spin" />
    </div>
  );

  return (
    <div className="max-w-6xl mx-auto px-4 py-10 min-h-screen">
      {/* Header */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="mb-4">
        <div className="flex items-center justify-between flex-wrap gap-3">
          <div>
            <div className="flex items-center gap-2.5 mb-1">
              <GitBranch className="w-5 h-5 text-primary" />
              <h1 className="font-heading text-3xl">Harmony Network</h1>
            </div>
            <p className="font-body text-sm text-muted-foreground">
              Link resonance records in real-time · compatible frequencies auto-connect · coherence amplifies across edges
            </p>
          </div>
          {myNode && (
            <button onClick={handleLeave}
              className="flex items-center gap-1.5 px-3 py-2 rounded-full border border-destructive/40 text-destructive text-xs font-body hover:bg-destructive/10 transition-all">
              <LogOut className="w-3.5 h-3.5" /> Leave Network
            </button>
          )}
        </div>
      </motion.div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-4">

        {/* Graph canvas */}
        <motion.div initial={{ opacity: 0, scale: 0.97 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 0.1 }}
          className="lg:col-span-3 relative bg-card/10 border border-border/20 rounded-2xl overflow-hidden"
          style={{ height: "65vh", minHeight: 400 }}>

          <canvas ref={canvasRef} className="w-full h-full block" />

          {activeNodes.length === 0 && !myNode && (
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
              <p className="text-xs font-body text-muted-foreground/50">No active nodes yet — be the first to join</p>
            </div>
          )}

          {/* Live stats overlay */}
          <div className="absolute top-3 left-3 flex items-center gap-2 bg-black/40 backdrop-blur-sm rounded-xl px-3 py-1.5">
            <div className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse" />
            <span className="text-[10px] font-body text-white/70">{activeNodes.length} active node{activeNodes.length !== 1 ? "s" : ""}</span>
            <span className="text-[9px] text-white/30">·</span>
            <span className="text-[10px] font-body text-white/50">SR M{sr.mode} · {sr.hz} Hz</span>
          </div>

          {/* My node amplification badge */}
          {myNode && myAmpScore !== null && (
            <div className="absolute top-3 right-3 bg-black/50 backdrop-blur-sm rounded-xl px-3 py-2 text-center">
              <div className="text-[9px] font-body text-muted-foreground mb-0.5">My Coherence</div>
              <div className="text-base font-heading" style={{ color: FREQ_COLORS[myNode.frequency] }}>{myAmpScore}%</div>
              {netBonus > 0 && (
                <div className="text-[9px] font-body text-green-400">+{netBonus} from network</div>
              )}
            </div>
          )}
        </motion.div>

        {/* Side panel */}
        <motion.div initial={{ opacity: 0, x: 16 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.15 }}
          className="flex flex-col gap-3">

          {/* Join / My node */}
          {!myNode ? (
            <div className="bg-card/30 backdrop-blur-md border border-border/30 rounded-2xl p-4">
              <h3 className="font-heading text-base mb-3">Enter the Network</h3>
              <div className="space-y-3">
                <div>
                  <label className="text-[9px] font-body text-muted-foreground uppercase tracking-wide block mb-1">Frequency</label>
                  <select value={form.frequency} onChange={e => setForm(f => ({ ...f, frequency: e.target.value }))}
                    className="w-full bg-secondary/30 border border-border/40 rounded-xl px-3 py-2 text-xs font-body text-foreground outline-none capitalize">
                    {FREQUENCIES.map(f => <option key={f} value={f}>{f}</option>)}
                  </select>
                  {form.frequency && (
                    <div className="mt-1 text-[9px] font-body text-muted-foreground/60">
                      Compatible: {(FREQ_COMPAT[form.frequency]||[]).join(", ")}
                    </div>
                  )}
                </div>
                <div>
                  <label className="text-[9px] font-body text-muted-foreground uppercase tracking-wide block mb-1">Emotion</label>
                  <select value={form.emotion} onChange={e => setForm(f => ({ ...f, emotion: e.target.value }))}
                    className="w-full bg-secondary/30 border border-border/40 rounded-xl px-3 py-2 text-xs font-body text-foreground outline-none capitalize">
                    {EMOTIONS.map(e => <option key={e} value={e}>{e}</option>)}
                  </select>
                </div>
                <div>
                  <label className="text-[9px] font-body text-muted-foreground uppercase tracking-wide block mb-1">
                    Resonance Score · {form.resonance_score}%
                  </label>
                  <input type="range" min={10} max={100} value={form.resonance_score}
                    onChange={e => setForm(f => ({ ...f, resonance_score: Number(e.target.value) }))}
                    className="w-full h-1.5 rounded-full appearance-none cursor-pointer accent-primary" />
                </div>
                <button onClick={handleJoin} disabled={joining || !participant}
                  className="w-full py-2.5 rounded-full bg-primary text-primary-foreground text-xs font-body font-medium flex items-center justify-center gap-2 hover:opacity-90 disabled:opacity-50 transition-all">
                  {joining ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Zap className="w-3.5 h-3.5" />}
                  {joining ? "Linking…" : "Join Network"}
                </button>
                {!participant && (
                  <p className="text-[9px] font-body text-muted-foreground/50 text-center">Complete First Pulse to enter</p>
                )}
              </div>
            </div>
          ) : (
            <div className="bg-card/30 backdrop-blur-md border border-border/30 rounded-2xl p-4">
              <div className="flex items-center gap-2 mb-2">
                <div className="w-2.5 h-2.5 rounded-full animate-pulse" style={{ background: FREQ_COLORS[myNode.frequency] }} />
                <h3 className="font-heading text-sm">My Node · Active</h3>
              </div>
              <div className="space-y-2 text-[10px] font-body">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Frequency</span>
                  <span className="capitalize" style={{ color: FREQ_COLORS[myNode.frequency] }}>{myNode.frequency}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Base score</span>
                  <span>{myNode.resonance_score}%</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Amplified</span>
                  <span className="text-green-400 font-medium">{myAmpScore}%</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Links</span>
                  <span>{myLinked.length} node{myLinked.length !== 1 ? "s" : ""}</span>
                </div>
                {netBonus > 0 && (
                  <div className="px-2 py-1 rounded-lg bg-green-500/10 border border-green-500/20 text-green-400 text-center">
                    +{netBonus}% network amplification
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Active node list */}
          <div className="bg-card/30 backdrop-blur-md border border-border/30 rounded-2xl p-4 flex-1 overflow-hidden">
            <div className="flex items-center gap-2 mb-3">
              <Users className="w-3.5 h-3.5 text-primary" />
              <span className="text-xs font-body text-foreground/80">Active Nodes</span>
            </div>
            <div className="space-y-2 max-h-64 overflow-y-auto pr-1">
              {activeNodes.length === 0 ? (
                <p className="text-[10px] font-body text-muted-foreground/50 italic">Waiting for nodes…</p>
              ) : activeNodes.map(node => {
                const isLinked = myLinked.includes(node.id);
                const isMe = node.id === myNode?.id;
                const color = FREQ_COLORS[node.frequency] || "#888";
                return (
                  <div key={node.id}
                    className={`flex items-center gap-2.5 px-3 py-2 rounded-xl border transition-all ${
                      isMe ? "border-primary/30 bg-primary/5" :
                      isLinked ? "border-green-500/20 bg-green-500/5" :
                      "border-border/10 bg-card/20"
                    }`}>
                    <div className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ background: color }} />
                    <div className="flex-1 min-w-0">
                      <div className="text-[10px] font-body text-foreground/80 truncate">
                        {node.alias?.slice(0,12) || "Node"} {isMe && <span className="text-primary">(you)</span>}
                      </div>
                      <div className="text-[9px] font-body text-muted-foreground capitalize">{node.frequency}</div>
                    </div>
                    <div className="text-right flex-shrink-0">
                      <div className="text-[10px] font-body font-medium" style={{ color }}>
                        {node.amplified_score || node.resonance_score}%
                      </div>
                      {isLinked && !isMe && <div className="text-[8px] text-green-400">linked</div>}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Compatibility guide */}
          {myNode && (
            <div className="bg-card/20 border border-border/10 rounded-2xl p-3">
              <div className="text-[9px] font-body text-muted-foreground uppercase tracking-wide mb-2">Compatible Frequencies</div>
              <div className="flex flex-wrap gap-1.5">
                {(FREQ_COMPAT[myNode.frequency]||[]).map(f => (
                  <div key={f} className="px-2 py-0.5 rounded-full text-[9px] font-body capitalize"
                    style={{ background: FREQ_COLORS[f]+"25", color: FREQ_COLORS[f], border: `1px solid ${FREQ_COLORS[f]}44` }}>
                    {f}
                  </div>
                ))}
              </div>
              <div className="mt-2 text-[8px] font-body text-muted-foreground/40">
                Compat links amplify +18% · same freq +10% · cross freq +4%
              </div>
            </div>
          )}
        </motion.div>
      </div>
    </div>
  );
}