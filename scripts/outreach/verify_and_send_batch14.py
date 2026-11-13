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
        "venue": "Paarl Action Sports Arena",
        "contact_name": "Bookings & Arena Management",
        "email": "bookings@paarlarena.co.za",
        "alt_email": "",
        "location": "Wamakers Plein, Paarl, Western Cape",
        "vertical": "Indoor Action Cricket, Netball, 5-a-Side & Action Padel",
        "pain_point_hook": "Team captains & social party organisers collecting court & equipment fees on WhatsApp",
        "to": ["bookings@paarlarena.co.za"],
        "subject": "Court fees and team booking splits at Paarl Action Sports Arena",
        "body": """Good day Paarl Action Sports Team,

When a team captain or party organiser books an action cricket court, netball league spot, or padel session for 8 to 16 players, the organiser often stresses about fronting the entire court fee upfront while waiting days for teammates to EFT them back.

We built PullThru (https://pullthru.co.za/for-venues) right here in South Africa to remove that headache. The captain drops one 15-second link into their WhatsApp team group, every player chips in their exact share via PayShap, Capitec PayMe, Apple Pay, or card with R0 guest fees, and the organiser pays your single court fee without chasing anyone.

There is zero cost to Paarl Action Sports and zero integration needed. You can check out our free 10-second Venue Quote Snippet & Website Helper at https://pullthru.co.za/for-venues whenever your team confirms a booking.

Warm regards,
Nikhar Bechan
Founder, PullThru SA
https://pullthru.co.za/for-venues | support@pullthru.co.za"""
    },
    {
        "venue": "Rickety Bridge Wine Estate / The Padel Social Club",
        "contact_name": "Hospitality & Bookings Team",
        "email": "info@ricketybridge.com",
        "alt_email": "",
        "location": "Franschhoek, Western Cape",
        "vertical": "Wine Estate Padel Courts, Cellar Tastings & Estate Lunches",
        "pain_point_hook": "Padel 4-ball & wine tasting group organisers collecting per-person fees on WhatsApp",
        "to": ["info@ricketybridge.com"],
        "subject": "Padel court and tasting group deposits at Rickety Bridge",
        "body": """Good day Rickety Bridge Team,

When an organiser coordinates a social Padel 4-ball or an afternoon wine tasting and lunch at Rickety Bridge for 8 to 16 friends, the organiser often hesitates to pay the deposit upfront while chasing individual friends in a WhatsApp group for EFT proofs.

We built PullThru (https://pullthru.co.za/for-venues) in South Africa specifically for this. The organiser drops one 15-second link into their WhatsApp chat, every guest locks in their spot via PayShap, Capitec PayMe, Apple Pay, or card with R0 guest fees, and the host pays your single deposit on time.

There is zero cost to Rickety Bridge and zero change to your booking desk. Feel free to explore our free 10-second Venue Quote Snippet at https://pullthru.co.za/for-venues whenever your team sends out a group quote.

Warm regards,
Nikhar Bechan
Founder, PullThru SA
https://pullthru.co.za/for-venues | support@pullthru.co.za"""
    },
    {
        "venue": "Ground The Venue Muldersdrift",
        "contact_name": "Events & Picnics Team",
        "email": "events@projectground.co.za",
        "alt_email": "",
        "location": "Muldersdrift, Gauteng",
        "vertical": "Outdoor Lawn Picnics, Trail Runs, Celebrations & Private Gatherings",
        "pain_point_hook": "Picnic & celebration organisers collecting per-head entry & catering fees on WhatsApp",
        "to": ["events@projectground.co.za"],
        "subject": "Group picnic and celebration booking deposits at Ground The Venue",
        "body": """Good day Ground The Venue Team,

When a customer plans a birthday picnic, corporate social, or group celebration for 10 to 25 people at Ground The Venue, the organiser often delays confirming the booking because they do not want to front the full per-head deposit out of their own pocket.

We built PullThru (https://pullthru.co.za/for-venues) here in South Africa to streamline this exact step. The organiser shares a 15-second link in their WhatsApp group, each friend pays their share via PayShap, Capitec PayMe, Apple Pay, or card with zero guest fees, and the organiser pays your single venue deposit seamlessly.

It is 100% free for your venue. You can generate a free 10-second booking quote snippet or embed helper at https://pullthru.co.za/for-venues whenever your events team sends out a quote.

Warm regards,
Nikhar Bechan
Founder, PullThru SA
https://pullthru.co.za/for-venues | support@pullthru.co.za"""
    },
    {
        "venue": "Cape Point Vineyards",
        "contact_name": "Picnic & Events Team",
        "email": "info@cape-point.com",
        "alt_email": "",
        "location": "Noordhoek, Cape Town, Western Cape",
        "vertical": "Lawn Picnics, Sunset Burgers, Weddings & Private Functions",
        "pain_point_hook": "Group picnic & birthday organisers collecting per-basket fees upfront on WhatsApp",
        "to": ["info@cape-point.com"],
        "subject": "Group picnic baskets and celebration deposits at Cape Point Vineyards",
        "body": """Good day Cape Point Vineyards Team,

When someone arranges a lawn picnic or birthday gathering for 8 to 20 guests at Cape Point Vineyards, the organiser often delays booking because they are waiting for everyone in their WhatsApp group to pay for their picnic baskets and wine.

We built PullThru (https://pullthru.co.za/for-venues) in South Africa to solve this. The host drops a 15-second link into their WhatsApp chat, every guest pays their share via PayShap, Capitec PayMe, Apple Pay, or card with R0 guest fees, and the organiser pays your single booking invoice immediately.

There is no cost to Cape Point Vineyards and no integration needed. You can test our free 10-second Venue Quote Snippet at https://pullthru.co.za/for-venues whenever your team fields a group picnic enquiry.

Warm regards,
Nikhar Bechan
Founder, PullThru SA
https://pullthru.co.za/for-venues | support@pullthru.co.za"""
    },
    {
        "venue": "Fairview Wine & Cheese / Goatshed Restaurant",
        "contact_name": "Hospitality & Bookings Team",
        "email": "goatshed@fairview.co.za",
        "alt_email": "",
        "location": "Suider-Paarl, Western Cape",
        "vertical": "Group Cheese & Wine Tastings, Long-Table Farm Lunches",
        "pain_point_hook": "Large group bookings (10+ guests) collecting per-person tasting and lunch fees on WhatsApp",
        "to": ["goatshed@fairview.co.za"],
        "subject": "Group tasting and Goatshed table deposits at Fairview",
        "body": """Good day Fairview & Goatshed Team,

Because group tastings for 10 or more guests and weekend Goatshed celebration tables require upfront coordination, organisers often hesitate to commit because they do not want to front thousands of Rands while waiting for friends on WhatsApp to EFT them back.

We built PullThru (https://pullthru.co.za/for-venues) here in South Africa to help organisers collect everyone's share upfront via PayShap, Capitec PayMe, Apple Pay, or card with R0 guest fees, so they can pay your single deposit invoice on time.

There is zero cost to Fairview and zero change to your booking process. You can test our free 10-second Venue Quote Snippet & Website Helper at https://pullthru.co.za/for-venues whenever your bookings team sends out group pricing.

Warm regards,
Nikhar Bechan
Founder, PullThru SA
https://pullthru.co.za/for-venues | support@pullthru.co.za"""
    },
    {
        "venue": "The Franschhoek Cellar",
        "contact_name": "Cellar Door & Bookings Team",
        "email": "fhccellardoor@dgb.co.za",
        "alt_email": "",
        "location": "Franschhoek, Western Cape",
        "vertical": "Wine & Cheese Tastings, Private Events & Boma Braais",
        "pain_point_hook": "Group wine-tour & long-table birthday organisers collecting per-person deposits on WhatsApp",
        "to": ["fhccellardoor@dgb.co.za"],
        "subject": "Group wine tasting and celebration table deposits at Franschhoek Cellar",
        "body": """Good day Franschhoek Cellar Team,

When an organiser coordinates a group wine tasting, boma lunch, or birthday gathering for 10 to 20 guests at Franschhoek Cellar, they often delay paying the venue deposit because they are waiting for each guest to transfer their share.

We built PullThru (https://pullthru.co.za/for-venues) in South Africa to eliminate that delay. The organiser drops one 15-second link into their WhatsApp chat, guests pay via PayShap, Capitec PayMe, Apple Pay, or card with R0 guest fees, and the organiser pays your single venue deposit without out-of-pocket stress.

There is zero fee for your venue. You can check out our free 10-second Venue Quote Snippet at https://pullthru.co.za/for-venues whenever your team replies to a group booking enquiry.

Warm regards,
Nikhar Bechan
Founder, PullThru SA
https://pullthru.co.za/for-venues | support@pullthru.co.za"""
    },
    {
        "venue": "Durbanville Hills Wine Estate",
        "contact_name": "Hospitality & Bookings Team",
        "email": "info@durbanvillehills.co.za",
        "alt_email": "",
        "location": "Durbanville, Western Cape",
        "vertical": "Wine Tastings, Bistro Lunches & Table Mountain View Functions",
        "pain_point_hook": "Group tasting & birthday lunch organisers collecting per-head deposits on WhatsApp",
        "to": ["info@durbanvillehills.co.za"],
        "subject": "Group tasting and bistro table deposits at Durbanville Hills",
        "body": """Good day Durbanville Hills Team,

When someone arranges a group wine tasting, Collectors Reserve experience, or celebratory bistro lunch for 8 to 16 guests at Durbanville Hills, the organiser often waits days before paying the booking deposit while chasing friends in their WhatsApp group.

We built PullThru (https://pullthru.co.za/for-venues) in South Africa so the organiser can drop a single 15-second link into their WhatsApp group, collect everyone's share via PayShap, Capitec PayMe, Apple Pay, or card with R0 guest fees, and pay your single deposit invoice on time.

There is R0 cost to Durbanville Hills and zero integration required. You can try our free 10-second Venue Quote Snippet & Website Helper at https://pullthru.co.za/for-venues whenever your reservations team responds to a group quote.

Warm regards,
Nikhar Bechan
Founder, PullThru SA
https://pullthru.co.za/for-venues | support@pullthru.co.za"""
    },
    {
        "venue": "Copperlake Breweries & Taproom",
        "contact_name": "Bookings & Events Team",
        "email": "sales@copperlakebreweries.co.za",
        "alt_email": "",
        "location": "Lanseria, Gauteng",
        "vertical": "Craft Brewery Tours, Brewpub Socials & Birthday Parties",
        "pain_point_hook": "Birthday & stag party organisers collecting per-person craft beer & food deposits on WhatsApp",
        "to": ["sales@copperlakebreweries.co.za"],
        "subject": "Group brewery tours and celebration table deposits at Copperlake",
        "body": """Good day Copperlake Team,

When someone plans a birthday celebration, stag outing, or craft brewery tasting for 10 to 25 people at Copperlake Lanseria, the organiser often hesitates to front the entire deposit on their personal card while waiting for mates on WhatsApp to EFT them back.

We built PullThru (https://pullthru.co.za/for-venues) in South Africa to solve that exact pain point. The organiser shares one 15-second link in their WhatsApp group, friends pay their exact share via PayShap, Capitec PayMe, Apple Pay, or card with R0 guest fees, and the organiser pays your single deposit on time.

It is 100% free for Copperlake. You can check out our free 10-second Venue Quote Snippet at https://pullthru.co.za/for-venues whenever your team sends out group package details.

Warm regards,
Nikhar Bechan
Founder, PullThru SA
https://pullthru.co.za/for-venues | support@pullthru.co.za"""
    },
    {
        "venue": "Greensleeves Medieval Kingdom",
        "contact_name": "Banquets & Reservations Team",
        "email": "info@greensleeves.co.za",
        "alt_email": "",
        "location": "Sterkfontein / Muldersdrift, Gauteng",
        "vertical": "Medieval Feasts, Costume Banquets & Group Celebrations",
        "pain_point_hook": "Organisers required to pay full upfront EFT invoices for large banquet table reservations",
        "to": ["info@greensleeves.co.za"],
        "subject": "Banquet table booking deposits at Greensleeves Medieval Kingdom",
        "body": """Good day Greensleeves Team,

Because a medieval feast banquet booking requires full upfront EFT payment to secure a table for 8 to 20 guests, organisers often struggle to collect several thousand Rands from their friends on WhatsApp before your payment window closes.

We built PullThru (https://pullthru.co.za/for-venues) here in South Africa to help banquet organisers collect every guest's share in one afternoon via PayShap, Capitec PayMe, Apple Pay, or card with R0 guest fees, so they can pay your FNB bank invoice on time without fronting out of pocket.

There is zero cost to Greensleeves and zero integration needed. You can test our free 10-second Venue Quote Snippet at https://pullthru.co.za/for-venues whenever your bookings desk sends out feast quotes.

Warm regards,
Nikhar Bechan
Founder, PullThru SA
https://pullthru.co.za/for-venues | support@pullthru.co.za"""
    },
    {
        "venue": "Stonehaven on Vaal",
        "contact_name": "Hospitality & Bookings Desk",
        "email": "info@stonehaven.co.za",
        "alt_email": "",
        "location": "Vanderbijlpark, Gauteng",
        "vertical": "Vaal River Boat Cruises, Spitbraais & Family Outings",
        "pain_point_hook": "Group boat cruise and riverside spitbraai organisers collecting per-person Rand splits on WhatsApp",
        "to": ["info@stonehaven.co.za"],
        "subject": "River cruise and spitbraai group deposits at Stonehaven on Vaal",
        "body": """Good day Stonehaven Team,

When an organiser coordinates a river cruiser booking, boma braai, or birthday celebration for 10 to 30 guests at Stonehaven on Vaal, the organiser often delays confirming because they do not want to front the full per-person booking fee while chasing friends on WhatsApp for EFT slips.

We built PullThru (https://pullthru.co.za/for-venues) here in South Africa to solve this. The host shares a 15-second link in their WhatsApp group, each guest chips in via PayShap, Capitec PayMe, Apple Pay, or card with R0 guest fees, and the organiser pays your single venue deposit seamlessly.

There is R0 fee for Stonehaven and zero change to your booking desk. Feel free to try our free 10-second Venue Quote Snippet at https://pullthru.co.za/for-venues whenever your reservations team fields a group enquiry.

Warm regards,
Nikhar Bechan
Founder, PullThru SA
https://pullthru.co.za/for-venues | support@pullthru.co.za"""
    },
    {
        "venue": "The Big Red Barn Irene",
        "contact_name": "Functions & Bookings Team",
        "email": "functions@thebigredbarn.co.za",
        "alt_email": "",
        "location": "Irene, Centurion, Gauteng",
        "vertical": "Forest Parties, Acrobranch / MTB Trails & Barn Functions",
        "pain_point_hook": "Group party and outdoor team organisers collecting per-head activity and food fees on WhatsApp",
        "to": ["functions@thebigredbarn.co.za"],
        "subject": "Group party and event table deposits at The Big Red Barn",
        "body": """Good day Big Red Barn Team,

When someone plans a birthday party, Acrobranch outing, or corporate social for 10 to 25 guests at The Big Red Barn, the organiser often delays confirming the venue space because they are waiting for everyone in their WhatsApp group to pay their share of the package.

We built PullThru (https://pullthru.co.za/for-venues) in South Africa to eliminate that delay. The host shares a 15-second link in their WhatsApp group, every guest pays their share via PayShap, Capitec PayMe, Apple Pay, or card with zero guest fees, and the organiser pays your single deposit on time.

There is zero cost to The Big Red Barn. You can check out our free 10-second Venue Quote Snippet at https://pullthru.co.za/for-venues whenever your team sends out party or function pricing.

Warm regards,
Nikhar Bechan
Founder, PullThru SA
https://pullthru.co.za/for-venues | support@pullthru.co.za"""
    },
    {
        "venue": "Harties Aerial Cableway",
        "contact_name": "Reservations & Events Desk",
        "email": "reservations@hartiescableway.co.za",
        "alt_email": "",
        "location": "Hartbeespoort, North West / Gauteng Border",
        "vertical": "Cableway Rides, Mountain Top Picnics & Look-Out Lunches",
        "pain_point_hook": "Family and tour group organisers collecting per-person cable car tickets & lunch deposits on WhatsApp",
        "to": ["reservations@hartiescableway.co.za"],
        "subject": "Group cableway tickets and mountain-top booking splits at Harties Cableway",
        "body": """Good day Harties Cableway Team,

When a family, social club, or corporate group plans an outing of 8 to 20 guests for a mountain-top lunch or cable car ride, the organiser often struggles to collect everyone's ticket money on WhatsApp before booking.

We built PullThru (https://pullthru.co.za/for-venues) in South Africa so the organiser can drop one 15-second link into their WhatsApp chat, collect everyone's ticket and lunch share via PayShap, Capitec PayMe, Apple Pay, or card with R0 guest fees, and settle the single group booking invoice without delay.

It is 100% free for your venue. You can test our free 10-second Venue Quote Snippet & Website Helper at https://pullthru.co.za/for-venues whenever your team sends out group quotes.

Warm regards,
Nikhar Bechan
Founder, PullThru SA
https://pullthru.co.za/for-venues | support@pullthru.co.za"""
    }
]


