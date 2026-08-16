# Deploying Athena School on AWS

Production setup: the API **serves the built React app itself** (single process, one port — no CORS, no extra web server needed for the app). Nginx is used only as a TLS reverse proxy.

## 1. Launch an EC2 instance

- Ubuntu 24.04 LTS, `t3.small` (2 GB RAM) is enough for a small school.
- Security group inbound rules:
  - `22` TCP — SSH (your IP only)
  - `80` TCP — HTTP (anywhere, for Let's Encrypt)
  - `443` TCP — HTTPS (anywhere)
- Assign an Elastic IP so the address never changes.

## 2. Install Node + Nginx

```bash
sudo apt update && sudo apt upgrade -y
curl -fsSL https://deb.nodesource.com/setup_22.x | sudo -E bash -
sudo apt install -y nodejs nginx
node -v   # v22.x
```

## 3. MongoDB (Atlas)

1. Create a free cluster at cloud.mongodb.com.
2. Database user with strong password, allow access from your EC2 IP (or `0.0.0.0/0` with a strong password).
3. Copy the `mongodb+srv://…` connection string.

## 4. Get the code onto the server

```bash
mkdir -p ~/athena && cd ~/athena
git clone <your-repo-url> .        # or scp the project folder
cd server
cp .env.example .env
```

Edit `server/.env`:

```
NODE_ENV=production
JWT_SECRET=<openssl rand -base64 48 output>
MONGO_URI=mongodb+srv://user:pass@cluster.mongodb.net/athena
ALLOW_SEEDING=false
CORS_ORIGIN=            # leave empty — same-origin
```

First launch only: set `ALLOW_SEEDING=true` once so demo data is created, then set it back to `false`. (Your real school data will come from real usage.)

## 5. Install and build

```bash
cd ~/athena/server && npm ci --omit=dev
cd ~/athena/client && npm ci && npm run build   # outputs to server/public
```

## 6. Run as a service

```bash
sudo cp ~/athena/deploy/athena-api.service /etc/systemd/system/
sudo systemctl daemon-reload
sudo systemctl enable --now athena-api
sudo systemctl status athena-api
curl http://localhost:5050/api/auth/me   # expect 401, not a crash
```

## 7. Nginx + HTTPS

```bash
sudo cp ~/athena/deploy/nginx.conf /etc/nginx/sites-available/athena
sudo ln -s /etc/nginx/sites-available/athena /etc/nginx/sites-enabled/
sudo rm -f /etc/nginx/sites-enabled/default
sudo nginx -t && sudo systemctl reload nginx
sudo apt install -y certbot python3-certbot-nginx
sudo certbot --nginx -d school.example.com   # or use --register-unsafely-without-email
```

Point a DNS **A record** (e.g. `school.example.com`) at the EC2 Elastic IP first.

## 8. Deploying updates

```bash
cd ~/athena && git pull
cd client && npm ci && npm run build
cd ../server && npm ci --omit=dev
sudo systemctl restart athena-api
```

## Security checklist

- [ ] `.env` never committed — it is gitignored; `server/.env.example` is the template.
- [ ] `JWT_SECRET` is a long random value (server refuses to boot without it in production).
- [ ] Real MongoDB (`MONGO_URI`) — the in-memory demo database is dev-only and data would be lost on restart.
- [ ] Only `443` exposed publicly; SSH limited to your IP.
- [ ] HTTPS enforced (HTTP → 301 redirect).
- [ ] Login is rate-limited (10 attempts / 15 min), the whole API is rate-limited, and Helmet sets security headers + CSP.
- [ ] Default demo passwords (`password123`) must be changed before real use — reset them from the Teachers/Students panels.
