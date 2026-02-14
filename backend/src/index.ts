import "dotenv/config";
import express from "express";
import cors from "cors";
import usersRouter from "./routes/users";
import briefsRouter from "./routes/briefs";

const app = express();
const PORT = Number(process.env.PORT) || 4000;

// Middleware
app.use(cors());
app.use(express.json({ limit: "5mb" }));

// Health check
app.get("/health", (_req, res) => res.json({ status: "ok" }));

// Routes
app.use("/api", usersRouter);
app.use("/api", briefsRouter);

app.listen(PORT, () => {
  console.log(`✅ Backend API running → http://localhost:${PORT}`);
});

export default app;
