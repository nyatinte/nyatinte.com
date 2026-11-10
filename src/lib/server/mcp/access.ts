import type { AuthInfo } from "@modelcontextprotocol/server";
import { createRemoteJWKSet, jwtVerify } from "jose";

export interface AccessEnvironment {
  ACCESS_AUDIENCE?: string;
  ACCESS_TEAM_DOMAIN?: string;
}

type AccessKeySet = ReturnType<typeof createRemoteJWKSet>;

const keySets = new Map<string, AccessKeySet>();

function issuerFromTeamDomain(teamDomain: string): string | null {
  try {
    const url = new URL(teamDomain);
    if (
      url.protocol !== "https:" ||
      !url.hostname.endsWith(".cloudflareaccess.com") ||
      url.pathname !== "/" ||
      url.search ||
      url.hash ||
      url.username ||
      url.password
    ) {
      return null;
    }
    return url.origin;
  } catch {
    return null;
  }
}

function accessKeySet(issuer: string): AccessKeySet {
  const certsUrl = `${issuer}/cdn-cgi/access/certs`;
  let keySet = keySets.get(certsUrl);
  if (!keySet) {
    keySet = createRemoteJWKSet(new URL(certsUrl));
    keySets.set(certsUrl, keySet);
  }
  return keySet;
}

function response(status: number, message: string): Response {
  return Response.json(
    { error: message },
    {
      headers: { "cache-control": "no-store" },
      status,
    }
  );
}

export async function authenticateAccessRequest(
  request: Request,
  environment: AccessEnvironment
): Promise<AuthInfo | Response> {
  const token = request.headers.get("Cf-Access-Jwt-Assertion");
  if (!token) {
    return response(401, "Cloudflare Access authentication is required.");
  }

  const audience = environment.ACCESS_AUDIENCE;
  const issuer = environment.ACCESS_TEAM_DOMAIN
    ? issuerFromTeamDomain(environment.ACCESS_TEAM_DOMAIN)
    : null;
  if (!(audience && issuer)) {
    return response(
      503,
      "Cloudflare Access is not configured for this service."
    );
  }

  try {
    const { payload } = await jwtVerify(token, accessKeySet(issuer), {
      audience,
      issuer,
      requiredClaims: ["aud", "exp", "iss", "sub"],
    });
    const clientId =
      payload.sub ||
      (payload.sub === "" &&
      payload.type === "app" &&
      typeof payload.common_name === "string"
        ? payload.common_name
        : undefined);
    if (!(clientId && payload.exp)) {
      return response(401, "Cloudflare Access authentication failed.");
    }

    return {
      clientId,
      expiresAt: payload.exp,
      scopes: [],
      token,
    };
  } catch (error) {
    if (error instanceof TypeError) {
      return response(503, "Cloudflare Access verification is unavailable.");
    }
    return response(401, "Cloudflare Access authentication failed.");
  }
}
