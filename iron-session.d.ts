// types/iron-session.d.ts
import "iron-session";
import { SessionData } from "./lib/iron-session/session.config";

declare module "iron-session" {
  // eslint-disable-next-line @typescript-eslint/no-empty-object-type
  interface IronSessionData extends SessionData {}
}
