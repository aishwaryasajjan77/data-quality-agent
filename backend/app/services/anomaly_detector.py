"""
Compares baseline vs current schema profiles to detect data anomalies.
"""


def _severity_for(anomaly_type: str, details: dict) -> str:
    """Assign severity based on anomaly type and context."""
    if anomaly_type == "missing_column":
        return "critical"
    if anomaly_type == "dtype_change":
        return "high"
    if anomaly_type == "null_spike":
        pct = details.get("current_null_pct", 0)
        if pct > 0.5:
            return "critical"
        if pct > 0.3:
            return "high"
        return "medium"
    if anomaly_type == "row_count_drop":
        drop_pct = details.get("drop_pct", 0)
        return "critical" if drop_pct > 0.5 else "high"
    return "low"


def detect_anomalies(baseline: dict, current: dict) -> list[dict]:
    """
    Compare baseline profile against current profile.
    Returns a list of anomaly dicts with type, details, and severity.
    """
    anomalies = []
    base_cols = set(baseline.get("columns", {}).keys())
    curr_cols = set(current.get("columns", {}).keys())

    # ── Missing columns ─────────────────────────────────────
    for col in base_cols - curr_cols:
        details = {"column": col}
        anomalies.append({
            "type": "missing_column",
            "details": details,
            "severity": _severity_for("missing_column", details),
        })

    # ── New unexpected columns ───────────────────────────────
    for col in curr_cols - base_cols:
        details = {"column": col}
        anomalies.append({
            "type": "new_column",
            "details": details,
            "severity": "low",
        })

    # ── Per-column checks ────────────────────────────────────
    for col in base_cols & curr_cols:
        b = baseline["columns"][col]
        c = current["columns"][col]

        # Dtype drift
        if b["dtype"] != c["dtype"]:
            details = {"column": col, "from": b["dtype"], "to": c["dtype"]}
            anomalies.append({
                "type": "dtype_change",
                "details": details,
                "severity": _severity_for("dtype_change", details),
            })

        # Null spike (>10 percentage points above baseline)
        if c["null_pct"] > b["null_pct"] + 0.10:
            details = {
                "column": col,
                "baseline_null_pct": b["null_pct"],
                "current_null_pct": c["null_pct"],
            }
            anomalies.append({
                "type": "null_spike",
                "details": details,
                "severity": _severity_for("null_spike", details),
            })

        # Cardinality collapse (unique values drop > 50%)
        if b["unique_count"] > 10 and c["unique_count"] < b["unique_count"] * 0.5:
            details = {
                "column": col,
                "baseline_unique": b["unique_count"],
                "current_unique": c["unique_count"],
            }
            anomalies.append({
                "type": "cardinality_collapse",
                "details": details,
                "severity": "high",
            })

    # ── Row count drop ───────────────────────────────────────
    base_rows = baseline.get("row_count", 0)
    curr_rows = current.get("row_count", 0)
    if base_rows > 0 and curr_rows < base_rows * 0.7:
        drop_pct = round(1 - curr_rows / base_rows, 4)
        details = {
            "baseline_rows": base_rows,
            "current_rows": curr_rows,
            "drop_pct": drop_pct,
        }
        anomalies.append({
            "type": "row_count_drop",
            "details": details,
            "severity": _severity_for("row_count_drop", details),
        })

    return anomalies