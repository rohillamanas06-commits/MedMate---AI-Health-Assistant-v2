"""
MedMate - AI-Powered Medical Assistant
A comprehensive medical diagnosis and assistance platform
"""

import sys
import io

# Fix Windows console encoding for emoji support
if sys.platform == 'win32':
    sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8')
    sys.stderr = io.TextIOWrapper(sys.stderr.buffer, encoding='utf-8')

from flask import Flask, request, jsonify, session, redirect, url_for, send_from_directory
from flask_sqlalchemy import SQLAlchemy
from flask_cors import CORS
from sendgrid import SendGridAPIClient
from sendgrid.helpers.mail import Mail
from werkzeug.security import generate_password_hash, check_password_hash
from werkzeug.utils import secure_filename
from datetime import datetime, timedelta
import os
import json
from openai import OpenAI
import requests
import base64
from functools import wraps
import secrets
import threading
from dotenv import load_dotenv
import google.generativeai as genai
import re
from email_validator import validate_email, EmailNotValidError

# Optional import for text-to-speech (not available in serverless)
try:
    import pyttsx3
    PYTTSX3_AVAILABLE = True
except ImportError:
    PYTTSX3_AVAILABLE = False
    pyttsx3 = None

# Load environment variables
load_dotenv()

# Initialize Flask app
app = Flask(__name__)
app.config['SECRET_KEY'] = os.getenv('SECRET_KEY', secrets.token_hex(32))

# Enable CORS for frontend communication
CORS(app, 
     supports_credentials=True, 
     origins=[
         'http://localhost:8000',  # Vite dev server port
         'http://127.0.0.1:8000', 
         'http://localhost:8080', 
         'http://127.0.0.1:8080', 
         'http://localhost:5173', 
         'http://127.0.0.1:5173',
         'https://med-mate-ai-health-assistant-v2.vercel.app',  # Your Vercel domain
         'https://*.vercel.app',  # All Vercel preview deployments
         'https://*.onrender.com'  # Render deployment
     ],
     allow_headers=['Content-Type', 'Authorization'],
     methods=['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'])

# Session configuration for proper cookie handling
app.config['SESSION_COOKIE_HTTPONLY'] = True

# Set SESSION_COOKIE_SECURE and SESSION_COOKIE_SAMESITE based on environment
# In production (Railway/Vercel), use True for HTTPS and None for SameSite
# In local development, use False for HTTP and Lax for SameSite
is_production = os.getenv('RAILWAY_ENVIRONMENT') or os.getenv('RENDER') or os.getenv('VERCEL')

if is_production:
    app.config['SESSION_COOKIE_SECURE'] = True  # HTTPS required
    app.config['SESSION_COOKIE_SAMESITE'] = 'None'  # Allow cross-domain
else:
    app.config['SESSION_COOKIE_SECURE'] = False  # HTTP for local
    app.config['SESSION_COOKIE_SAMESITE'] = 'Lax'  # Better for local development

app.config['PERMANENT_SESSION_LIFETIME'] = timedelta(days=30)  # Extended to 30 days

# Database configuration - PostgreSQL for production, SQLite for local
DATABASE_URL = os.getenv('DATABASE_URL')

if DATABASE_URL:
    # Production: Use PostgreSQL
    if DATABASE_URL.startswith('postgres://'):
        DATABASE_URL = DATABASE_URL.replace('postgres://', 'postgresql://', 1)
    
    # Configure SQLAlchemy for PostgreSQL
    app.config['SQLALCHEMY_DATABASE_URI'] = DATABASE_URL
    app.config['SQLALCHEMY_ENGINE_OPTIONS'] = {
        'pool_pre_ping': True,
        'pool_recycle': 300,
        'pool_size': 20,  # Increased pool size for faster queries
        'max_overflow': 30,  # More overflow connections
        'connect_args': {
            'sslmode': 'require',
            'connect_timeout': 30,  # Increased for reliability
            'application_name': 'medmate_app'  # Helpful for monitoring
        }
    }
    upload_folder = '/tmp/uploads' if os.getenv('VERCEL') else 'static/uploads'
    print("✅ Using PostgreSQL database for production")
    print(f"📍 Database host: {DATABASE_URL.split('@')[1].split('/')[0] if '@' in DATABASE_URL else 'unknown'}")
else:
    # Local development: Use SQLite
    if os.getenv('VERCEL'):
        db_path = '/tmp/medmate.db'
        upload_folder = '/tmp/uploads'
        print("⚠️ WARNING: Using temporary SQLite on Vercel - accounts will not persist!")
    else:
        db_path = 'medmate.db'
        upload_folder = 'static/uploads'
        print("✅ Using SQLite database for local development")
    
    app.config['SQLALCHEMY_DATABASE_URI'] = f'sqlite:///{db_path}'

app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False
app.config['UPLOAD_FOLDER'] = upload_folder
app.config['MAX_CONTENT_LENGTH'] = 16 * 1024 * 1024  # 16MB max file size

# Ensure upload folder exists
os.makedirs(app.config['UPLOAD_FOLDER'], exist_ok=True)

# Initialize database
db = SQLAlchemy(app)

# Email configuration - SendGrid
SENDGRID_API_KEY = os.getenv('SENDGRID_API_KEY')

# Database initialization function for serverless
def init_db():
    """Initialize database tables - called on each request in serverless"""
    try:
        # Check if profile_picture column exists, if not add it
        try:
            from sqlalchemy import inspect, text
            inspector = inspect(db.engine)
            columns = [col['name'] for col in inspector.get_columns('user')]
            if 'profile_picture' not in columns:
                print("⚠️ Adding profile_picture column to user table...")
                with db.engine.connect() as conn:
                    conn.execute(text("ALTER TABLE \"user\" ADD COLUMN IF NOT EXISTS profile_picture VARCHAR(300)"))
                    conn.commit()
                print("✅ profile_picture column added successfully")
        except Exception as migration_error:
            print(f"⚠️ Migration check skipped (development mode): {migration_error}")
        
        db.create_all()
        
        # Create indexes for better query performance
        try:
            from sqlalchemy import inspect, text
            inspector = inspect(db.engine)
            
            # Create indexes if they don't exist
            with db.engine.connect() as conn:
                # Index for diagnosis.user_id
                conn.execute(text("CREATE INDEX IF NOT EXISTS idx_diagnosis_user_id ON diagnosis(user_id)"))
                # Index for diagnosis.created_at
                conn.execute(text("CREATE INDEX IF NOT EXISTS idx_diagnosis_created_at ON diagnosis(created_at)"))
                # Index for chat_history.user_id
                conn.execute(text("CREATE INDEX IF NOT EXISTS idx_chat_history_user_id ON chat_history(user_id)"))
                # Index for chat_history.created_at
                conn.execute(text("CREATE INDEX IF NOT EXISTS idx_chat_history_created_at ON chat_history(created_at)"))
                conn.commit()
            print("✅ Database indexes created/verified successfully")
        except Exception as index_error:
            print(f"⚠️ Index creation skipped: {index_error}")
        
        print("✅ Database tables created/verified successfully")
        return True
    except Exception as e:
        print(f"❌ Database initialization error: {e}")
        import traceback
        traceback.print_exc()
        return False

# Hook to ensure database is initialized before each request and refresh session
@app.before_request
def ensure_db_initialized():
    """Ensure database tables exist before processing request"""
    if not hasattr(app, '_db_initialized'):
        with app.app_context():
            success = init_db()
            if success:
                app._db_initialized = True
                print(f"📊 Database URI: {app.config['SQLALCHEMY_DATABASE_URI'][:50]}...")
            else:
                print("⚠️ Database initialization failed, but continuing...")
    
    # Refresh session expiration time on each request if user is authenticated
    if 'user_id' in session:
        session.permanent = True
        session.modified = True  # This tells Flask to send a new cookie with updated expiration

# Initialize text-to-speech engine
tts_engine = None
tts_lock = threading.Lock()  # Thread lock for TTS engine
if PYTTSX3_AVAILABLE:
    try:
        tts_engine = pyttsx3.init()
        tts_engine.setProperty('rate', 150)
        tts_engine.setProperty('volume', 0.9)
    except Exception as e:
        print(f"TTS initialization warning: {e}")
else:
    print("TTS not available (running in serverless environment)")

# Load API keys from environment variables
OPENAI_API_KEY = os.getenv('OPENAI_API_KEY', '')
GEMINI_API_KEY = os.getenv('GEMINI_API_KEY', '')
GOOGLE_MAPS_API_KEY = os.getenv('GOOGLE_MAPS_API_KEY', '')

# Initialize AI clients (prioritize Gemini over OpenAI)
openai_client = None
gemini_model = None
ai_provider = None

if GEMINI_API_KEY:
    try:
        print(f"🔧 Configuring Gemini API...")
        genai.configure(api_key=GEMINI_API_KEY)
        
        # Initialize model without testing (lazy loading)
        # Use the most common model that should work
        gemini_model = genai.GenerativeModel('models/gemini-2.5-flash')
        ai_provider = 'gemini'
        print(f"✓ Gemini API configured (model will be tested on first use)")
    except Exception as e:
        print(f"⚠️ Gemini API configuration warning: {type(e).__name__}: {str(e)}")
        gemini_model = None

if not gemini_model and OPENAI_API_KEY:
    try:
        openai_client = OpenAI(api_key=OPENAI_API_KEY)
        ai_provider = 'openai'
        print(f"✓ OpenAI API configured (key: ...{OPENAI_API_KEY[-8:]})") if len(OPENAI_API_KEY) > 8 else print("✓ OpenAI API configured")
    except Exception as e:
        print(f"✗ OpenAI API initialization failed: {e}")

if not ai_provider:
    print("✗ No AI API configured - using demo mode")

# Allowed file extensions
ALLOWED_EXTENSIONS = {'png', 'jpg', 'jpeg', 'gif', 'bmp', 'webp'}

# ==================== DATABASE MODELS ====================

