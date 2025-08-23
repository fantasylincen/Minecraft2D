# 开发服务器管理最佳实践

## 问题描述
AI在运行 `npm run dev` 命令后会阻塞，因为开发服务器是长期运行的进程。

## 解决方案

### 1. 正确的run_in_terminal用法

**错误用法（会阻塞）：**
```javascript
run_in_terminal({
  command: "cd /path/to/project && npm run dev",
  is_background: false  // ❌ 这会导致阻塞
})
```

**正确用法（不会阻塞）：**
```javascript
run_in_terminal({
  command: "cd /path/to/project && npm run dev",
  is_background: true  // ✅ 后台运行，不会阻塞
})
```

### 2. 服务器状态检查

启动服务器后，可以通过以下方式检查状态：

```javascript
// 检查服务器是否启动
run_in_terminal({
  command: "curl -s http://localhost:5173 >/dev/null && echo '✅ 服务器运行中' || echo '❌ 服务器未运行'",
  is_background: false
})

// 或者查看终端输出
get_terminal_output({
  terminal_id: "terminal_id_here"
})
```

### 3. 服务器管理脚本

使用专门的脚本来管理开发服务器：

```bash
# 启动服务器
npm run dev:start

# 检查状态  
npm run dev:status

# 停止服务器
npm run dev:stop
```

## 实施指南

### 对于AI助手：
1. **始终使用 `is_background: true`** 启动开发服务器
2. 使用 `get_terminal_output` 检查启动状态
3. 使用独立的命令检查服务器可用性
4. 提供清晰的状态反馈给用户

### 对于开发者：
1. 了解长期运行进程的特性
2. 使用专门的服务器管理命令
3. 监控服务器状态和日志

## 常用命令模板

```javascript
// 启动开发服务器（推荐）
{
  command: "cd /path/to/project && npm run dev",
  is_background: true,
  explanation: "启动开发服务器作为后台进程"
}

// 检查服务器状态
{
  command: "curl -s http://localhost:5173 >/dev/null && echo 'Server is running' || echo 'Server is not running'",
  is_background: false,
  explanation: "检查开发服务器是否正在运行"
}

// 查看服务器日志
{
  terminal_id: "server_terminal_id",
  explanation: "查看开发服务器的启动日志和状态"
}
```

## 记忆要点

⚠️ **重要规则：**
- `npm run dev`, `npm start`, `yarn dev` 等开发服务器命令必须使用 `is_background: true`
- 构建命令如 `npm run build` 可以使用 `is_background: false`
- 测试命令如 `npm test` 通常使用 `is_background: false`
- 长期运行的任务（服务器、监视器）使用 `is_background: true`
- 短期任务（构建、测试、安装）使用 `is_background: false`