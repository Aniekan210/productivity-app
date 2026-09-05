// api/entities/[entity].js
import { neon } from "@neondatabase/serverless";
import { auth } from "../auth/[...all].js";

const sql = neon(process.env.DATABASE_URL);
const TABLES = { quarter: "quarters", goal: "goals", activity: "activities" };

export default async function handler(req, res) {
  const session = await auth.api.getSession({ headers: req.headers });
  if (!session) return res.status(401).json({ error: "Not authenticated" });
  const userId = session.user.id;

  const { entity, id } = req.query;
  const table = TABLES[entity];
  if (!table) return res.status(404).json({ error: "Unknown entity" });

  if (req.method === "GET") {
    const rows = id
      ? await sql`SELECT * FROM ${sql(table)} WHERE id = ${id} AND user_id = ${userId}`
      : await sql`SELECT * FROM ${sql(table)} WHERE user_id = ${userId}`;
    return res.json(rows);
  }

  if (req.method === "POST") {
    const row = await sql`
      INSERT INTO ${sql(table)} ${sql({ ...req.body, user_id: userId })}
      RETURNING *`;
    return res.json(row[0]);
  }

  if (req.method === "PATCH") {
    const row = await sql`
      UPDATE ${sql(table)} SET ${sql(req.body)}
      WHERE id = ${id} AND user_id = ${userId}
      RETURNING *`;
    return res.json(row[0]);
  }

  if (req.method === "DELETE") {
    await sql`DELETE FROM ${sql(table)} WHERE id = ${id} AND user_id = ${userId}`;
    return res.status(204).end();
  }

  res.status(405).end();
}
