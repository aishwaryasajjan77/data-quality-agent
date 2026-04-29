"""
Demo seeder — creates sample anomalies + AI-generated scripts so you can
see the full dashboard, anomaly viewer, and script runner in action.
"""
from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from datetime import datetime, timezone, timedelta
from .. import models
from ..database import get_db
 
router = APIRouter(prefix="/api/demo", tags=["demo"])
 
SAMPLE_ANOMALIES = [
    {
        "anomaly_type": "missing_column",
        "severity": "critical",
        "details": {"column": "score"},
        "code": """def remediate(df):
    # Re-create the missing 'score' column with a default value
    if 'score' not in df.columns:
        df['score'] = 0  # default placeholder
    return df""",
        "explanation": "The 'score' column was dropped from the data source. This script re-creates it with a default value of 0, preserving the schema contract downstream consumers depend on.",
    },
    {
        "anomaly_type": "null_spike",
        "severity": "high",
        "details": {"column": "name", "baseline_null_pct": 0.0, "current_null_pct": 0.4},
        "code": """def remediate(df):
    # Fill null names with 'Unknown'
    if 'name' in df.columns:
        df['name'] = df['name'].fillna('Unknown')
    return df""",
        "explanation": "The 'name' column saw null values jump from 0% to 40%. This script fills missing names with 'Unknown' to prevent downstream NullPointerExceptions in the pipeline.",
    },
    {
        "anomaly_type": "dtype_change",
        "severity": "high",
        "details": {"column": "age", "from": "int64", "to": "object"},
        "code": """def remediate(df):
    # Coerce 'age' back to numeric, replacing unparseable values with median
    if 'age' in df.columns:
        df['age'] = pd.to_numeric(df['age'], errors='coerce')
        median_age = df['age'].median()
        df['age'] = df['age'].fillna(median_age).astype(int)
    return df""",
        "explanation": "The 'age' column changed from int64 to object (string), likely due to entries like 'thirty-five'. This script coerces values to numeric, replacing unparseable entries with the column median.",
    },
    {
        "anomaly_type": "null_spike",
        "severity": "medium",
        "details": {"column": "email", "baseline_null_pct": 0.0, "current_null_pct": 0.2},
        "code": """def remediate(df):
    # Fill missing emails with a placeholder
    if 'email' in df.columns:
        df['email'] = df['email'].fillna('missing@placeholder.com')
    return df""",
        "explanation": "The 'email' column developed 20% null values. This script fills them with a placeholder address to maintain data completeness for downstream email validation systems.",
    },
    {
        "anomaly_type": "row_count_drop",
        "severity": "critical",
        "details": {"baseline_rows": 1000, "current_rows": 420, "drop_pct": 0.58},
        "code": """def remediate(df):
    # Log warning - row count drop detected
    # Cannot restore lost rows, but ensure remaining data is valid
    df = df.dropna(how='all')  # Remove completely empty rows
    df = df.reset_index(drop=True)
    return df""",
        "explanation": "Row count dropped by 58% (1000 → 420 rows). This likely indicates a data pipeline failure upstream. The script cleans up any fully empty rows in the remaining data while flagging the issue for investigation.",
    },
    {
        "anomaly_type": "cardinality_collapse",
        "severity": "high",
        "details": {"column": "status", "baseline_unique": 15, "current_unique": 2},
        "code": """def remediate(df):
    # Flag suspicious cardinality collapse for review
    if 'status' in df.columns:
        # Add a flag column for rows that may have been incorrectly standardized
        known_statuses = ['active', 'inactive', 'pending', 'review', 'archived']
        df['status_flagged'] = ~df['status'].isin(known_statuses)
    return df""",
        "explanation": "The 'status' column collapsed from 15 unique values to just 2, suggesting data was incorrectly batch-updated. This script flags rows for manual review rather than guessing the original values.",
    },
]
 
 
@router.post("/seed")
def seed_demo_data(db: Session = Depends(get_db)):
    """Inject sample anomalies and scripts for demo purposes."""
 
    # Find or create a demo source
    source = db.query(models.DataSource).filter_by(name="Demo Pipeline").first()
    if not source:
        source = models.DataSource(
            name="Demo Pipeline",
            source_type="csv_url",
            connection_info={"url": "https://raw.githubusercontent.com/datasciencedojo/datasets/master/titanic.csv"},
            schema_snapshot={
                "columns": {
                    "id": {"dtype": "int64", "null_pct": 0.0, "unique_count": 1000},
                    "name": {"dtype": "object", "null_pct": 0.0, "unique_count": 950},
                    "age": {"dtype": "int64", "null_pct": 0.02, "unique_count": 65},
                    "email": {"dtype": "object", "null_pct": 0.0, "unique_count": 1000},
                    "score": {"dtype": "float64", "null_pct": 0.01, "unique_count": 89},
                    "status": {"dtype": "object", "null_pct": 0.0, "unique_count": 15},
                },
                "row_count": 1000,
                "column_count": 6,
            },
            row_count=1000,
            column_count=6,
            health_score=100.0,
            last_scanned=datetime.now(timezone.utc) - timedelta(hours=2),
        )
        db.add(source)
        db.flush()
 
    # Create anomalies and scripts
    created = 0
    now = datetime.now(timezone.utc)
    for i, item in enumerate(SAMPLE_ANOMALIES):
        # Skip if already exists
        existing = db.query(models.Anomaly).filter_by(
            source_id=source.id,
            anomaly_type=item["anomaly_type"],
            resolved=False,
        ).first()
        if existing:
            continue
 
        anomaly = models.Anomaly(
            source_id=source.id,
            anomaly_type=item["anomaly_type"],
            severity=item["severity"],
            details=item["details"],
            detected_at=now - timedelta(minutes=30 * (len(SAMPLE_ANOMALIES) - i)),
        )
        db.add(anomaly)
        db.flush()
 
        script = models.RemediationScript(
            anomaly_id=anomaly.id,
            code=item["code"],
            explanation=item["explanation"],
        )
        db.add(script)
        created += 1
 
    # Update health score
    source.health_score = 28.0  # Reflects several critical/high anomalies
    db.commit()
 
    return {
        "message": f"Demo data seeded: {created} anomalies with AI scripts created.",
        "source_id": source.id,
        "anomalies_created": created,
    }
 
 
@router.delete("/clear")
def clear_demo_data(db: Session = Depends(get_db)):
    """Remove all demo data."""
    source = db.query(models.DataSource).filter_by(name="Demo Pipeline").first()
    if source:
        db.delete(source)
        db.commit()
        return {"message": "Demo data cleared."}
    return {"message": "No demo data found."}