// /api/log-trap.js

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method Not Allowed" });
  }

  const { price, status, time_stamp } = req.body;
  const SUPABASE_URL = process.env.SUPABASE_URL;
  const SUPABASE_KEY = process.env.SUPABASE_KEY;

  if (!SUPABASE_URL || !SUPABASE_KEY) {
    return res.status(500).json({ error: "Supabase credentials missing" });
  }

  try {
    const response = await fetch(`${SUPABASE_URL}/rest/v1/trap_orders`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "apikey": SUPABASE_KEY,
        "Authorization": `Bearer ${SUPABASE_KEY}`
      },
      body: JSON.stringify({
        price,
        status,
        time_stamp
      })
    });

    if (!response.ok) {
      const error = await response.text();
      return res.status(500).json({ error });
    }

    return res.status(200).json({ message: "Trap order logged successfully" });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
}
