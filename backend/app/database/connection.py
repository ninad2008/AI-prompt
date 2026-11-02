import os
from pathlib import Path
from sqlalchemy import create_engine
from sqlalchemy.orm import declarative_base, sessionmaker

# Anchor default SQLite database file to project root regardless of working directory
DEFAULT_DB_FILE = Path(__file__).resolve().parent.parent.parent.parent / "prompt_comparison.db"
DEFAULT_DB_URL = f"sqlite:///{DEFAULT_DB_FILE}"

DATABASE_URL = os.getenv("DATABASE_URL") or DEFAULT_DB_URL

# For SQLite, check_same_thread=False allows multi-threaded async execution
connect_args = {"check_same_thread": False} if DATABASE_URL.startswith("sqlite") else {}

engine = create_engine(
    DATABASE_URL,
    connect_args=connect_args,
    echo=False
)

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

Base = declarative_base()

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

