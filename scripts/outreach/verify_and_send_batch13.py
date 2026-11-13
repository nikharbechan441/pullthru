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
        "venue": "Vrede en Lust Wine Estate",
        "contact_name": "Events & Functions Team",
        "email": "functions@vnl.co.za",
        "alt_email": "",
        "location": "Simondium / Paarl, Western Cape",
        "vertical": "Group Wine Tastings, Bistro Lust Lunches & Vineyard Celebrations",
        "pain_point_hook": "Birthday and celebration group organisers collecting per-person tasting and lunch deposits on WhatsApp",
        "to": ["functions@vnl.co.za"],
        "subject": "Group tasting and celebration table deposits at Vrede en Lust",
        "body": """Good day Vrede en Lust Team,

When a customer enquires to book a group wine tasting, celebration lunch at Lust Bistro, or birthday table for 10 to 20 guests, the organiser often delays confirming because they do not want to front the full deposit out of their own pocket while waiting days for their WhatsApp group to EFT them back.

We built PullThru (https://pullthru.co.za/for-venues) here in South Africa to solve that exact bottleneck. The organiser drops one 15-second link into their WhatsApp group chat, every friend locks in their spot and pays via PayShap, Capitec PayMe, Apple Pay, or card with R0 guest fees, and the organiser pays your single venue deposit on time.

There is R0 cost to Vrede en Lust and zero integration needed. You can test our free 10-second Venue Quote Snippet & Website Helper at https://pullthru.co.za/for-venues whenever your team sends out a group quote.

Warm regards,
Nikhar Bechan
Founder, PullThru SA
https://pullthru.co.za/for-venues | support@pullthru.co.za"""
    },
    {
        "venue": "Lanzerac Wine Estate & Spa",
        "contact_name": "Reservations & Hospitality Team",
        "email": "reservations@lanzerac.co.za",
        "alt_email": "",
        "location": "Jonkershoek Valley, Stellenbosch, Western Cape",
        "vertical": "Group Spa Days, Wine Tastings, Deli Platters & Birthday Lunches",
        "pain_point_hook": "Bridesmaids, birthday, and spa group organisers collecting per-guest package deposits on WhatsApp",
        "to": ["reservations@lanzerac.co.za"],
        "subject": "Group spa days and celebration bookings at Lanzerac",
        "body": """Good day Lanzerac Team,

When a customer enquires for a group of 8 to 16 guests for a Jonkershoek spa morning, private wine tasting, or celebratory birthday lunch at Lanzerac, the group organiser often hesitates to pay the deposit out of their own pocket while waiting for friends on WhatsApp to pay them back.

We built PullThru (https://pullthru.co.za/for-venues) in South Africa so the organiser can drop a single link into their WhatsApp chat, collect everyone's exact share via PayShap, Capitec Pay, Apple Pay, or card in one afternoon, and settle your single deposit invoice on time.

There is R0 cost to Lanzerac and zero change to your booking process. You can check out our free 10-second Venue Quote Snippet & Website Helper at https://pullthru.co.za/for-venues whenever your team replies to a group enquiry.

Warm regards,
Nikhar Bechan
Founder, PullThru SA
https://pullthru.co.za/for-venues | support@pullthru.co.za"""
    },
    {
        "venue": "Jordan Wine Estate",
        "contact_name": "Hospitality & Bookings Team",
        "email": "info@jordanwines.com",
        "alt_email": "",
        "location": "Stellenbosch Kloof, Western Cape",
        "vertical": "Group Wine Safaris, Cellar Tours & Celebration Dining",
        "pain_point_hook": "Winelands day-trip and celebration organisers collecting per-head safari and lunch deposits on WhatsApp",
        "to": ["info@jordanwines.com"],
        "subject": "Group wine safari and celebration deposits at Jordan Wine Estate",
        "body": """Good day Jordan Wine Estate Team,

When one person in a group of 8 to 16 friends plans a wine safari tour, cellar tasting, or celebration lunch in Stellenbosch Kloof, the organiser often delays confirming because they are waiting for everyone in their WhatsApp group to EFT their share of the booking.

We built PullThru (https://pullthru.co.za/for-venues) here in South Africa to help organisers collect their group's money upfront via PayShap, Capitec PayMe, Apple Pay, or card with R0 guest fees, so they can pay your single deposit invoice without delay.

It is 100% free for your venue. You can try our free 10-second Venue Quote Snippet & Website Helper at https://pullthru.co.za/for-venues anytime your team fields a group booking enquiry.

Warm regards,
Nikhar Bechan
Founder, PullThru SA
https://pullthru.co.za/for-venues | support@pullthru.co.za"""
    },
    {
        "venue": "Hazendal Wine Estate",
        "contact_name": "Bookings & Events Team",
        "email": "bookings@hazendal.co.za",
        "alt_email": "",
        "location": "Bottelary Hills, Stellenbosch, Western Cape",
        "vertical": "Russian Tea Ceremonies, Sensory Wine Tastings & Group Lunches",
        "pain_point_hook": "Birthday and tea ceremony group organisers collecting per-person deposits from 8-20 guests on WhatsApp",
        "to": ["bookings@hazendal.co.za"],
        "subject": "Group tea ceremony & celebration bookings at Hazendal",
        "body": """Good day Hazendal Team,

When a customer books a group tea ceremony, sensory tasting, or birthday lunch for 8 to 20 guests at Hazendal, the organiser often hesitates to pay the full group deposit out of their own pocket while waiting days for everyone in the WhatsApp group to EFT them back.

We built PullThru (https://pullthru.co.za/for-venues) here in South Africa so the organiser can drop one 15-second link into their WhatsApp chat, let every guest lock in their seat via PayShap, Capitec Pay, Apple Pay, or card, and settle your single deposit on time.

There is R0 cost to Hazendal and zero integration required. You can test our free 10-second Venue Quote Snippet & Website Helper at https://pullthru.co.za/for-venues whenever your bookings desk sends out a group quote.

Warm regards,
Nikhar Bechan
Founder, PullThru SA
https://pullthru.co.za/for-venues | support@pullthru.co.za"""
    },
    {
        "venue": "Quoin Rock Wine Estate",
        "contact_name": "Hospitality & Bookings Team",
        "email": "info@quoinrock.co.za",
        "alt_email": "",
        "location": "Simonsberg, Stellenbosch, Western Cape",
        "vertical": "Gourmet Picnics, Fine Dining & Custom Group Tastings",
        "pain_point_hook": "Picnic pod and birthday celebration organisers collecting per-person gourmet basket deposits on WhatsApp",
        "to": ["info@quoinrock.co.za"],
        "subject": "Group picnic pods and celebration deposits at Quoin Rock",
        "body": """Good day Quoin Rock Team,

When a customer enquires to book private picnic pods or a celebration lunch for 8 to 16 guests on the slopes of the Simonsberg, the group organiser often delays confirming because they are still waiting for friends to EFT their share of the deposit.

We built PullThru (https://pullthru.co.za/for-venues) in South Africa so group organisers can drop one 15-second link into their WhatsApp group chat and collect everyone's share via PayShap, Capitec PayMe, or card with R0 guest fees, so they can pay your single deposit on time.

There is R0 cost to Quoin Rock. You can check out our free 10-second Venue Quote Snippet & Website Helper at https://pullthru.co.za/for-venues whenever your hospitality team replies to a group enquiry.

Warm regards,
Nikhar Bechan
Founder, PullThru SA
https://pullthru.co.za/for-venues | support@pullthru.co.za"""
    },
    {
        "venue": "The Galileo Open Air Cinema",
        "contact_name": "Group Bookings & Support Team",
        "email": "hello@thegalileo.co.za",
        "alt_email": "",
        "location": "Cape Town & Winelands Venues",
        "vertical": "Open-Air Movie Nights, Group Birthday Seating & Year-End Outings",
        "pain_point_hook": "Birthday and social group organisers collecting per-seat ticket and backrest shares on WhatsApp",
        "to": ["hello@thegalileo.co.za"],
        "subject": "Helping group organisers coordinate ticket splits for The Galileo",
        "body": """Good day Galileo Team,

Whenever a friend group of 8 to 25 people plans an open-air movie night with The Galileo, the person organising the group usually ends up buying tickets and backrests out of their own pocket and chasing WhatsApp EFTs for two weeks.

We built PullThru (https://pullthru.co.za/for-venues) here in South Africa as a 15-second WhatsApp RSVP and kitty link where friends lock in their ticket and pay their exact share via PayShap, Capitec PayMe, Apple Pay, or card with R0 guest fees, and the organiser books in one go.

It is 100% free for event venues. If your team ever assists birthday or social group organisers, feel free to test our 10-second Group Quote Helper at https://pullthru.co.za/for-venues.

Warm regards,
Nikhar Bechan
Founder, PullThru SA
https://pullthru.co.za/for-venues | support@pullthru.co.za"""
    },
    {
        "venue": "Kloofzicht Lodge & Spa",
        "contact_name": "Reservations & Events Team",
        "email": "kloofzicht@guvon.co.za",
        "alt_email": "",
        "location": "Kromdraai / Muldersdrift, Gauteng",
        "vertical": "Group Spa Days, Hot Air Balloon Socials & Weekend Lodges",
        "pain_point_hook": "Bridal shower, birthday, and weekend away organisers collecting per-guest package deposits on WhatsApp",
        "to": ["kloofzicht@guvon.co.za"],
        "subject": "Group spa days and weekend booking deposits at Kloofzicht Lodge",
        "body": """Good day Kloofzicht Lodge Team,

When a customer enquires for a group spa day, ballooning breakfast, or multi-room weekend in Muldersdrift for 8 to 20 guests, the organiser often delays confirming because they do not want to front the full deposit on their own card while chasing friends on WhatsApp.

We built PullThru (https://pullthru.co.za/for-venues) here in South Africa so the group organiser can drop one link into their WhatsApp chat, collect everyone's share via PayShap, Capitec Pay, Apple Pay, or card in one afternoon, and pay your single lump-sum deposit on time.

There is R0 cost to Kloofzicht Lodge and zero integration required. You can try our free 10-second Venue Quote Snippet & Website Helper at https://pullthru.co.za/for-venues whenever your reservations desk sends out a group quote.

Warm regards,
Nikhar Bechan
Founder, PullThru SA
https://pullthru.co.za/for-venues | support@pullthru.co.za"""
    },
    {
        "venue": "Alluvia Boutique Winery & Picnics",
        "contact_name": "Hospitality & Reservations Team",
        "email": "reservations@alluvia.co.za",
        "alt_email": "",
        "location": "Banhoek Valley, Stellenbosch, Western Cape",
        "vertical": "Lawn Picnics, Group Wine Tastings & Boutique Accommodation",
        "pain_point_hook": "Birthday and picnic organisers collecting per-person lawn picnic and tasting deposits on WhatsApp",
        "to": ["reservations@alluvia.co.za"],
        "subject": "Group lawn picnic and tasting deposits at Alluvia Boutique Winery",
        "body": """Good day Alluvia Team,

When a customer books a group picnic or wine tasting for 8 to 18 guests in the Banhoek Valley, the organiser often hesitates to pay the deposit out of their own pocket while waiting for friends in the WhatsApp group to EFT them back.

We built PullThru (https://pullthru.co.za/for-venues) in South Africa to solve that bottleneck. The organiser drops one 15-second link into their WhatsApp group, every guest locks in their picnic basket via PayShap, Capitec PayMe, Apple Pay, or card with R0 guest fees, and the organiser settles your single deposit on time.

It is completely free for Alluvia. You can check out our free 10-second Venue Quote Snippet & Website Helper at https://pullthru.co.za/for-venues whenever your team sends out a group booking quote.

Warm regards,
Nikhar Bechan
Founder, PullThru SA
https://pullthru.co.za/for-venues | support@pullthru.co.za"""
    },
    {
        "venue": "Brookdale Estate & Bistro",
        "contact_name": "Bistro & Reservations Team",
        "email": "reservations@brookdale-estate.com",
        "alt_email": "",
        "location": "Klein Drakenstein, Paarl, Western Cape",
        "vertical": "Group Bistro Lunches, Wine Tastings & Manor House Getaways",
        "pain_point_hook": "Birthday and celebration table organisers collecting per-guest bistro lunch deposits on WhatsApp",
        "to": ["reservations@brookdale-estate.com"],
        "subject": "Group bistro lunch and tasting deposits at Brookdale Estate",
        "body": """Good day Brookdale Estate Team,

When one person in a group of 8 to 16 friends plans a celebration lunch at The Bistro or a group tasting at Brookdale, the organiser often delays confirming because they are waiting for everyone in their WhatsApp chat to pay their share of the deposit.

We built PullThru (https://pullthru.co.za/for-venues) here in South Africa so the group organiser can drop one link into their WhatsApp group, collect everyone's share via PayShap, Capitec Pay, Apple Pay, or card in one afternoon, and pay your single booking deposit on time.

There is R0 cost to Brookdale Estate. You can test our free 10-second Venue Quote Snippet & Website Helper at https://pullthru.co.za/for-venues anytime your team fields a group table enquiry.

Warm regards,
Nikhar Bechan
Founder, PullThru SA
https://pullthru.co.za/for-venues | support@pullthru.co.za"""
    },
    {
        "venue": "Ramkiki Country Restaurant & Events",
        "contact_name": "Events & Bookings Team",
        "email": "info@ramkiki.co.za",
        "alt_email": "",
        "location": "Ruimsig / Honeydew, Roodepoort, Gauteng",
        "vertical": "Willow Tree Birthday Tables, Family Lunches & River Socials",
        "pain_point_hook": "Birthday and family celebration organisers collecting per-head table deposits on WhatsApp",
        "to": ["info@ramkiki.co.za"],
        "subject": "Group birthday and family table deposits at Ramkiki",
        "body": """Good day Ramkiki Team,

When a customer enquires to book a birthday table or family celebration lunch for 10 to 25 guests along the river in Ruimsig, the organiser often delays paying the group deposit because they are still chasing friends on WhatsApp for EFTs.

We built PullThru (https://pullthru.co.za/for-venues) here in South Africa to fix that problem. The organiser drops one 15-second link into their WhatsApp group, every guest locks in their seat via PayShap, Capitec PayMe, Apple Pay, or card with R0 guest fees, and the organiser pays your single table deposit on time.

There is R0 cost to Ramkiki and zero integration required. You can try our free 10-second Venue Quote Snippet & Website Helper at https://pullthru.co.za/for-venues whenever your bookings team replies to a group enquiry.

Warm regards,
Nikhar Bechan
Founder, PullThru SA
https://pullthru.co.za/for-venues | support@pullthru.co.za"""
    },
    {
        "venue": "Black Horse Brewery & Restaurant",
        "contact_name": "Bookings & Events Team",
        "email": "info@blackhorse.co.za",
        "alt_email": "",
        "location": "Seekoeihoek, Magaliesburg, Gauteng",
        "vertical": "Craft Brewery Tours, Long-Table Lunches & Weekend Outings",
        "pain_point_hook": "Weekend day-trip and birthday organisers collecting per-head craft beer tasting and lunch deposits on WhatsApp",
        "to": ["info@blackhorse.co.za"],
        "subject": "Group tasting and lunch deposits at Black Horse Brewery",
        "body": """Good day Black Horse Brewery Team,

When a birthday organiser or social group plans a weekend day-trip or long-table lunch for 10 to 25 people in Magaliesburg, the person organising the group usually gets stuck chasing everyone on WhatsApp for their share of the deposit.

We built PullThru (https://pullthru.co.za/for-venues) in South Africa so group organisers can drop one link into their WhatsApp group chat and collect everyone's Rand share via PayShap, Capitec PayMe, or card with R0 guest fees, so they can confirm their group booking with you on time.

It is 100% free for Black Horse Brewery. You can check out our free 10-second Venue Quote Snippet & Website Helper at https://pullthru.co.za/for-venues whenever your team sends out a group quote.

Warm regards,
Nikhar Bechan
Founder, PullThru SA
https://pullthru.co.za/for-venues | support@pullthru.co.za"""
    },
    {
        "venue": "Spice Route Destination Paarl",
        "contact_name": "Hospitality & Bookings Team",
        "email": "info@spiceroute.co.za",
        "alt_email": "",
        "location": "Suid-Agter-Paarl, Western Cape",
        "vertical": "Passport Tastings, Craft Chocolate, Beer & Group Long-Tables",
        "pain_point_hook": "Group passport tasting and birthday lunch organisers collecting per-person fees on WhatsApp",
        "to": ["info@spiceroute.co.za"],
        "subject": "Group tasting passport and birthday bookings at Spice Route",
        "body": """Good day Spice Route Team,

When a group of 8 to 20 friends plans a day-trip to Paarl for Spice Route passports, chocolate tastings, and lunch, the person organising the group usually ends up fronting the booking costs and chasing WhatsApp EFT screenshots for days.

We built PullThru (https://pullthru.co.za/for-venues) here in South Africa so the group organiser can drop a 15-second link into their WhatsApp group, let everyone pay their share via PayShap, Capitec PayMe, Apple Pay, or card with R0 guest fees, and settle your single group booking in one go.

There is R0 cost to Spice Route Destination. You can try our free 10-second Venue Quote Snippet & Website Helper at https://pullthru.co.za/for-venues whenever your team assists group enquiries.

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
    print(f"ALL {len(valid_items)} BATCH-13 THURSDAY MIDDAY EMAILS DISPATCHED & SAVED.")


if __name__ == "__main__":
    main()
