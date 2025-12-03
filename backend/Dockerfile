FROM python:3.11-slim

WORKDIR /app

# Install system dependencies
RUN apt-get update && apt-get install -y \
    gcc \
    && rm -rf /var/lib/apt/lists/*

# Copy requirements
COPY requirements.txt .

# Install Python dependencies
RUN pip install --no-cache-dir -r requirements.txt

# Copy application code
COPY . .

# Create directory for database if it doesn't exist
RUN mkdir -p /app/data

# Expose port (Railway will use PORT env variable)
EXPOSE 8000

# Set environment variable for uvicorn
ENV PORT=8000

# Start the FastAPI application
CMD uvicorn main:app --host 0.0.0.0 --port $PORT
