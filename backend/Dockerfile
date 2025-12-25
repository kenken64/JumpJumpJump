# Multi-stage build for optimized production image
# Using Python 3.11-slim-bookworm (Debian 12) - Latest stable version
# Base image updated: 2025-12-25
#
# Known CVEs without fixes (accepted risk):
# - CVE-2025-14104 (util-linux packages: bsdutils, libblkid1, libmount1) - MEDIUM severity
# - CVE-2025-30258 (gnupg packages: gpgv) - MEDIUM severity
# - Multiple LOW severity CVEs in base packages (apt, bash, coreutils, libc6, gcc)
#
# Mitigation strategy:
# - Using minimal slim-bookworm variant to reduce attack surface
# - Running as non-root user (appuser)
# - Regular security updates via apt-get upgrade
# - Monitoring for security patches and rebuilding images regularly
FROM python:3.11-slim-bookworm

WORKDIR /app

# Create non-root user
RUN groupadd -r -g 1001 appgroup && \
    useradd -r -u 1001 -g appgroup appuser

# Update system packages to fix vulnerabilities (including zlib1g and libsqlite3-0)
RUN apt-get update && \
    apt-get install -y --no-install-recommends libsqlite3-0 && \
    apt-get upgrade -y && \
    rm -rf /var/lib/apt/lists/*

# Install dependencies
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy application code
COPY --chown=appuser:appgroup . .

# Create directory for database with correct ownership
RUN mkdir -p /app/data && chown -R appuser:appgroup /app/data

# Set default environment variables (can be overridden by Railway)
# Note: API_KEY should be set at runtime via environment variable, not in Dockerfile
ENV ALLOWED_ORIGINS=http://localhost:3000,http://localhost:5173
ENV DATA_DIR=/app/data

# Set default PORT to 8000 if not provided by Railway
ENV PORT=8000

# Expose port (Railway will override with PORT env var)
EXPOSE 8000

# Health check (use PORT env var)
# Note: Using Python's urllib instead of curl to avoid additional dependencies
# This checks the root endpoint which should return a 200 OK response
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
    CMD python -c "import urllib.request, os, sys; urllib.request.urlopen(f'http://localhost:{os.getenv(\"PORT\", \"8000\")}/').read()" || exit 1
# Switch to non-root user
USER appuser
# Run with uvicorn using PORT env var (use sh -c for proper variable expansion)
CMD ["/bin/sh", "-c", "uvicorn main:app --host 0.0.0.0 --port ${PORT}"]
