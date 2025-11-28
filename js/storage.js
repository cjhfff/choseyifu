// storage.js - 基于 IndexedDB 的大容量存储版
class StorageManager {
    constructor() {
        this.DB_NAME = 'WardrobeDB';
        this.DB_VERSION = 1;
        this.STORES = {
            CLOTHES: 'wardrobe_clothes',
            OUTFITS: 'wardrobe_outfits'
        };
        this.db = null;
        this.initPromise = this.initDB();
    }

    // 初始化数据库
    initDB() {
        return new Promise((resolve, reject) => {
            const request = indexedDB.open(this.DB_NAME, this.DB_VERSION);

            request.onerror = (event) => {
                console.error("数据库打开失败", event);
                reject("Database error");
            };

            request.onsuccess = (event) => {
                this.db = event.target.result;
                console.log("🗄️ 数据库连接成功");
                resolve(this.db);
            };

            request.onupgradeneeded = (event) => {
                const db = event.target.result;
                // 创建衣服仓库，以 id 为主键
                if (!db.objectStoreNames.contains(this.STORES.CLOTHES)) {
                    db.createObjectStore(this.STORES.CLOTHES, { keyPath: 'id' });
                }
                // 创建穿搭仓库，以 id 为主键
                if (!db.objectStoreNames.contains(this.STORES.OUTFITS)) {
                    db.createObjectStore(this.STORES.OUTFITS, { keyPath: 'id' });
                }
            };
        });
    }

    // 通用数据库操作辅助函数
    async performTransaction(storeName, mode, callback) {
        if (!this.db) await this.initPromise;
        return new Promise((resolve, reject) => {
            const transaction = this.db.transaction([storeName], mode);
            const store = transaction.objectStore(storeName);
            const request = callback(store);

            request.onsuccess = () => resolve(request.result);
            request.onerror = () => reject(request.error);
        });
    }

    // --- 衣服相关方法 ---

    // 获取所有衣服
    async getClothes() {
        try {
            return await this.performTransaction(this.STORES.CLOTHES, 'readonly', store => store.getAll());
        } catch (error) {
            console.error('获取衣服失败:', error);
            return [];
        }
    }

    // 添加/更新衣服
    async addCloth(cloth) {
        try {
            await this.performTransaction(this.STORES.CLOTHES, 'readwrite', store => store.put(cloth));
            return true;
        } catch (error) {
            console.error('保存衣服失败:', error);
            return false;
        }
    }

    // 删除衣服
    async deleteCloth(clothId) {
        try {
            await this.performTransaction(this.STORES.CLOTHES, 'readwrite', store => store.delete(clothId));
            return true;
        } catch (error) {
            console.error('删除衣服失败:', error);
            return false;
        }
    }

    // 根据ID获取衣服
    async getClothById(clothId) {
        try {
            return await this.performTransaction(this.STORES.CLOTHES, 'readonly', store => store.get(clothId));
        } catch (error) {
            return null;
        }
    }

    // 根据分类获取衣服
    async getClothesByCategory(category) {
        const clothes = await this.getClothes();
        if (category === 'all') return clothes;
        return clothes.filter(cloth => cloth.category === category);
    }

    // --- 穿搭相关方法 ---

    // 获取所有穿搭
    async getOutfits() {
        try {
            return await this.performTransaction(this.STORES.OUTFITS, 'readonly', store => store.getAll());
        } catch (error) {
            console.error('获取穿搭失败:', error);
            return [];
        }
    }

    // 添加/更新穿搭
    async addOutfit(outfit) {
        try {
            await this.performTransaction(this.STORES.OUTFITS, 'readwrite', store => store.put(outfit));
            return true;
        } catch (error) {
            console.error('保存穿搭失败:', error);
            return false;
        }
    }

    // 删除穿搭
    async deleteOutfit(outfitId) {
        try {
            await this.performTransaction(this.STORES.OUTFITS, 'readwrite', store => store.delete(outfitId));
            return true;
        } catch (error) {
            console.error('删除穿搭失败:', error);
            return false;
        }
    }

    // 根据ID获取穿搭
    async getOutfitById(outfitId) {
        try {
            return await this.performTransaction(this.STORES.OUTFITS, 'readonly', store => store.get(outfitId));
        } catch (error) {
            return null;
        }
    }

    // 清除所有数据 (危险操作)
    async clearAll() {
        try {
            await this.performTransaction(this.STORES.CLOTHES, 'readwrite', store => store.clear());
            await this.performTransaction(this.STORES.OUTFITS, 'readwrite', store => store.clear());
            return true;
        } catch (error) {
            console.error('清空数据失败:', error);
            return false;
        }
    }
}

// 导出实例
const storage = new StorageManager();