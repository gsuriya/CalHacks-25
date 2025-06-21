'use client';

import React from 'react';

interface TranscriptBoxProps {
  transcript: Array<{role: string, text: string}>;
  isConnected: boolean;
  isSpeaking: boolean;
}

const TranscriptBox: React.FC<TranscriptBoxProps> = ({ 
  transcript, 
  isConnected, 
  isSpeaking 
}) => {
  if (!isConnected && transcript.length === 0) {
    return null; // Don't show anything if not connected and no transcript
  }

  return (
    <div className="fixed top-6 left-6 z-40 w-80 max-w-sm">
      <div className="glass-card rounded-2xl p-4 backdrop-blur-md">
        {/* Header */}
        <div className="flex items-center gap-3 mb-3 pb-2 border-b border-white/20">
          <div className={`w-3 h-3 rounded-full transition-all duration-300 ${
            isSpeaking 
              ? 'bg-red-500 animate-pulse shadow-lg shadow-red-500/50' 
              : isConnected 
                ? 'bg-green-500 shadow-lg shadow-green-500/50' 
                : 'bg-gray-400'
          }`}></div>
          <div>
            <div className="text-white font-semibold text-sm">
              Fashion Assistant
            </div>
            <div className="text-white/70 text-xs">
              {isSpeaking ? 'Speaking...' : isConnected ? 'Listening...' : 'Disconnected'}
            </div>
          </div>
        </div>

        {/* Transcript */}
        <div className="max-h-48 overflow-y-auto space-y-2 custom-scrollbar">
          {transcript.length === 0 ? (
            <div className="text-center text-white/60 text-sm py-4">
              <div className="text-lg mb-1">👗</div>
              <div>Start talking about fashion!</div>
            </div>
          ) : (
            transcript.slice(-8).map((msg, i) => ( // Show only last 8 messages
              <div
                key={i}
                className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                <div className={`max-w-[85%] px-3 py-2 rounded-lg text-xs leading-relaxed ${
                  msg.role === 'user'
                    ? 'bg-gradient-to-r from-purple-500 to-pink-500 text-white'
                    : 'bg-white/90 text-gray-800 border border-white/20'
                } ${msg.role === 'user' ? 'rounded-br-sm' : 'rounded-bl-sm'}`}>
                  {msg.text}
                </div>
              </div>
            ))
          )}
        </div>

        {/* Footer */}
        <div className="text-white/50 text-[10px] text-center mt-2 pt-2 border-t border-white/20">
          🎤 Voice AI • Fashion Expert
        </div>
      </div>

      <style jsx>{`
        .custom-scrollbar::-webkit-scrollbar {
          width: 4px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: rgba(255, 255, 255, 0.1);
          border-radius: 2px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: rgba(255, 255, 255, 0.3);
          border-radius: 2px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: rgba(255, 255, 255, 0.5);
        }
      `}</style>
    </div>
  );
};

export default TranscriptBox; 