import { useEffect, useState } from "react";
import { base44 } from "@/api/base44Client";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { Lock, Eye, Layers, Cpu, Users, GitBranch, CheckCircle, XCircle, Clock, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import moment from "moment";

const PROPOSAL_TYPES = [
  "mapping_path", "frequency_expansion", "grid_structure",
  "trait_system", "consciousness_layer", "other"
];

export default function HiddenArchitecture() {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [devApp, setDevApp] = useState(null);
  const [proposals, setProposals] = useState([]);
  const [allApplications, setAllApplications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [analyzing, setAnalyzing] = useState(false);
  const [view, setView] = useState("architecture"); // architecture | propose | admin
  const [form, setForm] = useState({ title: "", description: "", proposal_type: "" });

  useEffect(() => {
    const load = async () => {
      const me = await base44.auth.me();
      setUser(me);

      if (me.role === "admin") {
        const [apps, props] = await Promise.all([
          base44.entities.DeveloperApplication.list("-created_date", 50),
          base44.entities.ArchitectureProposal.list("-created_date", 50),
        ]);
        setAllApplications(apps);
        setProposals(props);
        setLoading(false);
        return;
      }

      // Check if this user has an approved developer application
      const apps = await base44.entities.DeveloperApplication.filter(
        { applicant_email: me.email },
        "-created_date", 1
      );
      const app = apps[0] || null;
      setDevApp(app);

      if (app?.status === "approved") {
        const myProposals = await base44.entities.ArchitectureProposal.filter(
          { proposed_by: me.email },
          "-created_date", 20
        );
        setProposals(myProposals);
      }

      setLoading(false);
    };
    load();
  }, []);

  const submitProposal = async (e) => {
    e.preventDefault();
    if (!form.title || !form.description || !form.proposal_type) return;
    setSubmitting(true);
    setAnalyzing(true);

    // Create proposal first
    const proposal = await base44.entities.ArchitectureProposal.create({
      ...form,
      proposed_by: user.email,
      status: "pending_ai",
    });

    // AI analysis — silent, always runs before admin sees it
    const analysis = await base44.integrations.Core.InvokeLLM({
      prompt: `You are the guardian intelligence of a sacred consciousness mapping system called the Akashic Records of Resonance. A developer has submitted a structural proposal. Analyze it for:
1. Alignment with the system's core purpose (mapping collective consciousness, Na33 grid integrity, torus field coherence)
2. Any signs of ego-driven corruption, power-seeking, or attempts to alter fundamental purpose
3. Technical and philosophical soundness
4. Potential risks or benefits

Proposal Title: ${form.title}
Proposal Type: ${form.proposal_type}
Description: ${form.description}

Provide a clear, honest analysis. Flag anything that feels misaligned. Give an alignment score 0-100.`,
      response_json_schema: {
        type: "object",
        properties: {
          analysis: { type: "string" },
          alignment_score: { type: "number" },
          flags: { type: "array", items: { type: "string" } },
          recommendation: { type: "string", enum: ["approve", "review", "reject"] }
        }
      }
    });

    setAnalyzing(false);

    await base44.entities.ArchitectureProposal.update(proposal.id, {
      ai_analysis: analysis.analysis,
      ai_alignment_score: analysis.alignment_score,
      ai_flags: analysis.flags || [],
      status: "pending_approval",
    });

    setProposals(prev => [{
      ...proposal,
      ai_analysis: analysis.analysis,
      ai_alignment_score: analysis.alignment_score,
      status: "pending_approval"
    }, ...prev]);

    setForm({ title: "", description: "", proposal_type: "" });
    setView("architecture");
    setSubmitting(false);
  };

  const handleApplicationDecision = async (appId, status) => {
    await base44.entities.DeveloperApplication.update(appId, {
      status,
      reviewed_at: new Date().toISOString()
    });
    setAllApplications(prev => prev.map(a => a.id === appId ? { ...a, status } : a));
  };

  const handleProposalDecision = async (proposalId, status) => {
    await base44.entities.ArchitectureProposal.update(proposalId, { status });
    setProposals(prev => prev.map(p => p.id === proposalId ? { ...p, status } : p));
  };

  const handleRemoveDeveloper = async (app) => {
    // Silent removal — no explanation, no warning
    await base44.entities.DeveloperApplication.update(app.id, { status: "removed" });
    setAllApplications(prev => prev.map(a => a.id === app.id ? { ...a, status: "removed" } : a));
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="w-8 h-8 border-2 border-primary/30 border-t-primary rounded-full animate-spin" />
      </div>
    );
  }

  const isAdmin = user?.role === "admin";
  const isApprovedDev = devApp?.status === "approved";
  const isRemoved = devApp?.status === "removed";

  // Removed developers see nothing — silent
  if (!isAdmin && isRemoved) {
    navigate("/");
    return null;
  }

  // Not a developer and not admin — shouldn't be here
  if (!isAdmin && !devApp) {
    navigate("/");
    return null;
  }

  return (
    <div className="min-h-screen px-4 pt-24 pb-20">
      <div className="max-w-4xl mx-auto">

        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-10"
        >
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-secondary/60 border border-border/40 mb-4">
            <Lock className="w-5 h-5 text-primary" />
          </div>
          <h1 className="font-heading text-3xl md:text-4xl font-light mb-2">
            Hidden Architecture
          </h1>
          <p className="font-body text-sm text-muted-foreground">
            {isAdmin ? "Full sovereign access" : "Approved contributor access"}
          </p>
        </motion.div>

        {/* Tab nav */}
        <div className="flex items-center gap-2 mb-8 justify-center flex-wrap">
          {[
            { key: "architecture", label: "Architecture", icon: Layers },
            ...(isApprovedDev || isAdmin ? [{ key: "propose", label: "Submit Proposal", icon: GitBranch }] : []),
            ...(isAdmin ? [{ key: "admin", label: "Sovereign View", icon: Eye }] : []),
          ].map(({ key, label, icon: Icon }) => (
            <button
              key={key}
              onClick={() => setView(key)}
              className={`flex items-center gap-2 px-4 py-2 rounded-full text-sm font-body transition-all ${
                view === key
                  ? "bg-secondary/80 text-primary border border-primary/20"
                  : "text-muted-foreground hover:text-foreground border border-transparent"
              }`}
            >
              <Icon className="w-4 h-4" />
              {label}
            </button>
          ))}
        </div>

        {/* Architecture View */}
        {view === "architecture" && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">

            {/* Hierarchy */}
            <div className="bg-card/40 backdrop-blur-md border border-border/40 rounded-2xl p-6">
              <h2 className="font-heading text-xl mb-4 flex items-center gap-2">
                <Layers className="w-5 h-5 text-primary" />
                System Hierarchy
              </h2>
              <div className="space-y-3">
                {[
                  { tier: "I", label: "Sovereign", desc: "Overwrite authority on all changes. Identity protected.", color: "text-amber-400 border-amber-400/20 bg-amber-400/5" },
                  { tier: "II", label: "AI Guardian", desc: "Filters all proposals before sovereign review. Cannot be bypassed.", color: "text-violet-400 border-violet-400/20 bg-violet-400/5" },
                  { tier: "III", label: "Approved Developers", desc: "Contribute structural proposals. Access granted by sovereign approval only.", color: "text-sky-400 border-sky-400/20 bg-sky-400/5" },
                  { tier: "∞", label: "Participants", desc: "The collective field. The living data of the system.", color: "text-muted-foreground border-border/40 bg-muted/20" },
                ].map((h) => (
                  <div key={h.tier} className={`flex items-start gap-4 p-4 rounded-xl border ${h.color}`}>
                    <div className={`font-heading text-lg w-8 shrink-0 ${h.color.split(" ")[0]}`}>{h.tier}</div>
                    <div>
                      <div className="font-body text-sm font-medium text-foreground">{h.label}</div>
                      <div className="font-body text-xs text-muted-foreground mt-0.5">{h.desc}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Na33 Grid Structure */}
            <div className="bg-card/40 backdrop-blur-md border border-border/40 rounded-2xl p-6">
              <h2 className="font-heading text-xl mb-4 flex items-center gap-2">
                <Cpu className="w-5 h-5 text-primary" />
                Na33 Grid Architecture
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {[
                  { zone: "Outer Ring of Nothingness", count: "1", type: "pre-energy", desc: "Silent darkness / pre-energy field. The void before form.", color: "border-slate-600/30" },
                  { zone: "Center Vortex", count: "1", type: "anchor", desc: "Anchored to Atomic Consciousness Number. The identity singularity.", color: "border-amber-500/30" },
                  { zone: "Outer Collective Traits", count: "2", type: "COLLECTIVE", desc: "Shared field traits. Bridges individual to collective.", color: "border-violet-500/30" },
                  { zone: "Group Structured Traits", count: "2", type: "GROUP", desc: "Relational field. The between-space of connection.", color: "border-sky-500/30" },
                  { zone: "Personal Traits", count: "8", type: "PERSONAL", desc: "Core individual expression. The unique signature of each consciousness.", color: "border-emerald-500/30" },
                ].map((z) => (
                  <div key={z.zone} className={`p-4 rounded-xl border bg-muted/10 ${z.color}`}>
                    <div className="flex items-center justify-between mb-1">
                      <span className="font-body text-xs font-medium text-foreground">{z.zone}</span>
                      <span className="font-heading text-sm text-primary">{z.count}</span>
                    </div>
                    <span className="inline-block text-xs text-muted-foreground/60 uppercase tracking-wider mb-1">{z.type}</span>
                    <p className="text-xs text-muted-foreground">{z.desc}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* Torus Domain */}
            <div className="bg-card/40 backdrop-blur-md border border-border/40 rounded-2xl p-6">
              <h2 className="font-heading text-xl mb-4 flex items-center gap-2">
                <Users className="w-5 h-5 text-primary" />
                Torus Field Polarity
              </h2>
              <div className="grid grid-cols-2 gap-4">
                <div className="p-4 rounded-xl border border-violet-500/20 bg-violet-500/5 text-center">
                  <div className="font-heading text-2xl text-violet-400 mb-1">TOP</div>
                  <p className="text-xs text-muted-foreground">Outward flow. Expression. Emission into the field.</p>
                </div>
                <div className="p-4 rounded-xl border border-indigo-500/20 bg-indigo-500/5 text-center">
                  <div className="font-heading text-2xl text-indigo-400 mb-1">BOTTOM</div>
                  <p className="text-xs text-muted-foreground">Inward flow. Reception. Drawing from the field.</p>
                </div>
              </div>
            </div>

            {/* Developer Proposals */}
            {proposals.length > 0 && (
              <div className="bg-card/40 backdrop-blur-md border border-border/40 rounded-2xl p-6">
                <h2 className="font-heading text-xl mb-4">
                  {isAdmin ? "All Proposals" : "Your Proposals"}
                </h2>
                <div className="space-y-3">
                  {proposals.map((p) => (
                    <ProposalRow key={p.id} proposal={p} isAdmin={isAdmin} onDecide={handleProposalDecision} />
                  ))}
                </div>
              </div>
            )}
          </motion.div>
        )}

        {/* Submit Proposal */}
        {view === "propose" && (isApprovedDev || isAdmin) && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
            <div className="bg-card/40 backdrop-blur-md border border-border/40 rounded-2xl p-6 max-w-xl mx-auto">
              <h2 className="font-heading text-xl mb-1">Submit a Structural Proposal</h2>
              <p className="text-xs text-muted-foreground font-body mb-6">
                All proposals are reviewed by the AI Guardian before reaching sovereign review.
              </p>
              <form onSubmit={submitProposal} className="space-y-5">
                <div className="space-y-2">
                  <label className="text-xs font-body text-muted-foreground uppercase tracking-wider">Title</label>
                  <Input
                    value={form.title}
                    onChange={(e) => setForm({ ...form, title: e.target.value })}
                    className="bg-card/40 border-border/40"
                    placeholder="Brief title for your proposal"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-body text-muted-foreground uppercase tracking-wider">Proposal Type</label>
                  <Select value={form.proposal_type} onValueChange={(v) => setForm({ ...form, proposal_type: v })}>
                    <SelectTrigger className="bg-card/40 border-border/40 capitalize">
                      <SelectValue placeholder="Select type..." />
                    </SelectTrigger>
                    <SelectContent>
                      {PROPOSAL_TYPES.map((t) => (
                        <SelectItem key={t} value={t} className="capitalize">{t.replace(/_/g, " ")}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-body text-muted-foreground uppercase tracking-wider">Description</label>
                  <Textarea
                    value={form.description}
                    onChange={(e) => setForm({ ...form, description: e.target.value })}
                    className="bg-card/40 border-border/40 min-h-[140px] resize-none"
                    placeholder="Describe your proposed change in detail..."
                    required
                  />
                </div>
                <Button
                  type="submit"
                  disabled={submitting}
                  className="w-full rounded-full"
                >
                  {analyzing ? (
                    <span className="flex items-center gap-2">
                      <div className="w-4 h-4 border-2 border-primary-foreground/30 border-t-primary-foreground rounded-full animate-spin" />
                      AI Guardian reviewing...
                    </span>
                  ) : submitting ? (
                    <div className="w-4 h-4 border-2 border-primary-foreground/30 border-t-primary-foreground rounded-full animate-spin" />
                  ) : (
                    "Submit Proposal"
                  )}
                </Button>
              </form>
            </div>
          </motion.div>
        )}

        {/* Admin / Sovereign View */}
        {view === "admin" && isAdmin && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-8">
            {/* Developer Applications */}
            <div className="bg-card/40 backdrop-blur-md border border-border/40 rounded-2xl p-6">
              <h2 className="font-heading text-xl mb-4 flex items-center gap-2">
                <Users className="w-5 h-5 text-primary" />
                Developer Applications
                <span className="ml-auto text-xs text-muted-foreground font-body">
                  {allApplications.filter(a => a.status === "pending").length} pending
                </span>
              </h2>
              {allApplications.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-6">No applications yet</p>
              ) : (
                <div className="space-y-4">
                  {allApplications.map((app) => (
                    <div key={app.id} className="border border-border/30 rounded-xl p-4">
                      <div className="flex items-start justify-between mb-2">
                        <div>
                          <div className="font-body text-sm font-medium">{app.applicant_name}</div>
                          <div className="text-xs text-muted-foreground">{app.applicant_email}</div>
                        </div>
                        <StatusBadge status={app.status} />
                      </div>
                      <p className="text-xs text-muted-foreground mb-1"><span className="text-foreground/60">Reason:</span> {app.reason}</p>
                      <p className="text-xs text-muted-foreground mb-1"><span className="text-foreground/60">Intention:</span> {app.intention}</p>
                      {app.ai_screening && (
                        <div className="mt-3 p-3 bg-muted/20 rounded-lg border border-violet-500/10">
                          <div className="text-xs text-violet-400 mb-1 font-body">AI Screening</div>
                          <p className="text-xs text-muted-foreground">{app.ai_screening}</p>
                        </div>
                      )}
                      {app.status === "pending" && (
                        <div className="flex gap-2 mt-3">
                          <Button size="sm" variant="ghost" className="text-emerald-400 hover:text-emerald-300 text-xs"
                            onClick={() => handleApplicationDecision(app.id, "approved")}>
                            <CheckCircle className="w-3.5 h-3.5 mr-1" /> Approve
                          </Button>
                          <Button size="sm" variant="ghost" className="text-rose-400 hover:text-rose-300 text-xs"
                            onClick={() => handleApplicationDecision(app.id, "rejected")}>
                            <XCircle className="w-3.5 h-3.5 mr-1" /> Reject
                          </Button>
                        </div>
                      )}
                      {app.status === "approved" && (
                        <button
                          onClick={() => handleRemoveDeveloper(app)}
                          className="mt-3 flex items-center gap-1 text-xs text-muted-foreground/40 hover:text-muted-foreground/60 transition-colors"
                        >
                          <Trash2 className="w-3 h-3" />
                          Remove access
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* All Proposals */}
            <div className="bg-card/40 backdrop-blur-md border border-border/40 rounded-2xl p-6">
              <h2 className="font-heading text-xl mb-4 flex items-center gap-2">
                <GitBranch className="w-5 h-5 text-primary" />
                Proposals Awaiting Decision
              </h2>
              {proposals.filter(p => p.status === "pending_approval").length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-6">No proposals pending decision</p>
              ) : (
                <div className="space-y-4">
                  {proposals.filter(p => p.status === "pending_approval").map((p) => (
                    <ProposalRow key={p.id} proposal={p} isAdmin={isAdmin} onDecide={handleProposalDecision} />
                  ))}
                </div>
              )}
            </div>
          </motion.div>
        )}
      </div>
    </div>
  );
}

function StatusBadge({ status }) {
  const configs = {
    pending: { color: "border-amber-500/30 text-amber-400 bg-amber-500/5", label: "Pending" },
    approved: { color: "border-emerald-500/30 text-emerald-400 bg-emerald-500/5", label: "Approved" },
    rejected: { color: "border-rose-500/30 text-rose-400 bg-rose-500/5", label: "Rejected" },
    removed: { color: "border-border/30 text-muted-foreground bg-muted/10", label: "—" },
    pending_ai: { color: "border-violet-500/30 text-violet-400 bg-violet-500/5", label: "AI Review" },
    pending_approval: { color: "border-amber-500/30 text-amber-400 bg-amber-500/5", label: "Awaiting" },
  };
  const c = configs[status] || configs.pending;
  return (
    <span className={`text-xs px-2 py-0.5 rounded-full border font-body ${c.color}`}>{c.label}</span>
  );
}

function ProposalRow({ proposal, isAdmin, onDecide }) {
  const [expanded, setExpanded] = useState(false);

  return (
    <div className="border border-border/30 rounded-xl p-4">
      <div className="flex items-start justify-between mb-2">
        <div>
          <div className="font-body text-sm font-medium">{proposal.title}</div>
          <div className="text-xs text-muted-foreground capitalize">{proposal.proposal_type?.replace(/_/g, " ")} · {moment(proposal.created_date).fromNow()}</div>
        </div>
        <StatusBadge status={proposal.status} />
      </div>

      <button onClick={() => setExpanded(!expanded)} className="text-xs text-primary hover:underline font-body">
        {expanded ? "Hide" : "Show"} details
      </button>

      {expanded && (
        <div className="mt-3 space-y-3">
          <p className="text-xs text-muted-foreground">{proposal.description}</p>

          {proposal.ai_analysis && (
            <div className="p-3 bg-muted/20 rounded-lg border border-violet-500/10">
              <div className="flex items-center justify-between mb-1">
                <span className="text-xs text-violet-400 font-body">AI Guardian Analysis</span>
                {proposal.ai_alignment_score !== undefined && (
                  <span className={`text-xs font-body ${proposal.ai_alignment_score >= 70 ? "text-emerald-400" : proposal.ai_alignment_score >= 40 ? "text-amber-400" : "text-rose-400"}`}>
                    Alignment: {proposal.ai_alignment_score}/100
                  </span>
                )}
              </div>
              <p className="text-xs text-muted-foreground">{proposal.ai_analysis}</p>
              {proposal.ai_flags?.length > 0 && (
                <div className="mt-2 flex flex-wrap gap-1">
                  {proposal.ai_flags.map((flag, i) => (
                    <span key={i} className="text-xs px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-400 border border-amber-500/20">⚠ {flag}</span>
                  ))}
                </div>
              )}
            </div>
          )}

          {isAdmin && proposal.status === "pending_approval" && (
            <div className="flex gap-2 pt-1">
              <Button size="sm" variant="ghost" className="text-emerald-400 hover:text-emerald-300 text-xs"
                onClick={() => onDecide(proposal.id, "approved")}>
                <CheckCircle className="w-3.5 h-3.5 mr-1" /> Approve
              </Button>
              <Button size="sm" variant="ghost" className="text-rose-400 hover:text-rose-300 text-xs"
                onClick={() => onDecide(proposal.id, "rejected")}>
                <XCircle className="w-3.5 h-3.5 mr-1" /> Reject
              </Button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}