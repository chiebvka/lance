const postmark = require("postmark");

// Send an email:
var client = new postmark.ServerClient("f6cc8d80-2ff5-470f-81a5-3c1686235ff1");

client.sendEmail({
  "From": "no_reply@auth.deluccis.com",
  "To": "juniorbubu007@gmail.com",
  "Subject": "Hello from Postmark",
  "HtmlBody": "<strong>Hello</strong> dear Postmark user.",
  "TextBody": "Hello from Postmark!",
  "MessageStream": "outbound"
});