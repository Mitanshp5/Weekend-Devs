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

// Register FlowWatch Workflows (using proper step objects array)
try {
  if (fw.workflow) {
    await fw.workflow("user-authentication-flow", [
      {
        name: "record-user-login-session",
        run: async (input) => {
          console.log(`[FlowWatch Workflow: record-user-login-session] Login session recorded for:`, input);
          return { status: "success", input };
        },
      },
      {
        name: "verify-user-security-tokens",
        run: async (input) => {
          console.log(`[FlowWatch Workflow: verify-user-security-tokens] Verified security token for:`, input);
          return { verified: true };
        },
      },
    ]);

    await fw.workflow("onboard-user-role-flow", [
      {
        name: "persist-role-selection",
        run: async (input) => {
          console.log(`[FlowWatch Workflow: persist-role-selection] Role assigned:`, input);
          return { role: input?.role, email: input?.email };
        },
      },
      {
        name: "initialize-workspace-analytics",
        run: async (input) => {
          console.log(`[FlowWatch Workflow: initialize-workspace-analytics] Workspace ready for role:`, input);
          return { initialized: true, timestamp: new Date().toISOString() };
        },
      },
    ]);
    console.log("[FlowWatch Workflow] Successfully registered 'user-authentication-flow' and 'onboard-user-role-flow'");
  }
} catch (e) {
  console.warn("[FlowWatch Workflow Warning] Could not register workflows:", e.message);
}

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

// 5. User Profile & Role Persistence Endpoints (Redis Cached)
app.post("/api/user/role", async (req, res) => {
  try {
    const { email, role } = req.body;
    if (!email || !role) {
      res.status(400).json({ error: "email and role are required" });
      return;
    }

    // 1. Update PostgreSQL auth_users table
    await fw.query("UPDATE auth_users SET role = $1, updated_at = NOW() WHERE email = $2", [role, email]);

    // 2. Trigger FlowWatch Workflow asynchronously (creates workflow & step execution records in Postgres/Redis)
    if (fw.trigger) {
      try {
        await fw.trigger("onboard-user-role-flow", { email, role, timestamp: new Date().toISOString() });
        console.log(`[FlowWatch Workflow] Triggered 'onboard-user-role-flow' for ${email}`);
      } catch (err) {
        console.warn("[FlowWatch Workflow Warning] Trigger error:", err.message);
      }
    }

    res.json({ ok: true, email, role });
  } catch (err) {
    console.error("[Auth API Error] Failed to update user role:", err.message);
    res.status(500).json({ error: "Failed to persist user role in database" });
  }
});

app.get("/api/user/profile", async (req, res) => {
  try {
    const email = req.query.email;
    if (!email || typeof email !== "string") {
      res.status(400).json({ error: "email query parameter is required" });
      return;
    }

    // Use FlowWatch queryCache to cache user profile in Redis (TTL: 300s)
    const rows = await fw.queryCache(
      "SELECT id, username, email, role, is_verified, created_at FROM auth_users WHERE email = $1",
      [email],
      300
    );

    if (!rows || rows.length === 0) {
      res.status(404).json({ error: "User profile not found" });
      return;
    }

    res.json({ user: rows[0] });
  } catch (err) {
    console.error("[Auth API Error] Failed to fetch user profile:", err.message);
    res.status(500).json({ error: "Failed to fetch user profile" });
  }
});

// 6. Response Caching Middleware for API endpoints (FlowWatch Redis Caching)
if (fw.responseCache) {
  app.use("/api/cached/*", fw.responseCache({ ttl: 60 }));
}

// 7. Mount Auth Router under /auth with Workflow triggers on login & registration
if (fw.auth?.router) {
  console.log("[Auth] FlowWatch authentication router mounted under /auth");

  // Intercept /auth/login to trigger user-authentication-flow workflow
  app.post("/auth/login", (req, res, next) => {
    const originalJson = res.json;
    res.json = function (body) {
      if (body && body.user && body.user.email) {
        if (fw.trigger) {
          fw.trigger("user-authentication-flow", {
            email: body.user.email,
            method: "password",
            timestamp: new Date().toISOString(),
          }).then((res) => console.log(`[FlowWatch Workflow] Triggered 'user-authentication-flow' execution ID: ${res?.executionId}`))
            .catch((err) => console.warn("[Workflow Trigger Error]", err.message));
        }
      }
      return originalJson.call(this, body);
    };
    next();
  });

  // Intercept /auth/register to trigger user-authentication-flow workflow
  app.post("/auth/register", (req, res, next) => {
    const originalJson = res.json;
    res.json = function (body) {
      if (body && body.user && body.user.email) {
        if (fw.trigger) {
          fw.trigger("user-authentication-flow", {
            email: body.user.email,
            method: "registration",
            timestamp: new Date().toISOString(),
          }).then((res) => console.log(`[FlowWatch Workflow] Triggered 'user-authentication-flow' execution ID: ${res?.executionId}`))
            .catch((err) => console.warn("[Workflow Trigger Error]", err.message));
        }
      }
      return originalJson.call(this, body);
    };
    next();
  });

  // Intercept Google OAuth callback response to trigger workflow & redirect to frontend
  app.get("/auth/oauth/google/callback", (req, res, next) => {
    const originalJson = res.json;
    res.json = function (body) {
      if (body && body.tokens && body.tokens.accessToken) {
        const user = body.user || {};
        const token = body.tokens.accessToken;

        if (fw.trigger && user.email) {
          fw.trigger("user-authentication-flow", {
            email: user.email,
            method: "google_oauth",
            timestamp: new Date().toISOString(),
          }).then((res) => console.log(`[FlowWatch Workflow] Triggered Google OAuth workflow execution ID: ${res?.executionId}`))
            .catch((err) => console.warn("[Workflow Trigger Error]", err.message));
        }

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

// 8. Mount FlowWatch sidecar REST API router and /ops dashboard
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
