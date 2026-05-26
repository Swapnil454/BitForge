import crypto from "crypto";

const GOOGLE_TOKEN_URL = "https://oauth2.googleapis.com/token";
const FIREBASE_SCOPE = "https://www.googleapis.com/auth/firebase.messaging";

let accessTokenCache = {
  token: null,
  expiresAt: 0,
};

const base64UrlEncode = (value) =>
  Buffer.from(value)
    .toString("base64")
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/g, "");

const getPrivateKey = () =>
  process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, "\n") || null;

export const hasFirebasePushCredentials = () =>
  Boolean(
    process.env.FIREBASE_PROJECT_ID &&
      process.env.FIREBASE_CLIENT_EMAIL &&
      getPrivateKey()
  );

const createGoogleJwt = () => {
  const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
  const privateKey = getPrivateKey();

  if (!clientEmail || !privateKey) {
    throw new Error("Missing Firebase service account credentials");
  }

  const issuedAt = Math.floor(Date.now() / 1000);
  const expiresAt = issuedAt + 3600;

  const header = base64UrlEncode(
    JSON.stringify({ alg: "RS256", typ: "JWT" })
  );
  const payload = base64UrlEncode(
    JSON.stringify({
      iss: clientEmail,
      sub: clientEmail,
      aud: GOOGLE_TOKEN_URL,
      scope: FIREBASE_SCOPE,
      iat: issuedAt,
      exp: expiresAt,
    })
  );

  const signer = crypto.createSign("RSA-SHA256");
  signer.update(`${header}.${payload}`);
  signer.end();

  const signature = signer
    .sign(privateKey, "base64")
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/g, "");

  return `${header}.${payload}.${signature}`;
};

const getGoogleAccessToken = async () => {
  if (accessTokenCache.token && Date.now() < accessTokenCache.expiresAt) {
    return accessTokenCache.token;
  }

  const assertion = createGoogleJwt();
  const response = await fetch(GOOGLE_TOKEN_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: new URLSearchParams({
      grant_type: "urn:ietf:params:oauth:grant-type:jwt-bearer",
      assertion,
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Failed to fetch Google access token: ${errorText}`);
  }

  const data = await response.json();
  accessTokenCache = {
    token: data.access_token,
    expiresAt: Date.now() + Math.max((data.expires_in || 3600) - 60, 60) * 1000,
  };

  return accessTokenCache.token;
};

const stringifyData = (data = {}) =>
  Object.fromEntries(
    Object.entries(data)
      .filter(([, value]) => value !== undefined && value !== null)
      .map(([key, value]) => [key, typeof value === "string" ? value : JSON.stringify(value)])
  );

export const sendFirebasePush = async ({
  token,
  title,
  body,
  image,
  link,
  data,
}) => {
  if (!hasFirebasePushCredentials()) {
    return {
      ok: false,
      skipped: true,
      error: "Firebase push credentials not configured",
    };
  }

  const accessToken = await getGoogleAccessToken();
  const projectId = process.env.FIREBASE_PROJECT_ID;

  const response = await fetch(
    `https://fcm.googleapis.com/v1/projects/${projectId}/messages:send`,
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        message: {
          token,
          notification: {
            title,
            body,
            ...(image ? { image } : {}),
          },
          data: stringifyData(data),
          webpush: {
            headers: {
              Urgency: data?.priority === "high" || data?.priority === "urgent" ? "high" : "normal",
            },
            notification: {
              title,
              body,
              icon: "/icon.png",
              badge: "/icon.png",
              ...(image ? { image } : {}),
            },
            fcmOptions: link ? { link } : undefined,
          },
        },
      }),
    }
  );

  if (!response.ok) {
    const errorText = await response.text();
    return {
      ok: false,
      skipped: false,
      error: errorText,
    };
  }

  const result = await response.json();
  return {
    ok: true,
    skipped: false,
    messageId: result.name,
  };
};
