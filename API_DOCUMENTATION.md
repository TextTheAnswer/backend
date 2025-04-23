# API Documentation for Text The Answer Backend

## Overview

This document provides comprehensive documentation for the Text The Answer backend API. The application is a real-time multiplayer trivia game where users type out answers and compete based on speed and accuracy.

## Authentication

### Base URL
```
/api/auth
```

### Endpoints

#### Register
- **URL**: `/register`
- **Method**: `POST`
- **Description**: Register a new user
- **Request Body**:
  ```json
  {
    "email": "user@example.com",
    "password": "securepassword",
    "name": "User Name",
    "isStudent": false
  }
  ```
- **Response**:
  ```json
  {
    "success": true,
    "token": "jwt_token_here",
    "user": {
      "_id": "user_id",
      "name": "User Name",
      "email": "user@example.com",
      "subscription": {
        "status": "free",
        "expiresAt": null
      }
    }
  }
  ```

#### Login
- **URL**: `/login`
- **Method**: `POST`
- **Description**: Login with existing credentials
- **Request Body**:
  ```json
  {
    "email": "user@example.com",
    "password": "securepassword"
  }
  ```
- **Response**:
  ```json
  {
    "success": true,
    "token": "jwt_token_here",
    "user": {
      "_id": "user_id",
      "name": "User Name",
      "email": "user@example.com",
      "subscription": {
        "status": "free",
        "expiresAt": null
      }
    }
  }
  ```

#### Apple Login
- **URL**: `/apple-login`
- **Method**: `POST`
- **Description**: Login with Apple credentials
- **Request Body**:
  ```json
  {
    "idToken": "apple_id_token",
    "name": "User Name" // Optional, only for first-time users
  }
  ```
- **Response**:
  ```json
  {
    "success": true,
    "token": "jwt_token_here",
    "user": {
      "_id": "user_id",
      "name": "User Name",
      "email": "user@example.com",
      "subscription": {
        "status": "free",
        "expiresAt": null
      }
    }
  }
  ```

#### Logout
- **URL**: `/logout`
- **Method**: `POST`
- **Description**: Invalidate the current JWT token
- **Authentication**: Required
- **Response**:
  ```json
  {
    "success": true,
    "message": "Logged out successfully"
  }
  ```

#### Verify Student
- **URL**: `/verify-student`
- **Method**: `POST`
- **Description**: Verify a user as a student to access education tier features
- **Authentication**: Required
- **Request Body**:
  ```json
  {
    "studentId": "student_id_number",
    "institution": "School Name"
  }
  ```
- **Response**:
  ```json
  {
    "success": true,
    "message": "Student verification request submitted",
    "verificationStatus": "pending"
  }
  ```

## User Profile

### Base URL
```
/api/users
```

### Endpoints

#### Get Profile
- **URL**: `/profile`
- **Method**: `GET`
- **Description**: Get the current user's profile
- **Authentication**: Required
- **Response**:
  ```json
  {
    "success": true,
    "user": {
      "_id": "user_id",
      "name": "User Name",
      "email": "user@example.com",
      "bio": "User bio",
      "location": "User location",
      "subscription": {
        "status": "free",
        "expiresAt": null
      },
      "stats": {
        "totalAnswered": 50,
        "totalCorrect": 40,
        "streak": 5,
        "lastPlayed": "2025-04-22T12:00:00Z"
      }
    }
  }
  ```

#### Update Profile
- **URL**: `/profile`
- **Method**: `PUT`
- **Description**: Update the current user's profile
- **Authentication**: Required
- **Request Body**:
  ```json
  {
    "name": "Updated Name",
    "bio": "Updated bio",
    "location": "Updated location"
  }
  ```
- **Response**:
  ```json
  {
    "success": true,
    "user": {
      "_id": "user_id",
      "name": "Updated Name",
      "email": "user@example.com",
      "bio": "Updated bio",
      "location": "Updated location"
    }
  }
  ```

## Daily Quiz

### Base URL
```
/api/quiz
```

### Endpoints

