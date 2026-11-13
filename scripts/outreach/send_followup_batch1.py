import os
import csv
import time
import socket
import smtplib
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart

# Force IPv4
_orig_getaddrinfo = socket.getaddrinfo
def _ipv4_getaddrinfo(host, port, family=0, type=0, proto=0, flags=0):
    return _orig_getaddrinfo(host, port, socket.AF_INET, type, proto, flags)
socket.getaddrinfo = _ipv4_getaddrinfo

PW_PATH = os.path.join(os.environ.get('LOCALAPPDATA', os.path.expanduser('~')), 'TaxCleanZA_Data', '.gmail_app_password')
CSV_PATH = r"marketing\outreach\prospects.csv"

with open(PW_PATH, "r", encoding="utf-8") as f:
    pw = f.read().strip()

FOLLOWUPS = [
    {
        "id": "1",
        "email": "pedro@urbansports.joburg",
        "venue": "Urban Sports (Marks Park & Pirates)",
        "subject": "Re: 5-a-side team splits at Marks Park & Pirates",
        "body": """Hi Pedro,

Just floating this back up in case it got buried a couple of weeks back.

Quick update on our side - we stripped out the setup steps and made PullThru free for squads up to 30 people. A captain just makes an 8-second link and drops it in their WhatsApp group so players lock in their spot via PayShap or Capitec Pay before kickoff.

If you ever want to test it with one of your Marks Park or Pirates leagues, happy to send a quick link. Otherwise no stress at all, and have a good weekend.

Cheers,
Nikhar"""
    },
    {
        "id": "5",
        "email": "info@oldparks.co.za",
        "venue": "Old Parks Sports Club",
        "subject": "Re: soccer & padel group splits at Old Parks",
        "body": """Hi team,

Just following up briefly in case my email from late October slipped through the cracks.

We recently opened up PullThru (https://pullthru.co.za) to be completely free for groups up to 30 people, with no accounts or app downloads needed for members. It lets organizers collect court or match splits via PayShap and Capitec Pay before arriving at the club.

Let me know if you'd like to see a quick example link for Old Parks. Either way, hope you have a busy weekend at the club.

Cheers,
Nikhar"""
    },
    {
        "id": "45",
        "email": "brandon@fivesfutbol.co.za",
        "venue": "Fives Futbol",
        "subject": "Re: Fives Futbol captain court fee splits",
        "body": """Hi Brandon,

Just bumping this once in case it got buried in the inbox two weeks ago.

We made a big change to PullThru (https://pullthru.co.za) this week - expanded the free tier to 30 players and removed the banking setup walls for free roll-calls. Captains just drop a WhatsApp link and get their squad to settle via PayShap or Capitec Pay before pitching up at the venue.

Happy to send a quick test link if useful for your captains, otherwise all good and have a lekker weekend.

Cheers,
Nikhar"""
    },
    {
        "id": "46",
        "email": "info@discoverysoccerpark.co.za",
        "venue": "Discovery Soccer Park",
        "subject": "Re: squad fee chasing at Discovery Soccer Park",
        "body": """Hi team,

Just circling back briefly on my note from the end of October.

If your 5-a-side captains at Wanderers or Illovo are still fronting court fees and chasing players on WhatsApp, PullThru (https://pullthru.co.za) is now free for up to 30 players per game with instant PayShap and Capitec Pay splits.

No worries if you already have a system that works, just wanted to share the update. Have a good weekend ahead.

Cheers,
Nikhar"""
    },
    {
        "id": "11",
        "email": "ruben@rbclub.co.za",
        "venue": "The Racket & Ball Club (RB Club)",
        "subject": "Re: padel 4-ball splits at RB Club",
        "body": """Hi Ruben,

Just bumping this in case it got lost in the inbox shuffle a couple weeks back.

We updated PullThru (https://pullthru.co.za) so social padel organizers and 4-balls can spin up a split link in 8 seconds for free (now up to 30 spots for social events/tournaments), letting mates settle via PayShap or Capitec Pay without downloading anything.

If it's helpful for any of your Melrose Arch members, feel free to check out pullthru.co.za/5-a-side-and-padel. Hope the courts are packed this weekend.

Cheers,
Nikhar"""
    },
    {
        "id": "26",
        "email": "info@tigger2.co.za",
        "venue": "Tigger 2 Yacht Charters",
        "subject": "Re: private group charter splits on Tigger 2",
        "body": """Hi team,

Just following up once on my email from two weeks ago in case it got missed.

For larger birthday or bachelor groups booking a private charter, the organizer usually struggles to collect money from 15-25 guests before paying you a single lump sum. PullThru (https://pullthru.co.za) lets the organizer collect everyone's share via PayShap/Capitec Pay on one WhatsApp link so they can settle your invoice cleanly.

It's free for the organizer up to 30 guests. Let me know if you'd like an example link you can forward to group organizers asking how to split a charter.

Cheers,
Nikhar"""
    },
    {
        "id": "25",
        "email": "events@hartiesboatcompany.co.za",
        "venue": "Harties Boat Company",
        "subject": "Re: group boat cruise deposits at Harties",
        "body": """Hi team,

Just checking back in briefly on my email from late October.

When a group organizer wants to book a private cruise or group outing, getting 20 people to send EFTs on time can stall the booking. PullThru (https://pullthru.co.za) gives them an easy WhatsApp link to collect everyone's share via PayShap or Capitec Pay, so your bookings team only deals with one clean payout.

Happy to send over a preview link if that's helpful for your weekend inquiries. Either way, hope you have a great weekend on the dam.

Cheers,
Nikhar"""
    },
    {
        "id": "98",
        "email": "taproom@jackblackbeer.com",
        "venue": "Jack Black's Brewing Co. Taproom",
        "subject": "Re: big group tables & deposits at Jack Black",
        "body": """Hi team,

Just floating this back up from last week in case it slipped past.

For big birthday tables or weekend taproom bookings where one person normally ends up fronting a massive deposit and chasing friends later, PullThru (https://pullthru.co.za) lets them drop a 10-second WhatsApp link so everyone pays their share via PayShap or Capitec Pay upfront.

Free for groups up to 30 people, zero app download. Let me know if you want a quick template link to send group organizers, otherwise all the best for a busy Friday at the taproom.

Cheers,
Nikhar"""
    },
    {
        "id": "110",
        "email": "visit@warwickwine.com",
        "venue": "Warwick Wine Estate Gourmet Picnics",
        "subject": "Re: group lawn pod bookings at Warwick",
        "body": """Hi team,

Just a quick follow-up on my email from last week about large group picnic bookings.

If you ever have birthday or bachelorette organizers struggling to collect from 12-25 guests before confirming their Warwick lawn pod booking, they can use PullThru (https://pullthru.co.za) to gather everyone's PayShap/Capitec Pay shares in one WhatsApp link and pay you in one go.

We just made it free for groups up to 30 guests too. Hope you have a lovely weekend out in Stellenbosch.

Cheers,
Nikhar"""
    },
    {
        "id": "107",
        "email": "info@artjamming.co.za",
        "venue": "Artjamming South Africa",
        "subject": "Re: kitchen teas & group painting bookings",
        "body": """Hi team,

Just circling back briefly on my note from last week.

For kitchen teas and group birthday bookings, organizers often delay confirming because they're still waiting for 15 friends to EFT them. PullThru (https://pullthru.co.za) helps them lock in headcount and collect everyone's share via PayShap or Capitec Pay on one WhatsApp link, so they can pay your studio invoice right away.

Free for groups up to 30 people. No stress if you don't need it right now, just wanted to keep it on your radar.

Cheers,
Nikhar"""
    },
    {
        "id": "106",
        "email": "campsbay@thepottery.co.za",
        "venue": "The Pottery (Camps Bay, Sandton & Lynnwood)",
        "subject": "Re: large group & birthday table splits at The Pottery",
        "body": """Hi team,

Just bumping my email from last week in case it got buried.

Whenever someone organizes a big birthday, kitchen tea, or team outing at The Pottery, PullThru (https://pullthru.co.za) gives them an 8-second WhatsApp link to collect everyone's seat deposit via PayShap/Capitec Pay upfront so your team doesn't have to split 12 bills at the counter.

We just expanded the free tier to 30 people as well. Hope you have a great weekend across all the studios.

Cheers,
Nikhar"""
    },
    {
        "id": "31",
        "email": "evan@teambuildingworx.co.za",
        "venue": "Teambuilding Worx",
        "subject": "Re: group social & team event collections",
        "body": """Hi Evan,

Just following up once on my note from late October in case it got missed.

For self-funded social groups, bachelor parties, or sports club events that book through you, PullThru (https://pullthru.co.za) gives the organizer a clean WhatsApp roll-call and PayShap/Capitec Pay collection link (now free for up to 30 people) so you don't end up chasing individual guests for deposits.

Happy to send a quick example if it's ever handy. Otherwise have a good weekend ahead.

Cheers,
Nikhar"""
    }
]

