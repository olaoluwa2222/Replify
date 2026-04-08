/**
 * Confirm Payment API
 * Updates order status and sends WhatsApp notification to customer
 */

import { supabase } from "@/lib/supabase";
import { sendMessage } from "@/lib/whatsapp";

export async function POST(request) {
  try {
    const { orderId } = await request.json();

    if (!orderId) {
      return Response.json(
        { success: false, error: "orderId is required" },
        { status: 400 },
      );
    }

    // Fetch the order
    const { data: order, error: orderError } = await supabase
      .from("orders")
      .select("*")
      .eq("id", orderId)
      .single();

    if (orderError || !order) {
      return Response.json(
        { success: false, error: "Order not found" },
        { status: 404 },
      );
    }

    // Fetch the seller
    const { data: seller, error: sellerError } = await supabase
      .from("sellers")
      .select("*")
      .eq("id", order.seller_id)
      .single();

    if (sellerError || !seller) {
      return Response.json(
        { success: false, error: "Seller not found" },
        { status: 404 },
      );
    }

    // Update order status in Supabase
    const { error: updateError } = await supabase
      .from("orders")
      .update({ payment_status: "paid", order_status: "confirmed" })
      .eq("id", orderId);

    if (updateError) {
      return Response.json(
        { success: false, error: "Failed to update order" },
        { status: 500 },
      );
    }

    // Format total amount with commas
    const formattedAmount = Number(order.total_amount || 0).toLocaleString();

    // Build WhatsApp message with optional size line
    let message = `✅ *Payment Confirmed!*\n\nHi ${order.customer_name}, we've received your payment for *${order.product_name}*.\n\n📦 *Order Summary:*\n- Item: ${order.product_name}`;

    if (order.size && order.size.trim()) {
      message += `\n- Size: ${order.size}`;
    }

    message += `\n- Qty: ${order.quantity}\n- Total: ₦${formattedAmount}\n- Delivery to: ${order.delivery_address}\n\nYour order is now being prepared and will be delivered soon. \nWe'll update you once it's on the way! 🚚\n\nThank you for shopping with *${seller.business_name}*! 🙏`;

    // Send WhatsApp message
    const whatsappResult = await sendMessage(order.customer_whatsapp, message);

    if (!whatsappResult) {
      console.warn("WhatsApp message failed to send, but order was updated");
    }

    return Response.json({ success: true });
  } catch (error) {
    console.error("Error in confirm-payment API:", error);
    return Response.json(
      { success: false, error: error.message },
      { status: 500 },
    );
  }
}
