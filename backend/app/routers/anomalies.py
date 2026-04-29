from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from .. import models, schemas
from ..database import get_db

router = APIRouter(prefix="/api/anomalies", tags=["anomalies"])


@router.get("", response_model=list[schemas.AnomalyOut])
def list_anomalies(
    source_id: int | None = None,
    resolved: bool | None = None,
    db: Session = Depends(get_db),
):
    q = db.query(models.Anomaly)
    if source_id is not None:
        q = q.filter_by(source_id=source_id)
    if resolved is not None:
        q = q.filter_by(resolved=resolved)
    return q.order_by(models.Anomaly.detected_at.desc()).all()