import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Avatar } from '@/components/ui/avatar';
import { User, Mail, Calendar, Activity } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';

export default function Profile() {
  const { user } = useAuth();

  if (!user) return null;

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-muted/20 to-background py-4 px-4 sm:py-8">
      <div className="container max-w-4xl mx-auto">
        <div className="mb-6 sm:mb-8 text-center animate-slide-up">
          <h1 className="text-2xl sm:text-4xl font-bold mb-2 gradient-text">Your Profile</h1>
          <p className="text-muted-foreground text-sm sm:text-lg">
            Manage your account information
          </p>
        </div>

        <div className="grid gap-4 sm:gap-6">
          {/* Profile Card */}
          <Card className="p-4 sm:p-8 glass animate-fade-in">
            <div className="flex flex-col sm:flex-row items-center gap-4 sm:gap-6 mb-6">
              <Avatar className="h-16 w-16 sm:h-24 sm:w-24 bg-gradient-to-br from-primary to-accent">
                <div className="flex items-center justify-center h-full w-full text-white text-xl sm:text-3xl font-bold">
                  {user.username.charAt(0).toUpperCase()}
                </div>
              </Avatar>
              <div className="text-center sm:text-left">
                <h2 className="text-xl sm:text-3xl font-bold mb-1">{user.username}</h2>
                <p className="text-muted-foreground text-sm sm:text-base break-all">{user.email}</p>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
              <Card className="p-3 sm:p-4 bg-muted/50">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-primary/10 flex-shrink-0">
                    <User className="h-4 w-4 sm:h-5 sm:w-5 text-primary" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-xs sm:text-sm text-muted-foreground">Username</p>
                    <p className="font-semibold text-sm sm:text-base truncate">{user.username}</p>
                  </div>
                </div>
              </Card>

              <Card className="p-3 sm:p-4 bg-muted/50">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-primary/10 flex-shrink-0">
                    <Mail className="h-4 w-4 sm:h-5 sm:w-5 text-primary" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-xs sm:text-sm text-muted-foreground">Email</p>
                    <p className="font-semibold text-sm sm:text-base truncate">{user.email}</p>
                  </div>
                </div>
              </Card>

              <Card className="p-3 sm:p-4 bg-muted/50">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-primary/10 flex-shrink-0">
                    <Calendar className="h-4 w-4 sm:h-5 sm:w-5 text-primary" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-xs sm:text-sm text-muted-foreground">Member Since</p>
                    <p className="font-semibold text-sm sm:text-base">
                      {user.created_at 
                        ? new Date(user.created_at).toLocaleDateString('en-US', { 
                            year: 'numeric', 
                            month: 'short', 
                            day: 'numeric' 
                          })
                        : 'N/A'}
                    </p>
                  </div>
                </div>
              </Card>

              <Card className="p-3 sm:p-4 bg-muted/50">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-primary/10 flex-shrink-0">
                    <Activity className="h-4 w-4 sm:h-5 sm:w-5 text-primary" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-xs sm:text-sm text-muted-foreground">Account ID</p>
                    <p className="font-semibold text-sm sm:text-base">#{user.id}</p>
                  </div>
                </div>
              </Card>
            </div>
          </Card>

        </div>
      </div>
    </div>
  );
}
