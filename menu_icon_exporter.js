let iconExporterAction;

Plugin.register('menu_icon_exporter', {
    title: 'Menu Icon Exporter',
    author: 'NET',
    description: 'Export perfect menu/item icons with advanced camera controls',
    icon: 'icon.png',
    version: '3.1.0',
    variant: 'both',
    tags: ['Utility', 'Export', 'Screenshot'],
    
    onload() {
        this.iconExporterAction = new Action('export_menu_icon', {
            name: 'Export Menu Icon',
            description: 'Export model as a menu/item icon with automatic framing',
            icon: 'photo_camera',
            category: 'file',
            keybind: new Keybind({key: 'i', ctrl: true, shift: true}),
            condition: () => Project && Project.elements && Project.elements.length > 0,
            click: openIconExporterDialog
        });

        this.quickExport16Action = new Action('quick_export_16', {
            name: 'Quick Export 16×16 Icon',
            description: 'Instantly export a 16×16 icon with default settings',
            icon: 'photo_size_select_small',
            category: 'file',
            condition: () => Project && Project.elements && Project.elements.length > 0,
            click: () => quickExportIcon(16)
        });

        this.quickExport64Action = new Action('quick_export_64', {
            name: 'Quick Export 64×64 Icon',
            description: 'Instantly export a 64×64 icon with default settings',
            icon: 'photo_size_select_large',
            category: 'file',
            condition: () => Project && Project.elements && Project.elements.length > 0,
            click: () => quickExportIcon(64)
        });

        MenuBar.addAction(this.iconExporterAction, 'file.export');
        MenuBar.addAction(this.quickExport16Action, 'file.export');
        MenuBar.addAction(this.quickExport64Action, 'file.export');
    },
    
    onunload() {
        this.iconExporterAction?.delete();
        this.quickExport16Action?.delete();
        this.quickExport64Action?.delete();
    }
});

