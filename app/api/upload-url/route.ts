import { Storage } from "@google-cloud/storage";

const storage = new Storage({
  projectId: process.env.GCP_PROJECT_ID,
});

const bucketName = process.env.GCS_BUCKET_NAME;

const allowedModules = [
  "kyc",
  "sales",
  "purchases",
  "bank",
  "payroll",
  "exports",
  "audit",
];

function cleanFileName(fileName: string) {
  return fileName
    .replace(/[^a-zA-Z0-9._-]/g, "-")
    .replace(/-+/g, "-")
    .toLowerCase();
}

export async function POST(request: Request) {
  try {
    if (!bucketName) {
      return Response.json(
        { error: "Storage bucket is not configured." },
        { status: 500 }
      );
    }

    const body = await request.json();

    const {
      clientId,
      module,
      fileName,
      contentType,
    }: {
      clientId?: string;
      module?: string;
      fileName?: string;
      contentType?: string;
    } = body;

    if (!clientId || !module || !fileName || !contentType) {
      return Response.json(
        {
          error:
            "clientId, module, fileName, and contentType are required.",
        },
        { status: 400 }
      );
    }

    if (!allowedModules.includes(module)) {
      return Response.json(
        { error: "Invalid document module." },
        { status: 400 }
      );
    }

    const safeClientId = clientId
      .replace(/[^a-zA-Z0-9-_]/g, "-")
      .toLowerCase();

    const safeFileName = cleanFileName(fileName);

    const timestamp = new Date().toISOString().replace(/[:.]/g, "-");

    const objectPath = `clients/${safeClientId}/${module}/${timestamp}-${safeFileName}`;

    const file = storage.bucket(bucketName).file(objectPath);

    const [uploadUrl] = await file.getSignedUrl({
      version: "v4",
      action: "write",
      expires: Date.now() + 10 * 60 * 1000,
      contentType,
    });

    return Response.json({
      uploadUrl,
      objectPath,
      expiresInMinutes: 10,
    });
  } catch (error) {
    console.error("Upload URL error:", error);

    return Response.json(
      { error: "Unable to generate upload URL." },
      { status: 500 }
    );
  }
}