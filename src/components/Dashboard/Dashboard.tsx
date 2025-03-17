import React, { useState, useEffect } from 'react';
import { ProgressBar } from '@progress/kendo-react-progressbars';
import { Button } from '@progress/kendo-react-buttons';
import { Switch } from '@progress/kendo-react-inputs';
import { Tooltip } from '@progress/kendo-react-tooltip';
import { Notification, NotificationGroup } from '@progress/kendo-react-notification';
import TaskTable from '../Tasks/TaskTable';
import TaskForm from '../Tasks/TaskForm';
import ProductivityCharts from '../Analytics/ProductivityCharts';
import EnhancedProductivityCharts from '../Analytics/EnhancedProductivityCharts';
import PomodoroTimer from '../Tasks/PomodoroTimer';
import TaskCalendar from '../Tasks/TaskCalendar';
import TaskInsights from '../Tasks/TaskInsights';
import { 
  CustomModal, 
  TabPanel, 
  Tab,
  NotificationSystem
} from '../common';
import { Task } from '../../models/Task';
import { TaskService } from '../../services/TaskService';
import { AIService } from '../../services/AIService';
import './Dashboard.css';

const Dashboard: React.FC = () => {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [showTaskForm, setShowTaskForm] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [tabSelected, setTabSelected] = useState(0);
  const [notifications, setNotifications] = useState<Array<{
    id: string;
    message: string;
    type: 'success' | 'error' | 'info' | 'warning';
    isVisible: boolean;
  }>>([]);
  const [showScheduleSuggestion, setShowScheduleSuggestion] = useState(false);
  const [scheduleSuggestion, setScheduleSuggestion] = useState<any>(null);
  const [isLoadingSchedule, setIsLoadingSchedule] = useState(false);

  useEffect(() => {
    loadTasks();
  }, []);

  const loadTasks = () => {
    const loadedTasks = TaskService.getTasks();
    setTasks(loadedTasks);
  };

  const showNotification = (message: string, type: 'success' | 'error' | 'info' | 'warning') => {
    const id = Date.now().toString();
    setNotifications(prev => [
      ...prev,
      {
        id,
        message,
        type,
        isVisible: true
      }
    ]);
    
    setTimeout(() => {
      handleCloseNotification(id);
    }, 5000);
  };

  const handleCloseNotification = (id: string) => {
    setNotifications(prev => 
      prev.map(notification => 
        notification.id === id 
          ? { ...notification, isVisible: false } 
          : notification
      )
    );
  };

  const handleCreateTask = () => {
    setSelectedTask(null);
    setIsCreating(true);
    setShowTaskForm(true);
  };

  const handleEditTask = (task: Task) => {
    setSelectedTask(task);
    setIsCreating(false);
    setShowTaskForm(true);
  };

  const handleTaskSubmit = (taskData: Omit<Task, 'id' | 'createdAt' | 'updatedAt'>) => {
    try {
      if (isCreating) {
        const newTask = TaskService.addTask(taskData);
        setTasks([...tasks, newTask]);
        showNotification('Task created successfully!', 'success');
      } else if (selectedTask) {
        const updatedTask = TaskService.updateTask(selectedTask.id, taskData);
        if (updatedTask) {
          setTasks(tasks.map(t => (t.id === updatedTask.id ? updatedTask : t)));
          showNotification('Task updated successfully!', 'success');
        }
      }
      setShowTaskForm(false);
    } catch (error) {
      console.error('Error saving task:', error);
      showNotification('Error saving task. Please try again.', 'error');
    }
  };

  const handleUpdateTask = (id: string, updates: Partial<Task>) => {
    try {
      const updatedTask = TaskService.updateTask(id, updates);
      if (updatedTask) {
        setTasks(tasks.map(t => (t.id === updatedTask.id ? updatedTask : t)));
      }
    } catch (error) {
      console.error('Error updating task:', error);
      showNotification('Error updating task. Please try again.', 'error');
    }
  };

  const handleDeleteTask = (id: string) => {
    try {
      const success = TaskService.deleteTask(id);
      if (success) {
        setTasks(tasks.filter(t => t.id !== id));
        showNotification('Task deleted successfully!', 'success');
      }
    } catch (error) {
      console.error('Error deleting task:', error);
      showNotification('Error deleting task. Please try again.', 'error');
    }
  };

  const generateOptimalSchedule = async () => {
    const pendingTasks = tasks.filter(t => t.status !== 'completed');
    if (pendingTasks.length === 0) {
      showNotification('No pending tasks to schedule.', 'info');
      return;
    }

    setIsLoadingSchedule(true);
    try {
      const suggestion = await AIService.suggestOptimalSchedule(pendingTasks);
      setScheduleSuggestion(suggestion);
      setShowScheduleSuggestion(true);
    } catch (error) {
      console.error('Error generating schedule:', error);
      showNotification('Error generating schedule. Please try again.', 'error');
    } finally {
      setIsLoadingSchedule(false);
    }
  };

  const totalTasks = tasks.length;
  const completedTasks = tasks.filter(t => t.status === 'completed').length;
  const completionRate = totalTasks > 0 ? (completedTasks / totalTasks) * 100 : 0;
  const urgentTasks = tasks.filter(t => t.priority === 'urgent' && t.status !== 'completed').length;
  const overdueTasks = tasks.filter(t => {
    if (!t.dueDate || t.status === 'completed') return false;
    return new Date(t.dueDate) < new Date();
  }).length;

  const handleTimeLogged = (taskId: string, minutes: number) => {
    const task = tasks.find(t => t.id === taskId);
    if (!task) return;
    
    const updatedTask = {
      ...task,
      actualTime: (task.actualTime || 0) + minutes
    };
    
    handleUpdateTask(taskId, updatedTask);
    showNotification(`Logged ${minutes} minutes for task: ${task.title}`, 'success');
  };

  const renderNotifications = () => {
    return (
      <NotificationGroup
        style={{
          position: 'fixed',
          right: '20px',
          top: '20px',
          zIndex: 1000
        }}
      >
        {notifications.map(notification => (
          notification.isVisible && (
            <Notification
              key={notification.id}
              type={{ style: notification.type, icon: true }}
              closable={true}
              onClose={() => handleCloseNotification(notification.id)}
              style={{ margin: '10px' }}
            >
              <span>{notification.message}</span>
            </Notification>
          )
        ))}
      </NotificationGroup>
    );
  };

  return (
    <div className="dashboard">
      {renderNotifications()}
      
      <header className="dashboard-header">
        <h1>AI-Powered Task Management</h1>
        <div className="dashboard-actions">
          <Button
            themeColor="primary"
            onClick={handleCreateTask}
            icon="plus"
          >
            Create New Task
          </Button>
          <Button
            onClick={generateOptimalSchedule}
            disabled={isLoadingSchedule}
            themeColor="info"
            icon="calendar"
          >
            {isLoadingSchedule ? 'Generating...' : 'AI Schedule Suggestions'}
          </Button>
        </div>
      </header>
      
      <div className="dashboard-stats">
        <div className="stat-item">
          <h3>Total Tasks</h3>
          <div className="stat-value">{totalTasks}</div>
        </div>
        <div className="stat-item">
          <h3>
            Completion Rate
            <Tooltip anchorElement="target" position="right">
              <i className="info-icon" title="Percentage of completed tasks out of all tasks">ⓘ</i>
            </Tooltip>
          </h3>
          <div className="stat-progress">
            <ProgressBar value={completionRate} max={100} />
            <div className="stat-percentage">
              {completionRate.toFixed(1)}%
            </div>
          </div>
        </div>
        <div className="stat-item">
          <h3>
            Urgent Tasks
            <Tooltip anchorElement="target" position="right">
              <i className="info-icon" title="Number of tasks marked as urgent priority">ⓘ</i>
            </Tooltip>
          </h3>
          <div className="stat-value" style={{ color: urgentTasks > 0 ? 'var(--danger-color)' : 'inherit' }}>
            {urgentTasks}
          </div>
        </div>
        <div className="stat-item">
          <h3>
            Overdue Tasks
            <Tooltip anchorElement="target" position="right">
              <i className="info-icon" title="Tasks with due dates in the past">ⓘ</i>
            </Tooltip>
          </h3>
          <div className="stat-value" style={{ color: overdueTasks > 0 ? 'var(--danger-color)' : 'inherit' }}>
            {overdueTasks}
          </div>
        </div>
      </div>
      
      <div className="dashboard-main-content">
        <TabPanel
          selected={tabSelected}
          onSelect={(index) => setTabSelected(index)}
          style={{ minHeight: '500px' }}
        >
          <Tab title="My Tasks">
            <TaskTable
              tasks={tasks}
              onTaskSelect={handleEditTask}
              onTaskUpdate={handleUpdateTask}
              onTaskDelete={handleDeleteTask}
            />
          </Tab>
          
          <Tab title="Calendar">
            <TaskCalendar
              tasks={tasks}
              onTaskSelect={handleEditTask}
            />
          </Tab>
          
          <Tab title="Analytics">
            <EnhancedProductivityCharts tasks={tasks} />
          </Tab>
        </TabPanel>
        
        <div className="dashboard-tools">
          <div className="dashboard-tools-column">
            <TaskInsights tasks={tasks} onTaskSelect={handleEditTask} />
          </div>
          
          <div className="dashboard-tools-column">
            <div className="pomodoro-card">
              <div className="pomodoro-card-title">
                <h3>Pomodoro Timer</h3>
                <Tooltip anchorElement="target" position="left">
                  <i className="info-icon" title="Focus timer to boost productivity using the Pomodoro technique">ⓘ</i>
                </Tooltip>
              </div>
              <PomodoroTimer tasks={tasks} onTimeLogged={handleTimeLogged} />
            </div>
          </div>
        </div>
      </div>
      
      {showTaskForm && (
        <TaskForm
          task={selectedTask || undefined}
          onSubmit={handleTaskSubmit}
          onCancel={() => setShowTaskForm(false)}
        />
      )}
      
      {showScheduleSuggestion && scheduleSuggestion && (
        <CustomModal 
          title="AI Suggested Schedule" 
          onClose={() => setShowScheduleSuggestion(false)}
          width={700}
          footer={
            <Button onClick={() => setShowScheduleSuggestion(false)}>Close</Button>
          }
        >
          <div style={{ maxHeight: '500px', overflow: 'auto' }}>
            <h3>Recommended Task Sequence</h3>
            <ol>
              {scheduleSuggestion.recommendedSequence.map((taskId: string) => {
                const task = tasks.find(t => t.id === taskId);
                return task ? (
                  <li key={task.id}>
                    <strong>{task.title}</strong> ({task.priority} priority)
                    {task.dueDate && (
                      <span> - Due {new Date(task.dueDate).toLocaleDateString()}</span>
                    )}
                  </li>
                ) : null;
              })}
            </ol>
            
            <h3>Daily Plan</h3>
            {Object.keys(scheduleSuggestion.dailyPlan).map(date => (
              <div key={date} style={{ marginBottom: '15px' }}>
                <h4>{new Date(date).toLocaleDateString(undefined, { 
                  weekday: 'long', 
                  year: 'numeric', 
                  month: 'long', 
                  day: 'numeric' 
                })}</h4>
                <ul>
                  {scheduleSuggestion.dailyPlan[date].map((taskId: string) => {
                    const task = tasks.find(t => t.id === taskId);
                    return task ? (
                      <li key={task.id}>
                        <strong>{task.title}</strong> 
                        {task.estimatedTime && (
                          <span> ({task.estimatedTime} mins)</span>
                        )}
                      </li>
                    ) : null;
                  })}
                </ul>
              </div>
            ))}
            
            <h3>Reasoning</h3>
            <p>{scheduleSuggestion.reasoning}</p>
          </div>
        </CustomModal>
      )}
    </div>
  );
};

export default Dashboard; 