import type { VercelRequest, VercelResponse } from "@vercel/node";

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const pwd = process.env.DASHBOARD_PASSWORD;
  const auth = req.headers.authorization?.replace("Bearer ", "");
  if (pwd && auth !== pwd) {
    return res.status(401).json({ error: "Unauthorized" });
  }

  return res.status(200).json({ status: "ok" });
}
