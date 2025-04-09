# Text the Answer API Documentation

## Base URL
`http://localhost:3000/api`

## Authentication Endpoints

### Register a new user
- **URL**: `6`
- **Method**: `POST`
- **Auth required**: No
- **Request body**:
  ```json
  {
    "email": "user@example.com",
    "password": "securepassword",
    "name": "User Name"
  }
  ```
- **Success Response**: 
  - **Code**: 201
  - **Content**: 
    ```json
    {
      "success": true,
      "message": "User registered successfully",
      "token": "jwt_token",
      "user": {
        "id": "user_id",
        "email": "user@example.com",
        "name": "User Name",
        "subscription": "free",
        "isPremium": false
      }
    }
    ```

### Login user
- **URL**: `/auth/login`
- **Method**: `POST`
- **Auth required**: No
- **Request body**:
  ```json
  {
    "email": "user@example.com",
    "password": "securepassword"
  }
  ```
- **Success Response**: 
  - **Code**: 200
  - **Content**: 
    ```json
    {
      "success": true,
      "message": "Login successful",
      "token": "jwt_token",
      "user": {
        "id": "user_id",
        "email": "user@example.com",
        "name": "User Name",
        "subscription": "free",
        "isPremium": false
      }
    }
    ```

### Apple OAuth callback
- **URL**: `/auth/apple/callback`
- **Method**: `POST`
- **Auth required**: No
- **Request body**:
  ```json
  {
    "appleId": "apple_id",
    "email": "user@example.com",
    "name": "User Name"
  }
  ```
- **Success Response**: 
  - **Code**: 200
  - **Content**: 
    ```json
    {
      "success": true,
      "message": "Apple authentication successful",
      "token": "jwt_token",
      "user": {
        "id": "user_id",
        "email": "user@example.com",
        "name": "User Name",
        "subscription": "free",
        "isPremium": false
      }
    }
    ```

### Get user profile
- **URL**: `/auth/profile`
- **Method**: `GET`
- **Auth required**: Yes (JWT token in Authorization header)
- **Success Response**: 
  - **Code**: 200
  - **Content**: 
    ```json
    {
      "success": true,
      "user": {
        "id": "user_id",
        "email": "user@example.com",
        "name": "User Name",
        "subscription": {
          "status": "free",
          "stripeCustomerId": "customer_id",
          "currentPeriodEnd": "2023-05-01T00:00:00.000Z"
        },
        "stats": {
          "streak": 3,
          "totalCorrect": 25,
          "totalAnswered": 40
        },
        "dailyQuiz": {
          "questionsAnswered": 5,
          "correctAnswers": 3
        },
        "isPremium": false
      }
    }
    ```

### Logout
- **URL**: `/auth/logout`
- **Method**: `POST`
- **Auth required**: Yes (JWT token in Authorization header)
- **Success Response**: 
  - **Code**: 200
  - **Content**: 
    ```json
    {
      "success": true,
      "message": "Logged out successfully"
    }
    ```

## Daily Quiz Endpoints

### Get daily questions
- **URL**: `/quiz/daily`
- **Method**: `GET`
- **Auth required**: Yes (JWT token in Authorization header)
- **Success Response**: 
  - **Code**: 200
  - **Content**: 
    ```json
    {
      "success": true,
      "questions": [
        {
          "id": "question_id",
          "text": "What is the capital of France?",
          "options": ["London", "Berlin", "Paris", "Madrid"],
          "category": "Geography",
          "difficulty": "easy"
        },
        // ... more questions
      ],
      "questionsAnswered": 3,
      "correctAnswers": 2
    }
    ```

### Submit answer for daily quiz
- **URL**: `/quiz/daily/submit`
- **Method**: `POST`
- **Auth required**: Yes (JWT token in Authorization header)
- **Request body**:
  ```json
  {
    "questionId": "question_id",
    "answer": 2
  }
  ```
- **Success Response**: 
  - **Code**: 200
  - **Content**: 
    ```json
    {
      "success": true,
      "isCorrect": true,
      "correctAnswer": 2,
      "explanation": "Paris is the capital of France",
      "questionsAnswered": 4,
      "correctAnswers": 3,
      "streak": 3
    }
    ```

### Get daily quiz leaderboard
- **URL**: `/quiz/daily/leaderboard`
- **Method**: `GET`
- **Auth required**: Yes (JWT token in Authorization header)
- **Success Response**: 
  - **Code**: 200
  - **Content**: 
    ```json
    {
      "success": true,
      "leaderboard": [
        {
          "rank": 1,
          "name": "Top User",
          "score": 10
        },
        // ... more entries
      ],
      "userRank": 5,
      "winner": {
        "id": "user_id",
        "score": 10
      }
    }
    ```

