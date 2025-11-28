// 衣柜管理
class ClosetManager {
    constructor() {
        this.clothesGrid = document.getElementById('clothes-grid');
        this.categoryFilters = document.querySelectorAll('.category-btn[data-category]');
        this.addClothBtn = document.getElementById('add-cloth-btn');
        
        this.currentCategory = 'all';
        this.clothes = [];
        
        this.initEventListeners();
        this.loadClothes();
    }

    // 初始化事件监听器
    initEventListeners() {
        // 分类筛选按钮
        this.categoryFilters.forEach(btn => {
            btn.addEventListener('click', (e) => {
                this.filterByCategory(e.target.dataset.category);
            });
        });
        
        // 添加衣服按钮
        this.addClothBtn.addEventListener('click', () => {
            cameraManager.openCamera();
        });
        
        // 监听衣服添加事件
        document.addEventListener('clothAdded', () => {
            this.loadClothes();
        });
        
        // 监听衣服删除事件
        document.addEventListener('clothDeleted', () => {
            this.loadClothes();
        });
    }

    // 加载衣服数据
    loadClothes() {
        this.clothes = storage.getClothes();
        this.renderClothes();
    }

    // 渲染衣服列表
    renderClothes() {
        const filteredClothes = this.currentCategory === 'all' 
            ? this.clothes 
            : this.clothes.filter(cloth => cloth.category === this.currentCategory);
        
        if (filteredClothes.length === 0) {
            this.clothesGrid.innerHTML = `
                <div class="empty-state">
                    <div class="empty-state-icon">👔</div>
                    <p>你的衣柜还是空的</p>
                    <button class="btn-primary" onclick="cameraManager.openCamera()">添加第一件衣服</button>
                </div>
            `;
            return;
        }
        
        this.clothesGrid.innerHTML = filteredClothes.map(cloth => this.createClothCard(cloth)).join('');
        
        // 添加衣服卡片事件监听器
        this.addClothCardEventListeners();
    }

    // 创建衣服卡片HTML
    createClothCard(cloth) {
        const categoryNames = {
            top: '上衣',
            pants: '裤子',
            shoes: '鞋子',
            accessory: '配饰'
        };
        
        return `
            <div class="cloth-card" data-cloth-id="${cloth.id}">
                <img src="${cloth.image}" alt="${cloth.name}" class="cloth-image">
                <div class="cloth-info">
                    <div class="cloth-name">${cloth.name}</div>
                    <div class="cloth-category">${categoryNames[cloth.category]}</div>
                </div>
            </div>
        `;
    }

