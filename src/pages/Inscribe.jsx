import { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { Feather, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Slider } from "@/components/ui/slider";

const EMOTIONS = [
  "love", "wonder", "peace", "joy", "gratitude",
  "clarity", "longing", "awe", "compassion", "transcendence"
];

const FREQUENCIES = [
  "unity", "creation", "transformation", "healing",
  "awakening", "remembrance", "vision", "connection"
];

export default function Inscribe() {
  const navigate = useNavigate();
  const [submitting, setSubmitting] = useState(false);
  const [form, setForm] = useState({
    thought: "",
    emotion: "",
    frequency: "",
    intention: "",
    depth: 4,
  });

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.thought || !form.emotion || !form.frequency) return;

    setSubmitting(true);
    await base44.entities.ResonanceRecord.create({
      ...form,
      echoes: 0,
    });
    navigate("/collective");
  };

  return (
    <div className="min-h-screen flex items-start justify-center px-4 pt-24 pb-20">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="w-full max-w-lg"
      >
        {/* Header */}
        <div className="text-center mb-10">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-secondary/60 border border-border/40 mb-4">
            <Feather className="w-5 h-5 text-primary" />
          </div>
          <h1 className="font-heading text-3xl md:text-4xl font-light mb-2">
            Inscribe Your Resonance
          </h1>
          <p className="font-body text-sm text-muted-foreground">
            Add your consciousness to the collective field
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Thought */}
          <div className="space-y-2">
            <label className="text-xs font-body text-muted-foreground uppercase tracking-wider">
              Your Thought or Insight
            </label>
            <Textarea
              value={form.thought}
              onChange={(e) => setForm({ ...form, thought: e.target.value })}
              placeholder="What truth wishes to be spoken through you..."
              className="bg-card/40 backdrop-blur-sm border-border/40 min-h-[120px] font-heading text-base resize-none focus:border-primary/30"
              required
            />
          </div>

          {/* Emotion & Frequency */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-xs font-body text-muted-foreground uppercase tracking-wider">
                Emotion
              </label>
              <Select
                value={form.emotion}
                onValueChange={(v) => setForm({ ...form, emotion: v })}
              >
                <SelectTrigger className="bg-card/40 backdrop-blur-sm border-border/40 capitalize">
                  <SelectValue placeholder="Select..." />
                </SelectTrigger>
                <SelectContent>
                  {EMOTIONS.map((e) => (
                    <SelectItem key={e} value={e} className="capitalize">
                      {e}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <label className="text-xs font-body text-muted-foreground uppercase tracking-wider">
                Frequency
              </label>
              <Select
                value={form.frequency}
                onValueChange={(v) => setForm({ ...form, frequency: v })}
              >
                <SelectTrigger className="bg-card/40 backdrop-blur-sm border-border/40 capitalize">
                  <SelectValue placeholder="Select..." />
                </SelectTrigger>
                <SelectContent>
                  {FREQUENCIES.map((f) => (
                    <SelectItem key={f} value={f} className="capitalize">
                      {f}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Intention */}
          <div className="space-y-2">
            <label className="text-xs font-body text-muted-foreground uppercase tracking-wider">
              Intention <span className="text-muted-foreground/50">(optional)</span>
            </label>
            <Input
              value={form.intention}
              onChange={(e) => setForm({ ...form, intention: e.target.value })}
              placeholder="What do you intend with this record..."
              className="bg-card/40 backdrop-blur-sm border-border/40 font-body"
            />
          </div>

          {/* Depth */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <label className="text-xs font-body text-muted-foreground uppercase tracking-wider">
                Depth Level
              </label>
              <span className="text-xs font-body text-primary">{form.depth} / 7</span>
            </div>
            <Slider
              value={[form.depth]}
              onValueChange={([v]) => setForm({ ...form, depth: v })}
              min={1}
              max={7}
              step={1}
              className="py-2"
            />
            <div className="flex justify-between text-xs text-muted-foreground/50 font-body">
              <span>Surface</span>
              <span>Deep</span>
            </div>
          </div>

          {/* Submit */}
          <Button
            type="submit"
            disabled={submitting || !form.thought || !form.emotion || !form.frequency}
            className="w-full rounded-full h-12 bg-primary text-primary-foreground font-body text-sm hover:opacity-90 transition-opacity"
          >
            {submitting ? (
              <div className="w-5 h-5 border-2 border-primary-foreground/30 border-t-primary-foreground rounded-full animate-spin" />
            ) : (
              <span className="flex items-center gap-2">
                <Sparkles className="w-4 h-4" />
                Inscribe into the Akashic Field
              </span>
            )}
          </Button>
        </form>
      </motion.div>
    </div>
  );
}