class User(db.Model):
    """User model for authentication"""
    id = db.Column(db.Integer, primary_key=True)
    username = db.Column(db.String(80), unique=True, nullable=False)
    email = db.Column(db.String(120), unique=True, nullable=False)
    password_hash = db.Column(db.String(200), nullable=False)
    profile_picture = db.Column(db.String(300), nullable=True)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    
    # Relationships
    diagnoses = db.relationship('Diagnosis', backref='user', lazy=True, cascade='all, delete-orphan')
    chat_history = db.relationship('ChatHistory', backref='user', lazy=True, cascade='all, delete-orphan')
    reset_tokens = db.relationship('PasswordResetToken', backref='user', lazy=True, cascade='all, delete-orphan')
    account_deletion_tokens = db.relationship('AccountDeletionToken', backref='user', lazy=True, cascade='all, delete-orphan')
    
    def set_password(self, password):
        self.password_hash = generate_password_hash(password)
    
    def check_password(self, password):
        return check_password_hash(self.password_hash, password)

class PasswordResetToken(db.Model):
    """Password reset token model"""
    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('user.id'), nullable=False)
    token = db.Column(db.String(200), unique=True, nullable=False)
    expires_at = db.Column(db.DateTime, nullable=False)
    used = db.Column(db.Boolean, default=False)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    
    def is_valid(self):
        """Check if token is valid and not expired"""
        return not self.used and datetime.utcnow() < self.expires_at


class AccountDeletionToken(db.Model):
    """Store verification codes for account deletion"""
    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('user.id'), nullable=False, index=True)
    code = db.Column(db.String(6), nullable=False)
    expires_at = db.Column(db.DateTime, nullable=False)
    attempts = db.Column(db.Integer, default=0)
    created_at = db.Column(db.DateTime, default=datetime.utcnow, index=True)

    def is_valid(self):
        return datetime.utcnow() < self.expires_at

class Diagnosis(db.Model):
    """Store diagnosis history"""
    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('user.id'), nullable=False, index=True)
    symptoms = db.Column(db.Text, nullable=False)
    diagnosis_result = db.Column(db.Text, nullable=False)  # JSON string
    image_path = db.Column(db.String(300), nullable=True)
    created_at = db.Column(db.DateTime, default=datetime.utcnow, index=True)
    
    def get_result_dict(self):
        try:
            return json.loads(self.diagnosis_result)
        except:
            return {}

class ChatHistory(db.Model):
    """Store chat conversations with AI assistant"""
    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('user.id'), nullable=False, index=True)
    message = db.Column(db.Text, nullable=False)
    response = db.Column(db.Text, nullable=False)
    created_at = db.Column(db.DateTime, default=datetime.utcnow, index=True)

class Hospital(db.Model):
    """Store hospital information"""
    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(200), nullable=False)
    address = db.Column(db.Text, nullable=False)
    phone = db.Column(db.String(20), nullable=True)
    latitude = db.Column(db.Float, nullable=False)
    longitude = db.Column(db.Float, nullable=False)
    rating = db.Column(db.Float, default=0.0)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

# ==================== HELPER FUNCTIONS ====================

def validate_email_format(email):
    """Validate email format using email-validator"""
    try:
        validate_email(email, check_deliverability=False)
        return True
    except EmailNotValidError:
        return False

def validate_password_strength(password):
    """
    Validate password strength
    Requirements:
    - At least 8 characters
    - At least one uppercase letter
    - At least one lowercase letter
    - At least one digit
    - At least one special character
    """
    if len(password) < 8:
        return False, "Password must be at least 8 characters long"
    
    if not re.search(r'[A-Z]', password):
        return False, "Password must contain at least one uppercase letter"
    
    if not re.search(r'[a-z]', password):
        return False, "Password must contain at least one lowercase letter"
    
    if not re.search(r'\d', password):
        return False, "Password must contain at least one digit"
    
    if not re.search(r'[!@#$%^&*(),.?":{}|<>]', password):
        return False, "Password must contain at least one special character"
    
    return True, None

def send_feedback_email(name, email, message):
    """Send feedback email to author using SendGrid"""
    print("=" * 50)
    print("📧 SENDING FEEDBACK EMAIL")
    print("=" * 50)
    print(f"📋 From: {name} ({email})")
    print(f"📧 To: rohillamanas06@gmail.com")
    print(f"📝 Message: {message[:100]}...")
    print(f"📋 SendGrid configured: {bool(SENDGRID_API_KEY)}")
    print("=" * 50)
    
    try:
        if not SENDGRID_API_KEY:
            print("❌ SendGrid API key not configured")
            return False
        
        sg = SendGridAPIClient(api_key=SENDGRID_API_KEY)
        
        message_body = Mail(
            from_email='rohillamanas06@gmail.com',
            to_emails='rohillamanas06@gmail.com',
            subject='MedMate Feedback',
            html_content=f"""
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px; text-align: center;">
                    <h1 style="color: white; margin: 0;">MedMate Feedback</h1>
                </div>
                <div style="background: #f9f9f9; padding: 30px;">
                    <h2 style="color: #333; margin-top: 0;">New Feedback Received</h2>
                    <p style="color: #666; line-height: 1.6;">
                        You have received new feedback from a user.
                    </p>
                    <div style="background: white; padding: 20px; border-radius: 5px; margin: 20px 0;">
                        <p style="margin: 5px 0;"><strong>Name:</strong> {name}</p>
                        <p style="margin: 5px 0;"><strong>Email:</strong> {email}</p>
                        <p style="margin: 5px 0; white-space: pre-wrap;"><strong>Message:</strong> {message}</p>
                    </div>
                </div>
                <div style="background: #eee; padding: 20px; text-align: center;">
                    <p style="color: #999; font-size: 12px; margin: 0;">
                        © 2024 MedMate. All rights reserved.
                    </p>
                </div>
            </div>
            """
        )
        
        response = sg.send(message_body)
        print("=" * 50)
        print(f"✅ Feedback email sent successfully! Status: {response.status_code}")
        print("=" * 50)
        return True
    except Exception as e:
        print("=" * 50)
        print(f"❌ Error sending feedback email: {e}")
        print("=" * 50)
        import traceback
        traceback.print_exc()
        return False

def send_password_reset_email(user_email, reset_link):
    """Send password reset email using SendGrid"""
    try:
        print(f"📧 Attempting to send password reset email to: {user_email}")
        
        if not SENDGRID_API_KEY:
            print("❌ SendGrid API key not configured")
            return False
        
        sg = SendGridAPIClient(api_key=SENDGRID_API_KEY)
        
        message = Mail(
            from_email='rohillamanas06@gmail.com',
            to_emails=user_email,
            subject='Reset Your MedMate Password',
            html_content=f"""
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px; text-align: center;">
                    <h1 style="color: white; margin: 0;">MedMate</h1>
                    <p style="color: white; margin: 10px 0 0 0;">AI-Powered Medical Assistant</p>
                </div>
                <div style="background: #f9f9f9; padding: 30px;">
                    <h2 style="color: #333; margin-top: 0;">Password Reset Request</h2>
                    <p style="color: #666; line-height: 1.6;">
                        We received a request to reset your password for your MedMate account. 
                        Click the button below to reset your password.
                    </p>
                    <div style="text-align: center; margin: 30px 0;">
                        <a href="{reset_link}" 
                           style="display: inline-block; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); 
                                  color: white; padding: 15px 40px; text-decoration: none; 
                                  border-radius: 5px; font-weight: bold;">
                            Reset Password
                        </a>
                    </div>
                    <p style="color: #999; font-size: 14px; line-height: 1.6;">
                        If you didn't request this, please ignore this email. Your password will remain unchanged.
                    </p>
                    <p style="color: #999; font-size: 12px; margin-top: 20px; padding-top: 20px; border-top: 1px solid #ddd;">
                        This link will expire in 1 hour for security reasons.
                    </p>
                </div>
                <div style="background: #eee; padding: 20px; text-align: center;">
                    <p style="color: #999; font-size: 12px; margin: 0;">
                        © 2024 MedMate. All rights reserved.
                    </p>
                </div>
            </div>
            """,
        )
        
        message.reply_to = 'rohillamanas06@gmail.com'
        
        response = sg.send(message)
        print(f"✅ Password reset email sent successfully to: {user_email}")
        print(f"📊 SendGrid status: {response.status_code}")
        
        return True
    except Exception as e:
        print(f"❌ Error sending email: {e}")
        import traceback
        traceback.print_exc()
        return False

def send_account_deletion_code(user_email, username, code):
    """Send account deletion verification code via email"""
    try:
        print(f"📧 Sending account deletion code to: {user_email}")

        if not SENDGRID_API_KEY:
            print("❌ SendGrid API key not configured")
            return False

        sg = SendGridAPIClient(api_key=SENDGRID_API_KEY)
        message = Mail(
            from_email='rohillamanas06@gmail.com',
            to_emails=user_email,
            subject='Confirm Your MedMate Account Deletion',
            html_content=f"""
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                <div style="background: linear-gradient(135deg, #ff5f6d 0%, #ffc371 100%); padding: 30px; text-align: center;">
                    <h1 style="color: white; margin: 0;">MedMate</h1>
                    <p style="color: white; margin: 10px 0 0 0;">Account Deletion Request</p>
                </div>
                <div style="background: #f9f9f9; padding: 30px;">
                    <p style="color: #333; line-height: 1.6;">
                        Hi {username},
                    </p>
                    <p style="color: #666; line-height: 1.6;">
                        We received a request to delete your MedMate account. If this was you, please use the verification code below to confirm the deletion. This code will expire in 10 minutes.
                    </p>
                    <div style="text-align: center; margin: 30px 0;">
                        <div style="display: inline-block; padding: 15px 40px; font-size: 28px; letter-spacing: 6px; background: #fff; border: 2px dashed #ff5f6d; border-radius: 8px; color: #ff5f6d;">
                            {code}
                        </div>
                    </div>
                    <p style="color: #999; font-size: 14px; line-height: 1.6;">
                        If you did not request this, please ignore this email. Your account will remain active.
                    </p>
                </div>
                <div style="background: #eee; padding: 20px; text-align: center;">
                    <p style="color: #999; font-size: 12px; margin: 0;">
                        © 2024 MedMate. All rights reserved.
                    </p>
                </div>
            </div>
            """,
        )
        message.reply_to = 'rohillamanas06@gmail.com'
        response = sg.send(message)
        print(f"✅ Account deletion code sent (status {response.status_code})")
        return True
    except Exception as e:
        print(f"❌ Error sending account deletion code: {e}")
        import traceback
        traceback.print_exc()
        return False

