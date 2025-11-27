#!/bin/bash
# Nkaranova Deployment Script for DigitalOcean Droplet

set -e

echo "=== Nkaranova Deployment ==="

# Clone repository
cd /root
if [ -d "nkaranova" ]; then
  echo "Updating existing repo..."
  cd nkaranova
  git pull origin main
else
  echo "Cloning repository..."
  git clone https://github.com/Techtink/nkaranova.git
  cd nkaranova
fi

# Generate JWT secret
JWT_SECRET=$(openssl rand -base64 64 | tr -d '\n')

# Create backend .env.production
cat > backend/.env.production << 'ENVEOF'
# Server
PORT=5000
NODE_ENV=production

# MongoDB
MONGODB_URI=mongodb+srv://nerve:Pa55w0rd@cluster0.erqidae.mongodb.net/fashionova?retryWrites=true&w=majority

# JWT
JWT_SECRET=PLACEHOLDER_JWT_SECRET
JWT_EXPIRE=7d
JWT_COOKIE_EXPIRE=7

# Frontend URL (for CORS)
FRONTEND_URL=http://167.71.82.139

# Stripe (disabled for now)
STRIPE_SECRET_KEY=sk_test_placeholder
STRIPE_WEBHOOK_SECRET=whsec_placeholder

# Email (disabled for now - using console logging)
EMAIL_HOST=smtp.mailtrap.io
EMAIL_PORT=2525
EMAIL_USER=placeholder
EMAIL_PASS=placeholder
EMAIL_FROM="Nkaranova <noreply@nkaranova.com>"

# OpenAI (disabled for now)
OPENAI_API_KEY=sk-placeholder
ENVEOF

# Replace JWT secret placeholder
sed -i "s|PLACEHOLDER_JWT_SECRET|${JWT_SECRET}|g" backend/.env.production

# Create root .env.production for docker-compose
cat > .env.production << 'ENVEOF'
VITE_API_URL=http://167.71.82.139:5000/api
VITE_STRIPE_PUBLISHABLE_KEY=pk_test_placeholder
ENVEOF

# Rename .env.production to .env for docker-compose
cp backend/.env.production backend/.env

# Build and start with Docker Compose
echo "Building and starting containers..."
docker compose -f docker-compose.prod.yml down 2>/dev/null || true
VITE_API_URL=http://167.71.82.139:5000/api docker compose -f docker-compose.prod.yml up -d --build

echo ""
echo "=== Deployment Complete ==="
echo "Frontend: http://167.71.82.139"
echo "Backend API: http://167.71.82.139:5000/api"
echo ""
echo "Check status: docker compose -f docker-compose.prod.yml ps"
echo "View logs: docker compose -f docker-compose.prod.yml logs -f"
