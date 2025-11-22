"""
Extract individual boss sprites from the spritesheet
This script will detect red boxes and extract each boss as a separate image
"""

from PIL import Image
import os

def is_red_pixel(pixel, threshold=200):
    """Check if a pixel is red (R high, G and B low)"""
    if len(pixel) >= 3:
        r, g, b = pixel[0], pixel[1], pixel[2]
        return r > threshold and g < 100 and b < 100
    return False

def find_red_boxes(image):
    """Find all red bounding boxes in the image"""
    width, height = image.size
    pixels = image.load()
    
    boxes = []
    visited = set()
    
    # Scan for red pixels that mark box corners
    for y in range(height):
        for x in range(width):
            if (x, y) in visited:
                continue
            
            pixel = pixels[x, y]
            if is_red_pixel(pixel):
                # Found a red pixel, try to find the bounding box
                # Scan right to find right edge
                right = x
                while right < width and is_red_pixel(pixels[right, y]):
                    visited.add((right, y))
                    right += 1
                
                # Scan down to find bottom edge
                bottom = y
                while bottom < height and is_red_pixel(pixels[x, bottom]):
                    visited.add((x, bottom))
                    bottom += 1
                
                # Check if this forms a box (has width and height)
                if right - x > 10 and bottom - y > 10:
                    # Find actual box boundaries by scanning for red lines
                    box = find_complete_box(pixels, x, y, width, height)
                    if box and box not in boxes:
                        boxes.append(box)
    
    # Sort boxes by position (top to bottom, left to right)
    boxes.sort(key=lambda b: (b[1], b[0]))
    
    # Filter out duplicate or overlapping boxes
    unique_boxes = []
    for box in boxes:
        is_duplicate = False
        for existing in unique_boxes:
            if boxes_overlap(box, existing):
                is_duplicate = True
                break
        if not is_duplicate:
            unique_boxes.append(box)
    
    return unique_boxes

def find_complete_box(pixels, start_x, start_y, max_width, max_height):
    """Find the complete bounding box starting from a red pixel"""
    # Find top-left corner
    left = start_x
    top = start_y
    
    # Find right edge
    right = start_x
    while right < max_width - 1:
        if is_red_pixel(pixels[right + 1, start_y], threshold=150):
            right += 1
        else:
            break
    
    # Find bottom edge
    bottom = start_y
    while bottom < max_height - 1:
        if is_red_pixel(pixels[start_x, bottom + 1], threshold=150):
            bottom += 1
        else:
            break
    
    # Return box with padding removed to exclude the red border (4-5 pixels on each side)
    padding = 5
    if right - left > 20 and bottom - top > 20:
        return (left + padding, top + padding, right - padding, bottom - padding)
    
    return None

def boxes_overlap(box1, box2, tolerance=20):
    """Check if two boxes overlap or are very close"""
    x1, y1, x2, y2 = box1
    x3, y3, x4, y4 = box2
    
    # Check if boxes are in similar position
    return (abs(x1 - x3) < tolerance and abs(y1 - y3) < tolerance)

def remove_red_border_pixels(image):
    """Remove any remaining red border pixels from the extracted image"""
    pixels = image.load()
    width, height = image.size
    
    # Check all edges and remove red pixels
    for x in range(width):
        for y in range(height):
            pixel = pixels[x, y]
            if is_red_pixel(pixel, threshold=180):
                # Replace red pixels with transparent
                if image.mode == 'RGBA':
                    pixels[x, y] = (0, 0, 0, 0)
                else:
                    pixels[x, y] = (255, 255, 255)
    
    return image

def extract_bosses_from_spritesheet(input_path, output_dir):
    """Extract all boss sprites from the spritesheet"""
    # Load the image
    print(f"Loading spritesheet: {input_path}")
    image = Image.open(input_path)
    
    # Convert to RGBA if needed to support transparency
    if image.mode != 'RGBA':
        image = image.convert('RGBA')
    
    # Create output directory if it doesn't exist
    os.makedirs(output_dir, exist_ok=True)
    
    # Find all red boxes
    print("Detecting red bounding boxes...")
    boxes = find_red_boxes(image)
    
    print(f"Found {len(boxes)} boss sprites")
    
    # Extract each boss
    for i, box in enumerate(boxes):
        left, top, right, bottom = box
        
        # Crop the boss from the image
        boss_img = image.crop((left, top, right, bottom))
        
        # Remove any remaining red border pixels
        boss_img = remove_red_border_pixels(boss_img)
        
        # Save the individual boss
        output_path = os.path.join(output_dir, f"boss_{i:02d}.png")
        boss_img.save(output_path)
        print(f"Extracted boss {i:02d}: {right-left}x{bottom-top}px -> {output_path}")
    
    print(f"\nExtraction complete! {len(boxes)} bosses saved to {output_dir}")
    return len(boxes)

if __name__ == "__main__":
    # Path to the spritesheet
    spritesheet_path = "frontend/assets/gemini-boss-spritesheet.png"
    
    # Output directory for individual bosses
    output_directory = "frontend/assets/bosses_individual"
    
    # Check if file exists
    if not os.path.exists(spritesheet_path):
        print(f"Error: Spritesheet not found at {spritesheet_path}")
        print("Please make sure the file exists.")
    else:
        # Extract the bosses
        count = extract_bosses_from_spritesheet(spritesheet_path, output_directory)
        
        if count < 22:
            print(f"\nWarning: Expected 22 bosses but only found {count}")
            print("You may need to adjust the detection threshold or manually verify the boxes.")
