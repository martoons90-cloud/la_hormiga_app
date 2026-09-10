import { S3Client, PutObjectCommand, GetObjectCommand } from '@aws-sdk/client-s3';

let s3Client: S3Client | null = null;

export function getR2Client(): { client: S3Client; bucket: string; publicUrl: string } | null {
  const accountId = process.env.R2_ACCOUNT_ID || 'b36aef318f314d0aaaef32a2155d9841';
  const accessKeyId = process.env.R2_ACCESS_KEY_ID || '6872b9f6777ac9b338f930fb56f26381';
  const secretAccessKey = process.env.R2_SECRET_ACCESS_KEY || '4031804b2bad9ce811fb6b437110e50d3b529bf5ffb5f4e9eb6d626134dcd169';
  const bucketName = process.env.R2_BUCKET_NAME || 'lahormiga';
  const publicUrl = process.env.R2_PUBLIC_URL || '';

  if (!accountId || !accessKeyId || !secretAccessKey || !bucketName) {
    return null;
  }

  if (!s3Client) {
    s3Client = new S3Client({
      region: 'auto',
      endpoint: `https://${accountId}.r2.cloudflarestorage.com`,
      credentials: {
        accessKeyId,
        secretAccessKey,
      },
    });
  }

  return {
    client: s3Client,
    bucket: bucketName,
    publicUrl: publicUrl.replace(/\/$/, ''),
  };
}

export async function uploadImageToR2(
  buffer: Buffer,
  fileName: string,
  contentType: string
): Promise<{ success: boolean; url?: string; error?: string }> {
  const r2 = getR2Client();
  if (!r2) {
    return {
      success: false,
      error: 'Credenciales de Cloudflare R2 no configuradas (R2_ACCOUNT_ID, R2_ACCESS_KEY_ID, R2_SECRET_ACCESS_KEY, R2_BUCKET_NAME)',
    };
  }

  try {
    const key = `uploads/${Date.now()}-${fileName.replace(/[^a-zA-Z0-9._-]/g, '_')}`;

    await r2.client.send(
      new PutObjectCommand({
        Bucket: r2.bucket,
        Key: key,
        Body: buffer,
        ContentType: contentType,
      })
    );

    // If a custom public URL / CDN domain is provided, use it
    let fileUrl = '';
    if (r2.publicUrl) {
      fileUrl = `${r2.publicUrl}/${key}`;
    } else {
      fileUrl = `/api/files/${encodeURIComponent(key)}`;
    }

    return {
      success: true,
      url: fileUrl,
    };
  } catch (error: any) {
    console.error('Error uploading to Cloudflare R2:', error);
    return {
      success: false,
      error: error?.message || 'Error al subir imagen a Cloudflare R2',
    };
  }
}
