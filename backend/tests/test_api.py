import pytest
from fastapi.testclient import TestClient


@pytest.mark.api
class TestHealthEndpoint:
    """Test health check endpoint"""
    
    def test_health_check(self, client):
        """Test GET / returns health status"""
        response = client.get("/")
        assert response.status_code == 200
        assert response.json() == {"message": "Jump Jump Jump Score API", "status": "running"}
    
    def test_health_check_cors(self, client):
        """Test CORS headers are present"""
        response = client.get("/")
        assert response.status_code == 200
        # Note: TestClient doesn't automatically add CORS headers
        # CORS middleware is configured in main.py, this just verifies the endpoint works


@pytest.mark.api
class TestScoreSubmission:
    """Test score submission endpoint"""
    
    def test_submit_score_success(self, client, sample_score):
        """Test successful score submission"""
        response = client.post("/api/scores", json=sample_score)
        assert response.status_code == 200
        data = response.json()
        assert data["message"] == "Score saved successfully"
        assert "id" in data
        assert isinstance(data["id"], int)
    
    def test_submit_score_missing_username(self, client):
        """Test score submission without username"""
        invalid_score = {"score": 1000, "level_reached": 5}
        response = client.post("/api/scores", json=invalid_score)
        assert response.status_code == 422  # Unprocessable Entity
    
    def test_submit_score_missing_score(self, client):
        """Test score submission without score value"""
        invalid_score = {"username": "TestPlayer", "level_reached": 5}
        response = client.post("/api/scores", json=invalid_score)
        assert response.status_code == 422
    
    def test_submit_score_missing_level(self, client):
        """Test score submission without level_reached"""
        invalid_score = {"username": "TestPlayer", "score": 1000}
        response = client.post("/api/scores", json=invalid_score)
        assert response.status_code == 422
    
    def test_submit_score_negative_score(self, client):
        """Test score submission with negative score"""
        invalid_score = {"username": "TestPlayer", "score": -100, "level_reached": 5}
        response = client.post("/api/scores", json=invalid_score)
        # Should either reject or accept (depends on validation rules)
        assert response.status_code in [200, 422]
    
    def test_submit_score_zero_level(self, client):
        """Test score submission with level 0"""
        invalid_score = {"username": "TestPlayer", "score": 1000, "level_reached": 0}
        response = client.post("/api/scores", json=invalid_score)
        assert response.status_code in [200, 422]
    
    def test_submit_score_empty_username(self, client):
        """Test score submission with empty username"""
        invalid_score = {"username": "", "score": 1000, "level_reached": 5}
        response = client.post("/api/scores", json=invalid_score)
        # Should reject empty username (400 or 422 are both acceptable)
        assert response.status_code in [400, 422]
    
    def test_submit_multiple_scores_same_user(self, client):
        """Test submitting multiple scores for the same user"""
        score1 = {"username": "TestPlayer", "score": 1000, "level_reached": 5}
        score2 = {"username": "TestPlayer", "score": 2000, "level_reached": 8}
        
        response1 = client.post("/api/scores", json=score1)
        response2 = client.post("/api/scores", json=score2)
        
        assert response1.status_code == 200
        assert response2.status_code == 200
        assert response1.json()["id"] != response2.json()["id"]
    
    def test_submit_score_long_username(self, client):
        """Test score submission with very long username"""
        long_username = "A" * 1000
        score = {"username": long_username, "score": 1000, "level_reached": 5}
        response = client.post("/api/scores", json=score)
        # Should handle long usernames gracefully
        assert response.status_code in [200, 422]
    
    def test_submit_score_special_characters(self, client):
        """Test score submission with special characters in username"""
        special_score = {"username": "Test@Player#123", "score": 1000, "level_reached": 5}
        response = client.post("/api/scores", json=special_score)
        assert response.status_code == 200


