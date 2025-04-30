import express, { type Request, Response, NextFunction } from "express";
import { registerRoutes } from "./routes";
import { setupVite, serveStatic, log } from "./vite";

// Create Express application
const app = express();
app.use(express.json());
app.use(express.urlencoded({ extended: false }));

// Add CORS headers for any deployment
app.use((req, res, next) => {
  const origin = req.headers.origin;
  // Allow the origin that sent the request or allow all in development
  res.header("Access-Control-Allow-Origin", origin || "*");
  res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept, Authorization");
  res.header("Access-Control-Allow-Methods", "GET, POST, PUT, PATCH, DELETE");
  res.header("Access-Control-Allow-Credentials", "true");
  
  // Handle preflight requests
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }
  
  next();
});

// Add health check endpoint for deployments
app.get('/health', (req, res) => {
  res.status(200).json({ status: 'ok' });
});

// Logging middleware
app.use((req, res, next) => {
  const start = Date.now();
  const path = req.path;
  let capturedJsonResponse: Record<string, any> | undefined = undefined;

  const originalResJson = res.json;
  res.json = function (bodyJson, ...args) {
    capturedJsonResponse = bodyJson;
    return originalResJson.apply(res, [bodyJson, ...args]);
  };

  res.on("finish", () => {
    const duration = Date.now() - start;
    if (path.startsWith("/api")) {
      let logLine = `${req.method} ${path} ${res.statusCode} in ${duration}ms`;
      if (capturedJsonResponse) {
        logLine += ` :: ${JSON.stringify(capturedJsonResponse)}`;
      }

      if (logLine.length > 80) {
        logLine = logLine.slice(0, 79) + "…";
      }

      log(logLine);
    }
  });

  next();
});

// Initialize application
(async () => {
  try {
    const server = await registerRoutes(app);

    // Error handling middleware - must be after route registration
    app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
      console.error("Express error handler:", err);
      const status = err.status || err.statusCode || 500;
      const message = err.message || "Internal Server Error";

      if (!res.headersSent) {
        res.status(status).json({ message });
      }
    });

    // Serve static files or setup development environment
    if (process.env.NODE_ENV === "development") {
      await setupVite(app, server);
    } else {
      serveStatic(app);
    }

    // Start the server on all environments (can be disabled for specialized platforms)
    const port = process.env.PORT || 5000;
    server.listen({
      port,
      host: "0.0.0.0",
      // Use reusePort if available, but don't fail if not supported
      ...((process.env.NODE_ENV === "production") ? { reusePort: true } : {})
    }, () => {
      log(`Server running on port ${port}`);
      log(`Server URL: http://localhost:${port}`);
    });
  } catch (error) {
    console.error("Error initializing application:", error);
    process.exit(1); // Exit if initialization fails
  }
})();

// For Vercel serverless deployment
export default app;
