// Replace with your deployed webhook
const WEBHOOK_URL = "https://your-n8n-host/webhook/security-hook";

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
    const res = await fetch(WEBHOOK_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ intent, payload })
    });

    const data = await res.json().catch(() => ({}));
    const ack = data?.status || "Request logged.";
    addMsg("Assistant", ack, "assistant");
  } catch (err) {
    addMsg("Assistant", "Error sending to backend. Please try again.", "assistant");
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

function buildPayload(intent, text) {
  const today = new Date().toISOString().slice(0, 10);

  if (intent === "security_lost_found") {
    return {
      ItemID: `LF-${Date.now()}`,
      ItemName: text,
      Description: "Submitted via chatbot",
      LocationFound: "Unknown",
      DateFound: today,
      ClaimedBy: "",
      ClaimStatus: "Unclaimed",
      Notes: ""
    };
  }

  if (intent === "security_incident") {
    return {
      IncidentID: `INC-${Date.now()}`,
      Title: text,
      Description: "Submitted via chatbot",
      Location: "Unknown",
      DateReported: today,
      Severity: "Low",
      Status: "Open",
      Notes: ""
    };
  }

  if (intent === "security_alert") {
    return {
      EmergencyID: `EM-${Date.now()}`,
      Summary: text,
      Location: "Unknown",
      ReportedAt: new Date().toISOString(),
      Priority: "High",
      ActionTaken: "Pending",
      Notes: ""
    };
  }

  // Stubs for other departments:
  if (intent === "library_search") {
    return { Query: text };
  }
  if (intent === "ict_helpdesk") {
    return { Subject: text, RequestedAt: today };
  }
  if (intent === "admin_clearance") {
    return { StudentID: text, Request: "Clearance status" };
  }

  return { Notes: text };
}
