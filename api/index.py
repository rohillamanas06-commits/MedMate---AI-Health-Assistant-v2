"""
Vercel Serverless Function Entry Point for MedMate
This file wraps the Flask app for Vercel deployment
"""

import sys
import os

# Add the parent directory to the path so we can import MedMate
sys.path.insert(0, os.path.dirname(os.path.dirname(__file__)))

from MedMate import app

# Vercel expects a variable named 'app' or a function named 'handler'
# Flask app is already named 'app', so it will work directly
