class GeminiService {
  constructor() {
    // Default model
    this.modelName = "gemini-2.0-flash";
    this.API_URL = this.getApiUrl();
  }

  getApiUrl() {
    return `https://generativelanguage.googleapis.com/v1beta/models/${this.modelName}:generateContent`;
  }

  async getApiKey() {
    const { apiKey } = await chrome.storage.local.get(["apiKey"]);
    if (!apiKey) {
      chrome.runtime.openOptionsPage();
      throw new Error("Please set your API key in the settings");
    }
    return apiKey;
  }

  async getModel() {
    const { model } = await chrome.storage.local.get(["model"]);
    return model || "gemini-2.0-flash"; // Default model
  }

  async setModel(modelName) {
    this.modelName = modelName;
    this.API_URL = this.getApiUrl();
    await chrome.storage.local.set({ model: modelName });
  }

  async getWordDetails(word, targetLanguage) {
    try {
      const API_KEY = await this.getApiKey();
      // Update model before making request
      this.modelName = await this.getModel();
      this.API_URL = this.getApiUrl();

      const prompt = `Analyze the word "${word}" and provide the following information in a structured JSON format:
      1. translation: Translate the word to ${targetLanguage}
      2. example: Create a practical example sentence using this word in its original language
      3. synonyms: List EXACTLY two common synonyms for the word in its original language
      4. article: If the word is a German noun, provide its definite article (der, die, or das); otherwise return an empty string
      
      Return response in this exact JSON format without any additional text:
      {
        "translation": "translation of the word",
        "example": "example sentence using the word",
        "synonyms": ["synonym1", "synonym2"],
        "article": "der/die/das or empty string"
      }`;

      const response = await fetch(`${this.API_URL}?key=${API_KEY}`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          contents: [
            {
              parts: [
                {
                  text: prompt,
                },
              ],
            },
          ],
          generationConfig: {
            temperature: 0.2,
            topK: 10,
            topP: 0.8,
            maxOutputTokens: 500,
          },
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error?.message || "API request failed");
      }

      if (data.candidates && data.candidates[0].content.parts[0].text) {
        // Extract JSON from response
        const responseText = data.candidates[0].content.parts[0].text.trim();
        // Find JSON in the response (in case there's any extra text)
        const jsonMatch = responseText.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
          const result = JSON.parse(jsonMatch[0]);
          return {
            translation: result.translation || "",
            example: result.example || "",
            synonyms: Array.isArray(result.synonyms) ? result.synonyms : [],
            article: result.article || "",
          };
        }
      }

      throw new Error("Word details extraction failed");
    } catch (error) {
      console.error("Word details error:", error);
      throw error;
    }
  }
}

export const geminiService = new GeminiService();
