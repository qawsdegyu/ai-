import type { Request, Response } from "express";
import { createApp } from "./apiApp";

let appPromise: ReturnType<typeof createApp> | undefined;

const handler = async (req: Request, res: Response) => {
  appPromise ??= createApp();
  const { app } = await appPromise;
  return app(req, res);
};

export default handler;