def login_required(f):
    """Decorator to require login for routes"""
    @wraps(f)
    def decorated_function(*args, **kwargs):
        if 'user_id' not in session:
            # Check if this is an API request or page request
            if request.path.startswith('/api/'):
                return jsonify({'error': 'Authentication required'}), 401
            else:
                # Redirect to home page for non-API requests
                return redirect(url_for('index'))
        return f(*args, **kwargs)
    return decorated_function

def allowed_file(filename):
    """Check if file extension is allowed"""
    return '.' in filename and filename.rsplit('.', 1)[1].lower() in ALLOWED_EXTENSIONS

def speak_text(text):
    """Convert text to speech with thread safety and queue management"""
    global tts_engine
    
    def _speak():
        global tts_engine
        try:
            if not tts_engine:
                print("TTS engine not initialized")
                return
            
            print(f"Starting TTS for: {text[:50]}...")
            
            with tts_lock:  # Ensure only one speech at a time
                # Stop any ongoing speech first
                try:
                    tts_engine.stop()
                except:
                    pass
                
                # Speak the text
                tts_engine.say(text)
                tts_engine.runAndWait()
                
                print("TTS completed successfully")
                
                # Small delay to ensure engine is ready for next call
                import time
                time.sleep(0.2)
                
        except Exception as e:
            print(f"TTS error: {e}")
            import traceback
            traceback.print_exc()
            
            # Reinitialize engine if it fails
            try:
                print("Attempting to reinitialize TTS engine...")
                tts_engine = pyttsx3.init()
                tts_engine.setProperty('rate', 150)
                tts_engine.setProperty('volume', 0.9)
                print("TTS engine reinitialized successfully")
            except Exception as reinit_error:
                print(f"Failed to reinitialize TTS: {reinit_error}")
    
    thread = threading.Thread(target=_speak)
    thread.daemon = True
    thread.start()

# ==================== AI FUNCTIONS ====================

def analyze_symptoms_with_ai(symptoms):
    """
    Analyze symptoms using AI (Gemini or OpenAI) to predict possible diseases
    Returns: List of diseases with confidence percentages and solutions
    """
    try:
        prompt = f"""You are a medical AI assistant. Analyze the following symptoms and provide:
1. Top 3-5 possible diseases/conditions with confidence percentages (must add up to 100%)
2. Brief explanation for each
3. Recommended solutions/treatments
4. When to see a doctor (urgency level: Low/Medium/High)

Symptoms: {symptoms}

Respond in JSON format:
{{
    "diseases": [
        {{
            "name": "Disease Name",
            "confidence": 45,
            "explanation": "Why this might be the condition",
            "solutions": ["Solution 1", "Solution 2"],
            "urgency": "Medium"
        }}
    ],
    "general_advice": "General health advice",
    "disclaimer": "Medical disclaimer"
}}"""

        # Try Gemini first with timeout
        if gemini_model:
            try:
                print(f"🔄 Calling Gemini API for symptoms: {symptoms[:50]}...")
                
                # Use threading to implement timeout
                import threading
                import time
                
                result_container = {'data': None, 'error': None}
                
                def call_gemini():
                    try:
                        response = gemini_model.generate_content(prompt)
                        result_text = response.text
                        print(f"📥 Gemini raw response: {result_text[:200]}...")
                        
                        # Clean up markdown code blocks if present
                        if '```json' in result_text:
                            result_text = result_text.split('```json')[1].split('```')[0].strip()
                        elif '```' in result_text:
                            result_text = result_text.split('```')[1].split('```')[0].strip()
                        
                        result = json.loads(result_text)
                        result_container['data'] = result
                    except Exception as e:
                        result_container['error'] = e
                
                # Start the API call in a separate thread
                thread = threading.Thread(target=call_gemini)
                thread.daemon = True
                thread.start()
                
                # Wait for result with timeout (60 seconds for text analysis)
                thread.join(timeout=60)
                
                if thread.is_alive():
                    print("⏰ Gemini API call timed out after 60s, using fallback")
                    return get_fallback_diagnosis(symptoms)
                
                if result_container['error']:
                    raise result_container['error']
                
                if result_container['data']:
                    print(f"✓ Gemini diagnosis completed successfully")
                    return result_container['data']
                
            except Exception as e:
                print(f"❌ Gemini error: {type(e).__name__}: {str(e)}")
                import traceback
                traceback.print_exc()
                print("⚠️ Falling back to alternative method...")
        
        # Fallback to OpenAI with timeout
        if openai_client:
            try:
                print(f"🔄 Calling OpenAI API for symptoms: {symptoms[:50]}...")
                
                # Use threading to implement timeout
                result_container = {'data': None, 'error': None}
                
                def call_openai():
                    try:
                        response = openai_client.chat.completions.create(
                            model="gpt-3.5-turbo",
                            messages=[
                                {"role": "system", "content": "You are a helpful medical AI assistant. Always include medical disclaimers."},
                                {"role": "user", "content": prompt}
                            ],
                            temperature=0.7,
                            max_tokens=1000
                        )
                        result = json.loads(response.choices[0].message.content)
                        result_container['data'] = result
                    except Exception as e:
                        result_container['error'] = e
                
                # Start the API call in a separate thread
                thread = threading.Thread(target=call_openai)
                thread.daemon = True
                thread.start()
                
                # Wait for result with timeout (45 seconds)
                thread.join(timeout=45)
                
                if thread.is_alive():
                    print("⏰ OpenAI API call timed out, using fallback")
                    return get_fallback_diagnosis(symptoms)
                
                if result_container['error']:
                    raise result_container['error']
                
                if result_container['data']:
                    print(f"✓ OpenAI diagnosis completed for: {symptoms[:50]}...")
                    return result_container['data']
                    
            except Exception as e:
                print(f"OpenAI error: {e}")
        
        # If both fail, use fallback
        print("No AI service available - using fallback")
        return get_fallback_diagnosis(symptoms)
    
    except Exception as e:
        print(f"AI Analysis Error: {e}")
        return get_fallback_diagnosis(symptoms)

def analyze_image_with_vision(image_path, symptoms=""):
    """
    Analyze medical image using AI Vision (Gemini or OpenAI)
    Returns: Analysis results with possible conditions
    """
    try:
        # Optimize image before analysis
        from PIL import Image
        img = Image.open(image_path)
        
        # Resize large images to improve performance
        max_size = (1024, 1024)
        if img.size[0] > max_size[0] or img.size[1] > max_size[1]:
            img.thumbnail(max_size, Image.Resampling.LANCZOS)
            print(f"📐 Image resized to: {img.size}")
        
        # Convert to RGB if needed
        if img.mode != 'RGB':
            img = img.convert('RGB')
        
        prompt = f"""Analyze this medical image quickly and efficiently. 
Symptoms provided: {symptoms if symptoms else 'None provided'}

Provide a concise analysis in JSON format:
{{
    "observation": "Brief description of what you see",
    "conditions": [
        {{"name": "Most likely condition", "confidence": 75, "note": "Brief details"}}
    ],
    "recommendation": "Brief recommendation",
    "professional_evaluation": "Required/Recommended/Optional"
}}

Keep response concise and focused."""

        # Try Gemini Vision first with timeout
        if gemini_model:
            try:
                print(f"🔄 Calling Gemini Vision API for image: {os.path.basename(image_path)}")
                
                # Use threading to implement timeout
                import threading
                import time
                
                result_container = {'data': None, 'error': None}
                
                def call_gemini():
                    try:
                        response = gemini_model.generate_content([prompt, img])
                        result_text = response.text
                        
                        # Clean up markdown code blocks if present
                        if '```json' in result_text:
                            result_text = result_text.split('```json')[1].split('```')[0].strip()
                        elif '```' in result_text:
                            result_text = result_text.split('```')[1].split('```')[0].strip()
                        
                        result = json.loads(result_text)
                        result_container['data'] = result
                    except Exception as e:
                        result_container['error'] = e
                
                # Start the API call in a separate thread
                thread = threading.Thread(target=call_gemini)
                thread.daemon = True
                thread.start()
                
                # Wait for result with timeout (60 seconds for image analysis)
                thread.join(timeout=60)
                
                if thread.is_alive():
                    print("⏰ Gemini API call timed out after 60s, using fallback")
                    return get_fallback_result(symptoms)
                
                if result_container['error']:
                    raise result_container['error']
                
                if result_container['data']:
                    print(f"✓ Gemini image analysis completed successfully")
                    return result_container['data']
                
            except Exception as e:
                print(f"❌ Gemini Vision error: {type(e).__name__}: {str(e)}")
                print("⚠️ Using fallback result...")
                return get_fallback_result(symptoms)
        
        # Fallback if no AI model available
        return get_fallback_result(symptoms)
        
    except Exception as e:
        print(f"❌ Image analysis error: {type(e).__name__}: {str(e)}")
        return get_fallback_result(symptoms)

def get_fallback_result(symptoms=""):
    """Provide a fallback result when AI analysis fails"""
    return {
        "observation": "Image received but AI analysis unavailable. Please consult a medical professional.",
        "conditions": [
            {"name": "Professional evaluation needed", "confidence": 100, "note": "AI analysis service temporarily unavailable"}
        ],
        "recommendation": "Please consult with a healthcare professional for proper diagnosis.",
        "professional_evaluation": "Required"
    }

def allowed_file(filename):
    """Check if file extension is allowed"""
    return '.' in filename and filename.rsplit('.', 1)[1].lower() in ALLOWED_EXTENSIONS

