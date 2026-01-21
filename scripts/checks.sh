#!/usr/bin/env bash

set -e

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
MODE="${1:-dev}" # dev, ci, deploy
SKIP_TESTS="${SKIP_TESTS:-false}"
USE_DOCKER="${USE_DOCKER:-true}"

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

run_command() {
    local cmd="$1"
    local description="$2"

    echo_info "$description..."

    if eval "$cmd"; then
        echo_success "$description passed"
        return 0
    else
        echo_error "$description failed"
        return 1
    fi
}

# Determine PHP command
if [ "$USE_DOCKER" = "true" ] && [ "$MODE" = "dev" ]; then
    PHP_CMD="docker compose exec -T laravel.test php"
    COMPOSER_CMD="docker compose exec -T laravel.test composer"
else
    PHP_CMD="php"
    COMPOSER_CMD="composer"
fi

echo_info "Running checks in ${MODE} mode..."
echo ""

# 1. Check for debug functions (pre-push only)
if [ "$MODE" = "dev" ]; then
    echo_info "Checking for debug functions..."
    if git diff origin/$(git rev-parse --abbrev-ref HEAD 2>/dev/null || echo "main") --name-only 2>/dev/null | grep '\.php$' | xargs grep -En '\b(dd|dump|ds|ray)\(' 2>/dev/null; then
        echo_error "Debug functions found (dd, dump, ds, ray)"
        exit 1
    fi
    echo_success "No debug functions found"
    echo ""
fi

# 2. Composer validate
run_command "$COMPOSER_CMD validate --strict --no-check-lock" "Composer validate"
echo ""

# 3. Install/update dependencies
if [ "$MODE" = "deploy" ]; then
    run_command "$COMPOSER_CMD install --no-dev --no-interaction --prefer-dist --optimize-autoloader --classmap-authoritative" "Install production dependencies"
elif [ "$MODE" = "ci" ]; then
    run_command "$COMPOSER_CMD install --no-interaction --prefer-dist --optimize-autoloader" "Install dependencies"
else
    echo_info "Skipping dependency installation in dev mode"
fi
echo ""

# 4. Check required environment variables (deploy/ci only)
if [ "$MODE" = "deploy" ] || [ "$MODE" = "ci" ]; then
    echo_info "Checking required environment variables..."
    REQUIRED_VARS=("APP_KEY" "APP_ENV" "DB_CONNECTION" "DB_HOST" "DB_DATABASE" "DB_USERNAME" "DB_PASSWORD")

    missing_vars=()
    for var in "${REQUIRED_VARS[@]}"; do
        if [ -z "${!var}" ]; then
            missing_vars+=("$var")
        fi
    done

    if [ ${#missing_vars[@]} -gt 0 ]; then
        echo_error "Missing required environment variables: ${missing_vars[*]}"
        exit 1
    fi
    echo_success "All required environment variables present"
    echo ""
fi

# 5. PHP Code Sniffer (Pint)
if [ "$MODE" != "deploy" ]; then
    run_command "$PHP_CMD vendor/bin/pint --test" "Pint (code style)"
    echo ""
fi

# 6. PHPStan (static analysis)
run_command "$PHP_CMD vendor/bin/phpstan analyse --memory-limit=2G --no-progress" "PHPStan (static analysis)"
echo ""

# 7. Frontend checks
if [ "$MODE" != "deploy" ] && command -v npm &> /dev/null; then
    echo_info "Running frontend checks..."

    if [ -f "package.json" ]; then
        # Check if node_modules exists
        if [ ! -d "node_modules" ]; then
            echo_warning "node_modules not found, skipping frontend checks"
        else
            run_command "npm run lint" "ESLint"
            echo ""
        fi
    fi
fi

# 8. Run tests
if [ "$SKIP_TESTS" != "true" ] && [ "$MODE" != "deploy" ]; then
    run_command "$PHP_CMD vendor/bin/pest --colors=always --compact" "Tests"
    echo ""
fi

# 9. Build assets (deploy/ci only)
if [ "$MODE" = "deploy" ] || [ "$MODE" = "ci" ]; then
    if [ -f "package.json" ]; then
        run_command "npm ci" "Install node dependencies"
        run_command "npm run build" "Build frontend assets"
        echo ""
    fi
fi

# 10. Laravel optimizations (deploy only)
if [ "$MODE" = "deploy" ]; then
    echo_info "Running Laravel optimizations..."

    run_command "$PHP_CMD artisan config:cache" "Cache config"
    run_command "$PHP_CMD artisan route:cache" "Cache routes"
    run_command "$PHP_CMD artisan view:cache" "Cache views"
    run_command "$PHP_CMD artisan event:cache" "Cache events"

    echo ""
fi

echo_success "All checks passed!"
exit 0
