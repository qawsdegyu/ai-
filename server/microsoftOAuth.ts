import type { Express, Request, Response } from "express";
import { getDb, getUserByOpenId } from "./db";
import { userOauthConnections } from "../drizzle/schema";
import { eq } from "drizzle-orm";
import { nanoid } from "nanoid";
import cookie from "cookie";

function getMicrosoftRedirectUri() {
  if (process.env.MICROSOFT_REDIRECT_URI) {
    return process.env.MICROSOFT_REDIRECT_URI;
  }
  if (process.env.NODE_ENV === "production") {
    return "https://ai-blush-phi.vercel.app/api/auth/microsoft/callback";
  }
  return "http://localhost:3000/api/auth/microsoft/callback";
}

export function registerMicrosoftOAuthRoutes(app: Express) {
  const CLIENT_ID = process.env.VITE_MICROSOFT_CLIENT_ID;
  const CLIENT_SECRET = process.env.MICROSOFT_CLIENT_SECRET;
  const TENANT_ID = process.env.MICROSOFT_TENANT_ID || "common";
  const REDIRECT_URI = getMicrosoftRedirectUri();

  app.get("/api/auth/microsoft", async (req: Request, res: Response) => {
    // Bind the OAuth flow to the already-authenticated app user. The signed
    // state survives the Microsoft round-trip even when the session cookie is
    // not returned by the browser.
    const { sdk } = await import("./_core/sdk");
    const startUser = await (await import("./_core/context")).getUserFromRequest(req);
    if (!startUser) return res.redirect("/login?error=auth_required_for_microsoft");
    const state = await sdk.signSession({ openId: startUser.openId, appId: "microsoft-link", name: "microsoft" }, { expiresInMs: 10 * 60 * 1000 });
    res.cookie("microsoft_oauth_state", state, { httpOnly: true, maxAge: 10 * 60 * 1000, secure: process.env.NODE_ENV === "production", sameSite: "lax" });

    // Ensure we are appending the openId or a user reference to state if needed, but since we rely on the main session cookie for identification during callback, we just need state.
    const authUrl = new URL(`https://login.microsoftonline.com/${TENANT_ID}/oauth2/v2.0/authorize`);
    authUrl.searchParams.set("client_id", CLIENT_ID || "");
    authUrl.searchParams.set("response_type", "code");
    authUrl.searchParams.set("redirect_uri", REDIRECT_URI);
    authUrl.searchParams.set("response_mode", "query");
    authUrl.searchParams.set("scope", "offline_access user.read files.read.all");
    authUrl.searchParams.set("state", state);
    authUrl.searchParams.set("prompt", "select_account");
    
    res.redirect(authUrl.toString());
  });

  app.get("/api/auth/microsoft/callback", async (req: Request, res: Response) => {
    const code = req.query.code as string;
    const state = req.query.state as string;
    const error = req.query.error as string;

    const cookies = req.headers.cookie ? cookie.parse(req.headers.cookie) : {};
    const savedState = cookies.microsoft_oauth_state;
    res.clearCookie("microsoft_oauth_state");

    if (error) {
      console.error("[Microsoft OAuth] Error from provider:", error);
      return res.redirect("/assistant?error=microsoft_auth_failed");
    }

    const { sdk } = await import("./_core/sdk");
    const stateSession = state ? await sdk.verifySession(state) : null;
    if (!state || (state !== savedState && !stateSession)) {
      console.error("[Microsoft OAuth] State mismatch");
      return res.redirect("/assistant?error=microsoft_invalid_state");
    }

    if (!code) {
      return res.redirect("/assistant?error=microsoft_missing_code");
    }

    try {
      // Exchange code for tokens
      const tokenUrl = `https://login.microsoftonline.com/${TENANT_ID}/oauth2/v2.0/token`;
      const body = new URLSearchParams({
        client_id: CLIENT_ID || "",
        scope: "offline_access user.read files.read.all",
        code: code,
        redirect_uri: REDIRECT_URI,
        grant_type: "authorization_code",
        client_secret: CLIENT_SECRET || ""
      });

      const tokenRes = await fetch(tokenUrl, {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: body.toString()
      });

      const tokenData = await tokenRes.json();
      if (!tokenRes.ok) {
        console.error("[Microsoft OAuth] Token exchange failed:", tokenData);
        return res.redirect("/assistant?error=microsoft_token_failed");
      }

      const { access_token, refresh_token, expires_in } = tokenData;

      // Get User Profile to get accountId and email
      const userRes = await fetch("https://graph.microsoft.com/v1.0/me", {
        headers: { Authorization: `Bearer ${access_token}` }
      });
      const userData = await userRes.json();
      
      if (!userRes.ok) {
        console.error("[Microsoft OAuth] Profile fetch failed:", userData);
        return res.redirect("/assistant?error=microsoft_profile_failed");
      }

      // Context is not naturally available here because it's a raw Express route.
      // We must extract the user ID from the main session cookie.
      // To do this properly, we can import `createContext` or `getUserFromReq`.
      // For now, we will use a small trick: in our `index.ts`, we will register this route AFTER we inject the session middleware, OR we parse it here.
      
      const db = await getDb();
      if (!db) {
        return res.redirect("/assistant?error=database_unavailable");
      }
      const user = stateSession ? await getUserByOpenId(stateSession.openId) : await (await import("./_core/context")).getUserFromRequest(req);
      if (!user) return res.redirect("/login?error=auth_required_for_microsoft");
      const expiresAt = new Date(Date.now() + expires_in * 1000);

      // Check if connection exists
      const existing = await db.select().from(userOauthConnections).where(eq(userOauthConnections.userId, user.id)).limit(1);
      
      if (existing.length > 0) {
        await db.update(userOauthConnections).set({
          accountId: userData.id,
          accountEmail: userData.userPrincipalName || userData.mail,
          accessToken: access_token,
          refreshToken: refresh_token,
          expiresAt: expiresAt,
          updatedAt: new Date()
        }).where(eq(userOauthConnections.id, existing[0].id));
      } else {
        await db.insert(userOauthConnections).values({
          userId: user.id,
          provider: "microsoft",
          accountId: userData.id,
          accountEmail: userData.userPrincipalName || userData.mail,
          accessToken: access_token,
          refreshToken: refresh_token,
          expiresAt: expiresAt
        });
      }

      res.redirect("/import?microsoft_connected=true");
    } catch (err) {
      console.error("[Microsoft OAuth] Unhandled exception:", err);
      res.redirect("/assistant?error=microsoft_internal_error");
    }
  });
}

