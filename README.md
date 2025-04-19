# Text The Answer - API Testing Portal

This is an interactive API testing interface for the Text The Answer application. It allows developers and testers to try out API endpoints directly from a web browser.

## Features

- **Interactive UI**: Modern, responsive interface for testing API endpoints
- **Authentication**: Test user login, registration, and profile management 
- **API Categories**: Organized sections for different API functionality
- **Response Display**: Formatted JSON responses with status codes
- **Dark Mode**: Support for light and dark themes

## Getting Started

1. Clone this repository
2. Install dependencies with `npm install`
3. Start the server with `npm run dev`
4. Open your browser to `http://localhost:3000/api-tester`

## Usage

### Authentication

The API tester provides endpoints for:
- Creating an account (registration)
- Signing in with credentials
- Viewing your user profile
- Student registration with education tier

Many endpoints require authentication. You must first sign in to access these protected routes.

### API Categories

The tester includes sections for:

- **Authentication**: Register, login, and manage user sessions
- **User Profile**: View and update user details
- **Quiz Features**: Test daily quiz endpoints and answer submission
- **Multiplayer**: Create and join game lobbies, view game results
- **Subscriptions**: View and manage subscription plans

### Testing Workflow

1. Start by creating an account or signing in
2. Once authenticated, the status indicator will show your login status
3. Select different API endpoints from the sidebar
4. Fill in the required parameters and click "Send Request"
5. View the response in the panel below
6. Use the "Copy" button to copy the response for debugging

## Development

The API tester is built with:

- HTML/CSS/JavaScript (frontend)
- Bootstrap for styling
- Express.js (backend)

The main files are:
- `src/public/index.html`: Main interface
- `src/public/css/api-tester.css`: Styling
- `src/public/js/api-tester.js`: Frontend functionality

## API Documentation

For more detailed API documentation, visit `/api-docs` when the server is running.

## License

MIT 