await sendgrid.send({
    to: customer.email,
    from: { email: fromEmail, name: fromName },
    subject: `Feedback Request for Project ${project.name}`,
    html: emailHtml,
    customArgs: {
        feedbackId: feedback.id,    // Or projectId if feedback is linked to project
        customerId: customerId,
        userId: user.id,
        type: "feedback_sent",      // Instead of "project_sent"
    },
}); 