#### Get Daily Questions
- **URL**: `/daily`
- **Method**: `GET`
- **Description**: Get today's quiz questions
- **Authentication**: Required
- **Response**:
  ```json
  {
    "success": true,
    "questions": [
      {
        "_id": "question_id",
        "text": "What is the capital of France?",
        "category": "Geography",
        "difficulty": "easy",
        "timeLimit": 30
      }
    ],
    "questionsAnswered": 0,
    "correctAnswers": 0,
    "theme": {
      "name": "Geography",
      "description": "Today's theme is Geography"
    }
  }
  ```
- **Notes**: 
  - Free tier users are limited to 10 questions per day
  - Each day has a specific theme (e.g., Sports, Anime, Science)

#### Submit Answer
- **URL**: `/daily/submit`
- **Method**: `POST`
- **Description**: Submit an answer for a daily quiz question
- **Authentication**: Required
- **Request Body**:
  ```json
  {
    "questionId": "question_id",
    "answer": "Paris",
    "timeSpent": 5.2
  }
  ```
- **Response**:
  ```json
  {
    "success": true,
    "isCorrect": true,
    "points": 175,
    "correctAnswer": "Paris",
    "explanation": "Paris is the capital and most populous city of France.",
    "questionsAnswered": 1,
    "correctAnswers": 1,
    "totalScore": 175,
    "streak": 1,
    "withinTimeLimit": true
  }
  ```
- **Notes**:
  - Points are calculated based on correctness, time spent, and difficulty
  - Free tier users are limited to 10 questions per day

#### Get Daily Leaderboard
- **URL**: `/daily/leaderboard`
- **Method**: `GET`
- **Description**: Get the leaderboard for today's quiz
- **Authentication**: Required
- **Response**:
  ```json
  {
    "success": true,
    "leaderboard": [
      {
        "rank": 1,
        "name": "Top User",
        "correctAnswers": 10,
        "score": 1500,
        "isPerfectScore": true
      }
    ],
    "userRank": 5,
    "userScore": 1200,
    "theme": {
      "name": "Geography",
      "description": "Today's theme is Geography"
    },
    "winner": {
      "id": "user_id",
      "score": 1500
    }
  }
  ```

#### Get Categories
- **URL**: `/categories`
- **Method**: `GET`
- **Description**: Get all available question categories
- **Authentication**: Required
- **Response**:
  ```json
  {
    "success": true,
    "categories": [
      {
        "_id": "category_id",
        "name": "Sports",
        "description": "Questions about various sports and athletic competitions",
        "icon": "🏆",
        "color": "#e74c3c",
        "order": 1
      }
    ]
  }
  ```

#### Get Upcoming Themes
- **URL**: `/upcoming-themes`
- **Method**: `GET`
- **Description**: Get the themes for upcoming daily quizzes
- **Authentication**: Required
- **Subscription**: Premium required
- **Response**:
  ```json
  {
    "success": true,
    "upcomingThemes": [
      {
        "date": "2025-04-24",
        "theme": "Sports",
        "description": "Test your knowledge of sports and athletics"
      }
    ]
  }
  ```

## Multiplayer Game (Premium Feature)

### Base URL
```
/api/game
```

### Endpoints

#### Create Lobby
- **URL**: `/lobby`
- **Method**: `POST`
- **Description**: Create a new game lobby
- **Authentication**: Required
- **Subscription**: Premium required
- **Request Body**:
  ```json
  {
    "name": "My Game Lobby",
    "isPrivate": true,
    "maxPlayers": 5,
    "category": "Sports",
    "difficulty": "medium"
  }
  ```
- **Response**:
  ```json
  {
    "success": true,
    "lobby": {
      "_id": "lobby_id",
      "name": "My Game Lobby",
      "code": "ABCDEF",
      "host": "user_id",
      "players": ["user_id"],
      "isPrivate": true,
      "maxPlayers": 5,
      "category": "Sports",
      "difficulty": "medium",
      "status": "waiting",
      "createdAt": "2025-04-23T12:00:00Z"
    }
  }
  ```

