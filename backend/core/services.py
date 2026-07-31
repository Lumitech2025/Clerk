import os
import re
import logging
import requests
from django.core.mail import EmailMultiAlternatives
from django.conf import settings

logger = logging.getLogger(__name__)

# Configuration & Defaults
HTTPSMS_API_KEY = getattr(settings, 'HTTPSMS_API_KEY', os.getenv('HTTPSMS_API_KEY', ''))
HTTPSMS_SENDER_PHONE = getattr(settings, 'HTTPSMS_SENDER_PHONE', os.getenv('HTTPSMS_SENDER_PHONE', ''))
DEFAULT_FROM_EMAIL = getattr(settings, 'DEFAULT_FROM_EMAIL', 'clerk@newlifesda.org')


# ==========================================
# HELPER UTILITIES
# ==========================================

def format_kenyan_phone(phone_number):
    """Sanitizes phone numbers to +254... format."""
    if not phone_number:
        return None
    cleaned = re.sub(r'[^\d+]', '', str(phone_number).strip())
    if cleaned.startswith('0'):
        return f"+254{cleaned[1:]}"
    elif cleaned.startswith('254') and not cleaned.startswith('+'):
        return f"+{cleaned}"
    elif not cleaned.startswith('+'):
        return f"+254{cleaned}"
    return cleaned


def send_sms(recipient_phone, message):
    """
    Base SMS dispatch helper using httpSMS REST API.
    """
    formatted_phone = format_kenyan_phone(recipient_phone)
    if not formatted_phone:
        logger.warning("SMS skipped: Invalid phone number.")
        return False, "Invalid phone number"

    # Fetch dynamically from Django Settings or Environment at runtime
    api_key = getattr(settings, 'HTTPSMS_API_KEY', os.getenv('HTTPSMS_API_KEY', ''))
    sender_phone = getattr(settings, 'HTTPSMS_SENDER_PHONE', os.getenv('HTTPSMS_SENDER_PHONE', ''))

    if not api_key:
        logger.error("SMS failed: HTTPSMS_API_KEY is empty or not loaded.")
        return False, "Missing API Key"

    url = "https://api.httpsms.com/v1/messages/send"
    headers = {
        "x-api-key": api_key,
        "Content-Type": "application/json"
    }
    payload = {
        "content": message,
        "from": sender_phone,
        "to": formatted_phone
    }

    try:
        response = requests.post(url, json=payload, headers=headers, timeout=10)
        response.raise_for_status()
        logger.info(f"SMS sent successfully to {formatted_phone}")
        return True, response.json()
    except requests.exceptions.RequestException as e:
        logger.error(f"Failed to send SMS to {formatted_phone}: {str(e)}")
        return False, str(e)


def send_email(subject, plain_message, recipient_list, html_message=None):
    """
    Base Email dispatch helper supporting plain text and HTML content.
    """
    valid_recipients = [email for email in recipient_list if email and '@' in email]
    if not valid_recipients:
        logger.warning("Email skipped: No valid recipient email addresses provided.")
        return False

    try:
        email_msg = EmailMultiAlternatives(
            subject=subject,
            body=plain_message,
            from_email=DEFAULT_FROM_EMAIL,
            to=valid_recipients
        )
        if html_message:
            email_msg.attach_alternative(html_message, "text/html")
        
        email_msg.send(fail_silently=False)
        logger.info(f"Email '{subject}' sent successfully to {valid_recipients}")
        return True
    except Exception as e:
        logger.error(f"Failed to send email '{subject}' to {valid_recipients}: {str(e)}")
        return False


# ==========================================
# BAPTISM NOTIFICATIONS
# ==========================================

def send_welcome_baptism_notifications(baptism):
    """
    Sends welcoming message via Email and SMS after a candidate is baptised.
    """
    sms_message = (
        f"Dear {baptism.full_name}, welcome to the Newlife Church family! "
        f"We celebrate your baptism on {baptism.baptism_date}. God bless your spiritual journey."
    )
    send_sms(baptism.phone, sms_message)

    if baptism.email:
        subject = "Welcome to the Newlife Church Family!"
        email_message = (
            f"Dear {baptism.full_name},\n\n"
            f"Greetings in the name of our Lord Jesus Christ!\n\n"
            f"We are filled with joy to celebrate your baptism on {baptism.baptism_date}, "
            f"officiated by {baptism.officiating_pastor} at {baptism.place_of_baptism}.\n\n"
            f"You are now officially registered in our church register. May God bless and keep you.\n\n"
            f"Blessings,\nNewlife Church Clerk Desk"
        )
        send_email(subject, email_message, [baptism.email])


def send_certificate_reminder_notifications(baptism):
    """
    Sends reminder notification via Email and SMS to pick up baptism certificate.
    """
    sms_message = (
        f"Hello {baptism.full_name}, your baptism certificate is ready for pickup at the Newlife "
        f"Church Clerk desk. Please collect it during clerk office hours or after Sabbath service."
    )
    send_sms(baptism.phone, sms_message)

    if baptism.email:
        subject = "Reminder: Your Baptism Certificate is Ready for Collection"
        email_message = (
            f"Dear {baptism.full_name},\n\n"
            f"This is a gentle reminder that your official baptism certificate is ready for collection "
            f"at the Church Clerk desk.\n\n"
            f"Please visit the desk after Sabbath services or during office hours to pick it up.\n\n"
            f"Blessings,\nNewlife Church Clerk Desk"
        )
        send_email(subject, email_message, [baptism.email])


