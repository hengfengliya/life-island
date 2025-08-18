// 全局变量
let bottles = [];
let searchResults = [];
let isSearchMode = false;

// 智能API选择
let SELECTED_API_URL = null;
let SELECTED_API_HEADERS = {};

// 获取当前API Headers
function getCurrentApiHeaders() {
    return SELECTED_API_HEADERS || {};
}

// 测试API连通性并选择最佳
async function selectBestAPI() {
    const config = window.LifeStationConfig;
    if (!config.FEATURES?.SMART_API_SELECTION || !config.API_ENDPOINTS) {
        debugLog('💡 未启用智能API选择或无备用API');
        return config.API_BASE_URL;
    }
    
    debugLog('🎯 开始智能API选择...');
    const endpoints = config.API_ENDPOINTS.sort((a, b) => a.priority - b.priority);
    
    for (const endpoint of endpoints) {
        try {
            debugLog(`🧪 测试API: ${endpoint.name} - ${endpoint.url}`);
            
            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), 5000); // 5秒快速测试
            
            // 构建请求选项，包含自定义headers
            const fetchOptions = {
                method: 'GET',
                signal: controller.signal,
                headers: {
                    'Content-Type': 'application/json',
                    ...(endpoint.headers || {}) // 添加自定义headers（用于IP直连时的Host头）
                }
            };
            
            const startTime = Date.now();
            const response = await fetch(`${endpoint.url}/health`, fetchOptions);
            const responseTime = Date.now() - startTime;
            clearTimeout(timeoutId);
            
            if (response.ok) {
                debugLog(`✅ API选择成功: ${endpoint.name} (${responseTime}ms)`);
                SELECTED_API_URL = endpoint.url;
                SELECTED_API_HEADERS = endpoint.headers || {}; // 保存headers用于后续请求
                return endpoint.url;
            } else {
                debugLog(`❌ API测试失败: ${endpoint.name} - HTTP ${response.status}`);
            }
            
        } catch (error) {
            debugLog(`❌ API连接失败: ${endpoint.name} - ${error.message}`);
        }
    }
    
    // 如果所有API都失败，使用默认API
    debugLog('⚠️ 所有API测试失败，使用默认API');
    SELECTED_API_URL = config.API_BASE_URL;
    SELECTED_API_HEADERS = {};
    return config.API_BASE_URL;
}

// 获取当前API URL
function getCurrentApiUrl() {
    return SELECTED_API_URL || window.LifeStationConfig?.API_BASE_URL || 'http://localhost:8787/api';
}
const USE_LOCAL_STORAGE = window.LifeStationConfig?.USE_LOCAL_STORAGE ?? true;
const DEBUG_MODE = window.LifeStationConfig?.DEBUG_MODE ?? true;

// 检测网络环境并给出建议
function detectNetworkEnvironment() {
    const isChina = /^zh-CN|^zh/i.test(navigator.language);
    const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone;
    const isChinaTimezone = timezone && (timezone.includes('Shanghai') || timezone.includes('Beijing'));
    
    return {
        isChina: isChina || isChinaTimezone,
        language: navigator.language,
        timezone: timezone
    };
}

// 显示网络环境提示
function showNetworkEnvironmentTips() {
    const env = detectNetworkEnvironment();
    debugLog('🌍 网络环境检测:', JSON.stringify(env, null, 2));
    
    if (env.isChina) {
        debugLog('🇨🇳 检测到中国大陆网络环境');
        debugLog('💡 提示: Cloudflare Workers在中国大陆可能需要科学上网工具');
        debugLog('📱 如果手机端无法加载数据，请确保开启VPN或代理');
        
        // 显示用户友好的提示
        showMobileAlert('检测到中国大陆网络环境\n如数据加载失败，请尝试开启VPN或代理工具');
    }
}

// 网络连通性测试
async function testNetworkConnectivity() {
    debugLog('🔍 开始网络连通性测试...');
    
    const tests = [
        {
            name: '基础连通性',
            url: 'https://httpbin.org/get',
            timeout: 5000
        },
        {
            name: 'Cloudflare Workers连通性',
            url: 'https://workers.cloudflare.com/',
            timeout: 8000
        },
        {
            name: '目标域名连通性',
            url: 'https://life-island.workers.dev/',
            timeout: 10000
        },
        {
            name: 'API健康检查',
            url: `${API_BASE_URL}/health`,
            timeout: 15000
        }
    ];
    
    for (const test of tests) {
        try {
            debugLog(`🧪 测试${test.name}: ${test.url}`);
            
            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), test.timeout);
            
            const startTime = Date.now();
            const response = await fetch(test.url, {
                method: 'GET',
                mode: 'cors',
                signal: controller.signal
            });
            const endTime = Date.now();
            clearTimeout(timeoutId);
            
            debugLog(`✅ ${test.name}成功 - 状态:${response.status} 耗时:${endTime-startTime}ms`);
            
        } catch (error) {
            debugLog(`❌ ${test.name}失败 - 错误:${error.message} 类型:${error.name}`);
            
            // 详细分析错误类型
            if (error.name === 'AbortError') {
                debugLog(`⏰ ${test.name} - 请求超时`);
            } else if (error.message.includes('Failed to fetch') || error.message.includes('Load failed')) {
                debugLog(`🚫 ${test.name} - 网络连接被阻断或DNS解析失败`);
            } else if (error.message.includes('CORS')) {
                debugLog(`🔒 ${test.name} - 跨域请求被阻止`);
            } else if (error.message.includes('SSL') || error.message.includes('certificate')) {
                debugLog(`🔐 ${test.name} - SSL证书问题`);
            } else {
                debugLog(`❓ ${test.name} - 未知网络错误: ${error.message}`);
            }
        }
        
        // 测试间隔，避免请求过于频繁
        await new Promise(resolve => setTimeout(resolve, 1000));
    }
    
    debugLog('🏁 网络连通性测试完成');
}