## Multiplayer Game Endpoints

### Create a lobby
- **URL**: `/game/lobby`
- **Method**: `POST`
- **Auth required**: Yes (JWT token in Authorization header)
- **Premium required**: Yes
- **Request body**:
  ```json
  {
    "name": "Fun Trivia Room",
    "isPublic": true,
    "maxPlayers": 5
  }
  ```
- **Success Response**: 
  - **Code**: 201
  - **Content**: 
    ```json
    {
      "success": true,
      "lobby": {
        "id": "lobby_id",
        "name": "Fun Trivia Room",
        "code": "ABC123",
        "isPublic": true,
        "host": "user_id",
        "players": [
          {
            "user": "user_id",
            "ready": false
          }
        ],
        "maxPlayers": 5,
        "status": "waiting"
      }
    }
    ```

### Get public lobbies
- **URL**: `/game/lobbies`
- **Method**: `GET`
- **Auth required**: Yes (JWT token in Authorization header)
- **Premium required**: Yes
- **Success Response**: 
  - **Code**: 200
  - **Content**: 
    ```json
    {
      "success": true,
      "lobbies": [
        {
          "id": "lobby_id",
          "name": "Fun Trivia Room",
          "code": "ABC123",
          "host": {
            "id": "user_id",
            "name": "Host Name"
          },
          "playerCount": 3,
          "maxPlayers": 5,
          "isFull": false
        },
        // ... more lobbies
      ]
    }
    ```

### Join a lobby by code
- **URL**: `/game/lobby/join`
- **Method**: `POST`
- **Auth required**: Yes (JWT token in Authorization header)
- **Premium required**: Yes
- **Request body**:
  ```json
  {
    "code": "ABC123"
  }
  ```
- **Success Response**: 
  - **Code**: 200
  - **Content**: 
    ```json
    {
      "success": true,
      "lobby": {
        "id": "lobby_id",
        "name": "Fun Trivia Room",
        "code": "ABC123",
        "isPublic": true,
        "host": {
          "id": "host_id",
          "name": "Host Name"
        },
        "players": [
          {
            "id": "user_id",
            "name": "User Name",
            "ready": false
          },
          // ... more players
        ],
        "maxPlayers": 5,
        "status": "waiting"
      }
    }
    ```

### Leave a lobby
- **URL**: `/game/lobby/:lobbyId`
- **Method**: `DELETE`
- **Auth required**: Yes (JWT token in Authorization header)
- **Success Response**: 
  - **Code**: 200
  - **Content**: 
    ```json
    {
      "success": true,
      "message": "You left the lobby"
    }
    ```

### Start a game in a lobby
- **URL**: `/game/lobby/:lobbyId/start`
- **Method**: `POST`
- **Auth required**: Yes (JWT token in Authorization header)
- **Success Response**: 
  - **Code**: 200
  - **Content**: 
    ```json
    {
      "success": true,
      "game": {
        "id": "game_id",
        "questions": [
          {
            "id": "question_id",
            "text": "What is the capital of France?",
            "options": ["London", "Berlin", "Paris", "Madrid"],
            "category": "Geography",
            "difficulty": "easy"
          },
          // ... more questions
        ],
        "players": [
          {
            "id": "user_id",
            "score": 0
          },
          // ... more players
        ],
        "status": "starting"
      }
    }
    ```

### Submit an answer in a game
- **URL**: `/game/answer`
- **Method**: `POST`
- **Auth required**: Yes (JWT token in Authorization header)
- **Request body**:
  ```json
  {
    "gameId": "game_id",
    "questionIndex": 0,
    "answer": 2
  }
  ```
- **Success Response**: 
  - **Code**: 200
  - **Content**: 
    ```json
    {
      "success": true,
      "result": {
        "isCorrect": true,
        "correctAnswer": 2,
        "score": 850,
        "totalScore": 850,
        "allAnswered": false
      }
    }
    ```

### Get game results
- **URL**: `/game/results/:gameId`
- **Method**: `GET`
- **Auth required**: Yes (JWT token in Authorization header)
- **Success Response**: 
  - **Code**: 200
  - **Content**: 
    ```json
    {
      "success": true,
      "results": {
        "id": "game_id",
        "players": [
          {
            "id": "user_id",
            "name": "User Name",
            "score": 2500,
            "correctAnswers": 3
          },
          // ... more players
        ],
        "winner": {
          "id": "winner_id",
          "name": "Winner Name"
        },
        "status": "finished"
      }
    }
    ```

## Leaderboard Endpoints

