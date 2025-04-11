# Text the Answer - Features Documentation

## Overview

Text the Answer is an interactive trivia application designed to make learning engaging and effective. The platform combines educational content with gamification elements to create a dynamic learning experience. This document provides a comprehensive overview of all available features.

## User Tiers

### Free Tier
- Access to limited daily quiz questions
- Basic user profile and statistics
- Standard scoring system

### Premium Tier
- Unlimited daily quiz questions
- Advanced scoring with time-based bonuses
- Upload and generate questions from study materials
- Multiplayer game capabilities
- Detailed analytics and progress tracking
- Ad-free experience

### Education Tier
- All Premium features
- Special pricing for students with valid .edu email
- Enhanced collaborative features for academic environments
- Additional study-focused tools

## Core Features

### 1. Daily Quiz

The daily quiz feature provides users with a set of curated questions each day to maintain consistent learning and build knowledge over time.

**Features:**
- New questions every day
- Progressive difficulty levels
- Streak tracking for consecutive days played
- Time-based scoring system
- Detailed explanations for each answer
- Category-based organization

**Premium Benefits:**
- Increased number of daily questions
- Ability to view past days' questions
- Detailed performance analytics

### 2. Study Materials

Upload and learn from your own study content to personalize your learning experience.

**Features:**
- Upload text or PDF documents
- Automatic question generation from uploaded materials
- Create custom questions with explanations
- Organize materials by topics or courses
- Share materials with other users (Education tier)

**Premium Benefits:**
- Higher upload limits
- More advanced question generation
- Better organization tools

### 3. Multiplayer Games

Compete with friends or other users in real-time trivia sessions.

**Features:**
- Public and private game lobbies
- Real-time multiplayer quiz competitions
- Various game modes and difficulty settings
- Leaderboards and rankings
- Chat functionality during games

**How to Use Multiplayer:**
1. Create a game lobby (public or private)
2. Share the lobby code with friends
3. Wait for players to join
4. Start the game when ready
5. Answer questions faster than your opponents to earn more points

### 4. Scoring System

Our advanced scoring system rewards both knowledge and quick thinking.

**Base Scoring:**
- Correct answer: 100 points
- Bonus points based on answer speed (up to 100 additional points)
- Difficulty multipliers:
  - Easy questions: 1x multiplier
  - Medium questions: 1.5x multiplier
  - Hard questions: 2x multiplier

**Leaderboards:**
- Daily rankings
- Weekly rankings
- All-time rankings
- Subject-specific rankings
- Free premium month for first place on daily leaderboard

### 5. Subscription Management

Flexible subscription options to match your needs.

**Plans:**
- Free: Basic access
- Premium Monthly: Full access with monthly billing
- Premium Yearly: Full access with annual billing (discounted)
- Education: Discounted premium for verified students

**Verification Process:**
1. Register with academic email (.edu domain)
2. Verify student status
3. Access education tier features at reduced cost

## Advanced Features

### 1. Time-Based Question Format

Questions with a countdown timer that adds excitement and helps develop quick recall.

**How it Works:**
- Each question has a customizable time limit
- Points decrease as time passes
- Answering quickly maximizes points earned
- Time limits vary based on question difficulty

### 2. Study Analytics

Track your progress and identify areas for improvement.

**Metrics:**
- Subject-based performance analysis
- Strength and weakness identification
- Learning patterns and optimal study times
- Progress tracking over time
- Comparison with peers (anonymized)

### 3. API Testing Interface

A comprehensive interface for testing and interacting with the application's API.

**Features:**
- Test all API endpoints
- Interactive documentation
- Authentication management
- Response visualization
- Mock subscription testing

### 4. Mock Subscription Testing

Test premium features without actual payment processing.

**How to Use:**
1. Access the demo user page
2. Get demo user credentials (already has premium access)
3. Use the auth token to access all premium features
4. Test subscription-based features without actual payments

### 5. Multiplayer Testing

Test multiplayer features using two demo accounts.

**Testing Process:**
1. Access main demo user
2. Create a game lobby
3. Access second demo user in a new browser window/tab
4. Join the lobby with the second user
5. Test the full multiplayer experience

## Technical Features

### 1. API Documentation

Comprehensive documentation for all API endpoints for developers and integration.

**Available Documentation:**
- Authentication endpoints
- Quiz and question endpoints
- Game and multiplayer endpoints
- Subscription management endpoints
- Study material endpoints

### 2. Demo Environment

A full-featured demo environment to explore all capabilities without creating an account.

**Demo Features:**
- Pre-configured demo users
- Access to all premium features
- Multiplayer testing capabilities
- No credit card required

### 3. Socket-Based Real-time Updates

Real-time updates and interactions for multiplayer and collaborative features.

**Applications:**
- Live game updates
- Real-time leaderboards
- Collaborative study sessions
- Instant feedback

## Coming Soon

### 1. Study Groups
- Create and join study groups
- Share materials within groups
- Collaborative question creation
- Group leaderboards and challenges

### 2. Enhanced Analytics
- Personalized study recommendations
- Advanced learning pattern analysis
- Detailed performance tracking
- Custom study plan generation

---

## How to Test Features

### Demo Users

We provide demo user accounts with full premium access to test all features:

1. **Main Demo User:**
   - Email: demo@texttheanswer.com
   - Password: demo123
   - Access: Premium + Education tier

2. **Second Demo User (for multiplayer testing):**
   - Email: demo2@texttheanswer.com
   - Password: demo123
   - Access: Premium tier

### Testing Subscription Features

1. Access the demo user page
2. Click "Get Demo User Access"
3. Click "Auto-Login with Demo User"
4. Explore all premium features without payment

### Testing Multiplayer Features

1. Create a lobby with the main demo user
2. Get the second demo user credentials
3. Join the lobby with the second user
4. Test lobby joining and multiplayer interactions

---

For any questions or support, please contact support@texttheanswer.com 