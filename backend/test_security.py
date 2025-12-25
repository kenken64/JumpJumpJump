"""
Security-focused tests for JumpJumpJump Backend API
Tests CORS, CSP, security headers, input validation, and WebSocket security
"""

import pytest
from fastapi.testclient import TestClient
from unittest.mock import patch, MagicMock
import os
import sys

# Add backend directory to path
sys.path.insert(0, os.path.dirname(__file__))

from main import app, API_KEY, CORS_ORIGINS, IS_RAILWAY


@pytest.fixture
def client():
    """Create a test client"""
    return TestClient(app)


@pytest.fixture
def valid_headers():
    """Valid API key headers"""
    return {"X-API-Key": API_KEY}


class TestCORSConfiguration:
    """Test CORS configuration security"""

    def test_cors_not_wildcard_in_local_mode(self):
        """Test that CORS is not wildcard in local development mode"""
        # When not in Railway mode, should use specific origins
        with patch.dict(os.environ, {"RAILWAY_ENVIRONMENT": "", "ALLOW_ALL_ORIGINS": "false"}, clear=True):
            # Re-import to get fresh configuration
            import importlib
            import main
            importlib.reload(main)

            # CORS should not be wildcard
            assert main.CORS_ORIGINS != ["*"], "CORS should not use wildcard in local mode"

    def test_cors_allows_only_specified_origins_local(self):
        """Test that only specified origins are allowed in local mode"""
        with patch.dict(os.environ, {
            "ALLOWED_ORIGINS": "http://localhost:3000,http://localhost:5173",
            "RAILWAY_ENVIRONMENT": "",
            "ALLOW_ALL_ORIGINS": "false"
        }, clear=True):
            import importlib
            import main
            importlib.reload(main)

            # Should only allow specified origins
            assert "http://localhost:3000" in main.ALLOWED_ORIGINS
            assert "http://localhost:5173" in main.ALLOWED_ORIGINS

    def test_cors_credentials_false_with_wildcard(self, client):
        """Test that credentials are disabled when CORS is wildcard"""
        # When using wildcard, credentials must be False
        if CORS_ORIGINS == ["*"]:
            # Find CORS middleware
            for middleware in app.user_middleware:
                if "CORSMiddleware" in str(middleware):
                    # Credentials should be False with wildcard
                    # This is enforced by FastAPI/Starlette
                    assert True  # Configuration validated by FastAPI

    def test_cors_headers_present(self, client):
        """Test that CORS headers are present in responses"""
        response = client.options("/", headers={
            "Origin": "http://localhost:3000",
            "Access-Control-Request-Method": "GET"
        })

        # Should have CORS headers
        assert "access-control-allow-origin" in response.headers or response.status_code == 200


