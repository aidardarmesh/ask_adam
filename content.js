// Create and show dialog
(async function () {
    const { selectedText } = await chrome.storage.local.get("selectedText");

    // Remove existing dialog if any
    document.getElementById("llm-dialog")?.remove();

    const dialog = document.createElement("div");
    dialog.id = "llm-dialog";
    dialog.innerHTML = `
    <div style="position:fixed;top:50%;left:50%;transform:translate(-50%,-50%);
                background:white;padding:20px;border-radius:8px;box-shadow:0 4px 20px rgba(0,0,0,0.3);
                z-index:999999;width:400px;font-family:system-ui;">
      <h3 style="margin:0 0 12px 0;">Ask LLM</h3>
      <p style="font-size:14px;color:#666;margin-bottom:12px;">
        <strong>Selected:</strong> "${selectedText?.substring(0, 100)}${selectedText?.length > 100 ? '...' : ''}"
      </p>
      <textarea id="llm-prompt" placeholder="Enter your prompt..." 
                style="width:100%;height:80px;padding:8px;border:1px solid #ccc;border-radius:4px;resize:none;box-sizing:border-box;"></textarea>
      <div style="margin-top:12px;display:flex;gap:8px;justify-content:flex-end;">
        <button id="llm-cancel" style="padding:8px 16px;border:1px solid #ccc;background:white;border-radius:4px;cursor:pointer;">Cancel</button>
        <button id="llm-submit" style="padding:8px 16px;border:none;background:#0070f3;color:white;border-radius:4px;cursor:pointer;">Submit</button>
      </div>
    </div>
    <div style="position:fixed;inset:0;background:rgba(0,0,0,0.5);z-index:999998;"></div>
  `;

    document.body.appendChild(dialog);

    // Handle events
    document.getElementById("llm-cancel").onclick = () => dialog.remove();
    document.getElementById("llm-submit").onclick = () => {
        const prompt = document.getElementById("llm-prompt").value;
        // Send to your LLM API here
        console.log("Prompt:", prompt, "Context:", selectedText);
        dialog.remove();
    };
})();