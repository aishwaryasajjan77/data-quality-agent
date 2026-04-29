from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    database_url: str
    redis_url: str = ""
    gemini_api_key: str
    sandbox_timeout_seconds: int = 10
    monitor_interval_minutes: int = 5

    class Config:
        env_file = ".env"


settings = Settings()