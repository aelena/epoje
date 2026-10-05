import os
from pathlib import Path
from dotenv import load_dotenv

# Load environment variables before other imports
load_dotenv()

from sanic import Sanic, json as sanic_json
from sanic.request import Request
from sanic.response import JSONResponse
from sanic_cors import CORS

from database import init_db, create_session, log_interaction
from llm import generate_wisdoms
from ratelimit import RateLimiter
import random
import logging

logger = logging.getLogger("epoche")

# development: no limits (you pay for your own clicks)
# production: per-IP and global daily limits, serves the built frontend
ENV = os.getenv("EPOCHE_ENV", "development").lower()
IS_PROD = ENV == "production"

app = Sanic("epoche")

# Behind a reverse proxy (Caddy/nginx) trust its X-Forwarded-For so limits apply per client
app.config.PROXIES_COUNT = int(os.getenv("PROXIES_COUNT", "1" if IS_PROD else "0"))

limiter = RateLimiter(
    per_minute=int(os.getenv("RATE_LIMIT_PER_MINUTE", 6)),
    per_day=int(os.getenv("RATE_LIMIT_PER_DAY", 60)),
    global_per_day=int(os.getenv("GLOBAL_DAILY_LIMIT", 2000)),
) if IS_PROD else None

# The frontend uses relative /api URLs (Vite proxy in dev, same origin in prod),
# so CORS only matters if you host the frontend elsewhere
cors_origins = [o for o in os.getenv("CORS_ORIGINS", "").split(",") if o]
if cors_origins:
    CORS(app, origins=cors_origins)


@app.before_server_start
async def setup_db(app):
    """Initialize database on server start."""
    await init_db()
    logger.info("epoche running in %s mode%s", ENV, " (rate limited)" if limiter else "")


@app.post("/api/generate")
async def generate(request: Request) -> JSONResponse:
    """Generate multiple oblique wisdom phrases."""
    data = request.json or {}

    situation = str(data.get("situation", "")).strip()
    if not situation:
        return sanic_json({"error": "Situation is required"}, status=400)

    if len(situation) > 280:
        return sanic_json({"error": "Situation must be 280 characters or less"}, status=400)

    if limiter:
        retry_after = limiter.check(request.remote_addr or request.ip)
        if retry_after:
            return sanic_json(
                {"error": "The oracle needs silence. Try again later.", "retry_after": retry_after},
                status=429,
                headers={"Retry-After": str(retry_after)},
            )

    previous_wisdoms = [str(w) for w in (data.get("previous_wisdoms") or [])][-50:]
    action = data.get("action", "initial")
    temperature = max(0.3, min(1.3, float(data.get("temperature", 0.7))))
    session_id = str(data.get("session_id", "anonymous"))[:64]
    count = max(1, min(5, int(data.get("count", 5))))

    # The reservoir lives in the browser and is sent with each request:
    # keep only well-formed items, bounded
    reservoir_items = [
        {"text": str(item["text"])[:2000]}
        for item in (data.get("reservoir_items") or [])[:500]
        if isinstance(item, dict) and item.get("text")
    ]

    if action == "initial":
        await create_session(session_id, situation)

    try:
        wisdoms = await generate_wisdoms(
            situation=situation,
            previous_wisdoms=previous_wisdoms,
            temperature=temperature,
            reservoir_items=reservoir_items or None,
            count=count,
        )

        selected_index = random.randint(0, len(wisdoms) - 1)

        await log_interaction(
            session_id=session_id,
            action=action,
            wisdom=wisdoms[selected_index],
            temperature=temperature,
            data={"all_wisdoms": wisdoms, "selected_index": selected_index},
        )

        return sanic_json({
            "wisdoms": wisdoms,
            "selected_index": selected_index,
            "temperature_used": temperature,
            "reservoir_active": len(reservoir_items) >= 10,
        })

    except Exception:
        # Log details server-side; don't leak provider errors to clients
        logger.exception("Generation failed")
        return sanic_json({"error": "The oracle is silent. Try again."}, status=500)


@app.post("/api/log")
async def log_event(request: Request) -> JSONResponse:
    """Log client-side events."""
    data = request.json or {}

    session_id = str(data.get("session_id", "anonymous"))[:64]
    action = data.get("action")
    event_data = data.get("data", {})

    if action not in ("export", "cooldown", "reset"):
        return sanic_json({"error": "Invalid action"}, status=400)

    await log_interaction(session_id=session_id, action=action, data=event_data)

    return sanic_json({"logged": True})


@app.get("/api/health")
async def health(request: Request) -> JSONResponse:
    """Health check endpoint."""
    return sanic_json({"status": "ok", "env": ENV})


# In production, serve the built frontend (npm run build) from the same process
DIST = Path(__file__).resolve().parents[2] / "dist"
if IS_PROD and DIST.is_dir():
    app.static("/", DIST / "index.html", name="index")
    app.static("/assets", DIST / "assets", name="assets")


if __name__ == "__main__":
    port = int(os.getenv("PORT", 8000))
    debug = os.getenv("DEBUG", "false").lower() == "true" and not IS_PROD

    app.run(
        host=os.getenv("HOST", "127.0.0.1" if IS_PROD else "0.0.0.0"),
        port=port,
        debug=debug,
        auto_reload=debug,
        single_process=True,  # keeps the in-memory rate limiter consistent
    )
