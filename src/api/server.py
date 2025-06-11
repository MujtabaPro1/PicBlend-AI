from fastapi import FastAPI, File, UploadFile, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import Response
import io
import uvicorn
from PIL import Image
import base64
from image import (
    blur_license_plate,
    create_checkerboard,
    resize_and_center,
    detect_car_angle,
    create_realistic_shadow,
    create_ground_reflection,
)
from transparent_background import Remover
import numpy as np

app = FastAPI()

# Add CORS middleware to allow requests from your React app
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # In production, replace with your frontend URL
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Initialize the background remover once
remover = Remover(mode='base')

@app.post("/api/process-images")
def process_images(
    foreground: UploadFile = File(...),
    background: UploadFile = File(None),
):
    try:
        # Read the foreground image
        foreground_content = foreground.file.read()
        foreground_image = Image.open(io.BytesIO(foreground_content))
        
        # Step 1: Blur license plate
        foreground_blurred = blur_license_plate(foreground_image)
        
        # Step 2: Remove background
        img_array = np.array(foreground_blurred)
        output = remover.process(img_array, threshold=0.75)
        foreground_removed = Image.fromarray(output)
        
        # Create a response object with the processed images
        response = {
            "success": True,
            "car_only": image_to_base64(foreground_removed)
        }
        
        # If background is provided, create the final composite
        if background:
            background_content = background.file.read()
            background_image = Image.open(io.BytesIO(background_content))
            background_image = background_image.convert('RGBA')
            background_image = background_image.resize(foreground_blurred.size, Image.Resampling.LANCZOS)
            
            # Resize foreground to be larger (95% of background height instead of 80%)
            bg_w, bg_h = background_image.size
            target_height = int(bg_h * 0.95)  # Increased from 0.8 to 0.95
            scale = target_height / foreground_removed.size[1]
            new_width = int(foreground_removed.size[0] * scale)
            
            foreground_resized = foreground_removed.resize(
                (new_width, target_height),
                Image.Resampling.LANCZOS
            )
            
            # Center the car horizontally and adjust vertical position for larger car
            paste_x = (bg_w - new_width) // 2
            # Position car slightly higher since it's larger now
            paste_y = (bg_h - target_height) // 2 - int(bg_h * 0.02)
            
            # Detect car angle and orientation
            angle, orientation = detect_car_angle(foreground_removed)
            
            # Create shadow and reflection
            shadowed_car = create_realistic_shadow(foreground_resized)
            
            reflection = create_ground_reflection(
                foreground_resized, 
                reflection_height_ratio=0.6,
                fade_factor=0.6,
                blur_radius=8,
                opacity=0.35
            )
            
            # Create final composite
            final_image = background_image.copy()
            
            # Paste shadow and car
            final_image.paste(shadowed_car, (paste_x, paste_y), shadowed_car)
            
            # Paste reflection with position based on car angle
            # Log the angle for debugging
            print(f'Car angle: {angle}')
            
            # Clear logical ranges for reflection positioning
            if angle == 0:
                reflection_y = paste_y + target_height - 200
                print(f'Front view angle: {angle}, reflection_y: {reflection_y}')
            elif angle > 0 and angle < 5:
                reflection_y = paste_y + target_height - 180
                print(f'Front view angle: {angle}, reflection_y: {reflection_y}')
            elif angle >= 5 and angle < 10:  # Very small angles (front view)
                reflection_y = paste_y + target_height - 390
                print(f'Front view angle: {angle}, reflection_y: {reflection_y}')
            elif angle >= 10 and angle < 12:  # Special case for angles between 10-12
                reflection_y = paste_y + target_height - 440
                print(f'Special case angle 10-12: {angle}, reflection_y: {reflection_y}')
            elif angle >= 12 and angle < 70:  # Medium angles
                reflection_y = paste_y + target_height - 490
                print(f'Medium angle: {angle}, reflection_y: {reflection_y}')
            elif angle >= 70 and angle < 80:  # Side view angles
                reflection_y = paste_y + target_height - 190
                print(f'Side view angle: {angle}, reflection_y: {reflection_y}')
            elif angle >= 80 and angle < 85:  # Side view angles
                reflection_y = paste_y + target_height - 370
                print(f'Side view angle: {angle}, reflection_y: {reflection_y}')
            elif angle >= 85 and angle < 90:  # Side view angles
                reflection_y = paste_y + target_height - 120
                print(f'Side view angle: {angle}, reflection_y: {reflection_y}')
            elif angle >= 90 and angle < 110:  # Side view angles
                reflection_y = paste_y + target_height - 150
                print(f'Side view angle: {angle}, reflection_y: {reflection_y}')    
            else:  # angle >= 110, large angles
                reflection_y = paste_y + target_height - 400
                print(f'Large angle: {angle}, reflection_y: {reflection_y}')
                
            final_image.paste(reflection, (paste_x, reflection_y), reflection)
            
            # Apply final enhancements
            final_image = Image.fromarray(np.array(final_image))
            
            # Add final image to response
            response["final_image"] = image_to_base64(final_image)
            response["car_angle"] = angle
            response["car_orientation"] = orientation
        
        return response
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

def image_to_base64(image):
    """Convert PIL Image to base64 string"""
    buffered = io.BytesIO()
    image.save(buffered, format="PNG")
    img_str = base64.b64encode(buffered.getvalue()).decode('utf-8')
    return f"data:image/png;base64,{img_str}"

if __name__ == "__main__":
    uvicorn.run("server:app", host="0.0.0.0", port=8000, reload=True)
