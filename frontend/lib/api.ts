const API = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`${API}${path}`, {
    ...init,
    headers: {
      "Content-Type": "application/json",
      ...init?.headers,
    },
    cache: "no-store",
  });
  if (!res.ok) {
    const msg = await res.text().catch(() => res.statusText);
    throw new Error(msg);
  }
  return res.json();
}

export const api = {
  // Dashboard
  dashboard: () => request<DashboardStats>("/api/dashboard"),

  // Sources
  listSources: () => request<DataSource[]>("/api/sources"),
  createSource: (data: CreateSource) =>
    request<DataSource>("/api/sources", { method: "POST", body: JSON.stringify(data) }),
  deleteSource: (id: number) =>
    request("/api/sources/" + id, { method: "DELETE" }),
  scanSource: (id: number) =>
    request<ScanResult>("/api/sources/" + id + "/scan", { method: "POST" }),

  // Anomalies
  listAnomalies: (params?: { source_id?: number; resolved?: boolean }) => {
    const qs = new URLSearchParams();
    if (params?.source_id != null) qs.set("source_id", String(params.source_id));
    if (params?.resolved != null) qs.set("resolved", String(params.resolved));
    const q = qs.toString();
    return request<Anomaly[]>("/api/anomalies" + (q ? "?" + q : ""));
  },

  // Scripts
  listScripts: (anomaly_id?: number) => {
    const q = anomaly_id != null ? `?anomaly_id=${anomaly_id}` : "";
    return request<Script[]>("/api/scripts" + q);
  },

  // Runs
  runScript: (scriptId: number) =>
    request<ScriptRun>("/api/scripts/" + scriptId + "/run", { method: "POST" }),
  listRuns: () => request<ScriptRun[]>("/api/runs"),
};

// ── Types ────────────────────────────────────────────────

export interface DashboardStats {
  total_sources: number;
  total_anomalies: number;
  unresolved_anomalies: number;
  total_scripts: number;
  total_runs: number;
  successful_runs: number;
  failed_runs: number;
  avg_health_score: number;
  recent_anomalies: Anomaly[];
  recent_runs: ScriptRun[];
}

export interface DataSource {
  id: number;
  name: string;
  source_type: string;
  connection_info: Record<string, unknown>;
  schema_snapshot: Record<string, unknown> | null;
  row_count: number;
  column_count: number;
  health_score: number;
  last_scanned: string | null;
  created_at: string;
}

export interface CreateSource {
  name: string;
  source_type: string;
  connection_info: Record<string, unknown>;
}

export interface Anomaly {
  id: number;
  source_id: number;
  anomaly_type: string;
  severity: string;
  details: Record<string, unknown>;
  detected_at: string;
  resolved: boolean;
  resolved_at: string | null;
}

export interface Script {
  id: number;
  anomaly_id: number;
  code: string;
  explanation: string | null;
  language: string;
  created_at: string;
}

export interface ScriptRun {
  id: number;
  script_id: number;
  status: string;
  output: string | null;
  error: string | null;
  execution_time_ms: number | null;
  started_at: string;
  finished_at: string | null;
}

export interface ScanResult {
  source_id: number;
  anomalies_found: number;
  scripts_generated: number;
  message: string;
}