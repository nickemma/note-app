## For Production
#FROM python:3.10-slim AS builder
#WORKDIR /app
#
## Install build dependencies
#RUN apt-get update && \
#    apt-get install -y --no-install-recommends gcc python3-dev && \
#    apt-get clean && \
#    rm -rf /var/lib/apt/lists/*
#
## Copy requirements first for better caching
#COPY requirements.txt .
#RUN pip install --user --no-cache-dir -r requirements.txt
#
## Second stage
#FROM python:3.10-slim
#WORKDIR /app
#
## Copy installed packages from builder
#COPY --from=builder /root/.local /root/.local
#ENV PATH=/root/.local/bin:$PATH
#
## Copy application code
#COPY . .
#
#EXPOSE 8000
#CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8000"]

# For Development
FROM python:3.10-slim

WORKDIR /app

# Copy requirements first for better caching
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Add uvicorn with reload capability
RUN pip install --no-cache-dir uvicorn

# mount the source code as a volume
EXPOSE 8000

# Use uvicorn with reload flag for development
CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8000", "--reload"]