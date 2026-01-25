#!/usr/bin/env bash

set -e

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

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

echo_info "Updating DOCKER_REGISTRY in .env file..."
echo ""

# Check if .env exists
if [ ! -f .env ]; then
    echo_error ".env file not found!"
    exit 1
fi

# Backup .env
cp .env .env.backup.$(date +%Y%m%d_%H%M%S)
echo_success "Backed up .env file"

# Update DOCKER_REGISTRY to lowercase
if grep -q "^DOCKER_REGISTRY=" .env; then
    # Replace existing value
    sed -i.tmp 's|^DOCKER_REGISTRY=.*|DOCKER_REGISTRY=ghcr.io/nezhanox/findfriend|g' .env
    rm -f .env.tmp
    echo_success "Updated DOCKER_REGISTRY to ghcr.io/nezhanox/findfriend"
else
    # Add if not exists
    echo "" >> .env
    echo "# Docker & Deployment" >> .env
    echo "DOCKER_REGISTRY=ghcr.io/nezhanox/findfriend" >> .env
    echo_success "Added DOCKER_REGISTRY=ghcr.io/nezhanox/findfriend"
fi

echo ""
echo_info "Current DOCKER_REGISTRY value:"
grep "^DOCKER_REGISTRY=" .env

echo ""
echo_success "Update completed successfully!"
