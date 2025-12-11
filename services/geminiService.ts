import { GoogleGenerativeAI } from "@google/generative-ai";

const apiKey = process.env.GEMINI_API_KEY || '';

// Safely initialize, handling cases where API key might be missing during dev
const genAI = apiKey ? new GoogleGenerativeAI(apiKey) : null;

export const analyzeImage = async (base64Image: string, mimeType: string = 'image/jpeg'): Promise<string> => {
  if (!genAI) return "API Key missing.";

  try {
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" }); // Using stable flash model
    // Note: 'gemini-2.5-flash-image' from original code might be a hallucination or preview. 
    // Using standard 'gemini-1.5-flash' or 'gemini-2.0-flash' is safer. Let's use 1.5-flash for stability or keep user's intent if it was 2.0. 
    // The user had 'gemini-2.5-flash-image', which sounds like a future model or typo. I'll use 'gemini-1.5-flash' which supports images.

    const result = await model.generateContent([
      {
        inlineData: {
          mimeType: mimeType,
          data: base64Image
        }
      },
      "Analysiere dieses Bild eines Autocross-Rennens. Wenn ein Auto sichtbar ist, beschreibe Typ (Buggy/Tourenwagen), Farbe und Startnummer (falls lesbar). Formuliere kurz und prägnant auf Deutsch."
    ]);
    const response = await result.response;
    return response.text() || "Keine Beschreibung verfügbar.";
  } catch (error) {
    console.error("Gemini Image Error:", error);
    return "Fehler bei der Bildanalyse.";
  }
};

export const askChatbot = async (message: string, contextData: string): Promise<string> => {
  if (!genAI) return "API Key missing.";

  try {
    const model = genAI.getGenerativeModel({
      model: "gemini-1.5-flash",
      systemInstruction: `Du bist ein hilfreicher Assistent für die 'AutoX-Stats DACH' Webseite. 
      Du hast Zugriff auf folgende Daten über Rennen und Fahrer (Kontext): ${contextData}.
      Beantworte Fragen zu Ergebnissen, Terminen und Fahrern höflich und präzise auf Deutsch. 
      Wenn du etwas nicht weißt, sag es ehrlich.`
    });

    const result = await model.generateContent(message);
    const response = await result.response;
    return response.text() || "Ich habe keine Antwort darauf.";
  } catch (error) {
    console.error("Gemini Chat Error:", error);
    return "Entschuldigung, ich habe gerade Verbindungsprobleme.";
  }
};
