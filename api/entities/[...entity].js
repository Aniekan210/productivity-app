import { neon } from "@neondatabase/serverless";
import { auth } from "../auth.js";

const sql = neon(process.env.DATABASE_URL);

const TABLES = {
  quarter: {
    table: "quarters",
    fields: {
      name: "name",
      start_date: "start_date",
      end_date: "end_date",
      status: "status",
      theme: "theme_snapshot",
      theme_snapshot: "theme_snapshot",
      accent_color: "accent_color_snapshot",
      accent_color_snapshot: "accent_color_snapshot",
      quarter_reflection: "quarter_reflection",
    },
  },

  goal: {
    table: "goals",
    fields: {
      quarter_id: "quarter_id",
      title: "title",
      description: "description",
      status: "status",
      completed_date: "completed_date",
      abandoned_date: "abandoned_date",
    },
  },

  activity: {
    table: "activities",
    fields: {
      quarter_id: "quarter_id",
      date: "date",
      title: "title",
      description: "description",
      completed: "completed",
      completion_timestamp: "completion_timestamp",
      recurrence_group: "recurrence_group",
    },
  },
};

// Query keys that are routing/control params, never entity fields or filters.
const RESERVED_QUERY_KEYS = new Set(["path", "...entity", "limit"]);

function mapData(entity, body, userId) {
  const config = TABLES[entity];

  if (!config) {
    throw new Error("Unknown entity");
  }

  const data = {};

  for (const [frontendField, value] of Object.entries(body)) {
    const databaseField = config.fields[frontendField];

    if (databaseField && value !== undefined) {
      data[databaseField] = value;
    }
  }

  data.user_id = userId;

  return data;
}

async function createMany(entity, records, userId) {
  const config = TABLES[entity];

  if (!Array.isArray(records) || records.length === 0) {
    throw new Error("Records must be a non-empty array");
  }

  const mappedRecords = records.map((record) =>
    mapData(entity, record, userId),
  );

  const allColumns = [
    ...new Set(mappedRecords.flatMap((record) => Object.keys(record))),
  ];

  const values = [];
  const valueGroups = [];

  for (const record of mappedRecords) {
    const placeholders = [];

    for (const column of allColumns) {
      values.push(record[column] ?? null);
      placeholders.push(`$${values.length}`);
    }

    valueGroups.push(`(${placeholders.join(", ")})`);
  }

  const columnList = allColumns.map((column) => `"${column}"`).join(", ");

  const query = `
    INSERT INTO "${config.table}" (${columnList})
    VALUES ${valueGroups.join(", ")}
    RETURNING *
  `;

  return await sql(query, values);
}

// Builds WHERE filters and ORDER BY from query params, on top of the
// mandatory user_id scoping. Supports two conventions from the frontend:
//   - "fieldName=value"    -> equality filter (only for known entity fields)
//   - "fieldName" (empty)  -> sort ascending by fieldName
//   - "-fieldName" (empty) -> sort descending by fieldName
function parseListQuery(entity, query) {
  const config = TABLES[entity];
  const filters = [];
  let sortColumn = null;
  let sortDir = "ASC";

  for (const [rawKey, value] of Object.entries(query || {})) {
    if (RESERVED_QUERY_KEYS.has(rawKey)) continue;

    let key = rawKey;
    let descending = false;
    if (key.startsWith("-")) {
      key = key.slice(1);
      descending = true;
    }

    const column = config.fields[key];
    if (!column) continue; // ignore unknown/unsafe keys entirely

    if (value === "" || value === undefined) {
      // no value => this key is a sort directive, not a filter
      sortColumn = column;
      sortDir = descending ? "DESC" : "ASC";
    } else {
      filters.push([column, value]);
    }
  }

  return { filters, sortColumn, sortDir };
}