function openIconExporterDialog() {
    if (!Format || !Project || !Project.elements || Project.elements.length === 0) {
        Blockbench.showMessageBox({
            title: 'No Model',
            message: 'Please load a model first before exporting an icon.',
            icon: 'warning'
        });
        return;
    }

    let previewSize = 256;
    let previewCanvas = document.createElement('canvas');
    previewCanvas.id = 'live_icon_preview_canvas';
    previewCanvas.width = previewSize;
    previewCanvas.height = previewSize;
    previewCanvas.style.display = 'block';
    previewCanvas.style.border = '1px solid var(--color-border)';
    previewCanvas.style.borderRadius = '4px';

    let previewSection = Interface.createElement('div', {
        style: 'text-align: center; padding: 20px; margin-right: 20px; border: 1px solid var(--color-border); border-radius: 4px; background: var(--color-ui);'
    }, [
        Interface.createElement('h3', {
            style: 'margin: 0 0 15px 0; color: var(--color-text);'
        }, 'Live Preview'),
        previewCanvas,
        Interface.createElement('div', {
            id: 'preview_info_text',
            style: 'margin-top: 10px; color: var(--color-subtle_text); font-size: 12px;'
        }, '64×64 pixels')
    ]);

    let dialog = new Dialog({
        id: 'icon_exporter_dialog',
        title: 'Menu Icon Exporter',
        width: 900,
        form: {
            layout_wrapper: {
                type: 'info',
                text: ''
            },
            
            settings_column: {
                type: 'info',
                text: getFormatSpecificInfo()
            },
            
            icon_size: {
                label: 'Icon Size',
                type: 'select',
                options: {
                    '16': '16×16 - Tiny (UI elements)',
                    '32': '32×32 - Small (inventory icons)', 
                    '48': '48×48 - Medium (item icons)',
                    '64': '64×64 - Large (block icons)',
                    '128': '128×128 - Extra Large (detailed icons)',
                    'custom': 'Custom Size...'
                },
                value: '64',
                onChange(formResult) {
                    updateLivePreview(dialog, formResult);
                }
            },
            
            custom_size: {
                label: 'Custom Size (pixels)',
                type: 'number',
                value: 48,
                min: 8,
                max: 512,
                condition: (form) => form.icon_size === 'custom',
                onChange(formResult) {
                    updateLivePreview(dialog, formResult);
                }
            },
            
            background: {
                label: 'Background',
                type: 'select',
                options: {
                    'transparent': 'Transparent',
                    'white': 'White (#FFFFFF)',
                    'black': 'Black (#000000)',
                    'gray': 'Gray (#808080)',
                    'custom': 'Custom Color'
                },
                value: 'transparent',
                description: 'Background color for the exported icon',
                onChange(formResult) {
                    updateLivePreview(dialog, formResult);
                }
            },
            
            custom_color: {
                label: 'Custom Background Color',
                type: 'color',
                value: '#ff0000',
                description: 'Pick any color from the gradient spectrum',
                condition: (formResult) => formResult.background === 'custom'
            },
            

            
            auto_frame: {
                label: 'Auto-frame Model',
                type: 'checkbox',
                value: true,
                description: 'Automatically center and zoom to fit the model perfectly',
                onChange(formResult) {
                    if (formResult.auto_frame) {
                        frameModelForIcon(formResult);
                    }
                    updateLivePreview(dialog, formResult);
                }
            },
            
            zoom_level: {
                label: 'Zoom Level',
                type: 'range',
                min: 0.5,
                max: 3.0,
                step: 0.1,
                value: 1.0,
                description: 'Manually adjust zoom (0.5 = close, 3.0 = far)'
            },
            
                        rotate_x: {
                label: 'X-Axis Rotation',
                type: 'range',
                min: -180,
                max: 180,
                step: 5,
                value: 0,
                description: 'Rotate model around X-axis'
            },
            
            rotate_y: {
                label: 'Y-Axis Rotation',
                type: 'range',
                min: -180,
                max: 180,
                step: 5,
                value: 0,
                description: 'Rotate model around Y-axis'
            },
            
            rotate_z: {
                label: 'Z-Axis Rotation',
                type: 'range',
                min: -180,
                max: 180,
                step: 5,
                value: 0,
                description: 'Rotate model around Z-axis'
            },
            
            pan_x: {
                label: 'Pan Left/Right',
                type: 'range',
                min: -50,
                max: 50,
                step: 1,
                value: 0,
                description: 'Pan view horizontally in orthographic mode'
            },
            
            pan_y: {
                label: 'Pan Up/Down',
                type: 'range',
                min: -50,
                max: 50,
                step: 1,
                value: 0,
                description: 'Pan view vertically in orthographic mode'
            },
            

            
            quality: {
                label: 'Export Quality',
                type: 'select',
                options: {
                    'standard': 'Standard (4x render)',
                    'high': 'High Quality (8x render)',
                    'ultra': 'Ultra Quality (16x render)'
                },
                value: 'high',
                description: 'Higher quality takes longer but produces sharper icons'
            },
            
            filename: {
                label: 'Filename (without .png)',
                type: 'text',
                value: function() {
                    let name = Project.name || 'model';
                    name = name.replace(/\.geo\.json$/i, '').replace(/\.geo$/i, '');
                    name = name.replace(/\.[^.]+$/, '');
                    name = name.replace(/[^a-zA-Z0-9_-]/g, '_');
                    return name + '_icon';
                }()
            }
        },
        
        buttons: ['dialog.confirm', 'dialog.cancel'],
        
        onConfirm(formData) {
            stopCameraWatcher();
            generateIcon(formData);
            return true;
        },
        
        onCancel() {
            stopCameraWatcher();
            return true;
        },

        onFormChange(formData) {
            if (formData.auto_frame !== lastAutoFrameState) {
                if (formData.auto_frame) {
                    frameModelForIcon(formData).then(() => {
                        updateLivePreview(dialog, formData);
                    });
                } else {
                    updateLivePreview(dialog, formData);
                }
                lastAutoFrameState = formData.auto_frame;
            } else {
                updateLivePreview(dialog, formData);
            }
        }
    });

    dialog.show();
    
    setTimeout(async () => {
        await frameModelForIcon();
        
        let style = document.createElement('style');
        style.textContent = `
            #icon_exporter_dialog .form_wrapper,
            #icon_exporter_dialog .dialog_content {
                display: grid !important;
                grid-template-columns: 1fr 320px !important;
                gap: 20px !important;
                align-items: start !important;
                width: 100% !important;
                box-sizing: border-box !important;
                padding: 20px !important;
            }
            #icon_exporter_dialog .form_part,
            #icon_exporter_dialog .form_element:not(.preview_section),
            #icon_exporter_dialog .form_bar:not(.preview_section),
            #icon_exporter_dialog .form_group:not(.preview_section) {
                grid-column: 1 !important;
            }
            #icon_exporter_dialog .preview_section {
                grid-column: 2 !important;
                grid-row: 1 / -1 !important;
                position: sticky !important;
                top: 0 !important;
            }
        `;
        document.head.appendChild(style);
        
        
        let formContainer = dialog.object.querySelector('.form_wrapper') || 
                           dialog.object.querySelector('.dialog_content') ||
                           dialog.object.querySelector('form') ||
                           dialog.object.querySelector('.dialog_wrapper');
        
        
        if (formContainer) {
            previewSection.className = 'preview_section';
            formContainer.appendChild(previewSection);
            
            let formElements = formContainer.querySelectorAll('.form_element, .form_bar, .form_group');
            formElements.forEach(element => {
                if (!element.classList.contains('preview_section')) {
                    element.classList.add('form_part');
                }
            });
            
        } else {
            let dialogContent = dialog.object.querySelector('.dialog_content');
            if (dialogContent) {
                dialogContent.style.display = 'grid';
                dialogContent.style.gridTemplateColumns = '1fr 320px';
                dialogContent.style.gap = '20px';
                dialogContent.appendChild(previewSection);
            }
        }
        
        let resetButton = document.createElement('button');
        resetButton.textContent = 'Reset Camera to Auto-Frame';
        resetButton.style.cssText = 'margin: 10px 0; padding: 8px 16px; background: #4a90e2; color: white; border: none; border-radius: 4px; cursor: pointer;';
        resetButton.disabled = true;
        resetButton.style.opacity = '0.5';
        resetButton.style.cursor = 'not-allowed';
        resetButton.onclick = function() {
                        stopCameraWatcher();
            
            let formData = dialog.getFormResult();
            formData.zoom_level = 1.0;
            formData.rotate_x = 0;
            formData.rotate_y = 0;
            formData.rotate_z = 0;
            formData.pan_x = 0;
            formData.pan_y = 0;
            dialog.setFormValues(formData);
            baseCameraPosition = null;
            baseCameraTarget = null;
            
            resetButton.disabled = true;
            resetButton.style.opacity = '0.5';
            resetButton.style.cursor = 'not-allowed';
            
            setTimeout(() => {
                frameModelForIcon(formData).then(() => {
                    startCameraWatcher(dialog);
                    updateLivePreview(dialog, formData);
                });
            }, 100);
        };
        
        setTimeout(() => {
            let formContainer = dialog.object.querySelector('.form_part');
            if (formContainer) {
                let buttonContainer = document.createElement('div');
                buttonContainer.style.cssText = 'margin: 15px 0; text-align: center;';
                buttonContainer.appendChild(resetButton);
                
                let panUpElement = dialog.object.querySelector('[data-setting="pan_y"]');
                if (panUpElement) {
                    let panUpParent = panUpElement.closest('.form_element');
                    if (panUpParent && panUpParent.nextSibling) {
                        formContainer.insertBefore(buttonContainer, panUpParent.nextSibling);
                    } else {
                        formContainer.appendChild(buttonContainer);
                    }
                } else {
                    formContainer.appendChild(buttonContainer);
                }
                

            }
        }, 200);
        
        (async () => {
            let formData = dialog.getFormResult();
            if (formData.auto_frame) {
                await frameModelForIcon(formData);
            }
            await updateLivePreview(dialog, formData);
            startCameraWatcher(dialog);
        })();
    }, 100);
}

