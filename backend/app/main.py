import logging
from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.config import settings
from app.api.routes import router

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(name)s: %(message)s",
)
logger = logging.getLogger("trustrate")


@asynccontextmanager
async def lifespan(app: FastAPI):
    safe_cfg = settings.get_safe_config()
    logger.info("Initializing TrustRate Backend Server...")
    logger.info(f"Quantum Execution Mode: {safe_cfg['quantum_mode']}")
    logger.info(f"IBM Quantum Token Configured: {safe_cfg['has_ibm_token']}")
    logger.info(f"Target IBM Backend: {safe_cfg['ibm_backend_name']}")
    yield
    logger.info("TrustRate Backend Server shut down cleanly.")


app = FastAPI(
    title="TrustRate — Hybrid Quantum-Classical Fake Review Detection",
    description=(
        "Qiskit Fall Fest 2026 quantum machine learning platform for detecting "
        "suspicious product reviews, astroturfing, and rating manipulation."
    ),
    version="1.0.0",
    lifespan=lifespan,
)

# Enable CORS for local Vite frontend dev server
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(router)


@app.get("/")
def root():
    return {
        "service": "TrustRate API",
        "version": "1.0.0",
        "status": "online",
        "documentation": "/docs",
        "mode": settings.QUANTUM_MODE,
    }


if __name__ == "__main__":
    import uvicorn
    uvicorn.run("app.main:app", host=settings.API_HOST, port=settings.API_PORT, reload=True)
