// AI 智能助手模块
class AIHelper {
    constructor() {
        this.colorThief = null; // 颜色提取工具
    }

    // 分析图片中的主色调
    async extractDominantColor(imageDataUrl) {
        return new Promise((resolve) => {
            const img = new Image();
            img.crossOrigin = "Anonymous";
            img.src = imageDataUrl;
            
            img.onload = () => {
                // 创建 canvas 分析颜色
                const canvas = document.createElement('canvas');
                const ctx = canvas.getContext('2d');
                canvas.width = img.width;
                canvas.height = img.height;
                ctx.drawImage(img, 0, 0);
                
                // 采样图片中心区域的颜色
                const centerX = Math.floor(img.width / 2);
                const centerY = Math.floor(img.height / 2);
                const sampleSize = Math.min(img.width, img.height) / 4;
                
                const imageData = ctx.getImageData(
                    centerX - sampleSize / 2,
                    centerY - sampleSize / 2,
                    sampleSize,
                    sampleSize
                );
                
                // 计算平均颜色
                const color = this.calculateAverageColor(imageData.data);
                const colorName = this.getColorName(color);
                
                resolve({
                    rgb: color,
                    name: colorName,
                    hex: this.rgbToHex(color)
                });
            };
            
            img.onerror = () => {
                resolve({ rgb: [128, 128, 128], name: '灰色', hex: '#808080' });
            };
        });
    }

    // 计算平均颜色
    calculateAverageColor(pixelData) {
        let r = 0, g = 0, b = 0, count = 0;
        
        for (let i = 0; i < pixelData.length; i += 4) {
            // 跳过太亮或太暗的像素（可能是背景）
            const brightness = (pixelData[i] + pixelData[i + 1] + pixelData[i + 2]) / 3;
            if (brightness > 30 && brightness < 225) {
                r += pixelData[i];
                g += pixelData[i + 1];
                b += pixelData[i + 2];
                count++;
            }
        }
        
        if (count === 0) count = 1;
        
        return [
            Math.round(r / count),
            Math.round(g / count),
            Math.round(b / count)
        ];
    }

    // RGB 转十六进制
    rgbToHex([r, g, b]) {
        return '#' + [r, g, b].map(x => {
            const hex = x.toString(16);
            return hex.length === 1 ? '0' + hex : hex;
        }).join('');
    }

    // 获取颜色名称
    getColorName([r, g, b]) {
        // 计算颜色特征
        const max = Math.max(r, g, b);
        const min = Math.min(r, g, b);
        const diff = max - min;
        const brightness = (r + g + b) / 3;
        
        // 灰度判断
        if (diff < 30) {
            if (brightness < 50) return '黑色';
            if (brightness < 100) return '深灰';
            if (brightness < 150) return '灰色';
            if (brightness < 200) return '浅灰';
            return '白色';
        }
        
        // 色相判断
        if (r > g && r > b) {
            if (g > b * 1.5) return '橙色';
            if (b > g) return '粉色';
            return '红色';
        }
        
        if (g > r && g > b) {
            if (r > b * 1.2) return '黄绿色';
            if (b > r * 1.2) return '青色';
            return '绿色';
        }
        
        if (b > r && b > g) {
            if (r > g * 1.5) return '紫色';
            if (g > r) return '蓝绿色';
            return '蓝色';
        }
        
        // 混合色
        if (r > 200 && g > 180 && b < 100) return '黄色';
        if (r > 150 && g < 100 && b > 150) return '紫红色';
        
        return '混合色';
    }

    // AI 智能识别衣服类型（基于简单规则）
    async predictClothingType(imageDataUrl) {
        // 这里可以接入真实的 AI API
        // 目前使用基于规则的简单识别
        return new Promise((resolve) => {
            const img = new Image();
            img.src = imageDataUrl;
            
            img.onload = () => {
                const aspectRatio = img.width / img.height;
                
                // 基于宽高比的简单判断
                let category = 'top';
                let confidence = 0.6;
                
                if (aspectRatio > 1.2) {
                    // 宽度明显大于高度，可能是裤子或配饰
                    category = 'pants';
                    confidence = 0.7;
                } else if (aspectRatio < 0.8) {
                    // 高度明显大于宽度，可能是上衣或鞋子
                    if (img.height > img.width * 1.5) {
                        category = 'top';
                        confidence = 0.75;
                    } else {
                        category = 'shoes';
                        confidence = 0.65;
                    }
                }
                
                resolve({ category, confidence });
            };
            
            img.onerror = () => {
                resolve({ category: 'top', confidence: 0.5 });
            };
        });
    }

    // 颜色搭配建议
    getColorMatchingSuggestion(mainColor) {
        const [r, g, b] = mainColor;
        const brightness = (r + g + b) / 3;
        
        const suggestions = {
            complementary: [],
            analogous: [],
            neutral: ['黑色', '白色', '灰色', '米色']
        };
        
        // 根据主色调推荐搭配颜色
        if (r > g && r > b) {
            // 红色系
            suggestions.complementary = ['绿色', '青色', '蓝色'];
            suggestions.analogous = ['橙色', '粉色', '紫色'];
        } else if (g > r && g > b) {
            // 绿色系
            suggestions.complementary = ['红色', '粉色', '紫红色'];
            suggestions.analogous = ['黄绿色', '青色', '蓝色'];
        } else if (b > r && b > g) {
            // 蓝色系
            suggestions.complementary = ['橙色', '黄色', '红色'];
            suggestions.analogous = ['紫色', '青色', '蓝绿色'];
        }
        
        return {
            safe: suggestions.neutral,
            complementary: suggestions.complementary,
            analogous: suggestions.analogous,
            tip: brightness < 100 
                ? '深色衣服建议搭配浅色或亮色' 
                : brightness > 200 
                ? '浅色衣服可以搭配深色或鲜艳色'
                : '中等色调比较百搭'
        };
    }