#### Join Lobby
- **URL**: `/lobby/join`
- **Method**: `POST`
- **Description**: Join an existing game lobby
- **Authentication**: Required
- **Subscription**: Premium required
- **Request Body**:
  ```json
  {
    "code": "ABCDEF"
  }
  ```
- **Response**:
  ```json
  {
    "success": true,
    "lobby": {
      "_id": "lobby_id",
      "name": "My Game Lobby",
      "code": "ABCDEF",
      "host": "host_user_id",
      "players": ["host_user_id", "user_id"],
      "isPrivate": true,
      "maxPlayers": 5,
      "category": "Sports",
      "difficulty": "medium",
      "status": "waiting",
      "createdAt": "2025-04-23T12:00:00Z"
    }
  }
  ```

#### Get Public Lobbies
- **URL**: `/lobby/public`
- **Method**: `GET`
- **Description**: Get a list of public game lobbies
- **Authentication**: Required
- **Subscription**: Premium required
- **Response**:
  ```json
  {
    "success": true,
    "lobbies": [
      {
        "_id": "lobby_id",
        "name": "Public Game Lobby",
        "code": "ABCDEF",
        "host": "host_user_id",
        "playerCount": 3,
        "maxPlayers": 5,
        "category": "Sports",
        "difficulty": "medium",
        "status": "waiting",
        "createdAt": "2025-04-23T12:00:00Z"
      }
    ]
  }
  ```

#### Start Game
- **URL**: `/lobby/start`
- **Method**: `POST`
- **Description**: Start a game in a lobby (host only)
- **Authentication**: Required
- **Subscription**: Premium required
- **Request Body**:
  ```json
  {
    "lobbyId": "lobby_id"
  }
  ```
- **Response**:
  ```json
  {
    "success": true,
    "game": {
      "_id": "game_id",
      "lobby": "lobby_id",
      "status": "started",
      "startedAt": "2025-04-23T12:05:00Z"
    }
  }
  ```

## Study Materials (Education Tier Feature)

### Base URL
```
/api/study
```

### Endpoints

#### Upload Material
- **URL**: `/materials`
- **Method**: `POST`
- **Description**: Upload study material to generate questions
- **Authentication**: Required
- **Subscription**: Education tier required
- **Request Body**: `multipart/form-data`
  - `file`: PDF or text file
  - `title`: String
  - `description`: String
  - `subject`: String
- **Response**:
  ```json
  {
    "success": true,
    "material": {
      "_id": "material_id",
      "title": "Biology Chapter 5",
      "description": "Cell structure and function",
      "subject": "Biology",
      "fileUrl": "https://storage.example.com/materials/file.pdf",
      "status": "processing",
      "uploadedAt": "2025-04-23T12:00:00Z"
    }
  }
  ```

#### Get Materials
- **URL**: `/materials`
- **Method**: `GET`
- **Description**: Get all uploaded study materials
- **Authentication**: Required
- **Subscription**: Education tier required
- **Response**:
  ```json
  {
    "success": true,
    "materials": [
      {
        "_id": "material_id",
        "title": "Biology Chapter 5",
        "description": "Cell structure and function",
        "subject": "Biology",
        "fileUrl": "https://storage.example.com/materials/file.pdf",
        "status": "completed",
        "questionsGenerated": 15,
        "uploadedAt": "2025-04-23T12:00:00Z"
      }
    ]
  }
  ```

#### Get Generated Questions
- **URL**: `/materials/:materialId/questions`
- **Method**: `GET`
- **Description**: Get questions generated from a specific study material
- **Authentication**: Required
- **Subscription**: Education tier required
- **Response**:
  ```json
  {
    "success": true,
    "questions": [
      {
        "_id": "question_id",
        "text": "What is the powerhouse of the cell?",
        "correctAnswer": "Mitochondria",
        "difficulty": "easy",
        "explanation": "Mitochondria are organelles that generate most of the cell's supply of ATP."
      }
    ]
  }
  ```

#### Create Study Session
- **URL**: `/session`
- **Method**: `POST`
- **Description**: Create a study session with generated questions
- **Authentication**: Required
- **Subscription**: Education tier required
- **Request Body**:
  ```json
  {
    "materialId": "material_id",
    "isMultiplayer": true,
    "maxPlayers": 3
  }
  ```
