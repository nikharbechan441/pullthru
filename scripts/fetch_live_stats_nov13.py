import json
import requests
import os
import sys
import imaplib
import email

sys.stdout.reconfigure(encoding='utf-8')

# 1. Cloudflare Workers Analytics
vault_path = os.path.expandvars(r'%LOCALAPPDATA%\TaxCleanZA_Data\credentials_vault.json')
with open(vault_path, encoding='utf-8') as f:
    vault = json.load(f)

cf_token = vault.get('cloudflare_api_token')
cf_acc = vault.get('cloudflare_account_id')

query = """
query GetWorkerStats($accountTag: String!, $datetimeStart: String!, $datetimeEnd: String!) {
  viewer {
    accounts(filter: {accountTag: $accountTag}) {
      workersInvocationsAdaptive(
        limit: 10000
        filter: {
          scriptName: "pullthru-sa"
          datetime_geq: $datetimeStart
          datetime_leq: $datetimeEnd
        }
      ) {
        dimensions {
          datetimeHour
          status
        }
        sum {
          requests
          subrequests
          errors
        }
      }
    }
  }
}
"""

variables = {
    'accountTag': cf_acc,
    'datetimeStart': '2026-10-30T00:00:00Z',
    'datetimeEnd': '2026-11-13T11:00:00Z'
}

resp = requests.post(
    'https://api.cloudflare.com/client/v4/graphql',
    headers={'Authorization': f'Bearer {cf_token}', 'Content-Type': 'application/json'},
    json={'query': query, 'variables': variables},
    timeout=15
)

data = resp.json()
if data.get('errors'):
    print("CF GraphQL Errors:", data.get('errors'))

invocations = data.get('data', {}).get('viewer', {}).get('accounts', [{}])[0].get('workersInvocationsAdaptive', [])

total_req = sum(item['sum']['requests'] for item in invocations)
total_subreq = sum(item['sum']['subrequests'] for item in invocations)
total_err = sum(item['sum']['errors'] for item in invocations)

print("=== CLOUDFLARE WORKERS (pullthru-sa) CUMULATIVE (30 Oct - 13 Nov) ===")
print(f"Total Cloudflare Requests: {total_req:,}")
print(f"Total Dynamic API/DB Subrequests: {total_subreq:,}")
print(f"Total Errors: {total_err:,}")

by_day = {}
for item in invocations:
    hour = item['dimensions']['datetimeHour']
    day = hour[:10]
    by_day.setdefault(day, {'req': 0, 'subreq': 0, 'err': 0})
    by_day[day]['req'] += item['sum']['requests']
    by_day[day]['subreq'] += item['sum']['subrequests']
    by_day[day]['err'] += item['sum']['errors']

print("\nDaily Breakdown:")
for day, stats in sorted(by_day.items()):
    print(f"  {day}: {stats['req']:,} requests | {stats['subreq']:,} subreqs | {stats['err']} err")

# 2. Supabase Production Check
sb_url = vault.get('supabase_url')
sb_key = vault.get('supabase_service_role_key')

if not sb_url and os.path.exists('.env.local'):
    with open('.env.local', encoding='utf-8') as ef:
        for line in ef:
            if line.startswith('NEXT_PUBLIC_SUPABASE_URL='):
                sb_url = line.split('=', 1)[1].strip()
            elif line.startswith('SUPABASE_SERVICE_ROLE_KEY='):
                sb_key = line.split('=', 1)[1].strip()

if sb_url and sb_key:
    headers = {'apikey': sb_key, 'Authorization': f'Bearer {sb_key}'}
    r_ev = requests.get(f"{sb_url}/rest/v1/events?select=id,title,slug,created_at,host_name,mode,max_spots&order=created_at.desc", headers=headers, timeout=15)
    r_rsvps = requests.get(f"{sb_url}/rest/v1/guest_rsvps?select=id,event_id,guest_name,amount_contributed_zar,status,created_at&order=created_at.desc", headers=headers, timeout=15)
    r_orders = requests.get(f"{sb_url}/rest/v1/orders?select=id,event_id,buyer_name,total_zar,status,created_at&order=created_at.desc", headers=headers, timeout=15)

    events_data = r_ev.json() if r_ev.status_code == 200 else []
    rsvps_data = r_rsvps.json() if r_rsvps.status_code == 200 else []
    orders_data = r_orders.json() if r_orders.status_code == 200 else []

    print("\n=== SUPABASE PRODUCTION DATABASE ===")
    print(f"Total Events: {len(events_data)} (status {r_ev.status_code})")
    print(f"Total RSVPs: {len(rsvps_data)} (status {r_rsvps.status_code})")
    print(f"Total Orders: {len(orders_data)} (status {r_orders.status_code})")
    if r_orders.status_code != 200:
        r_orders_all = requests.get(f"{sb_url}/rest/v1/orders?select=*&order=created_at.desc", headers=headers, timeout=15)
        orders_data = r_orders_all.json() if r_orders_all.status_code == 200 else []
        print(f"Total Orders (fallback): {len(orders_data)}")

    print("\nRecent 10 Events:")
    for ev in events_data[:10]:
        created = (ev.get('created_at') or '')[:16]
        print(f"  - [{created}] {ev.get('title')} (mode: {ev.get('mode')}, max: {ev.get('max_spots')}, slug: {ev.get('slug')}) by {ev.get('host_name')}")

    print("\nRecent 10 RSVPs:")
    for r in rsvps_data[:10]:
        created = (r.get('created_at') or '')[:16]
        print(f"  - [{created}] {r.get('guest_name')} | R{r.get('amount_contributed_zar')} | {r.get('status')} | event: {r.get('event_id')}")

# 3. Gmail Inbox Check since 10 Nov 2026
try:
    pw = vault.get('gmail_app_password_sales')
    mail = imaplib.IMAP4_SSL('imap.gmail.com')
    mail.login('sales@taxcleanza.com', pw)
    mail.select('inbox')
    status, messages = mail.search(None, 'SINCE', '10-Nov-2026')
    msg_ids = messages[0].split()
    print(f"\n=== GMAIL INBOX (SINCE 10 NOV 2026): {len(msg_ids)} messages ===")
    for mid in msg_ids[-15:]:
        res, msg_data = mail.fetch(mid, '(RFC822.HEADER)')
        for part in msg_data:
            if isinstance(part, tuple):
                msg = email.message_from_bytes(part[1])
                sender = msg.get('From', '')
                subj = msg.get('Subject', '')
                date = msg.get('Date', '')
                print(f"  [{date[:22]}] From: {sender} | Subj: {subj[:60]}")
    mail.logout()
except Exception as e:
    print("\nGmail check error:", e)
