import { Storage } from "@google-cloud/storage";

export const storage = new Storage({
  projectId: process.env.GCP_PROJECT_ID,
  keyFilename:
    process.env.GOOGLE_APPLICATION_CREDENTIALS ||
    "C:/Users/HP/AppData/Roaming/gcloud/application_default_credentials.json",
});

export const bucketName = process.env.GCS_BUCKET_NAME;