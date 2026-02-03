import { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Brain,
  Image as ImageIcon,
  Upload,
  Loader2,
  AlertCircle,
  CheckCircle2,
  Mic,
  X,
  Volume2,
  Coins,
} from 'lucide-react';
import { api } from '@/lib/api';
import { toast } from 'sonner';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useAuth } from '@/contexts/AuthContext';
import { BuyCreditsModal } from '@/components/BuyCreditsModal';

export default function Diagnose() {
  const { user, updateCredits, checkAuth } = useAuth();
  const [symptoms, setSymptoms] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [selectedImages, setSelectedImages] = useState<File[]>([]);
  const [imagePreviews, setImagePreviews] = useState<string[]>([]);
  const [isListening, setIsListening] = useState(false);
  const [showBuyCredits, setShowBuyCredits] = useState(false);

  const handleTextDiagnosis = async () => {
    if (!symptoms.trim()) {
      toast.error('Please enter your symptoms');
      return;
    }

    setLoading(true);
    setResult(null);

    try {
      const response: any = await api.diagnose(symptoms);
      setResult(response.result);
      toast.success('Analysis complete!');
      
      // Update credits if returned
      if (response.credits_remaining !== undefined) {
        updateCredits(response.credits_remaining);
      }
    } catch (error: any) {
      const errorMessage = error instanceof Error ? error.message : 'Diagnosis failed';
      
      // Check if it's insufficient credits error
      if (errorMessage.includes('Insufficient credits') || errorMessage.includes('insufficient_credits')) {
        toast.error('Insufficient credits! Please purchase more credits to continue.');
        setShowBuyCredits(true);
      } else if (errorMessage.includes('timeout')) {
        toast.error('Analysis is taking longer than expected. Please try again with shorter symptoms or check your connection.');
      } else if (errorMessage.includes('network')) {
        toast.error('Network error. Please check your internet connection and try again.');
      } else {
        toast.error(`Diagnosis failed: ${errorMessage}`);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleImageDiagnosis = async () => {
    if (selectedImages.length === 0) {
      toast.error('Please select at least one image');
      return;
    }

    setLoading(true);
    setResult(null);

    try {
      // For now, analyze the first image (backend needs update for multiple)
      const response: any = await api.diagnoseImage(selectedImages[0], symptoms);
      setResult(response.result);
      toast.success(`Image analysis complete! (${selectedImages.length} image${selectedImages.length > 1 ? 's' : ''} uploaded)`);
      
      // Update credits if returned
      if (response.credits_remaining !== undefined) {
        updateCredits(response.credits_remaining);
      }
    } catch (error: any) {
      const errorMessage = error instanceof Error ? error.message : 'Image analysis failed';
      
      // Check if it's insufficient credits error
      if (errorMessage.includes('Insufficient credits') || errorMessage.includes('insufficient_credits')) {
        toast.error('Insufficient credits! Please purchase more credits to continue.');
        setShowBuyCredits(true);
      } else if (errorMessage.includes('timeout')) {
        toast.error('Image analysis is taking longer than expected. Please try again with a smaller image or check your connection.');
      } else if (errorMessage.includes('network')) {
        toast.error('Network error. Please check your internet connection and try again.');
      } else {
        toast.error(`Image analysis failed: ${errorMessage}`);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleCreditsSuccess = async () => {
    await checkAuth();
    toast.success('Credits added! You can continue with diagnosis.');
  };

  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (files.length > 0) {
      // Calculate how many more images we can add
      const remainingSlots = 5 - selectedImages.length;
      const filesToAdd = files.slice(0, remainingSlots);
      
      if (filesToAdd.length === 0) {
        toast.error('Maximum 5 images already selected');
        e.target.value = ''; // Reset input
        return;
      }
      
      // Add new files to existing ones
      const newImages = [...selectedImages, ...filesToAdd];
      setSelectedImages(newImages);
      
      // Generate previews for new images
      const newPreviews: string[] = [];
      let loadedCount = 0;
      
      filesToAdd.forEach((file) => {
        const reader = new FileReader();
        reader.onloadend = () => {
          newPreviews.push(reader.result as string);
          loadedCount++;
          if (loadedCount === filesToAdd.length) {
            setImagePreviews(prev => [...prev, ...newPreviews]);
          }
        };
        reader.readAsDataURL(file);
      });
      
      if (files.length > remainingSlots) {
        toast.info(`Added ${filesToAdd.length} image(s). Maximum 5 images allowed.`);
      } else {
        toast.success(`Added ${filesToAdd.length} image(s)`);
      }
      
      // Reset input so same file can be selected again
      e.target.value = '';
    }
  };

  const removeImage = (index: number) => {
    setSelectedImages(prev => prev.filter((_, i) => i !== index));
    setImagePreviews(prev => prev.filter((_, i) => i !== index));
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
        setSymptoms(prev => prev + ' ' + transcript);
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

  const speakText = (text: string) => {
    if ('speechSynthesis' in window) {
      // Stop any ongoing speech
      window.speechSynthesis.cancel();
      
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.rate = 0.9;
      utterance.pitch = 1;
      utterance.volume = 1;
      window.speechSynthesis.speak(utterance);
      toast.success('Playing audio');
    } else {
      toast.error('Text-to-speech not supported in your browser');
    }
  };

  const getUrgencyColor = (urgency: string) => {
    switch (urgency?.toLowerCase()) {
      case 'high':
        return 'text-destructive';
      case 'medium':
        return 'text-orange-500';
      default:
        return 'text-secondary';
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-muted/20 to-background py-8">
      <div className="container max-w-6xl">
        <div className="mb-8 px-4 text-center animate-slide-up">
          <h1 className="text-4xl font-bold mb-3 bg-gradient-to-r from-primary to-primary/80 bg-clip-text text-transparent leading-tight">
            AI Medical Diagnosis
          </h1>
          <p className="text-muted-foreground text-lg px-2">
            Describe your symptoms or upload an image for instant AI analysis
          </p>
        </div>

        <div className="grid lg:grid-cols-2 gap-8">
          {/* Input Section */}
          <div className="space-y-6">
            <Card className="p-6 glass animate-fade-in">
              <Tabs defaultValue="text">
                <TabsList className="grid w-full grid-cols-2">
                  <TabsTrigger value="text">
                    <Brain className="h-4 w-4 mr-2" />
                    Text Input
                  </TabsTrigger>
                  <TabsTrigger value="image">
                    <ImageIcon className="h-4 w-4 mr-2" />
                    Image Analysis
                  </TabsTrigger>
                </TabsList>

                <TabsContent value="text" className="space-y-4">
                  <div>
                    <Label htmlFor="symptoms">Describe Your Symptoms</Label>
                    <Textarea
                      id="symptoms"
                      placeholder="e.g., I have a headache, fever, and sore throat for 2 days..."
                      value={symptoms}
                      onChange={(e) => setSymptoms(e.target.value)}
                      className="min-h-[200px] mt-2"
                    />
                  </div>
                  <div className="flex gap-2">
                    <Button onClick={handleTextDiagnosis} disabled={loading} className="flex-1">
                      {loading ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Analyzing...
                        </>
                      ) : (
                        <>
                          <Brain className="mr-2 h-4 w-4" />
                          Analyze Symptoms
                        </>
                      )}
                    </Button>
                    <Button
                      variant="outline"
                      size="icon"
                      onClick={startVoiceRecognition}
                      disabled={isListening}
                    >
                      <Mic className={`h-4 w-4 ${isListening ? 'text-destructive animate-pulse' : ''}`} />
                    </Button>
                  </div>
                </TabsContent>

                <TabsContent value="image" className="space-y-4">
                  <div>
                    <Label>Upload Medical Images (Max 5)</Label>
                    <div
                      className={`mt-2 border-2 border-dashed rounded-lg p-8 text-center cursor-pointer hover:border-primary transition-colors ${
                        imagePreviews.length > 0 ? 'border-primary' : 'border-border'
                      }`}
                      onClick={() => document.getElementById('image-upload')?.click()}
                    >
                      {imagePreviews.length > 0 ? (
                        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                          {imagePreviews.map((preview, index) => (
                            <div key={index} className="relative group">
                              <img
                                src={preview}
                                alt={`Preview ${index + 1}`}
                                className="w-full h-32 object-cover rounded-lg"
                              />
                              <Button
                                variant="destructive"
                                size="icon"
                                className="absolute top-1 right-1 h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  removeImage(index);
                                }}
                              >
                                <X className="h-3 w-3" />
                              </Button>
                              <div className="absolute bottom-1 left-1 bg-black/60 text-white text-xs px-2 py-1 rounded">
                                {index + 1}/{imagePreviews.length}
                              </div>
                            </div>
                          ))}
                          {imagePreviews.length < 5 && (
                            <div className="flex items-center justify-center h-32 border-2 border-dashed border-muted-foreground/30 rounded-lg">
                              <div className="text-center">
                                <Upload className="h-8 w-8 mx-auto text-muted-foreground mb-1" />
                                <p className="text-xs text-muted-foreground">Add more</p>
                              </div>
                            </div>
                          )}
                        </div>
                      ) : (
                        <div className="space-y-2">
                          <Upload className="h-12 w-12 mx-auto text-muted-foreground" />
                          <p className="text-sm text-muted-foreground">
                            Click to upload or drag and drop
                          </p>
                          <p className="text-xs text-muted-foreground">PNG, JPG up to 16MB • Max 5 images</p>
                        </div>
                      )}
                    </div>
                    <input
                      id="image-upload"
                      type="file"
                      accept="image/*"
                      multiple
                      onChange={handleImageSelect}
                      className="hidden"
                    />
                  </div>
                  <div>
                    <Label htmlFor="image-symptoms">Additional Symptoms (Optional)</Label>
                    <Textarea
                      id="image-symptoms"
                      placeholder="Any additional context about the image..."
                      value={symptoms}
                      onChange={(e) => setSymptoms(e.target.value)}
                      className="mt-2"
                    />
                  </div>
                  <Button onClick={handleImageDiagnosis} disabled={loading} className="w-full">
                    {loading ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Analyzing Image...
                      </>
                    ) : (
                      <>
                        <ImageIcon className="mr-2 h-4 w-4" />
                        Analyze Image
                      </>
                    )}
                  </Button>
                </TabsContent>
              </Tabs>
            </Card>

            <Alert>
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                <strong>Medical Disclaimer:</strong> This AI diagnosis is for informational purposes
                only. Always consult with a healthcare professional for medical advice.
                <br />
                <strong>Note:</strong> AI analysis is processing. Please be patient during analysis.
              </AlertDescription>
            </Alert>
          </div>

          {/* Results Section */}
          <div className="space-y-6">
            {result ? (
              <div className="space-y-4 animate-scale-in">
                <Card className="p-6 glass">
                  <div className="flex items-center justify-between mb-4">
                    <h2 className="text-2xl font-bold">Diagnosis Results</h2>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        const textToSpeak = result.diseases?.map((d: any) => 
                          `${d.name} with ${d.confidence}% confidence. ${d.explanation}`
                        ).join('. ') + '. ' + (result.general_advice || '');
                        speakText(textToSpeak);
                      }}
                    >
                      <Volume2 className="h-4 w-4 mr-2" />
                      Read Aloud
                    </Button>
                  </div>
                  
                  {/* Image Analysis Results */}
                  {result.observation && (
                    <Card className="p-4 mb-4 bg-blue-500/10 border-blue-500/20">
                      <h3 className="font-semibold text-lg mb-2">Image Observation</h3>
                      <p className="text-sm text-muted-foreground">{result.observation}</p>
                    </Card>
                  )}

                  {result.conditions && (
                    <div className="space-y-4 mb-4">
                      <h3 className="font-semibold text-lg">Detected Conditions</h3>
                      {result.conditions.map((condition: any, index: number) => (
                        <Card key={index} className="p-4 bg-muted/50">
                          <div className="flex items-start justify-between mb-2">
                            <h4 className="font-semibold">{condition.name}</h4>
                            <span className="text-xl font-bold text-primary">
                              {condition.confidence}%
                            </span>
                          </div>
                          <Progress value={condition.confidence} className="mb-2" />
                          <p className="text-sm text-muted-foreground">{condition.note}</p>
                        </Card>
                      ))}
                    </div>
                  )}

                  {result.recommendation && (
                    <Alert className="mb-4">
                      <AlertCircle className="h-4 w-4" />
                      <AlertDescription>
                        <strong>Recommendation:</strong> {result.recommendation}
                      </AlertDescription>
                    </Alert>
                  )}

                  {result.professional_evaluation && (
                    <Alert className="mb-4" variant={result.professional_evaluation === 'Required' ? 'destructive' : 'default'}>
                      <AlertCircle className="h-4 w-4" />
                      <AlertDescription>
                        <strong>Professional Evaluation:</strong> {result.professional_evaluation}
                      </AlertDescription>
                    </Alert>
                  )}

                  {/* Text Diagnosis Results */}
                  {result.diseases?.map((disease: any, index: number) => (
                    <Card key={index} className="p-4 mb-4 bg-muted/50">
                      <div className="flex items-start justify-between mb-2">
                        <h3 className="font-semibold text-lg">{disease.name}</h3>
                        <span className="text-2xl font-bold text-primary">
                          {disease.confidence}%
                        </span>
                      </div>
                      <Progress value={disease.confidence} className="mb-3" />
                      <p className="text-sm text-muted-foreground mb-3">{disease.explanation}</p>
                      
                      {disease.solutions && (
                        <div className="space-y-2">
                          <p className="font-medium text-sm">Recommended Solutions:</p>
                          <ul className="space-y-1">
                            {disease.solutions.map((solution: string, i: number) => (
                              <li key={i} className="text-sm flex items-start gap-2">
                                <CheckCircle2 className="h-4 w-4 text-secondary mt-0.5 flex-shrink-0" />
                                <span>{solution}</span>
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}
                      
                      {disease.urgency && (
                        <div className="mt-3 pt-3 border-t">
                          <span className="text-sm font-medium">Urgency Level: </span>
                          <span className={`text-sm font-bold ${getUrgencyColor(disease.urgency)}`}>
                            {disease.urgency}
                          </span>
                        </div>
                      )}
                    </Card>
                  ))}

                  {result.general_advice && (
                    <Alert>
                      <AlertCircle className="h-4 w-4" />
                      <AlertDescription>
                        <strong>General Advice:</strong> {result.general_advice}
                      </AlertDescription>
                    </Alert>
                  )}

                  {result.disclaimer && (
                    <p className="text-xs text-muted-foreground mt-4">{result.disclaimer}</p>
                  )}
                </Card>
              </div>
            ) : (
              <Card className="p-12 text-center glass">
                <Brain className="h-24 w-24 mx-auto mb-4 text-muted-foreground opacity-30 animate-float" />
                <h3 className="text-xl font-semibold mb-2">Ready for Analysis</h3>
                <p className="text-muted-foreground">
                  Enter your symptoms or upload an image to get started
                </p>
                <div className="flex items-center justify-center gap-2 mt-4 text-emerald-600">
                  <Coins className="h-5 w-5" />
                  <span className="text-sm font-medium">
                    {user?.credits || 0} credits available • 1 credit per diagnosis
                  </span>
                </div>
              </Card>
            )}
          </div>
        </div>
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
