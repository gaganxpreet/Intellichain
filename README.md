# Intelli-Chain Logistics Platform

## Google Maps API Setup

This application uses Google Maps Platform for geocoding, places autocomplete, and map visualization.

### Required APIs
1. **Maps JavaScript API** - For map rendering
2. **Places API** - For address autocomplete
3. **Geocoding API** - For address-to-coordinates conversion
4. **Directions API** - For route visualization

### API Key Configuration
1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select existing one
3. Enable the required APIs listed above
4. Create API credentials:
   - **Client-side key**: Restrict by HTTP referrer (for frontend)
   - **Server-side key**: Restrict by IP address (for backend)

### Environment Variables
```bash
# Client-side key (restricted by HTTP referrer)
VITE_GOOGLE_MAPS_API_KEY=your_client_api_key_here

# Server-side key (restricted by IP - for future backend use)
GOOGLE_MAPS_SERVER_KEY=your_server_api_key_here
```

### Security Best Practices
- **Client key**: Restrict to your domain(s) only
- **Server key**: Restrict to your server IP addresses
- **Quota limits**: Set daily/monthly usage limits
- **Monitor usage**: Enable billing alerts

## Admin Access Credentials

**Email:** admin@intelli-chain.com  
**Password:** Admin@123456

## Features

- **Smart Logistics Algorithm**: Hub-based routing with shared pooling optimization  
- **Real-time Tracking**: Live GPS tracking with interactive maps
- **Google Maps Integration**: 
  - Address autocomplete with Places API
  - Interactive satellite/hybrid maps
  - Real driving route visualization
  - Geocoding and reverse geocoding
- **Driver Management**: Complete driver interface with status updates
- **Admin Dashboard**: Full system administration capabilities

## Setup Instructions

1. **Database Setup**: Run the migration files to create the database schema
2. **Admin User**: Use the provided credentials to access admin features
3. **API Keys**: All API keys are pre-configured in the .env file

## Technology Stack

- **Frontend**: React + TypeScript + Tailwind CSS
- **Backend**: Supabase (PostgreSQL)
- **Maps**: Google Maps Platform (JavaScript API, Places API, Directions API)
- **Authentication**: Supabase Auth
- **Real-time**: Supabase Realtime

## API Integrations

- **Google Maps Platform**: 
  - Places Autocomplete for address input
  - Interactive maps with satellite imagery
  - Directions API for real driving routes
  - Geocoding for address-to-coordinates conversion
- **Supabase**: Real-time database and authentication

## User Roles

1. **Shippers**: Book and track shipments
2. **Drivers**: Manage deliveries and update status
3. **Admins**: Full system access and management