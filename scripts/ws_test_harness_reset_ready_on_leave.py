#!/usr/bin/env python3
"""
WebSocket harness: verify that when a player leaves the room, remaining players' ready status is reset.
Run: python3 scripts/ws_test_harness_reset_ready_on_leave.py
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

        # Wait for client to join
        await asyncio.sleep(0.4)

        # Host sets ready
        print('HOST: setting ready = True')
        await ws.send(json.dumps({"type":"player_ready","is_ready": True}))

        # Expect ready changed events
        got_ready = False
        start = asyncio.get_event_loop().time()
        while True:
            if asyncio.get_event_loop().time() - start > 3:
                break
            try:
                raw = await asyncio.wait_for(ws.recv(), timeout=1.0)
            except Exception:
                break
            msg = json.loads(raw)
            print('HOST event:', msg)
            if msg.get('type') == 'player_ready_changed':
                got_ready = True
                break

        # Wait for client to leave
        await asyncio.sleep(1.0)

        # Host should receive a player_left then room_info indicating is_ready=False for remaining
        saw_left = False
        saw_ready_reset = False
        start = asyncio.get_event_loop().time()
        while True:
            if asyncio.get_event_loop().time() - start > 5:
                break
            try:
                raw = await asyncio.wait_for(ws.recv(), timeout=1.0)
            except Exception:
                break
            msg = json.loads(raw)
            print('HOST event later:', msg)
            if msg.get('type') == 'player_left':
                saw_left = True
                room_info = msg.get('room_info', {})
                # Check host player's entry in room info - should be not ready
                players = room_info.get('players', [])
                for p in players:
                    if p.get('player_id') == 'host123' and not p.get('is_ready'):
                        saw_ready_reset = True
            if saw_left and saw_ready_reset:
                break

        assert got_ready, 'Host did not observe initial ready change'
        assert saw_left, 'Host did not observe player_left'
        assert saw_ready_reset, 'Host did not see ready reset after peer left'
        print('HOST: reset-ready-on-leave checks passed')


async def client_flow(room_id: str):
    async with websockets.connect(f"{WS_BASE}/{room_id}") as ws:
        await ws.send(json.dumps({"type":"join_room","room_id":room_id,"player_name":"Client","player_id":"client456"}))
        for _ in range(6):
            raw = await ws.recv()
            msg = json.loads(raw)
            print('CLIENT recv:', msg)
            if msg.get('type') == 'room_joined':
                break

        # Client sets ready
        await asyncio.sleep(0.2)
        print('CLIENT: setting ready = True')
        await ws.send(json.dumps({"type":"player_ready","is_ready": True}))

        # Wait a moment then leave
        await asyncio.sleep(0.6)
        print('CLIENT: leaving room now')
        await ws.send(json.dumps({"type":"leave_room"}))

async def main():
    q = asyncio.Queue()
    host_task = asyncio.create_task(host_flow(q))
    room_id = await q.get()
    print('Main: room', room_id)
    await client_flow(room_id)
    await host_task


if __name__ == '__main__':
    asyncio.run(main())
