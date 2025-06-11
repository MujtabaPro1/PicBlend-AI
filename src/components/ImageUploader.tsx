import React, { useState, useCallback } from 'react';
import { Upload } from 'lucide-react';

interface ImageUploaderProps {
  onImageSelected: (file: File) => void;
  onImageRemoved?: () => void;
  title: string;
  subtitle: string;
  imagePreview: string | null;
  id: string;
}

const ImageUploader: React.FC<ImageUploaderProps> = ({ 
  onImageSelected, 
  onImageRemoved,
  title, 
  subtitle, 
  imagePreview, 
  id 
}) => {
  const [isDragging, setIsDragging] = useState(false);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      onImageSelected(e.dataTransfer.files[0]);
    }
  }, [onImageSelected]);

  const handleFileChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      onImageSelected(e.target.files[0]);
    }
  }, [onImageSelected]);

  return (
    <div className="w-full">
      <h3 className="text-lg font-semibold mb-2 text-gray-800">{title}</h3>
      <p className="text-gray-500 text-sm mb-3">{subtitle}</p>
      
      <div 
        className={`border-2 border-dashed rounded-lg p-6 transition-all duration-200 flex flex-col items-center justify-center ${
          isDragging 
            ? 'border-blue-500 bg-blue-50' 
            : imagePreview 
              ? 'border-green-300 bg-white' 
              : 'border-gray-300 hover:border-blue-400 bg-gray-50 hover:bg-gray-100'
        }`}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
      >
        {imagePreview ? (
          <div className="relative w-full">
            <img 
              src={imagePreview} 
              alt="Preview" 
              className="rounded-md w-full h-48 object-contain" 
            />
            <div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-0 hover:bg-opacity-30 transition-all">
              <div className="flex gap-2">
                <label 
                  htmlFor={id}
                  className="cursor-pointer opacity-0 hover:opacity-100 transition-opacity flex items-center justify-center text-white bg-blue-500 rounded-full p-2"
                >
                  <Upload size={20} />
                  <span className="ml-1">Change</span>
                  <input
                    type="file"
                    id={id}
                    className="hidden"
                    accept="image/*"
                    onChange={handleFileChange}
                  />
                </label>
                {onImageRemoved && (
                  <button
                    onClick={onImageRemoved}
                    className="cursor-pointer opacity-0 hover:opacity-100 transition-opacity flex items-center justify-center text-white bg-red-500 rounded-full p-2"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M3 6h18"></path>
                      <path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"></path>
                      <path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"></path>
                    </svg>
                    <span className="ml-1">Remove</span>
                  </button>
                )}
              </div>
            </div>
          </div>
        ) : (
          <label 
            htmlFor={id}
            className="cursor-pointer flex flex-col items-center justify-center py-6"
          >
            <Upload size={32} className="text-blue-500 mb-4" />
            <span className="text-blue-500 font-medium mb-1">Click to upload</span>
            <span className="text-gray-500 text-sm">or drag and drop</span>
            <input
              type="file"
              id={id}
              className="hidden"
              accept="image/*"
              onChange={handleFileChange}
            />
          </label>
        )}
      </div>
    </div>
  );
};

export default ImageUploader;