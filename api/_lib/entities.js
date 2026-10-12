// Single source of truth for the entity API: which fields exist, what the
// frontend calls them, which DB column backs each one, and what values are
// allowed. Must match db/schema.sql.
//
// The API is strict on purpose. Unknown fields and bad values are rejected
// with a 400 rather than silently dropped, so a frontend/backend naming
// mismatch fails loudly the first time it's exercised instead of quietly
// losing data.
//
// Files under api/_lib are shared modules, not routes (Vercel skips paths
// starting with "_").

const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;

export const MAX_TEXT_LENGTH = 10000;
export const MAX_BULK_RECORDS = 500;
export const MAX_LIST_LIMIT = 1000;

export function isUuid(value) {
  return typeof value === "string" && UUID_RE.test(value);
}

function isValidDate(value) {
  if (typeof value !== "string" || !DATE_RE.test(value)) return false;
  const d = new Date(`${value}T00:00:00Z`);
  return !Number.isNaN(d.getTime()) && d.toISOString().startsWith(value);
}

// Field types. `check` returns true for an acceptable non-null value.
const TYPES = {
  text: (v) => typeof v === "string" && v.length <= MAX_TEXT_LENGTH,
  uuid: isUuid,
  date: isValidDate,
  boolean: (v) => typeof v === "boolean",
  timestamptz: (v) =>
    typeof v === "string" && !Number.isNaN(new Date(v).getTime()),
};

// Field options:
//   column    DB column (defaults to the field name)
//   type      key of TYPES
//   required  must be present (and non-null) on create
//   nullable  may be set to null
//   enum      allowed values
//   filter    may be used as an equality filter on list
//   sort      may be used to sort lists
//   immutable may be set on create but not changed by update
export const ENTITIES = {
  quarter: {
    table: "quarters",
    fields: {
      name: { type: "text", required: true },
      start_date: { type: "date", required: true, filter: true, sort: true },
      end_date: { type: "date", required: true, filter: true, sort: true },
      status: {
        type: "text",
        enum: ["active", "completed"],
        filter: true,
        sort: true,
      },
      theme: { column: "theme_snapshot", type: "text" },
      accent_color: { column: "accent_color_snapshot", type: "text" },
      quarter_reflection: { type: "text", nullable: true },
    },
    defaultSort: ["start_date", "DESC"],
  },

  goal: {
    table: "goals",
    fields: {
      quarter_id: {
        type: "uuid",
        required: true,
        filter: true,
        immutable: true,
      },
      title: { type: "text", required: true, sort: true },
      description: { type: "text" },
      status: {
        type: "text",
        enum: ["active", "completed", "abandoned"],
        filter: true,
        sort: true,
      },
      completed_date: { type: "date", nullable: true, sort: true },
      abandoned_date: { type: "date", nullable: true, sort: true },
    },
    defaultSort: ["title", "ASC"],
  },

  activity: {
    table: "activities",
    fields: {
      quarter_id: {
        type: "uuid",
        required: true,
        filter: true,
        immutable: true,
      },
      date: { type: "date", required: true, filter: true, sort: true },
      title: { type: "text", required: true, sort: true },
      description: { type: "text" },
      completed: { type: "boolean", filter: true },
      completion_timestamp: {
        type: "timestamptz",
        nullable: true,
        sort: true,
      },
      recurrence_group: { type: "text", nullable: true, filter: true },
    },
    defaultSort: ["date", "ASC"],
  },
};

export class ValidationError extends Error {
  constructor(message) {
    super(message);
    this.status = 400;
  }
}

export function getEntity(name) {
  return Object.prototype.hasOwnProperty.call(ENTITIES, name)
    ? ENTITIES[name]
    : null;
}

function column(config, field) {
  return config.fields[field].column || field;
}

