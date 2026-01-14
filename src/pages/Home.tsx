import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import {
  Activity,
  Brain,
  MessageSquare,
  MapPin,
  Shield,
  ArrowRight,
} from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import heroImage from '@/assets/hero-medical.jpg';
import diagnosisIcon from '@/assets/diagnosis-icon.png';
import chatIcon from '@/assets/chat-icon.png';

export default function Home() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [currentImageIndex, setCurrentImageIndex] = useState(0);

  // Medical images for carousel - Original girl image + 3 realistic medical images
  const medicalImages = [
    heroImage, // Original medical girl image
    'https://images.unsplash.com/photo-1551601651-2a8555f1a136?w=800&auto=format&fit=crop', // Healthcare professionals
    'https://images.unsplash.com/photo-1576091160550-2173dba999ef?w=800&auto=format&fit=crop', // Medical team working
    'https://images.unsplash.com/photo-1629909613654-28e377c37b09?w=800&auto=format&fit=crop', // Dental care
  ];

  // Auto-rotate images every 1.5 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentImageIndex((prevIndex) => 
        prevIndex === medicalImages.length - 1 ? 0 : prevIndex + 1
      );
    }, 1500);

    return () => clearInterval(interval);
  }, [medicalImages.length]);

  const features = [
    {
      icon: <Brain className="h-12 w-12 text-primary" />,
      title: 'AI-Powered Diagnosis',
      description: 'Advanced AI analyzes your symptoms to provide accurate medical insights instantly.',
    },
    {
      icon: <MessageSquare className="h-12 w-12 text-primary" />,
      title: '24/7 Medical Assistant',
      description: 'Chat with our intelligent medical AI assistant anytime, anywhere.',
    },
    {
      icon: <MapPin className="h-12 w-12 text-primary" />,
      title: 'Hospital Finder',
      description: 'Locate nearby hospitals and medical facilities with real-time information.',
    },
    {
      icon: <Shield className="h-12 w-12 text-primary" />,
      title: 'Secure & Private',
      description: 'Your health data is encrypted and protected with enterprise-grade security.',
    },
  ];

  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <section className="relative overflow-hidden bg-gradient-to-br from-primary/10 via-accent/5 to-background">
        <div className="absolute inset-0 bg-grid-pattern opacity-5"></div>
        <div className="container relative z-10 py-8 sm:py-16 lg:py-24">
          <div className="grid lg:grid-cols-2 gap-8 sm:gap-12 items-center">
            <div className="space-y-4 sm:space-y-6 lg:space-y-8 animate-slide-up">
              <div className="inline-block">
                <span className="px-4 py-2 rounded-full bg-primary/10 text-primary text-sm font-medium">
                  AI-Powered Healthcare
                </span>
              </div>
              <h1 className="text-5xl lg:text-7xl font-bold leading-tight">
                Your Personal{' '}
                <span className="gradient-text">AI Medical</span> Assistant
              </h1>
              <p className="text-xl text-muted-foreground">
                Get instant AI-powered medical insights, diagnose symptoms, and connect with healthcare
                professionals - all in one intelligent platform.
              </p>
              <div className="flex flex-wrap gap-4">
                <Button
                  size="lg"
                  className="group"
                  onClick={() => navigate(user ? '/dashboard' : '/auth')}
                >
                  {user ? 'Go to Dashboard' : 'Get Started Free'}
                  <ArrowRight className="ml-2 h-5 w-5 group-hover:translate-x-1 transition-transform" />
                </Button>
                <Button size="lg" variant="outline" onClick={() => navigate('/diagnose')}>
                  Try Symptom Checker
                </Button>
              </div>
            </div>
            <div className="relative animate-fade-in overflow-hidden rounded-3xl">
              <div className="absolute -inset-4 bg-gradient-to-r from-primary/20 to-accent/20 rounded-3xl blur-3xl animate-pulse"></div>
              <div className="relative aspect-[4/3] overflow-hidden rounded-3xl shadow-2xl">
                {medicalImages.map((imageSrc, index) => (
                  <img
                    key={index}
                    src={imageSrc}
                    alt={`Medical Assistant ${index + 1}`}
                    className={`absolute inset-0 w-full h-full object-cover transition-all duration-700 ${
                      index === currentImageIndex 
                        ? 'opacity-100 scale-100' 
                        : 'opacity-0 scale-105'
                    }`}
                  />
                ))}
              </div>
              {/* Carousel indicators */}
              <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-2 z-10">
                {medicalImages.map((_, index) => (
                  <div
                    key={index}
                    className={`h-2 rounded-full transition-all duration-300 ${
                      index === currentImageIndex 
                        ? 'w-8 bg-primary shadow-lg' 
                        : 'w-2 bg-white/50'
                    }`}
                  />
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Grid */}
      <section className="py-8 sm:py-16 lg:py-24 bg-muted/30">
        <div className="container">
          <div className="text-center space-y-3 sm:space-y-4 mb-8 sm:mb-12 lg:mb-16 animate-slide-up">
            <h2 className="text-4xl lg:text-5xl font-bold">
              Powerful Features for Your Health
            </h2>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              Comprehensive AI-powered healthcare tools at your fingertips
            </p>
          </div>
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {features.map((feature, index) => (
              <Card
                key={index}
                className="p-6 hover-lift glass border-border/50 animate-fade-in"
                style={{ animationDelay: `${index * 0.1}s` }}
              >
                <div className="mb-4">{feature.icon}</div>
                <h3 className="text-xl font-semibold mb-2">{feature.title}</h3>
                <p className="text-muted-foreground">{feature.description}</p>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="py-8 sm:py-16 lg:py-24">
        <div className="container">
          <div className="text-center space-y-3 sm:space-y-4 mb-8 sm:mb-12 lg:mb-16">
            <h2 className="text-4xl lg:text-5xl font-bold">How MedMate Works</h2>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              Get medical assistance in three simple steps
            </p>
          </div>
          <div className="grid lg:grid-cols-3 gap-8">
            {[
              {
                step: '01',
                title: 'Describe Symptoms',
                description: 'Tell our AI about your symptoms or upload medical images',
                image: diagnosisIcon,
              },
              {
                step: '02',
                title: 'AI Analysis',
                description: 'Advanced algorithms analyze and provide detailed insights',
                image: chatIcon,
              },
              {
                step: '03',
                title: 'Get Results',
                description: 'Receive comprehensive diagnosis and recommended actions',
                image: diagnosisIcon,
              },
            ].map((step, index) => (
              <div key={index} className="relative group animate-fade-in" style={{ animationDelay: `${index * 0.2}s` }}>
                <div className="absolute -inset-1 bg-gradient-to-r from-primary to-accent rounded-2xl opacity-0 group-hover:opacity-20 blur transition-all"></div>
                <Card className="relative p-8 text-center space-y-4 hover-lift">
                  <div className="text-6xl font-bold text-primary/20">{step.step}</div>
                  <img src={step.image} alt={step.title} className="w-24 h-24 mx-auto" />
                  <h3 className="text-2xl font-semibold">{step.title}</h3>
                  <p className="text-muted-foreground">{step.description}</p>
                </Card>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Benefits */}
      <section className="py-8 sm:py-16 lg:py-24 bg-gradient-to-br from-primary/5 via-accent/5 to-background">
        <div className="container">
          <div className="grid lg:grid-cols-2 gap-6 sm:gap-8 lg:gap-12 items-center">
            <div className="space-y-4 sm:space-y-6 animate-slide-up">
              <h2 className="text-4xl lg:text-5xl font-bold">
                Everything You Need for Better Health
              </h2>
              <p className="text-xl text-muted-foreground">
                MedMate combines cutting-edge AI with medical expertise to provide you with the best
                healthcare experience.
              </p>
            </div>
            <div className="relative">
              <Card className="p-8 glass hover-lift animate-fade-in">
                <div className="space-y-6">
                  <div className="flex items-center gap-3">
                    <Brain className="h-8 w-8 text-primary" />
                    <h3 className="text-2xl font-semibold">AI-Powered Insights</h3>
                  </div>
                  <p className="text-muted-foreground leading-relaxed">
                    Get instant, accurate health insights powered by advanced artificial intelligence. 
                    Your symptoms are analyzed in real-time with comprehensive medical knowledge.
                  </p>
                  <div className="flex items-center gap-3">
                    <Shield className="h-8 w-8 text-primary" />
                    <h3 className="text-2xl font-semibold">Privacy First</h3>
                  </div>
                  <p className="text-muted-foreground leading-relaxed">
                    Your health data remains completely private and secure. We use industry-standard 
                    encryption to protect your sensitive information.
                  </p>
                </div>
              </Card>
            </div>
          </div>
        </div>
      </section>

    </div>
  );
}
