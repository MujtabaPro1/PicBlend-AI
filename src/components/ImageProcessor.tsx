import React, { useState } from 'react';
import ImageUploader from './ImageUploader';
import { processImages, ProcessedImages } from '../api/imageApi';

const ImageProcessor: React.FC = () => {
  const [foregroundImage, setForegroundImage] = useState<File | null>(null);
  const [backgroundImage, setBackgroundImage] = useState<File | null>(null);
  const [foregroundPreview, setForegroundPreview] = useState<string | null>(null);
  const [backgroundPreview, setBackgroundPreview] = useState<string | null>(null);
  const [processedImages, setProcessedImages] = useState<ProcessedImages | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showOriginal, setShowOriginal] = useState(false);

  const handleForegroundSelected = (file: File) => {
    setForegroundImage(file);
    setForegroundPreview(URL.createObjectURL(file));
    // Reset processed images when a new foreground is selected
    setProcessedImages(null);
  };

  const handleForegroundRemoved = () => {
    // Clean up the object URL to avoid memory leaks
    if (foregroundPreview) {
      URL.revokeObjectURL(foregroundPreview);
    }
    setForegroundImage(null);
    setForegroundPreview(null);
    setProcessedImages(null);
  };

  const handleBackgroundSelected = (file: File) => {
    setBackgroundImage(file);
    setBackgroundPreview(URL.createObjectURL(file));
    // Reset processed images when a new background is selected
    setProcessedImages(null);
  };

  const handleBackgroundRemoved = () => {
    // Clean up the object URL to avoid memory leaks
    if (backgroundPreview) {
      URL.revokeObjectURL(backgroundPreview);
    }
    setBackgroundImage(null);
    setBackgroundPreview(null);
    setProcessedImages(null);
  };

  const handleProcessImages = async () => {
    if (!foregroundImage) {
      setError('Please select a car image');
      return;
    }

    setIsProcessing(true);
    setError(null);

    try {
      const result = await processImages(foregroundImage, backgroundImage || undefined);
      setProcessedImages(result);
    } catch (err) {
      setError('Failed to process images. Please try again.');
      console.error(err);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleDownload = (imageUrl: string, fileName: string) => {
    const link = document.createElement('a');
    link.href = imageUrl;
    link.download = fileName;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="flex flex-col lg:flex-row w-full gap-8">
      {/* Left side - uploaders and process button */}
      <div className="lg:w-1/2">
        <h1 className="text-2xl font-bold mb-6">Background Replacement App</h1>
        
        <div className="mb-6">
          <ImageUploader
            onImageSelected={handleForegroundSelected}
            onImageRemoved={handleForegroundRemoved}
            title="Foreground (Car) Image"
            subtitle="Upload an image of a car to process"
            imagePreview={foregroundPreview}
            id="foreground-uploader"
          />
        </div>
        
        <div className="mb-6">
          <ImageUploader
            onImageSelected={handleBackgroundSelected}
            onImageRemoved={handleBackgroundRemoved}
            title="Background Image"
            subtitle="Upload a background image (optional)"
            imagePreview={backgroundPreview}
            id="background-uploader"
          />
        </div>
        
        <div className="flex justify-center mb-8">
          <button
            onClick={handleProcessImages}
            disabled={isProcessing || !foregroundImage}
            className={`px-6 py-3 rounded-lg font-medium ${
              isProcessing || !foregroundImage
                ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                : 'bg-blue-600 text-white hover:bg-blue-700'
            } transition-colors`}
          >
            {isProcessing ? 'Processing...' : 'Process Images'}
          </button>
        </div>
        
        {error && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-8">
            {error}
          </div>
        )}
      </div>
      
      {/* Right side - final result */}
      <div className="lg:w-1/2">
        {processedImages?.final_image ? (
          <div>
            <h3 className="text-lg font-medium mb-3">Final Composite</h3>
            {processedImages.car_angle !== undefined && processedImages.car_orientation && (
              <p className="text-sm text-gray-600 mb-2">
                Car Angle: {processedImages.car_orientation.charAt(0).toUpperCase() + 
                processedImages.car_orientation.slice(1)}, 
                {processedImages.car_angle.toFixed(1)}°
              </p>
            )}
            
            {/* Before/After Toggle */}
            <div className="rounded-lg overflow-hidden mb-4 relative">
              <div className="flex justify-center mb-2">
                <div className="inline-flex rounded-md shadow-sm" role="group">
                  <button
                    type="button"
                    onClick={() => setShowOriginal(true)}
                    className={`px-4 py-2 text-sm font-medium rounded-l-lg ${showOriginal 
                      ? 'bg-blue-600 text-white' 
                      : 'bg-white text-gray-700 hover:bg-gray-100'}`}
                  >
                    Original
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowOriginal(false)}
                    className={`px-4 py-2 text-sm font-medium rounded-r-lg ${!showOriginal 
                      ? 'bg-blue-600 text-white' 
                      : 'bg-white text-gray-700 hover:bg-gray-100'}`}
                  >
                    Processed
                  </button>
                </div>
              </div>
              
              <div className="h-96 relative">
                {showOriginal ? (
                  <img 
                    src={foregroundPreview || ''} 
                    alt="Original image" 
                    className="w-full h-full object-contain"
                  />
                ) : (
                  <img 
                    src={processedImages.final_image} 
                    alt="Processed image" 
                    className="w-full h-full object-contain"
                  />
                )}
              </div>
            </div>
            
            <div className="flex gap-3">
              <button
                onClick={() => processedImages.final_image && handleDownload(processedImages.final_image, 'final_image.png')}
                className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 transition-colors"
              >
                Download Final Image
              </button>
              
              <button
                onClick={() => processedImages.car_only && handleDownload(processedImages.car_only, 'car_only.png')}
                className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors"
              >
                Download Car Only
              </button>
            </div>
          </div>
        ) : null}
      </div>
    </div>
    
  );
};

export default ImageProcessor;
