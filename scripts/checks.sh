#!/usr/bin/env bash

# CI quality checks — runs in GitHub Actions only.
# Called as: USE_DOCKER=false ./scripts/checks.sh ci

set -e

RED='\033[0;31m'
GREEN='\033[0;32m'
BLUE='\033[0;34m'
NC='\033[0m'

echo_info()    { echo -e "${BLUE}ℹ${NC} $1"; }
echo_success() { echo -e "${GREEN}✓${NC} $1"; }
echo_error()   { echo -e "${RED}✗${NC} $1"; }

run() {
    local cmd="$1"
    local label="$2"
    echo_info "$label..."
    if eval "$cmd"; then
        echo_success "$label passed"
    else
        echo_error "$label failed"
        exit 1
    fi
    echo ""
}

# 1. Composer validate
run "composer validate --strict --no-check-lock" "Composer validate"

# 2. Pint
run "php vendor/bin/pint --test" "Pint (code style)"

# 3. PHPStan
run "php vendor/bin/phpstan analyse --memory-limit=2G --no-progress" "PHPStan"

# 4. ESLint
run "npm run lint" "ESLint"

# 5. Pest
run "php vendor/bin/pest --colors=always --compact" "Tests"

echo_success "All checks passed!"
