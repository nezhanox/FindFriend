# Deployment Guide

## Quick Fix: Update Production Environment

If you encounter the error:
```
Error: failed to resolve reference "ghcr.io/your-username:latest"
```

This means the production `.env` file has an outdated `DOCKER_REGISTRY` value.

### Option 1: Automated Script (Recommended)

SSH into your production server and run:

```bash
cd /path/to/your/app
./scripts/update-production-env.sh
```

### Option 2: Manual Update

SSH into your production server:

```bash
ssh your-user@your-server
cd /path/to/your/app
```

Edit the `.env` file:

```bash
# Backup first
cp .env .env.backup

# Update the DOCKER_REGISTRY line
nano .env  # or use vim, vi, etc.
```

Change:
```env
DOCKER_REGISTRY=ghcr.io/your-username
```

To:
```env
DOCKER_REGISTRY=ghcr.io/nezhanox/findfriend
```

Save and exit.

### Verify the Change

```bash
grep DOCKER_REGISTRY .env
```

Should output:
```
DOCKER_REGISTRY=ghcr.io/nezhanox/findfriend
```

### Re-trigger Deployment

After updating the `.env` file, you can:

1. **Re-run the deployment manually:**
   ```bash
   cd /path/to/your/app
   ./scripts/deploy.sh
   ```

2. **Or push a new commit to trigger GitHub Actions again**

---

## Initial Production Setup

### Prerequisites

1. Production server with Docker and Docker Compose installed
2. SSH access to the server
3. GitHub Container Registry (GHCR) credentials

### Setup Steps

1. **Clone the repository on production server:**
   ```bash
   git clone https://github.com/nezhanox/FindFriend.git
   cd FindFriend
   ```

2. **Create `.env` file from example:**
   ```bash
   cp .env.production.example .env
   ```

3. **Edit `.env` with production values:**
   ```bash
   nano .env
   ```

   **Critical values to set:**
   - `APP_KEY` - Generate with `php artisan key:generate`
   - `DB_DATABASE`, `DB_USERNAME`, `DB_PASSWORD` - Database credentials
   - `REDIS_PASSWORD` - Redis password
   - `REVERB_APP_ID`, `REVERB_APP_KEY`, `REVERB_APP_SECRET` - WebSocket credentials
   - `GHCR_USERNAME`, `GHCR_TOKEN` - GitHub Container Registry credentials
   - `DOCKER_REGISTRY=ghcr.io/nezhanox/findfriend` - **Must be lowercase!**

4. **Set up GitHub Secrets** for CI/CD:

   Go to: `https://github.com/nezhanox/FindFriend/settings/secrets/actions`

   Add the following secrets:
   - `SSH_PRIVATE_KEY` - Private SSH key for server access
   - `DEPLOY_HOST` - Server hostname or IP
   - `DEPLOY_USER` - SSH username
   - `DEPLOY_PATH` - Full path to app directory (e.g., `/home/user/FindFriend`)
   - `APP_URL` - Production URL (e.g., `https://findfriend.website`)
   - `VITE_MAPBOX_TOKEN` - Mapbox access token (baked into frontend build)

5. **Initial deployment:**
   ```bash
   ./scripts/deploy.sh
   ```

---

## Deployment Workflow

### Automated Deployment (GitHub Actions)

When you push to `main` branch:

1. **Test Job** - Runs tests and quality checks
2. **Build Job** - Builds Docker image and pushes to GHCR
3. **Deploy Job** - SSH into server and runs `deploy.sh`

### Manual Deployment

On production server:

```bash
cd /path/to/FindFriend
./scripts/deploy.sh
```

This script:
1. ✅ Backs up database
2. ✅ Pulls latest code
3. ✅ Logs into container registry
4. ✅ Pulls latest Docker images
5. ✅ Stops old containers
6. ✅ Runs migrations
7. ✅ Starts new containers
8. ✅ Health check
9. ✅ Optimizes caches
10. ✅ Cleanup

---

## Troubleshooting

### Registry Authentication Issues

```bash
# Login manually
echo $GHCR_TOKEN | docker login ghcr.io -u $GHCR_USERNAME --password-stdin
```

### Image Pull Errors

Check that `DOCKER_REGISTRY` in `.env` matches the lowercase format:
```bash
grep DOCKER_REGISTRY .env
# Should be: ghcr.io/nezhanox/findfriend (all lowercase)
```

### Health Check Failures

```bash
# Check application logs
docker compose -f docker-compose.prod.yml logs app --tail=100

# Check if containers are running
docker compose -f docker-compose.prod.yml ps
```

### Database Connection Issues

```bash
# Check PostgreSQL logs
docker compose -f docker-compose.prod.yml logs postgres --tail=50

# Test connection
docker compose -f docker-compose.prod.yml exec app php artisan tinker
>>> DB::connection()->getPdo();
```

### Rollback

If deployment fails, rollback to previous version:

```bash
# Restore database backup
cd /path/to/FindFriend
gunzip < backups/db_backup_YYYYMMDD_HHMMSS.sql.gz | \
  docker compose -f docker-compose.prod.yml exec -T postgres \
  psql -U $DB_USERNAME $DB_DATABASE

# Checkout previous commit
git log --oneline -5  # Find previous commit
git checkout <previous-commit-hash>

# Re-deploy
./scripts/deploy.sh
```

---

## Important Notes

### Docker Registry Naming

⚠️ **CRITICAL:** Docker registry names MUST be lowercase!

- ✅ Correct: `ghcr.io/nezhanox/findfriend`
- ❌ Wrong: `ghcr.io/nezhanox/FindFriend` (capital F)

The GitHub Actions workflow automatically converts `${{ github.repository }}` to lowercase.

### Environment Variables

- Never commit `.env` files
- Keep `.env.example` and `.env.production.example` up to date
- Use GitHub Secrets for sensitive production values

### Backups

Database backups are stored in `./backups/` directory.
Only the last 7 backups are kept (automatic cleanup).

### Cache Management

After deployment, Laravel caches are automatically optimized:
- Config cache
- Route cache
- View cache
- Event cache

To clear caches manually:
```bash
docker compose -f docker-compose.prod.yml exec app php artisan cache:clear
docker compose -f docker-compose.prod.yml exec app php artisan config:clear
docker compose -f docker-compose.prod.yml exec app php artisan route:clear
docker compose -f docker-compose.prod.yml exec app php artisan view:clear
```
