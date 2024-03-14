# Simple Slack Standup

The simplest possible async standup tool. It's a Slack bot that asks your team members what they did yesterday, what they're doing today, and if they have any blockers. It then posts the responses to a channel.

## Bot settings

- Be an admin of the Slack workspace
- Sign up for the Slack Developer Program https://api.slack.com/developer-program
- Find this app https://api.slack.com/apps

## Deploying

This is hosted on Fly.io so you'll need to install the flyctl CLI tool. Sign into our Fly.io account and then run the following command to deploy:

```sh
flyctl deploy
```
