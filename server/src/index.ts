import { config } from "./config.js";
import { runMigrations } from "./db/migrations.js";
import app from "./app.js";

await runMigrations();
app.listen(config.port, () => {
  console.log(`Server running at http://localhost:${config.port}`);
});
