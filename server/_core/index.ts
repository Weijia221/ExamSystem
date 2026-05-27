import "dotenv/config";
import express from "express";
import { createServer } from "http";
import net from "net";
import { registerOAuthRoutes } from "./oauth";
import { createApiRouter } from "../routes";
import { serveStatic, setupVite } from "./vite";
import { checkDbConnection } from "../db";

const isProduction = process.env.NODE_ENV === "production";

function isPortAvailable(port: number): Promise<boolean> {
  return new Promise(resolve => {
    const server = net.createServer();
    server.listen(port, () => {
      server.close(() => resolve(true));
    });
    server.on("error", () => resolve(false));
  });
}

async function findAvailablePort(startPort: number = 3000): Promise<number> {
  for (let port = startPort; port < startPort + 20; port++) {
    if (await isPortAvailable(port)) {
      return port;
    }
  }
  throw new Error(`No available port found starting from ${startPort}`);
}

async function startServer() {
  await checkDbConnection();

  const app = express();
  const server = createServer(app);
  app.use(express.json({ limit: "50mb" }));
  app.use(express.urlencoded({ limit: "50mb", extended: true }));
  registerOAuthRoutes(app);
  app.use("/api", createApiRouter());

  if (!isProduction) {
    await setupVite(app, server);
  } else {
    serveStatic(app);
  }

  // In production (Railway etc.), use PORT directly; in dev, find available port
  const port = isProduction
    ? parseInt(process.env.PORT || "3000")
    : await findAvailablePort(parseInt(process.env.PORT || "3000"));

  server.listen(port, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${port}/`);
  });
}

startServer().catch(console.error);
