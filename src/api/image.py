import streamlit as st
from PIL import Image, ImageEnhance, ImageFilter
import numpy as np
import cv2
import io
import requests
import os
from transparent_background import Remover

def download_cascade_file():
    """Download the license plate cascade classifier if not exists"""
    cascade_path = 'haarcascade_russian_plate_number.xml'
    if not os.path.exists(cascade_path):
        url = 'https://raw.githubusercontent.com/opencv/opencv/master/data/haarcascades/haarcascade_russian_plate_number.xml'
        response = requests.get(url)
        with open(cascade_path, 'wb') as f:
            f.write(response.content)
    return cascade_path


def create_checkerboard(size, square_size=15):
    width, height = size
    pattern = np.zeros((height, width, 4), dtype=np.uint8)
    pattern.fill(255)
    
    # Create more visible checkerboard pattern
    for i in range(0, height, square_size*2):
        for j in range(0, width, square_size*2):
            # Light gray squares
            pattern[i:i+square_size, j:j+square_size] = [235, 235, 235, 255]
            if i + square_size < height and j + square_size < width:
                # Darker gray squares for contrast
                pattern[i+square_size:i+square_size*2, j+square_size:j+square_size*2] = [215, 215, 215, 255]
    
    return Image.fromarray(pattern)


def blur_license_plate(image):
    """Detect and blur license plate in the image"""
    # Convert PIL Image to OpenCV format
    img_cv = np.array(image)
    img_cv = img_cv[:, :, :3]  # Remove alpha channel if exists
    img_cv = cv2.cvtColor(img_cv, cv2.COLOR_RGB2BGR)
    
    # Load the cascade classifier
    cascade_path = download_cascade_file()
    plate_cascade = cv2.CascadeClassifier(cascade_path)
    
    # Detect license plates
    plates = plate_cascade.detectMultiScale(img_cv, scaleFactor=1.1, minNeighbors=5)
    
    # Blur each detected plate
    for (x, y, w, h) in plates:
        # Apply strong Gaussian blur to the plate region
        roi = img_cv[y:y+h, x:x+w]
        blurred = cv2.GaussianBlur(roi, (99, 99), 30)
        img_cv[y:y+h, x:x+w] = blurred
    
    # Convert back to PIL Image
    img_cv = cv2.cvtColor(img_cv, cv2.COLOR_BGR2RGB)
    return Image.fromarray(img_cv)


