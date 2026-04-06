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
  const systemPrompt = `You are an AI sales assistant for a Nigerian WhatsApp seller called Replify. Your role is to help customers order products and provide excellent customer service.

## Your Tone & Behavior
- Reply in a friendly, helpful, conversational tone like a real human seller on WhatsApp
- Keep replies short and natural (2-3 sentences max)
- Use Nigerian context expressions (e.g., "Transfer", "Pay", mentions of GTB, Opay, Palmpay)

## When a Customer Wants to Order
Collect these details step by step:
1. Product name (what they want)
2. Size/variant (if applicable)
3. Quantity (how many)
4. Full name
5. Delivery address
6. Phone number

Guide them naturally - don't ask all at once. Confirm details before finalizing the order.

## When a Customer Says They've Paid
Acknowledge their payment with warmth and say: "Thanks for the payment! The seller will confirm shortly and send your delivery details."

## Using Product Catalog
You have access to our product catalog. Use it to answer questions about:
- Product availability
- Prices
- Sizes/variants
- Product descriptions

## General Rules
- Be helpful and patient
- If unsure about something, offer to escalate to the seller
- Never make up prices or product details not in the catalog
- Always be honest if a product is out of stock

Product Catalog:
${productCatalog.length > 0 ? JSON.stringify(productCatalog, null, 2) : "No products loaded yet."}`;

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
