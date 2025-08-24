import React, { useState, useEffect, useRef } from 'react';

/**
 * Debug Console Component
 * Author: Minecraft2D Development Team
 * 
 * Provides a game debug console for real-time debugging and game state inspection
 */
const DebugConsole = ({ gameEngine, isVisible, onToggleVisible, onSaveGame }) => {
  const [logs, setLogs] = useState([]);
  const [inputValue, setInputValue] = useState('');
  const [commandHistory, setCommandHistory] = useState([]);
  const [historyIndex, setHistoryIndex] = useState(-1);
  const logContainerRef = useRef(null);
  const inputRef = useRef(null);

  // Initialize console with welcome message
  useEffect(() => {
    addLog('=== Minecraft2D Debug Console ===', 'system');
    addLog('Type "help" for available commands', 'info');
  }, []);

  // Auto-scroll to bottom when new logs are added
  useEffect(() => {
    if (logContainerRef.current) {
      logContainerRef.current.scrollTop = logContainerRef.current.scrollHeight;
    }
  }, [logs]);

  // Focus input when console becomes visible
  useEffect(() => {
    if (isVisible && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isVisible]);

  /**
   * Add a log entry to the console
   * @param {string} message - The log message
   * @param {string} type - Log type (info, error, warning, success, system)
   */
  const addLog = (message, type = 'info') => {
    const timestamp = new Date().toLocaleTimeString();
    const newLog = {
      id: Date.now() + Math.random(),
      message,
      type,
      timestamp
    };
    setLogs(prevLogs => [...prevLogs, newLog]);
  };

  /**
   * Execute debug command
   * @param {string} command - Command string to execute
   */
  const executeCommand = (command) => {
    const trimmedCommand = command.trim();
    if (!trimmedCommand) return;

    // Add command to logs
    addLog(`> ${trimmedCommand}`, 'command');

    // Add to command history
    setCommandHistory(prev => {
      const newHistory = [...prev, trimmedCommand];
      return newHistory.slice(-50); // Keep last 50 commands
    });

    // Parse and execute command
    const [cmd, ...args] = trimmedCommand.toLowerCase().split(' ');
    
    try {
      switch (cmd) {
        case 'help':
          showHelp();
          break;
        
        case 'clear':
          clearLogs();
          break;
        
        case 'fps':
          showFPS();
          break;
        
        case 'player':
          showPlayerInfo();
          break;
        
        case 'camera':
          showCameraInfo();
          break;
        
        case 'toggle':
          handleToggleCommand(args[0]);
          break;
        
        case 'teleport':
        case 'tp':
          handleTeleportCommand(args);
          break;
        
        case 'regenerate':
          handleRegenerateWorld();
          break;
        
        case 'save':
          handleSaveGame();
          break;
        
        case 'config':
          showConfig();
          break;
        
        default:
          addLog(`Unknown command: ${cmd}. Type "help" for available commands.`, 'error');
      }
    } catch (error) {
      addLog(`Error executing command: ${error.message}`, 'error');
    }
  };

  const showHelp = () => {
    const helpText = [
      'Available Commands:',
      '• help - Show this help message',
      '• clear - Clear console logs',
      '• fps - Show current FPS and performance stats',
      '• player - Show player information',
      '• camera - Show camera information',
      '• toggle <setting> - Toggle game settings (debug, grid, particles)',
      '• tp <x> <y> - Teleport player to coordinates',
      '• regenerate - Regenerate world terrain',
      '• save - Save game state',
      '• config - Show current game configuration'
    ];
    
    helpText.forEach(line => addLog(line, 'info'));
  };

  const clearLogs = () => {
    setLogs([]);
    addLog('Console cleared', 'system');
  };

  const showFPS = () => {
    if (gameEngine?.systems?.renderer) {
      const stats = gameEngine.systems.renderer.getStats();
      addLog(`FPS: ${stats.fps}`, 'info');
      addLog(`Draw Calls: ${stats.drawCalls}`, 'info');
      addLog(`Blocks Rendered: ${stats.blocksRendered}`, 'info');
    } else {
      addLog('Renderer not available', 'error');
    }
  };

  const showPlayerInfo = () => {
    if (gameEngine?.systems?.player) {
      const player = gameEngine.systems.player;
      const pos = player.getPosition();
      const status = player.getStatus();
      
      addLog(`Player Position: (${pos.x.toFixed(2)}, ${pos.y.toFixed(2)})`, 'info');
      addLog(`Flying: ${status.isFlying ? 'Yes' : 'No'}`, 'info');
      addLog(`On Ground: ${player.physics.onGround ? 'Yes' : 'No'}`, 'info');
      if (status.isFlying) {
        addLog(`Flight Speed: ${status.flySpeed}%`, 'info');
      }
    } else {
      addLog('Player not available', 'error');
    }
  };

  const showCameraInfo = () => {
    if (gameEngine?.systems?.camera) {
      const camera = gameEngine.systems.camera;
      addLog(`Camera Position: (${camera.position.x.toFixed(2)}, ${camera.position.y.toFixed(2)})`, 'info');
      addLog(`Zoom Level: ${camera.zoom.toFixed(2)}`, 'info');
    } else {
      addLog('Camera not available', 'error');
    }
  };

  const handleToggleCommand = (setting) => {
    if (!gameEngine?.systems?.renderer) {
      addLog('Renderer not available', 'error');
      return;
    }

    const renderer = gameEngine.systems.renderer;
    
    switch (setting) {
      case 'debug':
        renderer.toggleDebugInfo();
        addLog(`Debug info ${renderer.settings.showDebugInfo ? 'enabled' : 'disabled'}`, 'success');
        break;
      
      case 'grid':
        renderer.toggleGrid();
        addLog(`Grid ${renderer.settings.showGrid ? 'enabled' : 'disabled'}`, 'success');
        break;
      
      case 'particles':
        renderer.settings.enableParticles = !renderer.settings.enableParticles;
        addLog(`Particles ${renderer.settings.enableParticles ? 'enabled' : 'disabled'}`, 'success');
        break;
      
      default:
        addLog(`Unknown setting: ${setting}. Available: debug, grid, particles`, 'error');
    }
  };

  const handleTeleportCommand = (args) => {
    if (args.length < 2) {
      addLog('Usage: tp <x> <y>', 'error');
      return;
    }

    const x = parseFloat(args[0]);
    const y = parseFloat(args[1]);

    if (isNaN(x) || isNaN(y)) {
      addLog('Invalid coordinates. Use numbers only.', 'error');
      return;
    }

    if (gameEngine?.systems?.player) {
      gameEngine.systems.player.setPosition(x, y);
      addLog(`Teleported to (${x}, ${y})`, 'success');
    } else {
      addLog('Player not available', 'error');
    }
  };

  const handleRegenerateWorld = () => {
    if (gameEngine?.systems?.terrainGenerator) {
      gameEngine.systems.terrainGenerator.regenerate();
      addLog('World regenerated', 'success');
    } else {
      addLog('Terrain generator not available', 'error');
    }
  };

  const handleSaveGame = () => {
    try {
      if (onSaveGame) {
        onSaveGame();
        addLog('Game saved successfully', 'success');
      } else {
        addLog('Save function not available', 'error');
      }
    } catch (error) {
      addLog(`Save failed: ${error.message}`, 'error');
    }
  };

  const showConfig = () => {
    if (gameEngine?.systems?.renderer) {
      const settings = gameEngine.systems.renderer.settings;
      addLog('Current Configuration:', 'info');
      addLog(`• Debug Info: ${settings.showDebugInfo ? 'On' : 'Off'}`, 'info');
      addLog(`• Grid: ${settings.showGrid ? 'On' : 'Off'}`, 'info');
      addLog(`• Particles: ${settings.enableParticles ? 'On' : 'Off'}`, 'info');
    } else {
      addLog('Configuration not available', 'error');
    }
  };

  const handleInputKeyDown = (e) => {
    if (e.key === 'Enter') {
      executeCommand(inputValue);
      setInputValue('');
      setHistoryIndex(-1);
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      if (commandHistory.length > 0) {
        const newIndex = historyIndex === -1 ? commandHistory.length - 1 : Math.max(0, historyIndex - 1);
        setHistoryIndex(newIndex);
        setInputValue(commandHistory[newIndex]);
      }
    } else if (e.key === 'ArrowDown') {
      e.preventDefault();
      if (historyIndex !== -1) {
        const newIndex = historyIndex + 1;
        if (newIndex >= commandHistory.length) {
          setHistoryIndex(-1);
          setInputValue('');
        } else {
          setHistoryIndex(newIndex);
          setInputValue(commandHistory[newIndex]);
        }
      }
    }
  };

  const getLogClassName = (type) => {
    switch (type) {
      case 'error': return 'debug-log-error';
      case 'warning': return 'debug-log-warning';
      case 'success': return 'debug-log-success';
      case 'system': return 'debug-log-system';
      case 'command': return 'debug-log-command';
      default: return 'debug-log-info';
    }
  };

  if (!isVisible) return null;

  return (
    <div className="debug-console">
      <div className="debug-console-header">
        <span className="debug-console-title">🔧 Debug Console</span>
        <button 
          className="debug-console-close"
          onClick={onToggleVisible}
          title="Close Console (F3)"
        >
          ✖
        </button>
      </div>
      
      <div className="debug-console-logs" ref={logContainerRef}>
        {logs.map(log => (
          <div key={log.id} className={`debug-log ${getLogClassName(log.type)}`}>
            <span className="debug-log-timestamp">[{log.timestamp}]</span>
            <span className="debug-log-message">{log.message}</span>
          </div>
        ))}
      </div>
      
      <div className="debug-console-input-container">
        <span className="debug-console-prompt">{'>'}</span>
        <input
          ref={inputRef}
          type="text"
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
          onKeyDown={handleInputKeyDown}
          className="debug-console-input"
          placeholder="Enter debug command..."
          autoComplete="off"
        />
      </div>
    </div>
  );
};

export default DebugConsole;