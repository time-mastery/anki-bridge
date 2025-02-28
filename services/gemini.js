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

  async translate(text, targetLanguage) {
    try {
      const API_KEY = await this.getApiKey();
      // Update model before making request
      this.modelName = await this.getModel();
      this.API_URL = this.getApiUrl();

      const prompt = `Translate the following text accurately to ${targetLanguage}. 
      Provide ONLY the direct translation without ANY explanations, notes, or additional text. 
      Maintain the original formatting, including paragraphs, bullet points, and line breaks.
      Preserve the tone, formality level, and style of the original text.
      If there are any culturally specific terms that don't have direct equivalents, choose the most appropriate translation that preserves the original meaning.
      Do not add or remove any information from the original text.
      Here is the text to translate:
      
      "${text}"`;

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
            topK: 1,
            topP: 0.8,
            maxOutputTokens: 200,
          },
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error?.message || "API request failed");
      }

      if (data.candidates && data.candidates[0].content.parts[0].text) {
        return data.candidates[0].content.parts[0].text.trim();
      }

      throw new Error("Translation failed");
    } catch (error) {
      console.error("Translation error:", error);
      throw error;
    }
  }

  async generateExample(text) {
    try {
      const API_KEY = await this.getApiKey();
      const prompt = `Create a practical, contextually rich example sentence using the German word "${text}". The sentence must demonstrate proper usage in a realistic scenario. Return ONLY the example sentence in German without any explanation or translation.`;

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
            temperature: 0.7,
            topK: 40,
            topP: 0.95,
            maxOutputTokens: 100,
          },
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error?.message || "API request failed");
      }

      if (data.candidates && data.candidates[0].content.parts[0].text) {
        return data.candidates[0].content.parts[0].text.trim();
      }

      throw new Error("Example generation failed");
    } catch (error) {
      console.error("Example generation error:", error);
      throw error;
    }
  }

  async getSynonyms(word) {
    try {
      const API_KEY = await this.getApiKey();
      const prompt = `Provide EXACTLY 2 most essential and commonly used German synonyms for "${word}". These must be the most frequently used alternatives in everyday German speech. Return ONLY these 2 synonyms separated by a comma, without any additional text or explanation.`;

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
            topP: 0.7,
            maxOutputTokens: 50,
          },
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error?.message || "API request failed");
      }

      if (data.candidates && data.candidates[0].content.parts[0].text) {
        return data.candidates[0].content.parts[0].text
          .trim()
          .split(",")
          .map((s) => s.trim());
      }

      throw new Error("Synonyms generation failed");
    } catch (error) {
      console.error("Synonyms error:", error);
      throw error;
    }
  }

  async checkIsNoun(word) {
    try {
      const API_KEY = await this.getApiKey();
      const prompt = `Is the German word "${word}" used as a noun? Answer with ONLY "yes" or "no".`;

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
            temperature: 0.1,
            topK: 1,
            topP: 0.1,
            maxOutputTokens: 10,
          },
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error?.message || "API request failed");
      }

      if (data.candidates && data.candidates[0].content.parts[0].text) {
        const answer = data.candidates[0].content.parts[0].text
          .trim()
          .toLowerCase();
        return answer === "yes";
      }

      return false;
    } catch (error) {
      console.error("Noun check error:", error);
      return false; // If there's an error, assume it's not a noun to be safe
    }
  }

  async getArticle(word) {
    try {
      const API_KEY = await this.getApiKey();
      // First check if the word is a noun
      const isNoun = await this.checkIsNoun(word, API_KEY);

      if (!isNoun) {
        return ""; // Return empty string if not a noun
      }

      const prompt = `What is the correct definite article (der, die, or das) for the German noun "${word}"? Return ONLY the article without any explanation.`;

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
            temperature: 0.1,
            topK: 1,
            topP: 0.1,
            maxOutputTokens: 50,
          },
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error?.message || "API request failed");
      }

      if (data.candidates && data.candidates[0].content.parts[0].text) {
        return data.candidates[0].content.parts[0].text.trim();
      }

      throw new Error("Article detection failed");
    } catch (error) {
      console.error("Article detection error:", error);
      throw error;
    }
  }

  async getWordDetails(word, targetLanguage) {
    try {
      const [translation, example, synonyms, article] = await Promise.all([
        this.translate(word, targetLanguage),
        this.generateExample(word),
        this.getSynonyms(word),
        this.getArticle(word),
      ]);

      return {
        translation,
        example,
        synonyms,
        article,
      };
    } catch (error) {
      console.error("Word details error:", error);
      throw error;
    }
  }
}

export const geminiService = new GeminiService();
