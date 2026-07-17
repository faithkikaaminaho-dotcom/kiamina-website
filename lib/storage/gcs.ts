import { ExternalAccountClient, GoogleAuth } from "google-auth-library";
import { getVercelOidcToken } from "@vercel/oidc";

const projectId = process.env.GCP_PROJECT_ID;
export const bucketName = process.env.GCS_BUCKET_NAME;

function isVercelRuntime() {
  return process.env.VERCEL === "1" || Boolean(process.env.VERCEL_ENV);
}

function getRequiredEnv(name: string) {
  const value = process.env[name];

  if (!value) {
    throw new Error(`${name} is required for Google Cloud authentication.`);
  }

  return value;
}

function createVercelAuthClient() {
  const gcpProjectNumber = getRequiredEnv("GCP_PROJECT_NUMBER");
  const workloadIdentityPoolId = getRequiredEnv(
    "GCP_WORKLOAD_IDENTITY_POOL_ID"
  );
  const workloadIdentityPoolProviderId = getRequiredEnv(
    "GCP_WORKLOAD_IDENTITY_POOL_PROVIDER_ID"
  );
  const serviceAccountEmail = getRequiredEnv("GCP_SERVICE_ACCOUNT_EMAIL");

  const authClient = ExternalAccountClient.fromJSON({
    type: "external_account",
    audience: `//iam.googleapis.com/projects/${gcpProjectNumber}/locations/global/workloadIdentityPools/${workloadIdentityPoolId}/providers/${workloadIdentityPoolProviderId}`,
    subject_token_type: "urn:ietf:params:oauth:token-type:jwt",
    token_url: "https://sts.googleapis.com/v1/token",
    service_account_impersonation_url: `https://iamcredentials.googleapis.com/v1/projects/-/serviceAccounts/${serviceAccountEmail}:generateAccessToken`,
    subject_token_supplier: {
      getSubjectToken: getVercelOidcToken,
    },
  });

  if (!authClient) {
    throw new Error("Unable to create Vercel OIDC auth client.");
  }

  return authClient;
}

async function getGoogleAccessToken() {
  if (!projectId) {
    throw new Error("GCP_PROJECT_ID is required.");
  }

  if (isVercelRuntime()) {
    const authClient = createVercelAuthClient();
    const tokenResponse = await authClient.getAccessToken();

    const token =
      typeof tokenResponse === "string" ? tokenResponse : tokenResponse?.token;

    if (!token) {
      throw new Error("Unable to retrieve Google access token from Vercel OIDC.");
    }

    return token;
  }

  const auth = new GoogleAuth({
    projectId,
    scopes: ["https://www.googleapis.com/auth/cloud-platform"],
    keyFilename:
      process.env.GOOGLE_APPLICATION_CREDENTIALS ||
      "C:/Users/HP/AppData/Roaming/gcloud/application_default_credentials.json",
  });

  const client = await auth.getClient();
  const tokenResponse = await client.getAccessToken();

  const token =
    typeof tokenResponse === "string" ? tokenResponse : tokenResponse?.token;

  if (!token) {
    throw new Error("Unable to retrieve local Google access token.");
  }

  return token;
}

export async function uploadBufferToGcs({
  storagePath,
  buffer,
  contentType,
  metadata,
}: {
  storagePath: string;
  buffer: Buffer;
  contentType: string;
  metadata?: Record<string, string>;
}) {
  if (!bucketName) {
    throw new Error("GCS_BUCKET_NAME is required.");
  }

  const accessToken = await getGoogleAccessToken();
  const boundary = `kiamina-${Date.now()}`;

  const objectMetadata = {
    name: storagePath,
    contentType,
    metadata: metadata || {},
  };

  const body = Buffer.concat([
    Buffer.from(
      `--${boundary}\r\n` +
        "Content-Type: application/json; charset=UTF-8\r\n\r\n" +
        `${JSON.stringify(objectMetadata)}\r\n` +
        `--${boundary}\r\n` +
        `Content-Type: ${contentType}\r\n\r\n`
    ),
    buffer,
    Buffer.from(`\r\n--${boundary}--`),
  ]);

  const response = await fetch(
    `https://storage.googleapis.com/upload/storage/v1/b/${bucketName}/o?uploadType=multipart`,
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": `multipart/related; boundary=${boundary}`,
      },
      body,
    }
  );

  if (!response.ok) {
    const errorText = await response.text();

    throw new Error(
      `Google Cloud Storage upload failed: ${response.status} ${errorText}`
    );
  }

  return response.json();
}

export async function downloadBufferFromGcs(storagePath: string) {
  if (!bucketName) {
    throw new Error("GCS_BUCKET_NAME is required.");
  }

  if (!storagePath) {
    throw new Error("Storage path is required.");
  }

  const accessToken = await getGoogleAccessToken();

  const response = await fetch(
    `https://storage.googleapis.com/storage/v1/b/${bucketName}/o/${encodeURIComponent(
      storagePath
    )}?alt=media`,
    {
      method: "GET",
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    }
  );

  if (!response.ok) {
    const errorText = await response.text();

    throw new Error(
      `Google Cloud Storage download failed: ${response.status} ${errorText}`
    );
  }

  const arrayBuffer = await response.arrayBuffer();

  return Buffer.from(arrayBuffer);
}