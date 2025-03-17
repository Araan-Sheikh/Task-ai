import React, { useState, useEffect } from 'react';
import { 
  BarChart, Bar, PieChart, Pie, Cell, LineChart, Line,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer 
} from 'recharts';
import { Button } from '@progress/kendo-react-buttons';
import { DropDownList } from '@progress/kendo-react-dropdowns';
import { Loader } from '@progress/kendo-react-indicators';
import { CustomModal, DateRangePickerCustom } from '../common';
import { Task } from '../../models/Task';
import { TaskService } from '../../services/TaskService';
import { AIService } from '../../services/AIService';
import './ProductivityCharts.css';

const chartColors = [
  '#ff6358', 
  '#56b45d', 
  '#2d73f5', 
  '#aa46be', 
  '#ffd246', 
  '#28b4c8'
];

interface ProductivityChartsProps {
  tasks: Task[];
}

const ProductivityCharts: React.FC<ProductivityChartsProps> = ({ tasks }) => {
  const [dateRange, setDateRange] = useState<{ start: Date; end: Date }>({
    start: new Date(new Date().setDate(new Date().getDate() - 30)), // Last 30 days
    end: new Date(),
  });
  const [chartType, setChartType] = useState<'completed' | 'categories' | 'priorities' | 'estimationAccuracy'>('completed');
  const [showInsights, setShowInsights] = useState(false);
  const [insightsText, setInsightsText] = useState('');
  const [isLoadingInsights, setIsLoadingInsights] = useState(false);
  const [pieChartKey, setPieChartKey] = useState(Date.now()); 


  const safeTasks = tasks || [];

  useEffect(() => {
    setPieChartKey(Date.now());
  }, [chartType, dateRange]);

  const filteredTasks = safeTasks.filter(task => {
    const taskDate = task.updatedAt;
    if (!taskDate) return false;
    return taskDate >= dateRange.start && taskDate <= dateRange.end;
  });

  const getCompletedTasksByDay = () => {
    const result: { date: string; count: number; formattedDate: string }[] = [];
    const counts: { [key: string]: number } = {};

    const currentDate = new Date(dateRange.start);
    const endDate = new Date(dateRange.end);

    while (currentDate <= endDate) {
      const dateStr = currentDate.toISOString().split('T')[0];
      counts[dateStr] = 0;
      currentDate.setDate(currentDate.getDate() + 1);
    }

    filteredTasks
      .filter(task => task.status === 'completed' && task.updatedAt instanceof Date)
      .forEach(task => {
        if (task.updatedAt) {
          const dateStr = task.updatedAt.toISOString().split('T')[0];
          counts[dateStr] = (counts[dateStr] || 0) + 1;
        }
      });

    Object.keys(counts).sort().forEach(date => {
      result.push({
        date: date,
        count: counts[date],
        formattedDate: new Date(date).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })
      });
    });

    return result;
  };

  const getTasksByCategory = () => {
    const counts: { [key: string]: number } = {};
    const categories = TaskService.getCategories();

    categories.forEach(category => {
      counts[category.name] = 0;
    });

    filteredTasks.forEach(task => {
      const category = categories.find(c => c.id === task.category);
      if (category) {
        counts[category.name] = (counts[category.name] || 0) + 1;
      }
    });

    const data = Object.keys(counts)
      .filter(name => counts[name] > 0) 
      .map(name => ({
        name,
        value: counts[name],
      }));
    
    return data.length > 0 ? data : [{ name: 'No Data', value: 1 }];
  };

  const getTasksByPriority = () => {
    const priorities = ['low', 'medium', 'high', 'urgent'];
    const counts: { [key: string]: number } = {};

    priorities.forEach(priority => {
      counts[priority] = 0;
    });

    filteredTasks.forEach(task => {
      if (task.priority) { 
        counts[task.priority] = (counts[task.priority] || 0) + 1;
      }
    });

    const data = priorities
      .filter(priority => counts[priority] > 0) 
      .map(priority => ({
        name: priority,
        value: counts[priority],
      }));
    
    return data.length > 0 ? data : [{ name: 'No Data', value: 1 }];
  };

  const getEstimationAccuracy = () => {
    const accuracyData = filteredTasks
      .filter(task => 
        task.status === 'completed' && 
        typeof task.estimatedTime === 'number' && 
        typeof task.actualTime === 'number'
      )
      .map(task => ({
        name: task.title && task.title.length > 20 ? task.title.substring(0, 17) + '...' : (task.title || 'Unnamed Task'),
        estimated: task.estimatedTime as number,
        actual: task.actualTime as number,
        accuracy: task.estimatedTime === task.actualTime ? 'Perfect' : 
                (task.estimatedTime as number) > (task.actualTime as number) ? 'Overestimated' : 'Underestimated',
      }));

    return accuracyData.length > 0 ? accuracyData : [{ name: 'No Data', estimated: 0, actual: 0, accuracy: 'No Data' }];
  };

  const generateInsights = async () => {
    setIsLoadingInsights(true);
    try {
      const completedTasks = filteredTasks.filter(task => task.status === 'completed');
      
      if (completedTasks.length === 0) {
        setInsightsText("No completed tasks found in the selected date range. Please select a different date range or complete some tasks first.");
      } else {
        try {
          const insights = await AIService.getProductivityInsights(completedTasks);
          setInsightsText(insights || "Unable to generate insights. The AI model may be unavailable.");
        } catch (error) {
          console.error('Error from AI service:', error);
          setInsightsText("Sorry, there was an error generating productivity insights. Please try again later.");
        }
      }
      
      setShowInsights(true);
    } catch (error) {
      console.error('Error generating insights:', error);
      setInsightsText("Sorry, there was an error generating productivity insights. Please try again later.");
      setShowInsights(true);
    } finally {
      setIsLoadingInsights(false);
    }
  };

  const renderChart = () => {
    switch (chartType) {
      case 'completed':
        const completedData = getCompletedTasksByDay();
        return (
          <div className="chart-container">
            <h3 className="chart-title">Tasks Completed by Day</h3>
            {completedData.every(item => item.count === 0) ? (
              <div className="no-data-message">No completed tasks in the selected date range</div>
            ) : (
              <ResponsiveContainer width="100%" height={350}>
                <BarChart data={completedData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="formattedDate" />
                  <YAxis allowDecimals={false} />
                  <Tooltip />
                  <Legend />
                  <Bar dataKey="count" name="Completed Tasks" fill={chartColors[0]} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>
        );
      
      case 'categories':
        const categoryData = getTasksByCategory();
        return (
          <div className="chart-container">
            <h3 className="chart-title">Tasks by Category</h3>
            {categoryData.length === 1 && categoryData[0].name === 'No Data' ? (
              <div className="no-data-message">No tasks found in the selected date range</div>
            ) : (
              <ResponsiveContainer width="100%" height={350} key={`pie-categories-${pieChartKey}`}>
                <PieChart>
                  <Pie
                    data={categoryData}
                    dataKey="value"
                    nameKey="name"
                    cx="50%"
                    cy="50%"
                    outerRadius={120}
                    fill="#8884d8"
                    label={({name, percent}) => `${name}: ${(percent * 100).toFixed(0)}%`}
                  >
                    {categoryData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={chartColors[index % chartColors.length]} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(value) => [`${value} tasks`, 'Count']} />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            )}
          </div>
        );
      
      case 'priorities':
        const priorityData = getTasksByPriority();
        return (
          <div className="chart-container">
            <h3 className="chart-title">Tasks by Priority</h3>
            {priorityData.length === 1 && priorityData[0].name === 'No Data' ? (
              <div className="no-data-message">No tasks found in the selected date range</div>
            ) : (
              <ResponsiveContainer width="100%" height={350} key={`pie-priorities-${pieChartKey}`}>
                <PieChart>
                  <Pie
                    data={priorityData}
                    dataKey="value"
                    nameKey="name"
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={120}
                    fill="#8884d8"
                    label={({name, percent}) => `${name}: ${(percent * 100).toFixed(0)}%`}
                  >
                    {priorityData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={chartColors[index % chartColors.length]} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(value) => [`${value} tasks`, 'Count']} />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            )}
          </div>
        );
      
      case 'estimationAccuracy':
        const accuracyData = getEstimationAccuracy();
        return (
          <div className="chart-container">
            <h3 className="chart-title">Estimation vs Actual Time</h3>
            {accuracyData.length === 1 && accuracyData[0].accuracy === 'No Data' ? (
              <div className="no-data-message">No completed tasks with time estimates found in the selected date range</div>
            ) : (
              <ResponsiveContainer width="100%" height={350}>
                <BarChart data={accuracyData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" />
                  <YAxis label={{ value: 'Minutes', angle: -90, position: 'insideLeft' }} />
                  <Tooltip />
                  <Legend />
                  <Bar dataKey="estimated" name="Estimated Time (mins)" fill={chartColors[0]} />
                  <Bar dataKey="actual" name="Actual Time (mins)" fill={chartColors[1]} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>
        );
      
      default:
        return null;
    }
  };

  return (
    <div className="productivity-charts">
      <div className="chart-controls">
        <div className="control-group">
          <label>Date Range:</label>
          <DateRangePickerCustom
            value={dateRange}
            onChange={(value) => setDateRange(value)}
            format="MMM dd, yyyy"
          />
        </div>
        <div className="control-group">
          <label>Chart Type:</label>
          <DropDownList
            data={[
              { text: 'Completed Tasks', value: 'completed' },
              { text: 'Tasks by Category', value: 'categories' },
              { text: 'Tasks by Priority', value: 'priorities' },
              { text: 'Estimation Accuracy', value: 'estimationAccuracy' },
            ]}
            textField="text"
            dataItemKey="value"
            value={chartType}
            onChange={(e) => setChartType(e.value.value)}
            style={{ width: '200px' }}
          />
        </div>
        <div className="control-group">
          <Button
            onClick={generateInsights}
            disabled={isLoadingInsights}
            themeColor="info"
          >
            {isLoadingInsights ? (
              <>
                <Loader size="small" type="pulsing" />
                <span style={{ marginLeft: '8px' }}>Generating...</span>
              </>
            ) : (
              'AI Productivity Insights'
            )}
          </Button>
        </div>
      </div>
      
      {renderChart()}
      
      {showInsights && (
        <CustomModal
          title="AI Productivity Insights"
          onClose={() => setShowInsights(false)}
          width={600}
        >
          <div className="insights-content">
            {insightsText.split('\n').map((paragraph, i) => (
              <p key={i}>{paragraph}</p>
            ))}
          </div>
          <div className="modal-footer">
            <Button onClick={() => setShowInsights(false)}>Close</Button>
          </div>
        </CustomModal>
      )}
    </div>
  );
};

export default ProductivityCharts; 