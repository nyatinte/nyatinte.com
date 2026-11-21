import { exportJWK, generateKeyPair, SignJWT } from "jose";
import { afterEach, expect, test, vi } from "vite-plus/test";
import { authenticateAccessRequest } from "./access";
import { handleMcpRequest } from "./endpoint";

const AUDIENCE = "mcp-app-audience";

afterEach(() => vi.unstubAllGlobals());

async function signedToken(options: {
  audience?: string;
  issuer: string;
  subject?: string;
  commonName?: unknown;
  type?: string;
}) {
  const { privateKey, publicKey } = await generateKeyPair("ES256");
  const jwk = await exportJWK(publicKey);
  Object.assign(jwk, { alg: "ES256", kid: "test-key", use: "sig" });
  vi.stubGlobal(
    "fetch",
    vi.fn(() =>
      Promise.resolve(
        Response.json(
          { keys: [jwk] },
          { headers: { "cache-control": "public, max-age=60" } }
        )
      )
    )
  );

  const token = await new SignJWT({
    email: "owner@example.com",
    ...(options.commonName !== undefined && {
      common_name: options.commonName,
    }),
    ...(options.type !== undefined && { type: options.type }),
  })
    .setProtectedHeader({ alg: "ES256", kid: "test-key" })
    .setIssuer(options.issuer)
    .setAudience(options.audience ?? AUDIENCE)
    .setSubject(options.subject ?? "access-user-123")
    .setIssuedAt()
    .setExpirationTime("5m")
    .sign(privateKey);
  return token;
}

function requestWithToken(token?: string) {
  return new Request("https://nyatinte.com/mcp", {
    headers: {
      Host: "nyatinte.com",
      ...(token && { "Cf-Access-Jwt-Assertion": token }),
    },
    method: "POST",
  });
}

test("Access JWT のないリクエストの場合に拒否する", async () => {
  // Given: Access JWT のないリクエスト
  // When: 認証すると
  const result = await authenticateAccessRequest(requestWithToken(), {
    ACCESS_AUDIENCE: AUDIENCE,
    ACCESS_TEAM_DOMAIN: "https://unit-test.cloudflareaccess.com",
  });

  // Then
  expect(result).toBeInstanceOf(Response);
  expect((result as Response).status).toBe(401);
  expect((result as Response).headers.get("cache-control")).toBe("no-store");
});

test("issuer と audience が一致する署名済み Access JWTの場合に受け入れる", async () => {
  // Given: issuer と audience が一致する署名済み Access JWT
  // When: 認証すると
  const issuer = `https://valid-${crypto.randomUUID()}.cloudflareaccess.com`;
  const token = await signedToken({ issuer });

  const result = await authenticateAccessRequest(requestWithToken(token), {
    ACCESS_AUDIENCE: AUDIENCE,
    ACCESS_TEAM_DOMAIN: issuer,
  });

  // Then
  expect(result).toMatchObject({
    clientId: "access-user-123",
    scopes: [],
    token,
  });
  expect(result).not.toBeInstanceOf(Response);
});

test("subject が空で client ID を持つ署名済み service tokenの場合に受け入れる", async () => {
  // Given: subject が空で client ID を持つ署名済み service token
  // When: 認証すると
  const issuer = `https://service-${crypto.randomUUID()}.cloudflareaccess.com`;
  const token = await signedToken({
    commonName: "service-client.access",
    issuer,
    subject: "",
    type: "app",
  });
  const result = await authenticateAccessRequest(requestWithToken(token), {
    ACCESS_AUDIENCE: AUDIENCE,
    ACCESS_TEAM_DOMAIN: issuer,
  });
  // Then
  expect(result).toMatchObject({ clientId: "service-client.access", token });
});

test.each([
  [undefined, "app"],
  ["", "app"],
  [123, "app"],
  ["service-client.access", "org"],
])(
  "client ID または token type が不正な service token を拒否する",
  async (commonName, type) => {
    // Given: client ID または token type が不正な service token
    const issuer = `https://invalid-service-${crypto.randomUUID()}.cloudflareaccess.com`;
    const token = await signedToken({ commonName, issuer, subject: "", type });
    // When: Access JWT を検証する
    const result = await authenticateAccessRequest(requestWithToken(token), {
      ACCESS_AUDIENCE: AUDIENCE,
      ACCESS_TEAM_DOMAIN: issuer,
    });
    // Then: 401 で拒否する
    expect(result).toBeInstanceOf(Response);
    expect((result as Response).status).toBe(401);
  }
);

test.each([
  ["issuer", "https://wrong-issuer.cloudflareaccess.com", AUDIENCE],
  ["audience", "https://valid.cloudflareaccess.com", "wrong-audience"],
])(
  "issuer または audience が不正な token を拒否する",
  async (_claim, issuer, audience) => {
    // Given: issuer または audience が設定と一致しない署名済み token
    const teamDomain = `https://test-${crypto.randomUUID()}.cloudflareaccess.com`;
    const token = await signedToken({ audience, issuer });

    // When: Access JWT を設定と照合する
    const result = await authenticateAccessRequest(requestWithToken(token), {
      ACCESS_AUDIENCE: AUDIENCE,
      ACCESS_TEAM_DOMAIN: teamDomain,
    });

    // Then: 401 で拒否する
    expect(result).toBeInstanceOf(Response);
    expect((result as Response).status).toBe(401);
  }
);

test("Access 設定が不足しているとき、fail closed にする", async () => {
  // Given: Access 設定が不足しているとき
  // When: 認証すると
  const result = await authenticateAccessRequest(
    requestWithToken("not-a-jwt"),
    {}
  );

  // Then
  expect(result).toBeInstanceOf(Response);
  expect((result as Response).status).toBe(503);
});

test("信頼されない host からのリクエストの場合に拒否する", async () => {
  // Given: 信頼されない host からのリクエスト
  // When: 認証前に検査すると
  const request = new Request("https://attacker.example/mcp", {
    headers: { Origin: "https://attacker.example" },
    method: "POST",
  });

  const result = await handleMcpRequest(request, {});

  // Then
  expect(result.status).toBe(403);
});

test("Access 認証情報のない endpoint リクエストの場合に拒否する", async () => {
  // Given: Access 認証情報のない endpoint リクエスト
  // When: 処理すると
  const result = await handleMcpRequest(requestWithToken(), {
    ACCESS_AUDIENCE: AUDIENCE,
    ACCESS_TEAM_DOMAIN: "https://unit-test.cloudflareaccess.com",
  });

  // Then
  expect(result.status).toBe(401);
});

test("Access 認証済みのリクエストの場合にGitHub token を要求しない", async () => {
  // Given: Access 認証済みのリクエスト
  // When: endpoint を利用すると
  const issuer = `https://database-${crypto.randomUUID()}.cloudflareaccess.com`;
  const token = await signedToken({ issuer });

  const result = await handleMcpRequest(requestWithToken(token), {
    ACCESS_AUDIENCE: AUDIENCE,
    ACCESS_TEAM_DOMAIN: issuer,
  });
  const body = await result.text();

  // Then
  expect(result.status).not.toBe(401);
  expect(result.status).not.toBe(503);
  expect(body).not.toContain("GitHub");
});
