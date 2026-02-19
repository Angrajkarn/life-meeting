from fastapi_mail import FastMail, MessageSchema, ConnectionConfig, MessageType
from pydantic import EmailStr
from pathlib import Path
from backend.models import UserCreate

import os
from dotenv import load_dotenv

load_dotenv()

# Email Configuration
conf = ConnectionConfig(
    MAIL_USERNAME=os.getenv("MAIL_USERNAME"),
    MAIL_PASSWORD=os.getenv("MAIL_PASSWORD"),
    MAIL_FROM=os.getenv("MAIL_FROM"),
    MAIL_PORT=int(os.getenv("MAIL_PORT", 587)),
    MAIL_SERVER=os.getenv("MAIL_SERVER"),
    MAIL_FROM_NAME="Scarlet Juno Enterprise",
    MAIL_STARTTLS=True,
    MAIL_SSL_TLS=False,
    USE_CREDENTIALS=True,
    VALIDATE_CERTS=True,
    TEMPLATE_FOLDER=Path(__file__).parent / 'templates'
)

class EmailService:
    # Helper method to send emails
    async def send_email(self, recipient_emails: list[str] | EmailStr, subject: str, template_name: str, template_data: dict):
        if not recipient_emails:
            return
            
        if isinstance(recipient_emails, (str, EmailStr)):
            recipient_emails = [recipient_emails]
        
        message = MessageSchema(
            subject=subject,
            recipients=recipient_emails,
            template_body=template_data,
            subtype=MessageType.html
        )
        fm = FastMail(conf)
        await fm.send_message(message, template_name=template_name)

    async def send_otp_email(self, email: EmailStr, otp: str):
        await self.send_email(email, "Scarlet Juno - Verify Your Account", "otp.html", {"otp": otp})

    async def send_reset_email(self, email: EmailStr, otp: str):
        await self.send_email(email, "Scarlet Juno - Reset Your Password", "reset_password.html", {"otp": otp})

    async def send_meeting_invite(self, emails: list[str], template_data: dict):
        subject = f"Meeting Invitation: {template_data.get('title', 'Collaboration Session')}"
        await self.send_email(emails, subject, "meeting_invite.html", template_data)

    async def send_meeting_update(self, emails: list[str], template_data: dict):
        subject = f"Meeting Update: {template_data.get('title', 'Collaboration Session')}"
        await self.send_email(emails, subject, "meeting_update.html", template_data)

    async def send_meeting_cancel(self, emails: list[str], template_data: dict):
        subject = f"Meeting Cancelled: {template_data.get('title', 'Collaboration Session')}"
        await self.send_email(emails, subject, "meeting_cancel.html", template_data)

    async def send_workspace_invite(self, email: EmailStr, sender_name: str, invite_url: str):
        subject = f"{sender_name} invited you to join a workspace"
        await self.send_email(email, subject, "workspace_invite.html", {
            "sender_name": sender_name,
            "invite_url": invite_url
        })

email_service = EmailService()