def send_batch():
    print("=== PULLTHRU OUTREACH CAMPAIGN BATCH 14 ===")
    blocked_emails, blocked_domains, _ = outreach_guard.sync_and_load_guard_set()
    print(f"Outreach Guard Synced: {len(blocked_emails)} blocked emails, {len(blocked_domains)} blocked domains.")

    with open(PW_PATH, "r", encoding="utf-8") as f:
        pw = f.read().strip().replace(" ", "")

    results = []
    
    server = smtplib.SMTP("smtp.gmail.com", 587, timeout=30)
    server.starttls()
    server.login("sales@taxcleanza.com", pw)

    for i, c in enumerate(CANDIDATES, 1):
        target_email = c["email"].strip().lower()
        target_domain = target_email.split("@")[1]

        # Guard check
        if target_email in blocked_emails or target_domain in blocked_domains:
            print(f"[{i}/12] BLOCKED by Outreach Guard: {target_email} ({c['venue']})")
            results.append((c, "Blocked by Guard"))
            continue

        msg = EmailMessage()
        msg["From"] = "Nikhar Bechan <sales@taxcleanza.com>"
        msg["To"] = c["email"]
        msg["Subject"] = c["subject"]
        msg["Reply-To"] = "support@pullthru.co.za"
        msg.set_content(c["body"])

        try:
            server.send_message(msg)
            print(f"[{i}/12] DELIVERED -> {target_email} ({c['venue']})")
            results.append((c, f"Sent ({time.strftime('%Y-%m-%d %H:%M')})"))
            # Human pacing jitter
            time.sleep(random.uniform(3.5, 6.0))
        except Exception as e:
            print(f"[{i}/12] FAILED -> {target_email} ({e})")
            results.append((c, f"Failed ({e})"))

    server.quit()

    # Append to prospects.csv
    with open(CSV_PATH, "r", encoding="utf-8") as f:
        existing = list(csv.DictReader(f))
        next_id = len(existing) + 1

    with open(CSV_PATH, "a", encoding="utf-8", newline="") as f:
        writer = csv.writer(f)
        for c, status in results:
            writer.writerow([
                next_id,
                c["venue"],
                c["contact_name"],
                c["email"],
                c["alt_email"],
                c["location"],
                c["vertical"],
                c["pain_point_hook"],
                status
            ])
            next_id += 1

    # Re-sync guard ledger
    outreach_guard.sync_and_load_guard_set()
    print("Batch 14 complete! prospects.csv and guard ledger updated.")


if __name__ == "__main__":
    send_batch()
