import smtplib
import ssl
import json
import os
import sys
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
from email.utils import formatdate, make_msgid

sys.stdout.reconfigure(encoding='utf-8')

vault_path = os.path.expandvars(r'%LOCALAPPDATA%\TaxCleanZA_Data\credentials_vault.json')
with open(vault_path) as f:
    vault = json.load(f)

sender_email = 'sales@taxcleanza.com'
sender_name = 'Nikhar Bechan'
password = vault.get('gmail_app_password_sales')

recipient_email = 'marketing@ceresadventures.co.za'
recipient_name = 'Angelique le Roux'

subject = 'RE: Helping group organisers confirm their Ceres Zipline bookings'

in_reply_to = '<002601dd6f66$e49b8e50$add2aaf0$@ceresadventures.co.za>'

body = """Good afternoon Angelique,

Thank you for the prompt reply. You are completely right — the last thing your reservations desk needs is another isolated portal that requires manual data entry or duplicate payment reconciliation.

Here is how PullThru handles this, and why it does not introduce duplicate admin for your team:

1. The Upstream Group Workflow (Zero setup required for Ceres):
When an organiser contacts Ceres wanting to book a tour for 8 to 12 people, they are often delayed because they cannot front R5,500 on their own card and have to chase friends on WhatsApp for EFTs. 

Instead of your desk holding slots for unconfirmed groups or dealing with multiple split payments:
• You (or the organiser) use a single coordination link: https://pullthru.co.za/e/ceres-zipline-squad-tour
• Each participant locks in their spot and pays their R550 share via Capitec Pay, PayShap, Apple Pay, or card.
• The moment all 10 spots are paid, the organiser settles the full booking directly into your existing website Activitar checkout in one single transaction.
• Result: Your desk receives a single, fully paid Activitar booking with zero manual follow-up or duplicate accounting entries.

2. Direct Activitar API Integration:
Activitar provides standard REST API endpoints (/api/Bookings/Reserve and /api/Bookings/Confirm). For high-volume tour partners, PullThru can hook directly into your Activitar inventory using your API credentials to automatically hold the provisional slot while the squad chips in, and confirm the reservation directly inside your Activitar dashboard the moment the final guest pays.

I put together a quick live demo showing how a Ceres 10-person group coordination link looks and operates:
👉 https://pullthru.co.za/e/ceres-zipline-squad-tour

Please take a look at the link when you have a moment. If this workflow looks like a good fit for handling your larger group inquiries for the upcoming season, let me know your thoughts via email.

Tourism regards,

Nikhar Bechan
Founder, PullThru SA
https://pullthru.co.za | sales@taxcleanza.com
"""

msg = MIMEMultipart('alternative')
msg['From'] = f'{sender_name} <{sender_email}>'
msg['To'] = f'{recipient_name} <{recipient_email}>'
msg['Subject'] = subject
msg['Date'] = formatdate(localtime=True)
msg['Message-ID'] = make_msgid(domain='taxcleanza.com')
msg['In-Reply-To'] = in_reply_to
msg['References'] = in_reply_to

msg.attach(MIMEText(body, 'plain', 'utf-8'))

context = ssl.create_default_context()
with smtplib.SMTP_SSL('smtp.gmail.com', 465, context=context) as server:
    server.login(sender_email, password)
    server.sendmail(sender_email, [recipient_email], msg.as_string())

print("SUCCESS: Email sent successfully to", recipient_email)
