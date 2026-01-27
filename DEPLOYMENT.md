# Deployment Guide: Hoogle Meet

This guide walks you through deploying Hoogle Meet to production with automatic SSL/TLS certificates.

## Architecture

- **Frontend**: Vercel (Next.js) → `https://your-app.vercel.app`
- **Backend**: Railway (Signaling Server) → `https://your-app.up.railway.app`
- **SSL**: Automatically provisioned by both platforms ✅

---

## Prerequisites

1. **GitHub Account** - To store your code
2. **Vercel Account** - Sign up at [vercel.com](https://vercel.com) (free)
3. **Railway Account** - Sign up at [railway.app](https://railway.app) (free tier available)

---

## Step 1: Push Code to GitHub

First, initialize a Git repository and push to GitHub:

```bash
# Navigate to project
cd s:\HM

# Initialize Git (if not already done)
git init

# Add all files
git add .

# Commit
git commit -m "Initial commit: Hoogle Meet video conferencing app"

# Create a new repository on GitHub.com, then:
git remote add origin https://github.com/YOUR_USERNAME/hoogle-meet.git
git branch -M main
git push -u origin main
```

---

## Step 2: Deploy Backend (Signaling Server) to Railway

### Option A: Using Railway CLI (Recommended)

```bash
# Install Railway CLI
npm install -g @railway/cli

# Login
railway login

# Initialize project
railway init

# Deploy
railway up

# Get your backend URL
railway domain
# Example output: hoogle-meet-backend.up.railway.app
```

### Option B: Using Railway Dashboard

1. Go to [railway.app](https://railway.app)
2. Click **"New Project"** → **"Deploy from GitHub repo"**
3. Select your `hoogle-meet` repository
4. Railway will auto-detect Node.js
5. Set **Root Directory** to `server`
6. Click **"Deploy"**
7. Once deployed, go to **Settings** → **Networking** → **Generate Domain**
8. Note your backend URL: `https://your-app.up.railway.app`

### Environment Variables for Railway

In Railway dashboard, add:
- `PORT`: `3001` (Railway will assign dynamically, but set fallback)
- `CLIENT_URL`: `https://your-frontend-url.vercel.app` (we'll update this in Step 4)

---

## Step 3: Deploy Frontend to Vercel

### Option A: Using Vercel CLI (Recommended)

```bash
# Install Vercel CLI
npm install -g vercel

# Login
vercel login

# Deploy (run from project root)
cd s:\HM
vercel

# Follow the prompts:
# - Set up and deploy? Yes
# - Which scope? (Your account)
# - Link to existing project? No
# - Project name? hoogle-meet
# - Directory? ./ (default)
# - Override settings? No

# Production deployment
vercel --prod
```

### Option B: Using Vercel Dashboard

1. Go to [vercel.com/new](https://vercel.com/new)
2. Import your GitHub repository
3. Configure:
   - **Framework Preset**: Next.js
   - **Root Directory**: `./`
   - **Build Command**: `npm run build`
   - **Output Directory**: `.next`
4. Add Environment Variable:
   - `NEXT_PUBLIC_SIGNALING_ URL`: `https://your-backend.up.railway.app`
5. Click **"Deploy"**
6. Note your frontend URL: `https://hoogle-meet.vercel.app`

---

## Step 4: Update Environment Variables

### Update Railway (Backend)

Update `CLIENT_URL` to your Vercel frontend URL:

```bash
# Using CLI
railway variables set CLIENT_URL=https://your-app.vercel.app

# Or in Railway dashboard → Variables tab
```

### Update Vercel (Frontend)

Ensure `NEXT_PUBLIC_SIGNALING_URL` points to Railway backend:

```bash
# Using CLI
vercel env add NEXT_PUBLIC_SIGNALING_URL production
# Enter: https://your-backend.up.railway.app

# Redeploy
vercel --prod
```

Or in Vercel dashboard:
1. Go to Project Settings → Environment Variables
2. Add `NEXT_PUBLIC_SIGNALING_URL` = `https://your-backend.up.railway.app`
3. Redeploy from Deployments tab

---

## Step 5: Test Deployment

1. Open your Vercel URL: `https://your-app.vercel.app`
2. Click **"Create New Meeting"**
3. Allow camera/microphone permissions
4. Join the meeting
5. Open another device/browser to test multi-user
6. Verify:
   - ✅ HTTPS padlock in browser
   - ✅ Camera/mic permissions work
   - ✅ WebSocket connects to backend
   - ✅ Video streams appear

### Check Console Logs

**Frontend (Browser Console):**
- `✅ Connected to signaling server`
- `✅ Local stream initialized`

**Backend (Railway Logs):**
- `New connection: <socket-id>`
- `User <id> joining room <room-id>`

---

## Step 6: Custom Domain (Optional)

### Add Custom Domain to Vercel

1. In Vercel dashboard → Project Settings → Domains
2. Add your domain: `meet.yourdomain.com`
3. Add DNS records as instructed (CNAME or A record)
4. SSL certificate automatically provisioned! 🎉

### Add Custom Domain to Railway

1. In Railway dashboard → Settings → Networking
2. Add custom domain
3. Point your DNS to Railway's provided address
4. SSL automatically provisioned

---

## Troubleshooting

### Issue: CORS errors

**Solution**: Verify `CLIENT_URL` in Railway matches your Vercel URL exactly (including `https://`)

### Issue: "Disconnected from signaling server"

**Solution**: 
- Check Railway logs for errors
- Verify `NEXT_PUBLIC_SIGNALING_URL` includes `https://` and correct domain
- Ensure Railway service is running

### Issue: Camera permissions denied on HTTPS

**Solution**: 
- Check browser permissions (should work with valid SSL)
- Clear browser cache and try again

### Issue: WebSocket connection fails

**Solution**:
- Railway requires WebSocket support (enabled by default)
- Check if firewall is blocking WSS connections
- Verify Socket.io client version matches server

---

## Cost Estimate

### Vercel (Free Tier)
- ✅ 100 GB bandwidth/month
- ✅ Unlimited deployments
- ✅ Automatic SSL
- ✅ Global CDN

### Railway (Free Tier - 2024 pricing)
- ⚠️ **$5 credit per month** (free trial)
- After credit: ~$5-10/month depending on usage
- ✅ Automatic SSL
- ✅ 500 hours/month

**Alternative Free Backend**: 
- Render.com (750 hours/month free)
- Fly.io (3 shared CPUs free)

---

## Next Steps After Deployment

1. ✅ Test with multiple users across different networks
2. ✅ Add TURN server for corporate networks (Metered.ca - 20GB free)
3. ✅ Implement user authentication (Clerk/Firebase)
4. ✅ Add meeting room passwords
5. ✅ Monitor Railway logs for errors
6. ✅ Set up uptime monitoring (UptimeRobot - free)

---

## Quick Commands Reference

```bash
# Deploy frontend (Vercel)
vercel --prod

# Deploy backend (Railway)
railway up

# View Railway logs
railway logs

# View Vercel logs
vercel logs

# Update environment variables
railway variables set KEY=VALUE
vercel env add KEY production
```

---

## Support

- **Vercel Docs**: [vercel.com/docs](https://vercel.com/docs)
- **Railway Docs**: [docs.railway.app](https://docs.railway.app)
- **WebRTC Debugging**: `chrome://webrtc-internals/`

---

## Security Checklist

- ✅ HTTPS enforced on both frontend and backend
- ✅ CORS properly configured
- ✅ Environment variables not committed to Git
- ✅ WebSocket connections use WSS (secure)
- ✅ Media streams encrypted with SRTP
- ⚠️ Add room passwords for production use
- ⚠️ Implement rate limiting on signaling server
