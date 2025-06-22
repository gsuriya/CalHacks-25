import { handleFilterRequest } from './handleFilterRequest'

export async function onTranscription(transcript: string, turns: string[]) {
  console.log('Processing transcript:', transcript)
  
  // Handle filter requests
  const filters = await handleFilterRequest([...turns, transcript])
  if (filters) {
    console.log('Filters extracted:', filters)
    return {
      response: `Setting filters: ${Object.entries(filters)
        .filter(([_, v]) => v !== null)
        .map(([k, v]) => `${k}: ${v}`)
        .join(', ')}`,
      shouldContinue: true
    }
  }

  return {
    response: "I'm not sure what you want to do. Try asking for specific clothing items like 'Show me red pants' or 'Find blue t-shirts'.",
    shouldContinue: true
  }
} 