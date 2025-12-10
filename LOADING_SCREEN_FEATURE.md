# Loading Screen Feature

## Overview
Added a full-page preloader that displays while the frontend waits for the backend API to become available during startup.

## Changes Made

### 1. New Component: LoadingScreen
**File:** `frontend/src/components/LoadingScreen.tsx`

- Full-page overlay with centered content
- Displays loading spinner
- Shows dynamic status messages
- Includes helpful tip about Lambda cold starts
- Uses Cloudscape Design System components

### 2. Enhanced API Client
**File:** `frontend/src/services/api.ts`

- Added `healthCheck()` method
- Tests `/api/rooms` endpoint (requires both Lambda and DynamoDB)
- Performs health check with 5 retries
- Returns boolean indicating full backend availability

### 3. Updated App Component
**File:** `frontend/src/App.tsx`

- Implements backend health check on startup
- Retries up to 30 times (30 seconds) with 1-second intervals
- Shows loading screen until backend is ready
- Displays attempt counter in loading message
- Falls back to default configuration after max retries
- Gracefully handles backend unavailability

## User Experience

### Startup Flow
1. **Initial Load**: Shows "Starting application..." message
2. **Health Checks**: Displays "Connecting to backend services... (attempt X/30)"
3. **Backend Ready**: Shows "Backend connected! Loading configuration..."
4. **App Loads**: Transitions to main application

### Timing
- **Normal startup**: 5-10 seconds (Lambda cold start)
- **Max wait time**: 30 seconds before fallback
- **Retry interval**: 1 second between attempts

### Fallback Behavior
If backend doesn't respond after 30 attempts:
- Warning logged to console
- Shows message: "Could not connect to backend. Using default configuration..."
- App loads with default configuration after 2 seconds
- User can still interact with UI (though API calls may fail)

### DynamoDB Table Setup
The health check specifically tests `/api/rooms` which requires:
1. Lambda functions running
2. DynamoDB Local accessible
3. Rooms table created

If you see errors about "ResourceNotFoundException" or "non-existent table":
- Run `npm run dynamodb:setup` to create the table
- Or use `npm start` which handles setup automatically

## Benefits

1. **Better UX**: No blank screen or errors during startup
2. **Clear Feedback**: Users know the app is loading, not broken
3. **Graceful Degradation**: App loads even if backend is slow/unavailable
4. **Educational**: Tip explains Lambda cold starts for workshop participants

## Testing

### Proper Startup (Recommended)
```bash
# Use the start script which handles everything in order:
npm start

# This will:
# 1. Start DynamoDB Local
# 2. Create the Rooms table and add sample data
# 3. Start the backend (SAM Local)
# 4. Start the frontend (after 5 second delay)
```

### Manual Testing of Loading Screen
```bash
# Start backend without table setup (to see loading screen longer)
npm run dev:backend

# In another terminal, start frontend
npm run dev:frontend

# You'll see the loading screen while backend/DynamoDB initialize
```

## Configuration

The health check behavior can be adjusted in `App.tsx`:
- `maxRetries`: Number of health check attempts (default: 30)
- Retry delay: Time between attempts (default: 1000ms)
- Fallback delay: Time before showing app after max retries (default: 2000ms)
