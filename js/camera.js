// 摄像头管理
class CameraManager {
    constructor() {
        this.video = document.getElementById('camera-video');
        this.canvas = document.getElementById('camera-canvas');
        this.ctx = this.canvas.getContext('2d');
        this.previewImage = document.getElementById('preview-image');
        this.cameraModal = document.getElementById('camera-modal');
        this.captureBtn = document.getElementById('capture-btn');
        this.retakeBtn = document.getElementById('retake-btn');
        this.closeBtn = document.getElementById('close-camera');
        this.cameraPreview = document.getElementById('camera-preview');
        this.clothForm = document.getElementById('cloth-form');
        this.saveClothBtn = document.getElementById('save-cloth-btn');
        
        this.stream = null;
        this.capturedImage = null;
        
        this.initEventListeners();
    }

    // 初始化事件监听器
    initEventListeners() {
        // 拍照按钮
        this.captureBtn.addEventListener('click', () => this.capturePhoto());
        
        // 重拍按钮
        this.retakeBtn.addEventListener('click', () => this.retakePhoto());
        
        // 关闭按钮
        this.closeBtn.addEventListener('click', () => this.closeCamera());
        
        // 保存衣服按钮
        this.saveClothBtn.addEventListener('click', () => this.saveCloth());
        
        // 快速保存按钮
        const quickSaveBtn = document.getElementById('quick-save-btn');
        if (quickSaveBtn) {
            quickSaveBtn.addEventListener('click', () => this.quickSave());
        }
        
        // 从相册选择按钮
        const uploadBtn = document.getElementById('upload-cloth-btn');
        const fileInput = document.getElementById('file-input');
        if (uploadBtn && fileInput) {
            uploadBtn.addEventListener('click', () => fileInput.click());
            fileInput.addEventListener('change', (e) => this.handleFileSelect(e));
        }
        
        // 点击模态框外部关闭
        this.cameraModal.addEventListener('click', (e) => {
            if (e.target === this.cameraModal) {
                this.closeCamera();
            }
        });
    }

    // 打开摄像头
    async openCamera() {
        try {
            // 请求摄像头权限
            this.stream = await navigator.mediaDevices.getUserMedia({
                video: {
                    facingMode: 'environment', // 优先使用后置摄像头
                    width: { ideal: 1280 },
                    height: { ideal: 720 }
                },
                audio: false
            });
            
            // 设置视频源
            this.video.srcObject = this.stream;
            
            // 显示摄像头模态框
            this.cameraModal.classList.add('active');
            
            // 重置界面状态
            this.resetCameraUI();
            
        } catch (error) {
            console.error('Error accessing camera:', error);
            alert('无法访问摄像头，请检查权限设置');
        }
    }

    // 关闭摄像头
    closeCamera() {
        // 停止视频流
        if (this.stream) {
            this.stream.getTracks().forEach(track => track.stop());
            this.stream = null;
        }
        
        // 隐藏模态框
        this.cameraModal.classList.remove('active');
        
        // 重置状态
        this.capturedImage = null;
        this.resetCameraUI();
    }

    // 重置摄像头UI
    resetCameraUI() {
        this.video.style.display = 'block';
        this.cameraPreview.style.display = 'none';
        this.clothForm.style.display = 'none';
        this.captureBtn.style.display = 'inline-block';
        this.retakeBtn.style.display = 'none';
    }

    // 拍照
    async capturePhoto() {
        try {
            // 设置canvas尺寸与视频一致
            this.canvas.width = this.video.videoWidth;
            this.canvas.height = this.video.videoHeight;
            
            // 绘制视频帧到canvas
            this.ctx.drawImage(this.video, 0, 0, this.canvas.width, this.canvas.height);
            
            // 将canvas转换为图片数据URL（初始质量）
            const originalImage = this.canvas.toDataURL('image/jpeg', 0.8);
            
            // 压缩图片以节省存储空间
            this.capturedImage = await this.compressImage(originalImage);
            
            // 显示预览
            this.showPreview();
            
        } catch (error) {
            console.error('Error capturing photo:', error);
            alert('拍照失败，请重试');
        }
    }

