import os
from dotenv import load_dotenv

# Load environment variables before other imports
load_dotenv()

from sanic import Sanic, json as sanic_json
from sanic.request import Request
from sanic.response import JSONResponse
from sanic_cors import CORS

from database import (
    init_db,
    create_session,
    log_interaction,
    add_to_reservoir,
    get_reservoir_items,
    get_reservoir_stats,
    delete_reservoir_item,
)
from llm import generate_wisdoms
import random

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
    """Generate multiple oblique wisdom phrases."""
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
    session_id = data.get("session_id", "anonymous")
    count = int(data.get("count", 5))

    # Clamp values to valid ranges
    temperature = max(0.3, min(1.3, temperature))
    count = max(1, min(5, count))

    # Create session if first interaction
    if action == "initial":
        await create_session(session_id, situation)

    try:
        # Fetch all reservoir items to check count
        reservoir_items = await get_reservoir_items(limit=100, random_order=False)

        wisdoms = await generate_wisdoms(
            situation=situation,
            previous_wisdoms=previous_wisdoms,
            temperature=temperature,
            reservoir_items=reservoir_items if reservoir_items else None,
            count=count,
        )

        # Pick a random initial selection
        selected_index = random.randint(0, len(wisdoms) - 1)

        # Log the interaction
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
            "reservoir_active": len(reservoir_items) >= 10 if reservoir_items else False,
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


# --- Reservoir endpoints ---

@app.post("/api/reservoir")
async def add_reservoir_item(request: Request) -> JSONResponse:
    """Add an idea/quote to the reservoir."""
    data = request.json

    text = data.get("text", "").strip()
    if not text:
        return sanic_json({"error": "Text is required"}, status=400)

    if len(text) > 2000:
        return sanic_json({"error": "Text must be 2000 characters or less"}, status=400)

    source_url = data.get("source_url", "").strip() or None
    source_title = data.get("source_title", "").strip() or None

    try:
        item_id = await add_to_reservoir(
            text=text,
            source_url=source_url,
            source_title=source_title,
        )

        return sanic_json({
            "id": item_id,
            "added": True,
        })

    except Exception as e:
        return sanic_json({"error": str(e)}, status=500)


@app.get("/api/reservoir")
async def list_reservoir(request: Request) -> JSONResponse:
    """List items from the reservoir."""
    limit = int(request.args.get("limit", 50))
    random_order = request.args.get("random", "false").lower() == "true"

    limit = max(1, min(100, limit))

    try:
        items = await get_reservoir_items(limit=limit, random_order=random_order)
        return sanic_json({"items": items})

    except Exception as e:
        return sanic_json({"error": str(e)}, status=500)


@app.get("/api/reservoir/stats")
async def reservoir_stats(request: Request) -> JSONResponse:
    """Get reservoir statistics."""
    try:
        stats = await get_reservoir_stats()
        return sanic_json(stats)

    except Exception as e:
        return sanic_json({"error": str(e)}, status=500)


@app.delete("/api/reservoir/<item_id:int>")
async def remove_reservoir_item(request: Request, item_id: int) -> JSONResponse:
    """Delete an item from the reservoir."""
    try:
        deleted = await delete_reservoir_item(item_id)
        if deleted:
            return sanic_json({"deleted": True})
        else:
            return sanic_json({"error": "Item not found"}, status=404)

    except Exception as e:
        return sanic_json({"error": str(e)}, status=500)


if __name__ == "__main__":
    port = int(os.getenv("PORT", 8000))
    debug = os.getenv("DEBUG", "false").lower() == "true"

    app.run(
        host="0.0.0.0",
        port=port,
        debug=debug,
        auto_reload=debug,
    )