export async function refreshMicrosoftToken(userId: number, db: any): Promise<string | null> {
  const { userOauthConnections } = await import("../drizzle/schema");
  const { eq } = await import("drizzle-orm");
  const existing = await db.select().from(userOauthConnections).where(eq(userOauthConnections.userId, userId)).limit(1);
  if (existing.length === 0 || !existing[0].refreshToken) return null;

  try {
    const CLIENT_ID = process.env.VITE_MICROSOFT_CLIENT_ID;
    const CLIENT_SECRET = process.env.MICROSOFT_CLIENT_SECRET;
    const TENANT_ID = process.env.MICROSOFT_TENANT_ID || "common";
    const REDIRECT_URI = getMicrosoftRedirectUri();

    const body = new URLSearchParams({
      client_id: CLIENT_ID || "",
      grant_type: "refresh_token",
      refresh_token: existing[0].refreshToken,
      client_secret: CLIENT_SECRET || "",
      redirect_uri: REDIRECT_URI
    });

    const tokenRes = await fetch(`https://login.microsoftonline.com/${TENANT_ID}/oauth2/v2.0/token`, {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: body.toString()
    });

    if (!tokenRes.ok) {
      console.error("[Microsoft OAuth] Token refresh failed:", await tokenRes.text());
      return null;
    }

    const tokenData = await tokenRes.json();
    const expiresAt = new Date(Date.now() + tokenData.expires_in * 1000);

    await db.update(userOauthConnections).set({
      accessToken: tokenData.access_token,
      refreshToken: tokenData.refresh_token || existing[0].refreshToken,
      expiresAt: expiresAt,
      updatedAt: new Date()
    }).where(eq(userOauthConnections.id, existing[0].id));

    return tokenData.access_token;
  } catch (err) {
    console.error("[Microsoft OAuth] Refresh error:", err);
    return null;
  }
}
