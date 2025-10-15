const IconPreview = {
    
    createPreviewCanvas(size = 256) {
        let previewCanvas = document.createElement('canvas');
        previewCanvas.id = 'live_icon_preview_canvas';
        previewCanvas.width = size;
        previewCanvas.height = size;
        previewCanvas.style.display = 'block';
        previewCanvas.style.border = '1px solid var(--color-border)';
        previewCanvas.style.borderRadius = '4px';
        return previewCanvas;
    },

    createPreviewSection(previewCanvas) {
        return Interface.createElement('div', {
            style: 'text-align: center; padding: 20px; margin-right: 20px; border: 1px solid var(--color-border); border-radius: 4px; background: var(--color-ui);'
        }, [
            Interface.createElement('h3', {
                style: 'margin: 0 0 15px 0; color: var(--color-text);'
            }, 'Live Preview'),
            Interface.createElement('div', {
                style: 'position: relative; margin-bottom: 10px;'
            }, [previewCanvas]),
            Interface.createElement('div', {
                id: 'preview_info_text',
                style: 'margin-top: 10px; color: var(--color-subtle_text); font-size: 12px;'
            }, '64×64 pixels')
        ]);
    },

    updateLivePreview(dialog, formData) {
        let iconSize = formData.icon_size === 'custom' ? 
            parseInt(formData.custom_size) : 
            parseInt(formData.icon_size);
            
        let infoElement = document.getElementById('preview_info_text');
        if (infoElement) {
            infoElement.textContent = `${iconSize}×${iconSize} pixels`;
        }
        
        let canvas = document.getElementById('live_icon_preview_canvas');
        if (canvas) {
            this.generateLivePreview(canvas, formData);
        }
    },

    generateLivePreview(canvas, formData) {
        if (!canvas) return;
        
        let ctx = canvas.getContext('2d');
        let previewSize = canvas.width;
        
        let iconSize = formData.icon_size === 'custom' ? 
            parseInt(formData.custom_size) : 
            parseInt(formData.icon_size);
        
        let qualityMultiplier = IconUtils.getQualityMultiplier(formData.quality);
        
        ctx.clearRect(0, 0, previewSize, previewSize);
        
        if (formData.background === 'transparent') {
            this.drawCheckerboardBackground(ctx, previewSize, iconSize);
        } else {
            ctx.fillStyle = IconUtils.getBackgroundColor(formData.background);
            ctx.fillRect(0, 0, previewSize, previewSize);
        }
        
        let sourceCanvas = this.getSourceCanvas();
        
        if (sourceCanvas) {
            this.renderModelToPreview(ctx, sourceCanvas, formData, iconSize, qualityMultiplier, previewSize);
        } else {
            this.drawNoPreviewMessage(ctx, previewSize);
        }
    },

    drawCheckerboardBackground(ctx, previewSize, iconSize) {
        let checkerSize = Math.max(8, iconSize / 8);
        ctx.fillStyle = '#f0f0f0';
        ctx.fillRect(0, 0, previewSize, previewSize);
        ctx.fillStyle = '#e0e0e0';
        for (let x = 0; x < previewSize; x += checkerSize) {
            for (let y = 0; y < previewSize; y += checkerSize) {
                if ((x / checkerSize + y / checkerSize) % 2) {
                    ctx.fillRect(x, y, checkerSize, checkerSize);
                }
            }
        }
    },

    getSourceCanvas() {
        if (typeof Preview !== 'undefined' && Preview.selected && Preview.selected.canvas) {
            return Preview.selected.canvas;
        } else {
            let canvas = document.querySelector('#preview canvas');
            if (!canvas) {
                canvas = document.querySelector('.preview canvas');
            }
            return canvas;
        }
    },

    renderModelToPreview(ctx, sourceCanvas, formData, iconSize, qualityMultiplier, previewSize) {
        let tempCanvas = document.createElement('canvas');
        let tempCtx = tempCanvas.getContext('2d');
        
        let renderSize = iconSize * qualityMultiplier;
        tempCanvas.width = renderSize;
        tempCanvas.height = renderSize;
        
        if (formData.quality === 'standard' || iconSize <= 16) {
            tempCtx.imageSmoothingEnabled = false;
        } else {
            tempCtx.imageSmoothingEnabled = true;
            tempCtx.imageSmoothingQuality = formData.quality === 'ultra' ? 'high' : 'medium';
        }
        
        let sourceWidth = sourceCanvas.width;
        let sourceHeight = sourceCanvas.height;
        let sourceSize = Math.max(sourceWidth, sourceHeight);
        let sourceX = (sourceWidth - sourceSize) / 2;
        let sourceY = (sourceHeight - sourceSize) / 2;
        
        tempCtx.drawImage(sourceCanvas, sourceX, sourceY, sourceSize, sourceSize, 0, 0, renderSize, renderSize);
        
        if (iconSize <= 32) {
            ctx.imageSmoothingEnabled = false;
        } else {
            ctx.imageSmoothingEnabled = true;
            ctx.imageSmoothingQuality = 'high';
        }
        
        try {
            ctx.drawImage(tempCanvas, 0, 0, previewSize, previewSize);
        } catch (error) {
            this.drawErrorMessage(ctx, previewSize, error.message);
        }
    },

    drawErrorMessage(ctx, previewSize, errorMessage) {
        ctx.fillStyle = '#333';
        ctx.fillRect(0, 0, previewSize, previewSize);
        ctx.fillStyle = '#fff';
        ctx.font = '12px Arial';
        ctx.textAlign = 'center';
        ctx.fillText('Error rendering preview', previewSize/2, previewSize/2 - 10);
        ctx.fillText(errorMessage, previewSize/2, previewSize/2 + 10);
    },

    drawNoPreviewMessage(ctx, previewSize) {
        ctx.fillStyle = '#333';
        ctx.fillRect(0, 0, previewSize, previewSize);
        ctx.fillStyle = '#fff';
        ctx.font = '14px Arial';
        ctx.textAlign = 'center';
        ctx.fillText('No preview available', previewSize/2, previewSize/2 - 10);
        ctx.font = '10px Arial';
        ctx.fillText('Make sure model is visible', previewSize/2, previewSize/2 + 10);
    }
};

if (typeof module !== 'undefined' && module.exports) {
    module.exports = IconPreview;
} else if (typeof window !== 'undefined') {
    window.IconPreview = IconPreview;
}