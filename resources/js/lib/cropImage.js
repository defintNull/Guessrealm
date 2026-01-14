/**
 * Creates an image element from a URL
 * @param {string} url - Image URL
 * @returns {Promise<HTMLImageElement>}
 */
const createImage = (url) =>
    new Promise((resolve, reject) => {
        const image = new Image();
        image.addEventListener('load', () => resolve(image));
        image.addEventListener('error', (error) => reject(error));
        image.setAttribute('crossOrigin', 'anonymous');
        image.src = url;
    });

/**
 * Gets the rotated dimensions of an image
 * @param {number} width - Original width
 * @param {number} height - Original height
 * @param {number} rotation - Rotation in degrees
 * @returns {{width: number, height: number}}
 */
function getRotatedDimensions(width, height, rotation) {
    const rotRad = (rotation * Math.PI) / 180;

    return {
        width: Math.abs(Math.cos(rotRad) * width) + Math.abs(Math.sin(rotRad) * height),
        height: Math.abs(Math.sin(rotRad) * width) + Math.abs(Math.cos(rotRad) * height),
    };
}

/**
 * Crops an image and returns a blob
 * @param {string} imageSrc - Source image URL (can be data URL or object URL)
 * @param {Object} pixelCrop - Crop area in pixels {x, y, width, height}
 * @param {number} rotation - Rotation in degrees (default: 0)
 * @param {string} format - Output format ('image/jpeg', 'image/png', 'image/webp')
 * @param {number} quality - Image quality 0-1 (default: 0.9)
 * @param {number} maxSize - Maximum width/height in pixels (default: 512)
 * @returns {Promise<{blob: Blob, url: string}>}
 */
export async function getCroppedImg(
    imageSrc,
    pixelCrop,
    rotation = 0,
    format = 'image/jpeg',
    quality = 0.9,
    maxSize = 512
) {
    try {
        const image = await createImage(imageSrc);
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');

        if (!ctx) {
            throw new Error('Failed to get canvas context');
        }

        const rotatedDimensions = getRotatedDimensions(image.width, image.height, rotation);

        // Set canvas size to rotated image size
        canvas.width = rotatedDimensions.width;
        canvas.height = rotatedDimensions.height;

        // Rotate canvas context
        ctx.translate(rotatedDimensions.width / 2, rotatedDimensions.height / 2);
        ctx.rotate((rotation * Math.PI) / 180);
        ctx.translate(-image.width / 2, -image.height / 2);

        // Draw rotated image
        ctx.drawImage(image, 0, 0);

        // Extract cropped area
        const croppedCanvas = document.createElement('canvas');
        const croppedCtx = croppedCanvas.getContext('2d');

        if (!croppedCtx) {
            throw new Error('Failed to get cropped canvas context');
        }

        // Calculate scale to fit within maxSize while maintaining aspect ratio
        const scale = Math.min(maxSize / pixelCrop.width, maxSize / pixelCrop.height);
        const scaledWidth = Math.round(pixelCrop.width * scale);
        const scaledHeight = Math.round(pixelCrop.height * scale);

        croppedCanvas.width = scaledWidth;
        croppedCanvas.height = scaledHeight;

        // Draw cropped and scaled image
        croppedCtx.drawImage(
            canvas,
            pixelCrop.x,
            pixelCrop.y,
            pixelCrop.width,
            pixelCrop.height,
            0,
            0,
            scaledWidth,
            scaledHeight
        );

        // Convert to blob
        return new Promise((resolve, reject) => {
            croppedCanvas.toBlob(
                (blob) => {
                    if (!blob) {
                        reject(new Error('Canvas is empty'));
                        return;
                    }
                    const url = URL.createObjectURL(blob);
                    resolve({ blob, url });
                },
                format,
                quality
            );
        });
    } catch (error) {
        console.error('Error cropping image:', error);
        throw new Error('Failed to crop image. Please try again.');
    }
}

/**
 * Detects the MIME type from a file
 * @param {File} file - File object
 * @returns {string} - MIME type string
 */
export function getImageFormat(file) {
    const type = file.type;
    
    // Preserve original format if it's supported
    if (['image/jpeg', 'image/png', 'image/webp'].includes(type)) {
        return type;
    }
    
    // Default to JPEG for other formats
    return 'image/jpeg';
}

/**
 * Gets the file extension for a MIME type
 * @param {string} mimeType - MIME type
 * @returns {string} - File extension
 */
export function getFileExtension(mimeType) {
    const extensions = {
        'image/jpeg': 'jpg',
        'image/png': 'png',
        'image/webp': 'webp',
    };
    return extensions[mimeType] || 'jpg';
}