def chat_with_assistant(message, chat_history=[]):
    """
    Chat with AI medical assistant - ChatGPT-like conversational experience
    Returns: AI response
    """
    try:
        system_prompt = """You are MedMate, a friendly and knowledgeable medical AI assistant. 

Your personality:
- Conversational and empathetic, like ChatGPT
- Explain medical concepts in simple, easy-to-understand language
- Answer ANY health-related questions: diseases, symptoms, medications, nutrition, fitness, mental health, etc.
- Provide detailed, helpful responses
- Be supportive and understanding
- Use examples and analogies when helpful

You can discuss:
- General health and wellness
- Disease information and symptoms
- Medications and treatments
- Nutrition and diet
- Exercise and fitness
- Mental health
- First aid
- Preventive care
- Medical procedures
- And any other health topics

Always remind users to consult healthcare professionals for diagnosis and treatment, but provide comprehensive information to help them understand their health better."""

        # Try Gemini first with timeout
        if gemini_model:
            try:
                print(f"🔄 Calling Gemini API for chat: {message[:50]}...")
                
                # Use threading to implement timeout
                import threading
                
                result_container = {'data': None, 'error': None}
                
                def call_gemini():
                    try:
                        # Build conversation context for Gemini
                        conversation_context = system_prompt + "\n\n"
                        for chat in chat_history[-10:]:
                            conversation_context += f"User: {chat['message']}\nAssistant: {chat['response']}\n\n"
                        conversation_context += f"User: {message}\nAssistant:"
                        
                        response = gemini_model.generate_content(conversation_context)
                        ai_response = response.text
                        result_container['data'] = ai_response
                    except Exception as e:
                        result_container['error'] = e
                
                # Start the API call in a separate thread
                thread = threading.Thread(target=call_gemini)
                thread.daemon = True
                thread.start()
                
                # Wait for result with timeout (30 seconds for chat)
                thread.join(timeout=30)
                
                if thread.is_alive():
                    print("⏰ Gemini chat API call timed out, using fallback")
                    return "I'm here to help! However, the AI service is currently taking longer than expected. Please try again later."
                
                if result_container['error']:
                    raise result_container['error']
                
                if result_container['data']:
                    print(f"✓ Gemini chat response generated for: {message[:50]}...")
                    return result_container['data']
                    
            except Exception as e:
                print(f"Gemini chat error: {e}, falling back...")
        
        # Fallback to OpenAI with timeout
        if openai_client:
            try:
                print(f"🔄 Calling OpenAI API for chat: {message[:50]}...")
                
                result_container = {'data': None, 'error': None}
                
                def call_openai():
                    try:
                        messages = [{"role": "system", "content": system_prompt}]
                        
                        # Add chat history context (last 10 messages for better context)
                        for chat in chat_history[-10:]:
                            messages.append({"role": "user", "content": chat['message']})
                            messages.append({"role": "assistant", "content": chat['response']})
                        
                        messages.append({"role": "user", "content": message})
                        
                        response = openai_client.chat.completions.create(
                            model="gpt-3.5-turbo",
                            messages=messages,
                            temperature=0.9,
                            max_tokens=800
                        )
                        
                        ai_response = response.choices[0].message.content
                        result_container['data'] = ai_response
                    except Exception as e:
                        result_container['error'] = e
                
                # Start the API call in a separate thread
                thread = threading.Thread(target=call_openai)
                thread.daemon = True
                thread.start()
                
                # Wait for result with timeout (30 seconds)
                thread.join(timeout=30)
                
                if thread.is_alive():
                    print("⏰ OpenAI chat API call timed out, using fallback")
                    return "I'm here to help! However, the AI service is currently taking longer than expected. Please try again later."
                
                if result_container['error']:
                    raise result_container['error']
                
                if result_container['data']:
                    print(f"✓ OpenAI chat response generated for: {message[:50]}...")
                    return result_container['data']
                    
            except Exception as e:
                print(f"OpenAI chat error: {e}")
        
        # If both fail, return helpful message
        return "I'm here to help! However, the AI service is currently unavailable. Please try again later or check your API configuration."
    
    except Exception as e:
        print(f"Chat Error: {e}")
        return "I apologize, but I'm having trouble processing your request right now. Please try again."

def get_fallback_diagnosis(symptoms):
    """Fallback diagnosis when AI is unavailable"""
    return {
        "diseases": [
            {
                "name": "Common Cold",
                "confidence": 40,
                "explanation": "Based on general symptoms",
                "solutions": ["Rest", "Stay hydrated", "Over-the-counter medication"],
                "urgency": "Low"
            },
            {
                "name": "Viral Infection",
                "confidence": 35,
                "explanation": "Common viral symptoms",
                "solutions": ["Rest", "Fluids", "Monitor symptoms"],
                "urgency": "Medium"
            },
            {
                "name": "Allergic Reaction",
                "confidence": 25,
                "explanation": "Possible allergic response",
                "solutions": ["Identify allergen", "Antihistamines", "Avoid triggers"],
                "urgency": "Low"
            }
        ],
        "general_advice": "Monitor your symptoms and stay hydrated. If symptoms worsen, consult a doctor.",
        "disclaimer": "This is not a professional medical diagnosis. Please consult a healthcare provider for accurate diagnosis."
    }

def get_fallback_image_analysis():
    """Fallback image analysis when Vision API is unavailable"""
    return {
        "observation": "Image received but AI analysis is currently unavailable",
        "conditions": [
            {
                "name": "Unable to analyze",
                "confidence": 0,
                "note": "Please consult a healthcare professional for image analysis"
            }
        ],
        "recommendation": "Please show this image to a qualified healthcare provider for proper evaluation",
        "professional_evaluation": "Required"
    }

# ==================== GOOGLE MAPS FUNCTIONS ====================

def find_nearby_hospitals(latitude, longitude, radius=5000):
    """
    Find nearby hospitals using Google Places API with GPS coordinates
    Returns: List of hospitals with details
    """
    try:
        if not GOOGLE_MAPS_API_KEY:
            print("❌ Google Maps API key not configured")
            return get_fallback_hospitals()
        
        # Validate coordinates
        try:
            lat = float(latitude)
            lng = float(longitude)
        except (ValueError, TypeError):
            print(f"❌ Invalid coordinate format: {latitude}, {longitude}")
            return get_fallback_hospitals()
        
        if not (-90 <= lat <= 90) or not (-180 <= lng <= 180):
            print(f"❌ Coordinates out of range: {lat}, {lng}")
            return get_fallback_hospitals()
        
        print(f"🔍 Searching hospitals near GPS: {lat}, {lng} (radius: {radius}m)")
        
        url = "https://maps.googleapis.com/maps/api/place/nearbysearch/json"
        params = {
            'location': f'{lat},{lng}',
            'radius': radius,
            'type': 'hospital',
            'key': GOOGLE_MAPS_API_KEY
        }
        
        print(f"📡 Calling Google Maps API...")
        response = requests.get(url, params=params, timeout=10)
        data = response.json()
        
        print(f"📊 Google Maps API Status: {data.get('status')}")
        
        hospitals = []
        if data.get('status') == 'OK':
            for place in data.get('results', [])[:10]:  # Top 10 hospitals
                hospital = {
                    'name': place.get('name'),
                    'address': place.get('vicinity'),
                    'latitude': place['geometry']['location']['lat'],
                    'longitude': place['geometry']['location']['lng'],
                    'rating': place.get('rating', 0),
                    'open_now': place.get('opening_hours', {}).get('open_now', None),
                    'place_id': place.get('place_id')
                }
                hospitals.append(hospital)
            print(f"✅ Found {len(hospitals)} hospitals")
            if hospitals:
                print(f"📍 First hospital: {hospitals[0]['name']} at {hospitals[0]['address']}")
        elif data.get('status') == 'ZERO_RESULTS':
            print("⚠️ No hospitals found in this area")
        else:
            print(f"❌ Google Maps API error: {data.get('status')} - {data.get('error_message', 'Unknown error')}")
        
        return hospitals
    
    except Exception as e:
        print(f"❌ Google Maps API Error: {e}")
        import traceback
        traceback.print_exc()
        return get_fallback_hospitals()

def get_hospital_details(place_id):
    """Get detailed information about a specific hospital"""
    try:
        if not GOOGLE_MAPS_API_KEY:
            return {}
        
        url = "https://maps.googleapis.com/maps/api/place/details/json"
        params = {
            'place_id': place_id,
            'fields': 'name,formatted_address,formatted_phone_number,international_phone_number,opening_hours,rating,website',
            'key': GOOGLE_MAPS_API_KEY
        }
        
        response = requests.get(url, params=params)
        data = response.json()
        
        print(f"📍 Getting details for hospital: {place_id}")
        
        if data.get('status') == 'OK':
            result = data.get('result', {})
            # Try to get phone number from different fields
            phone = result.get('formatted_phone_number') or result.get('international_phone_number')
            print(f"📞 Phone number found: {phone}")
            if phone:
                result['phone'] = phone
            return result
        else:
            print(f"⚠️ API error: {data.get('status')} - {data.get('error_message', 'Unknown error')}")
        
        return {}
    
    except Exception as e:
        print(f"Hospital Details Error: {e}")
        import traceback
        traceback.print_exc()
        return {}

def get_fallback_hospitals():
    """Fallback hospitals when Google API is unavailable"""
    return [
        {
            'name': 'Local Hospital',
            'address': 'Please enable location services',
            'latitude': 0,
            'longitude': 0,
            'rating': 0,
            'open_now': None,
            'place_id': None
        }
    ]

# ==================== ROUTES ====================

@app.route('/')
def index():
    """API root - redirect to frontend"""
    # Get frontend URL from environment or use default
    frontend_url = os.getenv('FRONTEND_URL', 'https://med-mate-ai-health-assistant-v2.vercel.app')
    return jsonify({
        'message': 'MedMate API',
        'version': '1.0',
        'status': 'running',
        'frontend': frontend_url
    })

# ==================== AUTHENTICATION ROUTES ====================

