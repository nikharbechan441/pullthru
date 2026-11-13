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
        "venue": "Proud Mary Modern Eatery & Wine Bar",
        "contact_name": "Reservations & Events Team",
        "email": "reservations@proudmary.co.za",
        "alt_email": "",
        "location": "The Bank, Rosebank, Johannesburg",
        "vertical": "Group Birthday Tables, Bottomless Brunch & Celebration Dinners",
        "pain_point_hook": "Birthday and brunch group organisers collecting per-person table deposits from 8-18 friends on WhatsApp",
        "to": ["reservations@proudmary.co.za"],
        "subject": "Group birthday & brunch table deposits at Proud Mary Rosebank",
        "body": """Good morning Proud Mary Team,

When a customer enquires to book a birthday table, brunch group, or celebration dinner for 8 to 16 friends in Rosebank, the table organiser often hesitates to pay a group deposit out of their own pocket while waiting days for everyone in their WhatsApp group to EFT them back.

We built PullThru (https://pullthru.co.za/for-venues) here in South Africa to solve that exact bottleneck. The organiser drops one 15-second link into their WhatsApp group chat, every friend locks in their seat and pays their share via PayShap, Capitec PayMe, Apple Pay, or card with R0 guest fees, and the organiser settles your single table deposit on time.

There is R0 cost to Proud Mary and zero change to your booking system. You can test our free 10-second Venue Quote Snippet & Website Helper at https://pullthru.co.za/for-venues whenever your reservations desk replies to a group table enquiry.

Warm regards,
Nikhar Bechan
Founder, PullThru SA
https://pullthru.co.za/for-venues | support@pullthru.co.za"""
    },
    {
        "venue": "Glenburn Lodge & Spa",
        "contact_name": "Reservations & Spa Team",
        "email": "reservations@glenburn.co.za",
        "alt_email": "",
        "location": "Muldersdrift, Cradle of Humankind, Gauteng",
        "vertical": "Group Spa Pamper Days, Bridal Showers & Weekend Country Stays",
        "pain_point_hook": "Bridesmaids and weekend away organisers collecting per-person spa and chalet deposits on WhatsApp",
        "to": ["reservations@glenburn.co.za"],
        "subject": "Group spa days and weekend booking deposits at Glenburn Lodge",
        "body": """Good morning Glenburn Lodge & Spa Team,

When a bridesmaid, birthday organiser, or family leader enquires for a group spa package or multi-room weekend in Muldersdrift for 8 to 20 guests, they often delay confirming because one person doesn't want to front the full deposit on their own card while chasing friends on WhatsApp.

We built PullThru (https://pullthru.co.za/for-venues) in South Africa so the group organiser can drop a single link into their WhatsApp chat, collect everyone's exact Rand share via PayShap, Capitec Pay, or card in one afternoon, and pay your single lump-sum deposit on time.

There is R0 cost to Glenburn Lodge and zero integration needed. You can try our free 10-second Venue Quote Snippet & Website FAQ Helper at https://pullthru.co.za/for-venues whenever your reservations team sends out a group quote.

Warm regards,
Nikhar Bechan
Founder, PullThru SA
https://pullthru.co.za/for-venues | support@pullthru.co.za"""
    },
    {
        "venue": "Cradle Moon Lakeside Game Lodge",
        "contact_name": "Reservations & Activities Team",
        "email": "reservations@cradlemoon.co.za",
        "alt_email": "",
        "location": "Muldersdrift, Gauteng",
        "vertical": "Group Trail Runs, Open-Water Swims, MTB, Day Drives & Weekend Lodges",
        "pain_point_hook": "Weekend group, MTB, and birthday organisers splitting day-visitor packages, lunches, and lodge rooms on WhatsApp",
        "to": ["reservations@cradlemoon.co.za"],
        "subject": "Group weekend and day-trip bookings at Cradle Moon",
        "body": """Good morning Cradle Moon Team,

When a friend group, trail club, or birthday organiser plans a group lunch, game drive, or weekend stay at Cradle Moon for 10 to 25 people, the person organising the group usually gets stuck chasing everyone on WhatsApp for their share of the deposit.

We built PullThru (https://pullthru.co.za/for-venues) here in South Africa so group organisers can drop one 15-second link into their WhatsApp group chat and collect everyone's share via PayShap, Capitec PayMe, or card with R0 guest fees, so they can settle your single booking deposit on time.

It is 100% free for Cradle Moon. You can check out our 10-second Venue Quote Snippet & Website Helper at https://pullthru.co.za/for-venues if your reservations desk ever deals with group organisers who are still rounding up payments from their friends.

Warm regards,
Nikhar Bechan
Founder, PullThru SA
https://pullthru.co.za/for-venues | support@pullthru.co.za"""
    },
    {
        "venue": "Benguela Cove Lagoon Wine Estate",
        "contact_name": "Hospitality & Bookings Team",
        "email": "info@benguelacove.co.za",
        "alt_email": "",
        "location": "Hermanus / Bot River Lagoon, Western Cape",
        "vertical": "Group Wine Tastings, Pontoon Cruises, Adventure Golf & Villas",
        "pain_point_hook": "Hermanus weekend away and birthday organisers collecting per-head wine tasting, cruise, and villa deposits on WhatsApp",
        "to": ["info@benguelacove.co.za"],
        "subject": "Group wine tastings, pontoon cruises & villa bookings at Benguela Cove",
        "body": """Good morning Benguela Cove Team,

When a group of 8 to 18 friends plans a Hermanus weekend away, pontoon cruise, wine tasting, or birthday lunch at Benguela Cove, the organiser often hesitates to pay the full deposit out of their own pocket while waiting days for the WhatsApp group to EFT them back.

We built PullThru (https://pullthru.co.za/for-venues) here in South Africa so the group organiser can drop a 15-second link into their WhatsApp group, collect everyone's share via PayShap, Capitec PayMe, Apple Pay, or card in one afternoon, and settle your booking in a single payment.

There is R0 cost to Benguela Cove. You can test our free 10-second Venue Quote Snippet & Website Helper at https://pullthru.co.za/for-venues whenever your hospitality team sends out a group quote.

Warm regards,
Nikhar Bechan
Founder, PullThru SA
https://pullthru.co.za/for-venues | support@pullthru.co.za"""
    },
    {
        "venue": "Lourensford Wine Estate",
        "contact_name": "Hospitality & Bookings Team",
        "email": "info@lourensford.co.za",
        "alt_email": "",
        "location": "Somerset West / Helderberg, Western Cape",
        "vertical": "Group Wine & MCC Pairings, Market Tables & Estate Activities",
        "pain_point_hook": "Birthday, bridal shower, and Helderberg weekend organisers collecting per-person tasting and lunch deposits on WhatsApp",
        "to": ["info@lourensford.co.za"],
        "subject": "Group wine tastings and celebration bookings at Lourensford",
        "body": """Good morning Lourensford Team,

When a customer enquires to book a group wine pairing, birthday celebration, or bridal shower table for 10 to 20 guests at Lourensford, the organiser often delays confirming because they are still chasing their friends on WhatsApp for their share of the deposit.

We built PullThru (https://pullthru.co.za/for-venues) in South Africa to fix that bottleneck. The organiser drops one link into their WhatsApp group, friends lock in their spot and pay via PayShap, Capitec PayMe, or card with R0 guest fees, and the organiser pays your single invoice on time.

There is R0 cost to Lourensford and zero POS integration. Feel free to try our 10-second Venue Quote Snippet & Website Helper at https://pullthru.co.za/for-venues whenever your team replies to a group enquiry.

Warm regards,
Nikhar Bechan
Founder, PullThru SA
https://pullthru.co.za/for-venues | support@pullthru.co.za"""
    },
    {
        "venue": "Tokara Wine & Olive Estate",
        "contact_name": "Tasting Lounge & Reservations Team",
        "email": "wine@tokara.com",
        "alt_email": "",
        "location": "Helshoogte Pass, Stellenbosch, Western Cape",
        "vertical": "Group Wine Tastings, Delicatessen Tables & Celebration Lunches",
        "pain_point_hook": "Winelands day-trip and birthday organisers collecting per-guest tasting and set-menu lunch deposits on WhatsApp",
        "to": ["wine@tokara.com"],
        "subject": "Group tasting and celebration lunch deposits at Tokara",
        "body": """Good morning Tokara Team,

When one person in a group of 8 to 16 friends volunteers to organise a Stellenbosch birthday lunch or group tasting at Tokara, they often hesitate to pay the group deposit out of their own pocket while waiting days for everyone in their WhatsApp chat to EFT them back.

We built PullThru (https://pullthru.co.za/for-venues) here in South Africa so the group organiser can drop a 15-second link into their WhatsApp group, collect everyone's exact Rand share via PayShap, Capitec Pay, Apple Pay, or card in one afternoon, and settle your booking in a single payment.

There is R0 cost to Tokara. You can test our free 10-second Venue Quote Snippet & Website Helper at https://pullthru.co.za/for-venues anytime your reservations team fields a group enquiry.

Warm regards,
Nikhar Bechan
Founder, PullThru SA
https://pullthru.co.za/for-venues | support@pullthru.co.za"""
    },
    {
        "venue": "Buitenverwachting Constantia",
        "contact_name": "Hospitality & Reservations Team",
        "email": "info@buitenverwachting.com",
        "alt_email": "",
        "location": "Constantia Valley, Cape Town",
        "vertical": "Group Wine Tastings, Lawn Platters & Celebration Lunches",
        "pain_point_hook": "Constantia wine route and birthday group organisers collecting per-head tasting and platter deposits on WhatsApp",
        "to": ["info@buitenverwachting.com"],
        "subject": "Group tasting and celebration bookings at Buitenverwachting",
        "body": """Good morning Buitenverwachting Team,

When a customer enquires for a group of 8 to 18 guests for a Constantia wine tasting, lawn platter social, or birthday lunch, the organiser often delays paying a group deposit because they don't want to front the full amount on their own card while chasing friends on WhatsApp.

We built PullThru (https://pullthru.co.za/for-venues) here in South Africa so the organiser can drop one link into their WhatsApp group, collect everyone's share via PayShap, Capitec PayMe, or card with R0 guest fees, and pay your single booking deposit on time.

It is 100% free for Buitenverwachting. You can check out our 10-second Venue Quote Snippet & Website Helper at https://pullthru.co.za/for-venues whenever your team replies to a group booking enquiry.

Warm regards,
Nikhar Bechan
Founder, PullThru SA
https://pullthru.co.za/for-venues | support@pullthru.co.za"""
    },
    {
        "venue": "Time Out Market Cape Town",
        "contact_name": "Events & Group Bookings Team",
        "email": "events.capetown@timeoutmarket.com",
        "alt_email": "info.capetown@timeoutmarket.com",
        "location": "V&A Waterfront, Cape Town",
        "vertical": "Group Social Tables, Event Cards, Birthdays & Year-End Socials",
        "pain_point_hook": "Birthday, bachelor, and team social organisers collecting per-person Time Out Market event card shares on WhatsApp",
        "to": ["events.capetown@timeoutmarket.com"],
        "subject": "Group bookings & pre-loaded event card splits at Time Out Market Cape Town",
        "body": """Good morning Time Out Market Cape Town Events Team,

When a birthday organiser or social coordinator arranges a group booking or pre-loaded market cards for 10 to 30 friends at the V&A Waterfront, the biggest hurdle is usually one person having to chase everyone on WhatsApp for their Rand share before paying your invoice.

We built PullThru (https://pullthru.co.za/for-venues) here in South Africa so the organiser can drop a 15-second link into their WhatsApp group chat, let every guest lock in their spot and pay via PayShap, Capitec PayMe, Apple Pay, or card with R0 guest fees, and settle your single group invoice on time.

There is R0 cost to Time Out Market and zero POS integration. You can test our free 10-second Venue Quote Snippet & Website Helper at https://pullthru.co.za/for-venues whenever your events desk sends out a group quote.

Warm regards,
Nikhar Bechan
Founder, PullThru SA
https://pullthru.co.za/for-venues | support@pullthru.co.za"""
    },
    {
        "venue": "Steenberg Vineyards, Bistro Sixteen82 & Tryn",
        "contact_name": "Hospitality & Functions Team",
        "email": "info@steenbergfarm.com",
        "alt_email": "functions@tryn.co.za",
        "location": "Constantia Valley, Cape Town",
        "vertical": "Group Tapas Tables, Wine Tastings, Golf 4-Balls & Spa Days",
        "pain_point_hook": "Birthday, tapas, golf, and spa group organisers collecting per-guest deposits on WhatsApp",
        "to": ["info@steenbergfarm.com"],
        "subject": "Group tasting, tapas & spa booking deposits at Steenberg",
        "body": """Good morning Steenberg Hospitality Team,

When a customer enquires for a group of 8 to 20 guests for a tapas table at Bistro Sixteen82, a celebration dinner at Tryn, a group wine tasting, or a spa morning, the group organiser often hesitates to pay the full deposit out of their own pocket while waiting days for their friends to EFT them back.

We built PullThru (https://pullthru.co.za/for-venues) here in South Africa so the group organiser can drop one link into their WhatsApp group, collect everyone's share via PayShap, Capitec Pay, Apple Pay, or card in one afternoon, and pay your single lump-sum deposit on time.

There is R0 cost to Steenberg and zero change to your booking process. You can try our free 10-second Venue Quote Snippet & Website Helper at https://pullthru.co.za/for-venues whenever your team replies to a group enquiry.

Warm regards,
Nikhar Bechan
Founder, PullThru SA
https://pullthru.co.za/for-venues | support@pullthru.co.za"""
    },
    {
        "venue": "Groot Constantia Wine Estate",
        "contact_name": "Visitor & Enquiries Team",
        "email": "enquiries@grootconstantia.co.za",
        "alt_email": "",
        "location": "Constantia, Cape Town",
        "vertical": "Group Wine & Chocolate Pairings, Cellar Tours & Estate Lunches",
        "pain_point_hook": "Birthday and weekend group organisers collecting per-person wine tasting and lunch deposits on WhatsApp",
        "to": ["enquiries@grootconstantia.co.za"],
        "subject": "Group wine tastings and celebration bookings at Groot Constantia",
        "body": """Good morning Groot Constantia Team,

When a group of 10 to 20 friends plans a birthday wine & chocolate pairing or celebration lunch at Groot Constantia, the person organising the group usually gets stuck fronting the deposit on their own card and chasing WhatsApp EFT screenshots for days.

We built PullThru (https://pullthru.co.za/for-venues) in South Africa so the group organiser can drop a 15-second link into their WhatsApp chat, collect everyone's exact share via PayShap, Capitec PayMe, or card with R0 guest fees, and settle your group booking in one payment.

There is R0 cost to Groot Constantia. You can check out our free 10-second Venue Quote Snippet & Website Helper at https://pullthru.co.za/for-venues whenever your team sends out a group booking quote.

Warm regards,
Nikhar Bechan
Founder, PullThru SA
https://pullthru.co.za/for-venues | support@pullthru.co.za"""
    },
    {
        "venue": "Cavalli Estate",
        "contact_name": "Reservations & Events Team",
        "email": "info@cavalliestate.com",
        "alt_email": "",
        "location": "Helderberg / Somerset West, Western Cape",
        "vertical": "Group Wine Tastings, Set-Menu Lunches & Celebration Tables",
        "pain_point_hook": "Birthday, anniversary, and social group organisers collecting per-head set-menu and tasting deposits on WhatsApp",
        "to": ["info@cavalliestate.com"],
        "subject": "Group table and wine tasting deposits at Cavalli Estate",
        "body": """Good morning Cavalli Estate Team,

When a customer books a celebration table or group wine tasting for 8 to 16 guests at Cavalli Estate, the table organiser often delays paying the group deposit because they are waiting for everyone in their WhatsApp group to EFT their share.

We built PullThru (https://pullthru.co.za/for-venues) here in South Africa so the organiser can drop one 15-second link into their WhatsApp chat, let every guest lock in their seat via PayShap, Capitec Pay, Apple Pay, or card, and settle your single deposit on time.

There is R0 cost to Cavalli Estate and zero integration required. You can test our free 10-second Venue Quote Snippet & Website Helper at https://pullthru.co.za/for-venues anytime your reservations team fields a group table enquiry.

Warm regards,
Nikhar Bechan
Founder, PullThru SA
https://pullthru.co.za/for-venues | support@pullthru.co.za"""
    },
    {
        "venue": "Casalinga Ristorante & Country Estate",
        "contact_name": "Events & Restaurant Bookings Team",
        "email": "events@casalinga.co.za",
        "alt_email": "restaurant@casalinga.co.za",
        "location": "Muldersdrift, Gauteng",
        "vertical": "Long-Table Set-Menu Lunches, Birthdays, Kitchen Teas & Picnics",
        "pain_point_hook": "Birthday, kitchen tea, and family lunch organisers collecting per-head set-menu deposits from 10-25 guests on WhatsApp",
        "to": ["events@casalinga.co.za"],
        "subject": "Group birthday & long-table lunch deposits at Casalinga",
        "body": """Good morning Casalinga Team,

When a customer enquires to book a birthday lunch, kitchen tea, or long-table Sunday feast for 10 to 25 guests in Muldersdrift, the group organiser often hesitates to pay the full set-menu deposit out of their own pocket while chasing friends on WhatsApp for EFTs.

We built PullThru (https://pullthru.co.za/for-venues) here in South Africa to solve that exact problem. The organiser drops a 15-second link into their WhatsApp group, every guest locks in their seat and pays their share via PayShap, Capitec PayMe, Apple Pay, or card with R0 guest fees, and the organiser pays your single deposit on time.

There is R0 cost to Casalinga. You can try our free 10-second Venue Quote Snippet & Website Helper at https://pullthru.co.za/for-venues whenever your bookings team sends out a group quote.

Warm regards,
Nikhar Bechan
Founder, PullThru SA
https://pullthru.co.za/for-venues | support@pullthru.co.za"""
    },
]


