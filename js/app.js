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
}

// 页面加载完成后初始化应用
document.addEventListener('DOMContentLoaded', () => {
    // 初始化应用
    const app = new App();
    
    // 确保所有模块都已加载
    console.log('穿搭助手应用已初始化');
});