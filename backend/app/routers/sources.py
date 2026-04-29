from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from .. import models, schemas
from ..database import get_db
from ..services.profiler import fetch_dataframe, profile_dataframe
from ..services.anomaly_detector import detect_anomalies
from ..services.llm_agent import generate_remediation
from datetime import datetime, timezone

router = APIRouter(prefix="/api/sources", tags=["sources"])


@router.get("", response_model=list[schemas.DataSourceOut])
def list_sources(db: Session = Depends(get_db)):
    return db.query(models.DataSource).order_by(models.DataSource.created_at.desc()).all()


@router.post("", response_model=schemas.DataSourceOut, status_code=201)
async def create_source(payload: schemas.DataSourceCreate, db: Session = Depends(get_db)):
    src = models.DataSource(**payload.model_dump())
    try:
        df = await fetch_dataframe(src.source_type, src.connection_info)
        profile = profile_dataframe(df)
        src.schema_snapshot = profile
        src.row_count = profile["row_count"]
        src.column_count = profile["column_count"]
        src.last_scanned = datetime.now(timezone.utc)
    except Exception as e:
        src.schema_snapshot = {"error": str(e)}

    db.add(src)
    db.commit()
    db.refresh(src)
    return src


@router.get("/{source_id}", response_model=schemas.DataSourceOut)
def get_source(source_id: int, db: Session = Depends(get_db)):
    src = db.query(models.DataSource).get(source_id)
    if not src:
        raise HTTPException(404, "Source not found")
    return src


@router.delete("/{source_id}")
def delete_source(source_id: int, db: Session = Depends(get_db)):
    src = db.query(models.DataSource).get(source_id)
    if not src:
        raise HTTPException(404, "Source not found")
    db.delete(src)
    db.commit()
    return {"ok": True}


@router.post("/{source_id}/scan", response_model=schemas.ScanResult)
async def scan_source(source_id: int, db: Session = Depends(get_db)):
    """Manually trigger a scan for a specific source."""
    src = db.query(models.DataSource).get(source_id)
    if not src:
        raise HTTPException(404, "Source not found")

    df = await fetch_dataframe(src.source_type, src.connection_info)
    current = profile_dataframe(df)

    if not src.schema_snapshot or "error" in src.schema_snapshot:
        src.schema_snapshot = current
        src.row_count = current["row_count"]
        src.column_count = current["column_count"]
        src.last_scanned = datetime.now(timezone.utc)
        db.commit()
        return schemas.ScanResult(
            source_id=src.id, anomalies_found=0, scripts_generated=0,
            message="Baseline profile stored. Future scans will compare against this.",
        )

    new_anomalies = detect_anomalies(src.schema_snapshot, current)
    created = 0

    for a in new_anomalies:
        existing = db.query(models.Anomaly).filter_by(
            source_id=src.id, anomaly_type=a["type"], resolved=False,
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

        gen = generate_remediation(a, current)
        script = models.RemediationScript(
            anomaly_id=anomaly_row.id,
            code=gen["code"],
            explanation=gen.get("explanation", ""),
        )
        db.add(script)
        created += 1

    src.row_count = current["row_count"]
    src.column_count = current["column_count"]
    src.last_scanned = datetime.now(timezone.utc)
    db.commit()

    return schemas.ScanResult(
        source_id=src.id,
        anomalies_found=len(new_anomalies),
        scripts_generated=created,
        message=f"Scan complete. {created} new anomalie(s) found and scripts generated.",
    )