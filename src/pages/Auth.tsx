import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useAuth } from '@/contexts/AuthContext';
import { Activity, Loader2, Eye, EyeOff, CheckCircle } from 'lucide-react';
import { toast } from 'sonner';
import { api } from '@/lib/api';

export default function Auth() {
  const navigate = useNavigate();
  const { login, register, user, checkAuth } = useAuth();
  const [loading, setLoading] = useState(false);

  // Login state
  const [loginData, setLoginData] = useState({ username: '', password: '' });

  // Register state
  const [registerData, setRegisterData] = useState({
    username: '',
    email: '',
    password: '',
    confirmPassword: '',
  });

  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [passwordStrength, setPasswordStrength] = useState({
    length: false,
    uppercase: false,
    lowercase: false,
    digit: false,
    special: false,
  });

  // Update password strength on password change
  useEffect(() => {
    const password = registerData.password;
    setPasswordStrength({
      length: password.length >= 8,
      uppercase: /[A-Z]/.test(password),
      lowercase: /[a-z]/.test(password),
      digit: /\d/.test(password),
      special: /[!@#$%^&*(),.?":{}|<>]/.test(password),
    });
  }, [registerData.password]);

  // Redirect if already logged in
  if (user) {
    navigate('/dashboard');
    return null;
  }

  const handleGoogleLogin = async () => {
    setLoading(true);
    try {
      // Get Google OAuth config
      const config: any = await api.getGoogleAuthConfig();
      
      // Load Google Identity Services library
      const script = document.createElement('script');
      script.src = 'https://accounts.google.com/gsi/client';
      script.async = true;
      script.defer = true;
      
      script.onload = () => {
        // Initialize Google Sign In
        (window as any).google.accounts.id.initialize({
          client_id: config.client_id,
          callback: async (response: any) => {
            try {
              // Decode the JWT token to get user info
              const base64Url = response.credential.split('.')[1];
              const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
              const jsonPayload = decodeURIComponent(atob(base64).split('').map((c) => {
                return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2);
              }).join(''));
              
              const userInfo = JSON.parse(jsonPayload);
              
              // Call backend with Google user info
              const result: any = await api.handleGoogleCallback(
                response.credential,
                userInfo.sub,
                userInfo.email,
                userInfo.name,
                userInfo.picture
              );
              
              // Update user context
              await checkAuth();
              
              toast.success('Welcome!');
              navigate('/dashboard');
            } catch (error) {
              console.error('Google login error:', error);
              toast.error('Google login failed');
            } finally {
              setLoading(false);
            }
          }
        });
        
        // Prompt sign in
        (window as any).google.accounts.id.prompt((notification: any) => {
          if (notification.isNotDisplayed() || notification.isSkippedMoment()) {
            // Fallback: show a button
            const googleButton = document.getElementById('google-signin-button');
            if (googleButton) {
              (window as any).google.accounts.id.renderButton(
                googleButton,
                { theme: 'outline', size: 'large', text: 'signin_with', width: '100%' }
              );
              googleButton.style.display = 'block';
            }
            setLoading(false);
          }
        });
      };
      
      document.body.appendChild(script);
    } catch (error) {
      console.error('Google auth error:', error);
      toast.error('Failed to initialize Google Sign In');
      setLoading(false);
    }
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await login(loginData.username, loginData.password);
      navigate('/dashboard');
    } catch (error) {
      // Error handled by context
    } finally {
      setLoading(false);
    }
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validate username
    if (registerData.username.length < 3 || registerData.username.length > 20) {
      toast.error('Username must be between 3 and 20 characters');
      return;
    }

    if (!/^[a-zA-Z0-9_]+$/.test(registerData.username)) {
      toast.error('Username can only contain letters, numbers, and underscores');
      return;
    }

    // Validate password strength
    const isStrong = Object.values(passwordStrength).every(Boolean);
    if (!isStrong) {
      toast.error('Password does not meet security requirements');
      return;
    }

    if (registerData.password !== registerData.confirmPassword) {
      toast.error('Passwords do not match');
      return;
    }

    setLoading(true);
    try {
      await register(registerData.username, registerData.email, registerData.password);
      navigate('/dashboard');
    } catch (error) {
      // Error handled by context
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary/10 via-accent/5 to-background p-4">
      <Card className="w-full max-w-md p-8 glass animate-scale-in">
        <div className="flex flex-col items-center mb-8">
          <Activity className="h-12 w-12 text-primary mb-4" />
          <h1 className="text-3xl font-bold gradient-text">Welcome to MedMate</h1>
          <p className="text-muted-foreground text-center mt-2">
            Your AI-powered medical assistant
          </p>
        </div>

        <Tabs defaultValue="login" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="login">Login</TabsTrigger>
            <TabsTrigger value="register">Register</TabsTrigger>
          </TabsList>

          <TabsContent value="login">
            <form onSubmit={handleLogin} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="login-username">Username</Label>
                <Input
                  id="login-username"
                  placeholder="Enter your username"
                  value={loginData.username}
                  onChange={(e) => setLoginData({ ...loginData, username: e.target.value })}
                  required
                />
              </div>
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label htmlFor="login-password">Password</Label>
                  <Link
                    to="/forgot-password"
                    className="text-sm text-primary hover:underline"
                  >
                    Forgot password?
                  </Link>
                </div>
                <Input
                  id="login-password"
                  type="password"
                  placeholder="Enter your password"
                  value={loginData.password}
                  onChange={(e) => setLoginData({ ...loginData, password: e.target.value })}
                  required
                />
              </div>
              <Button type="submit" className="w-full" disabled={loading}>
                {loading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Logging in...
                  </>
                ) : (
                  'Login'
                )}
              </Button>
              
              <div className="relative my-6">
                <div className="absolute inset-0 flex items-center">
                  <span className="w-full border-t" />
                </div>
                <div className="relative flex justify-center text-xs uppercase">
                  <span className="bg-card px-2 text-muted-foreground">Or continue with</span>
                </div>
              </div>
              
              <Button
                type="button"
                variant="outline"
                className="w-full bg-white dark:bg-gray-900 hover:bg-gray-100 dark:hover:bg-gray-800"
                onClick={handleGoogleLogin}
                disabled={loading}
              >
                <svg className="h-5 w-5 mr-2" viewBox="0 0 24 24">
                  <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                  <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                  <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                  <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                </svg>
                Sign in with Google
              </Button>
            </form>
          </TabsContent>

          <TabsContent value="register">
            <form onSubmit={handleRegister} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="register-username">Username</Label>
                <Input
                  id="register-username"
                  placeholder="Choose a username"
                  value={registerData.username}
                  onChange={(e) => setRegisterData({ ...registerData, username: e.target.value })}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="register-email">Email</Label>
                <Input
                  id="register-email"
                  type="email"
                  placeholder="your@email.com"
                  value={registerData.email}
                  onChange={(e) => setRegisterData({ ...registerData, email: e.target.value })}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="register-password">Password</Label>
                <div className="relative">
                  <Input
                    id="register-password"
                    type={showPassword ? 'text' : 'password'}
                    placeholder="Create a password"
                    value={registerData.password}
                    onChange={(e) => setRegisterData({ ...registerData, password: e.target.value })}
                    className="pr-10"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-muted-foreground hover:text-foreground"
                  >
                    {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                  </button>
                </div>

                {registerData.password && (
                  <div className="space-y-1 text-xs p-3 bg-muted rounded-md">
                    <div className={`flex items-center gap-2 ${passwordStrength.length ? 'text-green-600' : 'text-muted-foreground'}`}>
                      {passwordStrength.length ? <CheckCircle className="h-4 w-4" /> : <div className="h-4 w-4 rounded-full border-2" />}
                      At least 8 characters
                    </div>
                    <div className={`flex items-center gap-2 ${passwordStrength.uppercase ? 'text-green-600' : 'text-muted-foreground'}`}>
                      {passwordStrength.uppercase ? <CheckCircle className="h-4 w-4" /> : <div className="h-4 w-4 rounded-full border-2" />}
                      One uppercase letter
                    </div>
                    <div className={`flex items-center gap-2 ${passwordStrength.lowercase ? 'text-green-600' : 'text-muted-foreground'}`}>
                      {passwordStrength.lowercase ? <CheckCircle className="h-4 w-4" /> : <div className="h-4 w-4 rounded-full border-2" />}
                      One lowercase letter
                    </div>
                    <div className={`flex items-center gap-2 ${passwordStrength.digit ? 'text-green-600' : 'text-muted-foreground'}`}>
                      {passwordStrength.digit ? <CheckCircle className="h-4 w-4" /> : <div className="h-4 w-4 rounded-full border-2" />}
                      One number
                    </div>
                    <div className={`flex items-center gap-2 ${passwordStrength.special ? 'text-green-600' : 'text-muted-foreground'}`}>
                      {passwordStrength.special ? <CheckCircle className="h-4 w-4" /> : <div className="h-4 w-4 rounded-full border-2" />}
                      One special character
                    </div>
                  </div>
                )}
              </div>
              <div className="space-y-2">
                <Label htmlFor="register-confirm">Confirm Password</Label>
                <div className="relative">
                  <Input
                    id="register-confirm"
                    type={showConfirmPassword ? 'text' : 'password'}
                    placeholder="Confirm your password"
                    value={registerData.confirmPassword}
                    onChange={(e) =>
                      setRegisterData({ ...registerData, confirmPassword: e.target.value })
                    }
                    className="pr-10"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-muted-foreground hover:text-foreground"
                  >
                    {showConfirmPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                  </button>
                </div>
                {registerData.confirmPassword && registerData.password !== registerData.confirmPassword && (
                  <p className="text-sm text-destructive">Passwords do not match</p>
                )}
              </div>
              <Button type="submit" className="w-full" disabled={loading}>
                {loading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Creating account...
                  </>
                ) : (
                  'Create Account'
                )}
              </Button>
            </form>
          </TabsContent>
        </Tabs>
      </Card>
    </div>
  );
}
