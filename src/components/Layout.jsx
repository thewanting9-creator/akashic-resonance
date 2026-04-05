import { Outlet, Link, useLocation, useNavigate } from "react-router-dom";
import { Sparkles, Plus, Globe, User, Menu, X, Heart, Headphones, BarChart2, GitBranch, MoreHorizontal, Users, BookOpen, GitCompare, Network, FlaskConical, Activity, Waves, Clock, Wind, Award, Radio, Palette, MapPin, ChevronLeft, Trash2 } from "lucide-react";
import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import AnimatedBackground from "./AnimatedBackground";
import SRAlertBanner from "./SRAlertBanner";
import AliasGate from "./AliasGate";
import { base44 } from "@/api/base44Client";

// Primary nav — always visible
const PRIMARY_NAV = [
  { path: "/",                  label: "Control",   icon: Sparkles },
  { path: "/pulse",             label: "Pulse",     icon: Heart },
  { path: "/binaural-studio",   label: "Studio",    icon: Headphones },
  { path: "/resonance-globe",   label: "Globe",     icon: Globe },
  { path: "/frequency-monitor", label: "Monitor",   icon: Activity },
];

const SECONDARY_NAV = [
  { path: "/collective",          label: "Collective Feed",   icon: Waves },
  { path: "/inscribe",            label: "Inscribe",          icon: Plus },
  { path: "/intention-circles",   label: "Circles",           icon: Users },
  { path: "/first-pulse",         label: "First Pulse",       icon: Sparkles },
  { path: "/astro-lab",           label: "Astro Lab",         icon: FlaskConical },
  { path: "/my-resonance",        label: "My Resonance",      icon: User },
  { path: "/my-records",          label: "My Records",        icon: BookOpen },
  { path: "/resonance-dashboard", label: "Dashboard",         icon: BarChart2 },
  { path: "/resonance-network",   label: "Network",           icon: Network },
  { path: "/resonance-comparison",label: "Comparison",        icon: GitCompare },
  { path: "/hidden-architecture", label: "Architecture",      icon: GitBranch },
  { path: "/contribute",          label: "Contribute",        icon: Plus },
  { path: "/resonance-4d",        label: "4D Archive",        icon: Clock },
  { path: "/atmospheric-composer", label: "Composer",          icon: Wind },
  { path: "/resonance-mastery",    label: "Mastery",           icon: Award },
  { path: "/field-radio",          label: "Field Radio",       icon: Radio },
  { path: "/synesthesia",          label: "Synesthesia",       icon: Palette },
  { path: "/hotspot-map",          label: "Hotspot Map",       icon: MapPin },
  { path: "/harmony-network",      label: "Harmony Network",  icon: GitBranch },
];

