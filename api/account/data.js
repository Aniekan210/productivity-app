import { requireUserId, sendError, sql } from "../_lib/http.js";

// DELETE /api/account/data
// Deletes all of the user's quarters, goals and activities and resets
// onboarding, in one transaction. Children go first because the foreign keys
// don't cascade.
export default async function handler(req, res) {
  try {
    if (req.method !== "DELETE") return res.status(405).end();
    const userId = await requireUserId(req, res);
    if (!userId) return;

    await sql.transaction([
      sql(`DELETE FROM "activities" WHERE user_id = $1`, [userId]),
      sql(`DELETE FROM "goals" WHERE user_id = $1`, [userId]),
      sql(`DELETE FROM "quarters" WHERE user_id = $1`, [userId]),
      sql(`UPDATE "user" SET onboarded = false WHERE id = $1`, [userId]),
    ]);

    return res.status(204).end();
  } catch (error) {
    return sendError(res, req, error);
  }
}
