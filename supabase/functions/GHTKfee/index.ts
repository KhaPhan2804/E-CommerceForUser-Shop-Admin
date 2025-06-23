import "jsr:@supabase/functions-js/edge-runtime.d.ts";

Deno.serve(async (req) => {
  if (req.method !== "POST") {
    return new Response("Method Not Allowed", { status: 405 });
  }

  const body = await req.json();

  const ghtkToken = Deno.env.get("GHTK_TOKEN");

  if (!ghtkToken) {
    return new Response(
      JSON.stringify({ success: false, message: "Missing GHTK API token" }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }

  const params = new URLSearchParams({
    pick_province: body.pick_province,
    pick_district: body.pick_district,
    province: body.province,
    district: body.district,
    address: body.address,
    weight: body.weight.toString(),  
    value: body.value.toString(),    
    transport: body.transport,
    deliver_option: body.deliver_option || "none", 
    tags: body.tags ? body.tags.join(',') : '',
  });

  const ghtkRes = await fetch(`https://services.giaohangtietkiem.vn/services/shipment/fee?${params}`, {
    method: "GET",
    headers: {
      "Token": ghtkToken,
      "X-Client-Source": "S22906071", 
    },
  });

  const result = await ghtkRes.json();

  return new Response(JSON.stringify(result), {
    headers: { "Content-Type": "application/json" },
    status: ghtkRes.status,
  });
});
