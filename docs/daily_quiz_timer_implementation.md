# Daily Quiz Timer Implementation Guide

## Overview

We've updated the daily quiz functionality to implement a strict 15-second timer for each question with the following requirements:

1. Users have exactly 15 seconds to answer each question
2. The app automatically advances to the next question when time runs out
3. After answering a question, the next one appears immediately with a fresh 15-second timer

## Backend Changes Implemented

The following changes have been made to the backend:

1. The default `timeLimit` for all questions has been updated to 15 seconds in the Question model
2. The daily quiz controller now enforces a 15-second limit for all questions, regardless of their original setting
3. The scoring system has been adjusted to work with the 15-second limit

## Frontend Implementation Requirements

Please implement the following changes in the mobile app:

### 1. Timer Component

- Create a visible countdown timer that shows the remaining time (15 seconds counting down)
- The timer should have visual indicators:
  - Normal state (15-10 seconds): Blue/Green
  - Warning state (9-5 seconds): Yellow/Orange
  - Critical state (4-0 seconds): Red
- Consider adding an animated circular/linear progress indicator that depletes as time passes

### 2. Auto-Advance Functionality

- When the timer reaches zero:
  - Automatically submit the current answer (if any) or an empty answer
  - Show the correct answer briefly (1-2 seconds)
  - Automatically proceed to the next question
  - Reset the timer to 15 seconds
  - Never allow more than 15 seconds per question

### 3. Question Flow

- Implement a queue system to handle all daily quiz questions
- After a user answers a question or the timer expires:
  - Submit the answer to the API with the actual time spent
  - Show feedback about correctness briefly
  - Automatically transition to the next question with a fresh 15-second timer
  - Display a progress indicator showing question X of Y
  - After all questions, show a summary of performance

### 4. API Integration

- The `submitAnswer` endpoint now expects the following parameters:
  - `questionId`: ID of the current question
  - `answer`: User's answer (can be empty if time expired)
  - `timeSpent`: Actual time spent in seconds (capped at 15)

- Example API request:
```json
{
  "questionId": "60f8a9b3c1d2e3f4g5h6i7j8",
  "answer": "Paris",
  "timeSpent": 8.5
}
```

### 5. Score Calculation

The scoring system rewards faster answers:
- Base points: 100 points for a correct answer
- Time bonus: Up to 100 additional points based on how quickly the answer was given
  - Formula: Bonus = (1 - timeSpent/15) * 100
- Difficulty multiplier:
  - Easy: 1x
  - Medium: 1.5x
  - Hard: 2x
- No points are awarded for incorrect answers or answers after the time expires

## Flutter and BLoC Implementation

### BLoC Structure

Implement the timer logic using the following BLoC pattern:

#### 1. QuizTimer BLoC

