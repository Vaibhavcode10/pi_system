// backend/server.js
import express from "express";
import cors from "cors";
import { exec } from "child_process";

const app = express();
const PORT = 5000;

app.use(cors());
app.use(express.json());

/* ── HEALTH CHECK ── */
app.get("/", (req, res) => {
  res.send("Backend running");
});

/* ── OPEN APPLICATIONS ── */

app.post("/api/open/terminal", (req, res) => {
  exec('start cmd.exe', (err) => {
    if (err) return res.sendStatus(500);
    res.sendStatus(200);
  });
});

app.post("/api/open/file-explorer", (req, res) => {
  exec('explorer.exe', (err) => {
    if (err) return res.sendStatus(500);
    res.sendStatus(200);
  });
});

app.post("/api/open/settings", (req, res) => {
  exec('start ms-settings:', (err) => {
    if (err) return res.sendStatus(500);
    res.sendStatus(200);
  });
});

app.post("/api/open/browser", (req, res) => {
  exec('start msedge || start chrome || start "" http://google.com', (err) => {
    if (err) return res.sendStatus(500);
    res.sendStatus(200);
  });
});

/* ── GET ACTIVE APPS ── */
app.get("/api/apps", (req, res) => {
  exec('tasklist /FO CSV /NH', (err, stdout) => {
    if (err) return res.status(500).json({ error: "Failed to get running apps" });
    
    const apps = stdout
      .split('\n')
      .filter(line => line.trim())
      .map(line => {
        const match = line.match(/"([^"]+)",\s*(\d+)/);
        return match ? { name: match[1], pid: match[2] } : null;
      })
      .filter(Boolean);
    
    res.json(apps);
  });
});

app.listen(PORT, () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`);
});