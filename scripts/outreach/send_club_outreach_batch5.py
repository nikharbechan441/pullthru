import os
import csv
import json
import time
import socket
import smtplib
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart

# Force IPv4 to avoid Windows SMTP/SSL hangs
_orig_getaddrinfo = socket.getaddrinfo
def _ipv4_getaddrinfo(host, port, family=0, type=0, proto=0, flags=0):
    return _orig_getaddrinfo(host, port, socket.AF_INET, type, proto, flags)
socket.getaddrinfo = _ipv4_getaddrinfo

PW_PATH = os.path.join(os.environ.get('LOCALAPPDATA', os.path.expanduser('~')), 'TaxCleanZA_Data', '.gmail_app_password')
CSV_PATH = r"marketing\outreach\prospects.csv"
LEDGER_PATH = r"marketing\outreach\sent_outreach_ledger.json"

with open(PW_PATH, "r", encoding="utf-8") as f:
    pw = f.read().strip()

BATCH_5 = [
    {
        "id": "172",
        "venue": "Itheko Running Club",
        "contact_name": "Itheko Admin",
        "email": "admin@itheko.co.za",
        "location": "Cape Town",
        "vertical": "Running & Trail Club",
        "subject": "quick question re: weekend group runs at Itheko",
        "body": """Hi team,

Hope you have a good weekend of running lined up.

Quick question - when you organize away-race transport, club braais, or weekend trail runs where runners chip in or RSVP, how are you managing the WhatsApp headcount and EFTs right now?

I built a simple local tool called PullThru (https://pullthru.co.za) for SA clubs. People just tap a link in the WhatsApp chat to lock in their spot (either free RSVP or PayShap/Capitec Pay) so the organizer doesn't have to scroll through 50 messages or match bank references.

It's free for groups up to 30 if you ever want to try it for a weekend run or social.

Have a great weekend,
Nikhar"""
    },
    {
        "id": "173",
        "venue": "Born2Run Athletics Club (Cape Town)",
        "contact_name": "Born2Run CT Team",
        "email": "capetown@born2runac.co.za",
        "location": "Cape Town",
        "vertical": "Athletics & Running Club",
        "subject": "quick question re: Born2Run weekend socials",
        "body": """Hi there,

Hope things are going well at Born2Run CT.

Just wanted to ask - when members put together club breakfast runs, race bus trips, or post-run braais, are you still managing RSVPs and splits manually in the WhatsApp group?

I built a small local site called PullThru (https://pullthru.co.za) after getting tired of chasing friends for EFTs and losing track of who's actually coming. You make a link in a few seconds and drop it in WhatsApp. Runners tap once to confirm (or chip in via PayShap/Capitec Pay) and everyone sees a clean live list.

Free to use for groups up to 30 people if it's helpful for your run leaders.

Cheers,
Nikhar"""
    },
    {
        "id": "174",
        "venue": "Atlantic Athletic Club",
        "contact_name": "Atlantic Athletic Team",
        "email": "info@atlanticathletic.co.za",
        "location": "Clifton / Sea Point, Cape Town",
        "vertical": "Running Club",
        "subject": "weekend run headcounts at Atlantic Athletic",
        "body": """Hi team,

Hope the Sea Point / Clifton runs are going strong.

I put together a small local web tool called PullThru (https://pullthru.co.za) for SA running clubs and social groups. Whenever a run captain organizes a social trail, post-run breakfast, or transport split, they can drop a quick PullThru link in WhatsApp instead of manually writing down names or matching EFT screenshots.

Members just tap to confirm their spot (free RSVP or direct PayShap/Capitec Pay) with no app download needed.

Figured I'd share in case your captains ever get tired of managing group chats. Free for squads up to 30.

All the best for the weekend,
Nikhar"""
    },
    {
        "id": "175",
        "venue": "ATC Multisport & Running Club",
        "contact_name": "ATC Admin",
        "email": "admin@atcmultisport.co.za",
        "location": "Green Point, Cape Town",
        "vertical": "Multisport & Running Club",
        "subject": "quick question re: ATC group rides and runs",
        "body": """Hi team,

Hope training at Green Point is going well this week.

I built a free SA tool called PullThru (https://pullthru.co.za) to help group captains with weekend headcounts and splits (like coffee stops, race travel, or club socials).

Instead of people replying "I'm in" in a noisy WhatsApp group and forgetting to EFT, you drop one link and athletes tap to lock in their spot via free RSVP or PayShap/Capitec Pay. No logins or app downloads for members.

Free for groups up to 30 if your ride or run captains ever want to test it out.

Cheers,
Nikhar"""
    },
    {
        "id": "176",
        "venue": "Meridian Hiking Club",
        "contact_name": "Meridian Team",
        "email": "meridian@meridian.org.za",
        "location": "Cape Town",
        "vertical": "Hiking Club",
        "subject": "trail roll-calls and permit splits for Meridian hikes",
        "body": """Hi there,

Hope you have some good hikes planned for the weekend.

I built a local SA tool called PullThru (https://pullthru.co.za) that a few hike organizers use to handle weekend trail roll-calls and SanParks/hut fee splits without turning the WhatsApp group into chaos.

A hike leader creates a link in 10 seconds, drops it in the chat, and hikers tap to lock in their spot (and split permit/hut costs via PayShap or Capitec Pay if needed). Gives the leader an exact headcount before hitting the trail.

It's free for up to 30 hikers per trip if you want to pass it along to your hike leaders.

Happy trails,
Nikhar"""
    },
    {
        "id": "177",
        "venue": "Chicks Who Trail",
        "contact_name": "Chicks Who Trail Team",
        "email": "info@chickswhotrail.co.za",
        "location": "Cape Town & Western Cape",
        "vertical": "Trail Running Community",
        "subject": "quick question re: Chicks Who Trail group runs",
        "body": """Hi team,

Love the trail community you've built.

Quick question - when you organize group trail mornings, weekend retreats, or coffee meetups, how do you usually keep track of exact numbers without chasing people in WhatsApp?

I built a clean, free SA tool called PullThru (https://pullthru.co.za) where organizers drop one link in the chat. Runners tap their name to grab a spot (or chip in for permits/coffee via PayShap/Capitec Pay) with zero app downloads or accounts required.

It's free for groups up to 30 spots if your run leaders ever want an easier way to do roll-calls.

Have a great weekend on the trails,
Nikhar"""
    },
    {
        "id": "178",
        "venue": "City Cycling Club",
        "contact_name": "City Cycling Team",
        "email": "info@citycyclingclub.co.za",
        "location": "Edgemead, Cape Town",
        "vertical": "Cycling Club",
        "subject": "weekend bunch ride RSVPs & coffee splits",
        "body": """Hi team,

Hope you have a great weekend ride lined up.

I built a small South African tool called PullThru (https://pullthru.co.za) that cycling groups use to organize weekend bunch rides, support vehicle splits, and club braais.

Captains drop a link in the WhatsApp ride group, riders tap once to confirm their spot (or chip in via PayShap/Capitec Pay for backup vehicles or coffee stops), and everyone can see who's rolling out on Saturday morning.

Free for groups up to 30 riders if you'd like to test it out.

Safe riding,
Nikhar"""
    },
    {
        "id": "179",
        "venue": "Durbanville Athletics Club",
        "contact_name": "Durbac Team",
        "email": "info@durbac.org.za",
        "location": "Durbanville, Cape Town",
        "vertical": "Athletics Club",
        "subject": "quick question re: Durbac club socials & bus trips",
        "body": """Hi team,

Hope things are going great out in Durbanville.

I made a simple local web tool called PullThru (https://pullthru.co.za) for SA sports clubs to stop the headache of managing WhatsApp headcounts and chasing EFTs for club braais, race buses, and social events.

Organizers make a link in a few seconds and drop it in the club chat. Members tap to grab their spot (free RSVP or direct PayShap/Capitec Pay) without needing to download an app.

Free to use for squads up to 30 if it's ever handy for your committee or run captains.

Cheers,
Nikhar"""
    },
    {
        "id": "180",
        "venue": "Pierre van Ryneveld Athletics Club",
        "contact_name": "PVRAC Team",
        "email": "pvrsportsclub@gmail.com",
        "location": "Centurion, Pretoria",
        "vertical": "Athletics Club",
        "subject": "weekend run headcounts & club braais at PVRAC",
        "body": """Hi team,

Hope the week in Centurion is going well.

I built a small local site called PullThru (https://pullthru.co.za) for South African running and sports clubs. When captains organize weekend group runs, race transport, or club bring-and-braais, PullThru lets them drop a 1-tap link in WhatsApp so people claim spots (and bring-list items) cleanly.

If there's a fee to split, members can settle via PayShap or Capitec Pay right there so nobody gets stuck chasing EFT screenshots.

Free for groups up to 30 people if you want to give it a look.

Have a lekker weekend,
Nikhar"""
    },
    {
        "id": "181",
        "venue": "Durban Athletic Club",
        "contact_name": "Durban AC Admin",
        "email": "admin@durbanac.com",
        "location": "Durban, KZN",
        "vertical": "Athletics Club",
        "subject": "quick question re: Durban AC weekend runs & socials",
        "body": """Hi team,

Hope training at Kings Park is going well.

I built a straightforward SA tool called PullThru (https://pullthru.co.za) to help club organizers manage group runs, Comrades/away-race transport splits, and social braais without chasing people on WhatsApp.

Organizers drop one link in the group chat, members tap to lock in their spot (free RSVP or PayShap/Capitec Pay), and you get an exact live list with no app downloads needed.

Free for squads up to 30 if it would help your captains.

Cheers,
Nikhar"""
    },
    {
        "id": "182",
        "venue": "32Gi Running Club",
        "contact_name": "32Gi Team",
        "email": "info@32gi.com",
        "location": "Johannesburg & National",
        "vertical": "Running Club",
        "subject": "quick tool for 32Gi community group runs",
        "body": """Hi team,

Hope the week is going well.

I built a simple South African web tool called PullThru (https://pullthru.co.za) for running groups and social meetups. When community run leaders organize weekend group runs or coffee socials, they drop a PullThru link in WhatsApp so runners lock in their spot in 1 tap instead of getting lost in chat replies.

It works for free RSVPs and optional gear/coffee splits via PayShap or Capitec Pay, with no app downloads required for runners.

Free for groups up to 30 spots if your run ambassadors ever want to use it.

All the best,
Nikhar"""
    },
    {
        "id": "183",
        "venue": "Run Club Near Me SA",
        "contact_name": "Run Club Near Me Team",
        "email": "support@runclubnearme.co.za",
        "location": "South Africa (National)",
        "vertical": "Running Club Directory",
        "subject": "useful free RSVP tool for the SA run clubs in your directory",
        "body": """Hi team,

Really appreciate what you're doing listing local run clubs across SA.

I built a free SA tool called PullThru (https://pullthru.co.za) specifically to help social run organizers keep track of who's actually pitching up to Saturday mornings without making everyone download an app.

Hosts drop a 1-tap link in their WhatsApp or IG bio, runners tap their name to RSVP (free up to 30 spots), and if they're doing a post-run coffee or bus split, people can chip in with PayShap or Capitec Pay.

Thought it might be a neat resource for the smaller social clubs on your site. Happy to share more if useful.

Cheers,
Nikhar"""
    },
    {
        "id": "184",
        "venue": "ARD Athletic Club",
        "contact_name": "ARD Secretary",
        "email": "secretary.ardac@gmail.com",
        "location": "Kenwyn, Cape Town",
        "vertical": "Athletics Club",
        "subject": "quick question re: ARD weekend run roll-calls",
        "body": """Hi there,

Hope you have a great weekend of running ahead in Cape Town.

I put together a small local web tool called PullThru (https://pullthru.co.za) to make club run RSVPs, transport splits, and club braais way less painful for organizers.

You make a link in 10 seconds and drop it in the club WhatsApp chat. Members tap once to lock in their spot (or pay their share via PayShap/Capitec Pay) so committee members don't have to chase EFT references on Monday morning.

Free for groups up to 30 people if you want to give it a try.

Cheers,
Nikhar"""
    }
]

