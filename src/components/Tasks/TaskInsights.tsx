import React from 'react';
import { Task } from '../../models/Task';
import { ProgressBar } from '@progress/kendo-react-progressbars';
import { Tooltip } from '@progress/kendo-react-tooltip';
import { Button } from '@progress/kendo-react-buttons';
import './TaskInsights.css';

interface TaskInsightsProps {
  tasks: Task[];
  onTaskSelect: (task: Task) => void;
}

const TaskInsights: React.FC<TaskInsightsProps> = ({ tasks, onTaskSelect }) => {
  const upcomingDeadlines = tasks
    .filter(task => 
      task.status !== 'completed' && 
      task.dueDate && 
      new Date(task.dueDate) > new Date() &&
      new Date(task.dueDate) < new Date(Date.now() + 3 * 24 * 60 * 60 * 1000)
    )
    .sort((a, b) => 
      new Date(a.dueDate!).getTime() - new Date(b.dueDate!).getTime()
    )
    .slice(0, 3);

  const highPriorityTasks = tasks
    .filter(task => 
      (task.priority === 'high' || task.priority === 'urgent') && 
      task.status !== 'completed'
    )
    .slice(0, 3);

  const timeByCategory = tasks.reduce((acc: Record<string, number>, task) => {
    if (task.category && task.actualTime) {
      if (!acc[task.category]) {
        acc[task.category] = 0;
      }
      acc[task.category] += task.actualTime;
    }
    return acc;
  }, {});

  const topCategories = Object.entries(timeByCategory)
    .sort(([, timeA], [, timeB]) => timeB - timeA)
    .slice(0, 3);

  const formatTime = (minutes: number): string => {
    if (minutes < 60) return `${minutes}m`;
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return mins > 0 ? `${hours}h ${mins}m` : `${hours}h`;
  };

  const getDaysUntil = (date: Date): string => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const dueDate = new Date(date);
    dueDate.setHours(0, 0, 0, 0);
    
    const diffTime = dueDate.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays === 0) return 'Today';
    if (diffDays === 1) return 'Tomorrow';
    return `In ${diffDays} days`;
  };

  return (
    <div className="task-insights">
      <section className="insight-section">
        <h3>
          <span>Upcoming Deadlines</span>
          <Tooltip anchorElement="target" position="right">
            <i className="info-icon" title="Tasks due in the next 3 days">ⓘ</i>
          </Tooltip>
        </h3>
        {upcomingDeadlines.length > 0 ? (
          <ul className="insight-list">
            {upcomingDeadlines.map(task => (
              <li 
                key={task.id} 
                className={`insight-item ${task.priority}`} 
                onClick={() => onTaskSelect(task)}
              >
                <div className="insight-title">{task.title}</div>
                <div className="insight-meta">
                  <span className={`priority-indicator ${task.priority}`}>
                    {task.priority}
                  </span>
                  <span className="due-date">
                    {getDaysUntil(new Date(task.dueDate!))}
                  </span>
                </div>
              </li>
            ))}
          </ul>
        ) : (
          <p className="insight-empty">No upcoming deadlines in the next 3 days.</p>
        )}
      </section>

      <section className="insight-section">
        <h3>
          <span>High Priority Tasks</span>
          <Tooltip anchorElement="target" position="right">
            <i className="info-icon" title="Urgent and high priority pending tasks">ⓘ</i>
          </Tooltip>
        </h3>
        {highPriorityTasks.length > 0 ? (
          <ul className="insight-list">
            {highPriorityTasks.map(task => (
              <li 
                key={task.id} 
                className={`insight-item ${task.priority}`} 
                onClick={() => onTaskSelect(task)}
              >
                <div className="insight-title">{task.title}</div>
                <div className="insight-meta">
                  <span className={`priority-indicator ${task.priority}`}>
                    {task.priority}
                  </span>
                  {task.dueDate && (
                    <span className="due-date">
                      {getDaysUntil(new Date(task.dueDate))}
                    </span>
                  )}
                </div>
                {task.completionPercentage !== undefined && (
                  <div className="insight-progress">
                    <ProgressBar value={task.completionPercentage} max={100} />
                    <span className="progress-text">{task.completionPercentage}%</span>
                  </div>
                )}
              </li>
            ))}
          </ul>
        ) : (
          <p className="insight-empty">No high priority tasks.</p>
        )}
      </section>

      <section className="insight-section">
        <h3>
          <span>Time Spent by Category</span>
          <Tooltip anchorElement="target" position="right">
            <i className="info-icon" title="Categories where you've spent the most time">ⓘ</i>
          </Tooltip>
        </h3>
        {topCategories.length > 0 ? (
          <ul className="insight-list category-list">
            {topCategories.map(([category, time], index) => (
              <li key={category} className="category-item">
                <div className="category-name">
                  <span>{category}</span>
                  <span className="category-ranking">#{index + 1}</span>
                </div>
                <div className="category-time">{formatTime(time)}</div>
                <div className="category-bar">
                  <div 
                    className="category-bar-fill"
                    style={{ 
                      width: `${Math.min(100, (time / Math.max(...Object.values(timeByCategory))) * 100)}%`
                    }}
                  ></div>
                </div>
              </li>
            ))}
          </ul>
        ) : (
          <p className="insight-empty">No time tracking data available.</p>
        )}
      </section>
    </div>
  );
};

export default TaskInsights; 