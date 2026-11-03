from functools import lru_cache
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    app_name: str = "KrishiAI Service"
    app_version: str = "1.0.0"
    app_env: str = "development"
    app_port: int = 8000
    cors_origins: str = "http://localhost:5173,http://localhost:5000"
    server_url: str = "http://localhost:5000"

    # Model inference configuration
    model_weights_path: str = "checkpoints/best_model.pt"
    confidence_threshold: float = 0.50
    # Shared secret for Node→FastAPI internal authentication
    internal_api_key: str = ""

    # Google Gemini AI configuration
    gemini_api_key: str = ""
    gemini_model: str = "gemini-2.5-flash"

    @property
    def cors_origins_list(self) -> list[str]:
        return [origin.strip() for origin in self.cors_origins.split(",")]

    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        case_sensitive=False,
        protected_namespaces=(),
    )


@lru_cache
def get_settings() -> Settings:
    return Settings()
