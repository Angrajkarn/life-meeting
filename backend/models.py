from pydantic import BaseModel, EmailStr, Field
from typing import Optional
from datetime import datetime, timezone
import uuid
from typing import List

class DndSchedule(BaseModel):
    enabled: bool = False
    start_time: str = "22:00"
    end_time: str = "08:00"
    week_days: List[int] = [0, 1, 2, 3, 4] # Mon-Fri

class NotificationChannelSettings(BaseModel):
    chat: bool = True
    mentions: bool = True
    reactions: bool = True
    apps: bool = True

class MeetingNotificationSettings(BaseModel):
    start_alert: bool = True
    chat_in_meeting: bool = True
    recording_ready: bool = True

class PrivacySettings(BaseModel):
    profile_visibility: str = "public" # public, organization, none
    show_online_status: bool = True
    allow_random_meeting_joins: bool = False
    collect_analytics: bool = True
    allow_recording: bool = True # User preference, can be overridden by Org

class PrivacyPolicy(BaseModel):
    enforce_recording: str = "user_decides" # allow, deny, user_decides
    enforce_camera_on: bool = False
    allowed_domains: List[str] = [] # Empty = allow all
    retention_policy_days: int = 365
    require_2fa: bool = False

class NotificationPreferences(BaseModel):
    messages: NotificationChannelSettings = NotificationChannelSettings()
    meetings: MeetingNotificationSettings = MeetingNotificationSettings()
    email_frequency: str = "immediate" # immediate, daily, off
    dnd_schedule: DndSchedule = DndSchedule()
    sound_enabled: bool = True
    # Collaboration
    read_receipts: bool = True
    typing_indicators: bool = True
    show_previews: bool = True

class AccessibilityProfile(BaseModel):
    high_contrast: bool = False
    font_scale: float = 1.0 # 0.8 to 2.0
    reduced_motion: bool = False
    captions_enabled: bool = False
    caption_language: str = "auto"
    sign_language_view: bool = False
    keyboard_mode: str = "default" # default, vim, emacs
    screen_reader_optimized: bool = False
    color_blindness_mode: str = "none" # none, protanopia, deuteranopia, tritanopia

class UserPreferences(BaseModel):
    confirm_on_leave: bool = True
    app_language: str = "en-us"
    date_format: str = "mdy"
    time_format: str = "12"
    translate_to: str = "en"
    translation_handling: str = "ask"
    never_translate: List[str] = []
    spellcheck_enabled: bool = True
    open_item_on_enter: bool = False
    suggested_replies: bool = True
    # Appearance Settings
    theme: str = "light" # light, dark, system
    density: str = "comfy" # comfy, compact
    high_contrast: bool = False # Deprecated: moved to accessibility, kept for backward compat
    reduce_motion: bool = False # Deprecated: moved to accessibility
    transparent_sidebar: bool = False
    # Notification Settings
    notifications: NotificationPreferences = NotificationPreferences()
    # Privacy Settings
    privacy: PrivacySettings = PrivacySettings()
    # Accessibility Settings (New)
    accessibility: AccessibilityProfile = AccessibilityProfile()

class UserCreate(BaseModel):
    email: EmailStr
    password: str = Field(..., min_length=6)
    full_name: str
    is_verified: bool = False
    otp_secret: str | None = None
    otp_created_at: datetime | None = None
    preferences: UserPreferences = UserPreferences()

class UserLogin(BaseModel):
    email: EmailStr
    password: str

class GoogleLogin(BaseModel):
    token: str

class Department(BaseModel):
    id: str | None = None
    name: str
    head_user_id: Optional[str] = None
    parent_department_id: Optional[str] = None
    member_ids: List[str] = []

