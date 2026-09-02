import { Router, Request, Response } from "express";
import fs from "fs";
import path from "path";

export const docsRoutes = Router();

// Load OpenAPI JSON specification
const getOpenApiSpec = () => {
  const possiblePaths = [
    path.resolve(process.cwd(), "src/docs/openapi.json"),
    path.resolve(process.cwd(), "server/src/docs/openapi.json"),
    path.resolve(process.cwd(), "dist/docs/openapi.json"),
  ];

  for (const p of possiblePaths) {
    if (fs.existsSync(p)) {
      return JSON.parse(fs.readFileSync(p, "utf-8"));
    }
  }

  return { error: "OpenAPI specification not found" };
};

/**
 * GET /docs/openapi.json — Raw OpenAPI 3.0.3 specification JSON
 */
docsRoutes.get("/openapi.json", (_req: Request, res: Response) => {
  const spec = getOpenApiSpec();
  res.setHeader("Content-Type", "application/json");
  res.json(spec);
});

/**
 * GET /docs (or /api-docs) — Interactive Swagger UI Documentation Dashboard
 */
docsRoutes.get("/", (_req: Request, res: Response) => {
  const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>SkillBridge API Documentation</title>
  <link rel="stylesheet" href="https://unpkg.com/swagger-ui-dist@5.11.0/swagger-ui.css" />
  <link rel="icon" type="image/png" href="https://unpkg.com/swagger-ui-dist@5.11.0/favicon-32x32.png" />
  <style>
    body { margin: 0; background: #0f172a; color: #f8fafc; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, sans-serif; }
    .topbar { display: none !important; }
    .swagger-ui .info .title { color: #38bdf8 !important; }
    .swagger-ui .scheme-container { background: #1e293b !important; }
    .swagger-ui .opblock .opblock-summary-method { font-weight: 700 !important; }
    .swagger-ui { max-width: 1400px; margin: 0 auto; padding: 20px; }
  </style>
</head>
<body>
  <div id="swagger-ui"></div>
  <script src="https://unpkg.com/swagger-ui-dist@5.11.0/swagger-ui-bundle.js" charset="UTF-8"></script>
  <script src="https://unpkg.com/swagger-ui-dist@5.11.0/swagger-ui-standalone-preset.js" charset="UTF-8"></script>
  <script>
    window.onload = function() {
      window.ui = SwaggerUIBundle({
        url: window.location.pathname.replace(/\\/?$/, '') + '/openapi.json',
        dom_id: '#swagger-ui',
        deepLinking: true,
        presets: [
          SwaggerUIBundle.presets.apis,
          SwaggerUIStandalonePreset
        ],
        plugins: [
          SwaggerUIBundle.plugins.DownloadUrl
        ],
        layout: "BaseLayout"
      });
    };
  </script>
</body>
</html>`;

  res.setHeader("Content-Type", "text/html");
  res.send(html);
});
