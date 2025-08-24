# MCv2 - 2D Minecraft 风格沙盒游戏

<div align="center">

![MCv2 Logo](https://img.shields.io/badge/MCv2-2D%20Minecraft-brightgreen?style=for-the-badge&logo=minecraft)
![React](https://img.shields.io/badge/React-18.2.0-blue?style=for-the-badge&logo=react)
![Vite](https://img.shields.io/badge/Vite-4.4.5-646CFF?style=for-the-badge&logo=vite)
![JavaScript](https://img.shields.io/badge/JavaScript-ES6+-yellow?style=for-the-badge&logo=javascript)

一个基于React和Vite构建的2D Minecraft风格沙盒游戏，具有完整的游戏引擎、物理系统、地形生成和物品栏管理。

[在线演示](https://your-demo-link.com) • [文档](./docs/) • [更新日志](./logs/CHANGELOG.md)

</div>

## 🎮 项目特色

### 🏗️ 核心系统
- **🎯 游戏引擎**: 高性能的游戏循环和状态管理
- **👤 玩家系统**: 完整的物理模拟、控制逻辑和碰撞检测
- **📷 摄像机系统**: 平滑的视野管理和坐标转换
- **🎨 渲染系统**: 基于Canvas的高效图形绘制
- **🌍 世界生成**: 程序化地形、生物群系、洞穴和矿物生成
- **💾 存储系统**: 完整的游戏数据持久化

### 🎒 物品栏与背包系统
- **9个快捷栏槽位** + **27个背包槽位**（总共36个槽位）
- **智能物品堆叠**和自动槽位分配
- **工具耐久度系统**和材质等级（木头→石头→铁→钻石）
- **多种物品类型**：方块、工具、材料、食物
- **稀有度系统**：普通→不常见→稀有→史诗→传说
- **实时UI界面**：E键打开背包，数字键1-9选择物品

### 🌟 游戏功能
- **飞行模式**: F键切换，支持速度调节（100%-1000%）
- **时间系统**: 动态昼夜循环，可调节时间流逝速度
- **生存系统**: 生命值、摔伤机制、自动回血
- **调试工具**: F3切换调试信息，性能监控
- **配置管理**: 实时游戏设置调节

## 🚀 快速开始

### 环境要求
- Node.js 16.0+
- npm 或 yarn
- 现代浏览器（支持ES6模块）

### 安装运行

```bash
# 克隆项目
git clone https://github.com/your-username/MCv2.git
cd MCv2

# 进入游戏目录
cd mcv2-game

# 安装依赖
npm install

# 启动开发服务器
npm run dev

# 构建生产版本
npm run build
```

### 第一次运行
1. 启动开发服务器后，打开浏览器访问 `http://localhost:5173`
2. 等待游戏加载完成
3. 使用WASD键移动，空格键跳跃
4. 按F键切换飞行模式
5. 按E键打开物品栏，数字键1-9选择物品

## 🎮 控制说明

### 基础控制
| 按键 | 功能 |
|------|------|
| **WASD / 方向键** | 移动 |
| **空格键** | 跳跃（正常模式） |
| **E键** | 打开/关闭物品栏 |
| **1-9数字键** | 选择快捷栏物品 |

### 飞行模式
| 按键 | 功能 |
|------|------|
| **F键** | 切换飞行模式 |
| **W/S键** | 上下飞行 |
| **+/-键** | 调节飞行速度 |

### 系统控制
| 按键 | 功能 |
|------|------|
| **F3** | 切换调试信息 |
| **H键** | 显示/隐藏控制说明 |
| **T键** | 切换时间系统 |
| **[/]** | 调节帧率 |
| **ESC** | 暂停/关闭界面 |

## 🏗️ 项目架构

```
MCv2/
├── mcv2-game/                 # 游戏主体
│   ├── src/
│   │   ├── camera/           # 摄像机系统
│   │   ├── config/           # 游戏配置
│   │   │   ├── BlockConfig.js    # 方块配置
│   │   │   ├── ItemConfig.js     # 物品配置
│   │   │   └── GameConfig.js     # 游戏配置
│   │   ├── engine/           # 游戏引擎
│   │   ├── player/           # 玩家系统
│   │   │   ├── Player.js         # 玩家控制
│   │   │   └── Inventory.js      # 物品栏系统
│   │   ├── renderer/         # 渲染系统
│   │   ├── storage/          # 存储管理
│   │   ├── ui/               # 用户界面
│   │   │   ├── InventoryUI.jsx   # 物品栏UI
│   │   │   ├── ConfigPanel.js    # 配置面板
│   │   │   └── DebugConsole.jsx  # 调试控制台
│   │   ├── world/            # 世界生成
│   │   │   ├── generators/       # 生成器
│   │   │   ├── biomes/           # 生物群系
│   │   │   └── noise/            # 噪声算法
│   │   └── tests/            # 测试文件
│   ├── package.json          # 项目配置
│   └── vite.config.js        # Vite配置
├── docs/                     # 项目文档
└── logs/                     # 更新日志
```

## 🛠️ 技术栈

- **前端框架**: React 18.2.0
- **构建工具**: Vite 4.4.5
- **渲染**: Canvas API
- **噪声生成**: Simplex Noise
- **随机数**: Seedrandom
- **语言**: JavaScript ES6+

## 📖 功能文档

### 🎒 物品栏系统
- [物品配置系统](./docs/inventory-system.md) - 详细的物品类型和属性配置
- [背包管理](./docs/inventory-management.md) - 物品添加、移除、堆叠逻辑
- [UI界面设计](./docs/ui-design.md) - 快捷栏和背包界面实现

### 🌍 世界生成系统
- [地形生成算法](./docs/terrain-generation.md) - 程序化地形生成
- [生物群系系统](./docs/biomes.md) - 不同环境的生成规则
- [洞穴与矿物](./docs/caves-and-ores.md) - 地下结构生成

### 🎮 游戏系统
- [物理引擎](./docs/physics-engine.md) - 重力、碰撞、移动系统
- [玩家控制](./docs/player-controls.md) - 输入处理和状态管理
- [存储系统](./docs/storage-system.md) - 数据持久化和自动保存

## 🧪 测试

```bash
# 运行测试物品栏系统
open http://localhost:5173/test-inventory.html

# 运行测试集成环境
open http://localhost:5173/test-inventory-integration.html
```

## 🔧 开发指南

### 添加新物品类型
1. 在 `src/config/ItemConfig.js` 中定义物品属性
2. 在物品图标映射中添加对应图标
3. 更新相关的游戏逻辑

### 扩展地形生成
1. 在 `src/world/generators/` 中创建新的生成器
2. 在 `TerrainGenerator.js` 中集成新生成器
3. 配置生成参数和权重

### 自定义UI组件
1. 在 `src/ui/` 目录下创建React组件
2. 导入到 `App.jsx` 中使用
3. 添加对应的CSS样式

## 🤝 贡献指南

我们欢迎任何形式的贡献！请遵循以下步骤：

1. Fork 本仓库
2. 创建特性分支 (`git checkout -b feature/amazing-feature`)
3. 提交变更 (`git commit -m 'Add some amazing feature'`)
4. 推送到分支 (`git push origin feature/amazing-feature`)
5. 开启 Pull Request

### 代码规范
- 使用ES6+语法
- 遵循React最佳实践
- 添加适当的注释和文档
- 确保代码通过ESLint检查

## 📝 更新日志

查看 [CHANGELOG.md](./logs/CHANGELOG.md) 了解详细的版本更新记录。

## 📄 许可证

本项目采用 MIT 许可证 - 查看 [LICENSE](LICENSE) 文件了解详情。

## 🙏 致谢

- Minecraft - 游戏灵感来源
- React 团队 - 优秀的前端框架
- Vite 团队 - 快速的构建工具
- 开源社区 - 各种优秀的库和工具

## 📞 联系方式

- 项目主页: [GitHub Repository](https://github.com/your-username/MCv2)
- 问题反馈: [Issues](https://github.com/your-username/MCv2/issues)
- 讨论交流: [Discussions](https://github.com/your-username/MCv2/discussions)

---

<div align="center">

**🌟 如果这个项目对你有帮助，请给个Star支持一下！**

Made with ❤️ by MCv2 Development Team

</div>