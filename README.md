# Warehouse Management System

A comprehensive solution for managing warehouse operations, inventory tracking, and order fulfillment.

## Overview

This Warehouse Management System is built using the MERN stack (MongoDB, Express.js, React, Node.js) with a modern UI powered by Tailwind CSS. The application provides tools for inventory management, order processing, warehouse space optimization, and reporting.

## Features

- **Inventory Management**: Track stock levels, product details, and locations
- **Order Processing**: Manage customer orders and fulfillment
- **Warehouse Space Optimization**: Efficiently organize warehouse layout
- **Reporting and Analytics**: Generate insights with data visualization using Recharts
- **User Authentication**: Secure access control for different user roles
- **CSV Import/Export**: Bulk data operations for inventory and orders

## Tech Stack

### Backend
- Node.js
- Express.js
- MongoDB with Mongoose ODM
- RESTful API architecture
- Multer for file uploads
- CSV parsing capabilities

### Frontend
- React.js
- Vite for build tooling
- React Router for navigation
- Tailwind CSS for styling
- Headless UI for accessible components
- React Icons for UI elements
- Axios for API communication
- React Toastify for notifications
- Recharts for data visualization

## Getting Started

### Prerequisites
- Node.js (v14 or higher)
- MongoDB (local or Atlas)
- npm or yarn

### Installation

1. Clone the repository
```bash
git clone <repository-url>
cd warehouse-management
```

2. Install backend dependencies
```bash
cd backend
npm install
```

3. Configure environment variables
```bash
# Create a .env file in the backend directory with the following variables
MONGODB_URI=your_mongodb_connection_string
PORT=5000
```

4. Install frontend dependencies
```bash
cd ../frontend
npm install
```

### Running the Application

1. Start the backend server
```bash
cd backend
npm run dev
```

2. Start the frontend development server
```bash
cd frontend
npm run dev
```

3. Access the application at http://localhost:5173

## Project Structure

```
warehouse-management/
├── backend/
│   ├── controllers/    # Request handlers
│   ├── middleware/     # Express middleware
│   ├── models/         # Mongoose schemas
│   ├── routes/         # API routes
│   ├── utils/          # Helper functions
│   ├── uploads/        # File upload directory
│   └── server.js       # Entry point
├── frontend/
│   ├── src/
│   │   ├── components/ # React components
│   │   ├── pages/      # Page components
│   │   ├── context/    # React context
│   │   ├── hooks/      # Custom hooks
│   │   ├── services/   # API services
│   │   └── App.jsx     # Main component
│   ├── index.html
│   └── vite.config.js
└── README.md
```

## License

ISC

## Author

PARASMANI KHUNTE
