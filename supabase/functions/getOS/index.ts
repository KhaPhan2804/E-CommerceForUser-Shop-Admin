import "jsr:@supabase/functions-js/edge-runtime.d.ts";

const PAYOS_API_URL = "https://api-merchant.payos.vn/v2/payment-requests";
const PAYOS_CLIENT_ID = Deno.env.get("PAYOS_CLIENT_ID");
const PAYOS_API_KEY = Deno.env.get("PAYOS_API_KEY");

// Function to get payment details by payment ID
Deno.serve(async (req) => {
  if (req.method !== "GET") {
    return new Response(
      JSON.stringify({ error: "Method not allowed" }),
      { status: 405, headers: { "Content-Type": "application/json" } }
    );
  }

  const url = new URL(req.url);
  const paymentId = url.pathname.split("/").pop(); 

  if (!paymentId) {
    return new Response(
      JSON.stringify({ error: "Missing payment ID" }),
      { status: 400, headers: { "Content-Type": "application/json" } }
    );
  }

  if (!PAYOS_CLIENT_ID || !PAYOS_API_KEY) {
    return new Response(
      JSON.stringify({ error: "Missing PayOS credentials" }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }

  try {
    const response = await fetch(`${PAYOS_API_URL}/${paymentId}`, {
      method: "GET",
      headers: {
        "Authorization": `Bearer ${PAYOS_API_KEY}`,
        "x-client-id": PAYOS_CLIENT_ID,
        "Content-Type": "application/json",
      },
    });

    if (!response.ok) {
      const responseData = await response.json();
      return new Response(
        JSON.stringify({ error: responseData.error || "Failed to fetch payment details" }),
        { status: 500, headers: { "Content-Type": "application/json" } }
      );
    }

    const paymentDetails = await response.json();
    return new Response(
      JSON.stringify(paymentDetails),
      { headers: { "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Error fetching payment details:", error);
    return new Response(
      JSON.stringify({ error: "Error fetching payment details" }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
});
