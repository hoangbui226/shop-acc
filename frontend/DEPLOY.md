# Deploying to checkmxt.com

Your app is a **Next.js** app that stores data in local JSON files (`/data/users.json`, `jobs.json`, etc.). That only works on a **persistent server** (VPS or PaaS with a disk). Below: **own VPS** (recommended), then Railway/Render, then Vercel.

---

## Deploy on your own VPS (checkmxt.com)

Use a Linux VPS (Ubuntu/Debian). Replace `YOUR_VPS_IP` and `checkmxt.com` with your values.

### 1. On your VPS: install Node.js and PM2

```bash
# Node 20 (Ubuntu/Debian)
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt-get install -y nodejs

# PM2 (keep app running, restart on crash)
sudo npm install -g pm2
```

### 2. Deploy the app

```bash
# Clone your repo (use your real repo URL)
cd /var/www  # or any directory you prefer
sudo mkdir -p /var/www
sudo chown $USER:$USER /var/www
cd /var/www
git clone https://github.com/YOUR_USERNAME/shop-acc.git
cd shop-acc/frontend
```

### 3. Create data directory and env

```bash
# Data folder (must exist; app writes users.json, jobs.json, etc.)
mkdir -p data
echo '[]' > data/users.json
echo '[]' > data/jobs.json
echo '[]' > data/service-grants.json
echo '[]' > data/banned-ips.json

# Optional: Turnstile (signup captcha)
nano .env.local
# Add if you use Turnstile:
# NEXT_PUBLIC_TURNSTILE_SITE_KEY=your_site_key
# TURNSTILE_SECRET_KEY=your_secret_key
```

### 4. Build and run with PM2

```bash
npm ci
npm run build
# Run on port 3000 (default)
pm2 start npm --name "checkmxt" -- start
pm2 save
pm2 startup   # run the command it prints so PM2 starts on reboot
```

Check: `curl http://localhost:3000` should return HTML.

### 5. Nginx as reverse proxy + SSL (HTTPS)

```bash
sudo apt-get install -y nginx certbot python3-certbot-nginx
```

Create site config:

```bash
sudo nano /etc/nginx/sites-available/checkmxt.com
```

Paste (replace `checkmxt.com` if you use another domain):

```nginx
server {
    listen 80;
    server_name checkmxt.com www.checkmxt.com;
    location / {
        proxy_pass http://127.0.0.1:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }
}
```

Enable and get SSL:

```bash
sudo ln -s /etc/nginx/sites-available/checkmxt.com /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl reload nginx
sudo certbot --nginx -d checkmxt.com -d www.checkmxt.com
```

Certbot will add HTTPS and redirect HTTP → HTTPS.

### 6. DNS (at your domain registrar)

Point the domain to your VPS IP:

| Type | Name | Value        | TTL |
|------|------|--------------|-----|
| A    | @    | YOUR_VPS_IP  | 300 |
| A    | www  | YOUR_VPS_IP  | 300 |

Wait 5–60 minutes, then open `https://checkmxt.com`.

### 7. Updates (after you change code)

```bash
cd /var/www/shop-acc
git pull
cd frontend
npm ci
npm run build
pm2 restart checkmxt
```

---

## Option A: Railway / Render (PaaS with persistent disk)

Use a server where the `data/` folder persists (e.g. **Railway**, **Render**, **DigitalOcean**, **Vultr**).

### 1. Build and run locally (test first)

```bash
cd frontend
npm ci
npm run build
npm run start
```

Runs at `http://localhost:3000`. Create `data/` and add initial files if needed (e.g. `data/users.json` = `[]`).

### 2. Deploy to Railway (example)

