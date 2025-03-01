import { geminiService } from "../services/gemini.js";

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

  const manualWordInput = document.getElementById("manualWordInput");
  const getWordDetailsBtn = document.getElementById("getWordDetailsBtn");

  changeApiKeyBtn.addEventListener("click", () => {
    chrome.runtime.openOptionsPage();
  });

  const openSettingsBtn = document.getElementById("openSettings");

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

  speakButton.addEventListener("click", () => {
    const text = originalText.textContent;
    if (text) {
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.rate = 0.9;
      speechSynthesis.speak(utterance);
    }
  });

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

  // Event listener for the "Get Details" button
  getWordDetailsBtn.addEventListener("click", async function () {
    const word = manualWordInput.value.trim();
    if (word) {
      originalText.textContent = word;
      await fetchWordDetails(word);
    }
  });
  async function translateText(text) {
    try {
      translatedText.textContent = "Translating...";
      translatedText.classList.add("loading");
      exampleSentenceText.textContent = "";
      synonymsText.innerHTML = "";
      artikelText.textContent = "";

      const languageMap = {
        en: "English",
        es: "Spanish",
        fr: "French",
        zh: "Mandarin Chinese",
        de: "German",
        fa: "Persian",
        ja: "Japanese",
        it: "Italian",
        ko: "Korean",
        ru: "Russian",
        pt: "Portuguese",
        uk: "Ukrainian",
      };

      const targetLang = languageMap[languageSelect.value] || "English";

      const isWord = !text.includes(" ");

      if (isWord) {
        try {
          const details = await geminiService.getWordDetails(text, targetLang);

          translatedText.textContent = details.translation;
          exampleSentenceText.textContent = details.example;

          if (details.synonyms && details.synonyms.length > 0) {
            synonymsText.innerHTML = details.synonyms
              .map((syn) => `<span class="synonym-tag">${syn}</span>`)
              .join("");
          }

          if (details.article) {
            artikelText.innerHTML = `<span class="artikel-badge">${details.article}</span>`;
          }
        } catch (modelError) {
          showErrorDialog(
            `Model error: ${
              modelError.message || "Unknown error with the selected model"
            }`
          );
          throw modelError;
        }
      } else {
        try {
          const translation = await geminiService.translate(text, targetLang);
          translatedText.textContent = translation;
        } catch (modelError) {
          showErrorDialog(
            `Model error: ${
              modelError.message || "Unknown error with the selected model"
            }`
          );
          throw modelError;
        }
      }

      translatedText.classList.remove("loading");
    } catch (error) {
      translatedText.classList.remove("loading");
      translatedText.textContent = "Translation failed. Please try again.";
      exampleSentenceText.textContent = "";
      synonymsText.innerHTML = "";
      artikelText.textContent = "";
    }
  }

  async function fetchWordDetails(word) {
    try {
      translatedText.textContent = "Fetching details...";
      translatedText.classList.add("loading");
      exampleSentenceText.textContent = "";
      synonymsText.innerHTML = "";
      artikelText.textContent = "";

      const languageMap = {
        en: "English",
        es: "Spanish",
        fr: "French",
        zh: "Mandarin Chinese",
        de: "German",
        fa: "Persian",
        ja: "Japanese",
        it: "Italian",
        ko: "Korean",
        ru: "Russian",
        pt: "Portuguese",
        uk: "Ukrainian",
      };

      const targetLang = languageMap[languageSelect.value] || "English";

      const details = await geminiService.getWordDetails(word, targetLang);

      translatedText.textContent =
        details.translation || "No translation available";
      exampleSentenceText.textContent =
        details.example || "No example available";

      if (details.synonyms && details.synonyms.length > 0) {
        synonymsText.innerHTML = details.synonyms
          .map((syn) => `<span class="synonym-tag">${syn}</span>`)
          .join("");
      }

      if (details.article) {
        artikelText.innerHTML = `<span class="artikel-badge">${details.article}</span>`;
      }

      translatedText.classList.remove("loading");
    } catch (error) {
      translatedText.classList.remove("loading");
      if (error.message.includes("Resource has been exhausted")) {
        translatedText.textContent =
          "API quota exceeded. Please try again later.";
      } else {
        translatedText.textContent =
          "Failed to fetch details. Please try again.";
        console.error("Error fetching word details:", error);
      }
      exampleSentenceText.textContent = "";
      synonymsText.innerHTML = "";
      artikelText.textContent = "";
    }
  }

  function showErrorDialog(message) {
    const dialog = document.createElement("div");
    dialog.className = "error-dialog";
    dialog.innerHTML = `
      <div class="error-content">
        <h3>Error</h3>
        <p>${message}</p>
        <button class="error-close-btn">Close</button>
      </div>
    `;

    document.body.appendChild(dialog);

    // Close button functionality
    const closeBtn = dialog.querySelector(".error-close-btn");
    closeBtn.addEventListener("click", () => {
      document.body.removeChild(dialog);
    });

    // Also close when clicking outside
    dialog.addEventListener("click", (e) => {
      if (e.target === dialog) {
        document.body.removeChild(dialog);
      }
    });
  }

  function copyToClipboard(text) {
    if (document.hasFocus()) {
      navigator.clipboard.writeText(text).catch((error) => {
        console.error("Clipboard error:", error);
      });
    } else {
      console.warn("Document is not focused. Clipboard operation aborted.");
    }
  }

  // Copy functionality
  copyFrontBtn.addEventListener("click", () => {
    copyToClipboard(originalText.textContent);
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

    copyToClipboard(formattedText);
  });

  navigator.clipboard.writeText(translatedText.textContent);
});
