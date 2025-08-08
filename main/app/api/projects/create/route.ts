import { createClient } from "@/utils/supabase/server";

import { NextResponse } from "next/server";
import { render } from "@react-email/components";
import sendgrid from "@sendgrid/mail";
import IssueProject from '../../../../emails/IssueProject';
import { projectCreateSchema } from "@/validation/projects";
import crypto from "crypto";
import { baseUrl } from "@/utils/universal";

sendgrid.setApiKey(process.env.SENDGRID_API_KEY || "");

export async function POST(request: Request) {
    const supabase = await createClient();
    try {
        const { data: { user }, error: authError } = await supabase.auth.getUser();
        if (authError || !user) {
          return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
        }
        
        const body = await request.json();
        const validatedFields = projectCreateSchema.safeParse(body);

        if (!validatedFields.success) {
            console.error("Validation Errors:", JSON.stringify(validatedFields.error.flatten(), null, 2));
            return NextResponse.json(
                { error: "Invalid fields!", details: validatedFields.error.flatten() }, 
                { status: 400 });
        }
        const {
            customerId,
            currency,
            type,
            budget,
            name,
            notes,
            description,
            startDate,
            endDate,
            deliverablesEnabled,
            deliverables,
            paymentStructure,
            paymentMilestones,
            hasServiceAgreement,
            serviceAgreement,
            hasAgreedToTerms,
            isPublished,
            agreementTemplate,
            status: requestedStatus,
            signedStatus,
            state,
            emailToCustomer = false,
            organizationName,
            organizationLogo,
            organizationEmail,
            recepientName,
            recepientEmail,
          } = validatedFields.data;

          // Get user's profile to find their organization
          const { data: profile, error: profileError } = await supabase
            .from('profiles')
            .select('organizationId, email')
            .eq('profile_id', user.id)
            .single();

          if (profileError || !profile?.organizationId) {
            return NextResponse.json({ error: 'You must be part of an organization to create projects. Please contact your administrator.' }, { status: 403 });
          }

          // Get organization information for fallback data; ensure user belongs to same organization
          const { data: organization, error: orgError } = await supabase
            .from('organization')
            .select('id, name, email, logoUrl, baseCurrency')
            .eq('id', profile.organizationId)
            .single();

          if (orgError || !organization) {
            return NextResponse.json({ error: 'Organization not found' }, { status: 404 });
          }

          // Set organization fields with fallbacks
          const finalOrganizationName = organizationName || organization.name || (profile.email ? profile.email.split('@')[0] : null);
          const finalOrganizationLogoUrl = organizationLogo || organization.logoUrl;
          const finalOrganizationEmail = organizationEmail || organization.email || profile.email;
          const finalCurrency = currency || organization.baseCurrency || 'CAD';

          // Handle customer information if customerId is provided
          let finalRecepientName = recepientName;
          let finalRecepientEmail = recepientEmail;

          if (customerId) {
            const { data: customer, error: customerError } = await supabase
              .from('customers')
              .select('name, email')
              .eq('id', customerId)
              .single();

            if (customerError) {
              return NextResponse.json({ error: 'Customer not found' }, { status: 404 });
            }

            finalRecepientName = customer.name;
            finalRecepientEmail = customer.email;
          }

          // Set default dates if not provided
          const currentDate = new Date();
          const finalStartDate = startDate || currentDate;
          const finalEndDate = endDate || new Date(currentDate.getTime() + (21 * 24 * 60 * 60 * 1000)); // 3 weeks from current date

          // Generate token for project access
          const token = crypto.randomUUID();

          console.log("Attempting to insert into 'projects' table...");
           const { data: project, error: projectError } = await supabase
          .from("projects")
          .insert({
              type,
              customerId,
              currency: finalCurrency,
              name,
              description,
              startDate: finalStartDate,
              endDate: finalEndDate,
              budget,
              deliverablesEnabled,
              deliverables,
              paymentStructure,
              paymentMilestones,
              hasServiceAgreement,
              serviceAgreement,
              hasAgreedToTerms,
              agreementTemplate,
              isPublished,
              status: requestedStatus,
              signedStatus : "pending",
              state,
              notes,
              emailToCustomer,
              organizationName: finalOrganizationName,
              organizationLogo: finalOrganizationLogoUrl,
              organizationEmail: finalOrganizationEmail,
              recepientName: finalRecepientName,
              recepientEmail: finalRecepientEmail,
              createdBy: user.id,
              organizationId: profile.organizationId,
              updatedOn: new Date().toISOString(),
              isArchived: false,
              token: token,
            })
            .select()
            .single();
            
            if (projectError) {
                console.error("Supabase Project Insert Error:", projectError);
                return NextResponse.json({ success: false, error: projectError.message }, { status: 500 });
            }

            if (!project) {
                return NextResponse.json({ success: false, error: "Failed to create project; project data is null after insert." }, { status: 500 });
            }

            console.log("Project inserted successfully. Project ID:", project.id);

    // Insert deliverables if enabled
    let createdDeliverables: any[] = [];
    if (deliverablesEnabled && deliverables && deliverables.length > 0) {
        console.log("Attempting to insert into 'deliverables' table...");
        const { data: insertedDeliverables, error: deliverablesError } = await supabase
          .from("deliverables")
          .insert(
            deliverables.map((d) => ({
              projectId: project?.id,
              name: d.name,
              description: d.description,
              dueDate: d.dueDate || null,
              status: d.status || "pending",
              position: d.position,
              isPublished: d.isPublished || false,
              lastSaved: d.lastSaved || null,
              createdBy: user.id,
            }))
          )
          .select();
        if (deliverablesError) {
            console.error("Supabase Deliverables Insert Error:", deliverablesError);
            await supabase.from("projects").delete().eq("id", project.id);
            return NextResponse.json({ success: false, error: deliverablesError.message }, { status: 500 });
        }
        createdDeliverables = insertedDeliverables || [];
        console.log("Deliverables inserted successfully.");
      }

      // Insert payment terms based on paymentStructure
    if (paymentStructure === "milestonePayment" || paymentStructure === "deliverablePayment") {
        console.log("Attempting to insert into 'paymentTerms' table (milestone/deliverable)...");
        if (paymentMilestones && paymentMilestones.length > 0) {
          const paymentTermsToInsert = paymentMilestones.map((m, index) => {
            let deliverableId = null;
            
            // For deliverable-based payments, link to the actual created deliverable
            if (paymentStructure === "deliverablePayment" && createdDeliverables.length > 0) {
              // Match by position since deliverables are sorted by position
              const matchingDeliverable = createdDeliverables.find(d => d.position === (index + 1));
              deliverableId = matchingDeliverable?.id || null;
            }

            return {
              // DO NOT include id - let Supabase auto-generate it
              projectId: project?.id,
              deliverableId: deliverableId,
              name: m.name,
              description: m.description,
              amount: m.amount || null,
              percentage: m.percentage || null,
              dueDate: m.dueDate || null,
              status: m.status || "Pending",
              type: m.type,
              hasPaymentTerms: m.hasPaymentTerms || false,
              createdBy: user.id,
            };
          });

          const { error: paymentTermsError } = await supabase
            .from("paymentTerms")
            .insert(paymentTermsToInsert);
            
          if (paymentTermsError) {
            console.error("Supabase Payment Terms Insert Error:", paymentTermsError);
            if (createdDeliverables.length > 0) {
              const deliverableIds = createdDeliverables.map((d) => d.id);
              await supabase.from("deliverables").delete().in("id", deliverableIds);
            }
            await supabase.from("projects").delete().eq("id", project.id);
            return NextResponse.json({ success: false, error: paymentTermsError.message }, { status: 500 });
          }
        }
      } else if (paymentStructure === "fullDownPayment" || paymentStructure === "paymentOnCompletion") {
        console.log("Attempting to insert into 'paymentTerms' table (single payment)...");
        // Handle single payment term for full down payment or payment on completion
        const { error: paymentTermsError } = await supabase
          .from("paymentTerms")
          .insert({
            projectId : project?.id,
            name:
              paymentStructure === "fullDownPayment" ? "Full Down Payment" : "Payment on Completion",
            amount: budget || 0, // Use project budget as the amount
            status: "Pending",
            type: "milestone", // Default to milestone type
            hasPaymentTerms: true,
            createdBy: user.id,
          });
        if (paymentTermsError) {
            console.error("Supabase Payment Terms Insert Error:", paymentTermsError);
            await supabase.from("projects").delete().eq("id", project.id);
            return NextResponse.json({ success: false, error: paymentTermsError.message }, { status: 500 });
        }
      }
      console.log("Payment terms processed successfully.");
      // noPaymentOption is implicitly handled by doing nothing
  
      // Prepare response data
      const responseData = {
        ...project,
        deliverables: createdDeliverables || [],
        paymentMilestones: paymentMilestones || [],
      };

          // Handle email if published and emailToCustomer is true
    if (isPublished && emailToCustomer && customerId && project) {
        const { data: customer } = await supabase
          .from("customers")
          .select("name, email")
          .eq("id", customerId)
          .single();
          if (customer?.email) {
            const fromEmail = 'no_reply@projects.bexforte.com';
            const fromName = 'Bexforte';
            const sendName = project.organizationName || 'Bexforte';
            const logoUrl = project.organizationLogo || "https://www.bexoni.com/favicon.ico";
            
            const emailHtml = await render(IssueProject({
                projectId: project.id,
                clientName: customer.name || "",
                projectName: project.name,
                senderName: fromName,
                logoUrl: logoUrl,
                projectLink: `${baseUrl}/p/${project.id}?token=${token}`,
            }));

            console.log(`Attempting to send project email from: ${fromEmail} to: ${customer.email}`);
            console.log(`Project link: ${baseUrl}/p/${project.id}?token=${token}`);

            const fromField = `${fromName} <${fromEmail}>`;

            try {
              await sendgrid.send({
                  to: customer.email,
                  from: fromField,
                  subject: `${sendName} sent you a project`,
                  html: emailHtml,
                  customArgs: {
                      projectId: project.id,
                      customerId: customerId,
                      userId: user.id,
                      type: "project_sent",
                      token: token,
                  },
              });
  
              console.log("Email sent to:", customer.email);
  
            } catch (emailError: any) {
                console.error("SendGrid Error:", emailError);
            }
          }
        }

            return NextResponse.json({ success: true, data: responseData }, { status: 200 });

    } catch (error) {
        console.error("Error during project creation:", error);
        return NextResponse.json({ success: false, error: "Failed to create project" }, { status: 500 });
    }
}