- **Response**:
  ```json
  {
    "success": true,
    "session": {
      "_id": "session_id",
      "material": "material_id",
      "code": "ABCDEF",
      "host": "user_id",
      "isMultiplayer": true,
      "maxPlayers": 3,
      "status": "waiting",
      "createdAt": "2025-04-23T12:00:00Z"
    }
  }
  ```

## Subscription Management

### Base URL
```
/api/subscription
```

### Endpoints

#### Get Subscription
- **URL**: `/`
- **Method**: `GET`
- **Description**: Get the current user's subscription details
- **Authentication**: Required
- **Response**:
  ```json
  {
    "success": true,
    "subscription": {
      "status": "premium",
      "stripeCustomerId": "cus_123456789",
      "currentPeriodEnd": "2025-05-23T12:00:00Z",
      "cancelAtPeriodEnd": false
    }
  }
  ```

#### Create Checkout Session
- **URL**: `/checkout`
- **Method**: `POST`
- **Description**: Create a Stripe checkout session for subscription
- **Authentication**: Required
- **Request Body**:
  ```json
  {
    "plan": "premium", // or "education"
    "successUrl": "https://example.com/success",
    "cancelUrl": "https://example.com/cancel"
  }
  ```
- **Response**:
  ```json
  {
    "success": true,
    "sessionId": "cs_test_123456789",
    "url": "https://checkout.stripe.com/pay/cs_test_123456789"
  }
  ```

#### Cancel Subscription
- **URL**: `/cancel`
- **Method**: `POST`
- **Description**: Cancel the current subscription at the end of the billing period
- **Authentication**: Required
- **Response**:
  ```json
  {
    "success": true,
    "message": "Subscription will be canceled at the end of the current billing period",
    "currentPeriodEnd": "2025-05-23T12:00:00Z"
  }
  ```

## Real-time Socket Events

The application uses Socket.IO for real-time communication. Here are the main socket events:

### Connection
```javascript
// Connect to socket server with authentication token
const socket = io('https://api.example.com', {
  auth: {
    token: 'jwt_token_here'
  }
});
```

### Game Events

#### Joining a Game
```javascript
// Client emits
socket.emit('join-game', { lobbyCode: 'ABCDEF' });

// Client listens
socket.on('game-joined', (data) => {
  // data contains game information and players
});
```

#### Game Start
```javascript
// Client listens
socket.on('game-started', (data) => {
  // data contains first question and game details
});
```

#### Submit Answer
```javascript
// Client emits
socket.emit('submit-answer', { 
  gameId: 'game_id',
  questionId: 'question_id',
  answer: 'Paris',
  timeSpent: 5.2
});

// Client listens
socket.on('answer-result', (data) => {
  // data contains result, correct answer, and points
});
```

#### Next Question
```javascript
// Client listens
socket.on('next-question', (data) => {
  // data contains the next question
});
```

#### Game End
```javascript
// Client listens
socket.on('game-ended', (data) => {
  // data contains final results and rankings
});
```

## Error Handling

All API endpoints follow a consistent error response format:

```json
{
  "success": false,
  "message": "Error message describing what went wrong",
  "error": "Detailed error information (only in development mode)"
}
```

Common HTTP status codes:
- `400`: Bad Request - Invalid input parameters
- `401`: Unauthorized - Authentication required
- `403`: Forbidden - Insufficient permissions (e.g., subscription tier)
- `404`: Not Found - Resource not found
- `429`: Too Many Requests - Rate limit exceeded
- `500`: Internal Server Error - Server-side error

## Rate Limiting

To prevent abuse, the API implements rate limiting:
- Authentication endpoints: 10 requests per minute
- General endpoints: 60 requests per minute
- Socket connections: 5 connections per minute per user

## Versioning

The current API version is v1. All endpoints are prefixed with `/api/v1/`.

## Changelog

### v1.0.0 (2025-04-23)
- Initial release with core functionality
- Added category-based daily questions with themes
- Implemented tier-specific features (free, premium, education)
- Added comprehensive API documentation
