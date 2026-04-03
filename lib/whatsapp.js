/**
 * WhatsApp API Handler
 * Sends messages via Meta WhatsApp Cloud API
 */

export async function sendMessage(to, message) {
  const phoneNumberId = process.env.WHATSAPP_PHONE_NUMBER_ID;
  const accessToken = process.env.WHATSAPP_ACCESS_TOKEN;

  if (!phoneNumberId || !accessToken) {
    console.error("WhatsApp credentials not configured");
    return null;
  }

  const url = `https://graph.facebook.com/v18.0/${phoneNumberId}/messages`;

  const payload = {
    messaging_product: "whatsapp",
    to: to,
    type: "text",
    text: {
      body: message,
    },
  };

  try {
    const response = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${accessToken}`,
      },
      body: JSON.stringify(payload),
    });

    const data = await response.json();

    if (!response.ok) {
      console.error("WhatsApp API error:", data);
      return null;
    }

    console.log(`✓ Message sent to ${to}:`, message);
    return data;
  } catch (error) {
    console.error("Error sending WhatsApp message:", error);
    return null;
  }
}
