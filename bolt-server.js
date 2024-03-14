require("dotenv").config();
const cron = require("node-cron");
const { App } = require("@slack/bolt");

const app = new App({
  token: process.env.SLACK_BOT_TOKEN,
  signingSecret: process.env.SLACK_SIGNING_SECRET,
  socketMode: true,
  appToken: process.env.SLACK_APP_TOKEN,
});

async function openStandupForm(trigger_id, client) {
  try {
    await client.views.open({
      trigger_id,
      view: {
        type: "modal",
        callback_id: "user_form",
        title: {
          type: "plain_text",
          text: "Daily Update Form",
        },
        submit: {
          type: "plain_text",
          text: "Submit",
        },
        blocks: [
          {
            type: "input",
            block_id: "yesterday_work",
            element: {
              type: "plain_text_input",
              action_id: "yesterday_input",
              multiline: true,
            },
            label: {
              type: "plain_text",
              text: "What did you work on yesterday?",
            },
          },
          {
            type: "input",
            block_id: "todays_work",
            element: {
              type: "plain_text_input",
              action_id: "todays_input",
              multiline: true,
            },
            label: {
              type: "plain_text",
              text: "What are you working on today?",
            },
          },
          {
            optional: true,
            type: "input",
            block_id: "any_blockers",
            element: {
              type: "plain_text_input",
              action_id: "any_blockers_input",
              multiline: true,
            },
            label: {
              type: "plain_text",
              text: "Any blockers?",
            },
          },
        ],
      },
    });
  } catch (error) {
    console.error("Error opening modal:", error);
  }
}

async function sendMessageToAllUsers(client) {
  try {
    const result = await client.users.list();
    const users = result.members;

    users.forEach(async (user) => {
      if (!user.is_bot && user.name === "csimmonswork") {
        await client.chat.postMessage({
          channel: user.id,
          text: "Click the button to open the standup form", // Required fallback text
          blocks: [
            {
              type: "actions",
              elements: [
                {
                  type: "button",
                  text: {
                    type: "plain_text",
                    text: "Friendly standup reminder",
                  },
                  action_id: "open_standup_form",
                },
              ],
            },
          ],
        });

      }
    });
  } catch (error) {
    console.error("Error sending messages:", error);
  }
}

// Schedule the task to run M-F at 9 AM
cron.schedule("0 9 * * 1-5", () => {
  console.log("Sending standup reminder messages to all users at 9 AM M-F");
  sendMessageToAllUsers(app.client);
});

// Enable Slash-command
app.command("/standup", async ({ ack, body, client }) => {
  await ack();
  await openStandupForm(body.trigger_id, client);
});

// Handling button click to open the standup form
app.action("open_standup_form", async ({ ack, body, client }) => {
  await ack();
  await openStandupForm(body.trigger_id, client);
});

app.view("user_form", async ({ ack, body, view, client }) => {
  await ack();

  try {
    const userId = body.user.id;
    const userInfo = await client.users.info({ user: userId });
    const userName = userInfo.user.real_name;
    const userImage = userInfo.user.profile.image_24;
    const values = view.state.values;
    const yesterdayWork = values.yesterday_work.yesterday_input.value;
    const todaysWork = values.todays_work.todays_input.value;
    const anyBlockers = values.any_blockers.any_blockers_input.value;

    let fields = [
      {
        type: "mrkdwn",
        text: `*Yesterday*\n${yesterdayWork}`,
      },
      {
        type: "mrkdwn",
        text: `*Today*\n${todaysWork}`,
      },
    ];

    if (anyBlockers && anyBlockers.trim() !== "") {
      fields.push({
        type: "mrkdwn",
        text: `*Blockers*\n${anyBlockers}`,
      });
    }

    const reportingMessages = [
      "*{userName}* reporting for duty! 🫡",
      "*{userName}* is here and ready to rock! 🎸",
      "*{userName}* has entered the game! 🕹️",
      "*{userName}* is on deck! 🛳️",
      "*{userName}* is ready to get this party started! 🪩",
      "*{userName}* is ready for action! 💪",
    ];

    const randomMessage = reportingMessages[
      Math.floor(Math.random() * reportingMessages.length)
    ].replace("{userName}", userName);

    await client.chat.postMessage({
      channel: "#standup",
      blocks: [
        {
          type: "divider",
        },
        {
          type: "context",
          elements: [
            {
              type: "image",
              image_url: userImage,
              alt_text: "user avatar",
            },
            {
              type: "mrkdwn",
              text: randomMessage,
            },
          ],
        },
        {
          type: "section",
          fields,
        },
      ],
    });

    console.log("Posted higher resolution avatar in message to channel");
  } catch (error) {
    console.error(
      "Error sending message with higher resolution avatar to channel:",
      error
    );
  }
});

(async () => {
  // Only need to do this once, then we can comment this out.
  // const channelId = "C06PAP95WRK"; // Use the channel's ID you can copy from channel details, not its name (#standup)

  // try {
  //   // Attempt to join the channel (optional step, depending on your needs)
  //   await app.client.conversations.join({
  //     token: process.env.SLACK_BOT_TOKEN,
  //     channel: channelId,
  //   });

  //   // Invite the bot to the channel
  //   await app.client.conversations.invite({
  //     token: process.env.SLACK_BOT_TOKEN,
  //     channel: channelId,
  //     users: "YOUR_BOT_USER_ID", // Find your bot's user ID in your app configuration
  //   });

  //   console.log("Bot added to the channel successfully.");
  // } catch (error) {
  //   console.error("Failed to add the bot to the channel:", error);
  // }

  const PORT = process.env.PORT || 3000;
  await app.start(PORT);

  console.log(`⚡️ Bolt app is running on ${PORT}`);
})();
