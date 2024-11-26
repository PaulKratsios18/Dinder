# Dinder Backend

Express.js backend server handling the business logic, database operations, and external API integrations for Dinder.

## Environment Setup
Create a `.env` file in this directory with:

```
MONGODB_URI=your_mongodb_connection_string
GOOGLE_PLACES_API_KEY=your_google_api_key
PORT=5000
DB_NAME=dinder
```

## Development

1. Install dependencies

```bash
npm install
```

2. Start development server

```bash
npm start
```

## Project Structure

```
backend/
├── models/           # MongoDB schemas
│   ├── Session.js    # Session model
│   ├── Restaurant.js # Restaurant model
│   └── Vote.js       # Vote model
├── routes/           # Express routes
├── services/         # External API integrations
│   ├── restaurants/  # Yelp API integration
│   ├── utils/        # Restaurant utility functions
│   └── votes/        # Vote logic
├── utils/            # Utility functions
├── templates/        # Results template
├── websocket/        # WebSocket logic
├── server.js         # Express server
├── .env              # Environment variables
└── ...
```

## API Endpoints

### Sessions
- `POST /api/sessions/create`: Create new session
- `GET /api/sessions/:sessionId`: Get session details
- `DELETE /api/sessions/:sessionId`: End session

### Preferences
- `POST /api/preferences`: Save user preferences
- `GET /api/preferences/:sessionId`: Get session preferences

### Restaurants
- `GET /api/sessions/:sessionId/restaurants`: Get restaurants for session
- `POST /api/sessions/:sessionId/start`: Start restaurant matching

## Component Dependencies
- express: Web framework
- mongoose: MongoDB object modeling
- socket.io: Real-time communication
- @googlemaps/google-maps-services-js: Google Places API client
- cors: Cross-origin resource sharing
- dotenv: Environment variable management
- ws: WebSocket server
- axios: HTTP client
- haversine: Distance calculations

## WebSocket Events
- `createSession`: Create new session
- `joinSession`: Join existing session
- `participantsUpdate`: Update participant list
- `startSession`: Begin restaurant matching
- `preferenceUpdate`: Update user preferences

## Contributing
When adding new features:
1. Create appropriate model/route/service files
2. Follow existing code structure and naming conventions
3. Add error handling and input validation
4. Include logging for debugging
5. Update API documentation
6. Add tests for new functionality

## Error Handling
The API uses standard HTTP status codes:
- 200: Success
- 400: Bad Request
- 401: Unauthorized
- 404: Not Found
- 500: Server Error

All error responses follow the format:
```json
{
  "error": "Error message",
  "details": "Detailed error information"
}
```