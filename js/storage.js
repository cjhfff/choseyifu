// 本地存储管理
class StorageManager {
    constructor() {
        this.CLOTHES_KEY = 'wardrobe_clothes';
        this.OUTFITS_KEY = 'wardrobe_outfits';
    }

    // 获取所有衣服
    getClothes() {
        try {
            const clothes = localStorage.getItem(this.CLOTHES_KEY);
            return clothes ? JSON.parse(clothes) : [];
        } catch (error) {
            console.error('Error getting clothes from storage:', error);
            return [];
        }
    }

    // 保存衣服
    saveClothes(clothes) {
        try {
            localStorage.setItem(this.CLOTHES_KEY, JSON.stringify(clothes));
            return true;
        } catch (error) {
            console.error('Error saving clothes to storage:', error);
            return false;
        }
    }

    // 添加新衣服
    addCloth(cloth) {
        const clothes = this.getClothes();
        clothes.push(cloth);
        return this.saveClothes(clothes);
    }

    // 删除衣服
    deleteCloth(clothId) {
        const clothes = this.getClothes();
        const updatedClothes = clothes.filter(cloth => cloth.id !== clothId);
        return this.saveClothes(updatedClothes);
    }

    // 根据ID获取衣服
    getClothById(clothId) {
        const clothes = this.getClothes();
        return clothes.find(cloth => cloth.id === clothId);
    }

    // 根据分类获取衣服
    getClothesByCategory(category) {
        const clothes = this.getClothes();
        if (category === 'all') {
            return clothes;
        }
        return clothes.filter(cloth => cloth.category === category);
    }

    // 获取所有穿搭
    getOutfits() {
        try {
            const outfits = localStorage.getItem(this.OUTFITS_KEY);
            return outfits ? JSON.parse(outfits) : [];
        } catch (error) {
            console.error('Error getting outfits from storage:', error);
            return [];
        }
    }

    // 保存穿搭
    saveOutfits(outfits) {
        try {
            localStorage.setItem(this.OUTFITS_KEY, JSON.stringify(outfits));
            return true;
        } catch (error) {
            console.error('Error saving outfits to storage:', error);
            return false;
        }
    }

    // 添加新穿搭
    addOutfit(outfit) {
        const outfits = this.getOutfits();
        outfits.push(outfit);
        return this.saveOutfits(outfits);
    }

    // 删除穿搭
    deleteOutfit(outfitId) {
        const outfits = this.getOutfits();
        const updatedOutfits = outfits.filter(outfit => outfit.id !== outfitId);
        return this.saveOutfits(updatedOutfits);
    }

    // 根据ID获取穿搭
    getOutfitById(outfitId) {
        const outfits = this.getOutfits();
        return outfits.find(outfit => outfit.id === outfitId);
    }

    // 清除所有数据
    clearAll() {
        try {
            localStorage.removeItem(this.CLOTHES_KEY);
            localStorage.removeItem(this.OUTFITS_KEY);
            return true;
        } catch (error) {
            console.error('Error clearing storage:', error);
            return false;
        }
    }
}

// 导出实例
const storage = new StorageManager();