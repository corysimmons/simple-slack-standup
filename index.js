require("dotenv").config();
const { WebClient } = require("@slack/web-api");

const web = new WebClient(process.env.SLACK_TOKEN);

const sendMessageToAllUsers = async () => {
  try {
    // Get the list of users
    const { members } = await web.users.list();

    for (const member of members) {
      // Skip bots and restricted users
      if (member.is_bot || member.is_restricted || !member.id) continue;

      // Send a DM to each user
      await web.chat.postMessage({
        channel: member.id,
        text: "Hello! This is a message from your friendly neighborhood bot.", // Customize your message
      });

      console.log(`Message sent to ${member.name}`);
    }
  } catch (error) {
    console.error(error);
  }
};

sendMessageToAllUsers();