def resolve_mx_host(domain: str):
    try:
        out = subprocess.check_output(
            ["nslookup", "-type=mx", domain, "8.8.8.8"],
            stderr=subprocess.STDOUT,
            text=True,
            timeout=8,
        )
        matches = re.findall(
            r"mail exchanger = (\S+)|MX preference = \d+, mail exchanger = (\S+)",
            out,
        )
        hosts = []
        for m in matches:
            h = (m[0] or m[1]).strip(".")
            if h and h != "(root)" and "." in h:
                hosts.append(h)
        return hosts[0] if hosts else None
    except Exception:
        return None


def verify_email_deliverable(email_addr: str) -> bool:
    domain = email_addr.split("@")[1]
    mx = resolve_mx_host(domain)
    if not mx:
        print(f"  [MX FAIL] {email_addr} (no valid MX for {domain})")
        return False
    try:
        with smtplib.SMTP(mx, 25, timeout=8) as s:
            s.ehlo("pullthru.co.za")
            s.mail("sales@taxcleanza.com")
            code, _ = s.rcpt(email_addr)
            if code in (250, 251):
                print(f"  [RCPT 250 OK] {email_addr} via {mx}")
                return True
            if 500 <= code < 600:
                print(f"  [RCPT {code} REJECT] {email_addr} via {mx}")
                return False
            print(f"  [RCPT {code} SOFT] {email_addr} via {mx}")
            return True
    except Exception as e:
        print(f"  [MX VALID: {mx} / PORT25 SKIPPED] {email_addr} ({e})")
        return True


