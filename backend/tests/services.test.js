const request = require("supertest");
const app = require("../src/server");

describe("Token validation", () => {
  it("rejects missing token", async () => {
    const res = await request(app).post("/api/auth/validate-token");
    expect(res.statusCode).toEqual(401);
    expect(res.body).toHaveProperty("error", "missing_token");
  });
});
