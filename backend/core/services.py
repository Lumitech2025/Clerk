import os
import requests
from django.core.mail import send_mail
from django.conf import settings

HTTPSMS_API_KEY = getattr(settings, 'HTTPSMS_API_KEY', os.getenv('HTTPSMS_API_KEY', 'your-api-key'))
HTTPSMS_SENDER_PHONE = getattr(settings, 'HTTPSMS_SENDER_PHONE', os.getenv('HTTPSMS_SENDER_PHONE', '+254700000000'))

def send_sms_via_httpsms(recipient_phone, message):
    """
    Sends SMS using HttpSMS REST API.
    """
    url = "https://api.httpsms.com/v1/messages/send"
    headers = {
        "x-api-key": HTTPSMS_API_KEY,
        "Content-Type": "application/json"
    }
    payload = {
        "content": message,
        "from": HTTPSMS_SENDER_PHONE,
        "to": recipient_phone
    }
    try:
        response = requests.post(url, json=payload, headers=headers, timeout=10)
        response.raise_for_status()
        return True, response.json()
    except requests.exceptions.RequestException as e:
        print(f"Error sending HttpSMS: {e}")
        return False, str(e)


def send_welcome_baptism_notifications(baptism):
    """
    Sends initial welcoming message via Email and SMS after a candidate is baptised.
    """
    sms_message = (
        f"Dear {baptism.full_name}, welcome to Newlife Church family! "
        f"We celebrate your baptism on {baptism.baptism_date}. God bless your journey."
    )
    send_sms_via_httpsms(baptism.phone, sms_message)

    if baptism.email:
        subject = "Welcome to the Newlife Church Family!"
        email_message = (
            f"Dear {baptism.full_name},\n\n"
            f"Greetings in the name of our Lord Jesus Christ!\n\n"
            f"We are filled with joy to celebrate your baptism on {baptism.baptism_date} "
            f"officiated by {baptism.officiating_pastor} at {baptism.place_of_baptism}.\n\n"
            f"Welcome to the Newlife Church family.\n\n"
            f"Blessings,\nNewlife Church Clerk Desk"
        )
        try:
            send_mail(
                subject,
                email_message,
                settings.DEFAULT_FROM_EMAIL,
                [baptism.email],
                fail_silently=True
            )
        except Exception as e:
            print(f"Error sending email: {e}")


def send_certificate_reminder_notifications(baptism):
    """
    Sends reminder message via Email and SMS to pick up baptism certificate.
    """
    sms_message = (
        f"Hello {baptism.full_name}, your baptism certificate is ready for pickup at the Newlife "
        f"Church Clerk desk. Please collect it during working hours."
    )
    send_sms_via_httpsms(baptism.phone, sms_message)

    if baptism.email:
        subject = "Reminder: Your Baptism Certificate is Ready for Collection"
        email_message = (
            f"Dear {baptism.full_name},\n\n"
            f"This is a gentle reminder that your baptism certificate is now ready for collection "
            f"at the Church Clerk desk.\n\n"
            f"Please stop by during church clerk office hours to collect your certificate.\n\n"
            f"Blessings,\nNewlife Church Clerk Desk"
        )
        try:
            send_mail(
                subject,
                email_message,
                settings.DEFAULT_FROM_EMAIL,
                [baptism.email],
                fail_silently=True
            )
        except Exception as e:
            print(f"Error sending email reminder: {e}")



def send_welcome_dedication_notifications(dedication):
    """
    Sends welcoming/confirmation message via Email and SMS after a child dedication is recorded.
    """
    sms_message = (
        f"Dear {dedication.father_name} & {dedication.mother_name}, "
        f"we rejoice with you on the dedication of baby {dedication.child_name} "
        f"on {dedication.dedication_date}. May God guide your family!"
    )
    send_sms_via_httpsms(dedication.phone, sms_message)

    if dedication.email:
        subject = f"Congratulations on the Dedication of {dedication.child_name}!"
        email_message = (
            f"Dear {dedication.father_name} & {dedication.mother_name},\n\n"
            f"Greetings in the name of our Lord Jesus Christ!\n\n"
            f"We are filled with joy to celebrate the dedication of your child, {dedication.child_name}, "
            f"on {dedication.dedication_date}, officiated by {dedication.officiating_pastor}.\n\n"
            f"May God grant you wisdom and grace as you raise {dedication.child_name} in His love.\n\n"
            f"Blessings,\nNewlife Church Clerk Desk"
        )
        try:
            send_mail(
                subject,
                email_message,
                settings.DEFAULT_FROM_EMAIL,
                [dedication.email],
                fail_silently=True
            )
        except Exception as e:
            print(f"Error sending dedication email: {e}")


def send_dedication_certificate_reminder_notifications(dedication):
    """
    Sends reminder notification via Email and SMS when dedication certificate is ready for pickup.
    """
    sms_message = (
        f"Hello {dedication.father_name}, the dedication certificate for {dedication.child_name} "
        f"is ready for collection at the Newlife Church Clerk desk."
    )
    send_sms_via_httpsms(dedication.phone, sms_message)

    if dedication.email:
        subject = f"Reminder: Dedication Certificate Ready - {dedication.child_name}"
        email_message = (
            f"Dear {dedication.father_name} & {dedication.mother_name},\n\n"
            f"This is a gentle reminder that the dedication certificate for {dedication.child_name} "
            f"is now ready for collection at the Church Clerk desk.\n\n"
            f"Please stop by during church clerk office hours to pick it up.\n\n"
            f"Blessings,\nNewlife Church Clerk Desk"
        )
        try:
            send_mail(
                subject,
                email_message,
                settings.DEFAULT_FROM_EMAIL,
                [dedication.email],
                fail_silently=True
            )
        except Exception as e:
            print(f"Error sending dedication certificate reminder email: {e}")