document.addEventListener("DOMContentLoaded", async () => {
  const apiKeyInput = document.getElementById("apiKey");
  const saveButton = document.getElementById("saveSettings");
  const status = document.getElementById("status");

  // Load existing API key if any
  const { apiKey } = await chrome.storage.local.get(["apiKey"]);
  if (apiKey) {
    apiKeyInput.value = apiKey;
  }

  saveButton.addEventListener("click", async () => {
    const newApiKey = apiKeyInput.value.trim();
    if (!newApiKey || newApiKey.length < 10) {
      status.textContent = "Please enter a valid API key";
      status.style.color = "#ef4444";
      return;
    }

    try {
      // Test the API key before saving
      const response = await fetch(
        "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=" +
          newApiKey,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            contents: [{ parts: [{ text: "test" }] }],
          }),
        }
      );

      if (!response.ok) {
        throw new Error("Invalid API key");
      }

      await chrome.storage.local.set({ apiKey: newApiKey });
      status.textContent = "API key saved successfully!";
      status.style.color = "#22c55e";

      // Close the window only after successful save
      setTimeout(() => {
        window.close();
      }, 1500);
    } catch (error) {
      status.textContent = "Invalid API key. Please check and try again.";
      status.style.color = "#ef4444";
    }
  });
});
