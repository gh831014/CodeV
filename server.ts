import express from "express";
import { createServer as createViteServer } from "vite";
import path from "path";
import fs from "fs/promises";

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());

  // API to list files in a specific directory
  app.get("/api/files", async (req, res) => {
    try {
      const customRoot = (req.query.root as string) || process.cwd();
      const files: string[] = [];

      // Check if directory exists
      try {
        await fs.access(customRoot);
      } catch {
        return res.status(404).json({ error: "Directory not found" });
      }

      async function scan(dir: string) {
        const entries = await fs.readdir(dir, { withFileTypes: true });
        for (const entry of entries) {
          const fullPath = path.join(dir, entry.name);
          const relativePath = path.relative(customRoot, fullPath);

          if (entry.isDirectory()) {
            if (entry.name !== "node_modules" && !entry.name.startsWith(".")) {
              await scan(fullPath);
            }
          } else {
            if (
              entry.name.endsWith(".ts") ||
              entry.name.endsWith(".tsx") ||
              entry.name.endsWith(".js") ||
              entry.name.endsWith(".jsx") ||
              entry.name.endsWith(".css") ||
              entry.name.endsWith(".html") ||
              entry.name.endsWith(".py") ||
              entry.name.endsWith(".go") ||
              entry.name.endsWith(".java")
            ) {
              files.push(relativePath);
            }
          }
        }
      }

      await scan(customRoot);
      res.json({ files, root: customRoot });
    } catch (error) {
      res.status(500).json({ error: "Failed to list files" });
    }
  });

  // API to read a specific file
  app.get("/api/file", async (req, res) => {
    const filePath = req.query.path as string;
    const root = (req.query.root as string) || process.cwd();
    if (!filePath) return res.status(400).json({ error: "Path is required" });

    try {
      const fullPath = path.isAbsolute(filePath) ? filePath : path.join(root, filePath);
      const content = await fs.readFile(fullPath, "utf-8");
      res.json({ content });
    } catch (error) {
      res.status(500).json({ error: "Failed to read file" });
    }
  });

  // API to get current working directory
  app.get("/api/cwd", (req, res) => {
    res.json({ cwd: process.cwd() });
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
