export default interface Feedback {
    id: string
    created_at: string | null
    name: string | null
    recepientName: string | null
    questions?: any
    answers?: any
    recepientEmail: string | null
    state: "draft" | "sent" | "completed" | "overdue" | null
    filledOn?: string | null
    token?: string | null
    projectId: string | null
    customerId: string | null
    templateId: string | null
    dueDate: string | null
}
