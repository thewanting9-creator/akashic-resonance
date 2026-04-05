import { createClientFromRequest } from 'npm:@base44/sdk@0.8.23';

// Runs every Sunday at 8am CT (14:00 UTC)
// Reads recent ResonanceArchive + ResonanceRecord data
// Generates a CollectivePatternReport via AI and saves it

Deno.serve(async (req) => {
  const base44 = createClientFromRequest(req);

  // Collect data from the past 7 days
  const since = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();

  const [archiveEntries, records, checkins, participants] = await Promise.all([
    base44.asServiceRole.entities.ResonanceArchive.list("-timestamp", 200),
    base44.asServiceRole.entities.ResonanceRecord.list("-created_date", 100),
    base44.asServiceRole.entities.PulseCheckIn.list("-created_date", 100),
    base44.asServiceRole.entities.Participant.filter({ status: "active" }),
  ]);

  // Summarize frequency distribution
  const freqCounts = {};
  for (const r of records)  if (r.frequency) freqCounts[r.frequency] = (freqCounts[r.frequency] || 0) + 1;
  for (const c of checkins) if (c.frequency) freqCounts[c.frequency] = (freqCounts[c.frequency] || 0) + 1;

  const dominantFreq = Object.entries(freqCounts).sort((a,b) => b[1]-a[1])[0]?.[0] || "unknown";
  const surges = archiveEntries.filter(a => a.snapshot_type === "sr_peak_alert").length;
  const topCount    = participants.filter(p => p.torus_domain === "TOP").length;
  const bottomCount = participants.filter(p => p.torus_domain === "BOTTOM").length;

  const avgSRHz = archiveEntries
    .filter(a => a.sr_hz)
    .reduce((sum, a, _, arr) => sum + a.sr_hz / arr.length, 0)
    .toFixed(2);

  const prompt = `
You are the AI Field Intelligence for the Akashic Resonance platform.
Analyze this week's collective field data and generate a symbolic, insightful pattern report.

FIELD DATA (past 7 days):
- Active participants: ${participants.length} (TOP torus: ${topCount}, BOTTOM: ${bottomCount})
- Total resonance records inscribed: ${records.length}
- Total pulse check-ins: ${checkins.length}
- Dominant frequency channel: ${dominantFreq}
- Frequency distribution: ${JSON.stringify(freqCounts)}
- SR peak surge events: ${surges}
- Average SR Hz across readings: ${avgSRHz}
- Recent record samples: ${records.slice(0, 8).map(r => `"${r.thought}" (${r.emotion}/${r.frequency})`).join(" | ")}

Generate a CollectivePatternReport with:
1. A rich symbolic pattern_summary (2-3 sentences)
2. 3-5 emerging_themes as short phrases
3. 2-3 resonance_clusters describing groupings observed
4. A collective_trajectory statement (where the field appears to be heading)

Keep the tone poetic, non-directive, and observational. Avoid making predictions or claims.
  `.trim();

  const result = await base44.asServiceRole.integrations.Core.InvokeLLM({
    prompt,
    response_json_schema: {
      type: "object",
      properties: {
        pattern_summary:      { type: "string" },
        emerging_themes:      { type: "array", items: { type: "string" } },
        resonance_clusters:   { type: "array", items: { type: "string" } },
        collective_trajectory:{ type: "string" },
      },
    },
  });

  const report = await base44.asServiceRole.entities.CollectivePatternReport.create({
    pattern_summary:       result.pattern_summary       || "Field data processed.",
    emerging_themes:       result.emerging_themes       || [],
    resonance_clusters:    result.resonance_clusters    || [],
    collective_trajectory: result.collective_trajectory || "",
    torus_balance: { topTorusCount: topCount, bottomTorusCount: bottomCount },
    ai_modes_used: ["PSYCHOLOGICAL", "ASTRONOMICAL"],
  });

  return Response.json({ ok: true, report_id: report.id, dominant_freq: dominantFreq, surges });
});