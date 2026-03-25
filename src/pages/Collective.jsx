import { useEffect, useState } from "react";
import { base44 } from "@/api/base44Client";
import { motion } from "framer-motion";
import { Globe, Filter } from "lucide-react";
import RecordCard from "../components/RecordCard";
import { Button } from "@/components/ui/button";

const FREQUENCIES = [
  "all", "unity", "creation", "transformation", "healing",
  "awakening", "remembrance", "vision", "connection"
];

export default function Collective() {
  const [records, setRecords] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeFrequency, setActiveFrequency] = useState("all");

  const loadRecords = async () => {
    setLoading(true);
    let data;
    if (activeFrequency === "all") {
      data = await base44.entities.ResonanceRecord.list("-created_date", 50);
    } else {
      data = await base44.entities.ResonanceRecord.filter(
        { frequency: activeFrequency },
        "-created_date",
        50
      );
    }
    setRecords(data);
    setLoading(false);
  };

  useEffect(() => {
    loadRecords();
  }, [activeFrequency]);

  const handleEcho = (id) => {
    setRecords((prev) =>
      prev.map((r) =>
        r.id === id ? { ...r, echoes: (r.echoes || 0) + 1 } : r
      )
    );
  };

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
            <Globe className="w-5 h-5 text-primary" />
          </div>
          <h1 className="font-heading text-3xl md:text-4xl font-light mb-2">
            Collective Consciousness
          </h1>
          <p className="font-body text-sm text-muted-foreground">
            Explore the resonances inscribed by all beings in the field
          </p>
        </motion.div>

        {/* Frequency Filter */}
        <div className="flex items-center gap-2 mb-8 overflow-x-auto pb-2 scrollbar-none">
          <Filter className="w-4 h-4 text-muted-foreground shrink-0" />
          {FREQUENCIES.map((f) => (
            <Button
              key={f}
              variant="ghost"
              size="sm"
              onClick={() => setActiveFrequency(f)}
              className={`rounded-full capitalize text-xs font-body whitespace-nowrap shrink-0 ${
                activeFrequency === f
                  ? "bg-secondary/80 text-primary border border-primary/20"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              {f}
            </Button>
          ))}
        </div>

        {/* Records */}
        {loading ? (
          <div className="flex items-center justify-center h-64">
            <div className="w-8 h-8 border-2 border-primary/30 border-t-primary rounded-full animate-spin" />
          </div>
        ) : records.length === 0 ? (
          <div className="text-center py-20">
            <p className="font-heading text-lg text-muted-foreground">
              No resonances found in this frequency
            </p>
          </div>
        ) : (
          <div className="grid gap-4">
            {records.map((record, i) => (
              <RecordCard
                key={record.id}
                record={record}
                index={i}
                onEcho={handleEcho}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}