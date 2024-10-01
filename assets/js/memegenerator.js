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

    addTextField(left = '5%', top = '5%', width = '30%', height = '15%', rotation = 0, color = '#000000', backgroundColor = 'rgba(0, 0, 0, 0)', text = '', fontSize = 16, textAlign = 'center') {
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

        textField.style.transform = `rotate(${rotation}deg)`;
        textField.setAttribute('data-angle', rotation);
        textField.appendChild(textInput);
        
        this.ui.textFieldsContainer.appendChild(textField);

        this.makeDraggable(textField);
        this.makeResizable(textField);
        this.makeRotatable(textField);
        this.makeDeletable(textField);

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
            getRotation: () => textField.getAttribute('data-angle') || 0,
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

    makeDeletable(element) {
        const deleter = document.createElement('div');
        deleter.className = 'delete-btn';
        deleter.innerText = 'X';
        element.appendChild(deleter);

        deleter.addEventListener('click', () => this.removeField(element));
    }

    makeDraggable(element) {
        let startX, startY;
        const image = this.ui.memeImage;
    
        element.addEventListener('mousedown', initDrag);
        document.addEventListener('mousemove', drag);
        document.addEventListener('mouseup', stopDrag);
    
        element.addEventListener('touchstart', initDrag);
        document.addEventListener('touchmove', drag);
        document.addEventListener('touchend', stopDrag);
    
        function initDrag(e) {
            if (element.isResizing || element.isRotating) return;
            element.isDragging = true;

            const clientX = e.clientX || e.touches[0].clientX;
            const clientY = e.clientY || e.touches[0].clientY;
            startX = clientX - element.offsetLeft;
            startY = clientY - element.offsetTop;
        }
    
        function drag(e) {
            if (!element.isDragging) return;
            
            const clientX = e.clientX || e.touches[0].clientX;
            const clientY = e.clientY || e.touches[0].clientY;
    
            const newLeft = clientX - startX;
            const newTop = clientY - startY;
    
            element.style.left = `${(newLeft / image.offsetWidth * 100).toFixed(2)}%`;
            element.style.top = `${(newTop / image.offsetHeight * 100).toFixed(2)}%`;
        }
    
        function stopDrag() {
            element.isDragging = false;
        }
    }

    makeResizable(element) {
        let startX, startY, startWidth, startHeight;
        const image = this.ui.memeImage;
    
        const resizer = document.createElement('div');
        resizer.className = 'resizer';
        resizer.innerText = '↔';
        element.appendChild(resizer);
    
        resizer.addEventListener('mousedown', initResize);
        document.addEventListener('mousemove', resize);
        document.addEventListener('mouseup', stopResize);
    
        resizer.addEventListener('touchstart', initResize);
        document.addEventListener('touchmove', resize);
        document.addEventListener('touchend', stopResize);
    
        function initResize(e) {
            if (element.isDragging || element.isRotating) return;
            element.isResizing = true;

            const clientX = e.clientX || e.touches[0].clientX;
            const clientY = e.clientY || e.touches[0].clientY;
            startX = clientX;
            startY = clientY;
            startWidth = parseInt(window.getComputedStyle(element).width, 10);
            startHeight = parseInt(window.getComputedStyle(element).height, 10);
        }
    
        function resize(e) {
            if (!element.isResizing) return;

            const clientX = e.clientX || e.touches[0].clientX;
            const clientY = e.clientY || e.touches[0].clientY;
            const width = startWidth + (clientX - startX);
            const height = startHeight + (clientY - startY);
    
            element.style.width = `${(width / image.offsetWidth * 100).toFixed(2)}%`;
            element.style.height = `${(height / image.offsetHeight * 100).toFixed(2)}%`;
        }
    
        function stopResize() {
            element.isResizing = false;
        }
    }    

    makeRotatable(element) {
        let centerX, centerY, startAngle, initialAngle;
    
        const rotator = document.createElement('div');
        rotator.className = 'rotator';
        rotator.innerText = '↻';
        element.appendChild(rotator);
    
        rotator.addEventListener('mousedown', initRotate);
        document.addEventListener('mousemove', rotate);
        document.addEventListener('mouseup', stopRotate);
    
        rotator.addEventListener('touchstart', initRotate);
        document.addEventListener('touchmove', rotate);
        document.addEventListener('touchend', stopRotate);
    
        function initRotate(e) {
            if (element.isDragging || element.isResizing) return;
            element.isRotating = true;

            const rect = element.getBoundingClientRect();
            centerX = rect.left + rect.width / 2;
            centerY = rect.top + rect.height / 2;

            const clientX = e.clientX || e.touches[0].clientX;
            const clientY = e.clientY || e.touches[0].clientY;

            startAngle = Math.atan2(clientY - centerY, clientX - centerX);
            initialAngle = parseFloat(element.getAttribute('data-angle')) || 0;
        }
    
        function rotate(e) {
            if (!element.isRotating) return;

            const clientX = e.clientX || e.touches[0].clientX;
            const clientY = e.clientY || e.touches[0].clientY;
    
            const currentAngle = Math.atan2(clientY - centerY, clientX - centerX);
            const deltaAngle = currentAngle - startAngle;
    
            const angle = initialAngle + deltaAngle * (180 / Math.PI);
            element.style.transform = `rotate(${angle}deg)`;
            element.setAttribute('data-angle', angle);
        }
    
        function stopRotate() {
            element.isRotating = false;
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
    
            const scaleX = canvas.width / this.ui.memeImage.width;
            const scaleY = canvas.height / this.ui.memeImage.height;
    
            this.textFields.forEach((field) => {
                const width = field.element.offsetWidth * scaleX;
                const height = field.element.offsetHeight * scaleY;
    
                const leftPercent = parseFloat(field.element.style.left);
                const topPercent = parseFloat(field.element.style.top);
    
                const xPos = canvas.width * (leftPercent / 100);
                const yPos = canvas.height * (topPercent / 100);
    
                const rotation = parseFloat(field.getRotation()) || 0;
    
                const fontSize = parseInt(window.getComputedStyle(field.element).fontSize, 10) * ((scaleX + scaleY) / 2);
                const fontWeight = window.getComputedStyle(field.element).fontWeight;
                const fontStyle = window.getComputedStyle(field.element).fontStyle;
                const textAlign = window.getComputedStyle(field.element).textAlign;
                const lineHeight = fontSize;
                const backgroundColor = field.getBackgroundColor();
                const textColor = field.getColor();
    
                const offscreenCanvas = document.createElement('canvas');
                offscreenCanvas.width = width;
                offscreenCanvas.height = height;
                const offscreenCtx = offscreenCanvas.getContext('2d');
    
                if (backgroundColor !== 'rgba(0, 0, 0, 0)' && backgroundColor !== 'transparent') {
                    offscreenCtx.fillStyle = backgroundColor;
                    offscreenCtx.fillRect(0, 0, width, height);
                }
    
                offscreenCtx.font = `${fontStyle} ${fontWeight} ${fontSize}px Arial`;
                offscreenCtx.fillStyle = textColor;
                offscreenCtx.textBaseline = 'top';
                offscreenCtx.textAlign = textAlign;
    
                this.wrapText(offscreenCtx, field.getText(), 0, 0, width, height, lineHeight, textAlign);
    
                ctx.save();
                ctx.translate(xPos + width / 2, yPos + height / 2);
                ctx.rotate(rotation * Math.PI / 180);
                ctx.drawImage(offscreenCanvas, -width / 2, -height / 2);
                ctx.restore();
            });
    
            this.ui.clearMemePreview();
            this.ui.memePreview.appendChild(canvas);
            this.ui.showMemePreview();
    
            this.saveTemplate();
        }

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
                rotation: field.getRotation(),
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
                field.rotation,
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
