import { motion } from "framer-motion";
import { Shield, ChevronDown } from "lucide-react";
import { useState } from "react";

const SECTIONS = [
  {
    title: "Overview",
    content: `Akashic Resonance ("the Platform") is a consciousness mapping and collective resonance research tool. Your privacy is foundational to our design. We collect the minimum data necessary to operate the platform and never sell, share, or expose personally identifiable information (PII) to third parties.`
  },
  {
    title: "Atomic Resonance ID System",
    content: `Every participant is assigned a unique, non-repeating Atomic Resonance ID (atomic_consciousness_number) at initialization. This ID — not your name or email — is used in all collective field data, archives, HarmonyNode sessions, soundscapes, and resonance records. Your identity in the collective field is always anonymous.`
  },
  {
    title: "Birth Data & First Pulse",
    content: `If you choose to generate your First Pulse chart, you may optionally provide birth date, approximate location, and time of day. This data is used solely to generate your chart and is permanently deleted from our systems immediately after your First Pulse pack is created. We store only the generated chart output and a non-identifying location label (city/region only — no coordinates). The field birth_data_deleted is set to true upon deletion as a permanent audit flag.`
  },
  {
    title: "Data We Collect",
    content: `• Account email (required for authentication — never shared publicly)\n• Alias / display name (chosen by you)\n• Atomic Resonance ID (system-generated, anonymous)\n• Torus domain assignment (TOP or BOTTOM — system-generated)\n• Resonance records, pulse check-ins, journal entries, and soundscapes you create\n• Session activity (frequency channels, moods, binaural settings) — stored under your Atomic ID only\n• First Pulse chart output (after birth data deletion)`
  },
  {
    title: "Data We Do NOT Collect",
    content: `• Real name (beyond what you choose as alias)\n• Precise GPS or location coordinates\n• Birth data after First Pulse generation\n• Device identifiers beyond standard session management\n• Behavioral tracking for advertising\n• Any data sold to or shared with third-party advertisers`
  },
  {
    title: "Collective Field Data",
    content: `All data displayed in collective views (Collective Feed, Harmony Network, Resonance Globe, Intention Circles, etc.) is associated with Atomic IDs only — never email addresses or real names. Resonance records you inscribe are visible to other participants under your alias and Atomic ID.`
  },
  {
    title: "Data Retention & Deletion",
    content: `You may delete your account at any time via the Account button in the navigation. Upon deletion:\n• Your Participant profile is permanently removed\n• Your associated records remain in aggregate collective data under your Atomic ID (anonymized)\n• Your email is fully removed from all records\n\nTo request complete data erasure including anonymized records, contact us directly.`
  },
  {
    title: "Security",
    content: `Authentication is handled by Base44's secure platform infrastructure. All data is transmitted over HTTPS. Administrative access is role-restricted. The platform undergoes periodic security review by the architect and approved contributors only.`
  },
  {
    title: "Children's Privacy",
    content: `Akashic Resonance is not intended for users under 13 years of age. We do not knowingly collect data from children. If you believe a child has created an account, please contact us for immediate removal.`
  },
  {
    title: "Changes to This Policy",
    content: `We may update this policy as the platform evolves. Significant changes will be communicated via in-app notification. Continued use of the platform constitutes acceptance of the updated policy.`
  },
  {
    title: "Contact",
    content: `For privacy inquiries, data deletion requests, or security concerns, contact the platform architect directly through the Contribute section of the app or via the platform's official channels at nexusalpha33.com.`
  }
];

function Section({ title, content, index }) {
  const [open, setOpen] = useState(index === 0);
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.04 }}
      className="border border-border/30 rounded-2xl overflow-hidden"
    >
      <button
        onClick={() => setOpen(o => !o)}
        className="w-full flex items-center justify-between px-5 py-4 bg-card/30 hover:bg-card/50 transition-colors text-left"
      >
        <span className="font-heading text-base text-foreground/90">{title}</span>
        <ChevronDown className={`w-4 h-4 text-muted-foreground transition-transform ${open ? "rotate-180" : ""}`} />
      </button>
      {open && (
        <div className="px-5 py-4 bg-card/10 border-t border-border/20">
          <p className="font-body text-sm text-muted-foreground leading-relaxed whitespace-pre-line select-text">
            {content}
          </p>
        </div>
      )}
    </motion.div>
  );
}

export default function PrivacyPolicy() {
  return (
    <div className="min-h-screen max-w-2xl mx-auto px-4 py-10">
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="mb-8 text-center">
        <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-secondary/60 border border-border/40 mb-4">
          <Shield className="w-5 h-5 text-primary" />
        </div>
        <h1 className="font-heading text-3xl md:text-4xl font-light mb-2">Privacy Policy</h1>
        <p className="font-body text-xs text-muted-foreground">Akashic Resonance · nexusalpha33.com · Last updated April 2026</p>
      </motion.div>

      <div className="space-y-2">
        {SECTIONS.map((s, i) => (
          <Section key={s.title} title={s.title} content={s.content} index={i} />
        ))}
      </div>

      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.5 }}
        className="mt-8 p-4 rounded-2xl bg-primary/5 border border-primary/20 text-center">
        <p className="font-body text-xs text-muted-foreground/70 leading-relaxed">
          Privacy by design. Your consciousness data belongs to you.<br />
          Atomic Resonance ID — never your name — in the collective field.
        </p>
      </motion.div>
    </div>
  );
}