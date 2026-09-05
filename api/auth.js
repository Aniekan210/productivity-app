import { betterAuth } from "better-auth";
import { Pool } from "@neondatabase/serverless";
import { Resend } from "resend";
import { emailOTP } from "better-auth/plugins";

const resend = new Resend(process.env.RESEND_API_KEY);

export const auth = betterAuth({
  database: new Pool({
    connectionString: process.env.DATABASE_URL,
  }),

  baseURL: process.env.BETTER_AUTH_URL,

  user: {
    additionalFields: {
      theme: { type: "string", required: false },
      primary: { type: "string", required: false, fieldName: "primary_color" },
      font: { type: "string", required: false },
      radius: { type: "string", required: false },
      timezone: { type: "string", required: false },
      onboarded: { type: "boolean", required: false, defaultValue: false },
    },
  },

  emailAndPassword: {
    enabled: true,

    sendResetPassword: async ({ user, url }) => {
      await resend.emails.send({
        from: "no-reply@aniekan.dev",
        to: user.email,
        subject: "Reset your password",
        html: `<p>Click <a href="${url}">here</a> to reset your password.</p>`,
      });
    },
  },

  emailVerification: {
    autoSignInAfterVerification: true,
  },

  plugins: [
    emailOTP({
      async sendVerificationOTP({ email, otp, type }) {
        if (type === "email-verification") {
          await resend.emails.send({
            from: "no-reply@aniekan.dev",
            to: email,
            subject: "Verify your email",
            html: `<p>Your verification code is: <b>${otp}</b></p>`,
          });
        }
      },
    }),
  ],

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
