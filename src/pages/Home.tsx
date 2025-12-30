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
  Zap,
  ArrowRight,
  CheckCircle2,
  Loader2,
  Instagram,
  Github,
  Mail,
  Linkedin,
  Pilcrow,
  HeartPulse,
  Stethoscope,
  Microscope,
  Hospital,
  Pill,
} from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { api } from '@/lib/api';
import { toast } from 'sonner';
import heroImage from '@/assets/hero-medical.jpg';
import diagnosisIcon from '@/assets/diagnosis-icon.png';
import chatIcon from '@/assets/chat-icon.png';
import founderImage from '@/assets/founder.jpg';

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

  const benefits = [
    'Instant symptom analysis with AI',
    'Medical image analysis',
    'Personalized health insights',
    'Track your medical history',
    'Voice-enabled interface',
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
              <div className="grid gap-4">
                {benefits.map((benefit, index) => (
                  <div key={index} className="flex items-center gap-3">
                    <CheckCircle2 className="h-6 w-6 text-primary flex-shrink-0" />
                    <span className="text-lg">{benefit}</span>
                  </div>
                ))}
              </div>
              <Button size="lg" className="mt-4" onClick={() => navigate(user ? '/dashboard' : '/auth')}>
                Start Your Journey
                <Zap className="ml-2 h-5 w-5" />
              </Button>
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

      {/* About Section */}
      <section className="py-8 sm:py-16 lg:py-24 bg-muted/30">
        <div className="container">
          <div className="text-center space-y-3 sm:space-y-4 mb-8 sm:mb-12 lg:mb-16 animate-slide-up">
            <h2 className="text-4xl lg:text-5xl font-bold">About MedMate</h2>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              Empowering healthcare through AI innovation
            </p>
          </div>
          
          <div className="grid lg:grid-cols-2 gap-6 sm:gap-8 lg:gap-12 items-center">
            <div className="space-y-4 sm:space-y-6 animate-slide-up">
              <p className="text-lg text-muted-foreground leading-relaxed">
                MedMate is an AI-powered medical assistant designed to bridge the gap between patients and healthcare providers. 
                Our mission is to make quality healthcare accessible to everyone, everywhere.
              </p>
              <p className="text-lg text-muted-foreground leading-relaxed">
                With advanced AI technology, MedMate provides instant symptom analysis, medical consultations, 
                and helps you locate nearby hospitals. We combine the power of artificial intelligence with 
                medical expertise to deliver accurate, reliable health information.
              </p>
              
              {/* Founder/Developer Section */}
              <div className="pt-6 border-t border-border">
                <h3 className="text-2xl font-semibold mb-4">Meet the Developer</h3>
                <div className="flex items-center gap-6">
                  <div className="relative group">
                    <div className="absolute -inset-1 bg-gradient-to-r from-primary to-accent rounded-full opacity-75 group-hover:opacity-100 blur transition-all"></div>
                    <img 
                      src={founderImage}
                      alt="Manas Rohilla - Founder and Developer" 
                      className="relative w-24 h-24 rounded-full object-cover border-4 border-background shadow-xl"
                    />
                  </div>
                  <div>
                    <h4 className="text-xl font-bold">Manas Rohilla</h4>
                    <p className="text-muted-foreground">Founder and Developer</p>
                  </div>
                </div>
              </div>
              
              <div className="flex flex-wrap gap-4 pt-4">
                <a 
                  href="https://www.instagram.com/manas_rohilla_" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="w-14 h-14 rounded-full bg-gradient-to-r from-pink-500 to-purple-500 hover:shadow-lg transition-all flex items-center justify-center text-white hover:scale-110"
                  title="Instagram"
                >
                  <Instagram className="h-6 w-6" />
                </a>
                <a 
                  href="https://github.com/rohillamanas06-commits" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="w-14 h-14 rounded-full bg-gradient-to-r from-gray-700 to-gray-900 hover:shadow-lg transition-all flex items-center justify-center text-white hover:scale-110"
                  title="GitHub"
                >
                  <Github className="h-6 w-6" />
                </a>
                <a 
                  href="mailto:rohillamanas06@gmail.com" 
                  className="w-14 h-14 rounded-full bg-gradient-to-r from-blue-500 to-blue-600 hover:shadow-lg transition-all flex items-center justify-center text-white hover:scale-110"
                  title="Email"
                >
                  <Mail className="h-6 w-6" />
                </a>
                <a 
                  href="https://peerlist.io/rohillamanas06" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="w-14 h-14 rounded-full bg-gradient-to-br from-gray-800 via-gray-900 to-gray-800 hover:shadow-lg transition-all duration-300 flex items-center justify-center text-white hover:scale-110 group relative overflow-hidden shadow-lg"
                  title="Peerlist"
                >
                  <div className="absolute inset-0 bg-gradient-to-br from-gray-700 via-gray-800 to-gray-900 opacity-0 group-hover:opacity-100 transition-all duration-500"></div>
                  <div className="relative w-14 h-14 flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
                    <Pilcrow className="w-10 h-10 text-white" />
                  </div>
                  <div className="absolute inset-0 rounded-full border-2 border-white/10 group-hover:border-white/30 transition-all duration-300"></div>
                </a>
                <a 
                  href="https://www.linkedin.com/in/manas-rohilla-b73415338/" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="w-14 h-14 rounded-full bg-gradient-to-r from-blue-600 to-blue-700 hover:shadow-lg transition-all flex items-center justify-center text-white hover:scale-110"
                  title="LinkedIn"
                >
                  <Linkedin className="h-6 w-6" />
                </a>
              </div>
            </div>
            <Card className="p-8 glass hover-lift animate-fade-in">
              <h3 className="text-2xl font-semibold mb-6 text-center">Get in Touch</h3>
              <p className="text-center text-muted-foreground mb-6">
                Have feedback or questions? We'd love to hear from you!
              </p>
              <div className="space-y-4">
                <Button variant="outline" className="w-full" asChild>
                  <a href="mailto:rohillamanas06@gmail.com">
                    <Activity className="h-4 w-4 mr-2" />
                    Contact Support
                  </a>
                </Button>
              </div>
            </Card>
          </div>
        </div>
      </section>

      {/* Feedback Form Section */}
      <section className="py-8 sm:py-16 lg:py-24">
        <div className="container max-w-2xl">
          <div className="text-center space-y-3 sm:space-y-4 mb-8 sm:mb-10 lg:mb-12">
            <h2 className="text-4xl lg:text-5xl font-bold">Share Your Feedback</h2>
            <p className="text-xl text-muted-foreground">
              Help us improve MedMate by sharing your thoughts
            </p>
          </div>
          <FeedbackForm />
        </div>
      </section>

    </div>
  );
}