// 网络诊断工具
async function runNetworkDiagnostics() {
    debugLog('🔧 开始网络诊断...');
    
    // 先运行连通性测试
    await testNetworkConnectivity();
    
    const results = {
        config: {},
        network: {},
        api: {},
        browser: {}
    };
    
    // 1. 配置信息
    results.config = {
        API_BASE_URL,
        USE_LOCAL_STORAGE,
        DEBUG_MODE,
        userAgent: navigator.userAgent
    };
    debugLog('📋 配置信息:', JSON.stringify(results.config, null, 2));
    
    // 2. 网络状态
    results.network = {
        online: navigator.onLine,
        connection: navigator.connection ? {
            effectiveType: navigator.connection.effectiveType,
            downlink: navigator.connection.downlink,
            rtt: navigator.connection.rtt
        } : 'Not available'
    };
    debugLog('🌐 网络状态:', JSON.stringify(results.network, null, 2));
    
    // 3. 浏览器能力检查
    results.browser = {
        fetch: typeof fetch !== 'undefined',
        AbortController: typeof AbortController !== 'undefined',
        AbortSignal: typeof AbortSignal !== 'undefined',
        localStorage: typeof localStorage !== 'undefined',
        JSON: typeof JSON !== 'undefined'
    };
    debugLog('🔍 浏览器能力:', JSON.stringify(results.browser, null, 2));
    
    // 4. API连通性测试
    if (!USE_LOCAL_STORAGE) {
        debugLog('🧪 测试API连通性...');
        
        // 测试基础连通性
        try {
            const startTime = Date.now();
            const response = await fetch(`${API_BASE_URL}/health`, {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json',
                },
                signal: AbortSignal.timeout ? AbortSignal.timeout(10000) : undefined
            });
            const endTime = Date.now();
            
            results.api.health = {
                success: response.ok,
                status: response.status,
                statusText: response.statusText,
                responseTime: endTime - startTime,
                headers: Object.fromEntries(response.headers.entries())
            };
            
            if (response.ok) {
                const data = await response.json();
                results.api.health.data = data;
                debugLog('✅ Health API测试成功:', JSON.stringify(results.api.health, null, 2));
            } else {
                debugLog('❌ Health API测试失败:', JSON.stringify(results.api.health, null, 2));
            }
        } catch (error) {
            results.api.health = {
                success: false,
                error: error.message,
                errorType: error.name
            };
            debugLog('❌ Health API测试异常:', JSON.stringify(results.api.health, null, 2));
        }
        
        // 测试bottles接口
        try {
            debugLog('🧪 测试Bottles API...');
            const startTime = Date.now();
            const response = await fetch(`${API_BASE_URL}/bottles?limit=1`, {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json',
                },
                signal: AbortSignal.timeout ? AbortSignal.timeout(15000) : undefined
            });
            const endTime = Date.now();
            
            results.api.bottles = {
                success: response.ok,
                status: response.status,
                statusText: response.statusText,
                responseTime: endTime - startTime,
                headers: Object.fromEntries(response.headers.entries())
            };
            
            if (response.ok) {
                const data = await response.json();
                results.api.bottles.data = data;
                results.api.bottles.bottleCount = data.bottles ? data.bottles.length : 0;
                debugLog('✅ Bottles API测试成功:', JSON.stringify(results.api.bottles, null, 2));
            } else {
                debugLog('❌ Bottles API测试失败:', JSON.stringify(results.api.bottles, null, 2));
            }
        } catch (error) {
            results.api.bottles = {
                success: false,
                error: error.message,
                errorType: error.name
            };
            debugLog('❌ Bottles API测试异常:', JSON.stringify(results.api.bottles, null, 2));
        }
    } else {
        debugLog('📦 使用本地存储模式，跳过API测试');
    }
    
    debugLog('🎯 诊断完成，结果:', JSON.stringify(results, null, 2));
    return results;
}

// 检测设备类型和网络环境
function detectEnvironment() {
    const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
    const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent);
    const isAndroid = /Android/.test(navigator.userAgent);
    const isWeChat = /MicroMessenger/i.test(navigator.userAgent);
    const isInApp = window.navigator.standalone || window.matchMedia('(display-mode: standalone)').matches;
    
    return {
        isMobile,
        isIOS,
        isAndroid,
        isWeChat,
        isInApp,
        userAgent: navigator.userAgent
    };
}

// 移动端优化的fetch函数
async function mobileFetch(url, options = {}) {
    const env = detectEnvironment();
    debugLog('📱 设备环境:', JSON.stringify(env, null, 2));
    
    // 移动端专用选项
    const mobileOptions = {
        ...options,
        // 添加移动端友好的headers
        headers: {
            'Content-Type': 'application/json',
            'Accept': 'application/json',
            'Cache-Control': 'no-cache',
            'Pragma': 'no-cache',
            ...options.headers
        },
        // 移动端更宽松的设置
        mode: 'cors',
        credentials: 'omit', // 移动端避免凭据问题
        redirect: 'follow'
    };
    
    // iOS Safari特殊处理
    if (env.isIOS) {
        debugLog('🍎 检测到iOS设备，应用iOS特定优化');
        // iOS Safari对fetch有特殊限制，使用更兼容的方式
        mobileOptions.cache = 'no-store';
    }
    
    // Android Chrome特殊处理
    if (env.isAndroid) {
        debugLog('🤖 检测到Android设备，应用Android特定优化');
        // Android可能有更严格的CORS政策
        mobileOptions.referrerPolicy = 'no-referrer';
    }
    
    // 微信内置浏览器特殊处理
    if (env.isWeChat) {
        debugLog('💬 检测到微信浏览器，应用微信特定优化');
        // 微信浏览器可能有特殊的网络限制
        mobileOptions.headers['User-Agent'] = navigator.userAgent;
    }
    
    debugLog('🌐 使用移动端优化请求:', url, JSON.stringify(mobileOptions, null, 2));
    
    try {
        // 移动端使用更长的超时时间
        const controller = new AbortController();
        const timeout = env.isMobile ? 45000 : 30000; // 移动端45秒超时
        const timeoutId = setTimeout(() => controller.abort(), timeout);
        
        mobileOptions.signal = controller.signal;
        
        const response = await fetch(url, mobileOptions);
        clearTimeout(timeoutId);
        
        debugLog('✅ 移动端请求成功:', response.status, response.statusText);
        return response;
        
    } catch (error) {
        debugLog('❌ 移动端请求失败:', error.message, error.name);
        
        // 移动端特殊错误处理
        if (error.name === 'AbortError') {
            throw new Error('移动网络超时，请检查网络连接或稍后重试');
        } else if (error.message.includes('CORS')) {
            throw new Error('移动端跨域请求被阻止，可能是网络环境限制');
        } else if (error.message.includes('network')) {
            throw new Error('移动网络连接失败，请检查网络设置');
        } else {
            throw error;
        }
    }
}

// 调试日志函数
function debugLog(...args) {
    if (DEBUG_MODE) {
        console.log('🌊 Life Station:', ...args);
        
        // 在页面上也显示调试信息（手机端方便查看）
        showDebugInfo(args.join(' '));
    }
}

// 显示调试信息
function showDebugInfo(message) {
    if (!DEBUG_MODE) return;
    
    let debugPanel = document.getElementById('debug-panel');
    if (!debugPanel) {
        debugPanel = document.createElement('div');
        debugPanel.id = 'debug-panel';
        debugPanel.style.cssText = `
            position: fixed;
            bottom: 10px;
            left: 10px;
            right: 10px;
            max-height: 120px;
            overflow-y: auto;
            background: rgba(0, 0, 0, 0.8);
            color: #fff;
            font-size: 11px;
            padding: 8px;
            border-radius: 4px;
            z-index: 9999;
            font-family: monospace;
            line-height: 1.2;
        `;
        document.body.appendChild(debugPanel);
    }
    
    const time = new Date().toLocaleTimeString();
    const logEntry = document.createElement('div');
    logEntry.textContent = `[${time}] ${message}`;
    logEntry.style.marginBottom = '2px';
    
    debugPanel.appendChild(logEntry);
    
    // 保持最新的10条日志
    while (debugPanel.children.length > 10) {
        debugPanel.removeChild(debugPanel.firstChild);
    }
    
    // 自动滚动到底部
    debugPanel.scrollTop = debugPanel.scrollHeight;
}

