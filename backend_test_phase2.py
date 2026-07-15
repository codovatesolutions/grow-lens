#!/usr/bin/env python3
"""
GrowthLens AI - Phase 2 Backend API Tests
Tests AI Growth Team (13 experts + CEO) + Revenue Leak Engine endpoints
"""
import httpx
import json
import time
from datetime import datetime

# Configuration
BASE_URL = "https://grow-view.preview.emergentagent.com/api"
TEST_EMAIL = "codovate.test+20260715143316@example.com"
TEST_PASSWORD = "TestPass123!"

# Expected agent keys for the 13 experts
EXPECTED_AGENT_KEYS = {
    "ux_expert", "seo_expert", "brand_expert", "copywriter",
    "sales_expert", "marketing_expert", "customer_psychologist",
    "pricing_expert", "accessibility_expert", "analytics_expert",
    "performance_engineer", "growth_hacker", "competitor_analyst"
}

# Test results tracking
results = {
    "passed": [],
    "failed": [],
    "warnings": []
}

def log_test(test_name, status, details=""):
    """Log test result"""
    timestamp = datetime.now().strftime("%H:%M:%S")
    symbol = "✅" if status == "pass" else "❌" if status == "fail" else "⚠️"
    print(f"\n{symbol} [{timestamp}] {test_name}")
    if details:
        print(f"   {details}")
    
    if status == "pass":
        results["passed"].append(test_name)
    elif status == "fail":
        results["failed"].append({"test": test_name, "details": details})
    else:
        results["warnings"].append({"test": test_name, "details": details})

def print_summary():
    """Print final test summary"""
    print("\n" + "="*80)
    print("PHASE 2 TEST SUMMARY")
    print("="*80)
    print(f"✅ PASSED: {len(results['passed'])}")
    print(f"❌ FAILED: {len(results['failed'])}")
    print(f"⚠️  WARNINGS: {len(results['warnings'])}")
    
    if results['failed']:
        print("\n❌ FAILED TESTS:")
        for fail in results['failed']:
            print(f"   - {fail['test']}")
            print(f"     {fail['details']}")
    
    if results['warnings']:
        print("\n⚠️  WARNINGS:")
        for warn in results['warnings']:
            print(f"   - {warn['test']}")
            print(f"     {warn['details']}")
    
    print("\n" + "="*80)

def verify_expert(expert, expert_num):
    """Verify a single expert has all required fields"""
    issues = []
    required_fields = [
        "agent_key", "agent_name", "specialty", "opinion",
        "confidence", "impact", "priority", "recommendation",
        "estimated_revenue_gain_pct"
    ]
    
    for field in required_fields:
        if field not in expert:
            issues.append(f"Expert {expert_num} missing '{field}'")
    
    # Verify agent_key is in expected set
    if "agent_key" in expert and expert["agent_key"] not in EXPECTED_AGENT_KEYS:
        issues.append(f"Expert {expert_num} has unexpected agent_key: {expert['agent_key']}")
    
    # Check for fallback "agent unavailable" messages
    if "opinion" in expert and "agent unavailable" in expert["opinion"].lower():
        issues.append(f"Expert {expert_num} ({expert.get('agent_key')}) returned fallback message")
    
    return issues

def verify_executive_summary(summary):
    """Verify CEO executive summary structure"""
    issues = []
    required_fields = [
        "verdict", "biggest_opportunity", "biggest_risk",
        "top_3_moves", "consensus_score", "board_confidence",
        "estimated_total_monthly_lift_pct"
    ]
    
    for field in required_fields:
        if field not in summary:
            issues.append(f"executive_summary missing '{field}'")
    
    # Verify top_3_moves structure
    if "top_3_moves" in summary:
        moves = summary["top_3_moves"]
        if not isinstance(moves, list):
            issues.append(f"top_3_moves should be list, got {type(moves)}")
        elif len(moves) != 3:
            issues.append(f"top_3_moves should have exactly 3 items, got {len(moves)}")
        else:
            for i, move in enumerate(moves):
                required_move_fields = ["title", "why", "owner", "expected_revenue_lift_pct"]
                for field in required_move_fields:
                    if field not in move:
                        issues.append(f"top_3_moves[{i}] missing '{field}'")
    
    # Verify verdict is not empty
    if "verdict" in summary:
        verdict = summary["verdict"]
        if not verdict or not isinstance(verdict, str) or len(verdict.strip()) < 10:
            issues.append(f"verdict is empty or too short: '{verdict}'")
    
    return issues

