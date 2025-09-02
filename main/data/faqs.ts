import { FAQ } from "@/components/faqs/faq-accordian"

// Home page FAQs (6 questions)
export const homeFaqs: FAQ[] = [
  {
    id: "home-1",
    question: "What is Bexforte and how does it work?",
    answer: "Bexforte is a comprehensive platform that helps small businesses,freelancers, influencers, and creators manage their operations and workflows efficiently. It helps you manage projects, create invoices, track receipts, collect feedback, create walls with instructions media, or messages as well as help you curate your links and contact information using our paths profile to help you manage your contact information and organize your workflow efficiently in one place."
  },
  {
    id: "home-2", 
    question: "How much does Bexforte cost?",
    answer: "Bexforte offers flexible pricing plans to suit different needs. We have a free trial available, and our paid plans start at affordable rates. Check our pricing page for detailed information on all available plans and features."
  },
  {
    id: "home-3",
    question: "Is my data secure on Bexforte?",
    answer: "Yes, absolutely. We take data security seriously and use industry-standard encryption to protect your information. All data is stored securely and we never share your information with third parties without your explicit consent."
  },
  {
    id: "home-4",
    question: "Can I try Bexforte before purchasing?",
    answer: "Yes! We offer a free trial period so you can explore all features and see how Bexforte fits your workflow. No credit card required to start your trial."
  },
  {
    id: "home-5",
    question: "What kind of support do you provide?",
    answer: "We provide comprehensive support through multiple channels including email support, live chat, and detailed documentation. Our support team is responsive and ready to help you get the most out of Bexforte."
  },
  {
    id: "home-6",
    question: "Can I get a refund if I am not satisfied with Bexforte?",
    answer: "Yes, Bexforte offers a 3-day money-back guarantee. If you are not satisfied with Bexforte, you can get a refund within 3 days of your purchase by reaching out to us."
  },
  {
    id: "home-7",
    question: "Can I cancel my subscription?",
    answer: "Yes, you can cancel your subscription at any time. You can cancel your subscription in your settings page."
  },
]

// Invoice page FAQs (5 questions)
export const invoiceFaqs: FAQ[] = [
  {
    id: "invoice-1",
    question: "How do I create and send invoices?",
    answer: "Creating invoices in Bexforte is simple. Navigate to the Invoices section, click 'Create Invoice', fill in your client details, add line items, set payment terms, and send directly to your client via email."
  },
  {
    id: "invoice-2",
    question: "What payment methods can I accept?",
    answer: "Bexforte supports multiple payment methods including bank transfers, credit cards, PayPal, and other popular payment gateways. You can customize which payment methods to offer for each invoice."
  },
  {
    id: "invoice-3",
    question: "How do I track invoice payments?",
    answer: "All invoices are automatically tracked in your dashboard. You'll receive notifications when payments are received, and you can view payment status, overdue invoices, and payment history at any time."
  },
  {
    id: "invoice-4",
    question: "Can I set up automatic payment reminders?",
    answer: "Yes, you can configure automatic payment reminders for overdue invoices. You can decide to allow email reminders for your invoices that are in the 'sent' or 'overdue' state."
  },
  {
    id: "invoice-5",
    question: "Does Bexforte offer invoice templates?",
    answer: "No, Bexforte does not offer invoice templates at the moment but we are working on it. You can use our invoice builder and customize it with your branding for now."
  },
  {
    id: "invoice-6",
    question: "Can i issue a receipt for my invoice?",
    answer: "Yes, you can issue a receipt for your invoice. You can do this by clicking on the invoice and then clicking on the 'Issue Receipt' button."
  },
]

// Receipts page FAQs (4 questions)
export const receiptFaqs: FAQ[] = [
  {
    id: "receipt-1",
    question: "How do I upload and organize receipts?",
    answer: "Simply drag and drop receipt images or PDFs into the Receipts section, or use the upload button. Receipts are automatically organized by date and can be categorized for easy tax preparation and expense tracking."
  },
  {
    id: "receipt-2",
    question: "Can I extract data from receipts automatically?",
    answer: "Yes, Bexforte uses OCR technology to automatically extract key information from receipts including vendor name, amount, date, and category. You can review and edit the extracted data as needed."
  },
  {
    id: "receipt-3",
    question: "How do I categorize receipts for tax purposes?",
    answer: "Receipts can be categorized using predefined tax categories or custom categories you create. You can also add tags and notes to make tax preparation easier and more organized."
  },
  {
    id: "receipt-4",
    question: "Can I export receipts for accounting software?",
    answer: "Yes, you can export receipt data in various formats compatible with popular accounting software like QuickBooks, Xero, and others. This makes it easy to transfer your expense data."
  }
]

