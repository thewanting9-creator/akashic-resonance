import { useState } from "react";
import { base44 } from "@/api/base44Client";
import { motion } from "framer-motion";
import { Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

function generateAtomicNumber(existingNumbers = []) {
  let num;
  do {
    num = Math.floor(100000 + Math.random() * 900000).toString();
  } while (existingNumbers.includes(num));
  return num;
}

function assignTorusDomain() {
  return Math.random() < 0.5 ? "TOP" : "BOTTOM";
}

function validateAliasFormat(value) {
  // MM/DD/YYYY + Alias (at least 1 char alias, no spaces)
  return /^\d{2}\/\d{2}\/\d{4}[A-Za-z0-9]+$/.test(value);
}

export default function AliasGate({ userEmail, onComplete }) {
  const [alias, setAlias] = useState("");
  const [dobPart, setDobPart] = useState("");
  const [aliasPart, setAliasPart] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  const combined = dobPart && aliasPart ? `${dobPart}${aliasPart}` : "";

  const handleDobChange = (e) => {
    let val = e.target.value.replace(/\D/g, "");
    if (val.length >= 4) val = val.slice(0, 2) + "/" + val.slice(2, 4) + "/" + val.slice(4, 8);
    else if (val.length >= 2) val = val.slice(0, 2) + "/" + val.slice(2);
    setDobPart(val);
    setError("");
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const full = combined;
    if (!validateAliasFormat(full)) {
      setError("Format must be MM/DD/YYYY followed by your alias (no spaces).");
      return;
    }

    setSubmitting(true);

    // Check alias uniqueness
    const existing = await base44.entities.Participant.filter({ alias: full }, "-created_date", 1);
    if (existing.length > 0) {
      setError("This alias is already in use. Choose a different one.");
      setSubmitting(false);
      return;
    }

    // Get all atomic numbers to ensure uniqueness
    const all = await base44.entities.Participant.list("-created_date", 1000);
    const existingNumbers = all.map(p => p.atomic_consciousness_number);
    const atomicNumber = generateAtomicNumber(existingNumbers);
    const torusDomain = assignTorusDomain();

    await base44.entities.Participant.create({
      alias: full,
      atomic_consciousness_number: atomicNumber,
      torus_domain: torusDomain,
      user_email: userEmail,
      status: "active",
      is_seed: false,
      na33_grid: {
        outer_collective_traits: [],
        group_structured_traits: [],
        personal_traits: [],
        outer_ring_of_nothingness: { id: `orn-${atomicNumber}`, description: "Silent darkness / pre-energy field" },
        center_vortex: { atomic_consciousness_number: atomicNumber }
      }
    });

    onComplete();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/95 backdrop-blur-xl px-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="w-full max-w-md"
      >
        <div className="text-center mb-10">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-full bg-secondary/60 border border-border/40 mb-5">
            <Sparkles className="w-6 h-6 text-primary" />
          </div>
          <h1 className="font-heading text-3xl font-light mb-2">Enter the Field</h1>
          <p className="font-body text-sm text-muted-foreground max-w-xs mx-auto">
            Establish your identity in the Akashic Codex. Your signature is permanent and private.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          <div className="space-y-2">
            <label className="text-xs font-body text-muted-foreground uppercase tracking-wider">
              Date of Birth
            </label>
            <Input
              value={dobPart}
              onChange={handleDobChange}
              placeholder="MM/DD/YYYY"
              maxLength={10}
              className="bg-card/40 border-border/40 font-body tracking-widest"
              required
            />
          </div>

          <div className="space-y-2">
            <label className="text-xs font-body text-muted-foreground uppercase tracking-wider">
              Alias
            </label>
            <Input
              value={aliasPart}
              onChange={(e) => { setAliasPart(e.target.value.replace(/\s/g, "")); setError(""); }}
              placeholder="e.g. Walt"
              className="bg-card/40 border-border/40 font-body"
              required
            />
          </div>

          {combined && (
            <div className="p-3 rounded-xl bg-muted/20 border border-border/30 text-center">
              <span className="text-xs text-muted-foreground font-body">Your signature: </span>
              <span className="font-heading text-sm text-primary">{combined}</span>
            </div>
          )}

          {error && (
            <p className="text-xs text-rose-400 font-body text-center">{error}</p>
          )}

          <Button
            type="submit"
            disabled={submitting || !combined}
            className="w-full rounded-full h-12 font-body"
          >
            {submitting ? (
              <div className="w-5 h-5 border-2 border-primary-foreground/30 border-t-primary-foreground rounded-full animate-spin" />
            ) : (
              "Initialize My Presence"
            )}
          </Button>

          <p className="text-xs text-muted-foreground/50 font-body text-center">
            No real name, ID, or photo is stored. Your atomic number is assigned upon entry.
          </p>
        </form>
      </motion.div>
    </div>
  );
}