import pytest
from fastapi.testclient import TestClient
import os
import sys

# Add parent directory to path
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))

from main import app, init_db, get_db_connection

@pytest.fixture(scope="function")
def test_db():
    """Create a test database for each test"""
    test_db_path = "test_scores.db"
    
    # Initialize test database
    init_db(test_db_path)
    
    yield test_db_path
    
    # Cleanup
    if os.path.exists(test_db_path):
        os.remove(test_db_path)

@pytest.fixture(scope="function")
def client(test_db):
    """Create a test client with test database"""
    app.state.db_path = test_db
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
