# Parking Admin Dashboard

A comprehensive admin dashboard for managing parking operations, built with React, TypeScript, and Tailwind CSS.

## Features

### 🎯 Core Functionality
- **Real-time Dashboard**: Live parking occupancy monitoring with visual charts
- **Role-based Access Control**: Different permission levels for Admin, Manager, and Personnel
- **Booking Management**: Complete booking lifecycle management
- **Session Management**: Real-time parking session monitoring
- **Rate Management**: Flexible pricing system with multiple rate types
- **User Management**: User account administration
- **Analytics & Reporting**: Comprehensive data insights
- **System Health Monitoring**: Real-time system status and alerts

### 🔐 User Roles & Permissions

#### Admin (Full Access)
- Complete system access
- User management
- Rate management
- System health monitoring
- Maintenance operations
- Analytics and reporting

#### Manager (Limited Admin Access)
- Booking and session management
- Rate management
- Analytics viewing
- Parking lot management
- No user management or system maintenance

#### Personnel (Operational Access)
- Booking and session management
- Basic parking lot operations
- Limited analytics access

## 🚀 Getting Started

### Prerequisites
- Node.js 18+ 
- npm or yarn
- Backend API running on `http://localhost:8080`

### Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd parking-admin
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Start the development server**
   ```bash
   npm run dev
   ```

4. **Open your browser**
   Navigate to `http://localhost:5173`

### Demo Accounts

The application includes demo accounts for testing different user roles:

- **Admin**: `admin@parking.com` / `admin123`
- **Manager**: `manager@parking.com` / `manager123`
- **Personnel**: `personnel@parking.com` / `personnel123`

## 🏗️ Project Structure

```
src/
├── components/          # Reusable UI components
│   ├── Dashboard/       # Dashboard-specific components
│   └── Layout/          # Layout components (Sidebar, Header)
├── contexts/           # React contexts (Auth, etc.)
├── pages/              # Page components
├── services/           # API service layer
├── types/              # TypeScript type definitions
├── utils/              # Utility functions
└── App.tsx             # Main application component
```

## 🎨 Design System

### Color Palette
- **Primary**: Blue (#3b82f6)
- **Success**: Green (#10b981)
- **Warning**: Yellow (#f59e0b)
- **Error**: Red (#ef4444)
- **Background**: Light Gray (#f9fafb)

### Components
- **StatsCard**: Dashboard metric cards
- **OccupancyChart**: Real-time occupancy visualization
- **RecentActivity**: Activity feed component
- **Layout**: Responsive sidebar and header layout

## 📊 Dashboard Features

### Real-time Monitoring
- Live parking occupancy rates
- Current active bookings and sessions
- Revenue tracking
- System health status

### Visual Analytics
- Interactive occupancy charts
- Color-coded status indicators
- Responsive design for all screen sizes

### Activity Tracking
- Recent booking and session activity
- User action logging
- Real-time updates

## 🔧 API Integration

The dashboard integrates with the following backend APIs:

- **Authentication**: `/api/v1/auth/*`
- **Dashboard**: `/api/v1/admin/dashboard/*`
- **Bookings**: `/api/v1/admin/bookings/*`
- **Sessions**: `/api/v1/admin/parking-sessions/*`
- **Rates**: `/api/v1/admin/rate-*`
- **Users**: `/api/v1/admin/users/*`
- **System**: `/api/v1/admin/system/*`

## 🛠️ Development

### Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run preview` - Preview production build
- `npm run lint` - Run ESLint

### Environment Variables

Create a `.env` file in the root directory:

```env
VITE_API_BASE_URL=http://localhost:8080/api/v1
```

## 📱 Responsive Design

The dashboard is fully responsive and works on:
- Desktop (1024px+)
- Tablet (768px - 1023px)
- Mobile (320px - 767px)

## 🔒 Security Features

- JWT-based authentication
- Role-based access control
- Protected routes
- Secure API communication
- Input validation

## 🚀 Deployment

### Production Build

```bash
npm run build
```

The build artifacts will be stored in the `dist/` directory.

### Environment Setup

Ensure your production environment has:
- Backend API accessible
- Proper CORS configuration
- HTTPS enabled
- Environment variables configured

## 📈 Future Enhancements

- [ ] Real-time WebSocket integration
- [ ] Advanced analytics and reporting
- [ ] Mobile app integration
- [ ] Multi-language support
- [ ] Advanced user management
- [ ] Automated maintenance scheduling
- [ ] Integration with payment gateways
- [ ] Advanced notification system

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## 📄 License

This project is licensed under the MIT License.

## 🆘 Support

For support and questions:
- Create an issue in the repository
- Contact the development team
- Check the documentation

---

Built with ❤️ for efficient parking management