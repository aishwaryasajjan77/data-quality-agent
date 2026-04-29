from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from sqlalchemy import func
from .. import models, schemas
from ..database import get_db

router = APIRouter(prefix="/api/dashboard", tags=["dashboard"])


@router.get("", response_model=schemas.DashboardStats)
def get_dashboard(db: Session = Depends(get_db)):
    total_sources = db.query(models.DataSource).count()
    total_anomalies = db.query(models.Anomaly).count()
    unresolved = db.query(models.Anomaly).filter_by(resolved=False).count()
    total_scripts = db.query(models.RemediationScript).count()
    total_runs = db.query(models.ScriptRun).count()
    success_runs = db.query(models.ScriptRun).filter_by(status="success").count()
    failed_runs = db.query(models.ScriptRun).filter_by(status="failed").count()

    avg_health = db.query(func.avg(models.DataSource.health_score)).scalar() or 100.0

    recent_anomalies = (
        db.query(models.Anomaly)
        .order_by(models.Anomaly.detected_at.desc())
        .limit(10)
        .all()
    )
    recent_runs = (
        db.query(models.ScriptRun)
        .order_by(models.ScriptRun.started_at.desc())
        .limit(10)
        .all()
    )

    return schemas.DashboardStats(
        total_sources=total_sources,
        total_anomalies=total_anomalies,
        unresolved_anomalies=unresolved,
        total_scripts=total_scripts,
        total_runs=total_runs,
        successful_runs=success_runs,
        failed_runs=failed_runs,
        avg_health_score=round(float(avg_health), 1),
        recent_anomalies=recent_anomalies,
        recent_runs=recent_runs,
    )