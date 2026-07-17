import { Storage } from "@google-cloud/storage";
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
    throw new Error(`${name} is required for Google Cloud OIDC authentication.`);
  }

  return value;
}

function createVercelGoogleAuth() {
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
    throw new Error("Unable to create Google external account auth client.");
  }

  return new GoogleAuth({
    projectId,
    authClient,
    scopes: ["https://www.googleapis.com/auth/cloud-platform"],
  });
}

function createStorageClient() {
  if (!projectId) {
    throw new Error("GCP_PROJECT_ID is required.");
  }

  if (!bucketName) {
    throw new Error("GCS_BUCKET_NAME is required.");
  }

  if (isVercelRuntime()) {
    const auth = createVercelGoogleAuth();

    return new Storage({
      projectId,
      auth,
    } as any);
  }

  return new Storage({
    projectId,
    keyFilename:
      process.env.GOOGLE_APPLICATION_CREDENTIALS ||
      "C:/Users/HP/AppData/Roaming/gcloud/application_default_credentials.json",
  });
}

export const storage = createStorageClient();