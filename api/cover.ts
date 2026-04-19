import type { VercelRequest, VercelResponse } from "@vercel/node";

const FILENAME_RE = /^[a-f0-9]{16}\.png$/;
const UPSTREAM = "https://maimai.wonderhoy.me/api/imageProxy";

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== "GET" && req.method !== "HEAD") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const img = typeof req.query.img === "string" ? req.query.img : "";
  if (!FILENAME_RE.test(img)) {
    return res.status(400).json({ error: "Invalid image filename" });
  }

  try {
    const upstream = await fetch(`${UPSTREAM}?img=${img}`);
    if (!upstream.ok) {
      return res.status(upstream.status).json({ error: "Upstream error" });
    }
    const buf = Buffer.from(await upstream.arrayBuffer());
    res.setHeader("Content-Type", "image/png");
    res.setHeader("Cache-Control", "public, max-age=604800, immutable");
    return res.status(200).send(buf);
  } catch (e) {
    console.error("Cover proxy error:", e);
    return res.status(502).json({ error: "Upstream fetch failed" });
  }
}
