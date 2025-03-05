import { useState, useCallback, useEffect, useRef } from 'react';
import { generateProblem, checkAnswer, Problem } from '@/utils/arithmetic';

interface UseArithmeticGameProps {
  isPlaying: boolean;
  onCorrectAnswer: () => void;
  onIncorrectAnswer: () => void;
}

interface UseArithmeticGameReturn {
  problem: Problem | null;
  userAnswer: string;
  setUserAnswer: (answer: string) => void;
  submitAnswer: () => void;
  generateNewProblem: () => void;
  isCorrect: boolean | null;
}

export function useArithmeticGame({
  isPlaying,
  onCorrectAnswer,
  onIncorrectAnswer,
}: UseArithmeticGameProps): UseArithmeticGameReturn {
  const [problem, setProblem] = useState<Problem | null>(null);
  const [userAnswer, setUserAnswer] = useState<string>('');
  const [isCorrect, setIsCorrect] = useState<boolean | null>(null);
  const [lastCheckedAnswer, setLastCheckedAnswer] = useState<string>('');
  const hasSubmittedCorrectAnswerRef = useRef<boolean>(false);
  
  // Generate a new problem
  const generateNewProblem = useCallback(() => {
    if (isPlaying) {
      const newProblem = generateProblem();
      hasSubmittedCorrectAnswerRef.current = false;
      
      setProblem(newProblem);
      setUserAnswer('');
      setLastCheckedAnswer('');
      setIsCorrect(null);
      console.log('Generated new problem:', newProblem);
    }
  }, [isPlaying]);
  
  // Initialize game with a problem when it starts
  useEffect(() => {
    if (isPlaying) {
      generateNewProblem();
    } else {
      setProblem(null);
      setUserAnswer('');
      setLastCheckedAnswer('');
      setIsCorrect(null);
      hasSubmittedCorrectAnswerRef.current = false;
    }
  }, [isPlaying, generateNewProblem]);
  
  // Check answer only when userAnswer changes and is different from lastCheckedAnswer
  useEffect(() => {
    // Skip if no problem, not playing, or empty answer
    if (!problem || !isPlaying || userAnswer === '') {
      return;
    }
    
    // Skip if we've already checked this exact answer
    if (userAnswer === lastCheckedAnswer) {
      return;
    }
    
    try {
      const numericAnswer = parseInt(userAnswer, 10);
      if (isNaN(numericAnswer)) {
        return;
      }
      
      // Update lastCheckedAnswer to prevent rechecking the same answer
      setLastCheckedAnswer(userAnswer);
      
      const correct = checkAnswer(problem, numericAnswer);
      
      if (correct) {
        // Only call onCorrectAnswer if we haven't already for this problem
        if (!hasSubmittedCorrectAnswerRef.current) {
          console.log('Correct answer detected:', numericAnswer);
          onCorrectAnswer();
          hasSubmittedCorrectAnswerRef.current = true;
        }
        
        setIsCorrect(true);
        
        // Move to next problem after a short delay
        setTimeout(() => {
          generateNewProblem();
        }, 300);
      } else {
        // For incorrect answers, just show feedback
        setIsCorrect(false);
        onIncorrectAnswer();
        
        // Clear the incorrect feedback after a short delay
        setTimeout(() => {
          setIsCorrect(null);
        }, 500);
      }
    } catch (e) {
      console.error('Error processing answer:', e);
    }
  }, [userAnswer, problem, isPlaying, onCorrectAnswer, onIncorrectAnswer, generateNewProblem, lastCheckedAnswer]);
  
  // Custom setUserAnswer that handles input validation
  const handleSetUserAnswer = useCallback((value: string) => {
    // Only allow numbers and negative sign
    const sanitizedValue = value.replace(/[^0-9-]/g, '');
    setUserAnswer(sanitizedValue);
  }, []);
  
  // Manual submission function (for backward compatibility)
  const submitAnswer = useCallback(() => {
    // Force a check by updating lastCheckedAnswer
    if (userAnswer !== '' && userAnswer === lastCheckedAnswer) {
      setLastCheckedAnswer('');
    }
  }, [userAnswer, lastCheckedAnswer]);
  
  return {
    problem,
    userAnswer,
    setUserAnswer: handleSetUserAnswer,
    submitAnswer,
    generateNewProblem,
    isCorrect,
  };
} 