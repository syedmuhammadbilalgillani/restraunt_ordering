// types/iron-session.d.ts
import "iron-session";
import { SessionData } from "./lib/iron-session/session.config";

declare module "iron-session" {
  interface IronSessionData extends SessionData {}
}
