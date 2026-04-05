import { useRef, useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { RefreshCw } from "lucide-react";

export default function PullToRefresh({ onRefresh, children }) {
  const [pulling, setPulling]   = useState(false);
  const [progress, setProgress] = useState(0); // 0–1
  const [refreshing, setRefreshing] = useState(false);
  const startY = useRef(null);
  const threshold = 72;

  const onTouchStart = useCallback((e) => {
    if (window.scrollY === 0) startY.current = e.touches[0].clientY;
  }, []);

  const onTouchMove = useCallback((e) => {
    if (startY.current === null) return;
    const dy = e.touches[0].clientY - startY.current;
    if (dy > 0) {
      setPulling(true);
      setProgress(Math.min(dy / threshold, 1));
    }
  }, [threshold]);

  const onTouchEnd = useCallback(async () => {
    if (progress >= 1) {
      setRefreshing(true);
      setPulling(false);
      setProgress(0);
      await onRefresh();
      setRefreshing(false);
    } else {
      setPulling(false);
      setProgress(0);
    }
    startY.current = null;
  }, [progress, onRefresh]);

  return (
    <div onTouchStart={onTouchStart} onTouchMove={onTouchMove} onTouchEnd={onTouchEnd}>
      <AnimatePresence>
        {(pulling || refreshing) && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 48 }}
            exit={{ opacity: 0, height: 0 }}
            className="flex items-center justify-center"
          >
            <motion.div
              animate={refreshing ? { rotate: 360 } : { rotate: progress * 360 }}
              transition={refreshing ? { repeat: Infinity, duration: 0.7, ease: "linear" } : {}}
            >
              <RefreshCw className="w-5 h-5 text-primary" style={{ opacity: refreshing ? 1 : progress }} />
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
      {children}
    </div>
  );
}