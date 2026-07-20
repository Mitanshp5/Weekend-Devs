import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";
import { createFlowwatch, createSidecarRouter } from "@pranshulsoni/flowwatch";

// Load dotenv from root
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.resolve(__dirname, "../.env") });

const dbUrl = process.env.PRISM_DATABASE_URL;
if (!dbUrl) {
  console.error("[ERROR] PRISM_DATABASE_URL is not defined in .env");
  process.exit(1);
}

const redisUrl = process.env.REDIS_URL || "redis://127.0.0.1:6379";

console.log("Starting FlowWatch sidecar connected to PostgreSQL and Redis...");
const fw = await createFlowwatch({
  db: { connectionString: dbUrl },
  redis: { url: redisUrl },
  migrations: { autoRun: true },
  runtime: { serviceName: "prism-backend", environment: "development" },
  security: { headers: false }
});

const app = express();

// 1. Enable CORS for all origins
app.use(cors({ origin: "*", credentials: true }));

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

// 4. Request Tracing Middleware — creates trace context and records traces to Postgres
app.use(fw.requestTracer);

// 5. Mount FlowWatch sidecar REST API router and /ops dashboard
app.use(createSidecarRouter(fw));
app.use("/ops", fw.dashboard);

const port = process.env.FLOWWATCH_PORT ? parseInt(process.env.FLOWWATCH_PORT) : 9400;
app.listen(port, () => {
  console.log(`FlowWatch sidecar started on http://localhost:${port}`);
  console.log(`FlowWatch Ops Dashboard available at http://localhost:${port}/ops`);
});
