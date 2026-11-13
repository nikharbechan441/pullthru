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
        "id": "69",
        "venue": "Stellenbosch Wine Tractor",
        "contact_name": "Bookings Team",
        "email": "info@winetractor.co.za",
        "alt_email": "",
        "location": "Stellenbosch, Western Cape",
        "vertical": "Group Wine Tours & Birthday Outings",
        "pain_point_hook": "Birthday and social group organisers collecting per-ticket Wine Tractor payments on WhatsApp",
        "to": ["info@winetractor.co.za"],
        "subject": "Group ticket splits for Stellenbosch Wine Tractor bookings",
        "body": """Good afternoon Stellenbosch Wine Tractor Team,

With summer birthday and social groups booking trips through the Golden Triangle, I wanted to share a local tool we built called PullThru (https://pullthru.co.za) that helps group organisers collect per-ticket payments from their friends on WhatsApp.

Often when one person in a group of 10 or 15 friends volunteers to book the Wine Tractor, they hesitate to pay for all the tickets out of their own pocket while waiting days for everyone on the WhatsApp group to EFT them back. PullThru gives that organiser a single link to paste in their WhatsApp chat so each guest can lock in their seat and pay via Capitec Pay, PayShap, Apple Pay, or card in seconds.

There is zero cost to Stellenbosch Wine Tractor and nothing is deducted from your ticket prices (any small R1 to R2 fee is covered by the friends chipping in).

Feel free to take a look at https://pullthru.co.za, and let me know if you would like a custom sample link your bookings desk can share with group enquiries.

Kind regards,
Nikhar Bechan
Founder, PullThru SA
https://pullthru.co.za | support@pullthru.co.za"""
    },
    {
        "id": "70",
        "venue": "Ceres Zipline Adventures",
        "contact_name": "Bookings Team",
        "email": "info@ceresadventures.co.za",
        "alt_email": "info@cereszipline.co.za",
        "location": "Ceres, Western Cape",
        "vertical": "Zipline Tours & Weekend Group Adventures",
        "pain_point_hook": "Weekend group leaders collecting per-person zipline tour deposits on WhatsApp",
        "to": ["info@ceresadventures.co.za"],
        "subject": "Helping group organisers confirm their Ceres Zipline bookings",
        "body": """Good afternoon Ceres Zipline Adventures Team,

I hope the new week is off to a good start in Ceres.

I am reaching out to introduce PullThru (https://pullthru.co.za), a South African web tool built for group organisers who book weekend zipline trips, birthdays, and bachelor outings with friends.

Whenever someone coordinates a trip to Ceres for 8 to 15 friends, they usually get stuck managing a manual WhatsApp list and chasing missing EFT proof of payments before they can settle the group booking. With PullThru, the organiser drops one link into their WhatsApp chat and every participant claims their spot and pays their exact share via PayShap, Capitec Pay, Apple Pay, or card.

It costs Ceres Zipline Adventures R0 and nothing comes off your tour rates (the guests cover the small R1 to R2 transaction fee when paying their share).

If your bookings desk ever speaks with group leaders who are waiting on friends to pay before confirming their slots, I would be happy to share a quick demo link.

Warm regards,
Nikhar Bechan
Founder, PullThru SA
https://pullthru.co.za | support@pullthru.co.za"""
    },
    {
        "id": "71",
        "venue": "Stormsriver Adventures (Tsitsikamma Canopy Tour)",
        "contact_name": "Marketing & Bookings Team",
        "email": "marketing@stormsriver.com",
        "alt_email": "adventure@gardenroute.co.za",
        "location": "Storms River / Tsitsikamma, Garden Route",
        "vertical": "Canopy Tours, Woodcutters Journey & Group Adventures",
        "pain_point_hook": "Holiday and social group organisers splitting Garden Route adventure bookings",
        "to": ["marketing@stormsriver.com"],
        "subject": "Group booking payments for Stormsriver Adventures",
        "body": """Good afternoon Stormsriver Adventures Team,

As summer holiday groups start planning their Garden Route trips, I wanted to introduce PullThru (https://pullthru.co.za), a local web tool designed to help group organisers collect per-person activity payments from friends and family on WhatsApp.

When one person in a holiday group offers to book a Tsitsikamma Canopy Tour for 10 or 12 people, they usually spend days chasing everyone on WhatsApp for EFTs before confirming the booking. PullThru gives the group leader one simple link where each participant locks in their spot and pays their share via Capitec Pay, PayShap, Apple Pay, or card.

There is no cost to Stormsriver Adventures and nothing is deducted from your tour rates.

You are welcome to see how it works at https://pullthru.co.za. If it looks useful for your reservations team, I would be glad to share a quick example link.

Best regards,
Nikhar Bechan
Founder, PullThru SA
https://pullthru.co.za | support@pullthru.co.za"""
    },
    {
        "id": "72",
        "venue": "Kiff Kombi Tours",
        "contact_name": "Bookings Team",
        "email": "bookings@kiffkombitours.co.za",
        "alt_email": "",
        "location": "Cape Town, Western Cape",
        "vertical": "Private Group Craft Beer, Gin & Wine Tours",
        "pain_point_hook": "Bachelor, birthday, and social group organisers splitting private Kombi tour deposits",
        "to": ["bookings@kiffkombitours.co.za"],
        "subject": "Group deposit collection for Kiff Kombi Tours",
        "body": """Good afternoon Kiff Kombi Tours Team,

Whenever a best man or birthday organiser books a private Kombi craft beer, gin, or wine tour in Cape Town, their biggest headache is usually collecting per-person shares from 10 or 14 friends on WhatsApp before they can pay the tour deposit.

We built PullThru (https://pullthru.co.za) here in South Africa to solve that exact problem for social groups. The organiser drops one link into their WhatsApp group, and each mate claims their seat on the bus and pays their share in seconds via Capitec Pay, PayShap, Apple Pay, or card.

There is zero cost to Kiff Kombi Tours and no deduction from your tour packages (the small R1 to R2 processing fee is covered by the friends chipping in).

If you would like a simple tool your bookings team can mention to private group enquiries so they lock in their deposits faster, I would be happy to send over a custom Kiff Kombi demo link.

Kind regards,
Nikhar Bechan
Founder, PullThru SA
https://pullthru.co.za | support@pullthru.co.za"""
    },
    {
        "id": "73",
        "venue": "Clay Cafe Hout Bay",
        "contact_name": "Events & Bookings Team",
        "email": "houtbay@claycafe.co.za",
        "alt_email": "info@claycafe.co.za",
        "location": "Hout Bay, Cape Town",
        "vertical": "Group Pottery Painting, Birthdays & Kitchen Teas",
        "pain_point_hook": "Birthday, kitchen tea, and social group hosts collecting per-guest deposits on WhatsApp",
        "to": ["houtbay@claycafe.co.za"],
        "subject": "Group table deposits and birthday bookings at Clay Cafe",
        "body": """Good afternoon Clay Cafe Hout Bay Team,

When a customer organises a birthday table, kitchen tea, or weekend catch-up for 12 to 20 friends at Clay Cafe, the host almost always ends up fronting the group deposit out of their own pocket and then chasing guests on WhatsApp to EFT them back.

We recently launched PullThru (https://pullthru.co.za), a South African web tool that makes group RSVPs and deposit splits effortless on WhatsApp. The host shares one link in their WhatsApp chat, and each guest confirms their seat and pays their share via Apple Pay, Capitec Pay, PayShap, or card with no app download required.

There is no cost or software change required from Clay Cafe, and your venue receives 100% of your standard deposit and package fee (guests cover the small R1 to R2 fee when they chip in).

If this sounds like a helpful optional resource for customers booking larger group tables with you, I would be glad to share a quick example link.

Warm regards,
Nikhar Bechan
Founder, PullThru SA
https://pullthru.co.za | support@pullthru.co.za"""
    },
    {
        "id": "74",
        "venue": "RollEgoli Roller Rink",
        "contact_name": "Bookings Team",
        "email": "info@rollegoli.co.za",
        "alt_email": "",
        "location": "Bryanston, Johannesburg",
        "vertical": "Roller Skating Rink & Group Party Venue",
        "pain_point_hook": "Birthday parents and social group organisers collecting per-skater entry and skate hire fees",
        "to": ["info@rollegoli.co.za"],
        "subject": "Simplifying group booking deposits at RollEgoli",
        "body": """Good afternoon RollEgoli Team,

I hope you had a great weekend at the rink in Bryanston.

I am writing to share a local group payment tool called PullThru (https://pullthru.co.za) that helps group organisers and parents collect per-person entry and skate hire fees on WhatsApp before confirming a group booking.

Instead of one organiser copying and pasting a numbered list on WhatsApp and waiting days for 15 people to send individual EFTs, they share a single PullThru link in their group chat. Everyone locks in their spot and pays their exact share via Capitec Pay, PayShap, Apple Pay, or card in under 15 seconds.

It costs RollEgoli R0 and nothing is deducted from your group rates (any small R1 to R2 transaction fee is absorbed by the guests chipping in).

Feel free to take a look at https://pullthru.co.za, and let me know if you would like a custom sample link for your bookings desk.

Best regards,
Nikhar Bechan
Founder, PullThru SA
https://pullthru.co.za | support@pullthru.co.za"""
    },
    {
        "id": "75",
        "venue": "be.UP Park (Cape Town, JHB & Durban)",
        "contact_name": "Group Bookings Team",
        "email": "booking@beuppark.co.za",
        "alt_email": "enquiry@beuppark.co.za",
        "location": "Pinelands, Cresta, Menlyn & Gateway",
        "vertical": "Indoor Climbing, Trampoline & Group Party Parks",
        "pain_point_hook": "Party and group outing organisers collecting per-person park ticket shares on WhatsApp",
        "to": ["booking@beuppark.co.za"],
        "subject": "Helping group organisers collect payments for be.UP Park bookings",
        "body": """Good afternoon be.UP Park Bookings Team,

Whether it is a parent coordinating a group birthday party or friends planning a weekend session at one of your parks, the person organising the group usually has to chase 10 to 20 people on WhatsApp for EFTs before they can settle the group booking.

We built PullThru (https://pullthru.co.za) here in South Africa to remove that bottleneck for group organisers. They drop one link into their WhatsApp group, and each participant RSVPs and pays their per-ticket share via Capitec Pay, PayShap, Apple Pay, or card with no app download needed.

There is zero cost to be.UP Park and nothing comes off your package prices (the participants chipping in cover the small R1 to R2 processing fee).

If your bookings team ever deals with organisers who are waiting on their group to pay before confirming final numbers, I would be glad to show you how they can use PullThru to collect everything in one afternoon.

Kind regards,
Nikhar Bechan
Founder, PullThru SA
https://pullthru.co.za | support@pullthru.co.za"""
    },
    {
        "id": "76",
        "venue": "The Fun Company",
        "contact_name": "Bookings Team",
        "email": "bookings@thefuncompany.co.za",
        "alt_email": "service@thefuncompany.co.za",
        "location": "Fourways, Menlyn, Gateway & Nationwide",
        "vertical": "Tenpin Bowling, Spin Zone & Group Socials",
        "pain_point_hook": "Birthday and social bowling group organisers splitting lane and package deposits on WhatsApp",
        "to": ["bookings@thefuncompany.co.za"],
        "subject": "Group bowling and party deposit splits for The Fun Company",
        "body": """Good afternoon to the bookings team at The Fun Company,

Whenever a group of friends or colleagues plans a tenpin bowling night or birthday social, one person usually gets stuck fronting the deposit or chasing 12 people on WhatsApp for their individual shares.

I am the founder of PullThru (https://pullthru.co.za), a South African web tool built to make group kitties and per-person splits effortless on WhatsApp. The organiser shares one link in their WhatsApp chat, and everyone locks in their spot and pays their exact share via PayShap, Capitec Pay, Apple Pay, or card in seconds.

There is no cost or software integration required from The Fun Company, and your venue receives 100% of your booking rate.

You can see how it works at https://pullthru.co.za. If it looks helpful for your group and party coordinators, I would be happy to share a quick demo link.

Best regards,
Nikhar Bechan
Founder, PullThru SA
https://pullthru.co.za | support@pullthru.co.za"""
    },
    {
        "id": "77",
        "venue": "CityROCK Climbing Gym",
        "contact_name": "Cape Town Events Team",
        "email": "capetown@cityrock.co.za",
        "alt_email": "johannesburg@cityrock.co.za",
        "location": "Paarden Eiland, Cape Town & Randburg, JHB",
        "vertical": "Indoor Rock Climbing, Intro Courses & Social Groups",
        "pain_point_hook": "Social climbing groups, intro course pairs, and birthday organisers splitting booking fees",
        "to": ["capetown@cityrock.co.za"],
        "subject": "Group climbing bookings and fee splits at CityROCK",
        "body": """Good afternoon CityROCK Cape Town Team,

I hope the new week is off to a great start at the gym in Paarden Eiland.

We recently launched PullThru (https://pullthru.co.za), a local web tool built for South African sports clubs and social group organisers who coordinate group sessions on WhatsApp.

When someone organises a group intro climbing session, social night, or birthday outing for 8 to 15 friends, they usually end up managing a manual WhatsApp list and chasing missing EFTs before confirming their numbers. With PullThru, the organiser drops one link into their WhatsApp group so each climber can claim their spot and pay their share via Capitec Pay, PayShap, Apple Pay, or card.

There is zero cost to CityROCK and nothing is deducted from your entry or gear rental rates (any small R1 to R2 fee is covered by the participants chipping in).

If you think this could be useful for customers organising group sessions with you, I would be glad to send over a quick example link.

Kind regards,
Nikhar Bechan
Founder, PullThru SA
https://pullthru.co.za | support@pullthru.co.za"""
    },
    {
        "id": "78",
        "venue": "Drakensberg Canopy Tour",
        "contact_name": "Bookings Team",
        "email": "info@drakensbergcanopytour.co.za",
        "alt_email": "",
        "location": "Central Drakensberg, KwaZulu-Natal",
        "vertical": "Zipline Canopy Tours & Berg Group Weekends",
        "pain_point_hook": "Berg weekend and birthday group leaders collecting per-person canopy tour deposits",
        "to": ["info@drakensbergcanopytour.co.za"],
        "subject": "Group deposit collection for Drakensberg Canopy Tour bookings",
        "body": """Good afternoon Drakensberg Canopy Tour Team,

I hope your weekend tours in the Berg went well.

I am reaching out to introduce PullThru (https://pullthru.co.za), a South African web tool built for people who organise weekend away groups, birthdays, and adventure outings with friends.

Often, one person in a Berg weekend group offers to book the canopy tour for 8 or 12 people, and then spends days chasing everyone else on WhatsApp to EFT their ticket share before they can confirm the deposit. PullThru gives that group organiser a single link to paste in their WhatsApp chat so each guest can pay their share immediately via Capitec Pay, PayShap, Apple Pay, or card.

It costs Drakensberg Canopy Tour R0 and nothing comes off your tour rates (guests cover the small R1 to R2 processing fee when they chip in).

If you would like an optional tool your reservations desk can mention to group leaders who are still collecting money from their group, I would be happy to share a quick demo.

Warm regards,
Nikhar Bechan
Founder, PullThru SA
https://pullthru.co.za | support@pullthru.co.za"""
    },
    {
        "id": "79",
        "venue": "Kayak Cape Town (Simon's Town)",
        "contact_name": "Bookings Team",
        "email": "info@kayakcapetown.co.za",
        "alt_email": "",
        "location": "Simon's Town, Cape Town",
        "vertical": "Guided Penguin Sea Kayaking & Group Outings",
        "pain_point_hook": "Weekend social and birthday group organisers splitting sea kayaking booking fees on WhatsApp",
        "to": ["info@kayakcapetown.co.za"],
        "subject": "Helping group organisers collect payments for Kayak Cape Town trips",
        "body": """Good afternoon Kayak Cape Town Team,

With summer paddles in Simon's Town picking up, I wanted to share a local tool we built called PullThru (https://pullthru.co.za) that helps group organisers collect per-person payments from their friends on WhatsApp.

Whenever someone organises a weekend penguin kayak trip for a group of 8 to 14 friends, they usually hesitate to pay for the entire group out of their own pocket while waiting on friends to EFT them back. With PullThru, the organiser drops one link into their WhatsApp group and each paddler locks in their spot and pays their share via PayShap, Capitec Pay, Apple Pay, or card in seconds.

There is no cost to Kayak Cape Town and nothing is deducted from your tour rates (the small R1 to R2 fee is covered by the friends chipping in).

Feel free to take a look at https://pullthru.co.za, and let me know if you would like a sample link your bookings desk can pass along to group enquiries.

Best regards,
Nikhar Bechan
Founder, PullThru SA
https://pullthru.co.za | support@pullthru.co.za"""
    },
    {
        "id": "80",
        "venue": "Magaliesberg Canopy Tour",
        "contact_name": "Bookings Team",
        "email": "info@magaliescanopytour.co.za",
        "alt_email": "",
        "location": "Magaliesberg / Rustenburg, Gauteng & NW",
        "vertical": "Zipline Canopy Tours, Bachelor & Birthday Groups",
        "pain_point_hook": "Gauteng weekend, bachelor, and birthday organisers collecting per-person tour deposits",
        "to": ["info@magaliescanopytour.co.za"],
        "subject": "Simplifying group deposits for Magaliesberg Canopy Tour bookings",
        "body": """Good afternoon Magaliesberg Canopy Tour Team,

When a customer organises a birthday outing, bachelor trip, or weekend group adventure out in the Magaliesberg for 10 to 15 friends, the person in charge usually spends days chasing everyone on WhatsApp for EFTs before they can pay your group deposit.

We built PullThru (https://pullthru.co.za) here in South Africa to make collecting group money on WhatsApp much faster. Instead of a manual WhatsApp list, the organiser shares one link where each participant claims their spot and pays their exact share via Capitec Pay, PayShap, Apple Pay, or card.

There is zero cost to Magaliesberg Canopy Tour and nothing is deducted from your tour rates (any small R1 to R2 transaction fee is absorbed by the guests chipping in).

If your reservations team ever speaks with group organisers who need a simpler way to collect their group deposit from friends, I would be glad to share a custom Magaliesberg Canopy Tour demo link.

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
    print(f"ALL {len(valid_items)} BATCH-7 MONDAY AFTERNOON EMAILS DISPATCHED & SAVED.")


if __name__ == "__main__":
    main()
