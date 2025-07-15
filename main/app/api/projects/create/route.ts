import { createClient } from "@/utils/supabase/server";

import { NextResponse } from "next/server";
import { render } from "@react-email/components";
import sendgrid from "@sendgrid/mail";
import IssueProject from '../../../../emails/IssueProject';
import { projectCreateSchema } from "@/validation/projects";

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
          } = validatedFields.data;

          console.log("Attempting to insert into 'projects' table...");
          const { data: project, error: projectError } = await supabase
          .from("projects")
          .insert({
              type,
              customerId,
              currency,
              name,
              description,
              startDate,
              endDate,
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
              createdBy: user.id,
              updatedOn: new Date().toISOString(),
              isArchived: false,
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
            const { data: profile } = await supabase
                .from('profiles')
                .select('email')
                .eq('profile_id', user.id)
                .single();

            // The 'organization' table is queried for branding details.
            const { data: organization } = await supabase
                .from('organization')
                .select('name, email, logoUrl')
                .eq('createdBy', user.id)
                .maybeSingle();

            const fromEmail =  'no_reply@projects.bexforte.com';
            
            let fromName = 'Bexforte Projects';
            if (organization?.name) {
                fromName = organization?.name;
            } else if (profile?.email) {
                fromName = profile.email.split('@')[0];
            }

            const logoUrl = organization?.logoUrl || "https://www.bexoni.com/favicon.ico";
            
            const emailHtml = await render(IssueProject({
                projectId: project.id,
                clientName: customer.name || "",
                projectName: project.name,
                senderName: fromName,
                logoUrl: logoUrl,
            }));

            console.log(`Attempting to send project email from: ${fromEmail} to: ${customer.email}`);

            try {
              await sendgrid.send({
                  to: customer.email,
                  from: {
                      email: fromEmail,
                      name: fromName
                  },
                  subject: `Project ${project.name} Initiated`,
                  html: emailHtml,
                  customArgs: {
                      projectId: project.id,
                      customerId: customerId,
                      userId: user.id,
                      type: "project_sent",
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
