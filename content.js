(async function () {
  console.log("[v0] Content script running");

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
  const tooltipWidth = 300;
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
      gap: 8px;
    ">
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
        "
      >Ask</button>
    </div>
  `;

  document.body.appendChild(tooltip);
  console.log("[v0] Tooltip appended to body");

  const input = document.getElementById("adam-ask-input");
  const submitBtn = document.getElementById("adam-ask-submit");

  // Focus input
  input.focus();

  // Submit function
  const submitPrompt = () => {
    const prompt = input.value.trim();
    if (!prompt) return;

    console.log("[v0] Submitting prompt:", prompt);
    console.log("[v0] Context:", selectedText);

    chrome.runtime.sendMessage(
      { action: "callOpenAI", prompt, context: selectedText },
      (response) => {
        if (response.success) {
          console.log("[v0] LLM Response:", response.data);
          alert(response.data);
        } else {
          console.error("[v0] Error:", response.error);
          alert("Error: " + response.error);
        }
        tooltip.remove();
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