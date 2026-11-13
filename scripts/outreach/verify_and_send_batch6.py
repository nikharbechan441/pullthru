import csv
import os
import random
import re
import smtplib
import subprocess
import sys
import time
from email.message import EmailMessage

sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))
import outreach_guard

PW_PATH = r"C:\Users\arvin\OneDrive\Desktop\TaxClean - AntiGravity\.gmail_app_password"
CSV_PATH = r"c:\Users\arvin\OneDrive\Desktop\App 3\marketing\outreach\prospects.csv"

CANDIDATES = [
    {
        "id": "57",
        "venue": "SA Forest Adventures",
        "contact_name": "Bookings Team",
        "email": "bookings@saforestadventures.co.za",
        "alt_email": "",
        "location": "Caledon, Hermanus & Cape Town",
        "vertical": "Ziplining, Quad Biking & Group Adventures",
        "pain_point_hook": "Bachelor, birthday, and social group organisers collecting per-person adventure deposits",
        "to": ["bookings@saforestadventures.co.za"],
        "subject": "Group deposit collection for SA Forest Adventures bookings",
        "body": """Good morning SA Forest Adventures Team,

I hope your weekend groups across Cape Town, Hermanus, and Caledon went well.

I am reaching out to introduce PullThru (https://pullthru.co.za), a South African web tool built for group organisers who book ziplining, quad biking, and paintball outings with friends.

Often when one person volunteers to organise a birthday or bachelor outing for 10 to 20 people, they end up spending days chasing everyone on WhatsApp for EFTs before they can pay your group deposit. With PullThru, the organiser drops one link into their WhatsApp group and each guest pays their exact share in seconds via Capitec Pay, PayShap, Apple Pay, or card.

There is zero cost to SA Forest Adventures and nothing is deducted from your package rates (any small R1 to R2 transaction fee is covered by the guests chipping in).

If your reservations team ever deals with group organisers who need a faster way to collect money from their friends, I would be happy to share a quick demo template tailored to your packages.

Kind regards,
Nikhar Bechan
Founder, PullThru SA
https://pullthru.co.za | support@pullthru.co.za"""
    },
    {
        "id": "58",
        "venue": "Scootours Cape Town & Winelands",
        "contact_name": "Bookings Team",
        "email": "bookings@scootours.co.za",
        "alt_email": "capetown@scootours.co.za",
        "location": "Cape Town, Franschhoek & Stellenbosch",
        "vertical": "Mountain Scooter Group Tours",
        "pain_point_hook": "Birthday and social group organisers splitting Scootours ticket payments on WhatsApp",
        "to": ["bookings@scootours.co.za"],
        "subject": "Helping group organisers collect per-rider payments for Scootours",
        "body": """Good morning Scootours Bookings Team,

With summer group tours picking up on Table Mountain and in the Winelands, I wanted to share a local tool we built called PullThru (https://pullthru.co.za) that helps group organisers collect per-ticket payments from their friends on WhatsApp.

When someone coordinates a birthday ride or group outing for 10 or 12 people, they usually hesitate to front the entire booking fee out of their own pocket while waiting on friends to EFT them back. PullThru gives that organiser a single link to paste in their WhatsApp chat so everyone can lock in their spot and pay via PayShap, Capitec Pay, Apple Pay, or card.

There is no cost to Scootours and nothing comes off your ticket prices. The small R1 to R2 processing fee is covered by the riders chipping in.

Feel free to take a look at https://pullthru.co.za, and let me know if you would like a sample link your bookings desk can share with larger group enquiries.

Warm regards,
Nikhar Bechan
Founder, PullThru SA
https://pullthru.co.za | support@pullthru.co.za"""
    },
    {
        "id": "59",
        "venue": "Jozi X Adventure Centre",
        "contact_name": "Bookings Team",
        "email": "info@jozix.co.za",
        "alt_email": "",
        "location": "Bryanston, Johannesburg",
        "vertical": "Outdoor Action & Group Adventure Park",
        "pain_point_hook": "Bachelor and birthday group leaders collecting per-person deposits for Jozi X activities",
        "to": ["info@jozix.co.za"],
        "subject": "Group bookings and deposit collection at Jozi X",
        "body": """Good morning Jozi X Team,

I hope you had a busy weekend at the park in Bryanston.

We recently launched a South African group payment platform called PullThru (https://pullthru.co.za) designed to help people who organise bachelor parties, birthdays, and social outings collect money from their group on WhatsApp.

Whenever a customer wants to book Bubble Soccer, Zorb, or obstacle courses for 15 friends, the organiser usually gets stuck managing a manual WhatsApp list and chasing missing EFTs before they can confirm the booking. PullThru gives them one clean link where each participant claims their spot and pays their share via Capitec Pay, PayShap, Apple Pay, or card in under 15 seconds.

It costs Jozi X R0 and nothing is deducted from your activity rates (participants cover the small R1 to R2 fee when paying their share).

If this sounds helpful for your bookings desk when dealing with group organisers, I would be glad to send over a quick Jozi X demo link.

Best regards,
Nikhar Bechan
Founder, PullThru SA
https://pullthru.co.za | support@pullthru.co.za"""
    },
    {
        "id": "60",
        "venue": "Hashtag Escape",
        "contact_name": "Bookings Team",
        "email": "info@hashtagescape.co.za",
        "alt_email": "",
        "location": "Bedfordview, Johannesburg",
        "vertical": "Escape Rooms & Social Team Events",
        "pain_point_hook": "Birthday and social group organisers splitting multi-room escape bookings",
        "to": ["info@hashtagescape.co.za"],
        "subject": "Splitting group booking fees for Hashtag Escape teams",
        "body": """Good morning Hashtag Escape Team,

When a group of friends books two or three escape rooms for a birthday or weekend social in Bedfordview, one person almost always ends up paying the full deposit upfront and then chasing everyone else on WhatsApp for their share.

We built a local web tool called PullThru (https://pullthru.co.za) that makes group kitties and per-player splits effortless on WhatsApp. The organiser drops one link into their group chat, and each team member locks in their spot and pays their exact share via PayShap, Capitec Pay, Apple Pay, or card with no app download required.

There is zero cost to Hashtag Escape and no change to how you take bookings. Any small R1 to R2 transaction fee is absorbed by the players chipping in.

You are welcome to test how it works at https://pullthru.co.za, and I would be happy to share a custom example if your team thinks it could help larger group bookings confirm faster.

Kind regards,
Nikhar Bechan
Founder, PullThru SA
https://pullthru.co.za | support@pullthru.co.za"""
    },
    {
        "id": "61",
        "venue": "Huddle Park Golf & Recreation",
        "contact_name": "Events & Golf Team",
        "email": "info@huddlepark.com",
        "alt_email": "hsp@huddlepark.com",
        "location": "Linksfield, Johannesburg",
        "vertical": "Social Golf Days, Footgolf & Mashie Groups",
        "pain_point_hook": "Social golf day and footgolf organisers collecting green fees from 12 to 40 players",
        "to": ["info@huddlepark.com"],
        "subject": "Social golf day and group booking payments at Huddle Park",
        "body": """Good morning Huddle Park Team,

I hope the weekend four-balls and social groups had a great run on the course.

I am reaching out to introduce PullThru (https://pullthru.co.za), a South African web tool built for people who organise social golf days, mashie tournaments, and footgolf outings with friends or colleagues.

Usually, the person coordinating a group golf day has to manage a messy WhatsApp list and match dozens of individual EFTs before they can settle the group deposit with the club. With PullThru, the organiser shares one link in their WhatsApp group where each player books their slot and pays their green fee share via Capitec Pay, PayShap, Apple Pay, or card.

There is no cost or commission charged to Huddle Park, and your venue receives 100% of your booking fee (the players cover the small R1 to R2 processing fee when they chip in).

If you would like an optional tool your events desk can share with social golf organisers, I would be glad to show you a quick demo.

Warm regards,
Nikhar Bechan
Founder, PullThru SA
https://pullthru.co.za | support@pullthru.co.za"""
    },
    {
        "id": "62",
        "venue": "Simon's Town Boat Company",
        "contact_name": "Charter & Bookings Team",
        "email": "info@boatcompany.co.za",
        "alt_email": "",
        "location": "Simon's Town, Cape Town",
        "vertical": "Private Boat Charters & Marine Cruises",
        "pain_point_hook": "Private charter and group cruise organisers collecting per-head boat shares",
        "to": ["info@boatcompany.co.za"],
        "subject": "Group charter and cruise deposit collection for Simon's Town Boat Company",
        "body": """Good morning Simon's Town Boat Company Team,

With summer charter enquiries picking up in False Bay, I wanted to share a local tool we built called PullThru (https://pullthru.co.za) that helps private group organisers collect per-person payments from their guests.

When a customer wants to book a private Cape Point cruise or group boat trip with 12 to 20 friends, the organiser often delays confirming the booking while waiting for everyone in their WhatsApp group to EFT their share. PullThru gives that organiser a single link to drop in their WhatsApp chat so each guest can RSVP and pay immediately via Capitec Pay, PayShap, Apple Pay, or card.

There is zero cost to Simon's Town Boat Company and nothing is deducted from your charter rates. Any small R1 to R2 fee is covered by the guests chipping in.

Feel free to take a look at https://pullthru.co.za, and let me know if you would like a sample link your bookings team can pass along to group charter enquiries.

Best regards,
Nikhar Bechan
Founder, PullThru SA
https://pullthru.co.za | support@pullthru.co.za"""
    },
    {
        "id": "63",
        "venue": "Cape Canopy Tour (Elgin Valley)",
        "contact_name": "Reservations Team",
        "email": "zipline@capecanopytour.co.za",
        "alt_email": "",
        "location": "Elgin / Grabouw, Western Cape",
        "vertical": "Zipline Canopy Tours & Group Adventures",
        "pain_point_hook": "Weekend group leaders collecting per-person zipline tour deposits on WhatsApp",
        "to": ["zipline@capecanopytour.co.za"],
        "subject": "Helping group organisers confirm their Cape Canopy Tour bookings",
        "body": """Dear Cape Canopy Tour Team,

I hope the weekend tours in the Elgin valley went well.

I am writing to introduce PullThru (https://pullthru.co.za), a South African web tool built to help group organisers collect per-ticket payments from their friends on WhatsApp before confirming an adventure booking.

Whenever someone organises a birthday or weekend zipline trip for a group of friends, they usually spend days chasing EFT proof of payments on WhatsApp before they can pay the group deposit. With PullThru, they share one link in their WhatsApp chat and everyone pays their exact share in seconds via Capitec Pay, PayShap, Apple Pay, or card.

Just to be clear upfront: there is no fee to Cape Canopy Tour and nothing is deducted from your tour rates (guests cover the small R1 to R2 transaction fee when paying their share).

If you think this could help your group enquiries lock in their dates faster, I would be happy to share a quick demo with your reservations team.

Kind regards,
Nikhar Bechan
Founder, PullThru SA
https://pullthru.co.za | support@pullthru.co.za"""
    },
    {
        "id": "64",
        "venue": "Karkloof Canopy Tour",
        "contact_name": "Bookings Team",
        "email": "info@karkloofcanopytour.co.za",
        "alt_email": "",
        "location": "KZN Midlands, KwaZulu-Natal",
        "vertical": "Zipline Canopy Tours & Midlands Group Outings",
        "pain_point_hook": "Midlands weekend and birthday group organisers splitting zipline booking fees",
        "to": ["info@karkloofcanopytour.co.za"],
        "subject": "Group booking deposits for Karkloof Canopy Tour outings",
        "body": """Good morning Karkloof Canopy Tour Team,

I hope the new week is off to a great start in the Midlands.

We recently launched PullThru (https://pullthru.co.za), a local web tool designed for people who coordinate group outings, birthdays, and weekend trips across South Africa.

When one person in a group of friends offers to book a canopy tour for 8 or 12 people, they often get stuck waiting days for everyone on the WhatsApp group to EFT their share before they can confirm the booking. PullThru replaces the manual WhatsApp list with one link where each person claims their spot and pays via PayShap, Capitec Pay, Apple Pay, or card.

It costs Karkloof Canopy Tour R0 and nothing comes off your ticket rates. Any small R1 to R2 processing fee is covered by the guests chipping in.

If you would like an easy resource your bookings desk can mention to group organisers who are still collecting money from their friends, let me know and I can send over a sample link.

Warm regards,
Nikhar Bechan
Founder, PullThru SA
https://pullthru.co.za | support@pullthru.co.za"""
    },
    {
        "id": "65",
        "venue": "Cape Xtreme Adventure Tours",
        "contact_name": "Bookings Team",
        "email": "info@capextreme.com",
        "alt_email": "",
        "location": "Cape Town, Western Cape",
        "vertical": "Private Group Day Tours & Extreme Adventures",
        "pain_point_hook": "Group leaders collecting per-person deposits for private Cape Point, Winelands, or shark diving tours",
        "to": ["info@capextreme.com"],
        "subject": "Collecting group payments for Cape Xtreme private tours",
        "body": """Good morning Cape Xtreme Team,

With summer group enquiries picking up in Cape Town, I wanted to share a local payment tool we built called PullThru (https://pullthru.co.za) for people who organise group day tours and adventure packages with friends.

When a group leader enquires about a private Cape Peninsula tour, Winelands day trip, or adventure package for 10 to 15 people, the biggest delay is usually the organiser trying to collect individual shares from everyone in their WhatsApp group. With PullThru, the organiser drops a single link into their WhatsApp chat so each guest can lock in their seat and pay their share immediately via Apple Pay, Capitec Pay, PayShap, or card.

There is zero cost to Cape Xtreme and no deduction from your quoted package rates.

You can see how it works at https://pullthru.co.za. If it looks useful for your reservations desk, I would be glad to share a quick example link.

Best regards,
Nikhar Bechan
Founder, PullThru SA
https://pullthru.co.za | support@pullthru.co.za"""
    },
    {
        "id": "66",
        "venue": "Gary's Surf School (Muizenberg)",
        "contact_name": "Gary & Bookings Team",
        "email": "gary@garysurf.com",
        "alt_email": "",
        "location": "Muizenberg, Cape Town",
        "vertical": "Group Surf Lessons & Social Outings",
        "pain_point_hook": "Birthday, student, and social group organisers collecting per-person surf lesson fees",
        "to": ["gary@garysurf.com"],
        "subject": "Group surf lesson bookings at Gary's Surf School",
        "body": """Good morning Gary and Team,

I hope the waves at Muizenberg were good for your weekend lessons.

I am reaching out as the founder of PullThru (https://pullthru.co.za), a local web tool built to help people who organise group activities collect money from their friends on WhatsApp.

Whenever someone organises a birthday surf lesson, student group, or bachelor session for 10 or 15 friends, they usually end up copying and pasting a numbered list on WhatsApp and chasing people for EFTs before they can confirm the booking. PullThru gives that organiser one simple link where each surfer taps their name and pays their exact share via Capitec Pay, PayShap, Apple Pay, or card in seconds.

There is no cost to Gary's Surf School and nothing is deducted from your lesson rates (the small R1 to R2 fee is covered by the friends chipping in).

If you think this could help group organisers confirm their surf bookings faster this summer, I would be happy to set up a free template link for your desk.

Kind regards,
Nikhar Bechan
Founder, PullThru SA
https://pullthru.co.za | support@pullthru.co.za"""
    },
    {
        "id": "67",
        "venue": "The Woods Paintball (Fourways)",
        "contact_name": "Bookings Team",
        "email": "bookings@woodspaintball.co.za",
        "alt_email": "",
        "location": "Fourways / Midrand, Johannesburg",
        "vertical": "Paintball, Bachelor Parties & Birthday Groups",
        "pain_point_hook": "Best men and birthday organisers collecting per-player paintball deposits on WhatsApp",
        "to": ["bookings@woodspaintball.co.za"],
        "subject": "Helping bachelor and birthday organisers collect deposits for The Woods Paintball",
        "body": """Good morning to the team at The Woods Paintball,

I hope your weekend games in Fourways went well.

We recently built a South African web tool called PullThru (https://pullthru.co.za) after seeing how much time best men and birthday organisers waste chasing 12 to 20 friends on WhatsApp for their paintball deposits.

Instead of the organiser waiting four days for everyone to send an EFT before they can pay your booking deposit, they drop one PullThru link into their WhatsApp group. Every player claims their spot and pays their per-person share immediately via Capitec Pay, PayShap, Apple Pay, or card, with no app download needed.

There is zero cost to The Woods Paintball and nothing comes off your package prices (the players cover the small R1 to R2 processing fee when they chip in).

Feel free to check it out at https://pullthru.co.za, and let me know if you would like a sample link your bookings team can share with bachelor or birthday enquiries.

Best regards,
Nikhar Bechan
Founder, PullThru SA
https://pullthru.co.za | support@pullthru.co.za"""
    },
    {
        "id": "68",
        "venue": "Total Ninja Black River Park",
        "contact_name": "Events & Bookings Team",
        "email": "brp@totalninja.co.za",
        "alt_email": "ng@totalninja.co.za",
        "location": "Observatory, Cape Town & National Arenas",
        "vertical": "Obstacle Adventure Park & Group Parties",
        "pain_point_hook": "Birthday parents and adult group organisers collecting per-head ticket shares on WhatsApp",
        "to": ["brp@totalninja.co.za"],
        "subject": "Simplifying group deposits for Total Ninja party and team bookings",
        "body": """Good morning Total Ninja Cape Town Team,

Whether it is parents pooling money for a group birthday outing or a group of friends booking an evening session at Black River Park, one organiser almost always gets stuck chasing 10 to 20 people on WhatsApp for their per-ticket EFTs.

We built PullThru (https://pullthru.co.za) here in South Africa to make collecting group money on WhatsApp effortless. The organiser shares one link in their WhatsApp chat, and each participant RSVPs and pays their share in seconds via Capitec Pay, PayShap, Apple Pay, or card.

There is no cost or software integration required from Total Ninja, and your venue receives 100% of your standard party or group rate (any small R1 to R2 transaction fee is covered by the guests chipping in).

If your bookings team ever speaks with organisers who are waiting on friends to pay before confirming their numbers, I would be glad to share how they can use PullThru to collect the full amount in an afternoon.

Kind regards,
Nikhar Bechan
Founder, PullThru SA
https://pullthru.co.za | support@pullthru.co.za"""
    }
]


