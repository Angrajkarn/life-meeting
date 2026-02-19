from fastapi import APIRouter, UploadFile, File, Form, HTTPException
from datetime import datetime
import os
from typing import Optional

router = APIRouter()

# In production, configure these from environment variables
UPLOAD_DIR = os.path.join(os.getcwd(), "uploads", "recordings")
os.makedirs(UPLOAD_DIR, exist_ok=True)

@router.post("/upload")
async def upload_recording(
    recording: UploadFile = File(...),
    meeting_id: str = Form(...),
    presenter_id: str = Form(...),
    duration: int = Form(...)
):
    """
    Upload a screen share recording
    
    Args:
        recording: The video file (WebM format)
        meeting_id: ID of the meeting
        presenter_id: ID of the presenter who recorded
        duration: Duration in seconds
    
    Returns:
        File URL and metadata
    """
    try:
        from datetime import timezone
        # Generate unique filename
        timestamp = datetime.now(timezone.utc).strftime("%Y%m%d_%H%M%S")
        filename = f"{meeting_id}_{presenter_id}_{timestamp}.webm"
        file_path = os.path.join(UPLOAD_DIR, filename)
        
        # Save file
        with open(file_path, "wb") as f:
            content = await recording.read()
            f.write(content)
        
        file_size = len(content)
        
        # In production, upload to S3/Azure/GCS here
        # Example with boto3:
        # s3_client.upload_file(file_path, BUCKET_NAME, filename)
        # public_url = f"https://{BUCKET_NAME}.s3.amazonaws.com/{filename}"
        
        # For now, use local path
        public_url = f"/uploads/recordings/{filename}"
        
        # Save metadata to database
        from backend.database import get_collection
        recordings_collection = get_collection("recordings")
        
        recording_doc = {
            "meeting_id": meeting_id,
            "presenter_id": presenter_id,
            "filename": filename,
            "file_url": public_url,
            "file_size": file_size,
            "duration": duration,
            "upload_time": datetime.now(timezone.utc),
            "status": "uploaded"
        }
        
        result = await recordings_collection.insert_one(recording_doc)
        recording_doc["id"] = str(result.inserted_id)
        recording_doc.pop("_id")
        
        return {
            "success": True,
            "recording": recording_doc,
            "message": f"Recording uploaded successfully ({file_size / 1024 / 1024:.2f} MB)"
        }
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Upload failed: {str(e)}")


@router.get("/meeting/{meeting_id}")
async def get_meeting_recordings(meeting_id: str):
    """
    Get all recordings for a meeting
    """
    from backend.database import get_collection
    recordings_collection = get_collection("recordings")
    
    recordings = await recordings_collection.find(
        {"meeting_id": meeting_id}
    ).to_list(length=100)
    
    # Convert ObjectId to string
    for rec in recordings:
        rec["id"] = str(rec.pop("_id"))
        rec["upload_time"] = rec["upload_time"].isoformat()
    
    return {"recordings": recordings}


@router.delete("/{recording_id}")
async def delete_recording(recording_id: str):
    """
    Delete a recording
    """
    from backend.database import get_collection
    from bson import ObjectId
    
    recordings_collection = get_collection("recordings")
    
    # Get recording info
    recording = await recordings_collection.find_one({"_id": ObjectId(recording_id)})
    
    if not recording:
        raise HTTPException(status_code=404, detail="Recording not found")
    
    # Delete file
    file_path = os.path.join(UPLOAD_DIR, recording["filename"])
    if os.path.exists(file_path):
        os.remove(file_path)
    
    # Delete from database
    await recordings_collection.delete_one({"_id": ObjectId(recording_id)})
    
    return {"success": True, "message": "Recording deleted"}