    // 显示预览
    async showPreview() {
        // 隐藏视频，显示预览和表单
        this.video.style.display = 'none';
        this.cameraPreview.style.display = 'block';
        this.clothForm.style.display = 'block';
        this.captureBtn.style.display = 'none';
        this.retakeBtn.style.display = 'inline-block';
        
        // 设置预览图片
        this.previewImage.src = this.capturedImage;
        
        // AI 智能分析
        await this.runAIAnalysis();
    }

    // AI 智能分析
    async runAIAnalysis() {
        try {
            // 显示加载提示
            const nameInput = document.getElementById('cloth-name');
            const originalPlaceholder = nameInput.placeholder;
            nameInput.placeholder = '🤖 AI 分析中...';
            
            // 调用 AI 分析
            const analysis = await aiHelper.analyzeClothing(this.capturedImage);
            
            if (analysis) {
                // 自动填充颜色
                const colorInput = document.getElementById('cloth-color');
                if (!colorInput.value) {
                    colorInput.value = analysis.color;
                    colorInput.style.borderColor = analysis.colorHex;
                }
                
                // 自动选择分类
                const categorySelect = document.getElementById('cloth-category');
                if (analysis.confidence > 0.6) {
                    categorySelect.value = analysis.category;
                }
                
                // 自动选择季节
                const seasonSelect = document.getElementById('cloth-season');
                seasonSelect.value = analysis.suggestedSeason;
                
                // 显示 AI 建议
                nameInput.placeholder = `建议：${analysis.color}${this.getCategoryName(analysis.category)}`;
                
                // 显示搭配建议（在控制台）
                console.log('🤖 AI 分析结果：', {
                    '识别颜色': analysis.color,
                    '识别类型': this.getCategoryName(analysis.category),
                    '置信度': `${(analysis.confidence * 100).toFixed(0)}%`,
                    '建议季节': aiHelper.getSeasonName(analysis.suggestedSeason),
                    '适合场合': analysis.occasions.join('、'),
                    '搭配建议': analysis.matching.tip
                });
                
                // 如果有搭配建议，显示提示
                if (analysis.matching.safe.length > 0) {
                    setTimeout(() => {
                        const tip = `🎨 搭配建议：${analysis.matching.tip}\n` +
                                  `安全色：${analysis.matching.safe.join('、')}`;
                        console.info(tip);
                    }, 500);
                }
                
                // 震动反馈
                if (navigator.vibrate) {
                    navigator.vibrate([30, 50, 30]);
                }
            } else {
                nameInput.placeholder = originalPlaceholder;
            }
        } catch (error) {
            console.error('AI 分析失败:', error);
        }
    }
    
    // 获取分类中文名称
    getCategoryName(category) {
        const names = {
            top: '上衣',
            pants: '裤子',
            shoes: '鞋子',
            accessory: '配饰'
        };
        return names[category] || '衣服';
    }
    
    // 重拍
    retakePhoto() {
        this.resetCameraUI();
        this.capturedImage = null;
    }

    // 处理文件选择
    async handleFileSelect(event) {
        const file = event.target.files[0];
        if (!file) return;
        
        // 验证文件类型
        if (!file.type.startsWith('image/')) {
            alert('请选择图片文件');
            return;
        }
        
        // 检查文件大小
        const fileSizeMB = (file.size / 1024 / 1024).toFixed(2);
        if (file.size > 10 * 1024 * 1024) {
            alert(`图片太大了（${fileSizeMB}MB），请选择小于10MB的图片`);
            return;
        }
        
        // 读取文件
        const reader = new FileReader();
        reader.onload = async (e) => {
            // 压缩图片
            this.capturedImage = await this.compressImage(e.target.result);
            // 打开模态框并显示预览
            this.cameraModal.classList.add('active');
            this.showPreview();
        };
        reader.readAsDataURL(file);
        
        // 清空输入，以便下次选择相同文件时也能触发
        event.target.value = '';
    }
    
