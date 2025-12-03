import re
import math
import sys
import os
import time
import argparse
from datetime import datetime
from collections import defaultdict

# Configuration
LOG_FILE = "game_state.log"
ANALYSIS_LOG_FILE = "sync_analysis.log"
MAX_COLLECTION_DISTANCE = 150  # Pixels. Player size ~80, Coin ~30. 150 is generous.
MAX_SPEED_THRESHOLD = 2000     # Pixels per second. Sanity check for teleportation.

def log_output(message, to_console=True):
    """Log message to file and optionally to console"""
    timestamp = datetime.now().strftime("%Y-%m-%d %H:%M:%S")
    formatted_message = f"[{timestamp}] {message}"
    
    if to_console:
        print(formatted_message)
        
    with open(ANALYSIS_LOG_FILE, "a", encoding='utf-8') as f:
        f.write(formatted_message + "\n")

class GameEntity:
    def __init__(self, id, x, y, type=None, timestamp=None):
        self.id = id
        self.x = float(x)
        self.y = float(y)
        self.type = type
        self.last_update = timestamp
        self.history = [] # List of (timestamp, x, y)

    def update(self, x, y, timestamp):
        self.x = float(x)
        self.y = float(y)
        self.last_update = timestamp
        self.history.append((timestamp, self.x, self.y))

class GameRoom:
    def __init__(self, room_id):
        self.room_id = room_id
        self.players = {}
        self.enemies = {}
        self.items = {} # Coins and Powerups
        self.anomalies = []

    def get_player(self, player_id):
        if player_id not in self.players:
            self.players[player_id] = GameEntity(player_id, 0, 0)
        return self.players[player_id]

    def log_anomaly(self, timestamp, message, severity="WARNING"):
        anomaly_msg = f"[{severity}] {message}"
        self.anomalies.append({
            "timestamp": timestamp,
            "message": message,
            "severity": severity
        })
        # Immediate output for monitoring
        log_output(f"ANOMALY in Room {self.room_id}: {anomaly_msg}")

def parse_timestamp(ts_str):
    # Format: 2025-12-03 10:15:30,123
    return datetime.strptime(ts_str, "%Y-%m-%d %H:%M:%S,%f")

def calculate_distance(x1, y1, x2, y2):
    return math.sqrt((x1 - x2)**2 + (y1 - y2)**2)

def parse_pos(pos_str):
    # Format: (100.5, 200.0) or (100, 200)
    try:
        clean = pos_str.strip("()")
        parts = clean.split(",")
        return float(parts[0]), float(parts[1])
    except:
        return 0.0, 0.0

def process_line(line, rooms, patterns):
    base_pattern, player_state_pattern, spawn_pattern, collect_pattern = patterns
    
    match = base_pattern.search(line)
    if not match:
        return

    ts_str, room_id, msg_type, content = match.groups()
    timestamp = parse_timestamp(ts_str)

    if room_id not in rooms:
        rooms[room_id] = GameRoom(room_id)
    room = rooms[room_id]

    if msg_type == "PLAYER_STATE":
        m = player_state_pattern.search(content)
        if m:
            pid, pos_str = m.groups()
            x, y = parse_pos(pos_str)
            
            player = room.get_player(pid)
            
            # Speed Check
            if player.last_update:
                dt = (timestamp - player.last_update).total_seconds()
                if dt > 0:
                    dist = calculate_distance(player.x, player.y, x, y)
                    
                    # Ignore small movements (jitter) to prevent false positives on high-frequency updates
                    # Only check speed if distance is significant (> 20px)
                    if dist > 20:
                        speed = dist / dt
                        if speed > MAX_SPEED_THRESHOLD:
                            room.log_anomaly(timestamp, f"Player {pid} moved too fast: {speed:.2f} px/s (Dist: {dist:.2f}, Time: {dt:.3f}s)", "SUSPICIOUS")
            
            player.update(x, y, timestamp)

    elif msg_type in ["COIN_SPAWN", "ENEMY_SPAWN", "POWERUP_SPAWN"]:
        m = spawn_pattern.search(content)
        if m:
            eid, pos_str = m.groups()
            x, y = parse_pos(pos_str)
            # Store item authoritative position
            room.items[eid] = GameEntity(eid, x, y, type=msg_type, timestamp=timestamp)

    elif msg_type == "ITEM_COLLECT":
        m = collect_pattern.search(content)
        if m:
            pid, itype, iid = m.groups()
            
            if iid in room.items:
                item = room.items[iid]
                player = room.get_player(pid)
                
                # SYNC CHECK: Distance between Player and Item
                # Player position is from their last state update (which might be slightly old, but usually frequent)
                # Item position is from when it spawned (static for coins)
                
                dist = calculate_distance(player.x, player.y, item.x, item.y)
                
                # Special handling for dropped coins (they fall due to gravity)
                # If it's a dropped coin, we allow a larger Y-distance downwards
                is_dropped_coin = "coin_drop_" in iid
                
                # Calculate vertical distance (Player Y - Item Y)
                # Positive means player is below item (item fell)
                dy = player.y - item.y
                
                threshold = MAX_COLLECTION_DISTANCE
                
                # If it's a dropped coin and the player is below the spawn point (gravity), allow more leeway
                if is_dropped_coin and dy > 0:
                    # Allow up to 400px drop distance (approx 2-3 screen heights of falling)
                    if dy < 400 and abs(player.x - item.x) < MAX_COLLECTION_DISTANCE:
                        # Valid drop collection
                        pass
                    elif dist > threshold:
                         room.log_anomaly(timestamp, 
                            f"SYNC ERROR: Player {pid} collected {itype} {iid} but was {dist:.2f}px away.\n"
                            f"      Player Pos: ({player.x:.1f}, {player.y:.1f})\n"
                            f"      Item Pos:   ({item.x:.1f}, {item.y:.1f})", 
                            "CRITICAL")
                elif dist > threshold:
                    room.log_anomaly(timestamp, 
                        f"SYNC ERROR: Player {pid} collected {itype} {iid} but was {dist:.2f}px away.\n"
                        f"      Player Pos: ({player.x:.1f}, {player.y:.1f})\n"
                        f"      Item Pos:   ({item.x:.1f}, {item.y:.1f})", 
                        "CRITICAL")
                else:
                    # Valid collection
                    pass
            else:
                # Item not found in server memory (maybe spawned before log started?)
                pass

