// ✅ Production webhook URL
const WEBHOOK_URL = "https://n8n-production-e572.up.railway.app/webhook/security-hook";

const messagesEl = document.getElementById("messages");
const formEl = document.getElementById("chat-form");
const intentEl = document.getElementById("intent");
const msgEl = document.getElementById("message");

formEl.addEventListener("submit", async (e) => {
  e.preventDefault();
  const intent = intentEl.value;
  const text = msgEl.value.trim();
  if (!text) return;

  addMsg("You", text, "you");

  const payload = buildPayload(intent, text);

  try {
    // Show typing indicator
    addMsg("Assistant", "Typing...", "assistant");

    const res = await fetch(WEBHOOK_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ intent, ...payload })
    });

    const data = await res.json().catch(() => ({}));
    const reply = data?.reply || "Your request has been logged.";
    updateLastMsg(reply);
  } catch (err) {
    console.error("Error sending to backend:", err);
    updateLastMsg("Error sending to backend. Please try again.");
  }

  msgEl.value = "";
});

function addMsg(author, text, cls) {
  const div = document.createElement("div");
  div.className = `msg ${cls || ""}`;
  div.textContent = `${author}: ${text}`;
  messagesEl.appendChild(div);
  messagesEl.scrollTop = messagesEl.scrollHeight;
}

function updateLastMsg(text) {
  const last = messagesEl.querySelector(".msg.assistant:last-child");
  if (last) last.textContent = `Assistant: ${text}`;
}

function buildPayload(intent, text) {
  const today = new Date().toISOString().slice(0, 10);

  switch (intent) {
    case "security_lost_found":
      return {
        ItemName: text,
        Description: "Submitted via chatbot",
        LocationFound: "Unknown",
        DateFound: today,
        ClaimedBy: "",
        ClaimStatus: "Unclaimed",
        Notes: ""
      };

    case "security_incident":
      return {
        Title: text,
        Description: "Submitted via chatbot",
        Location: "Unknown",
        DateReported: today,
        Severity: "Low",
        Status: "Open",
        Notes: ""
      };

    case "security_alert":
      return {
        Summary: text,
        Location: "Unknown",
        ReportedAt: new Date().toISOString(),
        Priority: "High",
        ActionTaken: "Pending",
        Notes: ""
      };

    case "library_search":
      return { Query: text };

    case "ict_helpdesk":
      return { Subject: text, RequestedAt: today };

    case "admin_clearance":
      return { StudentID: text, Request: "Clearance status" };

    default:
      return { Notes: text };
  }
}
