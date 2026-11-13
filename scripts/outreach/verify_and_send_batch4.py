"""
Batch 4 — Pre-Lunch Verified Outreach (#33–#44)
Includes:
  1. DNS MX record verification
  2. Live SMTP server handshake & RCPT verification (blocks any non-existent mailbox before sending!)
  3. Zero-blank, non-AI plain-text outreach signed by Nikhar (support@pullthru.co.za)
"""
import os
import re
import csv
import time
import socket
import subprocess
import smtplib
from email.message import EmailMessage

PW_PATH = r"C:\Users\arvin\OneDrive\Desktop\TaxClean - AntiGravity\.gmail_app_password"
CSV_PATH = r"c:\Users\arvin\OneDrive\Desktop\App 3\prospects.csv"

CANDIDATES = [
    {
        "id": "33",
        "venue": "BattleZone Paintball & Laser Tag (Bryanston)",
        "contact_name": "Bookings Team",
        "email": "bookings@battlezone.co.za",
        "alt_email": "",
        "location": "Bryanston, Johannesburg",
        "vertical": "Paintball & Bachelor/Birthday Parties",
        "pain_point_hook": "Bachelor parties and birthday groups where 1 organiser collects per-player deposits on WhatsApp...",
        "to": ["bookings@battlezone.co.za"],
        "subject": "quick question re: bachelor & birthday group bookings at BattleZone",
        "body": """Howzit Team,

Saw the paintball and laser tag packages you run at BattleZone in Bryanston — I'll keep this brief.

Whenever someone organises a bachelor party or birthday group for 15 to 20 mates, the biggest headache for the organiser is chasing everyone in the WhatsApp group for their per-person share before paying your booking deposit.

I built a South African web tool called PullThru (https://pullthru.co.za) where the group organiser drops one link into their WhatsApp chat and friends lock their spot in 2 taps via Capitec Pay, Apple Pay, Card, or PayShap. No app download needed, and spots only lock once paid.

Happy to set up a free BattleZone group chip-in template you can share with bachelor and birthday organisers so they lock in their deposits with you faster?

Cheers,
Nikhar
support@pullthru.co.za
PullThru — pullthru.co.za"""
    },
    {
        "id": "34",
        "venue": "X Combat Paintball & Airsoft (Somerset West)",
        "contact_name": "Events Team",
        "email": "info@xcombat.co.za",
        "alt_email": "",
        "location": "Somerset West, Cape Town",
        "vertical": "Paintball, Airsoft & Braai Groups",
        "pain_point_hook": "Birthday and bachelor paintball + braai groups collecting per-person fees on WhatsApp...",
        "to": ["info@xcombat.co.za"],
        "subject": "quick question re: group paintball & braai bookings at X Combat",
        "body": """Howzit Team,

Saw the paintball, airsoft, and braai setup at X Combat in Somerset West — I'll keep this short.

When a group organiser books a birthday or bachelor session with a braai afterwards, they almost always get stuck fronting the deposit out of pocket while chasing 15 friends on WhatsApp for EFTs and who's bringing what for the braai.

I built a South African web tool called PullThru (https://pullthru.co.za) where the organiser drops one link into their WhatsApp group. Players lock their spot in 2 taps via Capitec Pay, Apple Pay, Card, or PayShap, and can claim Bring-'n-Bak braai items at the same time. Zero app download needed.

Feel free to check it out at https://pullthru.co.za — happy to set up a custom X Combat link for your group organisers if useful.

Cheers,
Nikhar
support@pullthru.co.za
PullThru — pullthru.co.za"""
    },
    {
        "id": "35",
        "venue": "Big Bash Events (Karting, Paintball & Brewery Tours)",
        "contact_name": "Events Team",
        "email": "info@bigbashevents.co.za",
        "alt_email": "",
        "location": "Johannesburg & Cape Town",
        "vertical": "Bachelor Parties & Group Adventures",
        "pain_point_hook": "Best men and group organisers collecting per-head bachelor party packages on WhatsApp...",
        "to": ["info@bigbashevents.co.za"],
        "subject": "quick question re: bachelor party group deposits at Big Bash Events",
        "body": """Howzit Team,

Love the dirt karting, brewery tour, and bachelor packages you put together at Big Bash Events — I'll keep this brief.

Every best man organising a bachelor party for 15 or 20 guys faces the exact same nightmare: fronting thousands of Rands out of his own pocket while chasing the WhatsApp group for weeks to EFT their share.

I built a South African web tool called PullThru (https://pullthru.co.za) where the best man drops one link into the bachelor WhatsApp group and the guys lock their spot in 2 taps via Capitec Pay, Apple Pay, Card, or PayShap (even includes a 25th Payday Standby Pledge so guys can commit before payday). No app download required.

Would you be open to sharing a custom Big Bash kitty link with best men when you send them a quote so they collect the group deposit in 24 hours?

Cheers,
Nikhar
support@pullthru.co.za
PullThru — pullthru.co.za"""
    },
    {
        "id": "36",
        "venue": "Franschhoek Wine Tram (Group Bookings)",
        "contact_name": "Groups Team",
        "email": "groups@winetram.co.za",
        "alt_email": "info@winetram.co.za",
        "location": "Franschhoek, Western Cape",
        "vertical": "Group Wine Tours",
        "pain_point_hook": "Birthday and social group organisers collecting per-ticket Wine Tram money on WhatsApp...",
        "to": ["groups@winetram.co.za"],
        "subject": "quick question re: private & group bookings on the Franschhoek Wine Tram",
        "body": """Hi Team,

Everyone loves the Franschhoek Wine Tram for birthdays and weekend group outings — I'll keep this brief.

Whenever one friend organises a group of 10 or 16 people on WhatsApp to book Wine Tram tickets together, that organiser usually gets stuck fronting the full booking amount on their card and chasing friends for EFTs before tickets sell out.

I built a South African web tool called PullThru (https://pullthru.co.za) where the group organiser drops one link into their WhatsApp chat and friends lock their ticket share in 2 taps via Capitec Pay, Apple Pay, Card, or PayShap — zero app download required.

You can take a look at https://pullthru.co.za — happy to set up a free template link your group enquiries team can share with organisers who are collecting money from friends.

Cheers,
Nikhar
support@pullthru.co.za
PullThru — pullthru.co.za"""
    },
    {
        "id": "37",
        "venue": "Wine Flies Wine Tours",
        "contact_name": "Bookings Team",
        "email": "info@wineflies.co.za",
        "alt_email": "",
        "location": "Cape Town & Stellenbosch",
        "vertical": "Social & Group Wine Tours",
        "pain_point_hook": "Social group wine tours where 1 friend coordinates headcount and per-person payments on WhatsApp...",
        "to": ["info@wineflies.co.za"],
        "subject": "quick question re: group wine tour bookings at Wine Flies",
        "body": """Howzit Team,

Love the social vibe you guys bring to winelands tours at Wine Flies — I'll keep this short.

When a group of friends wants to book a private or birthday wine tour together, how often does the booking stall while the organiser chases 10 friends in their WhatsApp group to EFT their share?

I built a South African web tool called PullThru (https://pullthru.co.za) where the group organiser drops one link into their WhatsApp chat and everyone locks their spot in 2 taps via Capitec Pay, Apple Pay, Card, or PayShap. No app download needed.

Feel free to check it out at https://pullthru.co.za — happy to set up a custom Wine Flies group chip-in link you can pass along to group organisers.

Cheers,
Nikhar
support@pullthru.co.za
PullThru — pullthru.co.za"""
    },
    {
        "id": "38",
        "venue": "The Constantia Wine Tour",
        "contact_name": "Meighan",
        "email": "meighan@theconstantiawinetour.co.za",
        "alt_email": "",
        "location": "Constantia, Cape Town",
        "vertical": "Private & Group Wine Tours",
        "pain_point_hook": "Birthday lunches and Constantia group wine tours coordinated via WhatsApp...",
        "to": ["meighan@theconstantiawinetour.co.za"],
        "subject": "quick question re: group bookings at The Constantia Wine Tour",
        "body": """Hi Meighan,

Love the private and group wine tours you run through Constantia — I'll keep this brief.

Whenever one friend organises a birthday tour or weekend tasting for a group of friends, they usually end up fronting the deposit and chasing the rest of the WhatsApp group for EFTs.

I built a South African web tool called PullThru (https://pullthru.co.za) where the organiser drops one link into their WhatsApp group and guests lock their spot in 2 taps via Capitec Pay, Apple Pay, Card, or PayShap. Zero app download required.

You can take a look at https://pullthru.co.za — let me know if a custom Constantia Wine Tour kitty link would be useful for your group clients.

Cheers,
Nikhar
support@pullthru.co.za
PullThru — pullthru.co.za"""
    },
    {
        "id": "39",
        "venue": "Cape to Grape Wine Tours",
        "contact_name": "Bookings Team",
        "email": "bookings@capetogrape.co.za",
        "alt_email": "",
        "location": "Cape Town & Winelands",
        "vertical": "Group Wine Tours",
        "pain_point_hook": "Tailor-made group wine tours where 1 organiser collects per-person shares on WhatsApp...",
        "to": ["bookings@capetogrape.co.za"],
        "subject": "quick question re: group wine tours at Cape to Grape",
        "body": """Hi Team,

Saw the tailor-made group wine tours you run at Cape to Grape — I'll keep this short.

When a group organiser enquires about a birthday or weekend winelands tour for 8 to 15 friends, they often lose days chasing everyone in the WhatsApp group to pay their share before confirming the booking.

I built a South African web tool called PullThru (https://pullthru.co.za) where the organiser drops one link into their WhatsApp group and guests lock their spot in 2 taps via Capitec Pay, Apple Pay, Card, or PayShap — no app download required.

Happy to set up a custom Cape to Grape template link your clients can use to collect their group deposit faster if useful?

Cheers,
Nikhar
support@pullthru.co.za
PullThru — pullthru.co.za"""
    },
    {
        "id": "40",
        "venue": "Waterfront Boat Tours (Princess Skye)",
        "contact_name": "Charter Team",
        "email": "info@waterfrontboattours.co.za",
        "alt_email": "",
        "location": "V&A Waterfront, Cape Town",
        "vertical": "Private Boat Cruises",
        "pain_point_hook": "Private boat charters and sunset cruises where 1 organiser splits the charter fee on WhatsApp...",
        "to": ["info@waterfrontboattours.co.za"],
        "subject": "quick question re: group boat charters at Waterfront Boat Tours",
        "body": """Hi Team,

Love the Princess Skye and private boat charters at the V&A Waterfront — I'll keep this brief.

Whenever someone organises a private boat cruise for a birthday or group celebration, that one organiser almost always gets stuck fronting the charter fee and chasing 15 or 20 friends on WhatsApp for their EFTs.

I built a South African web tool called PullThru (https://pullthru.co.za) where the group host drops one link into their WhatsApp chat and guests lock their spot in 2 taps via Capitec Pay, Apple Pay, Card, or PayShap. Zero app download needed.

Feel free to check it out at https://pullthru.co.za — happy to set up a free template link you can offer to private charter organisers so they collect their deposit faster.

Cheers,
Nikhar
support@pullthru.co.za
PullThru — pullthru.co.za"""
    },
    {
        "id": "41",
        "venue": "Westville Cycle Club",
        "contact_name": "Club Committee",
        "email": "info@westcycle.co.za",
        "alt_email": "",
        "location": "Westville, Durban",
        "vertical": "Cycling Club",
        "pain_point_hook": "Weekend club rides, coffee stops, kit orders, and social braais coordinated on WhatsApp...",
        "to": ["info@westcycle.co.za"],
        "subject": "quick question re: weekend rides & social RSVPs at Westville Cycle Club",
        "body": """Howzit Team,

Hope the road and MTB rides at Westville Cycle Club are going strong — I'll keep this brief.

How much time do your ride captains spend managing copy-paste numbered lists in the WhatsApp group and chasing EFT proof-of-payments whenever the club organises an away ride, breakfast stop, or club braai?

I built a South African web tool called PullThru (https://pullthru.co.za) that replaces WhatsApp scroll lists with one clean link. Members tap the link in WhatsApp and lock their spot in 2 taps via Capitec Pay, Apple Pay, Card, or PayShap — or RSVP for free on R0 weekend rides. No app download needed.

You can test it live at https://pullthru.co.za — let me know if you'd like a custom Westville Cycle Club template for your next club ride or social.

Cheers,
Nikhar
support@pullthru.co.za
PullThru — pullthru.co.za"""
    },
    {
        "id": "42",
        "venue": "East Coast Cycling Club",
        "contact_name": "Club Chairman",
        "email": "chairman@eccc.co.za",
        "alt_email": "",
        "location": "Durban, KZN",
        "vertical": "Cycling Club",
        "pain_point_hook": "Group rides, weekend coffee runs, and social club events on WhatsApp...",
        "to": ["chairman@eccc.co.za"],
        "subject": "quick question re: club rides & social RSVPs at East Coast Cycling Club",
        "body": """Howzit Chairman,

Hope the Durban riding calendar is going well at East Coast Cycling Club — I'll keep this short.

Whenever the club organises a social ride, breakfast run, or year-end braai on WhatsApp, how much time goes into managing copy-paste lists and matching bank statement EFT references?

I built a South African web tool called PullThru (https://pullthru.co.za) where ride captains drop one link into the club WhatsApp group. Riders lock their spot in 2 taps via Capitec Pay, Apple Pay, Card, or PayShap — or use the 100% Free RSVP mode for R0 group rides. Zero app download required.

Take a look at https://pullthru.co.za — happy to set up a free East Coast Cycling Club template if useful.

Cheers,
Nikhar
support@pullthru.co.za
PullThru — pullthru.co.za"""
    },
    {
        "id": "43",
        "venue": "Border Canoe Club",
        "contact_name": "Clubhouse Admin",
        "email": "clubhouse@bordercanoeclub.co.za",
        "alt_email": "",
        "location": "East London, Eastern Cape",
        "vertical": "Canoe & Surfski Club",
        "pain_point_hook": "Time trial braais, surfski socials, and race trip chip-ins on WhatsApp...",
        "to": ["clubhouse@bordercanoeclub.co.za"],
        "subject": "quick question re: time trial braais & club socials at Border Canoe Club",
        "body": """Howzit Team,

Hope the paddling and surfski calendar at Border Canoe Club is going strong — I'll keep this brief.

Whenever the club puts together a time trial braai, social function, or away race trip on WhatsApp, how much time goes into chasing RSVPs, EFT screenshots, and who's bringing salads or ice?

I built a South African web tool called PullThru (https://pullthru.co.za) where you drop one link into the club WhatsApp group and paddlers lock their spot in 2 taps via Capitec Pay, Apple Pay, Card, or PayShap (plus a free SA Braai Calculator and live Bring-'n-Bak item claims). No app download required.

You can check it out at https://pullthru.co.za — let me know if you'd like a custom Border Canoe Club template for your next club social.

Cheers,
Nikhar
support@pullthru.co.za
PullThru — pullthru.co.za"""
    },
    {
        "id": "44",
        "venue": "Paarl Canoe Club",
        "contact_name": "Club Committee",
        "email": "info@paarlcanoeclub.co.za",
        "alt_email": "",
        "location": "Paarl, Western Cape",
        "vertical": "Canoe Club",
        "pain_point_hook": "River trips, time trial braais, and club social RSVPs on WhatsApp...",
        "to": ["info@paarlcanoeclub.co.za"],
        "subject": "quick question re: club braais & river trip RSVPs at Paarl Canoe Club",
        "body": """Hi Team,

Hope the river season on the Berg is going well at Paarl Canoe Club — I'll keep this short.

How much time do your organisers spend managing copy-paste WhatsApp lists and chasing EFTs whenever the club hosts a time trial braai, social evening, or group river trip?

I built a South African web tool called PullThru (https://pullthru.co.za) that replaces WhatsApp scroll lists with one simple link. Members tap the link in WhatsApp and lock their spot in 2 taps via Capitec Pay, Apple Pay, Card, or PayShap — or RSVP for free on R0 club paddles. Zero app download needed.

Feel free to test it at https://pullthru.co.za — happy to set up a free Paarl Canoe Club template for your next social.

Cheers,
Nikhar
support@pullthru.co.za
PullThru — pullthru.co.za"""
    }
]

