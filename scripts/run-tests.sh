#!/bin/bash

# Test Runner Script for Jump Jump Jump
# This script runs both frontend and backend tests

set -e  # Exit on error

echo "======================================"
echo "Jump Jump Jump - Test Runner"
echo "======================================"
echo ""

# Colors for output
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Function to print colored output
print_success() {
    echo -e "${GREEN}✓ $1${NC}"
}

print_error() {
    echo -e "${RED}✗ $1${NC}"
}

print_info() {
    echo -e "${YELLOW}ℹ $1${NC}"
}

# Track overall success
FRONTEND_SUCCESS=true
BACKEND_SUCCESS=true

# Run Frontend Tests
echo "======================================"
echo "Running Frontend Tests..."
echo "======================================"
echo ""

cd frontend

if [ ! -d "node_modules" ]; then
    print_info "Installing frontend dependencies..."
    npm install
fi

if npm test -- --run; then
    print_success "Frontend tests passed!"
else
    print_error "Frontend tests failed!"
    FRONTEND_SUCCESS=false
fi

echo ""
cd ..

# Run Backend Tests
echo "======================================"
echo "Running Backend Tests..."
echo "======================================"
echo ""

cd backend

if [ ! -d "venv" ]; then
    print_info "Creating Python virtual environment..."
    python -m venv venv
fi

# Activate virtual environment
source venv/bin/activate

# Install dependencies
print_info "Installing backend dependencies..."
pip install -q -r requirements.txt
pip install -q -r requirements-dev.txt

if pytest -v; then
    print_success "Backend tests passed!"
else
    print_error "Backend tests failed!"
    BACKEND_SUCCESS=false
fi

deactivate
cd ..

# Summary
echo ""
echo "======================================"
echo "Test Summary"
echo "======================================"
echo ""

if [ "$FRONTEND_SUCCESS" = true ] && [ "$BACKEND_SUCCESS" = true ]; then
    print_success "All tests passed! 🎉"
    exit 0
else
    if [ "$FRONTEND_SUCCESS" = false ]; then
        print_error "Frontend tests failed"
    fi
    if [ "$BACKEND_SUCCESS" = false ]; then
        print_error "Backend tests failed"
    fi
    exit 1
fi
