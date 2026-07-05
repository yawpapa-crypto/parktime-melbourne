import type { IncomingMessage } from "node:http";
import type { HTTPMethods } from "fastify";
import type { VercelRequest, VercelResponse } from "@vercel/node";
import { buildApp } from "../apps/backend/src/server.ts";

type FastifyApp = Awaited<ReturnType<typeof buildApp>>;

declare global {
  // eslint-disable-next-line no-var
  var __parktimeApp: FastifyApp | undefined;
}

async function getApp() {
  if (!global.__parktimeApp) {
    global.__parktimeApp = await buildApp();
    await global.__parktimeApp.ready();
  }
  return global.__parktimeApp;
}

async function readBody(req: IncomingMessage): Promise<string | undefined> {
  if (req.method === "GET" || req.method === "HEAD") return undefined;

  return new Promise((resolve, reject) => {
    const chunks: Buffer[] = [];
    req.on("data", (chunk) => chunks.push(Buffer.from(chunk)));
    req.on("end", () => resolve(Buffer.concat(chunks).toString("utf8") || undefined));
    req.on("error", reject);
  });
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  const app = await getApp();
  const payload = await readBody(req);
  const url = req.url ?? "/";

  const response = await app.inject({
    method: (req.method ?? "GET") as HTTPMethods,
    url,
    headers: req.headers as Record<string, string>,
    payload,
  });

  res.status(response.statusCode);
  for (const [key, value] of Object.entries(response.headers)) {
    if (value !== undefined) {
      res.setHeader(key, Array.isArray(value) ? value.join(", ") : String(value));
    }
  }
  res.send(response.body);
}

export const config = {
  api: {
    bodyParser: false,
  },
};
