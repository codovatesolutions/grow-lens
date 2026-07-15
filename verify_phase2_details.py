#!/usr/bin/env python3
"""
Detailed verification of Phase 2 response structure
"""
import httpx
import json

BASE_URL = "https://grow-view.preview.emergentagent.com/api"
TEST_EMAIL = "codovate.test+20260715143316@example.com"
TEST_PASSWORD = "TestPass123!"

# Login
with httpx.Client(timeout=30.0) as client:
    resp = client.post(
        f"{BASE_URL}/auth/login",
        json={"email": TEST_EMAIL, "password": TEST_PASSWORD}
    )
    token = resp.json()["token"]

headers = {"Authorization": f"Bearer {token}"}

# Get scans
with httpx.Client(timeout=30.0) as client:
    resp = client.get(f"{BASE_URL}/scans", headers=headers)
    scans = resp.json()
    business_scan = [s for s in scans if s.get("mode") == "business" and s.get("status") == "complete"][0]
    scan_id = business_scan["id"]

print(f"Using scan ID: {scan_id}")

# Get growth team data
with httpx.Client(timeout=30.0) as client:
    resp = client.get(f"{BASE_URL}/scans/{scan_id}/growth-team", headers=headers)
    data = resp.json()

print("\n" + "="*80)
print("GROWTH TEAM STRUCTURE VERIFICATION")
print("="*80)

# Verify growth_team
gt = data.get("growth_team", {})
print(f"\n✓ growth_team present: {bool(gt)}")
print(f"✓ agent_count: {gt.get('agent_count')}")
print(f"✓ generated_at: {gt.get('generated_at')}")
print(f"✓ experts count: {len(gt.get('experts', []))}")

# List all agent keys
if "experts" in gt:
    agent_keys = [e.get("agent_key") for e in gt["experts"]]
    print(f"\n✓ Agent keys present:")
    for key in sorted(agent_keys):
        print(f"  - {key}")

# Verify executive summary
if "executive_summary" in gt:
    es = gt["executive_summary"]
    print(f"\n✓ Executive Summary:")
    print(f"  - verdict: {es.get('verdict', '')[:80]}...")
    print(f"  - biggest_opportunity: {es.get('biggest_opportunity', '')[:80]}...")
    print(f"  - biggest_risk: {es.get('biggest_risk', '')[:80]}...")
    print(f"  - top_3_moves count: {len(es.get('top_3_moves', []))}")
    print(f"  - consensus_score: {es.get('consensus_score')}")
    print(f"  - board_confidence: {es.get('board_confidence')}")
    print(f"  - estimated_total_monthly_lift_pct: {es.get('estimated_total_monthly_lift_pct')}")
    
    if "top_3_moves" in es:
        print(f"\n✓ Top 3 Moves:")
        for i, move in enumerate(es["top_3_moves"], 1):
            print(f"  {i}. {move.get('title')} (owner: {move.get('owner')}, lift: {move.get('expected_revenue_lift_pct')}%)")

# Verify revenue leak
if "revenue_leak" in data:
    rl = data["revenue_leak"]
    print(f"\n✓ Revenue Leak:")
    print(f"  - assumed_monthly_visitors: {rl.get('assumed_monthly_visitors')}")
    print(f"  - assumed_current_conversion_pct: {rl.get('assumed_current_conversion_pct')}")
    print(f"  - assumed_avg_order_value_usd: {rl.get('assumed_avg_order_value_usd')}")
    print(f"  - current_monthly_revenue_usd: {rl.get('current_monthly_revenue_usd')}")
    print(f"  - monthly_revenue_lost_usd: {rl.get('monthly_revenue_lost_usd')}")
    print(f"  - lead_loss_pct: {rl.get('lead_loss_pct')}")
    print(f"  - bounce_increase_pct: {rl.get('bounce_increase_pct')}")
    print(f"  - trust_loss_pct: {rl.get('trust_loss_pct')}")
    print(f"  - confidence_score: {rl.get('confidence_score')}")
    print(f"  - potential_revenue_after_fix_usd: {rl.get('potential_revenue_after_fix_usd')}")
    print(f"  - monthly_lift_usd: {rl.get('monthly_lift_usd')}")
    print(f"  - breakdown count: {len(rl.get('breakdown', []))}")
    print(f"  - methodology: {rl.get('methodology', '')[:100]}...")
    
    if "breakdown" in rl:
        print(f"\n✓ Revenue Leak Breakdown:")
        for i, item in enumerate(rl["breakdown"], 1):
            print(f"  {i}. {item.get('issue')} - ${item.get('monthly_loss_usd')}/mo")

print("\n" + "="*80)
print("VERIFICATION COMPLETE")
print("="*80)
