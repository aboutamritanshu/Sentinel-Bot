# 🎨 Sentinel AI Frontend Dashboard

A beautiful, modern web dashboard for managing your Sentinel AI Discord bot with real-time analytics, animations, and professional UI components.

## 🚀 Features

### **🎯 Core Dashboard**
- **Real-time Statistics**: Live server metrics, member counts, and activity
- **Health Monitoring**: System status with response times and service health
- **Recent Activity**: Live feed of violations, reports, and tickets
- **Interactive Charts**: Beautiful data visualizations with Recharts
- **Dark Mode**: Automatic dark/light theme switching

### **🎨 Design & Animations**
- **shadcn/ui Components**: Professional, accessible UI components
- **Framer Motion**: Smooth animations and transitions
- **Glass Morphism**: Modern glass effects and gradients
- **Responsive Design**: Perfect on desktop, tablet, and mobile
- **Micro-interactions**: Hover effects, loading states, and transitions

### **📊 Analytics & Monitoring**
- **Server Statistics**: Member counts, message volumes, violation rates
- **Performance Metrics**: Response times, uptime, error rates
- **Health Indicators**: Database, Redis, Discord, and AI service status
- **Activity Timeline**: Real-time moderation activity feed

### **🔧 Management Features**
- **Quick Actions**: One-click access to violations, reports, and tickets
- **Configuration**: Server settings and moderation rules
- **User Management**: View user statistics and moderation history
- **Export Data**: Download reports and analytics

## 🛠️ Technology Stack

- **Framework**: Next.js 14 with App Router
- **Styling**: Tailwind CSS + shadcn/ui
- **Animations**: Framer Motion
- **Icons**: Lucide React
- **Charts**: Recharts
- **TypeScript**: Full type safety
- **API**: RESTful integration with backend

## 📦 Installation

### **Prerequisites**
- Node.js 18+ 
- npm or yarn
- Sentinel AI backend running

### **Setup Instructions**

1. **Navigate to frontend directory**
```bash
cd frontend
```

2. **Install dependencies**
```bash
npm install
```

3. **Configure environment variables**
```bash
cp .env.example .env.local
```

Edit `.env.local`:
```env
NEXT_PUBLIC_API_URL=http://localhost:3000
NEXT_PUBLIC_WS_URL=ws://localhost:3000
```

4. **Start development server**
```bash
npm run dev
```

5. **Open your browser**
```
http://localhost:3001
```

## 🎯 Usage Guide

### **Dashboard Overview**

1. **Header Section**
   - Bot status indicator
   - System health overview
   - Settings and navigation

2. **Statistics Cards**
   - Total members with growth trends
   - Active users and engagement metrics
   - Message volumes and activity
   - Violations and moderation actions
   - Reports and support tickets
   - Bot uptime and performance

3. **System Health Panel**
   - Database connection status
   - Redis cache performance
   - Discord API connectivity
   - AI service response times

4. **Recent Activity Feed**
   - Live moderation actions
   - User reports and resolutions
   - Support ticket updates
   - Real-time updates

5. **Quick Actions**
   - View violations
   - Manage reports
   - Access support tickets

### **Interactive Features**

- **Hover Effects**: All cards and buttons have smooth hover animations
- **Loading States**: Beautiful skeleton loaders during data fetching
- **Real-time Updates**: Live data refresh without page reload
- **Responsive Design**: Adapts perfectly to any screen size
- **Dark Mode**: Automatic theme detection and switching

## 🎨 Customization

### **Theme Colors**
Edit `tailwind.config.js` to customize colors:
```javascript
theme: {
  extend: {
    colors: {
      primary: {
        DEFAULT: "hsl(221.2 83.2% 53.3%)",
        // ... more colors
      }
    }
  }
}
```

### **Animations**
Modify animations in `globals.css`:
```css
@keyframes custom-animation {
  0% { transform: translateY(0); }
  100% { transform: translateY(-10px); }
}
```

### **Component Styling**
All components use Tailwind classes and can be easily customized:
```jsx
<div className="bg-gradient-to-br from-blue-500 to-purple-600 p-6 rounded-xl">
  {/* Content */}
</div>
```

