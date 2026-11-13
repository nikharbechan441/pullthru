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
        "venue": "Gate69 Cabaret Theatre",
        "contact_name": "Box Office & Bookings Team",
        "email": "info@gate69.co.za",
        "alt_email": "bookings@gate69.co.za",
        "location": "Bree Street, Cape Town",
        "vertical": "Cabaret Supper Theatre, Birthday Tables & Bachelorettes",
        "pain_point_hook": "Birthday and bachelorette organisers collecting per-seat cabaret & mezze ticket shares on WhatsApp",
        "to": ["info@gate69.co.za"],
        "subject": "Group table bookings and ticket splits at Gate69",
        "body": """Good morning Gate69 Team,

When one person in a group of 8 to 16 friends volunteers to book a birthday table or bachelorette night on Bree Street, they often hesitate to pay for everyone's seats out of their own pocket while waiting days for the WhatsApp group to EFT them back.

We built PullThru (https://pullthru.co.za/for-venues) here in South Africa to solve that exact problem for social groups. The table organiser drops one link into their WhatsApp group chat, every friend locks in their seat and pays their exact share via Capitec Pay, PayShap, Apple Pay, or card in seconds, and the organiser settles your booking in one go.

There is zero cost to Gate69 and no change to how you take bookings. You can also test our free 10-second Venue Quote Snippet & Website FAQ Helper at https://pullthru.co.za/for-venues if your box office ever deals with group organisers who are still collecting money from their friends.

Warm regards,
Nikhar Bechan
Founder, PullThru SA
https://pullthru.co.za/for-venues | support@pullthru.co.za"""
    },
    {
        "venue": "Putt-Putt South Africa (Sea Point & Mouille Point)",
        "contact_name": "Events & Group Bookings Team",
        "email": "info@puttputt.co.za",
        "alt_email": "",
        "location": "Sea Point Promenade, Cape Town",
        "vertical": "Group Mini-Golf Socials, Birthdays & Team Outings",
        "pain_point_hook": "Birthday and social group organisers collecting per-player mini-golf and party shares on WhatsApp",
        "to": ["info@puttputt.co.za"],
        "subject": "Group birthday & social bookings at Putt-Putt",
        "body": """Good morning Putt-Putt Team,

When a parent or social organiser plans a group outing for 10 to 20 people, the biggest bottleneck is usually one person having to chase everyone on WhatsApp for their share of the booking and refreshments.

We built PullThru (https://pullthru.co.za/for-venues) in South Africa so group organisers can drop a 15-second WhatsApp link into their group chat, see who is locked in, and collect per-person payments via PayShap, Capitec PayMe, or card with R0 guest fees.

It is 100% free for venues. We also put together a free 10-second Venue Quote Snippet & Website FAQ helper at https://pullthru.co.za/for-venues that your bookings desk can share with group enquiries.

Warm regards,
Nikhar Bechan
Founder, PullThru SA
https://pullthru.co.za/for-venues | support@pullthru.co.za"""
    },
    {
        "venue": "Clay Cafe in the City & Paarl",
        "contact_name": "Bookings & Events Team",
        "email": "inthecity@claycafe.co.za",
        "alt_email": "info@claycafepaarl.co.za",
        "location": "Gardens, Cape Town & Paarl Winelands",
        "vertical": "Ceramic Painting, Birthday Tables, Kitchen Teas & Tapas",
        "pain_point_hook": "Birthday and kitchen tea organisers collecting per-head painting and platter deposits from 10-20 friends on WhatsApp",
        "to": ["inthecity@claycafe.co.za"],
        "subject": "Group birthday and kitchen tea deposits at Clay Cafe in the City",
        "body": """Good morning Clay Cafe in the City Team,

When a customer enquires for a table of 10 to 18 friends for a birthday, kitchen tea, or social painting night, the group organiser often delays paying the deposit because they don't want to front the full amount on their own card while waiting for friends to EFT them back.

We built PullThru (https://pullthru.co.za/for-venues) for South African social groups so the organiser can drop one link in their WhatsApp chat and collect everyone's share in an afternoon via Capitec Pay, PayShap, Apple Pay, or card, and then pay your single deposit on time.

There is R0 cost to Clay Cafe and zero POS integration. You can try our 10-second Group Quote Snippet & Website Helper at https://pullthru.co.za/for-venues anytime a group organiser asks for extra time to collect from their friends.

Warm regards,
Nikhar Bechan
Founder, PullThru SA
https://pullthru.co.za/for-venues | support@pullthru.co.za"""
    },
    {
        "venue": "Up Cycles Cape Town",
        "contact_name": "Group Bookings & Tours Team",
        "email": "hello@upcycles.co.za",
        "alt_email": "info@upcycles.co.za",
        "location": "Sea Point Promenade & V&A Waterfront, Cape Town",
        "vertical": "Sunset Group Bike Rides, Birthday Outings & Team Rides",
        "pain_point_hook": "Birthday and sunset ride organisers collecting per-rider bicycle rental fees on WhatsApp",
        "to": ["hello@upcycles.co.za"],
        "subject": "Group sunset rides and birthday bookings with Up Cycles",
        "body": """Good morning Up Cycles Team,

When a friend group of 8 to 15 people plans a sunset promenade ride or birthday outing with Up Cycles, the person organising the group usually gets stuck fronting the booking cost and chasing EFT screenshots in a WhatsApp group.

We built PullThru (https://pullthru.co.za/for-venues) here in South Africa to fix that. The organiser drops a 15-second link into their WhatsApp group, friends lock in their bike and pay their share via PayShap, Capitec PayMe, Apple Pay, or card, and the organiser settles your group booking in one payment.

It is completely free for Up Cycles. You can check out our 10-second Venue Quote Snippet generator at https://pullthru.co.za/for-venues if your team ever wants to include a group-split helper link in group quotes.

Warm regards,
Nikhar Bechan
Founder, PullThru SA
https://pullthru.co.za/for-venues | support@pullthru.co.za"""
    },
    {
        "venue": "Kirstenbosch Tea Room & Fynkos",
        "contact_name": "Reservations & Events Team",
        "email": "info@fynkos.co.za",
        "alt_email": "",
        "location": "Kirstenbosch Botanical Gardens, Cape Town",
        "vertical": "High Teas, Birthday Tables, Kitchen Teas & Picnics",
        "pain_point_hook": "Kitchen tea, bridal shower, and birthday organisers collecting per-guest high tea deposits on WhatsApp",
        "to": ["info@fynkos.co.za"],
        "subject": "High tea and group birthday table deposits at Kirstenbosch Tea Room",
        "body": """Good morning Kirstenbosch Tea Room Team,

When a bridesmaid or family organiser books a High Tea or celebration table for 10 to 20 guests, they often hesitate to pay the full group deposit out of their own pocket while waiting days for everyone in the WhatsApp group to EFT them back.

We built PullThru (https://pullthru.co.za/for-venues) here in South Africa so the organiser can drop a single link into their WhatsApp group, collect everyone's exact Rand share via PayShap, Capitec Pay, or card in one afternoon, and pay your single lump-sum deposit on time.

There is R0 cost to your venue and zero change to your invoicing. You can test our free 10-second Venue Quote Snippet & Website Helper at https://pullthru.co.za/for-venues whenever a group organiser is still rounding up payments from their guests.

Warm regards,
Nikhar Bechan
Founder, PullThru SA
https://pullthru.co.za/for-venues | support@pullthru.co.za"""
    },
    {
        "venue": "The Linden Market & Social Workshops",
        "contact_name": "Events & Bookings Team",
        "email": "hello@thelindenmarket.com",
        "alt_email": "",
        "location": "Emmarentia / Linden, Johannesburg",
        "vertical": "Market Group Outings, VIP Picnic Tables & Creative Workshops",
        "pain_point_hook": "Friend groups splitting market tickets and group workshop bookings on WhatsApp",
        "to": ["hello@thelindenmarket.com"],
        "subject": "Helping friend groups coordinate group tickets & tables for The Linden Market",
        "body": """Good morning Linden Market Team,

Whenever a friend group in Joburg plans a weekend outing to The Linden Market, the person organising the crew usually ends up buying tickets or booking a workshop out of their own pocket and chasing WhatsApp EFTs for days.

We built PullThru (https://pullthru.co.za/for-venues) in South Africa as a 15-second WhatsApp RSVP and kitty link where friends lock in their spot via PayShap, Capitec PayMe, or card with R0 guest fees.

If you ever run group table bookings, creative workshops, or vendor split bookings, feel free to check out our free Venue Quote Helper at https://pullthru.co.za/for-venues.

Warm regards,
Nikhar Bechan
Founder, PullThru SA
https://pullthru.co.za/for-venues | support@pullthru.co.za"""
    },
    {
        "venue": "1947 on Vilakazi Street",
        "contact_name": "Reservations & Events Team",
        "email": "info@1947onvilakazi.co.za",
        "alt_email": "bookings@1947onvilakazi.co.za",
        "location": "Vilakazi Street, Soweto, Johannesburg",
        "vertical": "Birthday Tables, Sunday Soul Sessions & Group Platters",
        "pain_point_hook": "Birthday and Sunday chill organisers collecting per-person table and platter deposits on WhatsApp",
        "to": ["info@1947onvilakazi.co.za"],
        "subject": "Group birthday & Sunday table deposits at 1947 on Vilakazi",
        "body": """Good morning 1947 on Vilakazi Team,

When a customer enquires to book a birthday table or group platter setup for 10 to 20 friends on Vilakazi Street, they often delay paying the table deposit because they are still chasing their friends on WhatsApp for their share.

We built PullThru (https://pullthru.co.za/for-venues) here in South Africa to solve that exact problem. The table organiser drops one 15-second link into their WhatsApp group, friends lock in their spot and pay via PayShap, Capitec PayMe, or card with R0 guest fees, and the organiser settles your single table deposit on time.

There is R0 cost to 1947 on Vilakazi. You can test our free 10-second Venue Quote Snippet Generator at https://pullthru.co.za/for-venues anytime your bookings desk sends out a group table quote.

Warm regards,
Nikhar Bechan
Founder, PullThru SA
https://pullthru.co.za/for-venues | support@pullthru.co.za"""
    },
    {
        "venue": "Maboneng Precinct & Bertrand Cafe",
        "contact_name": "Bookings & Events Team",
        "email": "info@bertrand.co.za",
        "alt_email": "",
        "location": "Maboneng, Johannesburg",
        "vertical": "Jazz Nights, Birthday Tables & Group Dinner Socials",
        "pain_point_hook": "Birthday and jazz night group organisers collecting per-head table deposits on WhatsApp",
        "to": ["info@bertrand.co.za"],
        "subject": "Group birthday and jazz table bookings at Bertrand Cafe",
        "body": """Good morning Bertrand Team,

When a customer books a group table of 8 to 16 friends for a birthday or jazz night in Maboneng, the organiser often hesitates to pay the full table deposit out of their own pocket while waiting for their friends to EFT them back.

We built PullThru (https://pullthru.co.za/for-venues) here in South Africa so the group organiser can drop a 15-second link into their WhatsApp chat, collect everyone's share via PayShap, Capitec Pay, or card in one afternoon, and settle your booking in one payment.

It is 100% free for your venue. You can try our 10-second Venue Quote Snippet & Website Helper at https://pullthru.co.za/for-venues whenever your team replies to a group table enquiry.

Warm regards,
Nikhar Bechan
Founder, PullThru SA
https://pullthru.co.za/for-venues | support@pullthru.co.za"""
    },
    {
        "venue": "Hazeldean Valley Trails & Brewing Co.",
        "contact_name": "Bookings & Events Team",
        "email": "info@hazeldeanvalley.co.za",
        "alt_email": "",
        "location": "Pretoria East, Gauteng",
        "vertical": "Group MTB & Trail Runs, Craft Beer Tastings & Picnic Tables",
        "pain_point_hook": "Trail running, MTB, and birthday group organisers splitting trail passes and picnic tables on WhatsApp",
        "to": ["info@hazeldeanvalley.co.za"],
        "subject": "Group trail outings, tastings & birthday tables at Hazeldean Valley",
        "body": """Good morning Hazeldean Valley Team,

When a birthday organiser or weekend trail/MTB group plans an outing for 10 to 25 people at Hazeldean Valley, the person organising the group usually gets stuck chasing everyone on WhatsApp for their share of the booking.

We built PullThru (https://pullthru.co.za/for-venues) in South Africa so group organisers can drop one 15-second link into their WhatsApp group chat and collect everyone's Rand share via PayShap, Capitec PayMe, or card with R0 guest fees, so they can confirm their group booking with you on time.

There is R0 cost to Hazeldean Valley. You can check out our free 10-second Venue Quote Snippet & Website FAQ Helper at https://pullthru.co.za/for-venues.

Warm regards,
Nikhar Bechan
Founder, PullThru SA
https://pullthru.co.za/for-venues | support@pullthru.co.za"""
    },
    {
        "venue": "Shongweni Farmers & Craft Market",
        "contact_name": "Events & Bookings Team",
        "email": "info@shongwenimarket.co.za",
        "alt_email": "",
        "location": "Assagay / Hillcrest, KwaZulu-Natal",
        "vertical": "Group Market Tables, Special Events & KZN Weekend Socials",
        "pain_point_hook": "KZN friend groups and birthday hosts coordinating special event tickets and group tables on WhatsApp",
        "to": ["info@shongwenimarket.co.za"],
        "subject": "Helping KZN groups split special event tickets & group tables at Shongweni Market",
        "body": """Good morning Shongweni Market Team,

Whenever a KZN friend group or birthday organiser plans a group table or buys tickets for a special concert/event at Shongweni Market, one person usually ends up fronting the money on their own card and chasing WhatsApp EFTs for days.

We built PullThru (https://pullthru.co.za/for-venues) here in South Africa as a 15-second WhatsApp RSVP and kitty link where friends lock in their spot via PayShap, Capitec PayMe, or card with R0 guest fees.

It is 100% free for venues and organisers of small groups. Feel free to test our 10-second Group Quote Snippet & Website Helper at https://pullthru.co.za/for-venues if your team ever fields group table enquiries.

Warm regards,
Nikhar Bechan
Founder, PullThru SA
https://pullthru.co.za/for-venues | support@pullthru.co.za"""
    },
    {
        "venue": "Abingdon Wine Estate (KZN Midlands)",
        "contact_name": "Tasting Room & Bookings Team",
        "email": "info@abingdonestate.co.za",
        "alt_email": "",
        "location": "Lions River, KwaZulu-Natal Midlands",
        "vertical": "Midlands Wine Tastings, Group Lunches & Birthday Tables",
        "pain_point_hook": "Midlands weekend away and birthday organisers collecting per-head wine tasting and lunch deposits on WhatsApp",
        "to": ["info@abingdonestate.co.za"],
        "subject": "Group wine tasting and lunch deposits at Abingdon Wine Estate",
        "body": """Good morning Abingdon Estate Team,

When a group of 8 to 16 friends plans a Midlands birthday lunch or wine tasting at Abingdon, the person organising the group often hesitates to pay a group deposit out of their own pocket while waiting days for everyone in the WhatsApp chat to EFT them back.

We built PullThru (https://pullthru.co.za/for-venues) in South Africa so the group organiser can drop one link into their WhatsApp group, collect everyone's share via PayShap, Capitec Pay, or card in one afternoon, and settle your booking in a single payment.

There is R0 cost to Abingdon Estate. You can test our free 10-second Venue Quote Snippet & Website Helper at https://pullthru.co.za/for-venues anytime your bookings desk replies to a group enquiry.

Warm regards,
Nikhar Bechan
Founder, PullThru SA
https://pullthru.co.za/for-venues | support@pullthru.co.za"""
    },
    {
        "venue": "Boschendal Picnics & Retreat",
        "contact_name": "Reservations & Picnics Team",
        "email": "reservations@boschendal.co.za",
        "alt_email": "enquiries@boschendal.co.za",
        "location": "Franschhoek / Stellenbosch Winelands, Western Cape",
        "vertical": "Group Lawn Picnics, Wine Tastings, MTB & Weekend Cottages",
        "pain_point_hook": "Birthday, bridal shower, and weekend group organisers collecting per-person picnic basket and cottage deposits on WhatsApp",
        "to": ["reservations@boschendal.co.za"],
        "subject": "Group lawn picnic and cottage booking deposits at Boschendal",
        "body": """Good morning Boschendal Reservations Team,

When a customer enquires for a group of 10 to 20 guests for a lawn picnic, birthday celebration, or multi-cottage weekend at Boschendal, the group organiser often delays confirming because they don't want to front the full payment on their own card while chasing friends on WhatsApp.

We built PullThru (https://pullthru.co.za/for-venues) here in South Africa to solve that bottleneck. The organiser drops a 15-second link into their WhatsApp group, every guest locks in their picnic basket or cottage share via PayShap, Capitec PayMe, Apple Pay, or card, and the organiser pays your single invoice on time.

There is R0 cost to Boschendal and zero integration required. You can try our free 10-second Venue Quote Snippet & Website Helper at https://pullthru.co.za/for-venues whenever your reservations desk sends out a group quote.

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
            if h:
                hosts.append(h)
        return hosts[0] if hosts else None
    except Exception:
        return None


def verify_email_deliverable(email_addr: str) -> bool:
    domain = email_addr.split("@")[1]
    mx = resolve_mx_host(domain)
    if not mx:
        print(f"  [MX FAIL] {email_addr} (no MX for {domain})")
        return False
    try:
        with smtplib.SMTP(mx, 25, timeout=8) as s:
            s.ehlo("pullthru.co.za")
            s.mail("support@pullthru.co.za")
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
        print(f"  [MX OK / PORT25 SKIPPED] {email_addr} via {mx} ({e})")
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
    print(f"ALL {len(valid_items)} BATCH-11 EMAILS DISPATCHED & SAVED.")


if __name__ == "__main__":
    main()