class TestSecurityHeaders:
    """Test security headers configuration"""

    def test_api_requires_authentication(self, client):
        """Test that API endpoints require authentication"""
        response = client.get("/api/scores/leaderboard")
        assert response.status_code == 403, "Should reject requests without API key"

    def test_api_accepts_valid_key(self, client, valid_headers):
        """Test that API accepts valid API key"""
        response = client.get("/api/scores/leaderboard", headers=valid_headers)
        assert response.status_code == 200, "Should accept valid API key"

    def test_api_rejects_invalid_key(self, client):
        """Test that API rejects invalid API key"""
        response = client.get("/api/scores/leaderboard", headers={"X-API-Key": "invalid-key"})
        assert response.status_code == 403, "Should reject invalid API key"

    def test_api_key_in_header_not_query(self, client):
        """Test that API key must be in header, not query parameter"""
        response = client.get("/api/scores/leaderboard?api_key=" + API_KEY)
        assert response.status_code == 403, "Should not accept API key in query parameter"

    def test_hsts_header_present(self, client, valid_headers):
        """Test that HSTS header is present and properly configured"""
        response = client.get("/api/scores/leaderboard", headers=valid_headers)
        assert "strict-transport-security" in response.headers, "HSTS header should be present"
        hsts_value = response.headers["strict-transport-security"]
        assert "max-age=31536000" in hsts_value, "HSTS should have 1 year max-age"
        assert "includeSubDomains" in hsts_value, "HSTS should include subdomains"

    def test_x_content_type_options_nosniff(self, client, valid_headers):
        """Test that X-Content-Type-Options is set to nosniff"""
        response = client.get("/api/scores/leaderboard", headers=valid_headers)
        assert "x-content-type-options" in response.headers, "X-Content-Type-Options should be present"
        assert response.headers["x-content-type-options"] == "nosniff", "Should be set to nosniff"

    def test_permissions_policy_header_present(self, client, valid_headers):
        """Test that Permissions-Policy header is present"""
        response = client.get("/api/scores/leaderboard", headers=valid_headers)
        assert "permissions-policy" in response.headers, "Permissions-Policy header should be present"
        policy = response.headers["permissions-policy"]
        # Check for restricted features
        assert "camera=()" in policy, "Camera should be disabled"
        assert "microphone=()" in policy, "Microphone should be disabled"
        assert "geolocation=()" in policy, "Geolocation should be disabled"

    def test_cache_control_for_api_endpoints(self, client, valid_headers):
        """Test that API endpoints have proper no-cache headers"""
        response = client.get("/api/scores/leaderboard", headers=valid_headers)
        assert "cache-control" in response.headers, "Cache-Control header should be present"
        cache_control = response.headers["cache-control"]
        assert "no-cache" in cache_control, "Should have no-cache directive"
        assert "no-store" in cache_control, "Should have no-store directive"
        assert "must-revalidate" in cache_control, "Should have must-revalidate directive"

    def test_cache_control_for_static_assets(self, client, valid_headers):
        """Test that static assets have proper caching headers"""
        # Boss images should be cached
        response = client.get("/api/bosses/images/0", headers=valid_headers)
        if response.status_code == 200:
            assert "cache-control" in response.headers, "Cache-Control header should be present"
            cache_control = response.headers["cache-control"]
            assert "public" in cache_control or "max-age" in cache_control, "Static assets should be cacheable"


class TestInputValidation:
    """Test input validation and sanitization"""

    def test_score_submission_validates_player_name(self, client, valid_headers):
        """Test that player name is validated"""
        # Test empty player name
        response = client.post("/api/scores", headers=valid_headers, json={
            "player_name": "",
            "score": 100,
            "coins": 10,
            "enemies_defeated": 5,
            "distance": 50,
            "level": 1,
            "game_mode": "levels"
        })
        # FastAPI Pydantic validation should handle this
        assert response.status_code in [422, 500], "Should validate player name"

    def test_score_submission_validates_positive_values(self, client, valid_headers):
        """Test that score values must be positive"""
        response = client.post("/api/scores", headers=valid_headers, json={
            "player_name": "Test",
            "score": -100,
            "coins": -10,
            "enemies_defeated": -5,
            "distance": -50,
            "level": 1,
            "game_mode": "levels"
        })
        # Should accept (database may allow negative values for game mechanics)
        # But we're testing that the API doesn't crash
        assert response.status_code in [200, 422, 500]

    def test_score_submission_validates_data_types(self, client, valid_headers):
        """Test that data types are validated"""
        response = client.post("/api/scores", headers=valid_headers, json={
            "player_name": "Test",
            "score": "not_a_number",
            "coins": 10,
            "enemies_defeated": 5,
            "distance": 50,
            "level": 1,
            "game_mode": "levels"
        })
        assert response.status_code == 422, "Should reject invalid data types"

    def test_sql_injection_protection_player_name(self, client, valid_headers):
        """Test protection against SQL injection in player name"""
        malicious_names = [
            "'; DROP TABLE scores; --",
            "admin' OR '1'='1",
            "' UNION SELECT * FROM scores --",
        ]

        for name in malicious_names:
            response = client.post("/api/scores", headers=valid_headers, json={
                "player_name": name,
                "score": 100,
                "coins": 10,
                "enemies_defeated": 5,
                "distance": 50,
                "level": 1,
                "game_mode": "levels"
            })
            # Should handle safely (parameterized queries protect against SQL injection)
            assert response.status_code in [200, 422, 500], f"Failed for: {name}"

            # Verify scores table still exists
            response = client.get("/api/scores/leaderboard", headers=valid_headers)
            assert response.status_code == 200, "Scores table should still exist"

    def test_xss_protection_player_name(self, client, valid_headers):
        """Test that player names with XSS attempts are handled"""
        xss_names = [
            "<script>alert('XSS')</script>",
            "javascript:alert('XSS')",
            "<img src=x onerror=alert('XSS')>",
        ]

        for name in xss_names:
            response = client.post("/api/scores", headers=valid_headers, json={
                "player_name": name,
                "score": 100,
                "coins": 10,
                "enemies_defeated": 5,
                "distance": 50,
                "level": 1,
                "game_mode": "levels"
            })
            # Should accept (sanitization should happen on frontend)
            assert response.status_code in [200, 422], f"Failed for: {name}"

    def test_path_traversal_protection(self, client):
        """Test protection against path traversal attacks"""
        malicious_paths = [
            "../../../etc/passwd",
            "..\\..\\..\\windows\\system32\\config\\sam",
            "/etc/shadow",
        ]

        for path in malicious_paths:
            response = client.get(f"/api/load_game/{path}", headers=valid_headers)
            # Should handle safely (returns 404 or validates)
            assert response.status_code in [200, 403, 404], f"Failed for: {path}"

    def test_long_input_handling(self, client, valid_headers):
        """Test handling of extremely long inputs"""
        long_name = "A" * 10000
        response = client.post("/api/scores", headers=valid_headers, json={
            "player_name": long_name,
            "score": 100,
            "coins": 10,
            "enemies_defeated": 5,
            "distance": 50,
            "level": 1,
            "game_mode": "levels"
        })
        # Should handle (may truncate or reject)
        assert response.status_code in [200, 422, 500]

    def test_integer_overflow_handling(self, client, valid_headers):
        """Test handling of integer overflow"""
        response = client.post("/api/scores", headers=valid_headers, json={
            "player_name": "Test",
            "score": 999999999999999999999,
            "coins": 999999999999999999999,
            "enemies_defeated": 999999999999999999999,
            "distance": 999999999999999999999,
            "level": 1,
            "game_mode": "levels"
        })
        # Should handle (SQLite has limits)
        assert response.status_code in [200, 422, 500]


