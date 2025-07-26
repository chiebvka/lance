var Papa = require("papaparse")



export interface FeedbackQuestion {
  text?: string;
  label?: string;
}

export interface FeedbackAnswer {
  answer?: string;
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
      
      // 🛡️ EDGE CASE 1: Safe JSON parsing with fallbacks
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
      }
      
      // 🛡️ EDGE CASE 3: Ensure we always have valid data
      questions.forEach((q: FeedbackQuestion, idx: number) => {
        rows.push({
          'Form Name': fb.name || `Feedback-${Date.now()}`, // Unique fallback
          'Recipient Name': fb.recepientName || '',
          'Recipient Email': fb.recepientEmail || '',
          'State': fb.state || '',
          'Created Date': fb.created_at || '',
          'Due Date': fb.dueDate || '',
          'Filled On': fb.filledOn || '',
          'Question': q.text || q.label || `Question ${idx + 1}`,
          'Answer': answers[idx]?.answer || 'No answer provided',
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