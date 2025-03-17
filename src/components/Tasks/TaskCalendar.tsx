import React, { useState, useEffect } from 'react';
import { Button } from '@progress/kendo-react-buttons';
import { DropDownList } from '@progress/kendo-react-dropdowns';
import { DatePicker } from '@progress/kendo-react-dateinputs';
import { Task } from '../../models/Task';
import { TaskService } from '../../services/TaskService';
import './TaskCalendar.css';

interface TaskCalendarProps {
  tasks: Task[];
  onTaskSelect: (task: Task) => void;
}

interface DayWithTasks {
  date: Date;
  isCurrentMonth: boolean;
  isToday: boolean;
  tasks: Task[];
}

const TaskCalendar: React.FC<TaskCalendarProps> = ({ tasks, onTaskSelect }) => {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [currentMonth, setCurrentMonth] = useState(currentDate.getMonth());
  const [currentYear, setCurrentYear] = useState(currentDate.getFullYear());
  const [calendarDays, setCalendarDays] = useState<DayWithTasks[]>([]);
  const [categoryFilter, setCategoryFilter] = useState<string | null>(null);
  const [priorityFilter, setPriorityFilter] = useState<string | null>(null);
  
  const categories = TaskService.getCategories();
  const categoryOptions = [
    { text: 'All Categories', value: null },
    ...categories.map(cat => ({ text: cat.name, value: cat.id, color: cat.color }))
  ];
  
  const priorityOptions = [
    { text: 'All Priorities', value: null },
    { text: 'Low', value: 'low' },
    { text: 'Medium', value: 'medium' },
    { text: 'High', value: 'high' },
    { text: 'Urgent', value: 'urgent' }
  ];
  
  const months = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];
  
  const generateYearOptions = () => {
    const currentYear = new Date().getFullYear();
    const years = [];
    for (let i = currentYear - 5; i <= currentYear + 5; i++) {
      years.push(i);
    }
    return years;
  };
  
  const filteredTasks = tasks.filter(task => {
    let includeTask = true;
    
    if (categoryFilter && task.category !== categoryFilter) {
      includeTask = false;
    }
    
    if (priorityFilter && task.priority !== priorityFilter) {
      includeTask = false;
    }
    
    return includeTask;
  });

  useEffect(() => {
    const generateCalendarDays = () => {
      const firstDayOfMonth = new Date(currentYear, currentMonth, 1);
      const lastDayOfMonth = new Date(currentYear, currentMonth + 1, 0);
      const daysInMonth = lastDayOfMonth.getDate();
      const startingDayOfWeek = firstDayOfMonth.getDay();
      
      const today = new Date();
      const isToday = (date: Date) => 
        date.getDate() === today.getDate() && 
        date.getMonth() === today.getMonth() && 
        date.getFullYear() === today.getFullYear();
      
      const prevMonthDays: DayWithTasks[] = [];
      if (startingDayOfWeek > 0) {
        const prevMonth = new Date(currentYear, currentMonth, 0);
        const daysInPrevMonth = prevMonth.getDate();
        
        for (let i = startingDayOfWeek - 1; i >= 0; i--) {
          const date = new Date(currentYear, currentMonth - 1, daysInPrevMonth - i);
          
          const dayTasks = filteredTasks.filter(task => {
            if (!task.dueDate) return false;
            const dueDate = new Date(task.dueDate);
            return dueDate.getDate() === date.getDate() && 
                  dueDate.getMonth() === date.getMonth() && 
                  dueDate.getFullYear() === date.getFullYear();
          });
          
          prevMonthDays.push({
            date,
            isCurrentMonth: false,
            isToday: isToday(date),
            tasks: dayTasks
          });
        }
      }
      
      const currentMonthDays: DayWithTasks[] = [];
      for (let day = 1; day <= daysInMonth; day++) {
        const date = new Date(currentYear, currentMonth, day);
        
        const dayTasks = filteredTasks.filter(task => {
          if (!task.dueDate) return false;
          const dueDate = new Date(task.dueDate);
          return dueDate.getDate() === date.getDate() && 
                dueDate.getMonth() === date.getMonth() && 
                dueDate.getFullYear() === date.getFullYear();
        });
        
        currentMonthDays.push({
          date,
          isCurrentMonth: true,
          isToday: isToday(date),
          tasks: dayTasks
        });
      }
      
      const nextMonthDays: DayWithTasks[] = [];
      const totalDaysSoFar = prevMonthDays.length + currentMonthDays.length;
      const daysNeeded = 42 - totalDaysSoFar;
      
      for (let day = 1; day <= daysNeeded; day++) {
        const date = new Date(currentYear, currentMonth + 1, day);
        
        const dayTasks = filteredTasks.filter(task => {
          if (!task.dueDate) return false;
          const dueDate = new Date(task.dueDate);
          return dueDate.getDate() === date.getDate() && 
                dueDate.getMonth() === date.getMonth() && 
                dueDate.getFullYear() === date.getFullYear();
        });
        
        nextMonthDays.push({
          date,
          isCurrentMonth: false,
          isToday: isToday(date),
          tasks: dayTasks
        });
      }
      
      return [...prevMonthDays, ...currentMonthDays, ...nextMonthDays];
    };
    
    setCalendarDays(generateCalendarDays());
  }, [currentMonth, currentYear, filteredTasks]);
  
  const handlePrevMonth = () => {
    if (currentMonth === 0) {
      setCurrentMonth(11);
      setCurrentYear(currentYear - 1);
    } else {
      setCurrentMonth(currentMonth - 1);
    }
  };
  
  const handleNextMonth = () => {
    if (currentMonth === 11) {
      setCurrentMonth(0);
      setCurrentYear(currentYear + 1);
    } else {
      setCurrentMonth(currentMonth + 1);
    }
  };
  
  const handleToday = () => {
    const today = new Date();
    setCurrentMonth(today.getMonth());
    setCurrentYear(today.getFullYear());
  };
  
  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'low': return '#33cc33';
      case 'medium': return '#ffcc00';
      case 'high': return '#ff9900';
      case 'urgent': return '#ff3300';
      default: return '#cccccc';
    }
  };
  
  const getCategoryColor = (categoryId: string) => {
    const category = categories.find(cat => cat.id === categoryId);
    return category ? category.color : '#cccccc';
  };

  return (
    <div className="task-calendar">
      <div className="calendar-header">
        <div className="month-navigation">
          <Button onClick={handlePrevMonth} icon="arrow-left" />
          <div className="month-year-selector">
            <DropDownList
              data={months}
              value={months[currentMonth]}
              onChange={(e) => setCurrentMonth(months.indexOf(e.value))}
            />
            <DropDownList
              data={generateYearOptions()}
              value={currentYear}
              onChange={(e) => setCurrentYear(e.value)}
            />
          </div>
          <Button onClick={handleNextMonth} icon="arrow-right" />
        </div>
        
        <div className="calendar-actions">
          <Button onClick={handleToday}>Today</Button>
        </div>
      </div>
      
      <div className="calendar-filters">
        <div className="filter-group">
          <label>Category:</label>
          <DropDownList
            data={categoryOptions}
            textField="text"
            dataItemKey="value"
            value={categoryOptions.find(opt => opt.value === categoryFilter)}
            onChange={(e) => setCategoryFilter(e.value?.value || null)}
            itemRender={(li, itemProps) => {
              const item = itemProps.dataItem;
              if (!item.color) return li;
              
              const newProps = {
                ...li.props,
                style: {
                  ...li.props.style,
                  borderLeft: `4px solid ${item.color}`,
                  paddingLeft: '8px'
                }
              };
              
              return React.cloneElement(li, newProps);
            }}
          />
        </div>
        
        <div className="filter-group">
          <label>Priority:</label>
          <DropDownList
            data={priorityOptions}
            textField="text"
            dataItemKey="value"
            value={priorityOptions.find(opt => opt.value === priorityFilter)}
            onChange={(e) => setPriorityFilter(e.value?.value || null)}
          />
        </div>
      </div>
      
      <div className="calendar-grid">
        <div className="calendar-weekdays">
          <div>Sun</div>
          <div>Mon</div>
          <div>Tue</div>
          <div>Wed</div>
          <div>Thu</div>
          <div>Fri</div>
          <div>Sat</div>
        </div>
        
        <div className="calendar-days">
          {calendarDays.map((day, index) => (
            <div 
              key={index} 
              className={`calendar-day ${!day.isCurrentMonth ? 'other-month' : ''} ${day.isToday ? 'today' : ''}`}
            >
              <div className="day-header">
                <span className="day-number">{day.date.getDate()}</span>
              </div>
              
              <div className="day-tasks">
                {day.tasks.slice(0, 3).map(task => (
                  <div 
                    key={task.id} 
                    className="calendar-task" 
                    onClick={() => onTaskSelect(task)}
                    style={{
                      borderLeft: `3px solid ${getCategoryColor(task.category)}`,
                      backgroundColor: `${getPriorityColor(task.priority)}30`
                    }}
                  >
                    {task.title.length > 20 ? task.title.substring(0, 17) + '...' : task.title}
                  </div>
                ))}
                
                {day.tasks.length > 3 && (
                  <div className="more-tasks">
                    +{day.tasks.length - 3} more
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default TaskCalendar; 