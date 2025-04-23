# Features Documentation for Text The Answer

## Overview

Text The Answer is a real-time multiplayer trivia game where users compete by typing out answers to questions with correct spelling and in the fastest time. The application offers three subscription tiers with different features.

## Subscription Tiers

### Free Tier
- Access to 10 daily quiz questions per day
- Participation in real-time competitions against other players
- Daily leaderboard access
- Chance to win a month of free premium access by winning daily competitions

### Premium Tier
- Unlimited access to all features
- Ability to create and join lobbies (both private and public)
- Access to historical leaderboards
- Preview of upcoming daily quiz themes
- Ad-free experience
- Custom profile customization options

### Education Tier
- All Premium tier features
- Ability to scan study materials to generate custom questions
- Create private study sessions with friends
- Track learning progress and improvement
- Specialized educational content and categories

## Core Features

### Daily Themed Quizzes
- Each day features a different theme (e.g., Sports, Anime, Science)
- 10 questions per day for free users, unlimited for premium users
- Questions are selected from the theme category with appropriate difficulty levels
- Daily winners receive a month of free premium access
- Real-time leaderboard shows top performers

### Real-time Multiplayer
- Compete against other players in real-time
- Type answers with correct spelling to earn points
- Faster correct answers earn more points
- Difficulty multipliers affect point values
- Live position tracking during games

### Lobby System (Premium)
- Create private lobbies with custom settings
- Join public lobbies to play with random users
- Customize game parameters (category, difficulty, time limits)
- Invite friends via shareable lobby codes
- Chat with other players in lobby

### Study Material Scanner (Education)
- Upload study materials (PDF, text)
- AI-powered question generation from uploaded content
- Create custom quizzes based on your study materials
- Share generated quizzes with classmates
- Track learning progress on specific subjects

### User Profiles and Statistics
- Track personal statistics (correct answers, streaks, win rate)
- Customize profile information
- View historical performance
- Earn achievements and badges
- Compare stats with friends

## Technical Implementation

### Category-based Daily Themes
- Each day features a different theme category
- Questions are primarily selected from the day's theme
- If not enough theme-specific questions are available, questions from other categories supplement
- Premium users can preview upcoming themes
- Admins can schedule specific themes for future dates

### Scoring System
- Base points for correct answers: 100 points
- Time bonus: Up to 100 additional points based on speed
  - Formula: Bonus = (1 - timeSpent/timeLimit) * 100
- Difficulty multipliers:
  - Easy: 1x
  - Medium: 1.5x
  - Hard: 2x
- Example: A correct medium difficulty answer in 10 seconds (with 30-second time limit):
  - Base: 100 points
  - Time bonus: (1 - 10/30) * 100 = 67 points
  - Difficulty multiplier: 1.5x
  - Total: (100 + 67) * 1.5 = 250 points

### Streak System
- Users earn streak points for playing consecutive days
- Streaks reset if a day is missed
- Bonus rewards for milestone streaks (7 days, 30 days, etc.)
- Streak status displayed on profile and leaderboards

### Real-time Communication
- Socket.IO implementation for real-time game events
- Events for game joining, question delivery, answer submission, and results
- Real-time leaderboard updates during games
- Lobby chat functionality for premium users

## Admin Features

### Content Management
- Create and manage question categories
- Add, edit, and remove questions
- Schedule specific themes for future dates
- Monitor question usage statistics
- Flag problematic questions for review

### User Management
- View and manage user accounts
- Verify student status for education tier
- Monitor subscription status
- Handle user reports and issues

### Analytics Dashboard
- Track daily active users
- Monitor question performance (difficulty, correct answer rate)
- View subscription conversion metrics
- Analyze user engagement patterns
- Generate reports on application usage

## Mobile App Integration

The backend is designed to support both web and mobile applications with:

- JWT-based authentication
- Responsive API design for different screen sizes
- Push notification support
- Offline mode capabilities
- Low-latency socket connections for real-time gameplay

## Future Enhancements

Planned future enhancements include:

- Team-based competitions
- Tournament mode with brackets
- Integration with educational platforms
- Enhanced AI-generated questions
- Voice recognition for answer submission
- Expanded language support
- Accessibility improvements
