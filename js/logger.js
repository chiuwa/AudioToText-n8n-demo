/**
 * Logger - 簡單的記錄器
 * 提供統一的記錄介面
 */
class Logger {
    constructor(context = 'App') {
        this.context = context;
        this.isEnabled = true; // 可以透過設定控制是否啟用記錄
    }

    /**
     * 記錄訊息
     * @param {string} level - 記錄等級
     * @param {string} message - 訊息內容
     * @param {*} data - 額外資料
     * @private
     */
    _log(level, message, data = null) {
        if (!this.isEnabled) return;
        
        const timestamp = new Date().toISOString();
        const logMessage = `[${timestamp}] [${level}] [${this.context}] ${message}`;
        
        console[level.toLowerCase()](logMessage, data || '');
    }

    /**
     * 記錄資訊訊息
     * @param {string} message - 訊息內容
     * @param {*} data - 額外資料
     */
    info(message, data = null) {
        this._log('INFO', message, data);
    }

    /**
     * 記錄警告訊息
     * @param {string} message - 訊息內容
     * @param {*} data - 額外資料
     */
    warn(message, data = null) {
        this._log('WARN', message, data);
    }

    /**
     * 記錄錯誤訊息
     * @param {string} message - 訊息內容
     * @param {*} data - 額外資料
     */
    error(message, data = null) {
        this._log('ERROR', message, data);
    }

    /**
     * 記錄除錯訊息
     * @param {string} message - 訊息內容
     * @param {*} data - 額外資料
     */
    debug(message, data = null) {
        this._log('DEBUG', message, data);
    }
} 