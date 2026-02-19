from datetime import datetime, timezone
from typing import Dict

def generate_ics_content(meeting: Dict) -> str:
    """
    Generates a simple ICS file content for a meeting.
    """
    start_time = meeting["start_time"]
    end_time = meeting["end_time"]
    
    # Format for ICS: YYYYMMDDTHHMMSSZ
    dtstamp = datetime.now(timezone.utc).strftime("%Y%m%dT%H%M%SZ")
    dtstart = start_time.strftime("%Y%m%dT%H%M%SZ")
    dtend = end_time.strftime("%Y%m%dT%H%M%SZ")
    
    summary = meeting["title"]
    description = meeting.get("description", "")
    location = f"https://life-meeting.com/meeting/{meeting['code']}"
    uid = f"{meeting['id']}@life-meeting.com"
    
    ics_lines = [
        "BEGIN:VCALENDAR",
        "VERSION:2.0",
        "PRODID:-//LifeMeeting//Enterprise Scheduling//EN",
        "CALSCALE:GREGORIAN",
        "METHOD:PUBLISH",
        "BEGIN:VEVENT",
        f"DTSTAMP:{dtstamp}",
        f"DTSTART:{dtstart}",
        f"DTEND:{dtend}",
        f"SUMMARY:{summary}",
        f"DESCRIPTION:{description}",
        f"LOCATION:{location}",
        f"UID:{uid}",
        "STATUS:CONFIRMED",
        "SEQUENCE:0",
        "BEGIN:VALARM",
        "TRIGGER:-PT15M",
        "ACTION:DISPLAY",
        "DESCRIPTION:Reminder",
        "END:VALARM",
        "END:VEVENT",
        "END:VCALENDAR"
    ]
    
    return "\n".join(ics_lines)
