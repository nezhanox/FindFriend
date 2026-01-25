# GitHub Secrets Setup Guide

## ⚠️ CRITICAL: Configure These Secrets BEFORE Deployment

All `VITE_*` variables are compiled into the JavaScript bundle during Docker build. They CANNOT be changed after build without rebuilding the image.

## Step 1: Access GitHub Secrets

1. Go to your repository: `https://github.com/nezhanox/FindFriend`
2. Click **Settings** → **Secrets and variables** → **Actions**
3. Click **New repository secret**

## Step 2: Add Required Secrets

### Frontend WebSocket Configuration (Required)

**Name:** `VITE_APP_NAME`
**Value:** `FindFriend`

---

**Name:** `VITE_REVERB_APP_KEY`
**Value:** (Must match `REVERB_APP_KEY` from your production server's `.env` file)

**How to get this value:**
```bash
ssh your-user@your-server
cd /var/www/FindFriend
grep REVERB_APP_KEY .env
# Copy the value
```

---

**Name:** `VITE_REVERB_HOST`
**Value:** `findfriend.website` (⚠️ WITHOUT `https://`)

Examples:
- ✅ Correct: `findfriend.website`
- ✅ Correct: `api.findfriend.website`
- ❌ Wrong: `https://findfriend.website`
- ❌ Wrong: `wss://findfriend.website`

---

**Name:** `VITE_REVERB_PORT`
**Value:** `443` (for HTTPS) or `8080` (for HTTP)

For production with SSL: use `443`

---

**Name:** `VITE_REVERB_SCHEME`
**Value:** `https` (for production) or `http` (for development)

For production: use `https`

---

### Map Integration (Required)

**Name:** `VITE_MAPBOX_TOKEN`
**Value:** (Your Mapbox access token)

**How to get:**
1. Go to https://www.mapbox.com/
2. Sign up or log in
3. Go to **Account** → **Access tokens**
4. Create a new token or use an existing one
5. Copy the token (starts with `pk.`)

---

### Deployment Configuration (Required)

**Name:** `SSH_PRIVATE_KEY`
**Value:** (Your SSH private key for server access)

**How to get:**
```bash
cat ~/.ssh/id_rsa
# Or if using different key:
cat ~/.ssh/your-deploy-key
```

Copy the entire key including:
```
-----BEGIN OPENSSH PRIVATE KEY-----
...
-----END OPENSSH PRIVATE KEY-----
```

---

**Name:** `DEPLOY_HOST`
**Value:** (Your server IP or hostname)

Example: `123.45.67.89` or `server.example.com`

---

**Name:** `DEPLOY_USER`
**Value:** (SSH username)

Example: `root` or `deploy` or `your-username`

---

**Name:** `DEPLOY_PATH`
**Value:** `/var/www/FindFriend`

(Full path to the application directory on your server)

---

**Name:** `APP_URL`
**Value:** `https://findfriend.website`

(⚠️ WITH `https://`)

---

## Step 3: Verify All Secrets Are Added

After adding all secrets, you should see these in your repository's Secrets page:

- ✅ VITE_APP_NAME
- ✅ VITE_REVERB_APP_KEY
- ✅ VITE_REVERB_HOST
- ✅ VITE_REVERB_PORT
- ✅ VITE_REVERB_SCHEME
- ✅ VITE_MAPBOX_TOKEN
- ✅ SSH_PRIVATE_KEY
- ✅ DEPLOY_HOST
- ✅ DEPLOY_USER
- ✅ DEPLOY_PATH
- ✅ APP_URL

## Step 4: Trigger Deployment

After adding all secrets, trigger a new deployment:

```bash
git commit --allow-empty -m "chore: trigger deployment with correct secrets"
git push origin main
```

Or manually trigger the workflow:
1. Go to **Actions** tab in your repository
2. Select **Deploy to Production** workflow
3. Click **Run workflow** → **Run workflow**

## Step 5: Verify Deployment

After deployment completes (usually 5-10 minutes):

1. **Open your website** (e.g., `https://findfriend.website`)
2. **Open browser console** (F12 → Console tab)
3. **Check for errors:**

❌ Should NOT see:
- "VITE_REVERB_APP_KEY is not set"
- "VITE_REVERB_HOST is not set"
- Connection to `ws-.pusher.com`
- "You must pass your app key when you instantiate Pusher"

✅ Should see:
- WebSocket connection to `wss://findfriend.website:443`
- No critical errors

## Common Issues

### Issue: Still seeing `ws-.pusher.com` after adding secrets

**Cause:** Browser cached old JavaScript bundle

**Fix:** Hard refresh your browser
- Chrome/Firefox: `Ctrl+Shift+R` (Windows/Linux) or `Cmd+Shift+R` (Mac)
- Or open in Incognito/Private window

---

### Issue: WebSocket connection fails with SSL errors

**Cause:** SSL certificate not properly configured

**Fix:** Ensure your server has valid SSL certificates:
```bash
ssh your-user@your-server
sudo certbot certificates
```

---

### Issue: GitHub Actions build fails

**Cause:** One or more secrets are missing

**Fix:** Check the build logs in Actions tab:
- Look for "ARG VITE_..." in build output
- Verify all secrets are set in repository settings

---

### Issue: VITE_REVERB_APP_KEY doesn't match backend

**Symptom:** WebSocket connects but authentication fails

**Fix:**
1. Get the correct value from production `.env`:
   ```bash
   ssh your-user@your-server
   cd /var/www/FindFriend
   grep REVERB_APP_KEY .env
   ```
2. Update `VITE_REVERB_APP_KEY` secret in GitHub
3. Trigger new deployment

---

## Security Notes

⚠️ **IMPORTANT:**

1. **Never commit secrets to git** - Always use GitHub Secrets
2. **VITE_* variables are PUBLIC** - They are visible in browser JavaScript
3. **Don't put sensitive data in VITE_* variables** - Only use for configuration that's safe to expose
4. **SSH_PRIVATE_KEY should never be shared** - This gives full access to your server
5. **Rotate secrets regularly** - Especially SSH keys and API tokens

---

## Need Help?

See detailed troubleshooting in [DEPLOYMENT.md](./DEPLOYMENT.md)
