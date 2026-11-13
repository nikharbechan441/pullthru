import csv
import random
import re
import smtplib
import subprocess
import time
from email.message import EmailMessage

PW_PATH = r"C:\Users\arvin\OneDrive\Desktop\TaxClean - AntiGravity\.gmail_app_password"
CSV_PATH = r"c:\Users\arvin\OneDrive\Desktop\App 3\prospects.csv"

CANDIDATES = [
    {
        "id": "45",
        "venue": "Fives Futbol",
        "contact_name": "Brandon",
        "email": "brandon@fivesfutbol.co.za",
        "alt_email": "centurycity@fivesfutbol.co.za",
        "location": "Cape Town & Pretoria",
        "vertical": "5-a-Side Soccer Leagues",
        "pain_point_hook": "5-a-side captains collecting match and league fees before kick-off",
        "to": ["brandon@fivesfutbol.co.za"],
        "subject": "Team match fees and group bookings at Fives Futbol",
        "body": """Good morning Brandon,

I am reaching out as the founder of PullThru (https://pullthru.co.za), a local group payment tool we recently launched for South African sports leagues and social bookings.

Speaking with 5-a-side arena managers, a common headache is team captains having to front the full pitch fee, or asking reception for extensions, because two or three players have not sent their EFTs before kick-off.

PullThru gives captains a single link they can drop into their team's WhatsApp group. Players tap their name and settle their exact share in under 15 seconds via Capitec Pay, PayShap, Apple Pay, or card, with no app download required.

There is zero cost to Fives Futbol and nothing is deducted from your pitch or league fees. Any small R1 to R2 transaction fee is absorbed by the players chipping in.

If you think this could be useful for your league captains at Century City, Pinelands, or Menlyn, I would be glad to share a quick demo link tailored to your current pitch rates.

Kind regards,
Nikhar Bechan
Founder, PullThru SA
https://pullthru.co.za | support@pullthru.co.za"""
    },
    {
        "id": "46",
        "venue": "Discovery Soccer Park",
        "contact_name": "Shaun",
        "email": "shaun@discoverysoccerpark.co.za",
        "alt_email": "info@discoverysoccerpark.co.za",
        "location": "Sandton & Rosebank, JHB",
        "vertical": "5-a-Side Soccer & Tournaments",
        "pain_point_hook": "Team captains splitting weekly turf and corporate tournament fees on WhatsApp",
        "to": ["shaun@discoverysoccerpark.co.za"],
        "subject": "Helping captains settle pitch fees on time at Discovery Soccer Park",
        "body": """Good morning Shaun,

I hope your weekend fixtures across the Johannesburg arenas are going well.

We recently built a South African group payment platform called PullThru (https://pullthru.co.za) to help social sports captains collect match and tournament fees from their players before arriving at the venue.

Most captains still rely on a manual WhatsApp list and spend the afternoon before a game chasing teammates for EFTs. With PullThru, the captain posts one link in the team chat and players pay their share directly via PayShap, Capitec Pay, Apple Pay, or card.

There is no cost or commission charged to Discovery Soccer Park, and your venue receives 100% of your standard turf or league fee (the players cover the small R1 to R2 processing fee when they pay their share).

If this sounds like a helpful resource to mention to captains who book regular slots or tournaments with you, I would be happy to send over a quick example link.

Best regards,
Nikhar Bechan
Founder, PullThru SA
https://pullthru.co.za | support@pullthru.co.za"""
    },
    {
        "id": "47",
        "venue": "Kenilworth & Century Karting",
        "contact_name": "Bookings Team",
        "email": "info@karting.co.za",
        "alt_email": "century@karting.co.za",
        "location": "Kenilworth & Century City, Cape Town",
        "vertical": "Indoor Go-Karting",
        "pain_point_hook": "Bachelor and birthday organisers collecting per-driver Grand Prix deposits",
        "to": ["info@karting.co.za"],
        "subject": "Helping group organisers confirm their Karting deposits faster",
        "body": """Good morning to the team at Kenilworth & Century Karting,

We recently spoke with a few bachelor party and group event coordinators who mentioned that their biggest delay in locking in a Grand Prix group booking isn't choosing the package. Instead, it is the organiser spending four days chasing 12 to 20 friends on WhatsApp for their individual deposits.

We built PullThru (https://pullthru.co.za) to solve that bottleneck for group bookings. When a customer enquires about a group race or birthday booking, they can paste one PullThru link into their WhatsApp group. Everyone pays their per-driver share via PayShap, Capitec Pay, or card, and the organiser gets the full deposit together in an afternoon instead of a week.

It does not require any software integration on your side, and there is no cost or commission charged to your venue (the group members cover the small R1 to R2 payment processing fee when they chip in).

You are welcome to take a look at how it works at https://pullthru.co.za. If it looks helpful for your bookings desk, let me know and I can send over a sample Grand Prix group link.

Warm regards,
Nikhar Bechan
Founder, PullThru SA
https://pullthru.co.za | support@pullthru.co.za"""
    },
    {
        "id": "48",
        "venue": "IndyKart Indoor Go-Karting",
        "contact_name": "Bookings Team",
        "email": "bookings@indykart.net",
        "alt_email": "",
        "location": "Pretoria East, Gauteng",
        "vertical": "Indoor Go-Karting",
        "pain_point_hook": "Group race organisers collecting per-head karting deposits on WhatsApp",
        "to": ["bookings@indykart.net"],
        "subject": "Group booking deposits for IndyKart races",
        "body": """Good morning IndyKart Bookings Team,

Whenever a customer organises a group race, birthday, or bachelor outing at a karting track, the person in charge usually ends up stuck chasing 10 to 15 friends for EFTs on WhatsApp before they can pay your booking deposit.

I am the founder of PullThru (https://pullthru.co.za), a local web tool built to make that step much faster for group organisers. The organiser creates a simple link for their race and shares it in their WhatsApp group. Each driver claims their spot and pays their share in a couple of taps via Capitec Pay, PayShap, Apple Pay, or card.

There is zero cost to IndyKart and nothing is deducted from your race packages. The small R1 to R2 transaction fee is covered by the participants chipping in.

If you would like a simple link your bookings team can share with customers who are trying to collect group money from friends, I would be glad to set up a free IndyKart template for you.

Kind regards,
Nikhar Bechan
Founder, PullThru SA
https://pullthru.co.za | support@pullthru.co.za"""
    },
    {
        "id": "49",
        "venue": "Gravity Adventures",
        "contact_name": "Adventure Team",
        "email": "adventure@gravity.co.za",
        "alt_email": "microadventures@gravity.co.za",
        "location": "Cape Town & Western Cape",
        "vertical": "River Rafting & Kloofing",
        "pain_point_hook": "Palmiet rafting and kloofing group leaders collecting trip deposits",
        "to": ["adventure@gravity.co.za"],
        "subject": "Group deposit collection for Gravity Adventures bookings",
        "body": """Dear Gravity Adventures Team,

I hope your weekend trips on the Palmiet and Orange River are going well as summer picks up.

I am writing to introduce PullThru (https://pullthru.co.za), a South African web tool designed for group organisers who book rafting, kloofing, and weekend adventure trips.

Whenever one person volunteers to organise a group trip for 10 or 15 friends, they usually end up stuck with a messy WhatsApp list and chasing missing EFT proof of payments before they can settle your booking deposit. PullThru replaces that manual list with a live booking page where each participant claims their spot and pays their share directly from WhatsApp.

Just to be transparent upfront: there is no fee to Gravity Adventures and nothing is deducted from your package rates. Any small R1 to R2 platform fee is added on top and covered by the guests chipping in.

If you would like to offer it as an optional resource to group leaders who enquire with you, I would be happy to show you how it works or set up a custom Gravity Adventures template.

Best regards,
Nikhar Bechan
Founder, PullThru SA
https://pullthru.co.za | support@pullthru.co.za"""
    },
    {
        "id": "50",
        "venue": "Downhill Adventures",
        "contact_name": "Bookings Team",
        "email": "info@downhilladventures.com",
        "alt_email": "",
        "location": "Cape Town, Western Cape",
        "vertical": "Sandboarding & Outdoor Group Adventures",
        "pain_point_hook": "Sandboarding and surf adventure group leaders splitting package deposits",
        "to": ["info@downhilladventures.com"],
        "subject": "Helping group organisers collect payments for Downhill Adventures",
        "body": """Good morning Downhill Adventures Team,

With summer group bookings picking up in Cape Town, I wanted to share a local tool we built called PullThru (https://pullthru.co.za) that helps group organisers collect per-person payments from their friends on WhatsApp.

We noticed that when someone organises a group sandboarding, surfing, or bachelor outing, bookings often stall while the organiser waits days for everyone in their WhatsApp group to EFT their share. PullThru gives that organiser a single link where each guest locks in their spot and pays via PayShap, Capitec Pay, Apple Pay, or card in seconds.

There is no cost to Downhill Adventures and no deduction from your rates. The small R1 to R2 processing fee is covered by the guests chipping in.

Feel free to take a look at https://pullthru.co.za, and let me know if you would like a custom sample link your reservations desk can pass along to group enquiries.

Kind regards,
Nikhar Bechan
Founder, PullThru SA
https://pullthru.co.za | support@pullthru.co.za"""
    },
    {
        "id": "51",
        "venue": "Mirage Catamaran",
        "contact_name": "Reservations Team",
        "email": "info@miragecatamaran.com",
        "alt_email": "",
        "location": "V&A Waterfront, Cape Town",
        "vertical": "Private Yacht & Catamaran Charters",
        "pain_point_hook": "Private sunset charter hosts collecting per-guest boat contributions",
        "to": ["info@miragecatamaran.com"],
        "subject": "Private charter and group cruise splits for Mirage Catamaran",
        "body": """Good day Mirage Reservations Team,

With summer charter season underway at the V&A Waterfront, I wanted to share a local tool we built that helps private group organisers get their charter deposits together much faster.

When a client wants to book a birthday cruise, year-end function, or sunset charter with friends, the organiser often hesitates to pay the full deposit out of their own pocket while waiting for 20 guests to pay them back.

With PullThru (https://pullthru.co.za), the host shares one link in their WhatsApp group. Guests RSVP and pay their per-head contribution immediately via Apple Pay, Capitec Pay, PayShap, or card, and the host has a clean guest list and the funds ready to confirm their booking with you.

There is zero cost to Mirage Catamaran and no change to how you invoice your clients. If this sounds like something your reservations team could pass along to group enquiries, I would be glad to share a quick example.

Kind regards,
Nikhar Bechan
Founder, PullThru SA
https://pullthru.co.za | support@pullthru.co.za"""
    },
    {
        "id": "52",
        "venue": "Knysna Charters",
        "contact_name": "Bookings Team",
        "email": "info@knysnacharters.com",
        "alt_email": "",
        "location": "Knysna, Garden Route",
        "vertical": "Lagoon Cruises & Boat Charters",
        "pain_point_hook": "Lagoon cruise and oyster tour group organisers splitting booking deposits",
        "to": ["info@knysnacharters.com"],
        "subject": "Group cruise bookings and deposit collection at Knysna Charters",
        "body": """Good morning Knysna Charters Team,

I hope the season is off to a great start on the lagoon.

I am reaching out to introduce PullThru (https://pullthru.co.za), a South African web tool built for people who organise group outings, birthday cruises, and private charters with friends or family.

Often, one person in a holiday group offers to book a sunset cruise or oyster tour, and then spends days chasing the rest of the group on WhatsApp for their per-ticket EFTs. PullThru gives the group organiser one clean link to drop in their WhatsApp chat so everyone can pay their share immediately via Capitec Pay, PayShap, Apple Pay, or card.

It costs Knysna Charters R0 and nothing is deducted from your charter rates (guests cover the small R1 to R2 fee when paying their share).

If you think this could help your group enquiries confirm their bookings faster, I would be happy to share a quick demo with your bookings desk.

Warm regards,
Nikhar Bechan
Founder, PullThru SA
https://pullthru.co.za | support@pullthru.co.za"""
    },
    {
        "id": "53",
        "venue": "Quadzilla Atlantis Dunes",
        "contact_name": "Bookings Team",
        "email": "info@quadzilla.co.za",
        "alt_email": "",
        "location": "Atlantis Dunes, Cape Town",
        "vertical": "Quad Biking & Group Adventures",
        "pain_point_hook": "Dunes quad-biking bachelor and birthday organisers collecting per-rider fees",
        "to": ["info@quadzilla.co.za"],
        "subject": "Helping group organisers collect per-rider deposits for Quadzilla",
        "body": """Good morning Quadzilla Team,

When a customer wants to book a group quad biking session at the dunes for a birthday or bachelor party, the person organising the group usually has to collect per-rider deposits from 8 to 15 friends on WhatsApp before they can lock in the booking.

We built a local web tool called PullThru (https://pullthru.co.za) that takes the admin out of collecting group money. Instead of copying and pasting numbered lists on WhatsApp and waiting for EFTs, the organiser shares one link where every rider pays their exact share via Capitec Pay, PayShap, Apple Pay, or card.

There is no cost to Quadzilla and nothing comes off your booking price. Any small R1 to R2 payment fee is absorbed by the riders chipping in.

You can see how it works at https://pullthru.co.za. If it looks useful for your group bookings, let me know and I can put together a custom Quadzilla template link for your team.

Best regards,
Nikhar Bechan
Founder, PullThru SA
https://pullthru.co.za | support@pullthru.co.za"""
    },
    {
        "id": "54",
        "venue": "Acrobranch Outdoor Parks",
        "contact_name": "Bookings Team",
        "email": "bookings@acrobranch.co.za",
        "alt_email": "",
        "location": "Johannesburg, Pretoria, Cape Town & KZN",
        "vertical": "Outdoor Treetop Adventure Parks",
        "pain_point_hook": "Adult birthday, social, and school parent organisers collecting per-person park fees",
        "to": ["bookings@acrobranch.co.za"],
        "subject": "Simplifying group deposits for Acrobranch bookings",
        "body": """Good morning Acrobranch Bookings Team,

I am writing to share a South African group payment tool called PullThru (https://pullthru.co.za) that helps group organisers collect per-person fees on WhatsApp before confirming their venue booking.

Whether it is a parent coordinating a group birthday outing or friends planning a weekend social at one of your parks, the organiser almost always has to chase 10 to 20 people on WhatsApp for EFTs before they can pay the group deposit. With PullThru, they drop one link into the WhatsApp chat and guests pay their share in seconds using PayShap, Capitec Pay, Apple Pay, or card.

There is no cost or integration required from Acrobranch, and your park receives 100% of your package rate (the guests chipping in cover the small R1 to R2 transaction fee).

If your central bookings team ever deals with organisers who ask for more time to collect money from their group, I would be glad to share how they can use PullThru to wrap it up in a single afternoon.

Kind regards,
Nikhar Bechan
Founder, PullThru SA
https://pullthru.co.za | support@pullthru.co.za"""
    },
    {
        "id": "55",
        "venue": "HintHunt Africa",
        "contact_name": "Cape Town Team",
        "email": "capetown@hinthunt.co.za",
        "alt_email": "",
        "location": "V&A Waterfront, Cape Town",
        "vertical": "Escape Rooms & Amazing Race Events",
        "pain_point_hook": "Escape room and Amazing Race group organisers splitting team booking fees",
        "to": ["capetown@hinthunt.co.za"],
        "subject": "Group payment splits for HintHunt team bookings",
        "body": """Good morning HintHunt Cape Town Team,

Whenever a group of friends or colleagues books multiple escape rooms or an Amazing Race experience at the Waterfront, one person usually has to front the full booking fee and then chase everyone else on WhatsApp to pay back their share.

We built PullThru (https://pullthru.co.za) here in South Africa to make group kitties and ticket splits effortless on WhatsApp. The organiser shares one link in their group chat, and each team member locks in their spot and pays their share via Capitec Pay, PayShap, Apple Pay, or card with no app download needed.

There is zero cost to HintHunt and nothing is deducted from your booking rates. The small R1 to R2 fee is covered by the players chipping in.

Feel free to have a look at https://pullthru.co.za. If you think your bookings desk could find it handy for larger group enquiries, I would be happy to share a quick demo link.

Best regards,
Nikhar Bechan
Founder, PullThru SA
https://pullthru.co.za | support@pullthru.co.za"""
    },
    {
        "id": "56",
        "venue": "CryWolf Paintball & Laser Tag",
        "contact_name": "Experience Team",
        "email": "experience@crywolf.co.za",
        "alt_email": "",
        "location": "Irene, Centurion",
        "vertical": "Paintball, Laser Tag & Bachelor Groups",
        "pain_point_hook": "Bachelor and birthday organisers collecting per-player paintball deposits",
        "to": ["experience@crywolf.co.za"],
        "subject": "Helping bachelor and birthday organisers collect CryWolf deposits",
        "body": """Good morning CryWolf Team,

With weekend bachelor parties and birthday bookings in full swing, I wanted to introduce PullThru (https://pullthru.co.za), a local web tool built to help group organisers collect deposits from their friends on WhatsApp.

For most paintball and laser tag groups, the best man or birthday organiser spends days hounding 12 to 20 guys on WhatsApp to EFT their per-player deposit before they can confirm their booking with the venue. PullThru replaces the manual WhatsApp list with a simple payment link where each player taps their name and pays via Capitec Pay, PayShap, Apple Pay, or card.

There is no cost to CryWolf and nothing comes off your package rates (any small R1 to R2 processing fee is covered by the players chipping in).

If you would like an easy tool your bookings team can mention to bachelor or birthday organisers who are still collecting money from their group, I would be happy to send over a sample CryWolf link.

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

    valid_items = []
    for item in CANDIDATES:
        combined = item["subject"] + " " + item["body"]
        assert "—" not in combined and "–" not in combined, f"Forbidden em/en-dash in {item['venue']}"
        assert "[" not in combined and "]" not in combined, f"Blank placeholder in {item['venue']}"
        assert "taxclean" not in combined.lower(), f"Forbidden brand string in {item['venue']}"
        assert len(item["to"]) == 1, f"Must have exactly 1 recipient for {item['venue']}"

        all_ok = all(verify_mx_and_smtp(addr) for addr in item["to"])
        if all_ok:
            valid_items.append(item)
        else:
            print(f"[SKIPPED INVALID] {item['venue']}")

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
                delay = random.uniform(22.0, 34.0)
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

    print(f"ALL {len(valid_items)} BATCH-5 EMAILS DISPATCHED & SAVED.")


if __name__ == "__main__":
    main()
