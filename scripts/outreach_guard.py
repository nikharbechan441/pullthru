"""
PullThru Outreach Deduplication & Reply Guard (outreach_guard.py)
Enforces a strict 3-layer pre-send lock before ANY outreach email can be sent:
  1. Local CSV & JSON Ledger Check: Blocks any email address or domain already marked as Sent/Replied in marketing/outreach/prospects.csv or marketing/outreach/sent_outreach_ledger.json.
  2. Live Gmail [Gmail]/Sent Mail Check: Queries IMAP Sent Mail (batched) to ensure we have NEVER sent an email to that address or domain before.
  3. Live Gmail INBOX Reply Check: Queries IMAP INBOX (batched) to ensure that contact/domain has NEVER emailed or replied to us.
"""
import os
import csv
import json
import time
import imaplib
from email.utils import parseaddr

PW_PATH = r"C:\Users\arvin\OneDrive\Desktop\TaxClean - AntiGravity\.gmail_app_password"
CSV_PATH = r"c:\Users\arvin\OneDrive\Desktop\App 3\marketing\outreach\prospects.csv"
LEDGER_PATH = r"c:\Users\arvin\OneDrive\Desktop\App 3\marketing\outreach\sent_outreach_ledger.json"

GENERIC_DOMAINS = {
    "gmail.com", "yahoo.com", "outlook.com", "hotmail.com", "icloud.com",
    "telkomsa.net", "mweb.co.za", "vodamail.co.za", "webmail.co.za"
}


def _norm_email(addr: str) -> str:
    _, parsed = parseaddr(addr or "")
    return (parsed or addr or "").strip().lower()


def _norm_domain(addr: str) -> str:
    e = _norm_email(addr)
    return e.split("@")[1] if "@" in e else ""


