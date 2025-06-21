/**
 * Vapi Configuration
 * 
 * To use the voice agent, you need to:
 * 1. Get your public API key from https://dashboard.vapi.ai
 * 2. Create a .env.local file in your project root
 * 3. Add: NEXT_PUBLIC_VAPI_API_KEY=your_actual_api_key_here
 * 4. Add: NEXT_PUBLIC_VAPI_ASSISTANT_ID=your_assistant_id_here
 */

export const VAPI_CONFIG = {
  // Fashion assistant ID from environment variables
  FASHION_ASSISTANT_ID: process.env.NEXT_PUBLIC_VAPI_ASSISTANT_ID || "a64ef464-f042-4243-911a-860cebd61506",
  
  // API key from environment variables
  API_KEY: process.env.NEXT_PUBLIC_VAPI_API_KEY,
  
  // Default configuration for the voice agent
  DEFAULT_CONFIG: {
    transcriber: {
      provider: "deepgram",
      model: "nova-2",
      language: "en-US"
    },
    voice: {
      provider: "11labs",
      voiceId: "21m00Tcm4TlvDq8ikWAM" // Default voice
    }
  }
};

// Validation function to check if API key is properly configured
export const isVapiConfigured = (): boolean => {
  return !!(VAPI_CONFIG.API_KEY && VAPI_CONFIG.API_KEY !== "your_vapi_api_key_here");
};

// Helper function to get API key with fallback
export const getVapiApiKey = (): string => {
  const apiKey = VAPI_CONFIG.API_KEY;
  
  if (!apiKey || apiKey === "your_vapi_api_key_here") {
    console.warn(`
🔑 VAPI API KEY REQUIRED
To use the fashion voice agent:
1. Visit https://dashboard.vapi.ai to get your API key
2. Create a .env.local file in your project root
3. Add: NEXT_PUBLIC_VAPI_API_KEY=your_actual_api_key

The voice agent will not work without a valid API key.
    `);
    return "demo_key_replace_with_real_key";
  }
  
  return apiKey;
}; 