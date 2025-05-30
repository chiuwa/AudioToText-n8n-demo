/**
 * UIController - 管理使用者介面互動和顯示
 * 遵循單一職責原則，專門處理 UI 相關操作
 */
class UIController {
    constructor() {
        this.elements = this._initializeElements();
        this.logger = new Logger('UIController');
        this.currentMediaURL = null; // 追蹤當前媒體 URL
        this._bindEvents();
    }

    /**
     * 初始化 DOM 元素參考
     * @returns {Object} DOM 元素物件
     * @private
     */
    _initializeElements() {
        return {
            uploadArea: document.getElementById('uploadArea'),
            audioFile: document.getElementById('audioFile'),
            fileInfo: document.getElementById('fileInfo'),
            fileName: document.getElementById('fileName'),
            fileSize: document.getElementById('fileSize'),
            fileType: document.getElementById('fileType'),
            mediaPreview: document.getElementById('mediaPreview'),
            processBtn: document.getElementById('processBtn'),
            loadingSpinner: document.querySelector('.loading-spinner'),
            errorMessage: document.getElementById('errorMessage'),
            errorText: document.getElementById('errorText'),
            resultSection: document.getElementById('resultSection'),
            transcriptSection: document.getElementById('transcriptSection'),
            transcriptContent: document.getElementById('transcriptContent'),
            tableSection: document.getElementById('tableSection'),
            resultTable: document.getElementById('resultTable').querySelector('tbody'),
            exportBtn: document.getElementById('exportBtn'),
            exportTranscript: document.getElementById('exportTranscript'),
            toggleTimestamps: document.getElementById('toggleTimestamps'),
            // 錄音相關元素
            recordBtn: document.getElementById('recordBtn'),
            stopRecordBtn: document.getElementById('stopRecordBtn'),
            recordingStatus: document.getElementById('recordingStatus'),
            recordingTime: document.getElementById('recordingTime'),
            microphoneWarning: document.getElementById('microphoneWarning')
        };
    }

    /**
     * 綁定事件監聽器
     * @private
     */
    _bindEvents() {
        // 檔案上傳區域點擊事件
        this.elements.uploadArea.addEventListener('click', () => {
            this.elements.audioFile.click();
        });

        // 拖拽事件
        this.elements.uploadArea.addEventListener('dragover', this._handleDragOver.bind(this));
        this.elements.uploadArea.addEventListener('dragleave', this._handleDragLeave.bind(this));
        this.elements.uploadArea.addEventListener('drop', this._handleDrop.bind(this));

        // 匯出結果按鈕
        this.elements.exportBtn.addEventListener('click', this.exportResults.bind(this));
        
        // 匯出逐字稿按鈕
        this.elements.exportTranscript.addEventListener('click', this.exportTranscript.bind(this));
        
        // 切換時間戳按鈕
        this.elements.toggleTimestamps.addEventListener('click', this.toggleTimestamps.bind(this));
    }

    /**
     * 處理拖拽 over 事件
     * @param {DragEvent} event - 拖拽事件
     * @private
     */
    _handleDragOver(event) {
        event.preventDefault();
        this.elements.uploadArea.classList.add('dragover');
    }

    /**
     * 處理拖拽 leave 事件
     * @param {DragEvent} event - 拖拽事件
     * @private
     */
    _handleDragLeave(event) {
        event.preventDefault();
        this.elements.uploadArea.classList.remove('dragover');
    }

    /**
     * 處理檔案拖拽放下事件
     * @param {DragEvent} event - 拖拽事件
     * @private
     */
    _handleDrop(event) {
        event.preventDefault();
        this.elements.uploadArea.classList.remove('dragover');
        
        const files = event.dataTransfer.files;
        if (files.length > 0) {
            this.elements.audioFile.files = files;
            // 觸發檔案選擇事件
            const changeEvent = new Event('change', { bubbles: true });
            this.elements.audioFile.dispatchEvent(changeEvent);
        }
    }