export default function Layout() {
  const location   = useLocation();
  const navigate = useNavigate();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [moreOpen,   setMoreOpen]   = useState(false);
  const [needsAlias, setNeedsAlias] = useState(false);
  const [userEmail,  setUserEmail]  = useState("");
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const moreRef = useRef(null);

  const isChildRoute = location.pathname !== "/";

  const handleDeleteAccount = async () => {
    // Delete participant record before logging out
    const existing = await base44.entities.Participant.filter({ user_email: userEmail }, "-created_date", 1);
    if (existing.length > 0) {
      await base44.entities.Participant.delete(existing[0].id);
    }
    await base44.auth.logout();
  };

  useEffect(() => {
    const check = async () => {
      const me = await base44.auth.me();
      setUserEmail(me.email);
      const existing = await base44.entities.Participant.filter({ user_email: me.email }, "-created_date", 1);
      if (existing.length === 0) setNeedsAlias(true);
    };
    check();
  }, []);

  // Close "more" on outside click
  useEffect(() => {
    const handler = (e) => { if (moreRef.current && !moreRef.current.contains(e.target)) setMoreOpen(false); };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const isActive = (path) => path === "/" ? location.pathname === "/" : location.pathname.startsWith(path);
  const secondaryActive = SECONDARY_NAV.some(n => isActive(n.path));

  return (
    <div className="min-h-screen relative overflow-hidden">
      {needsAlias && <AliasGate userEmail={userEmail} onComplete={() => setNeedsAlias(false)} />}
      <SRAlertBanner />
      <AnimatedBackground />

      <div className="fixed top-[-20%] left-[-10%] w-[500px] h-[500px] rounded-full bg-purple-900/20 blur-[120px] pointer-events-none z-0" />
      <div className="fixed bottom-[-20%] right-[-10%] w-[400px] h-[400px] rounded-full bg-indigo-900/15 blur-[100px] pointer-events-none z-0" />
      <div className="fixed top-[40%] right-[20%] w-[300px] h-[300px] rounded-full bg-amber-900/10 blur-[80px] pointer-events-none z-0" />

      {/* Top nav */}
      <header className="fixed top-0 left-0 right-0 z-50 backdrop-blur-xl bg-background/40 border-b border-border/30" style={{ paddingTop: "env(safe-area-inset-top)" }}>
        <div className="max-w-6xl mx-auto px-4 h-14 flex items-center justify-between gap-2">

          {/* Back button — child routes only */}
          {isChildRoute && (
            <button
              onClick={() => navigate(-1)}
              aria-label="Go back"
              className="select-none flex-shrink-0 min-w-[44px] min-h-[44px] flex items-center justify-center rounded-full text-muted-foreground hover:text-foreground transition-colors"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>
          )}

          {/* Logo */}
          <Link to="/" className="flex items-center gap-2 flex-shrink-0">
            <div className="w-7 h-7 rounded-full bg-gradient-to-br from-purple-500/40 to-amber-500/40 flex items-center justify-center border border-white/10">
              <Sparkles className="w-3.5 h-3.5 text-primary" />
            </div>
            <span className="font-heading text-lg tracking-wide text-foreground hidden sm:block">Akashic</span>
          </Link>

          {/* Desktop primary nav */}
          <nav className="hidden md:flex items-center gap-0.5 flex-1 justify-center">
            {PRIMARY_NAV.map((item) => {
              const active = isActive(item.path);
              return (
                <Link key={item.path} to={item.path}
                  className={`select-none relative px-3 py-1.5 rounded-full text-sm font-body transition-all duration-300 flex items-center gap-1.5 ${
                    active ? "text-primary" : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  {active && (
                    <motion.div layoutId="nav-pill"
                      className="absolute inset-0 bg-secondary/60 rounded-full border border-primary/10"
                      transition={{ type: "spring", stiffness: 400, damping: 30 }}
                    />
                  )}
                  <item.icon className="w-3.5 h-3.5 relative z-10" />
                  <span className="relative z-10">{item.label}</span>
                </Link>
              );
            })}

            {/* More dropdown */}
            <div className="relative" ref={moreRef}>
              <button
                onClick={() => setMoreOpen(o => !o)}
                className={`relative px-3 py-1.5 rounded-full text-sm font-body transition-all duration-300 flex items-center gap-1.5 ${
                  secondaryActive ? "text-primary" : "text-muted-foreground hover:text-foreground"
                }`}
              >
                {secondaryActive && (
                  <motion.div layoutId="nav-pill"
                    className="absolute inset-0 bg-secondary/60 rounded-full border border-primary/10"
                    transition={{ type: "spring", stiffness: 400, damping: 30 }}
                  />
                )}
                <MoreHorizontal className="w-3.5 h-3.5 relative z-10" />
                <span className="relative z-10">More</span>
              </button>

              <AnimatePresence>
                {moreOpen && (
                  <motion.div
                    initial={{ opacity: 0, y: -8, scale: 0.95 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: -8, scale: 0.95 }}
                    transition={{ duration: 0.15 }}
                    className="absolute top-full right-0 mt-2 w-52 bg-card/95 backdrop-blur-xl border border-border/40 rounded-2xl shadow-2xl overflow-hidden z-50 py-1"
                  >
                    {SECONDARY_NAV.map(item => {
                      const active = isActive(item.path);
                      return (
                        <Link key={item.path} to={item.path} onClick={() => setMoreOpen(false)}
                          className={`flex items-center gap-2.5 px-4 py-2.5 text-sm font-body transition-colors hover:bg-secondary/40 ${
                            active ? "text-primary bg-secondary/30" : "text-muted-foreground"
                          }`}
                        >
                          <item.icon className="w-3.5 h-3.5" />
                          {item.label}
                        </Link>
                      );
                    })}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </nav>

          {/* Delete account button — desktop */}
          <button
            onClick={() => setShowDeleteConfirm(true)}
            className="select-none hidden md:flex items-center gap-1 text-muted-foreground/40 hover:text-destructive transition-colors text-xs font-body flex-shrink-0"
            title="Delete account"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>

          {/* Mobile menu toggle */}
          <button
            className="select-none md:hidden text-foreground p-2 ml-auto min-w-[44px] min-h-[44px] flex items-center justify-center"
            onClick={() => setMobileOpen(!mobileOpen)}
            aria-label={mobileOpen ? "Close menu" : "Open menu"}
            aria-expanded={mobileOpen}
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
              <nav className="flex flex-col p-3 gap-0.5 max-h-[80vh] overflow-y-auto">
                <div className="text-[9px] font-body text-muted-foreground/50 uppercase tracking-widest px-3 pt-1 pb-0.5">Main</div>
                {PRIMARY_NAV.map(item => {
                  const active = isActive(item.path);
                  return (
                    <Link key={item.path} to={item.path} onClick={() => setMobileOpen(false)}
                      className={`px-3 py-2.5 rounded-xl text-sm font-body flex items-center gap-3 transition-all ${
                        active ? "text-primary bg-secondary/60" : "text-muted-foreground hover:text-foreground hover:bg-secondary/30"
                      }`}
                    >
                      <item.icon className="w-4 h-4" />
                      {item.label}
                    </Link>
                  );
                })}
                <div className="text-[9px] font-body text-muted-foreground/50 uppercase tracking-widest px-3 pt-3 pb-0.5">Explore</div>
                {SECONDARY_NAV.map(item => {
                  const active = isActive(item.path);
                  return (
                    <Link key={item.path} to={item.path} onClick={() => setMobileOpen(false)}
                      className={`px-3 py-2.5 rounded-xl text-sm font-body flex items-center gap-3 transition-all ${
                        active ? "text-primary bg-secondary/60" : "text-muted-foreground hover:text-foreground hover:bg-secondary/30"
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

      {/* Mobile bottom nav */}
      <nav
        className="md:hidden fixed bottom-0 left-0 right-0 z-50 bg-background/80 backdrop-blur-xl border-t border-border/30 flex items-center justify-around"
        style={{ paddingBottom: "env(safe-area-inset-bottom)" }}
        aria-label="Main navigation"
      >
        {PRIMARY_NAV.map(item => {
          const active = isActive(item.path);
          return (
            <Link
              key={item.path}
              to={item.path}
              aria-label={item.label}
              aria-current={active ? "page" : undefined}
              onClick={() => { if (active) navigate(item.path, { replace: true }); }}
              className={`select-none flex flex-col items-center gap-0.5 min-w-[44px] min-h-[44px] px-3 py-2 justify-center transition-all ${
                active ? "text-primary" : "text-muted-foreground"
              }`}
            >
              <item.icon className="w-5 h-5" />
              <span className="text-[9px] font-body">{item.label}</span>
            </Link>
          );
        })}
        <button
          onClick={() => setShowDeleteConfirm(true)}
          aria-label="Account settings"
          className="select-none flex flex-col items-center gap-0.5 min-w-[44px] min-h-[44px] px-3 py-2 justify-center text-muted-foreground/40 hover:text-destructive transition-colors">
          <User className="w-5 h-5" />
          <span className="text-[9px] font-body">Account</span>
        </button>
      </nav>

      {/* Delete account confirmation */}
      <AnimatePresence>
        {showDeleteConfirm && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-[200] flex items-center justify-center bg-black/60 backdrop-blur-sm px-6">
            <motion.div initial={{ scale: 0.92, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.92, opacity: 0 }}
              className="bg-card border border-border/40 rounded-2xl p-6 max-w-sm w-full shadow-2xl">
              <div className="flex items-center gap-2 mb-2">
                <Trash2 className="w-4 h-4 text-destructive" />
                <h3 className="font-heading text-lg">Delete Account</h3>
              </div>
              <p className="text-xs font-body text-muted-foreground mb-5 leading-relaxed">
                This will permanently remove your participant profile and all associated data from the collective field. This cannot be undone.
              </p>
              <div className="flex gap-2">
                <button onClick={() => setShowDeleteConfirm(false)}
                  className="select-none flex-1 py-2 rounded-full border border-border/40 text-xs font-body text-muted-foreground hover:text-foreground transition-all">
                  Cancel
                </button>
                <button onClick={handleDeleteAccount}
                  className="select-none flex-1 py-2 rounded-full bg-destructive/20 border border-destructive/40 text-destructive text-xs font-body hover:bg-destructive/30 transition-all">
                  Delete & Sign Out
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <main className="relative z-10 pt-14 pb-16 md:pb-0 min-h-screen">
        <AnimatePresence mode="wait">
          <motion.div
            key={location.pathname}
            initial={{ opacity: 0, x: 12 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -12 }}
            transition={{ duration: 0.18 }}
            className="min-h-screen"
          >
            <Outlet />
          </motion.div>
        </AnimatePresence>
      </main>
    </div>
  );
}