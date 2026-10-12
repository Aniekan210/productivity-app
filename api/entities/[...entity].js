import {
  MAX_BULK_RECORDS,
  ValidationError,
  getEntity,
  isUuid,
  parseBody,
  parseListQuery,
  selectList,
} from "../_lib/entities.js";
import { requireUserId, sendError, sql } from "../_lib/http.js";

// Routes (all scoped to the signed-in user):
//   GET    /api/entities/:entity            list (filters, ?sort=, ?limit=)
//   GET    /api/entities/:entity/:id        one record
//   POST   /api/entities/:entity            create
//   POST   /api/entities/:entity/bulk       create many ({ records: [...] })
//   PATCH  /api/entities/:entity/:id        update
//   DELETE /api/entities/:entity/:id        delete (a quarter takes its goals
//                                           and activities with it)

function notFound(res, message = "Not found") {
  return res.status(404).json({ error: message });
}

// Goals and activities must point at one of the user's own quarters.
async function assertOwnsQuarters(quarterIds, userId) {
  const ids = [...new Set(quarterIds)];
  if (ids.length === 0) return;
  const rows = await sql(
    `SELECT id FROM "quarters" WHERE id = ANY($1::uuid[]) AND user_id = $2`,
    [ids, userId],
  );
  if (rows.length !== ids.length) {
    throw new ValidationError("Quarter not found");
  }
}

// Builds one multi-row INSERT. Records may set different subsets of fields;
// missing ones use the column DEFAULT.
async function insertRecords(config, records, userId) {
  const parsed = records.map((r) => parseBody(config, r, { mode: "create" }));

  if ("quarter_id" in config.fields) {
    await assertOwnsQuarters(
      records.map((r) => r.quarter_id),
      userId,
    );
  }

  const columns = [
    "user_id",
    ...new Set(parsed.flatMap((pairs) => pairs.map(([c]) => c))),
  ];
  const values = [];
  const groups = parsed.map((pairs) => {
    const row = Object.fromEntries(pairs);
    row.user_id = userId;
    const placeholders = columns.map((c) => {
      if (!(c in row)) return "DEFAULT";
      values.push(row[c]);
      return `$${values.length}`;
    });
    return `(${placeholders.join(", ")})`;
  });

  return sql(
    `INSERT INTO "${config.table}" (${columns.map((c) => `"${c}"`).join(", ")})
     VALUES ${groups.join(", ")}
     RETURNING ${selectList(config)}`,
    values,
  );
}

async function list(config, req, userId) {
  const { filters, sortColumn, sortDir, limit } = parseListQuery(
    config,
    req.query,
  );
  const params = [userId, ...filters.map(([, v]) => v)];
  const where = filters
    .map(([col], i) => `AND "${col}" = $${i + 2}`)
    .join(" ");
  let query = `SELECT ${selectList(config)} FROM "${config.table}"
    WHERE user_id = $1 ${where}
    ORDER BY "${sortColumn}" ${sortDir}, id ASC`;
  if (limit) {
    params.push(limit);
    query += ` LIMIT $${params.length}`;
  }
  return sql(query, params);
}

async function update(config, id, body, userId) {
  const pairs = parseBody(config, body, { mode: "update" });
  const values = pairs.map(([, v]) => v);
  const set = pairs.map(([col], i) => `"${col}" = $${i + 1}`).join(", ");
  values.push(id, userId);
  const rows = await sql(
    `UPDATE "${config.table}" SET ${set}
     WHERE id = $${values.length - 1} AND user_id = $${values.length}
     RETURNING ${selectList(config)}`,
    values,
  );
  return rows[0] || null;
}

async function remove(entity, config, id, userId) {
  if (entity === "quarter") {
    // No ON DELETE CASCADE in the schema, so remove children first, in one
    // transaction so a failure can't leave a half-deleted quarter.
    const [, , deleted] = await sql.transaction([
      sql(`DELETE FROM "activities" WHERE quarter_id = $1 AND user_id = $2`, [
        id,
        userId,
      ]),
      sql(`DELETE FROM "goals" WHERE quarter_id = $1 AND user_id = $2`, [
        id,
        userId,
      ]),
      sql(
        `DELETE FROM "quarters" WHERE id = $1 AND user_id = $2 RETURNING id`,
        [id, userId],
      ),
    ]);
    return deleted.length > 0;
  }
  const rows = await sql(
    `DELETE FROM "${config.table}" WHERE id = $1 AND user_id = $2 RETURNING id`,
    [id, userId],
  );
  return rows.length > 0;
}

export default async function handler(req, res) {
  try {
    const userId = await requireUserId(req, res);
    if (!userId) return;

    const rawPath = req.query.path ?? req.query["...entity"] ?? "";
    const segments = (Array.isArray(rawPath) ? rawPath : String(rawPath).split("/"))
      .filter(Boolean);
    const [entity, second, ...rest] = segments;

    const config = getEntity(entity);
    if (!config || rest.length) return notFound(res, "Unknown route");

    if (second === "bulk") {
      if (req.method !== "POST") return res.status(405).end();
      const records = req.body?.records;
      if (!Array.isArray(records) || records.length === 0) {
        throw new ValidationError('"records" must be a non-empty array');
      }
      if (records.length > MAX_BULK_RECORDS) {
        throw new ValidationError(
          `At most ${MAX_BULK_RECORDS} records per request`,
        );
      }
      const rows = await insertRecords(config, records, userId);
      return res.status(201).json(rows);
    }

    // Anything else in the second segment is a record id. Reject non-UUIDs
    // up front (Postgres would otherwise throw a 500 on the cast).
    const id = second;
    if (id !== undefined && !isUuid(id)) return notFound(res);

    switch (req.method) {
      case "GET": {
        if (!id) return res.status(200).json(await list(config, req, userId));
        const rows = await sql(
          `SELECT ${selectList(config)} FROM "${config.table}"
           WHERE id = $1 AND user_id = $2`,
          [id, userId],
        );
        return rows[0] ? res.status(200).json(rows[0]) : notFound(res);
      }

      case "POST": {
        if (id) return res.status(405).end();
        const [row] = await insertRecords(config, [req.body], userId);
        return res.status(201).json(row);
      }

      case "PATCH": {
        if (!id) return res.status(405).end();
        const row = await update(config, id, req.body, userId);
        return row ? res.status(200).json(row) : notFound(res);
      }

      case "DELETE": {
        if (!id) return res.status(405).end();
        const deleted = await remove(entity, config, id, userId);
        return deleted ? res.status(204).end() : notFound(res);
      }

      default:
        return res.status(405).end();
    }
  } catch (error) {
    return sendError(res, req, error);
  }
}
