# Food Delivery System - Frontend

This is the frontend for the Food Delivery System, built with React, Vite, and modern web technologies.

## Features

- User authentication and authorization
- Restaurant browsing and management
- Menu management
- Order placement and tracking
- Admin dashboard
- Google Maps integration for restaurant locations

## Prerequisites

- Node.js (v16+)
- npm or yarn
- Backend API running (see backend repository)
- Google Maps API key

## Setup

1. Clone the repository
2. Install dependencies:
   ```
   npm install
   ```
3. Copy the `.env.example` file to `.env` and update the variables:
   ```
   cp .env.example .env
   ```
4. Update the `.env` file with your API URL and Google Maps API key:
   ```
   VITE_API_URL=http://localhost:8000/api
   VITE_GOOGLE_MAPS_API_KEY=your_google_maps_api_key_here
   ```
   
   To get a Google Maps API key:
   - Go to the [Google Cloud Console](https://console.cloud.google.com/)
   - Create a new project or select an existing one
   - Navigate to the APIs & Services > Credentials section
   - Create an API key and enable the following APIs:
     - Maps JavaScript API
     - Places API
     - Geocoding API
   - Set appropriate restrictions on the API key for security

5. Start the development server:
   ```
   npm run dev
   ```

## Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run lint` - Run linter
- `npm run preview` - Preview production build locally

## Architecture

The frontend is organized as follows:

- `/src/components` - Reusable UI components
- `/src/context` - React context providers
- `/src/hooks` - Custom React hooks
- `/src/pages` - Page components
- `/src/services` - API services and utilities
- `/src/utils` - Utility functions and helpers

## License

[License information]

# React + Vite

This template provides a minimal setup to get React working in Vite with HMR and some ESLint rules.

Currently, two official plugins are available:

- [@vitejs/plugin-react](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react) uses [Babel](https://babeljs.io/) for Fast Refresh
- [@vitejs/plugin-react-swc](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react-swc) uses [SWC](https://swc.rs/) for Fast Refresh

## Expanding the ESLint configuration

If you are developing a production application, we recommend using TypeScript with type-aware lint rules enabled. Check out the [TS template](https://github.com/vitejs/vite/tree/main/packages/create-vite/template-react-ts) for information on how to integrate TypeScript and [`typescript-eslint`](https://typescript-eslint.io) in your project.
