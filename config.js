// 人生小站 - 配置文件
// 智能API选择：尝试不同的Cloudflare节点

window.LifeStationConfig = {
    // API地址列表（按优先级排序）
    API_ENDPOINTS: [
        {
            name: '免费代理1（AllOrigins）',
            url: 'https://api.allorigins.win/raw?url=https%3A//life-station-api.life-island.workers.dev/api',
            region: 'free-proxy',
            priority: 1
        },
        {
            name: '免费代理2（CORS Anywhere）',
            url: 'https://cors-anywhere.herokuapp.com/https://life-station-api.life-island.workers.dev/api',
            region: 'free-proxy',
            priority: 2
        },
        {
            name: '免费代理3（ThingProxy）',
            url: 'https://thingproxy.freeboard.io/fetch/https://life-station-api.life-island.workers.dev/api',
            region: 'free-proxy',
            priority: 3
        },
        {
            name: '免费代理4（Proxy6）',
            url: 'https://proxy6.workers.dev/?url=https://life-station-api.life-island.workers.dev/api',
            region: 'free-proxy',
            priority: 4
        },
        {
            name: '免费代理5（Workers Proxy）',
            url: 'https://workers-proxy.chunfeng0906.workers.dev/https://life-station-api.life-island.workers.dev/api',
            region: 'free-proxy',
            priority: 5
        },
        {
            name: '国内CDN1（jsDelivr CN）',
            url: 'https://cdn.jsdelivr.net/gh/chunfeng0906/cors-proxy@main/proxy.js?url=https://life-station-api.life-island.workers.dev/api',
            region: 'china-cdn',
            priority: 6
        },
        {
            name: '本地代理服务器',
            url: 'http://localhost:3000',
            region: 'local-proxy',
            priority: 7
        },
        {
            name: 'Cloudflare Workers（主节点）',
            url: 'https://life-station-api.life-island.workers.dev/api',
            region: 'primary',
            priority: 8
        },
        {
            name: 'CORS代理1（国内可用）',
            url: 'https://cors-anywhere.herokuapp.com/https://life-station-api.life-island.workers.dev/api',
            region: 'proxy',
            priority: 3
        },
        {
            name: 'CORS代理2（国内可用）',
            url: 'https://api.allorigins.win/raw?url=https://life-station-api.life-island.workers.dev/api',
            region: 'proxy',
            priority: 4
        },
        {
            name: 'CORS代理3（国内可用）',
            url: 'https://corsproxy.io/?https://life-station-api.life-island.workers.dev/api',
            region: 'proxy',
            priority: 5
        },
        {
            name: 'Cloudflare Workers（简化域名）',
            url: 'https://life-island.workers.dev/api',
            region: 'simplified',
            priority: 5
        },
        {
            name: 'Cloudflare Workers（IP直连1）',
            url: 'https://162.159.192.1/api',
            region: 'ip-direct',
            priority: 6,
            headers: {
                'Host': 'life-station-api.life-island.workers.dev'
            }
        },
        {
            name: 'Cloudflare Workers（IP直连2）',
            url: 'https://162.159.193.1/api', 
            region: 'ip-direct',
            priority: 7,
            headers: {
                'Host': 'life-station-api.life-island.workers.dev'
            }
        },
        {
            name: 'Cloudflare Workers（IP直连3）',
            url: 'https://162.159.195.1/api',
            region: 'ip-direct', 
            priority: 8,
            headers: {
                'Host': 'life-station-api.life-island.workers.dev'
            }
        },
        {
            name: 'Cloudflare Workers（IP直连4）',
            url: 'https://104.16.132.229/api',
            region: 'ip-direct', 
            priority: 9,
            headers: {
                'Host': 'life-station-api.life-island.workers.dev'
            }
        },
        {
            name: 'Cloudflare Workers（IP直连5）',
            url: 'https://104.16.133.229/api',
            region: 'ip-direct', 
            priority: 10,
            headers: {
                'Host': 'life-station-api.life-island.workers.dev'
            }
        }
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