```dart
// quiz_timer_event.dart
abstract class QuizTimerEvent {}

class StartTimer extends QuizTimerEvent {}
class PauseTimer extends QuizTimerEvent {}
class ResetTimer extends QuizTimerEvent {}
class TimerTick extends QuizTimerEvent {
  final int remainingSeconds;
  TimerTick(this.remainingSeconds);
}

// quiz_timer_state.dart
abstract class QuizTimerState {
  final int remainingSeconds;
  
  QuizTimerState(this.remainingSeconds);
}

class QuizTimerInitial extends QuizTimerState {
  QuizTimerInitial() : super(15);
}

class QuizTimerRunning extends QuizTimerState {
  final double progress; // 1.0 to 0.0
  
  QuizTimerRunning(int remainingSeconds) : 
    progress = remainingSeconds / 15,
    super(remainingSeconds);
}

class QuizTimerPaused extends QuizTimerState {
  QuizTimerPaused(int remainingSeconds) : super(remainingSeconds);
}

class QuizTimerExpired extends QuizTimerState {
  QuizTimerExpired() : super(0);
}

// quiz_timer_bloc.dart
class QuizTimerBloc extends Bloc<QuizTimerEvent, QuizTimerState> {
  static const int _maxSeconds = 15;
  Timer? _timer;
  
  QuizTimerBloc() : super(QuizTimerInitial()) {
    on<StartTimer>(_onStartTimer);
    on<PauseTimer>(_onPauseTimer);
    on<ResetTimer>(_onResetTimer);
    on<TimerTick>(_onTimerTick);
  }
  
  void _onStartTimer(StartTimer event, Emitter<QuizTimerState> emit) {
    _cancelTimer();
    
    emit(QuizTimerRunning(state.remainingSeconds));
    
    _timer = Timer.periodic(
      const Duration(seconds: 1),
      (timer) {
        if (state.remainingSeconds > 0) {
          add(TimerTick(state.remainingSeconds - 1));
        } else {
          add(PauseTimer());
        }
      },
    );
  }
  
  void _onPauseTimer(PauseTimer event, Emitter<QuizTimerState> emit) {
    _cancelTimer();
    
    if (state.remainingSeconds == 0) {
      emit(QuizTimerExpired());
    } else {
      emit(QuizTimerPaused(state.remainingSeconds));
    }
  }
  
  void _onResetTimer(ResetTimer event, Emitter<QuizTimerState> emit) {
    _cancelTimer();
    emit(QuizTimerInitial());
  }
  
  void _onTimerTick(TimerTick event, Emitter<QuizTimerState> emit) {
    emit(QuizTimerRunning(event.remainingSeconds));
  }
  
  void _cancelTimer() {
    _timer?.cancel();
    _timer = null;
  }
  
  @override
  Future<void> close() {
    _cancelTimer();
    return super.close();
  }
}
```

#### 2. Daily Quiz BLoC

```dart
// Integration with Daily Quiz BLoC
class DailyQuizBloc extends Bloc<DailyQuizEvent, DailyQuizState> {
  final QuizRepository repository;
  final QuizTimerBloc timerBloc;
  StreamSubscription? _timerSubscription;
  
  DailyQuizBloc({
    required this.repository, 
    required this.timerBloc
  }) : super(DailyQuizInitial()) {
    on<FetchQuestions>(_onFetchQuestions);
    on<AnswerQuestion>(_onAnswerQuestion);
    on<NextQuestion>(_onNextQuestion);
    on<TimerExpired>(_onTimerExpired);
    
    // Listen to timer events
    _timerSubscription = timerBloc.stream.listen((timerState) {
      if (timerState is QuizTimerExpired) {
        add(TimerExpired());
      }
    });
  }
  
  Future<void> _onFetchQuestions(
    FetchQuestions event, 
    Emitter<DailyQuizState> emit
  ) async {
    emit(DailyQuizLoading());
    
    try {
      final questions = await repository.getDailyQuestions();
      
      emit(DailyQuizInProgress(
        questions: questions,
        currentIndex: 0,
        answers: {},
        timeSpent: {}
      ));
      
      // Start the timer for the first question
      timerBloc.add(ResetTimer());
      timerBloc.add(StartTimer());
    } catch (e) {
      emit(DailyQuizError(message: e.toString()));
    }
  }
  
  Future<void> _onAnswerQuestion(
    AnswerQuestion event, 
    Emitter<DailyQuizState> emit
  ) async {
    if (state is DailyQuizInProgress) {
      final currentState = state as DailyQuizInProgress;
      
      // Stop timer to calculate time spent
      timerBloc.add(PauseTimer());
      
      // Calculate time spent (15 - remaining seconds)
      final timeSpent = 15 - timerBloc.state.remainingSeconds;
      
      try {
        // Submit the answer
        final result = await repository.submitAnswer(
          currentState.questions[currentState.currentIndex].id,
          event.answer,
          timeSpent
        );
        
        // Update state with answer and feedback
        Map<String, String> answers = Map.from(currentState.answers);
        answers[currentState.questions[currentState.currentIndex].id] = event.answer;
        
        Map<String, int> times = Map.from(currentState.timeSpent);
        times[currentState.questions[currentState.currentIndex].id] = timeSpent;
        
        emit(DailyQuizAnswerSubmitted(
          questions: currentState.questions,
          currentIndex: currentState.currentIndex,
          answers: answers,
          timeSpent: times,
          lastAnswerResult: result,
        ));
        
        // Automatically move to next question after feedback delay
        Future.delayed(Duration(seconds: 1), () {
          add(NextQuestion());
        });
      } catch (e) {
        emit(DailyQuizError(message: e.toString()));
      }
    }
  }
  
  Future<void> _onNextQuestion(
    NextQuestion event, 
    Emitter<DailyQuizState> emit
  ) async {
    if (state is DailyQuizInProgress || state is DailyQuizAnswerSubmitted) {
      final currentState = state is DailyQuizInProgress 
          ? state as DailyQuizInProgress 
          : (state as DailyQuizAnswerSubmitted);
      
      final nextIndex = currentState.currentIndex + 1;
      
      // Check if we've reached the end of questions
      if (nextIndex >= currentState.questions.length) {
        // Get quiz results
        try {
          final summary = await repository.getQuizSummary();
          emit(DailyQuizCompleted(
            questions: currentState.questions,
            answers: currentState.answers,
            timeSpent: currentState.timeSpent,
            summary: summary
          ));
        } catch (e) {
          emit(DailyQuizError(message: e.toString()));
        }
      } else {
        // Move to next question
        emit(DailyQuizInProgress(
          questions: currentState.questions,
          currentIndex: nextIndex,
          answers: currentState.answers,
          timeSpent: currentState.timeSpent
        ));
        
        // Start timer for next question
        timerBloc.add(ResetTimer());
        timerBloc.add(StartTimer());
      }
    }
  }
  
  Future<void> _onTimerExpired(
    TimerExpired event, 
    Emitter<DailyQuizState> emit
  ) async {
    if (state is DailyQuizInProgress) {
      final currentState = state as DailyQuizInProgress;
      
      // Submit empty answer or current partial answer when timer expires
      String currentAnswer = "";
      // Get any partial answer if available
      
      add(AnswerQuestion(answer: currentAnswer));
    }
  }
  
  @override
  Future<void> close() {
    _timerSubscription?.cancel();
    return super.close();
  }
}
```

