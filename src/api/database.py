import aiosqlite
import os
from datetime import datetime
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
        await db.execute("""
            CREATE TABLE IF NOT EXISTS reservoir (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                text TEXT NOT NULL,
                source_url TEXT,
                source_title TEXT,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                used_count INTEGER DEFAULT 0
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
                datetime.utcnow().isoformat(),
                action,
                wisdom,
                temperature,
                top_p,
                json.dumps(data) if data else None
            )
        )
        await db.commit()


async def add_to_reservoir(text: str, source_url: str = None, source_title: str = None) -> int:
    """Add an idea/quote to the reservoir. Returns the new item's ID."""
    async with aiosqlite.connect(DATABASE_PATH) as db:
        cursor = await db.execute(
            """
            INSERT INTO reservoir (text, source_url, source_title, created_at)
            VALUES (?, ?, ?, ?)
            """,
            (text, source_url, source_title, datetime.utcnow().isoformat())
        )
        await db.commit()
        return cursor.lastrowid


async def get_reservoir_items(limit: int = 50, random_order: bool = False) -> list[dict]:
    """Get items from the reservoir."""
    async with aiosqlite.connect(DATABASE_PATH) as db:
        db.row_factory = aiosqlite.Row
        order = "RANDOM()" if random_order else "created_at DESC"
        cursor = await db.execute(
            f"""
            SELECT id, text, source_url, source_title, created_at, used_count
            FROM reservoir
            ORDER BY {order}
            LIMIT ?
            """,
            (limit,)
        )
        rows = await cursor.fetchall()
        return [dict(row) for row in rows]


async def get_reservoir_stats() -> dict:
    """Get statistics about the reservoir."""
    async with aiosqlite.connect(DATABASE_PATH) as db:
        # Total count
        cursor = await db.execute("SELECT COUNT(*) FROM reservoir")
        total = (await cursor.fetchone())[0]

        # Added today
        today = datetime.utcnow().date().isoformat()
        cursor = await db.execute(
            "SELECT COUNT(*) FROM reservoir WHERE date(created_at) = ?",
            (today,)
        )
        added_today = (await cursor.fetchone())[0]

        return {
            "total_items": total,
            "added_today": added_today,
        }


async def increment_reservoir_usage(item_id: int):
    """Increment the usage count for a reservoir item."""
    async with aiosqlite.connect(DATABASE_PATH) as db:
        await db.execute(
            "UPDATE reservoir SET used_count = used_count + 1 WHERE id = ?",
            (item_id,)
        )
        await db.commit()


async def delete_reservoir_item(item_id: int) -> bool:
    """Delete an item from the reservoir. Returns True if deleted."""
    async with aiosqlite.connect(DATABASE_PATH) as db:
        cursor = await db.execute(
            "DELETE FROM reservoir WHERE id = ?",
            (item_id,)
        )
        await db.commit()
        return cursor.rowcount > 0
