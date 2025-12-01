#!/usr/bin/env python3
"""
WebSocket harness: host sends 'assist' action and server should update target player's position authoritatively and broadcast to other clients.
Run: python3 scripts/ws_test_harness_assist.py
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
        await asyncio.sleep(0.6)

        # Mark ready and start
        await ws.send(json.dumps({"type":"player_ready","is_ready": True}))
        await asyncio.sleep(0.4)
        await ws.send(json.dumps({"type":"start_game"}))

        # Give the client a moment to be in the game
        await asyncio.sleep(0.5)

        # Host issues an assist for the client player to new coordinates
        assist_payload = {
            "target_player_id": "client456",
            "x": 250,
            "y": 80
        }
        print('HOST: sending assist action', assist_payload)
        await ws.send(json.dumps({"type":"game_action","action":"assist","data":assist_payload}))

        # Wait to allow server broadcasts to propagate
        await asyncio.sleep(1.0)


async def client_flow(room_id: str):
    async with websockets.connect(f"{WS_BASE}/{room_id}") as ws:
        await ws.send(json.dumps({"type":"join_room","room_id":room_id,"player_name":"Client","player_id":"client456"}))
        for _ in range(6):
            raw = await ws.recv()
            resp = json.loads(raw)
            print('CLIENT recv:', resp)
            if resp.get('type') in ('room_joined','error'):
                break

        saw_player_state_update = False
        saw_game_action_assist = False
        expected_x = 250
        expected_y = 80

        start = asyncio.get_event_loop().time()
        while True:
            if asyncio.get_event_loop().time() - start > 6:
                break
            try:
                raw = await asyncio.wait_for(ws.recv(), timeout=5)
            except Exception:
                break
            msg = json.loads(raw)
            print('CLIENT event:', msg)
            t = msg.get('type')
            if t == 'player_state_update':
                if msg.get('player_id') == 'client456':
                    state = msg.get('state', {})
                    # server should update to expected assisted coords
                    if abs(state.get('x', 0) - expected_x) < 0.1 and abs(state.get('y', 0) - expected_y) < 0.1:
                        saw_player_state_update = True
            if t == 'game_action' and msg.get('action') == 'assist' and msg.get('player_id') == 'host123':
                saw_game_action_assist = True

            if saw_player_state_update and saw_game_action_assist:
                print('CLIENT: assist flow observed — state update and game_action received')
                break

        assert saw_player_state_update, 'client did not receive authoritative player_state_update for assist'
        assert saw_game_action_assist, 'client did not receive game_action assist broadcast'

        print('CLIENT: assist harness checks passed')


async def main():
    q = asyncio.Queue()
    host_task = asyncio.create_task(host_flow(q))
    room_id = await q.get()
    print('Main: starting client for room', room_id)
    client_task = asyncio.create_task(client_flow(room_id))
    await asyncio.gather(host_task, client_task)


if __name__ == '__main__':
    try:
        asyncio.run(main())
    except KeyboardInterrupt:
        print('assist test harness terminated')