### Get daily leaderboard
- **URL**: `/leaderboard/daily`
- **Method**: `GET`
- **Auth required**: No
- **Success Response**: 
  - **Code**: 200
  - **Content**: 
    ```json
    {
      "success": true,
      "leaderboard": [
        {
          "userId": "user_id",
          "name": "User Name",
          "score": 10,
          "rank": 1
        },
        // ... more entries
      ],
      "userRank": 5
    }
    ```

### Get multiplayer game leaderboard
- **URL**: `/leaderboard/game/:gameId`
- **Method**: `GET`
- **Auth required**: Yes (JWT token in Authorization header)
- **Success Response**: 
  - **Code**: 200
  - **Content**: 
    ```json
    {
      "success": true,
      "leaderboard": [
        {
          "userId": "user_id",
          "name": "User Name",
          "score": 2500,
          "rank": 1
        },
        // ... more entries
      ],
      "userRank": 2
    }
    ```

## Subscription Endpoints

### Create checkout session for premium subscription
- **URL**: `/subscription/checkout`
- **Method**: `POST`
- **Auth required**: Yes (JWT token in Authorization header)
- **Success Response**: 
  - **Code**: 200
  - **Content**: 
    ```json
    {
      "success": true,
      "sessionId": "cs_test_...",
      "url": "https://checkout.stripe.com/..."
    }
    ```

### Get user's subscription details
- **URL**: `/subscription/details`
- **Method**: `GET`
- **Auth required**: Yes (JWT token in Authorization header)
- **Success Response**: 
  - **Code**: 200
  - **Content**: 
    ```json
    {
      "success": true,
      "subscription": {
        "status": "premium",
        "plan": "premium",
        "currentPeriodEnd": "2023-05-01T00:00:00.000Z",
        "cancelAtPeriodEnd": false,
        "isPremium": true
      }
    }
    ```

### Cancel subscription
- **URL**: `/subscription/cancel`
- **Method**: `POST`
- **Auth required**: Yes (JWT token in Authorization header)
- **Success Response**: 
  - **Code**: 200
  - **Content**: 
    ```json
    {
      "success": true,
      "message": "Subscription will be canceled at the end of the current billing period",
      "subscription": {
        "status": "premium",
        "currentPeriodEnd": "2023-05-01T00:00:00.000Z",
        "cancelAtPeriodEnd": true
      }
    }
    ```

### Stripe webhook handler
- **URL**: `/subscription/webhook`
- **Method**: `POST`
- **Auth required**: No (Uses Stripe signature for verification)
- **Success Response**: 
  - **Code**: 200
  - **Content**: 
    ```json
    {
      "received": true
    }
    ```

## Socket.IO Events

### Game Namespace (/game)

#### Client to Server Events:
- `join-lobby`: Join a lobby room
  - Payload: `lobbyId`
- `leave-lobby`: Leave a lobby room
  - Payload: `lobbyId`
- `set-ready`: Set player ready status
  - Payload: `{ lobbyId, ready }`
- `join-game`: Join a game room
  - Payload: `gameId`
- `start-question`: Start a question timer
  - Payload: `{ gameId, questionIndex }`

#### Server to Client Events:
- `player-joined`: A player joined the lobby
  - Payload: `{ userId, playerCount }`
- `player-left`: A player left the lobby
  - Payload: `{ userId }`
- `lobby-data`: Complete lobby data
  - Payload: `{ id, name, code, isPublic, host, players, maxPlayers, status }`
- `player-ready-changed`: A player changed ready status
  - Payload: `{ userId, ready }`
- `all-players-ready`: All players in the lobby are ready
- `player-joined-game`: A player joined the game
  - Payload: `{ userId }`
- `question-started`: A question timer has started
  - Payload: `{ questionIndex, question, startTime }`
- `question-ended`: A question timer has ended
  - Payload: `{ questionIndex, correctAnswer, explanation }`
- `game-ended`: The game has ended
  - Payload: `{ winner, players }`
- `error`: Error message
  - Payload: `{ message }`

### Leaderboard Namespace (/leaderboard)

#### Client to Server Events:
- `subscribe-daily`: Subscribe to daily leaderboard updates
- `subscribe-game`: Subscribe to game leaderboard updates
  - Payload: `gameId`
- `unsubscribe-daily`: Unsubscribe from daily leaderboard updates
- `unsubscribe-game`: Unsubscribe from game leaderboard updates
  - Payload: `gameId`

#### Server to Client Events:
- `daily-leaderboard-update`: Daily leaderboard update
  - Payload: `{ leaderboard, userRank }`
- `game-leaderboard-update`: Game leaderboard update
  - Payload: `{ gameId, leaderboard, userRank }`
- `error`: Error message
  - Payload: `{ message }`
