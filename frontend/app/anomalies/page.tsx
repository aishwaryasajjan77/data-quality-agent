"use client";

import { useEffect, useState, useCallback } from "react";
import { api, Anomaly, Script } from "@/lib/api";

function SeverityIcon({ severity }: { severity: string }) {
  if (severity === "critical")
    return (
      <span className="w-8 h-8 rounded-lg bg-danger/15 flex items-center justify-center">
        <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="#ef4444" strokeWidth="1.8" strokeLinecap="round">
          <circle cx="8" cy="8" r="6"/>
          <line x1="8" y1="5" x2="8" y2="8.5"/>
          <circle cx="8" cy="11" r="0.5" fill="#ef4444"/>
        </svg>
      </span>
    );
  if (severity === "high")
    return (
      <span className="w-8 h-8 rounded-lg bg-orange-500/15 flex items-center justify-center">
        <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="#f97316" strokeWidth="1.8" strokeLinecap="round">
          <path d="M7.13 2.36L1.36 12.27a1 1 0 00.87 1.5h11.54a1 1 0 00.87-1.5L8.87 2.36a1 1 0 00-1.74 0z"/>
          <line x1="8" y1="6" x2="8" y2="9"/>
          <circle cx="8" cy="11" r="0.5" fill="#f97316"/>
        </svg>
      </span>
    );
  return (
    <span className="w-8 h-8 rounded-lg bg-warn/15 flex items-center justify-center">
      <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="#f59e0b" strokeWidth="1.8" strokeLinecap="round">
        <circle cx="8" cy="8" r="6"/>
        <line x1="8" y1="5" x2="8" y2="9"/>
        <circle cx="8" cy="11.5" r="0.5" fill="#f59e0b"/>
      </svg>
    </span>
  );
}

