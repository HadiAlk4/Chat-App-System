import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { app, expect, request, seedUser, useCleanDb } from "./setup.js";

const uploadDir = path.join(path.dirname(fileURLToPath(import.meta.url)), "..", "uploads");
const png = Buffer.from(
  "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==",
  "base64"
);

function removeUpload(urlPath) {
  if (!urlPath) return;
  fs.rmSync(path.join(uploadDir, path.basename(urlPath)), { force: true });
}

describe("upload routes", () => {
  useCleanDb();

  describe("POST /api/upload/avatar", () => {
    it("stores a small PNG as the profile picture", async () => {
      await seedUser();

      const res = await request.execute(app)
        .post("/api/upload/avatar")
        .field("username", "ada")
        .attach("image", png, { filename: "tiny.png", contentType: "image/png" });

      expect(res.body.ok).to.equal(true);
      expect(res.body.profilePictureUrl).to.match(/^\/uploads\//);
      removeUpload(res.body.profilePictureUrl);
    });

    it("rejects a request with no file", async () => {
      const res = await request.execute(app).post("/api/upload/avatar").field("username", "ada");

      expect(res).to.have.status(400);
      expect(res.body.message).to.equal("No image file provided");
    });
  });

  describe("POST /api/upload/chat", () => {
    it("accepts a small PNG", async () => {
      const res = await request.execute(app)
        .post("/api/upload/chat")
        .attach("image", png, { filename: "tiny.png", contentType: "image/png" });

      expect(res.body.ok).to.equal(true);
      expect(res.body.fileUrl).to.match(/^\/uploads\//);
      removeUpload(res.body.fileUrl);
    });

    it("rejects a request with no file", async () => {
      const res = await request.execute(app).post("/api/upload/chat");

      expect(res).to.have.status(400);
      expect(res.body.message).to.equal("No image file provided");
    });
  });
});
