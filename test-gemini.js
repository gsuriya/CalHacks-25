const { GoogleGenerativeAI } = require("@google/generative-ai");

// Check if API key is available
const apiKey = process.env.NEXT_PUBLIC_GEMINI_API_KEY;
if (!apiKey) {
  console.error("❌ NEXT_PUBLIC_GEMINI_API_KEY not found in environment variables");
  console.log("Available env vars:", Object.keys(process.env).filter(k => k.includes('GEMINI')));
  process.exit(1);
}

console.log("✅ API Key found:", apiKey.substring(0, 10) + "...");
const genAI = new GoogleGenerativeAI(apiKey);

async function testGeminiFilter(userRequest) {
  console.log(`\n🧪 Testing: "${userRequest}"`);
  console.log("=".repeat(50));

  const prompt = `
You are "FilterBuilder", a function-style assistant that MUST follow these rules:
1. Return ONLY a JSON object with these exact keys:
{
  "color": null | "Any Color" | "Beige" | "Black" | "Blue" | "Brown" | "Burgundy" | "Cream" | "Gray" | "Green" | "Navy" | "Purple" | "Red" | "White" | "Yellow",
  "type": null | "t-shirt" | "sweater" | "scarf" | "long sleeve" | "pants",
  "priceMin": null | number,
  "priceMax": null | number,
  "store": null | "Uniqlo" | "Zara" | "H&M" | "Gap" | "Patagonia",
  "inStockMin": null | number,
  "material": null | "Acrylic Blend" | "Bamboo" | "Cashmere" | "Cotton" | "Cotton Blend" | "Cotton Knit" | "Merino Wool" | "Modal" | "Organic Cotton" | "Silk" | "Wool",
  "occasion": null | "Casual" | "Work" | "Party" | "Weekend",
  "season": null | "Spring" | "Summer"
}

2. CRITICAL RULES:
• When ANY clothing type is mentioned (pants, shirt, etc), you MUST set both:
  - "type" field to the matching type
  - "color" field if a color is mentioned
• ALWAYS map clothing types to their exact values:
  - "pants", "trousers", "jeans", "slacks", "bottoms" → set type: "pants"
  - "shirt", "tee", "tshirt" → set type: "t-shirt"
  - "jumper", "pullover" → set type: "sweater"
  - "wrap", "shawl" → set type: "scarf"
  - "longsleeve", "long sleeve shirt" → set type: "long sleeve"

3. EXAMPLES (you must follow this exact format):
"Show me red pants" → {"color": "Red", "type": "pants", "priceMin": null, "priceMax": null, "store": null, "inStockMin": null, "material": null, "occasion": null, "season": null}
"I want blue jeans" → {"color": "Blue", "type": "pants", "priceMin": null, "priceMax": null, "store": null, "inStockMin": null, "material": null, "occasion": null, "season": null}
"Find me trousers" → {"color": null, "type": "pants", "priceMin": null, "priceMax": null, "store": null, "inStockMin": null, "material": null, "occasion": null, "season": null}

USER REQUEST: ${userRequest}
`.trim();

  try {
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
    const result = await model.generateContent(prompt);
    const response = await result.response;
    const raw = response.text().trim();

    console.log("📝 Raw response:");
    console.log(`"${raw}"`);
    console.log("\n🔍 Response analysis:");
    console.log("Length:", raw.length);
    console.log("First 100 chars:", raw.substring(0, 100));

    // Strip markdown formatting if present
    let jsonString = raw;
    if (raw.startsWith('```json') && raw.endsWith('```')) {
      jsonString = raw.slice(7, -3).trim();
      console.log("\n🔧 Stripped markdown formatting");
      console.log("Clean JSON:", jsonString);
    } else if (raw.startsWith('```') && raw.endsWith('```')) {
      jsonString = raw.slice(3, -3).trim();
      console.log("\n🔧 Stripped markdown formatting");
      console.log("Clean JSON:", jsonString);
    }

    try {
      const parsed = JSON.parse(jsonString);
      console.log("\n✅ JSON parsing successful!");
      console.log("📊 Parsed object:");
      console.log(JSON.stringify(parsed, null, 2));
      
      console.log("\n🎯 Key values:");
      console.log("color:", parsed.color);
      console.log("type:", parsed.type);
      console.log("store:", parsed.store);
      
      console.log("\n🔍 Set fields:");
      Object.entries(parsed)
        .filter(([_, v]) => v !== null)
        .forEach(([k, v]) => console.log(`  ${k}: ${v}`));

      // Check if type is set when it should be
      const hasClothingType = userRequest.toLowerCase().includes('pants') || 
                             userRequest.toLowerCase().includes('jeans') || 
                             userRequest.toLowerCase().includes('trousers');
      
      if (hasClothingType && !parsed.type) {
        console.log("\n❌ ERROR: Clothing type mentioned but type field not set!");
      } else if (hasClothingType && parsed.type) {
        console.log("\n✅ SUCCESS: Type field correctly set for clothing request");
      }

    } catch (parseError) {
      console.log("\n❌ JSON parsing failed:");
      console.log(parseError.message);
    }

  } catch (error) {
    console.log("\n❌ API call failed:");
    console.log(error.message);
  }
}

// Just test one case first
testGeminiFilter("black pants").catch(console.error);