// 爱情主题诗句库
const lovePoems = [
    { text: "愿得一心人，白头不相离", author: "卓文君" },
    { text: "山无陵，江水为竭，冬雷震震，夏雨雪，天地合，乃敢与君绝", author: "汉乐府" },
    { text: "曾经沧海难为水，除却巫山不是云", author: "元稹" },
    { text: "君若扬路尘，妾若浊水泥，浮沉各异势，会合何时谐", author: "曹植" },
    { text: "身无彩凤双飞翼，心有灵犀一点通", author: "李商隐" },
    { text: "在天愿作比翼鸟，在地愿为连理枝", author: "白居易" },
    { text: "两情若是久长时，又岂在朝朝暮暮", author: "秦观" },
    { text: "一日不见，如三秋兮", author: "诗经" },
    { text: "关关雎鸠，在河之洲，窈窕淑女，君子好逑", author: "诗经" },
    { text: "执子之手，与子偕老", author: "诗经" },
    { text: "思君如满月，夜夜减清辉", author: "张九龄" },
    { text: "相见时难别亦难，东风无力百花残", author: "李商隐" },
    { text: "此情可待成追忆，只是当时已惘然", author: "李商隐" },
    { text: "衣带渐宽终不悔，为伊消得人憔悴", author: "柳永" },
    { text: "问世间情为何物，直教人生死相许", author: "元好问" },
    { text: "众里寻他千百度，蓦然回首，那人却在，灯火阑珊处", author: "辛弃疾" },
    { text: "玲珑骰子安红豆，入骨相思知不知", author: "温庭筠" },
    { text: "春心莫共花争发，一寸相思一寸灰", author: "李商隐" },
    { text: "花开堪折直须折，莫待无花空折枝", author: "杜秋娘" },
    { text: "红豆生南国，春来发几枝，愿君多采撷，此物最相思", author: "王维" },
    { text: "落花人独立，微雨燕双飞", author: "晏几道" },
    { text: "月上柳梢头，人约黄昏后", author: "欧阳修" },
    { text: "天涯海角有穷时，只有相思无尽处", author: "晏殊" },
    { text: "多情自古伤离别，更那堪冷落清秋节", author: "柳永" },
    { text: "人生若只如初见，何事秋风悲画扇", author: "纳兰性德" }
];

// DOM 元素
const writeNewBtn = document.getElementById('writeNewBtn');
const writePanel = document.getElementById('writePanel');
const bottleModal = document.getElementById('bottleModal');
const bottlesContainer = document.getElementById('bottlesContainer');
const cancelWrite = document.getElementById('cancelWrite');
const sendBtn = document.getElementById('sendBtn');
const closeModal = document.getElementById('closeModal');
const messageInput = document.getElementById('messageInput');
const mainSearchInput = document.getElementById('mainSearchInput');

// 立即预热API（在页面加载的同时进行，不等待DOM）
if (!window.LifeStationConfig?.USE_LOCAL_STORAGE) {
    // 尽早开始预热，与页面加载并行进行
    warmupAPI();
}

// 初始化
document.addEventListener('DOMContentLoaded', async function() {
    // 显示配置信息
    debugLog('🚀 初始化开始');
    
    // 智能API选择
    const selectedApi = await selectBestAPI();
    debugLog(`📡 选择的API: ${selectedApi}`);
    
    debugLog(`本地存储模式: ${USE_LOCAL_STORAGE}`);
    debugLog(`调试模式: ${DEBUG_MODE}`);
    debugLog(`网络状态: ${navigator.onLine ? '在线' : '离线'}`);
    debugLog(`用户代理: ${navigator.userAgent}`);
    
    // 检测网络环境
    showNetworkEnvironmentTips();
    
    // 在调试模式下显示调试按钮
    if (DEBUG_MODE) {
        const debugButtons = document.getElementById('debugButtons');
        if (debugButtons) {
            debugButtons.style.display = 'block';
        }
    }
    
    // 运行网络诊断
    setTimeout(() => {
        runNetworkDiagnostics();
    }, 1000);
    
    initOceanAnimation();
    
    // 显示加载状态
    showLoadingBottles();
    
    await loadBottles(); // 等待数据加载完成
    bindEvents();
    displayBottles();
    initNetworkMonitoring(); // 初始化网络监控
    
    debugLog('✅ 初始化完成');
});

// 网络状态监控
function initNetworkMonitoring() {
    // 检查网络状态
    function updateNetworkStatus() {
        const isOnline = navigator.onLine;
        debugLog(`网络状态: ${isOnline ? '在线' : '离线'}`);
        
        if (!isOnline) {
            showMobileAlert('网络连接已断开，请检查网络');
        }
    }
    
    // 监听网络状态变化
    window.addEventListener('online', () => {
        debugLog('✅ 网络已恢复');
        showMobileAlert('网络已恢复连接');
    });
    
    window.addEventListener('offline', () => {
        debugLog('❌ 网络已断开');
        showMobileAlert('网络连接已断开');
    });
    
    // 初始检查
    updateNetworkStatus();
}

// API预热函数（防止冷启动）
async function warmupAPI() {
    try {
        debugLog('🔥 正在预热API服务器...');
        
        // 发送健康检查请求来预热服务器
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 8000); // 增加到8秒超时
        
        const response = await fetch(`${API_BASE_URL}/health`, {
            method: 'GET',
            signal: controller.signal
        });
        
        clearTimeout(timeoutId);
        
        if (response.ok) {
            const data = await response.json();
            debugLog('✅ API服务器预热成功:', data);
            
            // 预热成功后，再预热一次bottles接口（更关键的接口）
            setTimeout(() => {
                preloadBottlesAPI();
            }, 1000);
        } else {
            debugLog('⚠️ API服务器预热响应异常:', response.status);
        }
    } catch (error) {
        debugLog('⚠️ API服务器预热失败（这是正常的）:', error.message);
    }
}

// 预加载bottles接口（让Workers完全预热）
async function preloadBottlesAPI() {
    try {
        debugLog('🔥 预热bottles接口...');
        
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 5000);
        
        const response = await fetch(`${API_BASE_URL}/bottles?limit=1`, {
            method: 'GET',
            signal: controller.signal
        });
        
        clearTimeout(timeoutId);
        
        if (response.ok) {
            debugLog('✅ bottles接口预热成功');
        }
    } catch (error) {
        debugLog('⚠️ bottles接口预热失败（这是正常的）:', error.message);
    }
}

