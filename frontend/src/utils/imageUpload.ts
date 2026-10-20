// frontend/src/utils/imageUpload.ts
// Reusable utility for uploading images from device with fallbacks

import { api } from '../services/api';

export interface UploadResponse {
  url: string;
  filename: string;
  folder: string;
}

/**
 * Upload an image file from device to server or convert to base64 data URL
 * @param file The File object from input[type=file]
 * @param folder Subfolder to store in ('logos', 'avatars', 'evidence', 'general')
 * @returns Promise<string> Relative URL or base64 Data URL
 */
export const uploadImageFromDevice = async (
  file: File,
  folder: 'logos' | 'avatars' | 'evidence' | 'general' = 'general'
): Promise<string> => {
  if (!file) {
    throw new Error('Vui lòng chọn một file ảnh hợp lệ');
  }

  // Check file type
  if (!file.type.startsWith('image/')) {
    throw new Error('File đã chọn không phải là ảnh. Vui lòng chọn file PNG, JPG, GIF, WEBP hoặc SVG');
  }

  // Convert to Base64 first for instant preview and safe transport
  return new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.onload = async () => {
      const base64 = reader.result as string;

      try {
        // Try uploading to backend /api/upload
        const res: any = await api.post('/upload', {
          folder,
          image_data: base64,
        });

        if (res?.data?.url) {
          resolve(res.data.url);
          return;
        }
        if (res?.url) {
          resolve(res.url);
          return;
        }

        // If backend returned success without url, return base64
        resolve(base64);
      } catch (err: any) {
        console.warn('Backend image upload error, using local base64 fallback:', err);
        // Fallback: Return Base64 data URL so the user is never blocked
        resolve(base64);
      }
    };

    reader.onerror = () => {
      reject(new Error('Không thể đọc file ảnh từ thiết bị của bạn'));
    };

    reader.readAsDataURL(file);
  });
};
