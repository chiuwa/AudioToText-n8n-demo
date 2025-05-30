/**
 * AudioRecorder - 網頁錄音功能類別
 * 遵循單一職責原則，專門處理音頻錄製
 */
class AudioRecorder {
    constructor() {
        this.logger = new Logger('AudioRecorder');
        this.mediaRecorder = null;
        this.audioStream = null;
        this.audioChunks = [];
        this.isRecording = false;
        this.recordedBlob = null;
        
        // 錄音配置
        this.config = {
            mimeType: 'audio/webm;codecs=opus', // 預設格式
            audioBitsPerSecond: 128000 // 128kbps
        };
        
        this._setSupportedMimeType();
    }

    /**
     * 檢測並設置支援的 MIME 類型
     * @private
     */
    _setSupportedMimeType() {
        const supportedTypes = [
            'audio/webm;codecs=opus',
            'audio/webm',
            'audio/mp4',
            'audio/wav'
        ];

        for (const type of supportedTypes) {
            if (MediaRecorder.isTypeSupported(type)) {
                this.config.mimeType = type;
                this.logger.info(`Using MIME type: ${type}`);
                break;
            }
        }
    }

    /**
     * 檢查瀏覽器是否支援錄音功能
     * @returns {boolean} 是否支援
     */
    isSupported() {
        return !!(navigator.mediaDevices && 
                 navigator.mediaDevices.getUserMedia && 
                 window.MediaRecorder);
    }

    /**
     * 請求麥克風權限並初始化音頻串流
     * @returns {Promise<boolean>} 是否成功獲得權限
     */
    async requestPermission() {
        try {
            this.logger.info('Requesting microphone permission');
            
            this.audioStream = await navigator.mediaDevices.getUserMedia({
                audio: {
                    echoCancellation: true,
                    noiseSuppression: true,
                    sampleRate: 44100
                }
            });
            
            this.logger.info('Microphone permission granted');
            return true;
            
        } catch (error) {
            this.logger.error('Failed to get microphone permission', error);
            throw new Error(`無法獲得麥克風權限: ${error.message}`);
        }
    }

    /**
     * 開始錄音
     * @returns {Promise<void>}
     */
    async startRecording() {
        if (this.isRecording) {
            throw new Error('Already recording');
        }

        if (!this.audioStream) {
            await this.requestPermission();
        }

        try {
            this.audioChunks = [];
            this.mediaRecorder = new MediaRecorder(this.audioStream, this.config);
            this.recordingStartTime = Date.now(); // 記錄開始時間
            
            this.mediaRecorder.addEventListener('dataavailable', (event) => {
                if (event.data.size > 0) {
                    this.audioChunks.push(event.data);
                }
            });

            this.mediaRecorder.addEventListener('stop', () => {
                this._processRecordedAudio();
            });

            this.mediaRecorder.start(1000); // 每秒收集一次數據
            this.isRecording = true;
            
            this.logger.info('Recording started');
            
        } catch (error) {
            this.logger.error('Failed to start recording', error);
            throw new Error(`錄音失敗: ${error.message}`);
        }
    }

    /**
     * 停止錄音
     * @returns {Promise<Blob>} 錄製的音頻 Blob
     */
    async stopRecording() {
        if (!this.isRecording || !this.mediaRecorder) {
            throw new Error('Not currently recording');
        }

        return new Promise((resolve, reject) => {
            this.mediaRecorder.addEventListener('stop', () => {
                this.isRecording = false;
                resolve(this.recordedBlob);
            });

            this.mediaRecorder.addEventListener('error', (event) => {
                reject(new Error(`錄音錯誤: ${event.error}`));
            });

            this.mediaRecorder.stop();
            this.logger.info('Recording stopped');
        });
    }

    /**
     * 處理錄製完成的音頻
     * @private
     */
    _processRecordedAudio() {
        if (this.audioChunks.length === 0) {
            this.logger.warn('No audio data recorded');
            return;
        }

        this.recordedBlob = new Blob(this.audioChunks, { 
            type: this.config.mimeType 
        });
        
        this.logger.info(`Recorded audio: ${this.recordedBlob.size} bytes`);
    }

    /**
     * 獲取錄製的音頻 Blob
     * @returns {Blob|null} 音頻數據
     */
    getRecordedAudio() {
        return this.recordedBlob;
    }

    /**
     * 創建音頻 File 對象
     * @param {string} filename 檔案名稱
     * @returns {File|null} 音頻檔案對象
     */
    createAudioFile(filename = `recording_${Date.now()}.webm`) {
        if (!this.recordedBlob) {
            return null;
        }

        return new File([this.recordedBlob], filename, {
            type: this.recordedBlob.type,
            lastModified: Date.now()
        });
    }

    /**
     * 清理資源
     */
    cleanup() {
        if (this.audioStream) {
            this.audioStream.getTracks().forEach(track => track.stop());
            this.audioStream = null;
        }

        if (this.mediaRecorder) {
            this.mediaRecorder = null;
        }

        this.audioChunks = [];
        this.recordedBlob = null;
        this.isRecording = false;
        
        this.logger.info('AudioRecorder cleaned up');
    }

    /**
     * 獲取錄音狀態
     * @returns {boolean} 是否正在錄音
     */
    getRecordingState() {
        return this.isRecording;
    }

    /**
     * 獲取錄音時長（毫秒）
     * @returns {number} 錄音時長
     */
    getRecordingDuration() {
        if (!this.mediaRecorder) return 0;
        
        // 如果 MediaRecorder 支援，返回實際時長
        // 否則返回估算值
        return this.mediaRecorder.state === 'recording' ? 
               Date.now() - this.recordingStartTime : 0;
    }
} 