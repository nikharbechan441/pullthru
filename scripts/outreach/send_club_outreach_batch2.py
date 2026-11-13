import os
import csv
import time
import smtplib
from email.message import EmailMessage

PW_PATH = r"C:\Users\arvin\OneDrive\Desktop\TaxClean - AntiGravity\.gmail_app_password"
CSV_PATH = r"c:\Users\arvin\OneDrive\Desktop\App 3\prospects.csv"

BATCH_2 = [
    {
        "id": "11",
        "venue": "The Racket & Ball Club (RB Club)",
        "contact_name": "Ruben & Celeste",
        "email": "ruben@rbclub.co.za",
        "alt_email": "celeste@rbclub.co.za",
        "location": "Melrose Arch, JHB & Bree St, Cape Town",
        "vertical": "Padel Club",
        "pain_point_hook": "Padel 4-ball court splits and social tournament games where one player fronts the court fee...",
        "to": ["ruben@rbclub.co.za", "celeste@rbclub.co.za"],
        "subject": "quick question re: padel court splits at The Racket & Ball Club",
        "body": """Hi Ruben and Celeste,

Love the padel courts and setup at The Racket & Ball Club — I'll keep this brief.

Whenever a 4-ball books a court or joins a social padel session, one player almost always gets stuck fronting the court fee and chasing the other 3 mates for EFTs in the WhatsApp group.

I built a South African web tool called PullThru (https://pullthru.co.za) where the organiser drops one link into their WhatsApp group and the 4 players lock their spot in 2 taps via Capitec Pay, Apple Pay, Card, or PayShap before stepping on court. No app download needed, and if someone bails late they can 1-tap swap their paid spot to a standby mate.

Would you be open to testing a custom RB Club preset link for your regular players and social games this week?

Cheers,
Nikhar
support@pullthru.co.za
PullThru — pullthru.co.za"""
    },
    {
        "id": "12",
        "venue": "Centurion Action Sports Arena",
        "contact_name": "Talita",
        "email": "talita@actionsports.co.za",
        "alt_email": "",
        "location": "Centurion, Gauteng",
        "vertical": "Action Sports (5-a-Side Soccer & Netball)",
        "pain_point_hook": "Action soccer and netball captains fronting match fees when teammates haven't paid before kickoff...",
        "to": ["talita@actionsports.co.za"],
        "subject": "quick question re: team fees at Centurion Action Sports",
        "body": """Hi Talita,

Saw the action soccer and netball leagues buzzing at Centurion Action Sports, so I'll keep this short.

Quick question — how often do team captains still get stuck fronting match fees out of their own pocket at reception because 2 or 3 players haven't paid their share before the game starts?

I built a free South African web tool called PullThru (https://pullthru.co.za) that lets captains drop one link into their team WhatsApp group. Players lock their spot in 2 taps using Capitec Pay, Apple Pay, Card, or PayShap before kickoff — zero app download needed.

Happy to send over a custom Centurion Action Sports preset link for a few of your captains to test this week if useful?

Cheers,
Nikhar
support@pullthru.co.za
PullThru — pullthru.co.za"""
    },
    {
        "id": "13",
        "venue": "German Country Club Johannesburg",
        "contact_name": "Club Management",
        "email": "info@germancountryclub.co.za",
        "alt_email": "",
        "location": "Paulshof, Sandton",
        "vertical": "Padel, Tennis & Social Sports Club",
        "pain_point_hook": "Padel courts, social tennis mixers, and club braais coordinated over WhatsApp...",
        "to": ["info@germancountryclub.co.za"],
        "subject": "quick question re: padel & social bookings at German Country Club",
        "body": """Howzit Team,

Saw the padel, pickleball, and social sports calendar growing at the German Country Club in Paulshof — I'll keep this brief.

Whenever members book a padel court or organise a weekend braai on WhatsApp, one person usually gets stuck fronting the cash and chasing the rest of the group for EFTs and who's bringing what.

I built a South African web tool called PullThru (https://pullthru.co.za) where the organiser drops one link into their WhatsApp group and guests lock their spot in 2 taps via Capitec Pay, Apple Pay, Card, or PayShap. No app download required, and it includes a built-in SA Braai Calculator and Bring-'n-Bak item checklist.

You can check it out at https://pullthru.co.za — happy to set up a custom German Country Club template for your social organisers if you're keen?

Cheers,
Nikhar
support@pullthru.co.za
PullThru — pullthru.co.za"""
    },
    {
        "id": "14",
        "venue": "PadelNation @ Durban Country Club",
        "contact_name": "PadelNation Team",
        "email": "info@padelnation.co.za",
        "alt_email": "",
        "location": "Stamford Hill, Durban",
        "vertical": "Padel Club",
        "pain_point_hook": "4-player padel court fee splits and social mixers at Durban Country Club...",
        "to": ["info@padelnation.co.za"],
        "subject": "quick question re: padel court splits at PadelNation Durban CC",
        "body": """Howzit Team,

Love the PadelNation setup at Durban Country Club — I'll keep this short.

When a group books a court or joins a social mixer, how often does the organiser get stuck paying the full court fee upfront and chasing 3 mates on WhatsApp for their share?

I built a South African web tool called PullThru (https://pullthru.co.za) where the host drops one link in their WhatsApp group and all 4 players lock their spot in 2 taps via Capitec Pay, Apple Pay, Card, or PayShap before game time. Zero app download needed.

Would you be open to testing a custom PadelNation preset link for your social games and regular bookings this week?

Cheers,
Nikhar
support@pullthru.co.za
PullThru — pullthru.co.za"""
    },
    {
        "id": "15",
        "venue": "Morningside Runners & Country Club",
        "contact_name": "Club Secretary",
        "email": "secretary@morningsiderunners.co.za",
        "alt_email": "",
        "location": "Morningside, Sandton",
        "vertical": "Running & Social Sports Club",
        "pain_point_hook": "Time trial socials, weekend breakfast runs, and club braai kitties...",
        "to": ["secretary@morningsiderunners.co.za"],
        "subject": "quick question re: weekend run & braai RSVPs at Morningside Runners",
        "body": """Hi there,

Hope the running calendar at Morningside Country Club is going strong — I'll keep this brief.

How much time do you spend scrolling through copy-paste WhatsApp lists and matching bank EFT references whenever the club organises a breakfast run, time trial braai, or race gazebo chip-in?

I built a South African web tool called PullThru (https://pullthru.co.za) that replaces WhatsApp scroll lists with one clean link. Members tap the link in WhatsApp and lock their spot in 2 taps via Capitec Pay, Apple Pay, Card, or PayShap — or RSVP for free on R0 club runs with a live Bring-'n-Bak checklist. No app download needed.

You can test it live at https://pullthru.co.za — let me know if you'd like me to set up a free Morningside Runners template for your next club social.

Cheers,
Nikhar
support@pullthru.co.za
PullThru — pullthru.co.za"""
    },
    {
        "id": "16",
        "venue": "Spartan Harriers Athletic Club",
        "contact_name": "Club Admin",
        "email": "clubadmin@spartanharriers.co.za",
        "alt_email": "news@spartanharriers.co.za",
        "location": "Meadowridge, Cape Town",
        "vertical": "Running Club",
        "pain_point_hook": "Weekend long runs, club socials, and breakfast chip-ins on WhatsApp...",
        "to": ["clubadmin@spartanharriers.co.za", "news@spartanharriers.co.za"],
        "subject": "quick question re: club run & social RSVPs at Spartan Harriers",
        "body": """Hi Team,

Hope the Cape Town running season is going well for Spartan Harriers — I'll keep this brief.

Whenever your captains put together a weekend club run, pasta night, or social braai on WhatsApp, how much time goes into managing copy-paste numbered lists and chasing EFT proof-of-payments?

I built a South African web tool called PullThru (https://pullthru.co.za) where you drop one link into the club WhatsApp group and members lock their spot in 2 taps via Capitec Pay, Apple Pay, Card, or PayShap (or RSVP for free on R0 training runs with +1 headcount tracking). Zero app download required.

Feel free to check it out at https://pullthru.co.za — happy to set up a custom Spartan Harriers template for your next club social if useful.

Cheers,
Nikhar
support@pullthru.co.za
PullThru — pullthru.co.za"""
    },
    {
        "id": "17",
        "venue": "Century City Athletic Club",
        "contact_name": "Club Coordinator",
        "email": "info@centurycityathletics.co.za",
        "alt_email": "",
        "location": "Century City, Cape Town",
        "vertical": "Running Club",
        "pain_point_hook": "Club time trials, coffee runs, and social event chip-ins...",
        "to": ["info@centurycityathletics.co.za"],
        "subject": "quick question re: club runs & social RSVPs at Century City AC",
        "body": """Hi Team,

Hope the weekly runs at Century City Athletic Club are going great — I'll keep this short.

How much time do your organisers spend managing WhatsApp scroll lists and chasing EFTs whenever the club hosts a social run, breakfast meet-up, or year-end braai?

I built a South African web tool called PullThru (https://pullthru.co.za) that replaces WhatsApp copy-paste lists with one link. Members tap the link in WhatsApp and lock their spot in 2 taps via Capitec Pay, Apple Pay, Card, or PayShap — or RSVP for free on R0 runs. No app download needed.

You can test it anytime at https://pullthru.co.za — happy to set up a free Century City AC template if you'd like to try it on your next social.

Cheers,
Nikhar
support@pullthru.co.za
PullThru — pullthru.co.za"""
    },
    {
        "id": "18",
        "venue": "Irene Athletics Club",
        "contact_name": "Club Operations",
        "email": "info@irenerunner.co.za",
        "alt_email": "",
        "location": "Irene, Centurion",
        "vertical": "Running & Trail Club",
        "pain_point_hook": "Club braais, race tent kitties, and weekend run RSVPs...",
        "to": ["info@irenerunner.co.za"],
        "subject": "quick question re: club braai & run RSVPs at Irene Athletics Club",
        "body": """Howzit Team,

Hope the season is going strong at Irene Athletics Club — I'll keep this brief.

Whenever the club organises a social braai, bus trip, or race tent chip-in on WhatsApp, how much time goes into chasing EFT proof-of-payments and keeping track of who's bringing what?

I built a South African web tool called PullThru (https://pullthru.co.za) where you drop one link into the club WhatsApp group and members lock their spot in 2 taps via Capitec Pay, Apple Pay, Card, or PayShap. It also includes a free RSVP mode, an SA Braai Calculator, and a live Bring-'n-Bak checklist. Zero app download needed.

Take a look at https://pullthru.co.za — happy to set up a custom Irene Athletics Club link for your next social if useful.

Cheers,
Nikhar
support@pullthru.co.za
PullThru — pullthru.co.za"""
    },
    {
        "id": "19",
        "venue": "Helderberg Harriers",
        "contact_name": "Club Committee",
        "email": "info@helderbergharriers.co.za",
        "alt_email": "",
        "location": "Somerset West, Western Cape",
        "vertical": "Running Club",
        "pain_point_hook": "Somerset West club runs, weekend trail socials, and braai kitties...",
        "to": ["info@helderbergharriers.co.za"],
        "subject": "quick question re: club socials & run RSVPs at Helderberg Harriers",
        "body": """Hi Team,

Hope the runs around Somerset West and the Helderberg are going well — I'll keep this short.

How much time do your convenors spend managing copy-paste WhatsApp lists and matching bank EFT references whenever Helderberg Harriers puts together a club braai, breakfast run, or social event?

I built a South African web tool called PullThru (https://pullthru.co.za) that replaces WhatsApp scroll lists with one simple link. Members tap the link in WhatsApp and lock their spot in 2 taps via Capitec Pay, Apple Pay, Card, or PayShap (with multi-tier options for Meat, Veg, or Kids, plus a live Bring-'n-Bak list). No app download required.

You can check it out at https://pullthru.co.za — let me know if you'd like a custom Helderberg Harriers template for your next club social.

Cheers,
Nikhar
support@pullthru.co.za
PullThru — pullthru.co.za"""
    },
    {
        "id": "20",
        "venue": "Action Padel South Africa",
        "contact_name": "Action Padel Team",
        "email": "info@actionpadel.co.za",
        "alt_email": "",
        "location": "Gauteng & National Arenas",
        "vertical": "Indoor Padel Courts",
        "pain_point_hook": "Indoor padel 4-ball court splits and social tournament games...",
        "to": ["info@actionpadel.co.za"],
        "subject": "quick question re: 4-ball court splits at Action Padel",
        "body": """Howzit Team,

Saw the indoor Action Padel courts growing fast across the arenas — I'll keep this brief.

When a 4-ball books an indoor padel slot, one player almost always gets stuck paying the full court fee and chasing the other 3 mates for EFTs on WhatsApp.

I built a South African web tool called PullThru (https://pullthru.co.za) where the organiser drops one link into their WhatsApp group and the 4 players lock their spot in 2 taps via Capitec Pay, Apple Pay, Card, or PayShap before stepping on court. No app download needed, and if someone pulls out late they can 1-tap swap their paid spot to a standby mate.

Happy to set up a custom Action Padel preset link for your regular players and social organisers to test this week if useful?

Cheers,
Nikhar
support@pullthru.co.za
PullThru — pullthru.co.za"""
    }
]

