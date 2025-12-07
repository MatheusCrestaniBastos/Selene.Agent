from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager
from app.config import settings

@asynccontextmanager
async def lifespan(app: FastAPI):
    print("🚀 Starting up...")
    yield
    print("🛑 Shutting down...")

app = FastAPI(
    title="Agente Pessoal/Empresarial",
    description="Sistema de automação com WhatsApp, Gmail e Google Sheets",
    version="1.0.0",
    lifespan=lifespan
)

origins = settings.CORS_ORIGINS.split(",")
app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/")
async def root():
    return {
        "status": "healthy",
        "service": "Agente Pessoal/Empresarial",
        "version": "1.0.0",
        "environment": settings.ENVIRONMENT
    }

@app.get("/health")
async def health():
    return {
        "status": "healthy",
        "database": "connected"
    }
