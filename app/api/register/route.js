/**
 * Register API Route — /app/api/register/route.js
 * Handles user registration with Supabase Auth + Seller creation
 * Uses service role key to bypass RLS policies
 */

import { createClient } from "@supabase/supabase-js";

export async function POST(request) {
  try {
    const body = await request.json();
    const { email, password, business_name, whatsapp_number } = body;

    // Validate inputs
    if (!email || !password || !business_name || !whatsapp_number) {
      return Response.json(
        { error: "Missing required fields" },
        { status: 400 },
      );
    }

    // Verify environment variables
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    console.log("DEBUG: Checking env vars...");
    console.log("NEXT_PUBLIC_SUPABASE_URL exists:", !!supabaseUrl);
    console.log("SUPABASE_SERVICE_ROLE_KEY exists:", !!serviceRoleKey);

    if (!supabaseUrl || !serviceRoleKey) {
      console.error("❌ Missing Supabase environment variables");
      console.error("Make sure .env.local has SUPABASE_SERVICE_ROLE_KEY");
      return Response.json(
        {
          error:
            "Server configuration error: Missing SUPABASE_SERVICE_ROLE_KEY in .env.local",
        },
        { status: 500 },
      );
    }

    // Create admin client with service role (bypasses RLS)
    const supabaseAdmin = createClient(supabaseUrl, serviceRoleKey);

    // STEP 1: Create auth user
    const { data: authData, error: authError } =
      await supabaseAdmin.auth.admin.createUser({
        email,
        password,
        email_confirm: true, // Auto-confirm email
      });

    if (authError) {
      console.error("Auth creation error:", authError);
      return Response.json({ error: authError.message }, { status: 400 });
    }

    const userId = authData.user.id;

    // STEP 2: Insert seller record
    const { error: sellerError } = await supabaseAdmin.from("sellers").insert({
      id: userId,
      email,
      business_name,
      whatsapp_number,
    });

    if (sellerError) {
      console.error("Seller insert error:", sellerError);

      // Clean up: delete the auth user if seller insert fails
      try {
        await supabaseAdmin.auth.admin.deleteUser(userId);
      } catch (deleteError) {
        console.error(
          "Error deleting user after seller insert failure:",
          deleteError,
        );
      }

      return Response.json({ error: sellerError.message }, { status: 400 });
    }

    // Success
    return Response.json({
      success: true,
      userId,
      email,
    });
  } catch (error) {
    console.error("Register API error:", error);
    return Response.json(
      { error: error.message || "Registration failed" },
      { status: 500 },
    );
  }
}
