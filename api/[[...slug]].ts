import type { IncomingMessage, ServerResponse } from "node:http";
import { handleRequest, vercelConfig } from "./lib/handler.js";

export default function handler(req: IncomingMessage, res: ServerResponse) {
  return handleRequest(req, res);
}

export const config = vercelConfig;
