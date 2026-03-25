import { GoogleGenAI, GenerateContentResponse, Modality } from "@google/genai";

const apiKey = process.env.GEMINI_API_KEY || "";
const ai = new GoogleGenAI({ apiKey });

export async function analyzeProduct(base64Image: string, mimeType: string) {
  const model = "gemini-3-flash-preview";
  const prompt = `
    Analyze this product image. 
    Suggest 3 distinct, high-end commercial photography concepts for an advertisement.
    For each concept, provide:
    1. A catchy Theme Name.
    2. A detailed Scene Description (background, props, environment).
    3. Lighting Style (e.g., soft morning light, dramatic shadows, neon glow).
    4. A concise prompt for an image generation AI to create this scene with the product.
    
    Return the response as a JSON array of objects with keys: theme, description, lighting, prompt.
  `;

  const response = await ai.models.generateContent({
    model,
    contents: [
      {
        parts: [
          { inlineData: { data: base64Image, mimeType } },
          { text: prompt }
        ]
      }
    ],
    config: {
      responseMimeType: "application/json"
    }
  });

  return JSON.parse(response.text || "[]");
}

export async function generateAdVariants(
  base64ProductImage: string, 
  productMimeType: string, 
  scenePrompt: string,
  aspectRatio: "1:1" | "3:4" | "4:3" | "9:16" | "16:9" = "1:1",
  styleReference?: { base64: string; mimeType: string }
) {
  const angles = [
    "Front eye-level view",
    "Dynamic 45-degree side angle",
    "Dramatic low-angle hero shot",
    "Artistic top-down flat lay view"
  ];

  const promises = angles.map(async (angle) => {
    const model = "gemini-2.5-flash-image";
    let fullPrompt = `Create an ultra-realistic, professional product advertisement. 
    The product in the first provided image should be the central focus. 
    Scene: ${scenePrompt}. 
    Camera Angle: ${angle}.
    Ensure high-end commercial photography quality, perfect lighting, and sharp details. 
    The product should look naturally integrated into the environment.`;

    if (styleReference) {
      fullPrompt += ` Use the second provided image as a style reference for lighting, color palette, and overall aesthetic.`;
    }

    const contents: any = {
      parts: [
        { inlineData: { data: base64ProductImage, mimeType: productMimeType } }
      ]
    };

    if (styleReference) {
      contents.parts.push({ inlineData: { data: styleReference.base64, mimeType: styleReference.mimeType } });
    }

    contents.parts.push({ text: fullPrompt });

    const response = await ai.models.generateContent({
      model,
      contents,
      config: {
        imageConfig: {
          aspectRatio
        }
      }
    });

    for (const part of response.candidates?.[0]?.content?.parts || []) {
      if (part.inlineData) {
        return `data:${part.inlineData.mimeType};base64,${part.inlineData.data}`;
      }
    }
    return null;
  });

  const results = await Promise.all(promises);
  return results.filter((img): img is string => img !== null);
}