### UI Implementation

```dart
class QuizTimerWidget extends StatelessWidget {
  @override
  Widget build(BuildContext context) {
    return BlocBuilder<QuizTimerBloc, QuizTimerState>(
      builder: (context, state) {
        Color timerColor;
        
        if (state.remainingSeconds > 9) {
          timerColor = Colors.green;
        } else if (state.remainingSeconds > 4) {
          timerColor = Colors.orange;
        } else {
          timerColor = Colors.red;
        }
        
        // For QuizTimerRunning states, show progress indicator
        double progress = 1.0;
        if (state is QuizTimerRunning) {
          progress = state.progress;
        }
        
        return Column(
          children: [
            Text(
              "${state.remainingSeconds}s",
              style: TextStyle(
                fontSize: 20, 
                fontWeight: FontWeight.bold,
                color: timerColor
              ),
            ),
            SizedBox(height: 8),
            CircularProgressIndicator(
              value: progress,
              color: timerColor,
              strokeWidth: 8,
              backgroundColor: Colors.grey.shade300,
            ),
          ],
        );
      },
    );
  }
}

class DailyQuizScreen extends StatelessWidget {
  @override
  Widget build(BuildContext context) {
    return MultiBlocProvider(
      providers: [
        BlocProvider(
          create: (context) => QuizTimerBloc(),
        ),
        BlocProvider(
          create: (context) => DailyQuizBloc(
            repository: context.read<QuizRepository>(),
            timerBloc: context.read<QuizTimerBloc>(),
          )..add(FetchQuestions()),
        ),
      ],
      child: Scaffold(
        appBar: AppBar(title: Text('Daily Quiz')),
        body: BlocBuilder<DailyQuizBloc, DailyQuizState>(
          builder: (context, state) {
            if (state is DailyQuizLoading) {
              return Center(child: CircularProgressIndicator());
            } else if (state is DailyQuizInProgress) {
              return _buildQuizContent(context, state);
            } else if (state is DailyQuizAnswerSubmitted) {
              return _buildAnswerFeedback(context, state);
            } else if (state is DailyQuizCompleted) {
              return _buildQuizSummary(context, state);
            } else if (state is DailyQuizError) {
              return Center(child: Text('Error: ${state.message}'));
            } else {
              return Center(child: Text('Start the quiz'));
            }
          },
        ),
      ),
    );
  }
  
  Widget _buildQuizContent(BuildContext context, DailyQuizInProgress state) {
    final question = state.questions[state.currentIndex];
    
    return Column(
      children: [
        // Progress indicator
        Padding(
          padding: const EdgeInsets.all(16.0),
          child: Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              Text(
                'Question ${state.currentIndex + 1}/${state.questions.length}',
                style: TextStyle(fontSize: 18),
              ),
              QuizTimerWidget(),
            ],
          ),
        ),
        
        // Question
        Expanded(
          child: Padding(
            padding: const EdgeInsets.all(16.0),
            child: Center(
              child: Text(
                question.text,
                style: TextStyle(fontSize: 22, fontWeight: FontWeight.bold),
                textAlign: TextAlign.center,
              ),
            ),
          ),
        ),
        
        // Answer field
        Padding(
          padding: const EdgeInsets.all(16.0),
          child: TextField(
            decoration: InputDecoration(
              hintText: 'Your answer',
              border: OutlineInputBorder(),
            ),
            onSubmitted: (answer) {
              context.read<DailyQuizBloc>().add(AnswerQuestion(answer: answer));
            },
          ),
        ),
      ],
    );
  }
  
  Widget _buildAnswerFeedback(BuildContext context, DailyQuizAnswerSubmitted state) {
    final result = state.lastAnswerResult;
    
    return Center(
      child: Column(
        mainAxisAlignment: MainAxisAlignment.center,
        children: [
          Icon(
            result.isCorrect ? Icons.check_circle : Icons.cancel,
            color: result.isCorrect ? Colors.green : Colors.red,
            size: 80,
          ),
          SizedBox(height: 16),
          Text(
            result.isCorrect ? 'Correct!' : 'Incorrect',
            style: TextStyle(fontSize: 24, fontWeight: FontWeight.bold),
          ),
          SizedBox(height: 8),
          Text(
            'Correct answer: ${result.correctAnswer}',
            style: TextStyle(fontSize: 18),
          ),
          if (result.isCorrect)
            Text(
              '+${result.points} points',
              style: TextStyle(fontSize: 22, color: Colors.green),
            ),
        ],
      ),
    );
  }
  
  Widget _buildQuizSummary(BuildContext context, DailyQuizCompleted state) {
    return Center(
      child: Column(
        mainAxisAlignment: MainAxisAlignment.center,
        children: [
          Text(
            'Quiz Completed!',
            style: TextStyle(fontSize: 28, fontWeight: FontWeight.bold),
          ),
          SizedBox(height: 24),
          Text(
            'Total Score: ${state.summary.totalScore}',
            style: TextStyle(fontSize: 24),
          ),
          SizedBox(height: 8),
          Text(
            'Correct Answers: ${state.summary.correctAnswers}/${state.questions.length}',
            style: TextStyle(fontSize: 20),
          ),
          SizedBox(height: 16),
          ElevatedButton(
            onPressed: () {
              Navigator.of(context).pop();
            },
            child: Text('Back to Home'),
          ),
        ],
      ),
    );
  }
}
```

## UI/UX Recommendations

1. Make the timer prominently visible at all times
2. Provide audio/visual cues when:
   - The timer starts
   - 5 seconds remaining (warning)
   - Time has expired
3. Include a brief animation/transition between questions
4. Show a "Time's up!" message when the timer expires

## Testing Guidelines

Please ensure to test the following scenarios:

1. Timer starts correctly with each new question
2. Timer stops when an answer is submitted
3. Auto-advance works when time expires
4. The app correctly records the time spent on each question
5. All questions can be completed within the time limit
6. The final score accurately reflects the user's performance

## Notes on Edge Cases

- Handle network latency: Submit answers slightly before the timer reaches zero
- Handle app backgrounding: Pause the timer if the app goes to background
- Handle device clock changes: Use server time if possible
- Low-end devices: Ensure the timer runs accurately on slower devices

Please integrate these changes in the next sprint and let us know if you have any questions or concerns. 