import AWS from "aws-sdk";
import twilio from "twilio";

// Twilio credentials
const accountSid = "abc123"; // Replace with your Twilio Account SID
const authToken = "wzx987"; // Replace with your Twilio Auth Token

// Initialize Twilio client
const client = twilio(accountSid, authToken);

// Lambda handler function
export const handler = async (event) => {
  try {
    // Parse the event body (if necessary)
    const body = event.isBase64Encoded
      ? Buffer.from(event.body, "base64").toString("utf-8")
      : event.body;

    const parsedBody = JSON.parse(body);

    const recipientNumber = parsedBody.to; // e.g., "whatsapp:+573502398814"
    const contentSid = parsedBody.contentSid; // e.g., "HX38d52fd198eb54f6baf09076cbf96643"
    const contentVariables = parsedBody.contentVariables || {};

    if (!recipientNumber || !contentSid) {
      return {
        statusCode: 400,
        body: JSON.stringify({
          message: "Recipient number and content SID are required.",
        }),
      };
    }

    // Send the message via Twilio
    const message = await client.messages.create({
      from: "whatsapp:+14123456", // Twilio WhatsApp sandbox or approved number
      to: recipientNumber,
      contentSid: contentSid,
      contentVariables: JSON.stringify(contentVariables),
    });

    console.log("Message sent successfully:", message.sid);

    return {
      statusCode: 200,
      body: JSON.stringify({
        message: "Message sent successfully.",
        messageId: message.sid,
      }),
    };
  } catch (error) {
    console.error("Error sending message:", error);

    return {
      statusCode: 500,
      body: JSON.stringify({
        message: "Internal Server Error.",
        error: error.message,
      }),
    };
  }
};