// 海洋动画初始化
function initOceanAnimation() {
    const canvas = document.getElementById('ocean-canvas');
    const ctx = canvas.getContext('2d');
    
    // 设置画布大小
    function resizeCanvas() {
        canvas.width = window.innerWidth;
        canvas.height = window.innerHeight;
    }
    
    resizeCanvas();
    window.addEventListener('resize', resizeCanvas);
    
    // 海浪参数
    let waveOffset = 0;
    const waves = [
        { amplitude: 30, frequency: 0.02, speed: 0.03, yOffset: window.innerHeight * 0.7, opacity: 0.4, color: '#FFB6C1' },
        { amplitude: 25, frequency: 0.025, speed: 0.025, yOffset: window.innerHeight * 0.75, opacity: 0.3, color: '#DDA0DD' },
        { amplitude: 20, frequency: 0.03, speed: 0.02, yOffset: window.innerHeight * 0.8, opacity: 0.25, color: '#B0E0E6' }
    ];
    
    // 气泡参数
    const bubbles = [];
    for (let i = 0; i < 15; i++) {
        bubbles.push({
            x: Math.random() * canvas.width,
            y: canvas.height + Math.random() * 200,
            radius: Math.random() * 8 + 3,
            speed: Math.random() * 2 + 1,
            opacity: Math.random() * 0.6 + 0.2
        });
    }
    
    // 绘制海浪
    function drawWaves() {
        waves.forEach(wave => {
            ctx.save();
            ctx.globalAlpha = wave.opacity;
            ctx.strokeStyle = wave.color;
            ctx.lineWidth = 3;
            ctx.beginPath();
            
            for (let x = 0; x <= canvas.width; x += 5) {
                const y = wave.yOffset + Math.sin((x * wave.frequency) + (waveOffset * wave.speed)) * wave.amplitude;
                if (x === 0) {
                    ctx.moveTo(x, y);
                } else {
                    ctx.lineTo(x, y);
                }
            }
            ctx.stroke();
            ctx.restore();
        });
    }
    
    // 绘制气泡
    function drawBubbles() {
        bubbles.forEach(bubble => {
            ctx.save();
            ctx.globalAlpha = bubble.opacity;
            ctx.fillStyle = '#FFE4E1'; // 粉嫩的泡泡色
            ctx.beginPath();
            ctx.arc(bubble.x, bubble.y, bubble.radius, 0, Math.PI * 2);
            ctx.fill();
            
            // 添加高光
            ctx.fillStyle = '#FFFFFF';
            ctx.globalAlpha = bubble.opacity * 0.6;
            ctx.beginPath();
            ctx.arc(bubble.x - bubble.radius * 0.3, bubble.y - bubble.radius * 0.3, bubble.radius * 0.4, 0, Math.PI * 2);
            ctx.fill();
            ctx.restore();
            
            // 更新气泡位置
            bubble.y -= bubble.speed;
            bubble.x += Math.sin(bubble.y * 0.01) * 0.5;
            
            // 重置气泡
            if (bubble.y < -50) {
                bubble.y = canvas.height + 50;
                bubble.x = Math.random() * canvas.width;
            }
        });
    }
    
    // 动画循环
    function animate() {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        
        drawWaves();
        drawBubbles();
        
        waveOffset += 1;
        requestAnimationFrame(animate);
    }
    
    animate();
}

// 事件绑定
function bindEvents() {
    writeNewBtn.addEventListener('click', openWritePanel);
    cancelWrite.addEventListener('click', closeWritePanel);
    sendBtn.addEventListener('click', handleSendClick);
    closeModal.addEventListener('click', closeBottleModal);
    
    // 添加触屏事件支持
    sendBtn.addEventListener('touchend', handleSendClick);
    
    // 实时搜索
    mainSearchInput.addEventListener('input', performSearch);
    
    // ESC键关闭弹窗
    document.addEventListener('keydown', function(e) {
        if (e.key === 'Escape') {
            closeAllPanels();
        }
    });
    
    // 移动端优化：防止双击缩放
    document.addEventListener('touchstart', function(e) {
        if (e.touches.length > 1) {
            e.preventDefault();
        }
    }, { passive: false });
    
    let lastTouchEnd = 0;
    document.addEventListener('touchend', function(e) {
        const now = new Date().getTime();
        if (now - lastTouchEnd <= 300) {
            e.preventDefault();
        }
        lastTouchEnd = now;
    }, false);
}

// 处理发送按钮点击事件（防重复点击）
function handleSendClick(e) {
    e.preventDefault();
    if (!sendBtn.disabled) {
        sendMessage();
    }
}

// 打开写消息面板
function openWritePanel() {
    closeAllPanels();
    
    // 如果搜索框有文字，预填到消息输入框
    const searchText = mainSearchInput.value.trim();
    if (searchText) {
        messageInput.value = searchText;
        // 清空搜索框
        mainSearchInput.value = '';
        // 清除搜索模式
        isSearchMode = false;
        displayBottles();
    }
    
    writePanel.classList.add('active');
    messageInput.focus();
    // 将光标移到文本末尾
    messageInput.setSelectionRange(messageInput.value.length, messageInput.value.length);
}

// 关闭写消息面板
function closeWritePanel() {
    writePanel.classList.remove('active');
    messageInput.value = '';
}

// 关闭所有面板
function closeAllPanels() {
    writePanel.classList.remove('active');
    bottleModal.classList.remove('active');
}

// 关闭瓶子弹窗
function closeBottleModal() {
    bottleModal.classList.remove('active');
}

// 发送消息
async function sendMessage() {
    const message = messageInput.value.trim();
    if (!message) {
        showMobileAlert('请输入消息内容');
        return;
    }
    
    // 防止重复提交
    if (sendBtn.disabled) {
        return;
    }
    
    // 禁用发送按钮并显示进度
    sendBtn.disabled = true;
    updateSendButtonState('sending');
    
    const newBottle = {
        id: Date.now().toString(),
        message: message,
        date: new Date().toISOString(),
        timestamp: Date.now()
    };
    
    // 显示装瓶动画
    showBottleAnimation();
    
    try {
        let success = false;
        let result = null;
        
        if (USE_LOCAL_STORAGE) {
            // 本地存储（开发模式）
            bottles.unshift(newBottle);
            localStorage.setItem('lifeStationBottles', JSON.stringify(bottles));
            success = true;
        } else {
            // API 存储（生产模式）- 添加重试机制
            result = await sendWithRetry(message, 3);
            if (result && result.success) {
                // 添加新瓶子到本地数组（用于立即显示）
                bottles.unshift(result.bottle);
                debugLog('✨', result.message);
                success = true;
            }
        }
        
        if (success) {
            updateSendButtonState('success');
            // 关闭写消息面板
            setTimeout(() => {
                closeWritePanel();
                displayBottles();
                // 恢复发送按钮
                updateSendButtonState('default');
            }, 2000);
        } else {
            throw new Error('保存失败，请重试');
        }
        
    } catch (error) {
        console.error('保存消息失败:', error);
        showMobileAlert(`${error.message}`);
        
        // 恢复发送按钮
        updateSendButtonState('error');
        setTimeout(() => {
            updateSendButtonState('default');
        }, 2000);
    }
}

