import { test } from "node:test";
import assert from "node:assert/strict";
import {
  ENTITIES,
  ValidationError,
  parseBody,
  parseListQuery,
  selectList,
} from "./entities.js";

const QID = "1b4e28ba-2fa1-11d2-883f-0016d3cca427";

test("responses use frontend field names, dates as text", () => {
  const list = selectList(ENTITIES.quarter);
  assert.match(list, /"accent_color_snapshot" AS "accent_color"/);
  assert.match(list, /"theme_snapshot" AS "theme"/);
  assert.match(list, /"start_date"::text AS "start_date"/);
});

test("create maps frontend names to columns", () => {
  const pairs = parseBody(
    ENTITIES.quarter,
    {
      name: "Q4 2026",
      start_date: "2026-10-01",
      end_date: "2026-12-31",
      accent_color: "blue",
    },
    { mode: "create" },
  );
  assert.deepEqual(Object.fromEntries(pairs).accent_color_snapshot, "blue");
});

test("unknown fields are rejected, not silently dropped", () => {
  // The exact mismatches that used to lose data.
  assert.throws(
    () =>
      parseBody(
        ENTITIES.activity,
        { completed_date: "2026-10-12T10:00:00Z" },
        { mode: "update" },
      ),
    ValidationError,
  );
  assert.throws(
    () =>
      parseBody(
        ENTITIES.activity,
        { quarter_id: QID, date: "2026-10-12", title: "x", recurrence_id: "r" },
        { mode: "create" },
      ),
    /Unknown field/,
  );
  assert.throws(
    () => parseBody(ENTITIES.goal, { user_id: "someone" }, { mode: "update" }),
    /Unknown field/,
  );
});

test("values are type-checked", () => {
  const bad = [
    [ENTITIES.activity, { completed: "yes" }],
    [ENTITIES.activity, { date: "2026-02-30" }],
    [ENTITIES.goal, { status: "done" }],
    [ENTITIES.goal, { title: null }],
    [ENTITIES.goal, { title: "x".repeat(10001) }],
  ];
  for (const [config, body] of bad) {
    assert.throws(() => parseBody(config, body, { mode: "update" }), ValidationError);
  }
  assert.doesNotThrow(() =>
    parseBody(
      ENTITIES.activity,
      { completed: true, completion_timestamp: null },
      { mode: "update" },
    ),
  );
});

test("required fields on create, immutable quarter_id on update", () => {
  assert.throws(
    () => parseBody(ENTITIES.goal, { title: "x" }, { mode: "create" }),
    /"quarter_id" is required/,
  );
  assert.throws(
    () => parseBody(ENTITIES.goal, { quarter_id: QID }, { mode: "update" }),
    /cannot be changed/,
  );
  assert.throws(
    () => parseBody(ENTITIES.goal, {}, { mode: "update" }),
    /No fields/,
  );
});

test("list query: filters, sort, limit", () => {
  const q = parseListQuery(ENTITIES.activity, {
    "...entity": "activity",
    quarter_id: QID,
    completed: "false",
    sort: "-date",
    limit: "50",
  });
  assert.deepEqual(q.filters, [
    ["quarter_id", QID],
    ["completed", false],
  ]);
  assert.equal(q.sortColumn, "date");
  assert.equal(q.sortDir, "DESC");
  assert.equal(q.limit, 50);

  const def = parseListQuery(ENTITIES.quarter, {});
  assert.deepEqual([def.sortColumn, def.sortDir], ["start_date", "DESC"]);

  assert.throws(() => parseListQuery(ENTITIES.quarter, { sort: "-created_date" }), ValidationError);
  assert.throws(() => parseListQuery(ENTITIES.goal, { title: "x" }), ValidationError);
  assert.throws(() => parseListQuery(ENTITIES.goal, { limit: "0" }), ValidationError);
  assert.throws(() => parseListQuery(ENTITIES.goal, { quarter_id: "nope" }), ValidationError);
});
