const WEBHOOK_URL = "http://localhost:5678/webhook/security-hook"; // replace with your actual webhook

const messages = document.getElementById("messages");
const form = document.getElementById("chat-form");
const intentSel = document.getElementById("intent");
const msgInput = document.getElementById("message");

form.addEventListener("submit", async (e) => {
  e.preventDefault();
  const intent = intentSel.value;
  const text = msgInput.value.trim();
  if (!text) return;

  addMsg("You", text);

  const payload = buildPayload(intent, text);

  try {
    const res = await fetch(WEBHOOK_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ intent, payload })
    });
    const data = await res.json().catch(() => ({}));
    addMsg("Assistant", "Logged successfully.");
  } catch (err) {
    addMsg("Assistant", "There was an error logging your request.");
  }

  msgInput.value = "";
});

function addMsg(author, text) {
  const div = document.createElement("div");
  div.className = "msg";
  div.textContent = `${author}: ${text}`;
  messages.appendChild(div);
}

function buildPayload(intent, text) {
  if (intent === "security_lost_found") {
    return {
      ItemID: `LF-${Date.now()}`,
      ItemName: text,
      Description: "Submitted via chatbot",
      LocationFound: "Unknown",
      DateFound: new Date().toISOString().slice(0, 10),
      ClaimedBy: "",
      ClaimStatus: "Unclaimed",
      Notes: ""
    };
  }
  // Add incident/emergency payloads next
  return { Notes: text };
}