class UserResponse(BaseModel):
    id: str
    email: EmailStr
    full_name: str
    avatar: Optional[str] = None
    status: str = "available" # available, busy, dnd, away, offline
    status_message: Optional[str] = None
    role: Optional[str] = None
    department: Optional[str] = None # Department Name for display
    department_id: Optional[str] = None # Link to Department model
    job_title: Optional[str] = None
    location: Optional[str] = None
    phone: Optional[str] = None
    created_at: datetime | None = None
    organizations: list[str] = [] # List of Organization IDs
    preferences: UserPreferences = UserPreferences()

    class Config:
        from_attributes = True

class Token(BaseModel):
    access_token: str
    token_type: str

class OTPVerify(BaseModel):
    email: EmailStr
    otp: str

class PasswordResetRequest(BaseModel):
    email: EmailStr

class PasswordResetConfirm(BaseModel):
    token: str
    new_password: str = Field(..., min_length=6)

class ParticipantPermissions(BaseModel):
    canUnmute: bool = True
    canShareVideo: bool = True
    canShareScreen: bool = True
    canChat: bool = True
    canUseReactions: bool = True

class Participant(BaseModel):
    user_id: str
    name: str = "Unknown"
    joined_at: datetime | None = None
    role: str = "guest"  # host, co-host, guest
    status: str = "active" # active, waiting
    isMuted: bool = True
    permissions: ParticipantPermissions = ParticipantPermissions()
    # Status flags
    isHandRaised: bool = False
    isVideoOn: bool = False

class MeetingStatus(str):
    SCHEDULED = "scheduled"
    STARTING_SOON = "starting_soon"
    JOIN_NOW = "join_now"
    LIVE = "live"
    ENDED = "ended"

class MeetingRecurrence(BaseModel):
    pattern: str  # daily, weekly, monthly, yearly
    interval: int = 1
    end_date: Optional[datetime] = None
    days_of_week: Optional[list[int]] = None # 0-6

class MeetingSettings(BaseModel):
    waiting_room: bool = False
    mute_on_entry: bool = False
    allow_guest_join: bool = True
    is_chat_locked: bool = False
    audio_locked: bool = False
    video_locked: bool = False
    screen_share_locked: bool = False
    camera_on_entry: bool = False
    visibility: str = "private" # private, team, org

class MeetingCreate(BaseModel):
    title: str
    description: Optional[str] = None
    start_time: datetime
    end_time: datetime
    timezone: str = "UTC"
    type: str = "video" # video, audio, hybrid
    settings: MeetingSettings = MeetingSettings()
    recurrence: Optional[MeetingRecurrence] = None
    attendees: list[dict] = [] # list of {user_id: str, role: str}

class MeetingUpdate(BaseModel):
    title: Optional[str] = None
    description: Optional[str] = None
    start_time: Optional[datetime] = None
    end_time: Optional[datetime] = None
    timezone: Optional[str] = None
    status: Optional[str] = None
    settings: Optional[MeetingSettings] = None
    recurrence: Optional[MeetingRecurrence] = None

class MeetingResponse(MeetingCreate):
    id: str
    host_id: str
    code: str
    status: str
    active_presenter_id: Optional[str] = None
    participants: list[Participant] = []
    settings: MeetingSettings = MeetingSettings()
    started_at: Optional[datetime] = None
    created_at: datetime
    
    class Config:
        from_attributes = True

class UserStats(BaseModel):
    meetings_today: int
    hours_saved: float
    upcoming_count: int

class Notification(BaseModel):
    id: str | None = None
    user_id: str
    type: str  # mention, message, meeting_invite, system_alert, file_share
    title: str
    message: str
    link: Optional[str] = None
    is_read: bool = False
    priority: str = "normal"  # low, normal, high, urgent
    metadata: Optional[dict] = None
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class ActivityLog(BaseModel):
    id: str | None = None
    actor_id: str
    actor_name: str
    target_id: Optional[str] = None
    target_type: Optional[str] = None # meeting, file, user, team
    type: str # meeting_created, meeting_joined, etc.
    title: str
    description: str
    metadata: Optional[dict] = None
    timestamp: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class ChatContent(BaseModel):
    type: str = "text" # text, image, file, system, poll, canvas
    body: str | None = None
    fileUrl: str | None = None
    fileName: str | None = None
    fileSize: str | None = None
    poll_id: str | None = None
    canvas_id: str | None = None

