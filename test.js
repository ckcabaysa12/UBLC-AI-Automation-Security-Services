async function sendTest() {
  try {
    const response = await fetch('http://localhost:5678/webhook-test/security-hook', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        intent: "security_alert",
        payload: {
          Alert_Type: "Fire",
          Triggered_By: "AI Alert",
          Details: "Fire alarm triggered at Building C.",
          Urgency_Level: "High"
        }
      })
    });

    console.log("Status:", response.status);
    console.log("Response:", await response.text());
  } catch (err) {
    console.error("Error:", err);
  }
}

sendTest();
