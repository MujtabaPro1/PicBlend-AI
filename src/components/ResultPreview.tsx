import React, { useEffect, useRef } from 'react';
import { Download } from 'lucide-react';

interface ResultPreviewProps {
  profileImage: string | null;
  backgroundImage: string | null;
}

const ResultPreview: React.FC<ResultPreviewProps> = ({ profileImage, backgroundImage }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  
  useEffect(() => {
    if (!profileImage || !backgroundImage || !canvasRef.current) return;
    
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    
    if (!ctx) return;
    
    const profileImg = new Image();
    const bgImg = new Image();
    
    // Set canvas dimensions
    canvas.width = 800;
    canvas.height = 600;
    
    // Draw background first
    bgImg.onload = () => {
      // Clear canvas
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      
      // Calculate dimensions to fit the background image properly
      const bgAspectRatio = bgImg.width / bgImg.height;
      const canvasAspectRatio = canvas.width / canvas.height;
      
      let drawWidth, drawHeight, drawX, drawY;
      
      if (bgAspectRatio > canvasAspectRatio) {
        // Background image is wider
        drawHeight = canvas.height;
        drawWidth = canvas.height * bgAspectRatio;
        drawX = (canvas.width - drawWidth) / 2;
        drawY = 0;
      } else {
        // Background image is taller
        drawWidth = canvas.width;
        drawHeight = canvas.width / bgAspectRatio;
        drawX = 0;
        drawY = (canvas.height - drawHeight) / 2;
      }
      
      // Draw background
      ctx.drawImage(bgImg, drawX, drawY, drawWidth, drawHeight);
      
      // Draw profile image on top if it's loaded
      if (profileImage) {
        profileImg.src = profileImage;
      }
    };
    
    // Load profile image and draw it on top of the background
    profileImg.onload = () => {
      // Calculate dimensions to fit the profile image appropriately
      // For simplicity, we're making the profile image take up to 70% of the canvas height
      const maxHeight = canvas.height * 0.7;
      const profileAspectRatio = profileImg.width / profileImg.height;
      
      let drawWidth, drawHeight, drawX, drawY;
      
      drawHeight = Math.min(maxHeight, profileImg.height);
      drawWidth = drawHeight * profileAspectRatio;
      
      // Center profile image
      drawX = (canvas.width - drawWidth) / 2;
      drawY = (canvas.height - drawHeight) / 2;
      
      // Draw profile image
      ctx.drawImage(profileImg, drawX, drawY, drawWidth, drawHeight);
    };
    
    // Set image sources to trigger onload events
    bgImg.src = backgroundImage;
    if (profileImage) {
      profileImg.src = profileImage;
    }
  }, [profileImage, backgroundImage]);
  
  const handleDownload = () => {
    if (!canvasRef.current) return;
    
    const link = document.createElement('a');
    link.download = 'pic-blender-result.png';
    link.href = canvasRef.current.toDataURL('image/png');
    link.click();
  };
  
  return (
    <div className="w-full bg-white p-6 rounded-lg shadow-md">
      <h3 className="text-lg font-semibold mb-4 text-gray-800">Final Result</h3>
      
      <div className="border rounded-lg overflow-hidden bg-gray-50">
        <canvas
          ref={canvasRef}
          className="w-full h-auto"
          style={{ maxHeight: '400px', objectFit: 'contain' }}
        />
      </div>
      
      <div className="mt-4 flex justify-center">
        <button
          onClick={handleDownload}
          disabled={!profileImage || !backgroundImage}
          className={`flex items-center space-x-2 px-6 py-3 rounded-lg transition-all ${
            profileImage && backgroundImage
              ? 'bg-blue-500 hover:bg-blue-600 text-white'
              : 'bg-gray-200 text-gray-500 cursor-not-allowed'
          }`}
        >
          <Download size={20} />
          <span>Download Image</span>
        </button>
      </div>
    </div>
  );
};

export default ResultPreview;