1. Push your code to **GitHub** (or GitLab).
2. Go to [railway.app](https://railway.app) → New Project → **Deploy from GitHub** → select your repo.
3. Set **Root Directory** to `frontend`.
4. **Build command:** `npm ci && npm run build`
5. **Start command:** `npm run start`
6. **Variables:** Add any env vars (e.g. `NEXT_PUBLIC_TURNSTILE_SITE_KEY`, `TURNSTILE_SECRET_KEY`).
7. Railway gives you a URL (e.g. `xxx.up.railway.app`). Use it for the next step.

### 3. Deploy to Render (alternative)

1. [render.com](https://render.com) → New → **Web Service** → connect repo.
2. **Root Directory:** `frontend`
3. **Build:** `npm install && npm run build`
4. **Start:** `npm run start`
5. Copy the `.onrender.com` URL for DNS.

### 4. Point your domain (checkmxt.com)

Wherever you deployed (Railway, Render, or your own VPS):

- **If they give you a URL** (e.g. `yourapp.up.railway.app`):
  - In your **domain registrar** (where you bought checkmxt.com), open DNS settings.
  - Add a **CNAME** record:
    - **Name/host:** `@` (root) or `www` (for www.checkmxt.com)
    - **Value/target:** `yourapp.up.railway.app` (or your Render URL).
  - In Railway/Render dashboard, add the domain **checkmxt.com** (and optionally **www.checkmxt.com**). They will handle HTTPS.

- **If you have your own VPS with an IP:**
  - Add an **A** record: **Name** `@`, **Value** your server IP.
  - Optionally **CNAME** `www` → same server or to the same IP via an A record.
  - On the server, use **nginx** (or Caddy) as reverse proxy to `http://127.0.0.1:3000` and enable SSL (e.g. Let’s Encrypt).

### 5. Environment variables

Set in the host’s dashboard (Railway/Render “Variables”, or on VPS in `.env` or system env):

- `NEXT_PUBLIC_TURNSTILE_SITE_KEY` – if you use Turnstile on signup.
- `TURNSTILE_SECRET_KEY` – server-side Turnstile verification.

Redeploy after changing env vars.

---

## Option B: Vercel (quick, but no persistent files)

[Vercel](https://vercel.com) is great for Next.js but uses a **serverless, read-only filesystem**. Your current `data/*.json` files **will not persist** (data will be lost between requests/deploys).

To use Vercel properly you would need to:

- Replace file storage with a **database** (e.g. Vercel Postgres, Supabase, MongoDB), or
- Use **Vercel Blob** (or similar) to store JSON and adapt your libs to read/write from there.

If you still want to try Vercel for a “demo” (no real user data):

1. Push code to GitHub.
2. Go to [vercel.com](https://vercel.com) → Add New → Project → Import repo.
3. **Root Directory:** `frontend`
4. Deploy. Add domain: **Settings → Domains** → add `checkmxt.com` and `www.checkmxt.com`.
5. In your domain DNS, add **CNAME** for `@` or `www` to `cname.vercel-dns.com` (Vercel will show the exact record).

Again: on Vercel, user accounts and jobs stored in `data/` will not persist until you switch to a database or blob store.

---

## Domain checklist for checkmxt.com

| Step | Where | Action |
|------|--------|--------|
| 1 | Registrar (e.g. GoDaddy, Namecheap, Cloudflare) | Open DNS / Nameservers for checkmxt.com |
| 2 | DNS | Add **CNAME** `@` → `your-app.up.railway.app` (or A record to your VPS IP) |
| 3 | Host (Railway/Render/Vercel) | Add domain **checkmxt.com** in project settings |
| 4 | Wait | DNS can take 5–60 minutes; then HTTPS should work |

For **www**: add CNAME `www` → same target as above (or the host’s canonical URL) and add **www.checkmxt.com** in the host’s domain list.

---

## Quick summary

- **Your own VPS:** Follow the **“Deploy on your own VPS”** section above: Node + PM2 + Nginx + Certbot + A records for checkmxt.com. The `data/` folder on the VPS keeps users and jobs.
- **Railway/Render:** Use Option A if you prefer a managed host; then CNAME checkmxt.com to their URL.
- **Vercel:** Only if you later switch to a database; local `data/` files do not persist on Vercel.
