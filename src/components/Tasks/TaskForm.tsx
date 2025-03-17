import React, { useState, useEffect } from 'react';
import { DropDownList } from '@progress/kendo-react-dropdowns';
import { DatePicker } from '@progress/kendo-react-dateinputs';
import { Button } from '@progress/kendo-react-buttons';
import { Input, NumericTextBox, RadioGroup, Slider } from '@progress/kendo-react-inputs';
import { Loader } from '@progress/kendo-react-indicators';
import { TabStrip, TabStripTab } from '@progress/kendo-react-layout';
import { Task, PriorityLevel, TaskStatus } from '../../models/Task';
import { TaskService } from '../../services/TaskService';
import { AIService } from '../../services/AIService';
import { CustomModal, NotificationSystem } from '../common';
import './TaskForm.css';
import { testGeminiConnection } from '../../utils/testGeminiConnection';

interface TaskFormProps {
  task?: Task;
  onSubmit: (task: Omit<Task, 'id' | 'createdAt' | 'updatedAt'>) => void;
  onCancel: () => void;
}

const PRIORITY_DATA = [
  { text: 'Low', value: 'low' },
  { text: 'Medium', value: 'medium' },
  { text: 'High', value: 'high' },
  { text: 'Urgent', value: 'urgent' }
];

const STATUS_DATA = [
  { text: 'Pending', value: 'pending' },
  { text: 'In Progress', value: 'in-progress' },
  { text: 'Completed', value: 'completed' },
  { text: 'Postponed', value: 'postponed' }
];

