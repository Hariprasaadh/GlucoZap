"use client";

import { useState, useEffect, useRef } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { ScrollArea } from '@/components/ui/scroll-area';
import { 
  Mic, 
  MicOff, 
  Send, 
  Heart, 
  Activity, 
  Shield, 
  Stethoscope,
  MessageCircle,
  Volume2,
  VolumeX,
  RefreshCw,
  AlertCircle
} from 'lucide-react';
import { useVapi } from '@/hooks/useVapi';

// Health tips data
const healthTips = [
  {
    category: "Nutrition",
    tips: [
      "Drink at least 8 glasses of water daily",
      "Include 5 servings of fruits and vegetables in your diet",
      "Choose whole grains over refined grains",
      "Limit processed foods and added sugars"
    ]
  },
  {
    category: "Exercise",
    tips: [
      "Aim for 150 minutes of moderate exercise weekly",
      "Take the stairs instead of elevators",
      "Do strength training 2-3 times per week",
      "Take short walks every hour if you sit for long periods"
    ]
  },
  {
    category: "Mental Health",
    tips: [
      "Practice deep breathing for 5 minutes daily",
      "Get 7-9 hours of quality sleep",
      "Stay connected with friends and family",
      "Practice gratitude and mindfulness"
    ]
  },
  {
    category: "Preventive Care",
    tips: [
      "Get regular health checkups",
      "Stay up to date with vaccinations",
      "Monitor your blood pressure regularly",
      "Practice good hygiene habits"
    ]
  }
];

interface Message {
  id: string;
  type: 'user' | 'assistant';
  content: string;
  timestamp: Date;
  isVoice?: boolean;
}

