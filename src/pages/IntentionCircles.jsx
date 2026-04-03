import { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { motion, AnimatePresence } from "framer-motion";
import { Users, Plus, X, Loader2, Radio, Clock } from "lucide-react";
import { SCHUMANN_DATA } from "../lib/schumannData";

const FREQ_OPTIONS = ["unity","creation","transformation","healing","awakening","remembrance","vision","connection"];
const MOOD_OPTIONS = ["calm","creative","focused","inspired","flow","grateful","insight","heightened"];
const FREQ_COLORS  = { unity:"#c4a35a", creation:"#a78bfa", transformation:"#f472b6", healing:"#34d399",
  awakening:"#60a5fa", remembrance:"#fb923c", vision:"#e879f9", connection:"#2dd4bf" };

function estimateSRMode() {
  const h = new Date().getHours();
  return h >= 6 && h <= 10 ? 5 : h >= 14 && h <= 16 ? 7 : h >= 20 || h <= 4 ? 1 : 3;
}

export default function IntentionCircles() {
  const [circles, setCircles]   = useState([]);
  const [loading, setLoading]   = useState(true);
  const [creating, setCreating] = useState(false);
  const [joining, setJoining]   = useState(null);
  const [user, setUser]         = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [message, setMessage]   = useState("");
  const [form, setForm]         = useState({ title:"", intention:"", frequency:"unity", mood_tag:"calm", duration_minutes: 20 });

  const srMode = estimateSRMode();
  const srData = SCHUMANN_DATA.schumann_resonances[srMode - 1];

  useEffect(() => {
    const load = async () => {
      const me = await base44.auth.me();
      setUser(me);
      const data = await base44.entities.IntentionCircle.filter({ status: "active" }, "-created_date", 20);
      setCircles(data);
      setLoading(false);
    };
    load();

    // Poll every 15s for new messages / participants
    const id = setInterval(async () => {
      const data = await base44.entities.IntentionCircle.filter({ status: "active" }, "-created_date", 20);
      setCircles(data);
    }, 15000);
    return () => clearInterval(id);
  }, []);

  const handleCreate = async () => {
    if (!form.title || !form.intention) return;
    setCreating(true);
    const participant = await base44.entities.Participant.filter({ user_email: user.email }, "-created_date", 1);
    const alias = participant[0]?.alias || user.email.split("@")[0];
    const circle = await base44.entities.IntentionCircle.create({
      ...form,
      schumann_mode_target: srMode,
      participant_count: 1,
      host_alias: alias,
      messages: [],
    });
    setCircles(c => [circle, ...c]);
    setJoining(circle);
    setShowForm(false);
    setCreating(false);
  };

  const handleJoin = async (circle) => {
    await base44.entities.IntentionCircle.update(circle.id, {
      participant_count: (circle.participant_count || 1) + 1,
    });
    setJoining(circle);
  };

  const handleSendMessage = async () => {
    if (!message.trim() || !joining) return;
    const participant = await base44.entities.Participant.filter({ user_email: user.email }, "-created_date", 1);
    const alias = participant[0]?.alias || "Anonymous";
    const newMsg = { alias, text: message.trim(), ts: new Date().toISOString() };
    const updated = await base44.entities.IntentionCircle.update(joining.id, {
      messages: [...(joining.messages || []), newMsg],
    });
    setJoining(updated);
    setCircles(cs => cs.map(c => c.id === updated.id ? updated : c));
    setMessage("");
  };

  const handleClose = async (circle) => {
    await base44.entities.IntentionCircle.update(circle.id, { status: "closed" });
    setCircles(cs => cs.filter(c => c.id !== circle.id));
    if (joining?.id === circle.id) setJoining(null);
  };

  return (
    <div className="max-w-5xl mx-auto px-4 py-10 min-h-screen">
      {/* Header */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="mb-6">
        <div className="flex items-center justify-between flex-wrap gap-3">
          <div>
            <div className="flex items-center gap-2.5 mb-1">
              <Users className="w-5 h-5 text-primary" />
              <h1 className="font-heading text-3xl">Intention Circles</h1>
            </div>
            <p className="font-body text-sm text-muted-foreground">
              Join or create a live shared focus session · SR Mode {srMode} · {srData.frequency_hz} Hz · {srData.mental_state.split(",")[0]}
            </p>
          </div>
          <button onClick={() => setShowForm(s => !s)}
            className="flex items-center gap-2 px-4 py-2 rounded-full bg-primary text-primary-foreground text-sm font-body hover:opacity-90 transition-opacity">
            <Plus className="w-4 h-4" /> Create Circle
          </button>
        </div>
      </motion.div>

      {/* Create form */}
      <AnimatePresence>
        {showForm && (
          <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }}
            className="mb-6 bg-card/40 backdrop-blur-md border border-border/30 rounded-2xl p-5 overflow-hidden">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-heading text-base">New Intention Circle</h3>
              <button onClick={() => setShowForm(false)}><X className="w-4 h-4 text-muted-foreground" /></button>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-3">
              <input value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))}
                placeholder="Circle name…"
                className="bg-transparent border border-border/40 rounded-xl px-3 py-2 text-sm font-body outline-none text-foreground/80 placeholder:text-muted-foreground/50" />
              <input value={form.intention} onChange={e => setForm(f => ({ ...f, intention: e.target.value }))}
                placeholder="Shared intention…"
                className="bg-transparent border border-border/40 rounded-xl px-3 py-2 text-sm font-body outline-none text-foreground/80 placeholder:text-muted-foreground/50" />
              <select value={form.frequency} onChange={e => setForm(f => ({ ...f, frequency: e.target.value }))}
                className="bg-card/60 border border-border/40 rounded-xl px-3 py-2 text-sm font-body outline-none text-foreground/80 capitalize">
                {FREQ_OPTIONS.map(f => <option key={f} value={f}>{f}</option>)}
              </select>
              <select value={form.mood_tag} onChange={e => setForm(f => ({ ...f, mood_tag: e.target.value }))}
                className="bg-card/60 border border-border/40 rounded-xl px-3 py-2 text-sm font-body outline-none text-foreground/80 capitalize">
                {MOOD_OPTIONS.map(m => <option key={m} value={m}>{m}</option>)}
              </select>
            </div>
            <div className="flex items-center gap-3">
              <div className="text-xs font-body text-muted-foreground">Duration:</div>
              {[15,20,30,45].map(d => (
                <button key={d} onClick={() => setForm(f => ({ ...f, duration_minutes: d }))}
                  className={`px-3 py-1 rounded-full text-xs font-body border transition-all ${form.duration_minutes === d ? "bg-primary text-primary-foreground border-primary" : "border-border/40 text-muted-foreground hover:text-foreground"}`}>
                  {d}m
                </button>
              ))}
              <button onClick={handleCreate} disabled={creating || !form.title || !form.intention}
                className="ml-auto px-5 py-2 rounded-full bg-primary text-primary-foreground text-sm font-body hover:opacity-90 disabled:opacity-40 transition-opacity flex items-center gap-2">
                {creating ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : null}
                Open Circle
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Circles list */}
        <div className="space-y-3">
          {loading ? (
            <div className="flex items-center justify-center h-40"><Loader2 className="w-5 h-5 text-primary animate-spin" /></div>
          ) : circles.length === 0 ? (
            <div className="text-center py-16 text-muted-foreground font-body text-sm">
              No active circles · be the first to open one
            </div>
          ) : (
            circles.map(c => (
              <motion.div key={c.id} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
                className={`bg-card/30 backdrop-blur-md border rounded-2xl p-4 transition-all ${joining?.id === c.id ? "border-primary/40" : "border-border/30"}`}>
                <div className="flex items-start justify-between mb-2">
                  <div>
                    <div className="font-heading text-base text-foreground/90">{c.title}</div>
                    <div className="text-xs font-body text-muted-foreground mt-0.5 italic">"{c.intention}"</div>
                  </div>
                  <div className="flex items-center gap-1.5 ml-3 flex-shrink-0">
                    <Radio className="w-3 h-3 text-primary animate-pulse" />
                    <span className="text-[10px] font-body text-primary">{c.participant_count} in circle</span>
                  </div>
                </div>
                <div className="flex items-center gap-2 flex-wrap mb-3">
                  <span className="text-[10px] font-body capitalize px-2 py-0.5 rounded-full border" style={{ color: FREQ_COLORS[c.frequency], borderColor: FREQ_COLORS[c.frequency] + "44" }}>{c.frequency}</span>
                  <span className="text-[10px] font-body text-muted-foreground capitalize">{c.mood_tag}</span>
                  <span className="text-[10px] font-body text-muted-foreground flex items-center gap-1"><Clock className="w-2.5 h-2.5" />{c.duration_minutes}min</span>
                  <span className="text-[10px] font-body text-muted-foreground/50">by {c.host_alias}</span>
                </div>
                <div className="flex gap-2">
                  <button onClick={() => joining?.id === c.id ? setJoining(null) : handleJoin(c)}
                    className={`flex-1 py-2 rounded-full text-xs font-body border transition-all ${joining?.id === c.id ? "bg-primary/20 border-primary/40 text-primary" : "border-border/40 text-muted-foreground hover:text-foreground"}`}>
                    {joining?.id === c.id ? "Entered ✓" : "Enter Circle"}
                  </button>
                  {user && c.created_by === user.email && (
                    <button onClick={() => handleClose(c)} className="px-3 py-2 rounded-full text-xs font-body border border-destructive/30 text-destructive/70 hover:bg-destructive/10 transition-colors">
                      Close
                    </button>
                  )}
                </div>
              </motion.div>
            ))
          )}
        </div>

        {/* Live circle room */}
        <AnimatePresence>
          {joining ? (
            <motion.div key={joining.id} initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 20 }}
              className="bg-card/30 backdrop-blur-md border border-primary/20 rounded-2xl p-5 flex flex-col" style={{ minHeight: 400 }}>
              <div className="flex items-center justify-between mb-3">
                <div>
                  <div className="font-heading text-base text-foreground/90">{joining.title}</div>
                  <div className="text-xs font-body text-muted-foreground italic">"{joining.intention}"</div>
                </div>
                <button onClick={() => setJoining(null)}><X className="w-4 h-4 text-muted-foreground" /></button>
              </div>

              {/* Messages */}
              <div className="flex-1 overflow-y-auto space-y-2 mb-3 pr-1 max-h-64">
                {(joining.messages || []).length === 0 && (
                  <div className="text-center py-8 text-xs font-body text-muted-foreground/50">Hold the intention in silence, or share a word…</div>
                )}
                {(joining.messages || []).map((m, i) => (
                  <div key={i} className="px-3 py-2 rounded-xl bg-secondary/30 border border-border/20">
                    <div className="text-[10px] font-body text-muted-foreground mb-0.5">{m.alias}</div>
                    <div className="text-sm font-body text-foreground/80">{m.text}</div>
                  </div>
                ))}
              </div>

              {/* Send */}
              <div className="flex gap-2">
                <input value={message} onChange={e => setMessage(e.target.value)}
                  onKeyDown={e => e.key === "Enter" && handleSendMessage()}
                  placeholder="A word into the circle…"
                  className="flex-1 bg-transparent border border-border/40 rounded-xl px-3 py-2 text-sm font-body outline-none text-foreground/80 placeholder:text-muted-foreground/50" />
                <button onClick={handleSendMessage} disabled={!message.trim()}
                  className="px-4 py-2 rounded-xl bg-primary text-primary-foreground text-xs font-body hover:opacity-90 disabled:opacity-40 transition-opacity">
                  Send
                </button>
              </div>
            </motion.div>
          ) : (
            <motion.div key="empty" className="flex items-center justify-center h-40 text-muted-foreground font-body text-sm">
              Select a circle to enter
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}