    /**
     * 顯示檔案資訊
     * @param {Object} fileInfo - 檔案資訊物件
     */
    displayFileInfo(fileInfo) {
        this.logger.info('Displaying file info');
        
        // 判斷檔案類型並顯示對應圖示
        const isVideo = fileInfo.type.startsWith('video/');
        const iconClass = isVideo ? 'fas fa-video video-icon' : 'fas fa-music audio-icon';
        const typeText = isVideo ? '影片檔案' : '音訊檔案';
        
        this.elements.fileName.innerHTML = `<i class="${iconClass} file-type-icon"></i>${fileInfo.name}`;
        this.elements.fileSize.textContent = fileInfo.size;
        this.elements.fileType.textContent = `${typeText} (${fileInfo.type})`;
        
        // 創建媒體預覽
        this._createMediaPreview(fileInfo);
        
        this.elements.fileInfo.style.display = 'block';
        this.elements.processBtn.disabled = false;
        this.hideError();
    }

    /**
     * 創建媒體預覽播放器
     * @param {Object} fileInfo - 檔案資訊物件
     * @private
     */
    _createMediaPreview(fileInfo) {
        // 清理之前的媒體 URL
        this._cleanupMediaURL();
        
        const previewContainer = this.elements.mediaPreview;
        previewContainer.innerHTML = '';
        
        // 獲取原始檔案物件
        const fileInput = document.getElementById('audioFile');
        const file = fileInput.files[0];
        
        if (!file) {
            this.logger.warn('No file available for preview');
            return;
        }
        
        // 創建檔案 URL
        const fileURL = URL.createObjectURL(file);
        
        // 添加預覽標籤
        const label = document.createElement('div');
        label.className = 'preview-label';
        label.innerHTML = '<i class="fas fa-play"></i> 預覽播放';
        previewContainer.appendChild(label);
        
        // 判斷檔案類型並創建相應的播放器
        if (fileInfo.type.startsWith('video/')) {
            this._createVideoPlayer(fileURL, previewContainer);
        } else if (fileInfo.type.startsWith('audio/')) {
            this._createAudioPlayer(fileURL, previewContainer);
        }
        
        // 儲存 URL 以便後續清理
        this.currentMediaURL = fileURL;
    }

    /**
     * 創建音訊播放器
     * @param {string} fileURL - 檔案 URL
     * @param {HTMLElement} container - 容器元素
     * @private
     */
    _createAudioPlayer(fileURL, container) {
        const audio = document.createElement('audio');
        audio.controls = true;
        audio.preload = 'metadata';
        audio.src = fileURL;
        
        // 添加載入事件監聽
        audio.addEventListener('loadedmetadata', () => {
            const duration = this._formatDuration(audio.duration);
            this.logger.info(`Audio duration: ${duration}`);
            
            // 更新音訊資訊顯示
            const durationElement = container.querySelector('.audio-duration');
            if (durationElement) {
                durationElement.textContent = duration;
            }
        });
        
        audio.addEventListener('error', (e) => {
            this.logger.error('Audio loading error', e);
            this._showPreviewError(container, '無法載入音訊檔案');
        });
        
        container.appendChild(audio);
        
        // 添加音訊資訊顯示
        const infoDiv = document.createElement('div');
        infoDiv.className = 'audio-info-display';
        infoDiv.innerHTML = `
            <div class="audio-info-item">
                <i class="fas fa-clock text-primary"></i>
                <span class="info-label">時長：</span>
                <span class="audio-duration">載入中...</span>
            </div>
            <div class="audio-info-item">
                <i class="fas fa-volume-up text-success"></i>
                <span class="info-label">狀態：</span>
                <span class="text-success">準備播放</span>
            </div>
        `;
        container.appendChild(infoDiv);
    }

    /**
     * 創建影片播放器
     * @param {string} fileURL - 檔案 URL
     * @param {HTMLElement} container - 容器元素
     * @private
     */
    _createVideoPlayer(fileURL, container) {
        const video = document.createElement('video');
        video.controls = true;
        video.preload = 'metadata';
        video.src = fileURL;
        video.muted = true; // 預設靜音以避免自動播放限制
        
        // 添加載入事件監聽
        video.addEventListener('loadedmetadata', () => {
            const duration = this._formatDuration(video.duration);
            const resolution = `${video.videoWidth}x${video.videoHeight}`;
            this.logger.info(`Video duration: ${duration}, resolution: ${resolution}`);
        });
        
        video.addEventListener('error', (e) => {
            this.logger.error('Video loading error', e);
            this._showPreviewError(container, '無法載入影片檔案');
        });
        
        container.appendChild(video);
    }

