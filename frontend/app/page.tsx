"use client";

import { useEffect, useState } from "react";
import { api, DashboardStats } from "@/lib/api";

function HealthRing({ score }: { score: number }) {
  const r = 54;
  const circ = 2 * Math.PI * r;
  const fill = (score / 100) * circ;
  const color =
    score >= 80 ? "#22c55e" : score >= 50 ? "#f59e0b" : "#ef4444";

  return (
    <div className="relative w-36 h-36">
      <svg viewBox="0 0 120 120" className="w-full h-full -rotate-90">
        <circle cx="60" cy="60" r={r} fill="none" stroke="#1f1f24" strokeWidth="7" />
        <circle
          cx="60"
          cy="60"
          r={r}
          fill="none"
          stroke={color}
          strokeWidth="7"
          strokeLinecap="round"
          strokeDasharray={circ}
          strokeDashoffset={circ - fill}
          style={{ transition: "stroke-dashoffset 1.2s ease" }}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="text-3xl font-display font-bold" style={{ color }}>
          {Math.round(score)}
        </span>
        <span className="text-[11px] text-muted uppercase tracking-widest mt-0.5">
          Health
        </span>
      </div>
    </div>
  );
}

function StatCard({
  label,
  value,
  sub,
  accent,
  delay,
}: {
  label: string;
  value: number | string;
  sub?: string;
  accent?: string;
  delay?: number;
}) {
  return (
    <div
      className="stat-card animate-slide-up"
      style={{ animationDelay: `${delay || 0}ms` }}
    >
      <p className="text-[11px] text-muted uppercase tracking-wider font-medium mb-2">
        {label}
      </p>
      <p
        className="text-2xl font-display font-bold tracking-tight"
        style={{ color: accent || "#e4e4e7" }}
      >
        {value}
      </p>
      {sub && <p className="text-xs text-muted mt-1">{sub}</p>}
    </div>
  );
}

const SEVERITY_ORDER: Record<string, number> = { critical: 0, high: 1, medium: 2, low: 3 };

export default function DashboardPage() {
  const [data, setData] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.dashboard().then(setData).catch(console.error).finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-6 h-6 border-2 border-accent border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!data) {
    return (
      <div className="glass-card p-8 text-center">
        <p className="text-muted">Unable to connect to the backend. Is it running?</p>
      </div>
    );
  }

  const runRate = data.total_runs > 0 ? Math.round((data.successful_runs / data.total_runs) * 100) : 100;

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="animate-fade-in">
        <h1 className="text-3xl font-display font-bold tracking-tight text-zinc-50">
          Command Center
        </h1>
        <p className="text-muted text-sm mt-1">
          Real-time overview of data quality across all registered sources
        </p>
      </div>

      {/* Top row: Health + Stats */}
      <div className="grid grid-cols-12 gap-5">
        {/* Health ring card */}
        <div className="col-span-3 glass-card p-6 flex flex-col items-center justify-center animate-slide-up">
          <HealthRing score={data.avg_health_score} />
          <p className="text-xs text-muted mt-3">Average across {data.total_sources} source(s)</p>
        </div>

        {/* Stat cards */}
        <div className="col-span-9 grid grid-cols-3 gap-4">
          <StatCard label="Data Sources" value={data.total_sources} sub="Registered" delay={100} />
          <StatCard
            label="Anomalies"
            value={data.unresolved_anomalies}
            sub={`of ${data.total_anomalies} total`}
            accent={data.unresolved_anomalies > 0 ? "#f59e0b" : "#22c55e"}
            delay={200}
          />
          <StatCard label="Scripts Generated" value={data.total_scripts} sub="By AI agent" delay={300} />
          <StatCard
            label="Successful Runs"
            value={data.successful_runs}
            sub={`${runRate}% success rate`}
            accent="#22c55e"
            delay={400}
          />
          <StatCard
            label="Failed Runs"
            value={data.failed_runs}
            accent={data.failed_runs > 0 ? "#ef4444" : "#71717a"}
            delay={500}
          />
          <StatCard label="Total Executions" value={data.total_runs} delay={600} />
        </div>
      </div>

      {/* Activity feeds */}
      <div className="grid grid-cols-2 gap-6">
        {/* Recent Anomalies */}
        <div className="glass-card animate-slide-up" style={{ animationDelay: "400ms" }}>
          <div className="px-5 py-4 border-b border-white/[0.04] flex items-center justify-between">
            <h2 className="text-sm font-semibold text-zinc-100">Recent Anomalies</h2>
            <span className="text-[11px] text-muted">Latest 10</span>
          </div>
          <div className="divide-y divide-white/[0.03]">
            {data.recent_anomalies.length === 0 && (
              <p className="text-muted text-sm p-5">No anomalies detected yet</p>
            )}
            {data.recent_anomalies
              .sort((a, b) => (SEVERITY_ORDER[a.severity] ?? 4) - (SEVERITY_ORDER[b.severity] ?? 4))
              .map((a) => (
                <div key={a.id} className="px-5 py-3 flex items-center gap-3">
                  <span className={`badge badge-${a.severity}`}>{a.severity}</span>
                  <span className="text-sm font-medium text-zinc-200 flex-1 truncate">
                    {a.anomaly_type.replace(/_/g, " ")}
                  </span>
                  <span className="text-xs text-muted whitespace-nowrap">
                    {new Date(a.detected_at).toLocaleDateString()}
                  </span>
                  {a.resolved && <span className="text-success text-xs font-medium">Fixed</span>}
                </div>
              ))}
          </div>
        </div>

        {/* Recent Runs */}
        <div className="glass-card animate-slide-up" style={{ animationDelay: "500ms" }}>
          <div className="px-5 py-4 border-b border-white/[0.04] flex items-center justify-between">
            <h2 className="text-sm font-semibold text-zinc-100">Recent Executions</h2>
            <span className="text-[11px] text-muted">Latest 10</span>
          </div>
          <div className="divide-y divide-white/[0.03]">
            {data.recent_runs.length === 0 && (
              <p className="text-muted text-sm p-5">No scripts have been executed yet</p>
            )}
            {data.recent_runs.map((r) => (
              <div key={r.id} className="px-5 py-3 flex items-center gap-3">
                <span className={`badge badge-${r.status}`}>{r.status}</span>
                <span className="text-sm text-zinc-300 flex-1 truncate">
                  Script #{r.script_id}
                </span>
                {r.execution_time_ms != null && (
                  <span className="text-xs text-muted font-mono">{r.execution_time_ms}ms</span>
                )}
                <span className="text-xs text-muted whitespace-nowrap">
                  {new Date(r.started_at).toLocaleTimeString()}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}