// 更新发送按钮状态
function updateSendButtonState(state) {
    switch (state) {
        case 'sending':
            sendBtn.disabled = true;
            sendBtn.textContent = '🌊 投递中...';
            sendBtn.style.background = 'linear-gradient(135deg, #74b9ff, #0984e3)';
            break;
        case 'warming':
            sendBtn.disabled = true;
            sendBtn.textContent = '🔥 启动服务器...';
            sendBtn.style.background = 'linear-gradient(135deg, #fdcb6e, #e17055)';
            break;
        case 'coldstart':
            sendBtn.disabled = true;
            sendBtn.textContent = '⏳ 服务器启动中...';
            sendBtn.style.background = 'linear-gradient(135deg, #a29bfe, #6c5ce7)';
            break;
        case 'success':
            sendBtn.disabled = true;
            sendBtn.textContent = '✅ 投递成功';
            sendBtn.style.background = 'linear-gradient(135deg, #00b894, #00cec9)';
            break;
        case 'error':
            sendBtn.disabled = true;
            sendBtn.textContent = '❌ 投递失败';
            sendBtn.style.background = 'linear-gradient(135deg, #e17055, #d63031)';
            break;
        case 'default':
        default:
            sendBtn.disabled = false;
            sendBtn.textContent = '🌊 交给大海';
            sendBtn.style.background = '';
            break;
    }
}

// 带重试机制的发送函数
async function sendWithRetry(message, maxRetries = 3, timeout = 30000) {
    for (let attempt = 1; attempt <= maxRetries; attempt++) {
        try {
            debugLog(`第 ${attempt} 次尝试发送消息...`);
            
            // 检查网络状态
            if (!navigator.onLine) {
                throw new Error('网络连接已断开，请检查网络后重试');
            }
            
            // 第一次尝试时给用户提示可能的冷启动延迟
            if (attempt === 1) {
                updateSendButtonState('warming');
            }
            
            // 使用标准fetch，与web端保持一致
            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), timeout);
            
            const apiUrl = getCurrentApiUrl();
            const apiHeaders = getCurrentApiHeaders();
            const response = await fetch(`${apiUrl}/bottles`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    ...apiHeaders
                },
                body: JSON.stringify({
                    message: message
                }),
                signal: controller.signal
            });
            
            clearTimeout(timeoutId);
            
            if (!response.ok) {
                if (response.status === 429) {
                    throw new Error('发送太频繁，请稍后再试');
                } else if (response.status >= 500) {
                    throw new Error('服务器暂时不可用，请稍后重试');
                } else if (response.status === 413) {
                    throw new Error('消息内容过长，请缩短后重试');
                } else {
                    throw new Error(`网络错误 (${response.status})`);
                }
            }
            
            const result = await response.json();
            
            if (result.success) {
                debugLog(`✅ 第 ${attempt} 次尝试成功`);
                return result;
            } else {
                throw new Error(result.error || '服务器返回错误');
            }
            
        } catch (error) {
            debugLog(`❌ 第 ${attempt} 次尝试失败:`, error.message);
            
            if (error.name === 'AbortError') {
                if (attempt === 1) {
                    // 第一次超时可能是冷启动，给出友好提示
                    updateSendButtonState('coldstart');
                    throw new Error('服务器启动中，请稍等几秒后重试');
                } else {
                    throw new Error('网络超时，请检查网络连接');
                }
            }
            
            if (attempt === maxRetries) {
                // 根据错误类型提供不同的建议
                let suggestion = '';
                if (error.message.includes('网络') || error.message.includes('超时')) {
                    suggestion = '请检查网络连接，或等待几秒后重试';
                } else if (error.message.includes('服务器')) {
                    suggestion = '服务器可能正在启动，请稍后重试';
                } else {
                    suggestion = '请稍后重试';
                }
                
                throw new Error(`发送失败: ${error.message}，${suggestion}`);
            }
            
            // 等待一段时间后重试（递增等待时间）
            const waitTime = Math.min(2000 * Math.pow(2, attempt - 1), 10000);
            debugLog(`⏱️ 等待 ${waitTime/1000} 秒后重试...`);
            await new Promise(resolve => setTimeout(resolve, waitTime));
        }
    }
}

// 移动端友好的提示框
function showMobileAlert(message) {
    // 优先使用自定义提示框，fallback到原生alert
    if (typeof createMobileToast === 'function') {
        createMobileToast(message);
    } else {
        // 创建自定义toast
        const toast = document.createElement('div');
        toast.className = 'mobile-toast';
        toast.textContent = message;
        toast.style.cssText = `
            position: fixed;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%);
            background: rgba(0, 0, 0, 0.8);
            color: white;
            padding: 12px 24px;
            border-radius: 8px;
            font-size: 16px;
            z-index: 10000;
            max-width: 90vw;
            text-align: center;
            animation: fadeInOut 3s ease-in-out forwards;
        `;
        
        // 添加动画样式
        if (!document.getElementById('mobile-toast-styles')) {
            const style = document.createElement('style');
            style.id = 'mobile-toast-styles';
            style.textContent = `
                @keyframes fadeInOut {
                    0% { opacity: 0; transform: translate(-50%, -50%) scale(0.8); }
                    20% { opacity: 1; transform: translate(-50%, -50%) scale(1); }
                    80% { opacity: 1; transform: translate(-50%, -50%) scale(1); }
                    100% { opacity: 0; transform: translate(-50%, -50%) scale(0.8); }
                }
            `;
            document.head.appendChild(style);
        }
        
        document.body.appendChild(toast);
        setTimeout(() => toast.remove(), 3000);
    }
}

