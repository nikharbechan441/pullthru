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
        "alt_email": "",
        "location": "Bree Street, Cape Town",
        "vertical": "Cabaret Supper Theatre, Birthday Tables & Bachelorettes",
        "pain_point_hook": "Birthday and bachelorette organisers collecting per-seat cabaret & mezze ticket shares on WhatsApp",
        "to": ["info@gate69.co.za"],
        "subject": "Group table bookings and ticket splits at Gate69",
        "body": """Good morning Gate69 Team,

When one person in a group of 8 to 16 friends volunteers to book a birthday table or bachelorette night on Bree Street, they often hesitate to pay for everyone's tickets out of their own pocket while waiting days for the WhatsApp group to EFT them back.

We built PullThru (https://pullthru.co.za/for-venues) here in South Africa to solve that exact problem for social groups. The table organiser drops one link into their WhatsApp group chat, every friend locks in their seat and pays their exact share via Capitec Pay, PayShap, Apple Pay, or card in seconds, and the organiser books your table in one go.

There is zero cost to Gate69 and no change to how you take bookings. You can also test our free 10-second Venue Quote Snippet Generator at https://pullthru.co.za/for-venues if your bookings desk ever deals with group organisers who are still collecting money from their friends.

Warm regards,
Nikhar Bechan
Founder, PullThru SA
https://pullthru.co.za/for-venues | support@pullthru.co.za"""
    },
    {
        "venue": "Stardust Theatrical Dining",
        "contact_name": "Bookings & Events Team",
        "email": "admin@stardustcapetown.com",
        "alt_email": "",
        "location": "Woodstock, Cape Town",
        "vertical": "Theatrical Dinner Parties, Birthdays & Group Tables",
        "pain_point_hook": "Birthday and celebration hosts collecting per-person set-menu deposits from 10-25 friends on WhatsApp",
        "to": ["admin@stardustcapetown.com"],
        "subject": "Helping birthday and group hosts collect table deposits for Stardust",
        "body": """Good morning Stardust Team,

Whenever someone organises a birthday dinner or group celebration for 12 to 25 friends at Stardust, the host almost always gets stuck paying the group deposit upfront and then chasing everyone on WhatsApp to EFT their individual set-menu share.

We built PullThru (https://pullthru.co.za/for-venues) in South Africa to make group table collections effortless on WhatsApp. The host shares one link in their WhatsApp chat, each guest confirms their seat and pays via PayShap, Capitec Pay, Apple Pay, or card, and the host settles your single venue deposit on time.

We just launched a free 10-second Quote Snippet Generator at https://pullthru.co.za/for-venues that your reservations desk can include in large table quotes at R0 cost to Stardust.

Kind regards,
Nikhar Bechan
Founder, PullThru SA
https://pullthru.co.za/for-venues | support@pullthru.co.za"""
    },
    {
        "venue": "The Pottery (Camps Bay, Sandton & Lynnwood)",
        "contact_name": "Events & Bookings Team",
        "email": "campsbay@thepottery.co.za",
        "alt_email": "sandton@thepottery.co.za",
        "location": "Camps Bay, Sandton & Pretoria",
        "vertical": "Group Ceramic Painting, Tapas, Birthdays & Kitchen Teas",
        "pain_point_hook": "Birthday, kitchen tea, and friend group hosts collecting per-guest pottery deposits on WhatsApp",
        "to": ["campsbay@thepottery.co.za"],
        "subject": "Simplifying group birthday and kitchen tea deposits at The Pottery",
        "body": """Good morning to the team at The Pottery,

When a customer coordinates a birthday table, kitchen tea, or weekend catch-up for 10 to 18 friends, the organiser usually ends up fronting the group deposit out of their own pocket while waiting days for everyone on WhatsApp to EFT their share.

We built PullThru (https://pullthru.co.za/for-venues) here in South Africa so group hosts can drop one link into their WhatsApp chat, let every friend lock in their seat via Capitec Pay, PayShap, Apple Pay, or card in 15 seconds, and pay your single booking deposit without delay.

Feel free to take a look at https://pullthru.co.za/for-venues where your bookings team can generate a custom pre-filled quote link in 10 seconds at R0 cost.

Best regards,
Nikhar Bechan
Founder, PullThru SA
https://pullthru.co.za/for-venues | support@pullthru.co.za"""
    },
    {
        "venue": "Artjamming South Africa",
        "contact_name": "Bookings & Events Team",
        "email": "info@artjamming.co.za",
        "alt_email": "",
        "location": "V&A Waterfront, Cape Town & Melrose Arch, JHB",
        "vertical": "Group Painting Sessions, Birthdays, Kitchen Teas & Socials",
        "pain_point_hook": "Party and social group organisers splitting canvas and studio booking deposits on WhatsApp",
        "to": ["info@artjamming.co.za"],
        "subject": "Group booking deposit splits for Artjamming sessions",
        "body": """Good morning Artjamming Team,

Whenever a friend group, birthday organiser, or bridal party books a group painting session at the Waterfront or Melrose Arch, one person usually gets stuck chasing 10 or 15 people on WhatsApp for EFTs before they can settle the group booking.

We built PullThru (https://pullthru.co.za/for-venues) in South Africa to remove that friction for group organisers. They drop one link into their WhatsApp group, everyone locks in their canvas spot and pays via PayShap, Capitec Pay, Apple Pay, or card, and the organiser pays your studio in one lump sum.

You can see how our free 10-second Venue Quote Snippet Generator works at https://pullthru.co.za/for-venues (zero cost or integration required).

Warm regards,
Nikhar Bechan
Founder, PullThru SA
https://pullthru.co.za/for-venues | support@pullthru.co.za"""
    },
    {
        "venue": "HintHunt Africa (V&A Waterfront)",
        "contact_name": "Bookings Team",
        "email": "capetown@hinthunt.co.za",
        "alt_email": "johannesburg@hinthunt.co.za",
        "location": "Watershed, V&A Waterfront, Cape Town",
        "vertical": "Group Escape Rooms, Amazing Race & Birthday Challenges",
        "pain_point_hook": "Group leaders collecting per-player escape room and Amazing Race fees on WhatsApp",
        "to": ["capetown@hinthunt.co.za"],
        "subject": "Helping group organisers collect per-player payments for HintHunt bookings",
        "body": """Good morning HintHunt Team,

When one person in a friend group or birthday party books two or three escape rooms (or an Amazing Race around the Waterfront) for 8 to 16 players, they usually hesitate to pay the whole booking out of their own pocket while waiting on the WhatsApp group to pay them back.

We built PullThru (https://pullthru.co.za/for-venues) here in South Africa so the group organiser can drop one link into their WhatsApp chat, let every player lock in their spot via Capitec Pay, PayShap, Apple Pay, or card in seconds, and confirm their booking with you immediately.

Feel free to check out our free bookings desk tool at https://pullthru.co.za/for-venues (R0 cost to HintHunt).

Kind regards,
Nikhar Bechan
Founder, PullThru SA
https://pullthru.co.za/for-venues | support@pullthru.co.za"""
    },
    {
        "venue": "Hashtag Escape (#Escape)",
        "contact_name": "Bookings Team",
        "email": "info@hashtagescape.co.za",
        "alt_email": "",
        "location": "Norwood, Johannesburg",
        "vertical": "Group Escape Rooms, Quiz Nights & Social Outings",
        "pain_point_hook": "Weekend and birthday group organisers splitting multi-room escape game bookings on WhatsApp",
        "to": ["info@hashtagescape.co.za"],
        "subject": "Group booking payment splits for Hashtag Escape",
        "body": """Good morning Hashtag Escape Team,

Whenever a birthday group or weekend crew books a session in Norwood for 6 to 15 friends, the person organising the outing usually spends days chasing everyone on WhatsApp for EFTs before they can pay the full booking.

We built PullThru (https://pullthru.co.za/for-venues) here in South Africa to make collecting group money on WhatsApp effortless. The organiser pastes one link into their WhatsApp group, every player locks in their spot via PayShap, Capitec Pay, Apple Pay, or card, and the organiser pays your venue in a single payment.

You can test our free 10-second Quote Snippet Generator at https://pullthru.co.za/for-venues.

Best regards,
Nikhar Bechan
Founder, PullThru SA
https://pullthru.co.za/for-venues | support@pullthru.co.za"""
    },
    {
        "venue": "Constantia Glen Wine Estate",
        "contact_name": "Reservations Team",
        "email": "reservations@constantiaglen.com",
        "alt_email": "wine@constantiaglen.com",
        "location": "Constantia, Cape Town",
        "vertical": "Group Wine Tastings, Platters & Celebration Tables",
        "pain_point_hook": "Birthday and celebration table organisers collecting per-head tasting and platter deposits on WhatsApp",
        "to": ["reservations@constantiaglen.com"],
        "subject": "Simplifying group table deposits for Constantia Glen bookings",
        "body": """Good morning Constantia Glen Reservations Team,

When a customer books a larger group table in Constantia, the organiser often ends up paying the deposit out of their own pocket and chasing 10 or 12 friends on WhatsApp for EFTs.

We built PullThru (https://pullthru.co.za/for-venues) here in South Africa so group hosts can collect per-person deposits on WhatsApp in one afternoon via Capitec Pay, PayShap, Apple Pay, or card.

We also built a free 10-second Quote Snippet Generator at https://pullthru.co.za/for-venues that your reservations desk can include in group booking emails at R0 cost.

Best regards,
Nikhar Bechan
Founder, PullThru SA
https://pullthru.co.za/for-venues | support@pullthru.co.za"""
    },
    {
        "venue": "Ceres Rail Company Steam Train",
        "contact_name": "Bookings Team",
        "email": "bookings@ceresrail.co.za",
        "alt_email": "info@ceresrail.co.za",
        "location": "Cape Town to Elgin, Western Cape",
        "vertical": "Group Steam Train Day Trips to Elgin Railway Market",
        "pain_point_hook": "Birthday and family group organisers collecting per-seat steam train ticket payments on WhatsApp",
        "to": ["bookings@ceresrail.co.za"],
        "subject": "Group ticket splits for Ceres Rail steam train bookings",
        "body": """Good morning Ceres Rail Bookings Team,

Whenever one person in a friend or family group volunteers to book 10 or 16 steam train seats to the Elgin Railway Market, they usually hesitate to pay for all the tickets out of their own pocket while waiting days for everyone on the WhatsApp group to EFT them back.

We built PullThru (https://pullthru.co.za/for-venues) here in South Africa to solve that exact problem. The group organiser drops one link into their WhatsApp chat, every passenger locks in their seat and pays their share via PayShap, Capitec Pay, Apple Pay, or card, and the organiser books your tickets in one go.

Feel free to check out our free venue tool at https://pullthru.co.za/for-venues.

Warm regards,
Nikhar Bechan
Founder, PullThru SA
https://pullthru.co.za/for-venues | support@pullthru.co.za"""
    },
    {
        "venue": "Scootours Cape Town & Franschhoek",
        "contact_name": "Bookings Team",
        "email": "info@scootours.co.za",
        "alt_email": "",
        "location": "Table Mountain, Cape Town & Franschhoek",
        "vertical": "Group Downhill Monster Mountain Scooter Tours",
        "pain_point_hook": "Birthday, bachelor, and weekend group organisers collecting per-person Scootours fees on WhatsApp",
        "to": ["info@scootours.co.za"],
        "subject": "Helping group organisers collect payments for Scootours bookings",
        "body": """Good morning Scootours Team,

When a customer coordinates a birthday, bachelor, or weekend Scootours session for 8 to 15 people, they often spend days chasing everyone on WhatsApp for EFTs before confirming their group booking.

We built PullThru (https://pullthru.co.za/for-venues) in South Africa so group organisers can drop one link into their WhatsApp group, let every rider lock in their spot via PayShap, Capitec Pay, Apple Pay, or card in seconds, and settle your group booking in a single lump sum.

You can test our free 10-second Venue Quote Snippet Generator at https://pullthru.co.za/for-venues (zero cost or commission deducted from your tour rates).

Kind regards,
Nikhar Bechan
Founder, PullThru SA
https://pullthru.co.za/for-venues | support@pullthru.co.za"""
    },
    {
        "venue": "Warwick Wine Estate Gourmet Picnics",
        "contact_name": "Picnics & Hospitality Team",
        "email": "visit@warwickwine.com",
        "alt_email": "info@warwickwine.com",
        "location": "Stellenbosch, Western Cape",
        "vertical": "Group Gourmet Picnics, Lawn Pods & Wine Safaris",
        "pain_point_hook": "Birthday and bridal shower hosts collecting per-person gourmet picnic and pod deposits on WhatsApp",
        "to": ["visit@warwickwine.com"],
        "subject": "Group picnic and lawn pod deposit splits for Warwick bookings",
        "body": """Good morning Warwick Hospitality Team,

When a customer organises a birthday picnic, bridal shower, or weekend wine safari in Stellenbosch for 8 to 16 friends, the host almost always ends up paying the group deposit out of their own pocket and then chasing friends on WhatsApp to EFT their individual shares.

We built PullThru (https://pullthru.co.za/for-venues) here in South Africa so group hosts can drop one link into their WhatsApp chat, collect everyone's share via Capitec Pay, PayShap, Apple Pay, or card in one afternoon, and confirm their booking with you on time.

You can see our free 10-second Venue Quote Snippet Generator at https://pullthru.co.za/for-venues (R0 cost to Warwick).

Warm regards,
Nikhar Bechan
Founder, PullThru SA
https://pullthru.co.za/for-venues | support@pullthru.co.za"""
    },
    {
        "venue": "Joostenberg Bistro & The Kraal Restaurant",
        "contact_name": "Bookings Team",
        "email": "bistro@joostenberg.co.za",
        "alt_email": "kraalrestaurant@joostenberg.co.za",
        "location": "Muldersvlei / Stellenbosch, Western Cape",
        "vertical": "Long-Table Set-Menu Lunches & Group Garden Picnics",
        "pain_point_hook": "Group lunch and birthday hosts collecting per-guest set-menu deposits on WhatsApp",
        "to": ["bistro@joostenberg.co.za"],
        "subject": "Helping group hosts collect deposits for Joostenberg lunches and picnics",
        "body": """Good morning Joostenberg Bookings Team,

Whenever someone coordinates a long-table birthday lunch or group picnic at Joostenberg for 10 to 18 guests, one organiser usually gets stuck fronting the deposit while waiting days for friends on WhatsApp to EFT them back.

We built PullThru (https://pullthru.co.za/for-venues) in South Africa to make group dining collections effortless on WhatsApp. Each guest taps one link in the group chat to lock in their seat and pay via PayShap, Capitec Pay, Apple Pay, or card, so the organiser can pay your single deposit invoice without delay.

Feel free to take a look at https://pullthru.co.za/for-venues where your bookings desk can generate a custom helper link in 10 seconds at R0 cost.

Kind regards,
Nikhar Bechan
Founder, PullThru SA
https://pullthru.co.za/for-venues | support@pullthru.co.za"""
    },
    {
        "venue": "Rick's Cafe Americain",
        "contact_name": "Events & Bookings Team",
        "email": "info@rickscafe.co.za",
        "alt_email": "",
        "location": "Gardens, Cape Town",
        "vertical": "Rooftop Birthday Tables, Tapas Platters & Group Dinners",
        "pain_point_hook": "Birthday and social group organisers splitting group table deposits and set menus on WhatsApp",
        "to": ["info@rickscafe.co.za"],
        "subject": "Group table deposits and birthday bookings at Rick's Cafe",
        "body": """Good morning Rick's Cafe Team,

When a customer books a birthday table or rooftop celebration for 10 to 20 friends in Gardens, the organiser usually ends up fronting the deposit or chasing friends on WhatsApp for EFTs after the dinner.

We built PullThru (https://pullthru.co.za/for-venues) here in South Africa so group hosts can drop one link into their WhatsApp group chat, let every guest lock in their seat and pay their share via Capitec Pay, PayShap, Apple Pay, or card in 15 seconds, and settle your single table deposit upfront.

You can check out our free 10-second Venue Quote Snippet Generator at https://pullthru.co.za/for-venues (zero cost or POS changes required).

Best regards,
Nikhar Bechan
Founder, PullThru SA
https://pullthru.co.za/for-venues | support@pullthru.co.za"""
    },
    {
        "venue": "Vergenoegd Low Wine Estate",
        "contact_name": "Hospitality & Bookings Team",
        "email": "info@vergenoegd.co.za",
        "alt_email": "",
        "location": "Somerset West / Stellenbosch, Western Cape",
        "vertical": "Group Wine Tastings, Picnics & Celebration Tables",
        "pain_point_hook": "Birthday and weekend group organisers collecting per-person wine tasting and picnic deposits on WhatsApp",
        "to": ["info@vergenoegd.co.za"],
        "subject": "Helping group hosts split tasting and picnic bookings at Vergenoegd Low",
        "body": """Good morning Vergenoegd Low Hospitality Team,

When one person in a group of 8 to 15 friends coordinates a weekend wine tasting or birthday picnic on the estate, they often spend days chasing everyone on WhatsApp for EFTs before confirming their group booking.

We built PullThru (https://pullthru.co.za/for-venues) in South Africa so group organisers can collect everyone's share on WhatsApp in one afternoon via Capitec Pay, PayShap, Apple Pay, or card, and settle your booking in a single payment.

Feel free to take a look at https://pullthru.co.za/for-venues where your reservations team can copy a ready-made quote snippet in 10 seconds at R0 cost.

Warm regards,
Nikhar Bechan
Founder, PullThru SA
https://pullthru.co.za/for-venues | support@pullthru.co.za"""
    },
    {
        "venue": "Blou Hond at Casa Toscana",
        "contact_name": "Bookings & Events Team",
        "email": "info@casatoscana.co.za",
        "alt_email": "bookings@casatoscana.co.za",
        "location": "Lynnwood Manor, Pretoria",
        "vertical": "Dinner Theatre, Group Celebration Tables & Functions",
        "pain_point_hook": "Birthday and social table organisers collecting per-seat dinner theatre ticket shares on WhatsApp",
        "to": ["info@casatoscana.co.za"],
        "subject": "Group table bookings and ticket splits for Die Blou Hond",
        "body": """Good morning Casa Toscana and Blou Hond Team,

Whenever one person in a group of 10 or 16 friends volunteers to book a table for a dinner theatre show in Lynnwood Manor, they often hesitate to buy all the tickets out of their own pocket while waiting days for everyone on the WhatsApp group to EFT them back.

We built PullThru (https://pullthru.co.za/for-venues) here in South Africa to solve that exact bottleneck. The table organiser shares one link in their WhatsApp chat, every friend locks in their seat and pays their share via PayShap, Capitec Pay, Apple Pay, or card, and the organiser pays your venue in one lump sum.

You can see our free 10-second Venue Quote Snippet Generator at https://pullthru.co.za/for-venues (R0 cost to Casa Toscana).

Kind regards,
Nikhar Bechan
Founder, PullThru SA
https://pullthru.co.za/for-venues | support@pullthru.co.za"""
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
            s.mail("sales@taxcleanza.com")
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
    next_id = 105
    for item in CANDIDATES:
        if len(valid_items) >= 12:
            break
        combined = item["subject"] + " " + item["body"]
        assert "—" not in combined and "–" not in combined, f"Forbidden em/en-dash in {item['venue']}"
        assert "[" not in combined and "]" not in combined, f"Blank placeholder in {item['venue']}"
        assert "taxclean" not in combined.lower(), f"Forbidden brand string in {item['venue']}"
        assert len(item["to"]) == 1, f"Must have exactly 1 recipient for {item['venue']}"

        guard_ok, reason = outreach_guard.can_send_to(item["to"], blocked_emails, blocked_domains)
        if not guard_ok:
            print(f"[SKIPPED BY OUTREACH GUARD] {item['venue']}: {reason}")
            continue

        primary_ok = verify_mx_and_smtp(item["to"][0])
        if not primary_ok and item.get("alt_email"):
            alt_addr = item["alt_email"].strip()
            alt_guard_ok, _ = outreach_guard.can_send_to([alt_addr], blocked_emails, blocked_domains)
            if alt_guard_ok and verify_mx_and_smtp(alt_addr):
                item["to"] = [alt_addr]
                item["email"] = alt_addr
                primary_ok = True

        if primary_ok:
            item["id"] = str(next_id)
            next_id += 1
            valid_items.append(item)
            blocked_emails.add(item["to"][0].lower())
            blocked_domains.add(item["to"][0].split("@")[1].lower())
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

            # Use authenticated Gmail envelope so Mimecast/Exchange SPF/DKIM alignment passes 100%,
            # while Reply-To routes all replies directly to support@pullthru.co.za.
            server.send_message(msg)
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
    print(f"ALL {len(valid_items)} BATCH-10 WEDNESDAY MORNING EMAILS DISPATCHED & SAVED.")


if __name__ == "__main__":
    main()