def verify_revenue_leak(leak):
    """Verify Revenue Leak Engine structure"""
    issues = []
    required_fields = [
        "assumed_monthly_visitors", "assumed_current_conversion_pct",
        "assumed_avg_order_value_usd", "current_monthly_revenue_usd",
        "monthly_revenue_lost_usd", "lead_loss_pct", "bounce_increase_pct",
        "trust_loss_pct", "confidence_score", "potential_revenue_after_fix_usd",
        "monthly_lift_usd", "breakdown", "methodology"
    ]
    
    for field in required_fields:
        if field not in leak:
            issues.append(f"revenue_leak missing '{field}'")
    
    # Verify breakdown structure
    if "breakdown" in leak:
        breakdown = leak["breakdown"]
        if not isinstance(breakdown, list):
            issues.append(f"breakdown should be list, got {type(breakdown)}")
        elif len(breakdown) < 3 or len(breakdown) > 5:
            issues.append(f"breakdown should have 3-5 items, got {len(breakdown)}")
        else:
            for i, item in enumerate(breakdown):
                required_item_fields = ["issue", "monthly_loss_usd", "why"]
                for field in required_item_fields:
                    if field not in item:
                        issues.append(f"breakdown[{i}] missing '{field}'")
    
    # Verify methodology is populated
    if "methodology" in leak:
        methodology = leak["methodology"]
        if not methodology or not isinstance(methodology, str) or len(methodology.strip()) < 20:
            issues.append(f"methodology is empty or too short: '{methodology}'")
    
    return issues

