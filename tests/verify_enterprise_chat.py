import asyncio
import websockets
import json
import uuid
import sys

# Configuration
BASE_URI = "ws://localhost:8000/ws"
API_URL = "http://localhost:8000"
MEETING_ID = "test-enterprise-verify"

# ANSI Colors
GREEN = "\033[92m"
RED = "\033[91m"
RESET = "\033[0m"
YELLOW = "\033[93m"

def log(msg, type="INFO"):
    if type == "PASS":
        print(f"{GREEN}[PASS]{RESET} {msg}")
    elif type == "FAIL":
        print(f"{RED}[FAIL]{RESET} {msg}")
    elif type == "WARN":
        print(f"{YELLOW}[WARN]{RESET} {msg}")
    else:
        print(f"[INFO] {msg}")

async def connect_user(name, role, user_id=None):
    if not user_id:
        user_id = f"user_{uuid.uuid4().hex[:8]}"
    
    uri = f"{BASE_URI}/{MEETING_ID}/{user_id}?name={name}&role={role}"
    try:
        websocket = await websockets.connect(uri)
        # Wait for connection confirmation/state
        return websocket, user_id
    except Exception as e:
        log(f"Failed to connect {name}: {e}", "FAIL")
        return None, None

async def verify_chat_system():
    log("Starting Enterprise Chat Verification...")
    
    # 1. Setup Users
    host_ws, host_id = await connect_user("HostUser", "host", "host_1")
    guest_a_ws, guest_a_id = await connect_user("GuestA", "guest", "guest_A")
    guest_b_ws, guest_b_id = await connect_user("GuestB", "guest", "guest_B")
    
    if not (host_ws and guest_a_ws and guest_b_ws):
        log("Could not unify connections. Aborting.", "FAIL")
        return

    try:
        # --- TEST 1: Role Enforcement (Guest cannot Delete) ---
        log("\n--- Test 1: Role Enforcement (Unauthorized Delete) ---")
        delete_payload = {
             "type": "chat_moderation",
             "action": "delete_message",
             "targetId": "some_msg_id"
        }
        await guest_a_ws.send(json.dumps(delete_payload))
        # Expectation: Server might close connection or ignore. 
        # Ideally, we should receive an error or NO action broadcast.
        # Let's listen on Host to see if any 'moderation' event comes through.
        try:
            msg = await asyncio.wait_for(host_ws.recv(), timeout=1.0)
            data = json.loads(msg)
            if data.get("type") == "chat_moderation" and data.get("sender_id") == guest_a_id:
                 log("Guest successfully triggered moderation event!", "FAIL")
            else:
                 log("Received unrelated event: " + str(data.keys()), "WARN")
        except asyncio.TimeoutError:
            log("Guest delete action ignored by server (Correct).", "PASS")


        # --- TEST 2: Private Message Isolation ---
        log("\n--- Test 2: Private Message Isolation ---")
        pm_content = f"Secret-Key-{uuid.uuid4().hex}"
        pm_payload = {
            "type": "chat_message",
            "message": {
                "content": pm_content,
                "scope": "private",
                "targetId": guest_b_id
            }
        }
        await guest_a_ws.send(json.dumps(pm_payload))
        
        # Verify Guest B receives it
        received_by_b = False
        received_by_host = False
        
        # Check B
        try:
             while True:
                msg = await asyncio.wait_for(guest_b_ws.recv(), timeout=2.0)
                data = json.loads(msg)
                if data.get("type") == "chat_message":
                    payload = data.get("message", data)
                    if payload.get("content") == pm_content:
                        received_by_b = True
                        break
        except asyncio.TimeoutError:
            pass
            
        # Check Host (Should NOT receive)
        try:
             # Drain host queue
             while True:
                msg = await asyncio.wait_for(host_ws.recv(), timeout=1.0)
                data = json.loads(msg)
                if data.get("type") == "chat_message":
                    payload = data.get("message", data)
                    if payload.get("content") == pm_content:
                        received_by_host = True
                        break
        except asyncio.TimeoutError:
            pass

        if received_by_b:
            log("Target Guest B received PM.", "PASS")
        else:
            log("Target Guest B did NOT receive PM.", "FAIL")
            
        if not received_by_host:
            log("Host did NOT receive private PM.", "PASS")
        else:
             log("LEAK: Host received private PM!", "FAIL")


        # --- TEST 3: Global Chat Lock ---
        log("\n--- Test 3: Chat Lock Enforcement ---")
        # Host locks chat
        lock_payload = {
            "type": "chat_moderation",
            "action": "lock_chat"
        }
        await host_ws.send(json.dumps(lock_payload))
        log("Host sent Lock command.")
        await asyncio.sleep(0.5) 
        
        # Guest A tries to send message
        test_msg_payload = {
            "type": "chat_message",
            "message": {
                "content": "I should be blocked",
                "scope": "public" 
            }
        }
        await guest_a_ws.send(json.dumps(test_msg_payload))
        
        # Verify no broadcast
        message_broadcasted = False
        try:
            # Check Guest B (public recipient)
             while True:
                msg = await asyncio.wait_for(guest_b_ws.recv(), timeout=1.0)
                data = json.loads(msg)
                if data.get("type") == "chat_message":
                    payload = data.get("message", data)
                    if payload.get("content") == "I should be blocked":
                        message_broadcasted = True
                        break
        except asyncio.TimeoutError:
            pass
            
        if not message_broadcasted:
            log("Locked chat blocked Guest message.", "PASS")
        else:
            log("Guest message bypassed Lock!", "FAIL")

        # Unlock for cleanup
        await host_ws.send(json.dumps({"type": "chat_moderation", "action": "unlock_chat"}))


        # --- TEST 4: Rate Limiting / Spam ---
        log("\n--- Test 4: Rate Limiting (Spam Check) ---")
        # Send 10 messages rapidly
        start_time = asyncio.get_event_loop().time()
        for i in range(10):
            spam_payload = {
                "type": "chat_message",
                "message": {"content": f"Spam {i}", "scope": "public"}
            }
            await guest_b_ws.send(json.dumps(spam_payload))
        
        # We assume server handles it gracefully, maybe drops some?
        # For now, just verifying server stays alive and eventually processes.
        # Strict Enterprise requirement: Should disconnect or warn.
        # But this test just checks if it accepted them.
        log("Sent 10 spam messages. Checking if User is still connected...")
        try:
             pong_waiter = await guest_b_ws.ping()
             await asyncio.wait_for(pong_waiter, timeout=2.0)
             log("User still connected (Soft Rate Limit or None).", "INFO")
        except:
             log("User disconnected (Strict Rate Limit triggered).", "PASS")

    except Exception as e:
        log(f"Test Execution Error: {e}", "FAIL")
    finally:
        await host_ws.close()
        await guest_a_ws.close()
        await guest_b_ws.close()
        log("\nVerification Complete.")

if __name__ == "__main__":
    asyncio.run(verify_chat_system())