def create_realistic_shadow(car_image):
    """Create a realistic shadow effect using PIL"""
    # Convert to RGBA if not already
    car_image = car_image.convert('RGBA')
    width, height = car_image.size

    # Create shadow mask from car alpha channel
    shadow = Image.new('RGBA', car_image.size, (0, 0, 0, 0))
    shadow_data = []
    car_data = car_image.getdata()

    for i, pixel in enumerate(car_data):
        if pixel[3] > 0:  # If pixel is not transparent
            # Calculate y position (0 at top, 1 at bottom)
            y = (i // width) / height
            # Shadow gets stronger near the bottom
            opacity = int(200 * (y ** 0.7))  # Further increased shadow intensity
            shadow_data.append((0, 0, 0, opacity))
        else:
            shadow_data.append((0, 0, 0, 0))

    shadow.putdata(shadow_data)

    # Apply gaussian blur to the shadow
    shadow = shadow.filter(ImageFilter.GaussianBlur(radius=20))  # Adjusted blur

    # Stretch the shadow vertically to create perspective effect
    shadow = shadow.resize((width, int(height * 1.1)), Image.LANCZOS)  # Less stretch for more realistic appearance

    # Create final composition with shadow
    result = Image.new('RGBA', car_image.size, (0, 0, 0, 0))

    # Place shadow with minimal offset to avoid floating appearance
    shadow_crop = shadow.crop((0, 0, width, height))
    result.paste(shadow_crop, (0, 5), shadow_crop)  # Reduced offset to make car appear grounded

    # Add the car on top of the shadow
    result.paste(car_image, (0, 0), car_image)

    return result


def create_ground_reflection(car_image, reflection_height_ratio=0.3, fade_factor=0.6, blur_radius=5, opacity=1.0):
    """
    Creates a ground reflection of the car.
    Args:
        car_image (PIL.Image.Image): The car image with an alpha channel.
        reflection_height_ratio (float): The height of the reflection as a ratio of car height.
        fade_factor (float): How quickly the reflection fades (0.0 to 1.0).
        blur_radius (float): The radius for Gaussian blur applied to the reflection.
        opacity (float): Overall opacity of the reflection (0.0 to 1.0).
    Returns:
        PIL.Image.Image: An RGBA image containing the reflection.
    """
    car_image = car_image.convert('RGBA')
    width, height = car_image.size

    # Flip the car image vertically for reflection
    reflection = car_image.transpose(Image.FLIP_TOP_BOTTOM)

    # Create a mask for fading the reflection
    mask = Image.new('L', (width, int(height * reflection_height_ratio)), 0)
    for y in range(mask.height):
        alpha = int(255 * (1 - (y / mask.height) ** fade_factor))
        for x in range(mask.width):
            mask.putpixel((x, y), alpha)

    # Apply the fading mask to the reflection's alpha channel
    reflection_data = reflection.getdata()
    reflection_faded_data = []
    for i, pixel in enumerate(reflection_data):
        if pixel[3] > 0:  # If original pixel is not transparent
            y = i // width
            # Calculate the corresponding y in the mask, scaled to reflection height
            mask_y = int((y / height) * mask.height)
            if mask_y < mask.height:
                original_alpha = pixel[3]
                mask_alpha = mask.getpixel((i % width, mask_y))
                # Apply both the mask fade and the overall opacity
                new_alpha = int(original_alpha * (mask_alpha / 255.0) * opacity)
                # Make the reflection colors lighter too
                reflection_faded_data.append((min(255, int(pixel[0] * 1.2)), 
                                            min(255, int(pixel[1] * 1.2)), 
                                            min(255, int(pixel[2] * 1.2)), 
                                            new_alpha))
            else:
                reflection_faded_data.append((0, 0, 0, 0))  # Fully transparent outside reflection area
        else:
            reflection_faded_data.append((0, 0, 0, 0))

    reflection.putdata(reflection_faded_data)

    # Crop reflection to desired height and blur it
    reflection = reflection.crop((0, 0, width, int(height * reflection_height_ratio)))
    reflection = reflection.filter(ImageFilter.GaussianBlur(radius=blur_radius))

    return reflection


def detect_car_angle(image):
    """Detect car angle and orientation"""
    # Convert to numpy array and get grayscale
    img_np = np.array(image)
    if img_np.shape[2] == 4:  # RGBA
        gray = cv2.cvtColor(img_np[:,:,:3], cv2.COLOR_RGB2GRAY)
        mask = img_np[:,:,3] > 0
        gray[~mask] = 0
    else:  # RGB
        gray = cv2.cvtColor(img_np, cv2.COLOR_RGB2GRAY)
    
    # Get edges
    edges = cv2.Canny(gray, 50, 150)
    
    # Find contours
    contours, _ = cv2.findContours(edges, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_SIMPLE)
    if not contours:
        return 0, 'front'
    
    # Get largest contour
    main_contour = max(contours, key=cv2.contourArea)
    
    # Fit rectangle
    rect = cv2.minAreaRect(main_contour)
    angle = rect[2]
    
    # Determine orientation
    box = cv2.boxPoints(rect)
    box = box.astype(np.int32)  # Use np.int32 instead of deprecated np.int0
    width = rect[1][0]
    height = rect[1][1]
    aspect_ratio = max(width, height) / min(width, height)
    
    if aspect_ratio > 2:  # Side view
        orientation = 'side'
    else:
        orientation = 'front'
    
    return angle, orientation


def resize_and_center(image, target_size):
    """Resize and center an image on a background of target size while preserving all content"""
    # Get dimensions
    img_w, img_h = image.size
    target_w, target_h = target_size
    
    # Calculate scaling factors
    scale_w = target_w / img_w
    scale_h = target_h / img_h
    
    # Use the smaller scaling factor to ensure the entire image fits
    scale = min(scale_w, scale_h)
    
    # Calculate new dimensions
    new_w = int(img_w * scale)
    new_h = int(img_h * scale)
    
    # Resize image using high-quality resampling
    # Use BICUBIC for better detail preservation
    resized_image = image.resize((new_w, new_h), Image.Resampling.BICUBIC)
    
    # Apply sharpening to maintain detail
    enhancer = ImageEnhance.Sharpness(resized_image)
    resized_image = enhancer.enhance(1.2)  # Slight sharpening
    
    # Create new image with target size (transparent background)
    new_image = Image.new('RGBA', target_size, (0, 0, 0, 0))
    
    # Calculate centering position
    x = (target_w - new_w) // 2
    y = (target_h - new_h) // 2
    
    # Paste resized image onto center of new image
    new_image.paste(resized_image, (x, y))
    
    return new_image

# Custom CSS to improve layout
st.markdown("""
<style>
    .stApp {
        max-width: 1200px;
        margin: 0 auto;
    }
    .step-header {
        font-size: 1.1em;
        margin-bottom: 10px;
        color: #262730;
        text-align: center;
    }
    .step-container {
        background-color: #f0f2f6;
        border-radius: 10px;
        padding: 10px;
        margin: 5px;
    }
</style>
""", unsafe_allow_html=True)

# Streamlit UI
st.title("Background Replacement App")

# Upload section with better spacing
st.markdown("### Upload Images")
upload_cols = st.columns([1, 0.2, 1])
with upload_cols[0]:
    foreground_file = st.file_uploader("Foreground (Car) Image", type=["jpg", "png", "jpeg", "webp"])
with upload_cols[2]:
    background_file = st.file_uploader("Background Image", type=["jpg", "png", "jpeg", "webp"])

if foreground_file is not None:
    # Load foreground image
    foreground = Image.open(foreground_file)
    
    # Add spacing
    st.markdown("### Processing Steps")
    
    # Create columns for processing steps with spacing
    cols = st.columns([1, 0.05, 1, 0.05, 1, 0.05, 1])
    
    # Step 1: Original
    with cols[0]:
        st.markdown("<p class='step-header'>1. Original</p>", unsafe_allow_html=True)
        with st.container():
            st.image(foreground, use_container_width=True)
    
    # Step 2: Plate Blurred
    with cols[2]:
        st.markdown("<p class='step-header'>2. Plate Blurred</p>", unsafe_allow_html=True)
        with st.container():
            foreground_blurred = blur_license_plate(foreground)
            st.image(foreground_blurred, use_container_width=True)
            foreground = foreground_blurred
    
    # Step 3: Background Removed
    with cols[4]:
        st.markdown("<p class='step-header'>3. Background Removed</p>", unsafe_allow_html=True)
        with st.container():
            with st.spinner('Processing...'):
                # Initialize remover with CPU device
                remover = Remover(mode='base')  # Use base mode for better quality
                
                # Convert PIL to numpy array
                img_array = np.array(foreground)
                
                # Remove background and get mask with shadow preservation
                # Lower threshold for better detail preservation
                output = remover.process(img_array, threshold=0.75)
                
                # Convert back to PIL Image
                foreground_removed = Image.fromarray(output)
                
                # Create checkerboard background
                checkerboard = create_checkerboard(foreground_removed.size)
                
                # Composite the image onto checkerboard for preview
                preview = Image.alpha_composite(checkerboard, foreground_removed)
                
                # Show preview with checkerboard background
                st.image(preview, use_container_width=True)
    
    # Step 4: Final Result
    with cols[6]:
        st.markdown("<p class='step-header'>4. Final Result</p>", unsafe_allow_html=True)
        if background_file is not None:
            background = Image.open(background_file)
            background = background.convert('RGBA')
            background = background.resize(foreground.size, Image.Resampling.LANCZOS)
            foreground_removed = resize_and_center(foreground_removed, background.size)
            
            # Detect car angle and orientation
            angle, orientation = detect_car_angle(foreground_removed)
            st.markdown(f"<p class='step-header'>Car Angle: {orientation.title()}, {angle:.1f}°</p>", unsafe_allow_html=True)
            
            # Resize foreground to be slightly smaller (80% of background height)
            bg_w, bg_h = background.size
            target_height = int(bg_h * 0.8)
            scale = target_height / foreground_removed.size[1]
            new_width = int(foreground_removed.size[0] * scale)
            
            foreground_resized = foreground_removed.resize(
                (new_width, target_height),
                Image.Resampling.LANCZOS
            )
            
            # Center the car horizontally and place it lower to avoid floating appearance
            paste_x = (bg_w - new_width) // 2
            paste_y = (bg_h - target_height) // 2 + int(bg_h * 0.02)  # Slight downward shift to ground the car
            
            # Create shadow and reflection
            shadowed_car = create_realistic_shadow(foreground_resized)
            reflection = create_ground_reflection(
                foreground_resized, 
                reflection_height_ratio=0.6,  # 70% of car height for reflection
                fade_factor=0.6,              # Fade factor (higher = faster fade)
                blur_radius=8,               # Blur amount for reflection
                opacity=0.8                   # Overall opacity (lower = lighter reflection)
            )
            
            # Create final composite
            final_image = background.copy()
            
            # Paste shadow and car
            final_image.paste(shadowed_car, (paste_x, paste_y), shadowed_car)
            
            # Paste reflection directly below the car with no gap
            # Adjust reflection position based on car angle
            print(angle)
            if angle < 70 and angle > 10:
                reflection_y = paste_y + target_height - 150 
            elif angle < 10 or angle > 9:
                reflection_y = paste_y + target_height - 390  # Less overlap for smaller angles
            elif angle > 70 and angle < 110:
                reflection_y = paste_y + target_height - 390  # More space for larger angles
            elif angle > 110:
                reflection_y = paste_y + target_height - 400  # More space for larger angles
            final_image.paste(reflection, (paste_x, reflection_y), reflection)
            
            # Apply final enhancements
            final_image = ImageEnhance.Color(final_image).enhance(1.1)      # Increase color saturation
            final_image = ImageEnhance.Contrast(final_image).enhance(1.05)  # Slightly increase contrast
            
            with st.container():
                st.image(final_image, use_container_width=True)
            
            # Download section
            st.markdown("""<div style='height: 10px'></div>""", unsafe_allow_html=True)
            download_cols = st.columns(2)
            
            with download_cols[0]:
                img_byte_arr = io.BytesIO()
                final_image.save(img_byte_arr, format='PNG')
                img_byte_arr = img_byte_arr.getvalue()
                st.download_button(
                    label="⬇️ Final Image",
                    data=img_byte_arr,
                    file_name="final_image.png",
                    mime="image/png"
                )
            
            with download_cols[1]:
                fg_byte_arr = io.BytesIO()
                foreground_removed.save(fg_byte_arr, format='PNG')
                fg_byte_arr = fg_byte_arr.getvalue()
                st.download_button(
                    label="⬇️ Car Only",
                    data=fg_byte_arr,
                    file_name="car_only.png",
                    mime="image/png",
                    key="fg_download"
                )
        else:
            st.info("👆 Upload a background image")
