# 🚀 Build APK with Java 17 for Voice Recognition

## Problem
Your system has Java 24, but Android Gradle requires Java 17.

## Solution: Use Java 17

### Step 1: Download Java 17
Download from: https://adoptium.net/temurin/releases/?version=17

### Step 2: Install Java 17
1. Run the installer
2. Install to: `C:\Program Files\Eclipse Adoptium\jdk-17.0.x-hotspot`

### Step 3: Set JAVA_HOME for this build

```powershell
# Check current Java version
java -version

# Set JAVA_HOME for this session
$env:JAVA_HOME = "C:\Program Files\Eclipse Adoptium\jdk-17.0.12-hotspot"
$env:PATH = "$env:JAVA_HOME\bin;$env:PATH"

# Verify
java -version
# Should show: openjdk version "17.0.x"
```

### Step 4: Build APK

```powershell
cd android
.\gradlew.bat assembleDebug
```

## Alternative: Build in Android Studio

1. Open Android Studio
2. Go to: File → Project Structure → SDK Location
3. Set Gradle JDK to Java 17
4. Build → Build Bundle(s) / APK(s) → Build APK(s)

## What's Fixed in the APK

✅ **Auto-login**: Fixed by removing server config  
✅ **Voice Recognition**: Requires Java 17 build  
✅ **All Permissions**: Camera, Storage, Location, Voice, Notifications  

## Quick Build (Current Java)

If you can't install Java 17 right now, use the current APK:
- Location: `android/app/build/outputs/apk/debug/app-debug.apk`
- Auto-login: ✅ Works
- Voice: ❌ Won't work (requires Java 17 build)