def main():
    print("="*80)
    print("GrowthLens AI - Phase 2 Backend API Tests")
    print("AI Growth Team (13 experts + CEO) + Revenue Leak Engine")
    print("="*80)
    print(f"Base URL: {BASE_URL}")
    print(f"Test User: {TEST_EMAIL}")
    print("="*80)
    
    token = None
    business_scan_id = None
    creator_scan_id = None
    
    # Test 1: Login
    try:
        print("\n🔐 TEST 1: POST /auth/login")
        start = time.time()
        with httpx.Client(timeout=30.0) as client:
            resp = client.post(
                f"{BASE_URL}/auth/login",
                json={"email": TEST_EMAIL, "password": TEST_PASSWORD}
            )
        elapsed = time.time() - start
        
        if resp.status_code != 200:
            log_test("POST /auth/login", "fail", 
                    f"Status {resp.status_code}, expected 200. Response: {resp.text[:200]}")
            print("\n❌ LOGIN FAILED - STOPPING ALL TESTS")
            print_summary()
            return 1
        
        data = resp.json()
        if "token" not in data:
            log_test("POST /auth/login", "fail", "No 'token' in response")
            print("\n❌ NO TOKEN - STOPPING ALL TESTS")
            print_summary()
            return 1
        
        token = data["token"]
        log_test("POST /auth/login", "pass", 
                f"Token received, elapsed: {elapsed:.2f}s")
        
    except Exception as e:
        log_test("POST /auth/login", "fail", f"Exception: {str(e)}")
        print("\n❌ LOGIN EXCEPTION - STOPPING ALL TESTS")
        print_summary()
        return 1
    
    # Headers for authenticated requests
    headers = {"Authorization": f"Bearer {token}"}
    
    # Test 2: GET /scans - find or create a completed business scan
    try:
        print("\n🔍 TEST 2: GET /scans (find completed business scan)")
        start = time.time()
        with httpx.Client(timeout=30.0) as client:
            resp = client.get(f"{BASE_URL}/scans", headers=headers)
        elapsed = time.time() - start
        
        if resp.status_code != 200:
            log_test("GET /scans", "fail", 
                    f"Status {resp.status_code}, expected 200. Response: {resp.text[:300]}")
        else:
            data = resp.json()
            if not isinstance(data, list):
                log_test("GET /scans", "fail", f"Expected list, got {type(data)}")
            else:
                # Find a completed business scan
                completed_business = [
                    s for s in data 
                    if s.get("mode") == "business" and s.get("status") == "complete"
                ]
                
                if completed_business:
                    business_scan_id = completed_business[0]["id"]
                    log_test("GET /scans", "pass", 
                            f"Found {len(completed_business)} completed business scan(s), using ID: {business_scan_id}, elapsed: {elapsed:.2f}s")
                else:
                    log_test("GET /scans", "pass", 
                            f"No completed business scans found (total: {len(data)}), will create one, elapsed: {elapsed:.2f}s")
    
    except Exception as e:
        log_test("GET /scans", "fail", f"Exception: {str(e)}")
    
    # Test 3: Create business scan if needed
    if not business_scan_id:
        try:
            print("\n🔍 TEST 3: POST /scans (create business scan - expect 20-60s)")
            print("   Target: https://example.com")
            print("   This will call Gemini 3 Flash - please wait...")
            
            start = time.time()
            with httpx.Client(timeout=90.0) as client:
                resp = client.post(
                    f"{BASE_URL}/scans",
                    headers=headers,
                    json={
                        "mode": "business",
                        "target": "https://example.com",
                        "industry": "auto"
                    }
                )
            elapsed = time.time() - start
            
            if resp.status_code != 200:
                log_test("POST /scans (business)", "fail", 
                        f"Status {resp.status_code}, expected 200. Response: {resp.text[:500]}")
            else:
                data = resp.json()
                if data.get("status") != "complete":
                    log_test("POST /scans (business)", "fail", 
                            f"Expected status='complete', got '{data.get('status')}'")
                else:
                    business_scan_id = data.get("id")
                    score = data.get("score", 0)
                    log_test("POST /scans (business)", "pass", 
                            f"Business scan complete, ID: {business_scan_id}, score: {score}, elapsed: {elapsed:.2f}s")
        
        except httpx.TimeoutException:
            log_test("POST /scans (business)", "fail", "Request timed out after 90s")
        except Exception as e:
            log_test("POST /scans (business)", "fail", f"Exception: {str(e)}")
    else:
        print("\n✓ TEST 3: Skipped - using existing business scan")
    
    # Test 4: CORE TEST - POST /scans/{scan_id}/growth-team
    if business_scan_id:
        try:
            print("\n🧠 TEST 4: POST /scans/{scan_id}/growth-team (CORE TEST)")
            print("   ⚠️  EXPECT LONG RESPONSE TIME: 30-120 seconds")
            print("   Running 13 parallel Gemini agents + CEO + Revenue Leak Engine...")
            print("   Please wait...")
            
            start = time.time()
            with httpx.Client(timeout=180.0) as client:
                resp = client.post(
                    f"{BASE_URL}/scans/{business_scan_id}/growth-team",
                    headers=headers
                )
            elapsed = time.time() - start
            
            print(f"\n   ⏱️  Response time: {elapsed:.2f}s")
            
            if resp.status_code != 200:
                log_test("POST /scans/{id}/growth-team", "fail", 
                        f"Status {resp.status_code}, expected 200. Response: {resp.text[:500]}")
            else:
                data = resp.json()
                issues = []
                
                # Verify top-level structure
                if "growth_team" not in data:
                    issues.append("Missing 'growth_team' in response")
                if "revenue_leak" not in data:
                    issues.append("Missing 'revenue_leak' in response")
                
                # Verify growth_team structure
                if "growth_team" in data:
                    gt = data["growth_team"]
                    
                    # Check required fields
                    if "experts" not in gt:
                        issues.append("growth_team missing 'experts'")
                    if "executive_summary" not in gt:
                        issues.append("growth_team missing 'executive_summary'")
                    if "generated_at" not in gt:
                        issues.append("growth_team missing 'generated_at'")
                    if "agent_count" not in gt:
                        issues.append("growth_team missing 'agent_count'")
                    
                    # Verify experts array
                    if "experts" in gt:
                        experts = gt["experts"]
                        if not isinstance(experts, list):
                            issues.append(f"experts should be list, got {type(experts)}")
                        elif len(experts) != 13:
                            issues.append(f"experts should have exactly 13 items, got {len(experts)}")
                        else:
                            # Verify each expert
                            for i, expert in enumerate(experts):
                                expert_issues = verify_expert(expert, i+1)
                                issues.extend(expert_issues)
                            
                            # Verify agent_keys set
                            actual_keys = {e.get("agent_key") for e in experts if "agent_key" in e}
                            if actual_keys != EXPECTED_AGENT_KEYS:
                                missing = EXPECTED_AGENT_KEYS - actual_keys
                                extra = actual_keys - EXPECTED_AGENT_KEYS
                                if missing:
                                    issues.append(f"Missing agent_keys: {missing}")
                                if extra:
                                    issues.append(f"Extra agent_keys: {extra}")
                    
                    # Verify executive_summary
                    if "executive_summary" in gt:
                        summary_issues = verify_executive_summary(gt["executive_summary"])
                        issues.extend(summary_issues)
                    
                    # Verify agent_count
                    if "agent_count" in gt and gt["agent_count"] != 13:
                        issues.append(f"agent_count should be 13, got {gt['agent_count']}")
                
                # Verify revenue_leak structure
                if "revenue_leak" in data:
                    leak_issues = verify_revenue_leak(data["revenue_leak"])
                    issues.extend(leak_issues)
                
                if issues:
                    log_test("POST /scans/{id}/growth-team", "fail", 
                            f"Response time: {elapsed:.2f}s. Issues: {'; '.join(issues[:5])}")
                    if len(issues) > 5:
                        print(f"   ... and {len(issues)-5} more issues")
                else:
                    log_test("POST /scans/{id}/growth-team", "pass", 
                            f"All verifications passed, response time: {elapsed:.2f}s")
                    print(f"   ✓ 13 experts returned with correct structure")
                    print(f"   ✓ Executive summary complete with 3 top moves")
                    print(f"   ✓ Revenue leak analysis complete with {len(data['revenue_leak'].get('breakdown', []))} breakdown items")
        
        except httpx.TimeoutException:
            log_test("POST /scans/{id}/growth-team", "fail", 
                    "Request timed out after 180s (expected 30-120s)")
        except Exception as e:
            log_test("POST /scans/{id}/growth-team", "fail", f"Exception: {str(e)}")
    else:
        log_test("POST /scans/{id}/growth-team", "fail", 
                "Skipped - no business_scan_id available")
    
    # Test 5: GET /scans/{scan_id}/growth-team (cached)
    if business_scan_id:
        try:
            print("\n📊 TEST 5: GET /scans/{scan_id}/growth-team (cached - should be fast)")
            start = time.time()
            with httpx.Client(timeout=30.0) as client:
                resp = client.get(
                    f"{BASE_URL}/scans/{business_scan_id}/growth-team",
                    headers=headers
                )
            elapsed = time.time() - start
            
            if resp.status_code != 200:
                log_test("GET /scans/{id}/growth-team", "fail", 
                        f"Status {resp.status_code}, expected 200. Response: {resp.text[:300]}")
            else:
                data = resp.json()
                issues = []
                
                # Verify same structure as POST
                if "growth_team" not in data:
                    issues.append("Missing 'growth_team' in response")
                if "revenue_leak" not in data:
                    issues.append("Missing 'revenue_leak' in response")
                
                # Quick structure check
                if "growth_team" in data:
                    gt = data["growth_team"]
                    if "experts" in gt and len(gt["experts"]) != 13:
                        issues.append(f"experts should have 13 items, got {len(gt['experts'])}")
                    if "executive_summary" not in gt:
                        issues.append("Missing executive_summary")
                
                if issues:
                    log_test("GET /scans/{id}/growth-team", "fail", 
                            f"Issues: {'; '.join(issues)}")
                else:
                    log_test("GET /scans/{id}/growth-team", "pass", 
                            f"Cached data returned correctly, elapsed: {elapsed:.2f}s (much faster than POST)")
        
        except Exception as e:
            log_test("GET /scans/{id}/growth-team", "fail", f"Exception: {str(e)}")
    else:
        log_test("GET /scans/{id}/growth-team", "fail", 
                "Skipped - no business_scan_id available")
    
    # Test 6: NEGATIVE TEST - Create creator scan for testing
    try:
        print("\n🔍 TEST 6: POST /scans (create creator scan for negative test)")
        print("   Target: https://instagram.com/example")
        
        start = time.time()
        with httpx.Client(timeout=90.0) as client:
            resp = client.post(
                f"{BASE_URL}/scans",
                headers=headers,
                json={
                    "mode": "creator",
                    "target": "https://instagram.com/example"
                }
            )
        elapsed = time.time() - start
        
        if resp.status_code != 200:
            log_test("POST /scans (creator)", "warn", 
                    f"Status {resp.status_code}. May not be able to run negative test. Response: {resp.text[:300]}")
        else:
            data = resp.json()
            creator_scan_id = data.get("id")
            log_test("POST /scans (creator)", "pass", 
                    f"Creator scan created, ID: {creator_scan_id}, elapsed: {elapsed:.2f}s")
    
    except Exception as e:
        log_test("POST /scans (creator)", "warn", 
                f"Exception: {str(e)}. May not be able to run negative test.")
    
    # Test 7: NEGATIVE TEST - POST growth-team on creator scan (expect 400)
    if creator_scan_id:
        try:
            print("\n❌ TEST 7: POST /scans/{creator_scan_id}/growth-team (expect 400)")
            start = time.time()
            with httpx.Client(timeout=30.0) as client:
                resp = client.post(
                    f"{BASE_URL}/scans/{creator_scan_id}/growth-team",
                    headers=headers
                )
            elapsed = time.time() - start
            
            if resp.status_code == 400:
                log_test("POST growth-team on creator scan", "pass", 
                        f"Correctly returned 400 for creator scan, elapsed: {elapsed:.2f}s")
            else:
                log_test("POST growth-team on creator scan", "fail", 
                        f"Expected 400, got {resp.status_code}. Response: {resp.text[:300]}")
        
        except Exception as e:
            log_test("POST growth-team on creator scan", "fail", f"Exception: {str(e)}")
    else:
        log_test("POST growth-team on creator scan", "warn", 
                "Skipped - no creator_scan_id available")
    
    # Test 8: NEGATIVE TEST - POST growth-team on non-existent scan (expect 404)
    try:
        print("\n❌ TEST 8: POST /scans/{nonexistent}/growth-team (expect 404)")
        fake_id = "nonexistent-uuid-12345678"
        start = time.time()
        with httpx.Client(timeout=30.0) as client:
            resp = client.post(
                f"{BASE_URL}/scans/{fake_id}/growth-team",
                headers=headers
            )
        elapsed = time.time() - start
        
        if resp.status_code == 404:
            log_test("POST growth-team on non-existent scan", "pass", 
                    f"Correctly returned 404 for non-existent scan, elapsed: {elapsed:.2f}s")
        else:
            log_test("POST growth-team on non-existent scan", "fail", 
                    f"Expected 404, got {resp.status_code}. Response: {resp.text[:300]}")
    
    except Exception as e:
        log_test("POST growth-team on non-existent scan", "fail", f"Exception: {str(e)}")
    
    # Print final summary
    print_summary()
    
    # Return exit code based on results
    return 0 if len(results['failed']) == 0 else 1

if __name__ == "__main__":
    exit(main())
