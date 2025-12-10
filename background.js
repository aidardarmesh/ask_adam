// Create context menu when extension is installed
chrome.runtime.onInstalled.addListener(() => {
    chrome.contextMenus.create({
        id: "askLLM",
        title: "Ask LLM",
        contexts: ["selection"] // Only shows when text is selected
    });
});

// Handle context menu click
chrome.contextMenus.onClicked.addListener((info, tab) => {
    if (info.menuItemId === "askLLM") {
        const selectedText = info.selectionText;

        // Store selected text and open popup
        chrome.storage.local.set({ selectedText }, () => {
            // Inject a dialog into the page or open popup
            chrome.scripting.executeScript({
                target: { tabId: tab.id },
                files: ["content.js"]
            });
        });
    }
});