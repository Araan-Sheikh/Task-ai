import React, { useState, ReactNode } from 'react';
import './TabPanel.css';

interface TabProps {
  title: string;
  children: ReactNode;
}

export const Tab: React.FC<TabProps> = ({ children }) => {
  return <>{children}</>;
};

interface TabPanelProps {
  children: React.ReactElement<TabProps>[];
  selected?: number;
  onSelect?: (index: number) => void;
  className?: string;
  style?: React.CSSProperties;
}

const TabPanel: React.FC<TabPanelProps> = ({
  children,
  selected = 0,
  onSelect,
  className = '',
  style
}) => {
  const [activeTab, setActiveTab] = useState(selected);

  const handleTabClick = (index: number) => {
    setActiveTab(index);
    if (onSelect) {
      onSelect(index);
    }
  };

  return (
    <div className={`tab-panel ${className}`} style={style}>
      <div className="tab-header">
        {React.Children.map(children, (child, index) => (
          <div
            className={`tab-item ${index === activeTab ? 'active' : ''}`}
            onClick={() => handleTabClick(index)}
          >
            {child.props.title}
          </div>
        ))}
      </div>
      <div className="tab-content">
        {React.Children.map(children, (child, index) => (
          <div className={`tab-pane ${index === activeTab ? 'active' : ''}`}>
            {child.props.children}
          </div>
        ))}
      </div>
    </div>
  );
};

export default TabPanel; 