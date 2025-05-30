/**
 * FileHandler - 處理檔案上傳、驗證和編碼
 * 遵循單一職責原則，專門處理檔案相關操作
 */
class FileHandler {
    constructor() {
        this.maxFileSize = 20 * 1024 * 1024; // 20MB
        this.allowedTypes = [
            // 音訊格式
            'audio/mpeg', 'audio/wav', 'audio/mp4', 'audio/x-m4a', 'audio/flac', 'audio/ogg',
            'audio/aac', 'audio/webm', 'audio/3gpp',
            // 影片格式  
            'video/mp4', 'video/mpeg', 'video/quicktime', 'video/x-msvideo', 'video/webm',
            'video/3gpp', 'video/3gpp2'
        ];
        this.logger = new Logger('FileHandler');
    }

    /**
     * 驗證檔案是否符合要求
     * @param {File} file - 要驗證的檔案
     * @returns {Object} 驗證結果 {valid: boolean, error?: string}
     */
    validateFile(file) {
        this.logger.info(`Validating file: ${file.name}, size: ${file.size}, type: ${file.type}`);
        
        if (!file) {
            return { valid: false, error: '請選擇一個檔案' };
        }

        if (file.size > this.maxFileSize) {
            const sizeMB = (file.size / (1024 * 1024)).toFixed(2);
            return { valid: false, error: `檔案大小 ${sizeMB}MB 超過限制 (20MB)` };
        }

        if (!this.allowedTypes.includes(file.type)) {
            return { valid: false, error: `不支援的檔案格式: ${file.type}` };
        }

        this.logger.info('File validation passed');
        return { valid: true };
    }

    /**
     * 將檔案轉換為 base64 編碼
     * @param {File} file - 要編碼的檔案
     * @returns {Promise<string>} base64 編碼字串
     */
    async convertToBase64(file) {
        this.logger.info(`Converting file to base64: ${file.name}`);
        
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            
            reader.onload = (event) => {
                try {
                    // 移除 data URL 前綴，只保留 base64 部分
                    const base64 = event.target.result.split(',')[1];
                    this.logger.info('File converted to base64 successfully');
                    resolve(base64);
                } catch (error) {
                    this.logger.error('Error converting file to base64', error);
                    reject(error);
                }
            };
            
            reader.onerror = (error) => {
                this.logger.error('FileReader error', error);
                reject(error);
            };
            
            reader.readAsDataURL(file);
        });
    }

    /**
     * 格式化檔案大小顯示
     * @param {number} bytes - 檔案大小（位元組）
     * @returns {string} 格式化後的大小字串
     */
    formatFileSize(bytes) {
        if (bytes === 0) return '0 Bytes';
        const k = 1024;
        const sizes = ['Bytes', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    }

    /**
     * 取得檔案資訊
     * @param {File} file - 檔案物件
     * @returns {Object} 檔案資訊
     */
    getFileInfo(file) {
        return {
            name: file.name,
            size: this.formatFileSize(file.size),
            type: file.type,
            lastModified: new Date(file.lastModified).toLocaleString('zh-TW')
        };
    }
} 