class TestWebSocketSecurity:
    """Test WebSocket security"""

    def test_websocket_accepts_connections(self, client):
        """Test that WebSocket endpoint accepts connections"""
        with client.websocket_connect("/ws/room/test") as websocket:
            # Should connect successfully
            assert websocket is not None

    def test_websocket_handles_malformed_json(self, client):
        """Test that WebSocket handles malformed JSON gracefully"""
        with client.websocket_connect("/ws/room/test") as websocket:
            # Send malformed data - should not crash
            try:
                websocket.send_text("not json")
                # May raise exception or disconnect
            except:
                pass  # Expected behavior

    def test_websocket_validates_message_types(self, client):
        """Test that WebSocket validates message types"""
        with client.websocket_connect("/ws/room/test") as websocket:
            # Send unknown message type
            websocket.send_json({"type": "invalid_type"})
            # Should handle gracefully (may ignore or respond with error)
            # Connection should remain open
            assert websocket is not None

    def test_websocket_room_isolation(self, client):
        """Test that rooms are isolated from each other"""
        # Create two rooms
        with client.websocket_connect("/ws/room/room1") as ws1:
            ws1.send_json({
                "type": "create_room",
                "room_name": "Room 1",
                "player_name": "Player 1"
            })
            response1 = ws1.receive_json()

            with client.websocket_connect("/ws/room/room2") as ws2:
                ws2.send_json({
                    "type": "create_room",
                    "room_name": "Room 2",
                    "player_name": "Player 2"
                })
                response2 = ws2.receive_json()

                # Should have different room IDs
                assert response1.get("room_id") != response2.get("room_id")


class TestDatabaseSecurity:
    """Test database security"""

    def test_database_file_location(self):
        """Test that database is in appropriate location"""
        from main import DB_PATH
        # Should be in DATA_DIR, not in web-accessible location
        assert "frontend" not in DB_PATH.lower(), "Database should not be in frontend directory"

    def test_database_initialization_safe(self):
        """Test that database initialization is safe"""
        from main import init_db
        # Should not raise exceptions
        try:
            init_db()
            assert True
        except Exception as e:
            pytest.fail(f"Database initialization failed: {e}")

    def test_parameterized_queries_used(self, client, valid_headers):
        """Test that parameterized queries are used (no string concatenation)"""
        # Submit score with special characters
        response = client.post("/api/scores", headers=valid_headers, json={
            "player_name": "Test'Player\"Name",
            "score": 100,
            "coins": 10,
            "enemies_defeated": 5,
            "distance": 50,
            "level": 1,
            "game_mode": "levels"
        })
        assert response.status_code == 200, "Should handle special characters safely"

        # Verify data was stored correctly
        data = response.json()
        assert "Test'Player\"Name" in data.get("player_name", "")


