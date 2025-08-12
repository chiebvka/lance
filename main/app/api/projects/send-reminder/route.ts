import { NextResponse } from "next/server"
import { createClient } from "@/utils/supabase/server"
import { render } from "@react-email/components"
import sendgrid from "@sendgrid/mail"
import ProjectReminder from "@/emails/ProjectReminder"
import { baseUrl } from "@/utils/universal"

sendgrid.setApiKey(process.env.SENDGRID_API_KEY || "")

export async function POST(request: Request) {
  const supabase = await createClient()

  try {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 })
    }

    const { projectId } = await request.json()
    if (!projectId) {
      return NextResponse.json({ success: false, error: "projectId is required" }, { status: 400 })
    }

    // Fetch project with relations
    const { data: project, error: projectError } = await supabase
      .from('projects')
      .select(`
        id,
        name,
        state,
        status,
        type,
        token,
        customerId,
        organizationId,
        customer:customerId (name, email),
        organization:organizationId (name, email, logoUrl)
      `)
      .eq('id', projectId)
      .eq('createdBy', user.id)
      .single()

    if (projectError || !project) {
      return NextResponse.json({ success: false, error: "Project not found" }, { status: 404 })
    }

    // Validate conditions
    const isPublished = (project.state || '').toLowerCase() === 'published'
    const isCustomer = (project.type || '').toLowerCase() === 'customer'
    const status = (project.status || '').toLowerCase()
    const canSendStatuses = ['pending', 'inprogress', 'overdue']
    const canSend = isPublished && isCustomer && canSendStatuses.includes(status)

    if (!canSend) {
      return NextResponse.json({ success: false, error: "Reminders can only be sent for published customer projects with status pending, inProgress or overdue" }, { status: 400 })
    }

    const customerRel: any = (project as any).customer?.[0] || (project as any).customer || null
    const customerEmail: string | undefined = customerRel?.email || undefined
    const customerName: string | undefined = customerRel?.name || undefined
    if (!customerEmail) {
      return NextResponse.json({ success: false, error: "Project has no customer email" }, { status: 400 })
    }

    const organizationRel: any = (project as any).organization?.[0] || (project as any).organization || null
    const orgName = organizationRel?.name || 'Bexforte Projects'
    const logoUrl = organizationRel?.logoUrl || 'https://www.bexoni.com/favicon.ico'
    const fromEmail = 'no_reply@projects.bexforte.com'

    const projectLink = project.token
      ? `${baseUrl}/p/${project.id}?token=${project.token}`
      : `${baseUrl}/p/${project.id}`

    const emailHtml = await render(ProjectReminder({
      senderName: orgName,
      clientName: customerName || '',
      projectName: project.name || 'Project',
      projectId: project.id,
      logoUrl,
      projectLink,
    }))

    await sendgrid.send({
      to: customerEmail,
      from: { email: fromEmail, name: orgName },
      subject: `Reminder: ${project.name}`,
      html: emailHtml,
      customArgs: {
        projectId: project.id,
        customerId: project.customerId,
        userId: user.id,
        type: 'project_reminder',
      },
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Project reminder error:', error)
    return NextResponse.json({ success: false, error: 'Failed to send reminder' }, { status: 500 })
  }
}


