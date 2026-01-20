const fs = require("fs");
const path = require("path");

const componentPath = path.join(__dirname, "..", "src", "components", "LoginForm.js");

const readSource = () => fs.readFileSync(componentPath, "utf8");

describe("LoginForm source", () => {
  test("defines the LoginForm component", () => {
    const source = readSource();
    expect(source).toMatch(/function\s+LoginForm/);
    expect(source).toMatch(/export\s+default\s+LoginForm/);
  });

  test("includes email and password inputs", () => {
    const source = readSource();
    expect(source).toMatch(/type=\"email\"/);
    expect(source).toMatch(/type=\"password\"/);
  });

  test("includes a submit button", () => {
    const source = readSource();
    expect(source).toMatch(/type=\"submit\"/);
    expect(source).toMatch(/Login/);
  });
});
