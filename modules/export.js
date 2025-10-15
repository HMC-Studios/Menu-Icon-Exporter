const IconExport = {
    
    async generateIcon(formData) {
        try {
            let iconSize = formData.icon_size === 'custom' ? 
                parseInt(formData.custom_size) : 
                parseInt(formData.icon_size);
            let filename = formData.filename || 'icon';

            if (!filename.endsWith('.png')) {
                filename += '.png';
            }

            Blockbench.setProgress(0.1, 'Preparing camera view...');

            if (formData.auto_frame) {
                await IconCamera.frameModelForIcon();
            }
            
            Blockbench.setProgress(0.3, 'Adjusting camera settings...');
            
            await new Promise(resolve => setTimeout(resolve, 200));
            
            Blockbench.setProgress(0.5, 'Capturing high-quality screenshot...');
            
            await this.captureIcon(formData, iconSize, filename);
            
            Blockbench.setProgress(1, 'Export complete!');
            
            setTimeout(() => Blockbench.setProgress(), 1000);

        } catch (error) {
            Blockbench.setProgress();
            console.error('Error in generateIcon:', error);
            Blockbench.showMessageBox({
                title: 'Export Failed',
                message: 'Failed to generate icon: ' + error.message,
                icon: 'error'
            });
        }
    },

    async captureIcon(formData, iconSize, filename) {
        return new Promise((resolve, reject) => {
            try {
                let multiplier = IconUtils.getQualityMultiplier(formData.quality);
                let captureSize = iconSize * multiplier;
                
                if (typeof MediaRecorder !== 'undefined' && MediaRecorder.capture) {
                    MediaRecorder.capture({
                        type: 'image',
                        width: captureSize,
                        height: captureSize,
                        callback: (blob) => {
                            if (blob && blob.size > 0) {
                                this.processImageBlob(blob, formData, iconSize, filename);
                                resolve();
                            } else {
                                this.captureFromCanvas(formData, iconSize, filename);
                                resolve();
                            }
                        }
                    });
                    
                    setTimeout(() => {
                        this.captureFromCanvas(formData, iconSize, filename);
                        resolve();
                    }, 3000);
                    
                } else {
                    this.captureFromCanvas(formData, iconSize, filename);
                    resolve();
                }

            } catch (error) {
                reject(error);
            }
        });
    },

    captureFromCanvas(formData, iconSize, filename) {
        try {
            let sourceCanvas = IconPreview.getSourceCanvas();
            
            if (!sourceCanvas) {
                throw new Error('Could not find preview canvas');
            }
            
            let multiplier = IconUtils.getQualityMultiplier(formData.quality);
            let captureSize = iconSize * multiplier;
            let tempCanvas = document.createElement('canvas');
            tempCanvas.width = captureSize;
            tempCanvas.height = captureSize;
            let ctx = tempCanvas.getContext('2d');
            
            let bgColor = IconUtils.getBackgroundColor(formData.background);
            if (bgColor) {
                ctx.fillStyle = bgColor;
                ctx.fillRect(0, 0, captureSize, captureSize);
            }
            
            ctx.imageSmoothingEnabled = true;
            ctx.imageSmoothingQuality = 'high';
            
            let sourceWidth = sourceCanvas.width;
            let sourceHeight = sourceCanvas.height;
            let sourceSize = Math.max(sourceWidth, sourceHeight);
            let sourceX = (sourceWidth - sourceSize) / 2;
            let sourceY = (sourceHeight - sourceSize) / 2;
            
            ctx.drawImage(sourceCanvas, sourceX, sourceY, sourceSize, sourceSize, 0, 0, captureSize, captureSize);
            
            this.resizeAndExport(tempCanvas, iconSize, filename);
            
        } catch (error) {
            console.error('Canvas capture failed:', error);
            Blockbench.showMessageBox({
                title: 'Capture Failed',
                message: 'Could not capture the model view. Please ensure a model is loaded and visible.',
                icon: 'error'
            });
        }
    },

    processImageBlob(blob, formData, iconSize, filename) {
        let img = new Image();
        img.onload = () => {
            let canvas = document.createElement('canvas');
            canvas.width = img.width;
            canvas.height = img.height;
            let ctx = canvas.getContext('2d');
            
            let bgColor = IconUtils.getBackgroundColor(formData.background);
            if (bgColor) {
                ctx.fillStyle = bgColor;
                ctx.fillRect(0, 0, canvas.width, canvas.height);
            }
            
            ctx.drawImage(img, 0, 0);
            this.resizeAndExport(canvas, iconSize, filename);
            
            URL.revokeObjectURL(img.src);
        };
        img.onerror = () => {
            console.error('Failed to load captured image');
            this.captureFromCanvas(formData, iconSize, filename);
        };
        img.src = URL.createObjectURL(blob);
    },

    resizeAndExport(sourceCanvas, targetSize, filename) {
        try {
            let currentCanvas = sourceCanvas;
            let currentSize = Math.max(sourceCanvas.width, sourceCanvas.height);
            
            while (currentSize > targetSize * 2) {
                let nextSize = Math.max(Math.floor(currentSize * 0.5), targetSize);
                let stepCanvas = document.createElement('canvas');
                stepCanvas.width = nextSize;
                stepCanvas.height = nextSize;
                let stepCtx = stepCanvas.getContext('2d');
                
                stepCtx.imageSmoothingEnabled = true;
                stepCtx.imageSmoothingQuality = 'high';
                stepCtx.drawImage(currentCanvas, 0, 0, nextSize, nextSize);
                
                currentCanvas = stepCanvas;
                currentSize = nextSize;
            }
            
            let finalCanvas = document.createElement('canvas');
            finalCanvas.width = targetSize;
            finalCanvas.height = targetSize;
            let ctx = finalCanvas.getContext('2d');
            
            if (targetSize <= 32) {
                ctx.imageSmoothingEnabled = false;
            } else {
                ctx.imageSmoothingEnabled = true;
                ctx.imageSmoothingQuality = 'high';
            }
            
            ctx.drawImage(currentCanvas, 0, 0, targetSize, targetSize);
            
            finalCanvas.toBlob((blob) => {
                this.exportFinalImage(blob, filename, targetSize);
            }, 'image/png');
            
        } catch (error) {
            console.error('Error resizing image:', error);
            Blockbench.showMessageBox({
                title: 'Resize Error',
                message: 'Failed to resize image: ' + error.message,
                icon: 'error'
            });
        }
    },

    exportFinalImage(blob, filename, iconSize) {
        try {
            let reader = new FileReader();
            reader.onload = () => {
                let dataURL = reader.result;
                
                Blockbench.export({
                    type: 'PNG Image',
                    extensions: ['png'],
                    name: filename.replace('.png', ''),
                    content: dataURL,
                    savetype: 'image'
                }, (path) => {
                    if (path) {
                        Blockbench.showMessageBox({
                            title: 'Export Successful',
                            message: `Menu icon exported successfully!\n\nLocation: ${path}\nResolution: ${iconSize}×${iconSize} pixels\n\nReady for use as item texture or UI icon!`,
                            icon: 'check'
                        });
                    } else {
                        Blockbench.showQuickMessage('Export cancelled');
                    }
                });
            };
            reader.onerror = () => {
                throw new Error('Failed to read image data');
            };
            reader.readAsDataURL(blob);

        } catch (error) {
            console.error('Error exporting image:', error);
            Blockbench.showMessageBox({
                title: 'Export Error',
                message: 'Failed to export icon: ' + error.message,
                icon: 'error'
            });
        }
    }
};

if (typeof module !== 'undefined' && module.exports) {
    module.exports = IconExport;
} else if (typeof window !== 'undefined') {
    window.IconExport = IconExport;
}