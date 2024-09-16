class TemplateManager {
    constructor(storage) {
        this.storage = storage;
        this.templates = [];
    }

    loadTemplates(callback) {
        this.storage.loadTemplates((templates) => {
            this.templates = templates;
            if (callback) callback(this.templates);
        });
    }

    saveTemplate(templateData, callback) {
        this.storage.saveTemplate(templateData, () => {
            this.loadTemplates(callback);
        });
    }

    deleteTemplate(index, callback) {
        this.storage.deleteTemplate(index, () => {
            this.templates = this.templates.filter(template => template.index !== index);
            if (callback) callback(this.templates);
        });
    }

    getTemplate(index) {
        return this.templates[index];
    }

    getNextTemplateIndex() {
        return this.templates.length > 0 ? 
            this.templates[this.templates.length - 1].index + 1 : 0;
    }
}
