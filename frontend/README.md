# Dinder Frontend

This is the React-based frontend for Dinder. It handles the interface and interactions for the restaurant matchmaking application.

## Environment Setup
Create a `.env` file in this directory with:

```
REACT_APP_BACKEND_URL=http://localhost:5000
REACT_APP_GOOGLE_MAPS_API_KEY=your_api_key_here
PORT=3001
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

3. Open [http://localhost:3000](http://localhost:3000) to view it in the browser

## Project Structure

```
frontend/
├── public/ # Static files
├── src/
│   ├── assets/                # Assets
│   ├── components/            # Reusable UI components
│   ├── pages/                 # Page components
│   |   ├── about/             # About page
│   |   ├── homepage/          # Homepage
│   |   ├── lobby-host/        # Lobby host page
│   |   ├── lobby-join/        # Lobby join page
│   |   ├── preferences-host/  # Preferences host page
│   |   ├── preferences-join/  # Preferences join page
│   |   ├── restaurant-swiper/ # Restaurant swiper page
│   |   └── ...
│   ├── utils/                 # Helper functions and utilities
│   └── ...
├── .env                       # Environment variables
└── ...
```

## Component Dependencies
- react-router-dom: Page routing
- socket.io-client: Real-time communication
- @googlemaps/js-api-loader: Google Maps integration

## Contributing
When adding new components:
1. Create a new directory under appropriate section
2. Include component-specific CSS
3. Add tests where applicable
4. Update this documentation if adding new features