import json
import requests
import os
import sys

sys.stdout.reconfigure(encoding='utf-8')

# 1. Cloudflare Workers
vault_path = os.path.expandvars(r'%LOCALAPPDATA%\TaxCleanZA_Data\credentials_vault.json')
with open(vault_path) as f:
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
    'datetimeEnd': '2026-11-09T08:30:00Z'
}

resp = requests.post(
    'https://api.cloudflare.com/client/v4/graphql',
    headers={'Authorization': f'Bearer {cf_token}', 'Content-Type': 'application/json'},
    json={'query': query, 'variables': variables}
)

data = resp.json()
invocations = data.get('data', {}).get('viewer', {}).get('accounts', [{}])[0].get('workersInvocationsAdaptive', [])

total_req = sum(item['sum']['requests'] for item in invocations)
total_subreq = sum(item['sum']['subrequests'] for item in invocations)
total_err = sum(item['sum']['errors'] for item in invocations)

print(f"=== CLOUDFLARE WORKERS (pullthru-sa) CUMULATIVE (30 Oct - 9 Nov) ===")
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

# 2. Supabase production check
sb_url = vault.get('supabase_url') or os.getenv('NEXT_PUBLIC_SUPABASE_URL')
sb_key = vault.get('supabase_service_role_key') or os.getenv('SUPABASE_SERVICE_ROLE_KEY')

if not sb_url and os.path.exists('.env.local'):
    with open('.env.local') as ef:
        for line in ef:
            if line.startswith('NEXT_PUBLIC_SUPABASE_URL='):
                sb_url = line.split('=', 1)[1].strip()
            elif line.startswith('SUPABASE_SERVICE_ROLE_KEY='):
                sb_key = line.split('=', 1)[1].strip()

if sb_url and sb_key:
    headers = {'apikey': sb_key, 'Authorization': f'Bearer {sb_key}'}
    r_ev = requests.get(f"{sb_url}/rest/v1/events?select=id,title,slug,created_at,host_name,host_email&order=created_at.desc", headers=headers)
    r_rsvps = requests.get(f"{sb_url}/rest/v1/guest_rsvps?select=id,event_id,name,created_at&order=created_at.desc", headers=headers)
    r_orders = requests.get(f"{sb_url}/rest/v1/orders?select=id,event_id,customer_name,total_cents,status,created_at&order=created_at.desc", headers=headers)

    events_data = r_ev.json() if r_ev.status_code == 200 else []
    rsvps_data = r_rsvps.json() if r_rsvps.status_code == 200 else []
    orders_data = r_orders.json() if r_orders.status_code == 200 else []

    print(f"\n=== SUPABASE PRODUCTION DATABASE ===")
    print(f"Total Events: {len(events_data)}")
    print(f"Total RSVPs: {len(rsvps_data)}")
    print(f"Total Orders: {len(orders_data)}")
    print("\nRecent 5 Events:")
    for ev in events_data[:5]:
        print(f"  - [{ev.get('created_at')[:10]}] {ev.get('title')} (slug: {ev.get('slug')}) - Host: {ev.get('host_name')}")
