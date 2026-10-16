#!/usr/bin/env bash
#
# Production deploy — run on the server by .github/workflows/deploy.yml.
#
#   bash scripts/deploy.sh <commit-sha> [--full]
#
# - Refuses to run if someone edited tracked files on the server.
# - Backs up the database before applying new migrations.
# - Rebuilds only what changed (backend / frontend); --full forces both.
# - Builds the frontend into .next-build and swaps it in only on success,
#   so a failed build leaves the live site untouched.
# - Health-checks both apps and exits non-zero on any failure.

set -Eeuo pipefail

APP_DIR="${APP_DIR:-/root/peptide_project}"
BACKEND_PM2="${BACKEND_PM2:-peptidedosage-backend}"
FRONTEND_PM2="${FRONTEND_PM2:-peptidedosage-frontend}"
BACKEND_HEALTH="${BACKEND_HEALTH:-http://127.0.0.1:4000/api/health}"
FRONTEND_HEALTH="${FRONTEND_HEALTH:-http://127.0.0.1:3000/}"
BACKUP_DIR="${BACKUP_DIR:-/root/db_backups}"
BRANCH="${BRANCH:-master}"

TARGET_SHA="${1:?usage: deploy.sh <commit-sha> [--full]}"
FULL="${2:-}"

log()  { printf '\n\033[1;34m==>\033[0m %s\n' "$*"; }
fail() { printf '\n\033[1;31mDEPLOY FAILED:\033[0m %s\n' "$*" >&2; exit 1; }
trap 'fail "command failed on line $LINENO: $BASH_COMMAND"' ERR

wait_for() { # url, name
  for _ in $(seq 1 30); do
    if curl -fsS -o /dev/null --max-time 5 "$1"; then echo "$2 healthy"; return 0; fi
    sleep 2
  done
  echo "$2 did not become healthy at $1" >&2
  return 1
}

# Only one deploy at a time, even if triggered twice.
exec 9>/tmp/peptide-deploy.lock
flock -n 9 || fail "another deploy is already running"

cd "$APP_DIR"

log "Checking server working tree"
if ! git diff --quiet || ! git diff --cached --quiet; then
  git status --short
  fail "tracked files were modified on the server; commit or discard them first"
fi

PREV_SHA="$(git rev-parse HEAD)"
log "Updating code: ${PREV_SHA:0:7} -> ${TARGET_SHA:0:7}"
git fetch --quiet origin "$BRANCH"
git checkout --quiet "$BRANCH"
git reset --quiet --hard "$TARGET_SHA"
git log --oneline -1

if [[ "$FULL" == "--full" || "$PREV_SHA" == "$TARGET_SHA" ]]; then
  CHANGED="backend/ frontend/"
else
  CHANGED="$(git diff --name-only "$PREV_SHA" "$TARGET_SHA")"
fi
changed() { grep -q "^$1" <<<"$CHANGED"; }

# ── Backend ──────────────────────────────────────────────────────────
if changed backend/; then
  cd "$APP_DIR/backend"

  if changed backend/package-lock.json || changed backend/package.json || [[ ! -d node_modules ]]; then
    log "Installing backend dependencies"
    npm ci --no-audit --no-fund
  fi

  # Generated on the server and never printed.
  if ! grep -q '^ADMIN_JWT_SECRET=' .env; then
    log "Adding ADMIN_JWT_SECRET to backend/.env"
    printf '\n# Admin panel token signing key\nADMIN_JWT_SECRET=%s\n' "$(openssl rand -hex 48)" >> .env
  fi

  STATUS="$(npx --no-install sequelize-cli db:migrate:status)"
  PENDING="$(grep -c '^down' <<<"$STATUS" || true)"
  if [[ "$PENDING" -gt 0 ]]; then
    DB_NAME="$(grep -E '^DB_NAME=' .env | cut -d= -f2-)"
    mkdir -p "$BACKUP_DIR"
    BACKUP="$BACKUP_DIR/${DB_NAME}-$(date +%Y%m%d-%H%M%S)-${TARGET_SHA:0:7}.sql.gz"
    log "Backing up database before $PENDING migration(s) -> $BACKUP"
    sudo -u postgres pg_dump "$DB_NAME" | gzip > "$BACKUP"
    # Keep the 20 most recent backups.
    ls -1t "$BACKUP_DIR"/*.sql.gz 2>/dev/null | tail -n +21 | xargs -r rm -f

    log "Running migrations"
    npx --no-install sequelize-cli db:migrate
  fi

  log "Restarting backend"
  pm2 restart "$BACKEND_PM2" --update-env
  wait_for "$BACKEND_HEALTH" "backend" || fail "backend failed its health check (see: pm2 logs $BACKEND_PM2)"

  if [[ "$(node -e "
    require('dotenv').config();
    const { Admin, sequelize } = require('./src/models');
    Admin.count().then((n) => { console.log(n); return sequelize.close(); }).catch(() => console.log(-1));
  " 2>/dev/null | tail -1)" == "0" ]]; then
    echo "NOTE: no admin account exists yet. Create one with: cd $APP_DIR/backend && npm run admin:create"
  fi
else
  log "No backend changes"
fi

# ── Frontend ─────────────────────────────────────────────────────────
if changed frontend/; then
  cd "$APP_DIR/frontend"

  if changed frontend/package-lock.json || changed frontend/package.json || [[ ! -d node_modules ]]; then
    log "Installing frontend dependencies"
    npm ci --no-audit --no-fund
  fi

  log "Building frontend (live site keeps serving the old build)"
  rm -rf .next-build
  NEXT_DIST_DIR=.next-build npm run build

  log "Swapping in the new build and restarting"
  rm -rf .next-prev
  [[ -d .next ]] && mv .next .next-prev
  mv .next-build .next
  pm2 restart "$FRONTEND_PM2" --update-env

  if ! wait_for "$FRONTEND_HEALTH" "frontend"; then
    log "New build unhealthy — rolling back to the previous build"
    rm -rf .next && mv .next-prev .next
    pm2 restart "$FRONTEND_PM2" --update-env
    fail "frontend failed its health check; previous build restored"
  fi
else
  log "No frontend changes"
fi

pm2 save >/dev/null
log "Deployed ${TARGET_SHA:0:7} successfully"
