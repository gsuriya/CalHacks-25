# 🎤 Fashion Voice Agent Setup

This project includes a sophisticated voice agent powered by Vapi that can interact with users about fashion topics. The voice agent is already configured with fashion-specific prompts and can provide styling advice, trend information, and outfit recommendations.

## 🚀 Quick Setup

### 1. Get Your Vapi API Key

1. Visit [Vapi Dashboard](https://dashboard.vapi.ai)
2. Sign up or log in to your account
3. Navigate to your API keys section
4. Copy your **Public API Key** (starts with `pk_`)

### 2. Configure Environment Variables

Create a `.env.local` file in your project root:

```bash
# Vapi Configuration
NEXT_PUBLIC_VAPI_API_KEY=pk_your_actual_vapi_public_key_here
```

### 3. Start the Application

```bash
pnpm dev
```

## 🎯 Features

### Voice Interactions

- **Natural Conversations**: Chat naturally about fashion topics
- **Real-time Transcription**: See your conversation in real-time
- **Fashion Expertise**: Ask about:
  - Current fashion trends
  - Styling advice
  - Outfit recommendations
  - Color coordination
  - Seasonal fashion tips
  - Fashion brand recommendations

### UI Features

- **Floating Widget**: Fixed position voice widget in bottom-right corner
- **Visual Feedback**:
  - Pulsing indicator when assistant is speaking
  - Loading states during connection
  - Real-time conversation transcript
- **Easy Controls**: Simple start/end call buttons
- **Modern Design**: Beautiful gradient UI with glassmorphism effects

## 🎨 Usage Examples

Try asking the fashion assistant:

- _"What are the latest fashion trends for this season?"_
- _"Can you help me style a casual outfit for a weekend brunch?"_
- _"What colors go well with navy blue?"_
- _"I have a job interview tomorrow, what should I wear?"_
- _"Tell me about sustainable fashion brands"_
- _"How can I accessorize a little black dress?"_

## 🔧 Technical Details

### Assistant Configuration

- **Assistant ID**: `a64ef464-f042-4243-911a-860cebd61506`
- **Specialized**: Pre-configured with fashion industry knowledge
- **Voice Provider**: 11Labs for natural speech
- **Speech Recognition**: Deepgram for accurate transcription

### Component Structure

```
components/
├── VapiVoiceWidget.tsx    # Main voice widget component
lib/
├── vapi-config.ts         # Configuration and helpers
```

### Key Features

- **Error Handling**: Graceful fallbacks for API issues
- **Loading States**: Visual feedback during connections
- **Responsive Design**: Works on desktop and mobile
- **TypeScript**: Full type safety
- **Real-time Events**: Live conversation updates

## 🛠 Troubleshooting

### Common Issues

**Voice Agent Not Working**

1. Check your API key is correctly set in `.env.local`
2. Ensure the key starts with `pk_` (public key)
3. Restart your development server after adding the key
4. Check browser console for error messages

**No Audio/Microphone Issues**

1. Grant microphone permissions when prompted
2. Check browser microphone settings
3. Ensure speakers/headphones are working
4. Try refreshing the page

**Connection Problems**

1. Check your internet connection
2. Verify Vapi service status
3. Try clearing browser cache
4. Check firewall/proxy settings

### Debug Mode

Open browser developer tools to see detailed logs:

- Connection status
- Real-time events
- Error messages
- API responses

## 🎮 Integration

The voice widget automatically integrates with your existing camera and microphone setup. It operates independently and won't interfere with other media functionality.

## 📱 Browser Support

- ✅ Chrome (recommended)
- ✅ Firefox
- ✅ Safari
- ✅ Edge
- 📱 Mobile browsers (with microphone access)

## 🔐 Security

- Uses public API keys only (safe for client-side)
- No sensitive data stored locally
- All voice processing handled by Vapi's secure servers
- HTTPS required for microphone access

---

Need help? Check the [Vapi Documentation](https://docs.vapi.ai) or reach out to support!
