# Switch to Render.com (Simpler & More Reliable)

Railway is having deployment conflicts. **Render.com** is easier and works better for this project.

## Why Render?
- ✅ Simpler deployment (no CLI confusion)
- ✅ 750 free hours/month
- ✅ Automatic SSL
- ✅ Direct GitHub integration
- ✅ More stable free tier

---

## Deploy Backend to Render (10 minutes)

### Step 1: Create Render Account

1. Go to **https://render.com**
2. Click **"Get Started"**
3. Sign up with **GitHub** (easiest)

### Step 2: Create New Web Service

1. Click **"New +"** → **"Web Service"**

2. **Connect Repository**:
   - Click **"Connect account"** (if first time)
   - Select **"Arshad-13/Hoogle-meet"**
   - Click **"Connect"**

3. **Configure Service**:
   - **Name**: `hoogle-meet-backend`
   - **Region**: Choose closest to you (e.g., Oregon, Frankfurt)
   - **Branch**: `main`
   - **Root Directory**: `server`
   - **Runtime**: `Node`
   - **Build Command**: `npm install`
   - **Start Command**: `npm start`

4. **Select Plan**:
   - Choose **"Free"**
   - 750 hours/month (enough for testing)

5. **Environment Variables**:
   - Click **"Add Environment Variable"**
   - Add:
     - **Key**: `CLIENT_URL`
     - **Value**: `https://hoogle-meet.vercel.app`

6. **Click "Create Web Service"**

### Step 3: Wait for Deployment

- Render will build and deploy (takes 2-5 minutes)
- Watch the logs in real-time
- Wait for: **"Your service is live 🎉"**

### Step 4: Get Your URL

- At the top of the page, you'll see your URL
- Format: `https://hoogle-meet-backend.onrender.com`
- **Copy this URL!**

---

## Update Vercel with New Backend URL

1. Go to **https://vercel.com/dashboard**
2. Click **"hoogle-meet"** project
3. Go to **Settings** → **Environment Variables**
4. Find `NEXT_PUBLIC_SIGNALING_URL`
5. Click **Edit**
6. Update value to: `https://hoogle-meet-backend.onrender.com`
7. Click **Save**
8. Go to **Deployments** → Latest → **Redeploy**

---

## Test the App

1. Wait 1-2 minutes for Vercel redeploy
2. Open https://hoogle-meet.vercel.app
3. Open browser console (F12)
4. Should see: ✅ **"Connected to signaling server"**
5. NO WebSocket errors!

---

## Advantages of Render over Railway

| Feature | Railway | Render |
|---------|---------|--------|
| Free tier | $5 credit/month | 750 hours/month |
| Setup | CLI can be confusing | Simple dashboard |
| Deployments | Conflicts possible | Clean, predictable |
| Logs | Harder to access | Built-in log viewer |
| Restarts | Free tier sleeps | Sleeps after 15min idle |
| SSL | Automatic ✅ | Automatic ✅ |

---

## After Deployment

**Your URLs:**
- **Frontend**: https://hoogle-meet.vercel.app
- **Backend**: https://hoogle-meet-backend.onrender.com
- **Health**: https://hoogle-meet-backend.onrender.com/health

**Test health endpoint:**
```bash
curl https://hoogle-meet-backend.onrender.com/health
```

Should return:
```json
{
  "status": "ok",
  "rooms": 0,
  "connections": 0
}
```

---

## Important Notes

⚠️ **Free tier sleeps after 15 minutes of inactivity**
- First request after sleep takes ~30 seconds to wake up
- Subsequent requests are instant
- For always-on, upgrade to paid tier ($7/month)

💡 **Tip**: Keep the backend URL in a safe place - you'll use it for testing!

---

## Troubleshooting

**Issue**: "Build failed"
- Check logs in Render dashboard
- Verify `Root Directory` is set to `server`

**Issue**: Still getting WebSocket errors
- Wait 2-3 minutes after deployment
- Hard refresh browser (Ctrl+Shift+R)
- Check Vercel environment variable is updated

**Issue**: 503 Service Unavailable
- Service is waking up from sleep
- Wait 30 seconds and refresh

---

**This should work perfectly!** Render is much more straightforward than Railway for simple Node.js apps.
