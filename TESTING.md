# Testing Guide for Jump Jump Jump

This guide explains how to run tests for both the frontend and backend of the Jump Jump Jump game.

## Table of Contents

- [Frontend Tests](#frontend-tests)
- [Backend Tests](#backend-tests)
- [CI/CD Integration](#cicd-integration)
- [Test Coverage](#test-coverage)

---

## Frontend Tests

The frontend uses **Vitest** as the testing framework, along with React Testing Library for component tests.

### Setup Frontend Testing

1. **Install dependencies** (including test dependencies):

```bash
cd frontend
npm install --save-dev vitest @vitest/ui @vitest/coverage-v8 jsdom @testing-library/react @testing-library/jest-dom @testing-library/user-event
```

2. **Update package.json** with test scripts:

The test scripts are already configured in `package.json`:
- `npm test` - Run tests in watch mode
- `npm run test:ui` - Run tests with UI
- `npm run test:coverage` - Run tests with coverage report

### Running Frontend Tests

```bash
cd frontend

# Run all tests
npm test

# Run tests with UI
npm run test:ui

# Run tests with coverage
npm run test:coverage

# Run tests in CI mode (single run, no watch)
npm test -- --run

# Run specific test file
npm test -- LevelManager.test.ts

# Run tests matching a pattern
npm test -- --grep="Level Configuration"
```

### Frontend Test Structure

```
frontend/
├── src/
│   ├── game/
│   │   ├── managers/
│   │   │   ├── LevelManager.ts
│   │   │   └── LevelManager.test.ts      # Unit tests for LevelManager
│   │   ├── apiConfig.ts
│   │   └── apiConfig.test.ts             # Unit tests for API config
│   └── test/
│       └── setup.ts                      # Test setup and mocks
├── vitest.config.ts                      # Vitest configuration
└── package.json
```

### Frontend Test Coverage

The frontend tests cover:

✅ **LevelManager** (200+ test cases):
- Level initialization and progression
- Difficulty configuration (Easy, Medium, Hard, Expert)
- Vehicle unlocking system
- Score multipliers
- Level reset and setting
- Boundary conditions

✅ **API Configuration**:
- Endpoint URLs
- URL construction
- Configuration validation

### Writing New Frontend Tests

Example test for a new component:

```typescript
import { describe, it, expect, beforeEach } from 'vitest';
import { YourComponent } from './YourComponent';

describe('YourComponent', () => {
  beforeEach(() => {
    // Setup code
  });

  it('should do something', () => {
    // Test code
    expect(result).toBe(expected);
  });
});
```

---

## Backend Tests

The backend uses **pytest** as the testing framework with FastAPI TestClient.

### Setup Backend Testing

1. **Install test dependencies**:

```bash
cd backend

# Create/activate virtual environment
python -m venv venv
# Windows:
venv\Scripts\activate
# Mac/Linux:
source venv/bin/activate

# Install test dependencies
pip install -r requirements-dev.txt
```

The `requirements-dev.txt` includes:
- pytest
- pytest-asyncio
- pytest-cov
- httpx (for async client)

### Running Backend Tests

```bash
cd backend

# Run all tests
pytest

# Run with verbose output
pytest -v

# Run with coverage
pytest --cov=. --cov-report=html --cov-report=term-missing

# Run specific test file
pytest tests/test_api.py

# Run specific test class
pytest tests/test_api.py::TestScoreSubmission

# Run specific test
pytest tests/test_api.py::TestScoreSubmission::test_submit_score_success

# Run tests by marker
pytest -m api           # Run API tests only
pytest -m unit          # Run unit tests only
pytest -m integration   # Run integration tests only

# Run with coverage and generate HTML report
pytest --cov=. --cov-report=html
# Open htmlcov/index.html in browser
```

### Backend Test Structure

```
backend/
├── tests/
│   ├── __init__.py
│   ├── conftest.py                       # Test fixtures and configuration
│   └── test_api.py                       # API endpoint tests
├── main.py
├── requirements.txt
├── requirements-dev.txt
└── pyproject.toml                        # Pytest configuration
```

### Backend Test Coverage

The backend tests cover:

✅ **Health Endpoint**:
- Health check response
- CORS headers

✅ **Score Submission** (10+ test cases):
- Successful submission
- Missing fields validation
- Invalid data types
- Edge cases (negative scores, empty usernames, etc.)
- Multiple submissions
- Special characters

✅ **Leaderboard** (10+ test cases):
- Empty leaderboard
- Single score
- Sorted by score (descending)
- Default limit (10)
- Custom limits
- Timestamp inclusion
- Field validation

✅ **User Scores** (6+ test cases):
- Non-existent user
- Single score
- Multiple scores
- Custom limits
- Case sensitivity

✅ **Database Operations**:
- Score persistence
- Concurrent submissions
- Unique IDs

✅ **CORS Configuration**:
- Headers on GET
- Headers on POST
- OPTIONS preflight

✅ **Input Validation**:
- Invalid JSON
- Wrong data types

### Test Markers

Tests are organized with pytest markers:

- `@pytest.mark.api` - API endpoint tests
- `@pytest.mark.unit` - Unit tests
- `@pytest.mark.integration` - Integration tests

### Writing New Backend Tests

Example test for a new endpoint:

```python
import pytest
from fastapi.testclient import TestClient

@pytest.mark.api
class TestNewEndpoint:
    def test_new_feature(self, client):
        response = client.get("/api/new-endpoint")
        assert response.status_code == 200
        assert response.json()["key"] == "expected_value"
```

---

## CI/CD Integration

### GitHub Actions Example

Create `.github/workflows/test.yml`:

```yaml
name: Tests

on: [push, pull_request]

jobs:
  frontend-tests:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: '18'
      - name: Install dependencies
        working-directory: ./frontend
        run: npm ci
      - name: Run tests
        working-directory: ./frontend
        run: npm test -- --run
      - name: Generate coverage
        working-directory: ./frontend
        run: npm run test:coverage -- --run

  backend-tests:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-python@v4
        with:
          python-version: '3.10'
      - name: Install dependencies
        working-directory: ./backend
        run: |
          python -m pip install --upgrade pip
          pip install -r requirements-dev.txt
      - name: Run tests
        working-directory: ./backend
        run: pytest --cov=. --cov-report=xml
      - name: Upload coverage
        uses: codecov/codecov-action@v3
        with:
          file: ./backend/coverage.xml
```

---

## Test Coverage

### Viewing Coverage Reports

**Frontend:**
```bash
cd frontend
npm run test:coverage
# Open coverage/index.html in browser
```

**Backend:**
```bash
cd backend
pytest --cov=. --cov-report=html
# Open htmlcov/index.html in browser
```

### Coverage Goals

- **Frontend**: Target 80%+ coverage for game logic
- **Backend**: Target 90%+ coverage for API endpoints

### Current Coverage

**Frontend:**
- ✅ LevelManager: 100% coverage
- ✅ API Config: 100% coverage
- 🔄 Game Scenes: In progress
- 🔄 Entities: In progress

**Backend:**
- ✅ API Endpoints: 95%+ coverage
- ✅ Database Operations: 90%+ coverage
- ✅ Validation: 100% coverage

---

## Best Practices

### Frontend

1. **Mock Phaser objects** - Use the setup in `src/test/setup.ts`
2. **Test game logic separately** - Unit test managers and entities
3. **Avoid testing Phaser internals** - Focus on your game logic
4. **Use descriptive test names** - Clearly state what is being tested
5. **Group related tests** - Use describe blocks

### Backend

1. **Use test database** - Fixtures in `conftest.py` create isolated test DBs
2. **Test happy path and edge cases** - Cover both success and failure scenarios
3. **Use markers** - Organize tests with @pytest.mark
4. **Test validation** - Ensure invalid inputs are rejected properly
5. **Clean up resources** - Use fixtures with teardown

### General

1. **Write tests first** (TDD) when adding new features
2. **Keep tests fast** - Mock external dependencies
3. **Make tests independent** - Each test should be able to run alone
4. **Test behavior, not implementation** - Focus on what, not how
5. **Maintain high coverage** - But prioritize meaningful tests over 100% coverage

---

## Troubleshooting

### Frontend Issues

**"Cannot find module 'vitest'"**
```bash
cd frontend
npm install --save-dev vitest
```

**"Phaser is not defined"**
- Check that `src/test/setup.ts` is loaded
- Verify `setupFiles` in `vitest.config.ts`

**Canvas errors**
- The setup file mocks canvas methods
- Check `HTMLCanvasElement.prototype.getContext` mock

### Backend Issues

**"No module named 'pytest'"**
```bash
pip install pytest pytest-asyncio pytest-cov
```

**Database errors**
- Tests use isolated test database (`test_scores.db`)
- Check `conftest.py` fixtures
- Ensure proper cleanup in fixtures

**Import errors**
```bash
# Add parent directory to Python path
export PYTHONPATH="${PYTHONPATH}:$(pwd)"
```

---

## Quick Reference

### Frontend Commands
```bash
npm test                    # Run tests (watch mode)
npm run test:ui            # Run with UI
npm run test:coverage      # Run with coverage
npm test -- --run          # Single run (CI mode)
```

### Backend Commands
```bash
pytest                                    # Run all tests
pytest -v                                # Verbose output
pytest --cov=. --cov-report=html        # With coverage
pytest -m api                           # API tests only
pytest tests/test_api.py::TestClass     # Specific class
```

---

## Contributing

When adding new features:

1. ✅ Write tests first (TDD)
2. ✅ Ensure all tests pass
3. ✅ Maintain or improve coverage
4. ✅ Update this documentation if needed

---

**Happy Testing! 🧪**