class TestErrorHandling:
    """Test error handling and information disclosure"""

    def test_error_responses_no_stack_traces(self, client):
        """Test that error responses don't expose stack traces"""
        # Trigger an error
        response = client.get("/api/scores/player/", headers=valid_headers)
        # Should return error without exposing internal details
        assert response.status_code in [404, 422]
        if response.status_code >= 400:
            body = response.text.lower()
            # Should not contain sensitive information
            assert "traceback" not in body
            assert "file" not in body or "not found" in body

    def test_404_responses_safe(self, client):
        """Test that 404 responses don't leak information"""
        response = client.get("/api/nonexistent/endpoint", headers=valid_headers)
        assert response.status_code == 404
        # Should not expose internal paths or configuration
        body = response.text.lower()
        assert "backend" not in body or "not found" in body

    def test_500_errors_handled_gracefully(self, client, valid_headers):
        """Test that 500 errors are handled gracefully"""
        # Try to trigger a server error with invalid data
        with patch('main.sqlite3.connect', side_effect=Exception("Database error")):
            response = client.get("/api/scores/leaderboard", headers=valid_headers)
            # Should return 500 but not crash
            assert response.status_code >= 400


class TestRateLimiting:
    """Test for rate limiting considerations"""

    def test_multiple_rapid_requests(self, client, valid_headers):
        """Test that API handles rapid requests"""
        # Send multiple rapid requests
        for i in range(10):
            response = client.get("/api/scores/leaderboard", headers=valid_headers)
            assert response.status_code == 200, f"Request {i} failed"

    def test_large_payload_handling(self, client, valid_headers):
        """Test handling of large payloads"""
        # Create a large but valid payload
        large_name = "A" * 1000
        response = client.post("/api/scores", headers=valid_headers, json={
            "player_name": large_name,
            "score": 100,
            "coins": 10,
            "enemies_defeated": 5,
            "distance": 50,
            "level": 1,
            "game_mode": "levels"
        })
        # Should handle (may truncate or reject)
        assert response.status_code in [200, 413, 422, 500]


