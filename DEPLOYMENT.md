# Deployment Guide

## Critical: Frontend Build Variables

**IMPORTANT:** All `VITE_*` variables are compiled into the JavaScript bundle during Docker image build. They CANNOT be changed after the image is built. Any changes require rebuilding the Docker image.

### Required GitHub Secrets for Frontend

Go to: `https://github.com/nezhanox/FindFriend/settings/secrets/actions`

Add these secrets (they will be baked into the Docker image during build):

#### Application & WebSocket (Required)
- `VITE_APP_NAME` - Application name (e.g., `FindFriend`)
- **`VITE_REVERB_APP_KEY`** - Reverb WebSocket app key (must match backend `REVERB_APP_KEY`)
- `VITE_REVERB_HOST` - Production URL without protocol (e.g., `findfriend.website`)
- `VITE_REVERB_PORT` - WebSocket port (`8080` for ws, `443` for wss)
- `VITE_REVERB_SCHEME` - Protocol scheme (`https` for production)

#### Map Integration (Required)
- `VITE_MAPBOX_TOKEN` - Mapbox access token for maps

#### Deployment Configuration
- `SSH_PRIVATE_KEY` - Private SSH key for server access
- `DEPLOY_HOST` - Server hostname or IP
- `DEPLOY_USER` - SSH username
- `DEPLOY_PATH` - Full path to app directory (e.g., `/var/www/FindFriend`)
- `APP_URL` - Production URL (e.g., `https://findfriend.website`)

---

## Quick Fix: Frontend Errors

### Error: "You must pass your app key when you instantiate Pusher"

This means `VITE_REVERB_APP_KEY` was not set during Docker image build.

**Fix:**
1. Add `VITE_REVERB_APP_KEY` to GitHub Secrets (must match your backend `REVERB_APP_KEY`)
2. Add other required `VITE_*` secrets (see above)
3. Push a commit to trigger new build, or manually trigger workflow:
   ```bash
   git commit --allow-empty -m "chore: rebuild with correct VITE secrets"
   git push
   ```

### Error: WebSocket connection to 'wss://ws-.pusher.com/app/' failed

This means `VITE_REVERB_HOST` was not set or is empty during Docker image build. The application falls back to Pusher's default host instead of your Reverb server.

**Fix:**
1. Add `VITE_REVERB_HOST` to GitHub Secrets with your domain (WITHOUT protocol):
   - ✅ Correct: `findfriend.website`
   - ❌ Wrong: `https://findfriend.website`
2. Ensure all other VITE_REVERB_* secrets are set (see above)
3. Push to trigger rebuild

**To verify after rebuild:**
Open browser console and check for:
- ❌ "VITE_REVERB_HOST is not set" error
- ❌ Connection to `ws-.pusher.com`
- ✅ Should connect to `wss://findfriend.website:443`

### Error: Mapbox / Map-related AbortError or ERR_BLOCKED_BY_CLIENT

**ERR_BLOCKED_BY_CLIENT** - This is usually caused by ad-blockers or browser extensions blocking Mapbox telemetry. This is NOT critical and can be safely ignored as it only affects analytics.

**If Mapbox maps don't load:**
1. Add `VITE_MAPBOX_TOKEN` to GitHub Secrets
2. Push to trigger rebuild

---

## Quick Fix: Update Production Environment

If you encounter the error:
```
Error: failed to resolve reference "ghcr.io/your-username:latest"
```

This means the production `.env` file has an outdated `DOCKER_REGISTRY` value.

### Option 1: Automated Script (Recommended)

SSH into your production server and run:

```bash
cd /var/www/FindFriend
./scripts/update-production-env.sh
```

### Option 2: Manual Update

```bash
ssh your-user@your-server
cd /var/www/FindFriend

# Backup first
cp .env .env.backup

# Edit
nano .env

# Change:
DOCKER_REGISTRY=ghcr.io/your-username
# To:
DOCKER_REGISTRY=ghcr.io/nezhanox/findfriend
```

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

   **Critical backend values to set:**
   - `APP_KEY` - Generate with `php artisan key:generate`
   - `APP_URL` - Production URL (e.g., `https://findfriend.website`)
   - `DB_DATABASE`, `DB_USERNAME`, `DB_PASSWORD` - Database credentials
   - `REDIS_PASSWORD` - Redis password
   - `REVERB_APP_ID`, `REVERB_APP_KEY`, `REVERB_APP_SECRET` - WebSocket credentials
   - `GHCR_USERNAME`, `GHCR_TOKEN` - GitHub Container Registry credentials
   - `DOCKER_REGISTRY=ghcr.io/nezhanox/findfriend` - **Must be lowercase!**

4. **Set up GitHub Secrets** (see "Required GitHub Secrets for Frontend" above)

