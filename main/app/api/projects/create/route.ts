import { createClient } from "@/utils/supabase/server";
import projectCreateSchema from "@/validation/projects";
import { NextResponse } from "next/server";
import { render } from "@react-email/components";
import sendgrid from "@sendgrid/mail";
import IssueProject from '../../../../emails/IssueProject';


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
            status: requestedStatus,
            signedStatus,
            state,
            emailToCustomer = false,
          } = validatedFields.data;

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

    // Insert deliverables if enabled
    if (deliverablesEnabled && deliverables && deliverables.length > 0) {
        const { error: deliverablesError } = await supabase
          .from("deliverables")
          .insert(
            deliverables.map((d) => ({
              projectId: project?.id,
              name: d.name,
              description: d.description,
              dueDate: d.dueDate || null, // Supabase handles Date to date conversion
              status: d.status || "pending",
              position: d.position,
              isPublished: d.isPublished || false,
              lastSaved: d.lastSaved || null,
              createdBy: user.id,
            }))
          );
        if (deliverablesError) {
            console.error("Supabase Deliverables Insert Error:", deliverablesError);
            // Ideally, you might want to roll back the project creation here
            return NextResponse.json({ success: false, error: deliverablesError.message }, { status: 500 });
        }
      }

      // Insert payment terms based on paymentStructure
    if (paymentStructure === "milestonePayment" || paymentStructure === "deliverablePayment") {
        // Process paymentMilestones only for milestonePayment or deliverablePayment
        if (paymentMilestones && paymentMilestones.length > 0) {
          const { error: paymentTermsError } = await supabase
            .from("paymentTerms")
            .insert(
              paymentMilestones.map((m) => ({
                projectId : project?.id,
                deliverableId: m.deliverableId || null,
                name: m.name,
                description: m.description,
                amount: m.amount || null,
                percentage: m.percentage || null,
                dueDate: m.dueDate || null,
                status: m.status || "Pending",
                type: m.type,
                hasPaymentTerms: m.hasPaymentTerms || false,
                createdBy: user.id,
              }))
            );
          if (paymentTermsError) {
            console.error("Supabase Payment Terms Insert Error:", paymentTermsError);
            return NextResponse.json({ success: false, error: paymentTermsError.message }, { status: 500 });
          }
        }
      } else if (paymentStructure === "fullDownPayment" || paymentStructure === "paymentOnCompletion") {
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
            return NextResponse.json({ success: false, error: paymentTermsError.message }, { status: 500 });
        }
      }
      // noPaymentOption is implicitly handled by doing nothing
  
      // Prepare response data
      const responseData = {
        ...project,
        deliverables: deliverables || [],
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

            const fromEmail = organization?.email || profile?.email || 'noreply@projects.bexfortes.com';
            
            let fromName = 'Bexforte Projects';
            if (organization?.name) {
                fromName = organization.name;
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

            await sendgrid.send({
                to: customer.email,
                from: {
                    email: fromEmail,
                    name: fromName
                },
                subject: `Project ${project.name} Initiated`,
                html: emailHtml,
            });

            console.log("Email sent to:", customer.email);
          }
        }

            return NextResponse.json({ success: true, data: project }, { status: 200 });

    } catch (error) {
        console.error("Error during project creation:", error);
        return NextResponse.json({ success: false, error: "Failed to create project" }, { status: 500 });
    }
}