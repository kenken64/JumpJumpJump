import pytest
from fastapi.testclient import TestClient
import os
import sys
import sqlite3

# Add parent directory to path
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))

from main import app

def init_test_db(db_path):
    """Initialize a test database"""
    conn = sqlite3.connect(db_path)
    cursor = conn.cursor()
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS scores (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            username TEXT NOT NULL,
            score INTEGER NOT NULL,
            level_reached INTEGER NOT NULL,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
    ''')
    conn.commit()
    conn.close()

@pytest.fixture(scope="function")
def test_db():
    """Create a test database for each test"""
    test_db_path = "test_scores.db"
    
    # Remove existing test db if it exists
    if os.path.exists(test_db_path):
        os.remove(test_db_path)
    
    # Initialize test database
    init_test_db(test_db_path)
    
    yield test_db_path
    
    # Cleanup
    if os.path.exists(test_db_path):
        os.remove(test_db_path)

@pytest.fixture(scope="function")
def client(test_db, monkeypatch):
    """Create a test client with test database"""
    # Store the original connect function
    original_connect = sqlite3.connect
    
    # Replace all database operations to use test_db
    def mock_connect(db_path, *args, **kwargs):
        # Redirect all connections to test database
        return original_connect(test_db, *args, **kwargs)
    
    monkeypatch.setattr(sqlite3, 'connect', mock_connect)
    
    return TestClient(app)

@pytest.fixture
def sample_score():
    """Sample score data for testing"""
    return {
        "username": "TestPlayer",
        "score": 1000,
        "level_reached": 5
    }

@pytest.fixture
def multiple_scores():
    """Multiple score entries for leaderboard testing"""
    return [
        {"username": "Player1", "score": 5000, "level_reached": 10},
        {"username": "Player2", "score": 3000, "level_reached": 7},
        {"username": "Player3", "score": 8000, "level_reached": 15},
        {"username": "Player4", "score": 2000, "level_reached": 5},
        {"username": "Player5", "score": 6000, "level_reached": 12},
    ]
