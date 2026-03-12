import type { RequestHandler } from "express";
import { randomBytes, scryptSync, timingSafeEqual } from "crypto";
import type { User } from "@shared/schema";

const HASH_KEY_LENGTH = 64;

export function hashPassword(password: string): string {
  const salt = randomBytes(16).toString("hex");
  const hash = scryptSync(password, salt, HASH_KEY_LENGTH).toString("hex");
  return `${salt}:${hash}`;
}

export function verifyPassword(password: string, passwordHash: string): boolean {
  const [salt, storedHash] = passwordHash.split(":");
  if (!salt || !storedHash) {
    return false;
  }

  const computedHash = scryptSync(password, salt, HASH_KEY_LENGTH);
  const expectedHash = Buffer.from(storedHash, "hex");
  if (computedHash.length !== expectedHash.length) {
    return false;
  }

  return timingSafeEqual(computedHash, expectedHash);
}

export function toPublicUser(user: User) {
  return {
    id: user.id,
    name: user.name,
    email: user.email,
    createdAt: user.createdAt,
  };
}

export const requireAuth: RequestHandler = (req, res, next) => {
  if (!req.session.userId) {
    return res.status(401).json({ message: "Authentication required" });
  }

  next();
};
