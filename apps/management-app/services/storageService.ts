const ALLOWED_MIME_TYPES = ['image/jpeg', 'image/png', 'image/webp'];
const MAX_FILE_SIZE_BYTES = 5 * 1024 * 1024; // 5 MB

export const uploadImage = async (file: File, path: string): Promise<string> => {
  // --- CLIENT-SIDE VALIDATION ---
  // Prevents wasted bandwidth and poor UX from files Cloudinary will reject anyway.
  if (!ALLOWED_MIME_TYPES.includes(file.type)) {
      throw new Error(`Unsupported file type: ${file.type}. Please upload a JPEG, PNG, or WebP image.`);
  }
  if (file.size > MAX_FILE_SIZE_BYTES) {
      const sizeMB = (file.size / (1024 * 1024)).toFixed(1);
      throw new Error(`File is too large (${sizeMB} MB). Maximum allowed size is 5 MB.`);
  }

  // CLOUDINARY CONFIGURATION
  // We will replace these with the user's actual keys once provided
  const CLOUDINARY_CLOUD_NAME = import.meta.env.VITE_CLOUDINARY_CLOUD_NAME || '';
  const CLOUDINARY_UPLOAD_PRESET = import.meta.env.VITE_CLOUDINARY_UPLOAD_PRESET || '';

  if (!CLOUDINARY_CLOUD_NAME || !CLOUDINARY_UPLOAD_PRESET) {
      throw new Error("Cloudinary configuration is missing. Please add your Cloud Name and Upload Preset.");
  }

  const formData = new FormData();
  formData.append('file', file);
  formData.append('upload_preset', CLOUDINARY_UPLOAD_PRESET);

  // Cloudinary automatically handles file paths/folders if configured in the preset, 
  // but we can also pass a dynamic folder if we want (requires preset config):
  // formData.append('folder', 'menu_items');

  const response = await fetch(`https://api.cloudinary.com/v1_1/${CLOUDINARY_CLOUD_NAME}/image/upload`, {
      method: 'POST',
      body: formData
  });

  if (!response.ok) {
      const errorData = await response.json();
      console.error("Cloudinary Error:", errorData);
      throw new Error(errorData.error?.message || "Failed to upload image to Cloudinary");
  }

  const data = await response.json();
  return data.secure_url; // This is the permanent, secure URL to the image
};
