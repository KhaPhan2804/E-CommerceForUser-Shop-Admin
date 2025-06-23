import "jsr:@supabase/functions-js/edge-runtime.d.ts"

Deno.serve(async (req) => {
  if (req.method !== "POST") {
    return new Response("Method Not Allowed", { status: 405 })
  }

  const body = await req.json()

  const ghtkToken = Deno.env.get("GHTK_TOKEN")

  const ghtkRes = await fetch("https://services.giaohangtietkiem.vn/services/shipment/order", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Token": ghtkToken!,
    },
    body: JSON.stringify(body),
  })

  const result = await ghtkRes.json()

  return new Response(JSON.stringify(result), {
    headers: { "Content-Type": "application/json" },
    status: ghtkRes.status,
  })
})
