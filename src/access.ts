import { jwtVerify, createRemoteJWKSet } from "jose";

const TEAM_DOMAIN = "https://flytripvisa.cloudflareaccess.com";
const POLICY_AUD = "7bb6591ac02b3a10297cd5efde72713ea24580edf39d687882ab37be3897be61";

const JWKS = createRemoteJWKSet(new URL(`${TEAM_DOMAIN}/cdn-cgi/access/certs`));

export interface AccessIdentity {
  email?: string;
  idp?: string;
}

export async function getAccessIdentityFromJwt(request: Request): Promise<AccessIdentity | null> {
  const token = request.headers.get("cf-access-jwt-assertion");
  if (!token) return null;
  try {
    const { payload } = await jwtVerify(token, JWKS, {
      issuer: TEAM_DOMAIN,
      audience: POLICY_AUD,
    });
    return {
      email: payload.email as string | undefined,
      idp: payload.idp as string | undefined,
    };
  } catch (e) {
    return null;
  }
}
