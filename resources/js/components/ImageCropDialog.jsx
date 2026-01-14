import { useState, useCallback } from 'react';
import Cropper from 'react-easy-crop';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { getCroppedImg, getImageFormat, getFileExtension } from '@/lib/cropImage';
import { Loader2 } from 'lucide-react';

/**
 * ImageCropDialog Component
 * 
 * A modal dialog for cropping images with zoom and pan functionality
 * 
 * @param {boolean} open - Controls dialog visibility
 * @param {Function} onOpenChange - Callback when dialog open state changes
 * @param {string} imageSrc - Source image URL (object URL or data URL)
 * @param {Function} onCropComplete - Callback when crop is complete, receives File object
 * @param {File} originalFile - Original file object (used to preserve format)
 * @param {string} fileName - Name for the cropped file (default: 'cropped-image')
 */
export default function ImageCropDialog({
    open,
    onOpenChange,
    imageSrc,
    onCropComplete,
    originalFile,
    fileName = 'cropped-image',
}) {
    const [crop, setCrop] = useState({ x: 0, y: 0 });
    const [zoom, setZoom] = useState(1);
    const [croppedAreaPixels, setCroppedAreaPixels] = useState(null);
    const [isProcessing, setIsProcessing] = useState(false);

    const onCropChange = useCallback((crop) => {
        setCrop(crop);
    }, []);

    const onZoomChange = useCallback((zoom) => {
        setZoom(zoom);
    }, []);

    const onCropCompleteCallback = useCallback((croppedArea, croppedAreaPixels) => {
        setCroppedAreaPixels(croppedAreaPixels);
    }, []);

    const handleCrop = async () => {
        if (!croppedAreaPixels || !imageSrc) return;

        setIsProcessing(true);

        try {
            // Determine format from original file
            const format = originalFile ? getImageFormat(originalFile) : 'image/jpeg';
            const extension = getFileExtension(format);

            // Get cropped image with 1:1 aspect ratio, 512x512 max, 90% quality
            const { blob, url } = await getCroppedImg(
                imageSrc,
                croppedAreaPixels,
                0, // rotation
                format,
                0.9, // quality
                512 // max size
            );

            // Create File object from blob
            const croppedFile = new File([blob], `${fileName}.${extension}`, {
                type: format,
            });

            // Pass the cropped file to parent
            onCropComplete(croppedFile, url);

            // Close dialog
            onOpenChange(false);
        } catch (error) {
            console.error('Error cropping image:', error);
            alert('Failed to crop image. Please try again.');
        } finally {
            setIsProcessing(false);
        }
    };

    const handleCancel = () => {
        // Reset state
        setCrop({ x: 0, y: 0 });
        setZoom(1);
        setCroppedAreaPixels(null);
        setIsProcessing(false);
        
        // Close dialog
        onOpenChange(false);
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[600px]" showCloseButton={!isProcessing}>
                <DialogHeader>
                    <DialogTitle>Crop Image</DialogTitle>
                </DialogHeader>

                <div className="space-y-4">
                    {/* Cropper Container */}
                    <div className="relative w-full h-[400px] bg-gray-100 dark:bg-gray-900 rounded-lg overflow-hidden">
                        <Cropper
                            image={imageSrc}
                            crop={crop}
                            zoom={zoom}
                            aspect={1} // 1:1 aspect ratio (square)
                            onCropChange={onCropChange}
                            onZoomChange={onZoomChange}
                            onCropComplete={onCropCompleteCallback}
                            cropShape="round" // Circular crop area
                            showGrid={false}
                        />
                    </div>

                    {/* Zoom Slider */}
                    <div className="space-y-2">
                        <label className="text-sm font-medium">Zoom</label>
                        <input
                            type="range"
                            value={zoom}
                            onChange={(e) => setZoom(parseFloat(e.target.value))}
                            min={1}
                            max={3}
                            step={0.1}
                            disabled={isProcessing}
                                                    className="w-full"
                        />
                    </div>
                </div>

                <DialogFooter>
                    <Button
                        variant="outline"
                        onClick={handleCancel}
                        disabled={isProcessing}
                    >
                        Cancel
                    </Button>
                    <Button
                        onClick={handleCrop}
                        disabled={isProcessing}
                    >
                        {isProcessing ? (
                            <>
                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                Processing...
                            </>
                        ) : (
                            'Crop Image'
                        )}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
