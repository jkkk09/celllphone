
import { GoogleGenAI, GenerateContentResponse } from "@google/genai";

const getAI = () => {
  return new GoogleGenAI({ apiKey: process.env.API_KEY as string });
};

export const createChatSession = (systemInstruction: string, modelName: string = 'gemini-3-flash-preview') => {
  const ai = getAI();
  return ai.chats.create({
    model: modelName,
    config: {
      systemInstruction,
    },
  });
};

export async function* sendMessageStreaming(chat: any, message: string, imageBase64?: string, modelName: string = 'gemini-3-flash-preview') {
  if (imageBase64) {
    const ai = getAI();
    // Remove data:image/...;base64, prefix if present
    const base64Data = imageBase64.split(',')[1] || imageBase64;
    const mimeType = imageBase64.split(';')[0].split(':')[1] || 'image/jpeg';

    const response = await ai.models.generateContentStream({
      model: modelName,
      contents: {
        parts: [
          { inlineData: { data: base64Data, mimeType } },
          { text: message }
        ]
      }
    });

    for await (const chunk of response) {
      const c = chunk as GenerateContentResponse;
      yield c.text;
    }
  } else {
    const response = await chat.sendMessageStream({ message });
    for await (const chunk of response) {
      const c = chunk as GenerateContentResponse;
      yield c.text;
    }
  }
}

export const generateWorldImage = async (prompt: string) => {
  const ai = getAI();
  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash-image',
      contents: {
        parts: [{ text: `A beautiful digital art illustration of: ${prompt}. High quality, detailed.` }],
      },
    });

    for (const part of response.candidates?.[0]?.content.parts || []) {
      if (part.inlineData) {
        return `data:image/png;base64,${part.inlineData.data}`;
      }
    }
  } catch (error) {
    console.error("Image gen failed", error);
    return `https://picsum.photos/seed/${Math.random()}/400/300`;
  }
};