class Reaction(BaseModel):
    userId: str
    emoji: str

class PollOption(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    text: str
    votes: list[str] = [] # User IDs

class Poll(BaseModel):
    id: str | None = None
    channel_id: str
    creator_id: Optional[str] = None
    creator_name: Optional[str] = None
    question: str
    options: list[PollOption]
    is_closed: bool = False
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class Canvas(BaseModel):
    id: str | None = None
    channel_id: str
    title: str
    content: str = "" # Collaborative content
    last_updated_by: str | None = None
    updated_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class TeamMember(BaseModel):
    user_id: str
    role: str = "member"  # admin, member

class Mention(BaseModel):
    user_id: str
    full_name: str

class OrganizationMember(BaseModel):
    user_id: str
    role: str = "member" # owner, admin, member
    status: str = "active" # active, invited, suspended
    joined_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class SubscriptionPlan(BaseModel):
    id: str
    name: str # Free, Pro, Enterprise
    max_seats: int
    features: List[str] = [] # "recording", "transcription", "sso"
    price_monthly: float
    currency: str = "USD"

class OrganizationBilling(BaseModel):
    org_id: str
    stripe_customer_id: Optional[str] = None
    subscription_id: Optional[str] = None
    plan_id: str = "free"
    status: str = "active" # active, past_due, canceled
    payment_method_last4: Optional[str] = None
    next_invoice_date: Optional[datetime] = None

class Organization(BaseModel):
    id: str | None = None
    name: str
    slug: str # unique identifier for URLs
    owner_id: str
    logo: Optional[str] = None
    plan: str = "free" # free, pro, enterprise
    billing: Optional[OrganizationBilling] = None # Billing details
    members: list[OrganizationMember] = []
    settings: dict = {}
    privacy_policy: PrivacyPolicy = PrivacyPolicy()
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class Team(BaseModel):
    id: str | None = None
    org_id: Optional[str] = None # Link to Organization
    name: str
    owner_id: str
    members: list[TeamMember] = []
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class Channel(BaseModel):
    id: str | None = None
    team_id: Optional[str] = None
    name: str  # For DMs, this might be concatenated names or just "Direct Message"
    type: str = "channel"  # channel, dm, meeting
    members: list[str] = []  # List of user_ids
    member_details: Optional[list[dict]] = None # List of {id, full_name, email}
    meeting_id: Optional[str] = None
    # User Preferences (Enterprise)
    pinned_users: list[str] = [] # User IDs who pinned this channel
    muted_users: list[str] = [] # User IDs who muted this channel
    unread_users: list[str] = [] # User IDs who have unread messages here
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class ChatMessage(BaseModel):
    id: str | None = None
    channel_id: str | None = None  # New: links to a persistent channel
    meeting_id: str | None = None  # Existing: kept for back compat
    sender_id: str | None = None
    sender_name: str | None = None
    sender_role: str = "participant"
    timestamp: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    content: Optional[ChatContent] = None
    text: Optional[str] = None # Support top-level text from frontend
    status: str = "sent"  # sent, delivered, read
    reactions: list[Reaction] = []
    is_deleted: bool = False
    # Threading support
    parent_id: Optional[str] = None
    reply_to_name: Optional[str] = None
    reply_to_content: Optional[str] = None # Snippet of the replied-to message
    # Message Actions
    is_pinned: bool = False
    is_edited: bool = False
    deleted_for: list[str] = [] # User IDs who deleted this for themselves
    mentions: list[Mention] = []

class ChatHistory(BaseModel):
    messages: list[ChatMessage]

class WorkspaceInvitation(BaseModel):
    id: str | None = None
    email: EmailStr
    org_id: Optional[str] = None # Link to specific organization
    token: str
    sender_id: str
    sender_name: str
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    status: str = "pending" # pending, accepted, expired
