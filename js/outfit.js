// 穿搭组合管理
class OutfitManager {
    constructor() {
        this.outfitSlots = document.querySelectorAll('.outfit-slot');
        this.selectorGrid = document.getElementById('selector-grid');
        this.selectorCategories = document.querySelectorAll('.category-btn[data-selector-category]');
        this.saveOutfitBtn = document.getElementById('save-outfit-btn');
        this.randomOutfitBtn = document.getElementById('random-outfit-btn');
        this.outfitsGrid = document.getElementById('outfits-grid');
        
        this.currentSelectorCategory = 'top';
        this.currentOutfit = {
            top: null,
            pants: null,
            shoes: null,
            accessory: null
        };
        this.outfits = [];
        
        this.initEventListeners();
        this.loadOutfits();
        this.renderSelector();
    }

    // 初始化事件监听器
    initEventListeners() {
        // 选择器分类按钮
        this.selectorCategories.forEach(btn => {
            btn.addEventListener('click', (e) => {
                this.changeSelectorCategory(e.target.dataset.selectorCategory);
            });
        });
        
        // 保存穿搭按钮
        this.saveOutfitBtn.addEventListener('click', () => {
            this.saveOutfit();
        });
        
        // 随机穿搭按钮
        this.randomOutfitBtn.addEventListener('click', () => {
            this.generateRandomOutfit();
        });
        
        // 衣服选择事件
        document.addEventListener('clothSelected', (e) => {
            this.addClothToOutfit(e.detail.clothId);
        });
        
        // 监听衣服添加事件，更新选择器
        document.addEventListener('clothAdded', () => {
            this.renderSelector();
        });
        
        // 监听衣服删除事件，更新选择器和当前穿搭
        document.addEventListener('clothDeleted', (e) => {
            this.renderSelector();
            this.removeDeletedClothFromOutfit(e.detail.clothId);
        });
    }

    // 加载穿搭数据
    loadOutfits() {
        this.outfits = storage.getOutfits();
        this.renderOutfits();
    }

    // 渲染穿搭列表
    renderOutfits() {
        if (this.outfits.length === 0) {
            this.outfitsGrid.innerHTML = `
                <div class="empty-state">
                    <div class="empty-state-icon">✨</div>
                    <p>还没有保存的穿搭</p>
                    <p>快去创建你的第一个穿搭吧！</p>
                </div>
            `;
            return;
        }
        
        this.outfitsGrid.innerHTML = this.outfits.map(outfit => this.createOutfitCard(outfit)).join('');
    }

    // 创建穿搭卡片HTML
    createOutfitCard(outfit) {
        const categoryNames = {
            top: '上衣',
            pants: '裤子',
            shoes: '鞋子',
            accessory: '配饰'
        };
        
        const formattedDate = new Date(outfit.createdAt).toLocaleDateString('zh-CN');
        
        return `
            <div class="outfit-card">
                <div class="outfit-card-header">
                    <div class="outfit-name">${outfit.name || '未命名穿搭'}</div>
                    <div class="outfit-date">${formattedDate}</div>
                </div>
                <div class="outfit-items">
                    ${Object.entries(outfit.items).map(([category, clothId]) => {
                        if (!clothId) return '';
                        const cloth = storage.getClothById(clothId);
                        if (!cloth) return '';
                        return `
                            <div class="outfit-item">
                                <img src="${cloth.image}" alt="${cloth.name}">
                                <div class="outfit-item-label">${categoryNames[category]}</div>
                            </div>
                        `;
                    }).join('')}
                </div>
            </div>
        `;
    }

    // 渲染选择器
    renderSelector() {
        const clothes = storage.getClothesByCategory(this.currentSelectorCategory);
        
        if (clothes.length === 0) {
            this.selectorGrid.innerHTML = `
                <div class="empty-state">
                    <p>该分类下还没有衣服</p>
                    <button class="btn-primary" onclick="cameraManager.openCamera()">添加衣服</button>
                </div>
            `;
            return;
        }
        
        this.selectorGrid.innerHTML = clothes.map(cloth => this.createSelectorClothCard(cloth)).join('');
        
        // 添加选择器衣服卡片事件监听器
        this.addSelectorCardEventListeners();
    }

    // 创建选择器衣服卡片HTML
    createSelectorClothCard(cloth) {
        return `
            <div class="cloth-card" data-cloth-id="${cloth.id}">
                <img src="${cloth.image}" alt="${cloth.name}" class="cloth-image">
                <div class="cloth-info">
                    <div class="cloth-name">${cloth.name}</div>
                </div>
            </div>
        `;
    }

    // 添加选择器卡片事件监听器
    addSelectorCardEventListeners() {
        const cards = this.selectorGrid.querySelectorAll('.cloth-card');
        cards.forEach(card => {
            card.addEventListener('click', (e) => {
                const clothId = e.currentTarget.dataset.clothId;
                this.addClothToOutfit(clothId);
            });
        });
    }

