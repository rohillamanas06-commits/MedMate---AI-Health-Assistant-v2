import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Activity, Loader2, CheckCircle, Eye, EyeOff, AlertCircle } from 'lucide-react';
import { toast } from 'sonner';
import { api } from '@/lib/api';

export default function ResetPassword() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token');

  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [verifying, setVerifying] = useState(true);
  const [tokenValid, setTokenValid] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [passwordStrength, setPasswordStrength] = useState({
    length: false,
    uppercase: false,
    lowercase: false,
    digit: false,
    special: false,
  });

  useEffect(() => {
    verifyToken();
  }, [token]);

  const verifyToken = async () => {
    if (!token) {
      setTokenValid(false);
      setVerifying(false);
      return;
    }

    try {
      const result: any = await api.verifyResetToken(token);
      setTokenValid(result.valid);
    } catch (error) {
      setTokenValid(false);
    } finally {
      setVerifying(false);
    }
  };

  useEffect(() => {
    // Check password strength
    setPasswordStrength({
      length: password.length >= 8,
      uppercase: /[A-Z]/.test(password),
      lowercase: /[a-z]/.test(password),
      digit: /\d/.test(password),
      special: /[!@#$%^&*(),.?":{}|<>]/.test(password),
    });
  }, [password]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (password !== confirmPassword) {
      toast.error('Passwords do not match');
      return;
    }

    const isStrong = Object.values(passwordStrength).every(Boolean);
    if (!isStrong) {
      toast.error('Password does not meet strength requirements');
      return;
    }

    if (!token) {
      toast.error('Invalid reset token');
      return;
    }

    setLoading(true);

    try {
      await api.resetPassword(token, password);
      toast.success('Password reset successful!');
      navigate('/auth');
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to reset password');
    } finally {
      setLoading(false);
    }
  };

  const isPasswordValid = Object.values(passwordStrength).every(Boolean);

  if (verifying) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary/10 via-accent/5 to-background p-4">
        <Card className="w-full max-w-md p-8 glass">
          <div className="flex flex-col items-center space-y-4">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
            <p className="text-muted-foreground">Verifying reset token...</p>
          </div>
        </Card>
      </div>
    );
  }

  if (!tokenValid) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary/10 via-accent/5 to-background p-4">
        <Card className="w-full max-w-md p-8 glass">
          <div className="flex flex-col items-center space-y-4 text-center">
            <div className="rounded-full bg-destructive/10 p-3 w-fit">
              <AlertCircle className="h-8 w-8 text-destructive" />
            </div>
            <h2 className="text-2xl font-bold">Invalid or Expired Link</h2>
            <p className="text-muted-foreground">
              This password reset link is invalid or has expired. Please request a new one.
            </p>
            <Button onClick={() => navigate('/forgot-password')} className="w-full">
              Request New Link
            </Button>
          </div>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary/10 via-accent/5 to-background p-4">
      <Card className="w-full max-w-md p-8 glass animate-scale-in">
        <div className="flex flex-col items-center mb-8">
          <div className="relative mb-4">
            <div className="absolute inset-0 bg-primary/20 blur-xl rounded-full"></div>
            <Activity className="h-12 w-12 text-primary relative" />
          </div>
          <h1 className="text-3xl font-bold gradient-text">Reset Password</h1>
          <p className="text-muted-foreground text-center mt-2">
            Create a new password for your account
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="password">New Password</Label>
            <div className="relative">
              <Input
                id="password"
                type={showPassword ? 'text' : 'password'}
                placeholder="Enter new password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
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

            {password && (
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
            <Label htmlFor="confirmPassword">Confirm Password</Label>
            <div className="relative">
              <Input
                id="confirmPassword"
                type={showConfirmPassword ? 'text' : 'password'}
                placeholder="Confirm new password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
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
            {confirmPassword && password !== confirmPassword && (
              <p className="text-sm text-destructive">Passwords do not match</p>
            )}
          </div>

          <Button type="submit" className="w-full" disabled={loading || !isPasswordValid}>
            {loading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Resetting...
              </>
            ) : (
              'Reset Password'
            )}
          </Button>

          <Button
            type="button"
            variant="ghost"
            onClick={() => navigate('/auth')}
            className="w-full"
          >
            Back to Login
          </Button>
        </form>
      </Card>
    </div>
  );
}

