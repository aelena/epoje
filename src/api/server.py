import os
from dotenv import load_dotenv

# Load environment variables before other imports
load_dotenv()

from sanic import Sanic, json as sanic_json
from sanic.request import Request
from sanic.response import JSONResponse
from sanic_cors import CORS

from database import init_db, create_session, log_interaction
from llm import generate_wisdom

app = Sanic("epoche")

# Configure CORS
cors_origins = os.getenv("CORS_ORIGINS", "http://localhost:3000").split(",")
CORS(app, origins=cors_origins)


@app.before_server_start
async def setup_db(app, loop):
    """Initialize database on server start."""
    await init_db()


@app.post("/api/generate")
async def generate(request: Request) -> JSONResponse:
    """Generate an oblique wisdom phrase."""
    data = request.json

    # Validate required fields
    situation = data.get("situation", "").strip()
    if not situation:
        return sanic_json({"error": "Situation is required"}, status=400)

    if len(situation) > 280:
        return sanic_json({"error": "Situation must be 280 characters or less"}, status=400)

    previous_wisdoms = data.get("previous_wisdoms", [])
    action = data.get("action", "initial")
    temperature = float(data.get("temperature", 0.7))
    top_p = float(data.get("top_p", 0.9))
    session_id = data.get("session_id", "anonymous")

    # Clamp values to valid ranges
    temperature = max(0.3, min(1.3, temperature))
    top_p = max(0.7, min(1.0, top_p))

    # Create session if first interaction
    if action == "initial":
        await create_session(session_id, situation)

    try:
        wisdom = await generate_wisdom(
            situation=situation,
            previous_wisdoms=previous_wisdoms,
            temperature=temperature,
            top_p=top_p,
        )

        # Log the interaction
        await log_interaction(
            session_id=session_id,
            action=action,
            wisdom=wisdom,
            temperature=temperature,
            top_p=top_p,
        )

        return sanic_json({
            "wisdom": wisdom,
            "temperature_used": temperature,
            "top_p_used": top_p,
        })

    except Exception as e:
        return sanic_json({"error": str(e)}, status=500)


@app.post("/api/log")
async def log_event(request: Request) -> JSONResponse:
    """Log client-side events."""
    data = request.json

    session_id = data.get("session_id", "anonymous")
    action = data.get("action")
    event_data = data.get("data", {})

    if action not in ("export", "cooldown", "reset"):
        return sanic_json({"error": "Invalid action"}, status=400)

    await log_interaction(
        session_id=session_id,
        action=action,
        data=event_data,
    )

    return sanic_json({"logged": True})


@app.get("/api/health")
async def health(request: Request) -> JSONResponse:
    """Health check endpoint."""
    return sanic_json({"status": "ok"})


if __name__ == "__main__":
    port = int(os.getenv("PORT", 8000))
    debug = os.getenv("DEBUG", "false").lower() == "true"

    app.run(
        host="0.0.0.0",
        port=port,
        debug=debug,
        auto_reload=debug,
    )
