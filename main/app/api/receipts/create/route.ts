await sendgrid.send({
    to: customer.email,
    from: { email: fromEmail, name: fromName },
    subject: `Receipt ${receipt.receiptNumber}`,
    html: emailHtml,
    customArgs: {
        receiptId: receipt.id,      // Instead of projectId
        customerId: customerId,
        userId: user.id,
        type: "receipt_sent",       // Instead of "project_sent"
    },
}); 