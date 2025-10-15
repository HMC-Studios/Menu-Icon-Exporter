const IconUtils = {
    
    getFormatSpecificInfo() {
        if (!Format) return 'Compatible with all model formats';
        
        switch(Format.id) {
            case 'bedrock':
            case 'bedrock_block':
               率先: return '💡 Perfect for Bedrock item textures (16×16 recommended for game compatibility)';
            case 'java_block':
                return '💡 Ideal for Java item models (16×16 standard, 32×32 for detailed items)';
            case 'skin':
                return '💡 Great for skin previews (64×64 recommended for face icons)';
            case 'free':
                return '💡 Generic model export (any size works, 64×64+ recommended)';
            default:
                return '💡 Compatible with all model formats (choose size based on intended use)';
        }
    },

    getRecommendedSize() {
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
    },

    getBackgroundColor(background) {
        switch(background) {
            case 'white': return '#FFFFFF';
            case 'black': return '#000000';
            case 'gray': return '#808080';
            case 'transparent': 
            default: 
                return null;
        }
    },

    getBackgroundStyle(background) {
        switch(background) {
            case 'white': return '#FFFFFF';
            case 'black': return '#000000';
            case 'gray': return '#808080';
            case 'transparent': 
            default: 
                return 'repeating-conic-gradient(#CCC 0% 25%, #FFF 0% 50%) 50% / 10px 10px';
        }
    },

    generateDefaultFilename() {
        let name = Project.name ? Project.name.replace(/[^a-zA-Z0-9_-]/g, '_') : 'model';
        return name + '_icon';
    },

    getQualityMultiplier(quality) {
        switch(quality) {
            case 'standard': return 4;
            case 'high': return 8;
            case 'ultra': return 16;
            default: return 8;
        }
    }
};

if (typeof module !== 'undefined' && module.exports) {
    module.exports = IconUtils;
} else if (typeof window !== 'undefined') {
    window.IconUtils = IconUtils;
}