// 装瓶动画
function showBottleAnimation() {
    const animation = document.createElement('div');
    animation.className = 'bottle-drop-animation';
    animation.innerHTML = '💌';
    animation.style.cssText = `
        position: fixed;
        top: 50%;
        left: 50%;
        transform: translate(-50%, -50%);
        font-size: 4rem;
        z-index: 1000;
        animation: kawaii-dropBottle 2.5s ease-out forwards;
        pointer-events: none;
        filter: drop-shadow(0 0 20px rgba(255, 182, 193, 0.8));
    `;
    
    document.body.appendChild(animation);
    
    // 添加可爱的心形特效
    for (let i = 0; i < 8; i++) {
        setTimeout(() => {
            const heart = document.createElement('div');
            heart.innerHTML = ['💕', '💖', '💗', '💙', '💜'][Math.floor(Math.random() * 5)];
            heart.style.cssText = `
                position: fixed;
                top: 50%;
                left: 50%;
                transform: translate(-50%, -50%);
                font-size: 1.5rem;
                z-index: 999;
                animation: kawaii-heartFloat 2s ease-out forwards;
                pointer-events: none;
                animation-delay: ${i * 0.1}s;
            `;
            document.body.appendChild(heart);
            
            setTimeout(() => heart.remove(), 2200);
        }, i * 150);
    }
    
    // 添加动画样式
    if (!document.getElementById('kawaii-bottleAnimationStyles')) {
        const style = document.createElement('style');
        style.id = 'kawaii-bottleAnimationStyles';
        style.textContent = `
            @keyframes kawaii-dropBottle {
                0% {
                    transform: translate(-50%, -50%) scale(1) rotate(0deg);
                    opacity: 1;
                    filter: drop-shadow(0 0 20px rgba(255, 182, 193, 0.8));
                }
                30% {
                    transform: translate(-50%, -30%) scale(1.2) rotate(10deg);
                    opacity: 1;
                    filter: drop-shadow(0 0 30px rgba(255, 182, 193, 1));
                }
                70% {
                    transform: translate(-50%, 50vh) scale(0.8) rotate(180deg);
                    opacity: 0.8;
                    filter: drop-shadow(0 0 40px rgba(176, 224, 230, 0.8));
                }
                100% {
                    transform: translate(-50%, 120vh) scale(0.3) rotate(360deg);
                    opacity: 0;
                    filter: drop-shadow(0 0 50px rgba(221, 160, 221, 0.6));
                }
            }
            
            @keyframes kawaii-heartFloat {
                0% {
                    transform: translate(-50%, -50%) scale(0) rotate(0deg);
                    opacity: 0;
                }
                20% {
                    transform: translate(${-50 + (Math.random() - 0.5) * 30}%, ${-50 + (Math.random() - 0.5) * 20}%) scale(1) rotate(${(Math.random() - 0.5) * 30}deg);
                    opacity: 1;
                }
                100% {
                    transform: translate(${-50 + (Math.random() - 0.5) * 100}%, ${-150 - Math.random() * 100}%) scale(0.5) rotate(${(Math.random() - 0.5) * 180}deg);
                    opacity: 0;
                }
            }
        `;
        document.head.appendChild(style);
    }
    
    setTimeout(() => {
        animation.remove();
    }, 2500);
}

// 加载瓶子数据
async function loadBottles() {
    try {
        if (USE_LOCAL_STORAGE) {
            // 本地存储模式
            const stored = localStorage.getItem('lifeStationBottles');
            bottles = stored ? JSON.parse(stored) : getSampleBottles();
            debugLog(`📦 从本地存储加载了 ${bottles.length} 个漂流瓶`);
        } else {
            // API 模式 - 添加重试机制
            debugLog('🌊 正在从海洋中寻找漂流瓶...');
            bottles = await loadBottlesWithRetry();
            debugLog(`🌊 从海洋中捞起了 ${bottles.length} 个漂流瓶`);
        }
    } catch (error) {
        console.error('加载数据失败:', error);
        debugLog('⚠️ 数据加载失败，使用示例数据');
        bottles = getSampleBottles();
    }
}

// 带重试机制的瓶子加载函数
async function loadBottlesWithRetry(maxRetries = 3, timeout = 30000) {
    for (let attempt = 1; attempt <= maxRetries; attempt++) {
        try {
            debugLog(`第 ${attempt} 次尝试加载数据...`);
            
            // 检查网络状态
            if (!navigator.onLine) {
                throw new Error('网络连接已断开');
            }
            
            // 使用标准fetch，与web端保持一致
            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), timeout);
            
            const apiUrl = getCurrentApiUrl();
            const apiHeaders = getCurrentApiHeaders();
            const response = await fetch(`${apiUrl}/bottles?limit=50`, {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json',
                    ...apiHeaders
                },
                signal: controller.signal
            });
            
            clearTimeout(timeoutId);
            
            if (response.ok) {
                const data = await response.json();
                const loadedBottles = data.bottles || [];
                
                if (loadedBottles.length === 0) {
                    debugLog('⚠️ API返回空数据，可能是服务器问题');
                    if (attempt === maxRetries) {
                        return getSampleBottles(); // 最后一次尝试失败时使用示例数据
                    }
                    throw new Error('API返回空数据');
                }
                
                debugLog(`✅ 第 ${attempt} 次尝试成功，加载了 ${loadedBottles.length} 个漂流瓶`);
                return loadedBottles;
            } else {
                if (response.status === 404) {
                    debugLog('⚠️ API接口不存在，使用示例数据');
                    return getSampleBottles();
                } else if (response.status >= 500) {
                    throw new Error(`服务器错误 (${response.status})`);
                } else {
                    throw new Error(`请求失败 (${response.status})`);
                }
            }
            
        } catch (error) {
            debugLog(`❌ 第 ${attempt} 次加载尝试失败:`, error.message);
            
            if (error.name === 'AbortError') {
                debugLog('⏰ 加载超时，可能是服务器冷启动');
            }
            
            if (attempt === maxRetries) {
                debugLog('⚠️ 所有加载尝试都失败了，使用示例数据');
                return getSampleBottles();
            }
            
            // 等待后重试（递增等待时间）
            const waitTime = Math.min(2000 * Math.pow(2, attempt - 1), 8000);
            debugLog(`⏱️ 等待 ${waitTime/1000} 秒后重试加载...`);
            await new Promise(resolve => setTimeout(resolve, waitTime));
        }
    }
    
    // 理论上不会到达这里，但为了安全起见
    return getSampleBottles();
}

// 示例数据
function getSampleBottles() {
    const now = new Date();
    return [
        {
            id: '1',
            message: '今夜的星辰格外温柔，想和你一起数过银河',
            date: new Date(now.getTime() - 86400000).toISOString(),
            timestamp: now.getTime() - 86400000
        },
        {
            id: '2',
            message: '海风轻抚过我的脸庞，带着我对你的思念飘向远方',
            date: new Date(now.getTime() - 172800000).toISOString(),
            timestamp: now.getTime() - 172800000
        },
        {
            id: '3',
            message: '想你的时候，就像潮汐拍打礁石，一次比一次汹涌',
            date: new Date(now.getTime() - 259200000).toISOString(),
            timestamp: now.getTime() - 259200000
        },
        {
            id: '4',
            message: '愿我们的故事像海洋一样深邃，像星空一样永恒',
            date: new Date(now.getTime() - 345600000).toISOString(),
            timestamp: now.getTime() - 345600000
        },
        {
            id: '5',
            message: '每一个黄昏都在提醒我，又是想你的一天',
            date: new Date(now.getTime() - 432000000).toISOString(),
            timestamp: now.getTime() - 432000000
        },
        {
            id: '6',
            message: '如果风能够带话，我愿让它捎去我所有的想念',
            date: new Date(now.getTime() - 518400000).toISOString(),
            timestamp: now.getTime() - 518400000
        },
        {
            id: '7',
            message: '海上月圆时，便是我思君时',
            date: new Date(now.getTime() - 604800000).toISOString(),
            timestamp: now.getTime() - 604800000
        }
    ];
}

