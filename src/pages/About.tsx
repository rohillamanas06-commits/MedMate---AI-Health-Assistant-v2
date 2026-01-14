import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import {
  Activity,
  Instagram,
  Github,
  Mail,
  Linkedin,
  Pilcrow,
  ArrowRight,
  Loader2,
} from 'lucide-react';
import { api } from '@/lib/api';
import { toast } from 'sonner';
import founderImage from '@/assets/founder.jpg';

export default function About() {
  return (
    <div className="min-h-screen">
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
