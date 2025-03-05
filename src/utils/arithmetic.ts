export type Operation = 'addition' | 'subtraction' | 'multiplication' | 'division';

export interface Problem {
  firstNumber: number;
  secondNumber: number;
  operation: Operation;
  answer: number;
}

/**
 * Generate a random integer between min and max (inclusive)
 */
export function getRandomInt(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

/**
 * Generate a random arithmetic problem
 * Operations include addition, subtraction, multiplication, and division
 */
export function generateProblem(): Problem {
  const operations: Operation[] = ['addition', 'subtraction', 'multiplication', 'division'];
  const operation = operations[getRandomInt(0, 3)];
  
  let answer: number;
  let firstNumber: number;
  let secondNumber: number;

  var randGen = function randGen(min: number, max: number) {
    return function() {
      return min + Math.floor(Math.random() * (max - min + 1));
    };
  };

  let options: Record<string, number> = {
    "add_left_min": 2,
    "add_left_max": 100,
    "add_right_min": 2,
    "add_right_max": 100,  
    "mul_left_min": 2,
    "mul_left_max": 12,
    "mul_right_min": 2,
    "mul_right_max": 100,
  }

  var genTypes = ['add_left', 'add_right', 'mul_left', 'mul_right'];
  var randGens: Record<string, () => number> = {};
  genTypes.forEach(function(type) {
    randGens[type] = randGen(
      options[type + '_min'],
      options[type + '_max']
    );
  });

  
  // Handle each operation type differently to ensure valid problems
  switch (operation) {
    case 'addition':
      var left = randGens[genTypes[0]]();
      var right = randGens[genTypes[1]]();
      firstNumber = left;
      secondNumber = right;
      answer = left + right;
      break;
      
    case 'subtraction':
      var left = randGens[genTypes[0]]();
      var right = randGens[genTypes[1]]();
      answer = right;
      firstNumber = left + right;
      secondNumber = left;
      break;
      
    case 'multiplication':
      // Second number between 2-100
      var left = randGens[genTypes[2]]();
      var right = randGens[genTypes[3]]();
      answer = left * right;
      firstNumber = left;
      secondNumber = right;
      break;
      
    case 'division':
      var left = randGens[genTypes[2]]();
      var right = randGens[genTypes[3]]();
      answer = right;
      firstNumber = left * right;
      secondNumber = left;
      break;
      
    default:
      // Fallback to addition
      var left = randGens[genTypes[0]]();
      var right = randGens[genTypes[1]]();
      firstNumber = left;
      secondNumber = right;
      answer = left + right;
  }
  
  return {
    firstNumber,
    secondNumber,
    operation,
    answer
  };
}

/**
 * Format the problem as a string
 */
export function formatProblem(problem: Problem): string {
  switch (problem.operation) {
    case 'addition':
      return `${problem.firstNumber} + ${problem.secondNumber}`;
    case 'subtraction':
      return `${problem.firstNumber} - ${problem.secondNumber}`;
    case 'multiplication':
      return `${problem.firstNumber} × ${problem.secondNumber}`;
    case 'division':
      return `${problem.firstNumber} ÷ ${problem.secondNumber}`;
    default:
      return '';
  }
}

/**
 * Check if the provided answer is correct
 */
export function checkAnswer(problem: Problem, userAnswer: number): boolean {
  console.log(`Checking answer: expected=${problem.answer}, provided=${userAnswer}, equal=${problem.answer === userAnswer}`);
  return problem.answer === userAnswer;
} 