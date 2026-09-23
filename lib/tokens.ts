import crypto from "node:crypto";

export function generateAccessToken() {
  return crypto.randomBytes(32).toString("hex");
}
