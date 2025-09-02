import { useState, useEffect, useCallback, useRef } from 'react';

// Vapi types
interface VapiConfig {
  assistant: {
    model: {
      provider: string;
      model: string;
      messages: Array<{
        role: string;
        content: string;
      }>;
    };
    voice: {
      provider: string;
      voiceId: string;
    };
    transcriber: {
      provider: string;
      model: string;
      language: string;
    };
  };
}

interface VapiSendMessage {
  type: string;
  message: {
    role: string;
    content: string;
  };
}

interface VapiInstance {
  start: (config: VapiConfig['assistant']) => Promise<void>;
  stop: () => void;
  setMuted: (muted: boolean) => void;
  send: (message: VapiSendMessage) => void;
  on: (event: string, callback: (data?: unknown) => void) => void;
}

// Vapi configuration
const VAPI_CONFIG: { apiKey: string; assistant: VapiConfig['assistant'] } = {
  apiKey: process.env.NEXT_PUBLIC_VAPI_API_KEY || '',
  assistant: {
    model: {
      provider: 'openai',
      model: 'gpt-3.5-turbo',
      messages: [
        {
          role: 'system',
          content: `You are a helpful health assistant for GlucoZap, a diabetes and health management platform. Provide simple, accurate health tips and guidance. Keep responses concise and easy to understand. Always remind users to consult healthcare professionals for serious concerns. Focus on:
          - General wellness tips
          - Nutrition advice (especially diabetes-friendly)
          - Exercise recommendations
          - Sleep hygiene
          - Stress management
          - Preventive care
          - Blood sugar management tips
          
          Keep responses under 100 words and be encouraging and supportive. Remember you're part of a comprehensive health platform.`
        }
      ]
    },
    voice: {
      provider: 'playht',
      voiceId: 'jennifer'
    },
    transcriber: {
      provider: 'deepgram',
      model: 'nova-2',
      language: 'en-US'
    }
  }
};

interface VapiState {
  isSessionActive: boolean;
  isMuted: boolean;
  isLoading: boolean;
  error: string | null;
  transcript: string;
  response: string;
}

export function useVapi() {
  const [state, setState] = useState<VapiState>({
    isSessionActive: false,
    isMuted: false,
    isLoading: false,
    error: null,
    transcript: '',
    response: ''
  });

  const vapiRef = useRef<VapiInstance | null>(null);

  // Initialize Vapi
  useEffect(() => {
    let mounted = true;

    const initializeVapi = async () => {
      try {
        // Check if Vapi API key is available
        if (!VAPI_CONFIG.apiKey) {
          if (mounted) {
            setState(prev => ({ 
              ...prev, 
              error: 'Vapi API key not configured'
            }));
          }
          return;
        }

        // For now, we'll simulate Vapi functionality since the actual SDK might not be installed
        // In production, you would use: const { default: Vapi } = await import('@vapi-ai/web');
        
        // Mock Vapi instance for development
        const mockVapi: VapiInstance = {
          start: async () => {
            if (mounted) {
              setTimeout(() => {
                setState(prev => ({ 
                  ...prev, 
                  isSessionActive: true, 
                  isLoading: false,
                  error: null 
                }));
              }, 1000);
            }
          },
          stop: () => {
            if (mounted) {
              setState(prev => ({ 
                ...prev, 
                isSessionActive: false,
                isLoading: false 
              }));
            }
          },
          setMuted: (muted: boolean) => {
            if (mounted) {
              setState(prev => ({ ...prev, isMuted: muted }));
            }
          },
          send: () => {
            // Mock send functionality
            console.log('Mock send message');
          },
          on: () => {
            // Mock event listener
            console.log('Mock event listener registered');
          }
        };

        if (!mounted) return;

        vapiRef.current = mockVapi;

      } catch (error) {
        console.error('Vapi initialization error:', error);
        if (mounted) {
          setState(prev => ({ 
            ...prev, 
            error: 'Voice service unavailable in demo mode',
            isLoading: false
          }));
        }
      }
    };

    // Check if we're in browser environment
    if (typeof window !== 'undefined') {
      initializeVapi();
    }

    return () => {
      mounted = false;
    };
  }, []);

  const startSession = useCallback(async () => {
    if (!vapiRef.current) {
      setState(prev => ({ 
        ...prev, 
        error: 'Voice service not initialized' 
      }));
      return;
    }

    try {
      setState(prev => ({ ...prev, isLoading: true, error: null }));
      
      await vapiRef.current.start(VAPI_CONFIG.assistant);
      
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to start voice session';
      setState(prev => ({ 
        ...prev, 
        error: errorMessage,
        isLoading: false
      }));
    }
  }, []);

  const endSession = useCallback(() => {
    if (vapiRef.current && state.isSessionActive) {
      try {
        vapiRef.current.stop();
      } catch (error) {
        console.error('Error stopping session:', error);
      }
    }
  }, [state.isSessionActive]);

  const toggleMute = useCallback(() => {
    if (vapiRef.current && state.isSessionActive) {
      try {
        const newMutedState = !state.isMuted;
        vapiRef.current.setMuted(newMutedState);
        setState(prev => ({ ...prev, isMuted: newMutedState }));
      } catch (error) {
        console.error('Error toggling mute:', error);
      }
    }
  }, [state.isMuted, state.isSessionActive]);

  const sendMessage = useCallback((message: string) => {
    if (vapiRef.current && state.isSessionActive) {
      try {
        vapiRef.current.send({
          type: 'add-message',
          message: {
            role: 'user',
            content: message
          }
        });
      } catch (error) {
        console.error('Error sending message:', error);
      }
    }
  }, [state.isSessionActive]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (vapiRef.current && state.isSessionActive) {
        try {
          vapiRef.current.stop();
        } catch (error) {
          console.error('Cleanup error:', error);
        }
      }
    };
  }, [state.isSessionActive]);

  return {
    ...state,
    startSession,
    endSession,
    toggleMute,
    sendMessage,
    // Helper methods
    isReady: !!vapiRef.current && !state.error
  };
}

// Fallback hook for when Vapi is not available
export function useVapiFallback() {
  const [state] = useState<VapiState>({
    isSessionActive: false,
    isMuted: false,
    isLoading: false,
    error: 'Voice service not configured',
    transcript: '',
    response: ''
  });

  return {
    ...state,
    startSession: async () => {
      console.warn('Vapi not configured - using fallback');
    },
    endSession: () => {
      console.warn('Vapi not configured - using fallback');
    },
    toggleMute: () => {
      console.warn('Vapi not configured - using fallback');
    },
    sendMessage: () => {
      console.warn('Vapi not configured - using fallback');
    },
    isReady: false
  };
}
