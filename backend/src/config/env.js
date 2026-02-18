const path = require("path");
const dotenv = require("dotenv");
const { z } = require("zod");

dotenv.config({ path: path.resolve(process.cwd(), ".env") });

function parseCorsOrigins(raw) {
  return Array.from(
    new Set(
      String(raw || "")
        .split(",")
        .map((origin) => origin.trim().replace(/\/+$/, ""))
        .filter(Boolean),
    ),
  );
}

function isValidCorsOrigin(origin) {
  try {
    const url = new URL(origin);
    return (
      (url.protocol === "http:" || url.protocol === "https:") &&
      url.origin === origin
    );
  } catch (_) {
    return false;
  }
}

const envSchema = z.object({
  NODE_ENV: z
    .enum(["development", "test", "production"])
    .default("development"),
  PORT: z.coerce.number().int().positive().default(8080),
  DATABASE_URL: z.string().min(1),
  JWT_ACCESS_SECRET: z.string().min(32),
  JWT_REFRESH_SECRET: z.string().min(32),
  JWT_ACCESS_EXPIRES_IN: z.string().default("15m"),
  JWT_REFRESH_EXPIRES_IN: z.string().default("7d"),
  PASSWORD_RESET_TOKEN_TTL_MINUTES: z.coerce.number().int().min(5).max(180).default(30),
  GEMINI_API_KEY: z.string().min(20).optional(),
  GEMINI_MODEL: z.string().default("gemini-2.5-flash"),
  OPENAI_API_KEY: z.string().min(20).optional(),
  OPENAI_MODEL: z.string().default("gpt-4o-mini"),
  COOKIE_SECRET: z.string().min(16),
  CORS_ORIGIN: z.string().min(1),
  RATE_LIMIT_WINDOW_MS: z.coerce.number().int().positive().default(900000),
  RATE_LIMIT_MAX: z.coerce.number().int().positive().default(100),
  AUTH_RATE_LIMIT_MAX: z.coerce.number().int().positive().default(5),
  BCRYPT_ROUNDS: z.coerce.number().int().min(8).max(15).default(12),
  LOG_LEVEL: z
    .enum(["fatal", "error", "warn", "info", "debug", "trace", "silent"])
    .default("info"),
});

const parsed = envSchema.safeParse(process.env);
if (!parsed.success) {
  // eslint-disable-next-line no-console
  console.error(
    "Invalid environment configuration:",
    parsed.error.flatten().fieldErrors,
  );
  process.exit(1);
}

const config = parsed.data;
const corsOrigins = parseCorsOrigins(config.CORS_ORIGIN);

if (!corsOrigins.length || corsOrigins.some((origin) => !isValidCorsOrigin(origin))) {
  // eslint-disable-next-line no-console
  console.error(
    "Invalid environment configuration:",
    {
      CORS_ORIGIN: [
        "Must be one or more comma-separated origins, e.g. http://localhost:5173,https://your-app.vercel.app",
      ],
    },
  );
  process.exit(1);
}

config.isProduction = config.NODE_ENV === "production";
config.corsOrigins = corsOrigins;
config.primaryCorsOrigin = corsOrigins[0];
config.cookie = {
  httpOnly: true,
  sameSite: config.isProduction ? "none" : "lax",
  secure: config.isProduction,
  path: "/api/auth/refresh",
};

module.exports = config;