def main():
    with open(PW_PATH, "r", encoding="utf-8") as f:
        pw = f.read().strip().replace(" ", "")

    # Pre-flight validation
    for item in BATCH_2:
        combined = (item["subject"] + " " + item["body"]).lower()
        assert "[" not in combined and "]" not in combined, f"Blank placeholder in {item['venue']}"
        assert "taxclean" not in combined, f"Forbidden brand string in {item['venue']}"
        assert "sent from my" not in combined, f"Forbidden footer in {item['venue']}"

    with smtplib.SMTP_SSL("smtp.gmail.com", 465, timeout=30) as server:
        server.login("sales@taxcleanza.com", pw)
        for item in BATCH_2:
            msg = EmailMessage()
            msg["Subject"] = item["subject"]
            msg["From"] = "Nikhar - PullThru <support@pullthru.co.za>"
            msg["Reply-To"] = "Nikhar <support@pullthru.co.za>"
            msg["To"] = ", ".join(item["to"])
            msg.set_content(item["body"])

            server.send_message(msg, from_addr="support@pullthru.co.za", to_addrs=item["to"])
            print(f"[SENT #{item['id']}] {item['venue']} -> {', '.join(item['to'])}")
            time.sleep(1.5)

    # Append to prospects.csv
    existing_ids = set()
    rows = []
    with open(CSV_PATH, "r", encoding="utf-8", newline="") as f:
        reader = csv.DictReader(f)
        fieldnames = reader.fieldnames
        for r in reader:
            existing_ids.add(r["id"])
            rows.append(r)

    for item in BATCH_2:
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
                "status": "Sent (2026-10-30)"
            })

    with open(CSV_PATH, "w", encoding="utf-8", newline="") as f:
        writer = csv.DictWriter(f, fieldnames=fieldnames)
        writer.writeheader()
        writer.writerows(rows)

    print("ALL 10 BATCH-2 EMAILS DISPATCHED & SAVED TO prospects.csv.")

if __name__ == "__main__":
    main()
