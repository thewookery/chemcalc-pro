"use client";

import React, { useState, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Mic, MicOff, Loader2, Volume2 } from 'lucide-react';
import { parseVoiceCommand } from '@/ai/flows/voice-command-flow';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';

interface VoiceAssistantProps {
  fields: { id: string; label: string; onUpdate: (val: string) => void }[];
  resultToRead?: string;
}

const VoiceAssistant: React.FC<VoiceAssistantProps> = ({ fields, resultToRead }) => {
  const { toast } = useToast();
  const [isListening, setIsListening] = useState(false);
  const [isProcessing, setIsListeningProcessing] = useState(false);
  const [isSupported, setIsSupported] = useState(false);
  const recognitionRef = useRef<any>(null);

  useEffect(() => {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (SpeechRecognition) {
      setIsSupported(true);
      recognitionRef.current = new SpeechRecognition();
      recognitionRef.current.continuous = false;
      recognitionRef.current.interimResults = false;
      recognitionRef.current.lang = 'en-US';

      recognitionRef.current.onresult = async (event: any) => {
        const transcript = event.results[0][0].transcript;
        setIsListening(false);
        setIsListeningProcessing(true);

        try {
          const result = await parseVoiceCommand({
            transcript,
            fields: fields.map(f => ({ id: f.id, label: f.label })),
          });

          if (result.action === 'update_field' && result.fieldId && result.value) {
            const field = fields.find(f => f.id === result.fieldId);
            if (field) {
              field.onUpdate(result.value);
              speak(`Set ${field.label} to ${result.value}`);
            }
          } else if (result.action === 'read_result' && resultToRead) {
            speak(resultToRead);
          } else if (result.action === 'unknown') {
            toast({ title: "Command not recognized", description: `You said: "${transcript}"` });
          }
        } catch (error) {
          toast({ variant: "destructive", title: "Voice error", description: "Could not process command." });
        } finally {
          setIsListeningProcessing(false);
        }
      };

      recognitionRef.current.onerror = (event: any) => {
        setIsListening(false);
        if (event.error !== 'no-speech') {
          toast({ variant: "destructive", title: "Microphone error", description: event.error });
        }
      };

      recognitionRef.current.onend = () => {
        setIsListening(false);
      };
    }
  }, [fields, resultToRead, toast]);

  const toggleListening = () => {
    if (isListening) {
      recognitionRef.current?.stop();
    } else {
      recognitionRef.current?.start();
      setIsListening(true);
    }
  };

  const speak = (text: string) => {
    if ('speechSynthesis' in window) {
      const utterance = new SpeechSynthesisUtterance(text);
      window.speechSynthesis.speak(utterance);
    }
  };

  if (!isSupported) {
    return null; 
  }

  return (
    <div className="flex items-center gap-2">
      <Button
        variant={isListening ? "destructive" : "outline"}
        size="icon"
        onClick={toggleListening}
        disabled={isProcessing}
        className={cn(
          "relative rounded-full h-10 w-10 transition-all duration-300",
          isListening && "animate-pulse shadow-[0_0_15px_rgba(239,68,68,0.5)]"
        )}
        title="Voice Control"
      >
        {isProcessing ? (
          <Loader2 className="h-5 w-5 animate-spin" />
        ) : isListening ? (
          <MicOff className="h-5 w-5" />
        ) : (
          <Mic className="h-5 w-5" />
        )}
      </Button>
      {isListening && (
        <span className="text-xs font-medium text-destructive animate-pulse">Listening...</span>
      )}
      {resultToRead && (
        <Button
          variant="ghost"
          size="icon"
          onClick={() => speak(resultToRead)}
          title="Read result"
          className="rounded-full"
        >
          <Volume2 className="h-4 w-4" />
        </Button>
      )}
    </div>
  );
};

export default VoiceAssistant;