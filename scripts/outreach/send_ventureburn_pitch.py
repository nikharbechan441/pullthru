import smtplib
from email.message import EmailMessage

PW_PATH = r"C:\Users\arvin\OneDrive\Desktop\TaxClean - AntiGravity\.gmail_app_password"
with open(PW_PATH, "r", encoding="utf-8") as f:
    pw = f.read().strip().replace(" ", "")

subject = "Built a local tool to stop the WhatsApp 5-a-side & braai money chase (PullThru)"
body = """Hi there,

Hope your week is going well.

I’m a local developer and I’ve spent the last few weeks building a web tool called PullThru (https://pullthru.co.za) after getting burned one too many times organizing weekly 5-a-side soccer games and weekend braais.

If you’ve ever organized a group activity in SA, you know the drill: 12 people say they’re in on Monday, you front the court fee or buy the meat on your own card, and by Thursday afternoon two guys ghost and someone says "Eish, I'll Capitec you after payday."

I built PullThru so organizers don't have to act like unpaid debt collectors for their friends:
- You create an event link in about 20 seconds and drop it in the WhatsApp group.
- Friends tap the link and lock their spot via Capitec Pay, PayShap, Apple Pay, or card (no app download or registration needed).
- Once the spots are full (e.g., 10 players for soccer), the link closes automatically so nobody can bail last minute.
- It routes 100% of the money straight to the host's SA bank account with zero host fees.

I also added a free Braai Meat & Ice Calculator (https://pullthru.co.za/braai-calculator) that works out the exact kg of wors, chops, and ice bags needed for a group size and turns it into a kitty link.

Thought this might be a fun, relatable local startup story for Ventureburn readers. Happy to answer any questions or send over screenshots if you'd like to take a look.

Cheers,

Nikhar Bechan
Founder, PullThru
https://pullthru.co.za
support@pullthru.co.za
076 806 3638"""

msg = EmailMessage()
msg["Subject"] = subject
msg["From"] = "Nikhar Bechan - PullThru <support@pullthru.co.za>"
msg["Reply-To"] = "Nikhar Bechan <support@pullthru.co.za>"
msg["To"] = "editor@ventureburn.com"
msg.set_content(body)

with smtplib.SMTP_SSL("smtp.gmail.com", 465, timeout=30) as server:
    server.login("sales@taxcleanza.com", pw)
    server.send_message(msg, from_addr="support@pullthru.co.za", to_addrs=["editor@ventureburn.com"])

print("SENT_SUCCESSFULLY")
