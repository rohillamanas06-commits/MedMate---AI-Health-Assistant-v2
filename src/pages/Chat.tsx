import { useState, useEffect, useRef } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Avatar } from '@/components/ui/avatar';
import { MessageSquare, Send, Loader2, Bot, User, Mic, Volume2, Coins } from 'lucide-react';
import { api } from '@/lib/api';
import { toast } from 'sonner';
import { useAuth } from '@/contexts/AuthContext';
import { BuyCreditsModal } from '@/components/BuyCreditsModal';

interface Message {
  id: string;
  content: string;
  sender: 'user' | 'ai';
  timestamp: Date;
}

export default function Chat() {
  const { user, updateCredits, checkAuth } = useAuth();
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [playingMessageId, setPlayingMessageId] = useState<string | null>(null);
  const [showBuyCredits, setShowBuyCredits] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    loadChatHistory();
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const scrollToBottom = () => {
    if (scrollRef.current) {
      scrollRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  };

  const loadChatHistory = async () => {
    try {
      const response: any = await api.getChatHistory(1, 20);
      const history = response.chats.map((chat: any) => [
        {
          id: `${chat.id}-user`,
          content: chat.message,
          sender: 'user' as const,
          timestamp: new Date(chat.created_at),
        },
        {
          id: `${chat.id}-ai`,
          content: chat.response,
          sender: 'ai' as const,
          timestamp: new Date(chat.created_at),
        },
      ]).flat();
      setMessages(history);
    } catch (error) {
      // Silent fail for history
    }
  };

  const handleSend = async () => {
    if (!input.trim()) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      content: input,
      sender: 'user',
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInput('');
    setLoading(true);

    try {
      const response: any = await api.sendChatMessage(input);
      const aiMessage: Message = {
        id: (Date.now() + 1).toString(),
        content: response.response,
        sender: 'ai',
        timestamp: new Date(response.timestamp),
      };
      setMessages((prev) => [...prev, aiMessage]);
      
      // Update credits if returned
      if (response.credits_remaining !== undefined) {
        updateCredits(response.credits_remaining);
      }
    } catch (error: any) {
      // Check if it's insufficient credits error
      if (error.message?.includes('Insufficient credits') || error.message?.includes('insufficient_credits')) {
        toast.error('Insufficient credits! Please purchase more credits to continue.');
        setShowBuyCredits(true);
      } else {
        toast.error('Failed to get response');
      }
      // Remove user message on error
      setMessages((prev) => prev.filter((m) => m.id !== userMessage.id));
    } finally {
      setLoading(false);
    }
  };

  const handleCreditsSuccess = async () => {
    await checkAuth();
    toast.success('Credits added! You can continue chatting.');
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const startVoiceRecognition = () => {
    if ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) {
      const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
      const recognition = new SpeechRecognition();
      
      recognition.continuous = false;
      recognition.interimResults = false;
      
      recognition.onstart = () => {
        setIsListening(true);
        toast.info('Listening... Speak now');
      };
      
      recognition.onresult = (event: any) => {
        const transcript = event.results[0][0].transcript;
        setInput(transcript);
        toast.success('Voice input captured');
      };
      
      recognition.onerror = () => {
        toast.error('Voice recognition failed');
        setIsListening(false);
      };
      
      recognition.onend = () => {
        setIsListening(false);
      };
      
      recognition.start();
    } else {
      toast.error('Voice recognition not supported');
    }
  };

  const speakText = (text: string, messageId: string) => {
    if ('speechSynthesis' in window) {
      // If this message is already playing, stop it
      if (playingMessageId === messageId) {
        window.speechSynthesis.cancel();
        setPlayingMessageId(null);
        toast.info('Audio stopped');
        return;
      }
      
      // Stop any currently playing speech
      window.speechSynthesis.cancel();
      setPlayingMessageId(messageId);
      
      // Create and play new speech
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.rate = 0.9;
      utterance.pitch = 1;
      utterance.volume = 1;
      
      utterance.onstart = () => {
        toast.success('Playing audio');
      };
      
      utterance.onend = () => {
        setPlayingMessageId(null);
      };
      
      utterance.onerror = () => {
        toast.error('Audio playback failed');
        setPlayingMessageId(null);
      };
      
      window.speechSynthesis.speak(utterance);
    } else {
      toast.error('Text-to-speech not supported');
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-muted/20 to-background py-8">
      <div className="container max-w-5xl">
        <div className="mb-6 animate-slide-up">
          <div className="text-center">
            <h1 className="text-4xl font-bold mb-2 gradient-text">AI Medical Assistant</h1>
            <p className="text-muted-foreground">
              Ask me anything about your health concerns
            </p>
          </div>
        </div>

        <Card className="glass overflow-hidden animate-fade-in" style={{ height: 'calc(100vh - 250px)' }}>
          <div className="flex flex-col h-full">
            {/* Messages Area */}
            <ScrollArea className="flex-1 p-6">
              {messages.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full text-center">
                  <Bot className="h-24 w-24 text-muted-foreground opacity-30 mb-4" />
                  <h3 className="text-xl font-semibold mb-2">Start a Conversation</h3>
                  <p className="text-muted-foreground max-w-md">
                    Hi {user?.username}! I'm your AI medical assistant. Ask me about symptoms,
                    medications, or general health advice.
                  </p>
                </div>
              ) : (
                <div className="space-y-4">
                  {messages.map((message, index) => (
                    <div
                      key={message.id}
                      className={`flex gap-3 animate-fade-in ${
                        message.sender === 'user' ? 'flex-row-reverse' : ''
                      }`}
                      style={{ animationDelay: `${index * 0.05}s` }}
                    >
                      <Avatar className={`h-10 w-10 flex-shrink-0 ${
                        message.sender === 'user' 
                          ? 'bg-gradient-to-br from-primary to-accent' 
                          : 'bg-gradient-to-br from-secondary to-accent'
                      }`}>
                        <div className="flex items-center justify-center h-full w-full text-white">
                          {message.sender === 'user' ? (
                            <User className="h-5 w-5" />
                          ) : (
                            <Bot className="h-5 w-5" />
                          )}
                        </div>
                      </Avatar>
                      <div
                        className={`flex-1 max-w-[80%] ${
                          message.sender === 'user' ? 'text-right' : ''
                        }`}
                      >
                        <Card
                          className={`p-4 relative transition-all duration-300 ${
                            message.sender === 'user'
                              ? 'bg-transparent border-0 shadow-sm hover:shadow-lg hover:bg-gradient-to-r hover:from-primary/10 hover:via-accent/10 hover:to-primary/10'
                              : 'bg-muted border-border/50'
                          }`}
                        >
                          {message.sender === 'user' && (
                            <div className="absolute inset-0 bg-gradient-to-r from-primary/0 via-primary/5 to-primary/0 opacity-0 hover:opacity-100 transition-opacity duration-300 rounded-lg pointer-events-none"></div>
                          )}
                          <p className="text-sm leading-relaxed whitespace-pre-wrap relative z-10">
                            {message.content}
                          </p>
                        </Card>
                        <div className="flex items-center gap-2 mt-1 px-1">
                          <span className="text-xs text-muted-foreground">
                            {message.timestamp.toLocaleTimeString()}
                          </span>
                          {message.sender === 'ai' && (
                            <Button
                              variant="ghost"
                              size="sm"
                              className={`h-6 px-2 ${playingMessageId === message.id ? 'text-primary animate-pulse' : ''}`}
                              onClick={() => speakText(message.content, message.id)}
                              title={playingMessageId === message.id ? 'Stop audio' : 'Play audio'}
                            >
                              <Volume2 className="h-3 w-3" />
                            </Button>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                  {loading && (
                    <div className="flex gap-3 animate-fade-in">
                      <Avatar className="h-10 w-10 bg-gradient-to-br from-secondary to-accent">
                        <div className="flex items-center justify-center h-full w-full text-white">
                          <Bot className="h-5 w-5" />
                        </div>
                      </Avatar>
                      <Card className="p-4 bg-muted">
                        <div className="flex items-center gap-2">
                          <Loader2 className="h-4 w-4 animate-spin" />
                          <span className="text-sm">Thinking...</span>
                        </div>
                      </Card>
                    </div>
                  )}
                  <div ref={scrollRef} />
                </div>
              )}
            </ScrollArea>

            {/* Input Area */}
            <div className="border-t bg-background/50 p-4">
              <div className="flex items-center gap-2 mb-2">
                <Coins className="h-4 w-4 text-emerald-600" />
                <span className="text-sm text-muted-foreground">
                  1 credit per message
                </span>
              </div>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="icon"
                  onClick={startVoiceRecognition}
                  disabled={isListening || loading}
                >
                  <Mic className={`h-4 w-4 ${isListening ? 'text-destructive animate-pulse' : ''}`} />
                </Button>
                <Input
                  placeholder="Type your message..."
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyPress={handleKeyPress}
                  disabled={loading}
                  className="flex-1"
                />
                <Button onClick={handleSend} disabled={loading || !input.trim()}>
                  {loading ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Send className="h-4 w-4" />
                  )}
                </Button>
              </div>
              <p className="text-xs text-muted-foreground mt-2 text-center">
                Press Enter to send • Shift+Enter for new line
              </p>
            </div>
          </div>
        </Card>
      </div>
      
      {/* Buy Credits Modal */}
      <BuyCreditsModal
        isOpen={showBuyCredits}
        onClose={() => setShowBuyCredits(false)}
        onSuccess={handleCreditsSuccess}
        currentCredits={user?.credits || 0}
      />
    </div>
  );
}
