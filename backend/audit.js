export async function logAudit(db, { actionPerformed, target, performedBy }) {
  if (!actionPerformed || !target) {
    throw new Error("actionPerformed and target are required");
  }

  await db.collection("auditLogs").insertOne({
    timeStamp: new Date(),
    actionPerformed,
    target,
    performedBy: performedBy || "super-admin",
  });
}
