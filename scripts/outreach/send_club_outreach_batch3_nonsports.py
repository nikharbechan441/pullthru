"""
Batch 3 — Non-Sports South African Verticals for PullThru (pullthru.co.za)
Verticals covered:
  1. Spitbraai & Private Braai Caterers (Multi-Tier + SA Braai Calculator /braai-calculator)
  2. Sunset Boat Cruises, Yacht Charters & Party Buses (Fixed Split & Spot Cap)
  3. Hiking, Mountain & Weekend Camping Clubs (Free RSVP + Bring-'n-Bak + Hut Splits)
  4. Interactive Group Quiz, Potjie & Social Event Organisers (Multi-Tier & Team Kitties)
  5. Wine Clubs & Harvest Tasting Groups (Fixed Split & Multi-Tier)

Includes built-in DNS MX pre-flight check to protect Gmail sender reputation (0% bounce guard).
"""
import os
import csv
import time
import subprocess
import smtplib
from email.message import EmailMessage

PW_PATH = r"C:\Users\arvin\OneDrive\Desktop\TaxClean - AntiGravity\.gmail_app_password"
CSV_PATH = r"c:\Users\arvin\OneDrive\Desktop\App 3\prospects.csv"

BATCH_3_NON_SPORTS = [
    {
        "id": "21",
        "venue": "Theo's Spit Braai Catering",
        "to": ["theo@theosspitbraai.co.za", "info@theosspitbraai.co.za"],
        "subject": "quick question re: group spitbraai deposits at Theo's Spit Braai",
        "body": """Howzit Theo,

Saw your spitbraai menus for Johannesburg functions — I'll keep this brief.

Whenever someone books a spitbraai for a 30th birthday, bachelor party, or year-end function, the host almost always gets stuck fronting the deposit out of pocket while chasing 25 friends for R180 EFTs on WhatsApp.

I built a free South African web tool called PullThru (https://pullthru.co.za) where the party host drops one link in their WhatsApp group and guests chip in their share in 2 taps via Capitec Pay, Apple Pay, Card, or PayShap (with separate tiers for Meat, Halaal/Veg, or Kids, plus a live Bring-'n-Bak list for ice and drinks).

Happy to set up a free co-branded link you can share with clients so they collect their guest money faster and lock in their booking deposit with you on the spot?

Cheers,
Nikhar
support@pullthru.co.za
PullThru — pullthru.co.za"""
    },
    {
        "id": "22",
        "venue": "Central Kitchen Caterers",
        "to": ["tanya@centralkitchen.co.za", "nigel@centralkitchen.co.za"],
        "subject": "quick question re: group catering bookings at Central Kitchen",
        "body": """Hi Tanya and Nigel,

Love what you're doing with Central Kitchen Caterers across Joburg — I'll keep this short.

When a group organiser books catering for a private party, baby shower, or year-end lunch, they usually waste days chasing guests on WhatsApp for headcount, dietary requirements, and per-person EFTs before they can confirm final numbers with you.

I built a South African web tool called PullThru (https://pullthru.co.za) where the host drops one link into their WhatsApp group. Guests lock their spot, pick their dietary tier, and chip in via Capitec Pay, Apple Pay, Card, or PayShap in 2 taps — no app download needed.

Would you be open to testing a custom link for your clients who are collecting per-head contributions for their next function?

Cheers,
Nikhar
support@pullthru.co.za
PullThru — pullthru.co.za"""
    },
    {
        "id": "23",
        "venue": "Spit-Braai King Cape Town",
        "to": ["info@spitbraaiking.co.za", "tableview@spitbraaiking.co.za"],
        "subject": "quick question re: group braai bookings at Spit-Braai King",
        "body": """Howzit Team,

Saw Spit-Braai King busy across Table View and Somerset West — I'll keep this brief.

When a host books a spitbraai for 20 to 40 mates, they almost always struggle to collect everyone's per-head Rand split on WhatsApp before paying the catering deposit.

I built a South African web tool called PullThru (https://pullthru.co.za) where hosts drop one link in their WhatsApp group and guests pay their share in 2 taps via Capitec Pay, Apple Pay, Card, or PayShap. It also includes a free SA Braai Calculator (https://pullthru.co.za/braai-calculator) and a live Bring-'n-Bak list for ice, rolls, and drinks.

Happy to set up a free template link you can pass along to hosts when they request a quote so they lock in their headcount and deposit faster?

Cheers,
Nikhar
support@pullthru.co.za
PullThru — pullthru.co.za"""
    },
    {
        "id": "24",
        "venue": "Simply Spit-Braai",
        "to": ["info@simplyspitbraai.co.za"],
        "subject": "quick question re: private function deposits at Simply Spit-Braai",
        "body": """Hi Team,

Saw Simply Spit-Braai catering events across Cape Town — I'll keep this short.

Whenever someone organises a birthday spitbraai or social function with friends, the organiser usually gets stuck fronting the catering invoice and chasing EFT proof-of-payments in the WhatsApp chat.

I built a South African web tool called PullThru (https://pullthru.co.za) that lets party hosts drop one link into their WhatsApp group so guests lock their spot and chip in via Capitec Pay, Apple Pay, Card, or PayShap in 2 taps (with multi-tier options for Meat, Veg, or Kids). Zero app download required.

You can check it out at https://pullthru.co.za — let me know if you'd like a custom link your clients can use to collect their group kitty before function day.

Cheers,
Nikhar
support@pullthru.co.za
PullThru — pullthru.co.za"""
    },
    {
        "id": "25",
        "venue": "Harties Boat Company",
        "to": ["events@hartiesboatcompany.co.za", "info@hartiesboatcompany.co.za"],
        "subject": "quick question re: group cruise bookings at Harties Boat Company",
        "body": """Hi Team,

Love the sunset cruises and party boat packages at Harties Boat Company — I'll keep this brief.

When a group organiser books a birthday cruise, bachelor/bachelorette party, or year-end boat charter for 20 people, how often is the booking delayed because that one friend is still chasing 19 people on WhatsApp for their per-person EFT?

I built a South African web tool called PullThru (https://pullthru.co.za) where the group organiser drops one link into their WhatsApp chat and guests lock their spot in 2 taps via Capitec Pay, Apple Pay, Card, or PayShap. No app download needed, and spots auto-lock once the boat cap is reached.

Would you be open to sharing a custom Harties Boat Company kitty link with group organisers when they enquire so they collect their deposit in hours instead of weeks?

Cheers,
Nikhar
support@pullthru.co.za
PullThru — pullthru.co.za"""
    },
    {
        "id": "26",
        "venue": "Tigger 2 Yacht Charters",
        "to": ["info@tigger2.co.za"],
        "subject": "quick question re: group yacht charters at Tigger 2",
        "body": """Hi Team,

Love the sunset cruises and private charters on Tigger 2 at the V&A Waterfront — I'll keep this short.

Whenever a group of friends organises a private sunset charter or birthday cruise, one organiser almost always gets stuck fronting the charter deposit and chasing the rest of the WhatsApp group for EFTs.

I built a South African web tool called PullThru (https://pullthru.co.za) where the organiser drops one link into their WhatsApp group and guests pay their per-person share in 2 taps via Capitec Pay, Apple Pay, Card, or PayShap — zero app download required.

Feel free to take a look at https://pullthru.co.za — happy to set up a custom Tigger 2 group chip-in template you can offer to private charter organisers if useful.

Cheers,
Nikhar
support@pullthru.co.za
PullThru — pullthru.co.za"""
    },
    {
        "id": "27",
        "venue": "Durban Party Bus",
        "to": ["info@durbanpartybus.co.za"],
        "subject": "quick question re: group party bus bookings at Durban Party Bus",
        "body": """Howzit Team,

Saw the Durban Party Bus packages for birthdays, bull/hen nights, and concert trips — I'll keep this brief.

Whenever one friend tries to organise a 20-seater or 30-seater party bus on WhatsApp, the biggest bottleneck is getting everyone in the group chat to actually pay their R200–R350 seat share before the deposit deadline.

I built a South African web tool called PullThru (https://pullthru.co.za) where the organiser drops one link in the WhatsApp group and friends lock their seat in 2 taps via Capitec Pay, Apple Pay, Card, or PayShap. No pay = no seat, and there's no app download needed.

Happy to set up a free Durban Party Bus preset link your clients can use to collect their group seat money in one afternoon?

Cheers,
Nikhar
support@pullthru.co.za
PullThru — pullthru.co.za"""
    },
    {
        "id": "28",
        "venue": "JHB Hiking Club",
        "to": ["admin@jhbhiking.co.za"],
        "subject": "quick question re: weekend hike & camping RSVPs at JHB Hiking Club",
        "body": """Howzit Team,

Love the weekend trails and hikes you run across Gauteng with JHB Hiking Club — I'll keep this brief.

How much time do you spend managing copy-paste WhatsApp lists and matching bank EFT references whenever you put together a weekend hike, overnight hut trip, or post-hike braai?

I built a South African web tool called PullThru (https://pullthru.co.za) that replaces WhatsApp scroll lists with one clean link. Hikers tap the link in WhatsApp and lock their spot in 2 taps via Capitec Pay, Apple Pay, Card, or PayShap — or RSVP for free on R0 hikes with carpool & Bring-'n-Bak item claims. No app download required.

You can test it live at https://pullthru.co.za — let me know if you'd like a custom JHB Hiking Club template for your next trail or weekend camp.

Cheers,
Nikhar
support@pullthru.co.za
PullThru — pullthru.co.za"""
    },
    {
        "id": "29",
        "venue": "Mountain Backpackers Club",
        "to": ["membership@mountainbackpackers.co.za"],
        "subject": "quick question re: hike & hut booking splits at Mountain Backpackers Club",
        "body": """Hi Team,

Hope the Drakensberg and KZN hiking calendar is going well at Mountain Backpackers Club — I'll keep this short.

Whenever hike leaders organise a weekend trip, cave/hut booking, or club social on WhatsApp, how much time goes into chasing per-person permit fees and tracking who's bringing what gear or food?

I built a South African web tool called PullThru (https://pullthru.co.za) where hike leaders drop one link into the WhatsApp group. Members lock their spot in 2 taps via Capitec Pay, Apple Pay, Card, or PayShap (or use the 100% Free RSVP mode with a live Bring-'n-Bak checklist). Zero app download needed.

Take a look at https://pullthru.co.za — happy to set up a free Mountain Backpackers template if useful for your hike leaders.

Cheers,
Nikhar
support@pullthru.co.za
PullThru — pullthru.co.za"""
    },
    {
        "id": "30",
        "venue": "The Gallivanting Goose",
        "to": ["talktome@thegg.co.za"],
        "subject": "quick question re: social group bookings at The Gallivanting Goose",
        "body": """Hi Team,

Love the interactive group games and social experiences you run at The Gallivanting Goose — I'll keep this brief.

When a social group or office organiser books an event with you, they often spend days chasing participants on WhatsApp for headcount and per-person EFTs before confirming final numbers.

I built a South African web tool called PullThru (https://pullthru.co.za) where the organiser drops one link into their WhatsApp group and participants lock their spot in 2 taps via Capitec Pay, Apple Pay, Card, or PayShap (or RSVP for free when the company is paying). No app download required.

You can check it out at https://pullthru.co.za — happy to set up a custom template link for your group organisers if you're keen.

Cheers,
Nikhar
support@pullthru.co.za
PullThru — pullthru.co.za"""
    },
    {
        "id": "31",
        "venue": "Teambuilding Worx",
        "to": ["evan@teambuildingworx.co.za", "nhlaka@teambuildingworx.co.za"],
        "subject": "quick question re: potjie & braai group bookings at Teambuilding Worx",
        "body": """Hi Evan and Nhlaka,

Saw the potjiekos competitions and braai master events you run across Joburg and Cape Town — I'll keep this brief.

Whenever a social group or club books an event where everyone is chipping in their own share, the organiser usually spends days chasing EFTs and dietary preferences on WhatsApp before paying the deposit.

I built a South African web tool called PullThru (https://pullthru.co.za) where the organiser drops one link into their WhatsApp group and participants lock their spot in 2 taps via Capitec Pay, Apple Pay, Card, or PayShap (or RSVP for free with dietary & team tracking). No app download required.

Happy to set up a custom Teambuilding Worx template link for your organisers if useful?

Cheers,
Nikhar
support@pullthru.co.za
PullThru — pullthru.co.za"""
    },
    {
        "id": "32",
        "venue": "Black Oystercatcher Wine Club",
        "to": ["taste@blackoystercatcher.co.za"],
        "subject": "quick question re: group tastings & wine club events at Black Oystercatcher",
        "body": """Hi Team,

Love what you do at Black Oystercatcher in the Overberg — I'll keep this short.

Whenever a group of friends organises a weekend wine trip, harvest lunch, or private group tasting on WhatsApp, one person usually gets stuck fronting the booking fee and chasing the rest of the group for EFTs.

I built a South African web tool called PullThru (https://pullthru.co.za) where the group organiser drops one link into their WhatsApp chat and guests lock their spot in 2 taps via Capitec Pay, Apple Pay, Card, or PayShap — zero app download needed.

Feel free to take a look at https://pullthru.co.za — happy to set up a custom Black Oystercatcher group booking template if useful.

Cheers,
Nikhar
support@pullthru.co.za
PullThru — pullthru.co.za"""
    }
]

