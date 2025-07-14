# 🚀 Deployment Guide - Scripture Dominion: War of Light

This guide will help you deploy the application to make it publicly accessible with persistent data storage.

## 📋 Prerequisites

- Node.js 16+ installed
- Git repository set up
- Account on a hosting platform (recommended options below)

## 🏗️ Architecture Overview

The application now includes:
- **Frontend**: React/TypeScript app (port 3000)
- **Backend**: Node.js/Express server with Socket.IO (port 5000)
- **Real-time Communication**: WebSocket connections for live game updates
- **Persistence**: Server-side game state storage

## 🌐 Recommended Hosting Platforms

### 1. **Railway** (Recommended - Easy & Free)
- ✅ Free tier available
- ✅ Automatic deployments
- ✅ Built-in database support
- ✅ Easy environment variable management

### 2. **Render** (Good Alternative)
- ✅ Free tier available
- ✅ Automatic deployments
- ✅ Good performance

### 3. **Heroku** (Paid but Reliable)
- ✅ Very reliable
- ✅ Good documentation
- ✅ Requires credit card for verification

### 4. **Vercel** (Frontend Only - Need Separate Backend)
- ✅ Excellent for frontend
- ✅ Need separate backend hosting

## 🚀 Quick Deployment Steps

### Option 1: Railway (Recommended)

1. **Install Railway CLI:**
   ```bash
   npm install -g @railway/cli
   ```

2. **Login to Railway:**
   ```bash
   railway login
   ```

3. **Initialize Railway project:**
   ```bash
   railway init
   ```

4. **Set environment variables:**
   ```bash
   railway variables set NODE_ENV=production
   railway variables set FRONTEND_URL=https://your-app-name.railway.app
   ```

5. **Deploy:**
   ```bash
   railway up
   ```

### Option 2: Render

1. **Connect your GitHub repository to Render**
2. **Create a new Web Service**
3. **Configure:**
   - **Build Command:** `npm install && npm run build && cd backend && npm install`
   - **Start Command:** `cd backend && npm start`
   - **Environment Variables:**
     - `NODE_ENV=production`
     - `FRONTEND_URL=https://your-app-name.onrender.com`

### Option 3: Heroku

1. **Install Heroku CLI:**
   ```bash
   npm install -g heroku
   ```

2. **Login to Heroku:**
   ```bash
   heroku login
   ```

3. **Create Heroku app:**
   ```bash
   heroku create your-app-name
   ```

4. **Set environment variables:**
   ```bash
   heroku config:set NODE_ENV=production
   heroku config:set FRONTEND_URL=https://your-app-name.herokuapp.com
   ```

5. **Deploy:**
   ```bash
   git push heroku main
   ```

## 🔧 Local Development Setup

1. **Install dependencies:**
   ```bash
   npm install
   cd backend && npm install && cd ..
   ```

2. **Set up environment variables:**
   ```bash
   # Create .env file in backend folder
   echo "NODE_ENV=development" > backend/.env
   echo "PORT=5000" >> backend/.env
   echo "FRONTEND_URL=http://localhost:3000" >> backend/.env
   ```

3. **Start backend server:**
   ```bash
   cd backend && npm run dev
   ```

4. **Start frontend (in new terminal):**
   ```bash
   npm start
   ```

## 📊 Database Options (For Production)

Currently using in-memory storage. For production persistence, consider:

### 1. **MongoDB Atlas** (Recommended)
- Free tier available
- Easy to set up
- Good for document-based data

### 2. **PostgreSQL** (Railway/Render)
- Built-in support on Railway/Render
- More structured data
- Better for complex queries

### 3. **Redis** (For Caching)
- Fast in-memory storage
- Good for session data
- Can be used alongside other databases

## 🔒 Security Considerations

1. **Environment Variables:**
   - Never commit `.env` files
   - Use platform-specific secret management
   - Set `NODE_ENV=production` in production

2. **CORS Configuration:**
   - Update `FRONTEND_URL` to your production domain
   - Restrict origins in production

3. **Rate Limiting:**
   - Consider adding rate limiting for API endpoints
   - Protect against abuse

## 📱 PWA Configuration

The app is configured as a Progressive Web App:

1. **Manifest file:** `public/manifest.json`
2. **Service Worker:** Can be added for offline functionality
3. **HTTPS Required:** All PWA features require HTTPS

## 🔍 Monitoring & Debugging

1. **Health Check Endpoint:** `/api/health`
2. **Game State API:** `/api/games/:gameId`
3. **Socket.IO Events:** Monitor real-time connections

## 🚨 Troubleshooting

### Common Issues:

1. **Port conflicts:**
   - Backend runs on port 5000
   - Frontend runs on port 3000
   - Update ports in environment variables if needed

2. **CORS errors:**
   - Check `FRONTEND_URL` environment variable
   - Ensure it matches your production domain

3. **Socket.IO connection issues:**
   - Verify WebSocket support on hosting platform
   - Check firewall settings

4. **Build failures:**
   - Ensure Node.js version is 16+
   - Check for missing dependencies
   - Verify TypeScript compilation

## 📞 Support

If you encounter issues:
1. Check the hosting platform's logs
2. Verify environment variables
3. Test locally first
4. Check the platform's documentation

## 🎯 Next Steps

After deployment:
1. Test all game functionality
2. Set up monitoring
3. Configure custom domain (optional)
4. Set up SSL certificate (automatic on most platforms)
5. Consider adding a database for persistence

---

**Happy Deploying! 🎮✨** 