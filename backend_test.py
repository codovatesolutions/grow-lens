#!/usr/bin/env python3
"""
GrowthLens AI - Phase 1 Backend API Tests
Tests all Phase 1 endpoints in order as specified in test_result.md
"""
import httpx
import json
import time
from datetime import datetime

# Configuration
BASE_URL = "https://grow-view.preview.emergentagent.com/api"
TEST_EMAIL = "codovate.test+20260715143316@example.com"
TEST_PASSWORD = "TestPass123!"

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
    print("TEST SUMMARY")
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

def main():
    print("="*80)
    print("GrowthLens AI - Phase 1 Backend API Tests")
    print("="*80)
    print(f"Base URL: {BASE_URL}")
    print(f"Test User: {TEST_EMAIL}")
    print("="*80)
    
    token = None
    scan_id = None
    task_id = None
    
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
            return
        
        data = resp.json()
        if "token" not in data:
            log_test("POST /auth/login", "fail", "No 'token' in response")
            print("\n❌ NO TOKEN - STOPPING ALL TESTS")
            print_summary()
            return
        
        token = data["token"]
        log_test("POST /auth/login", "pass", 
                f"Token received, elapsed: {elapsed:.2f}s")
        
    except Exception as e:
        log_test("POST /auth/login", "fail", f"Exception: {str(e)}")
        print("\n❌ LOGIN EXCEPTION - STOPPING ALL TESTS")
        print_summary()
        return
    
    # Headers for authenticated requests
    headers = {"Authorization": f"Bearer {token}"}
    
    # Test 2: GET /dashboard (initial)
    try:
        print("\n📊 TEST 2: GET /dashboard (initial - may have 0 scans)")
        start = time.time()
        with httpx.Client(timeout=30.0) as client:
            resp = client.get(f"{BASE_URL}/dashboard", headers=headers)
        elapsed = time.time() - start
        
        if resp.status_code != 200:
            log_test("GET /dashboard (initial)", "fail", 
                    f"Status {resp.status_code}, expected 200. Response: {resp.text[:300]}")
        else:
            data = resp.json()
            required_keys = [
                "user", "totals", "growth_score", "revenue_score", "open_tasks",
                "tasks_summary", "activity", "competitor_alerts", "weekly",
                "recent_scans", "growth_trend", "ai_recommendations"
            ]
            missing = [k for k in required_keys if k not in data]
            
            if missing:
                log_test("GET /dashboard (initial)", "fail", 
                        f"Missing keys: {missing}")
            else:
                log_test("GET /dashboard (initial)", "pass", 
                        f"All {len(required_keys)} keys present, elapsed: {elapsed:.2f}s")
                print(f"   growth_score: {data.get('growth_score')}")
                print(f"   revenue_score: {data.get('revenue_score')}")
                print(f"   tasks_summary: {data.get('tasks_summary')}")
                print(f"   recent_scans count: {len(data.get('recent_scans', []))}")
    
    except Exception as e:
        log_test("GET /dashboard (initial)", "fail", f"Exception: {str(e)}")
    
    # Test 3: GET /tasks (initial)
    try:
        print("\n📋 TEST 3: GET /tasks (initial)")
        start = time.time()
        with httpx.Client(timeout=30.0) as client:
            resp = client.get(f"{BASE_URL}/tasks", headers=headers)
        elapsed = time.time() - start
        
        if resp.status_code != 200:
            log_test("GET /tasks (initial)", "fail", 
                    f"Status {resp.status_code}, expected 200. Response: {resp.text[:300]}")
        else:
            data = resp.json()
            if not isinstance(data, list):
                log_test("GET /tasks (initial)", "fail", 
                        f"Expected list, got {type(data)}")
            else:
                initial_task_count = len(data)
                log_test("GET /tasks (initial)", "pass", 
                        f"Returned list with {initial_task_count} tasks, elapsed: {elapsed:.2f}s")
    
    except Exception as e:
        log_test("GET /tasks (initial)", "fail", f"Exception: {str(e)}")
    
    # Test 4: POST /scans (create new scan)
    try:
        print("\n🔍 TEST 4: POST /scans (business scan - expect 20-60s)")
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
            log_test("POST /scans", "fail", 
                    f"Status {resp.status_code}, expected 200. Response: {resp.text[:500]}")
        else:
            data = resp.json()
            if data.get("status") != "complete":
                log_test("POST /scans", "fail", 
                        f"Expected status='complete', got '{data.get('status')}'")
            elif "result" not in data:
                log_test("POST /scans", "fail", "No 'result' object in response")
            else:
                scan_id = data.get("id")
                score = data.get("score", 0)
                log_test("POST /scans", "pass", 
                        f"Scan complete, ID: {scan_id}, score: {score}, elapsed: {elapsed:.2f}s")
                print(f"   Summary: {(data.get('result', {}).get('summary', ''))[:150]}...")
    
    except httpx.TimeoutException:
        log_test("POST /scans", "fail", "Request timed out after 90s")
    except Exception as e:
        log_test("POST /scans", "fail", f"Exception: {str(e)}")
    
    # Test 5: GET /tasks (after scan - should have auto-generated tasks)
    if scan_id:
        try:
            print("\n📋 TEST 5: GET /tasks (after scan - verify auto-generated tasks)")
            start = time.time()
            with httpx.Client(timeout=30.0) as client:
                resp = client.get(f"{BASE_URL}/tasks", headers=headers)
            elapsed = time.time() - start
            
            if resp.status_code != 200:
                log_test("GET /tasks (after scan)", "fail", 
                        f"Status {resp.status_code}, expected 200")
            else:
                data = resp.json()
                if not isinstance(data, list):
                    log_test("GET /tasks (after scan)", "fail", 
                            f"Expected list, got {type(data)}")
                else:
                    # Find tasks from the new scan
                    scan_tasks = [t for t in data if t.get("scan_id") == scan_id]
                    
                    if len(scan_tasks) == 0:
                        log_test("GET /tasks (after scan)", "fail", 
                                f"No tasks found with scan_id={scan_id}. Total tasks: {len(data)}")
                    else:
                        task_id = scan_tasks[0].get("id")
                        log_test("GET /tasks (after scan)", "pass", 
                                f"Found {len(scan_tasks)} tasks from new scan (total: {len(data)}), elapsed: {elapsed:.2f}s")
                        print(f"   First task: {scan_tasks[0].get('title', '')[:80]}")
        
        except Exception as e:
            log_test("GET /tasks (after scan)", "fail", f"Exception: {str(e)}")
    else:
        log_test("GET /tasks (after scan)", "fail", "Skipped - no scan_id from previous test")
    
    # Test 6: PATCH /tasks/{task_id} (mark task as done)
    if task_id:
        try:
            print(f"\n✓ TEST 6: PATCH /tasks/{task_id} (mark as done)")
            start = time.time()
            with httpx.Client(timeout=30.0) as client:
                resp = client.patch(
                    f"{BASE_URL}/tasks/{task_id}",
                    headers=headers,
                    json={"done": True}
                )
            elapsed = time.time() - start
            
            if resp.status_code != 200:
                log_test("PATCH /tasks/{id}", "fail", 
                        f"Status {resp.status_code}, expected 200. Response: {resp.text[:300]}")
            else:
                data = resp.json()
                if data.get("done") != True:
                    log_test("PATCH /tasks/{id}", "fail", 
                            f"Expected done=true, got done={data.get('done')}")
                else:
                    log_test("PATCH /tasks/{id}", "pass", 
                            f"Task marked as done, elapsed: {elapsed:.2f}s")
        
        except Exception as e:
            log_test("PATCH /tasks/{id}", "fail", f"Exception: {str(e)}")
    else:
        log_test("PATCH /tasks/{id}", "fail", "Skipped - no task_id from previous test")
    
    # Test 7: GET /dashboard (after scan + task completion)
    if scan_id and task_id:
        try:
            print("\n📊 TEST 7: GET /dashboard (verify updates after scan + task)")
            start = time.time()
            with httpx.Client(timeout=30.0) as client:
                resp = client.get(f"{BASE_URL}/dashboard", headers=headers)
            elapsed = time.time() - start
            
            if resp.status_code != 200:
                log_test("GET /dashboard (after updates)", "fail", 
                        f"Status {resp.status_code}, expected 200")
            else:
                data = resp.json()
                issues = []
                
                # Check recent_scans contains new scan
                recent_scan_ids = [s.get("id") for s in data.get("recent_scans", [])]
                if scan_id not in recent_scan_ids:
                    issues.append(f"recent_scans missing scan_id {scan_id}")
                
                # Check growth_score > 0
                growth_score = data.get("growth_score", 0)
                if not isinstance(growth_score, (int, float)) or growth_score <= 0:
                    issues.append(f"growth_score should be > 0, got {growth_score}")
                
                # Check tasks_summary
                tasks_summary = data.get("tasks_summary", {})
                if tasks_summary.get("done", 0) < 1:
                    issues.append(f"tasks_summary.done should be >= 1, got {tasks_summary.get('done')}")
                if tasks_summary.get("total", 0) < 1:
                    issues.append(f"tasks_summary.total should be >= 1, got {tasks_summary.get('total')}")
                
                # Check activity has scan_created AND task_done
                activity = data.get("activity", [])
                activity_types = [a.get("type") for a in activity]
                if "scan_created" not in activity_types:
                    issues.append("activity missing 'scan_created' event")
                if "task_done" not in activity_types:
                    issues.append("activity missing 'task_done' event")
                
                # Check growth_trend has at least 1 entry
                growth_trend = data.get("growth_trend", [])
                if len(growth_trend) < 1:
                    issues.append(f"growth_trend should have >= 1 entry, got {len(growth_trend)}")
                elif not all(k in growth_trend[0] for k in ["date", "score"]):
                    issues.append("growth_trend entries missing 'date' or 'score'")
                
                # Check ai_recommendations has at least 1 entry
                ai_recs = data.get("ai_recommendations", [])
                if len(ai_recs) < 1:
                    issues.append(f"ai_recommendations should have >= 1 entry, got {len(ai_recs)}")
                elif not all(k in ai_recs[0] for k in ["title", "why", "priority", "scan_id"]):
                    issues.append("ai_recommendations entries missing required keys")
                
                if issues:
                    log_test("GET /dashboard (after updates)", "fail", 
                            f"Issues found: {'; '.join(issues)}")
                else:
                    log_test("GET /dashboard (after updates)", "pass", 
                            f"All verifications passed, elapsed: {elapsed:.2f}s")
                    print(f"   growth_score: {growth_score}")
                    print(f"   tasks_summary: {tasks_summary}")
                    print(f"   activity events: {len(activity)}")
                    print(f"   growth_trend points: {len(growth_trend)}")
                    print(f"   ai_recommendations: {len(ai_recs)}")
        
        except Exception as e:
            log_test("GET /dashboard (after updates)", "fail", f"Exception: {str(e)}")
    else:
        log_test("GET /dashboard (after updates)", "fail", 
                "Skipped - missing scan_id or task_id from previous tests")
    
    # Test 8: POST /assistant/chat (first message)
    try:
        print("\n💬 TEST 8: POST /assistant/chat (first message)")
        print("   Message: 'What should I fix first on my site?'")
        
        start = time.time()
        with httpx.Client(timeout=45.0) as client:
            resp = client.post(
                f"{BASE_URL}/assistant/chat",
                headers=headers,
                json={
                    "message": "What should I fix first on my site?",
                    "history": []
                }
            )
        elapsed = time.time() - start
        
        if resp.status_code != 200:
            log_test("POST /assistant/chat (first)", "fail", 
                    f"Status {resp.status_code}, expected 200. Response: {resp.text[:500]}")
            first_reply = None
        else:
            data = resp.json()
            first_reply = data.get("reply", "")
            
            if not first_reply or not isinstance(first_reply, str):
                log_test("POST /assistant/chat (first)", "fail", 
                        f"Expected non-empty string reply, got: {type(first_reply)}")
                first_reply = None
            else:
                log_test("POST /assistant/chat (first)", "pass", 
                        f"Received reply ({len(first_reply)} chars), elapsed: {elapsed:.2f}s")
                print(f"   Reply preview: {first_reply[:150]}...")
    
    except httpx.TimeoutException:
        log_test("POST /assistant/chat (first)", "fail", "Request timed out after 45s")
        first_reply = None
    except Exception as e:
        log_test("POST /assistant/chat (first)", "fail", f"Exception: {str(e)}")
        first_reply = None
    
    # Test 9: POST /assistant/chat (follow-up with history)
    if first_reply:
        try:
            print("\n💬 TEST 9: POST /assistant/chat (follow-up with history)")
            print("   Message: 'Give me one concrete next step'")
            
            start = time.time()
            with httpx.Client(timeout=45.0) as client:
                resp = client.post(
                    f"{BASE_URL}/assistant/chat",
                    headers=headers,
                    json={
                        "message": "Give me one concrete next step",
                        "history": [
                            {"role": "user", "text": "What should I fix first on my site?"},
                            {"role": "assistant", "text": first_reply}
                        ]
                    }
                )
            elapsed = time.time() - start
            
            if resp.status_code != 200:
                log_test("POST /assistant/chat (follow-up)", "fail", 
                        f"Status {resp.status_code}, expected 200. Response: {resp.text[:500]}")
            else:
                data = resp.json()
                second_reply = data.get("reply", "")
                
                if not second_reply or not isinstance(second_reply, str):
                    log_test("POST /assistant/chat (follow-up)", "fail", 
                            f"Expected non-empty string reply, got: {type(second_reply)}")
                else:
                    log_test("POST /assistant/chat (follow-up)", "pass", 
                            f"Received reply ({len(second_reply)} chars), elapsed: {elapsed:.2f}s")
                    print(f"   Reply preview: {second_reply[:150]}...")
        
        except httpx.TimeoutException:
            log_test("POST /assistant/chat (follow-up)", "fail", "Request timed out after 45s")
        except Exception as e:
            log_test("POST /assistant/chat (follow-up)", "fail", f"Exception: {str(e)}")
    else:
        log_test("POST /assistant/chat (follow-up)", "fail", 
                "Skipped - no first_reply from previous test")
    
    # Print final summary
    print_summary()
    
    # Return exit code based on results
    return 0 if len(results['failed']) == 0 else 1

if __name__ == "__main__":
    exit(main())
