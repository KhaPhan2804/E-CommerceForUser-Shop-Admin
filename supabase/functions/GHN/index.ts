Deno.serve(async (req: Request) => {
  if (req.method !== 'POST') {
    return new Response(JSON.stringify({ error: 'Method not allowed' }), {
      status: 405,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  const GHN_API_URL = "https://api.ghn.vn/v1/shipping-order/fee"; // GHN API endpoint
  const GHN_API_KEY = "YOUR_GHN_API_KEY"; // Replace with your actual GHN API key

  try {
    const requestData = await req.json(); // Get the request data from the body

    const response = await fetch(GHN_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Token': GHN_API_KEY, // Include your API key in the headers
      },
      body: JSON.stringify(requestData), // Pass the necessary data for the request
    });

    if (!response.ok) {
      throw new Error(`Error: ${response.statusText}`);
    }

    const result = await response.json();
    return new Response(JSON.stringify(result), {
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    return new Response(JSON.stringify({ error: errorMessage }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
});