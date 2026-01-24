#!/usr/bin/env bash

set -e

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
COMPOSE_FILE="docker-compose.prod.yml"
APP_CONTAINER="findfriend-app"
BACKUP_DIR="./backups"
DEPLOY_DATE=$(date +%Y%m%d_%H%M%S)

# Helper functions
echo_info() {
    echo -e "${BLUE}ℹ${NC} $1"
}

echo_success() {
    echo -e "${GREEN}✓${NC} $1"
}

echo_error() {
    echo -e "${RED}✗${NC} $1"
}

echo_warning() {
    echo -e "${YELLOW}⚠${NC} $1"
}

# Ensure .env exists
if [ ! -f .env ]; then
    echo_error ".env file not found!"
    exit 1
fi

# Load environment
source .env

echo_info "Starting deployment at $DEPLOY_DATE"
echo ""

# 1. Create backup directory
mkdir -p "$BACKUP_DIR"

# 2. Backup database
echo_info "Creating database backup..."
docker compose -f "$COMPOSE_FILE" exec -T postgres \
    pg_dump -U "$DB_USERNAME" "$DB_DATABASE" | gzip > "$BACKUP_DIR/db_backup_$DEPLOY_DATE.sql.gz"
echo_success "Database backed up to $BACKUP_DIR/db_backup_$DEPLOY_DATE.sql.gz"
echo ""

# 3. Pull latest code
echo_info "Pulling latest code..."
git pull origin main
echo_success "Code updated"
echo ""

# 4. Login to container registry
echo_info "Logging in to container registry..."
echo "$GHCR_TOKEN" | docker login ghcr.io -u "$GHCR_USERNAME" --password-stdin
echo_success "Logged in to registry"
echo ""

# 5. Pull latest images
echo_info "Pulling latest Docker images..."
docker compose -f "$COMPOSE_FILE" pull
echo_success "Images pulled"
echo ""

# 6. Stop old containers (gracefully)
echo_info "Stopping old containers..."
docker compose -f "$COMPOSE_FILE" stop app
echo_success "Containers stopped"
echo ""

# 7. Run database migrations (before starting new containers)
echo_info "Running database migrations..."
docker compose -f "$COMPOSE_FILE" run --rm app php artisan migrate --force
echo_success "Migrations completed"
echo ""

# 8. Start new containers
echo_info "Starting new containers..."
docker compose -f "$COMPOSE_FILE" up -d --remove-orphans
echo_success "Containers started"
echo ""

# 9. Wait for application to be ready
echo_info "Waiting for application to be ready..."
sleep 10

# Check health
MAX_ATTEMPTS=30
ATTEMPT=0
while [ $ATTEMPT -lt $MAX_ATTEMPTS ]; do
    if curl -sf http://localhost/health > /dev/null 2>&1; then
        echo_success "Application is healthy"
        break
    fi
    ATTEMPT=$((ATTEMPT + 1))
    echo_warning "Waiting for application... ($ATTEMPT/$MAX_ATTEMPTS)"
    sleep 2
done

if [ $ATTEMPT -eq $MAX_ATTEMPTS ]; then
    echo_error "Application failed to start"
    echo_warning "Rolling back..."
    docker compose -f "$COMPOSE_FILE" down
    docker compose -f "$COMPOSE_FILE" up -d
    exit 1
fi
echo ""

# 10. Post-deployment tasks
echo_info "Running post-deployment tasks..."

# Clear and optimize caches
docker compose -f "$COMPOSE_FILE" exec -T app php artisan config:cache
docker compose -f "$COMPOSE_FILE" exec -T app php artisan route:cache
docker compose -f "$COMPOSE_FILE" exec -T app php artisan view:cache
docker compose -f "$COMPOSE_FILE" exec -T app php artisan event:cache

echo_success "Caches optimized"
echo ""

# 11. Remove old containers and images
echo_info "Cleaning up old containers and images..."
docker compose -f "$COMPOSE_FILE" down --remove-orphans
docker image prune -f --filter "until=72h"
echo_success "Cleanup completed"
echo ""

# 12. Keep only last 7 backups
echo_info "Cleaning old backups..."
ls -t "$BACKUP_DIR"/db_backup_*.sql.gz | tail -n +8 | xargs -r rm
echo_success "Old backups cleaned"
echo ""

# 13. Final health check
echo_info "Running final health check..."
if curl -sf http://localhost/health > /dev/null 2>&1; then
    echo_success "Deployment completed successfully! 🚀"
    echo ""
    echo_info "Deployment summary:"
    echo "  - Date: $DEPLOY_DATE"
    echo "  - Database backup: $BACKUP_DIR/db_backup_$DEPLOY_DATE.sql.gz"
    echo "  - Application status: Running"
    echo ""
else
    echo_error "Final health check failed"
    exit 1
fi

exit 0
