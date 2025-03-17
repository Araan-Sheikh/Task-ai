import React, { useMemo } from 'react';
import { Task } from '../../models/Task';
import { Tooltip } from '@progress/kendo-react-tooltip';
import { Badge } from '@progress/kendo-react-indicators';
import { Button } from '@progress/kendo-react-buttons';
import './TaskInsights.css';

interface TaskInsightsProps {
  tasks: Task[];
  onTaskSelect: (task: Task) => void;
}

const TaskInsights: React.FC<TaskInsightsProps> = ({ tasks, onTaskSelect }) => {
  const upcomingTasks = useMemo(() => {
    return tasks
      .filter(task => 
        task.status !== 'completed' && 
        task.dueDate && 
        new Date(task.dueDate) > new Date()
      )
      .sort((a, b) => {
        const dateA = a.dueDate ? new Date(a.dueDate).getTime() : Infinity;
        const dateB = b.dueDate ? new Date(b.dueDate).getTime() : Infinity;
        return dateA - dateB;
      })
      .slice(0, 5);
  }, [tasks]);

  const recentlyCompletedTasks = useMemo(() => {
    return tasks
      .filter(task => task.status === 'completed')
      .sort((a, b) => {
        const dateA = a.updatedAt ? new Date(a.updatedAt).getTime() : 0;
        const dateB = b.updatedAt ? new Date(b.updatedAt).getTime() : 0;
        return dateB - dateA;
      })
      .slice(0, 3);
  }, [tasks]);

  const getPriorityColor = (priority: string) => {
    switch (priority.toLowerCase()) {
      case 'high':
      case 'urgent':
        return 'error';
      case 'medium':
        return 'warning';
      case 'low':
        return 'info';
      default:
        return 'info';
    }
  };

  const formatDate = (date: Date) => {
    const today = new Date();
    const tomorrow = new Date();
    tomorrow.setDate(today.getDate() + 1);
    
    if (date.toDateString() === today.toDateString()) {
      return 'Today';
    } else if (date.toDateString() === tomorrow.toDateString()) {
      return 'Tomorrow';
    } else {
      return date.toLocaleDateString(undefined, { 
        month: 'short', 
        day: 'numeric' 
      });
    }
  };

  const getDaysRemaining = (dueDate: Date) => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const due = new Date(dueDate);
    due.setHours(0, 0, 0, 0);
    
    const diffTime = due.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    return diffDays;
  };

  return (
    <div className="task-insights">
      <h3>
        Task Insights
        <Tooltip anchorElement="target" position="left">
          <i className="info-icon" title="Your upcoming tasks and recent completions">ⓘ</i>
        </Tooltip>
      </h3>
      
      <div className="insights-section">
        <h4>Upcoming Tasks</h4>
        {upcomingTasks.length > 0 ? (
          <ul className="insights-list">
            {upcomingTasks.map(task => {
              const daysRemaining = task.dueDate ? getDaysRemaining(task.dueDate) : null;
              
              return (
                <li key={task.id} className="insight-item" onClick={() => onTaskSelect(task)}>
                  <div className="insight-item-content">
                    <div className="insight-item-title">
                      <Badge themeColor={getPriorityColor(task.priority)} size="small" />
                      <span>{task.title}</span>
                    </div>
                    {task.dueDate && (
                      <div className="insight-item-date">
                        <span>{formatDate(task.dueDate)}</span>
                        {daysRemaining !== null && daysRemaining <= 2 && (
                          <span className="days-remaining urgent">
                            {daysRemaining === 0 ? 'Due today' : 
                             daysRemaining === 1 ? 'Due tomorrow' : 
                             `${daysRemaining} days left`}
                          </span>
                        )}
                        {daysRemaining !== null && daysRemaining > 2 && (
                          <span className="days-remaining">
                            {`${daysRemaining} days left`}
                          </span>
                        )}
                      </div>
                    )}
                  </div>
                </li>
              );
            })}
          </ul>
        ) : (
          <div className="empty-state">
            <p>No upcoming tasks</p>
          </div>
        )}
      </div>
      
      <div className="insights-section">
        <h4>Recently Completed</h4>
        {recentlyCompletedTasks.length > 0 ? (
          <ul className="insights-list">
            {recentlyCompletedTasks.map(task => (
              <li key={task.id} className="insight-item completed" onClick={() => onTaskSelect(task)}>
                <div className="insight-item-content">
                  <div className="insight-item-title">
                    <Badge themeColor="success" size="small" />
                    <span>{task.title}</span>
                  </div>
                  <div className="insight-item-date">
                    <span>Completed {formatDate(task.updatedAt)}</span>
                  </div>
                </div>
              </li>
            ))}
          </ul>
        ) : (
          <div className="empty-state">
            <p>No completed tasks yet</p>
          </div>
        )}
      </div>
      
      {tasks.length > 0 && (
        <div className="insights-footer">
          <Button 
            themeColor="primary"
            fillMode="flat"
            icon="eye"
            onClick={() => {}}
          >
            View All Tasks
          </Button>
        </div>
      )}
    </div>
  );
};

export default TaskInsights; 