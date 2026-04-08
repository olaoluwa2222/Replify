/**
 * Get Current User
 * Helper function to fetch the authenticated user from Supabase
 */

import { supabase } from "@/lib/supabase";

export async function getUser() {
  try {
    const {
      data: { user },
      error,
    } = await supabase.auth.getUser();

    if (error) {
      console.error("Error fetching user:", error);
      return null;
    }

    return user;
  } catch (error) {
    console.error("Error in getUser:", error);
    return null;
  }
}
