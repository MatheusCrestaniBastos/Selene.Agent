import os
from dotenv import load_dotenv

load_dotenv()

class Settings:
    SUPABASE_URL = os.getenv("SUPABASE_URL", "")
    SUPABASE_KEY = os.getenv("SUPABASE_KEY", "")
    SUPABASE_SERVICE_KEY = os.getenv("SUPABASE_SERVICE_KEY", "")
    SECRET_KEY = os.getenv("SECRET_KEY", "")
    ALGORITHM = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES = 30
    ENCRYPTION_KEY = os.getenv("ENCRYPTION_KEY", "")
    API_V1_PREFIX = "/api/v1"
    CORS_ORIGINS = "http://localhost:3000,http://localhost:8080"
    ENVIRONMENT = "development"

settings = Settings()