    /**
     * 顯示預覽錯誤
     * @param {HTMLElement} container - 容器元素
     * @param {string} message - 錯誤訊息
     * @private
     */
    _showPreviewError(container, message) {
        const errorDiv = document.createElement('div');
        errorDiv.className = 'alert alert-warning alert-sm';
        errorDiv.innerHTML = `<i class="fas fa-exclamation-triangle"></i> ${message}`;
        container.appendChild(errorDiv);
    }

    /**
     * 格式化時間長度
     * @param {number} seconds - 秒數
     * @returns {string} 格式化的時間字串
     * @private
     */
    _formatDuration(seconds) {
        if (isNaN(seconds) || seconds === 0) return '00:00';
        
        const mins = Math.floor(seconds / 60);
        const secs = Math.floor(seconds % 60);
        return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    }

    /**
     * 顯示載入狀態
     */
    showLoading() {
        this.logger.info('Showing loading state');
        this.elements.loadingSpinner.style.display = 'block';
        this.elements.processBtn.disabled = true;
        this.hideError();
        this.hideResults();
    }

    /**
     * 隱藏載入狀態
     */
    hideLoading() {
        this.logger.info('Hiding loading state');
        this.elements.loadingSpinner.style.display = 'none';
        this.elements.processBtn.disabled = false;
    }

    /**
     * 顯示錯誤訊息
     * @param {string} message - 錯誤訊息
     */
    showError(message) {
        this.logger.error(`Showing error: ${message}`);
        this.elements.errorText.textContent = message;
        this.elements.errorMessage.style.display = 'block';
        this.hideLoading();
    }

    /**
     * 隱藏錯誤訊息
     */
    hideError() {
        this.elements.errorMessage.style.display = 'none';
    }

    /**
     * 顯示處理結果
     * @param {Object} data - 結果資料
     */
    displayResults(data) {
        this.logger.info('Displaying results');
        
        // 檢查是否為逐字稿格式
        if (this._isTranscriptFormat(data)) {
            this._displayTranscript(data);
            this._displayApiMetadata(null); // 逐字稿格式沒有額外元數據
        } else {
            // 清空現有表格內容
            this.elements.resultTable.innerHTML = '';
            
            // 將資料轉換為表格格式
            this._populateTable(data);
            
            this.elements.tableSection.style.display = 'block';
            this.elements.transcriptSection.style.display = 'none';
        }
        
        this.elements.resultSection.style.display = 'block';
        this.hideLoading();
        this.hideError();
    }

    /**
     * 填充表格資料
     * @param {Object} data - 要顯示的資料
     * @private
     */
    _populateTable(data) {
        const entries = this._flattenObject(data);
        
        entries.forEach(({ key, value }) => {
            const row = document.createElement('tr');
            row.innerHTML = `
                <td><strong>${this._formatKey(key)}</strong></td>
                <td>${this._formatValue(value)}</td>
            `;
            this.elements.resultTable.appendChild(row);
        });
    }

    /**
     * 將巢狀物件扁平化
     * @param {Object} obj - 要扁平化的物件
     * @param {string} prefix - 鍵值前綴
     * @returns {Array} 扁平化後的鍵值對陣列
     * @private
     */
    _flattenObject(obj, prefix = '') {
        const entries = [];
        
        for (const [key, value] of Object.entries(obj)) {
            const fullKey = prefix ? `${prefix}.${key}` : key;
            
            if (value && typeof value === 'object' && !Array.isArray(value)) {
                entries.push(...this._flattenObject(value, fullKey));
            } else {
                entries.push({ key: fullKey, value });
            }
        }
        
        return entries;
    }

    /**
     * 格式化鍵值顯示
     * @param {string} key - 原始鍵值
     * @returns {string} 格式化後的鍵值
     * @private
     */
    _formatKey(key) {
        return key.replace(/([A-Z])/g, ' $1')
                  .replace(/^./, str => str.toUpperCase())
                  .replace(/_/g, ' ');
    }

    /**
     * 格式化值的顯示
     * @param {*} value - 要格式化的值
     * @returns {string} 格式化後的值
     * @private
     */
    _formatValue(value) {
        if (value === null || value === undefined) {
            return '<em>無資料</em>';
        }
        
        if (Array.isArray(value)) {
            return value.join(', ');
        }
        
        if (typeof value === 'boolean') {
            return value ? '是' : '否';
        }
        
        if (typeof value === 'string' && value.length > 100) {
            return value.substring(0, 100) + '...';
        }
        
        return String(value);
    }

