import { geminiService } from "./services/gemini.js";

document.addEventListener("DOMContentLoaded", async function () {
  const languageSelect = document.getElementById("languageSelect");
  const originalText = document.getElementById("original-text");
  const translatedText = document.getElementById("translated-text");
  const exampleSentenceText = document.getElementById("example-sentence-text");
  const synonymsText = document.getElementById("synonyms-text");
  const artikelText = document.getElementById("artikel-text");
  const copyFrontBtn = document.getElementById("copyFront");
  const copyBackBtn = document.getElementById("copyBack");
  const speakButton = document.getElementById("speakButton");
  const changeApiKeyBtn = document.getElementById("changeApiKey");
  const clearApiKeyBtn = document.getElementById("clearApiKey");

  // API key management
  changeApiKeyBtn.addEventListener("click", () => {
    chrome.runtime.openOptionsPage();
  });

  const openSettingsBtn = document.getElementById("openSettings");

  // Add this with your other event listeners
  openSettingsBtn.addEventListener("click", () => {
    chrome.runtime.openOptionsPage();
  });

  clearApiKeyBtn.addEventListener("click", async () => {
    if (confirm("Are you sure you want to clear the API key?")) {
      await chrome.storage.local.remove("apiKey");
      translatedText.textContent =
        "API key cleared. Please set a new key to continue.";
      exampleSentenceText.textContent = "";
      synonymsText.innerHTML = "";
      artikelText.textContent = "";
      chrome.runtime.openOptionsPage();
    }
  });

  // Add speech functionality
  speakButton.addEventListener("click", () => {
    const text = originalText.textContent;
    if (text) {
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = "de-DE"; // Set German language
      utterance.rate = 0.9; // Slightly slower for better clarity
      speechSynthesis.speak(utterance);
    }
  });

  // Load saved language preference
  const { preferredLanguage } = await chrome.storage.sync.get([
    "preferredLanguage",
  ]);
  if (preferredLanguage) {
    languageSelect.value = preferredLanguage;
  }

  // Check for selected text from context menu
  const { selectedText } = await chrome.storage.local.get(["selectedText"]);
  if (selectedText) {
    originalText.textContent = selectedText;
    // Translate the text
    await translateText(selectedText);
    // Clear the stored text
    chrome.storage.local.remove("selectedText");
  }

  // Handle language change
  languageSelect.addEventListener("change", async function () {
    await chrome.storage.sync.set({
      preferredLanguage: languageSelect.value,
    });

    if (originalText.textContent) {
      await translateText(originalText.textContent);
    }
  });

  async function translateText(text) {
    try {
      // Add loading states
      translatedText.textContent = "Translating...";
      translatedText.classList.add("loading");
      exampleSentenceText.textContent = "";
      synonymsText.innerHTML = "";
      artikelText.textContent = "";

      const targetLang = languageSelect.value === "en" ? "English" : "Persian";

      // Check if it's a single word
      const isWord = !text.includes(" ");

      if (isWord) {
        try {
          // Get all word details
          const details = await geminiService.getWordDetails(text, targetLang);

          translatedText.textContent = details.translation;
          exampleSentenceText.textContent = details.example;

          // Display synonyms as tags
          if (details.synonyms && details.synonyms.length > 0) {
            synonymsText.innerHTML = details.synonyms
              .map((syn) => `<span class="synonym-tag">${syn}</span>`)
              .join("");
          }

          // Show article for German words
          if (details.article) {
            artikelText.innerHTML = `<span class="artikel-badge">${details.article}</span>`;
          }
        } catch (modelError) {
          showErrorDialog(`Model error: ${modelError.message || 'Unknown error with the selected model'}`);
          throw modelError;
        }
      } else {
        // Just translate the sentence
        try {
          const translation = await geminiService.translate(text, targetLang);
          translatedText.textContent = translation;
        } catch (modelError) {
          showErrorDialog(`Model error: ${modelError.message || 'Unknown error with the selected model'}`);
          throw modelError;
        }
      }

      // Remove loading states
      translatedText.classList.remove("loading");
    } catch (error) {
      translatedText.classList.remove("loading");
      translatedText.textContent = "Translation failed. Please try again.";
      exampleSentenceText.textContent = "";
      synonymsText.innerHTML = "";
      artikelText.textContent = "";
    }
  }

  // Add this function to show error dialog
  function showErrorDialog(message) {
    const dialog = document.createElement('div');
    dialog.className = 'error-dialog';
    dialog.innerHTML = `
      <div class="error-content">
        <h3>Error</h3>
        <p>${message}</p>
        <button class="error-close-btn">Close</button>
      </div>
    `;
    
    document.body.appendChild(dialog);
    
    // Close button functionality
    const closeBtn = dialog.querySelector('.error-close-btn');
    closeBtn.addEventListener('click', () => {
      document.body.removeChild(dialog);
    });
    
    // Also close when clicking outside
    dialog.addEventListener('click', (e) => {
      if (e.target === dialog) {
        document.body.removeChild(dialog);
      }
    });
  }

  // Copy functionality
  copyFrontBtn.addEventListener("click", () => {
    navigator.clipboard.writeText(originalText.textContent);
  });

  copyBackBtn.addEventListener("click", () => {
    const word = originalText.textContent;
    const translation = translatedText.textContent;
    const article = artikelText.textContent;
    const example = exampleSentenceText.textContent;
    const synonyms = Array.from(
      synonymsText.getElementsByClassName("synonym-tag")
    )
      .map((tag) => tag.textContent)
      .join(", ");

    const formattedText = [
      `# ${article ? `${article} ` : ""}${word}`,
      `## Translation`,
      translation,
      synonyms ? `## Synonyms\n${synonyms}` : null,
      example ? `## Example\n*${example}*` : null,
    ]
      .filter(Boolean)
      .join("\n\n");

    navigator.clipboard.writeText(formattedText);
  });

  navigator.clipboard.writeText(translatedText.textContent);
});
