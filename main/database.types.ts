export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  graphql_public: {
    Tables: {
      [_ in never]: never
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      graphql: {
        Args: {
          extensions?: Json
          operationName?: string
          query?: string
          variables?: Json
        }
        Returns: Json
      }
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
  public: {
    Tables: {
      audit_log: {
        Row: {
          action: string | null
          changedOn: string | null
          changeSummary: Json | null
          created_at: string
          createdBy: string | null
          id: string
          newData: Json | null
          oldData: Json | null
          organizationId: string | null
          recordId: string | null
          tableName: string | null
        }
        Insert: {
          action?: string | null
          changedOn?: string | null
          changeSummary?: Json | null
          created_at?: string
          createdBy?: string | null
          id?: string
          newData?: Json | null
          oldData?: Json | null
          organizationId?: string | null
          recordId?: string | null
          tableName?: string | null
        }
        Update: {
          action?: string | null
          changedOn?: string | null
          changeSummary?: Json | null
          created_at?: string
          createdBy?: string | null
          id?: string
          newData?: Json | null
          oldData?: Json | null
          organizationId?: string | null
          recordId?: string | null
          tableName?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "audit_logs_organizationId_fkey"
            columns: ["organizationId"]
            isOneToOne: false
            referencedRelation: "organization"
            referencedColumns: ["id"]
          },
        ]
      }
      banks: {
        Row: {
          accountName: string | null
          accountNumber: string | null
          bankAddress: string | null
          bankName: string | null
          country: string | null
          created_at: string
          createdBy: string | null
          crypto: string | null
          cryptoNetwork: string | null
          cryptoWalletAddress: string | null
          currency: string | null
          description: string | null
          iban: string | null
          id: string
          institutionNumber: string | null
          isDefault: boolean | null
          name: string | null
          organizationId: string | null
          paypalPaymentLink: string | null
          routingNumber: string | null
          sortCode: string | null
          stripePaymentLink: string | null
          swiftCode: string | null
          transitNumber: string | null
          type: string | null
          updatedAt: string | null
        }
        Insert: {
          accountName?: string | null
          accountNumber?: string | null
          bankAddress?: string | null
          bankName?: string | null
          country?: string | null
          created_at?: string
          createdBy?: string | null
          crypto?: string | null
          cryptoNetwork?: string | null
          cryptoWalletAddress?: string | null
          currency?: string | null
          description?: string | null
          iban?: string | null
          id?: string
          institutionNumber?: string | null
          isDefault?: boolean | null
          name?: string | null
          organizationId?: string | null
          paypalPaymentLink?: string | null
          routingNumber?: string | null
          sortCode?: string | null
          stripePaymentLink?: string | null
          swiftCode?: string | null
          transitNumber?: string | null
          type?: string | null
          updatedAt?: string | null
        }
        Update: {
          accountName?: string | null
          accountNumber?: string | null
          bankAddress?: string | null
          bankName?: string | null
          country?: string | null
          created_at?: string
          createdBy?: string | null
          crypto?: string | null
          cryptoNetwork?: string | null
          cryptoWalletAddress?: string | null
          currency?: string | null
          description?: string | null
          iban?: string | null
          id?: string
          institutionNumber?: string | null
          isDefault?: boolean | null
          name?: string | null
          organizationId?: string | null
          paypalPaymentLink?: string | null
          routingNumber?: string | null
          sortCode?: string | null
          stripePaymentLink?: string | null
          swiftCode?: string | null
          transitNumber?: string | null
          type?: string | null
          updatedAt?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "banking_organizationId_fkey"
            columns: ["organizationId"]
            isOneToOne: false
            referencedRelation: "organization"
            referencedColumns: ["id"]
          },
        ]
      }
      banks_duplicate: {
        Row: {
          accountName: string | null
          accountNumber: string | null
          bankAddress: string | null
          bankName: string | null
          country: string | null
          created_at: string
          createdBy: string | null
          currency: string | null
          iban: string | null
          id: number
          institutionNumber: string | null
          isDefault: boolean | null
          organizationId: string | null
          paypalPaymentLink: string | null
          routingNumber: string | null
          sortCode: string | null
          stripePaymentLink: string | null
          swiftCode: string | null
          transitNumber: string | null
          updatedAt: string | null
        }
        Insert: {
          accountName?: string | null
          accountNumber?: string | null
          bankAddress?: string | null
          bankName?: string | null
          country?: string | null
          created_at?: string
          createdBy?: string | null
          currency?: string | null
          iban?: string | null
          id?: number
          institutionNumber?: string | null
          isDefault?: boolean | null
          organizationId?: string | null
          paypalPaymentLink?: string | null
          routingNumber?: string | null
          sortCode?: string | null
          stripePaymentLink?: string | null
          swiftCode?: string | null
          transitNumber?: string | null
          updatedAt?: string | null
        }
        Update: {
          accountName?: string | null
          accountNumber?: string | null
          bankAddress?: string | null
          bankName?: string | null
          country?: string | null
          created_at?: string
          createdBy?: string | null
          currency?: string | null
          iban?: string | null
          id?: number
          institutionNumber?: string | null
          isDefault?: boolean | null
          organizationId?: string | null
          paypalPaymentLink?: string | null
          routingNumber?: string | null
          sortCode?: string | null
          stripePaymentLink?: string | null
          swiftCode?: string | null
          transitNumber?: string | null
          updatedAt?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "banks_duplicate_organizationId_fkey"
            columns: ["organizationId"]
            isOneToOne: false
            referencedRelation: "organization"
            referencedColumns: ["id"]
          },
        ]
      }
      customer_activities: {
        Row: {
          amount: number | null
          created_at: string | null
          createdBy: string | null
          customerId: string | null
          details: Json | null
          id: string
          label: string | null
          referenceId: string | null
          referenceType:
            | Database["public"]["Enums"]["customer_activity_reference_enum"]
            | null
          tagColor: string | null
          type:
            | Database["public"]["Enums"]["customer_activity_type_enum"]
            | null
        }
        Insert: {
          amount?: number | null
          created_at?: string | null
          createdBy?: string | null
          customerId?: string | null
          details?: Json | null
          id?: string
          label?: string | null
          referenceId?: string | null
          referenceType?:
            | Database["public"]["Enums"]["customer_activity_reference_enum"]
            | null
          tagColor?: string | null
          type?:
            | Database["public"]["Enums"]["customer_activity_type_enum"]
            | null
        }
        Update: {
          amount?: number | null
          created_at?: string | null
          createdBy?: string | null
          customerId?: string | null
          details?: Json | null
          id?: string
          label?: string | null
          referenceId?: string | null
          referenceType?:
            | Database["public"]["Enums"]["customer_activity_reference_enum"]
            | null
          tagColor?: string | null
          type?:
            | Database["public"]["Enums"]["customer_activity_type_enum"]
            | null
        }
        Relationships: [
          {
            foreignKeyName: "customer_activities_createdBy_fkey"
            columns: ["createdBy"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["profile_id"]
          },
          {
            foreignKeyName: "customer_activities_customerId_fkey"
            columns: ["customerId"]
            isOneToOne: false
            referencedRelation: "customers"
            referencedColumns: ["id"]
          },
        ]
      }
      customers: {
        Row: {
          address: string | null
          addressLine1: string | null
          addressLine2: string | null
          city: string | null
          contactPerson: string | null
          country: string | null
          created_at: string | null
          createdBy: string | null
          email: string | null
          feedbackCount: number | null
          fts: unknown | null
          fullAddress: string | null
          id: string
          invoiceCount: number | null
          linkCount: number | null
          name: string | null
          notes: string | null
          organizationId: string | null
          phone: string | null
          postalCode: string | null
          projectCount: number | null
          receiptCount: number | null
          state: string | null
          taxId: string | null
          unitNumber: string | null
          updated_at: string | null
          website: string | null
        }
        Insert: {
          address?: string | null
          addressLine1?: string | null
          addressLine2?: string | null
          city?: string | null
          contactPerson?: string | null
          country?: string | null
          created_at?: string | null
          createdBy?: string | null
          email?: string | null
          feedbackCount?: number | null
          fts?: unknown | null
          fullAddress?: string | null
          id?: string
          invoiceCount?: number | null
          linkCount?: number | null
          name?: string | null
          notes?: string | null
          organizationId?: string | null
          phone?: string | null
          postalCode?: string | null
          projectCount?: number | null
          receiptCount?: number | null
          state?: string | null
          taxId?: string | null
          unitNumber?: string | null
          updated_at?: string | null
          website?: string | null
        }
        Update: {
          address?: string | null
          addressLine1?: string | null
          addressLine2?: string | null
          city?: string | null
          contactPerson?: string | null
          country?: string | null
          created_at?: string | null
          createdBy?: string | null
          email?: string | null
          feedbackCount?: number | null
          fts?: unknown | null
          fullAddress?: string | null
          id?: string
          invoiceCount?: number | null
          linkCount?: number | null
          name?: string | null
          notes?: string | null
          organizationId?: string | null
          phone?: string | null
          postalCode?: string | null
          projectCount?: number | null
          receiptCount?: number | null
          state?: string | null
          taxId?: string | null
          unitNumber?: string | null
          updated_at?: string | null
          website?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "customers_createdBy_fkey"
            columns: ["createdBy"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["profile_id"]
          },
          {
            foreignKeyName: "customers_organizationId_fkey"
            columns: ["organizationId"]
            isOneToOne: false
            referencedRelation: "organization"
            referencedColumns: ["id"]
          },
        ]
      }
      deliverables: {
        Row: {
          created_at: string | null
          createdBy: string | null
          description: string | null
          dueDate: string | null
          id: string
          isPublished: boolean | null
          lastSaved: string | null
          name: string | null
          position: number | null
          projectId: string | null
          status: string | null
          updatedAt: string | null
        }
        Insert: {
          created_at?: string | null
          createdBy?: string | null
          description?: string | null
          dueDate?: string | null
          id?: string
          isPublished?: boolean | null
          lastSaved?: string | null
          name?: string | null
          position?: number | null
          projectId?: string | null
          status?: string | null
          updatedAt?: string | null
        }
        Update: {
          created_at?: string | null
          createdBy?: string | null
          description?: string | null
          dueDate?: string | null
          id?: string
          isPublished?: boolean | null
          lastSaved?: string | null
          name?: string | null
          position?: number | null
          projectId?: string | null
          status?: string | null
          updatedAt?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "deliverables_createdBy_fkey"
            columns: ["createdBy"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["profile_id"]
          },
          {
            foreignKeyName: "deliverables_projectId_fkey"
            columns: ["projectId"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      feedback_templates: {
        Row: {
          created_at: string
          createdBy: string | null
          id: string
          isDefault: boolean | null
          name: string | null
          organizationId: string | null
          questions: Json | null
          updated_at: string | null
        }
        Insert: {
          created_at?: string
          createdBy?: string | null
          id?: string
          isDefault?: boolean | null
          name?: string | null
          organizationId?: string | null
          questions?: Json | null
          updated_at?: string | null
        }
        Update: {
          created_at?: string
          createdBy?: string | null
          id?: string
          isDefault?: boolean | null
          name?: string | null
          organizationId?: string | null
          questions?: Json | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "feedback_templates_organizationId_fkey"
            columns: ["organizationId"]
            isOneToOne: false
            referencedRelation: "organization"
            referencedColumns: ["id"]
          },
        ]
      }
      feedbacks: {
        Row: {
          allowReminders: boolean | null
          answers: Json | null
          created_at: string
          createdBy: string | null
          customerId: string | null
          dueDate: string | null
          filledOn: string | null
          fts: unknown | null
          id: string
          message: string | null
          name: string | null
          organizationEmail: string | null
          organizationId: string | null
          organizationLogoUrl: string | null
          organizationName: string | null
          projectId: string | null
          questions: Json | null
          recepientEmail: string | null
          recepientName: string | null
          sentAt: string | null
          state: string | null
          templateId: string | null
          token: string | null
          updated_at: string | null
        }
        Insert: {
          allowReminders?: boolean | null
          answers?: Json | null
          created_at?: string
          createdBy?: string | null
          customerId?: string | null
          dueDate?: string | null
          filledOn?: string | null
          fts?: unknown | null
          id?: string
          message?: string | null
          name?: string | null
          organizationEmail?: string | null
          organizationId?: string | null
          organizationLogoUrl?: string | null
          organizationName?: string | null
          projectId?: string | null
          questions?: Json | null
          recepientEmail?: string | null
          recepientName?: string | null
          sentAt?: string | null
          state?: string | null
          templateId?: string | null
          token?: string | null
          updated_at?: string | null
        }
        Update: {
          allowReminders?: boolean | null
          answers?: Json | null
          created_at?: string
          createdBy?: string | null
          customerId?: string | null
          dueDate?: string | null
          filledOn?: string | null
          fts?: unknown | null
          id?: string
          message?: string | null
          name?: string | null
          organizationEmail?: string | null
          organizationId?: string | null
          organizationLogoUrl?: string | null
          organizationName?: string | null
          projectId?: string | null
          questions?: Json | null
          recepientEmail?: string | null
          recepientName?: string | null
          sentAt?: string | null
          state?: string | null
          templateId?: string | null
          token?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "feedbacks_customerId_fkey"
            columns: ["customerId"]
            isOneToOne: false
            referencedRelation: "customers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "feedbacks_organizationId_fkey"
            columns: ["organizationId"]
            isOneToOne: false
            referencedRelation: "organization"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "feedbacks_projectId_fkey"
            columns: ["projectId"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      invoices: {
        Row: {
          allowReminders: boolean | null
          created_at: string | null
          createdBy: string | null
          currency: string | null
          customerId: string | null
          discount: number | null
          dueDate: string | null
          emailSentAt: string | null
          fts: unknown | null
          hasDiscount: boolean | null
          hasTax: boolean | null
          hasVat: boolean | null
          id: string
          invoiceDetails: Json | null
          invoiceNumber: string | null
          issueDate: string | null
          notes: string | null
          organizationEmail: string | null
          organizationId: string | null
          organizationLogo: string | null
          organizationName: string | null
          paidOn: string | null
          paymentDetails: Json | null
          paymentInfo: Json | null
          paymentLink: string | null
          paymentType: string | null
          projectId: string | null
          projectName: string | null
          recepientEmail: string | null
          recepientName: string | null
          sentViaEmail: boolean | null
          state: string | null
          status: string | null
          subTotalAmount: number | null
          taxRate: number | null
          totalAmount: number | null
          updatedAt: string | null
          vatRate: number | null
        }
        Insert: {
          allowReminders?: boolean | null
          created_at?: string | null
          createdBy?: string | null
          currency?: string | null
          customerId?: string | null
          discount?: number | null
          dueDate?: string | null
          emailSentAt?: string | null
          fts?: unknown | null
          hasDiscount?: boolean | null
          hasTax?: boolean | null
          hasVat?: boolean | null
          id?: string
          invoiceDetails?: Json | null
          invoiceNumber?: string | null
          issueDate?: string | null
          notes?: string | null
          organizationEmail?: string | null
          organizationId?: string | null
          organizationLogo?: string | null
          organizationName?: string | null
          paidOn?: string | null
          paymentDetails?: Json | null
          paymentInfo?: Json | null
          paymentLink?: string | null
          paymentType?: string | null
          projectId?: string | null
          projectName?: string | null
          recepientEmail?: string | null
          recepientName?: string | null
          sentViaEmail?: boolean | null
          state?: string | null
          status?: string | null
          subTotalAmount?: number | null
          taxRate?: number | null
          totalAmount?: number | null
          updatedAt?: string | null
          vatRate?: number | null
        }
        Update: {
          allowReminders?: boolean | null
          created_at?: string | null
          createdBy?: string | null
          currency?: string | null
          customerId?: string | null
          discount?: number | null
          dueDate?: string | null
          emailSentAt?: string | null
          fts?: unknown | null
          hasDiscount?: boolean | null
          hasTax?: boolean | null
          hasVat?: boolean | null
          id?: string
          invoiceDetails?: Json | null
          invoiceNumber?: string | null
          issueDate?: string | null
          notes?: string | null
          organizationEmail?: string | null
          organizationId?: string | null
          organizationLogo?: string | null
          organizationName?: string | null
          paidOn?: string | null
          paymentDetails?: Json | null
          paymentInfo?: Json | null
          paymentLink?: string | null
          paymentType?: string | null
          projectId?: string | null
          projectName?: string | null
          recepientEmail?: string | null
          recepientName?: string | null
          sentViaEmail?: boolean | null
          state?: string | null
          status?: string | null
          subTotalAmount?: number | null
          taxRate?: number | null
          totalAmount?: number | null
          updatedAt?: string | null
          vatRate?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "invoices_createdBy_fkey"
            columns: ["createdBy"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["profile_id"]
          },
          {
            foreignKeyName: "invoices_customerId_fkey"
            columns: ["customerId"]
            isOneToOne: false
            referencedRelation: "customers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "invoices_organizationId_fkey"
            columns: ["organizationId"]
            isOneToOne: false
            referencedRelation: "organization"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "invoices_projectid_fkey"
            columns: ["projectId"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      members: {
        Row: {
          addedBy: string | null
          author: string | null
          created_at: string
          email: string | null
          id: string
          organizationId: string | null
          paidSub: boolean | null
          roles: string | null
        }
        Insert: {
          addedBy?: string | null
          author?: string | null
          created_at?: string
          email?: string | null
          id?: string
          organizationId?: string | null
          paidSub?: boolean | null
          roles?: string | null
        }
        Update: {
          addedBy?: string | null
          author?: string | null
          created_at?: string
          email?: string | null
          id?: string
          organizationId?: string | null
          paidSub?: boolean | null
          roles?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "members_organizationId_fkey"
            columns: ["organizationId"]
            isOneToOne: false
            referencedRelation: "organization"
            referencedColumns: ["id"]
          },
        ]
      }
      notifications: {
        Row: {
          actionUrl: string | null
          created_at: string | null
          createdBy: string | null
          expiresAt: string | null
          id: string
          isRead: boolean | null
          message: string | null
          metadata: Json | null
          organizationId: string | null
          state: string | null
          tableId: string | null
          tableName: string | null
          title: string
          type: string
          updated_at: string | null
        }
        Insert: {
          actionUrl?: string | null
          created_at?: string | null
          createdBy?: string | null
          expiresAt?: string | null
          id?: string
          isRead?: boolean | null
          message?: string | null
          metadata?: Json | null
          organizationId?: string | null
          state?: string | null
          tableId?: string | null
          tableName?: string | null
          title: string
          type?: string
          updated_at?: string | null
        }
        Update: {
          actionUrl?: string | null
          created_at?: string | null
          createdBy?: string | null
          expiresAt?: string | null
          id?: string
          isRead?: boolean | null
          message?: string | null
          metadata?: Json | null
          organizationId?: string | null
          state?: string | null
          tableId?: string | null
          tableName?: string | null
          title?: string
          type?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "notifications_organizationId_fkey"
            columns: ["organizationId"]
            isOneToOne: false
            referencedRelation: "organization"
            referencedColumns: ["id"]
          },
        ]
      }
      organization: {
        Row: {
          accountNumber: string | null
          addressLine1: string | null
          addressLine2: string | null
          bankName: string | null
          baseCurrency: string | null
          billingCycle: Database["public"]["Enums"]["billing_cycle_enum"] | null
          billingEmail: string | null
          city: string | null
          country: string | null
          created_at: string | null
          createdBy: string | null
          defaultBankId: string | null
          email: string | null
          feedbackNotifications: boolean | null
          fts: unknown | null
          id: string
          invoiceNotifications: boolean | null
          logoUrl: string | null
          name: string | null
          paymentMethodId: string | null
          phone: string | null
          planType: Database["public"]["Enums"]["plan_type_enum"] | null
          postal: string | null
          projectNotifications: boolean | null
          setupCompletedAt: string | null
          setupCompletedBy: string | null
          setupData: Json | null
          setupStatus: string | null
          state: string | null
          stripeMetadata: Json | null
          subscriptionEndDate: string | null
          subscriptionId: string | null
          subscriptionMetadata: Json | null
          subscriptionStartDate: string | null
          subscriptionstatus:
            | Database["public"]["Enums"]["subscription_status_enum"]
            | null
          subscriptionStatus: string | null
          taxId: string | null
          trialEndsAt: string | null
          updated_at: string | null
          website: string | null
        }
        Insert: {
          accountNumber?: string | null
          addressLine1?: string | null
          addressLine2?: string | null
          bankName?: string | null
          baseCurrency?: string | null
          billingCycle?:
            | Database["public"]["Enums"]["billing_cycle_enum"]
            | null
          billingEmail?: string | null
          city?: string | null
          country?: string | null
          created_at?: string | null
          createdBy?: string | null
          defaultBankId?: string | null
          email?: string | null
          feedbackNotifications?: boolean | null
          fts?: unknown | null
          id?: string
          invoiceNotifications?: boolean | null
          logoUrl?: string | null
          name?: string | null
          paymentMethodId?: string | null
          phone?: string | null
          planType?: Database["public"]["Enums"]["plan_type_enum"] | null
          postal?: string | null
          projectNotifications?: boolean | null
          setupCompletedAt?: string | null
          setupCompletedBy?: string | null
          setupData?: Json | null
          setupStatus?: string | null
          state?: string | null
          stripeMetadata?: Json | null
          subscriptionEndDate?: string | null
          subscriptionId?: string | null
          subscriptionMetadata?: Json | null
          subscriptionStartDate?: string | null
          subscriptionstatus?:
            | Database["public"]["Enums"]["subscription_status_enum"]
            | null
          subscriptionStatus?: string | null
          taxId?: string | null
          trialEndsAt?: string | null
          updated_at?: string | null
          website?: string | null
        }
        Update: {
          accountNumber?: string | null
          addressLine1?: string | null
          addressLine2?: string | null
          bankName?: string | null
          baseCurrency?: string | null
          billingCycle?:
            | Database["public"]["Enums"]["billing_cycle_enum"]
            | null
          billingEmail?: string | null
          city?: string | null
          country?: string | null
          created_at?: string | null
          createdBy?: string | null
          defaultBankId?: string | null
          email?: string | null
          feedbackNotifications?: boolean | null
          fts?: unknown | null
          id?: string
          invoiceNotifications?: boolean | null
          logoUrl?: string | null
          name?: string | null
          paymentMethodId?: string | null
          phone?: string | null
          planType?: Database["public"]["Enums"]["plan_type_enum"] | null
          postal?: string | null
          projectNotifications?: boolean | null
          setupCompletedAt?: string | null
          setupCompletedBy?: string | null
          setupData?: Json | null
          setupStatus?: string | null
          state?: string | null
          stripeMetadata?: Json | null
          subscriptionEndDate?: string | null
          subscriptionId?: string | null
          subscriptionMetadata?: Json | null
          subscriptionStartDate?: string | null
          subscriptionstatus?:
            | Database["public"]["Enums"]["subscription_status_enum"]
            | null
          subscriptionStatus?: string | null
          taxId?: string | null
          trialEndsAt?: string | null
          updated_at?: string | null
          website?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "organization_createdBy_fkey"
            columns: ["createdBy"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["profile_id"]
          },
        ]
      }
      paymentTerms: {
        Row: {
          amount: number | null
          created_at: string | null
          createdBy: string | null
          deliverableId: string | null
          description: string | null
          dueDate: string | null
          hasPaymentTerms: boolean | null
          id: string
          name: string | null
          organizationId: string | null
          percentage: number | null
          projectId: string | null
          status: string | null
          type: string | null
          updatedAt: string | null
        }
        Insert: {
          amount?: number | null
          created_at?: string | null
          createdBy?: string | null
          deliverableId?: string | null
          description?: string | null
          dueDate?: string | null
          hasPaymentTerms?: boolean | null
          id?: string
          name?: string | null
          organizationId?: string | null
          percentage?: number | null
          projectId?: string | null
          status?: string | null
          type?: string | null
          updatedAt?: string | null
        }
        Update: {
          amount?: number | null
          created_at?: string | null
          createdBy?: string | null
          deliverableId?: string | null
          description?: string | null
          dueDate?: string | null
          hasPaymentTerms?: boolean | null
          id?: string
          name?: string | null
          organizationId?: string | null
          percentage?: number | null
          projectId?: string | null
          status?: string | null
          type?: string | null
          updatedAt?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "paymentTerms_createdBy_fkey"
            columns: ["createdBy"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["profile_id"]
          },
          {
            foreignKeyName: "paymentTerms_deliverableId_fkey"
            columns: ["deliverableId"]
            isOneToOne: false
            referencedRelation: "deliverables"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "paymentTerms_organizationId_fkey"
            columns: ["organizationId"]
            isOneToOne: false
            referencedRelation: "organization"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "paymentTerms_projectId_fkey"
            columns: ["projectId"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      pricing: {
        Row: {
          billingCycle: string | null
          created_at: string | null
          currency: string
          id: string
          isActive: boolean | null
          metadata: Json | null
          productId: string | null
          stripePriceId: string
          stripeProductId: string
          unitAmount: number
          updated_at: string | null
        }
        Insert: {
          billingCycle?: string | null
          created_at?: string | null
          currency?: string
          id?: string
          isActive?: boolean | null
          metadata?: Json | null
          productId?: string | null
          stripePriceId: string
          stripeProductId: string
          unitAmount: number
          updated_at?: string | null
        }
        Update: {
          billingCycle?: string | null
          created_at?: string | null
          currency?: string
          id?: string
          isActive?: boolean | null
          metadata?: Json | null
          productId?: string | null
          stripePriceId?: string
          stripeProductId?: string
          unitAmount?: number
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "pricing_productid_fkey"
            columns: ["productId"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
      }
      products: {
        Row: {
          created_at: string | null
          description: string | null
          id: string
          isActive: boolean | null
          metadata: Json | null
          name: string
          stripeProductId: string
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          description?: string | null
          id?: string
          isActive?: boolean | null
          metadata?: Json | null
          name: string
          stripeProductId: string
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          description?: string | null
          id?: string
          isActive?: boolean | null
          metadata?: Json | null
          name?: string
          stripeProductId?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      profiles: {
        Row: {
          created_at: string | null
          email: string | null
          id: string
          organizationId: string | null
          organizationRole: string | null
          profile_id: string | null
        }
        Insert: {
          created_at?: string | null
          email?: string | null
          id?: string
          organizationId?: string | null
          organizationRole?: string | null
          profile_id?: string | null
        }
        Update: {
          created_at?: string | null
          email?: string | null
          id?: string
          organizationId?: string | null
          organizationRole?: string | null
          profile_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "profiles_organizationId_fkey"
            columns: ["organizationId"]
            isOneToOne: false
            referencedRelation: "organization"
            referencedColumns: ["id"]
          },
        ]
      }
      projects: {
        Row: {
          agreementTemplate: string | null
          allowReminders: boolean | null
          budget: number | null
          created_at: string | null
          createdBy: string | null
          currency: string | null
          currencyEnabled: boolean | null
          customerId: string | null
          customFields: Json | null
          deliverables: Json | null
          deliverablesEnabled: boolean | null
          description: string | null
          documents: Json | null
          effectiveDate: string | null
          emailToCustomer: boolean | null
          endDate: string | null
          fts: unknown | null
          hasAgreedToTerms: boolean | null
          hasPaymentTerms: boolean | null
          hasServiceAgreement: boolean | null
          id: string
          invoiceId: string | null
          isArchived: boolean | null
          isPublished: boolean | null
          name: string | null
          notes: string | null
          organizationEmail: string | null
          organizationId: string | null
          organizationLogo: string | null
          organizationName: string | null
          paymentMilestones: Json | null
          paymentStructure: string | null
          projectTypeId: string | null
          recepientEmail: string | null
          recepientName: string | null
          serviceAgreement: Json | null
          signatureDetails: Json | null
          signedOn: string | null
          signedStatus: string | null
          startDate: string | null
          state: string | null
          status: string | null
          token: string | null
          type: string | null
          updatedOn: string | null
        }
        Insert: {
          agreementTemplate?: string | null
          allowReminders?: boolean | null
          budget?: number | null
          created_at?: string | null
          createdBy?: string | null
          currency?: string | null
          currencyEnabled?: boolean | null
          customerId?: string | null
          customFields?: Json | null
          deliverables?: Json | null
          deliverablesEnabled?: boolean | null
          description?: string | null
          documents?: Json | null
          effectiveDate?: string | null
          emailToCustomer?: boolean | null
          endDate?: string | null
          fts?: unknown | null
          hasAgreedToTerms?: boolean | null
          hasPaymentTerms?: boolean | null
          hasServiceAgreement?: boolean | null
          id?: string
          invoiceId?: string | null
          isArchived?: boolean | null
          isPublished?: boolean | null
          name?: string | null
          notes?: string | null
          organizationEmail?: string | null
          organizationId?: string | null
          organizationLogo?: string | null
          organizationName?: string | null
          paymentMilestones?: Json | null
          paymentStructure?: string | null
          projectTypeId?: string | null
          recepientEmail?: string | null
          recepientName?: string | null
          serviceAgreement?: Json | null
          signatureDetails?: Json | null
          signedOn?: string | null
          signedStatus?: string | null
          startDate?: string | null
          state?: string | null
          status?: string | null
          token?: string | null
          type?: string | null
          updatedOn?: string | null
        }
        Update: {
          agreementTemplate?: string | null
          allowReminders?: boolean | null
          budget?: number | null
          created_at?: string | null
          createdBy?: string | null
          currency?: string | null
          currencyEnabled?: boolean | null
          customerId?: string | null
          customFields?: Json | null
          deliverables?: Json | null
          deliverablesEnabled?: boolean | null
          description?: string | null
          documents?: Json | null
          effectiveDate?: string | null
          emailToCustomer?: boolean | null
          endDate?: string | null
          fts?: unknown | null
          hasAgreedToTerms?: boolean | null
          hasPaymentTerms?: boolean | null
          hasServiceAgreement?: boolean | null
          id?: string
          invoiceId?: string | null
          isArchived?: boolean | null
          isPublished?: boolean | null
          name?: string | null
          notes?: string | null
          organizationEmail?: string | null
          organizationId?: string | null
          organizationLogo?: string | null
          organizationName?: string | null
          paymentMilestones?: Json | null
          paymentStructure?: string | null
          projectTypeId?: string | null
          recepientEmail?: string | null
          recepientName?: string | null
          serviceAgreement?: Json | null
          signatureDetails?: Json | null
          signedOn?: string | null
          signedStatus?: string | null
          startDate?: string | null
          state?: string | null
          status?: string | null
          token?: string | null
          type?: string | null
          updatedOn?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "projects_createdBy_fkey"
            columns: ["createdBy"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["profile_id"]
          },
          {
            foreignKeyName: "projects_customerId_fkey"
            columns: ["customerId"]
            isOneToOne: false
            referencedRelation: "customers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "projects_organizationId_fkey"
            columns: ["organizationId"]
            isOneToOne: false
            referencedRelation: "organization"
            referencedColumns: ["id"]
          },
        ]
      }
      receipts: {
        Row: {
          created_at: string | null
          createdBy: string | null
          creationMethod: string | null
          currency: string | null
          customerId: string | null
          discount: number | null
          dueDate: string | null
          emailSentAt: string | null
          fts: unknown | null
          hasDiscount: boolean | null
          hasTax: boolean | null
          hasVat: boolean | null
          id: string
          invoiceId: string | null
          issueDate: string | null
          issuedBy: string | null
          notes: string | null
          organizationEmail: string | null
          organizationId: string | null
          organizationLogo: string | null
          organizationName: string | null
          paymentConfirmedAt: string | null
          paymentDetails: Json | null
          paymentLink: string | null
          paymentType: string | null
          projectId: string | null
          receiptDetails: Json | null
          receiptNumber: string | null
          recepientEmail: string | null
          recepientName: string | null
          sentViaEmail: boolean | null
          state: string | null
          subTotalAmount: number | null
          taxAmount: number | null
          taxRate: number | null
          totalAmount: number | null
          updatedAt: string | null
          vatRate: number | null
        }
        Insert: {
          created_at?: string | null
          createdBy?: string | null
          creationMethod?: string | null
          currency?: string | null
          customerId?: string | null
          discount?: number | null
          dueDate?: string | null
          emailSentAt?: string | null
          fts?: unknown | null
          hasDiscount?: boolean | null
          hasTax?: boolean | null
          hasVat?: boolean | null
          id?: string
          invoiceId?: string | null
          issueDate?: string | null
          issuedBy?: string | null
          notes?: string | null
          organizationEmail?: string | null
          organizationId?: string | null
          organizationLogo?: string | null
          organizationName?: string | null
          paymentConfirmedAt?: string | null
          paymentDetails?: Json | null
          paymentLink?: string | null
          paymentType?: string | null
          projectId?: string | null
          receiptDetails?: Json | null
          receiptNumber?: string | null
          recepientEmail?: string | null
          recepientName?: string | null
          sentViaEmail?: boolean | null
          state?: string | null
          subTotalAmount?: number | null
          taxAmount?: number | null
          taxRate?: number | null
          totalAmount?: number | null
          updatedAt?: string | null
          vatRate?: number | null
        }
        Update: {
          created_at?: string | null
          createdBy?: string | null
          creationMethod?: string | null
          currency?: string | null
          customerId?: string | null
          discount?: number | null
          dueDate?: string | null
          emailSentAt?: string | null
          fts?: unknown | null
          hasDiscount?: boolean | null
          hasTax?: boolean | null
          hasVat?: boolean | null
          id?: string
          invoiceId?: string | null
          issueDate?: string | null
          issuedBy?: string | null
          notes?: string | null
          organizationEmail?: string | null
          organizationId?: string | null
          organizationLogo?: string | null
          organizationName?: string | null
          paymentConfirmedAt?: string | null
          paymentDetails?: Json | null
          paymentLink?: string | null
          paymentType?: string | null
          projectId?: string | null
          receiptDetails?: Json | null
          receiptNumber?: string | null
          recepientEmail?: string | null
          recepientName?: string | null
          sentViaEmail?: boolean | null
          state?: string | null
          subTotalAmount?: number | null
          taxAmount?: number | null
          taxRate?: number | null
          totalAmount?: number | null
          updatedAt?: string | null
          vatRate?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "receipts_createdBy_fkey"
            columns: ["createdBy"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["profile_id"]
          },
          {
            foreignKeyName: "receipts_customerId_fkey"
            columns: ["customerId"]
            isOneToOne: false
            referencedRelation: "customers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "receipts_invoiceId_fkey"
            columns: ["invoiceId"]
            isOneToOne: false
            referencedRelation: "invoices"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "receipts_organizationId_fkey"
            columns: ["organizationId"]
            isOneToOne: false
            referencedRelation: "organization"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "receipts_projectId_fkey"
            columns: ["projectId"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      subscriptions: {
        Row: {
          amount: number | null
          billingCycle: Database["public"]["Enums"]["billing_cycle_enum"] | null
          created_at: string
          createdBy: string | null
          currency: string | null
          endsAt: string | null
          id: number
          organizationId: string | null
          paymentMethod: Json | null
          planType: Database["public"]["Enums"]["plan_type_enum"] | null
          startsAt: string | null
          stripeCustomerId: string | null
          stripeMetadata: Json | null
          stripeSubscriptionId: string | null
          subscriptionStatus:
            | Database["public"]["Enums"]["subscription_status_enum"]
            | null
          updatedAt: string | null
        }
        Insert: {
          amount?: number | null
          billingCycle?:
            | Database["public"]["Enums"]["billing_cycle_enum"]
            | null
          created_at?: string
          createdBy?: string | null
          currency?: string | null
          endsAt?: string | null
          id?: number
          organizationId?: string | null
          paymentMethod?: Json | null
          planType?: Database["public"]["Enums"]["plan_type_enum"] | null
          startsAt?: string | null
          stripeCustomerId?: string | null
          stripeMetadata?: Json | null
          stripeSubscriptionId?: string | null
          subscriptionStatus?:
            | Database["public"]["Enums"]["subscription_status_enum"]
            | null
          updatedAt?: string | null
        }
        Update: {
          amount?: number | null
          billingCycle?:
            | Database["public"]["Enums"]["billing_cycle_enum"]
            | null
          created_at?: string
          createdBy?: string | null
          currency?: string | null
          endsAt?: string | null
          id?: number
          organizationId?: string | null
          paymentMethod?: Json | null
          planType?: Database["public"]["Enums"]["plan_type_enum"] | null
          startsAt?: string | null
          stripeCustomerId?: string | null
          stripeMetadata?: Json | null
          stripeSubscriptionId?: string | null
          subscriptionStatus?:
            | Database["public"]["Enums"]["subscription_status_enum"]
            | null
          updatedAt?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "subscriptions_organizationId_fkey"
            columns: ["organizationId"]
            isOneToOne: false
            referencedRelation: "organization"
            referencedColumns: ["id"]
          },
        ]
      }
      vault: {
        Row: {
          bucketUrl: string | null
          created_at: string
          createdBy: string | null
          customerId: string | null
          feedbackId: string | null
          id: string
          invoiceId: string | null
          lnikId: string | null
          projectId: string | null
          rceeiptId: string | null
          tableTpye: string | null
          typeId: string | null
        }
        Insert: {
          bucketUrl?: string | null
          created_at?: string
          createdBy?: string | null
          customerId?: string | null
          feedbackId?: string | null
          id?: string
          invoiceId?: string | null
          lnikId?: string | null
          projectId?: string | null
          rceeiptId?: string | null
          tableTpye?: string | null
          typeId?: string | null
        }
        Update: {
          bucketUrl?: string | null
          created_at?: string
          createdBy?: string | null
          customerId?: string | null
          feedbackId?: string | null
          id?: string
          invoiceId?: string | null
          lnikId?: string | null
          projectId?: string | null
          rceeiptId?: string | null
          tableTpye?: string | null
          typeId?: string | null
        }
        Relationships: []
      }
      wallet: {
        Row: {
          created_at: string
          createdBy: string | null
          crypto: string | null
          id: string
          isDefault: boolean | null
          organizationId: string | null
          updatedAt: string | null
          walletAddress: string | null
          walletName: string | null
        }
        Insert: {
          created_at?: string
          createdBy?: string | null
          crypto?: string | null
          id?: string
          isDefault?: boolean | null
          organizationId?: string | null
          updatedAt?: string | null
          walletAddress?: string | null
          walletName?: string | null
        }
        Update: {
          created_at?: string
          createdBy?: string | null
          crypto?: string | null
          id?: string
          isDefault?: boolean | null
          organizationId?: string | null
          updatedAt?: string | null
          walletAddress?: string | null
          walletName?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "wallet_organizationId_fkey"
            columns: ["organizationId"]
            isOneToOne: false
            referencedRelation: "organization"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      generate_invoice_number: {
        Args: { org_id: string }
        Returns: string
      }
      generate_receipt_number: {
        Args: { org_id: string }
        Returns: string
      }
      get_recent_items: {
        Args: Record<PropertyKey, never>
        Returns: {
          category: string
          id: string
          name: string
          type: string
          created_at: string
        }[]
      }
      handle_bank_deletion: {
        Args: { p_bank_id: string; p_organization_id: string }
        Returns: undefined
      }
      regenerate_invoice_numbers: {
        Args: { org_id: string }
        Returns: undefined
      }
      regenerate_receipt_numbers: {
        Args: { org_id: string }
        Returns: undefined
      }
      set_feedback_token: {
        Args: { token_param: string }
        Returns: undefined
      }
      smart_universal_search: {
        Args: { search_term: string }
        Returns: {
          category: string
          id: string
          name: string
          type: string
          rank: number
          related_category: string
          customerId: string
          projectId: string
        }[]
      }
      update_default_bank: {
        Args: { p_bank_id: string; p_organization_id: string }
        Returns: undefined
      }
    }
    Enums: {
      billing_cycle_enum: "monthly" | "yearly"
      customer_activity_reference_enum:
        | "invoice"
        | "receipt"
        | "project"
        | "agreement"
        | "feedback"
      customer_activity_type_enum:
        | "invoice_sent"
        | "invoice_paid"
        | "invoice_viewed"
        | "invoice_overdue"
        | "invoice_link_clicked"
        | "receipt_sent"
        | "receipt_link_clicked"
        | "receipt_viewed"
        | "project_started"
        | "project_completed"
        | "project_link_clicked"
        | "agreement_sent"
        | "agreement_signed"
        | "agreement_viewed"
        | "agreement_link_clicked"
        | "feedback_requested"
        | "feedback_received"
        | "feedback_viewed"
        | "feedback_link_clicked"
        | "email_opened"
        | "project_sent"
        | "project_viewed"
        | "feedback_sent"
        | "feedback_reminder"
        | "feedback_overdue"
      plan_type_enum: "starter" | "pro" | "corporate"
      subscription_status_enum:
        | "trial"
        | "pending"
        | "active"
        | "expired"
        | "cancelled"
        | "suspended"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  graphql_public: {
    Enums: {},
  },
  public: {
    Enums: {
      billing_cycle_enum: ["monthly", "yearly"],
      customer_activity_reference_enum: [
        "invoice",
        "receipt",
        "project",
        "agreement",
        "feedback",
      ],
      customer_activity_type_enum: [
        "invoice_sent",
        "invoice_paid",
        "invoice_viewed",
        "invoice_overdue",
        "invoice_link_clicked",
        "receipt_sent",
        "receipt_link_clicked",
        "receipt_viewed",
        "project_started",
        "project_completed",
        "project_link_clicked",
        "agreement_sent",
        "agreement_signed",
        "agreement_viewed",
        "agreement_link_clicked",
        "feedback_requested",
        "feedback_received",
        "feedback_viewed",
        "feedback_link_clicked",
        "email_opened",
        "project_sent",
        "project_viewed",
        "feedback_sent",
        "feedback_reminder",
        "feedback_overdue",
      ],
      plan_type_enum: ["starter", "pro", "corporate"],
      subscription_status_enum: [
        "trial",
        "pending",
        "active",
        "expired",
        "cancelled",
        "suspended",
      ],
    },
  },
} as const

