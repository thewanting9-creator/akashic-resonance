import { useEffect, useState } from "react";
import { base44 } from "@/api/base44Client";
import { motion } from "framer-motion";
import { GitBranch, Send, Clock, XCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useNavigate } from "react-router-dom";

export default function DeveloperGateway() {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [existing, setExisting] = useState(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [form, setForm] = useState({
    applicant_name: "",
    reason: "",
    background: "",
    intention: "",
  });

  useEffect(() => {
    const load = async () => {
      const me = await base44.auth.me();
      setUser(me);

      if (me.role === "admin") {
        navigate("/hidden-architecture");
        return;
      }

      const apps = await base44.entities.DeveloperApplication.filter(
        { applicant_email: me.email }, "-created_date", 1
      );
      const app = apps[0] || null;
      setExisting(app);

      // Silent removal — just send them home
      if (app?.status === "removed") {
        navigate("/");
        return;
      }

      // Already approved — go straight to architecture
      if (app?.status === "approved") {
        navigate("/hidden-architecture");
        return;
      }

      setForm(f => ({ ...f, applicant_name: me.full_name || "" }));
      setLoading(false);
    };
    load();
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);

    // AI pre-screens the application before it reaches admin
    const screening = await base44.integrations.Core.InvokeLLM({
      prompt: `You are the AI Guardian of the Akashic Records of Resonance — a sacred consciousness mapping system. A participant is applying to become a developer contributor.

Applicant Name: ${form.applicant_name}
Reason for applying: ${form.reason}
Background: ${form.background}
Stated intention: ${form.intention}

Assess their application. Are they motivated by genuine contribution or by a desire for control/access? Do they seem aligned with a system built on collective consciousness, integrity, and service? Provide a concise screening note for the sovereign's review.`,
    });

    await base44.entities.DeveloperApplication.create({
      applicant_email: user.email,
      applicant_name: form.applicant_name,
      reason: form.reason,
      background: form.background,
      intention: form.intention,
      status: "pending",
      ai_screening: screening,
    });

    setExisting({ status: "pending" });
    setSubmitting(false);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="w-8 h-8 border-2 border-primary/30 border-t-primary rounded-full animate-spin" />
      </div>
    );
  }

  // Pending state
  if (existing?.status === "pending") {
    return (
      <div className="min-h-screen flex items-center justify-center px-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center max-w-md"
        >
          <Clock className="w-10 h-10 text-amber-400/60 mx-auto mb-4" />
          <h2 className="font-heading text-2xl mb-2">Application Received</h2>
          <p className="font-body text-sm text-muted-foreground">
            Your application is being reviewed. You will be notified if access is granted.
          </p>
        </motion.div>
      </div>
    );
  }

  // Rejected state
  if (existing?.status === "rejected") {
    return (
      <div className="min-h-screen flex items-center justify-center px-4">
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="text-center max-w-md"
        >
          <XCircle className="w-10 h-10 text-rose-400/60 mx-auto mb-4" />
          <h2 className="font-heading text-2xl mb-2">Application Closed</h2>
          <p className="font-body text-sm text-muted-foreground">
            This application was not approved. You remain a valued participant in the collective field.
          </p>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-start justify-center px-4 pt-24 pb-20">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-lg"
      >
        <div className="text-center mb-10">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-secondary/60 border border-border/40 mb-4">
            <GitBranch className="w-5 h-5 text-primary" />
          </div>
          <h1 className="font-heading text-3xl md:text-4xl font-light mb-2">
            Contributor Access
          </h1>
          <p className="font-body text-sm text-muted-foreground max-w-sm mx-auto">
            Serious participants may apply to contribute to the architecture of this system.
            Access is granted by sovereign approval only.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          <div className="space-y-2">
            <label className="text-xs font-body text-muted-foreground uppercase tracking-wider">Your Name</label>
            <Input
              value={form.applicant_name}
              onChange={(e) => setForm({ ...form, applicant_name: e.target.value })}
              className="bg-card/40 border-border/40"
              required
            />
          </div>
          <div className="space-y-2">
            <label className="text-xs font-body text-muted-foreground uppercase tracking-wider">Why do you wish to contribute?</label>
            <Textarea
              value={form.reason}
              onChange={(e) => setForm({ ...form, reason: e.target.value })}
              className="bg-card/40 border-border/40 min-h-[100px] resize-none"
              placeholder="Speak honestly..."
              required
            />
          </div>
          <div className="space-y-2">
            <label className="text-xs font-body text-muted-foreground uppercase tracking-wider">Background / Experience</label>
            <Textarea
              value={form.background}
              onChange={(e) => setForm({ ...form, background: e.target.value })}
              className="bg-card/40 border-border/40 min-h-[80px] resize-none"
              placeholder="Relevant background..."
            />
          </div>
          <div className="space-y-2">
            <label className="text-xs font-body text-muted-foreground uppercase tracking-wider">Your Intention</label>
            <Textarea
              value={form.intention}
              onChange={(e) => setForm({ ...form, intention: e.target.value })}
              className="bg-card/40 border-border/40 min-h-[80px] resize-none"
              placeholder="What do you intend to bring to this system..."
              required
            />
          </div>
          <Button type="submit" disabled={submitting} className="w-full rounded-full">
            {submitting ? (
              <span className="flex items-center gap-2">
                <div className="w-4 h-4 border-2 border-primary-foreground/30 border-t-primary-foreground rounded-full animate-spin" />
                Submitting...
              </span>
            ) : (
              <span className="flex items-center gap-2">
                <Send className="w-4 h-4" />
                Submit Application
              </span>
            )}
          </Button>
        </form>
      </motion.div>
    </div>
  );
}