def verify_mx_and_smtp(email_addr: str) -> bool:
    """Verifies MX record AND performs a non-intrusive SMTP RCPT check to prevent hard bounces."""
    domain = email_addr.split("@")[1]
    res = subprocess.run(["nslookup", "-type=MX", domain], capture_output=True, text=True)
    out = res.stdout
    mx_hosts = re.findall(r"mail exchanger = (?:\d+\s+)?([^\s\r\n]+)", out, re.IGNORECASE)
    if not mx_hosts:
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
        pass
    return True


def main():
    with open(PW_PATH, "r", encoding="utf-8") as f:
        pw = f.read().strip().replace(" ", "")

    blocked_emails, blocked_domains, _ = outreach_guard.sync_and_load_guard_set()

    valid_items = []
    for item in CANDIDATES:
        combined = item["subject"] + " " + item["body"]
        assert "—" not in combined and "–" not in combined, f"Forbidden em/en-dash in {item['venue']}"
        assert "[" not in combined and "]" not in combined, f"Blank placeholder in {item['venue']}"
        assert "taxclean" not in combined.lower(), f"Forbidden brand string in {item['venue']}"
        assert len(item["to"]) == 1, f"Must have exactly 1 recipient for {item['venue']}"

        guard_ok, reason = outreach_guard.can_send_to(item["to"], blocked_emails, blocked_domains)
        if not guard_ok:
            print(f"[SKIPPED BY OUTREACH GUARD] {item['venue']}: {reason}")
            continue

        all_ok = all(verify_mx_and_smtp(addr) for addr in item["to"])
        if all_ok:
            valid_items.append(item)
        else:
            print(f"[SKIPPED INVALID MX/SMTP] {item['venue']}")

    with smtplib.SMTP_SSL("smtp.gmail.com", 465, timeout=30) as server:
        server.login("sales@taxcleanza.com", pw)
        for idx, item in enumerate(valid_items):
            msg = EmailMessage()
            msg["Subject"] = item["subject"]
            msg["From"] = "Nikhar Bechan <support@pullthru.co.za>"
            msg["Reply-To"] = "Nikhar Bechan <support@pullthru.co.za>"
            msg["To"] = item["to"][0]
            msg.set_content(item["body"])

            server.send_message(msg, from_addr="support@pullthru.co.za", to_addrs=item["to"])
            print(f"[SENT #{item['id']}] {item['venue']} -> {item['to'][0]}", flush=True)
            if idx < len(valid_items) - 1:
                delay = random.uniform(24.0, 36.0)
                time.sleep(delay)

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

    outreach_guard.sync_and_load_guard_set()
    print(f"ALL {len(valid_items)} BATCH-6 MONDAY MORNING EMAILS DISPATCHED & SAVED.")


if __name__ == "__main__":
    main()
