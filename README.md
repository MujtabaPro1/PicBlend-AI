# Background Replacement App

This application allows users to upload car images and background images, then automatically processes them to:
1. Blur license plates
2. Remove the background from car images
3. Place the car on a new background with realistic shadows and reflections

## Project Structure

- `src/api/image.py` - Core image processing functions
- `src/api/server.py` - FastAPI server that exposes the image processing as an API
- `src/components/ImageUploader.tsx` - React component for uploading images
- `src/components/ImageProcessor.tsx` - Main React component that handles the image processing workflow

## Setup Instructions

### Backend (Python)

1. Install the required Python dependencies:
   ```
   pip install -r requirements.txt
   ```

2. Start the FastAPI server:
   ```
   cd src/api
   python server.py
   ```
   The server will run on http://localhost:8000

### Frontend (React)

1. Install the required npm dependencies (assuming you have a package.json with React dependencies)
   ```
   npm install
   ```

2. Start the React development server:
   ```
   npm start
   ```

3. Open your browser and navigate to the React app (typically http://localhost:3000)

## Usage

1. Upload a car image using the first uploader
2. Optionally upload a background image using the second uploader
3. Click "Process Images" to send the images to the backend for processing
4. View and download the processed images

## API Endpoints

- `POST /api/process-images` - Processes foreground and background images
  - Parameters:
    - `foreground` (required): Car image file
    - `background` (optional): Background image file
  - Returns:
    - `success`: Boolean indicating success
    - `car_only`: Base64 encoded image of the car with transparent background
    - `final_image`: Base64 encoded final composite image (if background provided)
    - `car_angle`: Detected car angle
    - `car_orientation`: Detected car orientation (front, side, etc.)
