chrome.runtime.onInstalled.addListener(() => {
  chrome.contextMenus.create({
    id: "fadeExtension",
    title: "Translate selected text",
    contexts: ["selection"],
  });
});

// Handle context menu click
chrome.contextMenus.onClicked.addListener((info, tab) => {
  if (info.menuItemId === "fadeExtension" && info.selectionText) {
    // Store the selected text in storage for the popup to access
    chrome.storage.local.set(
      {
        selectedText: info.selectionText,
      },
      () => {
        // Open the popup
        chrome.action.openPopup();
      }
    );
  }
});
