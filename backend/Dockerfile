FROM python:3.11-slim-bookworm

WORKDIR /app

# Create non-root user
RUN groupadd -r -g 1001 appgroup && \
    useradd -r -u 1001 -g appgroup appuser

# Install dependencies
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy application code
COPY --chown=appuser:appgroup . .

# Create directory for database with correct ownership
RUN mkdir -p /app/data && chown -R appuser:appgroup /app/data

# Set default environment variables (can be overridden by Railway)
ENV ALLOWED_ORIGINS=http://localhost:3000,http://localhost:5173
ENV DATA_DIR=/app/data
ENV API_KEY=your-secret-api-key-here

# Set default PORT to 8000 if not provided by Railway
ENV PORT=8000

# Expose port (Railway will override with PORT env var)
EXPOSE 8000

# Health check (use PORT env var)
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
    CMD python -c "import urllib.request, os; urllib.request.urlopen(f'http://localhost:{os.getenv(\"PORT\", \"8000\")}/').read()"
# Switch to non-root user
USER appuser
# Run with uvicorn using PORT env var (use sh -c for proper variable expansion)
CMD ["/bin/sh", "-c", "uvicorn main:app --host 0.0.0.0 --port ${PORT}"]
