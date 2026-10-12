import { randomUUID } from "node:crypto";
import { ENTITIES, ValidationError, parseBody } from "../_lib/entities.js";
import { requireUserId, sendError, sql } from "../_lib/http.js";

// POST /api/account/onboard
// {
//   appearance: { theme, primary, background, textOnPrimary, radius, font },
//   timezone,
//   quarter: { name, start_date, end_date },
//   goals: ["title", ...],
//   activities: [{ title, date }, ...]
// }
//
// Saves settings, the first quarter, and starter goals/activities in ONE
// transaction: either everything is saved or nothing is. Inserts are guarded
// on the user not being onboarded yet, so a double submit or retry can't
// create a second quarter.

const APPEARANCE_COLUMNS = {
  theme: "theme",
  primary: "primary_color",
  background: "background",
  textOnPrimary: "text_on_primary",
  radius: "radius",
  font: "font",
};
const MAX_SETTING_LENGTH = 64;
const MAX_STARTER_ITEMS = 50;

function setting(name, value) {
  if (value === undefined || value === null) return null;
  if (typeof value !== "string" || value.length > MAX_SETTING_LENGTH) {
    throw new ValidationError(`"${name}" must be a short string`);
  }
  return value;
}

function titles(name, list) {
  if (list === undefined) return [];
  if (!Array.isArray(list) || list.length > MAX_STARTER_ITEMS) {
    throw new ValidationError(
      `"${name}" must be an array of at most ${MAX_STARTER_ITEMS} items`,
    );
  }
  return list;
}

export default async function handler(req, res) {
  try {
    if (req.method !== "POST") return res.status(405).end();
    const userId = await requireUserId(req, res);
    if (!userId) return;

    const body = req.body || {};
    const appearance = body.appearance || {};
    const settings = Object.entries(APPEARANCE_COLUMNS).map(([key, col]) => [
      col,
      setting(key, appearance[key]),
    ]);
    const timezone = setting("timezone", body.timezone);

    // Reuse the entity rules so onboarding can't write anything the normal
    // API would reject.
    const quarter = Object.fromEntries(
      parseBody(
        ENTITIES.quarter,
        {
          name: body.quarter?.name,
          start_date: body.quarter?.start_date,
          end_date: body.quarter?.end_date,
        },
        { mode: "create" },
      ),
    );
    const placeholderQuarter = "00000000-0000-0000-0000-000000000000";
    const goalTitles = titles("goals", body.goals).map((title) => {
      parseBody(
        ENTITIES.goal,
        { quarter_id: placeholderQuarter, title },
        { mode: "create" },
      );
      return title;
    });
    const activities = titles("activities", body.activities).map((a) => {
      parseBody(
        ENTITIES.activity,
        { quarter_id: placeholderQuarter, title: a?.title, date: a?.date },
        { mode: "create" },
      );
      return a;
    });

    const quarterId = randomUUID();
    const notOnboarded = `NOT EXISTS (
      SELECT 1 FROM "user" WHERE id = $1 AND onboarded IS TRUE
    )`;

    const results = await sql.transaction(
      [
        // Should be none, but never leave two active quarters behind.
        sql(
          `UPDATE "quarters" SET status = 'completed'
           WHERE user_id = $1 AND status = 'active' AND ${notOnboarded}`,
          [userId],
        ),
        sql(
          `INSERT INTO "quarters"
             (id, user_id, name, start_date, end_date, status,
              theme_snapshot, accent_color_snapshot)
           SELECT $2::uuid, $1, $3, $4::date, $5::date, 'active',
                  COALESCE($6, 'light'), COALESCE($7, 'violet')
           WHERE ${notOnboarded}
           RETURNING id`,
          [
            userId,
            quarterId,
            quarter.name,
            quarter.start_date,
            quarter.end_date,
            appearance.theme ?? null,
            appearance.primary ?? null,
          ],
        ),
        sql(
          `INSERT INTO "goals" (user_id, quarter_id, title, status)
           SELECT $1, $2::uuid, t, 'active'
           FROM unnest($3::text[]) AS t
           WHERE ${notOnboarded}`,
          [userId, quarterId, goalTitles],
        ),
        sql(
          `INSERT INTO "activities" (user_id, quarter_id, date, title, completed)
           SELECT $1, $2::uuid, a.date, a.title, false
           FROM unnest($3::date[], $4::text[]) AS a(date, title)
           WHERE ${notOnboarded}`,
          [
            userId,
            quarterId,
            activities.map((a) => a.date),
            activities.map((a) => a.title),
          ],
        ),
        // Last, so the guards above still see the old onboarded value.
        sql(
          `UPDATE "user" SET
             ${settings.map(([col], i) => `"${col}" = COALESCE($${i + 2}, "${col}")`).join(", ")},
             timezone = COALESCE($${settings.length + 2}, timezone),
             onboarded = true
           WHERE id = $1`,
          [userId, ...settings.map(([, v]) => v), timezone],
        ),
      ],
      { isolationLevel: "Serializable" },
    );

    const created = results[1].length > 0;
    return res.status(created ? 201 : 200).json({
      quarter_id: created ? quarterId : null,
      already_onboarded: !created,
    });
  } catch (error) {
    return sendError(res, req, error);
  }
}