export default async function handler(req, res) {
  try {
    console.log("ENTITY ROUTE HIT", req.method, req.url, req.query);

    const session = await auth.api.getSession({
      headers: req.headers,
    });

    if (!session) {
      return res.status(401).json({
        error: "Not authenticated",
      });
    }

    const userId = session.user.id;

    const rawPath = req.query.path ?? req.query["...entity"];

    const path = Array.isArray(rawPath) ? rawPath : String(rawPath).split("/");

    const entity = path[0];
    const secondSegment = path[1];

    const config = TABLES[entity];

    if (!config) {
      return res.status(404).json({
        error: "Unknown entity",
      });
    }

    const { table, fields } = config;

    // BULK CREATE
    if (req.method === "POST" && secondSegment === "bulk") {
      const body = req.body || {};

      const rows = await createMany(entity, body.records, userId);

      return res.status(201).json(rows);
    }

    // Entity ID for normal routes
    const id = secondSegment;

    if (path.length > 2) {
      return res.status(404).json({
        error: "Unknown entity operation",
      });
    }

    // GET
    if (req.method === "GET") {
      if (id) {
        const rows = await sql(
          `SELECT * FROM "${table}" WHERE id = $1 AND user_id = $2`,
          [id, userId],
        );
        return res.status(200).json(rows);
      }

      const { filters, sortColumn, sortDir } = parseListQuery(
        entity,
        req.query,
      );

      const params = [userId, ...filters.map(([, value]) => value)];
      const filterClauses = filters
        .map(([column], index) => `AND "${column}" = $${index + 2}`)
        .join(" ");

      let query = `
        SELECT *
        FROM "${table}"
        WHERE user_id = $1
        ${filterClauses}
      `;

      if (sortColumn) {
        query += ` ORDER BY "${sortColumn}" ${sortDir}`;
      }

      const rows = await sql(query, params);

      return res.status(200).json(rows);
    }

    // POST
    if (req.method === "POST") {
      if (id) {
        return res.status(404).json({
          error: "Unknown entity operation",
        });
      }

      const body = req.body || {};
      const data = mapData(entity, body, userId);

      const columns = Object.keys(data);
      const values = Object.values(data);

      const columnList = columns.map((column) => `"${column}"`).join(", ");

      const placeholders = values.map((_, index) => `$${index + 1}`).join(", ");

      const query = `
        INSERT INTO "${table}" (${columnList})
        VALUES (${placeholders})
        RETURNING *
      `;

      const rows = await sql(query, values);

      return res.status(201).json(rows[0]);
    }

    // PATCH
    if (req.method === "PATCH") {
      if (!id) {
        return res.status(400).json({
          error: "ID is required",
        });
      }

      const body = req.body || {};
      const updates = [];

      for (const [frontendField, value] of Object.entries(body)) {
        const databaseField = fields[frontendField];

        if (databaseField && value !== undefined) {
          updates.push([databaseField, value]);
        }
      }

      if (updates.length === 0) {
        return res.status(400).json({
          error: "No valid fields to update",
        });
      }

      const setClause = updates
        .map(([column], index) => `"${column}" = $${index + 1}`)
        .join(", ");

      const values = updates.map(([, value]) => value);

      values.push(id);
      values.push(userId);

      const query = `
        UPDATE "${table}"
        SET ${setClause}
        WHERE id = $${values.length - 1}
        AND user_id = $${values.length}
        RETURNING *
      `;

      const rows = await sql(query, values);

      if (rows.length === 0) {
        return res.status(404).json({
          error: "Entity not found",
        });
      }

      return res.status(200).json(rows[0]);
    }

    // DELETE
    if (req.method === "DELETE") {
      if (!id) {
        return res.status(400).json({
          error: "ID is required",
        });
      }

      const query = `
        DELETE FROM "${table}"
        WHERE id = $1
        AND user_id = $2
      `;

      await sql(query, [id, userId]);

      return res.status(204).end();
    }

    return res.status(405).json({
      error: "Method not allowed",
    });
  } catch (error) {
    console.error("========== ENTITY API ERROR ==========");

    console.error("Method:", req.method);

    console.error("Query:", req.query);

    console.error("Body:", JSON.stringify(req.body, null, 2));

    console.error("Error:", error);

    console.error("======================================");

    return res.status(500).json({
      error: error.message || "Internal server error",
    });
  }
}
