/**
 * AudioProcessor - 處理音訊檔案與 AI 服務通訊
 * 遵循單一職責原則，專門處理音訊 API 呼叫
 */
class AudioProcessor {
    constructor() {
        // 配置您的 AI 服務端點
        // 請將此 URL 替換為您的實際 AI 服務端點
        this.webhookUrl = 'YOUR_AI_SERVICE_ENDPOINT_HERE';
        this.logger = new Logger('AudioProcessor');
        this.timeout = 60000; // 60 秒超時
    }

    /**
     * 處理音訊檔案
     * @param {string} base64Data - base64 編碼的音訊資料
     * @param {string} mimeType - 音訊檔案的 MIME 類型
     * @returns {Promise<Object>} 處理結果
     */
    async processAudio(base64Data, mimeType) {
        this.logger.info(`Processing audio with mime type: ${mimeType}`);
        
        try {
            const payload = this._createPayload(base64Data, mimeType);
            const response = await this._sendRequest(payload);
            const result = await this._parseResponse(response);
            
            this.logger.info('Audio processing completed successfully');
            return { success: true, data: result };
            
        } catch (error) {
            this.logger.error('Audio processing failed', error);
            return { 
                success: false, 
                error: error.message || '音訊處理失敗，請稍後再試' 
            };
        }
    }

    /**
     * 建立要傳送的資料格式
     * @param {string} base64Data - base64 編碼資料
     * @param {string} mimeType - MIME 類型
     * @returns {Object} 格式化的 payload
     * @private
     */
    _createPayload(base64Data, mimeType) {
        return {
            mime_type: mimeType,
            data: base64Data
        };
    }