print(f"Starting Batch 5 casual human dispatch to {len(BATCH_5)} SA running/trail/cycling clubs...")

with open(LEDGER_PATH, "r", encoding="utf-8") as f:
    ledger = json.load(f)

contacted_emails = set(ledger.get("contacted_emails", []))
contacted_domains = set(ledger.get("contacted_domains", []))

sent_count = 0
failed_count = 0

with smtplib.SMTP_SSL("smtp.gmail.com", 465, timeout=20) as server:
    server.login("sales@taxcleanza.com", pw)
    
    for item in BATCH_5:
        target_email = item["email"]
        domain = target_email.split("@")[1].lower()
        is_generic = domain in ["gmail.com", "yahoo.com", "mweb.co.za", "lantic.net"]
        
        if target_email in contacted_emails or (not is_generic and domain in contacted_domains):
            print(f"[GUARD SKIP] {target_email} is already in ledger!")
            continue

        msg = MIMEMultipart()
        msg["From"] = "Nikhar Bechan <sales@taxcleanza.com>"
        msg["To"] = target_email
        msg["Reply-To"] = "sales@taxcleanza.com"
        msg["Subject"] = item["subject"]
        msg.attach(MIMEText(item["body"], "plain", "utf-8"))

        try:
            server.sendmail("sales@taxcleanza.com", [target_email], msg.as_string())
            print(f"[SENT {sent_count+1}/13] {target_email} ({item['venue']})")
            
            contacted_emails.add(target_email)
            if not is_generic:
                contacted_domains.add(domain)
            sent_count += 1
            
            with open(CSV_PATH, "a", newline="", encoding="utf-8") as cf:
                writer = csv.writer(cf)
                writer.writerow([
                    item["id"],
                    item["venue"],
                    item["contact_name"],
                    item["email"],
                    "",
                    item["location"],
                    item["vertical"],
                    item["subject"],
                    f"Sent ({time.strftime('%Y-%m-%d %H:%M')})"
                ])
                
            time.sleep(3)
        except Exception as e:
            print(f"[FAILED] {target_email}: {e}")
            failed_count += 1

ledger["contacted_emails"] = sorted(list(contacted_emails))
ledger["contacted_domains"] = sorted(list(contacted_domains))
ledger["last_synced"] = time.strftime("%Y-%m-%d %H:%M:%S")

with open(LEDGER_PATH, "w", encoding="utf-8") as f:
    json.dump(ledger, f, indent=2)

print(f"\n==========================================")
print(f"BATCH 5 COMPLETE: {sent_count} sent, {failed_count} failed.")
print(f"Ledger and prospects.csv updated.")
