/**
 * Утилита для отправки сообщений в WhatsApp
 * 
 * Можно использовать:
 * 1. WhatsApp Business API (официальный)
 * 2. Twilio WhatsApp API
 * 3. Другие сервисы (Green API, etc.)
 */

interface OrderItem {
  name: string;
  quantity: number;
  price: number;
}

interface OrderData {
  id: number;
  order_type: 'DINE_IN' | 'DELIVERY';
  total_amount: number;
  customer_phone?: string;
  delivery_address?: string;
  table_number?: string;
  items: OrderItem[];
}

/**
 * Отправляет сообщение в WhatsApp
 * 
 * @param phone - Номер телефона получателя (формат: 77001234567)
 * @param message - Текст сообщения
 * @returns Promise<boolean> - true если успешно отправлено
 */
export async function sendWhatsAppMessage(phone: string, message: string): Promise<boolean> {
  try {
    // Форматируем номер (убираем + и пробелы)
    const cleanPhone = phone.replace(/[+\s-()]/g, '');
    
    // Для разработки - просто логируем
    // В продакшене здесь должен быть вызов реального API
    if (process.env.NODE_ENV === 'development') {
      console.log('\n📱 ========== WHATSAPP MESSAGE (DEV MODE) ==========');
      console.log(`To: ${cleanPhone}`);
      console.log(`Message:\n${message}`);
      console.log('===============================================\n');
      
      // В разработке просто возвращаем успех
      return true;
    }

    // Пример использования с Twilio (раскомментировать и настроить)
    /*
    const accountSid = process.env.TWILIO_ACCOUNT_SID;
    const authToken = process.env.TWILIO_AUTH_TOKEN;
    const fromNumber = process.env.TWILIO_WHATSAPP_FROM; // например: whatsapp:+14155238886
    
    if (!accountSid || !authToken || !fromNumber) {
      console.error('Twilio credentials not configured');
      return false;
    }

    const client = require('twilio')(accountSid, authToken);
    
    await client.messages.create({
      from: fromNumber,
      to: `whatsapp:+${cleanPhone}`,
      body: message
    });
    */

    // Пример с Green API (популярный в СНГ)
    /*
    const greenApiId = process.env.GREEN_API_ID;
    const greenApiToken = process.env.GREEN_API_TOKEN;
    
    if (!greenApiId || !greenApiToken) {
      console.error('Green API credentials not configured');
      return false;
    }

    const response = await fetch(`https://api.green-api.com/waInstance${greenApiId}/sendMessage/${greenApiToken}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        chatId: `${cleanPhone}@c.us`,
        message: message
      })
    });

    if (!response.ok) {
      throw new Error(`Green API error: ${response.statusText}`);
    }
    */

    // Если API не настроен, возвращаем false
    console.warn('⚠️  WhatsApp API not configured. Message not sent. Configure TWILIO or GREEN_API credentials.');
    return false;

  } catch (error: any) {
    console.error('❌ Error sending WhatsApp message:', error);
    return false;
  }
}

/**
 * Форматирует заказ для отправки в WhatsApp
 */
export function formatOrderForWhatsApp(order: OrderData): string {
  const orderTypeText = order.order_type === 'DELIVERY' ? '🚚 ДОСТАВКА' : '🍽️ В РЕСТОРАНЕ';
  const createdAt = new Date().toLocaleString('ru-RU', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
  
  let message = `📦 *НОВЫЙ ЗАКАЗ #${order.id}*\n\n`;
  message += `${orderTypeText}\n`;
  message += `💰 Сумма: ${parseFloat(order.total_amount.toString()).toLocaleString('ru-RU')} ₸\n`;
  message += `🕐 ${createdAt}\n\n`;
  
  if (order.order_type === 'DELIVERY') {
    if (order.customer_phone) {
      message += `📞 Телефон: ${order.customer_phone}\n`;
    }
    if (order.delivery_address) {
      message += `📍 Адрес: ${order.delivery_address}\n\n`;
    }
  } else if (order.table_number) {
    message += `🍽️ Столик: №${order.table_number}\n\n`;
  }
  
  message += `*Состав заказа:*\n`;
  order.items.forEach((item, index) => {
    const itemTotal = parseFloat(item.price.toString()) * item.quantity;
    message += `${index + 1}. ${item.name} x${item.quantity} = ${itemTotal.toLocaleString('ru-RU')} ₸\n`;
  });
  
  message += `\n💵 *Итого: ${parseFloat(order.total_amount.toString()).toLocaleString('ru-RU')} ₸*`;
  
  return message;
}

