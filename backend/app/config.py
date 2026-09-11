from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    DATABASE_URL: str
    ADMIN_API_KEY: str
    MEDIA_PATH: str = "/app/media"
    MEDIA_URL_PREFIX: str = "/media"

    class Config:
        env_file = ".env"


settings = Settings()
