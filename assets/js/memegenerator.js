class MemeGenerator {
    constructor() {
        this.currentImage = null;
        this.currentTemplateIndex = null;
        this.textFields = [];
        this.templates = [];

        this.initElements();
        this.initHandlers();

        this.storage = new Storage();

        this.storage.onDbReady(() => {
            this.loadTemplatesFromDB();
        });
    }

    initElements() {
        this.preloader = document.getElementById('p_prldr');
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
        this.imageUpload.addEventListener('change', (e) => this.handleImageUpload(e));
        this.addTextFieldBtn.addEventListener('click', () => this.addTextField());
        this.textColor.addEventListener('change', () => this.updateTextColor());
        this.backgroundColor.addEventListener('change', () => this.updateBackgroundColor());
        this.fontSizeControl.addEventListener('input', () => this.changeFontSize());
        this.textAlignControl.addEventListener('change', () => this.changeTextAlign());
        this.generateMemeBtn.addEventListener('click', () => this.generateMeme());
        this.downloadMemeBtn.addEventListener('click', () => this.downloadMeme());
    }

    handleImageUpload(e) {
        const file = e.target.files[0];
        if (file && file.type.startsWith('image/')) {
            const reader = new FileReader();
            reader.onload = (event) => {
                this.currentImage = event.target.result;
                this.memeImage.src = this.currentImage;
                this.editor.style.display = 'block';
                this.uploadSection.style.display = 'none';
                this.templatesList.style.display = 'none';
                this.memePreview.innerHTML = '';
                this.textFieldsContainer.innerHTML = '';
                this.textFields = [];
                this.currentTemplateIndex = this.templates.length > 0 ? this.templates[this.templates.length - 1].index + 1 : 0;
            };
            reader.readAsDataURL(file);
        } else {
            alert('Пожалуйста, загрузите изображение');
        }
    }

    addTextField(left = '5%', top = '5%', width = '30%', height = '15%', color = '#000000', backgroundColor = 'rgba(0, 0, 0, 0)', text = '', fontSize = 16, textAlign = 'center') {
        const textField = document.createElement('div');
        textField.className = 'text-field';

        Object.assign(textField.style, {
            position: 'absolute',
            left,
            top,
            width,
            height,
            color,
            backgroundColor,
            fontSize: `${fontSize}px`,
            textAlign
        });

        const textInput = document.createElement('div');
        textInput.className = 'text-input';
        textInput.contentEditable = "plaintext-only";
        textInput.innerHTML = text;

        textField.appendChild(textInput);
        this.textFieldsContainer.appendChild(textField);
        this.makeResizableAndDraggable(textField);

        textField.addEventListener('click', () => this.selectTextField(textField));

        this.textFields.push({
            element: textField,
            getText: () => textInput.innerHTML.replace(/<[^>]+>/g, ''),
            getPosition: () => ({
                left: textField.style.left,
                top: textField.style.top
            }),
            getSize: () => ({
                width: textField.style.width,
                height: textField.style.height
            }),
            getColor: () => textField.style.color,
            getBackgroundColor: () => textField.style.backgroundColor,
            getFontSize: () => parseInt(textField.style.fontSize),
            getTextAlign: () => textField.style.textAlign
        });
    }

    selectTextField(textField) {
        this.currentTextField = textField;
        this.fontSizeControl.value = parseInt(textField.style.fontSize);
        this.textAlignControl.value = textField.style.textAlign;

        const textRgb = textField.style.color;
        this.textColor.value = textRgb.startsWith('rgb') ? `#${textRgb.match(/\d+/g).map(x => parseInt(x).toString(16).padStart(2, '0')).join('')}` : textRgb;

        const backgroundRgb = textField.style.backgroundColor;
        this.backgroundColor.value = backgroundRgb.startsWith('rgb') ? `#${backgroundRgb.match(/\d+/g).map(x => parseInt(x).toString(16).padStart(2, '0')).join('')}` : backgroundRgb;
    
        document.querySelectorAll('.text-field').forEach(field => field.classList.remove('active'));
        textField.classList.add('active');
    }
    
    updateBackgroundColor() {
        if (this.currentTextField) {
            this.currentTextField.style.backgroundColor = this.backgroundColor.value;
        }
    }

    updateTextColor() {
        if (this.currentTextField) {
            this.currentTextField.style.color = this.textColor.value;
        }
    }

    changeFontSize() {
        if (this.currentTextField) {
            this.currentTextField.style.fontSize = `${this.fontSizeControl.value}px`;
        }
    }

    changeTextAlign() {
        if (this.currentTextField) {
            this.currentTextField.style.textAlign = this.textAlignControl.value;
        }
    }    

    makeResizableAndDraggable(element) {
        let isResizing = false;
        let isDragging = false;
        let startX, startY, startWidth, startHeight;

        const image = this.memeImage;

        const deleter = document.createElement('div');
        deleter.className = 'delete-btn';
        element.appendChild(deleter);

        const resizer = document.createElement('div');
        resizer.className = 'resizer';
        element.appendChild(resizer);

        element.addEventListener('mousedown', initDrag);
        document.addEventListener('mousemove', drag);
        document.addEventListener('mouseup', stopDrag);

        element.addEventListener('touchstart', initDrag);
        document.addEventListener('touchmove', drag);
        document.addEventListener('touchend', stopDrag);

        resizer.addEventListener('mousedown', initResize);
        document.addEventListener('mousemove', resize);
        document.addEventListener('mouseup', stopResize);

        resizer.addEventListener('touchstart', initResize);
        document.addEventListener('touchmove', resize);
        document.addEventListener('touchend', stopResize);

        deleter.addEventListener('click', () => this.removeField(element));

        function initDrag(e) {
            if (e.target === resizer) return;
            isDragging = true;
            const clientX = e.clientX || e.touches[0].clientX;
            const clientY = e.clientY || e.touches[0].clientY;
            startX = clientX - element.offsetLeft;
            startY = clientY - element.offsetTop;
        }

        function drag(e) {
            if (!isDragging) return;
            const clientX = e.clientX || e.touches[0].clientX;
            const clientY = e.clientY || e.touches[0].clientY;
            const newLeft = clientX - startX;
            const newTop = clientY - startY;
            
            element.style.left = `${(newLeft / image.offsetWidth * 100).toFixed(2)}%`;
            element.style.top = `${(newTop / image.offsetHeight * 100).toFixed(2)}%`;
        }

        function stopDrag() {
            isDragging = false;
        }

        function initResize(e) {
            isResizing = true;
            const clientX = e.clientX || e.touches[0].clientX;
            const clientY = e.clientY || e.touches[0].clientY;
            startX = clientX;
            startY = clientY;
            startWidth = parseInt(window.getComputedStyle(element).width, 10);
            startHeight = parseInt(window.getComputedStyle(element).height, 10);
        }

        function resize(e) {
            if (!isResizing) return;
            const clientX = e.clientX || e.touches[0].clientX;
            const clientY = e.clientY || e.touches[0].clientY;
            const width = startWidth + (clientX - startX);
            const height = startHeight + (clientY - startY);

            element.style.width = `${(width / image.offsetWidth * 100).toFixed(2)}%`;
            element.style.height = `${(height / image.offsetHeight * 100).toFixed(2)}%`;
        }

        function stopResize() {
            isResizing = false;
        }
    }   

    removeField(textField) {
        textField.remove();
        this.textFields = this.textFields.filter(field => field.element !== textField);
    }

    updateTemplatesList() {
        if(this.templates.length === 0){
            this.templatesContainer.innerHTML = 'Вы пока не сохраняли изображения';
            return;
        }

        this.templatesContainer.innerHTML = '';
        this.templates.forEach((template, index) => {
            const templateEl = document.createElement('div');
            templateEl.className = 'template-item';

            const img = document.createElement('img');
            img.src = template.image;
            img.alt = `${template.index}`;

            const deleteBtn = document.createElement('div');
            deleteBtn.className = 'delete-template-btn';

            deleteBtn.addEventListener('click', (e) => {
                e.stopPropagation();
                this.deleteTemplateFromDB(template.index);
            });

            templateEl.appendChild(img);
            templateEl.appendChild(deleteBtn);
            templateEl.addEventListener('click', () => this.loadTemplate(index));
            this.templatesContainer.appendChild(templateEl);
        });
    }

    loadTemplate(index) {
        const template = this.templates[index];
        this.currentImage = template.image;
        this.memeImage.src = this.currentImage;
        this.memePreview.innerHTML = '';

        this.uploadSection.style.display = 'none';
        this.templatesList.style.display = 'none';
        this.editor.style.display = 'block';

        this.textFieldsContainer.innerHTML = '';
        this.textFields = [];

        template.textFields.forEach((field) => {
            this.addTextField(
                field.position.left,
                field.position.top,
                field.size.width,
                field.size.height,
                field.color,
                field.backgroundColor,
                field.text,
                field.fontSize,
                field.textAlign
            );
        });

        this.currentTemplateIndex = index;
    }

    saveTemplate() {
        if (!this.currentImage) {
            return;
        }

        const templateData = {
            index: this.currentTemplateIndex,
            image: this.currentImage,
            textFields: this.textFields.map(field => ({
                position: field.getPosition(),
                size: field.getSize(),
                color: field.getColor(),
                backgroundColor: field.getBackgroundColor(),
                text: field.getText(),
                fontSize: field.getFontSize(),
                textAlign: field.getTextAlign()
            }))
        };

        this.storage.saveTemplate(templateData, () => {
            this.updateTemplatesList();
        });
    }

    loadTemplatesFromDB() {
        this.storage.loadTemplates((templates) => {
            this.templates = templates;
            this.updateTemplatesList();
        });
    }

    deleteTemplateFromDB(index) {
        this.storage.deleteTemplate(index, () => {
            this.templates = this.templates.filter(template => template.index !== index);
            this.updateTemplatesList();
        });
    }

    generateMeme() {
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        const img = new Image();
        img.onload = () => {
            canvas.width = img.width;
            canvas.height = img.height;
            ctx.drawImage(img, 0, 0);

            this.textFields.forEach((field) => {
                const rect = field.element.getBoundingClientRect();
                const containerRect = this.memeImage.getBoundingClientRect();

                const left = rect.left - containerRect.left;
                const top = rect.top - containerRect.top;

                const scaleX = canvas.width / this.memeImage.width;
                const scaleY = canvas.height / this.memeImage.height;

                const xPos = left * scaleX;
                const yPos = top * scaleY;
                const maxWidth = rect.width * scaleX;
                const maxHeight = rect.height * scaleY;
                const backgroundColor = field.getBackgroundColor();
                const fontSize = parseInt(window.getComputedStyle(field.element).fontSize, 10) * scaleY;
                const fontWeight = window.getComputedStyle(field.element).fontWeight;
                const fontStyle = window.getComputedStyle(field.element).fontStyle;
                const textAlign = window.getComputedStyle(field.element).textAlign;
                const lineHeight = fontSize;

                if (backgroundColor !== 'rgba(0, 0, 0, 0)') {
                    ctx.fillStyle = backgroundColor;
                    ctx.fillRect(xPos, yPos, maxWidth, maxHeight);
                }

                ctx.font = `${fontStyle} ${fontWeight} ${fontSize}px Arial`;
                ctx.fillStyle = field.getColor();
                ctx.textBaseline = 'top';
                ctx.textAlign = textAlign;

                this.wrapText(ctx, field.getText(), xPos, yPos, maxWidth, maxHeight, lineHeight, textAlign);
            });

            this.memePreview.innerHTML = '';
            this.memePreview.appendChild(canvas);
            this.editor.style.display = 'none';
            this.memeCreator.style.display = 'block';
            this.downloadMemeBtn.style.display = 'block';

            this.saveTemplate();
        };
        img.src = this.currentImage;
    }

    wrapText(ctx, text, x, y, blockWidth, blockHeight, lineHeight, textAlign) {
        const paragraphs = text.split(/\n/);
        const lines = [];

        paragraphs.forEach(paragraph => {
            const words = paragraph.split(/\s+/);
            let line = '';

            words.forEach((word, index) => {
                const testLine = line + word + ' ';
                const testWidth = ctx.measureText(testLine).width;

                if (testWidth > blockWidth && index > 0) {
                    lines.push(line.trim());
                    line = word + ' ';
                } else {
                    line = testLine;
                }
            });

            lines.push(line.trim());
        });

        const totalTextHeight = lineHeight * lines.length;
        const yStart = y + (blockHeight - totalTextHeight) / 2;

        lines.forEach((line, index) => {
            let textX = x;
            
            switch (textAlign) {
                case 'left':
                    textX = x;
                    ctx.textAlign = 'left';
                    break;
                case 'right':
                    textX = x + blockWidth;
                    ctx.textAlign = 'right';
                    break;
                default:
                    textX = x + blockWidth / 2;
                    ctx.textAlign = 'center';
            }

            const yOffset = yStart + index * lineHeight;
            ctx.fillText(line, textX, yOffset);
        });
    }

    downloadMeme() {
        const downloadBtn = this.downloadMemeBtn;
        downloadBtn.classList.add('loading');
        downloadBtn.disabled = true;
    
        const canvas = this.memePreview.querySelector('canvas');
    
        canvas.toBlob((blob) => {
            const link = document.createElement('a');
            link.href = URL.createObjectURL(blob);
            link.download = 'meme.png';
            link.click();

            downloadBtn.classList.remove('loading');
            downloadBtn.disabled = false;
        }, 'image/png');
    }       
}
