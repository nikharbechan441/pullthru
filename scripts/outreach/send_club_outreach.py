import os
import csv
import time
import smtplib
from email.message import EmailMessage

PW_PATH = r"C:\Users\arvin\OneDrive\Desktop\TaxClean - AntiGravity\.gmail_app_password"
CSV_PATH = r"c:\Users\arvin\OneDrive\Desktop\App 3\prospects.csv"

EMAILS = [
    {
        "id": "1",
        "venue": "Urban Sports (Marks Park & Pirates Arenas)",
        "to": ["pedro@urbansports.joburg", "bookings@urbansports.joburg"],
        "subject": "quick question re: 5-a-side court bookings at Marks Park & Pirates",
        "body": """Howzit Pedro,

Saw the evening 5-a-side leagues at Marks Park and Pirates are packed, so I'll keep this brief.

Quick question — how often do you still have team captains pitching up 2 players short or asking to pay the balance tomorrow because their mates bailed on the WhatsApp group at 17:00?

I built a free South African web tool called PullThru (https://pullthru.co.za) that fixes that for your captains. They drop one link into their team WhatsApp group, and players lock their spot in 2 taps via Capitec Pay, Apple Pay, Card, or PayShap before kickoff. No pay = no bib, and there's no app download required.

If a player pulls out late, they can 1-tap swap their paid spot to a standby mate on the group.

Happy to set up a custom Urban Sports preset link for your league captains to test this week if useful?

Cheers,
Nikhar
support@pullthru.co.za
PullThru — pullthru.co.za"""
    },
    {
        "id": "2",
        "venue": "ClubPadel @ Pirates Club",
        "to": ["cheryl@clubpadel.co.za", "events@clubpadel.co.za"],
        "subject": "quick question re: padel court splits at ClubPadel Pirates",
        "body": """Hi Cheryl,

Love what you've built with ClubPadel at Pirates in Greenside — I'll keep this brief.

When groups book a court or join a social tournament, how often does one player get stuck fronting the full court fee and chasing 3 mates for R150 EFTs on WhatsApp?

I built a South African web tool called PullThru (https://pullthru.co.za) where the organiser drops one link into their WhatsApp group and the 4 players lock their court slot in 2 taps via Capitec Pay, Apple Pay, Card, or PayShap. No app store download needed, and spots only lock once paid.

Would you be open to testing a custom ClubPadel link for your social games or court organisers this week?

Cheers,
Nikhar
support@pullthru.co.za
PullThru — pullthru.co.za"""
    },
    {
        "id": "3",
        "venue": "Action Sports Edenvale",
        "to": ["frank@actionsports.co.za", "debs@actionsports.co.za"],
        "subject": "quick question re: team fees at Action Sports Edenvale",
        "body": """Hi Frank and Debs,

Saw the action soccer and netball fixtures running at Action Sports Edenvale, so I'll keep this short.

Quick question — how often do team captains still get stuck fronting match fees out of their own pocket because 2 or 3 players haven't paid their share before the game starts?

I built a free South African tool called PullThru (https://pullthru.co.za) that lets captains drop one link into their team WhatsApp group. Players lock their spot in 2 taps using Capitec Pay, Apple Pay, Card, or PayShap before game time — zero app download needed.

Happy to send over a custom Action Sports Edenvale link for a couple of your captains to try out this week if you're keen?

Cheers,
Nikhar
support@pullthru.co.za
PullThru — pullthru.co.za"""
    },
    {
        "id": "4",
        "venue": "Randburg Harriers Running Club",
        "to": ["secretary@randburgharriers.co.za"],
        "subject": "quick question re: weekend run & braai RSVPs at Randburg Harriers",
        "body": """Hi Michelle,

Hope the running calendar at Randburg Harriers is going well — I'll keep this brief.

How much time do you spend scrolling through long copy-paste WhatsApp lists and matching bank statement references like "RUN" or "BRAAI" whenever the club organises a breakfast run, bus trip, or club social?

I built a South African tool called PullThru (https://pullthru.co.za) specifically to kill off WhatsApp list admin. You drop one link in the club WhatsApp group, and members RSVP or chip in via Capitec Pay, Apple Pay, Card, or PayShap in 2 taps — no app download needed. It even has a free RSVP mode with a "Bring-'n-Bak" item claim list for club braais.

You can test a live link anytime at https://pullthru.co.za — let me know if you'd like me to set up a free Randburg Harriers template for your next club social.

Cheers,
Nikhar
support@pullthru.co.za
PullThru — pullthru.co.za"""
    },
    {
        "id": "5",
        "venue": "Old Parks Sports Club",
        "to": ["info@oldparks.co.za", "oldparksmanager@africapadel.com"],
        "subject": "quick question re: 5-a-side & padel group bookings at Old Parks",
        "body": """Howzit Team,

Saw the 5-a-side turf and Africa Padel courts buzzing at Old Parks in Randburg, so I'll keep this brief.

When social groups book a pitch or padel court, the organiser almost always gets stuck fronting the full venue fee and chasing mates for EFTs in the WhatsApp chat.

I built a South African web tool called PullThru (https://pullthru.co.za) where the host drops one link in their WhatsApp group and players lock their spot in 2 taps via Capitec Pay, Apple Pay, Card, or PayShap before kickoff. No app download required, and if someone bails late they can 1-tap swap their paid spot to a standby mate.

Happy to set up a free Old Parks preset link for your regular captains and social organisers to test this week if useful?

Cheers,
Nikhar
support@pullthru.co.za
PullThru — pullthru.co.za"""
    },
    {
        "id": "6",
        "venue": "One10Sport 5-a-Side",
        "to": ["play@one10sport.co.za"],
        "subject": "quick question re: 5-a-side captains at One10Sport Milnerton",
        "body": """Howzit Team,

Saw the 5-a-side games running at One10Sport in Milnerton, so I'll keep this short.

Quick question — how often do your social captains struggle with last-minute dropouts or chasing 9 mates for R100 EFTs in the WhatsApp group on game night?

I built a South African web tool called PullThru (https://pullthru.co.za) that lets captains drop one link in their WhatsApp group. Players lock their spot in 2 taps via Capitec Pay, Apple Pay, Card, or PayShap before kickoff (strictly capped at 10 spots, no app download needed).

Happy to set up a free One10Sport preset link for your captains to test on their next game night if you're keen?

Cheers,
Nikhar
support@pullthru.co.za
PullThru — pullthru.co.za"""
    },
    {
        "id": "7",
        "venue": "Camps Bay Sports Club",
        "to": ["getsocial@campsbaysocialclub.co.za"],
        "subject": "quick question re: social events & padel RSVPs at Camps Bay Club",
        "body": """Hi Team,

Love the community sports and social calendar you run in Camps Bay — I'll keep this brief.

Whenever you put together a club social, padel mixer, or weekend braai on WhatsApp, how much time goes into chasing RSVPs, EFT screenshots, and who's bringing what?

I built a South African tool called PullThru (https://pullthru.co.za) where you drop one link into the WhatsApp group and members lock their spot in 2 taps via Capitec Pay, Apple Pay, Card, or PayShap (with multi-tier options for Meat, Veg, or Kids, plus a live Bring-'n-Bak checklist). Zero app download required.

You can check it out at https://pullthru.co.za — happy to set up a custom Camps Bay template for your next social if useful?

Cheers,
Nikhar
support@pullthru.co.za
PullThru — pullthru.co.za"""
    },
    {
        "id": "8",
        "venue": "Celtic Harriers Running Club",
        "to": ["info@celticharriers.co.za"],
        "subject": "quick question re: club runs & social RSVPs at Celtic Harriers",
        "body": """Hi Rohan,

Hope the season is going well for Celtic Harriers in Claremont — I'll keep this short.

How much time do your convenors spend managing copy-paste WhatsApp lists and matching bank EFT references whenever the club organises a breakfast run, pasta night, or away bus trip?

I built a South African web tool called PullThru (https://pullthru.co.za) that replaces WhatsApp scroll lists with one clean link. Members tap the link in WhatsApp and lock their spot in 2 taps via Capitec Pay, Apple Pay, Card, or PayShap — or RSVP for free on R0 club runs with +1 headcount tracking. No app download needed.

Feel free to take a look at https://pullthru.co.za — happy to set up a custom Celtic Harriers link for your next club run or social if you'd like to test it.

Cheers,
Nikhar
support@pullthru.co.za
PullThru — pullthru.co.za"""
    },
    {
        "id": "9",
        "venue": "Padel Lab / Westville Country Club",
        "to": ["manager@westvillecc.co.za", "info@padellab.co.za"],
        "subject": "quick question re: padel & social court splits at Westville CC",
        "body": """Hi Lisa,

Saw the Padel Lab courts and sports sections thriving at Westville Country Club — I'll keep this brief.

When members book a padel court or organise a Friday club braai, one person almost always ends up fronting the cash and chasing the rest of the WhatsApp group for EFTs.

I built a South African web tool called PullThru (https://pullthru.co.za) where the organiser drops one link into their WhatsApp group and players lock their spot in 2 taps via Capitec Pay, Apple Pay, Card, or PayShap. No app download required, and it even includes a free SA Braai Calculator and Bring-'n-Bak list for club socials.

Would you be open to sharing or testing a custom Westville Country Club link with your padel and sports captains this week?

Cheers,
Nikhar
support@pullthru.co.za
PullThru — pullthru.co.za"""
    },
    {
        "id": "10",
        "venue": "Crusaders Running Club",
        "to": ["crusadersrunning@gmail.com"],
        "subject": "quick question re: weekend run & social RSVPs at Crusaders Running Club",
        "body": """Howzit Team,

Hope the Durban North training runs are going strong at Crusaders — I'll keep this brief.

How much time do you spend managing copy-paste numbered lists in the WhatsApp group and chasing EFT proof-of-payments whenever the club organises a breakfast run, race tent kitty, or weekend braai?

I built a South African web tool called PullThru (https://pullthru.co.za) that replaces WhatsApp list chaos with one link. Members tap the link in WhatsApp and lock their spot in 2 taps via Capitec Pay, Apple Pay, Card, or PayShap (or RSVP for free on R0 training runs). No app download required.

You can test it live at https://pullthru.co.za — let me know if you'd like a custom Crusaders template for your next club run or social.

Cheers,
Nikhar
support@pullthru.co.za
PullThru — pullthru.co.za"""
    }
]

