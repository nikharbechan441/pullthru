import os
import csv
import json
import time
import smtplib
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart

PW_PATH = os.path.join(os.environ.get('LOCALAPPDATA', os.path.expanduser('~')), 'TaxCleanZA_Data', '.gmail_app_password')
CSV_PATH = r"marketing\outreach\prospects.csv"
LEDGER_PATH = r"marketing\outreach\sent_outreach_ledger.json"

if not os.path.exists(PW_PATH):
    print("Error: Password file not found.")
    exit(1)

with open(PW_PATH, "r", encoding="utf-8") as f:
    pw = f.read().strip()

BATCH_4 = [
    {
        "id": "162",
        "venue": "In 2 Touch Cape Town (Century City & Villagers)",
        "contact_name": "In 2 Touch Team",
        "email": "capetown@touchrugby.co.za",
        "location": "Century City & Claremont, Cape Town",
        "vertical": "Touch Rugby Leagues",
        "subject": "quick question re: league team fee collection at In 2 Touch",
        "body": """Hi Team,

Hope the touch season is going well.

Reaching out because I built a small local tool called PullThru (https://pullthru.co.za) to stop the headache team captains face every week.

How often do team captains at In 2 Touch struggle to get 10 or 12 players to transfer their league fee share on time before the fixture?

With PullThru:
- The captain creates a match link in about 15 seconds and drops it in the team WhatsApp group.
- Players tap the link and lock in their share via Direct PayShap or Capitec Pay (R0 guest fees, no app download).
- Once the team fee is fully funded, you get paid in one clean lump sum instead of matching 10 random EFT references.

100% free for squads up to 30 players. 

If this would be useful for your league captains, happy to send a quick link you can test. Either way, keep up the great work with the leagues!

Cheers,
Nikhar Bechan
PullThru — https://pullthru.co.za"""
    },
    {
        "id": "163",
        "venue": "Hamilton Touch Rugby Club (Hammies Touch)",
        "contact_name": "Hammies Touch Team",
        "email": "info@hammiestouch.co.za",
        "location": "Green Point, Cape Town",
        "vertical": "Touch Rugby Leagues",
        "subject": "quick question re: social team fee splits at Hamiltons",
        "body": """Hi Team,

Hope the fixtures at Green Point are going well.

I built a local South African web tool called PullThru (https://pullthru.co.za) specifically for social sports teams and squad splits.

Every captain organizing 8 to 12 players knows the drill: guys say they're in, but someone forgets to EFT and the captain gets stuck fronting the money.

PullThru lets captains drop a 1-tap link in their WhatsApp group so players lock in their spot via Direct PayShap, Capitec Pay, or card with R0 guest fees. The captain gets an exact live roster, and your venue receives the full team fee in one go.

100% free for squads up to 30 players. 

Would love to know if this would be helpful for your team captains.

Cheers,
Nikhar Bechan
PullThru — https://pullthru.co.za"""
    },
    {
        "id": "164",
        "venue": "Aura Padel Club",
        "contact_name": "Aura Padel Team",
        "email": "info@aurapadel.co.za",
        "location": "Montague Gardens & Woodstock, Cape Town",
        "vertical": "Padel Club",
        "subject": "quick question re: padel court fee splits at Aura Padel",
        "body": """Hi Team,

Hope the courts at Montague Gardens and Woodstock are buzzing.

I built a local tool called PullThru (https://pullthru.co.za) specifically for South African padel 4-balls and casual tournaments.

When 4 players book a court, one player usually ends up fronting the full R400-R600 fee and chasing the other 3 for R100/R150 EFTs on WhatsApp.

With PullThru:
- The host creates a 4-ball link in 10 seconds and shares it on WhatsApp.
- Players lock in their spot via PayShap, Capitec Pay, or card with R0 guest fees.
- Enforces a simple rule: "No Pay, No Name on the Squad Wall."

It's 100% free forever for padel 4-balls. 

If this would make court booking easier for your members, feel free to check out https://pullthru.co.za/5-a-side-and-padel. 

Cheers,
Nikhar Bechan
PullThru — https://pullthru.co.za"""
    },
    {
        "id": "165",
        "venue": "PadelX Somerset West",
        "contact_name": "PadelX Team",
        "email": "info@padelx.co.za",
        "location": "Somerset West, Western Cape",
        "vertical": "Padel Club",
        "subject": "quick question re: 4-ball court splits at PadelX",
        "body": """Hi Team,

Hope things are going great at the Somerset West courts.

I built a South African web tool called PullThru (https://pullthru.co.za) to solve the classic padel friction: one person booking the court and having to chase 3 mates for their share.

With PullThru, players lock in their spot in 1 tap via Direct PayShap or Capitec Pay with R0 guest fees and zero app download. 

It's completely free for padel 4-balls. 

If this would be helpful to share with your regular players or members, you can test it in 15 seconds at https://pullthru.co.za/5-a-side-and-padel.

Cheers,
Nikhar Bechan
PullThru — https://pullthru.co.za"""
    },
    {
        "id": "166",
        "venue": "The Glen Country Club (Clifton Bowls & Padel)",
        "contact_name": "Grant",
        "email": "grant@glenclub.co.za",
        "location": "Clifton, Cape Town",
        "vertical": "Country Club & Padel",
        "subject": "quick question re: social group & court splits at The Glen",
        "body": """Hi Grant,

Hope you're having a good week at Clifton.

Reaching out because I built a local South African tool called PullThru (https://pullthru.co.za) for group social events, bowls days, and padel 4-balls.

Whenever a group organizes a casual bowls afternoon, braai, or padel game, one person usually ends up fronting the venue cost and chasing friends on WhatsApp to pay back their share.

PullThru gives organizers a 1-tap WhatsApp roll-call link where guests lock in their spot and split the kitty via PayShap, Capitec Pay, or card with R0 guest fees.

100% free for squads up to 30 people. 

Would love to know if this would be useful for your members and social event organizers.

Cheers,
Nikhar Bechan
PullThru — https://pullthru.co.za"""
    },
    {
        "id": "167",
        "venue": "Action Sports Brackenfell",
        "contact_name": "Brackenfell Arena Team",
        "email": "info@brackenfellarena.co.za",
        "location": "Brackenfell, Cape Town",
        "vertical": "Action Sports (Soccer / Netball / Cricket)",
        "subject": "quick question re: action soccer team fee collection in Brackenfell",
        "body": """Hi Team,

Hope the league nights in Brackenfell are packed.

I built a South African tool called PullThru (https://pullthru.co.za) specifically to help action sports captains stop acting like unpaid debt collectors for their teams.

How often does an action soccer or netball captain pitch up short because two players haven't paid their match fees yet?

PullThru lets captains create a match link in 15 seconds and drop it in their team WhatsApp group. Players tap and lock in their share via Direct PayShap or Capitec Pay (R0 guest fees). The captain gets an exact live roster, and your arena gets paid on time.

100% free for squads up to 30 players. 

If this would make life easier for your league captains, happy to share a quick link you can check out.

Cheers,
Nikhar Bechan
PullThru — https://pullthru.co.za"""
    },
    {
        "id": "168",
        "venue": "Epic Padel",
        "contact_name": "Epic Padel Team",
        "email": "admin@epicpadel.co.za",
        "location": "Cape Town & Gauteng",
        "vertical": "Padel Club",
        "subject": "quick question re: 4-ball player splits at Epic Padel",
        "body": """Hi Team,

Hope the courts are buzzing.

I built a local tool called PullThru (https://pullthru.co.za) to stop the classic padel friction where one player fronts the court fee and has to chase 3 friends on WhatsApp for R100 EFTs.

PullThru lets players lock in their spot via PayShap, Capitec Pay, or card in one tap with zero guest fees and no app download. 

100% free forever for padel 4-balls. 

If this would be useful for your players, you can test a live match split link in 15 seconds at https://pullthru.co.za/5-a-side-and-padel.

Cheers,
Nikhar Bechan
PullThru — https://pullthru.co.za"""
    },
    {
        "id": "169",
        "venue": "Wingate Park Country Club Padel",
        "contact_name": "Wingate CC Team",
        "email": "admin@wingatecc.co.za",
        "location": "Pretoria",
        "vertical": "Country Club & Padel",
        "subject": "quick question re: padel & social group splits at Wingate Park",
        "body": """Hi Team,

Hope things are going great at Wingate Park.

I built a South African web tool called PullThru (https://pullthru.co.za) for padel 4-balls and social club events.

Whenever members organize a padel game, tournament, or squad braai, the organizer usually gets stuck fronting the money while chasing EFTs on WhatsApp. PullThru solves that with a 1-tap roll-call link where players lock in their spot via Direct PayShap or Capitec Pay with R0 guest fees.

100% free for groups up to 30 people. 

Would love to know if this would be useful for your club members.

Cheers,
Nikhar Bechan
PullThru — https://pullthru.co.za"""
    },
    {
        "id": "170",
        "venue": "Rockets Padel Club",
        "contact_name": "Brandon",
        "email": "brandon@rocketsclub.co.za",
        "location": "Ballito & Gauteng",
        "vertical": "Padel Club",
        "subject": "quick question re: court fee splits at Rockets Padel",
        "body": """Hi Brandon,

Hope the courts at Rockets are buzzing.

I built a local web tool called PullThru (https://pullthru.co.za) specifically for South African padel 4-balls and Americano socials.

It stops the headache where one player books the court and has to chase 3 mates for R150 EFTs on WhatsApp. Players lock in their spot in 1 tap via Direct PayShap or Capitec Pay with R0 guest fees.

100% free for padel 4-balls. 

If this would be helpful for your players, feel free to check out https://pullthru.co.za/5-a-side-and-padel.

Cheers,
Nikhar Bechan
PullThru — https://pullthru.co.za"""
    },
    {
        "id": "171",
        "venue": "Pro Padel Durban",
        "contact_name": "Pro Padel Team",
        "email": "info@pro-padel.co.za",
        "location": "Durban, KZN",
        "vertical": "Padel Club",
        "subject": "quick question re: padel 4-ball splits in Durban",
        "body": """Hi Team,

Hope the courts in Durban are going strong.

I built a local tool called PullThru (https://pullthru.co.za) for South African padel players to split court fees instantly.

Instead of one player paying the full fee upfront and chasing friends for R100/R150 EFTs, PullThru lets them drop a 1-tap link in their WhatsApp group. Friends lock in their share via Direct PayShap, Capitec Pay, or card with R0 guest fees and zero app download.

100% free for padel 4-balls. 

Would love to know if this would be useful for your regular players.

Cheers,
Nikhar Bechan
PullThru — https://pullthru.co.za"""
    }
]

