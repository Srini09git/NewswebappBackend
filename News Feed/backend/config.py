from pydantic_settings import BaseSettings

class Settings(BaseSettings):
    MONGO_URL: str = "mongodb://127.0.0.1:27017"
    MONGO_DB_NAME: str = "news_feed"
    SECRET_KEY: str = "super_secret_key_change_me_in_prod" # Need a secure key here for JWT
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60 * 24 # 24 hours

    class Config:
        env_file = ".env"

settings = Settings()
