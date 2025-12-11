import { CONFIG } from './config.js';

// ============================================
// Chrome Identity Authentication
// ============================================

// Get OAuth token using chrome.identity
async function getAuthToken(interactive = true) {
    return new Promise((resolve, reject) => {
        chrome.identity.getAuthToken({ interactive }, (token) => {
            if (chrome.runtime.lastError) {
                reject(new Error(chrome.runtime.lastError.message));
            } else {
                resolve(token);
            }
        });
    });
}

// Get user info from Google
async function getUserInfo(token) {
    const response = await fetch('https://www.googleapis.com/oauth2/v3/userinfo', {
        headers: { Authorization: `Bearer ${token}` }
    });

    if (!response.ok) {
        throw new Error('Failed to fetch user info');
    }

    return response.json();
}

// Sign in and store user info
async function signIn() {
    try {
        const token = await getAuthToken(true);
        const userInfo = await getUserInfo(token);

        // Store user info and token
        await chrome.storage.local.set({
            user: userInfo,
            authToken: token,
            isAuthenticated: true
        });

        console.log('Signed in as:', userInfo.email);
        return { success: true, user: userInfo };
    } catch (error) {
        console.error('Sign in failed:', error);
        return { success: false, error: error.message };
    }
}

// Sign out
async function signOut() {
    try {
        const { authToken } = await chrome.storage.local.get('authToken');

        if (authToken) {
            // Revoke the token
            await fetch(`https://accounts.google.com/o/oauth2/revoke?token=${authToken}`);

            // Remove cached token from Chrome
            chrome.identity.removeCachedAuthToken({ token: authToken }, () => {
                console.log('Token removed from cache');
            });
        }

        // Clear stored data
        await chrome.storage.local.remove(['user', 'authToken', 'isAuthenticated']);

        console.log('Signed out successfully');
        return { success: true };
    } catch (error) {
        console.error('Sign out failed:', error);
        return { success: false, error: error.message };
    }
}

// Check if user is authenticated
async function checkAuth() {
    const { isAuthenticated, user } = await chrome.storage.local.get(['isAuthenticated', 'user']);
    return { isAuthenticated: !!isAuthenticated, user };
}

// ============================================
// Extension Setup
// ============================================

// Create context menu when extension is installed
chrome.runtime.onInstalled.addListener(() => {
    chrome.contextMenus.create({
        id: "askLLM",
        title: "Ask LLM",
        contexts: ["selection"]
    });

    // Prompt sign-in on install
    signIn();
});

// Handle context menu click
chrome.contextMenus.onClicked.addListener(async (info, tab) => {
    if (info.menuItemId === "askLLM") {
        const selectedText = info.selectionText;

        await chrome.storage.local.set({ selectedText });

        try {
            await chrome.scripting.executeScript({
                target: { tabId: tab.id },
                files: ["content.js"]
            });
        } catch (error) {
            console.error("Script injection failed:", error);
        }
    }
});

// Listen for messages from content script
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.action === "callOpenAI") {
        callOpenAI(request.prompt, request.context)
            .then(response => sendResponse({ success: true, data: response }))
            .catch(error => sendResponse({ success: false, error: error.message }));

        // Return true to indicate async response
        return true;
    }

    // Authentication actions
    if (request.action === "signIn") {
        signIn().then(sendResponse);
        return true;
    }

    if (request.action === "signOut") {
        signOut().then(sendResponse);
        return true;
    }

    if (request.action === "checkAuth") {
        checkAuth().then(sendResponse);
        return true;
    }
});

// OpenAI API call
async function callOpenAI(prompt, context) {
    const response = await fetch("https://api.openai.com/v1/chat/completions", {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${CONFIG.OPENAI_API_KEY}`
        },
        body: JSON.stringify({
            model: "gpt-4o-mini",
            messages: [
                {
                    role: "system",
                    content: "You are a helpful assistant. Answer based on the provided context."
                },
                {
                    role: "user",
                    content: `${prompt}\n\nContext: "${context}"`
                }
            ],
            max_tokens: 1000
        })
    });

    if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error?.message || "API request failed");
    }

    const data = await response.json();
    return data.choices[0].message.content;
}