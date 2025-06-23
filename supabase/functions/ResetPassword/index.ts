import { createClient } from "https://esm.sh/@supabase/supabase-js";
import "jsr:@supabase/functions-js/edge-runtime.d.ts";

const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const sendGridApiKey = Deno.env.get("SENDGRID_API")!;

const supabase = createClient(supabaseUrl, supabaseKey);

Deno.serve(async (req) => {
  try {
    const { email } = await req.json();

    if (!email) {
      return new Response(JSON.stringify({ error: "Email is required" }), { status: 400 });
    }

     const { data: userRecord, error: userError } = await supabase
      .from("Khachhang")
      .select("userID")  
      .eq("email", email)
      .single();

    if (userError || !userRecord) {
      return new Response(JSON.stringify({ error: "User not found" }), { status: 404 });
    }

    const userId = userRecord.userID;

    const VerificationCode = Math.floor(100000 + Math.random() * 900000).toString();
    const expireTime = new Date(Date.now() + 10 * 60 * 1000).toISOString();
    const createdTime = new Date().toISOString();

    const { data: existingRecord, error: fetchError } = await supabase
    .from("ResetPassword")
    .select("email")
    .eq("email", email)
    .single();

    if (fetchError && fetchError.code !== 'PGRST116') {
      console.log("Fetch error:", fetchError);
      return new Response(JSON.stringify({ error: fetchError.message }), { status: 500 });
    }

    if (existingRecord) {
      const { error: updateError } = await supabase
        .from("ResetPassword")
        .update({ VerificationCode, expireTime, createdTime })
        .eq("email", email);

      if (updateError) {
        console.log("Update error:", updateError);
        return new Response(JSON.stringify({ error: updateError.message }), { status: 500 });
      }
    } else {
      const { error: insertError } = await supabase
        .from("ResetPassword")
        .insert({ email, VerificationCode, expireTime, createdTime, userId: userId  });

      if (insertError) {
        console.log("Insert error:", insertError);
        return new Response(JSON.stringify({ error: insertError.message }), { status: 500 });
      }
    }

    const sendGridResponse = await fetch("https://api.sendgrid.com/v3/mail/send", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${sendGridApiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        personalizations: [
          {
            to: [{ email }],
            subject: "Your Password Reset Verification Code",
          },
        ],
        from: {
          email: "kha.pa.63cntt@ntu.edu.vn", 
          name: "CDTN",
        },
        content: [
          {
            type: "text/plain",
            value: `Đây là mã xác thực của bạnbạn: ${VerificationCode}. Mã này sẽ hết hạn trong 10 phút.`,
          },
        ],
      }),
    });

    if (!sendGridResponse.ok) {
      const errorData = await sendGridResponse.json();
      console.log("SendGrid error:", errorData);
      return new Response(JSON.stringify({ error: "Failed to send verification email" }), { status: 500 });
    }

    return new Response(
      JSON.stringify({ message: "Mã xác thực đã gửi tới email của bạn!" }),
      { status: 200, headers: { "Content-Type": "application/json" } }
    );

  } catch (err) {
    console.log("Edge function error:", err);
    return new Response(JSON.stringify({ error: "Internal Server Error" }), { status: 500 });
  }
});
