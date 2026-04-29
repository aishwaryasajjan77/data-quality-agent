from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from .. import models, schemas
from ..database import get_db

router = APIRouter(prefix="/api/runs", tags=["runs"])


@router.get("", response_model=list[schemas.RunOut])
def list_runs(
    script_id: int | None = None,
    status: str | None = None,
    db: Session = Depends(get_db),
):
    q = db.query(models.ScriptRun)
    if script_id is not None:
        q = q.filter_by(script_id=script_id)
    if status is not None:
        q = q.filter_by(status=status)
    return q.order_by(models.ScriptRun.started_at.desc()).all()