    /**
     * 隱藏結果區域
     */
    hideResults() {
        this.elements.resultSection.style.display = 'none';
        this.elements.transcriptSection.style.display = 'none';
        this.elements.tableSection.style.display = 'none';
    }

    /**
     * 清理媒體 URL 資源
     * @private
     */
    _cleanupMediaURL() {
        if (this.currentMediaURL) {
            URL.revokeObjectURL(this.currentMediaURL);
            this.currentMediaURL = null;
            this.logger.info('Media URL cleaned up');
        }
    }

    /**
     * 匯出結果為 JSON 檔案
     */
    exportResults() {
        try {
            const tableData = this._extractTableData();
            const jsonString = JSON.stringify(tableData, null, 2);
            
            const blob = new Blob([jsonString], { type: 'application/json' });
            const url = URL.createObjectURL(blob);
            
            const a = document.createElement('a');
            a.href = url;
            a.download = `audio_analysis_${new Date().toISOString().slice(0, 10)}.json`;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            
            URL.revokeObjectURL(url);
            this.logger.info('Results exported successfully');
            
        } catch (error) {
            this.logger.error('Export failed', error);
            this.showError('匯出失敗，請稍後再試');
        }
    }

    /**
     * 從表格中提取資料
     * @returns {Object} 提取的資料物件
     * @private
     */
    _extractTableData() {
        const rows = this.elements.resultTable.querySelectorAll('tr');
        const data = {};
        
        rows.forEach(row => {
            const cells = row.querySelectorAll('td');
            if (cells.length === 2) {
                const key = cells[0].textContent.trim();
                const value = cells[1].textContent.trim();
                data[key] = value;
            }
        });
        
        return data;
    }

    /**
     * 檢查資料是否為逐字稿格式
     * @param {*} data - 要檢查的資料
     * @returns {boolean} 是否為逐字稿格式
     * @private
     */
    _isTranscriptFormat(data) {
        return Array.isArray(data) && 
               data.length > 0 && 
               data[0].hasOwnProperty('start') && 
               data[0].hasOwnProperty('end') && 
               data[0].hasOwnProperty('text');
    }

    /**
     * 顯示逐字稿
     * @param {Array} transcriptData - 逐字稿資料陣列
     * @private
     */
    _displayTranscript(transcriptData) {
        this.logger.info('Displaying transcript');
        
        this.elements.transcriptContent.innerHTML = '';
        
        transcriptData.forEach((segment, index) => {
            const segmentElement = this._createTranscriptSegment(segment, index + 1);
            this.elements.transcriptContent.appendChild(segmentElement);
        });
        
        this.elements.transcriptSection.style.display = 'block';
        this.elements.tableSection.style.display = 'none';
        
        // 儲存逐字稿資料供匯出使用
        this.currentTranscript = transcriptData;
    }

    /**
     * 顯示 API 元數據資訊
     * @param {Object} metadata - API 回應的元數據
     * @private
     */
    _displayApiMetadata(metadata) {
        // 目前暫不顯示元數據，未來可以添加使用量統計等資訊
        if (metadata) {
            this.logger.info('API metadata available', metadata);
        }
    }

    /**
     * 創建逐字稿段落元素
     * @param {Object} segment - 逐字稿段落
     * @param {number} index - 段落序號
     * @returns {HTMLElement} 段落元素
     * @private
     */
    _createTranscriptSegment(segment, index) {
        const segmentDiv = document.createElement('div');
        segmentDiv.className = 'transcript-segment';
        segmentDiv.setAttribute('data-start', segment.start);
        segmentDiv.setAttribute('data-end', segment.end);
        
        segmentDiv.innerHTML = `
            <div class="timestamp">
                <span class="segment-number">${index}</span>
                <i class="fas fa-play-circle me-1"></i>
                ${segment.start} - ${segment.end}
            </div>
            <p class="transcript-text">${this._escapeHtml(segment.text)}</p>
        `;
        
        return segmentDiv;
    }

