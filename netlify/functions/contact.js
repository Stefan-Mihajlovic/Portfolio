export async function handler(event) {
  if (event.httpMethod !== "POST") {
    return { statusCode: 405, body: "Method Not Allowed" };
  }

  let data = {};
  try {
    data = JSON.parse(event.body || "{}");
  } catch {}

  if (data.website) {
    return { statusCode: 200, body: JSON.stringify({ ok: true }) };
  }

  if (!data.name || !data.email || !data.message) {
    return { statusCode: 400, body: JSON.stringify({ ok: false }) };
  }

  const res = await fetch(process.env.N8N_WEBHOOK_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "X-Form-Token": process.env.FORM_TOKEN,
    },
    body: JSON.stringify(data),
  });

  if (!res.ok) {
    return { statusCode: 500, body: JSON.stringify({ ok: false }) };
  }

  return { statusCode: 200, body: JSON.stringify({ ok: true }) };
}