def analyze_logs(filepath, monitor=False):
    if not os.path.exists(filepath):
        if monitor:
            log_output(f"Waiting for log file '{filepath}' to be created...")
            while not os.path.exists(filepath):
                time.sleep(1)
        else:
            print(f"Error: Log file '{filepath}' not found.")
            return

    log_output(f"Analyzing {filepath}..." + (" (Monitoring Mode)" if monitor else ""))
    
    rooms = {}
    
    # Regex patterns
    patterns = (
        re.compile(r'(\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2},\d{3}) - \[ROOM:(.*?)\] \[(.*?)\] (.*)'),
        re.compile(r'Player:(.*?) Pos:(\(.*?\))'),
        re.compile(r'ID:(.*?) Pos:(\(.*?\))'),
        re.compile(r'Player:(.*?) Type:(.*?) ID:(.*)')
    )

    with open(filepath, 'r') as f:
        # Process existing lines
        for line in f:
            process_line(line, rooms, patterns)
            
        if monitor:
            log_output("Caught up with existing logs. Monitoring for new events...")
            try:
                while True:
                    line = f.readline()
                    if not line:
                        time.sleep(0.1)
                        continue
                    process_line(line, rooms, patterns)
            except KeyboardInterrupt:
                log_output("Monitoring stopped by user.")
                return

    # Generate Report (Only for non-monitor mode)
    if not monitor:
        print("\n" + "="*60)
        print("SYNC ANALYSIS REPORT")
        print("="*60)

        for room_id, room in rooms.items():
            print(f"\nROOM: {room_id}")
            print(f"Players: {list(room.players.keys())}")
            print(f"Items Tracked: {len(room.items)}")
            
            if not room.anomalies:
                print("✅ No sync anomalies detected.")
            else:
                print(f"⚠️  {len(room.anomalies)} ANOMALIES DETECTED:")
                for a in room.anomalies:
                    icon = "🔴" if a['severity'] == "CRITICAL" else "🟠"
                    print(f"  {icon} [{a['timestamp'].strftime('%H:%M:%S')}] {a['message']}")

        print("\n" + "="*60)
        print("INTERPRETATION GUIDE:")
        print("1. 'SYNC ERROR' (Critical): Player collected an item that the server thinks is far away.")
        print("   - This usually means the Player's local map is different from the Host's map.")
        print("   - The Player sees the item at X, but Host spawned it at Y.")
        print("2. 'Moved too fast' (Suspicious): Lag spike or teleportation.")
        print("="*60)

if __name__ == "__main__":
    parser = argparse.ArgumentParser(description='Analyze game state logs for sync issues.')
    parser.add_argument('logfile', nargs='?', default=LOG_FILE, help='Path to the log file')
    parser.add_argument('--monitor', '-m', action='store_true', help='Run in continuous monitoring mode')
    
    args = parser.parse_args()
    analyze_logs(args.logfile, args.monitor)