@app.route('/api/register', methods=['POST'])
def register():
    """User registration"""
    try:
        data = request.get_json()
        username = data.get('username')
        email = data.get('email')
        password = data.get('password')
        
        print(f"📝 Registration attempt: username={username}, email={email}")
        
        # Validate all fields are provided
        if not all([username, email, password]):
            return jsonify({'error': 'All fields are required'}), 400
        
        # Validate username
        if len(username) < 3 or len(username) > 20:
            return jsonify({'error': 'Username must be between 3 and 20 characters'}), 400
        
        if not re.match(r'^[a-zA-Z0-9_]+$', username):
            return jsonify({'error': 'Username can only contain letters, numbers, and underscores'}), 400
        
        # Validate email format
        if not validate_email_format(email):
            return jsonify({'error': 'Please enter a valid email address'}), 400
        
        # Validate password strength
        is_valid, error_message = validate_password_strength(password)
        if not is_valid:
            return jsonify({'error': error_message}), 400
        
        # Check existing users
        existing_user = User.query.filter_by(username=username).first()
        if existing_user:
            print(f"⚠️ Username '{username}' already exists")
            return jsonify({'error': 'Username already exists'}), 400
        
        existing_email = User.query.filter_by(email=email).first()
        if existing_email:
            print(f"⚠️ Email '{email}' already exists")
            return jsonify({'error': 'Email already exists'}), 400
        
        # Create new user
        user = User(username=username, email=email)
        user.set_password(password)
        
        db.session.add(user)
        db.session.commit()
        
        print(f"✅ User registered successfully: ID={user.id}, username={user.username}")
        
        # Set session
        session.permanent = True
        session['user_id'] = user.id
        session['username'] = user.username
        
        # Get profile picture URL (will be None for new users)
        profile_pic_url = None
        if user.profile_picture:
            profile_pic_url = f"{request.url_root.rstrip('/')}/static/uploads/{user.profile_picture}"
        
        return jsonify({
            'message': 'Registration successful',
            'user': {
                'id': user.id,
                'username': user.username,
                'email': user.email,
                'profile_picture': user.profile_picture,
                'profile_picture_url': profile_pic_url,
                'created_at': user.created_at.isoformat() if user.created_at else None
            }
        }), 201
    
    except Exception as e:
        db.session.rollback()
        print(f"❌ Registration error: {e}")
        import traceback
        traceback.print_exc()
        return jsonify({'error': f'Registration failed: {str(e)}'}), 500

@app.route('/api/login', methods=['POST'])
def login():
    """User login"""
    try:
        data = request.get_json()
        username = data.get('username')
        password = data.get('password')
        
        print(f"🔐 Login attempt: username={username}")
        
        if not all([username, password]):
            return jsonify({'error': 'Username and password required'}), 400
        
        user = User.query.filter_by(username=username).first()
        
        if not user:
            print(f"⚠️ User '{username}' not found")
            return jsonify({'error': 'Invalid username or password'}), 401
        
        if not user.check_password(password):
            print(f"⚠️ Invalid password for user '{username}'")
            return jsonify({'error': 'Invalid username or password'}), 401
        
        session.permanent = True
        session['user_id'] = user.id
        session['username'] = user.username
        
        print(f"✅ Login successful: ID={user.id}, username={user.username}")
        
        # Get profile picture URL
        profile_pic_url = None
        if user.profile_picture:
            profile_pic_url = f"{request.url_root.rstrip('/')}/static/uploads/{user.profile_picture}"
        
        return jsonify({
            'message': 'Login successful',
            'user': {
                'id': user.id,
                'username': user.username,
                'email': user.email,
                'profile_picture': user.profile_picture,
                'profile_picture_url': profile_pic_url,
                'created_at': user.created_at.isoformat() if user.created_at else None
            }
        }), 200
    
    except Exception as e:
        print(f"❌ Login error: {e}")
        import traceback
        traceback.print_exc()
        return jsonify({'error': str(e)}), 500

@app.route('/api/google-login', methods=['POST'])
def google_login():
    """Handle Google OAuth login"""
    try:
        from google.oauth2 import id_token
        from google.auth.transport import requests as google_requests
        
        data = request.get_json()
        credential = data.get('credential')
        
        if not credential:
            return jsonify({'error': 'No credential provided'}), 400
        
        print(f"🔐 Google login attempt")
        
        # Verify the Google ID token
        try:
            idinfo = id_token.verify_oauth2_token(
                credential, 
                google_requests.Request(), 
                os.getenv('GOOGLE_CLIENT_ID')
            )
            
            # Extract user info from Google token
            google_id = idinfo['sub']
            email = idinfo['email']
            name = idinfo.get('name', email.split('@')[0])
            picture = idinfo.get('picture')
            
            print(f"✅ Google token verified: email={email}, name={name}")
            
            # Check if user exists
            user = User.query.filter_by(email=email).first()
            
            if user:
                # User exists - log them in
                print(f"✅ Existing user found: {user.username}")
            else:
                # Create new user with Google info
                # Generate unique username from email
                base_username = email.split('@')[0]
                username = base_username
                counter = 1
                while User.query.filter_by(username=username).first():
                    username = f"{base_username}{counter}"
                    counter += 1
                
                user = User(
                    username=username,
                    email=email,
                    password_hash=generate_password_hash(secrets.token_urlsafe(32))  # Random password for OAuth users
                )
                
                # Download profile picture if available
                if picture:
                    try:
                        import urllib.request
                        filename = f"google_{google_id}_{secrets.token_hex(8)}.jpg"
                        filepath = os.path.join(app.config['UPLOAD_FOLDER'], filename)
                        urllib.request.urlretrieve(picture, filepath)
                        user.profile_picture = filename
                        print(f"✅ Profile picture downloaded: {filename}")
                    except Exception as pic_error:
                        print(f"⚠️ Could not download profile picture: {pic_error}")
                
                db.session.add(user)
                db.session.commit()
                print(f"✅ New user created: {username}")
            
            # Set session
            session.permanent = True
            session['user_id'] = user.id
            session['username'] = user.username
            
            # Get profile picture URL
            profile_pic_url = None
            if user.profile_picture:
                profile_pic_url = f"{request.url_root.rstrip('/')}/static/uploads/{user.profile_picture}"
            
            return jsonify({
                'message': 'Login successful',
                'user': {
                    'id': user.id,
                    'username': user.username,
                    'email': user.email,
                    'profile_picture': user.profile_picture,
                    'profile_picture_url': profile_pic_url,
                    'created_at': user.created_at.isoformat() if user.created_at else None
                }
            }), 200
            
        except ValueError as verify_error:
            print(f"❌ Invalid Google token: {verify_error}")
            return jsonify({'error': 'Invalid Google token'}), 401
    
    except Exception as e:
        print(f"❌ Google login error: {e}")
        import traceback
        traceback.print_exc()
        return jsonify({'error': str(e)}), 500

@app.route('/api/logout', methods=['POST'])
def logout():
    """User logout"""
    session.clear()
    return jsonify({'message': 'Logout successful'}), 200

@app.route('/api/check-auth', methods=['GET'])
def check_auth():
    """Check if user is authenticated - optimized for speed"""
    if 'user_id' in session:
        try:
            # Fast query - only select needed columns
            user = db.session.query(User.id, User.username, User.email, User.profile_picture, User.created_at)\
                .filter(User.id == session['user_id']).first()
            
            if not user:
                return jsonify({'authenticated': False}), 200
            
            profile_pic_url = None
            if user.profile_picture:
                profile_pic_url = f"{request.url_root.rstrip('/')}/static/uploads/{user.profile_picture}"
            
            return jsonify({
                'authenticated': True,
                'user': {
                    'id': user.id,
                    'username': user.username,
                    'email': user.email,
                    'profile_picture': user.profile_picture,
                    'profile_picture_url': profile_pic_url,
                    'created_at': user.created_at.isoformat() if user.created_at else None
                }
            }), 200
        except Exception as e:
            print(f"⚠️ check-auth error: {e}")
            return jsonify({'authenticated': False}), 200
    return jsonify({'authenticated': False}), 200

@app.route('/api/forgot-password', methods=['POST'])
def forgot_password():
    """Handle forgot password request"""
    print("=" * 50)
    print("📧 FORGOT PASSWORD REQUEST RECEIVED")
    print("=" * 50)
    try:
        data = request.get_json()
        email = data.get('email')
        print(f"📧 Email received: {email}")
        
        if not email:
            print("❌ No email provided")
            return jsonify({'error': 'Email is required'}), 400
        
        # Validate email format
        if not validate_email_format(email):
            print("❌ Invalid email format")
            return jsonify({'error': 'Please enter a valid email address'}), 400
        
        # Find user by email
        print(f"🔍 Looking for user with email: {email}")
        user = User.query.filter_by(email=email).first()
        print(f"👤 User found: {user is not None}")
        
        # Always return success message (for security, don't reveal if email exists)
        if user:
            print(f"📝 Creating reset token for user: {user.email}")
            # Generate reset token
            token = secrets.token_urlsafe(32)
            expires_at = datetime.utcnow() + timedelta(hours=1)
            
            # Create reset token
            reset_token = PasswordResetToken(
                user_id=user.id,
                token=token,
                expires_at=expires_at
            )
            
            db.session.add(reset_token)
            db.session.commit()
            print(f"💾 Token saved to database")
            
            # Create reset link
            frontend_url = os.getenv('FRONTEND_URL', 'http://localhost:8080')
            reset_link = f"{frontend_url}/reset-password?token={token}"
            print(f"🔗 Reset link: {reset_link}")
            
            # Send email with threading to prevent timeout
            print(f"📧 Calling send_password_reset_email()...")
            
            # Start email thread
            email_thread = threading.Thread(target=send_password_reset_email, args=(user.email, reset_link))
            email_thread.daemon = True
            email_thread.start()
            
            # Wait a bit to ensure email is being sent
            import time
            time.sleep(1)  # 1 second delay to show some processing time
            
            print(f"✅ Password reset email thread started")
        else:
            print(f"⚠️ No user found with email: {email}")
        
        print("=" * 50)
        return jsonify({
            'message': 'If an account with that email exists, we have sent password reset instructions.'
        }), 200
    
    except Exception as e:
        db.session.rollback()
        print(f"❌ Forgot password error: {e}")
        import traceback
        traceback.print_exc()
        return jsonify({'error': 'An error occurred. Please try again later.'}), 500

