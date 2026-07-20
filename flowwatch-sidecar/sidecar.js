import fs from "fs";
import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";
import { createFlowwatch, createSidecarRouter } from "@pranshulsoni/flowwatch";

// Load dotenv from root
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, "..");
dotenv.config({ path: path.resolve(rootDir, ".env") });

const dbUrl = process.env.PRISM_DATABASE_URL;
if (!dbUrl) {
  console.error("[ERROR] PRISM_DATABASE_URL is not defined in .env");
  process.exit(1);
}

const redisUrl = process.env.REDIS_URL || "redis://127.0.0.1:6379";

// Load Google OAuth secret JSON if present
let googleClientId = process.env.GOOGLE_CLIENT_ID || "";
let googleClientSecret = process.env.GOOGLE_CLIENT_SECRET || "";

const secretsDir = path.resolve(rootDir, "secrets");
if (fs.existsSync(secretsDir)) {
  const secretFiles = fs.readdirSync(secretsDir).filter((f) => f.endsWith(".json"));
  if (secretFiles.length > 0) {
    try {
      const secretPath = path.join(secretsDir, secretFiles[0]);
      const secretData = JSON.parse(fs.readFileSync(secretPath, "utf-8"));
      if (secretData.web) {
        googleClientId = secretData.web.client_id || googleClientId;
        googleClientSecret = secretData.web.client_secret || googleClientSecret;
        console.log(`[Auth] Loaded Google OAuth credentials from secrets/${secretFiles[0]}`);
      }
    } catch (e) {
      console.warn("[Auth Warning] Could not parse secrets JSON file:", e.message);
    }
  }
}

const authConfig = {
  jwtSecret: process.env.JWT_SECRET || "prism_flowwatch_super_secret_jwt_key_2026_prism",
  rateLimit: { redisUrl },
  oauth:
    googleClientId && googleClientSecret
      ? {
          google: {
            clientId: googleClientId,
            clientSecret: googleClientSecret,
            callbackUrl: `http://localhost:9400/auth/oauth/google/callback`,
          },
        }
      : undefined,
};

console.log("Starting FlowWatch sidecar connected to PostgreSQL and Redis...");
const fw = await createFlowwatch({
  db: { connectionString: dbUrl },
  redis: { url: redisUrl },
  migrations: { autoRun: true },
  runtime: { serviceName: "prism-backend", environment: "development" },
  security: { headers: false },
  auth: authConfig,
});

const app = express();

// 1. Enable CORS for all origins
app.use(cors({ origin: "*", credentials: true }));
app.use(express.json());

// 2. Intercept response headers to ensure permissive CSP & CORS for Chrome DevTools
app.use((req, res, next) => {
  const originalSetHeader = res.setHeader;
  res.setHeader = function (name, value) {
    if (typeof name === "string" && name.toLowerCase() === "content-security-policy") {
      return originalSetHeader.call(
        this,
        "Content-Security-Policy",
        "default-src * 'unsafe-inline' 'unsafe-eval' data: blob:; connect-src * 'unsafe-inline' http: https: ws: wss:; script-src * 'unsafe-inline' 'unsafe-eval'; style-src * 'unsafe-inline';"
      );
    }
    return originalSetHeader.call(this, name, value);
  };

  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "*");
  res.setHeader(
    "Content-Security-Policy",
    "default-src * 'unsafe-inline' 'unsafe-eval' data: blob:; connect-src * 'unsafe-inline' http: https: ws: wss:; script-src * 'unsafe-inline' 'unsafe-eval'; style-src * 'unsafe-inline';"
  );
  if (req.method === "OPTIONS") {
    res.sendStatus(200);
    return;
  }
  next();
});

// 3. Handle Chrome DevTools appspecific metadata request
app.get("/.well-known/appspecific/com.chrome.devtools.json", (req, res) => {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.json({});
});

// 4. Request Tracing Middleware
app.use(fw.requestTracer);

// 5. Mount Auth Router under /auth if enabled
if (fw.auth?.router) {
  console.log("[Auth] FlowWatch authentication router mounted under /auth");

  // Intercept Google OAuth callback response to redirect directly to frontend app dashboard
  app.get("/auth/oauth/google/callback", (req, res, next) => {
    const originalJson = res.json;
    res.json = function (body) {
      if (body && body.tokens && body.tokens.accessToken) {
        const user = body.user || {};
        const token = body.tokens.accessToken;
        const redirectUrl = `http://localhost:5173/oauth/callback?token=${encodeURIComponent(token)}&email=${encodeURIComponent(user.email || "")}&username=${encodeURIComponent(user.username || "")}`;
        console.log(`[Auth] Google OAuth succeeded. Redirecting to frontend: ${redirectUrl}`);
        return res.redirect(redirectUrl);
      }
      return originalJson.call(this, body);
    };
    next();
  });

  app.use("/auth", fw.auth.router);
}

// 6. Mount FlowWatch sidecar REST API router and /ops dashboard
app.use(createSidecarRouter(fw));
app.use("/ops", fw.dashboard);

const port = process.env.FLOWWATCH_PORT ? parseInt(process.env.FLOWWATCH_PORT) : 9400;
app.listen(port, () => {
  console.log(`FlowWatch sidecar started on http://localhost:${port}`);
  console.log(`FlowWatch Ops Dashboard available at http://localhost:${port}/ops`);
  if (fw.auth?.router) {
    console.log(`FlowWatch Auth Endpoints available at http://localhost:${port}/auth/*`);
  }
});
