/**
 * OpenAI Handler
 * Generates intelligent replies to customer messages
 */

export async function generateReply(
  customerMessage,
  productCatalog = [],
  conversationHistory = [],
) {
  const apiKey = process.env.OPENAI_API_KEY;

  if (!apiKey) {
    console.error("OpenAI API key not configured");
    return "Sorry, I'm having technical issues. Please try again later.";
  }

  // Build the system prompt
  const systemPrompt = `You are a smart WhatsApp sales assistant for a 
Nigerian seller. You help customers place orders 
naturally and conversationally.

CRITICAL RULES:
- Read the ENTIRE conversation history before replying
- NEVER ask for information the customer already gave
- If customer gave name + phone in one message, 
  you have both - do not ask again
- If customer gave address, you have it - do not ask again
- Track what you already know from the conversation

TO COMPLETE AN ORDER YOU NEED:
1. Product + size/variant ✓ (ask if missing)
2. Customer full name ✓ (ask if missing)  
3. Delivery address ✓ (ask if missing)
4. Phone number ✓ (ask if missing)

Once you have ALL 4, summarize the order and confirm:
"Perfect! Here's your order summary:
📦 [Product] - [Size]
👤 [Name]
📍 [Address]  
📞 [Phone]
💰 ₦[Amount]

Please make payment to:
Bank: [seller bank]
Account: [seller account]
Name: [seller name]

Send us your payment proof once done! 🙏"

PAYMENT DETECTION:
If customer mentions "paid", "transferred", 
"sent", "I've paid", reply:
"Thank you! 🙏 We've received your payment notification. 
The seller will confirm and send your delivery details 
shortly!"

TONE:
- Friendly, warm, like a real Lagos seller
- Short replies (2-3 sentences max)
- Use Nigerian expressions naturally
- Never sound robotic or repeat yourself

USE THE PRODUCT CATALOG:
${
  productCatalog.length > 0
    ? JSON.stringify(productCatalog, null, 2)
    : "No products in catalog yet."
}

CONVERSATION SO FAR:
Review everything above carefully before replying.
Do not re-ask anything already answered.`;

  // Build conversation messages
  const messages = [
    ...conversationHistory
      .filter((msg) => msg.message && msg.message.trim() !== "")
      .map((msg) => ({
        role: msg.role,
        content: msg.message,
      })),
    {
      role: "user",
      content: customerMessage,
    },
  ];

  try {
    const response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: "gpt-4o",
        messages: [
          {
            role: "system",
            content: systemPrompt,
          },
          ...messages,
        ],
        temperature: 0.7,
        max_tokens: 300,
      }),
    });

    const data = await response.json();

    if (!response.ok) {
      console.error("OpenAI API error:", data);
      return "I'm having trouble processing your request. Please try again.";
    }

    const reply = data.choices[0].message.content.trim();
    return reply;
  } catch (error) {
    console.error("Error generating reply:", error);
    return "I'm having trouble processing your request. Please try again.";
  }
}

export async function extractOrderData(conversationHistory) {
  const apiKey = process.env.OPENAI_API_KEY;

  if (!apiKey) {
    console.error("OpenAI API key not configured");
    return { is_order: false };
  }

  try {
    const response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: "gpt-4o",
        max_tokens: 500,
        messages: [
          {
            role: "system",
            content: `You analyze WhatsApp conversations
             between a Nigerian seller and a customer.

             Return ONLY a JSON object. No other text.

             If the conversation contains a complete order
             (customer has provided product + address + name),
             return:
             {
               "is_order": true,
               "customer_name": "",
               "product_name": "",
               "size": "",
               "quantity": 1,
               "delivery_address": "",
               "total_amount": 0
             }

             If not a complete order, return:
             { "is_order": false }

             An order is complete when customer has confirmed:
             what they want AND given their delivery address.
             Payment does not need to be confirmed yet.`,
          },
          {
            role: "user",
            content: JSON.stringify(conversationHistory),
          },
        ],
      }),
    });

    const data = await response.json();

    if (!response.ok) {
      console.error("OpenAI extractOrderData error:", data);
      return { is_order: false };
    }

    const text = data.choices?.[0]?.message?.content?.trim() || "";

    try {
      return JSON.parse(text);
    } catch {
      return { is_order: false };
    }
  } catch (error) {
    console.error("Error extracting order data:", error);
    return { is_order: false };
  }
}
