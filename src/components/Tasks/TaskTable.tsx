import React, { useState } from 'react';
import { DropDownList } from '@progress/kendo-react-dropdowns';
import { Button, ButtonGroup } from '@progress/kendo-react-buttons';
import { DatePicker } from '@progress/kendo-react-dateinputs';
import { Input, Checkbox } from '@progress/kendo-react-inputs';
import { Popup } from '@progress/kendo-react-popup';
import { Task, PriorityLevel, TaskStatus } from '../../models/Task';
import { TaskService } from '../../services/TaskService';
import './TaskTable.css';

const priorityColors = {
  low: '#33cc33',
  medium: '#ffcc00',
  high: '#ff9900',
  urgent: '#ff3300',
};

const statusColors = {
  'pending': '#cccccc',
  'in-progress': '#3399ff',
  'completed': '#33cc33',
  'postponed': '#666666',
};

interface TaskTableProps {
  tasks: Task[];
  onTaskSelect: (task: Task) => void;
  onTaskUpdate: (id: string, updates: Partial<Task>) => void;
  onTaskDelete: (id: string) => void;
}

const TaskTable: React.FC<TaskTableProps> = ({
  tasks,
  onTaskSelect,
  onTaskUpdate,
  onTaskDelete,
}) => {
  const [searchText, setSearchText] = useState('');
  const [sortField, setSortField] = useState<keyof Task>('updatedAt');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc');
  const [tooltipAnchor, setTooltipAnchor] = useState<HTMLElement | null>(null);
  const [tooltipContent, setTooltipContent] = useState<React.ReactNode | null>(null);
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [selectedTasks, setSelectedTasks] = useState<string[]>([]);

  const safeTasks = tasks || [];
  
  const getFilteredTasks = () => {
    let filteredTasks = searchText 
      ? safeTasks.filter(
          task => 
            task.title.toLowerCase().includes(searchText.toLowerCase()) ||
            task.description.toLowerCase().includes(searchText.toLowerCase())
        )
      : safeTasks;
    
    if (sortField) {
      filteredTasks = [...filteredTasks].sort((a, b) => {
        const aValue = a[sortField];
        const bValue = b[sortField];
        
        if (!aValue && !bValue) return 0;
        if (!aValue) return 1;
        if (!bValue) return -1;
        
        if (sortField === 'dueDate' || sortField === 'createdAt' || sortField === 'updatedAt') {
          const aDate = aValue instanceof Date ? aValue : new Date(aValue as any);
          const bDate = bValue instanceof Date ? bValue : new Date(bValue as any);
          return sortDirection === 'asc' 
            ? aDate.getTime() - bDate.getTime() 
            : bDate.getTime() - aDate.getTime();
        }
        
        if (typeof aValue === 'string' && typeof bValue === 'string') {
          return sortDirection === 'asc'
            ? aValue.localeCompare(bValue) 
            : bValue.localeCompare(aValue);
        }
        
        return sortDirection === 'asc'
          ? (aValue as any) > (bValue as any) ? 1 : -1
          : (aValue as any) < (bValue as any) ? 1 : -1;
      });
    }
    
    return filteredTasks;
  };
  
  const handleSort = (field: string) => {
    if (field === sortField) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field as keyof Task);
      setSortDirection('asc');
    }
  };
  
  const handleShowTooltip = (content: React.ReactNode, anchor: HTMLElement) => {
    setTooltipContent(content);
    setTooltipAnchor(anchor);
  };
  
  const handleHideTooltip = () => {
    setTooltipAnchor(null);
    setTooltipContent(null);
  };

  const filteredTasks = getFilteredTasks();
  
  const filteredTasksByStatus = filteredTasks.filter(task => {
    if (filterStatus !== 'all') {
      return task.status === filterStatus;
    }
    return true;
  });
  
  const handleTaskSelection = (taskId: string, isSelected: boolean) => {
    if (isSelected) {
      setSelectedTasks(prev => [...prev, taskId]);
    } else {
      setSelectedTasks(prev => prev.filter(id => id !== taskId));
    }
  };
  
  const handleSelectAll = (isSelected: boolean) => {
    if (isSelected) {
      setSelectedTasks(filteredTasksByStatus.map(task => task.id));
    } else {
      setSelectedTasks([]);
    }
  };
  
  return (
    <div className="task-table-container">
      <div className="table-controls">
        <div className="filter-group">
          <label>Filter by Status:</label>
          <ButtonGroup>
            <Button 
              togglable={true} 
              selected={filterStatus === 'all'} 
              onClick={() => setFilterStatus('all')}
            >
              All
            </Button>
            <Button 
              togglable={true} 
              selected={filterStatus === 'pending'} 
              onClick={() => setFilterStatus('pending')}
            >
              Pending
            </Button>
            <Button 
              togglable={true} 
              selected={filterStatus === 'in-progress'} 
              onClick={() => setFilterStatus('in-progress')}
            >
              In Progress
            </Button>
            <Button 
              togglable={true} 
              selected={filterStatus === 'completed'} 
              onClick={() => setFilterStatus('completed')}
            >
              Completed
            </Button>
            <Button 
              togglable={true} 
              selected={filterStatus === 'postponed'} 
              onClick={() => setFilterStatus('postponed')}
            >
              Postponed
            </Button>
          </ButtonGroup>
        </div>
        
        <div className="task-table-search">
          <Input
            placeholder="Search tasks..."
            value={searchText}
            onChange={e => setSearchText(e.value as string)}
            style={{ width: '300px' }}
          />
        </div>
      </div>
      
      <div className="task-table-wrapper">
        <table className="task-table">
          <thead>
            <tr>
              <th style={{ width: '40px' }}>
                <Checkbox
                  checked={selectedTasks.length === filteredTasksByStatus.length && filteredTasksByStatus.length > 0}
                  onChange={(e) => handleSelectAll(e.value)}
                />
              </th>
              <th 
                className={sortField === 'title' ? `sorted-${sortDirection}` : ''}
                onClick={() => handleSort('title')}
              >
                Task
              </th>
              <th 
                className={sortField === 'priority' ? `sorted-${sortDirection}` : ''}
                onClick={() => handleSort('priority')}
              >
                Priority
              </th>
              <th 
                className={sortField === 'status' ? `sorted-${sortDirection}` : ''}
                onClick={() => handleSort('status')}
              >
                Status
              </th>
              <th 
                className={sortField === 'category' ? `sorted-${sortDirection}` : ''}
                onClick={() => handleSort('category')}
              >
                Category
              </th>
              <th 
                className={sortField === 'dueDate' ? `sorted-${sortDirection}` : ''}
                onClick={() => handleSort('dueDate')}
              >
                Due Date
              </th>
              <th 
                className={sortField === 'estimatedTime' ? `sorted-${sortDirection}` : ''}
                onClick={() => handleSort('estimatedTime')}
              >
                Est. Time (mins)
              </th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredTasksByStatus.map(task => (
              <tr key={task.id}>
                <td onClick={(e) => e.stopPropagation()}>
                  <Checkbox
                    checked={selectedTasks.includes(task.id)}
                    onChange={(e) => handleTaskSelection(task.id, e.value)}
                  />
                </td>
                <td onClick={() => onTaskSelect(task)}>{task.title}</td>
                <td>
                  <DropDownList
                    data={['low', 'medium', 'high', 'urgent']}
                    value={task.priority}
                    onChange={e => {
                      if (e.nativeEvent) {
                        e.nativeEvent.stopPropagation();
                      }
                      onTaskUpdate(task.id, { priority: e.target.value as PriorityLevel });
                    }}
                    style={{ 
                      backgroundColor: priorityColors[task.priority as PriorityLevel],
                      color: ['high', 'urgent'].includes(task.priority) ? 'white' : 'black'
                    }}
                  />
                </td>
                <td>
                  <DropDownList
                    data={['pending', 'in-progress', 'completed', 'postponed']}
                    value={task.status}
                    onChange={e => {
                      if (e.nativeEvent) {
                        e.nativeEvent.stopPropagation();
                      }
                      const newStatus = e.target.value as TaskStatus;
                      const updates: Partial<Task> = { status: newStatus };
                      
                      if (newStatus === 'completed' && task.estimatedTime && !task.actualTime) {
                        updates.actualTime = task.estimatedTime;
                      }
                      
                      onTaskUpdate(task.id, updates);
                    }}
                    style={{ 
                      backgroundColor: statusColors[task.status as TaskStatus],
                      color: task.status === 'in-progress' ? 'white' : 'black'
                    }}
                  />
                </td>
                <td>
                  {(() => {
                    const categories = TaskService.getCategories();
                    const category = categories.find(c => c.id === task.category);
                    
                    return (
                      <DropDownList
                        data={categories.map(c => c.id)}
                        value={task.category}
                        onChange={e => {
                          if (e.nativeEvent) {
                            e.nativeEvent.stopPropagation();
                          }
                          onTaskUpdate(task.id, { category: e.target.value });
                        }}
                        itemRender={(li: any, itemProps: any) => {
                          const cat = categories.find(c => c.id === itemProps.dataItem);
                          if (!cat) return li;
                          
                          return React.cloneElement(li, li.props, cat.name);
                        }}
                        style={{
                          borderLeft: `4px solid ${category?.color || '#ccc'}`
                        }}
                      />
                    );
                  })()}
                </td>
                <td>
                  {(() => {
                    const dueDate = task.dueDate ? new Date(task.dueDate) : null;
                    const isOverdue = dueDate && dueDate < new Date() && task.status !== 'completed';
                    
                    return (
                      <DatePicker
                        value={dueDate}
                        onChange={e => {
                          if (e.nativeEvent) {
                            e.nativeEvent.stopPropagation();
                          }
                          onTaskUpdate(task.id, { dueDate: e.value || undefined });
                        }}
                        format="MMM dd, yyyy"
                        style={{
                          color: isOverdue ? 'red' : 'inherit',
                          fontWeight: isOverdue ? 'bold' : 'normal'
                        }}
                      />
                    );
                  })()}
                </td>
                <td>
                  <input
                    type="number"
                    value={task.estimatedTime || ''}
                    onChange={e => {
                      onTaskUpdate(task.id, { 
                        estimatedTime: e.target.value ? parseInt(e.target.value, 10) : undefined 
                      });
                    }}
                    onClick={e => e.stopPropagation()}
                    className="k-input"
                    min={1}
                    style={{ width: '100%' }}
                  />
                </td>
                <td>
                  <div className="task-table-actions">
                    <Button
                      icon="edit"
                      onClick={e => {
                        e.stopPropagation();
                        onTaskSelect(task);
                      }}
                      title="Edit Task"
                      themeColor="info"
                      className="action-button edit-button"
                    />
                    <Button
                      icon="delete"
                      onClick={e => {
                        e.stopPropagation();
                        onTaskDelete(task.id);
                      }}
                      title="Delete Task"
                      themeColor="error"
                      className="action-button delete-button"
                    />
                    {task.aiSuggestions && Object.keys(task.aiSuggestions).length > 0 && (
                      <Button
                        icon="flash"
                        title="AI Suggestions"
                        themeColor="primary"
                        className="action-button ai-button"
                        onClick={e => {
                          e.stopPropagation();
                          handleShowTooltip(
                            <div className="ai-suggestions-tooltip">
                              <h4>
                                <span className="ai-icon">✨</span>
                                AI Suggestions
                              </h4>
                              <div className="suggestion-items">
                                {task.aiSuggestions?.priority && (
                                  <div className="suggestion-item">
                                    <span className="suggestion-label">Priority:</span>
                                    <span className="suggestion-value" style={{ 
                                      color: priorityColors[task.aiSuggestions.priority as PriorityLevel] 
                                    }}>
                                      {task.aiSuggestions.priority}
                                    </span>
                                  </div>
                                )}
                                {task.aiSuggestions?.category && (
                                  <div className="suggestion-item">
                                    <span className="suggestion-label">Category:</span>
                                    <span className="suggestion-value">
                                      {task.aiSuggestions.category}
                                    </span>
                                  </div>
                                )}
                                {task.aiSuggestions?.estimatedTime && (
                                  <div className="suggestion-item">
                                    <span className="suggestion-label">Est. Time:</span>
                                    <span className="suggestion-value">
                                      {task.aiSuggestions.estimatedTime} minutes
                                    </span>
                                  </div>
                                )}
                                {task.aiSuggestions?.suggestedDeadline && (
                                  <div className="suggestion-item">
                                    <span className="suggestion-label">Suggested Deadline:</span>
                                    <span className="suggestion-value">
                                      {new Date(task.aiSuggestions.suggestedDeadline).toLocaleDateString()}
                                    </span>
                                  </div>
                                )}
                              </div>
                              <div className="tooltip-actions">
                                <Button
                                  fillMode="flat"
                                  size="small"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    const updates: Partial<Task> = {};
                                    if (task.aiSuggestions?.priority) updates.priority = task.aiSuggestions.priority as PriorityLevel;
                                    if (task.aiSuggestions?.category) updates.category = task.aiSuggestions.category;
                                    if (task.aiSuggestions?.estimatedTime) updates.estimatedTime = task.aiSuggestions.estimatedTime;
                                    if (task.aiSuggestions?.suggestedDeadline) updates.dueDate = task.aiSuggestions.suggestedDeadline;
                                    onTaskUpdate(task.id, updates);
                                    handleHideTooltip();
                                  }}
                                >
                                  Apply All
                                </Button>
                              </div>
                            </div>,
                            e.currentTarget as HTMLElement
                          );
                        }}
                        onBlur={handleHideTooltip}
                      />
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      
      {tooltipAnchor && tooltipContent && (
        <Popup
          anchor={tooltipAnchor}
          show={true}
          popupClass="task-tooltip-popup"
          animate={false}
        >
          {tooltipContent}
        </Popup>
      )}
      
      {/* Add batch actions for selected tasks */}
      {selectedTasks.length > 0 && (
        <div className="batch-actions">
          <span className="batch-status">
            {selectedTasks.length} tasks selected
          </span>
          <div className="batch-buttons">
            <Button 
              themeColor="error"
              icon="delete"
              onClick={() => {
                selectedTasks.forEach(id => onTaskDelete(id));
                setSelectedTasks([]);
              }}
            >
              Delete Selected
            </Button>
            
            <Button
              themeColor="primary"
              onClick={() => {
                selectedTasks.forEach(id => {
                  const task = tasks.find(t => t.id === id);
                  if (task && task.status !== 'completed') {
                    onTaskUpdate(id, { 
                      status: 'completed',
                      completionPercentage: 100,
                      actualTime: task.estimatedTime || undefined
                    });
                  }
                });
                setSelectedTasks([]);
              }}
            >
              Mark as Completed
            </Button>
          </div>
        </div>
      )}
    </div>
  );
};

export default TaskTable; 