@app.route('/api/reset-password', methods=['POST'])
def reset_password():
    """Handle password reset"""
    try:
        data = request.get_json()
        token = data.get('token')
        new_password = data.get('password')
        
        if not token or not new_password:
            return jsonify({'error': 'Token and new password are required'}), 400
        
        # Validate password strength
        is_valid, error_message = validate_password_strength(new_password)
        if not is_valid:
            return jsonify({'error': error_message}), 400
        
        # Find reset token with timeout protection
        try:
            reset_token = PasswordResetToken.query.filter_by(token=token).first()
        except Exception as query_error:
            print(f"❌ Database query error: {query_error}")
            return jsonify({'error': 'Database query failed. Please try again.'}), 500
        
        if not reset_token:
            return jsonify({'error': 'This reset link is invalid or has already been used. Please request a new one.'}), 400
        
        # Check if token is valid and not expired
        if not reset_token.is_valid():
            return jsonify({'error': 'This reset link has expired. Please request a new password reset.'}), 400
        
        # Update user password
        user = db.session.get(User, reset_token.user_id)
        if not user:
            return jsonify({'error': 'User not found'}), 404
        
        user.set_password(new_password)
        
        # Mark token as used
        reset_token.used = True
        
        db.session.commit()
        
        print(f"✅ Password reset successful for user: {user.email}")
        
        return jsonify({
            'message': 'Password reset successful. You can now login with your new password.'
        }), 200
    
    except Exception as e:
        db.session.rollback()
        print(f"❌ Reset password error: {e}")
        import traceback
        traceback.print_exc()
        return jsonify({'error': 'An error occurred. Please try again later.'}), 500

@app.route('/api/verify-reset-token', methods=['POST'])
def verify_reset_token():
    """Verify if reset token is valid"""
    try:
        data = request.get_json()
        token = data.get('token')
        
        if not token:
            return jsonify({'error': 'Token is required'}), 400
        
        reset_token = PasswordResetToken.query.filter_by(token=token).first()
        
        if not reset_token or not reset_token.is_valid():
            return jsonify({'valid': False}), 200
        
        return jsonify({
            'valid': True,
            'user': {
                'email': reset_token.user.email
            }
        }), 200
    
    except Exception as e:
        print(f"❌ Verify token error: {e}")
        return jsonify({'valid': False}), 200

# Temporary admin endpoint to get latest reset link (remove in production)
@app.route('/api/admin/latest-reset-link', methods=['GET'])
def get_latest_reset_link():
    """Get the latest password reset link for testing"""
    try:
        reset_token = PasswordResetToken.query.filter_by(used=False).order_by(PasswordResetToken.created_at.desc()).first()
        
        if not reset_token:
            return jsonify({'error': 'No active reset tokens found'}), 404
        
        if not reset_token.is_valid():
            return jsonify({'error': 'Token has expired'}), 400
        
        frontend_url = os.getenv('FRONTEND_URL', 'https://med-mate-ai-health-assistant-v2.vercel.app')
        reset_link = f"{frontend_url}/reset-password?token={reset_token.token}"
        
        return jsonify({
            'email': reset_token.user.email,
            'reset_link': reset_link,
            'token': reset_token.token,
            'created_at': reset_token.created_at.isoformat(),
            'expires_at': reset_token.expires_at.isoformat()
        }), 200
    
    except Exception as e:
        print(f"❌ Get latest reset link error: {e}")
        return jsonify({'error': str(e)}), 500

# Google OAuth removed - using local authentication only

# ==================== DIAGNOSIS ROUTES ====================

@app.route('/api/diagnose', methods=['POST'])
@login_required
def diagnose():
    """Analyze symptoms and provide diagnosis"""
    try:
        data = request.get_json()
        symptoms = data.get('symptoms', '')
        
        if not symptoms:
            return jsonify({'error': 'Symptoms are required'}), 400
        
        # Analyze symptoms with AI
        result = analyze_symptoms_with_ai(symptoms)
        
        # Save diagnosis to database
        diagnosis = Diagnosis(
            user_id=session['user_id'],
            symptoms=symptoms,
            diagnosis_result=json.dumps(result)
        )
        db.session.add(diagnosis)
        db.session.commit()
        
        return jsonify({
            'message': 'Diagnosis completed',
            'diagnosis_id': diagnosis.id,
            'result': result
        }), 200
    
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500

@app.route('/api/diagnose-image', methods=['POST'])
@login_required
def diagnose_image():
    """Analyze medical image with optional symptoms"""
    try:
        if 'image' not in request.files:
            return jsonify({'error': 'No image provided'}), 400
        
        file = request.files['image']
        symptoms = request.form.get('symptoms', '')
        
        if file.filename == '':
            return jsonify({'error': 'No file selected'}), 400
        
        if not allowed_file(file.filename):
            return jsonify({'error': 'Invalid file type'}), 400
        
        # Save file
        filename = secure_filename(f"{session['user_id']}_{datetime.now().timestamp()}_{file.filename}")
        filepath = os.path.join(app.config['UPLOAD_FOLDER'], filename)
        file.save(filepath)
        
        # Analyze image with Vision API
        result = analyze_image_with_vision(filepath, symptoms)
        
        # Save diagnosis to database
        diagnosis = Diagnosis(
            user_id=session['user_id'],
            symptoms=symptoms if symptoms else 'Image analysis',
            diagnosis_result=json.dumps(result),
            image_path=filename
        )
        db.session.add(diagnosis)
        db.session.commit()
        
        return jsonify({
            'message': 'Image analysis completed',
            'diagnosis_id': diagnosis.id,
            'result': result,
            'image_url': f"{request.url_root.rstrip('/')}{url_for('uploaded_file', filename=filename)}"
        }), 200
    
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500

@app.route('/api/diagnosis-history', methods=['GET'])
@login_required
def diagnosis_history():
    """Get user's diagnosis history - optimized for speed"""
    try:
        page = request.args.get('page', 1, type=int)
        per_page = request.args.get('per_page', 10, type=int)
        
        # Limit maximum items per page to prevent slow queries
        per_page = min(per_page, 100)  # Max 100 items per page
        
        # Optimized query - select only needed columns with proper ordering
        diagnoses = db.session.query(
            Diagnosis.id,
            Diagnosis.symptoms,
            Diagnosis.diagnosis_result,
            Diagnosis.image_path,
            Diagnosis.created_at
        ).filter_by(user_id=session['user_id'])\
        .order_by(Diagnosis.created_at.desc())\
        .limit(per_page).offset((page - 1) * per_page).all()
        
        # Get total count efficiently (cached result)
        from sqlalchemy import func
        total = db.session.query(func.count(Diagnosis.id)).filter_by(user_id=session['user_id']).scalar()
        
        # Optimized result building with list comprehension
        base_url = request.url_root.rstrip('/')
        results = []
        for d in diagnoses:
            # Parse JSON only once when needed
            result_dict = {}
            if d.diagnosis_result:
                try:
                    result_dict = json.loads(d.diagnosis_result)
                except:
                    pass
            
            image_url = None
            if d.image_path:
                filename = os.path.basename(d.image_path) if '/' in str(d.image_path) else str(d.image_path)
                image_url = f"{base_url}/static/uploads/{filename}"
            
            results.append({
                'id': d.id,
                'symptoms': d.symptoms,
                'result': result_dict,
                'image_url': image_url,
                'created_at': d.created_at.isoformat()
            })
        
        total_pages = (total + per_page - 1) // per_page if total > 0 else 0
        
        return jsonify({
            'diagnoses': results,
            'total': total,
            'pages': total_pages,
            'current_page': page
        }), 200
    
    except Exception as e:
        print(f"❌ History error: {e}")
        import traceback
        traceback.print_exc()
        return jsonify({'error': str(e)}), 500

# ==================== CHAT ASSISTANT ROUTES ====================

@app.route('/api/chat', methods=['POST'])
@login_required
def chat():
    """Chat with AI assistant"""
    try:
        data = request.get_json()
        message = data.get('message', '')
        
        if not message:
            return jsonify({'error': 'Message is required'}), 400
        
        # Get recent chat history for context
        recent_chats = ChatHistory.query.filter_by(user_id=session['user_id'])\
            .order_by(ChatHistory.created_at.desc())\
            .limit(5)\
            .all()
        
        chat_context = [{'message': c.message, 'response': c.response} for c in reversed(recent_chats)]
        
        # Get AI response
        response = chat_with_assistant(message, chat_context)
        
        # Save chat to database
        chat_entry = ChatHistory(
            user_id=session['user_id'],
            message=message,
            response=response
        )
        db.session.add(chat_entry)
        db.session.commit()
        
        return jsonify({
            'message': message,
            'response': response,
            'timestamp': chat_entry.created_at.isoformat()
        }), 200
    
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500

@app.route('/api/chat-history', methods=['GET'])
@login_required
def chat_history():
    """Get chat history - optimized for speed"""
    try:
        page = request.args.get('page', 1, type=int)
        per_page = request.args.get('per_page', 20, type=int)
        
        # Limit maximum items per page to prevent slow queries
        per_page = min(per_page, 100)  # Max 100 items per page
        
        chats = ChatHistory.query.filter_by(user_id=session['user_id'])\
            .order_by(ChatHistory.created_at.desc())\
            .limit(per_page).offset((page - 1) * per_page).all()
        
        # Get total count efficiently using scalar
        from sqlalchemy import func
        total = db.session.query(func.count(ChatHistory.id)).filter_by(user_id=session['user_id']).scalar()
        
        # Optimized result building
        results = [{
            'id': c.id,
            'message': c.message,
            'response': c.response,
            'created_at': c.created_at.isoformat()
        } for c in chats]
        
        total_pages = (total + per_page - 1) // per_page if total > 0 else 0
        
        return jsonify({
            'chats': results,
            'total': total,
            'pages': total_pages,
            'current_page': page
        }), 200
    
    except Exception as e:
        return jsonify({'error': str(e)}), 500

# ==================== VOICE INPUT ROUTE ====================

@app.route('/api/voice-to-text', methods=['POST'])
@login_required
def voice_to_text():
    """Process voice input text (from browser's Web Speech API)"""
    try:
        data = request.get_json()
        text = data.get('text', '')
        
        if not text:
            return jsonify({'error': 'No text provided'}), 400
        
        # Process the voice command
        # This is just acknowledging receipt - actual TTS happens in browser
        return jsonify({
            'message': 'Voice input received',
            'text': text,
            'status': 'success'
        }), 200
    
    except Exception as e:
        print(f"Voice input error: {e}")
        return jsonify({'error': str(e)}), 500

