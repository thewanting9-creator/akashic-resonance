import { useEffect, useState } from "react";
import { base44 } from "@/api/base44Client";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { Sparkles, ArrowRight, Globe, Waves } from "lucide-react";
import ResonanceOrb from "../components/ResonanceOrb";

export default function Home() {
  const [records, setRecords] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedRecord, setSelectedRecord] = useState(null);

  useEffect(() => {
    const load = async () => {
      const data = await base44.entities.ResonanceRecord.list("-created_date", 30);
      setRecords(data);
      setLoading(false);
    };
    load();
  }, []);

  const totalEchoes = records.reduce((sum, r) => sum + (r.echoes || 0), 0);

  return (
    <div className="min-h-screen flex flex-col">
      {/* Hero section */}
      <section className="flex flex-col items-center justify-center px-4 pt-20 pb-8">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          className="text-center max-w-2xl"
        >
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-secondary/50 border border-border/40 text-xs font-body text-muted-foreground mb-6">
            <Sparkles className="w-3 h-3 text-primary" />
            <span>Collective Consciousness Mapping</span>
          </div>

          <h1 className="font-heading text-5xl md:text-7xl font-light tracking-tight leading-tight mb-4">
            The Akashic
            <br />
            <span className="bg-gradient-to-r from-primary via-amber-400 to-purple-400 bg-clip-text text-transparent">
              Records
            </span>
          </h1>

          <p className="font-body text-base text-muted-foreground leading-relaxed max-w-lg mx-auto mb-8">
            A living field of collective resonance. Each thought inscribed here
            ripples through the fabric of shared awareness, weaving the tapestry
            of our interconnected consciousness.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
            <Link
              to="/inscribe"
              className="inline-flex items-center gap-2 px-6 py-3 rounded-full bg-primary text-primary-foreground font-body text-sm hover:opacity-90 transition-opacity"
            >
              Inscribe a Record
              <ArrowRight className="w-4 h-4" />
            </Link>
            <Link
              to="/collective"
              className="inline-flex items-center gap-2 px-6 py-3 rounded-full border border-border/60 text-foreground font-body text-sm hover:bg-secondary/40 transition-colors"
            >
              <Globe className="w-4 h-4" />
              Explore the Collective
            </Link>
          </div>
        </motion.div>

        {/* Stats */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5, duration: 0.8 }}
          className="flex items-center gap-8 mt-12 text-center"
        >
          <div>
            <div className="font-heading text-2xl text-foreground">{records.length}</div>
            <div className="text-xs font-body text-muted-foreground">Records</div>
          </div>
          <div className="w-px h-8 bg-border/40" />
          <div>
            <div className="font-heading text-2xl text-foreground">{totalEchoes}</div>
            <div className="text-xs font-body text-muted-foreground">Echoes</div>
          </div>
          <div className="w-px h-8 bg-border/40" />
          <div>
            <div className="font-heading text-2xl text-foreground">
              {new Set(records.map((r) => r.frequency)).size}
            </div>
            <div className="text-xs font-body text-muted-foreground">Frequencies</div>
          </div>
        </motion.div>
      </section>

      {/* Resonance Field */}
      <section className="flex-1 px-4 pb-20">
        <div className="max-w-5xl mx-auto">
          <div className="flex items-center gap-2 mb-6">
            <Waves className="w-4 h-4 text-primary" />
            <h2 className="font-heading text-lg text-foreground/80">Resonance Field</h2>
          </div>

          {loading ? (
            <div className="flex items-center justify-center h-64">
              <div className="w-8 h-8 border-2 border-primary/30 border-t-primary rounded-full animate-spin" />
            </div>
          ) : records.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-64 text-center">
              <Sparkles className="w-8 h-8 text-muted-foreground/40 mb-3" />
              <p className="font-heading text-lg text-muted-foreground">
                The field awaits its first inscription
              </p>
              <Link
                to="/inscribe"
                className="mt-4 text-sm text-primary hover:underline font-body"
              >
                Be the first to contribute →
              </Link>
            </div>
          ) : (
            <div className="flex flex-wrap items-center justify-center gap-4 md:gap-6">
              {records.map((record, i) => (
                <ResonanceOrb
                  key={record.id}
                  record={record}
                  index={i}
                  onClick={setSelectedRecord}
                />
              ))}
            </div>
          )}

          {/* Selected record detail */}
          {selectedRecord && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="mt-8 max-w-lg mx-auto bg-card/50 backdrop-blur-md border border-border/40 rounded-2xl p-6 text-center"
            >
              <button
                onClick={() => setSelectedRecord(null)}
                className="absolute top-3 right-3 text-muted-foreground hover:text-foreground text-xs"
              >
                ✕
              </button>
              <p className="font-heading text-xl text-foreground/90 mb-2">
                "{selectedRecord.thought}"
              </p>
              <p className="text-xs font-body text-muted-foreground capitalize">
                {selectedRecord.emotion} · {selectedRecord.frequency}
              </p>
              {selectedRecord.intention && (
                <p className="mt-2 text-xs font-body text-muted-foreground/70 italic">
                  {selectedRecord.intention}
                </p>
              )}
            </motion.div>
          )}
        </div>
      </section>
    </div>
  );
}