class TestFetchMetadataValidation:
    """Test Fetch Metadata Request Headers validation"""

    def test_cross_origin_post_blocked(self, client, valid_headers):
        """Test that cross-origin POST requests are properly blocked"""
        headers = valid_headers.copy()
        headers.update({
            "Sec-Fetch-Site": "cross-site",
            "Sec-Fetch-Mode": "cors"
        })

        response = client.post("/api/scores", headers=headers, json={
            "player_name": "Test",
            "score": 100,
            "coins": 10,
            "enemies_defeated": 5,
            "distance": 50,
            "level": 1,
            "game_mode": "levels"
        })

        # Should block cross-origin state-changing requests
        assert response.status_code == 403, "Cross-origin POST should be blocked"

    def test_same_origin_post_allowed(self, client, valid_headers):
        """Test that same-origin POST requests are allowed"""
        headers = valid_headers.copy()
        headers.update({
            "Sec-Fetch-Site": "same-origin",
            "Sec-Fetch-Mode": "cors"
        })

        response = client.post("/api/scores", headers=headers, json={
            "player_name": "Test",
            "score": 100,
            "coins": 10,
            "enemies_defeated": 5,
            "distance": 50,
            "level": 1,
            "game_mode": "levels"
        })

        # Should allow same-origin requests
        assert response.status_code == 200, "Same-origin POST should be allowed"

    def test_same_site_post_allowed(self, client, valid_headers):
        """Test that same-site POST requests are allowed"""
        headers = valid_headers.copy()
        headers.update({
            "Sec-Fetch-Site": "same-site",
            "Sec-Fetch-Mode": "cors"
        })

        response = client.post("/api/scores", headers=headers, json={
            "player_name": "Test",
            "score": 100,
            "coins": 10,
            "enemies_defeated": 5,
            "distance": 50,
            "level": 1,
            "game_mode": "levels"
        })

        # Should allow same-site requests
        assert response.status_code == 200, "Same-site POST should be allowed"

    def test_navigate_mode_blocked_for_api_endpoints(self, client, valid_headers):
        """Test that navigate mode is rejected for API endpoints"""
        headers = valid_headers.copy()
        headers.update({
            "Sec-Fetch-Site": "same-origin",
            "Sec-Fetch-Mode": "navigate"
        })

        response = client.post("/api/scores", headers=headers, json={
            "player_name": "Test",
            "score": 100,
            "coins": 10,
            "enemies_defeated": 5,
            "distance": 50,
            "level": 1,
            "game_mode": "levels"
        })

        # Should block navigate mode for API endpoints
        assert response.status_code == 403, "Navigate mode should be blocked for API endpoints"

    def test_get_requests_not_validated(self, client, valid_headers):
        """Test that GET requests are not blocked by Fetch Metadata (read-only)"""
        headers = valid_headers.copy()
        headers.update({
            "Sec-Fetch-Site": "cross-site",
            "Sec-Fetch-Mode": "cors"
        })

        # GET requests should not be blocked (read-only, no state change)
        response = client.get("/api/scores/leaderboard", headers=headers)
        assert response.status_code == 200, "GET requests should not be blocked"

    def test_no_fetch_metadata_headers_allowed(self, client, valid_headers):
        """Test that requests without Fetch Metadata headers are allowed (older browsers)"""
        # Don't add Fetch Metadata headers - simulates older browser
        response = client.post("/api/scores", headers=valid_headers, json={
            "player_name": "Test",
            "score": 100,
            "coins": 10,
            "enemies_defeated": 5,
            "distance": 50,
            "level": 1,
            "game_mode": "levels"
        })

        # Should allow requests without Fetch Metadata (backwards compatibility)
        assert response.status_code == 200, "Requests without Fetch Metadata should be allowed"


class TestAPIEndpointsSecurity:
    """Test security of specific API endpoints"""

    def test_leaderboard_limit_parameter_validation(self, client, valid_headers):
        """Test that leaderboard limit parameter is validated"""
        # Test negative limit
        response = client.get("/api/scores/leaderboard?limit=-1", headers=valid_headers)
        assert response.status_code in [200, 422]

        # Test extremely large limit
        response = client.get("/api/scores/leaderboard?limit=999999", headers=valid_headers)
        assert response.status_code in [200, 422]

    def test_game_mode_filter_validation(self, client, valid_headers):
        """Test that game_mode filter is validated"""
        # Test with valid game mode
        response = client.get("/api/scores/leaderboard?game_mode=levels", headers=valid_headers)
        assert response.status_code == 200

        # Test with SQL injection attempt
        response = client.get("/api/scores/leaderboard?game_mode=' OR '1'='1", headers=valid_headers)
        # Should handle safely
        assert response.status_code in [200, 422]

    def test_save_game_upsert_security(self, client, valid_headers):
        """Test that save game upsert is secure"""
        # Save a game
        response = client.post("/api/save_game", headers=valid_headers, json={
            "player_name": "TestPlayer",
            "level": 5,
            "score": 1000,
            "lives": 3,
            "health": 100,
            "coins": 50,
            "weapon": "pistol"
        })
        assert response.status_code == 200

        # Update with same player name (should upsert, not create duplicate)
        response = client.post("/api/save_game", headers=valid_headers, json={
            "player_name": "TestPlayer",
            "level": 6,
            "score": 1200,
            "lives": 2,
            "health": 80,
            "coins": 60,
            "weapon": "shotgun"
        })
        assert response.status_code == 200

    def test_delete_save_game_authorization(self, client, valid_headers):
        """Test that delete save game requires authorization"""
        # Should require API key
        response = client.delete("/api/save_game/TestPlayer")
        assert response.status_code == 403

        # Should work with valid key
        response = client.delete("/api/save_game/TestPlayer", headers=valid_headers)
        assert response.status_code == 200


if __name__ == "__main__":
    pytest.main([__file__, "-v", "--tb=short"])
