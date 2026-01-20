const app = require("./app");
require("dotenv").config();

const port = process.env.PORT || 5000;

if (require.main === module) {
  app.listen(port, () => {
    // eslint-disable-next-line no-console
    console.log(`Server running on port ${port}`);
  });
}

module.exports = app;
