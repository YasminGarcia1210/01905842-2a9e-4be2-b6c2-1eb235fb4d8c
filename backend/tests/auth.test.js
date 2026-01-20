const request = require("supertest");
const app = require("../src/server");

describe("Auth API", () => {
  it("returns 400 when email/password missing", async () => {
    const res = await request(app).post("/api/auth/login").send({});
    expect(res.statusCode).toEqual(400);
    expect(res.body).toHaveProperty("error", "email_and_password_required");
  });

  it("returns 200 for healthz", async () => {
    const res = await request(app).get("/healthz");
    expect(res.statusCode).toEqual(200);
  });
});
