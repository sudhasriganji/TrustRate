import os
from pathlib import Path
from dotenv import load_dotenv

# Search for .env in current directory and parent directories
base_dir = Path(__file__).resolve().parent.parent.parent
env_path = base_dir / ".env"
if env_path.exists():
    load_dotenv(dotenv_path=env_path)
else:
    load_dotenv()


class Settings:
    QUANTUM_MODE: str = os.getenv("QUANTUM_MODE", "aer").lower()
    IBM_QUANTUM_TOKEN: str = os.getenv("IBM_QUANTUM_TOKEN", "").strip()
    IBM_INSTANCE: str = os.getenv("IBM_INSTANCE", "").strip()
    IBM_BACKEND_NAME: str = os.getenv("IBM_BACKEND_NAME", "").strip()
    DATABASE_URL: str = os.getenv("DATABASE_URL", "sqlite:///./trustrate.db")
    API_HOST: str = os.getenv("API_HOST", "127.0.0.1")
    API_PORT: int = int(os.getenv("API_PORT", "8000"))

    @classmethod
    def is_hardware_configured(cls) -> bool:
        return bool(cls.IBM_QUANTUM_TOKEN and len(cls.IBM_QUANTUM_TOKEN) > 5)

    @classmethod
    def get_safe_config(cls) -> dict:
        """Returns safe configuration summary without revealing secrets."""
        return {
            "quantum_mode": cls.QUANTUM_MODE,
            "has_ibm_token": cls.is_hardware_configured(),
            "ibm_instance_set": bool(cls.IBM_INSTANCE),
            "ibm_backend_name": cls.IBM_BACKEND_NAME if cls.IBM_BACKEND_NAME else "least_busy (auto)",
            "api_host": cls.API_HOST,
            "api_port": cls.API_PORT,
        }


settings = Settings()
