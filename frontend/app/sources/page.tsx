"use client";

import { useEffect, useState, useCallback } from "react";
import { api, DataSource } from "@/lib/api";

function HealthBar({ score }: { score: number }) {
  const color =
    score >= 80 ? "#22c55e" : score >= 50 ? "#f59e0b" : "#ef4444";
  return (
    <div className="health-bar w-full">
      <div
        className="health-bar-fill"
        style={{ width: `${score}%`, background: color }}
      />
    </div>
  );
}

export default function SourcesPage() {
  const [sources, setSources] = useState<DataSource[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [name, setName] = useState("");
  const [url, setUrl] = useState("");
  const [creating, setCreating] = useState(false);
  const [scanningId, setScanningId] = useState<number | null>(null);
  const [scanMsg, setScanMsg] = useState("");

  const load = useCallback(() => {
    api.listSources().then(setSources).catch(console.error).finally(() => setLoading(false));
  }, []);

  useEffect(() => { load(); }, [load]);

  async function handleCreate() {
    if (!name.trim() || !url.trim()) return;
    setCreating(true);
    try {
      await api.createSource({ name, source_type: "csv_url", connection_info: { url } });
      setName(""); setUrl(""); setShowForm(false);
      load();
    } catch (e: any) {
      alert("Error: " + e.message);
    } finally {
      setCreating(false);
    }
  }

  async function handleScan(id: number) {
    setScanningId(id);
    setScanMsg("");
    try {
      const res = await api.scanSource(id);
      setScanMsg(res.message);
      load();
    } catch (e: any) {
      setScanMsg("Scan failed: " + e.message);
    } finally {
      setScanningId(null);
    }
  }

  async function handleDelete(id: number) {
    if (!confirm("Delete this source and all its anomalies?")) return;
    await api.deleteSource(id);
    load();
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
      <div className="flex items-center justify-between animate-fade-in">
        <div>
          <h1 className="text-3xl font-display font-bold tracking-tight text-zinc-50">
            Data Sources
          </h1>
          <p className="text-muted text-sm mt-1">
            Register data feeds for continuous quality monitoring
          </p>
        </div>
        <button
          onClick={() => setShowForm(!showForm)}
          className="flex items-center gap-2 bg-accent hover:bg-accent-dim text-white text-sm font-medium px-4 py-2.5 rounded-xl transition-all duration-150 shadow-glow hover:shadow-glow-lg"
        >
          <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
            <line x1="7" y1="1" x2="7" y2="13" />
            <line x1="1" y1="7" x2="13" y2="7" />
          </svg>
          Add Source
        </button>
      </div>

      {/* Create form */}
      {showForm && (
        <div className="glass-card p-5 space-y-4 animate-slide-up">
          <h3 className="text-sm font-semibold text-zinc-100">Register a new data source</h3>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-[11px] text-muted uppercase tracking-wider mb-1.5">
                Source Name
              </label>
              <input
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. Titanic Dataset"
                className="w-full bg-surface-0 border border-white/[0.06] rounded-lg px-3.5 py-2.5 text-sm text-zinc-200 placeholder:text-zinc-600 focus:outline-none focus:border-accent/40 focus:shadow-glow transition-all"
              />
            </div>
            <div>
              <label className="block text-[11px] text-muted uppercase tracking-wider mb-1.5">
                CSV URL
              </label>
              <input
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                placeholder="https://example.com/data.csv"
                className="w-full bg-surface-0 border border-white/[0.06] rounded-lg px-3.5 py-2.5 text-sm text-zinc-200 placeholder:text-zinc-600 focus:outline-none focus:border-accent/40 focus:shadow-glow transition-all font-mono text-xs"
              />
            </div>
          </div>
          <div className="flex gap-3 pt-1">
            <button
              onClick={handleCreate}
              disabled={creating}
              className="bg-accent hover:bg-accent-dim disabled:opacity-50 text-white text-sm font-medium px-5 py-2 rounded-lg transition-all"
            >
              {creating ? "Registering..." : "Register Source"}
            </button>
            <button
              onClick={() => setShowForm(false)}
              className="text-muted hover:text-zinc-300 text-sm px-3 py-2 transition-colors"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* Scan message */}
      {scanMsg && (
        <div className="glass-card p-4 border-l-2 border-accent animate-fade-in">
          <p className="text-sm text-zinc-300">{scanMsg}</p>
          <button onClick={() => setScanMsg("")} className="text-xs text-muted mt-1 hover:text-zinc-300">
            Dismiss
          </button>
        </div>
      )}

      {/* Sources grid */}
      {sources.length === 0 ? (
        <div className="glass-card p-12 text-center animate-fade-in">
          <div className="w-12 h-12 mx-auto mb-4 rounded-full bg-surface-3 flex items-center justify-center">
            <svg width="20" height="20" viewBox="0 0 18 18" fill="none" stroke="#71717a" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
              <ellipse cx="9" cy="4" rx="7" ry="2.5"/>
              <path d="M2 4v5c0 1.38 3.13 2.5 7 2.5s7-1.12 7-2.5V4"/>
              <path d="M2 9v5c0 1.38 3.13 2.5 7 2.5s7-1.12 7-2.5V9"/>
            </svg>
          </div>
          <p className="text-muted text-sm">No data sources registered yet</p>
          <p className="text-muted/60 text-xs mt-1">Click "Add Source" to get started</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {sources.map((src, i) => (
            <div
              key={src.id}
              className="glass-card glass-card-hover p-5 animate-slide-up"
              style={{ animationDelay: `${i * 80}ms` }}
            >
              <div className="flex items-start justify-between mb-3">
                <div className="flex-1 min-w-0">
                  <h3 className="font-semibold text-zinc-100 truncate">{src.name}</h3>
                  <p className="text-xs text-muted mt-0.5 font-mono truncate">
                    {(src.connection_info as any)?.url || src.source_type}
                  </p>
                </div>
                <div className="flex items-center gap-1.5 ml-3">
                  <button
                    onClick={() => handleScan(src.id)}
                    disabled={scanningId === src.id}
                    className="text-xs text-accent hover:text-accent-light disabled:opacity-50 font-medium px-2.5 py-1.5 rounded-lg hover:bg-accent/10 transition-all"
                  >
                    {scanningId === src.id ? "Scanning..." : "Scan Now"}
                  </button>
                  <button
                    onClick={() => handleDelete(src.id)}
                    className="text-xs text-zinc-500 hover:text-danger px-1.5 py-1.5 rounded-lg hover:bg-danger/10 transition-all"
                  >
                    <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
                      <path d="M2 3.5h10M5 3.5V2.5a1 1 0 011-1h2a1 1 0 011 1v1M11 3.5l-.5 8a1.5 1.5 0 01-1.5 1.5H5a1.5 1.5 0 01-1.5-1.5l-.5-8"/>
                    </svg>
                  </button>
                </div>
              </div>

              {/* Stats row */}
              <div className="flex items-center gap-5 mb-3 text-xs text-muted">
                <span>{src.row_count.toLocaleString()} rows</span>
                <span>{src.column_count} columns</span>
                {src.last_scanned && (
                  <span>Scanned {new Date(src.last_scanned).toLocaleDateString()}</span>
                )}
              </div>

              {/* Health bar */}
              <div className="flex items-center gap-3">
                <div className="flex-1">
                  <HealthBar score={src.health_score} />
                </div>
                <span
                  className="text-xs font-semibold font-mono"
                  style={{
                    color:
                      src.health_score >= 80 ? "#22c55e" : src.health_score >= 50 ? "#f59e0b" : "#ef4444",
                  }}
                >
                  {Math.round(src.health_score)}%
                </span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}