function getFormatSpecificInfo() {
    if (!Format) return 'Compatible with all model formats';
    
    switch(Format.id) {
        case 'bedrock':
        case 'bedrock_block':
            return '💡 Perfect for Bedrock item textures (16×16 recommended for game compatibility)';
        case 'java_block':
            return '💡 Ideal for Java item models (16×16 standard, 32×32 for detailed items)';
        case 'skin':
            return '💡 Great for skin previews (64×64 recommended for face icons)';
        case 'free':
            return '💡 Generic model export (any size works, 64×64+ recommended)';
        default:
            return '💡 Compatible with all model formats (choose size based on intended use)';
    }
}

function getRecommendedSize() {
    if (!Format) return '48';
    
    switch(Format.id) {
        case 'bedrock':
        case 'bedrock_block':
        case 'java_block':
            return '16';
        case 'skin':
            return '64';
        default:
            return '48';
    }
}

async function updateLivePreview(dialog, formData) {
    let iconSize = formData.icon_size === 'custom' ? 
        parseInt(formData.custom_size) : 
        parseInt(formData.icon_size);
        
    let infoElement = document.getElementById('preview_info_text');
    if (infoElement) {
        infoElement.textContent = `${iconSize}×${iconSize} pixels`;
    }
    
    let canvas = document.getElementById('live_icon_preview_canvas');
    if (canvas) {
        generateLivePreview(canvas, formData);
    }
}

