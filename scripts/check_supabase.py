import os
import requests
import sys

sys.stdout.reconfigure(encoding='utf-8')

with open('.env.local') as f:
    for line in f:
        if line.startswith('NEXT_PUBLIC_SUPABASE_URL='):
            sb_url = line.strip().split('=', 1)[1]
        elif line.startswith('SUPABASE_SERVICE_ROLE_KEY='):
            sb_key = line.strip().split('=', 1)[1]

headers = {'apikey': sb_key, 'Authorization': f'Bearer {sb_key}'}
r_ev = requests.get(f'{sb_url}/rest/v1/events?select=id,title,slug,created_at,host_name&order=created_at.desc', headers=headers)
r_rsvps = requests.get(f'{sb_url}/rest/v1/guest_rsvps?select=id,event_id,name,created_at&order=created_at.desc', headers=headers)
r_orders = requests.get(f'{sb_url}/rest/v1/orders?select=id,event_id,customer_name,total_cents,status,created_at&order=created_at.desc', headers=headers)

events = r_ev.json()
rsvps = r_rsvps.json()
orders = r_orders.json()

print(f"Total Events: {len(events)}")
for ev in events:
    created = ev.get('created_at', '')[:16]
    title = ev.get('title', '')
    slug = ev.get('slug', '')
    host = ev.get('host_name', '')
    print(f"  - [{created}] {title} (slug: {slug}) - Host: {host}")

print(f"\nTotal RSVPs: {len(rsvps)}")
for r in rsvps[:10]:
    print(f"  - [{r.get('created_at', '')[:16]}] {r.get('name', '')} (Event ID: {r.get('event_id', '')})")

print(f"\nTotal Orders: {len(orders)}")
for o in orders:
    total = (o.get('total_cents') or 0) / 100
    print(f"  - [{o.get('created_at', '')[:16]}] {o.get('customer_name', '')} - R{total:.2f} [{o.get('status', '')}]")
