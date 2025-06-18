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
          operationName?: string
          query?: string
          variables?: Json
          extensions?: Json
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
  pgbouncer: {
    Tables: {
      [_ in never]: never
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      get_auth: {
        Args: { p_usename: string }
        Returns: {
          username: string
          password: string
        }[]
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
      customer_activities: {
        Row: {
          amount: number | null
          created_at: string
          creatorId: string | null
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
          created_at?: string
          creatorId?: string | null
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
          created_at?: string
          creatorId?: string | null
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
            foreignKeyName: "customer_activities_creatorId_fkey"
            columns: ["creatorId"]
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "customer_activities_customerId_fkey"
            columns: ["customerId"]
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
          created_at: string
          createdBy: string | null
          email: string | null
          fullAddress: string | null
          id: string
          name: string | null
          notes: string | null
          organizationId: string | null
          phone: string | null
          postalCode: string | null
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
          created_at?: string
          createdBy?: string | null
          email?: string | null
          fullAddress?: string | null
          id?: string
          name?: string | null
          notes?: string | null
          organizationId?: string | null
          phone?: string | null
          postalCode?: string | null
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
          created_at?: string
          createdBy?: string | null
          email?: string | null
          fullAddress?: string | null
          id?: string
          name?: string | null
          notes?: string | null
          organizationId?: string | null
          phone?: string | null
          postalCode?: string | null
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
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "customers_organizationId_fkey"
            columns: ["organizationId"]
            referencedRelation: "organization"
            referencedColumns: ["id"]
          },
        ]
      }
      deliverables: {
        Row: {
          created_at: string
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
          created_at?: string
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
          created_at?: string
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
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "deliverables_projectId_fkey"
            columns: ["projectId"]
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      invoices: {
        Row: {
          created_at: string
          currency: string | null
          customerId: string | null
          dueDate: string | null
          emailSentAt: string | null
          id: string
          invoiceDetails: Json | null
          invoiceNumber: string | null
          issueDate: string | null
          notes: string | null
          paymentDetails: Json | null
          paymentLink: string | null
          paymentType: string | null
          projectId: string | null
          sentViaEmail: boolean | null
          status: string | null
          subTotalAmount: number | null
          taxRate: number | null
          totalAmount: number | null
          updatedAt: string | null
          vatRate: number | null
        }
        Insert: {
          created_at?: string
          currency?: string | null
          customerId?: string | null
          dueDate?: string | null
          emailSentAt?: string | null
          id?: string
          invoiceDetails?: Json | null
          invoiceNumber?: string | null
          issueDate?: string | null
          notes?: string | null
          paymentDetails?: Json | null
          paymentLink?: string | null
          paymentType?: string | null
          projectId?: string | null
          sentViaEmail?: boolean | null
          status?: string | null
          subTotalAmount?: number | null
          taxRate?: number | null
          totalAmount?: number | null
          updatedAt?: string | null
          vatRate?: number | null
        }
        Update: {
          created_at?: string
          currency?: string | null
          customerId?: string | null
          dueDate?: string | null
          emailSentAt?: string | null
          id?: string
          invoiceDetails?: Json | null
          invoiceNumber?: string | null
          issueDate?: string | null
          notes?: string | null
          paymentDetails?: Json | null
          paymentLink?: string | null
          paymentType?: string | null
          projectId?: string | null
          sentViaEmail?: boolean | null
          status?: string | null
          subTotalAmount?: number | null
          taxRate?: number | null
          totalAmount?: number | null
          updatedAt?: string | null
          vatRate?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "invoices_customerId_fkey"
            columns: ["customerId"]
            referencedRelation: "customers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "invoices_projectId_fkey"
            columns: ["projectId"]
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      organization: {
        Row: {
          baseCurrency: string | null
          country: string | null
          created_at: string
          createdBy: string | null
          email: string | null
          id: string
          logoUrl: string | null
          name: string | null
          updated_at: string | null
        }
        Insert: {
          baseCurrency?: string | null
          country?: string | null
          created_at?: string
          createdBy?: string | null
          email?: string | null
          id?: string
          logoUrl?: string | null
          name?: string | null
          updated_at?: string | null
        }
        Update: {
          baseCurrency?: string | null
          country?: string | null
          created_at?: string
          createdBy?: string | null
          email?: string | null
          id?: string
          logoUrl?: string | null
          name?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "organization_createdBy_fkey"
            columns: ["createdBy"]
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      paymentTerms: {
        Row: {
          amount: number | null
          created_at: string
          createdBy: string | null
          deliverableId: string | null
          description: string | null
          dueDate: string | null
          hasPaymentTerms: boolean | null
          id: string
          name: string | null
          percentage: number | null
          projectId: string | null
          status: string | null
          type: string | null
          updatedAt: string | null
        }
        Insert: {
          amount?: number | null
          created_at?: string
          createdBy?: string | null
          deliverableId?: string | null
          description?: string | null
          dueDate?: string | null
          hasPaymentTerms?: boolean | null
          id?: string
          name?: string | null
          percentage?: number | null
          projectId?: string | null
          status?: string | null
          type?: string | null
          updatedAt?: string | null
        }
        Update: {
          amount?: number | null
          created_at?: string
          createdBy?: string | null
          deliverableId?: string | null
          description?: string | null
          dueDate?: string | null
          hasPaymentTerms?: boolean | null
          id?: string
          name?: string | null
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
            referencedRelation: "profiles"
            referencedColumns: ["profile_id"]
          },
          {
            foreignKeyName: "paymentTerms_deliverableId_fkey"
            columns: ["deliverableId"]
            referencedRelation: "deliverables"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "paymentTerms_projectId_fkey"
            columns: ["projectId"]
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          created_at: string | null
          email: string | null
          id: string
          profile_id: string | null
        }
        Insert: {
          created_at?: string | null
          email?: string | null
          id?: string
          profile_id?: string | null
        }
        Update: {
          created_at?: string | null
          email?: string | null
          id?: string
          profile_id?: string | null
        }
        Relationships: []
      }
      projects: {
        Row: {
          budget: number | null
          created_at: string
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
          hasAgreedToTerms: boolean | null
          hasPaymentTerms: boolean | null
          hasServiceAgreement: boolean | null
          id: string
          isArchived: boolean | null
          isPublished: boolean | null
          name: string | null
          notes: string | null
          paymentMilestones: Json | null
          paymentStructure: string | null
          projectTypeId: string | null
          serviceAgreement: Json | null
          signedOn: string | null
          signedStatus: string | null
          startDate: string | null
          state: string | null
          status: string | null
          type: string | null
          updatedOn: string | null
        }
        Insert: {
          budget?: number | null
          created_at?: string
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
          hasAgreedToTerms?: boolean | null
          hasPaymentTerms?: boolean | null
          hasServiceAgreement?: boolean | null
          id?: string
          isArchived?: boolean | null
          isPublished?: boolean | null
          name?: string | null
          notes?: string | null
          paymentMilestones?: Json | null
          paymentStructure?: string | null
          projectTypeId?: string | null
          serviceAgreement?: Json | null
          signedOn?: string | null
          signedStatus?: string | null
          startDate?: string | null
          state?: string | null
          status?: string | null
          type?: string | null
          updatedOn?: string | null
        }
        Update: {
          budget?: number | null
          created_at?: string
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
          hasAgreedToTerms?: boolean | null
          hasPaymentTerms?: boolean | null
          hasServiceAgreement?: boolean | null
          id?: string
          isArchived?: boolean | null
          isPublished?: boolean | null
          name?: string | null
          notes?: string | null
          paymentMilestones?: Json | null
          paymentStructure?: string | null
          projectTypeId?: string | null
          serviceAgreement?: Json | null
          signedOn?: string | null
          signedStatus?: string | null
          startDate?: string | null
          state?: string | null
          status?: string | null
          type?: string | null
          updatedOn?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "projects_createdBy_fkey"
            columns: ["createdBy"]
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "projects_customerId_fkey"
            columns: ["customerId"]
            referencedRelation: "customers"
            referencedColumns: ["id"]
          },
        ]
      }
      receipts: {
        Row: {
          created_at: string
          creationMethod: string | null
          currency: string | null
          customerId: string | null
          dueDate: string | null
          emailSentAt: string | null
          id: string
          invoiceId: string | null
          issueDate: string | null
          notes: string | null
          paymentConfirmedAt: string | null
          paymentDetails: Json | null
          paymentLink: string | null
          paymentType: string | null
          projectId: string | null
          receiptDetails: Json | null
          receiptNumber: string | null
          sentViaEmail: boolean | null
          status: string | null
          subtotalAmount: number | null
          taxAmount: number | null
          totalAmount: number | null
          updatedAt: string | null
          vatRate: number | null
        }
        Insert: {
          created_at?: string
          creationMethod?: string | null
          currency?: string | null
          customerId?: string | null
          dueDate?: string | null
          emailSentAt?: string | null
          id?: string
          invoiceId?: string | null
          issueDate?: string | null
          notes?: string | null
          paymentConfirmedAt?: string | null
          paymentDetails?: Json | null
          paymentLink?: string | null
          paymentType?: string | null
          projectId?: string | null
          receiptDetails?: Json | null
          receiptNumber?: string | null
          sentViaEmail?: boolean | null
          status?: string | null
          subtotalAmount?: number | null
          taxAmount?: number | null
          totalAmount?: number | null
          updatedAt?: string | null
          vatRate?: number | null
        }
        Update: {
          created_at?: string
          creationMethod?: string | null
          currency?: string | null
          customerId?: string | null
          dueDate?: string | null
          emailSentAt?: string | null
          id?: string
          invoiceId?: string | null
          issueDate?: string | null
          notes?: string | null
          paymentConfirmedAt?: string | null
          paymentDetails?: Json | null
          paymentLink?: string | null
          paymentType?: string | null
          projectId?: string | null
          receiptDetails?: Json | null
          receiptNumber?: string | null
          sentViaEmail?: boolean | null
          status?: string | null
          subtotalAmount?: number | null
          taxAmount?: number | null
          totalAmount?: number | null
          updatedAt?: string | null
          vatRate?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "receipts_customerId_fkey"
            columns: ["customerId"]
            referencedRelation: "customers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "receipts_invoiceId_fkey"
            columns: ["invoiceId"]
            referencedRelation: "invoices"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "receipts_projectId_fkey"
            columns: ["projectId"]
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      customer_activity_reference_enum:
        | "invoice"
        | "receipt"
        | "project"
        | "agreement"
        | "feedback"
      customer_activity_type_enum:
        | "invoice_sent"
        | "invoice_paid"
        | "invoice_overdue"
        | "invoice_link_clicked"
        | "receipt_sent"
        | "receipt_link_clicked"
        | "project_started"
        | "project_completed"
        | "project_link_clicked"
        | "agreement_sent"
        | "agreement_signed"
        | "agreement_link_clicked"
        | "feedback_requested"
        | "feedback_received"
        | "feedback_link_clicked"
        | "email_opened"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
  storage: {
    Tables: {
      buckets: {
        Row: {
          allowed_mime_types: string[] | null
          avif_autodetection: boolean | null
          created_at: string | null
          file_size_limit: number | null
          id: string
          name: string
          owner: string | null
          owner_id: string | null
          public: boolean | null
          updated_at: string | null
        }
        Insert: {
          allowed_mime_types?: string[] | null
          avif_autodetection?: boolean | null
          created_at?: string | null
          file_size_limit?: number | null
          id: string
          name: string
          owner?: string | null
          owner_id?: string | null
          public?: boolean | null
          updated_at?: string | null
        }
        Update: {
          allowed_mime_types?: string[] | null
          avif_autodetection?: boolean | null
          created_at?: string | null
          file_size_limit?: number | null
          id?: string
          name?: string
          owner?: string | null
          owner_id?: string | null
          public?: boolean | null
          updated_at?: string | null
        }
        Relationships: []
      }
      migrations: {
        Row: {
          executed_at: string | null
          hash: string
          id: number
          name: string
        }
        Insert: {
          executed_at?: string | null
          hash: string
          id: number
          name: string
        }
        Update: {
          executed_at?: string | null
          hash?: string
          id?: number
          name?: string
        }
        Relationships: []
      }
      objects: {
        Row: {
          bucket_id: string | null
          created_at: string | null
          id: string
          last_accessed_at: string | null
          level: number | null
          metadata: Json | null
          name: string | null
          owner: string | null
          owner_id: string | null
          path_tokens: string[] | null
          updated_at: string | null
          user_metadata: Json | null
          version: string | null
        }
        Insert: {
          bucket_id?: string | null
          created_at?: string | null
          id?: string
          last_accessed_at?: string | null
          level?: number | null
          metadata?: Json | null
          name?: string | null
          owner?: string | null
          owner_id?: string | null
          path_tokens?: string[] | null
          updated_at?: string | null
          user_metadata?: Json | null
          version?: string | null
        }
        Update: {
          bucket_id?: string | null
          created_at?: string | null
          id?: string
          last_accessed_at?: string | null
          level?: number | null
          metadata?: Json | null
          name?: string | null
          owner?: string | null
          owner_id?: string | null
          path_tokens?: string[] | null
          updated_at?: string | null
          user_metadata?: Json | null
          version?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "objects_bucketId_fkey"
            columns: ["bucket_id"]
            referencedRelation: "buckets"
            referencedColumns: ["id"]
          },
        ]
      }
      prefixes: {
        Row: {
          bucket_id: string
          created_at: string | null
          level: number
          name: string
          updated_at: string | null
        }
        Insert: {
          bucket_id: string
          created_at?: string | null
          level?: number
          name: string
          updated_at?: string | null
        }
        Update: {
          bucket_id?: string
          created_at?: string | null
          level?: number
          name?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "prefixes_bucketId_fkey"
            columns: ["bucket_id"]
            referencedRelation: "buckets"
            referencedColumns: ["id"]
          },
        ]
      }
      s3_multipart_uploads: {
        Row: {
          bucket_id: string
          created_at: string
          id: string
          in_progress_size: number
          key: string
          owner_id: string | null
          upload_signature: string
          user_metadata: Json | null
          version: string
        }
        Insert: {
          bucket_id: string
          created_at?: string
          id: string
          in_progress_size?: number
          key: string
          owner_id?: string | null
          upload_signature: string
          user_metadata?: Json | null
          version: string
        }
        Update: {
          bucket_id?: string
          created_at?: string
          id?: string
          in_progress_size?: number
          key?: string
          owner_id?: string | null
          upload_signature?: string
          user_metadata?: Json | null
          version?: string
        }
        Relationships: [
          {
            foreignKeyName: "s3_multipart_uploads_bucket_id_fkey"
            columns: ["bucket_id"]
            referencedRelation: "buckets"
            referencedColumns: ["id"]
          },
        ]
      }
      s3_multipart_uploads_parts: {
        Row: {
          bucket_id: string
          created_at: string
          etag: string
          id: string
          key: string
          owner_id: string | null
          part_number: number
          size: number
          upload_id: string
          version: string
        }
        Insert: {
          bucket_id: string
          created_at?: string
          etag: string
          id?: string
          key: string
          owner_id?: string | null
          part_number: number
          size?: number
          upload_id: string
          version: string
        }
        Update: {
          bucket_id?: string
          created_at?: string
          etag?: string
          id?: string
          key?: string
          owner_id?: string | null
          part_number?: number
          size?: number
          upload_id?: string
          version?: string
        }
        Relationships: [
          {
            foreignKeyName: "s3_multipart_uploads_parts_bucket_id_fkey"
            columns: ["bucket_id"]
            referencedRelation: "buckets"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "s3_multipart_uploads_parts_upload_id_fkey"
            columns: ["upload_id"]
            referencedRelation: "s3_multipart_uploads"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      add_prefixes: {
        Args: { _bucket_id: string; _name: string }
        Returns: undefined
      }
      can_insert_object: {
        Args: { bucketid: string; name: string; owner: string; metadata: Json }
        Returns: undefined
      }
      delete_prefix: {
        Args: { _bucket_id: string; _name: string }
        Returns: boolean
      }
      extension: {
        Args: { name: string }
        Returns: string
      }
      filename: {
        Args: { name: string }
        Returns: string
      }
      foldername: {
        Args: { name: string }
        Returns: string[]
      }
      get_level: {
        Args: { name: string }
        Returns: number
      }
      get_prefix: {
        Args: { name: string }
        Returns: string
      }
      get_prefixes: {
        Args: { name: string }
        Returns: string[]
      }
      get_size_by_bucket: {
        Args: Record<PropertyKey, never>
        Returns: {
          size: number
          bucket_id: string
        }[]
      }
      list_multipart_uploads_with_delimiter: {
        Args: {
          bucket_id: string
          prefix_param: string
          delimiter_param: string
          max_keys?: number
          next_key_token?: string
          next_upload_token?: string
        }
        Returns: {
          key: string
          id: string
          created_at: string
        }[]
      }
      list_objects_with_delimiter: {
        Args: {
          bucket_id: string
          prefix_param: string
          delimiter_param: string
          max_keys?: number
          start_after?: string
          next_token?: string
        }
        Returns: {
          name: string
          id: string
          metadata: Json
          updated_at: string
        }[]
      }
      operation: {
        Args: Record<PropertyKey, never>
        Returns: string
      }
      search: {
        Args: {
          prefix: string
          bucketname: string
          limits?: number
          levels?: number
          offsets?: number
          search?: string
          sortcolumn?: string
          sortorder?: string
        }
        Returns: {
          name: string
          id: string
          updated_at: string
          created_at: string
          last_accessed_at: string
          metadata: Json
        }[]
      }
      search_legacy_v1: {
        Args: {
          prefix: string
          bucketname: string
          limits?: number
          levels?: number
          offsets?: number
          search?: string
          sortcolumn?: string
          sortorder?: string
        }
        Returns: {
          name: string
          id: string
          updated_at: string
          created_at: string
          last_accessed_at: string
          metadata: Json
        }[]
      }
      search_v1_optimised: {
        Args: {
          prefix: string
          bucketname: string
          limits?: number
          levels?: number
          offsets?: number
          search?: string
          sortcolumn?: string
          sortorder?: string
        }
        Returns: {
          name: string
          id: string
          updated_at: string
          created_at: string
          last_accessed_at: string
          metadata: Json
        }[]
      }
      search_v2: {
        Args: {
          prefix: string
          bucket_name: string
          limits?: number
          levels?: number
          start_after?: string
        }
        Returns: {
          key: string
          name: string
          id: string
          updated_at: string
          created_at: string
          metadata: Json
        }[]
      }
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DefaultSchema = Database[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof (Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        Database[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
  ? (Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      Database[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
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
    | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
  ? Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
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
    | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
  ? Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
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
    | { schema: keyof Database },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends { schema: keyof Database }
  ? Database[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof Database },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends { schema: keyof Database }
  ? Database[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  graphql_public: {
    Enums: {},
  },
  pgbouncer: {
    Enums: {},
  },
  public: {
    Enums: {
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
        "invoice_overdue",
        "invoice_link_clicked",
        "receipt_sent",
        "receipt_link_clicked",
        "project_started",
        "project_completed",
        "project_link_clicked",
        "agreement_sent",
        "agreement_signed",
        "agreement_link_clicked",
        "feedback_requested",
        "feedback_received",
        "feedback_link_clicked",
        "email_opened",
      ],
    },
  },
  storage: {
    Enums: {},
  },
} as const