// 显示加载状态
function showLoadingBottles() {
    const container = bottlesContainer;
    container.innerHTML = `
        <div class="loading-bottles" style="
            position: absolute;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%);
            text-align: center;
            color: rgba(255, 255, 255, 0.8);
            font-size: 16px;
            z-index: 10;
        ">
            <div style="margin-bottom: 10px; font-size: 2rem;">🌊</div>
            <div>正在寻找漂流瓶...</div>
            <div style="font-size: 12px; margin-top: 5px; opacity: 0.7;">
                首次加载可能需要一些时间
            </div>
        </div>
    `;
}

// 显示瓶子
function displayBottles() {
    const container = bottlesContainer;
    container.innerHTML = '';
    
    const bottlesToShow = isSearchMode ? searchResults : bottles;
    
    if (bottlesToShow.length === 0) {
        // 显示空状态
        container.innerHTML = `
            <div class="empty-bottles" style="
                position: absolute;
                top: 50%;
                left: 50%;
                transform: translate(-50%, -50%);
                text-align: center;
                color: rgba(255, 255, 255, 0.6);
                font-size: 16px;
            ">
                <div style="margin-bottom: 10px; font-size: 2rem;">🌙</div>
                <div>海面很平静，还没有漂流瓶</div>
                <div style="font-size: 12px; margin-top: 5px;">
                    写下第一个思念，让它漂向远方
                </div>
            </div>
        `;
        return;
    }
    
    bottlesToShow.forEach((bottle, index) => {
        const bottleElement = createBottleElement(bottle, index);
        container.appendChild(bottleElement);
    });
}

// 创建瓶子元素
function createBottleElement(bottle, index) {
    const bottleDiv = document.createElement('div');
    bottleDiv.className = 'bottle-item';
    bottleDiv.style.cssText = `
        position: absolute;
        cursor: pointer;
        transition: all 0.3s ease;
        animation: float 3s ease-in-out infinite;
        animation-delay: ${index * 0.5}s;
    `;
    
    // 随机位置 - 避开搜索框区域
    const x = 10 + Math.random() * 80;
    // y轴从40%开始，避开顶部搜索框区域
    const y = 40 + Math.random() * 50;
    bottleDiv.style.left = x + '%';
    bottleDiv.style.top = y + '%';
    
    // 创建SVG瓶子
    bottleDiv.innerHTML = createBottleSVG(bottle);
    
    // 点击事件
    bottleDiv.addEventListener('click', () => openBottle(bottle));
    
    // 悬停效果
    bottleDiv.addEventListener('mouseenter', function() {
        this.style.transform = 'scale(1.2) translateY(-10px)';
        this.style.filter = 'drop-shadow(0 10px 20px rgba(255,255,255,0.3))';
    });
    
    bottleDiv.addEventListener('mouseleave', function() {
        this.style.transform = 'scale(1) translateY(0)';
        this.style.filter = 'none';
    });
    
    return bottleDiv;
}

// 创建瓶子SVG
function createBottleSVG(bottle) {
    // 可爱的颜色主题
    const themes = [
        { 
            bg: '#E8F4FD', 
            bottle: '#B3E5FC', 
            cap: '#FFB74D', 
            accent: '#81C784',
            character: '🐱',
            stars: '#FFE082'
        },
        { 
            bg: '#FDE7F3', 
            bottle: '#F8BBD9', 
            cap: '#FFB74D', 
            accent: '#CE93D8',
            character: '🐰',
            stars: '#F8BBD9'
        },
        { 
            bg: '#E8F5E8', 
            bottle: '#A5D6A7', 
            cap: '#FFB74D', 
            accent: '#81C784',
            character: '🐻',
            stars: '#C8E6C9'
        },
        { 
            bg: '#FFF3E0', 
            bottle: '#FFCC80', 
            cap: '#FFB74D', 
            accent: '#FFE082',
            character: '🐼',
            stars: '#FFF59D'
        },
        { 
            bg: '#E3F2FD', 
            bottle: '#90CAF9', 
            cap: '#FFB74D', 
            accent: '#81C784',
            character: '🐧',
            stars: '#B3E5FC'
        },
        { 
            bg: '#F3E5F5', 
            bottle: '#CE93D8', 
            cap: '#FFB74D', 
            accent: '#F8BBD9',
            character: '🦄',
            stars: '#E1BEE7'
        }
    ];
    
    const theme = themes[Math.abs(bottle.id.charCodeAt(0)) % themes.length];
    
    return `
        <svg width="80" height="100" viewBox="0 0 80 100" style="filter: drop-shadow(0 4px 12px rgba(0,0,0,0.15));">
            <!-- 背景光晕 -->
            <defs>
                <radialGradient id="glow-${bottle.id}" cx="50%" cy="50%" r="60%">
                    <stop offset="0%" style="stop-color:${theme.bg};stop-opacity:0.8"/>
                    <stop offset="100%" style="stop-color:${theme.bg};stop-opacity:0"/>
                </radialGradient>
                <filter id="sparkle-${bottle.id}">
                    <feGaussianBlur stdDeviation="1" result="coloredBlur"/>
                    <feMerge> 
                        <feMergeNode in="coloredBlur"/>
                        <feMergeNode in="SourceGraphic"/> 
                    </feMerge>
                </filter>
            </defs>
            
            <!-- 光晕背景 -->
            <circle cx="40" cy="50" r="45" fill="url(#glow-${bottle.id})" opacity="0.6"/>
            
            <!-- 瓶身主体 -->
            <path d="M20 35 Q20 30 25 30 L55 30 Q60 30 60 35 L60 70 Q60 75 55 75 L25 75 Q20 75 20 70 Z" 
                  fill="${theme.bottle}" stroke="#fff" stroke-width="2" opacity="0.9"/>
            
            <!-- 瓶身内层 -->
            <path d="M24 35 Q24 33 26 33 L54 33 Q56 33 56 35 L56 68 Q56 70 54 70 L26 70 Q24 70 24 68 Z" 
                  fill="${theme.bg}" opacity="0.7"/>
            
            <!-- 瓶颈 -->
            <rect x="32" y="20" width="16" height="15" fill="${theme.bottle}" stroke="#fff" stroke-width="2" rx="2"/>
            <rect x="34" y="22" width="12" height="11" fill="${theme.bg}" opacity="0.6" rx="1"/>
            
            <!-- 可爱的瓶塞 -->
            <ellipse cx="40" cy="18" rx="10" ry="5" fill="${theme.cap}" stroke="#fff" stroke-width="1.5"/>
            <ellipse cx="40" cy="15" rx="10" ry="3" fill="#FFCC80" opacity="0.8"/>
            <circle cx="40" cy="16" r="2" fill="#FF8A65" opacity="0.6"/>
            
            <!-- 瓶子内的小动物/角色 -->
            <g transform="translate(40,50)">
                <!-- 小熊形状 -->
                <circle cx="0" cy="0" r="8" fill="#FFCC80" opacity="0.9"/>
                <circle cx="-4" cy="-4" r="3" fill="#FFCC80" opacity="0.8"/>
                <circle cx="4" cy="-4" r="3" fill="#FFCC80" opacity="0.8"/>
                <circle cx="-2" cy="-1" r="1" fill="#333"/>
                <circle cx="2" cy="-1" r="1" fill="#333"/>
                <path d="M-1,2 Q0,3 1,2" stroke="#333" stroke-width="1" fill="none"/>
                
                <!-- 小围巾 -->
                <path d="M-6,4 Q0,6 6,4 Q6,8 4,10 Q0,8 -4,10 Q-6,8 -6,4" 
                      fill="${theme.accent}" opacity="0.8"/>
            </g>
            
            <!-- 星星装饰 -->
            <g filter="url(#sparkle-${bottle.id})">
                <path d="M30,40 L31,42 L33,42 L31.5,43.5 L32,46 L30,44.5 L28,46 L28.5,43.5 L27,42 L29,42 Z" 
                      fill="${theme.stars}" opacity="0.7"/>
                <path d="M50,55 L51,57 L53,57 L51.5,58.5 L52,61 L50,59.5 L48,61 L48.5,58.5 L47,57 L49,57 Z" 
                      fill="${theme.stars}" opacity="0.6"/>
                <circle cx="35" cy="60" r="1.5" fill="${theme.stars}" opacity="0.8"/>
                <circle cx="48" cy="45" r="1" fill="${theme.stars}" opacity="0.7"/>
                <circle cx="28" cy="52" r="0.8" fill="${theme.stars}" opacity="0.9"/>
            </g>
            
            <!-- 气泡效果 -->
            <circle cx="45" cy="42" r="2" fill="#fff" opacity="0.4"/>
            <circle cx="35" cy="48" r="1.5" fill="#fff" opacity="0.5"/>
            <circle cx="42" cy="58" r="1" fill="#fff" opacity="0.6"/>
            <circle cx="52" cy="50" r="1.2" fill="#fff" opacity="0.3"/>
            
            <!-- 高光效果 -->
            <ellipse cx="50" cy="45" rx="4" ry="12" fill="#fff" opacity="0.2"/>
            <ellipse cx="52" cy="40" rx="2" ry="6" fill="#fff" opacity="0.4"/>
            
            <!-- 可爱的小装饰 -->
            <g opacity="0.6">
                <circle cx="25" cy="25" r="1" fill="${theme.accent}"/>
                <circle cx="55" cy="28" r="0.8" fill="${theme.accent}"/>
                <circle cx="22" cy="55" r="1.2" fill="${theme.accent}"/>
                <circle cx="58" cy="65" r="0.9" fill="${theme.accent}"/>
            </g>
        </svg>
    `;
}