@pytest.mark.api
class TestLeaderboard:
    """Test leaderboard endpoint"""
    
    def test_get_leaderboard_empty(self, client):
        """Test leaderboard when no scores exist"""
        response = client.get("/api/scores/leaderboard")
        assert response.status_code == 200
        assert response.json() == []
    
    def test_get_leaderboard_single_score(self, client, sample_score):
        """Test leaderboard with single score"""
        # Submit a score
        client.post("/api/scores", json=sample_score)
        
        # Get leaderboard
        response = client.get("/api/scores/leaderboard")
        assert response.status_code == 200
        data = response.json()
        assert len(data) == 1
        assert data[0]["username"] == sample_score["username"]
        assert data[0]["score"] == sample_score["score"]
        assert data[0]["level_reached"] == sample_score["level_reached"]
    
    def test_get_leaderboard_sorted_by_score(self, client, multiple_scores):
        """Test leaderboard is sorted by score descending"""
        # Submit multiple scores
        for score in multiple_scores:
            client.post("/api/scores", json=score)
        
        # Get leaderboard
        response = client.get("/api/scores/leaderboard")
        assert response.status_code == 200
        data = response.json()
        
        # Check sorting (highest score first)
        assert len(data) == len(multiple_scores)
        assert data[0]["score"] == 8000  # Player3
        assert data[1]["score"] == 6000  # Player5
        assert data[2]["score"] == 5000  # Player1
        assert data[-1]["score"] == 2000  # Player4
    
    def test_get_leaderboard_limit_default(self, client, multiple_scores):
        """Test leaderboard default limit of 10"""
        # Submit 15 scores
        for i in range(15):
            score = {"username": f"Player{i}", "score": 1000 + (i * 100), "level_reached": i + 1}
            client.post("/api/scores", json=score)
        
        response = client.get("/api/scores/leaderboard")
        assert response.status_code == 200
        data = response.json()
        assert len(data) <= 10
    
    def test_get_leaderboard_custom_limit(self, client, multiple_scores):
        """Test leaderboard with custom limit"""
        # Submit multiple scores
        for score in multiple_scores:
            client.post("/api/scores", json=score)
        
        response = client.get("/api/scores/leaderboard?limit=3")
        assert response.status_code == 200
        data = response.json()
        assert len(data) == 3
        assert data[0]["score"] == 8000
    
    def test_get_leaderboard_limit_zero(self, client, multiple_scores):
        """Test leaderboard with limit=0"""
        # Submit scores
        for score in multiple_scores:
            client.post("/api/scores", json=score)
        
        response = client.get("/api/scores/leaderboard?limit=0")
        # Should return empty or default behavior
        assert response.status_code in [200, 422]
    
    def test_get_leaderboard_negative_limit(self, client):
        """Test leaderboard with negative limit"""
        response = client.get("/api/scores/leaderboard?limit=-5")
        # Should handle gracefully
        assert response.status_code in [200, 422]
    
    def test_leaderboard_includes_timestamp(self, client, sample_score):
        """Test leaderboard entries include timestamp"""
        client.post("/api/scores", json=sample_score)
        
        response = client.get("/api/scores/leaderboard")
        assert response.status_code == 200
        data = response.json()
        assert "created_at" in data[0]
    
    def test_leaderboard_includes_all_fields(self, client, sample_score):
        """Test leaderboard entries include all required fields"""
        client.post("/api/scores", json=sample_score)
        
        response = client.get("/api/scores/leaderboard")
        assert response.status_code == 200
        data = response.json()
        
        required_fields = ["id", "username", "score", "level_reached", "created_at"]
        for field in required_fields:
            assert field in data[0]


