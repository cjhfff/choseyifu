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
    capturePhoto() {
        try {
            // 设置canvas尺寸与视频一致
            this.canvas.width = this.video.videoWidth;
            this.canvas.height = this.video.videoHeight;
            
            // 绘制视频帧到canvas
            this.ctx.drawImage(this.video, 0, 0, this.canvas.width, this.canvas.height);
            
            // 将canvas转换为图片数据URL
            this.capturedImage = this.canvas.toDataURL('image/jpeg', 0.8);
            
            // 显示预览
            this.showPreview();
            
        } catch (error) {
            console.error('Error capturing photo:', error);
            alert('拍照失败，请重试');
        }
    }

    // 显示预览
    showPreview() {
        // 隐藏视频，显示预览和表单
        this.video.style.display = 'none';
        this.cameraPreview.style.display = 'block';
        this.clothForm.style.display = 'block';
        this.captureBtn.style.display = 'none';
        this.retakeBtn.style.display = 'inline-block';
        
        // 设置预览图片
        this.previewImage.src = this.capturedImage;
    }

    // 重拍
    retakePhoto() {
        this.resetCameraUI();
        this.capturedImage = null;
    }

    // 处理文件选择
    handleFileSelect(event) {
        const file = event.target.files[0];
        if (!file) return;
        
        // 验证文件类型
        if (!file.type.startsWith('image/')) {
            alert('请选择图片文件');
            return;
        }
        
        // 读取文件
        const reader = new FileReader();
        reader.onload = (e) => {
            this.capturedImage = e.target.result;
            // 打开模态框并显示预览
            this.cameraModal.classList.add('active');
            this.showPreview();
        };
        reader.readAsDataURL(file);
        
        // 清空输入，以便下次选择相同文件时也能触发
        event.target.value = '';
    }
    
    // 快速保存（只需要名称和分类）
    quickSave() {
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
        
        if (storage.addCloth(cloth)) {
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
        if (storage.addCloth(cloth)) {
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

    // 压缩图片
    compressImage(imageDataUrl, maxWidth = 800, quality = 0.8) {
        return new Promise((resolve) => {
            const img = new Image();
            img.src = imageDataUrl;
            
            img.onload = () => {
                // 计算新尺寸
                let width = img.width;
                let height = img.height;
                
                if (width > maxWidth) {
                    height = (height * maxWidth) / width;
                    width = maxWidth;
                }
                
                // 创建临时canvas
                const tempCanvas = document.createElement('canvas');
                tempCanvas.width = width;
                tempCanvas.height = height;
                const tempCtx = tempCanvas.getContext('2d');
                
                // 绘制压缩后的图片
                tempCtx.drawImage(img, 0, 0, width, height);
                
                // 转换为数据URL
                const compressedDataUrl = tempCanvas.toDataURL('image/jpeg', quality);
                resolve(compressedDataUrl);
            };
        });
    }
}

// 导出实例
const cameraManager = new CameraManager();