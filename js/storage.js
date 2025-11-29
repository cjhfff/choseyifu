// storage.js - Supabase 云端�?// 等待 Supabase SDK 加载
let supabase = null;

// 初始化函数（延迟初始化，确保 SDK 已加载）
function initSupabase() {
    if (!supabase && window.supabase) {
        try {
            supabase = window.supabase.createClient(
                'https://zffopygwvczaeixfxzzm.supabase.co',
                'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InpmZm9weWd3dmN6YWVpeGZ4enptIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjQzNjcxODIsImV4cCI6MjA3OTk0MzE4Mn0.x_qj6ebWq1oXmLTmsjUo57yPNgtHs-BB5fKceoO891s'
            );
            console.log('☁️ Supabase 客户端已连接');
        } catch (error) {
            console.error('�?Supabase 初始化失�?', error);
        }
    }
    return supabase;
}

class StorageManager {
    constructor() {
        this.bucketName = 'CLOTH-IMAGES';  // 使用大写，匹配 Supabase 中的 bucket 名称
        this.tableName = 'clothes';
        this.outfitsTableName = 'outfits';
        console.log('☁️ Supabase 云端存储已初始化');
    }
    
    // 确保 Supabase 已初始化
    ensureSupabase() {
        if (!supabase) {
            initSupabase();
        }
        if (!supabase) {
            throw new Error('Supabase SDK 未加载，请刷新页面重�?);
        }
        return supabase;
    }

    // 辅助：把 Base64 转成二进�?Blob (上传图片必须用这�?
    base64ToBlob(base64Data) {
        const arr = base64Data.split(',');
        const mime = arr[0].match(/:(.*?);/)[1];
        const bstr = atob(arr[1]);
        let n = bstr.length;
        const u8arr = new Uint8Array(n);
        while (n--) {
            u8arr[n] = bstr.charCodeAt(n);
        }
        return new Blob([u8arr], { type: mime });
    }

    // 1. 获取所有衣�?    async getClothes() {
        try {
            const client = this.ensureSupabase();
            const { data, error } = await client
                .from(this.tableName)
                .select('*')
                .order('created_at', { ascending: false });

            if (error) {
                console.error('获取衣服失败:', error);
                return [];
            }
            
            // 兼容旧代码，�?image_url 映射�?image 属�?            return data.map(item => ({
                ...item,
                image: item.image_url,
                // 保持旧字段名兼容�?                createdAt: item.created_at,
                updatedAt: item.updated_at
            }));
        } catch (error) {
            console.error('获取衣服失败:', error);
            return [];
        }
    }

    // 2. 添加新衣�?    async addCloth(cloth) {
        try {
            // A. 先把图片上传�?Storage
            const timestamp = Date.now();
            const fileName = `cloth_${timestamp}.jpg`;
            const blob = this.base64ToBlob(cloth.image);

            const { data: uploadData, error: uploadError } = await this.ensureSupabase()
                .storage
                .from(this.bucketName)
                .upload(fileName, blob);

            if (uploadError) throw uploadError;

            // B. 获取图片的公开访问链接
            const { data: { publicUrl } } = supabase
                .storage
                .from(this.bucketName)
                .getPublicUrl(fileName);

            // C. 把数据存�?Database 表格
            const { data, error: dbError } = await this.ensureSupabase()
                .from(this.tableName)
                .insert([{
                    id: cloth.id,
                    name: cloth.name,
                    category: cloth.category,
                    color: cloth.color || '',
                    season: cloth.season,
                    image_url: publicUrl,
                    created_at: cloth.createdAt || new Date().toISOString(),
                    updated_at: cloth.updatedAt || new Date().toISOString()
                }])
                .select();

            if (dbError) throw dbError;

            console.log('�?衣服已保存到云端');
            return true;

        } catch (error) {
            console.error('云端保存失败:', error);
            alert('保存失败: ' + error.message);
            return false;
        }
    }

    // 3. 删除衣服
    async deleteCloth(clothId) {
        try {
            // 先获取图片信息，以便删除存储中的图片
            const { data: clothData, error: fetchError } = await this.ensureSupabase()
                .from(this.tableName)
                .select('image_url')
                .eq('id', clothId)
                .single();

            if (!fetchError && clothData && clothData.image_url) {
                // �?URL 提取文件�?                const fileName = clothData.image_url.split('/').pop();
                // 删除图片
                await this.ensureSupabase().storage.from(this.bucketName).remove([fileName]);
            }

            // 删除数据库记�?            const { error } = await this.ensureSupabase()
                .from(this.tableName)
                .delete()
                .eq('id', clothId);

            if (error) throw error;
            
            console.log('�?衣服已从云端删除');
            return true;
        } catch (error) {
            console.error('删除失败:', error);
            return false;
        }
    }
    
    // 根据ID获取衣服
    async getClothById(clothId) {
        try {
            const { data, error } = await this.ensureSupabase()
                .from(this.tableName)
                .select('*')
                .eq('id', clothId)
                .single();

            if (error) throw error;
            
            return {
                ...data,
                image: data.image_url,
                createdAt: data.created_at,
                updatedAt: data.updated_at
            };
        } catch (error) {
            console.error('获取衣服失败:', error);
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

    // 获取所有穿�?    async getOutfits() {
        try {
            const { data, error } = await this.ensureSupabase()
                .from(this.outfitsTableName)
                .select('*')
                .order('created_at', { ascending: false });

            if (error) {
                console.error('获取穿搭失败:', error);
                return [];
            }
            
            return data.map(item => ({
                ...item,
                createdAt: item.created_at,
                updatedAt: item.updated_at
            }));
        } catch (error) {
            console.error('获取穿搭失败:', error);
            return [];
        }
    }

    // 添加/更新穿搭
    async addOutfit(outfit) {
        try {
            const { error } = await this.ensureSupabase()
                .from(this.outfitsTableName)
                .upsert([{
                    id: outfit.id,
                    name: outfit.name || '今日搭配',
                    clothes: outfit.clothes,
                    created_at: outfit.createdAt || new Date().toISOString(),
                    updated_at: new Date().toISOString()
                }]);

            if (error) throw error;
            
            console.log('�?穿搭已保存到云端');
            return true;
        } catch (error) {
            console.error('保存穿搭失败:', error);
            return false;
        }
    }

    // 删除穿搭
    async deleteOutfit(outfitId) {
        try {
            const { error } = await this.ensureSupabase()
                .from(this.outfitsTableName)
                .delete()
                .eq('id', outfitId);

            if (error) throw error;
            
            console.log('�?穿搭已从云端删除');
            return true;
        } catch (error) {
            console.error('删除穿搭失败:', error);
            return false;
        }
    }

    // 根据ID获取穿搭
    async getOutfitById(outfitId) {
        try {
            const { data, error } = await this.ensureSupabase()
                .from(this.outfitsTableName)
                .select('*')
                .eq('id', outfitId)
                .single();

            if (error) throw error;
            
            return {
                ...data,
                createdAt: data.created_at,
                updatedAt: data.updated_at
            };
        } catch (error) {
            console.error('获取穿搭失败:', error);
            return null;
        }
    }

    // 获取存储信息（云端版本）
    async getStorageInfo() {
        try {
            const clothes = await this.getClothes();
            const outfits = await this.getOutfits();
            
            // 估算使用量（基于记录数）
            const estimatedMB = (clothes.length * 0.5).toFixed(2); // 假设每张图片�?00KB
            
            return {
                clothesCount: clothes.length,
                outfitsCount: outfits.length,
                usedMB: estimatedMB,
                limitMB: '无限�?,
                percentage: 0,
                isCloud: true
            };
        } catch (error) {
            console.error('获取存储信息失败:', error);
            return {
                clothesCount: 0,
                outfitsCount: 0,
                usedMB: '0',
                limitMB: '无限�?,
                percentage: 0,
                isCloud: true
            };
        }
    }

    // 清除所有数�?(危险操作)
    async clearAll() {
        try {
            // 删除所有衣服（包括图片�?            const clothes = await this.getClothes();
            for (const cloth of clothes) {
                await this.deleteCloth(cloth.id);
            }
            
            // 删除所有穿�?            await this.ensureSupabase().from(this.outfitsTableName).delete().neq('id', '');
            
            console.log('�?所有数据已清空');
            return true;
        } catch (error) {
            console.error('清空数据失败:', error);
            return false;
        }
    }
}

// 导出实例
const storage = new StorageManager();

