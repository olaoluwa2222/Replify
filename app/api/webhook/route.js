/**
 * WhatsApp Webhook Handler
 * GET: Verify webhook with Meta
 * POST: Receive and process incoming messages
 */

import { supabase } from "@/lib/supabase";
import { extractOrderData, generateReply } from "@/lib/ai";
import { sendMessage } from "@/lib/whatsapp";

export async function GET(req) {
  const { searchParams } = new URL(req.url);

  const verify_token = searchParams.get("hub.verify_token");
  const challenge = searchParams.get("hub.challenge");

  // Verify the webhook token
  if (verify_token === process.env.WHATSAPP_VERIFY_TOKEN) {
    console.log("✓ Webhook verified");
    return new Response(challenge, { status: 200 });
  }

  console.log("✗ Webhook verification failed");
  return new Response("Verification token mismatch", { status: 403 });
}

export async function POST(req) {
  try {
    const body = await req.json();

    // Log the entire body for debugging
    console.log("Webhook received:", JSON.stringify(body, null, 2));

    // Extract message data
    if (
      body.entry &&
      body.entry[0].changes &&
      body.entry[0].changes[0].value.messages
    ) {
      const messages = body.entry[0].changes[0].value.messages;
      const contacts = body.entry[0].changes[0].value.contacts;
      const metadata = body.entry[0].changes[0].value.metadata;

      // STEP 1: Extract destination phone number (seller's WhatsApp number)
      let sellerPhoneNumber =
        metadata?.display_phone_number || metadata?.phone_number_id || "";
      console.log("📍 Incoming to number:", sellerPhoneNumber);

      // Normalize phone number - strip leading + if present
      if (sellerPhoneNumber.startsWith("+")) {
        sellerPhoneNumber = sellerPhoneNumber.slice(1);
      }

      // STEP 2: Look up seller by WhatsApp number
      const { data: seller, error: sellerError } = await supabase
        .from("sellers")
        .select("*")
        .eq("whatsapp_number", sellerPhoneNumber)
        .single();

      if (sellerError || !seller) {
        console.log(`⚠️  No seller found for number: ${sellerPhoneNumber}`);
        // Always return 200 to Meta or they will keep retrying
        return new Response(JSON.stringify({ success: true }), {
          status: 200,
          headers: { "Content-Type": "application/json" },
        });
      }

      console.log("✅ Seller found:", seller.business_name);
      const seller_id = seller.id;

      // STEP 6: Fetch seller's products
      console.log("🛍️  Fetching product catalog...");
      const { data: products, error: productsError } = await supabase
        .from("products")
        .select("*")
        .eq("seller_id", seller_id);

      if (productsError) {
        console.error("Error fetching products:", productsError);
      }

      const productCatalog = products || [];

      for (let message of messages) {
        // Only process text messages
        if (message.type !== "text") {
          console.log(`⏭️  Skipping non-text message type: ${message.type}`);
          continue;
        }

        const sender_phone = message.from;
        const message_text = message.text?.body || "";
        const customer_name =
          contacts && contacts[0] ? contacts[0].profile.name : "Unknown";

        console.log(
          `📱 Message from ${sender_phone} (${customer_name}): ${message_text}`,
        );

        try {
          // Step 1: Save incoming customer message to conversations
          console.log("💾 Saving customer message to Supabase...");
          const { error: saveError } = await supabase
            .from("conversations")
            .insert({
              seller_id,
              customer_whatsapp: sender_phone,
              role: "user",
              message: message_text,
            });

          if (saveError) {
            console.error("Error saving message:", saveError);
            continue;
          }

          // Step 2: Fetch conversation history (last 10 messages)
          console.log("📜 Fetching conversation history...");
          const { data: history, error: historyError } = await supabase
            .from("conversations")
            .select("role, message")
            .eq("seller_id", seller_id)
            .eq("customer_whatsapp", sender_phone)
            .order("created_at", { ascending: true })
            .limit(20);

          if (historyError) {
            console.error("Error fetching history:", historyError);
          }

          const conversationHistory = history || [];

          // Step 3: Generate AI reply (with seller data)
          console.log("🤖 Generating AI reply...");
          const aiReply = await generateReply(
            message_text,
            productCatalog,
            conversationHistory,
            seller,
          );

          // Step 4b: Detect complete order and save to orders table
          console.log("🧾 Extracting order data from conversation...");
          const orderData = await extractOrderData(conversationHistory);

          if (orderData?.is_order) {
            const existing = await supabase
              .from("orders")
              .select("id")
              .eq("seller_id", seller_id)
              .eq("customer_whatsapp", sender_phone)
              .eq("product_name", orderData.product_name)
              .eq("order_status", "new")
              .single();

            if (existing.error && existing.error.code !== "PGRST116") {
              console.error("Error checking existing order:", existing.error);
            }

            if (!existing.data) {
              const { error: orderInsertError } = await supabase
                .from("orders")
                .insert({
                  seller_id,
                  customer_name: orderData.customer_name || customer_name,
                  customer_phone: sender_phone,
                  customer_whatsapp: sender_phone,
                  product_name: orderData.product_name,
                  size: orderData.size,
                  quantity: orderData.quantity || 1,
                  delivery_address: orderData.delivery_address,
                  total_amount: orderData.total_amount,
                  payment_status: "pending",
                  order_status: "new",
                });

              if (orderInsertError) {
                console.error(
                  "Error saving extracted order:",
                  orderInsertError,
                );
              } else {
                console.log("✅ Order saved to database");
              }
            }
          }

          // Step 4c: Detect payment claims and mark pending orders
          const normalizedMessage = message_text.toLowerCase();
          const paymentClaimedPatterns = [
            "paid",
            "transferred",
            "sent the money",
            "i've paid",
            "i have paid",
          ];

          const isPaymentClaimed = paymentClaimedPatterns.some((phrase) =>
            normalizedMessage.includes(phrase),
          );

          if (isPaymentClaimed) {
            const { error: paymentClaimError } = await supabase
              .from("orders")
              .update({ payment_status: "payment_claimed" })
              .eq("seller_id", seller_id)
              .eq("customer_whatsapp", sender_phone)
              .eq("payment_status", "pending");

            if (paymentClaimError) {
              console.error(
                "Error updating payment_claimed status:",
                paymentClaimError,
              );
            }
          }

          console.log(`✨ AI Reply: ${aiReply}`);

          // Step 5: Save AI reply to conversations
          console.log("💾 Saving AI reply to Supabase...");
          const { error: replyError } = await supabase
            .from("conversations")
            .insert({
              seller_id,
              customer_whatsapp: sender_phone,
              role: "assistant",
              message: aiReply,
            });

          if (replyError) {
            console.error("Error saving AI reply:", replyError);
            continue;
          }

          // Step 6: Send reply back to customer
          console.log("📤 Sending reply to customer...");
          await sendMessage(sender_phone, aiReply);

          console.log(`✅ Successfully processed message from ${sender_phone}`);
        } catch (messageError) {
          console.error(
            `❌ Error processing message from ${sender_phone}:`,
            messageError,
          );
          continue;
        }
      }
    }

    return new Response(JSON.stringify({ success: true }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Webhook error:", error);
    // Always return 200 to Meta or they will keep retrying
    return new Response(JSON.stringify({ success: true }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  }
}
