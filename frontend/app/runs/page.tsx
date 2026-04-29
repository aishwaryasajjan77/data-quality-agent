"use client";

import { useEffect, useState } from "react";
import { api, ScriptRun } from "@/lib/api";

function StatusDot({ status }: { status: string }) {
  const colors: Record<string, string> = {
    success: "#22c55e",
    failed: "#ef4444",
    running: "#6d5ff5",
    pending: "#71717a",
  };
  const c = colors[status] || "#71717a";
  return (
    <span className="relative flex w-2.5 h-2.5">
      <span
        className="absolute inset-0 rounded-full"
        style={{ background: c }}
      />
      {status === "running" && (
        <span
          className="absolute inset-0 rounded-full animate-ping"
          style={{ background: c, opacity: 0.4 }}
        />
      )}
    </span>
  );
}

export default function RunsPage() {
  const [runs, setRuns] = useState<ScriptRun[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedId, setExpandedId] = useState<number | null>(null);

  useEffect(() => {
    api.listRuns().then(setRuns).catch(console.error).finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-6 h-6 border-2 border-accent border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  const successCount = runs.filter((r) => r.status === "success").length;
  const failedCount = runs.filter((r) => r.status === "failed").length;
  const avgTime =
    runs.length > 0
      ? Math.round(
          runs.filter((r) => r.execution_time_ms).reduce((s, r) => s + (r.execution_time_ms || 0), 0) /
            Math.max(runs.filter((r) => r.execution_time_ms).length, 1)
        )
      : 0;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="animate-fade-in">
        <h1 className="text-3xl font-display font-bold tracking-tight text-zinc-50">
          Script Runs
        </h1>
        <p className="text-muted text-sm mt-1">
          Execution history of AI-generated remediation scripts
        </p>
      </div>

      {/* Summary strip */}
      <div className="grid grid-cols-4 gap-4 animate-fade-in">
        <div className="stat-card">
          <p className="text-[11px] text-muted uppercase tracking-wider mb-1">Total Runs</p>
          <p className="text-xl font-display font-bold">{runs.length}</p>
        </div>
        <div className="stat-card">
          <p className="text-[11px] text-muted uppercase tracking-wider mb-1">Successful</p>
          <p className="text-xl font-display font-bold text-success">{successCount}</p>
        </div>
        <div className="stat-card">
          <p className="text-[11px] text-muted uppercase tracking-wider mb-1">Failed</p>
          <p className="text-xl font-display font-bold text-danger">{failedCount}</p>
        </div>
        <div className="stat-card">
          <p className="text-[11px] text-muted uppercase tracking-wider mb-1">Avg. Exec Time</p>
          <p className="text-xl font-display font-bold font-mono">{avgTime}ms</p>
        </div>
      </div>

      {/* Runs table */}
      {runs.length === 0 ? (
        <div className="glass-card p-12 text-center animate-fade-in">
          <p className="text-muted text-sm">No script runs yet. Execute a remediation script from the Anomalies page.</p>
        </div>
      ) : (
        <div className="glass-card overflow-hidden animate-slide-up">
          {/* Header row */}
          <div className="grid grid-cols-12 gap-4 px-5 py-3 border-b border-white/[0.04] text-[11px] text-muted uppercase tracking-wider font-medium">
            <div className="col-span-1">Status</div>
            <div className="col-span-2">Run ID</div>
            <div className="col-span-2">Script</div>
            <div className="col-span-2">Exec Time</div>
            <div className="col-span-3">Started</div>
            <div className="col-span-2">Finished</div>
          </div>

          {/* Data rows */}
          <div className="divide-y divide-white/[0.03]">
            {runs.map((run) => {
              const expanded = expandedId === run.id;
              return (
                <div key={run.id}>
                  <button
                    onClick={() => setExpandedId(expanded ? null : run.id)}
                    className="w-full grid grid-cols-12 gap-4 px-5 py-3.5 text-left hover:bg-white/[0.015] transition-colors items-center"
                  >
                    <div className="col-span-1 flex items-center gap-2">
                      <StatusDot status={run.status} />
                    </div>
                    <div className="col-span-2 text-sm text-zinc-300 font-mono">
                      #{run.id}
                    </div>
                    <div className="col-span-2">
                      <span className={`badge badge-${run.status}`}>{run.status}</span>
                    </div>
                    <div className="col-span-2 text-sm text-muted font-mono">
                      {run.execution_time_ms != null ? `${run.execution_time_ms}ms` : "—"}
                    </div>
                    <div className="col-span-3 text-sm text-muted">
                      {new Date(run.started_at).toLocaleString()}
                    </div>
                    <div className="col-span-2 text-sm text-muted">
                      {run.finished_at ? new Date(run.finished_at).toLocaleTimeString() : "—"}
                    </div>
                  </button>

                  {expanded && (
                    <div className="px-5 pb-4 space-y-3 animate-fade-in">
                      {run.output && (
                        <div>
                          <p className="text-[11px] text-muted uppercase tracking-wider mb-1 font-medium">Output</p>
                          <pre className="code-block text-xs whitespace-pre-wrap">{run.output}</pre>
                        </div>
                      )}
                      {run.error && (
                        <div>
                          <p className="text-[11px] text-danger uppercase tracking-wider mb-1 font-medium">Error</p>
                          <pre className="code-block text-xs whitespace-pre-wrap text-red-400/80 border-danger/20">
                            {run.error}
                          </pre>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}