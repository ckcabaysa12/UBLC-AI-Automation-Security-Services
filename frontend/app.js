// ✅ Production webhook URL (n8n → Airtable)
const WEBHOOK_URL = "https://n8n-production-e572.up.railway.app/webhook/security-hook";

// ✅ Load Cohere API key from .env
require('dotenv').config();
const COHERE_API_KEY = process.env.COHERE_API_KEY;

const messagesEl = document.getElementById("messages");
const formEl = document.getElementById("chat-form");
const intentEl = document.getElementById("intent"); // dropdown for service
const msgEl = document.getElementById("message");

// ==============================
// Chat Form Submit Handler
// ==============================
formEl.addEventListener("submit", async (e) => {
  e.preventDefault();
  const selectedIntent = intentEl.value;
  const text = msgEl.value.trim();
  if (!text) return;

  addMsg("You", text, "you");

  const isQuestion = /\?\s*$/.test(text);
  const policyIntent = detectPolicyIntent(text);
  const intent = policyIntent || (isQuestion ? "query_check" : selectedIntent);
  const payload = buildPayload(intent, text, { isQuestion, policyIntent });

  try {
    addMsg("Assistant", "Typing...", "assistant");

    const res = await fetch(WEBHOOK_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ intent, ...payload })
    });

    const data = await res.json().catch(() => ({}));
    const aiReply = await getAIReply(text);

    const reply = data?.reply
      || (isQuestion ? "I can’t directly check item status yet, but your question has been noted.")
      || aiReply
      || "Your request has been logged.";

    updateLastMsg(reply);
  } catch (err) {
    console.error("Error sending to backend:", err);
    updateLastMsg("Error sending to backend. Please try again.");
  }

  msgEl.value = "";
});

// ==============================
// Helper Functions
// ==============================
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

function detectPolicyIntent(text) {
  const t = text.toLowerCase();
  if (t.includes("fire") || t.includes("smoke")) return "policy_fire";
  if (t.includes("medical") || t.includes("injury") || t.includes("clinic")) return "policy_medical";
  if (t.includes("intruder") || t.includes("trespass") || t.includes("unauthorized")) return "policy_intruder";
  if (t.includes("earthquake") || t.includes("tremor")) return "policy_earthquake";
  if (t.includes("system") || t.includes("server") || t.includes("network") || t.includes("outage")) return "policy_system";
  return null;
}

function buildPayload(intent, text, flags = {}) {
  const today = new Date().toISOString().slice(0, 10);

  if (intent === "query_check") {
    return { QueryText: text, Question: true };
  }
  if (intent.startsWith("policy_")) {
    return { PolicyQuery: text };
  }

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

// ✅ Cohere AI Reply
async function getAIReply(text) {
  try {
    const res = await fetch("https://api.cohere.ai/v1/generate", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${COHERE_API_KEY}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        model: "command",
        prompt: text,
        max_tokens: 100,
        temperature: 0.7
      })
    });
    const data = await res.json();
    return data.generations?.[0]?.text.trim() || null;
  } catch (err) {
    console.error("Cohere error:", err);
    return null;
  }
}
