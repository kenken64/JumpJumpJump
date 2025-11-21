FROM python:3.11-slim

WORKDIR /app

# Install dependencies
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy application code
COPY . .

# Create directory for database
RUN mkdir -p /app/data

# Set default environment variables (can be overridden by Railway)
ENV ALLOWED_ORIGINS=http://localhost:3000,http://localhost:5173
ENV DATA_DIR=/app/data
ENV API_KEY=your-secret-api-key-here

# Expose port (Railway will override with PORT env var)
EXPOSE 8000

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
    CMD python -c "import urllib.request; urllib.request.urlopen('http://localhost:8000/').read()"

# Run with uvicorn
CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8000"]
