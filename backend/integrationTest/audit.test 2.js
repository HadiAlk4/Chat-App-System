import { app, expect, request, useCleanDb } from "./setup.js";
import { getDB } from "../db.js";

describe("audit routes", () => {
  useCleanDb();

  describe("GET /api/audit-logs", () => {
    it("returns stored audit logs", async () => {
      await getDB().collection("auditLogs").insertOne({
        timeStamp: new Date("2026-01-15T12:00:00.000Z"),
        actionPerformed: "Accepted Group Creation",
        target: "Readers",
        performedBy: "super-admin",
      });

      const res = await request.execute(app).get("/api/audit-logs");

      expect(res).to.have.status(200);
      expect(res.body).to.be.an("array").with.lengthOf(1);
      expect(res.body[0].target).to.equal("Readers");
    });

    it("filters logs by action type", async () => {
      const logs = getDB().collection("auditLogs");
      await logs.insertOne({
        timeStamp: new Date("2026-01-15T12:00:00.000Z"),
        actionPerformed: "Accepted Group Creation",
        target: "Readers",
        performedBy: "super-admin",
      });
      await logs.insertOne({
        timeStamp: new Date("2026-01-16T12:00:00.000Z"),
        actionPerformed: "Accepted Group Deletion",
        target: "Readers",
        performedBy: "super-admin",
      });

      const res = await request.execute(app).get("/api/audit-logs").query({
        action: "Accepted Group Deletion",
      });

      expect(res.body).to.be.an("array").with.lengthOf(1);
      expect(res.body[0].actionPerformed).to.equal("Accepted Group Deletion");
    });
  });
});
