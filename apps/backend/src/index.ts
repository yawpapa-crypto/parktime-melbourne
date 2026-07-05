import path from "node:path";
import { fileURLToPath } from "node:url";
import dotenv from "dotenv";
import cron from "node-cron";
import { buildApp } from "./server.js";
import { runMelbourneImport } from "./workers/import-melbourne.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.resolve(__dirname, "../../../.env") });
dotenv.config();

const app = await buildApp();

const port = Number(process.env.PORT ?? 3001);
const schedule = process.env.MELBOURNE_IMPORT_SCHEDULE_CRON ?? "0 3 * * *";

if (process.env.NODE_ENV !== "test" && !process.env.VERCEL) {
  cron.schedule(schedule, () => {
    runMelbourneImport()
      .then((stats) => app.log.info({ stats }, "Melbourne import completed"))
      .catch((err) => app.log.error({ err }, "Melbourne import failed"));
  });
}

app.listen({ port, host: "0.0.0.0" }).catch((err) => {
  app.log.error(err);
  process.exit(1);
});

export { app };
