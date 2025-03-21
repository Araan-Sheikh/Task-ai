
# Kendo Task AI Dashboard

<div align="center">
  <img src="public/logo192.png" alt="Kendo Task AI Dashboard Logo" width="120" />
  <h3>AI-Powered Task Management Built with Kendo UI React Components</h3>
</div>

## 📋 Overview

Kendo Task AI Dashboard is a modern, responsive task management application that leverages artificial intelligence to help users optimize their productivity. Built with React and Kendo UI components, it offers a sleek, intuitive interface with powerful features designed to streamline task management workflows.

## ✨ Key Features

- **AI-Powered Task Management**
  - Smart task scheduling suggestions using Google Gemini AI
  - AI-generated daily plans and task sequences
  - Intelligent reasoning behind scheduling recommendations

- **Pomodoro Timer Integration**
  - Task-specific time tracking
  - Work/break interval management
  - Productivity logging

- **Enhanced Productivity Analytics**
  - Visual productivity charts
  - Task completion metrics
  - Time analysis

- **Comprehensive Task Management**
  - Multi-view task organization (list, calendar)
  - Priority-based task sorting
  - Status tracking
  - Due date management

- **Smart Insights Dashboard**
  - Real-time productivity metrics
  - Urgent task highlights
  - Overdue task tracking
  - Completion rate visualization

## 🔧 Technology Stack

- **Frontend Framework**: React with TypeScript
- **UI Components**: 12 Kendo UI React Components
- **Visualization**: Kendo Charts & Recharts
- **State Management**: React Hooks
- **AI Integration**: Google Generative AI (Gemini)

## 🎨 KendoReact Components

This project demonstrates the power of KendoReact's free components by implementing:

1. **Button** - For primary actions and navigation
2. **ProgressBar** - Displays task completion rates
3. **Switch** - Toggles settings and options
4. **Tooltip** - Provides contextual help
5. **Notification & NotificationGroup** - Displays system messages
6. **TabPanel & Tab** - Organizes dashboard views
7. **Form Components** - Powers task creation and editing
8. **DateInputs** - Date selection for tasks
9. **DropDowns** - Selection of priorities and categories
10. **Dialog/Modal** - Focused interaction spaces
11. **Charts** - Productivity visualization
12. **Grid/ListView** - Task data display and management

## 🚀 Getting Started

### Prerequisites

- Node.js (v14 or later)
- npm or yarn
- Google Gemini API key (for AI features)

### Installation

1. Clone the repository:
   ```bash
   git clone https://github.com/Araan-Sheikh/task-ai.git
   cd task-ai
   ```

2. Install dependencies:
   ```bash
   npm install
   # or
   yarn install
   ```

3. Create a `.env` file in the root directory and add your Google Gemini API key:
   ```
   REACT_APP_GEMINI_API_KEY=your_api_key_here
   ```

4. Start the development server:
   ```bash
   npm start
   # or
   yarn start
   ```

5. Open your browser and visit:
   ```
   http://localhost:3000
   ```

## 📱 Responsive Design

The Kendo Task AI Dashboard is built with a mobile-first approach, ensuring a seamless experience across devices:

- **Desktop**: Full-featured dashboard with side-by-side layouts
- **Tablet**: Responsive grid adaptations for optimal space usage
- **Mobile**: Streamlined interface with prioritized content

## 🤖 AI Features

The application integrates Google's Generative AI (Gemini) to provide:

1. **Intelligent Task Scheduling**
   - Analyzes task priorities, deadlines, and dependencies
   - Suggests optimal task sequences
   - Provides AI-powered daily schedules

2. **Smart Insights**
   - Generates productivity patterns
   - Offers task optimization suggestions

3. **Reasoning**
   - Explains scheduling decisions
   - Provides context for recommendations


## 📄 Project Structure

```
kendo-task-ai-dashboard/
├── src/
│   ├── components/
│   │   ├── Analytics/ - Charts and productivity analysis
│   │   ├── Dashboard/ - Main dashboard interface
│   │   ├── Tasks/ - Task management components
│   │   └── common/ - Shared UI components
│   ├── models/ - TypeScript interfaces
│   ├── services/ - API and data services
│   │   ├── AIService.ts - Google Gemini integration
│   │   └── TaskService.ts - Task data handling
│   ├── styles/ - CSS and styling
│   └── utils/ - Helper functions
├── public/ - Static assets
└── configuration files
```

## 📈 Future Roadmap

- Team collaboration features
- Advanced AI-powered workflow optimization
- Integration with third-party productivity tools
- Enhanced mobile apps for iOS and Android

## 📄 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 👥 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.
