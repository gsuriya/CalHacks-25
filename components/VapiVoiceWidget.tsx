'use client';

import React, { useState, useEffect, useCallback, useRef } from 'react';
import Vapi from '@vapi-ai/web';
import { VAPI_CONFIG } from '../lib/vapi-config';
import { parseVoiceToFilters, FilterResponse } from '../lib/gemini-api';

interface VapiVoiceWidgetProps {
  apiKey?: string;
  assistantId?: string;
  isEnabled: boolean; // Controls whether voice agent is active
  onTranscriptUpdate?: (transcript: Array<{role: string, text: string}>) => void;
  onConnectionChange?: (isConnected: boolean) => void;
  onSpeakingChange?: (isSpeaking: boolean) => void;
  onFiltersExtracted?: (filters: FilterResponse) => void; // New prop for filter callback
}

const VapiVoiceWidget: React.FC<VapiVoiceWidgetProps> = ({ 
  apiKey, 
  assistantId = VAPI_CONFIG.FASHION_ASSISTANT_ID,
  isEnabled,
  onTranscriptUpdate,
  onConnectionChange,
  onSpeakingChange,
  onFiltersExtracted
}) => {
  const [vapi, setVapi] = useState<Vapi | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [transcript, setTranscript] = useState<Array<{role: string, text: string}>>([]);
  
  // Filter detection state
  const [filterModeActive, setFilterModeActive] = useState(false);
  const [filterTranscript, setFilterTranscript] = useState('');
  const [lastTranscriptLength, setLastTranscriptLength] = useState(0);
  
  // Use refs to avoid stale closures in event handlers
  const isConnectedRef = useRef(isConnected);
  const isSpeakingRef = useRef(isSpeaking);
  
  // Update refs when state changes
  useEffect(() => {
    isConnectedRef.current = isConnected;
  }, [isConnected]);
  
  useEffect(() => {
    isSpeakingRef.current = isSpeaking;
  }, [isSpeaking]);

  // Use the provided API key or get from environment/config
  const effectiveApiKey = apiKey || VAPI_CONFIG.API_KEY || "demo_key_replace_with_real_key";

  // Memoize callbacks to prevent unnecessary re-renders
  const handleConnectionChange = useCallback((connected: boolean) => {
    if (onConnectionChange) {
      // Use setTimeout to avoid calling setState during render
      setTimeout(() => onConnectionChange(connected), 0);
    }
  }, [onConnectionChange]);

  const handleSpeakingChange = useCallback((speaking: boolean) => {
    if (onSpeakingChange) {
      // Use setTimeout to avoid calling setState during render
      setTimeout(() => onSpeakingChange(speaking), 0);
    }
  }, [onSpeakingChange]);

  const handleTranscriptUpdate = useCallback((newTranscript: Array<{role: string, text: string}>) => {
    if (onTranscriptUpdate) {
      // Use setTimeout to avoid calling setState during render
      setTimeout(() => onTranscriptUpdate(newTranscript), 0);
    }
  }, [onTranscriptUpdate]);

  // Filter extraction handler
  const handleFilterExtraction = useCallback(async () => {
    if (!filterTranscript.trim() || !onFiltersExtracted) return;
    
    try {
      console.log('Extracting filters from transcript:', filterTranscript);
      const filters = await parseVoiceToFilters(filterTranscript);
      console.log('Extracted filters:', filters);
      
      if (Object.keys(filters).length > 0) {
        onFiltersExtracted(filters);
      }
      
      // Reset filter state
      setFilterModeActive(false);
      setFilterTranscript('');
    } catch (error) {
      console.error('Filter extraction failed:', error);
      setFilterModeActive(false);
      setFilterTranscript('');
    }
  }, [filterTranscript, onFiltersExtracted]);

  // Monitor transcript for "filter" or "recommend" keywords and accumulate subsequent text
  useEffect(() => {
    if (transcript.length === 0) return;
    
    // Check if we have new transcript messages
    if (transcript.length > lastTranscriptLength) {
      const newMessages = transcript.slice(lastTranscriptLength);
      setLastTranscriptLength(transcript.length);
      
      // Look for "filter" or "recommend" keywords in new user messages
      for (const message of newMessages) {
        if (message.role === 'user') {
          const text = message.text.toLowerCase();
          
          // Check for either "filter" or "recommend" trigger words
          let triggerWord = '';
          let triggerIndex = -1;
          
          if (text.includes('filter')) {
            triggerWord = 'filter';
            triggerIndex = text.indexOf('filter');
          } else if (text.includes('recommend')) {
            triggerWord = 'recommend';
            triggerIndex = text.indexOf('recommend');
          }
          
          if (triggerWord && triggerIndex !== -1) {
            console.log(`${triggerWord} keyword detected, activating filter mode`);
            setFilterModeActive(true);
            setFilterTranscript('');
            
            // Start accumulating from the word after the trigger word
            const afterTrigger = message.text.substring(triggerIndex + triggerWord.length).trim();
            if (afterTrigger) {
              setFilterTranscript(afterTrigger);
            }
          } else if (filterModeActive) {
            // Accumulate transcript when in filter mode
            setFilterTranscript(prev => prev + ' ' + message.text);
            console.log('Accumulating filter transcript:', filterTranscript + ' ' + message.text);
          }
        }
      }
    }
  }, [transcript, lastTranscriptLength, filterModeActive, filterTranscript]);

  // Handle filter extraction when microphone stops
  useEffect(() => {
    if (!isEnabled && filterModeActive && filterTranscript.trim()) {
      console.log('Microphone stopped, processing filter transcript');
      handleFilterExtraction();
    }
  }, [isEnabled, filterModeActive, filterTranscript, handleFilterExtraction]);

  useEffect(() => {
    const vapiInstance = new Vapi(effectiveApiKey);
    setVapi(vapiInstance);

    // Event listeners
    vapiInstance.on('call-start', () => {
      console.log('Fashion voice agent call started');
      setIsConnected(true);
      handleConnectionChange(true);
    });

    vapiInstance.on('call-end', () => {
      console.log('Fashion voice agent call ended');
      setIsConnected(false);
      setIsSpeaking(false);
      handleConnectionChange(false);
      handleSpeakingChange(false);
    });

    vapiInstance.on('speech-start', () => {
      console.log('Fashion assistant started speaking');
      setIsSpeaking(true);
      handleSpeakingChange(true);
    });

    vapiInstance.on('speech-end', () => {
      console.log('Fashion assistant stopped speaking');
      setIsSpeaking(false);
      handleSpeakingChange(false);
    });

    vapiInstance.on('message', (message) => {
      if (message.type === 'transcript') {
        setTranscript(prev => {
          const updated = [...prev, {
            role: message.role,
            text: message.transcript
          }];
          handleTranscriptUpdate(updated);
          return updated;
        });
      }
    });

    vapiInstance.on('error', (error) => {
      console.error('Vapi error:', error);
      setIsConnected(false);
      setIsSpeaking(false);
      handleConnectionChange(false);
      handleSpeakingChange(false);
    });

    return () => {
      vapiInstance?.stop();
    };
  }, [effectiveApiKey, handleTranscriptUpdate, handleConnectionChange, handleSpeakingChange]);

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