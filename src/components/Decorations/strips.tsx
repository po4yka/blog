import { motion } from "motion/react";
import { useInView } from "@/components/useInView";
import { useState, useEffect } from "react";
import { MotionProvider } from "@/components/MotionProvider";
import { ease } from "@/lib/motion";
import { NetworkGraph, CpuGraph, ProcessTable } from "./graphs";

// ─── Uptime / Status Strip — live ticking ──────────────────────────

export function UptimeStrip({ delay = 0 }: { delay?: number }) {
  const { ref, inView } = useInView(0.1);
  const [uptime, setUptime] = useState({ d: 47, h: 6, m: 23 });

  useEffect(() => {
    const id = setInterval(() => {
      setUptime((prev) => {
        let m = prev.m + 1;
        let h = prev.h;
        let d = prev.d;
        if (m >= 60) { m = 0; h++; }
        if (h >= 24) { h = 0; d++; }
        return { d, h, m };
      });
    }, 60_000);
    return () => clearInterval(id);
  }, []);

  return (
    <MotionProvider>
    <motion.div
      ref={ref}
      className="flex flex-wrap items-center gap-x-7 gap-y-2 px-2 py-2 font-mono text-label"
      initial={{ opacity: 0 }}
      animate={inView ? { opacity: 1 } : {}}
      transition={{ duration: 0.5, delay, ease }}
    >
      <span className="flex items-center gap-2">
        <span
          className="w-[6px] h-[6px] rounded-full"
          style={{ backgroundColor: "var(--signal-green)", animation: "pulse-scale 3s ease-in-out infinite" }}
        />
        <span className="text-muted-foreground/40">up {uptime.d}d {uptime.h}h {uptime.m}m</span>
      </span>
      {[
        "load 1.47 1.22 0.98",
        "tasks 406",
        "thr 1,247",
        "mem 37%",
      ].map((item) => (
        <motion.span
          key={item}
          className="text-muted-foreground/25 cursor-default"
          whileHover={{ color: "var(--foreground)", opacity: 0.5 }}
          transition={{ duration: 0.2 }}
        >
          {item}
        </motion.span>
      ))}
    </motion.div>
    </MotionProvider>
  );
}

// ─── Composed layout ──────────────────────────────────────────────

export function SystemBottomBar({ delay = 0 }: { delay?: number }) {
  return (
    <MotionProvider>
    <div className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <NetworkGraph delay={delay} />
        <CpuGraph delay={delay + 0.05} />
      </div>
      <ProcessTable delay={delay + 0.1} />
    </div>
    </MotionProvider>
  );
}