function getBackgroundStyle(background) {
    switch(background) {
        case 'white': return '#FFFFFF';
        case 'black': return '#000000';
        case 'gray': return '#808080';
        case 'transparent': 
        default: 
            return 'repeating-conic-gradient(#CCC 0% 25%, #FFF 0% 50%) 50% / 10px 10px';
    }
}

function generateLivePreview(canvas, formData) {
    if (!canvas) return;
    
    let ctx = canvas.getContext('2d');
    let previewSize = canvas.width;
    
    let iconSize = formData.icon_size === 'custom' ? 
        parseInt(formData.custom_size) : 
        parseInt(formData.icon_size);
    
    let qualityMultiplier;
    switch(formData.quality) {
        case 'standard': qualityMultiplier = 4; break;
        case 'high': qualityMultiplier = 8; break;
        case 'ultra': qualityMultiplier = 16; break;
        default: qualityMultiplier = 8;
    }
    


    
    ctx.clearRect(0, 0, previewSize, previewSize);
    
    if (formData.background === 'transparent') {
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
    } else if (formData.background === 'custom') {
        ctx.fillStyle = formData.custom_color || '#ff0000';
        ctx.fillRect(0, 0, previewSize, previewSize);
    } else {
        ctx.fillStyle = getBackgroundColor(formData.background);
        ctx.fillRect(0, 0, previewSize, previewSize);
    }
    
    let sourceCanvas = null;
    
    if (typeof Preview !== 'undefined' && Preview.selected && Preview.selected.canvas) {
        sourceCanvas = Preview.selected.canvas;
    } else {
        sourceCanvas = document.querySelector('#preview canvas');
        if (!sourceCanvas) {
            sourceCanvas = document.querySelector('.preview canvas');
        }
    }
    
    if (sourceCanvas) {
        let tempCanvas = document.createElement('canvas');
        let tempCtx = tempCanvas.getContext('2d');
        
        let renderSize = iconSize * qualityMultiplier;
        tempCanvas.width = renderSize;
        tempCanvas.height = renderSize;
        
        tempCtx.imageSmoothingEnabled = true;
        tempCtx.imageSmoothingQuality = formData.quality === 'ultra' ? 'high' : 'medium';
        
        tempCtx.drawImage(sourceCanvas, 0, 0, renderSize, renderSize);
        
        ctx.imageSmoothingEnabled = true;
        ctx.imageSmoothingQuality = 'high';
        
        try {
            ctx.drawImage(tempCanvas, 0, 0, previewSize, previewSize);
        } catch (error) {
            ctx.fillStyle = '#333';
            ctx.fillRect(0, 0, previewSize, previewSize);
            ctx.fillStyle = '#fff';
            ctx.font = '12px Arial';
            ctx.textAlign = 'center';
            ctx.fillText('Error rendering preview', previewSize/2, previewSize/2 - 10);
            ctx.fillText(error.message, previewSize/2, previewSize/2 + 10);
        }
    } else {
        ctx.fillStyle = '#333';
        ctx.fillRect(0, 0, previewSize, previewSize);
        ctx.fillStyle = '#fff';
        ctx.font = '14px Arial';
        ctx.textAlign = 'center';
        ctx.fillText('No preview available', previewSize/2, previewSize/2 - 10);
        ctx.font = '10px Arial';
        ctx.fillText('Make sure model is visible', previewSize/2, previewSize/2 + 10);
    }
}