print(f"Starting casual follow-up dispatch to {len(FOLLOWUPS)} medium-sized SA venues...")

sent_count = 0
failed_count = 0
updated_ids = set()

with smtplib.SMTP_SSL("smtp.gmail.com", 465, timeout=20) as server:
    server.login("sales@taxcleanza.com", pw)
    
    for item in FOLLOWUPS:
        msg = MIMEMultipart()
        msg["From"] = "Nikhar Bechan <sales@taxcleanza.com>"
        msg["To"] = item["email"]
        msg["Reply-To"] = "sales@taxcleanza.com"
        msg["Subject"] = item["subject"]
        msg.attach(MIMEText(item["body"], "plain", "utf-8"))

        try:
            server.sendmail("sales@taxcleanza.com", [item["email"]], msg.as_string())
            print(f"[FOLLOW-UP {sent_count+1}/12] Sent to {item['email']} ({item['venue']})")
            sent_count += 1
            updated_ids.add(item["id"])
            time.sleep(3)
        except Exception as e:
            print(f"[FAILED] {item['email']}: {e}")
            failed_count += 1

# Update prospects.csv statuses for sent follow-ups
if updated_ids:
    rows = []
    with open(CSV_PATH, "r", encoding="utf-8") as cf:
        reader = csv.reader(cf)
        header = next(reader)
        rows.append(header)
        for r in reader:
            if len(r) >= 9 and r[0] in updated_ids:
                r[8] = f"Follow-up 1 Sent ({time.strftime('%Y-%m-%d %H:%M')})"
            rows.append(r)
    with open(CSV_PATH, "w", newline="", encoding="utf-8") as cf:
        writer = csv.writer(cf)
        writer.writerows(rows)

print(f"\n==========================================")
print(f"FOLLOW-UP DISPATCH COMPLETE: {sent_count} sent, {failed_count} failed.")
