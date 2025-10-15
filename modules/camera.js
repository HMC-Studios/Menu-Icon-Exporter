const IconCamera = {
    
    async frameModelForIcon() {
        return new Promise((resolve) => {
            try {
                let allElements = Project.elements.filter(element => element.visibility !== false);
                
                if (allElements.length === 0) {
                    resolve();
                    return;
                }

                let originalSelection = [];
                if (typeof Outliner !== 'undefined' && Outliner.selected) {
                    originalSelection = Outliner.selected.slice();
                }
                
                if (typeof Outliner !== 'undefined' && Outliner.selected) {
                    Outliner.selected.splice(0);
                    allElements.forEach(element => {
                        if (element.select && typeof element.select === 'function') {
                            element.select();
                        } else {
                            Outliner.selected.push(element);
                        }
                    });
                }
                
                if (typeof BarItems !== 'undefined' && BarItems.focus_on_selection) {
                    let mockEvent = { 
                        ctrlKey: true, 
                        ctrlOrCmd: true,
                        shiftKey: false,
                        altKey: false,
                        metaKey: false,
                        type: 'click' 
                    };
                    
                    if (typeof BarItems.focus_on_selection.click === 'function') {
                        BarItems.focus_on_selection.click(mockEvent);
                    } else {
                        BarItems.focus_on_selection.trigger(mockEvent);
                    }
                }
                
                setTimeout(() => {
                    if (typeof Outliner !== 'undefined' && Outliner.selected) {
                        Outliner.selected.splice(0);
                        originalSelection.forEach(element => {
                            if (element.select && typeof element.select === 'function') {
                                element.select();
                            } else {
                                Outliner.selected.push(element);
                            }
                        });
                    }
                    resolve();
                }, 300);

            } catch (error) {
                console.warn('Error framing model:', error);
                resolve();
            }
        });
    }
};

if (typeof module !== 'undefined' && module.exports) {
    module.exports = IconCamera;
} else if (typeof window !== 'undefined') {
    window.IconCamera = IconCamera;
}