class MemeGenerator {
    constructor() {
        this.currentImage = null;
        this.currentTextField = null;
        this.textFields = [];

        this.storage = new Storage();
        this.template = new TemplateManager(this.storage);
        this.ui = new UIManager(this);

        this.template.loadTemplates(() => {
            this.ui.updateTemplatesList(this.template.templates);
        });
    }

    handleImageUpload(e) {
        const file = e.target.files[0];
        if (file && file.type.startsWith('image/')) {
            const reader = new FileReader();
            reader.onload = (event) => {
                this.currentImage = event.target.result;
                this.ui.setMemeImage(this.currentImage);
                this.ui.showEditor();
                this.ui.clearMemePreview();
                this.ui.clearTextFields();
                this.textFields = [];
                this.currentTemplateIndex = this.template.getNextTemplateIndex();
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
        this.ui.textFieldsContainer.appendChild(textField);
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
        this.ui.fontSizeControl.value = parseInt(textField.style.fontSize);
        this.ui.textAlignControl.value = textField.style.textAlign;

        const textRgb = textField.style.color;
        this.ui.textColor.value = textRgb.startsWith('rgb') ? `#${textRgb.match(/\d+/g).map(x => parseInt(x).toString(16).padStart(2, '0')).join('')}` : textRgb;

        const backgroundRgb = textField.style.backgroundColor;
        this.ui.backgroundColor.value = backgroundRgb.startsWith('rgb') ? `#${backgroundRgb.match(/\d+/g).map(x => parseInt(x).toString(16).padStart(2, '0')).join('')}` : backgroundRgb;
    
        document.querySelectorAll('.text-field').forEach(field => field.classList.remove('active'));
        textField.classList.add('active');
    }

    updateBackgroundColor() {
        if (this.currentTextField) {
            this.currentTextField.style.backgroundColor = this.ui.backgroundColor.value;
        }
    }

    updateTextColor() {
        if (this.currentTextField) {
            this.currentTextField.style.color = this.ui.textColor.value;
        }
    }

    changeFontSize() {
        if (this.currentTextField) {
            this.currentTextField.style.fontSize = `${this.ui.fontSizeControl.value}px`;
        }
    }

    changeTextAlign() {
        if (this.currentTextField) {
            this.currentTextField.style.textAlign = this.ui.textAlignControl.value;
        }
    }

    makeResizableAndDraggable(element) {
        let isResizing = false;
        let isDragging = false;
        let startX, startY, startWidth, startHeight;

        const image = this.ui.memeImage;

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
                const containerRect = this.ui.memeImage.getBoundingClientRect();

                const left = rect.left - containerRect.left;
                const top = rect.top - containerRect.top;

                const scaleX = canvas.width / this.ui.memeImage.width;
                const scaleY = canvas.height / this.ui.memeImage.height;

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

            this.ui.clearMemePreview();
            this.ui.memePreview.appendChild(canvas);
            this.ui.showMemePreview();

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

        this.template.saveTemplate(templateData, () => {
            this.ui.updateTemplatesList(this.template.templates);
        });
    }

    deleteTemplate(index) {
        this.template.deleteTemplate(index, () => {
            this.ui.updateTemplatesList(this.template.templates);
        });
    }

    loadTemplate(index) {
        const template = this.template.getTemplate(index);
        this.currentImage = template.image;
        this.ui.setMemeImage(this.currentImage);
        this.ui.clearMemePreview();
        this.ui.showEditor();
        this.ui.clearTextFields();
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

        this.currentTemplateIndex = template.index;
    }

    downloadMeme() {
        this.ui.setDownloadButtonState(true);

        const canvas = this.ui.memePreview.querySelector('canvas');

        canvas.toBlob((blob) => {
            const link = document.createElement('a');
            link.href = URL.createObjectURL(blob);
            link.download = 'meme.png';
            link.click();

            this.ui.setDownloadButtonState(false);
        }, 'image/png');
    }
}
