'use client';

import React, { useState, useEffect } from 'react';
import Vapi from '@vapi-ai/web';
import { VAPI_CONFIG } from '../lib/vapi-config';

interface VapiVoiceWidgetProps {
  apiKey?: string;
  assistantId?: string;
  isEnabled: boolean; // Controls whether voice agent is active
  onTranscriptUpdate?: (transcript: Array<{role: string, text: string}>) => void;
  onConnectionChange?: (isConnected: boolean) => void;
  onSpeakingChange?: (isSpeaking: boolean) => void;
}

const VapiVoiceWidget: React.FC<VapiVoiceWidgetProps> = ({ 
  apiKey, 
  assistantId = VAPI_CONFIG.FASHION_ASSISTANT_ID,
  isEnabled,
  onTranscriptUpdate,
  onConnectionChange,
  onSpeakingChange
}) => {
  const [vapi, setVapi] = useState<Vapi | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [transcript, setTranscript] = useState<Array<{role: string, text: string}>>([]);

  // Use the provided API key or get from environment/config
  const effectiveApiKey = apiKey || VAPI_CONFIG.API_KEY || "demo_key_replace_with_real_key";

  useEffect(() => {
    const vapiInstance = new Vapi(effectiveApiKey);
    setVapi(vapiInstance);

    // Event listeners
    vapiInstance.on('call-start', () => {
      console.log('Fashion voice agent call started');
      setIsConnected(true);
      onConnectionChange?.(true);
    });

    vapiInstance.on('call-end', () => {
      console.log('Fashion voice agent call ended');
      setIsConnected(false);
      setIsSpeaking(false);
      onConnectionChange?.(false);
      onSpeakingChange?.(false);
    });

    vapiInstance.on('speech-start', () => {
      console.log('Fashion assistant started speaking');
      setIsSpeaking(true);
      onSpeakingChange?.(true);
    });

    vapiInstance.on('speech-end', () => {
      console.log('Fashion assistant stopped speaking');
      setIsSpeaking(false);
      onSpeakingChange?.(false);
    });

    vapiInstance.on('message', (message) => {
      if (message.type === 'transcript') {
        setTranscript(prev => {
          const updated = [...prev, {
            role: message.role,
            text: message.transcript
          }];
          onTranscriptUpdate?.(updated);
          return updated;
        });
      }
    });

    vapiInstance.on('error', (error) => {
      console.error('Vapi error:', error);
      setIsConnected(false);
      setIsSpeaking(false);
      onConnectionChange?.(false);
      onSpeakingChange?.(false);
    });

    return () => {
      vapiInstance?.stop();
    };
  }, [effectiveApiKey, onTranscriptUpdate, onConnectionChange, onSpeakingChange]);

  // Handle enabling/disabling the voice agent based on mic state
  useEffect(() => {
    if (!vapi) return;

    if (isEnabled && !isConnected) {
      // Start voice agent when mic is enabled
      console.log('Starting voice agent...');
      vapi.start(assistantId);
    } else if (!isEnabled && isConnected) {
      // Stop voice agent when mic is disabled
      console.log('Stopping voice agent...');
      vapi.stop();
    }
  }, [isEnabled, isConnected, vapi, assistantId]);

  // This component doesn't render any UI - it just handles voice logic
  return null;
};

export default VapiVoiceWidget; 