## 🔌 API Integration

### **Fetching Data**
```typescript
const fetchStats = async () => {
  const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/admin/stats/guild-id`);
  const data = await response.json();
  return data;
};
```

### **Real-time Updates**
```typescript
const useRealTimeData = () => {
  const [data, setData] = useState(null);
  
  useEffect(() => {
    const interval = setInterval(async () => {
      const newData = await fetchStats();
      setData(newData);
    }, 5000);
    
    return () => clearInterval(interval);
  }, []);
  
  return data;
};
```

## 🚀 Deployment

### **Vercel (Recommended)**
1. Connect your GitHub repository
2. Configure environment variables
3. Deploy automatically

### **Docker**
```dockerfile
FROM node:18-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production
COPY . .
RUN npm run build
EXPOSE 3001
CMD ["npm", "start"]
```

### **Manual Deployment**
```bash
npm run build
npm start
```

## 🎯 Performance Optimization

### **Code Splitting**
```typescript
import dynamic from 'next/dynamic';

const ChartComponent = dynamic(() => import('./Chart'), {
  loading: () => <p>Loading chart...</p>,
  ssr: false
});
```

### **Image Optimization**
```jsx
import Image from 'next/image';

<Image
  src="/logo.png"
  alt="Logo"
  width={100}
  height={100}
  priority
/>
```

### **Bundle Analysis**
```bash
npm run build
npm run analyze
```

## 🐛 Troubleshooting

### **Common Issues**

1. **Build Errors**
   - Check Node.js version (18+)
   - Clear cache: `rm -rf .next`
   - Reinstall dependencies

2. **API Connection Issues**
   - Verify backend is running
   - Check environment variables
   - Ensure CORS is configured

3. **Styling Issues**
   - Check Tailwind CSS configuration
   - Verify shadcn/ui setup
   - Clear browser cache

### **Debug Mode**
```bash
NODE_ENV=development npm run dev
```

## 🎨 Design System

### **Color Palette**
- **Primary**: Blue gradient (221.2°, 83.2%, 53.3%)
- **Secondary**: Purple accents
- **Success**: Green indicators
- **Warning**: Yellow alerts
- **Error**: Red notifications

### **Typography**
- **Font**: Inter (system font fallback)
- **Weights**: 400 (regular), 500 (medium), 600 (semibold), 700 (bold)
- **Sizes**: 12px (small), 14px (base), 16px (large), 20px (xl)

### **Spacing**
- **Scale**: 4px base unit
- **Padding**: 4px, 8px, 16px, 24px, 32px
- **Margins**: Same as padding
- **Gap**: 4px, 8px, 16px, 24px, 32px

### **Border Radius**
- **Small**: 4px (buttons, inputs)
- **Medium**: 8px (cards)
- **Large**: 12px (containers)
- **XL**: 16px (modals)

## 🎯 Future Enhancements

### **Planned Features**
- [ ] Real-time WebSocket connections
- [ ] Advanced filtering and search
- [ ] Export functionality
- [ ] Mobile app version
- [ ] Custom themes
- [ ] Multi-server support
- [ ] User permissions
- [ ] Audit logs
- [ ] Automated reports
- [ ] Integration with other platforms

### **Performance Improvements**
- [ ] Server-side rendering
- [ ] Edge caching
- [ ] Lazy loading
- [ ] Bundle optimization
- [ ] Image optimization
- [ ] Service workers

## 📞 Support

### **Getting Help**
1. Check this documentation
2. Review the code comments
3. Check GitHub issues
4. Join our Discord server

### **Contributing**
1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests
5. Submit a pull request

---

## 🎉 Ready to Use!

Your Sentinel AI frontend dashboard is now ready with:
- ✅ **Beautiful UI** with shadcn/ui components
- ✅ **Smooth animations** with Framer Motion
- ✅ **Real-time data** and live updates
- ✅ **Responsive design** for all devices
- ✅ **Professional styling** and modern design
- ✅ **TypeScript support** for type safety
- ✅ **Easy customization** and theming

**Start the development server and enjoy your beautiful dashboard!** 🚀