    // 检查颜色冲突
    checkColorConflict(color1Name, color2Name) {
        const conflicts = {
            '红色': ['绿色', '橙色'],
            '绿色': ['红色', '粉色'],
            '蓝色': ['橙色'],
            '橙色': ['蓝色', '紫色'],
            '紫色': ['黄色', '橙色'],
            '黄色': ['紫色']
        };
        
        if (conflicts[color1Name] && conflicts[color1Name].includes(color2Name)) {
            return {
                hasConflict: true,
                warning: `${color1Name}和${color2Name}搭配可能不够协调，建议添加中性色过渡`
            };
        }
        
        return { hasConflict: false };
    }

    // 智能推荐季节（基于颜色）
    suggestSeason(colorName, brightness) {
        // 亮色 -> 春夏
        if (brightness > 180) {
            if (['黄色', '粉色', '浅蓝', '白色'].includes(colorName)) {
                return 'summer';
            }
            return 'spring';
        }
        
        // 深色 -> 秋冬
        if (brightness < 100) {
            if (['深蓝', '黑色', '深灰'].includes(colorName)) {
                return 'winter';
            }
            return 'autumn';
        }
        
        // 中等亮度
        if (['橙色', '棕色', '褐色'].includes(colorName)) {
            return 'autumn';
        }
        
        return 'all';
    }

    // 获取季节名称
    getSeasonName(season) {
        const names = {
            spring: '春季',
            summer: '夏季',
            autumn: '秋季',
            winter: '冬季',
            all: '四季'
        };
        return names[season] || '四季';
    }

    // 场合推荐（基于颜色和风格）
    suggestOccasion(colorName, brightness) {
        const occasions = [];
        
        // 正式场合
        if (['黑色', '白色', '深蓝', '灰色'].includes(colorName)) {
            occasions.push('正式场合');
            occasions.push('商务会议');
        }
        
        // 休闲场合
        if (brightness > 150 || ['蓝色', '绿色', '黄色'].includes(colorName)) {
            occasions.push('休闲出行');
            occasions.push('日常通勤');
        }
        
        // 运动场合
        if (['黑色', '灰色', '深蓝', '红色'].includes(colorName)) {
            occasions.push('运动健身');
        }
        
        // 约会场合
        if (['粉色', '红色', '白色', '浅蓝'].includes(colorName) && brightness > 120) {
            occasions.push('约会聚会');
        }
        
        return occasions.length > 0 ? occasions : ['日常通勤'];
    }

    // 生成 AI 分析报告（使用真实 AI API）
    async analyzeClothing(imageDataUrl) {
        console.log('🤖 正在请求 AI 分析...');

        try {
            // 调用我们自己的后端 API
            const response = await fetch('/api/analyze', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    image: imageDataUrl
                })
            });

            if (!response.ok) {
                throw new Error(`API 响应失败: ${response.status}`);
            }

            const aiResult = await response.json();
            console.log('✅ AI 分析完成:', aiResult);
            
            // 验证返回数据格式
            if (aiResult.error) {
                throw new Error(aiResult.error);
            }
            
            return aiResult;

        } catch (error) {
            console.warn('❌ AI API 调用失败，转为本地规则判断:', error.message);
            // 如果 AI 挂了或者没网，自动降级使用本地算法
            return await this.analyzeClothingLocal(imageDataUrl);
        }
    }
    
    // 本地降级分析方法
    async analyzeClothingLocal(imageDataUrl) {
        console.log('💡 使用本地算法分析...');
        try {
            // 提取颜色
            const colorInfo = await this.extractDominantColor(imageDataUrl);
            
            // 识别类型
            const typeInfo = await this.predictClothingType(imageDataUrl);
            
            // 计算亮度
            const brightness = (colorInfo.rgb[0] + colorInfo.rgb[1] + colorInfo.rgb[2]) / 3;
            
            // 推荐季节
            const suggestedSeason = this.suggestSeason(colorInfo.name, brightness);
            
            // 推荐场合
            const occasions = this.suggestOccasion(colorInfo.name, brightness);
            
            // 搭配建议
            const matchingSuggestion = this.getColorMatchingSuggestion(colorInfo.rgb);
            
            console.log('✅ 本地分析完成');
            
            return {
                color: colorInfo.name,
                colorHex: colorInfo.hex,
                category: typeInfo.category,
                confidence: typeInfo.confidence,
                suggestedSeason: suggestedSeason,
                occasions: occasions,
                matching: matchingSuggestion,
                analysis: {
                    brightness: brightness.toFixed(0),
                    isLight: brightness > 150,
                    isDark: brightness < 100
                }
            };
        } catch (error) {
            console.error('本地分析也失败了:', error);
            return null;
        }
    }
}

// 导出实例
const aiHelper = new AIHelper();