async function generateIcon(formData) {
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
            await frameModelForIcon(formData);
        }
        
        Blockbench.setProgress(0.3, 'Adjusting camera settings...');
        
        await new Promise(resolve => setTimeout(resolve, 200));
        
        Blockbench.setProgress(0.5, 'Capturing high-quality screenshot...');
        
        await captureIcon(formData, iconSize, filename);
        
        Blockbench.setProgress(1, 'Export complete!');
        
        setTimeout(() => Blockbench.setProgress(), 1000);

    } catch (error) {
        Blockbench.setProgress();

        Blockbench.showMessageBox({
            title: 'Export Failed',
            message: 'Failed to generate icon: ' + error.message,
            icon: 'error'
        });
    }
}

let baseCameraPosition = null;
let baseCameraTarget = null;
let lastAutoFrameState = true;
let lastCameraValues = { zoom_level: 1.0, rotate_x: 0, rotate_y: 0, pan_x: 0, pan_y: 0 };
let cameraWatchInterval = null;

function startCameraWatcher(dialog) {
    if (cameraWatchInterval) {
        clearInterval(cameraWatchInterval);
    }
    
    cameraWatchInterval = setInterval(() => {
        let currentValues = dialog.getFormResult();
        
        if (currentValues.zoom_level !== lastCameraValues.zoom_level ||
            currentValues.rotate_x !== lastCameraValues.rotate_x ||
            currentValues.rotate_y !== lastCameraValues.rotate_y ||
            currentValues.rotate_z !== lastCameraValues.rotate_z ||
            currentValues.pan_x !== lastCameraValues.pan_x ||
            currentValues.pan_y !== lastCameraValues.pan_y) {
            
                        let resetButton = dialog.object.querySelector('button');
            if (resetButton && resetButton.disabled) {
                resetButton.disabled = false;
                resetButton.style.opacity = '1';
                resetButton.style.cursor = 'pointer';
            }
            
            adjustCameraManually(currentValues);
            updateLivePreview(dialog, currentValues);
            
            lastCameraValues = {
                zoom_level: currentValues.zoom_level,
                rotate_x: currentValues.rotate_x,
                rotate_y: currentValues.rotate_y,
                rotate_z: currentValues.rotate_z,
                pan_x: currentValues.pan_x,
                pan_y: currentValues.pan_y
            };
        }
    }, 100);
}

function stopCameraWatcher() {
    if (cameraWatchInterval) {
        clearInterval(cameraWatchInterval);
        cameraWatchInterval = null;
    }
}

