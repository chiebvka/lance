interface TelegramMessage {
  text: string;
  parse_mode?: 'HTML' | 'Markdown';
  disable_web_page_preview?: boolean;
}

export class TelegramService {
  private botToken: string;
  private chatId: string;
  private baseUrl: string;

  constructor() {
    this.botToken = process.env.TELEGRAM_BOT_TOKEN!;
    this.chatId = process.env.TELEGRAM_CHAT_ID!;
    this.baseUrl = `https://api.telegram.org/bot${this.botToken}`;
  }

  async sendMessage(message: TelegramMessage): Promise<boolean> {
    try {
      if (!this.botToken || !this.chatId) {
        console.warn('Telegram credentials not configured');
        return false;
      }

      const response = await fetch(`${this.baseUrl}/sendMessage`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          chat_id: this.chatId,
          text: message.text,
          parse_mode: message.parse_mode || 'HTML',
          disable_web_page_preview: message.disable_web_page_preview || false,
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        console.error('Telegram API error:', error);
        return false;
      }

      return true;
    } catch (error) {
      console.error('Error sending Telegram message:', error);
      return false;
    }
  }

  // Helper method for trial started notifications
  async notifyTrialStarted(data: {
    organizationName: string;
    userEmail: string;
    country: string;
    baseCurrency: string;
    trialEndDate: string;
  }): Promise<boolean> {
    const message = `
🚀 <b>New Trial Started!</b>

🏢 <b>Organization:</b> ${data.organizationName}
📧 <b>User Email:</b> ${data.userEmail}
🌍 <b>Country:</b> ${data.country}
💰 <b>Currency:</b> ${data.baseCurrency}
⏰ <b>Trial Ends:</b> ${new Date(data.trialEndDate).toLocaleDateString()}
    `.trim();

    return this.sendMessage({ text: message });
  }

  // Helper method for subscription notifications
  async notifySubscription(data: {
    organizationName: string;
    userEmail: string;
    planType: string;
    billingCycle: string;
    amount: number;
    currency: string;
    action: 'started' | 'updated' | 'cancelled';
  }): Promise<boolean> {
    const emoji = data.action === 'started' ? '✅' : 
                  data.action === 'updated' ? '🔄' : '❌';
    
    const message = `
${emoji} <b>Subscription ${data.action.charAt(0).toUpperCase() + data.action.slice(1)}</b>

🏢 <b>Organization:</b> ${data.organizationName}
📧 <b>User Email:</b> ${data.userEmail}
📋 <b>Plan:</b> ${data.planType} (${data.billingCycle})
💰 <b>Amount:</b> ${data.amount} ${data.currency.toUpperCase()}
    `.trim();

    return this.sendMessage({ text: message });
  }

  // Helper method for cancellation notifications
  async notifyCancellation(data: {
    organizationName: string;
    userEmail: string;
    planType: string;
    reason?: string;
    comment?: string;
    endDate: string;
  }): Promise<boolean> {
    const message = `
❌ <b>Subscription Cancelled</b>

🏢 <b>Organization:</b> ${data.organizationName}
📧 <b>User Email:</b> ${data.userEmail}
📋 <b>Plan:</b> ${data.planType}
📅 <b>End Date:</b> ${new Date(data.endDate).toLocaleDateString()}
${data.reason ? `📝 <b>Reason:</b> ${data.reason}` : ''}
${data.comment ? `💬 <b>Comment:</b> ${data.comment}` : ''}
    `.trim();

    return this.sendMessage({ text: message });
  }
}

// Export singleton instance
export const telegramService = new TelegramService();

