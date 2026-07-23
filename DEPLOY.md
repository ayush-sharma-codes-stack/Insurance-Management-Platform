# 🚀 Deploy Guide — Insurance Management Platform

**Stack:** Render (Backend + PostgreSQL) + Vercel (Frontend)

---

## Step 1 — GitHub pe Push Karo

Pehle apna code GitHub pe push karo (agar nahi kiya hai).

```bash
git add .
git commit -m "chore: production deployment setup"
git push origin main
```

> ⚠️ `.env` files git-ignored hain — kabhi push mat karo.

---

## Step 2 — Render pe PostgreSQL Database Banao

1. **[render.com](https://render.com)** pe login karo
2. Dashboard → **"New +"** → **"PostgreSQL"**
3. Settings:
   - **Name:** `insurance-db`
   - **Region:** Singapore (ya nearest)
   - **Plan:** Free
4. **"Create Database"** click karo
5. Database create hone ke baad **"Internal Database URL"** copy karo

```
postgresql://user:password@dpg-xxxx.oregon-postgres.render.com/insurance_db
```

> 💡 Yeh URL tumhara `DATABASE_URL` environment variable hoga.

---

## Step 3 — Render pe Backend Deploy Karo

1. Dashboard → **"New +"** → **"Web Service"**
2. GitHub repo connect karo
3. Settings:
   - **Name:** `insurance-api`
   - **Root Directory:** `server`
   - **Runtime:** Node
   - **Build Command:** `npm install && npm run build`
   - **Start Command:** `npm start`
   - **Plan:** Free
4. **"Advanced"** → **"Add Environment Variable"** — yeh sab add karo:

| Key | Value |
|-----|-------|
| `DATABASE_URL` | Step 2 se copy kiya Internal URL |
| `JWT_SECRET` | Koi bhi strong random 32+ char string |
| `JWT_REFRESH_SECRET` | Koi aur strong random 32+ char string |
| `NODE_ENV` | `production` |
| `CLIENT_URL` | Step 4 ke baad milega (pehle `*` rakh do temporarily) |
| `PORT` | `5000` |

5. **"Create Web Service"** click karo
6. Deploy hone do (5-10 min lagenge)
7. Tumhara backend URL milega: `https://insurance-api.onrender.com`

> ✅ `/api/health` endpoint hit karke verify karo: `https://insurance-api.onrender.com/api/health`

---

## Step 4 — Vercel pe Frontend Deploy Karo

1. **[vercel.com](https://vercel.com)** pe login karo
2. **"New Project"** → GitHub repo import karo
3. Settings:
   - **Root Directory:** `client`
   - **Framework Preset:** Vite (auto-detect hoga)
   - **Build Command:** `npm run build`
   - **Output Directory:** `dist`
4. **"Environment Variables"** section me add karo:

| Key | Value |
|-----|-------|
| `VITE_API_BASE_URL` | `https://insurance-api.onrender.com/api` |

5. **"Deploy"** click karo
6. Tumhara frontend URL milega: `https://insurance-platform.vercel.app`

---

## Step 5 — Render Backend ka CLIENT_URL Update Karo

1. Render dashboard → `insurance-api` service
2. **"Environment"** tab
3. `CLIENT_URL` ki value update karo:
   ```
   https://insurance-platform.vercel.app
   ```
4. **"Save Changes"** → service automatically redeploy hoga

---

## Step 6 — Verify Karo

- [ ] `https://your-backend.onrender.com/api/health` → `{ status: "ok" }` aana chahiye
- [ ] `https://your-frontend.vercel.app` → Login page load honi chahiye
- [ ] Register karo → Login karo → Dashboard dikhe

---

## Common Issues

### ❌ "PrismaClientInitializationError"
**Cause:** `DATABASE_URL` galat hai ya DB accessible nahi hai
**Fix:** Render dashboard → Environment Variables → `DATABASE_URL` check karo

### ❌ "CORS Error" browser console me
**Cause:** `CLIENT_URL` backend pe set nahi hai
**Fix:** Step 5 dobara karo — exact Vercel URL daalo (trailing slash nahi)

### ❌ Frontend API calls fail ho rahi hain
**Cause:** `VITE_API_BASE_URL` galat hai
**Fix:** Vercel → Settings → Environment Variables → value check karo

### ❌ Render pe "Build Failed"
**Cause:** `prisma migrate deploy` fail hua
**Fix:** Render Logs check karo. Mostly `DATABASE_URL` issue hota hai

---

## Local Development (unchanged)

Local dev pe kuch nahi badla:

```bash
# Server
cd server
npm run dev

# Client
cd client
npm run dev
```

Local `.env` file SQLite ke saath as-is kaam karegi.