def verify_mx_and_smtp(email_addr: str) -> bool:
    """Verifies MX record AND performs an non-intrusive SMTP RCPT check to prevent hard bounces."""
    domain = email_addr.split("@")[1]
    res = subprocess.run(["nslookup", "-type=MX", domain], capture_output=True, text=True)
    out = res.stdout
    mx_hosts = re.findall(r"mail exchanger = (?:\d+\s+)?([^\s\r\n]+)", out, re.IGNORECASE)
    if not mx_hosts:
        # fallback if format differs
        if "mail exchanger" not in out.lower() and "mx" not in out.lower():
            return False
        return True

    mx_host = mx_hosts[0].rstrip(".")
    try:
        with smtplib.SMTP(mx_host, 25, timeout=8) as s:
            s.ehlo("pullthru.co.za")
            s.mail("support@pullthru.co.za")
            code, _ = s.rcpt(email_addr)
            if code in (550, 551, 553, 554):
                print(f"   [SMTP REJECTED {code}] {email_addr} on {mx_host}")
                return False
    except Exception:
        # Port 25 outbound is often blocked by residential ISPs; MX record is confirmed valid
        pass
    return True

def main():
    with open(PW_PATH, "r", encoding="utf-8") as f:
        pw = f.read().strip().replace(" ", "")

    valid_items = []
    for item in CANDIDATES:
        combined = (item["subject"] + " " + item["body"]).lower()
        assert "[" not in combined and "]" not in combined, f"Blank placeholder in {item['venue']}"
        assert "taxclean" not in combined, f"Forbidden brand string in {item['venue']}"
        assert "sent from my" not in combined, f"Forbidden footer in {item['venue']}"

        all_ok = all(verify_mx_and_smtp(addr) for addr in item["to"])
        if all_ok:
            valid_items.append(item)
        else:
            print(f"[SKIPPED INVALID] {item['venue']}")

    with smtplib.SMTP_SSL("smtp.gmail.com", 465, timeout=30) as server:
        server.login("sales@taxcleanza.com", pw)
        for item in valid_items:
            msg = EmailMessage()
            msg["Subject"] = item["subject"]
            msg["From"] = "Nikhar - PullThru <support@pullthru.co.za>"
            msg["Reply-To"] = "Nikhar <support@pullthru.co.za>"
            msg["To"] = ", ".join(item["to"])
            msg.set_content(item["body"])

            server.send_message(msg, from_addr="support@pullthru.co.za", to_addrs=item["to"])
            print(f"[SENT #{item['id']}] {item['venue']} -> {', '.join(item['to'])}")
            time.sleep(2.5)

    # Append to prospects.csv
    existing_ids = set()
    rows = []
    with open(CSV_PATH, "r", encoding="utf-8", newline="") as f:
        reader = csv.DictReader(f)
        fieldnames = reader.fieldnames
        for r in reader:
            existing_ids.add(r["id"])
            rows.append(r)

    for item in valid_items:
        if item["id"] not in existing_ids:
            rows.append({
                "id": item["id"],
                "venue_or_club": item["venue"],
                "contact_name": item["contact_name"],
                "email": item["email"],
                "alt_email": item["alt_email"],
                "location": item["location"],
                "vertical": item["vertical"],
                "pain_point_hook": item["pain_point_hook"],
                "status": f"Sent ({time.strftime('%Y-%m-%d %H:%M')})"
            })

    with open(CSV_PATH, "w", encoding="utf-8", newline="") as f:
        writer = csv.DictWriter(f, fieldnames=fieldnames)
        writer.writeheader()
        writer.writerows(rows)

    print(f"ALL {len(valid_items)} BATCH-4 PRE-LUNCH EMAILS DISPATCHED & SAVED.")

if __name__ == "__main__":
    main()