def main():
    with open(PW_PATH, "r", encoding="utf-8") as f:
        pw = f.read().strip().replace(" ", "")

    blocked_emails, blocked_domains, _ = outreach_guard.sync_and_load_guard_set()

    existing_rows = []
    with open(CSV_PATH, "r", encoding="utf-8", newline="") as f:
        reader = csv.DictReader(f)
        for r in reader:
            existing_rows.append(r)
    next_id = max(int(r["id"]) for r in existing_rows) + 1

    valid_items = []
    for item in CANDIDATES:
        combined = item["subject"] + " " + item["body"]
        assert "—" not in combined and "–" not in combined, f"Forbidden dash in {item['venue']}"
        assert "taxclean" not in combined.lower(), f"Forbidden brand in {item['venue']}"

        primary = item["email"].strip().lower()
        dom = primary.split("@")[1]
        if primary in blocked_emails or dom in blocked_domains:
            print(f"[SKIPPED ALREADY CONTACTED] {item['venue']} ({primary})")
            continue

        chosen = None
        for addr in [item["email"], item["alt_email"]]:
            if not addr:
                continue
            if verify_email_deliverable(addr):
                chosen = addr
                break
        if chosen:
            item["to"] = [chosen]
            item["email"] = chosen
            item["id"] = str(next_id)
            next_id += 1
            valid_items.append(item)
            blocked_emails.add(chosen.lower())
            blocked_domains.add(chosen.split("@")[1].lower())
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

            server.send_message(msg)
            print(f"[SENT #{item['id']}] {item['venue']} -> {item['to'][0]}", flush=True)
            if idx < len(valid_items) - 1:
                delay = random.uniform(22.0, 32.0)
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
    print(f"ALL {len(valid_items)} BATCH-12 THURSDAY MORNING EMAILS DISPATCHED & SAVED.")


if __name__ == "__main__":
    main()