export default function AIAssistantPage() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputMessage, setInputMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  
  // Vapi integration
  const {
    isSessionActive,
    isMuted,
    isLoading: vapiLoading,
    error: vapiError,
    startSession,
    endSession,
    toggleMute,
    sendMessage: sendVapiMessage
  } = useVapi();

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Initialize with welcome message
  useEffect(() => {
    const welcomeMessage: Message = {
      id: 'welcome',
      type: 'assistant',
      content: "Hello! I'm your personal health assistant. I can provide simple health tips, answer basic health questions, and help you maintain a healthy lifestyle. You can type your questions or use voice commands by clicking the microphone button. How can I help you today?",
      timestamp: new Date()
    };
    setMessages([welcomeMessage]);
  }, []);

  const getHealthResponse = (query: string): string => {
    const lowerQuery = query.toLowerCase();
    
    // Basic health responses
    if (lowerQuery.includes('water') || lowerQuery.includes('hydration')) {
      return "💧 Staying hydrated is crucial! Drink at least 8 glasses of water daily. You can also get hydration from fruits, vegetables, and herbal teas. Signs of good hydration include pale yellow urine and feeling energetic.";
    }
    
    if (lowerQuery.includes('exercise') || lowerQuery.includes('workout') || lowerQuery.includes('fitness')) {
      return "🏃‍♀️ Regular exercise is key to good health! Aim for at least 150 minutes of moderate aerobic activity weekly, plus strength training 2-3 times per week. Start small - even 10-minute walks help!";
    }
    
    if (lowerQuery.includes('sleep') || lowerQuery.includes('rest')) {
      return "😴 Quality sleep is essential! Adults need 7-9 hours nightly. Create a bedtime routine, avoid screens before bed, keep your room cool and dark, and stick to consistent sleep times.";
    }
    
    if (lowerQuery.includes('stress') || lowerQuery.includes('anxiety') || lowerQuery.includes('mental health')) {
      return "🧘‍♀️ Managing stress is vital for overall health. Try deep breathing exercises, meditation, regular exercise, and maintaining social connections. If stress persists, consider speaking with a healthcare professional.";
    }
    
    if (lowerQuery.includes('nutrition') || lowerQuery.includes('diet') || lowerQuery.includes('food')) {
      return "🥗 A balanced diet includes fruits, vegetables, whole grains, lean proteins, and healthy fats. Limit processed foods, added sugars, and excessive sodium. Portion control is also important!";
    }
    
    if (lowerQuery.includes('weight') || lowerQuery.includes('bmi')) {
      return "⚖️ Maintaining a healthy weight involves balancing calories consumed with calories burned through activity. Focus on sustainable lifestyle changes rather than quick fixes. Consult healthcare providers for personalized advice.";
    }
    
    if (lowerQuery.includes('heart') || lowerQuery.includes('cardiovascular')) {
      return "❤️ Heart health tips: Exercise regularly, eat a balanced diet low in saturated fats, don't smoke, limit alcohol, manage stress, and get regular checkups including blood pressure monitoring.";
    }
    
    if (lowerQuery.includes('immune') || lowerQuery.includes('immunity')) {
      return "🛡️ Boost immunity with: adequate sleep, regular exercise, balanced nutrition, stress management, good hygiene, staying hydrated, and avoiding smoking. Vaccines also help protect against diseases.";
    }
    
    // Random health tip if no specific match
    const randomCategory = healthTips[Math.floor(Math.random() * healthTips.length)];
    const randomTip = randomCategory.tips[Math.floor(Math.random() * randomCategory.tips.length)];
    
    return `💡 Here's a ${randomCategory.category.toLowerCase()} tip: ${randomTip}. Feel free to ask me about specific health topics like nutrition, exercise, sleep, or stress management!`;
  };

  const handleSendMessage = async () => {
    if (!inputMessage.trim()) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      type: 'user',
      content: inputMessage,
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    setInputMessage('');
    setIsLoading(true);

    // Simulate processing time
    await new Promise(resolve => setTimeout(resolve, 1000));

    const response = getHealthResponse(inputMessage);
    const assistantMessage: Message = {
      id: (Date.now() + 1).toString(),
      type: 'assistant',
      content: response,
      timestamp: new Date()
    };

    setMessages(prev => [...prev, assistantMessage]);
    setIsLoading(false);

    // Speak the response if speech synthesis is available
    if ('speechSynthesis' in window) {
      const utterance = new SpeechSynthesisUtterance(response);
      utterance.rate = 0.8;
      utterance.pitch = 1;
      setIsSpeaking(true);
      utterance.onend = () => setIsSpeaking(false);
      speechSynthesis.speak(utterance);
    }
  };

  const handleVoiceStart = async () => {
    try {
      await startSession();
    } catch (error) {
      console.error('Failed to start voice session:', error);
    }
  };

  const handleVoiceEnd = () => {
    endSession();
  };

  const stopSpeaking = () => {
    if ('speechSynthesis' in window) {
      speechSynthesis.cancel();
      setIsSpeaking(false);
    }
  };

  const clearChat = () => {
    const welcomeMessage: Message = {
      id: 'welcome-new',
      type: 'assistant',
      content: "Chat cleared! How can I help you with your health today?",
      timestamp: new Date()
    };
    setMessages([welcomeMessage]);
  };

  return (
    <div className="container mx-auto p-6 max-w-6xl">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">
          AI Health Assistant
        </h1>
        <p className="text-gray-600">
          Your personal health companion for tips, guidance, and wellness support
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Health Tips Sidebar */}
        <div className="lg:col-span-1 space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Heart className="h-5 w-5 text-red-500" />
                Quick Health Tips
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {healthTips.map((category, index) => (
                <div key={index} className="space-y-2">
                  <Badge variant="outline" className="text-xs">
                    {category.category}
                  </Badge>
                  <ul className="text-sm text-gray-600 space-y-1">
                    {category.tips.slice(0, 2).map((tip, tipIndex) => (
                      <li key={tipIndex} className="flex items-start gap-1">
                        <span className="text-green-500 mt-1">•</span>
                        {tip}
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Shield className="h-5 w-5 text-blue-500" />
                Voice Assistant
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex flex-col gap-2">
                <Button
                  onClick={isSessionActive ? handleVoiceEnd : handleVoiceStart}
                  variant={isSessionActive ? "destructive" : "default"}
                  className="w-full"
                  disabled={vapiLoading}
                >
                  {vapiLoading ? (
                    <RefreshCw className="h-4 w-4 animate-spin mr-2" />
                  ) : isSessionActive ? (
                    <MicOff className="h-4 w-4 mr-2" />
                  ) : (
                    <Mic className="h-4 w-4 mr-2" />
                  )}
                  {isSessionActive ? 'End Voice Chat' : 'Start Voice Chat'}
                </Button>
                
                {isSessionActive && (
                  <Button
                    onClick={toggleMute}
                    variant="outline"
                    className="w-full"
                  >
                    {isMuted ? (
                      <VolumeX className="h-4 w-4 mr-2" />
                    ) : (
                      <Volume2 className="h-4 w-4 mr-2" />
                    )}
                    {isMuted ? 'Unmute' : 'Mute'}
                  </Button>
                )}
              </div>
              
              {vapiError && (
                <div className="flex items-center gap-2 text-red-600 text-sm">
                  <AlertCircle className="h-4 w-4" />
                  Voice service unavailable
                </div>
              )}
              
              <p className="text-xs text-gray-500">
                Use voice commands to ask health questions naturally
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Main Chat Interface */}
        <div className="lg:col-span-3">
          <Card className="h-[600px] flex flex-col">
            <CardHeader className="flex-shrink-0">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Stethoscope className="h-5 w-5 text-green-500" />
                  <CardTitle>Health Chat</CardTitle>
                  {isSessionActive && (
                    <Badge variant="outline" className="text-green-600">
                      <Activity className="h-3 w-3 mr-1" />
                      Voice Active
                    </Badge>
                  )}
                </div>
                <div className="flex gap-2">
                  {isSpeaking && (
                    <Button
                      onClick={stopSpeaking}
                      variant="outline"
                      size="sm"
                    >
                      <VolumeX className="h-4 w-4" />
                    </Button>
                  )}
                  <Button
                    onClick={clearChat}
                    variant="outline"
                    size="sm"
                  >
                    <RefreshCw className="h-4 w-4" />
                  </Button>
                </div>
              </div>
              <CardDescription>
                Ask me about nutrition, exercise, sleep, stress management, and general health tips
              </CardDescription>
            </CardHeader>

            <CardContent className="flex-1 flex flex-col p-0">
              {/* Messages Area */}
              <ScrollArea className="flex-1 p-4">
                <div className="space-y-4">
                  {messages.map((message) => (
                    <div
                      key={message.id}
                      className={`flex ${
                        message.type === 'user' ? 'justify-end' : 'justify-start'
                      }`}
                    >
                      <div
                        className={`max-w-[80%] rounded-lg p-3 ${
                          message.type === 'user'
                            ? 'bg-blue-500 text-white'
                            : 'bg-gray-100 text-gray-900'
                        }`}
                      >
                        <div className="flex items-start gap-2">
                          {message.type === 'assistant' && (
                            <Stethoscope className="h-4 w-4 mt-1 text-green-500" />
                          )}
                          {message.type === 'user' && message.isVoice && (
                            <Mic className="h-4 w-4 mt-1" />
                          )}
                          <div className="flex-1">
                            <p className="text-sm">{message.content}</p>
                            <p className={`text-xs mt-1 ${
                              message.type === 'user' 
                                ? 'text-blue-100' 
                                : 'text-gray-500'
                            }`}>
                              {message.timestamp.toLocaleTimeString()}
                            </p>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                  
                  {isLoading && (
                    <div className="flex justify-start">
                      <div className="bg-gray-100 rounded-lg p-3">
                        <div className="flex items-center gap-2">
                          <Stethoscope className="h-4 w-4 text-green-500" />
                          <div className="flex gap-1">
                            <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" />
                            <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce delay-100" />
                            <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce delay-200" />
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
                <div ref={messagesEndRef} />
              </ScrollArea>

              {/* Input Area */}
              <div className="border-t p-4">
                <div className="flex gap-2">
                  <Textarea
                    value={inputMessage}
                    onChange={(e) => setInputMessage(e.target.value)}
                    placeholder="Ask me about your health... (e.g., 'How much water should I drink?')"
                    className="flex-1 min-h-[40px] max-h-[120px]"
                    onKeyPress={(e) => {
                      if (e.key === 'Enter' && !e.shiftKey) {
                        e.preventDefault();
                        handleSendMessage();
                      }
                    }}
                  />
                  <Button
                    onClick={handleSendMessage}
                    disabled={!inputMessage.trim() || isLoading}
                    className="px-4"
                  >
                    <Send className="h-4 w-4" />
                  </Button>
                </div>
                
                <div className="flex justify-between items-center mt-2 text-xs text-gray-500">
                  <span>Press Enter to send, Shift+Enter for new line</span>
                  {isSpeaking && (
                    <div className="flex items-center gap-1 text-green-600">
                      <Volume2 className="h-3 w-3" />
                      Speaking...
                    </div>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}