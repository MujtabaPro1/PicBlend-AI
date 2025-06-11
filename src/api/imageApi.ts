/**
 * API client for image processing
 */

const API_URL = 'http://localhost:8000/api';

export interface ProcessedImages {
  success: boolean;
  car_only: string;
  final_image?: string;
  car_angle?: number;
  car_orientation?: string;
}

/**
 * Process foreground and background images
 * @param foreground The car image
 * @param background Optional background image
 * @returns Processed images as base64 strings
 */
export const processImages = async (
  foreground: File,
  background?: File
): Promise<ProcessedImages> => {
  const formData = new FormData();
  formData.append('foreground', foreground);
  
  if (background) {
    formData.append('background', background);
  }
  
  try {
    const response = await fetch(`${API_URL}/process-images`, {
      method: 'POST',
      body: formData,
    });
    
    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.detail || 'Failed to process images');
    }
    
    return await response.json();
  } catch (error) {
    console.error('Error processing images:', error);
    throw error;
  }
};
