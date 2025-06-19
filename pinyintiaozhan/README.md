# 🎮 拼音挑战
📚通过拼音练习掌握汉字发音，挑战不同难度的关卡，针对性消除平翘舌、前后鼻音误用

## 🎯 核心玩法

✨ 通过拼音组合挑战汉字认知能力！包含多级渐进式挑战：
1. **初级关卡** 🎯 - 基础平翘舌音练习
2. **中级关卡** 🔥 - 复合声母韵母组合
3. **高级关卡** 🚀 - 专业术语拼音挑战

## 🌟 功能特性

* **智能词库** 📚 - 基于HSK分级词库（内置word.json）
* **进度跟踪** 📊 - LocalStorage持久化存储闯关进度
* **即时反馈** 💡 - 输入正确性视觉提示与动画
* **词库管理** 🧩 - 支持动态添加/导入导出词库
* **响应式布局** 📱 - 自适应手机/平板/桌面端

## 🛠️ 技术栈

* **核心功能**:
  - 动态关卡进度管理
  - 拼音输入验证系统
  - 词库JSON数据持久化
* **界面特性**:
  - CSS自定义属性与渐变背景
  - 响应式网格布局
  - 交互动画效果（输入抖动/进度条）

## 🚀 快速开始

1. 直接打开`index.html`即可开玩
2. 通过键盘输入拼音组合
3. 查看实时积分和正确率情况

## 📜 词库格式示例

```json
[
    {
        "name": "初级关卡",
        "vocabulary": [
            {
                "hanzi": "支持",
                "pinyin": "zhichi"
            },
            {
                "hanzi": "商人",
                "pinyin": "shangren"
            },
            {
                "hanzi": "初始",
                "pinyin": "chushi"
            },
            {
                "hanzi": "承认",
                "pinyin": "chengren"
            }
        ],
        "completed": false
    },
    {
        "name": "中级进阶关",
        "vocabulary": [
            {
                "hanzi": "平衡",
                "pinyin": "pingheng"
            },
            {
                "hanzi": "政府",
                "pinyin": "zhengfu"
            },
            {
                "hanzi": "深沉",
                "pinyin": "shenchen"
            },
            {
                "hanzi": "升腾",
                "pinyin": "shengteng"
            },
            {
                "hanzi": "情景",
                "pinyin": "qingjing"
            }
        ],
        "completed": false
    }
]
```

## 📄 版权

本项目采用 MIT 许可证 - 详情请参阅仓库根目录LICENSE文件