print(f"Starting Batch 4 dispatch to {len(BATCH_4)} verified South African venues...")

# Load ledger to update
with open(LEDGER_PATH, "r", encoding="utf-8") as f:
    ledger = json.load(f)

contacted_emails = set(ledger.get("contacted_emails", []))
contacted_domains = set(ledger.get("contacted_domains", []))

sent_count = 0
failed_count = 0

with smtplib.SMTP_SSL("smtp.gmail.com", 465, timeout=20) as server:
    server.login("sales@taxcleanza.com", pw)
    
    for item in BATCH_4:
        target_email = item["email"]
        domain = target_email.split("@")[1].lower()
        
        if target_email in contacted_emails or domain in contacted_domains:
            print(f"[GUARD SKIP] {target_email} is already in ledger!")
            continue

        msg = MIMEMultipart()
        msg["From"] = "Nikhar Bechan <sales@taxcleanza.com>"
        msg["To"] = target_email
        msg["Reply-To"] = "sales@taxcleanza.com"
        msg["Subject"] = item["subject"]
        msg.attach(MIMEText(item["body"], "plain", "utf-8"))

        try:
            server.sendmail("sales@taxcleanza.com", [target_email], msg.as_string())
            print(f"[SENT {sent_count+1}/10] Successfully sent to {target_email} ({item['venue']})")
            
            contacted_emails.add(target_email)
            contacted_domains.add(domain)
            sent_count += 1
            
            # Append to prospects.csv
            with open(CSV_PATH, "a", newline="", encoding="utf-8") as cf:
                writer = csv.writer(cf)
                writer.writerow([
                    item["id"],
                    item["venue"],
                    item["contact_name"],
                    item["email"],
                    "",
                    item["location"],
                    item["vertical"],
                    item["subject"],
                    f"Sent ({time.strftime('%Y-%m-%d %H:%M')})"
                ])
                
            time.sleep(3) # Polite 3s interval between dispatches
        except Exception as e:
            print(f"[FAILED] Could not send to {target_email}: {e}")
            failed_count += 1

# Update ledger
ledger["contacted_emails"] = sorted(list(contacted_emails))
ledger["contacted_domains"] = sorted(list(contacted_domains))
ledger["last_synced"] = time.strftime("%Y-%m-%d %H:%M:%S")

with open(LEDGER_PATH, "w", encoding="utf-8") as f:
    json.dump(ledger, f, indent=2)

print(f"\n==========================================")
print(f"DISPATCH COMPLETE: {sent_count} sent, {failed_count} failed.")
print(f"Ledger and prospects.csv successfully updated.")
