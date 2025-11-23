// ✅ Production webhook URL (n8n → Airtable)
const WEBHOOK_URL = "https://n8n-production-e572.up.railway.app/webhook/security-hook";

// ✅ Hugging Face API (AI replies)
const HF_API_URL = "https://api-inference.huggingface.co/models/tiiuae/falcon-7b-instruct";
const HF_API_KEY = "YOUR_HF_API_KEY"; // <-- replace with your free Hugging Face key

const messagesEl = document.getElementById("messages");
const formEl = document.getElementById("chat-form");
const intentEl = document.getElementById("intent"); // dropdown for service
const msgEl = document.getElementById("message");

// ==============================
// Chat Form Submit Handler
// ==============================
formEl.addEventListener("submit", async (e) => {
  e.preventDefault();
  const selectedIntent = intentEl.value; // e.g., "security_lost_found"
  const text = msgEl.value.trim();
  if (!text) return;

  addMsg("You", text, "you");

  // ✅ Detect question and policy keywords
  const isQuestion = /\?\s*$/.test(text);
  const policyIntent = detectPolicyIntent(text);

  // Decide final intent: policy > question > selected
  const intent = policyIntent || (isQuestion ? "query_check" : selectedIntent);

  // Build payload for n8n webhook
  const payload = buildPayload(intent, text, { isQuestion, policyIntent });

  try {
    addMsg("Assistant", "Typing...", "assistant");

    // ✅ Send to n8n webhook (logging → Airtable)
    const res = await fetch(WEBHOOK_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ intent, ...payload })
    });

    const data = await res.json().catch(() => ({}));

    // ✅ Get AI reply from Hugging Face
    const aiReply = await getAIReply(text);

    // Prefer backend reply, fallback to AI reply
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

// ✅ Detect security policy intents by keywords
function detectPolicyIntent(text) {
  const t = text.toLowerCase();
  if (t.includes("fire") || t.includes("smoke")) return "policy_fire";
  if (t.includes("medical") || t.includes("injury") || t.includes("clinic")) return "policy_medical";
  if (t.includes("intruder") || t.includes("trespass") || t.includes("unauthorized")) return "policy_intruder";
  if (t.includes("earthquake") || t.includes("tremor")) return "policy_earthquake";
  if (t.includes("system") || t.includes("server") || t.includes("network") || t.includes("outage")) return "policy_system";
  return null;
}

// ✅ Build payload for n8n webhook
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

// ✅ Hugging Face AI Reply
async function getAIReply(text) {
  try {
    const res = await fetch(HF_API_URL, {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${HF_API_KEY}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({ inputs: text })
    });
    const data = await res.json();
    return data[0]?.generated_text || null;
  } catch (err) {
    console.error("AI error:", err);
    return null;
  }
}
