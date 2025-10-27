# 📱 Building MedMate Android APK

This guide will help you build an Android APK for your MedMate app using Capacitor.

## Prerequisites

Before you begin, you need to install:

### 1. **Java Development Kit (JDK) 17**
- Download from: [Oracle JDK](https://www.oracle.com/java/technologies/downloads/#java17) or [OpenJDK](https://adoptium.net/)
- Verify installation: `java -version`

### 2. **Android Studio**
- Download from: [Android Studio](https://developer.android.com/studio)
- Install and open Android Studio
- Go to `Tools → SDK Manager`
- Install:
  - Android SDK Platform 33
  - Android SDK Build-Tools
  - Android Emulator (optional)
  - Android SDK Platform-Tools

### 3. **Set Environment Variables**

#### Windows:
```powershell
# Add to System Environment Variables
ANDROID_HOME=C:\Users\YourName\AppData\Local\Android\Sdk
Path=%ANDROID_HOME%\platform-tools;%ANDROID_HOME%\tools
```

#### macOS/Linux:
```bash
# Add to ~/.zshrc or ~/.bashrc
export ANDROID_HOME=$HOME/Library/Android/sdk
export PATH=$PATH:$ANDROID_HOME/platform-tools
export PATH=$PATH:$ANDROID_HOME/tools
```

## Step-by-Step Build Process

### Step 1: Build Your Web App
```bash
npm run build
```

### Step 2: Initialize Capacitor (First Time Only)
```bash
npx cap init
```

### Step 3: Add Android Platform
```bash
npx cap add android
```

### Step 4: Sync Your App
```bash
npm run android:sync
```
This copies your web app to the Android project.

### Step 5: Open in Android Studio
```bash
npm run android:open
```

### Step 6: Build APK in Android Studio

1. **Wait for Gradle Sync** (first time takes 5-10 minutes)

2. **Update API URL** (Important!)
   - Open: `android/app/src/main/assets/public/index.html`
   - Ensure API calls point to your production URL

3. **Build APK**:
   - Go to `Build → Build Bundle(s) / APK(s) → Build APK(s)`
   - Wait for build to complete (2-5 minutes)
   - Click "locate" or find APK in:
     ```
     android/app/build/outputs/apk/debug/app-debug.apk
     ```

### Step 7: Install APK on Phone

1. **Enable Developer Mode** on your Android phone:
   - Go to Settings → About Phone
   - Tap "Build Number" 7 times
   
2. **Enable USB Debugging**:
   - Settings → Developer Options → USB Debugging (ON)

3. **Transfer APK**:
   - Copy `app-debug.apk` to your phone
   - Open file and install
   - Allow installation from unknown sources if prompted

## Quick Build Commands

```bash
# One-line build command
npm run build && npx cap sync android

# Open Android Studio
npx cap open android
```

## Release Build (Signed APK)

For production release, you need to create a signed APK:

### Step 1: Generate Keystore
```bash
keytool -genkeypair -v -storetype PKCS12 -keystore medmate-release.keystore -alias medmate -keyalg RSA -keysize 2048 -validity 10000
```

### Step 2: Configure Gradle
Edit `android/app/build.gradle`:

```gradle
android {
    signingConfigs {
        release {
            storeFile file('../medmate-release.keystore')
            storePassword 'your-password'
            keyAlias 'medmate'
            keyPassword 'your-password'
        }
    }
    buildTypes {
        release {
            signingConfig signingConfigs.release
            minifyEnabled false
            proguardFiles getDefaultProguardFile('proguard-android.txt'), 'proguard-rules.pro'
        }
    }
}
```

### Step 3: Build Release APK
```bash
cd android
./gradlew assembleRelease
```

APK location:
```
android/app/build/outputs/apk/release/app-release.apk
```

## Troubleshooting

### Error: "SDK location not found"
Set ANDROID_HOME environment variable (see Prerequisites)

### Error: "Gradle build failed"
1. In Android Studio, go to `File → Invalidate Caches / Restart`
2. Clean project: `Build → Clean Project`
3. Rebuild: `Build → Rebuild Project`

### Error: "Execution failed for task ':app:compileDebugJavaWithJavac'"
- Update JDK to version 17
- Check Java version: `java -version`

### App doesn't connect to API
- Check `capacitor.config.ts` server URL
- Ensure production API is accessible
- Check CORS settings in backend

## Configuration

### Change App Name
Edit `android/app/src/main/res/values/strings.xml`:
```xml
<resources>
    <string name="app_name">MedMate</string>
</resources>
```

### Change App Icon
- Place icon files in `android/app/src/main/res/mipmap-*/`
- Use [Asset Studio](https://romannurik.github.io/AndroidAssetStudio/) to generate icons

### Change App ID
Edit `capacitor.config.ts`:
```typescript
appId: 'com.yourcompany.medmate'
```

## Alternative: Use EAS Build (Expo)

If you prefer a cloud build service:

```bash
npm install -g eas-cli
eas build --platform android
```

## Testing on Emulator

1. Open Android Studio
2. Create Virtual Device: `Tools → Device Manager → Create Device`
3. Select device (e.g., Pixel 6)
4. Click "Play" to start emulator
5. Click "Run" in Android Studio

## Updating the App

After making changes to your web app:

```bash
# 1. Rebuild web app
npm run build

# 2. Sync to Android
npx cap sync android

# 3. Build new APK in Android Studio
```

## Distribution

### Internal Testing
- Upload APK to Google Drive
- Share link with testers

### Google Play Store
1. Create developer account ($25 one-time)
2. Build AAB (Android App Bundle)
3. Upload to Play Console
4. Follow publishing guidelines

## Resources

- [Capacitor Documentation](https://capacitorjs.com/docs)
- [Android Developer Guide](https://developer.android.com/studio/intro)
- [Gradle Build System](https://gradle.org/)
- [Google Play Publishing](https://developer.android.com/distribute/googleplay/start)

## Support

Need help? Check:
- [Capacitor Community](https://forum.ionicframework.com/c/capacitor/)
- [Stack Overflow - Capacitor](https://stackoverflow.com/questions/tagged/capacitor)
- [Discord - Capacitor](https://discord.gg/capacitor)

---

**Happy Building! 🚀**
