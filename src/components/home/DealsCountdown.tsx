"use client";
import { useState, useEffect } from "react";
import { Clock } from "lucide-react";

function getMidnightMs() {
  const now = new Date();
  const midnight = new Date(now);
  midnight.setHours(24, 0, 0, 0);
  return midnight.getTime() - now.getTime();
}

function pad(n: number) {
  return String(n).padStart(2, "0");
}

export default function DealsCountdown() {
  const [mounted, setMounted] = useState(false);
  const [ms, setMs] = useState(0);

  useEffect(() => {
    setMounted(true);
    setMs(getMidnightMs());

    const t = setInterval(() => {
      setMs((prev) => {
        if (prev <= 1000) return getMidnightMs();
        return prev - 1000;
      });
    }, 1000);
    return () => clearInterval(t);
  }, []);

  const h = mounted ? Math.floor(ms / 3600000) : 0;
  const m = mounted ? Math.floor((ms % 3600000) / 60000) : 0;
  const s = mounted ? Math.floor((ms % 60000) / 1000) : 0;

  const TimeBox = ({ value, label }: { value: string; label: string }) => (
    <div className="flex flex-col items-center">
      <div
        className="w-12 h-12 rounded-xl flex items-center justify-center text-white font-bold text-lg shadow-md"
        style={{ backgroundColor: "var(--color-primary)" }}
      >
        {value}
      </div>
      <span className="text-xs mt-1 font-medium" style={{ color: "var(--color-muted)" }}>
        {label}
      </span>
    </div>
  );

  return (
    <div className="flex items-center gap-3">
      <Clock size={16} style={{ color: "var(--color-primary)" }} />
      <span className="text-sm font-semibold" style={{ color: "var(--color-dark)" }}>
        Deals end in:
      </span>
      <div className="flex items-end gap-1.5">
        <TimeBox value={pad(h)} label="HRS" />
        <span className="text-xl font-bold mb-4" style={{ color: "var(--color-primary)" }}>:</span>
        <TimeBox value={pad(m)} label="MIN" />
        <span className="text-xl font-bold mb-4" style={{ color: "var(--color-primary)" }}>:</span>
        <TimeBox value={pad(s)} label="SEC" />
      </div>
    </div>
  );
}