    // 改变选择器分类
    changeSelectorCategory(category) {
        this.currentSelectorCategory = category;
        
        // 更新分类按钮状态
        this.selectorCategories.forEach(btn => {
            btn.classList.remove('active');
            if (btn.dataset.selectorCategory === category) {
                btn.classList.add('active');
            }
        });
        
        // 重新渲染选择器
        this.renderSelector();
    }

    // 添加衣服到穿搭
    addClothToOutfit(clothId) {
        const cloth = storage.getClothById(clothId);
        if (!cloth) return;
        
        this.currentOutfit[cloth.category] = clothId;
        this.updateOutfitDisplay();
    }

    // 更新穿搭显示
    updateOutfitDisplay() {
        this.outfitSlots.forEach(slot => {
            const category = slot.dataset.slot;
            const clothId = this.currentOutfit[category];
            
            if (clothId) {
                const cloth = storage.getClothById(clothId);
                if (cloth) {
                    slot.innerHTML = `
                        <img src="${cloth.image}" alt="${cloth.name}" class="slot-cloth">
                        <button class="remove-cloth" onclick="outfitManager.removeClothFromOutfit('${category}')">&times;</button>
                    `;
                    slot.classList.add('has-cloth');
                }
            } else {
                slot.innerHTML = `<span class="slot-placeholder">+ 选择${this.getCategoryName(category)}</span>`;
                slot.classList.remove('has-cloth');
            }
        });
    }

    // 从穿搭中移除衣服
    removeClothFromOutfit(category) {
        this.currentOutfit[category] = null;
        this.updateOutfitDisplay();
    }

    // 移除已删除的衣服从当前穿搭
    removeDeletedClothFromOutfit(clothId) {
        Object.keys(this.currentOutfit).forEach(category => {
            if (this.currentOutfit[category] === clothId) {
                this.currentOutfit[category] = null;
            }
        });
        this.updateOutfitDisplay();
    }

    // 保存穿搭
    saveOutfit() {
        // 检查是否有至少一件衣服
        const hasClothes = Object.values(this.currentOutfit).some(clothId => clothId !== null);
        if (!hasClothes) {
            alert('请至少选择一件衣服');
            return;
        }
        
        // 获取穿搭名称
        const outfitName = prompt('请为你的穿搭起个名字：');
        if (outfitName === null) return; // 用户取消
        
        // 创建穿搭对象
        const outfit = {
            id: this.generateId(),
            name: outfitName.trim() || '未命名穿搭',
            items: { ...this.currentOutfit },
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
        };
        
        // 保存到本地存储
        if (storage.addOutfit(outfit)) {
            this.outfits.push(outfit);
            this.renderOutfits();
            alert('穿搭保存成功！');
        } else {
            alert('保存失败，请重试');
        }
    }

    // 生成随机穿搭
    generateRandomOutfit() {
        const clothes = storage.getClothes();
        if (clothes.length === 0) {
            alert('你的衣柜还是空的，无法生成随机穿搭');
            return;
        }
        
        // 按分类分组
        const clothesByCategory = {
            top: clothes.filter(cloth => cloth.category === 'top'),
            pants: clothes.filter(cloth => cloth.category === 'pants'),
            shoes: clothes.filter(cloth => cloth.category === 'shoes'),
            accessory: clothes.filter(cloth => cloth.category === 'accessory')
        };
        
        // 随机选择每个分类的衣服（如果有的话）
        this.currentOutfit = {
            top: clothesByCategory.top.length > 0 
                ? clothesByCategory.top[Math.floor(Math.random() * clothesByCategory.top.length)].id 
                : null,
            pants: clothesByCategory.pants.length > 0 
                ? clothesByCategory.pants[Math.floor(Math.random() * clothesByCategory.pants.length)].id 
                : null,
            shoes: clothesByCategory.shoes.length > 0 
                ? clothesByCategory.shoes[Math.floor(Math.random() * clothesByCategory.shoes.length)].id 
                : null,
            accessory: clothesByCategory.accessory.length > 0 
                ? clothesByCategory.accessory[Math.floor(Math.random() * clothesByCategory.accessory.length)].id 
                : null
        };
        
        this.updateOutfitDisplay();
    }

    // 获取分类中文名称
    getCategoryName(category) {
        const categoryNames = {
            top: '上衣',
            pants: '裤子',
            shoes: '鞋子',
            accessory: '配饰'
        };
        return categoryNames[category] || category;
    }

    // 生成唯一ID
    generateId() {
        return Date.now().toString(36) + Math.random().toString(36).substr(2);
    }
}

// 导出实例
const outfitManager = new OutfitManager();