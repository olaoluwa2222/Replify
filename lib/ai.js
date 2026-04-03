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
    ...conversationHistory.map((msg) => ({
      role: msg.role,
      content: msg.content,
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
