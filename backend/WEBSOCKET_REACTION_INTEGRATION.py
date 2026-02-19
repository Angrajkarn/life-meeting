"""
Add this handler to backend/routes/websocket.py

LOCATION: Inside the websocket_endpoint function, in the message handling section
(Look for where other message types like 'chat_message', 'audio_control', etc. are handled)

Add this import at the top of the file:
"""
from backend.reaction_handler import handle_reaction_send
from fastapi import Request

"""
Then add this handler in the message processing section:
"""

# Add after other message handlers like 'chat_message', 'audio_control', etc.
if data.get('type') == 'reaction_send':
    # Get rate limiter from app state
    # Access the app from the WebSocket's app property
    rate_limiter = websocket.app.state.reaction_rate_limiter
    
    # Get meeting settings
    meeting = await meetings_collection.find_one({"_id": ObjectId(meeting_id)})
    if not meeting:
        await websocket.send_json({
            "type": "error",
            "message": "Meeting not found"
        })
        continue
    
    meeting_settings = meeting.get('settings', {})
    
    # Handle reaction with validation
    await handle_reaction_send(
        ws=websocket,
        user_id=user_id,
        user_name=user_name,
        data=data.get('data', {}),
        meeting_settings=meeting_settings,
        user_role=user_role,
        rate_limiter=rate_limiter if rate_limiter else None,
        broadcast_func=lambda meeting_id, msg: manager.broadcast(json.dumps(msg), meeting_id)
    )
    continue  # Important: continue to next message
