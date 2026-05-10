#!/bin/bash
# ==============================================================================
# Spectre — HF Spaces Startup Script
#
# Workflow:
#   1. Initialize PostgreSQL data directory (first run only)
#   2. Start PostgreSQL temporarily
#   3. Create database + user
#   4. Run Alembic migrations
#   5. Stop temporary PostgreSQL
#   6. Launch supervisord (manages all processes)
# ==============================================================================

set -e

echo "=============================================="
echo "  Spectre — Starting up on Hugging Face Spaces"
echo "=============================================="

# ---- Ensure PATH includes venv ----
export PATH="/app/.venv/bin:$PATH"
export PYTHONPATH="/app/src:$PYTHONPATH"
export PYTHONUNBUFFERED=1

# ---- Auto-detect PostgreSQL version ----
PG_VERSION=$(ls /usr/lib/postgresql/ | head -1)
PG_BIN="/usr/lib/postgresql/${PG_VERSION}/bin"

echo "[init] Detected PostgreSQL version: ${PG_VERSION}"
echo "[init] PostgreSQL binaries: ${PG_BIN}"

# ---- Configuration ----
PG_DATA="/var/lib/postgresql/data"
DB_NAME="spectre"
DB_USER="spectre"
DB_PASS="spectre"

# ---- Step 1: Initialize PostgreSQL (first run only) ----
if [ ! -f "$PG_DATA/PG_VERSION" ]; then
    echo "[init] Initializing PostgreSQL data directory..."
    su postgres -c "$PG_BIN/initdb -D $PG_DATA --encoding=UTF8 --locale=C"

    # Overwrite pg_hba.conf to allow local trust connections
    # (default pg_hba.conf has restrictive peer auth at the top)
    cat > "$PG_DATA/pg_hba.conf" <<EOF
# TYPE  DATABASE        USER            ADDRESS                 METHOD
local   all             all                                     trust
host    all             all             127.0.0.1/32            trust
host    all             all             ::1/128                 trust
EOF

    # Tune PostgreSQL for container environment (low memory)
    cat >> "$PG_DATA/postgresql.conf" <<EOF

# --- HF Spaces tuning ---
shared_buffers = 64MB
work_mem = 4MB
maintenance_work_mem = 32MB
effective_cache_size = 128MB
max_connections = 30
logging_collector = off
log_min_messages = warning
EOF

    echo "[init] PostgreSQL data directory initialized."
else
    echo "[init] PostgreSQL data directory already exists, skipping initdb."
fi

# ---- Step 2: Start PostgreSQL temporarily ----
echo "[init] Starting PostgreSQL temporarily for setup..."
su postgres -c "$PG_BIN/pg_ctl -D $PG_DATA -l /tmp/pg_init.log start -w -t 60"

# Wait for PostgreSQL to be ready
READY=false
for i in $(seq 1 30); do
    if su postgres -c "$PG_BIN/pg_isready -q" 2>/dev/null; then
        echo "[init] PostgreSQL is ready."
        READY=true
        break
    fi
    echo "[init] Waiting for PostgreSQL... ($i/30)"
    sleep 1
done

if [ "$READY" != "true" ]; then
    echo "[init] ERROR: PostgreSQL failed to start. Check /tmp/pg_init.log"
    cat /tmp/pg_init.log 2>/dev/null || true
    exit 1
fi

# ---- Step 3: Create database and user ----
echo "[init] Creating database and user..."

# Create user if not exists
su postgres -c "psql -tc \"SELECT 1 FROM pg_roles WHERE rolname='$DB_USER'\"" | grep -q 1 \
    || su postgres -c "psql -c \"CREATE ROLE $DB_USER WITH LOGIN PASSWORD '$DB_PASS';\""

# Create database if not exists
su postgres -c "psql -tc \"SELECT 1 FROM pg_database WHERE datname='$DB_NAME'\"" | grep -q 1 \
    || su postgres -c "psql -c \"CREATE DATABASE $DB_NAME OWNER $DB_USER;\""

# Grant privileges
su postgres -c "psql -c \"GRANT ALL PRIVILEGES ON DATABASE $DB_NAME TO $DB_USER;\""

# Grant schema permissions (required for PostgreSQL 15+)
su postgres -c "psql -d $DB_NAME -c \"GRANT ALL ON SCHEMA public TO $DB_USER;\""
su postgres -c "psql -d $DB_NAME -c \"ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON TABLES TO $DB_USER;\""
su postgres -c "psql -d $DB_NAME -c \"ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON SEQUENCES TO $DB_USER;\""

echo "[init] Database '$DB_NAME' with user '$DB_USER' ready."

# ---- Step 4: Run Alembic migrations ----
echo "[init] Running database migrations..."
cd /app

# Check if there are migration version files to apply
if ls migrations/versions/*.py 1>/dev/null 2>&1; then
    echo "[init] Found migration files, running alembic upgrade head..."
    python -m alembic upgrade head || {
        echo "[init] WARNING: Migration failed — the app may still start but DB schema might be incomplete."
        echo "[init] Check the Alembic output above for details."
    }
    echo "[init] Migrations complete."
else
    echo "[init] No migration files found in migrations/versions/, skipping."
fi

# ---- Step 4.5: Run database seeds ----
echo "[init] Running database seeds (creates default tenant & API key)..."
python -m seeds all || {
    echo "[init] WARNING: Seeding failed."
}

# ---- Step 5: Stop temporary PostgreSQL ----
echo "[init] Stopping temporary PostgreSQL (supervisord will manage it)..."
su postgres -c "$PG_BIN/pg_ctl -D $PG_DATA stop -w -t 10" || true
sleep 2

# ---- Step 6: Update supervisord config with detected PG version ----
# Replace the PostgreSQL binary path in supervisord config
sed -i "s|/usr/lib/postgresql/15/bin/postgres|${PG_BIN}/postgres|g" /etc/supervisor/conf.d/spectre.conf

# ---- Step 7: Launch supervisord ----
echo "=============================================="
echo "  Spectre — All services launching via supervisord"
echo "  API will be available on port 7860"
echo "=============================================="
echo ""
echo "  Services:"
echo "    ✓ PostgreSQL ${PG_VERSION} (localhost:5432)"
echo "    ✓ Redis (localhost:6379)"
echo "    ✓ FastAPI API (0.0.0.0:7860)"
echo "    ✓ Celery Worker"
echo ""

exec /usr/bin/supervisord -c /etc/supervisor/conf.d/spectre.conf
