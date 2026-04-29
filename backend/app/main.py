import logging
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager
from .database import engine, Base
from .routers import sources, anomalies, scripts, runs, dashboard, demo
from .services.scheduler import start_scheduler

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)


@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup
    Base.metadata.create_all(bind=engine)
    logger.info("Database tables created.")
    start_scheduler()
    yield
    # Shutdown
    from .services.scheduler import scheduler
    scheduler.shutdown(wait=False)
    logger.info("Scheduler shut down.")


app = FastAPI(
    title="Data Quality Agent API",
    description="Autonomous data quality monitoring and AI-powered remediation",
    version="1.0.0",
    lifespan=lifespan,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(dashboard.router)
app.include_router(sources.router)
app.include_router(anomalies.router)
app.include_router(scripts.router)
app.include_router(runs.router)
app.include_router(demo.router)


@app.get("/")
def root():
    return {"service": "data-quality-agent", "version": "1.0.0", "status": "operational"}


@app.get("/health")
def health():
    return {"status": "ok"}