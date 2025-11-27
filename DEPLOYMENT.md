# Nkaranova Deployment Guide - DigitalOcean

This guide walks you through deploying the Nkaranova tailor marketplace to DigitalOcean.

## Prerequisites

- DigitalOcean account
- Domain name (optional but recommended)
- MongoDB Atlas account (free tier works for starting)
- Stripe account (for payments)

## Option 1: DigitalOcean Droplet (Recommended for full control)

### Step 1: Create a Droplet

1. Log in to DigitalOcean
2. Click "Create" > "Droplets"
3. Choose an image: **Ubuntu 24.04 LTS**
4. Choose a plan: **Basic** > **Regular** > **$12/mo (2GB RAM, 1 vCPU)**
5. Choose a datacenter region close to your users
6. Authentication: **SSH Key** (recommended) or Password
7. Click "Create Droplet"

### Step 2: Connect to Your Droplet

```bash
ssh root@your_droplet_ip
```

### Step 3: Initial Server Setup

```bash
# Update system
apt update && apt upgrade -y

# Install Docker
curl -fsSL https://get.docker.com -o get-docker.sh
sh get-docker.sh

# Install Docker Compose
apt install docker-compose-plugin -y

# Verify installation
docker --version
docker compose version

# Create app user (optional but recommended)
adduser deploy
usermod -aG docker deploy
```

### Step 4: Clone Your Repository

```bash
# If using deploy user
su - deploy

# Clone from GitHub
git clone https://github.com/YOUR_USERNAME/nkaranova.git
cd nkaranova
```

### Step 5: Configure Environment Variables

```bash
# Copy example files
cp backend/.env.production.example backend/.env.production
cp .env.production.example .env.production

# Edit backend environment
nano backend/.env.production
```

Fill in your production values:
- `MONGODB_URI`: Your MongoDB Atlas connection string
- `JWT_SECRET`: Generate with `openssl rand -base64 64`
- `FRONTEND_URL`: Your domain (e.g., https://yourdomain.com)
- `STRIPE_SECRET_KEY`: Your Stripe secret key
- `EMAIL_*`: Your email service credentials
- `OPENAI_API_KEY`: Your OpenAI API key

```bash
# Edit frontend environment
nano .env.production
```

Fill in:
- `VITE_API_URL`: Your API URL (e.g., https://api.yourdomain.com/api)
- `VITE_STRIPE_PUBLISHABLE_KEY`: Your Stripe publishable key

### Step 6: Deploy with Docker Compose

```bash
# Build and start containers
docker compose -f docker-compose.prod.yml up -d --build

# Check status
docker compose -f docker-compose.prod.yml ps

# View logs
docker compose -f docker-compose.prod.yml logs -f
```

### Step 7: Set Up Domain and SSL (Optional but Recommended)

If you have a domain:

1. Point your domain's A record to your droplet's IP
2. Install Certbot for SSL:

```bash
apt install certbot python3-certbot-nginx -y

# Stop the frontend container temporarily
docker compose -f docker-compose.prod.yml stop frontend

# Get SSL certificate
certbot certonly --standalone -d yourdomain.com -d www.yourdomain.com

# Start frontend again
docker compose -f docker-compose.prod.yml start frontend
```

### Step 8: Set Up Firewall

```bash
ufw allow OpenSSH
ufw allow 80/tcp
ufw allow 443/tcp
ufw enable
```

---

## Option 2: DigitalOcean App Platform (Easier, Managed)

App Platform handles infrastructure automatically but costs more.

### Step 1: Push Code to GitHub

```bash
# From your local machine
git remote add origin https://github.com/YOUR_USERNAME/nkaranova.git
git add .
git commit -m "Initial commit"
git push -u origin main
```

### Step 2: Create App on DigitalOcean

1. Go to DigitalOcean > Apps > Create App
2. Connect your GitHub repository
3. Configure components:

**Backend Service:**
- Name: `backend`
- Source Directory: `/backend`
- Build Command: (leave empty, uses Dockerfile)
- HTTP Port: 5000
- Instance Size: Basic ($5/mo)

**Frontend Service:**
- Name: `frontend`
- Source Directory: `/frontend`
- Build Command: `npm run build`
- Output Directory: `dist`
- Instance Size: Static Site (free with paid backend)

### Step 3: Configure Environment Variables

In App Settings, add all environment variables from your `.env.production.example` files.

---

## MongoDB Atlas Setup

1. Go to [MongoDB Atlas](https://cloud.mongodb.com)
2. Create a free cluster
3. Create a database user
4. Whitelist your server IP (or 0.0.0.0/0 for any IP)
5. Get your connection string and update `MONGODB_URI`

---

## Useful Commands

```bash
# Restart all services
docker compose -f docker-compose.prod.yml restart

# Stop all services
docker compose -f docker-compose.prod.yml down

# View specific service logs
docker compose -f docker-compose.prod.yml logs -f backend

# Rebuild and restart
docker compose -f docker-compose.prod.yml up -d --build

# Enter container shell
docker compose -f docker-compose.prod.yml exec backend sh

# Check container resource usage
docker stats
```

---

## Troubleshooting

### Backend won't start
```bash
# Check logs
docker compose -f docker-compose.prod.yml logs backend

# Common issues:
# - MongoDB connection failed: Check MONGODB_URI and IP whitelist
# - Port already in use: Check if another process uses port 5000
```

### Frontend shows blank page
```bash
# Check if backend is reachable
curl http://localhost:5000/api/health

# Ensure VITE_API_URL is correct and accessible
```

### CORS errors
- Ensure `FRONTEND_URL` in backend matches your actual frontend URL
- Check if backend and frontend use the same protocol (both http or both https)

---

## Backup Strategy

### Database Backup
MongoDB Atlas provides automatic backups. For manual backup:
```bash
mongodump --uri="your_mongodb_uri" --out=/backup/$(date +%Y%m%d)
```

### File Uploads Backup
```bash
# Backup uploads volume
docker run --rm -v nkaranova_backend_uploads:/data -v $(pwd):/backup alpine tar cvf /backup/uploads_$(date +%Y%m%d).tar /data
```