    /**
     * 轉義 HTML 字符
     * @param {string} text - 要轉義的文字
     * @returns {string} 轉義後的文字
     * @private
     */
    _escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }

    /**
     * 切換時間戳顯示
     */
    toggleTimestamps() {
        const content = this.elements.transcriptContent;
        const isHidden = content.classList.contains('timestamps-hidden');
        
        if (isHidden) {
            content.classList.remove('timestamps-hidden');
            this.elements.toggleTimestamps.innerHTML = '<i class="fas fa-clock"></i> 隱藏時間戳';
        } else {
            content.classList.add('timestamps-hidden');
            this.elements.toggleTimestamps.innerHTML = '<i class="fas fa-clock"></i> 顯示時間戳';
        }
        
        this.logger.info(`Timestamps ${isHidden ? 'shown' : 'hidden'}`);
    }

    /**
     * 匯出逐字稿
     */
    exportTranscript() {
        try {
            if (!this.currentTranscript || !Array.isArray(this.currentTranscript)) {
                this.showError('沒有可匯出的逐字稿資料');
                return;
            }

            // 創建多種格式的匯出選項
            const formats = {
                json: this._exportTranscriptAsJson(),
                txt: this._exportTranscriptAsText(),
                srt: this._exportTranscriptAsSrt()
            };

            // 創建選擇格式的 modal（簡化版，直接匯出為 JSON）
            this._downloadFile(formats.json, 'transcript.json', 'application/json');
            this._downloadFile(formats.txt, 'transcript.txt', 'text/plain');
            this._downloadFile(formats.srt, 'transcript.srt', 'text/plain');
            
            this.logger.info('Transcript exported successfully');
            
        } catch (error) {
            this.logger.error('Export transcript failed', error);
            this.showError('匯出逐字稿失敗，請稍後再試');
        }
    }

    /**
     * 匯出逐字稿為 JSON 格式
     * @returns {string} JSON 字串
     * @private
     */
    _exportTranscriptAsJson() {
        return JSON.stringify(this.currentTranscript, null, 2);
    }

    /**
     * 匯出逐字稿為純文字格式
     * @returns {string} 純文字
     * @private
     */
    _exportTranscriptAsText() {
        return this.currentTranscript.map((segment, index) => {
            return `[${index + 1}] ${segment.start} - ${segment.end}\n${segment.text}\n`;
        }).join('\n');
    }

    /**
     * 匯出逐字稿為 SRT 字幕格式
     * @returns {string} SRT 格式字串
     * @private
     */
    _exportTranscriptAsSrt() {
        return this.currentTranscript.map((segment, index) => {
            const startTime = this._convertToSrtTime(segment.start);
            const endTime = this._convertToSrtTime(segment.end);
            return `${index + 1}\n${startTime} --> ${endTime}\n${segment.text}\n`;
        }).join('\n');
    }

    /**
     * 轉換時間格式為 SRT 格式
     * @param {string} time - 原始時間格式 (HH:MM:SS.mmm)
     * @returns {string} SRT 時間格式
     * @private
     */
    _convertToSrtTime(time) {
        // 將 00:00:01.500 轉換為 00:00:01,500 (SRT 使用逗號)
        return time.replace('.', ',');
    }

    /**
     * 下載檔案
     * @param {string} content - 檔案內容
     * @param {string} filename - 檔案名稱
     * @param {string} mimeType - MIME 類型
     * @private
     */
    _downloadFile(content, filename, mimeType) {
        const blob = new Blob([content], { type: mimeType });
        const url = URL.createObjectURL(blob);
        
        const a = document.createElement('a');
        a.href = url;
        a.download = `${new Date().toISOString().slice(0, 10)}_${filename}`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        
        URL.revokeObjectURL(url);
    }

    /**
     * 顯示資訊訊息
     * @param {string} message - 資訊訊息
     */
    showInfo(message) {
        this.logger.info(`Showing info: ${message}`);
        
        // 創建臨時的資訊提示
        const infoDiv = document.createElement('div');
        infoDiv.className = 'alert alert-success alert-dismissible fade show';
        infoDiv.innerHTML = `
            <i class="fas fa-check-circle"></i>
            ${message}
            <button type="button" class="btn-close" data-bs-dismiss="alert"></button>
        `;
        
        // 插入到頁面頂部
        const container = document.querySelector('.container');
        container.insertBefore(infoDiv, container.firstChild);
        
        // 3秒後自動消失
        setTimeout(() => {
            if (infoDiv.parentNode) {
                infoDiv.remove();
            }
        }, 3000);
    }
} 