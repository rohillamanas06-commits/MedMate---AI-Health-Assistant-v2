import { useEffect, useState } from 'react';
import { Card } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Brain, MessageSquare, Calendar, Clock, TrendingUp } from 'lucide-react';
import { api } from '@/lib/api';
import { toast } from 'sonner';
import { Progress } from '@/components/ui/progress';

export default function History() {
  const [diagnoses, setDiagnoses] = useState<any[]>([]);
  const [chats, setChats] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadHistory();
  }, []);

  const loadHistory = async () => {
    try {
      const [diagnosisRes, chatRes]: any = await Promise.all([
        api.getDiagnosisHistory(1, 20),
        api.getChatHistory(1, 20),
      ]);
      setDiagnoses(diagnosisRes.diagnoses || []);
      setChats(chatRes.chats || []);
    } catch (error) {
      toast.error('Failed to load history');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-muted/20 to-background py-8">
      <div className="container max-w-6xl">
        <div className="mb-8 text-center animate-slide-up">
          <h1 className="text-4xl font-bold mb-2 gradient-text">Medical History</h1>
          <p className="text-muted-foreground text-lg">
            View your past diagnoses and conversations
          </p>
        </div>

        <Card className="glass animate-fade-in">
          <Tabs defaultValue="diagnoses" className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="diagnoses">
                <Brain className="h-4 w-4 mr-2" />
                Diagnoses ({diagnoses.length})
              </TabsTrigger>
              <TabsTrigger value="chats">
                <MessageSquare className="h-4 w-4 mr-2" />
                Chat History ({chats.length})
              </TabsTrigger>
            </TabsList>

            <TabsContent value="diagnoses" className="p-6">
              {loading ? (
                <div className="space-y-4">
                  {[1, 2, 3].map((i) => (
                    <Card key={i} className="p-6 animate-pulse">
                      <div className="h-4 bg-muted rounded w-3/4 mb-4"></div>
                      <div className="h-3 bg-muted rounded w-1/2"></div>
                    </Card>
                  ))}
                </div>
              ) : diagnoses.length === 0 ? (
                <div className="text-center py-12">
                  <Brain className="h-16 w-16 mx-auto mb-4 text-muted-foreground opacity-30" />
                  <h3 className="text-xl font-semibold mb-2">No Diagnoses Yet</h3>
                  <p className="text-muted-foreground">
                    Your diagnosis history will appear here
                  </p>
                </div>
              ) : (
                <div className="space-y-6">
                  {diagnoses.map((diagnosis, index) => (
                    <Card
                      key={diagnosis.id}
                      className="p-6 hover-lift animate-fade-in"
                      style={{ animationDelay: `${index * 0.1}s` }}
                    >
                      <div className="flex items-start justify-between mb-4">
                        <div>
                          <h3 className="font-semibold text-lg mb-2">
                            {diagnosis.symptoms}
                          </h3>
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
                      </div>

                      {diagnosis.result?.diseases && (
                        <div className="space-y-3">
                          {diagnosis.result.diseases.slice(0, 3).map((disease: any, i: number) => (
                            <div key={i} className="space-y-2">
                              <div className="flex items-center justify-between">
                                <span className="text-sm font-medium">{disease.name}</span>
                                <span className="text-sm font-bold text-primary">
                                  {disease.confidence}%
                                </span>
                              </div>
                              <Progress value={disease.confidence} />
                            </div>
                          ))}
                        </div>
                      )}

                      {diagnosis.image_url && (
                        <div className="mt-4">
                          <img
                            src={diagnosis.image_url}
                            alt="Medical scan"
                            className="rounded-lg max-h-48 object-cover"
                            onError={(e) => {
                              const target = e.target as HTMLImageElement;
                              console.error('Image failed to load:', diagnosis.image_url);
                              target.style.display = 'none';
                              const parent = target.parentElement;
                              if (parent) {
                                parent.innerHTML = '<div class="flex items-center justify-center h-32 bg-muted/50 rounded-lg"><span class="text-muted-foreground text-sm">Image not available</span></div>';
                              }
                            }}
                            onLoad={() => {
                              console.log('Image loaded successfully:', diagnosis.image_url);
                            }}
                          />
                        </div>
                      )}
                    </Card>
                  ))}
                </div>
              )}
            </TabsContent>

            <TabsContent value="chats" className="p-6">
              {loading ? (
                <div className="space-y-4">
                  {[1, 2, 3].map((i) => (
                    <Card key={i} className="p-6 animate-pulse">
                      <div className="h-4 bg-muted rounded w-3/4 mb-2"></div>
                      <div className="h-3 bg-muted rounded w-1/2"></div>
                    </Card>
                  ))}
                </div>
              ) : chats.length === 0 ? (
                <div className="text-center py-12">
                  <MessageSquare className="h-16 w-16 mx-auto mb-4 text-muted-foreground opacity-30" />
                  <h3 className="text-xl font-semibold mb-2">No Chat History</h3>
                  <p className="text-muted-foreground">
                    Your conversations will appear here
                  </p>
                </div>
              ) : (
                <div className="space-y-4">
                  {chats.map((chat, index) => (
                    <Card
                      key={chat.id}
                      className="p-6 hover-lift animate-fade-in"
                      style={{ animationDelay: `${index * 0.05}s` }}
                    >
                      <div className="space-y-3">
                        <div>
                          <div className="flex items-center gap-2 mb-2">
                            <span className="text-xs font-medium text-primary">You</span>
                            <span className="text-xs text-muted-foreground">
                              {new Date(chat.created_at).toLocaleString()}
                            </span>
                          </div>
                          <p className="text-sm bg-muted/50 rounded-lg p-3">
                            {chat.message}
                          </p>
                        </div>
                        <div>
                          <div className="flex items-center gap-2 mb-2">
                            <span className="text-xs font-medium text-secondary">AI Assistant</span>
                          </div>
                          <p className="text-sm bg-primary/5 rounded-lg p-3">
                            {chat.response}
                          </p>
                        </div>
                      </div>
                    </Card>
                  ))}
                </div>
              )}
            </TabsContent>
          </Tabs>
        </Card>
      </div>
    </div>
  );
}