// 打开瓶子并加载诗句
function openBottle(bottle) {
    const modal = bottleModal;
    const messageContent = document.getElementById('modalMessage');
    const messageDate = document.getElementById('modalDate');
    const poemAnnotation = document.getElementById('poemAnnotation');
    
    // 立即显示瓶子内容
    messageContent.textContent = bottle.message;
    messageDate.textContent = formatDate(bottle.date);
    
    // 显示加载状态
    poemAnnotation.innerHTML = '<div class="poem-loading">正在寻找合适的诗句...</div>';
    
    modal.classList.add('active');
    
    // 异步加载诗句
    fetchPoemFromAPI().then(poem => {
        poemAnnotation.innerHTML = `
            <div class="poem-text-small">${poem.content}</div>
            <div class="poem-author-small">—— ${poem.origin}</div>
        `;
    }).catch(error => {
        console.log('诗句加载失败:', error);
        poemAnnotation.innerHTML = '<div class="poem-author-small">💕 海风轻语，情意绵绵 💕</div>';
    });
}

// 调用爱情主题诗句API
async function fetchPoemFromAPI() {
    try {
        // 使用今日诗词API，尝试获取爱情相关诗句
        const response = await fetch('https://v1.jinrishici.com/all.json');
        
        if (!response.ok) {
            throw new Error('API请求失败');
        }
        
        const data = await response.json();
        
        // 检查是否是爱情相关的诗句
        const loveKeywords = ['情', '爱', '思', '君', '心', '恋', '相', '怜', '慕', '念'];
        const isLovePoem = loveKeywords.some(keyword => data.content.includes(keyword));
        
        if (isLovePoem) {
            return {
                content: data.content,
                origin: `${data.origin} · ${data.author}`
            };
        } else {
            // 如果不是爱情诗句，直接使用本地爱情诗句库
            throw new Error('非爱情主题诗句');
        }
        
    } catch (error) {
        console.log('爱情诗句API调用失败，使用备用方案:', error);
        
        // 备用方案：使用本地爱情诗句库
        const poem = lovePoems[Math.floor(Math.random() * lovePoems.length)];
        return {
            content: poem.text,
            origin: poem.author
        };
    }
}

// 搜索功能
async function performSearch() {
    const query = mainSearchInput.value.toLowerCase().trim();
    
    if (!query) {
        isSearchMode = false;
        displayBottles();
        return;
    }
    
    isSearchMode = true;
    
    try {
        if (USE_LOCAL_STORAGE) {
            // 本地搜索
            searchResults = bottles.filter(bottle => 
                bottle.message.toLowerCase().includes(query)
            );
        } else {
            // API 搜索
            const response = await fetch(`${API_BASE_URL}/search?q=${encodeURIComponent(query)}&limit=30`);
            
            if (response.ok) {
                const data = await response.json();
                searchResults = data.bottles || [];
                if (data.message) {
                    debugLog(data.message);
                }
            } else {
                console.warn('API搜索失败，使用本地搜索');
                searchResults = bottles.filter(bottle => 
                    bottle.message.toLowerCase().includes(query)
                );
            }
        }
    } catch (error) {
        console.error('搜索失败:', error);
        // 回退到本地搜索
        searchResults = bottles.filter(bottle => 
            bottle.message.toLowerCase().includes(query)
        );
    }
    
    displayBottles();
}

// 格式化日期
function formatDate(dateString) {
    const date = new Date(dateString);
    const year = date.getFullYear();
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    const day = date.getDate().toString().padStart(2, '0');
    const hours = date.getHours().toString().padStart(2, '0');
    const minutes = date.getMinutes().toString().padStart(2, '0');
    
    return `${year}年${month}月${day}日 ${hours}:${minutes}`;
}