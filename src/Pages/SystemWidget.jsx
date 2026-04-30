import { useEffect, useRef } from "react";
import { useApi } from "../Context/ApiContext";

function MiniBar({ value, color }) {
  return (
    <div className="w-20 h-1.5 bg-white/10 rounded-full overflow-hidden">
      <div
        className="h-full rounded-full"
        style={{
          width: `${value}%`,
          backgroundColor: color,
          transition: "width 0.4s ease",
        }}
      />
    </div>
  );
}

export default function SystemWidget() {
  const api = useApi();
  const intervalRef = useRef(null);

  if (!api) {
    return (
      <div className="fixed top-4 left-1/2 -translate-x-1/2 z-[99999] pointer-events-auto">
        <div className="px-4 py-2 rounded-xl bg-red-500/20 border border-red-400/30 text-white text-xs">
          SystemWidget: missing ApiProvider
        </div>
      </div>
    );
  }

  const { sysStats, fetchSysStats } = api;

  useEffect(() => {
    fetchSysStats();
    intervalRef.current = setInterval(fetchSysStats, 4000);
    return () => clearInterval(intervalRef.current);
  }, [fetchSysStats]);

  const { cpu = 0, mem = 0, disk = 0 } = sysStats;

  const stats = [
    { label: "CPU", value: cpu, color: "#38bdf8" },
    { label: "RAM", value: mem, color: "#a78bfa" },
    { label: "DISK", value: disk, color: "#34d399" },
  ];

  return (
    <div className="fixed top-4 left-1/2 -translate-x-1/2 z-50 pointer-events-auto w-[min(96vw,780px)]">
      <div className="relative overflow-hidden rounded-[28px] border border-white/10 bg-slate-950/90 px-5 py-5 shadow-[0_28px_80px_-45px_rgba(15,23,42,0.95)] backdrop-blur-xl">
        <div className="absolute inset-0 bg-gradient-to-r from-sky-500/10 via-transparent to-violet-500/10 pointer-events-none" />
        <div className="relative flex flex-col gap-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <p className="text-xs uppercase tracking-[0.24em] text-slate-400">System widget</p>
              <h2 className="mt-1 text-lg font-semibold text-white">Live system stats</h2>
            </div>
            <span className="rounded-full bg-emerald-500/15 px-3 py-1 text-[11px] font-medium uppercase tracking-[0.24em] text-emerald-200 ring-1 ring-emerald-500/20">
              active
            </span>
          </div>

          <div className="grid gap-4 sm:grid-cols-3">
            {stats.map(({ label, value, color }) => (
              <div key={label} className="rounded-3xl border border-white/10 bg-white/5 p-4 shadow-sm shadow-black/10">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <p className="text-sm font-medium text-slate-200">{label}</p>
                    <p className="mt-1 text-xs text-slate-400">{value}% used</p>
                  </div>
                  <div
                    className="relative flex h-16 w-16 items-center justify-center rounded-full"
                    style={{
                      background: `conic-gradient(${color} ${value * 3.6}deg, rgba(255,255,255,0.08) 0deg)`,
                    }}
                  >
                    <div className="flex h-11 w-11 items-center justify-center rounded-full bg-slate-950/90 ring-1 ring-white/10">
                      <span className="text-sm font-semibold text-white">{value}%</span>
                    </div>
                  </div>
                </div>
                <div className="mt-4 h-2 overflow-hidden rounded-full bg-white/5">
                  <div
                    className="h-full rounded-full"
                    style={{
                      width: `${value}%`,
                      backgroundImage: `linear-gradient(90deg, ${color}, rgba(255,255,255,0.85))`,
                    }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}