const sendgrid = require('@sendgrid/mail');
require('dotenv').config({ path: '.env.local' });

// Set your SendGrid API key
sendgrid.setApiKey(process.env.SENDGRID_API_KEY || "");

async function testSendGrid() {
  try {
    console.log('Testing SendGrid connection...');
    console.log('API Key:', process.env.SENDGRID_API_KEY ? 'Set' : 'Missing');
    
    const msg = {
      to: 'vebuzor@yahoo.com.com', // Replace with your email
      from: 'no_reply@projects.bexforte.com',
      subject: 'SendGrid Test Email',
      text: 'This is a test email from SendGrid',
      html: '<p>This is a test email from SendGrid</p>',
    };

    const response = await sendgrid.send(msg);
    console.log('Email sent successfully!');
    console.log('Response:', response[0].statusCode);
  } catch (error) {
    console.error('SendGrid Error:', error);
    if (error.response) {
      console.error('Error body:', error.response.body);
    }
  }
}

testSendGrid();


