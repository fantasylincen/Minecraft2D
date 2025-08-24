/**
 * 测试脚本：验证玩家朝向跟随鼠标功能
 * 
 * 这个脚本将创建一个简单的测试环境来验证玩家朝向是否正确跟随鼠标位置
 */

// 模拟玩家类的部分功能
class TestPlayer {
  constructor() {
    this.position = { x: 0, y: 0 };
    this.facing = {
      angle: 0,
      directionX: 1,
      directionY: 0
    };
    this.mousePosition = { x: 0, y: 0 };
  }

  setPosition(x, y) {
    this.position.x = x;
    this.position.y = y;
  }

  setMousePosition(x, y) {
    this.mousePosition.x = x;
    this.mousePosition.y = y;
    this.updateFacing();
  }

  updateFacing() {
    // 根据鼠标位置更新朝向
    const deltaX = this.mousePosition.x - this.position.x;
    const deltaY = this.mousePosition.y - this.position.y;
    
    // 只有当鼠标位置有明显变化时才更新朝向
    if (Math.abs(deltaX) > 0.1 || Math.abs(deltaY) > 0.1) {
      // 计算朝向角度
      this.facing.angle = Math.atan2(deltaY, deltaX);
      this.facing.directionX = Math.cos(this.facing.angle);
      this.facing.directionY = Math.sin(this.facing.angle);
    }
  }

  getFacing() {
    return { ...this.facing };
  }
}

// 测试函数
function runTests() {
  console.log("开始测试玩家朝向功能...");
  
  const player = new TestPlayer();
  
  // 测试1: 玩家在原点，鼠标在右上方
  player.setPosition(0, 0);
  player.setMousePosition(10, 10);
  const facing1 = player.getFacing();
  console.log("测试1 - 玩家(0,0), 鼠标(10,10):");
  console.log(`  角度: ${facing1.angle.toFixed(4)} 弧度 (${(facing1.angle * 180 / Math.PI).toFixed(2)} 度)`);
  console.log(`  方向向量: (${facing1.directionX.toFixed(4)}, ${facing1.directionY.toFixed(4)})`);
  
  // 测试2: 玩家在原点，鼠标在左下方
  player.setMousePosition(-10, -10);
  const facing2 = player.getFacing();
  console.log("测试2 - 玩家(0,0), 鼠标(-10,-10):");
  console.log(`  角度: ${facing2.angle.toFixed(4)} 弧度 (${(facing2.angle * 180 / Math.PI).toFixed(2)} 度)`);
  console.log(`  方向向量: (${facing2.directionX.toFixed(4)}, ${facing2.directionY.toFixed(4)})`);
  
  // 测试3: 玩家在(5,5)，鼠标在(15,5)
  player.setPosition(5, 5);
  player.setMousePosition(15, 5);
  const facing3 = player.getFacing();
  console.log("测试3 - 玩家(5,5), 鼠标(15,5):");
  console.log(`  角度: ${facing3.angle.toFixed(4)} 弧度 (${(facing3.angle * 180 / Math.PI).toFixed(2)} 度)`);
  console.log(`  方向向量: (${facing3.directionX.toFixed(4)}, ${facing3.directionY.toFixed(4)})`);
  
  console.log("测试完成!");
}

// 运行测试
runTests();