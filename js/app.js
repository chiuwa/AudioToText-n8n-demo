/**
 * AudioAnalysisApp - 主應用程式類別
 * 遵循依賴反轉原則，依賴抽象而非具體實作
 */
class AudioAnalysisApp {
    constructor() {
        this.logger = new Logger('AudioAnalysisApp');
        this.fileHandler = new FileHandler();
        this.audioProcessor = new AudioProcessor();
        this.uiController = new UIController();
        this.audioRecorder = new AudioRecorder();
        
        this.currentFile = null;
        this.isProcessing = false;
        this.recordingTimer = null;
        this.recordingStartTime = null;
        
        this._initialize();
    }

    /**
     * 初始化應用程式
     * @private
     */
    _initialize() {
        this.logger.info('Initializing Audio Analysis App');
        this._bindEvents();
        this._checkSystemRequirements();
        this._setupRecordingFeature();
        this._registerServiceWorker();
        this._setupSharedFileHandler();
        this._checkForSharedFiles();

        // 頁面卸載時清理資源
        window.addEventListener('beforeunload', () => {
            this.uiController._cleanupMediaURL();
            this.audioRecorder.cleanup();
        });

        this.logger.info('Application initialized successfully');
    }

    /**
     * 綁定事件監聽器
     * @private
     */
    _bindEvents() {
        // 檔案選擇事件
        const audioFileInput = document.getElementById('audioFile');
        audioFileInput.addEventListener('change', this._handleFileSelection.bind(this));
        
        // 處理按鈕點擊事件
        const processBtn = document.getElementById('processBtn');
        processBtn.addEventListener('click', this._handleProcessClick.bind(this));
    }

    /**
     * 檢查系統需求
     * @private
     */
    _checkSystemRequirements() {
        // 檢查必要的 API 支援
        if (!window.FileReader) {
            this.uiController.showError('您的瀏覽器不支援檔案讀取功能');
            return;
        }

        if (!window.fetch) {
            this.uiController.showError('您的瀏覽器不支援網路請求功能');
            return;
        }

        this.logger.info('System requirements check passed');
    }

    /**
     * 處理檔案選擇事件
     * @param {Event} event - 檔案選擇事件
     * @private
     */
    async _handleFileSelection(event) {
        const file = event.target.files[0];
        
        if (!file) {
            this.currentFile = null;
            document.getElementById('fileInfo').style.display = 'none';
            document.getElementById('processBtn').disabled = true;
            return;
        }

        this.logger.info(`File selected: ${file.name}`);
        
        // 驗證檔案
        const validation = this.fileHandler.validateFile(file);
        
        if (!validation.valid) {
            this.uiController.showError(validation.error);
            this.currentFile = null;
            return;
        }

        // 顯示檔案資訊
        const fileInfo = this.fileHandler.getFileInfo(file);
        this.uiController.displayFileInfo(fileInfo);
        
        this.currentFile = file;
    }

    /**
     * 處理處理按鈕點擊事件
     * @private
     */
    async _handleProcessClick() {
        if (!this.currentFile || this.isProcessing) {
            return;
        }

        this.isProcessing = true;
        this.uiController.showLoading();
        
        try {
            await this._processAudioFile();
        } catch (error) {
            this.logger.error('Processing failed', error);
            this.uiController.showError(error.message || '處理失敗，請稍後再試');
        } finally {
            this.isProcessing = false;
        }
    }

    /**
     * 處理音訊檔案的主要流程
     * @private
     */
    async _processAudioFile() {
        this.logger.info('Starting audio file processing');

        // 步驟 1: 轉換為 base64
        const base64Data = await this.fileHandler.convertToBase64(this.currentFile);
        
        // 步驟 2: 呼叫 n8n webhook
        const result = await this.audioProcessor.processAudio(base64Data, this.currentFile.type);
        
        // 步驟 3: 處理結果
        if (result.success) {
            this.uiController.displayResults(result.data);
            this.logger.info('Audio processing completed successfully');
        } else {
            throw new Error(result.error);
        }
    }

    /**
     * 重設應用程式狀態
     */
    reset() {
        this.logger.info('Resetting application state');
        
        this.currentFile = null;
        this.isProcessing = false;
        
        document.getElementById('audioFile').value = '';
        document.getElementById('fileInfo').style.display = 'none';
        document.getElementById('processBtn').disabled = true;
        
        this.uiController.hideLoading();
        this.uiController.hideError();
        this.uiController.hideResults();
    }

    /**
     * 取得應用程式狀態
     * @returns {Object} 應用程式狀態
     */
    getState() {
        return {
            hasFile: !!this.currentFile,
            isProcessing: this.isProcessing,
            fileName: this.currentFile?.name || null
        };
    }

