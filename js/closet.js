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
            card.addEventListener('click', (e) => {
                const clothId = e.currentTarget.dataset.clothId;
                this.selectCloth(clothId);
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

    // 删除衣服
    deleteCloth(clothId) {
        if (confirm('确定要删除这件衣服吗？')) {
            if (storage.deleteCloth(clothId)) {
                document.dispatchEvent(new CustomEvent('clothDeleted', { detail: { clothId: clothId } }));
                return true;
            }
        }
        return false;
    }
}

// 导出实例
const closetManager = new ClosetManager();