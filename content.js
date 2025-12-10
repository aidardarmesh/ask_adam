(async function () {
  console.log("[v0] Content script running");

  // Helper function to escape HTML and prevent XSS
  const escapeHtml = (text) => {
    const div = document.createElement("div");
    div.textContent = text;
    return div.innerHTML;
  };

  const { selectedText } = await chrome.storage.local.get("selectedText");
  console.log("[v0] Retrieved text:", selectedText);

  // Remove existing tooltip if any
  document.getElementById("adam-ask-tooltip")?.remove();

  // Get selection position
  const selection = window.getSelection();
  if (!selection.rangeCount) return;

  const range = selection.getRangeAt(0);
  const rect = range.getBoundingClientRect();

  // Calculate tooltip position (above the selection)
  const tooltipWidth = 750;
  const tooltipHeight = 90; // approximate height including button
  let left = rect.left + window.scrollX + (rect.width / 2) - (tooltipWidth / 2);
  let top = rect.top + window.scrollY - tooltipHeight - 8;

  // Keep tooltip within viewport bounds
  if (left < 10) left = 10;
  if (left + tooltipWidth > window.innerWidth - 10) {
    left = window.innerWidth - tooltipWidth - 10;
  }
  if (top < 10) {
    // Show below selection if not enough space above
    top = rect.bottom + window.scrollY + 8;
  }

  // Create tooltip container
  const tooltip = document.createElement("div");
  tooltip.id = "adam-ask-tooltip";

  // Add loading animation styles
  const style = document.createElement("style");
  style.textContent = `
    @keyframes adam-dot-pulse {
      0%, 80%, 100% { opacity: 0.3; transform: scale(0.8); }
      40% { opacity: 1; transform: scale(1); }
    }
    .adam-loading-dots {
      display: inline-flex;
      align-items: center;
      gap: 4px;
    }
    .adam-loading-dots span {
      width: 6px;
      height: 6px;
      background-color: white;
      border-radius: 50%;
      animation: adam-dot-pulse 1.4s ease-in-out infinite;
    }
    .adam-loading-dots span:nth-child(1) { animation-delay: 0s; }
    .adam-loading-dots span:nth-child(2) { animation-delay: 0.2s; }
    .adam-loading-dots span:nth-child(3) { animation-delay: 0.4s; }
    
    .adam-response {
      margin-top: 10px;
      padding: 12px;
      background: #f8f9fa;
      border: 1px solid #e0e0e0;
      border-radius: 6px;
      font-size: 14px;
      line-height: 1.5;
      color: #333;
      white-space: pre-wrap;
      word-wrap: break-word;
      max-height: 300px;
      overflow-y: auto;
    }
    .adam-response.error {
      background: #fee2e2;
      border-color: #fecaca;
      color: #991b1b;
    }
  `;
  document.head.appendChild(style);

  // Truncate selected text for display
  const displayText = selectedText.length > 120
    ? selectedText.substring(0, 120) + "..."
    : selectedText;

  tooltip.innerHTML = `
    <div id="adam-ask-container" style="
      position: absolute;
      left: ${left}px;
      top: ${top}px;
      width: ${tooltipWidth}px;
      background: white;
      padding: 10px;
      border-radius: 8px;
      box-shadow: 0 4px 16px rgba(0,0,0,0.2);
      z-index: 2147483647;
      font-family: system-ui, -apple-system, sans-serif;
      display: flex;
      flex-direction: column;
      gap: 10px;
    ">
      <div style="
        font-size: 13px;
        color: #495057;
      ">${escapeHtml(displayText)}</div>
      <div class="adam-input-wrapper" style="display: flex; gap: 8px;">
        <input 
          id="adam-ask-input" 
          type="text" 
          placeholder="Ask about this..." 
          style="
            flex: 1;
            height: 50px;
            padding: 0 12px;
            border: 1px solid #ddd;
            border-radius: 6px;
            font-size: 14px;
            font-family: inherit;
            outline: none;
            box-sizing: border-box;
          "
        />
        <button 
          id="adam-ask-submit" 
          style="
            height: 50px;
            padding: 0 16px;
            border: none;
            background: #0070f3;
            color: white;
            border-radius: 6px;
            cursor: pointer;
            font-size: 14px;
            font-weight: 500;
            white-space: nowrap;
            min-width: 80px;
          "
        >Submit</button>
      </div>
    </div>
  `;

  document.body.appendChild(tooltip);
  console.log("[v0] Tooltip appended to body");

  const input = document.getElementById("adam-ask-input");
  const submitBtn = document.getElementById("adam-ask-submit");

  // Focus input
  input.focus();

  // Loading animation HTML
  const loadingDotsHTML = `<span class="adam-loading-dots"><span></span><span></span><span></span></span>`;

  // Submit function
  const submitPrompt = () => {
    const prompt = input.value.trim();
    if (!prompt) return;

    // Show loading animation
    submitBtn.innerHTML = loadingDotsHTML;
    submitBtn.disabled = true;
    submitBtn.style.cursor = "not-allowed";
    submitBtn.style.opacity = "0.8";
    input.disabled = true;

    console.log("[v0] Submitting prompt:", prompt);
    console.log("[v0] Context:", selectedText);

    chrome.runtime.sendMessage(
      { action: "callOpenAI", prompt, context: selectedText },
      (response) => {
        // Reset button state
        submitBtn.innerHTML = "Submit";
        submitBtn.disabled = false;
        submitBtn.style.cursor = "pointer";
        submitBtn.style.opacity = "1";
        input.disabled = false;

        const container = document.getElementById("adam-ask-container");

        // Remove existing response block if any
        const existingResponse = container.querySelector(".adam-response");
        if (existingResponse) {
          existingResponse.remove();
        }

        if (response.success) {
          console.log("[v0] LLM Response:", response.data);

          // Create response block
          const responseDiv = document.createElement("div");
          responseDiv.className = "adam-response";
          responseDiv.textContent = response.data;
          container.appendChild(responseDiv);
        } else {
          console.error("[v0] Error:", response.error);

          // Create error response block
          const responseDiv = document.createElement("div");
          responseDiv.className = "adam-response error";
          responseDiv.textContent = response.error;
          container.appendChild(responseDiv);
        }
      }
    );
  };

  // Handle Enter key
  input.addEventListener("keydown", (e) => {
    if (e.key === "Enter") {
      e.preventDefault();
      submitPrompt();
    }
    if (e.key === "Escape") {
      tooltip.remove();
    }
  });

  // Handle button click
  submitBtn.onclick = submitPrompt;

  // Close when clicking outside
  document.addEventListener("mousedown", function handler(e) {
    const container = document.getElementById("adam-ask-container");
    if (container && !container.contains(e.target)) {
      tooltip.remove();
      document.removeEventListener("mousedown", handler);
    }
  });
})();