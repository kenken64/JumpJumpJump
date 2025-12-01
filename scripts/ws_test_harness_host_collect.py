#!/usr/bin/env python3
"""
WebSocket harness: host attempts to collect coin after enemy killed and server should broadcast item_collected to client.
Run: python3 scripts/ws_test_harness_host_collect.py
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

        await room_queue.put(room_id)

        # Wait for client to join
        await asyncio.sleep(0.5)

        # Mark ready and start
        await ws.send(json.dumps({"type":"player_ready","is_ready": True}))
        await asyncio.sleep(0.5)
        await ws.send(json.dumps({"type":"start_game"}))

        # Spawn enemy and then kill it; host will try to collect coin
        enemy = {
            'enemy_id': 'h_test_2',
            'enemy_type': 'slimeGreen',
            'x': 150,
            'y': 302,
            'velocity_x': 0,
            'velocity_y': 0,
            'health': 10,
            'max_health': 10,
            'is_alive': True,
            'facing_right': True,
            'state':'idle',
            'coin_reward': 3,
            'scale': 1
        }

        print('HOST: spawning enemy')
        await ws.send(json.dumps({"type":"enemy_spawn","enemy":enemy}))

        # stream states
        for i in range(3):
            await asyncio.sleep(0.15)
            enemy['x'] += 10
            enemy['y'] += (-1)**i * 1
            await ws.send(json.dumps({"type":"enemy_state","enemy_id":enemy['enemy_id'],"state":{"x":enemy['x'],"y":enemy['y'],"velocity_x":enemy['velocity_x'],"velocity_y":enemy['velocity_y'],'health': enemy['health'],'is_alive': enemy['is_alive']}}))

        await asyncio.sleep(0.2)
        await ws.send(json.dumps({"type":"enemy_killed","enemy_id":enemy['enemy_id']}))
        print('HOST: reported enemy killed')

        # Wait for server coin_spawned to arrive to host; host is not supposed to create duplicates
        # Once host receives first coin_spawned, host will attempt to collect it
        coin_ids = []
        start = asyncio.get_event_loop().time()
        while True:
            if asyncio.get_event_loop().time() - start > 5:
                break
            try:
                raw = await asyncio.wait_for(ws.recv(), timeout=2)
            except Exception:
                break
            msg = json.loads(raw)
            print('HOST recv:', msg)
            if msg.get('type') == 'coin_spawned':
                cid = msg.get('coin', {}).get('coin_id')
                if cid:
                    coin_ids.append(cid)
                    break

        # If we have a coin id, attempt collect
        if coin_ids:
            await ws.send(json.dumps({"type":"collect_item","item_type":"coin","item_id":coin_ids[0]}))
            print('HOST: attempted to collect', coin_ids[0])

        # Give server/clients some time
        await asyncio.sleep(1)

async def client_flow(room_id: str):
    async with websockets.connect(f"{WS_BASE}/{room_id}") as ws:
        await ws.send(json.dumps({"type":"join_room","room_id":room_id,"player_name":"Client","player_id":"client456"}))
        for _ in range(6):
            raw = await ws.recv()
            resp = json.loads(raw)
            print('CLIENT recv:', resp)
            if resp.get('type') in ('room_joined','error'):
                break

        coin_seen = False
        collected_seen = False
        start = asyncio.get_event_loop().time()
        while True:
            if asyncio.get_event_loop().time() - start > 8:
                break
            try:
                raw = await asyncio.wait_for(ws.recv(), timeout=6)
            except Exception:
                break
            msg = json.loads(raw)
            print('CLIENT event:', msg)
            t = msg.get('type')
            if t == 'coin_spawned':
                coin_seen = True
            if t == 'item_collected':
                collected_seen = True

            if coin_seen and collected_seen:
                print('CLIENT: saw coin spawn and item_collected broadcast')
                break

        assert coin_seen, 'Client did not see coin_spawned'
        assert collected_seen, 'Client did not see item_collected broadcast'
        print('CLIENT: host-collect harness checks passed')


async def main():
    q = asyncio.Queue()
    host_task = asyncio.create_task(host_flow(q))
    room_id = await q.get()
    print('Main: starting client for room', room_id)
    client_task = asyncio.create_task(client_flow(room_id))
    await asyncio.gather(host_task, client_task)

if __name__ == '__main__':
    asyncio.run(main())
