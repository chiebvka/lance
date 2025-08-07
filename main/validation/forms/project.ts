export interface Project {
    id: string
    name: string | null
    description: string | null
    type: "personal" | "customer" | null
    customerName?: string | null
    budget: number | null
    currency: string | null
    hasServiceAgreement: boolean | null
    paymentType: string | null
    endDate: string | null
    state: "draft" | "published" | null
    status: string | null
    created_at: string | null
  }

  

  