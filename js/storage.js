// storage.js - Supabase Cloud Version
let supabase = null;

function initSupabase() {
    if (!supabase && window.supabase) {
        try {
            supabase = window.supabase.createClient(
                'https://zffopygwvczaeixfxzzm.supabase.co',
                'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InpmZm9weWd3dmN6YWVpeGZ4enptIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjQzNjcxODIsImV4cCI6MjA3OTk0MzE4Mn0.x_qj6ebWq1oXmLTmsjUo57yPNgtHs-BB5fKceoO891s'
            );
            console.log('Supabase connected');
        } catch (error) {
            console.error('Supabase init failed:', error);
        }
    }
    return supabase;
}

class StorageManager {
    constructor() {
        this.bucketName = 'cloth-images';
        this.tableName = 'clothes';
        this.outfitsTableName = 'outfits';
        console.log('Supabase Storage initialized');
    }
    
    ensureSupabase() {
        if (!supabase) initSupabase();
        if (!supabase) throw new Error('Supabase SDK not loaded');
        return supabase;
    }

    base64ToBlob(base64Data) {
        const arr = base64Data.split(',');
        const mime = arr[0].match(/:(.*?);/)[1];
        const bstr = atob(arr[1]);
        let n = bstr.length;
        const u8arr = new Uint8Array(n);
        while (n--) { u8arr[n] = bstr.charCodeAt(n); }
        return new Blob([u8arr], { type: mime });
    }

    async getClothes() {
        try {
            const client = this.ensureSupabase();
            const { data, error } = await client.from(this.tableName).select('*').order('created_at', { ascending: false });
            if (error) { console.error('Get clothes failed:', error); return []; }
            return data.map(item => ({ ...item, image: item.image_url, createdAt: item.created_at, updatedAt: item.updated_at }));
        } catch (error) {
            console.error('Get clothes failed:', error);
            return [];
        }
    }

    async addCloth(cloth) {
        try {
            const client = this.ensureSupabase();
            const timestamp = Date.now();
            const fileName = `cloth_${timestamp}.jpg`;
            const blob = this.base64ToBlob(cloth.image);
            const { error: uploadError } = await client.storage.from(this.bucketName).upload(fileName, blob);
            if (uploadError) throw uploadError;
            const { data: { publicUrl } } = client.storage.from(this.bucketName).getPublicUrl(fileName);
            const { error: dbError } = await client.from(this.tableName).insert([{
                id: cloth.id, name: cloth.name, category: cloth.category, color: cloth.color || '',
                season: cloth.season, image_url: publicUrl,
                created_at: cloth.createdAt || new Date().toISOString(),
                updated_at: cloth.updatedAt || new Date().toISOString()
            }]).select();
            if (dbError) throw dbError;
            console.log('Cloth saved to cloud');
            return true;
        } catch (error) {
            console.error('Save failed:', error);
            alert('Save failed: ' + error.message);
            return false;
        }
    }

    async deleteCloth(clothId) {
        try {
            const client = this.ensureSupabase();
            const { data: clothData } = await client.from(this.tableName).select('image_url').eq('id', clothId).single();
            if (clothData && clothData.image_url) {
                const fileName = clothData.image_url.split('/').pop();
                await client.storage.from(this.bucketName).remove([fileName]);
            }
            const { error } = await client.from(this.tableName).delete().eq('id', clothId);
            if (error) throw error;
            return true;
        } catch (error) {
            console.error('Delete failed:', error);
            return false;
        }
    }
    
    async getClothById(clothId) {
        try {
            const client = this.ensureSupabase();
            const { data, error } = await client.from(this.tableName).select('*').eq('id', clothId).single();
            if (error) throw error;
            return { ...data, image: data.image_url, createdAt: data.created_at, updatedAt: data.updated_at };
        } catch (error) {
            return null;
        }
    }

    async getClothesByCategory(category) {
        const clothes = await this.getClothes();
        return category === 'all' ? clothes : clothes.filter(cloth => cloth.category === category);
    }

    async getOutfits() {
        try {
            const client = this.ensureSupabase();
            const { data, error } = await client.from(this.outfitsTableName).select('*').order('created_at', { ascending: false });
            if (error) { console.error('Get outfits failed:', error); return []; }
            return data.map(item => ({ ...item, createdAt: item.created_at, updatedAt: item.updated_at }));
        } catch (error) {
            return [];
        }
    }

    async addOutfit(outfit) {
        try {
            const client = this.ensureSupabase();
            const { error } = await client.from(this.outfitsTableName).upsert([{
                id: outfit.id, name: outfit.name || 'Daily Outfit', clothes: outfit.clothes,
                created_at: outfit.createdAt || new Date().toISOString(),
                updated_at: new Date().toISOString()
            }]);
            if (error) throw error;
            return true;
        } catch (error) {
            return false;
        }
    }

    async deleteOutfit(outfitId) {
        try {
            const client = this.ensureSupabase();
            const { error } = await client.from(this.outfitsTableName).delete().eq('id', outfitId);
            if (error) throw error;
            return true;
        } catch (error) {
            return false;
        }
    }

    async getOutfitById(outfitId) {
        try {
            const client = this.ensureSupabase();
            const { data, error } = await client.from(this.outfitsTableName).select('*').eq('id', outfitId).single();
            if (error) throw error;
            return { ...data, createdAt: data.created_at, updatedAt: data.updated_at };
        } catch (error) {
            return null;
        }
    }

    async getStorageInfo() {
        try {
            const clothes = await this.getClothes();
            const outfits = await this.getOutfits();
            return {
                clothesCount: clothes.length, outfitsCount: outfits.length,
                usedMB: (clothes.length * 0.5).toFixed(2), limitMB: 'Unlimited',
                percentage: 0, isCloud: true
            };
        } catch (error) {
            return { clothesCount: 0, outfitsCount: 0, usedMB: '0', limitMB: 'Unlimited', percentage: 0, isCloud: true };
        }
    }

    async clearAll() {
        try {
            const clothes = await this.getClothes();
            for (const cloth of clothes) { await this.deleteCloth(cloth.id); }
            const client = this.ensureSupabase();
            await client.from(this.outfitsTableName).delete().neq('id', '');
            return true;
        } catch (error) {
            return false;
        }
    }
}

const storage = new StorageManager();