// Projects page FAQs (6 questions)
export const projectFaqs: FAQ[] = [
  {
    id: "project-1",
    question: "How do I create and manage projects?",
    answer: "Creating projects is straightforward - click 'New Project', add project details, set timelines, assign team members, and define milestones. You can track progress, manage tasks, and collaborate with clients all in one place."
  },
  {
    id: "project-2",
    question: "Can I collaborate with clients on projects?",
    answer: "Yes, Bexforte includes client collaboration features. You can share project updates, collect feedback, get approvals, and keep clients informed about progress through the client portal."
  },
  {
    id: "project-3",
    question: "How do I track project time and expenses?",
    answer: "Use the built-in time tracking feature to log hours worked on projects. You can also track project-related expenses and link them to specific tasks or milestones for accurate project costing."
  },
  {
    id: "project-4",
    question: "What project templates are available?",
    answer: "Bexforte offers various project templates for different industries and project types. You can also create custom templates based on your recurring project structures to save time on setup."
  },
  {
    id: "project-5",
    question: "How do I handle project revisions and changes?",
    answer: "The platform includes change management features that allow you to document scope changes, track revisions, and manage additional work requests while maintaining clear communication with clients."
  },
  {
    id: "project-6",
    question: "Can I generate project reports?",
    answer: "Yes, you can generate comprehensive project reports including progress summaries, time tracking reports, expense breakdowns, and client communication logs to keep stakeholders informed."
  }
]

// Feedback page FAQs (6 questions)
export const feedbackFaqs: FAQ[] = [
  {
    id: "feedback-1",
    question: "How do I collect feedback from clients?",
    answer: "Create feedback forms tailored to your needs and send them to clients via email or share a direct link. Clients can provide ratings, comments, and suggestions that are automatically organized in your dashboard."
  },
  {
    id: "feedback-2",
    question: "What types of feedback can I collect?",
    answer: "You can collect various types of feedback including ratings, written comments, multiple choice responses, and file uploads. Customize feedback forms to match your specific needs and project requirements."
  },
  {
    id: "feedback-3",
    question: "How do I follow up on feedback?",
    answer: "Bexforte automatically sends follow-up reminders for pending feedback and notifies you when responses are received. You can also set up custom follow-up schedules and automated thank you messages."
  },
  {
    id: "feedback-4",
    question: "Can I analyze feedback trends over time?",
    answer: "Yes, the platform provides analytics and reporting features that help you track feedback trends, identify patterns, and measure client satisfaction over time to improve your services."
  },
  {
    id: "feedback-5",
    question: "How do I handle negative feedback?",
    answer: "The platform includes tools to help you respond professionally to negative feedback. You can create response templates, track resolution status, and turn negative experiences into opportunities for improvement."
  },
  {
    id: "feedback-6",
    question: "Can I share positive feedback publicly?",
    answer: "Yes, you can easily share positive feedback as testimonials on your website or social media. The platform includes features to format feedback for public display while maintaining client privacy."
  }
]

// Walls page FAQs (5 questions)
export const wallFaqs: FAQ[] = [
  {
    id: "wall-1",
    question: "What are Walls in Bexforte?",
    answer: "Walls are collaborative spaces where you can organize and share project-related content, documents, and updates with clients and team members. Think of them as digital bulletin boards for your projects."
  },
  {
    id: "wall-2",
    question: "How do I organize content on Walls?",
    answer: "You can organize content using categories, tags, and custom sections. Drag and drop items to rearrange them, pin important items to the top, and use filters to quickly find specific content."
  },
  {
    id: "wall-3",
    question: "Can clients contribute to Walls?",
    answer: "Yes, you can give clients permission to add content, comments, and updates to Walls. Control access levels to ensure appropriate collaboration while maintaining project organization."
  },
  {
    id: "wall-4",
    question: "What types of content can I add to Walls?",
    answer: "You can add various content types including images, documents, links, notes, and embedded content. Walls support rich media and can display content in organized, visually appealing layouts."
  },
  {
    id: "wall-5",
    question: "How do I control Wall visibility and permissions?",
    answer: "Set granular permissions for each Wall, controlling who can view, edit, or comment on content. You can create private Walls for internal use or shared Walls for client collaboration."
  }
]

// Paths page FAQs (5 questions)
export const pathFaqs: FAQ[] = [
  {
    id: "path-1",
    question: "What are Paths in Bexforte?",
    answer: "Paths are structured workflows that guide you and your clients through specific processes or project phases. They help standardize your work processes and ensure nothing gets missed."
  },
  {
    id: "path-2",
    question: "How do I create custom Paths?",
    answer: "Create custom Paths by defining steps, milestones, and requirements for your specific processes. You can add instructions, deadlines, and approval points to guide clients through each phase."
  },
  {
    id: "path-3",
    question: "Can I reuse Paths for similar projects?",
    answer: "Yes, once created, Paths can be saved as templates and reused for similar projects. This saves time on setup and ensures consistency across your work processes."
  },
  {
    id: "path-4",
    question: "How do clients interact with Paths?",
    answer: "Clients can view their assigned Paths, see progress, complete required actions, and provide feedback at each step. The interface is intuitive and guides them through the process."
  },
  {
    id: "path-5",
    question: "Can I track progress through Paths?",
    answer: "Yes, you can monitor progress through each Path, see which steps are completed, identify bottlenecks, and ensure projects stay on track. Get notifications when action is required."
  }
]
