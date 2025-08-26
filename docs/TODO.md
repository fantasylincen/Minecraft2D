# TODO List - 待办事项

## 🔄 待处理问题


~~2. 游戏配置界面中, 给出一个“开发者选项”的选项卡, 把刚才这个开关放到这个开发者选项中.~~
3. 玩家可放置方块的位置取: 与射线相交的第一个方块的位置作为基准点, 基准点往射线方向会退1个像素. 会退后的这个基准点所在的方格, 即为区块可放置的位置, 在射线的最大长度上, 如果没有相交区块, 则不可放置区块


~~1.方块的放置点如果与玩家相碰撞, 也可以进行放置, 放置后, 方块会把玩家挤出~~
- [x] **已修复** - 2025年8月26日
- 修复了方块放置位置与玩家身体碰撞检测逻辑
- 现在使用精确的矩形碰撞检测来防止方块放置在玩家身体内部

- [TODO_Finished.md](TODO_Finished.md) - 已完成的任务列表
- [TODO_Completed.md](TODO_Completed.md) - 最近完成的任务详情
- [ITERATIVE_DEVELOPMENT_PLAN.md](ITERATIVE_DEVELOPMENT_PLAN.md) - 未来迭代开发计划

## ℹ️ 备注
- 已完成的问题记录在 `TODO_Finished.md` 和 `TODO_Completed.md` 文件中
- 技术细节和解决方案参见相关文档
- 未来功能开发请参考 `ITERATIVE_DEVELOPMENT_PLAN.md` 文件