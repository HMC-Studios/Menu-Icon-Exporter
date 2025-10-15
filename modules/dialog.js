const IconDialog = {
    
    openIconExporterDialog() {
        if (!Format || !Project || !Project.elements || Project.elements.length === 0) {
            Blockbench.showMessageBox({
                title: 'No Model',
                message: 'Please load a model first before exporting an icon.',
                icon: 'warning'
            });
            return;
        }

        let previewCanvas = IconPreview.createPreviewCanvas(256);
        let previewSection = IconPreview.createPreviewSection(previewCanvas);

        let dialog = new Dialog({
            id: 'icon_exporter_dialog',
            title: 'Menu Icon Exporter',
            width: 900,
            form: this.createFormDefinition(),
            
            buttons: ['dialog.confirm', 'dialog.cancel'],
            
            onConfirm(formData) {
                IconExport.generateIcon(formData);
                return true;
            },
            
            onCancel() {
                return true;
            },

            onFormChange(formData) {
                IconPreview.updateLivePreview(dialog, formData);
            }
        });

        dialog.show();
        
        this.setupDialogLayout(dialog, previewSection);
    },

    createFormDefinition() {
        return {
            layout_wrapper: {
                type: 'info',
                text: ''
            },
            
            settings_column: {
                type: 'info',
                text: IconUtils.getFormatSpecificInfo()
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
                value: IconUtils.getRecommendedSize(),
                onChange(formResult) {
                    IconPreview.updateLivePreview(this.dialog, formResult);
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
                    IconPreview.updateLivePreview(this.dialog, formResult);
                }
            },
            
            background: {
                label: 'Background',
                type: 'select',
                options: {
                    'transparent': 'Transparent',
                    'white': 'White (#FFFFFF)',
                    'black': 'Black (#000000)',
                    'gray': 'Gray (#808080)'
                },
                value: 'transparent',
                description: 'Background color for the exported icon',
                onChange(formResult) {
                    IconPreview.updateLivePreview(this.dialog, formResult);
                }
            },
            
            auto_frame: {
                label: 'Auto-frame Model',
                type: 'checkbox',
                value: true,
                description: 'Automatically center and zoom to fit the model perfectly',
                onChange(formResult) {
                    IconPreview.updateLivePreview(this.dialog, formResult);
                }
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
                value: IconUtils.generateDefaultFilename()
            }
        };
    },

    setupDialogLayout(dialog, previewSection) {
        setTimeout(async () => {
            await IconCamera.frameModelForIcon();
            
            this.addLayoutCSS();
            
            this.attachPreviewToDialog(dialog, previewSection);
            
            IconPreview.updateLivePreview(dialog, dialog.getFormResult());
        }, 100);
    },

    addLayoutCSS() {
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
    },

    attachPreviewToDialog(dialog, previewSection) {
        console.log('Dialog object:', dialog.object);
        console.log('Dialog content:', dialog.object.querySelector('.dialog_content'));
        
        let formContainer = dialog.object.querySelector('.form_wrapper') || 
                           dialog.object.querySelector('.dialog_content') ||
                           dialog.object.querySelector('form') ||
                           dialog.object.querySelector('.dialog_wrapper');
        
        console.log('Found container:', formContainer);
        
        if (formContainer) {
            previewSection.className = 'preview_section';
            formContainer.appendChild(previewSection);
            
            let formElements = formContainer.querySelectorAll('.form_element, .form_bar, .form_group');
            formElements.forEach(element => {
                if (!element.classList.contains('preview_section')) {
                    element.classList.add('form_part');
                }
            });
            
            console.log('Preview section added to container, found', formElements.length, 'form elements');
        } else {
            console.log('No suitable container found');
            let dialogContent = dialog.object.querySelector('.dialog_content');
            if (dialogContent) {
                dialogContent.style.display = 'grid';
                dialogContent.style.gridTemplateColumns = '1fr 320px';
                dialogContent.style.gap = '20px';
                dialogContent.appendChild(previewSection);
                console.log('Added preview to dialog content directly');
            }
        }
    }
};

if (typeof module !== 'undefined' && module.exports) {
    module.exports = IconDialog;
} else if (typeof window !== 'undefined') {
    window.IconDialog = IconDialog;
}