def main():
    with open(PW_PATH, "r", encoding="utf-8") as f:
        pw = f.read().strip().replace(" ", "")

    # Pre-flight validation: ensure zero brackets/blanks and zero 'taxclean' in any subject or body
    for item in EMAILS:
        combined = (item["subject"] + " " + item["body"]).lower()
        assert "[" not in combined and "]" not in combined, f"Blank placeholder detected in {item['venue']}"
        assert "taxclean" not in combined, f"Forbidden brand string detected in {item['venue']}"
        assert "sent from my" not in combined, f"Forbidden footer detected in {item['venue']}"

    sent_ids = set()
    with smtplib.SMTP_SSL("smtp.gmail.com", 465, timeout=30) as server:
        server.login("sales@taxcleanza.com", pw)
        for item in EMAILS:
            msg = EmailMessage()
            msg["Subject"] = item["subject"]
            msg["From"] = "Nikhar - PullThru <support@pullthru.co.za>"
            msg["Reply-To"] = "Nikhar <support@pullthru.co.za>"
            msg["To"] = ", ".join(item["to"])
            msg.set_content(item["body"])

            server.send_message(msg, from_addr="support@pullthru.co.za", to_addrs=item["to"])
            sent_ids.add(item["id"])
            print(f"[SENT #{item['id']}] {item['venue']} -> {', '.join(item['to'])}")
            time.sleep(1.5)

    # Update prospects.csv status
    rows = []
    with open(CSV_PATH, "r", encoding="utf-8", newline="") as f:
        reader = csv.DictReader(f)
        fieldnames = reader.fieldnames
        for row in reader:
            if row["id"] in sent_ids:
                row["status"] = "Sent (2026-10-30)"
            rows.append(row)

    with open(CSV_PATH, "w", encoding="utf-8", newline="") as f:
        writer = csv.DictWriter(f, fieldnames=fieldnames)
        writer.writeheader()
        writer.writerows(rows)

    print(f"ALL {len(sent_ids)} CLUB OUTREACH EMAILS DISPATCHED SUCCESSFULLY.")

if __name__ == "__main__":
    main()