def verify_mx(email_addr: str) -> bool:
    domain = email_addr.split("@")[1]
    res = subprocess.run(["nslookup", "-type=MX", domain], capture_output=True, text=True)
    out = res.stdout.lower()
    return ("mail exchanger" in out) or ("mx" in out)

def main():
    with open(PW_PATH, "r", encoding="utf-8") as f:
        pw = f.read().strip().replace(" ", "")

    # Pre-flight validation: 0 blanks, 0 taxclean mentions, 100% MX verified
    for item in BATCH_3_NON_SPORTS:
        combined = (item["subject"] + " " + item["body"]).lower()
        assert "[" not in combined and "]" not in combined, f"Blank placeholder in {item['venue']}"
        assert "taxclean" not in combined, f"Forbidden brand string in {item['venue']}"
        assert "sent from my" not in combined, f"Forbidden footer in {item['venue']}"
        for addr in item["to"]:
            assert verify_mx(addr), f"MX verification failed for {addr}"

    with smtplib.SMTP_SSL("smtp.gmail.com", 465, timeout=30) as server:
        server.login("sales@taxcleanza.com", pw)
        for item in BATCH_3_NON_SPORTS:
            msg = EmailMessage()
            msg["Subject"] = item["subject"]
            msg["From"] = "Nikhar - PullThru <support@pullthru.co.za>"
            msg["Reply-To"] = "Nikhar <support@pullthru.co.za>"
            msg["To"] = ", ".join(item["to"])
            msg.set_content(item["body"])

            server.send_message(msg, from_addr="support@pullthru.co.za", to_addrs=item["to"])
            print(f"[SENT #{item['id']}] {item['venue']} -> {', '.join(item['to'])}")
            time.sleep(3.0)

    # Update status in prospects.csv
    sent_ids = {item["id"] for item in BATCH_3_NON_SPORTS}
    rows = []
    with open(CSV_PATH, "r", encoding="utf-8", newline="") as f:
        reader = csv.DictReader(f)
        fieldnames = reader.fieldnames
        for r in reader:
            if r["id"] in sent_ids:
                r["status"] = f"Sent ({time.strftime('%Y-%m-%d %H:%M')})"
            rows.append(r)

    with open(CSV_PATH, "w", encoding="utf-8", newline="") as f:
        writer = csv.DictWriter(f, fieldnames=fieldnames)
        writer.writeheader()
        writer.writerows(rows)

    print("ALL 12 BATCH-3 NON-SPORTS EMAILS DISPATCHED SUCCESSFULLY.")

if __name__ == "__main__":
    main()
