import { createClientFromRequest } from 'npm:@base44/sdk@0.8.23';

// Triggered by entity automation when a sr_peak_alert is created in ResonanceArchive
// Sends email to all active participants who have a user_email set

Deno.serve(async (req) => {
  const base44 = createClientFromRequest(req);

  const body = await req.json().catch(() => ({}));
  const archiveRecord = body.data || {};

  const hz    = archiveRecord.sr_hz       || "unknown";
  const power = archiveRecord.sr_power_pt || "unknown";
  const mode  = archiveRecord.sr_mode     || "unknown";
  const ts    = archiveRecord.timestamp   ? new Date(archiveRecord.timestamp).toLocaleString("en-US", { timeZone: "America/Chicago" }) : "now";

  // Get all active participants with emails
  const participants = await base44.asServiceRole.entities.Participant.filter({ status: "active" });
  const withEmail = participants.filter(p => p.user_email);

  if (withEmail.length === 0) {
    return Response.json({ ok: true, sent: 0, reason: "no participants with email" });
  }

  let sent = 0;
  for (const p of withEmail) {
    await base44.asServiceRole.integrations.Core.SendEmail({
      to: p.user_email,
      subject: `⚡ Akashic SR Surge Alert — Mode ${mode} · ${hz} Hz`,
      body: `
<div style="font-family: Georgia, serif; max-width: 540px; margin: 0 auto; background: #0a0a14; color: #e8e0cc; padding: 32px; border-radius: 12px;">
  <div style="text-align:center; margin-bottom: 24px;">
    <div style="font-size: 32px; letter-spacing: 2px; color: #c4a35a;">⚡ SR SURGE DETECTED</div>
    <div style="font-size: 12px; color: #888; margin-top: 6px; letter-spacing: 1px;">AKASHIC RESONANCE FIELD ALERT</div>
  </div>

  <div style="background: #12102a; border: 1px solid #2a2040; border-radius: 8px; padding: 20px; margin-bottom: 20px;">
    <div style="display: flex; justify-content: space-between; margin-bottom: 12px;">
      <span style="color: #888; font-size: 11px; text-transform: uppercase; letter-spacing: 1px;">SR Mode</span>
      <span style="color: #c4a35a; font-size: 18px; font-weight: bold;">M${mode}</span>
    </div>
    <div style="display: flex; justify-content: space-between; margin-bottom: 12px;">
      <span style="color: #888; font-size: 11px; text-transform: uppercase; letter-spacing: 1px;">Frequency</span>
      <span style="color: #60a5fa; font-size: 18px; font-weight: bold;">${hz} Hz</span>
    </div>
    <div style="display: flex; justify-content: space-between;">
      <span style="color: #888; font-size: 11px; text-transform: uppercase; letter-spacing: 1px;">Power</span>
      <span style="color: #a78bfa; font-size: 18px; font-weight: bold;">${power} pT</span>
    </div>
  </div>

  <p style="color: #b0a890; font-size: 14px; line-height: 1.7;">
    The global Schumann Resonance field is experiencing elevated activity. This is a favorable window for resonance work, intention setting, and collective alignment practices.
  </p>

  <p style="color: #888; font-size: 12px; margin-top: 8px;">
    Detected at ${ts} (CT) · Atomic ID: ${p.atomic_consciousness_number || "—"}
  </p>

  <div style="text-align: center; margin-top: 24px;">
    <a href="https://akashic.base44.app" style="background: #c4a35a; color: #0a0a14; padding: 10px 24px; border-radius: 20px; text-decoration: none; font-size: 13px; font-weight: bold; letter-spacing: 1px;">OPEN FIELD CONTROL</a>
  </div>

  <div style="margin-top: 24px; border-top: 1px solid #2a2040; padding-top: 16px; font-size: 11px; color: #555; text-align: center;">
    Akashic Resonance · Experimental SR monitoring · Not medical advice
  </div>
</div>
      `.trim(),
    });
    sent++;
  }

  return Response.json({ ok: true, sent, mode, hz, power });
});