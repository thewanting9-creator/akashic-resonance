import { Outlet, Link, useLocation } from "react-router-dom";
import { Sparkles, Plus, Globe, User, Menu, X } from "lucide-react";
import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import AnimatedBackground from "./AnimatedBackground";

const NAV_ITEMS = [
  { path: "/", label: "Field", icon: Sparkles },
  { path: "/collective", label: "Collective", icon: Globe },
  { path: "/inscribe", label: "Inscribe", icon: Plus },
  { path: "/my-records", label: "My Records", icon: User },
];

export default function Layout() {
  const location = useLocation();
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <div className="min-h-screen relative overflow-hidden">
      <AnimatedBackground />

      {/* Ambient glow orbs */}
      <div className="fixed top-[-20%] left-[-10%] w-[500px] h-[500px] rounded-full bg-purple-900/20 blur-[120px] pointer-events-none z-0" />
      <div className="fixed bottom-[-20%] right-[-10%] w-[400px] h-[400px] rounded-full bg-indigo-900/15 blur-[100px] pointer-events-none z-0" />
      <div className="fixed top-[40%] right-[20%] w-[300px] h-[300px] rounded-full bg-amber-900/10 blur-[80px] pointer-events-none z-0" />

      {/* Top nav */}
      <header className="fixed top-0 left-0 right-0 z-50 backdrop-blur-xl bg-background/40 border-b border-border/30">
        <div className="max-w-6xl mx-auto px-4 h-16 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-purple-500/40 to-amber-500/40 flex items-center justify-center backdrop-blur-sm border border-white/10">
              <Sparkles className="w-4 h-4 text-primary" />
            </div>
            <span className="font-heading text-xl tracking-wide text-foreground">
              Akashic
            </span>
          </Link>

          {/* Desktop nav */}
          <nav className="hidden md:flex items-center gap-1">
            {NAV_ITEMS.map((item) => {
              const active = location.pathname === item.path;
              return (
                <Link
                  key={item.path}
                  to={item.path}
                  className={`relative px-4 py-2 rounded-full text-sm font-body transition-all duration-300 flex items-center gap-2 ${
                    active
                      ? "text-primary"
                      : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  {active && (
                    <motion.div
                      layoutId="nav-pill"
                      className="absolute inset-0 bg-secondary/60 rounded-full border border-primary/10"
                      transition={{ type: "spring", stiffness: 400, damping: 30 }}
                    />
                  )}
                  <item.icon className="w-4 h-4 relative z-10" />
                  <span className="relative z-10">{item.label}</span>
                </Link>
              );
            })}
          </nav>

          {/* Mobile menu toggle */}
          <button
            className="md:hidden text-foreground p-2"
            onClick={() => setMobileOpen(!mobileOpen)}
          >
            {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>

        {/* Mobile nav */}
        <AnimatePresence>
          {mobileOpen && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="md:hidden overflow-hidden border-t border-border/30 bg-background/80 backdrop-blur-xl"
            >
              <nav className="flex flex-col p-4 gap-1">
                {NAV_ITEMS.map((item) => {
                  const active = location.pathname === item.path;
                  return (
                    <Link
                      key={item.path}
                      to={item.path}
                      onClick={() => setMobileOpen(false)}
                      className={`px-4 py-3 rounded-lg text-sm font-body flex items-center gap-3 transition-all ${
                        active
                          ? "text-primary bg-secondary/60"
                          : "text-muted-foreground hover:text-foreground hover:bg-secondary/30"
                      }`}
                    >
                      <item.icon className="w-4 h-4" />
                      {item.label}
                    </Link>
                  );
                })}
              </nav>
            </motion.div>
          )}
        </AnimatePresence>
      </header>

      {/* Main content */}
      <main className="relative z-10 pt-16 min-h-screen">
        <Outlet />
      </main>
    </div>
  );
}