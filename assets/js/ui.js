class UIManager {
    constructor(memeGenerator) {
        this.memeGenerator = memeGenerator;
        this.initElements();
        this.initHandlers();
    }

    initElements() {
        this.uploadSection = document.getElementById('upload-section');
        this.imageUpload = document.getElementById('image-upload');
        this.uploadBtn = document.getElementById('upload-btn');
        this.editor = document.getElementById('editor');
        this.memeImage = document.getElementById('meme-image');
        this.textFieldsContainer = document.getElementById('text-fields-container');
        this.addTextFieldBtn = document.getElementById('add-text-field');
        this.textColor = document.getElementById('text-color');
        this.backgroundColor = document.getElementById('background-color');
        this.templatesList = document.getElementById('templates-list');
        this.templatesContainer = document.getElementById('templates-container');
        this.memeCreator = document.getElementById('meme-creator');
        this.memePreview = document.getElementById('meme-preview');
        this.generateMemeBtn = document.getElementById('generate-button');
        this.downloadMemeBtn = document.getElementById('download-button');
        this.fontSizeControl = document.getElementById('font-size');
        this.textAlignControl = document.getElementById('text-align-control');
    }

    initHandlers() {
        this.uploadBtn.addEventListener('click', () => this.imageUpload.click());
        this.imageUpload.addEventListener('change', (e) => this.memeGenerator.handleImageUpload(e));
        this.addTextFieldBtn.addEventListener('click', () => this.memeGenerator.addTextField());
        this.textColor.addEventListener('change', () => this.memeGenerator.updateTextColor());
        this.backgroundColor.addEventListener('change', () => this.memeGenerator.updateBackgroundColor());
        this.fontSizeControl.addEventListener('input', () => this.memeGenerator.changeFontSize());
        this.textAlignControl.addEventListener('change', () => this.memeGenerator.changeTextAlign());
        this.generateMemeBtn.addEventListener('click', () => this.memeGenerator.generateMeme());
        this.downloadMemeBtn.addEventListener('click', () => this.memeGenerator.downloadMeme());
    }

    updateTemplatesList(templates) {
        if (templates.length === 0) {
            this.templatesContainer.innerHTML = 'Вы пока не сохраняли изображения';
            return;
        }

        this.templatesContainer.innerHTML = '';
        templates.forEach((template, index) => {
            const templateEl = document.createElement('div');
            templateEl.className = 'template-item';

            const img = document.createElement('img');
            img.src = template.image;
            img.alt = `${template.index}`;

            const deleteBtn = document.createElement('div');
            deleteBtn.className = 'delete-template-btn';

            deleteBtn.addEventListener('click', (e) => {
                e.stopPropagation();
                this.memeGenerator.deleteTemplate(template.index);
            });

            templateEl.appendChild(img);
            templateEl.appendChild(deleteBtn);
            templateEl.addEventListener('click', () => this.memeGenerator.loadTemplate(index));
            this.templatesContainer.appendChild(templateEl);
        });
    }

    showEditor() {
        this.editor.style.display = 'block';
        this.uploadSection.style.display = 'none';
        this.templatesList.style.display = 'none';
    }

    showMemePreview() {
        this.memeCreator.style.display = 'block';
        this.editor.style.display = 'none';
        this.downloadMemeBtn.style.display = 'block';
    }

    clearMemePreview() {
        this.memePreview.innerHTML = '';
    }

    clearTextFields() {
        this.textFieldsContainer.innerHTML = '';
    }

    setMemeImage(src) {
        this.memeImage.src = src;
    }

    showDownloadButton(show) {
        this.downloadMemeBtn.style.display = show ? 'block' : 'none';
    }

    setDownloadButtonState(loading) {
        if (loading) {
            this.downloadMemeBtn.classList.add('loading');
            this.downloadMemeBtn.disabled = true;
        } else {
            this.downloadMemeBtn.classList.remove('loading');
            this.downloadMemeBtn.disabled = false;
        }
    }
}
