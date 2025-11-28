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
    async loadOutfits() {
        this.outfits = await storage.getOutfits();
        // 缓存所有衣服数据供渲染使用
        this.getAllClothesCache = await storage.getClothes();
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

    // 创建穿搭卡片HTML（同步版本，使用缓存数据）
    createOutfitCard(outfit) {
        const categoryNames = {
            top: '上衣',
            pants: '裤子',
            shoes: '鞋子',
            accessory: '配饰'
        };
        
        const formattedDate = new Date(outfit.createdAt).toLocaleDateString('zh-CN');
        
        // 使用已加载的衣服数据
        const clothes = this.getAllClothesCache || [];
        
        return `
            <div class="outfit-card">
                <div class="outfit-card-header">
                    <div class="outfit-name">${outfit.name || '未命名穿搭'}</div>
                    <div class="outfit-date">${formattedDate}</div>
                </div>
                <div class="outfit-items">
                    ${Object.entries(outfit.items).map(([category, clothId]) => {
                        if (!clothId) return '';
                        const cloth = clothes.find(c => c.id === clothId);
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
    async renderSelector() {
        const clothes = await storage.getClothesByCategory(this.currentSelectorCategory);
        
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
    async addClothToOutfit(clothId) {
        const cloth = await storage.getClothById(clothId);
        if (!cloth) return;
        
        this.currentOutfit[cloth.category] = clothId;
        this.updateOutfitDisplay();
    }

    // 更新穿搭显示
    async updateOutfitDisplay() {
        for (const slot of this.outfitSlots) {
            const category = slot.dataset.slot;
            const clothId = this.currentOutfit[category];
            
            if (clothId) {
                const cloth = await storage.getClothById(clothId);
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
        }
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
    async saveOutfit() {
        // 检查是否有至少一件衣服
        const hasClothes = Object.values(this.currentOutfit).some(clothId => clothId !== null);
        if (!hasClothes) {
            alert('请至少选择一件衣服');
            return;
        }
        
        // AI 颜色搭配检查
        const colorCheckPassed = await this.checkColorMatching();
        if (!colorCheckPassed) {
            return; // 用户取消保存
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
        if (await storage.addOutfit(outfit)) {
            this.outfits.push(outfit);
            this.renderOutfits();
            alert('穿搭保存成功！');
        } else {
            alert('保存失败，请重试');
        }
    }

    // 生成随机穿搭（智能版）
    async generateRandomOutfit() {
        const clothes = await storage.getClothes();
        if (clothes.length === 0) {
            alert('你的衣柜还是空的，无法生成随机穿搭');
            return;
        }
        
        // 获取当前季节
        const currentSeason = this.getCurrentSeason();
        
        // 按分类和季节过滤
        const filterBySeason = (clothList) => {
            return clothList.filter(cloth => 
                cloth.season === currentSeason || cloth.season === 'all'
            );
        };
        
        const clothesByCategory = {
            top: filterBySeason(clothes.filter(cloth => cloth.category === 'top')),
            pants: filterBySeason(clothes.filter(cloth => cloth.category === 'pants')),
            shoes: filterBySeason(clothes.filter(cloth => cloth.category === 'shoes')),
            accessory: filterBySeason(clothes.filter(cloth => cloth.category === 'accessory'))
        };
        
        // 检查是否有适合当前季节的衣服
        const hasSeasonalClothes = Object.values(clothesByCategory).some(arr => arr.length > 0);
        
        if (!hasSeasonalClothes) {
            const confirm = window.confirm(
                `没有找到适合${this.getSeasonName(currentSeason)}的衣服。\n` +
                `是否从所有衣服中随机选择？`
            );
            
            if (confirm) {
                // 使用所有衣服
                clothesByCategory.top = clothes.filter(cloth => cloth.category === 'top');
                clothesByCategory.pants = clothes.filter(cloth => cloth.category === 'pants');
                clothesByCategory.shoes = clothes.filter(cloth => cloth.category === 'shoes');
                clothesByCategory.accessory = clothes.filter(cloth => cloth.category === 'accessory');
            } else {
                return;
            }
        }
        
        // 随机选择每个分类的衣服
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
        
        // 震动反馈
        if (navigator.vibrate) {
            navigator.vibrate([50, 100, 50]);
        }
    }

    // AI 颜色搭配检查
    async checkColorMatching() {
        const clothes = [];
        const colors = [];
        
        // 收集当前穿搭的衣服颜色
        for (const [category, clothId] of Object.entries(this.currentOutfit)) {
            if (clothId) {
                const cloth = await storage.getClothById(clothId);
                if (cloth && cloth.color && cloth.color !== '未设置') {
                    clothes.push({ category, cloth });
                    colors.push(cloth.color);
                }
            }
        }
        
        if (colors.length < 2) return true; // 少于2件不需要检查
        
        // 检查颜色冲突
        let hasConflict = false;
        let warnings = [];
        
        for (let i = 0; i < colors.length - 1; i++) {
            for (let j = i + 1; j < colors.length; j++) {
                const conflict = aiHelper.checkColorConflict(colors[i], colors[j]);
                if (conflict.hasConflict) {
                    hasConflict = true;
                    warnings.push(conflict.warning);
                }
            }
        }
        
        // 如果有冲突，给出提示
        if (hasConflict) {
            const proceed = confirm(
                '🤖 AI 搭配建议：\n\n' + 
                warnings.join('\n') + 
                '\n\n是否仍然保存这套穿搭？'
            );
            
            if (!proceed) {
                return false;
            }
        } else if (colors.length >= 2) {
            // 没有冲突，给出正面反馈
            console.log('✅ AI 检测：颜色搭配很和谐！');
        }
        
        return true;
    }
    
    // AI 颜色搭配检查
    async checkColorMatching() {
        const clothes = [];
        const colors = [];
        
        // 收集当前穿搭的衣服颜色
        for (const [category, clothId] of Object.entries(this.currentOutfit)) {
            if (clothId) {
                const cloth = storage.getClothById(clothId);
                if (cloth && cloth.color && cloth.color !== '未设置') {
                    clothes.push({ category, cloth });
                    colors.push(cloth.color);
                }
            }
        }
        
        if (colors.length < 2) return true; // 少于2件不需要检查
        
        // 检查颜色冲突
        let hasConflict = false;
        let warnings = [];
        
        for (let i = 0; i < colors.length - 1; i++) {
            for (let j = i + 1; j < colors.length; j++) {
                const conflict = aiHelper.checkColorConflict(colors[i], colors[j]);
                if (conflict.hasConflict) {
                    hasConflict = true;
                    warnings.push(conflict.warning);
                }
            }
        }
        
        // 如果有冲突，给出提示
        if (hasConflict) {
            const proceed = confirm(
                '🤖 AI 搭配建议：\n\n' + 
                warnings.join('\n') + 
                '\n\n是否仍然保存这套穿搭？'
            );
            
            return proceed;
        } else if (colors.length >= 2) {
            // 没有冲突，给出正面反馈
            console.log('✅ AI 检测：颜色搭配很和谐！');
        }
        
        return true;
    }
    
    // 获取当前季节
    getCurrentSeason() {
        const month = new Date().getMonth() + 1; // 1-12
        
        if (month >= 3 && month <= 5) return 'spring';
        if (month >= 6 && month <= 8) return 'summer';
        if (month >= 9 && month <= 11) return 'autumn';
        return 'winter';
    }
    
    // 获取季节中文名称
    getSeasonName(season) {
        const seasonNames = {
            spring: '春季',
            summer: '夏季',
            autumn: '秋季',
            winter: '冬季',
            all: '四季'
        };
        return seasonNames[season] || season;
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