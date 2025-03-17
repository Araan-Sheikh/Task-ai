import React, { useState, useEffect } from 'react';
import { DatePicker } from '@progress/kendo-react-dateinputs';
import { Label } from '@progress/kendo-react-labels';
import './DateRangePickerCustom.css';

interface DateRangePickerCustomProps {
  value: { start: Date; end: Date };
  onChange: (value: { start: Date; end: Date }) => void;
  format?: string;
}

const DateRangePickerCustom: React.FC<DateRangePickerCustomProps> = ({
  value,
  onChange,
  format = 'MMM dd, yyyy',
}) => {
  const [startDate, setStartDate] = useState<Date>(value.start);
  const [endDate, setEndDate] = useState<Date>(value.end);

  useEffect(() => {
    setStartDate(value.start);
    setEndDate(value.end);
  }, [value]);

  const handleStartDateChange = (event: any) => {
    const newStartDate = event.value;
    
    const newValue = {
      start: newStartDate,
      end: newStartDate > endDate ? newStartDate : endDate,
    };
    
    setStartDate(newStartDate);
    if (newStartDate > endDate) {
      setEndDate(newStartDate);
    }
    
    onChange(newValue);
  };

  const handleEndDateChange = (event: any) => {
    const newEndDate = event.value;
    
    const newValue = {
      start: newEndDate < startDate ? newEndDate : startDate,
      end: newEndDate,
    };
    
    setEndDate(newEndDate);
    if (newEndDate < startDate) {
      setStartDate(newEndDate);
    }
    
    onChange(newValue);
  };

  return (
    <div className="date-range-picker-custom">
      <div className="date-picker-container">
        <Label>Start Date</Label>
        <DatePicker
          value={startDate}
          onChange={handleStartDateChange}
          format={format}
          max={endDate}
        />
      </div>
      <div className="date-picker-container">
        <Label>End Date</Label>
        <DatePicker
          value={endDate}
          onChange={handleEndDateChange}
          format={format}
          min={startDate}
        />
      </div>
    </div>
  );
};

export default DateRangePickerCustom; 