    /**
     * 註冊 Service Worker 以支援 PWA 功能
     * @private
     */
    async _registerServiceWorker() {
        if ('serviceWorker' in navigator) {
            try {
                const registration = await navigator.serviceWorker.register('/sw.js');
                this.logger.info('Service Worker registered successfully');
                
                // 監聽 Service Worker 更新
                registration.addEventListener('updatefound', () => {
                    const newWorker = registration.installing;
                    newWorker.addEventListener('statechange', () => {
                        if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
                            // 有新版本可用
                            this._showUpdateAvailable();
                        }
                    });
                });
            } catch (error) {
                this.logger.warn('Service Worker registration failed', error);
            }
        }
    }

    /**
     * 設定分享檔案處理器
     * @private
     */
    _setupSharedFileHandler() {
        if (navigator.serviceWorker) {
            navigator.serviceWorker.addEventListener('message', (event) => {
                if (event.data && event.data.type === 'SHARED_FILE') {
                    this._handleSharedFile(event.data.file);
                }
            });
        }
    }

    /**
     * 檢查 URL 參數中是否有分享的檔案
     * @private
     */
    _checkForSharedFiles() {
        const urlParams = new URLSearchParams(window.location.search);
        
        if (urlParams.has('shared')) {
            // 這是分享目標，顯示等待訊息
            this.logger.info('App opened as share target');
            this.uiController.showInfo('已接收分享請求，正在載入檔案...');
            
            // 清理 URL 參數
            window.history.replaceState({}, document.title, window.location.pathname);
        }
        
        if (urlParams.has('error')) {
            const error = urlParams.get('error');
            if (error === 'share_failed') {
                this.uiController.showError('分享檔案載入失敗，請直接上傳檔案');
            }
            
            // 清理 URL 參數
            window.history.replaceState({}, document.title, window.location.pathname);
        }
    }

    /**
     * 處理分享的檔案
     * @param {File} file - 分享的檔案
     * @private
     */
    _handleSharedFile(file) {
        this.logger.info(`Received shared file: ${file.name}`);
        
        // 模擬檔案選擇事件
        const fileInput = document.getElementById('audioFile');
        const dataTransfer = new DataTransfer();
        dataTransfer.items.add(file);
        fileInput.files = dataTransfer.files;
        
        // 觸發檔案選擇事件
        const changeEvent = new Event('change', { bubbles: true });
        fileInput.dispatchEvent(changeEvent);
        
        // 顯示通知
        this.uiController.showInfo('已接收分享的檔案，請點擊處理按鈕開始分析！');
    }

    /**
     * 顯示更新可用通知
     * @private
     */
    _showUpdateAvailable() {
        if (confirm('有新版本可用，是否重新載入頁面？')) {
            window.location.reload();
        }
    }

    /**
     * 設置錄音功能
     * @private
     */
    _setupRecordingFeature() {
        // 檢查錄音支援性
        if (!this.audioRecorder.isSupported()) {
            this.uiController.elements.microphoneWarning.style.display = 'block';
            this.uiController.elements.recordBtn.disabled = true;
            this.logger.warn('Recording not supported in this browser');
            return;
        }

        // 啟用錄音按鈕
        this.uiController.elements.recordBtn.disabled = false;

        // 綁定錄音事件
        this.uiController.elements.recordBtn.addEventListener('click', () => {
            this._startRecording();
        });

        this.uiController.elements.stopRecordBtn.addEventListener('click', () => {
            this._stopRecording();
        });

        this.logger.info('Recording feature initialized');
    }

    /**
     * 開始錄音
     * @private
     */
    async _startRecording() {
        try {
            await this.audioRecorder.startRecording();
            
            // 更新 UI
            this.uiController.elements.recordBtn.style.display = 'none';
            this.uiController.elements.stopRecordBtn.style.display = 'inline-block';
            this.uiController.elements.recordingStatus.style.display = 'block';
            
            // 開始計時器
            this.recordingStartTime = Date.now();
            this.recordingTimer = setInterval(() => {
                this._updateRecordingTime();
            }, 1000);
            
            this.logger.info('Recording started');
            
        } catch (error) {
            this.uiController.showError('錄音啟動失敗', error.message);
            this.logger.error('Failed to start recording', error);
        }
    }

    /**
     * 停止錄音
     * @private
     */
    async _stopRecording() {
        try {
            await this.audioRecorder.stopRecording();
            
            // 停止計時器
            if (this.recordingTimer) {
                clearInterval(this.recordingTimer);
                this.recordingTimer = null;
            }
            
            // 更新 UI
            this.uiController.elements.recordBtn.style.display = 'inline-block';
            this.uiController.elements.stopRecordBtn.style.display = 'none';
            this.uiController.elements.recordingStatus.style.display = 'none';
            
            // 創建音頻檔案並處理
            const audioFile = this.audioRecorder.createAudioFile();
            if (audioFile) {
                this.currentFile = audioFile;
                this.uiController.displayFileInfo(audioFile);
                this.uiController.elements.processBtn.disabled = false;
                this.logger.info('Recording completed and ready for processing');
            }
            
        } catch (error) {
            this.uiController.showError('錄音停止失敗', error.message);
            this.logger.error('Failed to stop recording', error);
        }
    }

    /**
     * 更新錄音時間顯示
     * @private
     */
    _updateRecordingTime() {
        if (!this.recordingStartTime) return;
        
        const elapsed = Math.floor((Date.now() - this.recordingStartTime) / 1000);
        const minutes = Math.floor(elapsed / 60);
        const seconds = elapsed % 60;
        const timeString = `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
        
        this.uiController.elements.recordingTime.textContent = timeString;
    }
}

// 當 DOM 載入完成後初始化應用程式
document.addEventListener('DOMContentLoaded', () => {
    window.audioApp = new AudioAnalysisApp();
}); 