    // 添加衣服卡片事件监听器
    addClothCardEventListeners() {
        const clothCards = document.querySelectorAll('.cloth-card');
        clothCards.forEach(card => {
            let touchStartX = 0;
            let touchStartY = 0;
            let touchEndX = 0;
            let touchEndY = 0;
            let touchStartTime = 0;
            let lastTapTime = 0;
            let isSwiping = false;
            
            // 触摸开始
            card.addEventListener('touchstart', (e) => {
                touchStartX = e.touches[0].clientX;
                touchStartY = e.touches[0].clientY;
                touchStartTime = Date.now();
                isSwiping = false;
            });
            
            // 触摸移动
            card.addEventListener('touchmove', (e) => {
                if (!touchStartX) return;
                
                const touchX = e.touches[0].clientX;
                const touchY = e.touches[0].clientY;
                const deltaX = touchX - touchStartX;
                const deltaY = touchY - touchStartY;
                
                // 只处理横向滑动
                if (Math.abs(deltaX) > Math.abs(deltaY) && Math.abs(deltaX) > 10) {
                    isSwiping = true;
                    e.preventDefault();
                    card.classList.add('swiping');
                    
                    // 只允许左滑
                    if (deltaX < 0 && deltaX > -100) {
                        card.style.transform = `translateX(${deltaX}px)`;
                    }
                }
            });
            
            // 触摸结束
            card.addEventListener('touchend', (e) => {
                touchEndX = e.changedTouches[0].clientX;
                touchEndY = e.changedTouches[0].clientY;
                const touchDuration = Date.now() - touchStartTime;
                const deltaX = touchEndX - touchStartX;
                
                card.classList.remove('swiping');
                
                if (isSwiping) {
                    // 滑动删除逻辑
                    if (deltaX < -60) {
                        card.classList.add('swipe-left');
                        // 显示删除按钮
                        setTimeout(() => {
                            if (confirm('确定要删除这件衣服吗？')) {
                                const clothId = card.dataset.clothId;
                                this.deleteCloth(clothId);
                                // 震动反馈
                                if (navigator.vibrate) {
                                    navigator.vibrate(50);
                                }
                            } else {
                                card.classList.remove('swipe-left');
                                card.style.transform = '';
                            }
                        }, 200);
                    } else {
                        // 恢复位置
                        card.style.transform = '';
                    }
                } else if (touchDuration < 300) {
                    // 检测双击
                    const currentTime = Date.now();
                    const tapGap = currentTime - lastTapTime;
                    
                    if (tapGap < 300 && tapGap > 0) {
                        // 双击 - 查看大图
                        const clothId = card.dataset.clothId;
                        this.viewClothImage(clothId);
                        // 震动反馈
                        if (navigator.vibrate) {
                            navigator.vibrate(30);
                        }
                    } else {
                        // 单击 - 选择衣服
                        const clothId = card.dataset.clothId;
                        this.selectCloth(clothId);
                    }
                    
                    lastTapTime = currentTime;
                }
                
                // 重置
                touchStartX = 0;
                touchStartY = 0;
            });
            
            // PC端双击支持
            card.addEventListener('dblclick', (e) => {
                const clothId = e.currentTarget.dataset.clothId;
                this.viewClothImage(clothId);
            });
        });
    }

    // 选择衣服（用于穿搭组合）
    selectCloth(clothId) {
        // 触发衣服选择事件，供穿搭组合模块使用
        document.dispatchEvent(new CustomEvent('clothSelected', { 
            detail: { clothId: clothId } 
        }));
    }

    // 按分类筛选
    filterByCategory(category) {
        // 更新当前分类
        this.currentCategory = category;
        
        // 更新筛选按钮状态
        this.categoryFilters.forEach(btn => {
            btn.classList.remove('active');
            if (btn.dataset.category === category) {
                btn.classList.add('active');
            }
        });
        
        // 重新渲染衣服列表
        this.renderClothes();
    }

    // 获取当前分类的衣服
    getCurrentCategoryClothes() {
        return this.currentCategory === 'all' 
            ? this.clothes 
            : this.clothes.filter(cloth => cloth.category === this.currentCategory);
    }

    // 查看衣服图片
    viewClothImage(clothId) {
        const cloth = storage.getClothById(clothId);
        if (!cloth) return;
        
        const modal = document.getElementById('image-viewer-modal');
        const viewerImage = document.getElementById('viewer-image');
        const deleteBtn = document.getElementById('delete-cloth-btn');
        
        // 设置图片
        viewerImage.src = cloth.image;
        modal.classList.add('active');
        
        // 删除按钮事件
        const deleteHandler = () => {
            if (this.deleteCloth(clothId)) {
                modal.classList.remove('active');
            }
            deleteBtn.removeEventListener('click', deleteHandler);
        };
        deleteBtn.addEventListener('click', deleteHandler);
        
        // 关闭按钮
        const closeBtn = document.getElementById('close-viewer');
        const closeHandler = () => {
            modal.classList.remove('active');
            closeBtn.removeEventListener('click', closeHandler);
        };
        closeBtn.addEventListener('click', closeHandler);
        
        // 点击背景关闭
        const bgCloseHandler = (e) => {
            if (e.target === modal) {
                modal.classList.remove('active');
                modal.removeEventListener('click', bgCloseHandler);
            }
        };
        modal.addEventListener('click', bgCloseHandler);
    }
    
    // 删除衣服
    deleteCloth(clothId) {
        if (storage.deleteCloth(clothId)) {
            document.dispatchEvent(new CustomEvent('clothDeleted', { detail: { clothId: clothId } }));
            return true;
        }
        return false;
    }
}

// 导出实例
const closetManager = new ClosetManager();