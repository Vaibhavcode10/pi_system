import { useEffect, useRef } from "react";
import { useApi } from "../Context/ApiContext";

const Icon = ({ d, size = 16, className = "" }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none"
    stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round"
    className={className}>
    <path d={d} />
  </svg>
);

// animated ring gauge
function Ring({ value = 0, color, size = 120, stroke = 8, label, sub }) {
  const r = (size - stroke) / 2;
  const circ = 2 * Math.PI * r;
  const dash = (value / 100) * circ;

  return (
    <div className="flex flex-col items-center gap-3">
      <div className="relative" style={{ width: size, height: size }}>
        <svg width={size} height={size} style={{ transform: "rotate(-90deg)" }}>
          <circle cx={size / 2} cy={size / 2} r={r}
            fill="none" stroke="#1e2a38" strokeWidth={stroke} />
          <circle cx={size / 2} cy={size / 2} r={r}
            fill="none" stroke={color} strokeWidth={stroke}
            strokeDasharray={`${dash} ${circ}`}
            strokeLinecap="round"
            style={{ transition: "stroke-dasharray 0.6s cubic-bezier(.4,0,.2,1)" }}
          />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className="text-xl font-bold tabular-nums" style={{ color }}>
            {value}%
          </span>
        </div>
      </div>
      <div className="text-center">
        <div className="text-sm font-semibold text-[#c9d1d9] uppercase tracking-widest">
          {label}
        </div>
        {sub && <div className="text-xs text-[#4a5568] mt-0.5">{sub}</div>}
      </div>
    </div>
  );
}

function StatBar({ label, value, color }) {
  return (
    <div className="flex items-center gap-4">
      <span className="text-sm text-[#4a5568] w-20 flex-shrink-0 font-mono">
        {label}
      </span>
      <div className="flex-1 h-2 bg-[#1e2a38] rounded-full overflow-hidden">
        <div
          className="h-full rounded-full"
          style={{
            width: `${value}%`,
            backgroundColor: color,
            transition: "width 0.6s cubic-bezier(.4,0,.2,1)",
          }}
        />
      </div>
      <span className="text-sm font-mono tabular-nums w-10 text-right" style={{ color }}>
        {value}%
      </span>
    </div>
  );
}

function InfoRow({ label, value }) {
  return (
    <div className="flex justify-between items-center py-3 border-b border-[#1e2a38] last:border-0">
      <span className="text-sm text-[#4a5568]">{label}</span>
      <span className="text-sm font-mono text-[#58a6ff]">{value}</span>
    </div>
  );
}

const MOCK_INFO = {
  hostname: "instance-20251119",
  os: "Ubuntu 22.04 LTS",
  arch: "x86_64",
  kernel: "5.15.0-1034-gcp",
  python: "3.11.6",
  shell: "/bin/bash",
  ip: "10.128.0.4",
};

export default function Dashboard() {
  const { sysStats, fetchSysStats } = useApi();
  const intervalRef = useRef(null);

  useEffect(() => {
    fetchSysStats();
    intervalRef.current = setInterval(fetchSysStats, 5000);
    return () => clearInterval(intervalRef.current);
  }, [fetchSysStats]);

  const { cpu, mem, disk, uptime } = sysStats;

  return (
    <div className="p-8 overflow-y-auto h-full w-full">
      <div className="w-full space-y-8">

        {/* header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-[#c9d1d9] tracking-tight">
              System Overview
            </h1>
            <p className="text-sm text-[#4a5568] mt-1 font-mono">
              {MOCK_INFO.hostname}
            </p>
          </div>

          <button
            onClick={fetchSysStats}
            className="px-4 py-2 text-sm font-mono rounded-lg border border-[#1e2a38]
                       bg-[#0a0f16] text-[#58a6ff] hover:bg-[#111827] transition"
          >
            Fetch
          </button>
        </div>

        {/* ring gauges */}
        <div className="bg-[#0a0f16] border border-[#1e2a38] rounded-xl p-8">
          <p className="text-sm uppercase tracking-widest text-[#4a5568] mb-8">
            Resources
          </p>
          <div className="flex justify-around flex-wrap gap-10">
            <Ring value={cpu} color="#38bdf8" label="CPU" sub="usage" />
            <Ring value={mem} color="#a78bfa" label="Memory" sub="used" />
            <Ring value={disk} color="#34d399" label="Disk" sub="/ partition" />
          </div>
        </div>

        {/* bar breakdown */}
        <div className="bg-[#0a0f16] border border-[#1e2a38] rounded-xl p-7 space-y-4">
          <p className="text-sm uppercase tracking-widest text-[#4a5568] mb-5">
            Load Breakdown
          </p>
          <StatBar label="User" value={Math.max(0, cpu - 8)} color="#38bdf8" />
          <StatBar label="System" value={8} color="#f472b6" />
          <StatBar label="I/O Wait" value={2} color="#fbbf24" />
          <StatBar label="Idle" value={Math.max(0, 100 - cpu)} color="#1e2a38" />
        </div>

        {/* info */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-[#0a0f16] border border-[#1e2a38] rounded-xl p-7">
            <p className="text-sm uppercase tracking-widest text-[#4a5568] mb-4">System</p>
            <InfoRow label="Hostname" value={MOCK_INFO.hostname} />
            <InfoRow label="OS" value={MOCK_INFO.os} />
            <InfoRow label="Kernel" value={MOCK_INFO.kernel} />
            <InfoRow label="Arch" value={MOCK_INFO.arch} />
            <InfoRow label="Uptime" value={uptime} />
          </div>

          <div className="bg-[#0a0f16] border border-[#1e2a38] rounded-xl p-7">
            <p className="text-sm uppercase tracking-widest text-[#4a5568] mb-4">Environment</p>
            <InfoRow label="Shell" value={MOCK_INFO.shell} />
            <InfoRow label="Python" value={MOCK_INFO.python} />
            <InfoRow label="Flask port" value="5005" />
            <InfoRow label="IP" value={MOCK_INFO.ip} />
            <InfoRow label="Status" value="● Online" />
          </div>
        </div>

        <p className="text-xs text-[#2d3748] text-center pb-2">
          Live stats from /sys endpoint · Refresh every 5s
        </p>
      </div>
    </div>
  );
}