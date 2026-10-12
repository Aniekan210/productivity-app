import { betterAuth } from "better-auth";
import { Pool } from "@neondatabase/serverless";

// Google is the only sign-in method. No email/password, so no emails, codes
// or password resets are ever sent.
export const auth = betterAuth({
  database: new Pool({
    connectionString: process.env.DATABASE_URL,
  }),

  baseURL: process.env.BETTER_AUTH_URL,

  user: {
    additionalFields: {
      theme: { type: "string", required: false },
      primary: { type: "string", required: false, fieldName: "primary_color" },
      background: { type: "string", required: false },
      textOnPrimary: {
        type: "string",
        required: false,
        fieldName: "text_on_primary",
      },
      font: { type: "string", required: false },
      radius: { type: "string", required: false },
      timezone: { type: "string", required: false },
      onboarded: { type: "boolean", required: false, defaultValue: false },
    },
  },

  emailAndPassword: {
    enabled: false,
  },

  socialProviders: {
    google: {
      clientId: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    },
  },
});

export default {
  async fetch(request) {
    const url = new URL(request.url);

    const originalPath = url.searchParams.get("path");

    if (originalPath) {
      url.pathname = `/api/auth/${originalPath}`;
      url.searchParams.delete("path");
    }

    return auth.handler(new Request(url.toString(), request));
  },
};