@app.route('/api/text-to-speech', methods=['POST'])
@login_required
def text_to_speech():
    """Return text for browser-based speech synthesis"""
    try:
        data = request.get_json()
        text = data.get('text', '')
        
        if not text:
            return jsonify({'error': 'No text provided'}), 400
        
        # Return text for browser's Speech Synthesis API
        # The actual speech happens on the client side
        return jsonify({
            'text': text,
            'status': 'success',
            'message': 'Text ready for speech synthesis'
        }), 200
    
    except Exception as e:
        print(f"TTS endpoint error: {e}")
        return jsonify({'error': str(e)}), 500

@app.route('/api/voice/status', methods=['GET'])
def voice_status():
    """Check voice features availability"""
    return jsonify({
        'voice_recognition': True,  # Browser-based Web Speech API
        'text_to_speech': True,     # Browser-based Speech Synthesis API
        'environment': 'serverless' if os.getenv('VERCEL') else 'local',
        'note': 'Voice features use browser APIs (Web Speech API)'
    }), 200

# ==================== HOSPITAL FINDER ROUTES ====================

@app.route('/api/geocode-city', methods=['POST'])
def geocode_city():
    """Convert city name to coordinates using Google Geocoding API"""
    try:
        data = request.get_json()
        city = data.get('city', '')
        
        if not city:
            return jsonify({'error': 'City name required'}), 400
        
        if not GOOGLE_MAPS_API_KEY:
            return jsonify({'error': 'Google Maps API not configured'}), 500
        
        # Add Haryana, India to improve accuracy
        search_query = f"{city}, Haryana, India"
        print(f"🔍 Geocoding city: {search_query}")
        
        url = "https://maps.googleapis.com/maps/api/geocode/json"
        params = {
            'address': search_query,
            'key': GOOGLE_MAPS_API_KEY
        }
        
        response = requests.get(url, params=params, timeout=10)
        data = response.json()
        
        if data.get('status') == 'OK' and data.get('results'):
            location = data['results'][0]['geometry']['location']
            formatted_address = data['results'][0]['formatted_address']
            
            print(f"✅ Found: {formatted_address}")
            print(f"📍 Coordinates: {location['lat']}, {location['lng']}")
            
            return jsonify({
                'latitude': location['lat'],
                'longitude': location['lng'],
                'formatted_address': formatted_address
            }), 200
        else:
            print(f"❌ Geocoding failed: {data.get('status')}")
            return jsonify({'error': 'City not found'}), 404
    
    except Exception as e:
        print(f"❌ Geocoding error: {e}")
        return jsonify({'error': str(e)}), 500

@app.route('/api/nearby-hospitals', methods=['POST'])
def nearby_hospitals():
    """Find nearby hospitals based on location"""
    try:
        data = request.get_json()
        latitude = data.get('latitude')
        longitude = data.get('longitude')
        radius = data.get('radius', 5000)  # Default 5km
        
        if not latitude or not longitude:
            return jsonify({'error': 'Location coordinates required'}), 400
        
        hospitals = find_nearby_hospitals(latitude, longitude, radius)
        
        return jsonify({
            'hospitals': hospitals,
            'count': len(hospitals)
        }), 200
    
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/hospital-details/<place_id>', methods=['GET'])
def hospital_details(place_id):
    """Get detailed information about a hospital"""
    try:
        details = get_hospital_details(place_id)
        return jsonify(details), 200
    
    except Exception as e:
        return jsonify({'error': str(e)}), 500

# ==================== FEEDBACK ROUTES ====================

@app.route('/api/feedback', methods=['POST'])
def feedback():
    """Handle feedback submission"""
    try:
        data = request.get_json()
        name = data.get('name', '')
        email = data.get('email', '')
        message = data.get('message', '')
        
        print(f"📝 Feedback received from: {name} ({email})")
        
        if not all([name, email, message]):
            return jsonify({'error': 'All fields are required'}), 400
        
        # Validate email format
        if not validate_email_format(email):
            return jsonify({'error': 'Please enter a valid email address'}), 400
        
        # Send feedback email with threading to prevent timeout
        print(f"📧 Sending feedback email...")
        
        # Start email thread
        feedback_thread = threading.Thread(target=send_feedback_email, args=(name, email, message))
        feedback_thread.daemon = True
        feedback_thread.start()
        
        # Wait a bit to ensure email is being sent (gives time for SMTP connection)
        import time
        time.sleep(1)  # 1 second delay to show some processing time
        
        print(f"✅ Feedback email thread started")
        
        return jsonify({'message': 'Feedback received successfully! Thank you for your input!'}), 200
    
    except Exception as e:
        print(f"❌ Feedback error: {e}")
        import traceback
        traceback.print_exc()
        return jsonify({'error': 'An error occurred. Please try again later.'}), 500

# ==================== PROFILE MANAGEMENT ROUTES ====================

@app.route('/api/profile', methods=['GET'])
@login_required
def get_profile():
    """Get current user profile"""
    try:
        user = db.session.get(User, session['user_id'])
        if not user:
            return jsonify({'error': 'User not found'}), 404
        
        return jsonify({
            'user': {
                'id': user.id,
                'username': user.username,
                'email': user.email,
                'profile_picture': user.profile_picture,
                'created_at': user.created_at.isoformat() if user.created_at else None
            }
        }), 200
    
    except Exception as e:
        print(f"❌ Get profile error: {e}")
        return jsonify({'error': str(e)}), 500

@app.route('/api/profile/picture', methods=['POST'])
@login_required
def upload_profile_picture():
    """Upload profile picture"""
    try:
        if 'image' not in request.files:
            return jsonify({'error': 'No image provided'}), 400
        
        file = request.files['image']
        
        if file.filename == '':
            return jsonify({'error': 'No file selected'}), 400
        
        if not allowed_file(file.filename):
            return jsonify({'error': 'Invalid file type. Allowed: PNG, JPG, JPEG, GIF, BMP, WEBP'}), 400
        
        # Save file
        filename = secure_filename(f"profile_{session['user_id']}_{datetime.now().timestamp()}_{file.filename}")
        filepath = os.path.join(app.config['UPLOAD_FOLDER'], filename)
        file.save(filepath)
        
        # Update user profile
        user = db.session.get(User, session['user_id'])
        if not user:
            return jsonify({'error': 'User not found'}), 404
        
        print(f"📸 Uploading profile picture for user: {user.username}")
        print(f"📁 Old profile picture: {user.profile_picture}")
        
        # Delete old profile picture if exists
        if user.profile_picture:
            old_picture_path = os.path.join(app.config['UPLOAD_FOLDER'], os.path.basename(user.profile_picture))
            if os.path.exists(old_picture_path):
                try:
                    os.remove(old_picture_path)
                    print(f"🗑️ Deleted old profile picture: {old_picture_path}")
                except Exception as e:
                    print(f"⚠️ Could not delete old picture: {e}")
        
        user.profile_picture = filename
        db.session.commit()
        
        # Verify it was saved
        user_after = User.query.get(session['user_id'])
        print(f"✅ Profile picture uploaded: {filename}")
        print(f"💾 Profile picture saved in DB: {user_after.profile_picture}")
        
        # Generate the proper URL for the uploaded file
        image_url = f"{request.url_root.rstrip('/')}/static/uploads/{filename}"
        
        return jsonify({
            'message': 'Profile picture uploaded successfully',
            'profile_picture': filename,
            'image_url': image_url
        }), 200
    
    except Exception as e:
        db.session.rollback()
        print(f"❌ Profile picture upload error: {e}")
        import traceback
        traceback.print_exc()
        return jsonify({'error': str(e)}), 500

@app.route('/api/profile/picture', methods=['DELETE'])
@login_required
def delete_profile_picture():
    """Delete the current user's profile picture"""
    try:
        user = db.session.get(User, session['user_id'])
        if not user:
            return jsonify({'error': 'User not found'}), 404

        if not user.profile_picture:
            return jsonify({'error': 'No profile picture to delete'}), 400

        picture_path = os.path.join(app.config['UPLOAD_FOLDER'], os.path.basename(user.profile_picture))
        if os.path.exists(picture_path):
            try:
                os.remove(picture_path)
                print(f"🗑️ Deleted profile picture: {picture_path}")
            except Exception as file_error:
                print(f"⚠️ Could not delete profile picture file: {file_error}")

        user.profile_picture = None
        db.session.commit()

        return jsonify({'message': 'Profile picture deleted successfully'}), 200

    except Exception as e:
        db.session.rollback()
        print(f"❌ Delete profile picture error: {e}")
        import traceback
        traceback.print_exc()
        return jsonify({'error': str(e)}), 500

@app.route('/api/profile', methods=['PUT'])
@login_required
def update_profile():
    """Update user profile"""
    try:
        data = request.get_json()
        user = db.session.get(User, session['user_id'])
        
        if not user:
            return jsonify({'error': 'User not found'}), 404
        
        # Update username if provided
        if 'username' in data:
            new_username = data.get('username')
            # Check if username is already taken by another user
            existing_user = User.query.filter_by(username=new_username).first()
            if existing_user and existing_user.id != user.id:
                return jsonify({'error': 'Username already exists'}), 400
            
            # Validate username
            if len(new_username) < 3 or len(new_username) > 20:
                return jsonify({'error': 'Username must be between 3 and 20 characters'}), 400
            
            if not re.match(r'^[a-zA-Z0-9_]+$', new_username):
                return jsonify({'error': 'Username can only contain letters, numbers, and underscores'}), 400
            
            user.username = new_username
            session['username'] = new_username
        
        # Update email if provided
        if 'email' in data:
            new_email = data.get('email')
            # Validate email format
            if not validate_email_format(new_email):
                return jsonify({'error': 'Please enter a valid email address'}), 400
            
            # Check if email is already taken by another user
            existing_user = User.query.filter_by(email=new_email).first()
            if existing_user and existing_user.id != user.id:
                return jsonify({'error': 'Email already exists'}), 400
            
            user.email = new_email
        
        db.session.commit()
        
        print(f"✅ Profile updated for user: {user.username}")
        
        return jsonify({
            'message': 'Profile updated successfully',
            'user': {
                'id': user.id,
                'username': user.username,
                'email': user.email,
                'profile_picture': user.profile_picture,
                'created_at': user.created_at.isoformat() if user.created_at else None
            }
        }), 200
    
    except Exception as e:
        db.session.rollback()
        print(f"❌ Update profile error: {e}")
        import traceback
        traceback.print_exc()
        return jsonify({'error': str(e)}), 500

