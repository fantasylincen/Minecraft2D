# 贡献指南

感谢你对Minecraft2D项目的关注！我们欢迎任何形式的贡献，无论是bug修复、新功能开发，还是文档改进。

## 🚀 开始贡献

### 1. 环境准备

确保你的开发环境满足以下要求：
- Node.js 16.0+
- npm 或 yarn
- Git
- 现代浏览器（支持ES6模块）

### 2. Fork 和克隆项目

```bash
# Fork 项目到你的GitHub账户，然后克隆
git clone https://github.com/fantasylincen/Minecraft2D.git
cd Minecraft2D

# 添加上游仓库
git remote add upstream https://github.com/fantasylincen/Minecraft2D.git
```

### 3. 创建开发分支

```bash
# 确保你在main分支
git checkout main

# 获取最新代码
git pull upstream main

# 创建新的功能分支
git checkout -b feature/your-feature-name
```

## 📝 开发规范

### 代码风格

- **JavaScript**: 使用ES6+语法，遵循现代JavaScript最佳实践
- **React**: 使用函数组件和Hooks，避免类组件
- **命名规范**: 
  - 文件名使用PascalCase（组件）或camelCase（工具函数）
  - 变量和函数使用camelCase
  - 常量使用UPPER_SNAKE_CASE

### 文件结构

```
src/
├── components/          # React组件
├── config/             # 配置文件
├── engine/             # 游戏引擎核心
├── player/             # 玩家相关系统
├── renderer/           # 渲染系统
├── storage/            # 存储管理
├── ui/                 # UI组件
├── world/              # 世界生成
└── tests/              # 测试文件
```

### 代码注释

- 为复杂的算法和业务逻辑添加注释
- 使用JSDoc格式注释公共API
- 中英文注释都可以，保持一致性

```javascript
/**
 * 计算玩家与方块的碰撞检测
 * @param {Object} playerPos 玩家位置
 * @param {Object} blockPos 方块位置
 * @returns {boolean} 是否发生碰撞
 */
function checkCollision(playerPos, blockPos) {
  // 实现碰撞检测逻辑
}
```

## 🐛 Bug报告

在提交bug报告前，请确保：

1. 搜索现有的Issues，避免重复报告
2. 使用最新版本测试问题是否仍然存在
3. 提供详细的重现步骤

### Bug报告模板

```markdown
**问题描述**
简要描述遇到的问题

**重现步骤**
1. 进入游戏
2. 执行某个操作
3. 观察到错误

**预期行为**
描述你期望发生的情况

**实际行为**
描述实际发生的情况

**环境信息**
- 操作系统: [macOS/Windows/Linux]
- 浏览器: [Chrome/Firefox/Safari + 版本]
- Node.js版本: [版本号]

**附加信息**
- 控制台错误信息
- 截图（如适用）
- 相关配置
```

## ✨ 功能建议

提交新功能建议时，请：

1. 详细描述功能的用途和价值
2. 考虑对现有系统的影响
3. 提供实现思路（如果有的话）

## 🧪 测试

### 运行测试

```bash
# 进入游戏目录
cd minecraft2d-game

# 安装依赖
npm install

# 启动开发服务器
npm run dev

# 运行物品栏系统测试
open http://localhost:5173/test-inventory.html

# 运行集成测试
open http://localhost:5173/test-inventory-integration.html
```

### 添加测试

- 为新功能添加相应的测试用例
- 确保测试覆盖主要的使用场景
- 测试文件放在 `src/tests/` 目录下

## 📋 提交规范

### 提交信息格式

使用以下格式编写提交信息：

```
<类型>(<范围>): <描述>

<详细说明>

<footer>
```

**类型**:
- `feat`: 新功能
- `fix`: bug修复
- `docs`: 文档更新
- `style`: 代码格式化（不影响功能）
- `refactor`: 代码重构
- `test`: 测试相关
- `chore`: 构建过程或辅助工具的变动

**范围**:
- `inventory`: 物品栏系统
- `world`: 世界生成
- `player`: 玩家系统
- `ui`: 用户界面
- `engine`: 游戏引擎
- `storage`: 存储系统

**示例**:
```
feat(inventory): 添加物品拖拽功能

- 实现物品槽位间的拖拽交换
- 支持快捷栏与背包间的物品移动
- 添加拖拽视觉反馈效果

Closes #123
```

## 🔄 Pull Request流程

1. **确保你的分支是最新的**:
```bash
git checkout main
git pull upstream main
git checkout your-feature-branch
git rebase main
```

2. **运行测试并确保通过**:
```bash
npm run lint
npm run test
```

3. **提交Pull Request**:
   - 在GitHub上创建Pull Request
   - 填写详细的PR描述
   - 关联相关的Issues

4. **代码审查**:
   - 等待项目维护者审查
   - 根据反馈进行修改
   - 保持讨论的礼貌和建设性

## 🎯 优先级指南

我们特别欢迎以下类型的贡献：

### 高优先级
- 🐛 Bug修复
- 📖 文档完善
- 🧪 测试用例添加
- ♿ 可访问性改进

### 中优先级
- ✨ 新游戏功能
- 🎨 UI/UX改进
- ⚡ 性能优化
- 🔧 开发工具改进

### 低优先级
- 🎮 游戏内容扩展
- 🌐 国际化支持
- 📱 移动端优化

## 🛠️ 开发技巧

### 调试技巧

1. **使用浏览器开发工具**:
   - F12打开开发者工具
   - 使用Console查看游戏日志
   - 使用Performance分析性能问题

2. **游戏内调试**:
   - F3键切换调试信息
   - 使用调试控制台查看游戏状态
   - 利用测试页面验证功能

3. **代码调试**:
   - 在关键位置添加console.log
   - 使用debugger语句设置断点
   - 利用React DevTools检查组件状态

### 常见问题

**Q: 游戏启动失败怎么办？**
A: 检查控制台错误信息，确保Node.js版本>=16，依赖安装完整。

**Q: 如何添加新的物品类型？**
A: 在`src/config/ItemConfig.js`中定义物品属性，在相关UI组件中添加图标映射。

**Q: 性能问题如何排查？**
A: 使用浏览器Performance工具，检查游戏循环效率，优化渲染和计算逻辑。

## 🤝 社区

- **讨论**: 使用GitHub Discussions进行技术讨论
- **问题**: 通过GitHub Issues报告问题
- **建议**: 欢迎提出改进建议和新功能请求

## 📜 行为准则

请遵循以下行为准则：

- 尊重所有贡献者
- 保持友好和专业的交流
- 接受建设性的批评
- 专注于对社区最有利的事情

## 🙏 感谢

感谢所有为Minecraft2D项目做出贡献的开发者！你们的努力让这个项目变得更好。

---

如果你有任何问题，请随时在Issues中提出或联系项目维护者。

Happy coding! 🎮✨