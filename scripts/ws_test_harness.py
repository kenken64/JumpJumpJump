#!/usr/bin/env python3
"""
Simple WebSocket harness to simulate two clients (host and client) and validate enemy spawn/state flow.
Requires: websockets (pip install websockets)
Run: python3 scripts/ws_test_harness.py
"""
import asyncio
import json
import websockets

WS_BASE = "ws://localhost:8000/ws/room"

async def host_flow(room_queue: asyncio.Queue):
    async with websockets.connect(f"{WS_BASE}/new") as ws:
        # Create room
        await ws.send(json.dumps({"type":"create_room","player_name":"Host","player_id":"host123"}))
        # The server may send multiple messages (room_created + broadcasts), read until we find 'room_created'
        room_id = None
        for _ in range(5):
            resp = json.loads(await ws.recv())
            print('HOST recv:', resp)
            if resp.get('type') == 'room_created':
                room_id = resp.get('room_id')
                break
        if not room_id:
            # fallback to reading one more message
            resp = json.loads(await ws.recv())
            print('HOST recv fallback:', resp)
            room_id = resp.get('room_id')
        # share room_id with client
        await room_queue.put(room_id)

        # Wait for join
        await asyncio.sleep(0.5)

        # Mark ready
        await ws.send(json.dumps({"type":"player_ready","is_ready": True}))
        # Wait a bit, then start the game (assume at least 2 players in test harness)
        await asyncio.sleep(0.5)
        await ws.send(json.dumps({"type":"start_game"}))

        # After game starts, spawn an enemy and then stream its state
        enemy = {
            'enemy_id': 'h_test_1',
            'enemy_type': 'slimeGreen',
            'x': 100,
            'y': 300,
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

        # Wait and then stream states
        for i in range(5):
            await asyncio.sleep(0.2)
            enemy['x'] += 10
            enemy['y'] += (-1) ** i * 2
            await ws.send(json.dumps({"type":"enemy_state","enemy_id":enemy['enemy_id'],"state":{"x":enemy['x'],"y":enemy['y'],"velocity_x":enemy['velocity_x'],"velocity_y":enemy['velocity_y'],'health': enemy['health'],'is_alive': enemy['is_alive']}}))
            print('HOST: sent enemy_state', enemy['x'], enemy['y'])

        # send killed
        await asyncio.sleep(0.5)
        await ws.send(json.dumps({"type":"enemy_killed","enemy_id":enemy['enemy_id']}))
        print('HOST: reported enemy killed')

        # Wait for final
        await asyncio.sleep(1)

async def client_flow(room_id: str):
    async with websockets.connect(f"{WS_BASE}/{room_id}") as ws:
        # Join the room created by host
        await ws.send(json.dumps({"type":"join_room","room_id":room_id,"player_name":"Client","player_id":"client456"}))
        # read initial server messages until room_joined or error
        for _ in range(5):
            raw = await ws.recv()
            resp = json.loads(raw)
            print('CLIENT recv:', resp)
            if resp.get('type') in ('room_joined','error'):
                break

        # Listen for messages and assert the expected sequence
        seen = {
            'spawned': False,
            'states': 0,
            'killed': False,
            'coins': 0
        }
        coins_received = []
        collected_ok = False
        try:
            timeout = 8.0
            start = asyncio.get_event_loop().time()
            while True:
                # protective timeout
                if asyncio.get_event_loop().time() - start > timeout:
                    print('CLIENT: timed out waiting for events')
                    break

                raw = await asyncio.wait_for(ws.recv(), timeout=timeout)
                msg = json.loads(raw)
                t = msg.get('type')
                if t == 'enemy_spawned':
                    print('CLIENT event:', t, msg)
                    seen['spawned'] = True
                elif t == 'enemy_state_update':
                    print('CLIENT event:', t, msg)
                    seen['states'] += 1
                elif t == 'enemy_killed':
                    print('CLIENT event:', t, msg)
                    seen['killed'] = True
                elif t == 'coin_spawned':
                    print('CLIENT event:', t, msg)
                    seen['coins'] += 1
                    coin = msg.get('coin', {})
                    # collect the first spawned coin
                    if coin and coin.get('coin_id'):
                        coins_received.append(coin.get('coin_id'))
                        # send collect request once
                        if len(coins_received) == 1:
                            collect_id = coins_received[0]
                            print('CLIENT: attempting to collect', collect_id)
                            await ws.send(json.dumps({"type":"collect_item","item_type":"coin","item_id":collect_id}))

                # handle item_collected message verification
                if t == 'item_collected':
                    # verify server included authoritative totals
                    print('CLIENT event:', t, msg)
                    if msg.get('player_id') == 'client456' and msg.get('item_type') == 'coin':
                        if msg.get('player_coins') is not None and msg.get('player_score') is not None:
                            collected_ok = True

                # finish early if all expected things arrived
                if seen['spawned'] and seen['states'] >= 3 and seen['killed'] and seen['coins'] >= 3 and collected_ok:
                    print('CLIENT: All expected events received')
                    break

        except asyncio.TimeoutError:
            print('CLIENT connection timed out')
        except websockets.ConnectionClosed:
            print('CLIENT connection closed')

        # Evaluate results and exit success/fail condition via raising or returning
        assert seen['spawned'], 'expected enemy_spawned'
        assert seen['states'] >= 3, f'expected at least 3 enemy_state_update, got {seen["states"]}'
        assert seen['killed'], 'expected enemy_killed'
        assert seen['coins'] >= 1, 'expected some coin_spawned event'
        assert collected_ok, 'expected item_collected with authoritative player totals'
        print('CLIENT: harness checks passed')

async def main():
    room_queue = asyncio.Queue()

    host_task = asyncio.create_task(host_flow(room_queue))

    # Wait for host to create the room and push its ID
    room_id = await room_queue.get()
    print('Main: starting client for room', room_id)

    client_task = asyncio.create_task(client_flow(room_id))

    await asyncio.gather(host_task, client_task)

if __name__ == '__main__':
    try:
        asyncio.run(main())
    except KeyboardInterrupt:
        print('Test harness terminated')