    // 快速保存（只需要名称和分类）
    async quickSave() {
        if (!this.capturedImage) {
            alert('请先拍摄照片');
            return;
        }
        
        const name = document.getElementById('cloth-name').value.trim();
        const category = document.getElementById('cloth-category').value;
        
        if (!name) {
            alert('请输入衣服名称');
            return;
        }
        
        // 创建衣服对象（使用默认值）
        const cloth = {
            id: this.generateId(),
            name: name,
            category: category,
            color: '未设置',
            season: 'all',
            image: this.capturedImage,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
        };
        
        if (await storage.addCloth(cloth)) {
            document.dispatchEvent(new CustomEvent('clothAdded', { detail: cloth }));
            this.closeCamera();
            this.resetForm();
            // 震动反馈
            if (navigator.vibrate) {
                navigator.vibrate(50);
            }
        } else {
            alert('保存失败，请重试');
        }
    }
    
    // 保存衣服
    saveCloth() {
        if (!this.capturedImage) {
            alert('请先拍摄照片');
            return;
        }
        
        // 检查存储空间
        this.checkStorageSpace();
        
        // 获取表单数据
        const name = document.getElementById('cloth-name').value.trim();
        const category = document.getElementById('cloth-category').value;
        const color = document.getElementById('cloth-color').value.trim();
        const season = document.getElementById('cloth-season').value;
        
        // 验证表单
        if (!name) {
            alert('请输入衣服名称');
            return;
        }
        
        // 创建衣服对象
        const cloth = {
            id: this.generateId(),
            name: name,
            category: category,
            color: color,
            season: season,
            image: this.capturedImage,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
        };
        
        // 保存到本地存储
        if (await storage.addCloth(cloth)) {
            // 通知应用更新界面
            document.dispatchEvent(new CustomEvent('clothAdded', { detail: cloth }));
            
            // 关闭摄像头
            this.closeCamera();
            
            // 重置表单
            this.resetForm();
            
            // 震动反馈
            if (navigator.vibrate) {
                navigator.vibrate(50);
            }
        } else {
            alert('保存失败，请重试');
        }
    }

    // 重置表单
    resetForm() {
        document.getElementById('cloth-name').value = '';
        document.getElementById('cloth-category').value = 'top';
        document.getElementById('cloth-color').value = '';
        document.getElementById('cloth-season').value = 'all';
    }

    // 生成唯一ID
    generateId() {
        return Date.now().toString(36) + Math.random().toString(36).substr(2);
    }

    // 压缩图片（优化版）
    async compressImage(imageDataUrl, maxWidth = 600, quality = 0.7) {
        return new Promise((resolve) => {
            const img = new Image();
            img.src = imageDataUrl;
            
            img.onload = () => {
                // 计算新尺寸
                let width = img.width;
                let height = img.height;
                
                // 根据图片尺寸动态调整压缩参数
                if (width > maxWidth || height > maxWidth) {
                    const ratio = Math.min(maxWidth / width, maxWidth / height);
                    width = width * ratio;
                    height = height * ratio;
                }
                
                // 创建临时canvas
                const tempCanvas = document.createElement('canvas');
                tempCanvas.width = width;
                tempCanvas.height = height;
                const tempCtx = tempCanvas.getContext('2d');
                
                // 使用更好的图片平滑算法
                tempCtx.imageSmoothingEnabled = true;
                tempCtx.imageSmoothingQuality = 'high';
                
                // 绘制压缩后的图片
                tempCtx.drawImage(img, 0, 0, width, height);
                
                // 转换为数据URL，使用更低的质量以节省空间
                const compressedDataUrl = tempCanvas.toDataURL('image/jpeg', quality);
                resolve(compressedDataUrl);
            };
        });
    }
    
    // 检查存储空间
    checkStorageSpace() {
        try {
            const used = new Blob(Object.values(localStorage)).size;
            const limit = 5 * 1024 * 1024; // 5MB
            const usedMB = (used / 1024 / 1024).toFixed(2);
            const percentage = ((used / limit) * 100).toFixed(1);
            
            if (percentage > 80) {
                alert(`⚠️ 存储空间即将用完！\n已使用: ${usedMB}MB (${percentage}%)\n建议删除一些不常穿的衣服`);
            }
            
            return { used, limit, percentage };
        } catch (e) {
            console.error('无法检查存储空间:', e);
            return null;
        }
    }
}

// 导出实例
const cameraManager = new CameraManager();