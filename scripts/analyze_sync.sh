#!/bin/bash
echo "Running Sync Analysis..."

# Get the script directory
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"
BACKEND_PATH="$PROJECT_ROOT/backend"
ANALYSIS_SCRIPT="$BACKEND_PATH/analyze_sync.py"

if [ -f "$ANALYSIS_SCRIPT" ]; then
    # Change to backend directory to ensure relative paths work
    cd "$BACKEND_PATH"
    
    # Check for python command
    if command -v python3 &> /dev/null; then
        python3 analyze_sync.py "$@"
    elif command -v python &> /dev/null; then
        python analyze_sync.py "$@"
    else
        echo "Error: Python not found."
    fi
else
    echo "Error: analyze_sync.py not found at $ANALYSIS_SCRIPT"
fi

read -p "Press enter to exit..."
