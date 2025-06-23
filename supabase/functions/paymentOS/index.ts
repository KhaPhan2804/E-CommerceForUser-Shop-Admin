import "jsr:@supabase/functions-js/edge-runtime.d.ts";

const PAYOS_API_URL = "https://api-merchant.payos.vn/v2/payment-requests";
const PAYOS_CLIENT_ID = Deno.env.get("PAYOS_CLIENT_ID");
const PAYOS_API_KEY = Deno.env.get("PAYOS_API_KEY");
const PAYOS_CHECKSUM_KEY = Deno.env.get("PAYOS_CHECKSUM_KEY");

const YOUR_DOMAIN = "https://1dd7-2001-ee0-4d45-7a30-41f2-8377-b2f6-ca16.ngrok-free.app";  // This should be your deep link scheme


interface PaymentData {
  orderCode: number;
  amount: number;
  description: string;
  items: Array<{ name: string; quantity: number; price: number }>;
  returnUrl: string;
  cancelUrl: string;
  signature?: string;
}


const generateSignature = (data: PaymentData): Promise<string> => {
  if (!PAYOS_CHECKSUM_KEY) {
    throw new Error("PAYOS_CHECKSUM_KEY is undefined.");
  }

  const rawString = `amount=${data.amount}&cancelUrl=${data.cancelUrl}&description=${data.description}&orderCode=${data.orderCode}&returnUrl=${data.returnUrl}`;

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

  console.log("Received a request to create a payment link");

  const body = await req.json();
  console.log("Request body:", body);

  // Declare and initialize paymentData before usage
  const paymentData: PaymentData = {
    orderCode: Number(String(Date.now()).slice(-6)),
    amount: body.amount || 10000,
    description: body.description || "Thanh toan don hang",
    items: body.items || [
      {
        name: "Mì tôm Hảo Hảo ly",
        quantity: 1,
        price: 10000,
      },
    ],
    returnUrl: `${YOUR_DOMAIN}/payment-success?success=true&orderCode=${Date.now()}`,  // Use the current order code
    cancelUrl: `${YOUR_DOMAIN}/payment-cancel?success=false&orderCode=${Date.now()}`,  // Use the current order code
  };

  try {
    paymentData.signature = await generateSignature(paymentData);
  } catch (error) {
    console.error("Error generating signature:", error);
    return new Response(JSON.stringify({ error: "Error generating signature" }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }

  try {
    const response = await fetch(PAYOS_API_URL, {
      method: 'POST',
      headers: {
        "Content-Type": "application/json",
        "x-client-id": PAYOS_CLIENT_ID,
        "x-api-key": PAYOS_API_KEY,
      },
      body: JSON.stringify(paymentData),
    });

    const responseData = await response.json();
    if (!response.ok) {
      return new Response(JSON.stringify({ error: "Payment request failed" }), {
        status: 500,
        headers: { "Content-Type": "application/json" },
      });
    }

    return new Response(JSON.stringify(responseData), {
      headers: { "Content-Type": "application/json" },
    });

  } catch (error) {
    console.error("Error creating payment link:", error);
    return new Response(JSON.stringify({ error: "Something went wrong" }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
});