// Feedback Form Component
function FeedbackForm() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [message, setMessage] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!name || !email || !message) {
      toast.error('Please fill in all fields');
      return;
    }

    setIsSubmitting(true);
    try {
      await api.submitFeedback(name, email, message);
      toast.success('Thank you for your feedback! We\'ll be in touch soon.');
      setName('');
      setEmail('');
      setMessage('');
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to send feedback. Please try again later.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Card className="p-8 glass animate-fade-in">
      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="space-y-2">
          <label htmlFor="name" className="text-sm font-medium">Name</label>
          <input
            id="name"
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="w-full px-4 py-2 rounded-lg border border-border bg-background focus:outline-none focus:ring-2 focus:ring-primary"
            placeholder="Your name"
            required
          />
        </div>
        <div className="space-y-2">
          <label htmlFor="email" className="text-sm font-medium">Email</label>
          <input
            id="email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full px-4 py-2 rounded-lg border border-border bg-background focus:outline-none focus:ring-2 focus:ring-primary"
            placeholder="your.email@example.com"
            required
          />
        </div>
        <div className="space-y-2">
          <label htmlFor="message" className="text-sm font-medium">Message</label>
          <textarea
            id="message"
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            rows={6}
            className="w-full px-4 py-2 rounded-lg border border-border bg-background focus:outline-none focus:ring-2 focus:ring-primary resize-none"
            placeholder="Share your thoughts, suggestions, or feedback..."
            required
          />
        </div>
        <Button type="submit" size="lg" className="w-full" disabled={isSubmitting}>
          {isSubmitting ? (
            <>
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              Sending...
            </>
          ) : (
            <>
              Submit Feedback
              <ArrowRight className="h-4 w-4 ml-2" />
            </>
          )}
        </Button>
      </form>
    </Card>
  );
}
