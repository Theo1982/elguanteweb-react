const axios = require('axios');

class WhatsAppService {
  constructor() {
    this.apiUrl = 'https://api.twilio.com/2010-04-01/Accounts';
    this.accountSid = process.env.TWILIO_ACCOUNT_SID;
    this.authToken = process.env.TWILIO_AUTH_TOKEN;
    this.fromNumber = process.env.TWILIO_FROM_NUMBER;
  }

  async sendMessage(to, message) {
    try {
      if (!this.accountSid || !this.authToken || !this.fromNumber) {
        console.warn('Twilio credentials not configured, skipping WhatsApp message');
        return { success: false, error: 'Twilio not configured' };
      }

      const url = `${this.apiUrl}/${this.accountSid}/Messages.json`;
      const auth = Buffer.from(`${this.accountSid}:${this.authToken}`).toString('base64');

      const response = await axios.post(url, {
        To: `whatsapp:${to}`,
        From: `whatsapp:${this.fromNumber}`,
        Body: message
      }, {
        headers: {
          'Authorization': `Basic ${auth}`,
          'Content-Type': 'application/x-www-form-urlencoded'
        }
      });

      return {
        success: true,
        messageId: response.data.sid,
        status: response.data.status
      };
    } catch (error) {
      console.error('Error sending WhatsApp message:', error.response?.data || error.message);
      return {
        success: false,
        error: error.response?.data?.message || error.message
      };
    }
  }

  async sendOrderNotification(orderData) {
    const message = `🛒 *Nueva Orden Pendiente*

👤 *Cliente:* ${orderData.userName}
📱 *Celular:* ${orderData.phoneNumber}
💰 *Total:* $${orderData.total}

📦 *Productos:*
${orderData.items.map(item =>
  `• ${item.nombre} x${item.quantity} = $${item.precio * item.quantity}`
).join('\n')}

💳 *Método:* ${orderData.paymentMethod}
🏦 *Alias:* elguante.mp

✅ *Confirmar recepción del pago:*
${process.env.FRONTEND_URL || 'http://localhost:5173'}/admin/confirm-payment/${orderData.id}

⚠️ Una vez confirmado, la orden se marcará como pagada.`;

    return await this.sendMessage('5492214760630', message); // Admin number
  }

  async sendPaymentConfirmation(userPhone, orderData) {
    const message = `✅ *Pago Confirmado*

¡Hola! Tu pago por $${orderData.total} ha sido confirmado exitosamente.

📦 Tu orden está siendo preparada y será enviada pronto.

📱 Si tienes alguna duda, puedes contactarnos.

¡Gracias por tu compra! 🛒`;

    return await this.sendMessage(userPhone, message);
  }
}

module.exports = new WhatsAppService();