function adjustCameraManually(cameraData) {

    if (typeof Preview !== 'undefined' && Preview.selected && Preview.selected.camera) {
        let camera = Preview.selected.camera;
        
        if (!baseCameraPosition) {
            baseCameraPosition = camera.position.clone();
            baseCameraTarget = new THREE.Vector3(0, 8, 0);

        }
        
        let zoomLevel = cameraData.zoom_level || 1.0;
        let rotateX = cameraData.rotate_x || 0;
        let rotateY = cameraData.rotate_y || 0;
        let rotateZ = cameraData.rotate_z || 0;
        let panX = cameraData.pan_x || 0;
        let panY = cameraData.pan_y || 0;
        
        
        let newPosition = baseCameraPosition.clone().multiplyScalar(zoomLevel);
        
        let newTarget = baseCameraTarget.clone();
        let panScale = 2.0;
        newTarget.x += panX * panScale;
        newTarget.y += panY * panScale;
        
        camera.position.copy(newPosition);
        
        if (Preview.selected.controls && Preview.selected.controls.target) {
            Preview.selected.controls.target.copy(newTarget);
        } else {
            camera.lookAt(newTarget);
        }
        
        if (rotateX !== 0 || rotateY !== 0 || rotateZ !== 0) {
            let distance = newPosition.length();
            let center = new THREE.Vector3(0, 8, 0);
            
            let rotX = THREE.MathUtils.degToRad(rotateX);
            let rotY = THREE.MathUtils.degToRad(rotateY);
            
            let rotZ = THREE.MathUtils.degToRad(rotateZ);
            
            let spherical = new THREE.Spherical();
            spherical.setFromVector3(newPosition.clone().sub(center));
            
            spherical.theta += rotY;
            spherical.phi += rotX;
            
            let rotatedPosition = new THREE.Vector3();
            rotatedPosition.setFromSpherical(spherical).add(center);
            
            if (rotateZ !== 0) {
                let targetToCamera = rotatedPosition.clone().sub(newTarget);
                let axis = new THREE.Vector3(0, 0, 1);
                targetToCamera.applyAxisAngle(axis, rotZ);
                rotatedPosition = targetToCamera.add(newTarget);
            }
            
            let upVector = new THREE.Vector3(0, 1, 0);
            if (rotateZ !== 0) {
                let axis = new THREE.Vector3(0, 0, 1);
                upVector.applyAxisAngle(axis, rotZ);
            }
            
            let cameraPreset = {
                projection: 'perspective',
                position: [rotatedPosition.x, rotatedPosition.y, rotatedPosition.z],
                target: [newTarget.x, newTarget.y, newTarget.z]
            };
            
            Preview.selected.loadAnglePreset(cameraPreset);
            
            if (rotateZ !== 0 && Preview.selected.camera) {
                Preview.selected.camera.up.set(upVector.x, upVector.y, upVector.z);
                Preview.selected.camera.lookAt(newTarget.x, newTarget.y, newTarget.z);

            }
            

            return;
        }
        
        if (camera.updateProjectionMatrix) {
            camera.updateProjectionMatrix();
        }
        
        
        if (Preview.selected.controls && Preview.selected.controls.update) {
            Preview.selected.controls.update();
        }
        
        if (typeof Preview.selected.render === 'function') {
            Preview.selected.render();
            
            setTimeout(() => {
                let canvas = document.getElementById('live_icon_preview_canvas');
                if (canvas) {
                    generateLivePreview(canvas, cameraData);
                }
            }, 100);
        }
    } else {

    }
}

