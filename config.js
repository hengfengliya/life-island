// 人生小站 - 配置文件
// 已连接到 Cloudflare Workers API

window.LifeStationConfig = {
    // 你的专属 API 地址
    API_BASE_URL: 'https://life-station-api.life-island.workers.dev/api',
    
    // 启用云端存储
    USE_LOCAL_STORAGE: false,
    
    // 调试模式（可以看到连接状态）
    DEBUG_MODE: true,
    
    // 功能开关
    FEATURES: {
        REAL_TIME_SEARCH: true,
        POETRY_API: true,
        ANIMATIONS: true
    }
};