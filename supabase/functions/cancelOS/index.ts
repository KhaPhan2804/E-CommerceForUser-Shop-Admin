import "jsr:@supabase/functions-js/edge-runtime.d.ts"; 

const PAYOS_API_URL = "https://api-merchant.payos.vn/v2/payment-requests";
const PAYOS_CLIENT_ID = Deno.env.get("PAYOS_CLIENT_ID");
const PAYOS_API_KEY = Deno.env.get("PAYOS_API_KEY");
const PAYOS_CHECKSUM_KEY = Deno.env.get("PAYOS_CHECKSUM_KEY");

interface CancelPaymentData {
  paymentId: string;
  cancellationReason: string;
  signature?: string;
}

const generateSignature = (data: CancelPaymentData): Promise<string> => {
  if (!PAYOS_CHECKSUM_KEY) {
    throw new Error("PAYOS_CHECKSUM_KEY is undefined.");
  }

  const rawString = `paymentId=${data.paymentId}&cancellationReason=${data.cancellationReason}`;

  const encoder = new TextEncoder();
  const keyData = encoder.encode(PAYOS_CHECKSUM_KEY);
  const dataToSign = encoder.encode(rawString);

  return crypto.subtle
    .importKey("raw", keyData, { name: "HMAC", hash: "SHA-256" }, false, ["sign"])
    .then((cryptoKey) => crypto.subtle.sign("HMAC", cryptoKey, dataToSign))
    .then((signatureBuffer) => {
      const hashArray = Array.from(new Uint8Array(signatureBuffer));
      return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
    });
};

Deno.serve(async (req) => {
  if (req.method !== "POST") {
    return new Response(JSON.stringify({ error: "Method not allowed" }), {
      status: 405,
      headers: { "Content-Type": "application/json" },
    });
  }

  if (!PAYOS_CLIENT_ID || !PAYOS_API_KEY || !PAYOS_CHECKSUM_KEY) {
    return new Response(
      JSON.stringify({ error: "Missing PayOS client ID, API key, or checksum key." }),
      {
        status: 500,
        headers: { "Content-Type": "application/json" },
      }
    );
  }

  console.log("Received a request to cancel payment");

  const body = await req.json();
  console.log("Request body:", body);

  const cancelPaymentData: CancelPaymentData = {
    paymentId: body.paymentId,
    cancellationReason: body.cancellationReason,
  };

  try {
    cancelPaymentData.signature = await generateSignature(cancelPaymentData);
  } catch (error) {
    console.error("Error generating signature:", error);
    return new Response(JSON.stringify({ error: "Error generating signature" }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }

  try {
    const response = await fetch(`${PAYOS_API_URL}/${cancelPaymentData.paymentId}/cancel`, {
      method: 'POST',
      headers: {
        "Content-Type": "application/json",
        "x-client-id": PAYOS_CLIENT_ID,
        "x-api-key": PAYOS_API_KEY,
      },
      body: JSON.stringify(cancelPaymentData),
    });

    const responseData = await response.json();
    if (!response.ok) {
      return new Response(JSON.stringify({ error: "Payment cancel request failed", details: responseData }), {
        status: 500,
        headers: { "Content-Type": "application/json" },
      });
    }

    return new Response(JSON.stringify(responseData), {
      headers: { "Content-Type": "application/json" },
    });

  } catch (error) {
    console.error("Error cancelling payment:", error);
    return new Response(JSON.stringify({ error: "Something went wrong during cancellation" }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
});