5. **Initial deployment:**
   ```bash
   ./scripts/deploy.sh
   ```

---

## Deployment Workflow

### Automated Deployment (GitHub Actions)

When you push to `main` branch:

1. **Test Job** - Runs tests and quality checks
2. **Build Job** - Builds Docker image with all `VITE_*` variables and pushes to GHCR
3. **Deploy Job** - SSH into server and runs `deploy.sh`

### Manual Deployment

On production server:

```bash
cd /var/www/FindFriend
./scripts/deploy.sh
```

This script:
1. ✅ Backs up database
2. ✅ Pulls latest code
3. ✅ Logs into container registry
4. ✅ Pulls latest Docker images (with baked-in frontend build)
5. ✅ Stops old containers gracefully
6. ✅ Runs migrations
7. ✅ Starts new containers
8. ✅ Health check
9. ✅ Optimizes caches
10. ✅ Cleanup old images

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

### Frontend Build Variables Not Working

**Remember:** `VITE_*` variables are compiled into JavaScript at Docker build time!

To verify they were set correctly:
```bash
# Check the built JavaScript bundle
docker run --rm ghcr.io/nezhanox/findfriend:latest cat public/build/manifest.json
```

To fix:
1. Ensure all `VITE_*` secrets are set in GitHub
2. Trigger new build by pushing a commit
3. Wait for CI/CD to complete
4. Deploy the new image

### Health Check Failures

```bash
# Check application logs
docker compose -f docker-compose.prod.yml logs app --tail=100

# Check if containers are running
docker compose -f docker-compose.prod.yml ps

# Manual health check
curl http://localhost/health
```

### Database Connection Issues

```bash
# Check PostgreSQL logs
docker compose -f docker-compose.prod.yml logs postgres --tail=50

# Test connection
docker compose -f docker-compose.prod.yml exec app php artisan tinker
>>> DB::connection()->getPdo();
```

### WebSocket Connection Issues

```bash
# Check Reverb logs
docker compose -f docker-compose.prod.yml logs reverb --tail=50

# Verify Reverb is running
docker compose -f docker-compose.prod.yml ps reverb

# Test WebSocket connection from browser console:
# Should show connection to wss://your-domain:443
```

### Rollback

If deployment fails, rollback to previous version:

```bash
cd /var/www/FindFriend

# Restore database backup
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

### Frontend Build Variables (Critical!)

⚠️ **All `VITE_*` environment variables are compiled into the JavaScript bundle during Docker image build.**

This means:
- They CANNOT be changed by editing `.env` on the production server
- They are PUBLIC and visible in the browser's JavaScript
- To change them, you MUST rebuild the Docker image
- Never put sensitive data in `VITE_*` variables

### Docker Registry Naming

⚠️ **CRITICAL:** Docker registry names MUST be lowercase!

- ✅ Correct: `ghcr.io/nezhanox/findfriend`
- ❌ Wrong: `ghcr.io/nezhanox/FindFriend` (capital F)

The GitHub Actions workflow automatically converts `${{ github.repository }}` to lowercase.

### Environment Variables: Backend vs Frontend

**Backend variables** (in production `.env`):
- Can be changed anytime on the server
- Require container restart: `docker compose restart app`
- Examples: `DB_PASSWORD`, `REDIS_PASSWORD`, `APP_KEY`

**Frontend variables** (GitHub Secrets starting with `VITE_`):
- Baked into JavaScript during Docker image build
- Require complete rebuild to change
- Visible in browser (never use for secrets!)
- Examples: `VITE_MAPBOX_TOKEN`, `VITE_REVERB_APP_KEY`

### Reverb Configuration Matching

The `VITE_REVERB_APP_KEY` in GitHub Secrets **MUST match** the `REVERB_APP_KEY` in production `.env` file. If they don't match, WebSocket connections will fail.

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

---

## Checklist Before First Deployment

- [ ] Set all GitHub Secrets (especially `VITE_*` variables)
- [ ] Verify `VITE_REVERB_APP_KEY` matches backend `REVERB_APP_KEY`
- [ ] Create production `.env` file on server
- [ ] Set `DOCKER_REGISTRY=ghcr.io/nezhanox/findfriend` (lowercase!)
- [ ] Generate `APP_KEY` with `php artisan key:generate`
- [ ] Configure Reverb credentials (`REVERB_APP_ID`, `REVERB_APP_KEY`, `REVERB_APP_SECRET`)
- [ ] Set database credentials
- [ ] Set `GHCR_USERNAME` and `GHCR_TOKEN` for Docker registry
- [ ] SSL certificates configured (for HTTPS/WSS)
- [ ] Test deployment script: `./scripts/deploy.sh`
- [ ] Verify health check: `curl https://your-domain/health`
- [ ] Test WebSocket connection from browser
