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
        "venue": "Stir Crazy Cooking School",
        "contact_name": "Bookings & Events Team",
        "email": "enquiries@stircrazycooking.co.za",
        "alt_email": "info@stircrazycooking.co.za",
        "location": "V&A Waterfront, Cape Town",
        "vertical": "Group Cooking Classes & Private Culinary Parties",
        "pain_point_hook": "Birthday, kitchen tea, and team social organisers collecting per-head cooking class fees on WhatsApp",
        "to": ["enquiries@stircrazycooking.co.za"],
        "subject": "Group booking payments for Stir Crazy Cooking classes",
        "body": """Good morning Stir Crazy Cooking School Team,

When a customer organises a private group cooking class, birthday evening, or team social for 10 to 20 friends at the V&A Waterfront, the person coordinating the group usually ends up paying the invoice upfront and then spending days chasing everyone on WhatsApp to EFT their per-person share.

We built PullThru (https://pullthru.co.za) here in South Africa to solve that exact headache for group organisers. The host drops one link into their WhatsApp group chat, and each guest confirms their apron spot and pays their exact share via Capitec Pay, PayShap, Apple Pay, or card in seconds.

There is zero cost to Stir Crazy Cooking School and nothing is deducted from your class rates (any small R1 to R2 processing fee is covered by the guests chipping in).

Feel free to take a look at https://pullthru.co.za, and let me know if you would like a custom sample link your bookings desk can share with private group enquiries.

Kind regards,
Nikhar Bechan
Founder, PullThru SA
https://pullthru.co.za | support@pullthru.co.za"""
    },
    {
        "venue": "Ginger & Lime Food Studio",
        "contact_name": "Events & Bookings Team",
        "email": "info@gingerandlime.co.za",
        "alt_email": "",
        "location": "Fresnaye, Cape Town",
        "vertical": "Interactive Group Cooking Evenings & Celebrations",
        "pain_point_hook": "Social group hosts collecting per-guest interactive cooking night deposits on WhatsApp",
        "to": ["info@gingerandlime.co.za"],
        "subject": "Helping group hosts collect per-person payments for Ginger & Lime",
        "body": """Good morning Ginger & Lime Team,

Whenever a friend group or birthday organiser books an interactive cooking evening in Fresnaye, one person almost always has to front the group deposit out of their own pocket while waiting days for 12 or 16 friends on WhatsApp to send EFT proof of payments.

I am reaching out to share PullThru (https://pullthru.co.za), a local South African web tool built for social group organisers. Instead of managing a manual list on WhatsApp, the host shares one link in their group chat so each guest can lock in their seat and pay their share via PayShap, Capitec Pay, Apple Pay, or card with no app download required.

It costs Ginger & Lime R0 and nothing comes off your event packages.

If your events team ever speaks with hosts who are waiting on their friends to pay before confirming their final headcount, I would be happy to send over a quick example link.

Warm regards,
Nikhar Bechan
Founder, PullThru SA
https://pullthru.co.za | support@pullthru.co.za"""
    },
    {
        "venue": "Life Day Spa",
        "contact_name": "Group Bookings & Spa Team",
        "email": "info@lifedayspa.co.za",
        "alt_email": "rosebank@lifedayspa.co.za",
        "location": "Rosebank, Fourways, Century City & Pretoria",
        "vertical": "Group Spa Packages, Bridal Showers & Pamper Days",
        "pain_point_hook": "Bridesmaids and birthday organisers collecting per-person spa package deposits on WhatsApp",
        "to": ["info@lifedayspa.co.za"],
        "subject": "Simplifying bridal shower and group spa deposits at Life Day Spa",
        "body": """Good morning Life Day Spa Team,

When a maid of honour or birthday organiser plans a group spa morning for 8 to 15 ladies, their biggest challenge is usually collecting each person's package share on WhatsApp before they can pay the group booking deposit.

We built PullThru (https://pullthru.co.za) here in South Africa to make group kitties and per-guest spa splits effortless on WhatsApp. The organiser shares one link in their WhatsApp chat, and each guest confirms their treatment package and pays their share via Capitec Pay, PayShap, Apple Pay, or card in under 15 seconds.

There is no cost or software change required from Life Day Spa, and your spa receives 100% of your package rate (guests cover the small R1 to R2 fee when they chip in).

You are welcome to see how it works at https://pullthru.co.za. If it looks useful for your group bookings coordinators, I would be glad to share a custom demo link.

Best regards,
Nikhar Bechan
Founder, PullThru SA
https://pullthru.co.za | support@pullthru.co.za"""
    },
    {
        "venue": "Mangwanani African Spa",
        "contact_name": "Central Reservations Team",
        "email": "info@mangwanani.co.za",
        "alt_email": "",
        "location": "Gauteng, KwaZulu-Natal & Western Cape",
        "vertical": "Full-Day & Night Spa Group Packages",
        "pain_point_hook": "Group leaders collecting per-person African spa package payments from friends and colleagues on WhatsApp",
        "to": ["info@mangwanani.co.za"],
        "subject": "Helping group organisers collect payments for Mangwanani bookings",
        "body": """Good morning Mangwanani Reservations Team,

Whether it is a birthday celebration, bridal group, or year-end staff outing, the person coordinating a group booking for 10 to 20 guests usually gets stuck chasing everyone on WhatsApp for EFTs before they can settle the full booking.

I wanted to introduce PullThru (https://pullthru.co.za), a South African web tool that lets any group organiser collect per-person spa package payments directly from their WhatsApp group. They drop one link into the chat, and each guest claims their spot and pays their exact share via PayShap, Capitec Pay, Apple Pay, or card.

There is zero cost to Mangwanani and nothing is deducted from your package prices (the small R1 to R2 transaction fee is absorbed by the guests chipping in).

If your reservations agents frequently assist group organisers who are still collecting money from their group before confirming, I would be happy to share a quick demo link they can pass along.

Kind regards,
Nikhar Bechan
Founder, PullThru SA
https://pullthru.co.za | support@pullthru.co.za"""
    },
    {
        "venue": "Cape Town Comedy Club",
        "contact_name": "Bookings & Events Team",
        "email": "info@capetowncomedy.com",
        "alt_email": "",
        "location": "The Pumphouse, V&A Waterfront, Cape Town",
        "vertical": "Live Stand-Up Comedy & Group Dinner Tables",
        "pain_point_hook": "Birthday and social table organisers splitting comedy club tickets on WhatsApp",
        "to": ["info@capetowncomedy.com"],
        "subject": "Group table bookings and ticket splits for Cape Town Comedy Club",
        "body": """Good morning Cape Town Comedy Club Team,

When one person in a group of 10 or 12 friends offers to book a birthday table for a comedy show at the Pumphouse, they often hesitate to buy all the tickets out of their own pocket while waiting days for everyone on the WhatsApp group to pay them back.

We built PullThru (https://pullthru.co.za) here in South Africa to solve that exact problem for social groups. The table organiser pastes one link into their WhatsApp group chat, and every friend locks in their seat and pays their ticket share immediately via Capitec Pay, PayShap, Apple Pay, or card.

There is zero cost to Cape Town Comedy Club and nothing comes off your ticket prices (any small R1 to R2 fee is covered by the friends chipping in).

Feel free to take a look at https://pullthru.co.za, and let me know if you would like a quick example link your bookings desk can mention to large table enquiries.

Warm regards,
Nikhar Bechan
Founder, PullThru SA
https://pullthru.co.za | support@pullthru.co.za"""
    },
    {
        "venue": "The Bioscope Independent Cinema",
        "contact_name": "Events & Bookings Team",
        "email": "info@thebioscope.co.za",
        "alt_email": "",
        "location": "44 Stanley, Milpark, Johannesburg",
        "vertical": "Private Cinema Screenings, Comedy & Pizza Nights",
        "pain_point_hook": "Private screening and birthday hosts collecting per-seat cinema and pizza combo shares on WhatsApp",
        "to": ["info@thebioscope.co.za"],
        "subject": "Private screening and group booking splits at The Bioscope",
        "body": """Good morning to the team at The Bioscope,

Whenever a customer books a private cinema hire or organises a birthday group for 15 to 30 friends at 44 Stanley, the organiser usually ends up fronting the venue fee and then chasing friends on WhatsApp to EFT their individual ticket and pizza shares.

We recently launched PullThru (https://pullthru.co.za), a South African web tool built to make group event collections effortless on WhatsApp. The host shares one link in their WhatsApp chat, and each guest RSVPs and pays their share via Apple Pay, Capitec Pay, PayShap, or card in seconds.

It costs The Bioscope R0 and requires no change to how you take bookings.

If this sounds like a useful optional tool for customers booking private screenings or group nights with you, I would be glad to share a quick demo link.

Best regards,
Nikhar Bechan
Founder, PullThru SA
https://pullthru.co.za | support@pullthru.co.za"""
    },
    {
        "venue": "Cape Town Gin & Spirits Company",
        "contact_name": "Tasting Room & Events Team",
        "email": "info@capetowngincompany.co.za",
        "alt_email": "",
        "location": "V&A Waterfront, Cape Town",
        "vertical": "Group Gin Tastings, Blending Experiences & Socials",
        "pain_point_hook": "Birthday, bachelorette, and social group hosts collecting per-person gin tasting fees on WhatsApp",
        "to": ["info@capetowngincompany.co.za"],
        "subject": "Group tasting deposits and WhatsApp splits for Cape Town Gin",
        "body": """Good morning Cape Town Gin Team,

When someone coordinates a birthday gin tasting, bachelorette, or Friday afternoon group session for 10 to 15 friends, the organiser usually gets stuck managing a manual WhatsApp list and chasing missing EFTs before confirming the group booking.

I am reaching out to introduce PullThru (https://pullthru.co.za), a local South African web tool that lets group organisers collect per-person tasting payments on WhatsApp in one afternoon. They drop a single link into their WhatsApp group so each guest can claim their seat and pay via Capitec Pay, PayShap, Apple Pay, or card.

There is no cost to Cape Town Gin and nothing is deducted from your tasting fees.

You can check it out at https://pullthru.co.za, and I would be happy to put together a custom sample link for your tasting room bookings desk if useful.

Kind regards,
Nikhar Bechan
Founder, PullThru SA
https://pullthru.co.za | support@pullthru.co.za"""
    },
    {
        "venue": "Darling Brew Tasteroom & Brewery",
        "contact_name": "Tasteroom Bookings Team",
        "email": "tasteroom@darlingbrew.co.za",
        "alt_email": "info@darlingbrew.co.za",
        "location": "Darling, West Coast, Western Cape",
        "vertical": "Craft Brewery Tours, Group Tastings & Long-Table Lunches",
        "pain_point_hook": "West Coast day-trip, birthday, and MTB group organisers splitting brewery tasting and lunch deposits",
        "to": ["tasteroom@darlingbrew.co.za"],
        "subject": "Simplifying group booking deposits at Darling Brew Tasteroom",
        "body": """Good morning Darling Brew Tasteroom Team,

When a group of friends, mountain bikers, or birthday guests plans a weekend trip out to Darling for a brewery tasting and lunch, one person usually ends up paying the group deposit and chasing everyone else on WhatsApp for EFTs.

We built PullThru (https://pullthru.co.za) here in South Africa to remove that friction for group organisers. The organiser drops one link into their WhatsApp group chat, and every guest locks in their spot and pays their exact share via PayShap, Capitec Pay, Apple Pay, or card in seconds.

There is zero cost to Darling Brew and nothing comes off your tasting or function rates (any small R1 to R2 fee is covered by the guests chipping in).

If your tasteroom team ever speaks with group organisers who are waiting on friends to pay before confirming their numbers, I would be glad to share a quick demo link.

Warm regards,
Nikhar Bechan
Founder, PullThru SA
https://pullthru.co.za | support@pullthru.co.za"""
    },
    {
        "venue": "AfriCamps Boutique Glamping",
        "contact_name": "Reservations & Marketing Team",
        "email": "hello@africamps.com",
        "alt_email": "",
        "location": "Western Cape, Garden Route, KZN, Mpumalanga & Hoedspruit",
        "vertical": "Group Weekend Glamping Getaways & Multi-Tent Bookings",
        "pain_point_hook": "Friends and families booking multiple glamping tents who split weekend accommodation costs on WhatsApp",
        "to": ["hello@africamps.com"],
        "subject": "Helping group organisers split multi-tent AfriCamps bookings on WhatsApp",
        "body": """Good morning AfriCamps Team,

Whenever a group of friends or couples plans a weekend away across two or three glamping tents, one person always volunteers to make the booking and then gets stuck chasing 8 to 12 people on WhatsApp for their accommodation shares before the deposit deadline expires.

We built PullThru (https://pullthru.co.za) here in South Africa to make group weekend kitties and per-person splits effortless on WhatsApp. The trip organiser shares one link in their WhatsApp group, and each friend locks in their bed or tent share and pays via Capitec Pay, PayShap, Apple Pay, or card in seconds.

It costs AfriCamps R0 and requires no change to your existing reservation system.

Feel free to take a look at https://pullthru.co.za. If you think this could help group enquiries confirm their multi-tent bookings faster, I would be happy to share a custom example link.

Best regards,
Nikhar Bechan
Founder, PullThru SA
https://pullthru.co.za | support@pullthru.co.za"""
    },
    {
        "venue": "Aquila Private Game Reserve & Spa",
        "contact_name": "Reservations Team",
        "email": "res@aquilasafari.com",
        "alt_email": "",
        "location": "Touws River, Western Cape",
        "vertical": "Day Trip Safaris, Group Game Drives & Weekend Lodges",
        "pain_point_hook": "Birthday, family, and social group organisers collecting per-person day-trip safari payments on WhatsApp",
        "to": ["res@aquilasafari.com"],
        "subject": "Group day-safari payment splits for Aquila bookings",
        "body": """Good morning Aquila Reservations Team,

When a customer coordinates a birthday day-safari, horse-back safari, or weekend lodge trip to Aquila for 8 to 16 friends, the person organising the trip usually hesitates to pay for everyone out of their own pocket while waiting days for the WhatsApp group to EFT them back.

I am reaching out to introduce PullThru (https://pullthru.co.za), a South African web tool built to help group leaders collect per-person safari and transport shares on WhatsApp in one afternoon. They drop a single link into their WhatsApp chat, and each guest confirms their seat and pays via Capitec Pay, PayShap, Apple Pay, or card.

There is zero cost to Aquila Private Game Reserve and nothing is deducted from your safari rates (the small R1 to R2 fee is covered by the guests chipping in).

If your reservations team frequently assists group organisers who are still collecting funds from their group before paying their deposit, I would be glad to share a quick demo link.

Kind regards,
Nikhar Bechan
Founder, PullThru SA
https://pullthru.co.za | support@pullthru.co.za"""
    },
    {
        "venue": "Mirage Catamaran",
        "contact_name": "Charters & Bookings Team",
        "email": "info@miragecatamaran.com",
        "alt_email": "",
        "location": "V&A Waterfront, Cape Town",
        "vertical": "Luxury Sunset Cruises, Yacht Parties & Group Celebrations",
        "pain_point_hook": "Birthday, bachelorette, and sunset cruise group organisers collecting per-ticket shares on WhatsApp",
        "to": ["info@miragecatamaran.com"],
        "subject": "Helping group organisers collect payments for Mirage Catamaran cruises",
        "body": """Good morning Mirage Catamaran Team,

With summer sunset sails and birthday cruises in full swing at the V&A Waterfront, I wanted to share a local tool we built called PullThru (https://pullthru.co.za) that helps group organisers collect per-ticket cruise payments from their friends on WhatsApp.

Often when someone organises a sunset cruise for 12 to 20 friends, they get stuck managing a messy WhatsApp list and chasing missing EFT proof of payments before they can confirm their group booking. With PullThru, the organiser drops one link into their WhatsApp group so each guest can lock in their boarding spot and pay via Capitec Pay, PayShap, Apple Pay, or card in seconds.

There is no cost to Mirage Catamaran and nothing comes off your ticket or charter prices.

You are welcome to see how it works at https://pullthru.co.za, and I would be happy to share a custom demo link for your bookings desk.

Warm regards,
Nikhar Bechan
Founder, PullThru SA
https://pullthru.co.za | support@pullthru.co.za"""
    },
    {
        "venue": "Brahman Hills",
        "contact_name": "Reservations & Events Team",
        "email": "reservations@brahmanhills.co.za",
        "alt_email": "",
        "location": "Nottingham Road, KwaZulu-Natal Midlands",
        "vertical": "Midlands Group Weekend Cottages, Spa & Celebration Dining",
        "pain_point_hook": "Midlands weekend away, wedding guest, and spa group organisers splitting cottage and dining deposits on WhatsApp",
        "to": ["reservations@brahmanhills.co.za"],
        "subject": "Simplifying group cottage and spa booking splits at Brahman Hills",
        "body": """Good morning Brahman Hills Reservations Team,

Whenever a group of friends or wedding guests books multi-bedroom cottages or a group spa day in the Midlands, one organiser usually ends up fronting the deposit and spending days chasing everyone else on WhatsApp for their individual shares.

We built PullThru (https://pullthru.co.za) here in South Africa to make group weekend collections effortless on WhatsApp. The organiser shares one link in their WhatsApp chat, and every guest locks in their spot and pays their exact cottage or spa share via PayShap, Capitec Pay, Apple Pay, or card in seconds.

There is zero cost to Brahman Hills and nothing is deducted from your accommodation or spa rates (guests cover the small R1 to R2 fee when they chip in).

Feel free to take a look at https://pullthru.co.za, and let me know if you would like a sample link your reservations team can share with group organisers.

Best regards,
Nikhar Bechan
Founder, PullThru SA
https://pullthru.co.za | support@pullthru.co.za"""
    },
    {
        "venue": "The Tasting Room & Waterkloof Wine Estate",
        "contact_name": "Hospitality & Bookings Team",
        "email": "info@waterkloofwines.co.za",
        "alt_email": "restaurant@waterkloofwines.co.za",
        "location": "Somerset West / Helderberg, Western Cape",
        "vertical": "Group Wine Tastings, Cheese Platters & Set-Menu Lunches",
        "pain_point_hook": "Birthday and social group organisers collecting per-head wine tasting and lunch deposits on WhatsApp",
        "to": ["info@waterkloofwines.co.za"],
        "subject": "Group tasting and lunch deposit splits for Waterkloof bookings",
        "body": """Good morning Waterkloof Hospitality Team,

When a customer organises a birthday lunch or group wine tasting for 10 to 16 friends in the Helderberg, the host almost always ends up paying the table deposit out of their own pocket and then chasing friends on WhatsApp to EFT them back.

We recently launched PullThru (https://pullthru.co.za), a South African web tool that lets group hosts collect per-person tasting and set-menu deposits directly from their WhatsApp chat. Each guest taps one link, locks in their seat at the table, and pays via Capitec Pay, PayShap, Apple Pay, or card with no app download needed.

It costs Waterkloof R0 and nothing is deducted from your tasting or restaurant rates.

If this looks like a helpful optional resource for guests booking larger tables with you, I would be glad to send over a quick example link.

Kind regards,
Nikhar Bechan
Founder, PullThru SA
https://pullthru.co.za | support@pullthru.co.za"""
    },
    {
        "venue": "Babylonstoren Workshops & Tours",
        "contact_name": "Enquiries & Bookings Team",
        "email": "enquiries@babylonstoren.com",
        "alt_email": "",
        "location": "Simondium / Franschhoek, Western Cape",
        "vertical": "Group Garden Tours, Wine Cellar Tastings & Workshops",
        "pain_point_hook": "Social group leaders splitting cellar tour, tasting, and workshop bookings on WhatsApp",
        "to": ["enquiries@babylonstoren.com"],
        "subject": "Helping group organisers split cellar tour and workshop bookings",
        "body": """Good morning Babylonstoren Enquiries Team,

Whenever one person in a friend or family group coordinates a cellar tour, tasting, or group visit to the farm for 8 to 14 people, they usually spend days chasing everyone on WhatsApp for EFTs before confirming all the tickets.

We built PullThru (https://pullthru.co.za) here in South Africa to make group collections effortless on WhatsApp. The group organiser pastes one link into their WhatsApp chat, and each guest confirms their spot and pays their exact share via Capitec Pay, PayShap, Apple Pay, or card in seconds.

There is zero cost to Babylonstoren and no change to your booking process.

Feel free to take a look at https://pullthru.co.za, and let me know if you would like a quick overview of how group visitors use it.

Warm regards,
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
    next_id = 81
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
            alt_guard_ok, alt_reason = outreach_guard.can_send_to([alt_addr], blocked_emails, blocked_domains)
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
    print(f"ALL {len(valid_items)} BATCH-8 MULTI-VERTICAL EMAILS DISPATCHED & SAVED.")


if __name__ == "__main__":
    main()
