import type { IncomingMessage, ServerResponse } from "node:http";
import { buildApp } from "../apps/backend/dist/server.js";

type FastifyApp = Awaited<ReturnType<typeof buildApp>>;

declare global {
  // eslint-disable-next-line no-var
  var __parktimeApp: FastifyApp | undefined;
}

export async function handleRequest(req: IncomingMessage, res: ServerResponse) {
  if (!global.__parktimeApp) {
    global.__parktimeApp = await buildApp();
    await global.__parktimeApp.ready();
  }

  global.__parktimeApp.server.emit("request", req, res);
}

export const vercelConfig = {
  api: {
    bodyParser: false,
  },
};
