import aiosqlite
import os
from datetime import datetime, timezone
import json

DATABASE_PATH = os.getenv("DATABASE_PATH", "./oblique.db")


async def init_db():
    """Initialize the database with required tables."""
    async with aiosqlite.connect(DATABASE_PATH) as db:
        await db.execute("""
            CREATE TABLE IF NOT EXISTS sessions (
                id TEXT PRIMARY KEY,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                situation TEXT
            )
        """)
        await db.execute("""
            CREATE TABLE IF NOT EXISTS interactions (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                session_id TEXT,
                timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                action TEXT,
                wisdom TEXT,
                temperature REAL,
                top_p REAL,
                data JSON,
                FOREIGN KEY (session_id) REFERENCES sessions(id)
            )
        """)
        await db.commit()


async def create_session(session_id: str, situation: str):
    """Create a new session record."""
    async with aiosqlite.connect(DATABASE_PATH) as db:
        await db.execute(
            "INSERT OR IGNORE INTO sessions (id, situation) VALUES (?, ?)",
            (session_id, situation)
        )
        await db.commit()


async def log_interaction(
    session_id: str,
    action: str,
    wisdom: str = None,
    temperature: float = None,
    top_p: float = None,
    data: dict = None
):
    """Log an interaction to the database."""
    async with aiosqlite.connect(DATABASE_PATH) as db:
        await db.execute(
            """
            INSERT INTO interactions (session_id, timestamp, action, wisdom, temperature, top_p, data)
            VALUES (?, ?, ?, ?, ?, ?, ?)
            """,
            (
                session_id,
                datetime.now(timezone.utc).isoformat(),
                action,
                wisdom,
                temperature,
                top_p,
                json.dumps(data) if data else None
            )
        )
        await db.commit()
