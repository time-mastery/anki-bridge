document.addEventListener("DOMContentLoaded", async function () {
  const apiKeyInput = document.getElementById("apiKey");
  const modelSelect = document.getElementById("modelSelect");
  const saveButton = document.getElementById("saveSettings");
  const statusText = document.getElementById("status");

  // Load saved API key and model
  const { apiKey, model } = await chrome.storage.local.get(["apiKey", "model"]);
  if (apiKey) {
    apiKeyInput.value = apiKey;
  }

  if (model) {
    modelSelect.value = model;
  }

  saveButton.addEventListener("click", async function () {
    const newApiKey = apiKeyInput.value.trim();
    const selectedModel = modelSelect.value;

    if (!newApiKey) {
      statusText.textContent = "Please enter an API key";
      return;
    }

    await chrome.storage.local.set({
      apiKey: newApiKey,
      model: selectedModel,
    });

    statusText.textContent = "Settings saved successfully!";
    setTimeout(() => {
      statusText.textContent = "";
    }, 3000);
  });
});
