from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from datetime import datetime, timezone
from .. import models, schemas
from ..database import get_db
from ..services.profiler import fetch_dataframe
from ..services.sandbox import execute_script

router = APIRouter(prefix="/api/scripts", tags=["scripts"])


@router.get("", response_model=list[schemas.ScriptOut])
def list_scripts(anomaly_id: int | None = None, db: Session = Depends(get_db)):
    q = db.query(models.RemediationScript)
    if anomaly_id is not None:
        q = q.filter_by(anomaly_id=anomaly_id)
    return q.order_by(models.RemediationScript.created_at.desc()).all()


@router.get("/{script_id}", response_model=schemas.ScriptOut)
def get_script(script_id: int, db: Session = Depends(get_db)):
    script = db.query(models.RemediationScript).get(script_id)
    if not script:
        raise HTTPException(404, "Script not found")
    return script


@router.post("/{script_id}/run", response_model=schemas.RunOut)
async def run_script(script_id: int, db: Session = Depends(get_db)):
    """Execute a remediation script in the sandbox."""
    script = db.query(models.RemediationScript).get(script_id)
    if not script:
        raise HTTPException(404, "Script not found")

    anomaly = script.anomaly
    source = anomaly.source

    run = models.ScriptRun(script_id=script.id, status="running")
    db.add(run)
    db.commit()
    db.refresh(run)

    try:
        df = await fetch_dataframe(source.source_type, source.connection_info)
        result = execute_script(script.code, df)

        run.status = result["status"]
        run.output = result.get("output")
        run.error = result.get("error")
        run.execution_time_ms = result.get("execution_time_ms")

        if result["status"] == "success":
            anomaly.resolved = True
            anomaly.resolved_at = datetime.now(timezone.utc)

    except Exception as e:
        run.status = "failed"
        run.error = str(e)

    run.finished_at = datetime.now(timezone.utc)
    db.commit()
    db.refresh(run)
    return run