export default function AnomaliesPage() {
  const [anomalies, setAnomalies] = useState<Anomaly[]>([]);
  const [scripts, setScripts] = useState<Script[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedId, setExpandedId] = useState<number | null>(null);
  const [filter, setFilter] = useState<"all" | "unresolved" | "resolved">("all");
  const [runningId, setRunningId] = useState<number | null>(null);
  const [runResult, setRunResult] = useState<{ id: number; msg: string; ok: boolean } | null>(null);

  const load = useCallback(async () => {
    try {
      const [a, s] = await Promise.all([api.listAnomalies(), api.listScripts()]);
      setAnomalies(a);
      setScripts(s);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const filtered = anomalies.filter((a) => {
    if (filter === "unresolved") return !a.resolved;
    if (filter === "resolved") return a.resolved;
    return true;
  });

  async function handleRun(scriptId: number, anomalyId: number) {
    setRunningId(scriptId);
    setRunResult(null);
    try {
      const r = await api.runScript(scriptId);
      setRunResult({
        id: anomalyId,
        msg: r.status === "success" ? `Success — ${r.output || "completed"}` : `Failed — ${r.error || "unknown error"}`,
        ok: r.status === "success",
      });
      load();
    } catch (e: any) {
      setRunResult({ id: anomalyId, msg: e.message, ok: false });
    } finally {
      setRunningId(null);
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-6 h-6 border-2 border-accent border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="animate-fade-in">
        <h1 className="text-3xl font-display font-bold tracking-tight text-zinc-50">
          Anomalies
        </h1>
        <p className="text-muted text-sm mt-1">
          AI-detected data quality issues with auto-generated remediation scripts
        </p>
      </div>

      {/* Filter tabs */}
      <div className="flex items-center gap-1 bg-surface-2 rounded-xl p-1 w-fit animate-fade-in">
        {(["all", "unresolved", "resolved"] as const).map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`px-4 py-1.5 rounded-lg text-xs font-medium transition-all capitalize ${
              filter === f
                ? "bg-surface-4 text-zinc-100 shadow-sm"
                : "text-muted hover:text-zinc-300"
            }`}
          >
            {f}
            {f === "unresolved" && (
              <span className="ml-1.5 bg-warn/20 text-warn px-1.5 py-0.5 rounded-full text-[10px]">
                {anomalies.filter((a) => !a.resolved).length}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* Anomaly list */}
      {filtered.length === 0 ? (
        <div className="glass-card p-12 text-center animate-fade-in">
          <p className="text-muted text-sm">
            {filter === "all" ? "No anomalies detected yet. Register sources and run scans." : `No ${filter} anomalies.`}
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map((a, i) => {
            const script = scripts.find((s) => s.anomaly_id === a.id);
            const expanded = expandedId === a.id;

            return (
              <div
                key={a.id}
                className="glass-card animate-slide-up overflow-hidden"
                style={{ animationDelay: `${i * 60}ms` }}
              >
                {/* Row */}
                <button
                  onClick={() => setExpandedId(expanded ? null : a.id)}
                  className="w-full px-5 py-4 flex items-center gap-4 text-left hover:bg-white/[0.01] transition-colors"
                >
                  <SeverityIcon severity={a.severity} />

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-semibold text-zinc-100">
                        {a.anomaly_type.replace(/_/g, " ")}
                      </span>
                      <span className={`badge badge-${a.severity}`}>{a.severity}</span>
                      {a.resolved && <span className="badge badge-success">resolved</span>}
                    </div>
                    <p className="text-xs text-muted mt-0.5 truncate">
                      Source #{a.source_id} · {new Date(a.detected_at).toLocaleString()}
                    </p>
                  </div>

                  <svg
                    width="16"
                    height="16"
                    viewBox="0 0 16 16"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="1.5"
                    className={`text-muted transition-transform duration-200 ${expanded ? "rotate-180" : ""}`}
                  >
                    <path d="M4 6l4 4 4-4" />
                  </svg>
                </button>

                {/* Expanded details */}
                {expanded && (
                  <div className="px-5 pb-5 border-t border-white/[0.04] pt-4 space-y-4 animate-fade-in">
                    {/* Anomaly details */}
                    <div>
                      <p className="text-[11px] text-muted uppercase tracking-wider mb-2 font-medium">
                        Details
                      </p>
                      <pre className="code-block text-xs whitespace-pre-wrap">
                        {JSON.stringify(a.details, null, 2)}
                      </pre>
                    </div>

                    {/* Script */}
                    {script && (
                      <div>
                        <div className="flex items-center justify-between mb-2">
                          <p className="text-[11px] text-muted uppercase tracking-wider font-medium">
                            AI-Generated Remediation Script
                          </p>
                          <span className="text-[10px] text-accent/60 font-mono">
                            Script #{script.id}
                          </span>
                        </div>

                        {script.explanation && (
                          <p className="text-sm text-zinc-400 mb-3 leading-relaxed">
                            {script.explanation}
                          </p>
                        )}

                        <pre className="code-block text-xs whitespace-pre-wrap mb-3">
                          {script.code}
                        </pre>

                        {/* Run result */}
                        {runResult && runResult.id === a.id && (
                          <div
                            className={`p-3 rounded-lg text-sm mb-3 ${
                              runResult.ok
                                ? "bg-success/10 text-success border border-success/20"
                                : "bg-danger/10 text-danger border border-danger/20"
                            }`}
                          >
                            {runResult.msg}
                          </div>
                        )}

                        {!a.resolved && (
                          <button
                            onClick={() => handleRun(script.id, a.id)}
                            disabled={runningId === script.id}
                            className="flex items-center gap-2 bg-success/15 hover:bg-success/25 text-success text-sm font-medium px-4 py-2 rounded-lg transition-all border border-success/20 disabled:opacity-50"
                          >
                            {runningId === script.id ? (
                              <>
                                <div className="w-3.5 h-3.5 border-2 border-success border-t-transparent rounded-full animate-spin" />
                                Executing...
                              </>
                            ) : (
                              <>
                                <svg width="14" height="14" viewBox="0 0 14 14" fill="currentColor">
                                  <polygon points="3,1 13,7 3,13" />
                                </svg>
                                Run Remediation
                              </>
                            )}
                          </button>
                        )}
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}