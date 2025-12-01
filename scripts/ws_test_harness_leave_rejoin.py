#!/usr/bin/env python3
"""
WebSocket harness: simulate client leave and rejoin to verify server broadcasts player_left and player_joined with room_info.
Run: python3 scripts/ws_test_harness_leave_rejoin.py
"""
import asyncio
import json
import websockets

WS_BASE = "ws://localhost:8000/ws/room"

async def host_flow(room_queue: asyncio.Queue):
    async with websockets.connect(f"{WS_BASE}/new") as ws:
        await ws.send(json.dumps({"type":"create_room","player_name":"Host","player_id":"host123"}))
        room_id = None
        for _ in range(6):
            resp = json.loads(await ws.recv())
            print('HOST recv:', resp)
            if resp.get('type') == 'room_created':
                room_id = resp.get('room_id')
                break
        await room_queue.put(room_id)

        # Observe events for leave/join
        events = []
        start = asyncio.get_event_loop().time()
        while True:
            if asyncio.get_event_loop().time() - start > 10:
                break
            try:
                raw = await asyncio.wait_for(ws.recv(), timeout=3)
            except Exception:
                break
            msg = json.loads(raw)
            print('HOST event:', msg)
            events.append(msg)

        # Return events for assertions
        return events

async def client_flow(room_id: str):
    # First connection: join
    async with websockets.connect(f"{WS_BASE}/{room_id}") as ws:
        await ws.send(json.dumps({"type":"join_room","room_id":room_id,"player_name":"Client","player_id":"client456"}))
        # Read initial responses until joined
        for _ in range(6):
            raw = await ws.recv()
            msg = json.loads(raw)
            print('CLIENT recv:', msg)
            if msg.get('type') in ('room_joined', 'player_joined', 'error'):
                if msg.get('type') == 'room_joined':
                    break

        # Wait a moment and then leave
        await asyncio.sleep(0.5)
        print('CLIENT: leaving room')
        await ws.send(json.dumps({"type":"leave_room"}))

    # Reconnect as new socket
    await asyncio.sleep(0.4)
    async with websockets.connect(f"{WS_BASE}/{room_id}") as ws2:
        await ws2.send(json.dumps({"type":"join_room","room_id":room_id,"player_name":"Client","player_id":"client456"}))
        for _ in range(6):
            raw = await ws2.recv()
            msg = json.loads(raw)
            print('CLIENT(rejoin) recv:', msg)
            if msg.get('type') == 'room_joined':
                break

async def main():
    q = asyncio.Queue()
    host_task = asyncio.create_task(host_flow(q))
    room_id = await q.get()
    print('Main: room', room_id)
    await client_flow(room_id)
    events = await host_task
    # Check host observed both player_joined and player_left and player_joined again
    seen_join = any(e.get('type') == 'player_joined' for e in events)
    seen_left = any(e.get('type') == 'player_left' for e in events)
    seen_rejoin = len([e for e in events if e.get('type') == 'player_joined']) >= 2
    assert seen_join, 'Host did not see player join'
    assert seen_left, 'Host did not see player leave'
    assert seen_rejoin, 'Host did not see player rejoin'
    print('Leave/Rejoin harness passed')

if __name__ == '__main__':
    asyncio.run(main())
