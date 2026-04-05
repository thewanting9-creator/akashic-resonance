import { useEffect, useState, useCallback } from "react";
import { base44 } from "@/api/base44Client";
import { motion } from "framer-motion";
import { User, Sparkles } from "lucide-react";
import { Link } from "react-router-dom";
import RecordCard from "../components/RecordCard";
import PullToRefresh from "../components/PullToRefresh";

export default function MyRecords() {
  const [records, setRecords] = useState([]);
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState(null);

  const load = useCallback(async () => {
    setLoading(true);
    const me = await base44.auth.me();
    setUser(me);
    const data = await base44.entities.ResonanceRecord.filter(
      { created_by: me.email },
      "-created_date",
      50
    );
    setRecords(data);
    setLoading(false);
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const totalEchoes = records.reduce((sum, r) => sum + (r.echoes || 0), 0);

  return (
    <div className="min-h-screen px-4 pt-24 pb-20">
      <div className="max-w-3xl mx-auto">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-10"
        >
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-secondary/60 border border-border/40 mb-4">
            <User className="w-5 h-5 text-primary" />
          </div>
          <h1 className="font-heading text-3xl md:text-4xl font-light mb-2">
            Your Akashic Inscriptions
          </h1>
          {user && (
            <p className="font-body text-sm text-muted-foreground">
              {user.full_name || user.email}
            </p>
          )}
        </motion.div>

        {/* Stats */}
        {!loading && records.length > 0 && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.2 }}
            className="flex items-center justify-center gap-8 mb-10"
          >
            <div className="text-center">
              <div className="font-heading text-2xl text-foreground">{records.length}</div>
              <div className="text-xs font-body text-muted-foreground">Inscriptions</div>
            </div>
            <div className="w-px h-8 bg-border/40" />
            <div className="text-center">
              <div className="font-heading text-2xl text-foreground">{totalEchoes}</div>
              <div className="text-xs font-body text-muted-foreground">Total Echoes</div>
            </div>
            <div className="w-px h-8 bg-border/40" />
            <div className="text-center">
              <div className="font-heading text-2xl text-foreground">
                {new Set(records.map((r) => r.frequency)).size}
              </div>
              <div className="text-xs font-body text-muted-foreground">Frequencies</div>
            </div>
          </motion.div>
        )}

        {/* Records */}
        <PullToRefresh onRefresh={load}>
        {loading ? (
          <div className="flex items-center justify-center h-64">
            <div className="w-8 h-8 border-2 border-primary/30 border-t-primary rounded-full animate-spin" />
          </div>
        ) : records.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-64 text-center">
            <Sparkles className="w-8 h-8 text-muted-foreground/40 mb-3" />
            <p className="font-heading text-lg text-muted-foreground mb-1">
              You haven't inscribed any records yet
            </p>
            <p className="text-xs text-muted-foreground/60 font-body mb-4">
              Your consciousness awaits expression
            </p>
            <Link
              to="/inscribe"
              className="text-sm text-primary hover:underline font-body"
            >
              Inscribe your first record →
            </Link>
          </div>
        ) : (
          <div className="grid gap-4">
            {records.map((record, i) => (
              <RecordCard key={record.id} record={record} index={i} />
            ))}
          </div>
        )}
        </PullToRefresh>
      </div>
    </div>
  );
}