INSERT INTO feedback_templates (
  name, "organizationId", created_at, "createdBy", updated_at, questions, "isDefault"
) VALUES
  -- Template 1: Invoice Feedback (for customers who received an invoice)
  ('Invoice Feedback', NULL, NOW(), '070ec824-d181-4da7-875c-f2fdfbdffe44', NOW(), '[
    {"id": "q1", "text": "Was the invoice clear and accurate?", "type": "yes_no", "required": true},
    {"id": "q2", "text": "How would you rate the payment process?", "type": "rating", "required": true, "options": {"min": 1, "max": 5}},
    {"id": "q3", "text": "Which payment method did you use?", "type": "multiple_choice", "required": false, "options": ["Credit Card", "Bank Transfer", "PayPal", "Other"]},
    {"id": "q4", "text": "Additional comments about the invoice?", "type": "text", "required": false}
  ]', true),
  -- Template 2: Receipt Feedback (for customers who received a receipt)
  ('Receipt Feedback', NULL, NOW(), '070ec824-d181-4da7-875c-f2fdfbdffe44', NOW(), '[
    {"id": "q1", "text": "Did you receive the receipt on time?", "type": "yes_no", "required": true},
    {"id": "q2", "text": "How satisfied are you with the receipt details?", "type": "rating", "required": true, "options": {"min": 1, "max": 5}},
    {"id": "q3", "text": "What type of receipt was this for?", "type": "multiple_choice", "required": false, "options": ["Service", "Product", "Refund", "Other"]},
    {"id": "q4", "text": "Any suggestions for improvement?", "type": "text", "required": false}
  ]', true),
  -- Template 3: Project Feedback (for customers after project completion)
  ('Project Feedback', NULL, NOW(), '070ec824-d181-4da7-875c-f2fdfbdffe44', NOW(), '[
    {"id": "q1", "text": "Was the project completed on time?", "type": "yes_no", "required": true},
    {"id": "q2", "text": "How would you rate the project quality?", "type": "rating", "required": true, "options": {"min": 1, "max": 5}},
    {"id": "q3", "text": "Which services did we provide?", "type": "multiple_choice", "required": false, "options": ["Design", "Development", "Consulting", "Other"]},
    {"id": "q4", "text": "Feedback on the project experience?", "type": "text", "required": false}
  ]', true),
  -- Template 4: Potential Customer Questionnaire (for non-customers, pre-estimate)
  ('Potential Customer Questionnaire', NULL, NOW(), '070ec824-d181-4da7-875c-f2fdfbdffe44', NOW(), '[
    {"id": "q1", "text": "Are you interested in a project estimate?", "type": "yes_no", "required": true},
    {"id": "q2", "text": "How urgent is your project need?", "type": "rating", "required": true, "options": {"min": 1, "max": 5}},
    {"id": "q3", "text": "What type of project are you considering?", "type": "multiple_choice", "required": false, "options": ["Website", "App", "Consulting", "Other"]},
    {"id": "q4", "text": "Please provide project details or requirements", "type": "text", "required": true}
  ]', true);