# 🏥 MedMate - AI Medical Assistant

> Your intelligent healthcare companion powered by Google Gemini AI

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![React](https://img.shields.io/badge/React-18.x-blue.svg)](https://reactjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.x-blue.svg)](https://www.typescriptlang.org/)
[![Python](https://img.shields.io/badge/Python-3.11+-green.svg)](https://www.python.org/)
[![Flask](https://img.shields.io/badge/Flask-3.x-black.svg)](https://flask.palletsprojects.com/)
[![GitHub](https://img.shields.io/badge/GitHub-Repository-black.svg)](https://github.com/rohillamanas06-commits/MedMate---AI-Health-Assistant-v2)

![MedMate Home Page](C:\Users\manas\OneDrive\Pictures\Screenshots\Screenshot (435).png)

🔗 **Repository**: [https://github.com/rohillamanas06-commits/MedMate---AI-Health-Assistant-v2](https://github.com/rohillamanas06-commits/MedMate---AI-Health-Assistant-v2)

## 📋 Table of Contents

- [About](#-about-medmate)
- [Features](#-features)
- [Tech Stack](#️-tech-stack)
- [Installation](#-installation)
- [Configuration](#-configuration)
- [Usage](#-usage)
- [API Documentation](#-api-documentation)
- [Deployment](#-deployment)
- [Screenshots](#-screenshots)
- [Contributing](#-contributing)
- [License](#-license)

## 🏥 About MedMate

MedMate is an advanced AI-powered medical assistant platform that provides instant medical insights using cutting-edge AI technology. Built with **Google Gemini 2.5 Flash** for lightning-fast, accurate medical analysis.

### Why MedMate?

- 🚀 **Instant Analysis** - Get medical insights in seconds
- 🎯 **High Accuracy** - Powered by Google's latest Gemini 2.5 Flash model
- 🔒 **Secure & Private** - Your health data is encrypted and protected
- 📱 **Accessible Anywhere** - Works on desktop, tablet, and mobile
- 🌐 **24/7 Availability** - AI assistant available round the clock

## ✨ Features

### Core Functionality

#### 🤖 AI Symptom Diagnosis
- Describe your symptoms in natural language
- Get instant AI-powered analysis with confidence scores
- Receive detailed explanations and recommended solutions
- Urgency level assessment (Low/Medium/High)
- Voice input support for hands-free operation

#### 🖼️ Medical Image Analysis
- **Multiple Image Upload** - Upload up to 5 medical images at once
- AI-powered image analysis using Gemini Vision
- Detailed observations and condition detection
- Confidence scores for each detected condition
- Professional evaluation recommendations

#### 💬 24/7 AI Chat Assistant
- Interactive conversation with medical AI
- Context-aware responses
- Chat history tracking
- **Smart Audio Controls**:
  - Text-to-speech for all AI responses
  - Auto-stop previous audio when playing new message
  - Visual indicators for playing audio
  - Toggle play/pause on each message

#### 🏥 Hospital Finder
- Find nearby hospitals and medical facilities
- Integrated with Google Maps
- Real-time location services
- Hospital ratings and contact information
- Distance calculation from your location

#### 📊 Medical History
- Track all your diagnoses
- View past conversations
- Export medical records
- Organized timeline view

### Additional Features

- ✅ **User Authentication** - Secure login and registration
- ✅ **Voice Recognition** - Hands-free symptom input
- ✅ **Text-to-Speech** - Audio playback for accessibility
- ✅ **Responsive Design** - Works on all devices
- ✅ **Dark Mode Support** - Easy on the eyes
- ✅ **Real-time Updates** - Instant feedback and notifications

## 🛠️ Tech Stack

### Frontend

- **React 18** - Modern UI framework
- **TypeScript** - Type-safe development
- **Vite** - Lightning-fast build tool
- **Tailwind CSS** - Utility-first styling
- **Shadcn/ui** - Beautiful component library
- **React Router** - Client-side routing
- **Lucide Icons** - Modern icon library
- **Sonner** - Toast notifications

### Backend

- **Flask 3.x** - Python web framework
- **SQLAlchemy** - Database ORM
- **PostgreSQL** - Production database (Neon)
- **Google Gemini 2.5 Flash** - AI model for analysis
- **Google Maps API** - Location services
- **Flask-CORS** - Cross-origin support
- **Werkzeug** - Security utilities

### AI & APIs

- **Google Generative AI (Gemini)** - Primary AI provider
- **Google Maps Geocoding** - Location services
- **Web Speech API** - Voice recognition & TTS

## 📦 Installation

### Prerequisites

- **Node.js** 18+ and npm
- **Python** 3.11+
- **PostgreSQL** (or SQLite for development)
- **Google Gemini API Key**
- **Google Maps API Key**

### Backend Setup

```bash
# Clone the repository
git clone https://github.com/rohillamanas06-commits/MedMate---AI-Health-Assistant-v2.git
cd MedMate---AI-Health-Assistant-v2

# Create virtual environment
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate

# Install Python dependencies
pip install -r requirements.txt

# Create .env file
cp .env.example .env

# Add your API keys to .env
# GEMINI_API_KEY=your_gemini_api_key
# GOOGLE_MAPS_API_KEY=your_google_maps_key
# DATABASE_URL=your_database_url (optional)

# Run the Flask backend
python MedMate.py
```

The backend will run on `http://localhost:5000`

### Frontend Setup

```bash
# Install Node dependencies
npm install

# Update .env with backend URL
echo "VITE_API_URL=http://localhost:5000" > .env

# Start development server
npm run dev
```

The frontend will run on `http://localhost:8080`

## 🔧 Configuration

### Environment Variables

#### Backend (.env)
```env
# Required
GEMINI_API_KEY=your_gemini_api_key_here
GOOGLE_MAPS_API_KEY=your_google_maps_key_here

# Optional
DATABASE_URL=postgresql://user:pass@host/db  # Defaults to SQLite
SECRET_KEY=your_secret_key_here              # Auto-generated if not set
OPENAI_API_KEY=your_openai_key_here          # Optional fallback

# Email Configuration (for password reset)
MAIL_USERNAME=your_gmail@gmail.com
MAIL_PASSWORD=your_gmail_app_password        # See setup instructions below
FRONTEND_URL=http://localhost:5173           # Your frontend URL
```

#### Frontend (.env)
```env
VITE_API_URL=http://localhost:5000
```

### Getting API Keys

1. **Google Gemini API Key**
   - Visit [Google AI Studio](https://makersuite.google.com/app/apikey)
   - Create a new API key
   - Copy and paste into `.env`

2. **Google Maps API Key**
   - Visit [Google Cloud Console](https://console.cloud.google.com/)
   - Enable Maps JavaScript API and Geocoding API
   - Create credentials
   - Copy API key to `.env`

3. **Gmail App Password** (for password reset emails)
   - Visit [Google Account Settings](https://myaccount.google.com/apppasswords)
   - Generate a new app password for "Mail"
   - Copy the 16-character password to `.env` as `MAIL_PASSWORD`
   - Use your Gmail address for `MAIL_USERNAME`

## 🚀 Usage

### 1. Register/Login
- Create an account with username, email, and strong password
- Password requirements: 8+ characters, uppercase, lowercase, number, special character
- Email validation and security checks
- **Forgot Password**: Click "Forgot password?" on login page
- Receive password reset email with secure link
- Reset your password using the link (valid for 1 hour)

### 2. Diagnose Symptoms
- Navigate to **Diagnose** page
- Choose **Text Input** or **Image Analysis** tab
- Enter symptoms or upload medical images (up to 5)
- Click **Analyze** to get AI-powered insights

### 3. Chat with AI
- Go to **AI Chat** page
- Ask medical questions in natural language
- Use voice input for hands-free operation
- Click volume icon to hear responses

### 4. Find Hospitals
- Visit **Find Hospitals** page
- Enter your city or allow location access
- View nearby hospitals on map
- Get directions and contact information

### 5. View History
- Check **History** page for past diagnoses
- Review previous chat conversations
- Track your medical journey

## 📡 API Documentation

### Authentication Endpoints

```http
POST /api/register
Content-Type: application/json

{
  "username": "string",
  "email": "string",
  "password": "string"
}
```

```http
POST /api/login
Content-Type: application/json

{
  "username": "string",
  "password": "string"
}
```

```http
GET /api/check-auth
Returns: { authenticated: boolean, user: object }
```

```http
POST /api/forgot-password
Content-Type: application/json

{
  "email": "string"
}
```

```http
POST /api/reset-password
Content-Type: application/json

{
  "token": "string",
  "password": "string"
}
```

```http
POST /api/verify-reset-token
Content-Type: application/json

{
  "token": "string"
}
Returns: { valid: boolean, user?: object }
```

### Diagnosis Endpoints

```http
POST /api/diagnose
Content-Type: application/json

{
  "symptoms": "string"
}
```

```http
POST /api/diagnose-image
Content-Type: multipart/form-data

{
  "image": File,
  "symptoms": "string" (optional)
}
```

### Chat Endpoints

```http
POST /api/chat
Content-Type: application/json

{
  "message": "string"
}
```

```http
GET /api/chat-history?page=1&per_page=20
Returns: { chats: array, total: number, pages: number }
```

### Hospital Finder Endpoints

```http
POST /api/geocode-city
Content-Type: application/json

{
  "city": "string"
}
```

```http
POST /api/nearby-hospitals
Content-Type: application/json

{
  "latitude": number,
  "longitude": number,
  "radius": number (optional)
}
```

## 🚢 Deployment

### Frontend Deployment (Vercel)

```bash
# Build for production
npm run build

# Deploy to Vercel
vercel --prod
```

### Backend Deployment (Render - Free)

**Quick Deploy to Render (Recommended for free hosting)**

Render offers a free tier with automatic SSL, PostgreSQL database, and seamless GitHub integration.

📖 **See detailed guide**: [RENDER_DEPLOYMENT.md](RENDER_DEPLOYMENT.md)

**Quick steps:**
1. Push code to GitHub
2. Create Render account at [render.com](https://render.com)
3. Create PostgreSQL database
4. Create Web Service from GitHub repo
5. Add environment variables
6. Deploy!

### Alternative: Railway Deployment

```bash
# Ensure requirements.txt is up to date
pip freeze > requirements.txt

# Deploy to Railway
railway up
```

### Environment Variables for Production

Make sure to set all environment variables in your deployment platform:
- `GEMINI_API_KEY`
- `GOOGLE_MAPS_API_KEY`
- `DATABASE_URL`
- `SECRET_KEY`
- `SENDGRID_API_KEY` (for password reset)
- `FRONTEND_URL` (your Vercel deployment URL)

## 📸 Screenshots

### Home Page
![Home Page](C:/Users/manas/OneDrive/Pictures/Screenshots/Screenshot (435).png)

### AI Diagnosis
![Diagnosis](docs/screenshots/diagnose.png)

### AI Chat
![Chat](docs/screenshots/chat.png)

### Hospital Finder
![Hospitals](docs/screenshots/hospitals.png)

## 🤝 Contributing

Contributions are welcome! Please follow these steps:

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

### Development Guidelines

- Follow TypeScript best practices
- Write meaningful commit messages
- Add comments for complex logic
- Test your changes thoroughly
- Update documentation as needed

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## ⚠️ Medical Disclaimer

**IMPORTANT**: MedMate is for informational and educational purposes only. It does not provide medical advice, diagnosis, or treatment. 

- Always consult with qualified healthcare providers for medical concerns
- Do not rely solely on AI-generated information for medical decisions
- In case of emergency, call your local emergency services immediately
- This tool is not a substitute for professional medical advice

## 🙏 Acknowledgments

- **Google Gemini** - For providing advanced AI capabilities
- **Shadcn/ui** - For beautiful UI components
- **Tailwind CSS** - For utility-first styling
- **React Community** - For amazing tools and libraries
- **Cascade AI** - For development assistance and code optimization

## 📞 Support

For issues, questions, or suggestions:

- 🐛 [Report a Bug](https://github.com/rohillamanas06-commits/MedMate---AI-Health-Assistant-v2/issues)
- 💡 [Request a Feature](https://github.com/rohillamanas06-commits/MedMate---AI-Health-Assistant-v2/issues)
- 📧 Email: rohillamanas06@gmail.com

## 🌟 Star History

If you find MedMate helpful, please consider giving it a star ⭐

---

**Built with ❤️ by [Rohilla Manas](https://github.com/rohillamanas06-commits)**

*Powered by Google Gemini 2.5 Flash | React | TypeScript | Flask*
