import { jwtVerify, createRemoteJWKSet } from "jose";

export interface AccessIdentity {
  email?: string;
  idp?: string;
}

export async function getAccessIdentityFromJwt(request: Request, env: Env): Promise<AccessIdentity | null> {
  const token = request.headers.get("cf-access-jwt-assertion");
  if (!token) return null;

  const teamDomain = env.CF_ACCESS_TEAM_DOMAIN || "https://flytripvisa.cloudflareaccess.com";
  const policyAud = env.CF_ACCESS_AUD;
  if (!policyAud) return null;

  const JWKS = createRemoteJWKSet(new URL(`${teamDomain}/cdn-cgi/access/certs`));

  try {
    const { payload } = await jwtVerify(token, JWKS, {
      issuer: teamDomain,
      audience: policyAud,
    });
    return {
      email: payload.email as string | undefined,
      idp: payload.idp as string | undefined,
    };
  } catch (e) {
    return null;
  }
}
