import { createClient } from "https://esm.sh/@supabase/supabase-js";
import "jsr:@supabase/functions-js/edge-runtime.d.ts";


const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
const supabaseServiceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

const supabaseAdmin = createClient(supabaseUrl, supabaseServiceRoleKey);

Deno.serve(async (req) => {
  try {
    if (req.method !== "POST") {
      return new Response("Method not allowed", { status: 405 });
    }

    const { email, code, newPassword } = await req.json();

    if (!email || !code || !newPassword) {
      return new Response("Missing fields", { status: 400 });
    }

    const { data, error } = await supabaseAdmin
    .from("ResetPassword")
    .select("VerificationCode, expireTime, userId")
    .eq("email", email)
    .single();

    if (error || !data) {
      return new Response("Invalid email or code", { status: 400 });
    }

    if (data.VerificationCode !== code) {
      return new Response("Invalid verification code", { status: 400 });
    }

    if (new Date(data.expireTime) < new Date()) {
      return new Response("Verification code expired", { status: 400 });
    }

    const { error: updateError } = await supabaseAdmin.auth.admin.updateUserById(data.userId, {
      password: newPassword,
    });

    if (updateError) {
      return new Response("Failed to update password", { status: 500 });
    }

    const { data: signInData, error: signInError } = await supabaseAdmin.auth.signInWithPassword({
      email,
      password: newPassword,
    });

    if (signInError || !signInData.session) {
      return new Response("Failed to create session", { status: 500 });
    }

    return new Response(JSON.stringify(signInData.session), {
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Error in reset password function:", error);
    return new Response("Internal server error", { status: 500 });
  }
});