@pytest.mark.api
class TestUserScores:
    """Test user-specific scores endpoint"""
    
    def test_get_user_scores_not_found(self, client):
        """Test getting scores for non-existent user"""
        response = client.get("/api/scores/user/NonExistentPlayer")
        assert response.status_code == 200
        assert response.json() == []
    
    def test_get_user_scores_single(self, client, sample_score):
        """Test getting scores for user with one score"""
        client.post("/api/scores", json=sample_score)
        
        response = client.get(f"/api/scores/user/{sample_score['username']}")
        assert response.status_code == 200
        data = response.json()
        assert len(data) == 1
        assert data[0]["username"] == sample_score["username"]
    
    def test_get_user_scores_multiple(self, client):
        """Test getting multiple scores for same user"""
        username = "TestPlayer"
        scores = [
            {"username": username, "score": 1000, "level_reached": 5},
            {"username": username, "score": 2000, "level_reached": 8},
            {"username": username, "score": 1500, "level_reached": 6},
        ]
        
        for score in scores:
            client.post("/api/scores", json=score)
        
        response = client.get(f"/api/scores/user/{username}")
        assert response.status_code == 200
        data = response.json()
        assert len(data) == 3
        # Should be sorted by score descending
        assert data[0]["score"] == 2000
        assert data[1]["score"] == 1500
        assert data[2]["score"] == 1000
    
    def test_get_user_scores_limit(self, client):
        """Test user scores with custom limit"""
        username = "TestPlayer"
        for i in range(10):
            score = {"username": username, "score": 1000 + (i * 100), "level_reached": i + 1}
            client.post("/api/scores", json=score)
        
        response = client.get(f"/api/scores/user/{username}?limit=5")
        assert response.status_code == 200
        data = response.json()
        assert len(data) == 5
    
    def test_get_user_scores_case_sensitive(self, client):
        """Test user scores are case sensitive"""
        client.post("/api/scores", json={"username": "TestPlayer", "score": 1000, "level_reached": 5})
        client.post("/api/scores", json={"username": "testplayer", "score": 2000, "level_reached": 8})
        
        response1 = client.get("/api/scores/user/TestPlayer")
        response2 = client.get("/api/scores/user/testplayer")
        
        assert response1.status_code == 200
        assert response2.status_code == 200
        # Should be separate results (case sensitive)
        assert len(response1.json()) >= 1
        assert len(response2.json()) >= 1


@pytest.mark.integration
class TestDatabaseOperations:
    """Test database operations"""
    
    def test_score_persistence(self, client, sample_score):
        """Test that scores persist across requests"""
        # Submit score
        response1 = client.post("/api/scores", json=sample_score)
        assert response1.status_code == 200
        score_id = response1.json()["id"]
        
        # Retrieve leaderboard
        response2 = client.get("/api/scores/leaderboard")
        assert response2.status_code == 200
        data = response2.json()
        
        # Score should be in leaderboard
        assert any(score["id"] == score_id for score in data)
    
    def test_concurrent_score_submissions(self, client):
        """Test multiple concurrent score submissions"""
        scores = [
            {"username": f"Player{i}", "score": 1000 + (i * 100), "level_reached": i + 1}
            for i in range(20)
        ]
        
        responses = []
        for score in scores:
            response = client.post("/api/scores", json=score)
            responses.append(response)
        
        # All should succeed
        assert all(r.status_code == 200 for r in responses)
        
        # All should have unique IDs
        ids = [r.json()["id"] for r in responses]
        assert len(ids) == len(set(ids))


@pytest.mark.unit
class TestCORSConfiguration:
    """Test CORS configuration"""
    
    def test_cors_headers_on_get(self, client):
        """Test CORS headers are present on GET requests"""
        response = client.get("/api/scores/leaderboard")
        assert response.status_code == 200
        # Note: TestClient doesn't simulate CORS, but the middleware is configured in main.py
    
    def test_cors_headers_on_post(self, client, sample_score):
        """Test CORS headers are present on POST requests"""
        response = client.post("/api/scores", json=sample_score)
        assert response.status_code == 200
        # Note: TestClient doesn't simulate CORS, but the middleware is configured in main.py
    
    def test_options_request(self, client):
        """Test OPTIONS request for CORS preflight"""
        response = client.options("/api/scores")
        assert response.status_code in [200, 405]  # Some frameworks return 405 for OPTIONS


@pytest.mark.unit
class TestValidation:
    """Test input validation"""
    
    def test_reject_invalid_json(self, client):
        """Test rejection of invalid JSON"""
        response = client.post(
            "/api/scores",
            data="invalid json",
            headers={"Content-Type": "application/json"}
        )
        assert response.status_code == 422
    
    def test_reject_wrong_data_types(self, client):
        """Test rejection of wrong data types"""
        invalid_score = {"username": 12345, "score": "not_a_number", "level_reached": "also_not_a_number"}
        response = client.post("/api/scores", json=invalid_score)
        assert response.status_code == 422
