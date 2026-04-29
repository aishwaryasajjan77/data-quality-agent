from sqlalchemy import (
    Column, Integer, String, JSON, DateTime, ForeignKey,
    Text, Boolean, Float,
)
from sqlalchemy.orm import relationship
from datetime import datetime, timezone
from .database import Base


def utcnow():
    return datetime.now(timezone.utc)


class DataSource(Base):
    __tablename__ = "data_sources"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(255), nullable=False)
    source_type = Column(String(50), nullable=False)  # csv_url, json_url
    connection_info = Column(JSON, nullable=False)
    schema_snapshot = Column(JSON, nullable=True)
    row_count = Column(Integer, default=0)
    column_count = Column(Integer, default=0)
    health_score = Column(Float, default=100.0)  # 0-100
    last_scanned = Column(DateTime, nullable=True)
    created_at = Column(DateTime, default=utcnow)
    updated_at = Column(DateTime, default=utcnow, onupdate=utcnow)

    anomalies = relationship("Anomaly", back_populates="source", cascade="all, delete-orphan")


class Anomaly(Base):
    __tablename__ = "anomalies"

    id = Column(Integer, primary_key=True, index=True)
    source_id = Column(Integer, ForeignKey("data_sources.id", ondelete="CASCADE"))
    anomaly_type = Column(String(50), nullable=False)
    severity = Column(String(20), default="medium")  # low, medium, high, critical
    details = Column(JSON, nullable=False)
    detected_at = Column(DateTime, default=utcnow)
    resolved = Column(Boolean, default=False)
    resolved_at = Column(DateTime, nullable=True)

    source = relationship("DataSource", back_populates="anomalies")
    script = relationship("RemediationScript", back_populates="anomaly", uselist=False, cascade="all, delete-orphan")


class RemediationScript(Base):
    __tablename__ = "remediation_scripts"

    id = Column(Integer, primary_key=True, index=True)
    anomaly_id = Column(Integer, ForeignKey("anomalies.id", ondelete="CASCADE"))
    code = Column(Text, nullable=False)
    explanation = Column(Text)
    language = Column(String(20), default="python")
    created_at = Column(DateTime, default=utcnow)

    anomaly = relationship("Anomaly", back_populates="script")
    runs = relationship("ScriptRun", back_populates="script", cascade="all, delete-orphan")


class ScriptRun(Base):
    __tablename__ = "script_runs"

    id = Column(Integer, primary_key=True, index=True)
    script_id = Column(Integer, ForeignKey("remediation_scripts.id", ondelete="CASCADE"))
    status = Column(String(20), nullable=False)  # pending, running, success, failed
    output = Column(Text)
    error = Column(Text)
    execution_time_ms = Column(Integer)
    started_at = Column(DateTime, default=utcnow)
    finished_at = Column(DateTime, nullable=True)

    script = relationship("RemediationScript", back_populates="runs")