import { neon } from "@neondatabase/serverless";
import { fromNodeHeaders } from "better-auth/node";
import { auth } from "../auth.js";

export const sql = neon(process.env.DATABASE_URL);

// Resolves the signed-in user's id, or sends a 401 and returns null.
export async function requireUserId(req, res) {
  const session = await auth.api.getSession({
    headers: fromNodeHeaders(req.headers),
  });
  if (!session) {
    res.status(401).json({ error: "Not authenticated" });
    return null;
  }
  return session.user.id;
}

// Client errors (validation) get their message; anything else is logged
// server-side without request bodies (they hold user content) and answered
// with a generic message so DB details never reach the browser.
export function sendError(res, req, error) {
  if (error?.status && error.status < 500) {
    return res.status(error.status).json({ error: error.message });
  }
  // Postgres unique violation, e.g. a second active quarter (see
  // db/migrations/001_google_only_and_integrity.sql).
  if (error?.code === "23505") {
    return res.status(409).json({ error: "That conflicts with existing data" });
  }
  console.error(`[api] ${req.method} ${req.url?.split("?")[0]} failed:`, error);
  return res.status(500).json({ error: "Something went wrong" });
}
