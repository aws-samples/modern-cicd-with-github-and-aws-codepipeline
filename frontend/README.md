# Frontend

React-based frontend for the hotel management application using AWS Cloudscape Design System.

## Technology Stack

- React 18+
- TypeScript
- Vite (build tool)
- AWS Cloudscape Design System
- React Router
- Vitest (testing)

## Getting Started

```bash
# Install dependencies (from root)
npm install

# Start development server
npm run dev:frontend

# Or from this directory
npm run dev
```

The application will be available at http://localhost:5173

## Available Scripts

- `npm run dev` - Start development server with hot reload
- `npm run build` - Build for production
- `npm run preview` - Preview production build
- `npm run test` - Run unit tests
- `npm run test:watch` - Run tests in watch mode
- `npm run test:coverage` - Run tests with coverage report
- `npm run lint` - Lint code
- `npm run format` - Format code with Prettier

## Project Structure

```
frontend/
├── src/
│   ├── components/     # React components
│   ├── layouts/        # Layout components
│   ├── services/       # API client and services
│   ├── types/          # TypeScript type definitions
│   ├── utils/          # Utility functions
│   ├── App.tsx         # Main application component
│   ├── main.tsx        # Application entry point
│   └── config.ts       # Configuration management
├── public/             # Static assets
└── index.html          # HTML template
```

## Environment Variables

Create a `.env.local` file for local development:

```
VITE_API_URL=http://localhost:3000
VITE_HOTEL_NAME=AWS Hotel
```

## Testing

Tests are written using Vitest and React Testing Library. Run tests with:

```bash
npm run test
```

## Building for Production

```bash
npm run build
```

The build output will be in the `dist/` directory, ready for deployment to S3.
