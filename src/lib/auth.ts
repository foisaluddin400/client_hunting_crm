import bcrypt from "bcryptjs";
import { SignJWT, jwtVerify } from "jose";
import { cookies } from "next/headers";
import { NextRequest } from "next/server";

export const AUTH_COOKIE_NAME = "leadflow_auth_token";
const JWT_SECRET = new TextEncoder().encode(
  process.env.AUTH_SECRET || "leadflow_jwt_secret_change_in_production_998877"
);

export interface AuthUserPayload {
  userId: string;
  email: string;
  name: string;
  agencyName?: string;
}

/**
 * Hash plaintext password using bcrypt
 */
export async function hashPassword(password: string): Promise<string> {
  const salt = await bcrypt.genSalt(10);
  return bcrypt.hash(password, salt);
}

/**
 * Compare plaintext password with hashed password
 */
export async function comparePassword(password: string, hash: string): Promise<boolean> {
  return bcrypt.compare(password, hash);
}

/**
 * Sign JWT token for authenticated session
 */
export async function signToken(payload: AuthUserPayload): Promise<string> {
  return new SignJWT({ ...payload })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("30d")
    .sign(JWT_SECRET);
}

/**
 * Verify JWT token and return payload
 */
export async function verifyToken(token: string): Promise<AuthUserPayload | null> {
  try {
    const { payload } = await jwtVerify(token, JWT_SECRET);
    return {
      userId: payload.userId as string,
      email: payload.email as string,
      name: payload.name as string,
      agencyName: payload.agencyName as string | undefined,
    };
  } catch (err) {
    return null;
  }
}

/**
 * Get authenticated user from Next.js request or cookies
 */
export async function getAuthUser(
  req?: NextRequest | Request
): Promise<AuthUserPayload | null> {
  let token: string | undefined;

  // 1. Check Authorization header
  if (req) {
    const authHeader = req.headers.get("authorization");
    if (authHeader && authHeader.startsWith("Bearer ")) {
      token = authHeader.substring(7);
    }
  }

  // 2. Check Cookie
  if (!token) {
    try {
      const cookieStore = await cookies();
      const cookie = cookieStore.get(AUTH_COOKIE_NAME);
      if (cookie) {
        token = cookie.value;
      }
    } catch {
      // If called in an environment where cookies() is unavailable
    }
  }

  if (!token) return null;

  return verifyToken(token);
}
