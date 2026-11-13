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
        "venue": "Gold Reef City Theme Park & Bowling",
        "contact_name": "Groups & Events Desk",
        "email": "goldreefcity.info@tsogosun.com",
        "alt_email": "",
        "location": "Ormonde, Johannesburg",
        "vertical": "Group Theme Park Outings, Bowling & Birthday Parties",
        "pain_point_hook": "Group organisers collecting per-person theme park and bowling shares on WhatsApp",
        "to": ["goldreefcity.info@tsogosun.com"],
        "subject": "Helping group organisers collect payments for Gold Reef City outings",
        "body": """Good morning Gold Reef City Groups Team,

Whenever a birthday organiser, social club, or friend group plans a trip to Gold Reef City for 10 to 20 people, one person usually gets stuck chasing everyone on WhatsApp for EFTs before they can pay for the group booking.

We built PullThru (https://pullthru.co.za/for-venues) here in South Africa to remove that bottleneck for group organisers. We also just launched a free 10-second Venue Quote Snippet Generator on our /for-venues page so your bookings desk can paste a 1-line link into any group quote. That link lets the organiser collect every guest's ticket share on WhatsApp via Capitec Pay, PayShap, Apple Pay, or card in one afternoon and pay your venue in a single lump sum.

There is zero cost to Gold Reef City and zero integration required.

You can test the bookings desk snippet generator directly at https://pullthru.co.za/for-venues.

Kind regards,
Nikhar Bechan
Founder, PullThru SA
https://pullthru.co.za/for-venues | support@pullthru.co.za"""
    },
    {
        "venue": "Woodlands Spa & Hydro",
        "contact_name": "Spa Bookings Team",
        "email": "info@woodlandsspa.co.za",
        "alt_email": "",
        "location": "Muldersdrift, Cradle of Humankind, Gauteng",
        "vertical": "Bridal Showers, Group Pamper Days & River Spa Packages",
        "pain_point_hook": "Bridesmaids and birthday organisers collecting per-person spa package deposits on WhatsApp",
        "to": ["info@woodlandsspa.co.za"],
        "subject": "Simplifying bridal shower and group spa deposits at Woodlands Spa",
        "body": """Good morning Woodlands Spa Team,

When a maid of honour or birthday organiser books a group spa day in Muldersdrift for 8 to 16 ladies, their biggest delay in confirming the booking is usually chasing everyone on WhatsApp for their individual package EFTs.

We built PullThru (https://pullthru.co.za/for-venues) in South Africa to help group organisers collect per-guest shares on WhatsApp in hours via Capitec Pay, PayShap, Apple Pay, or card, so they can pay your single lump-sum deposit before their provisional hold expires.

You can see how venues use our free 10-second Quote Snippet Generator at https://pullthru.co.za/for-venues (it costs Woodlands Spa R0 and requires no change to your booking software).

Best regards,
Nikhar Bechan
Founder, PullThru SA
https://pullthru.co.za/for-venues | support@pullthru.co.za"""
    },
    {
        "venue": "Piggly Wiggly Country Village & Adventures",
        "contact_name": "Bookings & Events Team",
        "email": "info@pigglywiggly.co.za",
        "alt_email": "",
        "location": "Lions River / Howick, KwaZulu-Natal Midlands",
        "vertical": "Midlands Group Activities, Putt-Putt, Candle Dipping & Lunches",
        "pain_point_hook": "Midlands group outing and birthday organisers splitting activity and lunch bookings on WhatsApp",
        "to": ["info@pigglywiggly.co.za"],
        "subject": "Group outing payment splits for Piggly Wiggly Midlands visitors",
        "body": """Good morning Piggly Wiggly Team,

Whenever a birthday group, family gathering, or Midlands weekend crew coordinates a group visit for 10 to 20 people, one organiser usually ends up fronting the deposit and chasing friends on WhatsApp for their individual shares.

We built PullThru (https://pullthru.co.za/for-venues) here in South Africa to make group WhatsApp collections effortless. The organiser drops one link into their WhatsApp group, everyone locks in their spot via PayShap, Capitec Pay, Apple Pay, or card, and the organiser pays your venue in one clean payment.

Feel free to take a look at our new venue page at https://pullthru.co.za/for-venues, where your bookings desk can generate a custom pre-filled link in 10 seconds at R0 cost.

Kind regards,
Nikhar Bechan
Founder, PullThru SA
https://pullthru.co.za/for-venues | support@pullthru.co.za"""
    },
    {
        "venue": "The Cooking Studio",
        "contact_name": "Bookings & Events Team",
        "email": "info@thecookingstudio.co.za",
        "alt_email": "",
        "location": "Johannesburg & Pretoria, Gauteng",
        "vertical": "Group Cooking Parties, Kitchen Teas & Social Culinary Nights",
        "pain_point_hook": "Birthday, kitchen tea, and social group hosts collecting per-head cooking party deposits on WhatsApp",
        "to": ["info@thecookingstudio.co.za"],
        "subject": "Group deposit collection for The Cooking Studio bookings",
        "body": """Good morning to the team at The Cooking Studio,

When someone organises a private group cooking night, birthday celebration, or kitchen tea for 10 to 20 guests, the host almost always gets stuck paying the deposit upfront and then chasing friends on WhatsApp to EFT their per-person share.

We built PullThru (https://pullthru.co.za/for-venues) in South Africa so group hosts can drop one link into their WhatsApp group, let every guest lock in their spot and pay via Capitec Pay, PayShap, Apple Pay, or card, and then pay your studio invoice in full.

We recently added a free 10-second Venue Quote Snippet Generator at https://pullthru.co.za/for-venues that your bookings desk can include in group quotes at R0 cost.

Best regards,
Nikhar Bechan
Founder, PullThru SA
https://pullthru.co.za/for-venues | support@pullthru.co.za"""
    },
    {
        "venue": "Wicked Food Earth & Cooking School",
        "contact_name": "Bookings Team",
        "email": "info@wickedfood.co.za",
        "alt_email": "",
        "location": "Hekpoort / Sunninghill, Gauteng",
        "vertical": "Group Cooking Workshops, Farm Lunches & Team Socials",
        "pain_point_hook": "Social group leaders collecting per-guest cooking workshop and lunch shares on WhatsApp",
        "to": ["info@wickedfood.co.za"],
        "subject": "Helping group hosts collect per-person payments for Wicked Food bookings",
        "body": """Good morning Wicked Food Team,

Whenever a customer coordinates a group cooking workshop or country lunch for 10 to 18 friends, one organiser usually ends up managing a manual WhatsApp list and chasing missing EFTs before they can confirm final headcount.

We built PullThru (https://pullthru.co.za/for-venues) here in South Africa to make group collections effortless on WhatsApp. Each guest taps one link in the WhatsApp chat to lock in their seat and pay their exact share via PayShap, Capitec Pay, Apple Pay, or card, so the organiser can pay your single booking invoice without delay.

You can see how our free bookings desk tool works at https://pullthru.co.za/for-venues (zero cost or integration required).

Kind regards,
Nikhar Bechan
Founder, PullThru SA
https://pullthru.co.za/for-venues | support@pullthru.co.za"""
    },
    {
        "venue": "Jack Black's Brewing Co. Taproom",
        "contact_name": "Taproom & Events Team",
        "email": "taproom@jackblackbeer.com",
        "alt_email": "info@jackblackbeer.com",
        "location": "Diep River, Cape Town",
        "vertical": "Craft Brewery Tours, Long-Table Bookings & Group Socials",
        "pain_point_hook": "Birthday, bachelor, and Friday social organisers splitting brewery tour and table deposits on WhatsApp",
        "to": ["taproom@jackblackbeer.com"],
        "subject": "Group table and brewery tour deposit splits at Jack Black's Taproom",
        "body": """Good morning Jack Black's Taproom Team,

Whenever a customer books a long table, brewery tour, or birthday celebration for 12 to 25 friends in Diep River, the organiser usually gets stuck fronting the deposit or chasing friends on WhatsApp for EFTs.

We built PullThru (https://pullthru.co.za/for-venues) here in South Africa to make group kitties and deposit splits effortless on WhatsApp. The organiser shares one link in their WhatsApp group so every mate locks in their spot and pays via PayShap, Capitec Pay, Apple Pay, or card in 15 seconds.

Take a look at https://pullthru.co.za/for-venues where your taproom bookings coordinator can generate a custom pre-filled quote link in 10 seconds at R0 cost to Jack Black's.

Best regards,
Nikhar Bechan
Founder, PullThru SA
https://pullthru.co.za/for-venues | support@pullthru.co.za"""
    },
    {
        "venue": "Hout Bay Seal Snorkeling & Animal Ocean",
        "contact_name": "Bookings Team",
        "email": "info@animalocean.co.za",
        "alt_email": "",
        "location": "Hout Bay, Cape Town",
        "vertical": "Group Seal Snorkeling, Ocean Safaris & Boat Trips",
        "pain_point_hook": "Weekend adventure and birthday group leaders splitting boat trip and snorkeling fees on WhatsApp",
        "to": ["info@animalocean.co.za"],
        "subject": "Helping group organisers collect payments for Animal Ocean trips",
        "body": """Good morning Animal Ocean Team,

When one person in a group of 8 to 12 friends offers to book a seal snorkeling trip in Hout Bay, they usually wait days for everyone on the WhatsApp group to EFT their ticket share before confirming the boat booking.

We built PullThru (https://pullthru.co.za/for-venues) in South Africa so group leaders can collect per-person payments on WhatsApp in one afternoon via Capitec Pay, PayShap, Apple Pay, or card, and then pay your booking in a single lump sum.

You can check out our free venue quote snippet generator at https://pullthru.co.za/for-venues (zero cost or commission deducted from your tour rates).

Kind regards,
Nikhar Bechan
Founder, PullThru SA
https://pullthru.co.za/for-venues | support@pullthru.co.za"""
    },
    {
        "venue": "Kievits Kroon Gauteng Wine Estate & Spa",
        "contact_name": "Reservations & Spa Team",
        "email": "reservations@kievitskroon.co.za",
        "alt_email": "",
        "location": "Kameeldrift East, Pretoria, Gauteng",
        "vertical": "Group Winelands Spa Days, High Teas & Weekend Getaways",
        "pain_point_hook": "Bridal shower, birthday, and spa group organisers collecting per-guest package deposits on WhatsApp",
        "to": ["reservations@kievitskroon.co.za"],
        "subject": "Simplifying group spa and weekend booking deposits at Kievits Kroon",
        "body": """Good morning Kievits Kroon Reservations Team,

When a customer coordinates a group spa day, bridal celebration, or weekend getaway for 8 to 16 guests in Pretoria, the organiser often struggles to collect everyone's package share on WhatsApp before the provisional booking deposit is due.

We built PullThru (https://pullthru.co.za/for-venues) here in South Africa so group organisers can drop one link into their WhatsApp chat, let each guest pay their exact share via PayShap, Capitec Pay, Apple Pay, or card, and then settle your single invoice on time.

We just launched a dedicated venue tool at https://pullthru.co.za/for-venues where your reservations team can generate a ready-to-paste quote snippet in 10 seconds at R0 cost to Kievits Kroon.

Warm regards,
Nikhar Bechan
Founder, PullThru SA
https://pullthru.co.za/for-venues | support@pullthru.co.za"""
    },
    {
        "venue": "Old MacDaddy Luxury Trailer Park",
        "contact_name": "Reservations Team",
        "email": "reservations@oldmacdaddy.co.za",
        "alt_email": "info@oldmacdaddy.co.za",
        "location": "Elgin Valley / Grabouw, Western Cape",
        "vertical": "Group Weekend Getaways, Airstream Trailers & Group Functions",
        "pain_point_hook": "Friend groups booking multiple Airstream trailers or Villas who split weekend accommodation deposits on WhatsApp",
        "to": ["reservations@oldmacdaddy.co.za"],
        "subject": "Helping friend groups split weekend bookings at Old MacDaddy",
        "body": """Good morning Old MacDaddy Reservations Team,

Whenever a group of friends books several Airstream trailers or a weekend getaway in Elgin, one person volunteers to make the reservation and then spends days chasing 8 to 14 friends on WhatsApp for their accommodation shares before the deposit expires.

We built PullThru (https://pullthru.co.za/for-venues) here in South Africa to make group weekend kitties effortless on WhatsApp. The organiser shares one link in their WhatsApp chat, every friend locks in their share via Capitec Pay, PayShap, Apple Pay, or card, and the organiser pays your single reservation deposit in full.

Feel free to take a look at https://pullthru.co.za/for-venues, where your reservations desk can copy a custom quote snippet in 10 seconds at R0 cost.

Best regards,
Nikhar Bechan
Founder, PullThru SA
https://pullthru.co.za/for-venues | support@pullthru.co.za"""
    },
    {
        "venue": "Croc City Crocodile & Reptile Park (Zipline & Pizza)",
        "contact_name": "Bookings Team",
        "email": "info@croccity.co.za",
        "alt_email": "",
        "location": "Chartwell / Fourways, Gauteng",
        "vertical": "Group Zipline Tours, Birthday Parties & Outings",
        "pain_point_hook": "Birthday parents and weekend group leaders collecting per-person zipline and park fees on WhatsApp",
        "to": ["info@croccity.co.za"],
        "subject": "Group booking deposit collection for Croc City outings",
        "body": """Good morning Croc City Team,

When a parent or group organiser coordinates a birthday party or group zipline outing in Fourways for 10 to 20 guests, they usually end up chasing everyone on WhatsApp for EFTs before confirming final numbers.

We built PullThru (https://pullthru.co.za/for-venues) in South Africa so the organiser can drop one link into their WhatsApp group, let every guest lock in their spot via PayShap, Capitec Pay, Apple Pay, or card, and settle your booking in a single payment.

You can test our free 10-second Venue Quote Snippet Generator at https://pullthru.co.za/for-venues (R0 cost to Croc City).

Kind regards,
Nikhar Bechan
Founder, PullThru SA
https://pullthru.co.za/for-venues | support@pullthru.co.za"""
    },
    {
        "venue": "Pont de Val Riverside Escape & Spa",
        "contact_name": "Bookings & Events Team",
        "email": "bookings@pontdeval.com",
        "alt_email": "info@pontdeval.com",
        "location": "Parys / Vaal River, Free State & Gauteng Border",
        "vertical": "Group Riverside Picnics, Boat Cruises, Spa & Weekend Stays",
        "pain_point_hook": "Birthday, bridal shower, and Vaal weekend organisers collecting per-guest picnic and spa deposits on WhatsApp",
        "to": ["bookings@pontdeval.com"],
        "subject": "Simplifying group picnic and spa deposits at Pont de Val",
        "body": """Good morning Pont de Val Bookings Team,

When a customer organises a group picnic, river cruise, or spa celebration on the Vaal for 10 to 20 friends, the organiser often hesitates to pay the full deposit upfront while waiting days for everyone on WhatsApp to EFT their share.

We built PullThru (https://pullthru.co.za/for-venues) here in South Africa to solve that bottleneck. Your bookings team can use our free 10-second Quote Snippet Generator at https://pullthru.co.za/for-venues to include a helper link in group quotes so the organiser collects from their group in one afternoon and settles your invoice on time.

Warm regards,
Nikhar Bechan
Founder, PullThru SA
https://pullthru.co.za/for-venues | support@pullthru.co.za"""
    },
    {
        "venue": "Spier Wine Farm Picnics & Tastings",
        "contact_name": "Hospitality & Bookings Team",
        "email": "info@spier.co.za",
        "alt_email": "",
        "location": "Stellenbosch, Western Cape",
        "vertical": "Group Wine Farm Picnics, Tastings & Segway Tours",
        "pain_point_hook": "Birthday and social group hosts collecting per-person picnic basket and wine tasting deposits on WhatsApp",
        "to": ["info@spier.co.za"],
        "subject": "Helping group hosts split picnic and tasting bookings at Spier",
        "body": """Good morning Spier Hospitality Team,

Whenever a birthday organiser or friend group books a group picnic or wine tasting in Stellenbosch for 10 to 18 guests, one person usually has to front the group deposit and then chase friends on WhatsApp to EFT their shares.

We built PullThru (https://pullthru.co.za/for-venues) in South Africa so group hosts can drop one link into their WhatsApp chat, let every guest lock in their spot via Capitec Pay, PayShap, Apple Pay, or card, and settle their booking deposit on time.

You can see our free 10-second Venue Quote Snippet Generator at https://pullthru.co.za/for-venues (zero cost or integration required).

Kind regards,
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
    next_id = 93
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
    print(f"ALL {len(valid_items)} BATCH-9 FOR-VENUES EMAILS DISPATCHED & SAVED.")


if __name__ == "__main__":
    main()
