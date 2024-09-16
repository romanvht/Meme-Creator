class Storage {
    constructor() {
        this.dbName = 'MemeDB';
        this.dbVersion = 1;
        this.db = null;
        this.dbReady = false;
        this.dbReadyCallbacks = [];

        this.initDB();
    }

    initDB() {
        const request = indexedDB.open(this.dbName, this.dbVersion);

        request.onupgradeneeded = (event) => {
            const db = event.target.result;
            if (!db.objectStoreNames.contains('templates')) {
                db.createObjectStore('templates', { keyPath: 'index' });
            }
        };

        request.onsuccess = (event) => {
            this.db = event.target.result;
            this.dbReady = true;
            this.dbReadyCallbacks.forEach(callback => callback());
            this.dbReadyCallbacks = [];
        };

        request.onerror = (event) => {
            console.error('Ошибка открытия базы данных: ', event.target.errorCode);
        };
    }

    onDbReady(callback) {
        if (this.dbReady) {
            callback();
        } else {
            this.dbReadyCallbacks.push(callback);
        }
    }

    saveTemplate(templateData, onComplete, onError) {
        this.onDbReady(() => {
            const transaction = this.db.transaction(['templates'], 'readwrite');
            const store = transaction.objectStore('templates');
            
            store.put(templateData);

            transaction.oncomplete = () => {
                if (onComplete) onComplete();
            };

            transaction.onerror = (event) => {
                if (onError) onError(event);
            };
        });
    }

    loadTemplates(onSuccess, onError) {
        this.onDbReady(() => {
            const transaction = this.db.transaction(['templates'], 'readonly');
            const store = transaction.objectStore('templates');
            const request = store.getAll();

            request.onsuccess = (event) => {
                if (onSuccess) onSuccess(event.target.result);
            };

            request.onerror = (event) => {
                if (onError) onError(event);
            };
        });
    }

    deleteTemplate(index, onComplete, onError) {
        this.onDbReady(() => {
            const transaction = this.db.transaction(['templates'], 'readwrite');
            const store = transaction.objectStore('templates');
            store.delete(index);

            transaction.oncomplete = () => {
                if (onComplete) onComplete();
            };

            transaction.onerror = (event) => {
                if (onError) onError(event);
            };
        });
    }
}