# 🚀 MedMate Deployment Guide

## Vercel Deployment

### Prerequisites
- Vercel account (https://vercel.com)
- GitHub repository connected to Vercel
- API keys ready (Gemini, Google Maps)

### Step 1: Connect Repository to Vercel

1. Go to [Vercel Dashboard](https://vercel.com/dashboard)
2. Click **"Add New Project"**
3. Import your GitHub repository: `MedMate---AI-Health-Assistant-v2`
4. Vercel will auto-detect the framework

### Step 2: Configure Build Settings

Vercel should auto-detect these settings:

- **Framework Preset**: Vite
- **Build Command**: `npm run vercel-build` or `vite build`
- **Output Directory**: `dist`
- **Install Command**: `npm install`

### Step 3: Set Environment Variables

In Vercel Dashboard → Project Settings → Environment Variables, add:

#### Required Variables:
```
GEMINI_API_KEY=your_gemini_api_key_here
GOOGLE_MAPS_API_KEY=your_google_maps_api_key_here
SECRET_KEY=your_secret_key_here
DATABASE_URL=your_postgresql_url_here
```

#### Optional Variables:
```
OPENAI_API_KEY=your_openai_key_here
GOOGLE_CLIENT_ID=your_google_oauth_client_id
GOOGLE_CLIENT_SECRET=your_google_oauth_secret
```

#### Frontend Variable:
```
VITE_API_URL=https://your-project.vercel.app
```

### Step 4: Database Setup (PostgreSQL)

#### Option 1: Neon (Recommended)
1. Go to [Neon](https://neon.tech)
2. Create a new project
3. Copy the connection string
4. Add to Vercel as `DATABASE_URL`

#### Option 2: Vercel Postgres
1. In Vercel Dashboard → Storage
2. Create Postgres Database
3. Connection string auto-added to environment

### Step 5: Deploy

1. Click **"Deploy"** in Vercel
2. Wait for build to complete
3. Your app will be live at: `https://your-project.vercel.app`

### Step 6: Update CORS Settings

After deployment, update `MedMate.py` CORS origins:

```python
CORS(app, 
     supports_credentials=True, 
     origins=[
         'http://localhost:8080',
         'http://127.0.0.1:8080',
         'https://your-project.vercel.app',  # Add your Vercel URL
         'https://*.vercel.app'  # Allow all Vercel preview deployments
     ])
```

## Environment Variables Reference

### Backend (.env or Vercel Environment Variables)

| Variable | Required | Description | Example |
|----------|----------|-------------|---------|
| `GEMINI_API_KEY` | ✅ Yes | Google Gemini API key | `AIzaSy...` |
| `GOOGLE_MAPS_API_KEY` | ✅ Yes | Google Maps API key | `AIzaSy...` |
| `DATABASE_URL` | ✅ Yes | PostgreSQL connection string | `postgresql://...` |
| `SECRET_KEY` | ⚠️ Recommended | Flask secret key | `random_string` |
| `OPENAI_API_KEY` | ❌ Optional | OpenAI API key (fallback) | `sk-...` |

### Frontend (.env.local or Vercel Build Variables)

| Variable | Required | Description | Example |
|----------|----------|-------------|---------|
| `VITE_API_URL` | ✅ Yes | Backend API URL | `https://your-project.vercel.app` |

## Deployment Checklist

### Before Deployment:
- [ ] All API keys obtained
- [ ] Database created (PostgreSQL)
- [ ] Repository pushed to GitHub
- [ ] `.env` file NOT committed (in `.gitignore`)
- [ ] `vercel.json` configured
- [ ] CORS origins updated

### After Deployment:
- [ ] Environment variables set in Vercel
- [ ] Database tables created automatically
- [ ] Test user registration
- [ ] Test AI diagnosis
- [ ] Test image upload
- [ ] Test hospital finder
- [ ] Check browser console for errors

## Troubleshooting

### Build Fails
- Check Node.js version (18+)
- Verify all dependencies in `package.json`
- Check build logs in Vercel dashboard

### API Errors
- Verify environment variables are set
- Check API key validity
- Review CORS configuration
- Check database connection

### Database Issues
- Ensure PostgreSQL URL is correct
- Check database permissions
- Verify tables are created

### CORS Errors
- Add Vercel URL to CORS origins
- Enable credentials in CORS
- Check browser console for specific errors

## Custom Domain (Optional)

1. Go to Vercel Dashboard → Project → Settings → Domains
2. Add your custom domain
3. Update DNS records as instructed
4. Update `VITE_API_URL` to your custom domain
5. Update CORS origins in backend

## Monitoring

### Vercel Analytics
- Enable in Project Settings → Analytics
- Monitor page views, performance, and errors

### Logs
- View real-time logs in Vercel Dashboard
- Check for API errors and warnings

## Scaling

### Performance Optimization
- Enable Vercel Edge Network
- Use Vercel Image Optimization
- Enable caching for static assets

### Database Scaling
- Upgrade Neon plan for more connections
- Enable connection pooling
- Add database indexes

## Security

### Production Checklist:
- [ ] HTTPS enabled (automatic on Vercel)
- [ ] Environment variables secured
- [ ] CORS restricted to your domain
- [ ] Rate limiting implemented
- [ ] API keys rotated regularly
- [ ] Database backups enabled

## Continuous Deployment

Vercel automatically deploys when you push to GitHub:

1. Push to `main` branch → Production deployment
2. Push to other branches → Preview deployments
3. Pull requests → Automatic preview URLs

## Support

For deployment issues:
- Check [Vercel Documentation](https://vercel.com/docs)
- Review deployment logs
- Contact support: rohillamanas06@gmail.com

---

**Happy Deploying! 🚀**