const TaskForm: React.FC<TaskFormProps> = ({ task, onSubmit, onCancel }) => {
  const [categories, setCategories] = useState(TaskService.getCategories());
  const [categoryData, setCategoryData] = useState(
    categories.map(c => ({ text: c.name, value: c.id, color: c.color }))
  );
  
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [aiSuggestions, setAiSuggestions] = useState<Task['aiSuggestions']>({});
  const [notifications, setNotifications] = useState<Array<{
    id: string;
    message: string;
    type: 'success' | 'error' | 'info' | 'warning';
    isVisible: boolean;
  }>>([]);
  
  // Form state
  const [formValues, setFormValues] = useState({
    title: task?.title || '',
    description: task?.description || '',
    priority: task?.priority || 'medium',
    status: task?.status || 'pending',
    category: task?.category || 'work',
    dueDate: task?.dueDate || null,
    estimatedTime: task?.estimatedTime || '',
    actualTime: task?.actualTime || '',
    completionPercentage: task?.completionPercentage || 0,
  });
  
  // Validation state
  const [errors, setErrors] = useState({
    title: '',
    category: '',
  });
  
  const isFormValid = !errors.title && !errors.category && formValues.title.trim() !== '';

  useEffect(() => {
    setCategoryData(
      categories.map(c => ({ text: c.name, value: c.id, color: c.color }))
    );
  }, [categories]);

  const handleChange = (field: string, value: any) => {
    setFormValues(prev => ({
      ...prev,
      [field]: value
    }));
    
    if (field === 'title' && value.trim() !== '') {
      setErrors(prev => ({ ...prev, title: '' }));
    }
    if (field === 'category' && value) {
      setErrors(prev => ({ ...prev, category: '' }));
    }
  };
  
  const validate = () => {
    const newErrors = {
      title: formValues.title.trim() === '' ? 'Title is required' : '',
      category: !formValues.category ? 'Category is required' : '',
    };
    
    setErrors(newErrors);
    return !newErrors.title && !newErrors.category;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validate()) {
      return;
    }
    
    const processedData = {
      ...formValues,
      estimatedTime: formValues.estimatedTime ? Number(formValues.estimatedTime) : undefined,
      actualTime: formValues.actualTime ? Number(formValues.actualTime) : undefined,
      dueDate: formValues.dueDate || undefined,
      aiSuggestions
    };
    
    onSubmit(processedData);
  };

  const handleAnalyzeTask = async () => {
    if (!formValues.title || !formValues.description) {
      return;
    }

    console.log("Starting AI analysis for:", formValues.title);
    setIsAnalyzing(true);
    try {
      console.log("Calling AIService.analyzeTask");
      const suggestions = await AIService.analyzeTask(
        formValues.description,
        formValues.title
      );
      
      console.log("AI analysis completed, suggestions:", suggestions);
      setAiSuggestions(suggestions);
      
      if (!suggestions || Object.keys(suggestions).length === 0) {
        console.warn("Received empty suggestions from AI service");
        
        const id = Date.now().toString();
        setNotifications(prev => [
          ...prev,
          {
            id,
            message: 'AI analysis failed to return suggestions. Please try again.',
            type: 'warning',
            isVisible: true
          }
        ]);
        
        setTimeout(() => {
          handleCloseNotification(id);
        }, 5000);
        
        return;
      }
      
      const id = Date.now().toString();
      setNotifications(prev => [
        ...prev,
        {
          id,
          message: 'AI analysis complete! Suggestions are available.',
          type: 'info',
          isVisible: true
        }
      ]);
      
      setTimeout(() => {
        handleCloseNotification(id);
      }, 5000);
    } catch (error) {
      console.error('Error analyzing task:', error);
      
      const id = Date.now().toString();
      setNotifications(prev => [
        ...prev,
        {
          id,
          message: 'Error analyzing task with AI. Please try again.',
          type: 'error',
          isVisible: true
        }
      ]);
      
      setTimeout(() => {
        handleCloseNotification(id);
      }, 5000);
    } finally {
      setIsAnalyzing(false);
    }
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

  const handleApplySuggestions = () => {
    console.log("Applying AI suggestions:", aiSuggestions);
    if (!aiSuggestions || Object.keys(aiSuggestions).length === 0) {
      console.warn("No AI suggestions available to apply");
      return;
    }
    
    const updates: any = {};
    if (aiSuggestions.priority) updates.priority = aiSuggestions.priority;
    if (aiSuggestions.category) {
      const categoryExists = categories.some(c => c.id === aiSuggestions.category);
      if (!categoryExists) {
        const newCategory = TaskService.addCategory(
          aiSuggestions.category!,
          `#${Math.floor(Math.random() * 16777215).toString(16)}`
        );
        setCategories([...categories, newCategory]);
      }
      updates.category = aiSuggestions.category;
    }
    if (aiSuggestions.estimatedTime) updates.estimatedTime = aiSuggestions.estimatedTime;
    if (aiSuggestions.suggestedDeadline) updates.dueDate = aiSuggestions.suggestedDeadline;
    
    console.log("Applying updates to form values:", updates);
    setFormValues(prev => ({
      ...prev,
      ...updates
    }));
    
    const id = Date.now().toString();
    setNotifications(prev => [
      ...prev,
      {
        id,
        message: 'AI suggestions applied!',
        type: 'success',
        isVisible: true
      }
    ]);
    
    setTimeout(() => {
      handleCloseNotification(id);
    }, 3000);
  };

  const handleTestConnection = async () => {
    console.log("Testing Gemini API connection...");
    const isConnected = await testGeminiConnection();
    
    const modelName = AIService.getActiveModelName();
    const modelInfo = modelName ? ` (using ${modelName})` : '';
    
    const id = Date.now().toString();
    setNotifications(prev => [
      ...prev,
      {
        id,
        message: isConnected 
          ? `API connection test successful!${modelInfo}` 
          : 'API connection test failed. Check console for details.',
        type: isConnected ? 'success' : 'error',
        isVisible: true
      }
    ]);
    
    setTimeout(() => {
      handleCloseNotification(id);
    }, 5000);
  };

  const selectedPriority = PRIORITY_DATA.find(item => item.value === formValues.priority);
  const selectedStatus = STATUS_DATA.find(item => item.value === formValues.status);
  const selectedCategory = categoryData.find(item => item.value === formValues.category);

  return (
    <CustomModal 
      title={task ? 'Edit Task' : 'Create New Task'} 
      onClose={onCancel}
      width={550}
    >
      <form onSubmit={handleSubmit} className="task-form">
        <div className="form-section">
          <h3 className="section-title">Basic Information</h3>
          
          <div className="form-group">
            <label htmlFor="title">Task Title *</label>
            <Input
              id="title"
              value={formValues.title}
              onChange={e => handleChange('title', e.value)}
            />
            {errors.title && <div className="error-message">{errors.title}</div>}
          </div>
          
          <div className="form-group">
            <label htmlFor="description">Description</label>
            <textarea 
              id="description"
              className="k-textarea"
              value={formValues.description}
              onChange={e => handleChange('description', e.target.value)}
              style={{ width: '100%', minHeight: '100px' }}
            />
          </div>
        </div>
        
        <div className="form-section">
          <h3 className="section-title">Task Details</h3>
          
          <div className="form-row">
            <div className="form-group">
              <label htmlFor="priority">Priority</label>
              <RadioGroup
                data={[
                  { label: 'Low', value: 'low' },
                  { label: 'Medium', value: 'medium' },
                  { label: 'High', value: 'high' },
                  { label: 'Urgent', value: 'urgent' }
                ]}
                layout="horizontal"
                value={formValues.priority || 'medium'}
                onChange={(e) => handleChange('priority', e.value)}
              />
            </div>
          </div>
          
          <div className="form-row">
            <div className="form-group">
              <label htmlFor="status">Status</label>
              <DropDownList
                id="status"
                data={STATUS_DATA}
                textField="text"
                dataItemKey="value"
                value={selectedStatus}
                onChange={e => handleChange('status', e.value.value)}
              />
            </div>
            
            <div className="form-group">
              <label htmlFor="category">Category *</label>
              <DropDownList
                id="category"
                data={categoryData}
                textField="text"
                dataItemKey="value"
                value={selectedCategory}
                onChange={e => handleChange('category', e.value.value)}
                itemRender={(li, itemProps) => {
                  const item = itemProps.dataItem;
                  const newProps = {
                    ...li.props,
                    style: {
                      ...li.props.style,
                      backgroundColor: item.color + '40',
                      borderLeft: `4px solid ${item.color}`
                    }
                  };
                  
                  return React.cloneElement(li, newProps);
                }}
              />
              {errors.category && <div className="error-message">{errors.category}</div>}
            </div>
          </div>
          
          <div className="form-group">
            <label htmlFor="dueDate">Due Date</label>
            <DatePicker
              id="dueDate"
              value={formValues.dueDate ? new Date(formValues.dueDate) : null}
              onChange={e => handleChange('dueDate', e.value)}
              format="MMM dd, yyyy"
            />
          </div>
        </div>
        
        <div className="form-section">
          <h3 className="section-title">Time Management</h3>
          
          <div className="form-row">
            <div className="form-group">
              <label>Estimated Time (minutes):</label>
              <NumericTextBox
                value={typeof formValues.estimatedTime === 'number' ? formValues.estimatedTime : null}
                onChange={(e) => handleChange('estimatedTime', e.value)}
                min={0}
                step={5}
                format="##"
                placeholder="Enter estimated minutes"
              />
            </div>
            
            <div className="form-group">
              <label>Actual Time (minutes):</label>
              <NumericTextBox
                value={typeof formValues.actualTime === 'number' ? formValues.actualTime : null}
                onChange={(e) => handleChange('actualTime', e.value)}
                min={0}
                step={5}
                format="##"
                placeholder="Enter actual minutes"
                disabled={formValues.status !== 'completed'}
              />
            </div>
          </div>
          
          <div className="form-group">
            <label>Completion Percentage:</label>
            <Slider
              value={formValues.completionPercentage || 0}
              onChange={(e) => handleChange('completionPercentage', e.value)}
              min={0}
              max={100}
              step={5}
              disabled={formValues.status === 'completed'}
            />
            <div className="slider-value">
              {formValues.completionPercentage || 0}%
            </div>
          </div>
        </div>
        
        <div className="ai-actions">
          <Button
            type="button"
            onClick={handleAnalyzeTask}
            disabled={isAnalyzing || !formValues.title || !formValues.description}
            style={{
              backgroundColor: '#9c27b0',
              color: 'white'
            }}
          >
            {isAnalyzing ? (
              <>
                <Loader size="small" type="pulsing" />
                <span style={{ marginLeft: '8px' }}>Analyzing...</span>
              </>
            ) : (
              'Analyze with AI'
            )}
          </Button>
          
          {aiSuggestions && Object.keys(aiSuggestions).length > 0 && (
            <Button
              type="button"
              onClick={handleApplySuggestions}
              style={{
                marginLeft: '10px',
                backgroundColor: '#007bff',
                color: 'white'
              }}
            >
              Apply AI Suggestions
            </Button>
          )}
          
          <Button
            type="button"
            onClick={handleTestConnection}
            style={{
              marginLeft: '10px',
              backgroundColor: '#6c757d',
              color: 'white'
            }}
          >
            Test API Connection
          </Button>
        </div>
        
        <div className="form-actions">
          <Button type="button" onClick={onCancel}>
            Cancel
          </Button>
          <Button
            type="submit"
            themeColor="primary"
            disabled={!isFormValid}
          >
            {task ? 'Update Task' : 'Create Task'}
          </Button>
        </div>
      </form>
      
      <NotificationSystem
        notifications={notifications}
        onClose={handleCloseNotification}
      />
    </CustomModal>
  );
};

export default TaskForm; 