# ==========================================
# CHILD DEDICATION NOTIFICATIONS
# ==========================================

def send_welcome_dedication_notifications(dedication):
    """
    Sends confirmation message via Email and SMS after a child dedication is recorded.
    """
    parents_name = f"{dedication.father_name} & {dedication.mother_name}".strip(" &")
    sms_message = (
        f"Dear {parents_name or 'Parent/Guardian'}, we rejoice with you on the dedication of baby "
        f"{dedication.child_name} on {dedication.dedication_date}. May God guide your family!"
    )
    send_sms(dedication.phone, sms_message)

    if dedication.email:
        subject = f"Congratulations on the Dedication of {dedication.child_name}!"
        email_message = (
            f"Dear {parents_name or 'Parent/Guardian'},\n\n"
            f"Greetings in the name of our Lord Jesus Christ!\n\n"
            f"We are filled with joy to celebrate the dedication of your child, {dedication.child_name}, "
            f"on {dedication.dedication_date}, officiated by {dedication.officiating_pastor}.\n\n"
            f"May God grant you wisdom and grace as you nurture {dedication.child_name} in His love.\n\n"
            f"Blessings,\nNewlife Church Clerk Desk"
        )
        send_email(subject, email_message, [dedication.email])


def send_dedication_certificate_reminder_notifications(dedication):
    """
    Sends reminder notification via Email and SMS when dedication certificate is ready for pickup.
    """
    parents_name = f"{dedication.father_name} & {dedication.mother_name}".strip(" &")
    sms_message = (
        f"Hello {parents_name or 'Parent'}, the dedication certificate for {dedication.child_name} "
        f"is ready for collection at the Newlife Church Clerk desk."
    )
    send_sms(dedication.phone, sms_message)

    if dedication.email:
        subject = f"Reminder: Dedication Certificate Ready - {dedication.child_name}"
        email_message = (
            f"Dear {parents_name or 'Parent/Guardian'},\n\n"
            f"This is a gentle reminder that the dedication certificate for {dedication.child_name} "
            f"is ready for collection at the Church Clerk desk.\n\n"
            f"Please stop by during church clerk office hours to pick it up.\n\n"
            f"Blessings,\nNewlife Church Clerk Desk"
        )
        send_email(subject, email_message, [dedication.email])


# ==========================================
# MEMBERSHIP TRANSFER NOTIFICATIONS
# ==========================================

def send_transfer_request_notification(transfer):
    """
    Notifies candidate and Church Board/Clerk when a membership transfer (In/Out) is logged.
    """
    transfer_type = getattr(transfer, 'transfer_type', 'Transfer')  # e.g. "Transfer In" or "Transfer Out"
    member_name = getattr(transfer, 'member_name', 'Member')
    phone = getattr(transfer, 'phone', None)
    email = getattr(transfer, 'email', None)

    sms_message = (
        f"Hello {member_name}, your membership {transfer_type} request to/from Newlife Church "
        f"has been received and is currently being processed by the Church Clerk."
    )
    if phone:
        send_sms(phone, sms_message)

    if email:
        subject = f"Membership {transfer_type} Request Received"
        email_message = (
            f"Dear {member_name},\n\n"
            f"Your request for membership {transfer_type} has been logged into the Church Clerk system.\n"
            f"Status: {getattr(transfer, 'status', 'Under Review')}\n\n"
            f"The Church Board will review the recommendation and notify you once approved.\n\n"
            f"Blessings,\nNewlife Church Clerk Desk"
        )
        send_email(subject, email_message, [email])


def send_transfer_status_update(transfer):
    """
    Notifies member when their transfer status changes (e.g. Approved, Second Reading, Completed).
    """
    member_name = getattr(transfer, 'member_name', 'Member')
    status = getattr(transfer, 'status', 'Updated')
    phone = getattr(transfer, 'phone', None)
    email = getattr(transfer, 'email', None)

    sms_message = (
        f"Hello {member_name}, your church membership transfer status has been updated to: {status}."
    )
    if phone:
        send_sms(phone, sms_message)

    if email:
        subject = "Membership Transfer Status Update"
        email_message = (
            f"Dear {member_name},\n\n"
            f"We wish to inform you that your church membership transfer status is now: {status}.\n\n"
            f"If you have any questions, please contact the Church Clerk desk.\n\n"
            f"Blessings,\nNewlife Church Clerk Desk"
        )
        send_email(subject, email_message, [email])


# ==========================================
# ROLE-BASED BROADCAST NOTIFICATIONS
# ==========================================

def send_role_notification(user_emails, user_phones, subject, message, send_sms_flag=False):
    """
    Broadcast helper to alert specific roles (e.g., Elders, Pastors, Department Leaders).
    """
    if user_emails:
        send_email(subject, message, user_emails)

    if send_sms_flag and user_phones:
        for phone in user_phones:
            send_sms(phone, message)