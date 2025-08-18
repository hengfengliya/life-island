// 人生小站 - 配置文件
// 智能API选择：国内外用户使用不同的API地址

window.LifeStationConfig = {
    // API地址列表（按优先级排序）
    API_ENDPOINTS: [
        {
            name: 'Cloudflare Workers（海外）',
            url: 'https://life-station-api.life-island.workers.dev/api',
            region: 'global',
            priority: 1
        },
        // TODO: 添加国内镜像API
        // {
        //     name: '腾讯云函数（国内）',
        //     url: 'https://your-tencent-function.ap-beijing.scf.tencentcs.com/api',
        //     region: 'china',
        //     priority: 2
        // }
    ],
    
    // 当前选择的API（动态设置）
    API_BASE_URL: 'https://life-station-api.life-island.workers.dev/api',
    
    // 启用云端存储
    USE_LOCAL_STORAGE: false,
    
    // 调试模式（可以看到连接状态）
    DEBUG_MODE: true,
    
    // 功能开关
    FEATURES: {
        REAL_TIME_SEARCH: true,
        POETRY_API: true,
        ANIMATIONS: true,
        SMART_API_SELECTION: true // 启用智能API选择
    }
};