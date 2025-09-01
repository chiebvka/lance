var Papa = require("papaparse")



export interface FeedbackQuestion {
  id?: string;
  text?: string;
  label?: string;
  type?: string;
}

export interface FeedbackAnswer {
  questionId?: string;
  answer?: string;
  type?: string;
}

export interface Feedback {
  name: string;
  recepientName?: string;
  recepientEmail?: string;
  state: string;
  created_at?: string;
  dueDate?: string;
  filledOn?: string;
  questions: FeedbackQuestion[] | string;
  answers?: FeedbackAnswer[] | string;
}

export function downloadFeedbackAsCSV(
  feedbacks: Feedback | Feedback[],
  filename = 'feedbacks.csv',
  returnString = false
): string | void {
  try {
    // If single feedback, wrap in array
    const dataArray: Feedback[] = Array.isArray(feedbacks) ? feedbacks : [feedbacks];

    // Flatten for CSV: one row per question/answer, with metadata repeated
    const rows: Record<string, string>[] = [];
    
    dataArray.forEach((fb: Feedback) => {
      let questions: FeedbackQuestion[] = [];
      let answers: FeedbackAnswer[] = [];
      
      // 🛡️ EDGE CASE 1: Safe JSON parsing with fallbacks for questions
      try {
        if (Array.isArray(fb.questions)) {
          questions = fb.questions;
        } else if (typeof fb.questions === 'string' && fb.questions.trim()) {
          questions = JSON.parse(fb.questions);
        }
      } catch (e) {
        console.warn('Failed to parse questions for feedback:', fb.name, e);
        questions = []; // Fallback to empty array instead of crashing
      }
      
      // 🛡️ EDGE CASE 1.5: Safe JSON parsing with fallbacks for answers
      try {
        if (Array.isArray(fb.answers)) {
          answers = fb.answers;
        } else if (typeof fb.answers === 'string' && fb.answers.trim()) {
          answers = JSON.parse(fb.answers);
        }
      } catch (e) {
        console.warn('Failed to parse answers for feedback:', fb.name, e);
        answers = []; // Fallback to empty array instead of crashing
      }
      
      // Debug logging to help troubleshoot
      console.log(`Processing feedback: ${fb.name}`);
      console.log(`Questions count: ${questions.length}`);
      console.log(`Answers count: ${answers.length}`);
      console.log('Questions:', questions);
      console.log('Answers:', answers);
      
      // 🛡️ EDGE CASE 2: Handle completely empty feedback
      if (questions.length === 0) {
        rows.push({
          'Form Name': fb.name || 'Unnamed Feedback',
          'Recipient Name': fb.recepientName || '',
          'Recipient Email': fb.recepientEmail || '',
          'State': fb.state || '',
          'Created Date': fb.created_at || '',
          'Due Date': fb.dueDate || '',
          'Filled On': fb.filledOn || '',
          'Question': 'No questions available',
          'Answer': 'No answers available',
        });
      } else {
        // Add a summary row for completed feedbacks
        if (fb.state === 'completed' && fb.filledOn) {
          rows.push({
            'Form Name': fb.name || 'Unnamed Feedback',
            'Recipient Name': fb.recepientName || '',
            'Recipient Email': fb.recepientEmail || '',
            'State': fb.state || '',
            'Created Date': fb.created_at || '',
            'Due Date': fb.dueDate || '',
            'Filled On': fb.filledOn || '',
            'Question': 'SUMMARY - Form completed',
            'Answer': `Form completed on ${fb.filledOn} with ${questions.length} questions`,
          });
        }
      }
      
      // 🛡️ EDGE CASE 3: Ensure we always have valid data with proper answer mapping
      questions.forEach((q: FeedbackQuestion, idx: number) => {
        // Find the corresponding answer for this question
        let answerText = 'No answer provided';
        
        if (answers && answers.length > 0) {
          // Try to find answer by index first
          if (answers[idx]) {
            answerText = answers[idx].answer || 'No answer provided';
          } else {
            // If no answer at this index, try to find by questionId if available
            const questionId = (q as any).id;
            if (questionId) {
              const matchingAnswer = answers.find((a: any) => a.questionId === questionId);
              if (matchingAnswer) {
                answerText = matchingAnswer.answer || 'No answer provided';
              }
            }
          }
          
          // If still no answer found, try to find by question text (fallback)
          if (answerText === 'No answer provided') {
            const questionText = q.text || q.label;
            if (questionText) {
              const matchingAnswer = answers.find((a: any) => {
                // Try to match by questionId first, then by question text
                return (a.questionId && a.questionId === (q as any).id) || 
                       (a.question && a.question === questionText);
              });
              if (matchingAnswer) {
                answerText = matchingAnswer.answer || 'No answer provided';
              }
            }
          }
        }
        
        // Clean up the answer text for better CSV formatting
        if (answerText && typeof answerText === 'string') {
          // Remove any HTML tags and clean up whitespace
          answerText = answerText.replace(/<[^>]*>/g, '').trim();
          // Handle special characters that might break CSV
          answerText = answerText.replace(/"/g, '""');
        }
        
        rows.push({
          'Form Name': fb.name || `Feedback-${Date.now()}`, // Unique fallback
          'Recipient Name': fb.recepientName || '',
          'Recipient Email': fb.recepientEmail || '',
          'State': fb.state || '',
          'Created Date': fb.created_at || '',
          'Due Date': fb.dueDate || '',
          'Filled On': fb.filledOn || '',
          'Question': q.text || q.label || `Question ${idx + 1}`,
          'Answer': answerText,
        });
      });
    });

    // 🛡️ EDGE CASE 4: Ensure we never return empty CSV
    if (rows.length === 0) {
      rows.push({
        'Form Name': 'Empty Export',
        'Recipient Name': '',
        'Recipient Email': '',
        'State': '',
        'Created Date': '',
        'Due Date': '',
        'Filled On': '',
        'Question': 'No data available',
        'Answer': 'No data available',
      });
    }

    const csv: string = Papa.unparse(rows);
    
    // If returnString is true, return the CSV string instead of downloading
    if (returnString) {
      return csv;
    }
    
    // Otherwise, trigger the download
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.setAttribute('download', filename);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(link.href);
  } catch (error) {
    console.error('Error in downloadFeedbackAsCSV:', error);
    if (returnString) {
      return 'Error generating CSV'; // Return something instead of undefined
    }
  }
}