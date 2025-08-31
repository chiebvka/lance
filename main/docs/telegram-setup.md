# Telegram Notifications Setup

This application now includes Telegram notifications for key business events. Here's how to set it up:

## 1. Create a Telegram Bot

1. Message [@BotFather](https://t.me/botfather) on Telegram
2. Send `/newbot` command
3. Follow the prompts to create your bot
4. Save the bot token (you'll need this later)

## 2. Get Your Chat ID

### Option A: Using @userinfobot
1. Message [@userinfobot](https://t.me/userinfobot)
2. It will reply with your user ID
3. Use this ID as your chat ID

### Option B: Using @RawDataBot
1. Message [@RawDataBot](https://t.me/RawDataBot)
2. It will show you detailed information including your chat ID

### Option C: For Group/Channel Notifications
1. Add your bot to a group or channel
2. Send a message in the group/channel
3. Visit: `https://api.telegram.org/bot<YOUR_BOT_TOKEN>/getUpdates`
4. Look for the `chat` object and find the `id` field

## 3. Configure Environment Variables

Add these to your `.env.local` file:

```bash
TELEGRAM_BOT_TOKEN=your_bot_token_here
TELEGRAM_CHAT_ID=your_chat_id_here
```

## 4. Test the Setup

You can test if your bot is working by visiting:
```
https://api.telegram.org/bot<YOUR_BOT_TOKEN>/sendMessage?chat_id=<YOUR_CHAT_ID>&text=Hello%20World
```

## 5. Events That Trigger Notifications

### 🚀 Trial Started
- **When**: New user signs up and creates an organization
- **Data**: Organization name, user email, country, currency, trial end date

### ✅ Subscription Started
- **When**: User completes checkout and starts a paid subscription
- **Data**: Organization name, user email, plan type, billing cycle, amount, currency

### 🔄 Subscription Updated
- **When**: User changes their plan or billing cycle
- **Data**: Organization name, user email, new plan details

### ❌ Subscription Cancelled
- **When**: User cancels their subscription
- **Data**: Organization name, user email, plan type, cancellation reason, end date
- **Additional**: Automatically inserts cancellation data into the `cancellations` table

## 6. Message Format

All messages use HTML formatting and include emojis for better readability:

- 🚀 New trials
- ✅ New subscriptions
- 🔄 Subscription updates
- ❌ Subscription cancellations

## 7. Troubleshooting

### Bot Not Responding
- Check if the bot token is correct
- Verify the chat ID is correct
- Ensure the bot hasn't been blocked

### Messages Not Sending
- Check the browser console for errors
- Verify environment variables are loaded
- Check if the bot has permission to send messages

### Rate Limiting
- Telegram has rate limits (30 messages per second)
- If you expect high volume, consider implementing message queuing

## 8. Security Notes

- Keep your bot token secret
- Don't commit `.env.local` to version control
- Consider using environment-specific bot tokens for staging/production
- The bot can only send messages to chats it's been added to

## 9. Customization

You can modify the message formats by editing the `TelegramService` class in `utils/telegram.ts`. The service includes helper methods for each notification type:

- `notifyTrialStarted()`
- `notifySubscription()`
- `notifyCancellation()`

Each method accepts a data object and formats the message appropriately.

