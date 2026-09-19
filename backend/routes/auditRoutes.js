import { db } from "../db.js";

export function auditRoutes(app) {
  app.get("/api/audit-logs", async (req, res) => {
    try {
      const filter = {};
      const { action, startDate, endDate } = req.query;

      if (action && action !== "All Actions") {
        filter.actionPerformed = action;
      }

      if (startDate || endDate) {
        filter.timeStamp = {};
        if (startDate) {
          const start = new Date(startDate);
          start.setHours(0, 0, 0, 0);
          filter.timeStamp.$gte = start;
        }
        if (endDate) {
          const end = new Date(endDate);
          end.setHours(23, 59, 59, 999);
          filter.timeStamp.$lte = end;
        }
      }

      const logs = await db.collection("auditLogs").find(filter).sort({ timeStamp: -1 }).toArray();
      res.send(logs);
    } catch (err) {
      res.status(500).send({ ok: false, message: err.message });
    }
  });
}
