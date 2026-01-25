# Production Deployment Guide

## Prerequisites

1. **Server Requirements:**
   - Ubuntu 22.04+ or similar Linux distribution
   - Docker and Docker Compose installed
   - Domain name pointed to server IP
   - Ports 80 and 443 open in firewall

2. **GitHub Container Registry:**
   - Docker images are built and pushed to GitHub Container Registry (GHCR)
   - Images are pulled automatically during deployment

## GitHub Secrets Configuration

Before deploying, configure these secrets in your GitHub repository:

**Settings → Secrets and variables → Actions → New repository secret**

### Required Secrets:

1. **VITE_MAPBOX_TOKEN** (for Build job)
   - Your Mapbox access token
   - Used during Docker image build to embed in frontend assets
   - Get token from: https://account.mapbox.com/access-tokens/
   - Format: `pk.eyJ...` (starts with pk.)

2. **SSH_PRIVATE_KEY** (for Deploy job)
   - Private SSH key for server access
   - Generate with: `ssh-keygen -t ed25519 -C "github-actions"`
   - Add public key to server: `~/.ssh/authorized_keys`

3. **DEPLOY_HOST**
   - Server IP address or domain
   - Example: `123.45.67.89` or `server.example.com`

4. **DEPLOY_USER**
   - SSH user for deployment
   - Example: `root` or `deploy`

5. **DEPLOY_PATH**
   - Absolute path to project on server
   - Example: `/var/www/FindFriend`

6. **APP_URL**
   - Production application URL
   - Example: `https://findfriend.website`

## Server Setup

### 1. Install Docker and Docker Compose

```bash
# Install Docker
curl -fsSL https://get.docker.com -o get-docker.sh
sh get-docker.sh

# Install Docker Compose
apt-get update
apt-get install docker-compose-plugin
```

### 2. Clone Repository

```bash
cd /var/www
git clone https://github.com/your-username/FindFriend.git
cd FindFriend
```

### 3. Configure Environment

```bash
# Copy environment template
cp .env.production.example .env

# Edit environment variables
nano .env
```

Required variables in `.env`:
- `APP_KEY` - Generate with: `php artisan key:generate --show`
- `DB_DATABASE`, `DB_USERNAME`, `DB_PASSWORD` - PostgreSQL credentials
- `REDIS_PASSWORD` - Redis password (optional but recommended)
- `REVERB_APP_ID`, `REVERB_APP_KEY`, `REVERB_APP_SECRET` - Generate unique values
- `DOCKER_REGISTRY` - Your GitHub username (e.g., `ghcr.io/your-username`)

**Important:** DO NOT add `VITE_MAPBOX_TOKEN` to `.env` file. It's embedded during build via GitHub Actions.

### 4. Setup SSL Certificates (Let's Encrypt)

```bash
# Install certbot
apt-get install certbot

# Stop nginx if running
docker compose -f docker-compose.prod.yml down nginx

# Generate certificates
certbot certonly --standalone -d findfriend.website -d www.findfriend.website

# Certificates will be in: /etc/letsencrypt/live/findfriend.website/
```

### 5. Make Deploy Script Executable

```bash
chmod +x scripts/deploy.sh
```

## Deployment Process

### Automatic Deployment (via GitHub Actions)

1. Push changes to `main` branch
2. GitHub Actions automatically:
   - Runs tests and quality checks
   - Builds Docker image with VITE_MAPBOX_TOKEN from secrets
   - Pushes image to GHCR
   - SSHs to server and runs `scripts/deploy.sh`
   - Performs health check

### Manual Deployment

```bash
# SSH to server
ssh user@your-server

# Navigate to project
cd /var/www/FindFriend

# Pull latest code
git pull origin main

# Run deployment script
./scripts/deploy.sh
```

## Deployment Script (`scripts/deploy.sh`)

The deployment script:
1. Logs in to GitHub Container Registry
2. Pulls latest Docker images
3. Stops old containers
4. Starts new containers
5. Waits for health checks
6. Runs database migrations
7. Clears caches

## Verifying Deployment

### Health Check
```bash
curl https://findfriend.website/health
# Should return: {"status":"ok"}
```

### Check Container Status
```bash
docker compose -f docker-compose.prod.yml ps
# All containers should show as "healthy" or "Up"
```

### View Logs
```bash
# Application logs
docker compose -f docker-compose.prod.yml logs -f app

# Nginx logs
docker compose -f docker-compose.prod.yml logs -f nginx

# Reverb WebSocket logs
docker compose -f docker-compose.prod.yml logs -f reverb

# Queue worker logs
docker compose -f docker-compose.prod.yml logs -f queue
```

## Troubleshooting

### Mapbox Token Not Working

If you see "An API access token is required to use Mapbox GL":

1. Verify `VITE_MAPBOX_TOKEN` is set in GitHub Secrets
2. Trigger a new deployment (push to main or re-run workflow)
3. Verify token is embedded in build:
   ```bash
   docker compose -f docker-compose.prod.yml exec app ls -la /var/www/html/public/build/assets/
   ```

### SSL Certificate Issues

```bash
# Test SSL configuration
docker compose -f docker-compose.prod.yml exec nginx nginx -t

# Renew certificates
certbot renew
docker compose -f docker-compose.prod.yml restart nginx
```

### Database Connection Issues

```bash
# Check PostgreSQL logs
docker compose -f docker-compose.prod.yml logs postgres

# Verify credentials in .env match docker-compose.prod.yml

# Test connection
docker compose -f docker-compose.prod.yml exec app php artisan tinker
# In tinker: DB::connection()->getPdo();
```

### Clear All Data and Restart

```bash
# WARNING: This deletes all data!
docker compose -f docker-compose.prod.yml down -v
docker compose -f docker-compose.prod.yml up -d
docker compose -f docker-compose.prod.yml exec app php artisan migrate --force
```

## Updating After Changes

### Code Changes (No Dependencies)
- Just push to `main` - GitHub Actions handles everything

### Dependency Changes
- Requires rebuilding Docker image
- Push changes to `main` - workflow rebuilds automatically

### Environment Variable Changes
- Update `.env` on server manually
- Restart containers: `docker compose -f docker-compose.prod.yml restart`

### Database Schema Changes
- Deployment script runs migrations automatically
- Or manually: `docker compose -f docker-compose.prod.yml exec app php artisan migrate --force`

## Security Best Practices

1. **Never commit secrets** - Use GitHub Secrets for sensitive data
2. **Use strong passwords** - For database, Redis, etc.
3. **Keep SSL certificates updated** - Set up auto-renewal with certbot
4. **Limit SSH access** - Use SSH keys, disable password authentication
5. **Configure firewall** - Only open necessary ports (80, 443, 22)
6. **Regular updates** - Keep Docker images and system packages updated

## Monitoring

### Setup Monitoring (Optional)

Consider adding:
- **Laravel Telescope** - Application debugging (development only)
- **Laravel Pulse** - Application metrics
- **Uptime monitoring** - UptimeRobot, Pingdom, etc.
- **Log aggregation** - Papertrail, Logtail, etc.

## Support

For issues related to:
- **Laravel**: https://laravel.com/docs
- **Docker**: https://docs.docker.com
- **Let's Encrypt**: https://letsencrypt.org/docs/
- **GitHub Actions**: https://docs.github.com/en/actions