    /**
     * 發送請求到 n8n webhook
     * @param {Object} payload - 要傳送的資料
     * @returns {Promise<Response>} fetch 回應
     * @private
     */
    async _sendRequest(payload) {
        this.logger.info('Sending request to n8n webhook');
        
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), this.timeout);
        
        try {
            const response = await fetch(this.webhookUrl, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Accept': 'application/json'
                },
                body: JSON.stringify(payload),
                signal: controller.signal
            });
            
            clearTimeout(timeoutId);
            
            if (!response.ok) {
                throw new Error(`HTTP ${response.status}: ${response.statusText}`);
            }
            
            return response;
            
        } catch (error) {
            clearTimeout(timeoutId);
            
            if (error.name === 'AbortError') {
                throw new Error('請求超時，請檢查網路連線或稍後再試');
            }
            
            throw error;
        }
    }

    /**
     * 解析 API 回應
     * @param {Response} response - fetch 回應
     * @returns {Promise<Object>} 解析後的資料
     * @private
     */
    async _parseResponse(response) {
        try {
            const jsonData = await response.json();
            this.logger.info('Response parsed successfully');
            
            // 處理新的 API 回應格式
            const extractedData = this._extractDataFromResponse(jsonData);
            
            // 如果回應有 data 欄位，回傳 data 內容；否則回傳提取的資料
            return jsonData.data || extractedData;
            
        } catch (error) {
            this.logger.error('Failed to parse response as JSON', error);
            throw new Error('無法解析伺服器回應');
        }
    }

    /**
     * 從複雜的 API 回應中提取實際資料
     * @param {Object} responseData - 原始回應資料
     * @returns {Object|Array} 提取的資料
     * @private
     */
    _extractDataFromResponse(responseData) {
        try {
            console.log('=== Debug: Processing response data ===');
            console.log('Response data type:', typeof responseData);
            console.log('Is array:', Array.isArray(responseData));
            console.log('Response data:', responseData);
            
            // 首先檢查是否為陣列格式（您的回應格式）
            if (Array.isArray(responseData) && responseData.length > 0) {
                const firstItem = responseData[0];
                console.log('First item (array format):', firstItem);
                
                if (firstItem.candidates && firstItem.candidates.length > 0) {
                    const candidate = firstItem.candidates[0];
                    console.log('Candidate (array format):', candidate);
                    
                    if (candidate.content && candidate.content.parts && candidate.content.parts.length > 0) {
                        const textContent = candidate.content.parts[0].text;
                        console.log('Text content:', textContent);
                        
                        // 嘗試從 markdown 代碼塊中提取 JSON
                        const extractedJson = this._extractJsonFromMarkdown(textContent);
                        if (extractedJson) {
                            console.log('Extracted JSON:', extractedJson);
                            this.logger.info('Successfully extracted JSON from markdown');
                            return extractedJson;
                        }
                        
                        // 如果不是 markdown 格式，直接嘗試解析
                        try {
                            const parsed = JSON.parse(textContent);
                            console.log('Parsed JSON:', parsed);
                            return parsed;
                        } catch (parseError) {
                            console.log('Parse error:', parseError);
                            this.logger.warn('Text content is not valid JSON, returning as is');
                            return { content: textContent };
                        }
                    }
                }
            }
            
            // 檢查是否為物件格式且包含 candidates
            if (responseData && typeof responseData === 'object' && !Array.isArray(responseData)) {
                if (responseData.candidates && responseData.candidates.length > 0) {
                    const candidate = responseData.candidates[0];
                    console.log('Candidate (object format):', candidate);
                    
                    if (candidate.content && candidate.content.parts && candidate.content.parts.length > 0) {
                        const textContent = candidate.content.parts[0].text;
                        console.log('Text content:', textContent);
                        
                        // 嘗試從 markdown 代碼塊中提取 JSON
                        const extractedJson = this._extractJsonFromMarkdown(textContent);
                        if (extractedJson) {
                            console.log('Extracted JSON:', extractedJson);
                            this.logger.info('Successfully extracted JSON from markdown');
                            return extractedJson;
                        }
                        
                        // 如果不是 markdown 格式，直接嘗試解析
                        try {
                            const parsed = JSON.parse(textContent);
                            console.log('Parsed JSON:', parsed);
                            return parsed;
                        } catch (parseError) {
                            console.log('Parse error:', parseError);
                            this.logger.warn('Text content is not valid JSON, returning as is');
                            return { content: textContent };
                        }
                    }
                }
            }
            
            // 如果不符合預期格式，回傳原始資料
            console.log('=== Debug: Returning original data ===');
            this.logger.info('Response format not recognized, returning original data');
            return responseData;
            
        } catch (error) {
            console.log('Error in extraction:', error);
            this.logger.error('Error extracting data from response', error);
            return responseData;
        }
    }

    /**
     * 從 markdown 代碼塊中提取 JSON 內容
     * @param {string} text - 包含 markdown 的文字
     * @returns {Object|Array|null} 解析的 JSON 物件或 null
     * @private
     */
    _extractJsonFromMarkdown(text) {
        try {
            console.log('=== Debug: Extracting JSON from markdown ===');
            console.log('Input text:', text);
            
            // 尋找 ```json 代碼塊
            const jsonBlockRegex = /```json\s*\n([\s\S]*?)\n```/;
            const match = text.match(jsonBlockRegex);
            
            if (match && match[1]) {
                const jsonString = match[1].trim();
                console.log('Found JSON block:', jsonString);
                this.logger.info('Found JSON block in markdown');
                const parsed = JSON.parse(jsonString);
                console.log('Parsed JSON from markdown:', parsed);
                return parsed;
            }
            
            // 如果沒有找到 ```json，嘗試尋找一般的 ``` 代碼塊
            const generalBlockRegex = /```\s*\n([\s\S]*?)\n```/;
            const generalMatch = text.match(generalBlockRegex);
            
            if (generalMatch && generalMatch[1]) {
                const content = generalMatch[1].trim();
                console.log('Found general code block:', content);
                try {
                    const parsed = JSON.parse(content);
                    console.log('Parsed general code block as JSON:', parsed);
                    return parsed;
                } catch (parseError) {
                    console.log('General code block is not valid JSON:', parseError);
                    this.logger.warn('Code block content is not valid JSON');
                    return null;
                }
            }
            
            console.log('No code blocks found');
            return null;
            
        } catch (error) {
            console.log('Error in markdown extraction:', error);
            this.logger.error('Error extracting JSON from markdown', error);
            return null;
        }
    }

    /**
     * 檢查 webhook 是否可用
     * @returns {Promise<boolean>} 是否可用
     */
    async checkWebhookHealth() {
        try {
            const response = await fetch(this.webhookUrl, {
                method: 'HEAD',
                timeout: 5000
            });
            return response.ok;
        } catch (error) {
            this.logger.warn('Webhook health check failed', error);
            return false;
        }
    }
} 