@app.route('/api/settings/delete-chat-history', methods=['DELETE'])
@login_required
def delete_chat_history():
    """Delete all chat history for current user - optimized for speed"""
    try:
        user = db.session.get(User, session['user_id'])
        if not user:
            return jsonify({'error': 'User not found'}), 404
        
        # Use raw SQL for faster bulk delete
        from sqlalchemy import text
        result = db.session.execute(
            text("DELETE FROM chat_history WHERE user_id = :user_id"),
            {'user_id': session['user_id']}
        )
        deleted_count = result.rowcount
        db.session.commit()
        
        print(f"✅ Deleted {deleted_count} chat history entries for user: {user.username}")
        
        return jsonify({
            'message': 'Chat history deleted successfully',
            'deleted_count': deleted_count
        }), 200
    
    except Exception as e:
        db.session.rollback()
        print(f"❌ Delete chat history error: {e}")
        import traceback
        traceback.print_exc()
        return jsonify({'error': str(e)}), 500

@app.route('/api/settings/delete-diagnosis-history', methods=['DELETE'])
@login_required
def delete_diagnosis_history():
    """Delete all diagnosis history for current user - optimized for speed"""
    try:
        user = db.session.get(User, session['user_id'])
        if not user:
            return jsonify({'error': 'User not found'}), 404
        
        # Use raw SQL for faster bulk delete
        from sqlalchemy import text
        result = db.session.execute(
            text("DELETE FROM diagnosis WHERE user_id = :user_id"),
            {'user_id': session['user_id']}
        )
        deleted_count = result.rowcount
        db.session.commit()
        
        print(f"✅ Deleted {deleted_count} diagnosis history entries for user: {user.username}")
        
        return jsonify({
            'message': 'Diagnosis history deleted successfully',
            'deleted_count': deleted_count
        }), 200
    
    except Exception as e:
        db.session.rollback()
        print(f"❌ Delete diagnosis history error: {e}")
        import traceback
        traceback.print_exc()
        return jsonify({'error': str(e)}), 500

@app.route('/api/settings/account-deletion/request', methods=['POST'])
@login_required
def request_account_deletion():
    """Send a verification code to confirm account deletion"""
    try:
        user = db.session.get(User, session['user_id'])
        if not user:
            return jsonify({'error': 'User not found'}), 404

        recent_token = AccountDeletionToken.query.filter_by(user_id=user.id)\
            .order_by(AccountDeletionToken.created_at.desc()).first()

        if recent_token and (datetime.utcnow() - recent_token.created_at).total_seconds() < 60:
            return jsonify({'error': 'Please wait a minute before requesting another code.'}), 429

        AccountDeletionToken.query.filter_by(user_id=user.id).delete()

        code = f"{secrets.randbelow(1000000):06d}"
        token = AccountDeletionToken(
            user_id=user.id,
            code=code,
            expires_at=datetime.utcnow() + timedelta(minutes=10)
        )
        db.session.add(token)
        db.session.flush()

        email_sent = send_account_deletion_code(user.email, user.username, code)
        if not email_sent:
            db.session.rollback()
            return jsonify({'error': 'Failed to send verification email. Please try again later.'}), 500

        db.session.commit()
        return jsonify({'message': 'Verification code sent to your email.'}), 200

    except Exception as e:
        db.session.rollback()
        print(f"❌ Account deletion code error: {e}")
        import traceback
        traceback.print_exc()
        return jsonify({'error': 'Unable to send verification code. Please try again.'}), 500

@app.route('/api/settings/account-deletion/confirm', methods=['POST'])
@login_required
def confirm_account_deletion():
    """Verify code and delete the user's account"""
    try:
        data = request.get_json() or {}
        code = str(data.get('code', '')).strip()

        if len(code) != 6 or not code.isdigit():
            return jsonify({'error': 'Please enter the 6-digit verification code.'}), 400

        user = db.session.get(User, session['user_id'])
        if not user:
            return jsonify({'error': 'User not found'}), 404

        token = AccountDeletionToken.query.filter_by(user_id=user.id)\
            .order_by(AccountDeletionToken.created_at.desc()).first()

        if not token:
            return jsonify({'error': 'No verification code found. Please request a new one.'}), 400

        if not token.is_valid():
            db.session.delete(token)
            db.session.commit()
            return jsonify({'error': 'Verification code expired. Request a new one.'}), 400

        if token.code != code:
            token.attempts += 1
            db.session.commit()
            if token.attempts >= 5:
                AccountDeletionToken.query.filter_by(user_id=user.id).delete()
                db.session.commit()
                return jsonify({'error': 'Too many invalid attempts. Please request a new code.'}), 400
            return jsonify({'error': 'Invalid verification code. Please try again.'}), 400

        # Remove any uploaded files (profile + diagnosis images)
        if user.profile_picture:
            profile_path = os.path.join(app.config['UPLOAD_FOLDER'], os.path.basename(user.profile_picture))
            if os.path.exists(profile_path):
                try:
                    os.remove(profile_path)
                except Exception as file_error:
                    print(f"⚠️ Could not delete profile picture: {file_error}")

        diagnoses = Diagnosis.query.filter_by(user_id=user.id).all()
        for diag in diagnoses:
            if diag.image_path:
                image_path = os.path.join(app.config['UPLOAD_FOLDER'], os.path.basename(diag.image_path))
                if os.path.exists(image_path):
                    try:
                        os.remove(image_path)
                    except Exception as diag_error:
                        print(f"⚠️ Could not delete diagnosis image: {diag_error}")

        AccountDeletionToken.query.filter_by(user_id=user.id).delete()
        db.session.delete(user)
        db.session.commit()

        session.clear()

        return jsonify({'message': 'Your account has been deleted successfully.'}), 200

    except Exception as e:
        db.session.rollback()
        print(f"❌ Account deletion error: {e}")
        import traceback
        traceback.print_exc()
        return jsonify({'error': 'Failed to delete account. Please try again.'}), 500

# ==================== UTILITY ROUTES ====================

@app.route('/api/health', methods=['GET'])
def health_check():
    """Health check endpoint"""
    return jsonify({
        'status': 'healthy',
        'timestamp': datetime.utcnow().isoformat(),
        'ai_provider': ai_provider if ai_provider else 'none',
        'services': {
            'database': 'connected',
            'gemini': 'available' if GEMINI_API_KEY else 'not configured',
            'openai': 'available' if OPENAI_API_KEY else 'not configured',
            'google_maps': 'available' if GOOGLE_MAPS_API_KEY else 'not configured',
            'tts': 'available' if tts_engine else 'not available'
        }
    }), 200

# ==================== ERROR HANDLERS ====================

@app.errorhandler(404)
def not_found(e):
    return jsonify({'error': 'Resource not found'}), 404

@app.errorhandler(500)
def internal_error(e):
    return jsonify({'error': 'Internal server error'}), 500

# ==================== DATABASE INITIALIZATION ====================

# Initialize database tables on startup (for local development)
if not os.getenv('VERCEL'):
    # Only initialize on startup for local development
    # For Vercel, initialization happens on each request via before_request hook
    try:
        with app.app_context():
            db.create_all()
            print("✓ Database initialized successfully")
    except Exception as e:
        print(f"⚠️ Database initialization warning: {e}")
        print("Note: SQLite may not persist on Vercel. Consider using PostgreSQL for production.")

# ==================== STATIC FILE SERVING ====================

@app.route('/static/uploads/<filename>')
def uploaded_file(filename):
    """Serve uploaded files"""
    try:
        response = send_from_directory(app.config['UPLOAD_FOLDER'], filename)
        # Add CORS headers for static files
        response.headers['Access-Control-Allow-Origin'] = '*'
        response.headers['Access-Control-Allow-Methods'] = 'GET'
        response.headers['Access-Control-Allow-Headers'] = 'Content-Type'
        
        # Set correct Content-Type based on file extension
        if filename.lower().endswith('.webp'):
            response.headers['Content-Type'] = 'image/webp'
        elif filename.lower().endswith('.jpg') or filename.lower().endswith('.jpeg'):
            response.headers['Content-Type'] = 'image/jpeg'
        elif filename.lower().endswith('.png'):
            response.headers['Content-Type'] = 'image/png'
        elif filename.lower().endswith('.gif'):
            response.headers['Content-Type'] = 'image/gif'
            
        return response
    except FileNotFoundError:
        return jsonify({'error': 'File not found'}), 404

# ==================== MAIN ====================

if __name__ == '__main__':
    try:
        # Get port from environment variable (for Railway/Render) or default to 5000
        port = int(os.getenv('PORT', 5000))
        
        # Print startup information
        print("=" * 50)
        print("MedMate - AI Medical Assistant")
        print("=" * 50)
        print(f"AI Provider: {ai_provider.upper() if ai_provider else 'NONE (Demo Mode)'}")
        print(f"Gemini API: {'✓ Configured' if GEMINI_API_KEY else '✗ Not configured'}")
        print(f"OpenAI API: {'✓ Configured' if OPENAI_API_KEY else '✗ Not configured'}")
        print(f"Google Maps API: {'✓ Configured' if GOOGLE_MAPS_API_KEY else '✗ Not configured'}")
        print(f"Text-to-Speech: {'✓ Available' if tts_engine else '✗ Not available'}")
        print(f"Database: {'✓ PostgreSQL' if DATABASE_URL else '✓ SQLite (local)'}")
        print("=" * 50)
        print(f"Starting server on http://0.0.0.0:{port}")
        print("=" * 50)
        
        # Use debug=False in production
        is_production = os.getenv('RAILWAY_ENVIRONMENT') or os.getenv('RENDER')
        app.run(debug=not is_production, host='0.0.0.0', port=port)
    except Exception as e:
        print(f"❌ Failed to start server: {e}")
        import traceback
        traceback.print_exc()
        # Exit with error code
        import sys
        sys.exit(1)
