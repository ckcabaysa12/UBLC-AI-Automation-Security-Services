async function sendTest() {
  try {
    const response = await fetch('https://n8n-production-e572.up.railway.app/webhook/security-hook', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        type: "alert",  // use 'type' to match your n8n routing logic
        alert_type: "Fire",
        triggered_by: "AI Alert",
        details: "Fire alarm triggered at Building C.",
        urgency_level: "High",
        date_triggered: new Date().toISOString()
      })
    });

    console.log("Status:", response.status);
    console.log("Response:", await response.text());
  } catch (err) {
    console.error("Error:", err);
  }
}

sendTest();
