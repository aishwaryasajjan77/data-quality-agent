"""
Background scheduler that periodically scans all registered data sources
for anomalies and auto-generates remediation scripts.
"""
import asyncio
import logging
from datetime import datetime, timezone
from apscheduler.schedulers.background import BackgroundScheduler
from ..database import SessionLocal
from .. import models
from .profiler import fetch_dataframe, profile_dataframe
from .anomaly_detector import detect_anomalies
from .llm_agent import generate_remediation
from ..config import settings

logger = logging.getLogger(__name__)
scheduler = BackgroundScheduler()


def _compute_health(source_id: int, db) -> float:
    """Compute health score for a source based on unresolved anomalies."""
    unresolved = db.query(models.Anomaly).filter_by(
        source_id=source_id, resolved=False
    ).all()

    if not unresolved:
        return 100.0

    penalty = 0
    for a in unresolved:
        if a.severity == "critical":
            penalty += 25
        elif a.severity == "high":
            penalty += 15
        elif a.severity == "medium":
            penalty += 8
        else:
            penalty += 3

    return max(0.0, 100.0 - penalty)


def monitor_sources():
    """Scan all sources, detect anomalies, generate remediation scripts."""
    db = SessionLocal()
    try:
        sources = db.query(models.DataSource).all()
        logger.info(f"Scanning {len(sources)} source(s)...")

        for src in sources:
            try:
                df = asyncio.run(fetch_dataframe(src.source_type, src.connection_info))
                current = profile_dataframe(df)

                # First scan — store baseline
                if not src.schema_snapshot:
                    src.schema_snapshot = current
                    src.row_count = current["row_count"]
                    src.column_count = current["column_count"]
                    src.last_scanned = datetime.now(timezone.utc)
                    db.commit()
                    logger.info(f"Baseline stored for '{src.name}'")
                    continue

                # Detect anomalies
                new_anomalies = detect_anomalies(src.schema_snapshot, current)
                created = 0

                for a in new_anomalies:
                    # Skip if identical unresolved anomaly already exists
                    existing = db.query(models.Anomaly).filter_by(
                        source_id=src.id,
                        anomaly_type=a["type"],
                        resolved=False,
                    ).first()
                    if existing:
                        continue

                    anomaly_row = models.Anomaly(
                        source_id=src.id,
                        anomaly_type=a["type"],
                        severity=a.get("severity", "medium"),
                        details=a["details"],
                    )
                    db.add(anomaly_row)
                    db.flush()

                    # Generate remediation script via LLM
                    gen = generate_remediation(a, current)
                    script = models.RemediationScript(
                        anomaly_id=anomaly_row.id,
                        code=gen["code"],
                        explanation=gen.get("explanation", ""),
                    )
                    db.add(script)
                    created += 1

                # Update source metadata
                src.row_count = current["row_count"]
                src.column_count = current["column_count"]
                src.last_scanned = datetime.now(timezone.utc)
                src.health_score = _compute_health(src.id, db)
                db.commit()

                if created:
                    logger.info(f"'{src.name}': {created} new anomalie(s) detected with scripts.")
                else:
                    logger.info(f"'{src.name}': clean scan.")

            except Exception as e:
                logger.error(f"Error scanning '{src.name}': {e}")
                db.rollback()

    finally:
        db.close()


def start_scheduler():
    """Start the background monitoring scheduler."""
    scheduler.add_job(
        monitor_sources,
        "interval",
        minutes=settings.monitor_interval_minutes,
        id="monitor_sources",
        replace_existing=True,
    )
    scheduler.start()
    logger.info(f"Scheduler started (interval: {settings.monitor_interval_minutes}m)")