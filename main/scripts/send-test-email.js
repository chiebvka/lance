const postmark = require("postmark");

// Send an email:
var client = new postmark.ServerClient("5c7f9b86-66f8-43e5-a760-23dac1686212");

client.sendEmail({
  "From": "ebuka@ebuzor.com",
  "To": "ebuka@ebuzor.com",
  "Subject": "Hello from Postmark",
  "HtmlBody": "<strong>Hello</strong> dear Postmark user.",
  "TextBody": "Hello from Postmark!",
  "MessageStream": "outbound"
});