// /api/analyze.js
// 这个文件运行在 Vercel 服务器端，非常安全

export const config = {
    runtime: 'edge', // 使用 Edge Runtime，速度更快
};

export default async function handler(request) {
    // 1. 安全检查：只允许 POST 请求
    if (request.method !== 'POST') {
        return new Response(JSON.stringify({ error: 'Method not allowed' }), { status: 405 });
    }

    try {
        // 2. 获取前端传来的图片数据
        const { image } = await request.json();

        if (!image) {
            return new Response(JSON.stringify({ error: 'No image provided' }), { status: 400 });
        }

        // 3. 准备提示词 (Prompt)
        const prompt = `
        你是一个专业的时尚搭配师。请分析这张衣服图片，并严格按照以下 JSON 格式返回结果（不要任何 Markdown 标记，只要纯 JSON）：
        {
            "color": "颜色名称(如: 藏青色)",
            "colorHex": "颜色的Hex值(如: #000080)",
            "category": "只能是以下四个英文单词之一: top, pants, shoes, accessory",
            "confidence": 0.95,
            "suggestedSeason": "只能是以下五个英文单词之一: spring, summer, autumn, winter, all",
            "occasions": ["适合场合1", "适合场合2"],
            "matching": {
                "tip": "一句话搭配建议",
                "safe": ["安全搭配色1", "安全搭配色2"],
                "complementary": ["互补色1", "互补色2"],
                "analogous": ["邻近色1", "邻近色2"]
            },
            "analysis": {
                "brightness": "亮度值(0-255)",
                "isLight": true,
                "isDark": false
            }
        }
        请确保 category 的判断准确。如果是长袖外套、T恤、衬衫都算 top；裤子、裙子算 pants；鞋子、靴子算 shoes；帽子、包包、围巾等算 accessory。
        `;

        // 4. 调用硅基流动 (SiliconFlow) API
        // 注意：从环境变量获取 API Key，保证安全
        const API_KEY = process.env.SILICON_FLOW_API_KEY || 'sk-gocqsbrafyqklzgiwmasvmonueucwlropzngfmfosfrodtjl'; 
        
        const response = await fetch('https://api.siliconflow.cn/v1/chat/completions', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${API_KEY}`
            },
            body: JSON.stringify({
                model: "Qwen/Qwen2-VL-7B-Instruct", // 免费且强大的视觉模型
                messages: [
                    {
                        role: "user",
                        content: [
                            { type: "text", text: prompt },
                            { 
                                type: "image_url", 
                                image_url: { 
                                    url: image // Base64 图片
                                } 
                            }
                        ]
                    }
                ],
                stream: false,
                temperature: 0.1,
                max_tokens: 1024
            })
        });

        const data = await response.json();

        // 5. 处理返回结果
        if (data.choices && data.choices[0].message) {
            let content = data.choices[0].message.content;
            // 清理 markdown 标记
            content = content.replace(/```json/g, '').replace(/```/g, '').trim();
            
            // 验证 JSON 格式
            const result = JSON.parse(content);
            
            return new Response(JSON.stringify(result), {
                headers: { 
                    'Content-Type': 'application/json',
                    'Access-Control-Allow-Origin': '*' // 允许跨域
                }
            });
        } else {
            throw new Error('API format error');
        }

    } catch (error) {
        console.error('AI Error:', error);
        return new Response(JSON.stringify({ 
            error: 'AI analysis failed',
            message: error.message 
        }), { 
            status: 500,
            headers: { 'Content-Type': 'application/json' }
        });
    }
}
