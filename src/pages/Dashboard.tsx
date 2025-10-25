import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  Activity,
  Brain,
  MessageSquare,
  MapPin,
  ArrowRight,
  AlertCircle,
  Calendar,
  Clock,
} from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { api } from '@/lib/api';
import { toast } from 'sonner';
import { ErrorBoundary } from '@/components/ErrorBoundary';

export default function Dashboard() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [recentDiagnoses, setRecentDiagnoses] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    try {
      setError(null);
      const response: any = await api.getDiagnosisHistory(1, 5);
      setRecentDiagnoses(response.diagnoses || []);
    } catch (error) {
      console.error('Dashboard data loading error:', error);
      setError(error instanceof Error ? error.message : 'Failed to load dashboard data');
      // Don't show toast for dashboard loading errors to avoid spam
    } finally {
      setLoading(false);
    }
  };

  // Add error boundary effect to prevent crashes
  useEffect(() => {
    const handleError = (event: ErrorEvent) => {
      console.error('Dashboard error:', event.error);
      setError('An unexpected error occurred');
    };

    window.addEventListener('error', handleError);
    return () => window.removeEventListener('error', handleError);
  }, []);

  const quickActions = [
    {
      icon: <Brain className="h-8 w-8" />,
      title: 'Symptom Checker',
      description: 'Analyze your symptoms with AI',
      color: 'from-blue-500 to-cyan-500',
      action: () => navigate('/diagnose'),
    },
    {
      icon: <MessageSquare className="h-8 w-8" />,
      title: 'AI Chat',
      description: 'Talk to medical assistant',
      color: 'from-purple-500 to-pink-500',
      action: () => navigate('/chat'),
    },
    {
      icon: <MapPin className="h-8 w-8" />,
      title: 'Find Hospitals',
      description: 'Locate nearby facilities',
      color: 'from-green-500 to-teal-500',
      action: () => navigate('/hospitals'),
    },
    {
      icon: <Activity className="h-8 w-8" />,
      title: 'View History',
      description: 'See past diagnoses',
      color: 'from-orange-500 to-red-500',
      action: () => navigate('/history'),
    },
  ];

  return (
    <ErrorBoundary>
      <div className="min-h-screen bg-gradient-to-br from-background via-muted/20 to-background py-8">
      <div className="container max-w-7xl">
        {/* Welcome Header */}
        <div className="mb-8 animate-slide-up">
          <h1 className="text-4xl font-bold mb-2">
            Welcome back, <span className="gradient-text">{user?.username}</span>!
          </h1>
          <p className="text-muted-foreground text-lg">
            Your health dashboard is ready. What would you like to do today?
          </p>
        </div>


        {/* Quick Actions */}
        <div className="mb-8">
          <h2 className="text-2xl font-bold mb-6">Quick Actions</h2>
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {quickActions.map((action, index) => (
              <Card
                key={index}
                className="group cursor-pointer hover-lift overflow-hidden animate-fade-in"
                style={{ animationDelay: `${index * 0.1}s` }}
                onClick={action.action}
              >
                <div className="p-6 relative">
                  <div className={`absolute inset-0 bg-gradient-to-br ${action.color} opacity-0 group-hover:opacity-10 transition-opacity`}></div>
                  <div className="relative">
                    <div className={`inline-flex p-3 rounded-xl bg-gradient-to-br ${action.color} text-white mb-4`}>
                      {action.icon}
                    </div>
                    <h3 className="text-lg font-semibold mb-2">{action.title}</h3>
                    <p className="text-sm text-muted-foreground mb-4">{action.description}</p>
                    <div className="flex items-center text-primary text-sm font-medium">
                      Get Started
                      <ArrowRight className="ml-1 h-4 w-4 group-hover:translate-x-1 transition-transform" />
                    </div>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        </div>

        {/* Recent Activity */}
        <div>
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold">Recent Diagnoses</h2>
            <Button variant="outline" onClick={() => navigate('/history')}>
              View All
            </Button>
          </div>
          
          {loading ? (
            <Card className="p-8 text-center">
              <div className="animate-pulse space-y-4">
                <div className="h-4 bg-muted rounded w-3/4 mx-auto"></div>
                <div className="h-4 bg-muted rounded w-1/2 mx-auto"></div>
              </div>
            </Card>
          ) : error ? (
            <Card className="p-8 text-center glass">
              <AlertCircle className="h-16 w-16 mx-auto mb-4 text-destructive opacity-50" />
              <h3 className="text-xl font-semibold mb-2">Unable to load diagnoses</h3>
              <p className="text-muted-foreground mb-6">
                {error}
              </p>
              <Button onClick={loadDashboardData} variant="outline">
                Try Again
              </Button>
            </Card>
          ) : recentDiagnoses.length === 0 ? (
            <Card className="p-12 text-center glass">
              <Brain className="h-16 w-16 mx-auto mb-4 text-muted-foreground opacity-50" />
              <h3 className="text-xl font-semibold mb-2">No diagnoses yet</h3>
              <p className="text-muted-foreground mb-6">
                Start by analyzing your symptoms or uploading a medical image
              </p>
              <Button onClick={() => navigate('/diagnose')}>
                Start Diagnosis
              </Button>
            </Card>
          ) : (
            <div className="space-y-4">
              {recentDiagnoses.map((diagnosis, index) => (
                <Card
                  key={diagnosis.id}
                  className="p-6 hover-lift cursor-pointer animate-fade-in"
                  style={{ animationDelay: `${index * 0.1}s` }}
                  onClick={() => navigate(`/history`)}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <h3 className="font-semibold text-lg mb-2">{diagnosis.symptoms}</h3>
                      <div className="flex items-center gap-4 text-sm text-muted-foreground">
                        <div className="flex items-center gap-1">
                          <Calendar className="h-4 w-4" />
                          {new Date(diagnosis.created_at).toLocaleDateString()}
                        </div>
                        <div className="flex items-center gap-1">
                          <Clock className="h-4 w-4" />
                          {new Date(diagnosis.created_at).toLocaleTimeString()}
                        </div>
                      </div>
                    </div>
                    <ArrowRight className="h-5 w-5 text-muted-foreground" />
                  </div>
                </Card>
              ))}
            </div>
          )}
        </div>
      </div>
      </div>
    </ErrorBoundary>
  );
}
