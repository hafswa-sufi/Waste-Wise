const CLOUDINARY_CLOUD_NAME =
  import.meta.env.VITE_CLOUDINARY_CLOUD_NAME ?? 'dywwr11pc'
const CLOUDINARY_UPLOAD_PRESET =
  import.meta.env.VITE_CLOUDINARY_UPLOAD_PRESET ?? 'wastewise_unsigned'

export interface CloudinaryUploadResult {
  secureUrl: string
  publicId: string
  originalFilename?: string
}

export async function uploadToCloudinary(
  file: File,
  folder = 'wastewise_uploads',
): Promise<CloudinaryUploadResult> {
  if (!CLOUDINARY_CLOUD_NAME || !CLOUDINARY_UPLOAD_PRESET) {
    throw new Error(
      'Image upload is not configured yet. Add the Cloudinary cloud name and upload preset.',
    )
  }

  const formData = new FormData()
  formData.append('file', file)
  formData.append('upload_preset', CLOUDINARY_UPLOAD_PRESET)
  formData.append('folder', folder)

  const response = await fetch(
    `https://api.cloudinary.com/v1_1/${CLOUDINARY_CLOUD_NAME}/auto/upload`,
    {
      method: 'POST',
      body: formData,
    },
  )

  const data = (await response.json()) as {
    secure_url?: string
    public_id?: string
    original_filename?: string
    error?: { message?: string }
  }

  if (!response.ok || !data.secure_url || !data.public_id) {
    throw new Error(
      data.error?.message ||
        'The file could not be uploaded. Check the Cloudinary upload preset.',
    )
  }

  return {
    secureUrl: data.secure_url,
    publicId: data.public_id,
    originalFilename: data.original_filename,
  }
}