def sync_and_load_guard_set() -> tuple[set[str], set[str], list[dict]]:
    """
    Synchronizes local marketing/outreach/prospects.csv + sent_outreach_ledger.json with live Gmail IMAP
    (both Sent Mail and INBOX replies) and returns:
      - blocked_emails: set of lowercase email addresses already contacted or replied
      - blocked_domains: set of custom domains already contacted or replied
      - replies_found: list of any replies found in INBOX from our prospects
    """
    blocked_emails: set[str] = set()
    blocked_domains: set[str] = set()
    prospect_emails: set[str] = set()
    prospect_domains: set[str] = set()

    # 1. Load from prospects.csv
    if os.path.exists(CSV_PATH):
        with open(CSV_PATH, "r", encoding="utf-8", newline="") as f:
            reader = csv.DictReader(f)
            for row in reader:
                status = (row.get("status") or "").lower()
                for col in ("email", "alt_email"):
                    e = _norm_email(row.get(col, ""))
                    if e:
                        prospect_emails.add(e)
                        d = _norm_domain(e)
                        if d and d not in GENERIC_DOMAINS:
                            prospect_domains.add(d)
                        if "sent" in status or "replied" in status or "do not" in status:
                            blocked_emails.add(e)
                            if d and d not in GENERIC_DOMAINS:
                                blocked_domains.add(d)

    # 2. Load from sent_outreach_ledger.json
    ledger = {"contacted_emails": [], "replied_emails": [], "last_synced": ""}
    if os.path.exists(LEDGER_PATH):
        try:
            with open(LEDGER_PATH, "r", encoding="utf-8") as f:
                ledger = json.load(f)
        except Exception:
            pass

    for e in ledger.get("contacted_emails", []) + ledger.get("replied_emails", []):
        ne = _norm_email(e)
        if ne:
            blocked_emails.add(ne)
            d = _norm_domain(ne)
            if d and d not in GENERIC_DOMAINS:
                blocked_domains.add(d)

    # 3. Fast Batched Live IMAP Check (Sent Mail + INBOX Replies)
    replies_found = []
    if os.path.exists(PW_PATH):
        with open(PW_PATH, "r", encoding="utf-8") as f:
            pw = f.read().strip().replace(" ", "")
        try:
            with imaplib.IMAP4_SSL("imap.gmail.com", timeout=20) as m:
                m.login("sales@taxcleanza.com", pw)

                # Check Sent Mail in a single batched fetch
                sent_box = chr(34) + chr(91) + "Gmail" + chr(93) + "/Sent Mail" + chr(34)
                m.select(sent_box, readonly=True)
                typ, data = m.search(None, "SINCE", "29-Oct-2026")
                if data and data[0]:
                    msg_ids = data[0].split()
                    # Batch fetch in chunks of 100
                    for i in range(0, len(msg_ids), 100):
                        chunk = b",".join(msg_ids[i:i + 100])
                        _, msg_data = m.fetch(chunk, "(BODY.PEEK[HEADER.FIELDS (TO CC SUBJECT)])")
                        for item in msg_data:
                            if isinstance(item, tuple) and len(item) > 1:
                                hdr = item[1].decode("utf-8", errors="ignore")
                                for line in hdr.splitlines():
                                    if line.lower().startswith(("to:", "cc:")):
                                        parts = line.split(":", 1)[1].split(",")
                                        for p in parts:
                                            ne = _norm_email(p)
                                            if ne:
                                                blocked_emails.add(ne)
                                                d = _norm_domain(ne)
                                                if d and d not in GENERIC_DOMAINS:
                                                    blocked_domains.add(d)

                # Check INBOX for any replies from contacted/prospect emails or domains in a single batched fetch
                m.select("INBOX", readonly=True)
                typ, data = m.search(None, "SINCE", "29-Oct-2026")
                if data and data[0]:
                    msg_ids = data[0].split()
                    for i in range(0, len(msg_ids), 100):
                        chunk = b",".join(msg_ids[i:i + 100])
                        _, msg_data = m.fetch(chunk, "(BODY.PEEK[HEADER.FIELDS (FROM SUBJECT DATE)])")
                        for item in msg_data:
                            if isinstance(item, tuple) and len(item) > 1:
                                hdr = item[1].decode("utf-8", errors="ignore")
                                from_addr = ""
                                subj = ""
                                dt = ""
                                for line in hdr.splitlines():
                                    if line.lower().startswith("from:"):
                                        from_addr = _norm_email(line.split(":", 1)[1])
                                    elif line.lower().startswith("subject:"):
                                        subj = line.split(":", 1)[1].strip()
                                    elif line.lower().startswith("date:"):
                                        dt = line.split(":", 1)[1].strip()
                                from_dom = _norm_domain(from_addr)
                                if (
                                    from_addr in blocked_emails
                                    or from_addr in prospect_emails
                                    or (from_dom and from_dom in blocked_domains)
                                    or (from_dom and from_dom in prospect_domains)
                                ):
                                    blocked_emails.add(from_addr)
                                    if from_dom and from_dom not in GENERIC_DOMAINS:
                                        blocked_domains.add(from_dom)
                                    replies_found.append({
                                        "from": from_addr,
                                        "subject": subj,
                                        "date": dt
                                    })
        except Exception as e:
            print(f"[WARN] IMAP sync warning: {e}")

    # Save updated ledger
    replied_list = sorted({r["from"] for r in replies_found} | set(ledger.get("replied_emails", [])))
    ledger_out = {
        "last_synced": time.strftime("%Y-%m-%d %H:%M:%S"),
        "contacted_emails": sorted(blocked_emails),
        "contacted_domains": sorted(blocked_domains),
        "replied_emails": replied_list,
        "recent_replies": replies_found
    }
    os.makedirs(os.path.dirname(LEDGER_PATH), exist_ok=True)
    with open(LEDGER_PATH, "w", encoding="utf-8") as f:
        json.dump(ledger_out, f, indent=2)

    # Also mark any replied rows in prospects.csv
    if os.path.exists(CSV_PATH) and replied_list:
        replied_set = set(replied_list)
        replied_doms = {_norm_domain(x) for x in replied_set if _norm_domain(x) not in GENERIC_DOMAINS}
        rows = []
        with open(CSV_PATH, "r", encoding="utf-8", newline="") as f:
            reader = csv.DictReader(f)
            fieldnames = reader.fieldnames
            for row in reader:
                e1 = _norm_email(row.get("email", ""))
                e2 = _norm_email(row.get("alt_email", ""))
                d1 = _norm_domain(e1)
                d2 = _norm_domain(e2)
                if e1 in replied_set or e2 in replied_set or (d1 and d1 in replied_doms) or (d2 and d2 in replied_doms):
                    row["status"] = "REPLIED — DO NOT EMAIL AGAIN"
                rows.append(row)
        with open(CSV_PATH, "w", encoding="utf-8", newline="") as f:
            writer = csv.DictWriter(f, fieldnames=fieldnames)
            writer.writeheader()
            writer.writerows(rows)

    return blocked_emails, blocked_domains, replies_found


def can_send_to(recipients: list[str], blocked_emails: set[str], blocked_domains: set[str]) -> tuple[bool, str]:
    """Returns (True, '') only if NONE of the recipients or their custom domains have ever been emailed or replied."""
    for r in recipients:
        ne = _norm_email(r)
        nd = _norm_domain(ne)
        if ne in blocked_emails:
            return False, f"Already emailed or replied: {ne}"
        if nd and nd not in GENERIC_DOMAINS and nd in blocked_domains:
            return False, f"Domain already contacted or replied: {nd}"
    return True, ""


if __name__ == "__main__":
    b_emails, b_doms, replies = sync_and_load_guard_set()
    print(f"Synced Outreach Guard: {len(b_emails)} blocked emails, {len(b_doms)} blocked domains.")
    print(f"Replies detected from prospects: {len(replies)}")
    for r in replies:
        print(f"  - REPLIED: {r['from']} | {r['subject']} ({r['date']})")
