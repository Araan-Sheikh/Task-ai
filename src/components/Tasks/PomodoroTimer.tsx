import React, { useState, useEffect, useCallback } from 'react';
import { Button } from '@progress/kendo-react-buttons';
import { Slider, NumericTextBox } from '@progress/kendo-react-inputs';
import { Tooltip } from '@progress/kendo-react-tooltip';
import { RadioGroup } from '@progress/kendo-react-inputs';
import { ProgressBar } from '@progress/kendo-react-progressbars';
import { DropDownList } from '@progress/kendo-react-dropdowns';
import { Task } from '../../models/Task';
import './PomodoroTimer.css';

interface PomodoroTimerProps {
  tasks: Task[];
  onTimeLogged: (taskId: string, minutes: number) => void;
}

const PomodoroTimer: React.FC<PomodoroTimerProps> = ({ tasks, onTimeLogged }) => {
  const defaultPomodoro = 25 * 60;
  const defaultShortBreak = 5 * 60;
  const defaultLongBreak = 15 * 60;

  const [currentMode, setCurrentMode] = useState<'pomodoro' | 'shortBreak' | 'longBreak'>('pomodoro');
  const [timeLeft, setTimeLeft] = useState(defaultPomodoro);
  const [isRunning, setIsRunning] = useState(false);
  const [currentTask, setCurrentTask] = useState<string | null>(null);
  const [pomodoroCount, setPomodoroCount] = useState(0);
  const [settings, setSettings] = useState({
    pomodoro: 25,
    shortBreak: 5,
    longBreak: 15,
    autoStartBreaks: false,
    autoStartPomodoros: false,
    longBreakInterval: 4
  });
  const [showSettings, setShowSettings] = useState(false);

  const activeTasks = tasks.filter(task => 
    task.status !== 'completed' && task.status !== 'postponed'
  );
  
  const taskOptions = activeTasks.map(task => ({
    text: task.title,
    value: task.id,
    priority: task.priority
  }));

  const allTaskOptions = [
    { text: "Select a task...", value: null, priority: "medium" },
    ...taskOptions
  ];

  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const calculateProgress = (): number => {
    let totalTime;
    switch (currentMode) {
      case 'pomodoro':
        totalTime = settings.pomodoro * 60;
        break;
      case 'shortBreak':
        totalTime = settings.shortBreak * 60;
        break;
      case 'longBreak':
        totalTime = settings.longBreak * 60;
        break;
    }
    return ((totalTime - timeLeft) / totalTime) * 100;
  };

  useEffect(() => {
    let interval: NodeJS.Timeout | null = null;

    if (isRunning && timeLeft > 0) {
      interval = setInterval(() => {
        setTimeLeft(prevTime => prevTime - 1);
      }, 1000);
    } else if (isRunning && timeLeft === 0) {
      if (currentMode === 'pomodoro') {
        if (currentTask) {
          onTimeLogged(currentTask, settings.pomodoro);
        }
        
        const newCount = pomodoroCount + 1;
        setPomodoroCount(newCount);
        
        if (newCount % settings.longBreakInterval === 0) {
          switchMode('longBreak');
        } else {
          switchMode('shortBreak');
        }
      } else {
        switchMode('pomodoro');
      }
    }

    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isRunning, timeLeft, currentMode, currentTask, pomodoroCount, settings, onTimeLogged]);

  const switchMode = useCallback((mode: 'pomodoro' | 'shortBreak' | 'longBreak') => {
    setIsRunning(false);
    setCurrentMode(mode);
    
    switch (mode) {
      case 'pomodoro':
        setTimeLeft(settings.pomodoro * 60);
        if (settings.autoStartPomodoros) {
          setIsRunning(true);
        }
        break;
      case 'shortBreak':
        setTimeLeft(settings.shortBreak * 60);
        if (settings.autoStartBreaks) {
          setIsRunning(true);
        }
        break;
      case 'longBreak':
        setTimeLeft(settings.longBreak * 60);
        if (settings.autoStartBreaks) {
          setIsRunning(true);
        }
        break;
    }
  }, [settings]);

  const toggleTimer = () => {
    setIsRunning(!isRunning);
  };

  const resetTimer = () => {
    setIsRunning(false);
    switchMode(currentMode);
  };

  const handleSettingChange = (field: string, value: any) => {
    setSettings(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const applySettings = () => {
    setShowSettings(false);
    resetTimer();
  };

  const getBackgroundColor = () => {
    switch (currentMode) {
      case 'pomodoro': return 'var(--primary-color)';
      case 'shortBreak': return 'var(--success-color)';
      case 'longBreak': return 'var(--info-color)';
    }
  };

  return (
    <div className="pomodoro-container">
      <div className="pomodoro-timer" style={{ backgroundColor: getBackgroundColor() }}>
        <div className="timer-mode-selector">
          <Button 
            togglable={true} 
            selected={currentMode === 'pomodoro'} 
            onClick={() => switchMode('pomodoro')}
          >
            Pomodoro
          </Button>
          <Button 
            togglable={true} 
            selected={currentMode === 'shortBreak'} 
            onClick={() => switchMode('shortBreak')}
          >
            Short Break
          </Button>
          <Button 
            togglable={true} 
            selected={currentMode === 'longBreak'} 
            onClick={() => switchMode('longBreak')}
          >
            Long Break
          </Button>
        </div>

        <div className="timer-display">
          <h2>{formatTime(timeLeft)}</h2>
          <ProgressBar value={calculateProgress()} />
        </div>

        <div className="timer-task-selector">
          <label>Current Task:</label>
          <DropDownList
            data={allTaskOptions}
            textField="text"
            dataItemKey="value"
            value={allTaskOptions.find(t => t.value === currentTask) || allTaskOptions[0]}
            onChange={(e) => setCurrentTask(e.value?.value || null)}
            disabled={isRunning}
            itemRender={(li, itemProps) => {
              if (!itemProps.dataItem.value) return li;
              
              const priority = itemProps.dataItem.priority;
              const priorityColors = {
                low: '#33cc33',
                medium: '#ffcc00', 
                high: '#ff9900',
                urgent: '#ff3300'
              };
              
              const newProps = {
                ...li.props,
                style: {
                  ...li.props.style,
                  borderLeft: `4px solid ${priorityColors[priority as keyof typeof priorityColors]}`,
                  paddingLeft: '8px'
                }
              };
              
              return React.cloneElement(li, newProps);
            }}
          />
        </div>

        <div className="timer-controls">
          <Button 
            themeColor={isRunning ? "warning" : "success"} 
            onClick={toggleTimer}
            disabled={!currentTask && currentMode === 'pomodoro'}
          >
            {isRunning ? 'Pause' : 'Start'}
          </Button>
          <Button onClick={resetTimer}>Reset</Button>
          <Button themeColor="info" onClick={() => setShowSettings(!showSettings)}>
            Settings
          </Button>
        </div>

        <div className="pomodoro-stats">
          <div className="stat">
            <label>Completed:</label>
            <span>{pomodoroCount}</span>
          </div>
        </div>
      </div>

      {showSettings && (
        <div className="pomodoro-settings">
          <h3>Timer Settings</h3>
          
          <div className="setting-group">
            <label>Pomodoro Duration (minutes):</label>
            <NumericTextBox
              value={settings.pomodoro}
              onChange={(e) => handleSettingChange('pomodoro', e.value)}
              min={1}
              max={60}
              step={1}
            />
          </div>
          
          <div className="setting-group">
            <label>Short Break Duration (minutes):</label>
            <NumericTextBox
              value={settings.shortBreak}
              onChange={(e) => handleSettingChange('shortBreak', e.value)}
              min={1}
              max={30}
              step={1}
            />
          </div>
          
          <div className="setting-group">
            <label>Long Break Duration (minutes):</label>
            <NumericTextBox
              value={settings.longBreak}
              onChange={(e) => handleSettingChange('longBreak', e.value)}
              min={1}
              max={60}
              step={1}
            />
          </div>
          
          <div className="setting-group">
            <label>Long Break After (pomodoros):</label>
            <NumericTextBox
              value={settings.longBreakInterval}
              onChange={(e) => handleSettingChange('longBreakInterval', e.value)}
              min={1}
              max={10}
              step={1}
            />
          </div>
          
          <div className="setting-group checkbox">
            <label>Auto-start Breaks:</label>
            <input
              type="checkbox"
              checked={settings.autoStartBreaks}
              onChange={(e) => handleSettingChange('autoStartBreaks', e.target.checked)}
            />
          </div>
          
          <div className="setting-group checkbox">
            <label>Auto-start Pomodoros:</label>
            <input
              type="checkbox"
              checked={settings.autoStartPomodoros}
              onChange={(e) => handleSettingChange('autoStartPomodoros', e.target.checked)}
            />
          </div>
          
          <div className="settings-actions">
            <Button themeColor="primary" onClick={applySettings}>Apply</Button>
            <Button onClick={() => setShowSettings(false)}>Cancel</Button>
          </div>
        </div>
      )}
    </div>
  );
};

export default PomodoroTimer; 