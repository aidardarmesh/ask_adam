(async function () {
  console.log("[v0] Content script running");

  const { selectedText } = await chrome.storage.local.get("selectedText");
  console.log("[v0] Retrieved text:", selectedText);

  // Remove existing dialog if any
  document.getElementById("llm-dialog-overlay")?.remove();

  // Create overlay container
  const overlay = document.createElement("div");
  overlay.id = "llm-dialog-overlay";

  overlay.innerHTML = `
    <div id="llm-backdrop" style="position:fixed;inset:0;background:rgba(0,0,0,0.5);z-index:2147483646;"></div>
    <div id="llm-dialog" style="position:fixed;top:50%;left:50%;transform:translate(-50%,-50%);
                background:white;padding:24px;border-radius:12px;box-shadow:0 4px 24px rgba(0,0,0,0.2);
                z-index:2147483647;width:450px;font-family:system-ui,-apple-system,sans-serif;">
      <h3 style="margin:0 0 16px 0;font-size:18px;font-weight:600;color:#111;">Ask LLM</h3>
      <div style="font-size:13px;color:#666;margin-bottom:16px;padding:12px;background:#f5f5f5;border-radius:8px;max-height:100px;overflow-y:auto;">
        <strong style="color:#333;">Selected text:</strong><br/>
        <span style="color:#444;">"${selectedText?.replace(/"/g, '&quot;')}"</span>
      </div>
      <textarea id="llm-prompt" placeholder="Enter your prompt... (e.g., 'Explain this', 'Summarize', 'Translate to Spanish')" 
                style="width:100%;height:100px;padding:12px;border:1px solid #ddd;border-radius:8px;resize:none;box-sizing:border-box;font-size:14px;font-family:inherit;"></textarea>
      <div style="margin-top:16px;display:flex;gap:12px;justify-content:flex-end;">
        <button id="llm-cancel" style="padding:10px 20px;border:1px solid #ddd;background:white;border-radius:8px;cursor:pointer;font-size:14px;font-weight:500;transition:background 0.2s;">Cancel</button>
        <button id="llm-submit" style="padding:10px 20px;border:none;background:#0070f3;color:white;border-radius:8px;cursor:pointer;font-size:14px;font-weight:500;transition:background 0.2s;">Submit</button>
      </div>
    </div>
  `;

  document.body.appendChild(overlay);
  console.log("[v0] Dialog appended to body");

  // Focus textarea
  document.getElementById("llm-prompt").focus();

  // Handle cancel
  document.getElementById("llm-cancel").onclick = () => {
    console.log("[v0] Cancel clicked");
    overlay.remove();
  };

  // Handle backdrop click
  document.getElementById("llm-backdrop").onclick = () => {
    console.log("[v0] Backdrop clicked");
    overlay.remove();
  };

  // Handle submit
  document.getElementById("llm-submit").onclick = () => {
    const prompt = document.getElementById("llm-prompt").value;
    console.log("[v0] Submit clicked");
    console.log("[v0] Prompt:", prompt);
    console.log("[v0] Context:", selectedText);

    // TODO: Send to LLM API
    alert(`Prompt: ${prompt}\n\nSelected: ${selectedText}`);
    overlay.remove();
  };

  // Handle Escape key
  document.addEventListener("keydown", function handler(e) {
    if (e.key === "Escape") {
      overlay.remove();
      document.removeEventListener("keydown", handler);
    }
  });
})();