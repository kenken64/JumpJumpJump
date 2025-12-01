#!/usr/bin/env python3
"""
WebSocket harness: host sends sync_entities and client should receive entities_sync broadcast.
Run: python3 scripts/ws_test_harness_sync_entities.py
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
        if not room_id:
            resp = json.loads(await ws.recv())
            print('HOST recv fallback:', resp)
            room_id = resp.get('room_id')

        # share room
        await room_queue.put(room_id)

        # Wait for client to join
        await asyncio.sleep(0.3)

        # Host composes a deterministic set of entities to register
        enemies = [
            { 'enemy_id': 'host_e1', 'enemy_type': 'slimeGreen', 'x': 400, 'y': 300, 'velocity_x': 0, 'velocity_y': 0, 'health': 10, 'max_health': 10, 'is_alive': True, 'facing_right': True, 'state': 'idle' }
        ]
        coins = [
            { 'coin_id': 'coin_init_0_600_450', 'x': 600, 'y': 450, 'is_collected': False, 'collected_by': None },
            { 'coin_id': 'coin_init_1_1000_400', 'x': 1000, 'y': 400, 'is_collected': False, 'collected_by': None }
        ]

        print('HOST: sending sync_entities to register map coins')
        await ws.send(json.dumps({"type":"sync_entities","enemies":enemies,"coins":coins}))

        # Wait to receive server broadcast (the host will be excluded from the broadcast by server code)
        # But host may receive confirmation via another mechanism; just sleep for a bit
        await asyncio.sleep(1)

async def client_flow(room_id: str):
    async with websockets.connect(f"{WS_BASE}/{room_id}") as ws:
        await ws.send(json.dumps({"type":"join_room","room_id":room_id,"player_name":"Client","player_id":"client456"}))
        # consume lobby messages until join
        for _ in range(5):
            raw = await ws.recv()
            print('CLIENT recv:', json.loads(raw))

        saw_entities_sync = False

        try:
            # Wait up to 5 seconds for entities_sync
            raw = await asyncio.wait_for(ws.recv(), timeout=5)
            msg = json.loads(raw)
            print('CLIENT event:', msg)
            if msg.get('type') == 'entities_sync':
                print('CLIENT: received entities_sync', len(msg.get('enemies', [])), len(msg.get('coins', [])))
                saw_entities_sync = True
        except asyncio.TimeoutError:
            print('CLIENT: timed out waiting for entities_sync')

        assert saw_entities_sync, 'Client did not receive entities_sync broadcast'
        print('CLIENT: sync_entities harness checks passed')

async def main():
    q = asyncio.Queue()
    host_task = asyncio.create_task(host_flow(q))
    room_id = await q.get()
    print('Main: starting client for room', room_id)
    client_task = asyncio.create_task(client_flow(room_id))
    await asyncio.gather(host_task, client_task)

if __name__ == '__main__':
    asyncio.run(main())
