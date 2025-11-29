// 应用主逻辑
class App {
    constructor() {
        this.navItems = document.querySelectorAll('.nav-item');
        this.pages = document.querySelectorAll('.page');
        
        this.initEventListeners();
    }

    // 初始化事件监听器
    initEventListeners() {
        // 底部导航切换
        this.navItems.forEach(item => {
            item.addEventListener('click', (e) => {
                const pageId = e.target.closest('.nav-item').dataset.page;
                this.switchPage(pageId);
            });
        });
    }

    // 切换页面
    switchPage(pageId) {
        // 更新导航状态
        this.navItems.forEach(item => {
            item.classList.remove('active');
            if (item.dataset.page === pageId) {
                item.classList.add('active');
            }
        });
        
        // 更新页面显示
        this.pages.forEach(page => {
            page.classList.remove('active');
            if (page.id === pageId) {
                page.classList.add('active');
            }
        });
    }
    
    // 显示存储空间信息
    async displayStorageInfo() {
        try {
            const info = await storage.getStorageInfo();
            const usedMB = info.usedMB;
            const limitMB = info.limitMB;
            const percentage = info.percentage;
            
            console.log(`📊 存储空间使用情况：${usedMB}MB / ${limitMB} (${percentage}%)`);
            console.log(`☁️ 云端存储：${info.clothesCount} 件衣服，${info.outfitsCount} 套穿搭`);
            
            // 如果使用超过50%，在控制台提示
            if (percentage > 50) {
                console.warn(`⚠️ 存储空间已使用 ${percentage}%，建议定期清理不常穿的衣服`);
            }
        } catch (e) {
            console.error('无法获取存储信息:', e);
        }
    }
}

// 页面加载完成后初始化应用
document.addEventListener('DOMContentLoaded', () => {
    // 初始化应用
    const app = new App();
    
    // 显示存储空间使用情况
    app.displayStorageInfo();
    
    // 确保所有模块都已加载
    console.log('穿搭助手应用已初始化');
});