function frameModelForIcon(formData = {}, skipZoom = false) {

    return new Promise((resolve) => {
        try {
            let allElements = Project.elements.filter(element => element.visibility !== false);
            
            if (allElements.length === 0) {
                resolve();
                return;
            }

            if (typeof Outliner !== 'undefined' && Outliner.selected) {
                Outliner.selected.splice(0);
            allElements.forEach(element => {
                    Outliner.selected.push(element);
                });

            }
            


            
            if (typeof BarItems !== 'undefined' && BarItems.focus_on_selection) {

                let mockEvent = { ctrlKey: false, type: 'click' };
                if (typeof BarItems.focus_on_selection.click === 'function') {
                    BarItems.focus_on_selection.click(mockEvent);

                } else {

                }
                } else {

                }
                
                setTimeout(() => {

                if (typeof Preview !== 'undefined' && Preview.selected && Preview.selected.camera) {
                    let camera = Preview.selected.camera;

                    
                    let currentPos = camera.position.clone();
                    let distance = currentPos.length();

                    
                    if (!skipZoom && !baseCameraPosition) {
                        let newDistance = distance * 1.1;
                        let newPosition = currentPos.normalize().multiplyScalar(newDistance);
                        camera.position.copy(newPosition);

                        baseCameraPosition = camera.position.clone();
                    } else {
                        baseCameraPosition = camera.position.clone();

                    }
                    baseCameraTarget = new THREE.Vector3(0, 8, 0);
                    
                    if (typeof Preview.selected.render === 'function') {
                        Preview.selected.render();

                    }
                } else {

                }
                resolve();
            }, 200);

        } catch (error) {

            resolve();
        }
    });
}

function getBackgroundColor(background) {
    switch(background) {
        case 'white': return '#FFFFFF';
        case 'black': return '#000000';
        case 'gray': return '#808080';
        case 'transparent': 
        default: 
            return null;
    }
}

async function captureIcon(formData, iconSize, filename) {
    return new Promise((resolve, reject) => {
        try {
            let multiplier;
            switch(formData.quality) {
                case 'standard': multiplier = 4; break;
                case 'high': multiplier = 8; break;
                case 'ultra': multiplier = 16; break;
                default: multiplier = 8;
            }
            
            let captureSize = iconSize * multiplier;
        
        if (typeof MediaRecorder !== 'undefined' && MediaRecorder.capture) {
                MediaRecorder.capture({
                    type: 'image',
                    width: captureSize,
                    height: captureSize,
                    callback: function(blob) {
                        if (blob && blob.size > 0) {
                            processImageBlob(blob, formData, iconSize, filename);
                            resolve();
                        } else {
                            captureFromCanvas(formData, iconSize, filename);
                            resolve();
                        }
                    }
                });
                
                setTimeout(() => {
                    captureFromCanvas(formData, iconSize, filename);
                    resolve();
                }, 3000);
                
            } else {
                captureFromCanvas(formData, iconSize, filename);
                resolve();
            }

        } catch (error) {
            reject(error);
        }
    });
}

function captureFromCanvas(formData, iconSize, filename) {
    try {
        let sourceCanvas = null;
        if (Preview && Preview.selected && Preview.selected.canvas) {
            sourceCanvas = Preview.selected.canvas;
        } else {
            sourceCanvas = document.querySelector('#preview canvas');
            if (!sourceCanvas) {
                sourceCanvas = document.querySelector('.preview canvas');
            }
        }
        
        if (!sourceCanvas) {
            throw new Error('Could not find preview canvas');
        }
        
        let multiplier;
        switch(formData.quality) {
            case 'standard': multiplier = 4; break;
            case 'high': multiplier = 8; break;
            case 'ultra': multiplier = 16; break;
            default: multiplier = 8;
        }
        
        let captureSize = iconSize * multiplier;
            let tempCanvas = document.createElement('canvas');
            tempCanvas.width = captureSize;
            tempCanvas.height = captureSize;
            let ctx = tempCanvas.getContext('2d');
        
        if (formData.background === 'custom') {
            ctx.fillStyle = formData.custom_color || '#ff0000';
            ctx.fillRect(0, 0, captureSize, captureSize);
        } else {
            let bgColor = getBackgroundColor(formData.background);
            if (bgColor) {
                ctx.fillStyle = bgColor;
                ctx.fillRect(0, 0, captureSize, captureSize);
            }
        }
            
            ctx.imageSmoothingEnabled = true;
        ctx.imageSmoothingQuality = formData.quality === 'ultra' ? 'high' : 'medium';
            
            ctx.drawImage(sourceCanvas, 0, 0, captureSize, captureSize);
            
        resizeAndExport(tempCanvas, iconSize, filename);
        
    } catch (error) {

        Blockbench.showMessageBox({
            title: 'Capture Failed',
            message: 'Could not capture the model view. Please ensure a model is loaded and visible.',
            icon: 'error'
        });
    }
}

