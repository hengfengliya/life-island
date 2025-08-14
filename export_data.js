#!/usr/bin/env node
/**
 * 人生小站 - 数据导出工具
 * 支持多种格式导出漂流瓶数据
 */

const fs = require('fs');
const https = require('https');

// 配置
const API_BASE_URL = 'https://life-station-api.life-island.workers.dev/api';
const OUTPUT_DIR = './exports';

class DataExporter {
    constructor() {
        this.bottles = [];
        this.ensureOutputDir();
    }

    ensureOutputDir() {
        if (!fs.existsSync(OUTPUT_DIR)) {
            fs.mkdirSync(OUTPUT_DIR, { recursive: true });
        }
    }

    async fetchAllBottles() {
        console.log('🌊 正在获取漂流瓶数据...');
        
        return new Promise((resolve, reject) => {
            const url = `${API_BASE_URL}/bottles?limit=1000`;
            
            https.get(url, (res) => {
                let data = '';
                
                res.on('data', (chunk) => {
                    data += chunk;
                });
                
                res.on('end', () => {
                    try {
                        const result = JSON.parse(data);
                        this.bottles = result.bottles || [];
                        console.log(`✅ 成功获取 ${this.bottles.length} 个漂流瓶`);
                        resolve(result);
                    } catch (error) {
                        reject(error);
                    }
                });
            }).on('error', (error) => {
                reject(error);
            });
        });
    }

    exportToJSON() {
        const filename = `${OUTPUT_DIR}/bottles_${this.getTimestamp()}.json`;
        const data = {
            exportTime: new Date().toISOString(),
            totalCount: this.bottles.length,
            bottles: this.bottles
        };
        
        fs.writeFileSync(filename, JSON.stringify(data, null, 2));
        console.log(`📄 JSON导出完成: ${filename}`);
        return filename;
    }

    exportToCSV() {
        const filename = `${OUTPUT_DIR}/bottles_${this.getTimestamp()}.csv`;
        
        // CSV头部
        let csv = 'ID,Message,Date,Timestamp\n';
        
        // 数据行
        this.bottles.forEach(bottle => {
            const message = bottle.message.replace(/"/g, '""'); // 转义双引号
            csv += `"${bottle.id}","${message}","${bottle.date}","${bottle.timestamp}"\n`;
        });
        
        fs.writeFileSync(filename, csv);
        console.log(`📊 CSV导出完成: ${filename}`);
        return filename;
    }

    exportToMarkdown() {
        const filename = `${OUTPUT_DIR}/bottles_${this.getTimestamp()}.md`;
        
        let md = `# 人生小站 - 漂流瓶数据导出\n\n`;
        md += `> 导出时间: ${new Date().toLocaleString('zh-CN')}\n`;
        md += `> 漂流瓶总数: ${this.bottles.length}\n\n`;
        
        this.bottles.forEach((bottle, index) => {
            const date = new Date(bottle.timestamp).toLocaleString('zh-CN');
            md += `## 漂流瓶 ${index + 1}\n\n`;
            md += `**ID:** ${bottle.id}\n\n`;
            md += `**时间:** ${date}\n\n`;
            md += `**内容:**\n> ${bottle.message}\n\n`;
            md += `---\n\n`;
        });
        
        fs.writeFileSync(filename, md);
        console.log(`📝 Markdown导出完成: ${filename}`);
        return filename;
    }

    exportToHTML() {
        const filename = `${OUTPUT_DIR}/bottles_${this.getTimestamp()}.html`;
        
        let html = `<!DOCTYPE html>
<html lang="zh-CN">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>人生小站 - 漂流瓶数据导出</title>
    <style>
        body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; max-width: 800px; margin: 0 auto; padding: 20px; }
        .header { text-align: center; margin-bottom: 40px; }
        .bottle { background: #f8f9fa; border-radius: 10px; padding: 20px; margin-bottom: 20px; }
        .bottle-id { color: #666; font-size: 0.9em; }
        .bottle-date { color: #888; font-size: 0.9em; margin-bottom: 10px; }
        .bottle-message { font-size: 1.1em; line-height: 1.6; }
    </style>
</head>
<body>
    <div class="header">
        <h1>🌊 人生小站 - 漂流瓶数据导出</h1>
        <p>导出时间: ${new Date().toLocaleString('zh-CN')}</p>
        <p>漂流瓶总数: ${this.bottles.length}</p>
    </div>
`;

        this.bottles.forEach((bottle, index) => {
            const date = new Date(bottle.timestamp).toLocaleString('zh-CN');
            html += `
    <div class="bottle">
        <div class="bottle-id">ID: ${bottle.id}</div>
        <div class="bottle-date">${date}</div>
        <div class="bottle-message">${bottle.message}</div>
    </div>`;
        });

        html += `
</body>
</html>`;
        
        fs.writeFileSync(filename, html);
        console.log(`🌐 HTML导出完成: ${filename}`);
        return filename;
    }

    getTimestamp() {
        const now = new Date();
        return now.toISOString().replace(/[:.]/g, '-').slice(0, -5);
    }

    async exportAll() {
        try {
            await this.fetchAllBottles();
            
            if (this.bottles.length === 0) {
                console.log('❌ 没有找到漂流瓶数据');
                return;
            }

            console.log('\n📦 开始批量导出...');
            
            const files = [
                this.exportToJSON(),
                this.exportToCSV(),
                this.exportToMarkdown(),
                this.exportToHTML()
            ];
            
            console.log('\n🎉 导出完成！生成的文件:');
            files.forEach(file => console.log(`  - ${file}`));
            
        } catch (error) {
            console.error('❌ 导出失败:', error.message);
        }
    }
}

// 命令行使用
if (require.main === module) {
    const exporter = new DataExporter();
    
    const args = process.argv.slice(2);
    const format = args[0];
    
    if (format === 'json') {
        exporter.fetchAllBottles().then(() => exporter.exportToJSON());
    } else if (format === 'csv') {
        exporter.fetchAllBottles().then(() => exporter.exportToCSV());
    } else if (format === 'md') {
        exporter.fetchAllBottles().then(() => exporter.exportToMarkdown());
    } else if (format === 'html') {
        exporter.fetchAllBottles().then(() => exporter.exportToHTML());
    } else {
        exporter.exportAll();
    }
}

module.exports = DataExporter;