// SELECT / RETURNING list that hands rows back under the frontend's field
// names. DATE columns are cast to text so they always arrive as plain
// "yyyy-MM-dd" strings, whatever the driver's type parsing does.
export function selectList(config) {
  const parts = [`"id"`];
  for (const [field, spec] of Object.entries(config.fields)) {
    const col = `"${column(config, field)}"`;
    const expr = spec.type === "date" ? `${col}::text` : col;
    parts.push(`${expr} AS "${field}"`);
  }
  return parts.join(", ");
}

function checkValue(field, spec, value) {
  if (value === null) {
    if (!spec.nullable) throw new ValidationError(`"${field}" cannot be null`);
    return;
  }
  if (!TYPES[spec.type](value)) {
    throw new ValidationError(`"${field}" must be a valid ${spec.type}`);
  }
  if (spec.enum && !spec.enum.includes(value)) {
    throw new ValidationError(
      `"${field}" must be one of: ${spec.enum.join(", ")}`,
    );
  }
}

// Validates a create/update body and returns [[column, value], ...].
export function parseBody(config, body, { mode }) {
  if (!body || typeof body !== "object" || Array.isArray(body)) {
    throw new ValidationError("Request body must be a JSON object");
  }

  const unknown = Object.keys(body).filter(
    (k) => !Object.prototype.hasOwnProperty.call(config.fields, k),
  );
  if (unknown.length) {
    throw new ValidationError(`Unknown field(s): ${unknown.join(", ")}`);
  }

  const out = [];
  for (const [field, value] of Object.entries(body)) {
    if (value === undefined) continue;
    const spec = config.fields[field];
    if (mode === "update" && spec.immutable) {
      throw new ValidationError(`"${field}" cannot be changed`);
    }
    checkValue(field, spec, value);
    out.push([column(config, field), value]);
  }

  if (mode === "create") {
    for (const [field, spec] of Object.entries(config.fields)) {
      if (spec.required && (body[field] === undefined || body[field] === null))
        throw new ValidationError(`"${field}" is required`);
    }
  }

  if (mode === "update" && out.length === 0) {
    throw new ValidationError("No fields to update");
  }

  return out;
}

// Reserved query keys. `path` / `...entity` are injected by Vercel routing.
const ROUTING_KEYS = new Set(["path", "...entity", "entity"]);

// Parses list query params: equality filters on filterable fields, plus
// optional `sort` ("field" or "-field") and `limit`.
export function parseListQuery(config, query) {
  const filters = [];
  let sort = config.defaultSort;
  let limit = null;

  for (const [key, raw] of Object.entries(query || {})) {
    if (ROUTING_KEYS.has(key)) continue;
    const value = Array.isArray(raw) ? raw[raw.length - 1] : raw;

    if (key === "sort") {
      const desc = value.startsWith("-");
      const field = desc ? value.slice(1) : value;
      if (!config.fields[field]?.sort && field !== "id") {
        throw new ValidationError(`Cannot sort by "${field}"`);
      }
      sort = [field, desc ? "DESC" : "ASC"];
      continue;
    }

    if (key === "limit") {
      const n = Number(value);
      if (!Number.isInteger(n) || n < 1 || n > MAX_LIST_LIMIT) {
        throw new ValidationError(
          `"limit" must be an integer from 1 to ${MAX_LIST_LIMIT}`,
        );
      }
      limit = n;
      continue;
    }

    const spec = Object.prototype.hasOwnProperty.call(config.fields, key)
      ? config.fields[key]
      : null;
    if (!spec?.filter) {
      throw new ValidationError(`Cannot filter by "${key}"`);
    }
    // Query strings are always text; convert booleans before checking.
    let v = value;
    if (spec.type === "boolean") {
      if (v !== "true" && v !== "false") {
        throw new ValidationError(`"${key}" must be true or false`);
      }
      v = v === "true";
    }
    checkValue(key, spec, v);
    filters.push([column(config, key), v]);
  }

  const [sortField, sortDir] = sort;
  const sortColumn = sortField === "id" ? "id" : column(config, sortField);

  return { filters, sortColumn, sortDir, limit };
}