function processImageBlob(blob, formData, iconSize, filename) {
    let img = new Image();
    img.onload = function() {
        let canvas = document.createElement('canvas');
        canvas.width = img.width;
        canvas.height = img.height;
        let ctx = canvas.getContext('2d');
        
        if (formData.background === 'custom') {
            ctx.fillStyle = formData.custom_color || '#ff0000';
            ctx.fillRect(0, 0, canvas.width, canvas.height);
        } else {
            let bgColor = getBackgroundColor(formData.background);
            if (bgColor) {
                ctx.fillStyle = bgColor;
                ctx.fillRect(0, 0, canvas.width, canvas.height);
            }
        }
        
        ctx.drawImage(img, 0, 0);
        resizeAndExport(canvas, iconSize, filename);
        
        URL.revokeObjectURL(img.src);
    };
    img.onerror = function() {

        captureFromCanvas(formData, iconSize, filename);
    };
    img.src = URL.createObjectURL(blob);
}

function resizeAndExport(sourceCanvas, targetSize, filename) {
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
        
            ctx.imageSmoothingEnabled = true;
            ctx.imageSmoothingQuality = 'high';
        
        ctx.drawImage(currentCanvas, 0, 0, targetSize, targetSize);
        
        finalCanvas.toBlob(function(blob) {
            exportFinalImage(blob, filename, targetSize);
        }, 'image/png');
        
    } catch (error) {

        Blockbench.showMessageBox({
            title: 'Resize Error',
            message: 'Failed to resize image: ' + error.message,
            icon: 'error'
        });
    }
}

function exportFinalImage(blob, filename, iconSize) {
    try {
        let reader = new FileReader();
        reader.onload = function() {
            let dataURL = reader.result;
            
            Blockbench.export({
                type: 'PNG Image',
                extensions: ['png'],
                name: filename.replace('.png', ''),
                content: dataURL,
                savetype: 'image'
            }, function(path) {
                if (path) {
                    Blockbench.showMessageBox({
                        title: 'Export Complete',
                        message: `✅ ${iconSize}×${iconSize} icon exported successfully!\n\nReady for use in your project.`,
                        icon: 'check'
                    });
                } else {
                    Blockbench.showQuickMessage('Export cancelled');
                }
            });
        };
        reader.onerror = function() {
            throw new Error('Failed to read image data');
        };
        reader.readAsDataURL(blob);

    } catch (error) {

        Blockbench.showMessageBox({
            title: 'Export Error',
            message: 'Failed to export icon: ' + error.message,
            icon: 'error'
        });
    }
}

async function quickExportIcon(size) {
    if (!Format || !Project || !Project.elements || Project.elements.length === 0) {
        Blockbench.showMessageBox({
            title: 'No Model',
            message: 'Please load a model first before exporting an icon.',
            icon: 'warning'
        });
        return;
    }

    Blockbench.setProgress(0.1, 'Preparing quick export...');
    
    let formData = {
        icon_size: size.toString(),
        background: 'transparent',
        auto_frame: true,
        quality: 'high',
        filename: function() {
            let name = Project.name || 'model';
            name = name.replace(/\.geo\.json$/i, '').replace(/\.geo$/i, '');
            name = name.replace(/\.[^.]+$/, '');
            name = name.replace(/[^a-zA-Z0-9_-]/g, '_');
            return name + '_icon_' + size;
        }()
    };
    
    await frameModelForIcon(formData);
    await generateIcon(formData);
}