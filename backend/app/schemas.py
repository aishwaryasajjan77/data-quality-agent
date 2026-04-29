from pydantic import BaseModel, Field
from typing import Optional, Any
from datetime import datetime


# ── Data Sources ──────────────────────────────────────────────

class DataSourceCreate(BaseModel):
    name: str = Field(..., min_length=1, max_length=255)
    source_type: str = Field(..., pattern="^(csv_url|json_url)$")
    connection_info: dict


class DataSourceOut(BaseModel):
    id: int
    name: str
    source_type: str
    connection_info: dict
    schema_snapshot: Optional[dict] = None
    row_count: int = 0
    column_count: int = 0
    health_score: float = 100.0
    last_scanned: Optional[datetime] = None
    created_at: datetime

    class Config:
        from_attributes = True


# ── Anomalies ─────────────────────────────────────────────────

class AnomalyOut(BaseModel):
    id: int
    source_id: int
    anomaly_type: str
    severity: str
    details: dict
    detected_at: datetime
    resolved: bool
    resolved_at: Optional[datetime] = None

    class Config:
        from_attributes = True


# ── Scripts ───────────────────────────────────────────────────

class ScriptOut(BaseModel):
    id: int
    anomaly_id: int
    code: str
    explanation: Optional[str]
    language: str = "python"
    created_at: datetime

    class Config:
        from_attributes = True


# ── Runs ──────────────────────────────────────────────────────

class RunOut(BaseModel):
    id: int
    script_id: int
    status: str
    output: Optional[str] = None
    error: Optional[str] = None
    execution_time_ms: Optional[int] = None
    started_at: datetime
    finished_at: Optional[datetime] = None

    class Config:
        from_attributes = True


# ── Dashboard Stats ───────────────────────────────────────────

class DashboardStats(BaseModel):
    total_sources: int = 0
    total_anomalies: int = 0
    unresolved_anomalies: int = 0
    total_scripts: int = 0
    total_runs: int = 0
    successful_runs: int = 0
    failed_runs: int = 0
    avg_health_score: float = 100.0
    recent_anomalies: list[AnomalyOut] = []
    recent_runs: list[RunOut] = []


class ScanResult(BaseModel):
    source_id: int
    anomalies_found: int
    scripts_generated: int
    message: str