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
    
    console.log('\n📱 ========== WHATSAPP MESSAGE ==========');
    console.log(`To: ${cleanPhone}`);
    console.log(`Message:\n${message}`);
    
    // ПРИОРИТЕТ 1: Пробуем Green API (популярный в СНГ) - БЕСПЛАТНЫЙ для тестирования
    const greenApiId = process.env.GREEN_API_ID;
    const greenApiToken = process.env.GREEN_API_TOKEN;
    
    if (greenApiId && greenApiToken) {
      try {
        console.log('📱 Пытаюсь отправить через Green API...');
        const response = await fetch(`https://api.green-api.com/waInstance${greenApiId}/sendMessage/${greenApiToken}`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            chatId: `${cleanPhone}@c.us`,
            message: message
          })
        });

        const responseData = await response.json();
        
        if (response.ok && responseData.idMessage) {
          console.log('✅ WhatsApp сообщение отправлено через Green API!');
          console.log(`   ID сообщения: ${responseData.idMessage}`);
          console.log('===============================================\n');
          return true;
        } else {
          console.error('❌ Green API ошибка:', response.status, responseData);
        }
      } catch (error: any) {
        console.error('❌ Green API запрос не удался:', error.message);
      }
    }

    // ПРИОРИТЕТ 2: Пробуем Twilio WhatsApp API если настроен
    const twilioAccountSid = process.env.TWILIO_ACCOUNT_SID;
    const twilioAuthToken = process.env.TWILIO_AUTH_TOKEN;
    const twilioWhatsAppFrom = process.env.TWILIO_WHATSAPP_FROM;
    
    if (twilioAccountSid && twilioAuthToken && twilioWhatsAppFrom) {
      try {
        console.log('📱 Пытаюсь отправить через Twilio...');
        const twilio = require('twilio');
        const client = twilio(twilioAccountSid, twilioAuthToken);
        
        const result = await client.messages.create({
          from: twilioWhatsAppFrom,
          to: `whatsapp:+${cleanPhone}`,
          body: message
        });
        
        console.log('✅ WhatsApp сообщение отправлено через Twilio!');
        console.log(`   SID: ${result.sid}`);
        console.log('===============================================\n');
        return true;
      } catch (error: any) {
        console.error('❌ Twilio ошибка:', error.message);
      }
    }

    // Если ничего не настроено - показываем инструкцию
    console.warn('\n⚠️  WhatsApp API НЕ НАСТРОЕН!');
    console.warn('📱 Сообщение НЕ будет отправлено автоматически.');
    console.warn('\n🔧 БЫСТРАЯ НАСТРОЙКА (5 минут):');
    console.warn('   1. Зайди на https://green-api.com');
    console.warn('   2. Зарегистрируйся (бесплатно)');
    console.warn('   3. Получи idInstance и apiTokenInstance');
    console.warn('   4. Добавь в nodejs/.env:');
    console.warn('      GREEN_API_ID=твой_id');
    console.warn('      GREEN_API_TOKEN=твой_token');
    console.warn('   5. Перезапусти backend');
    console.warn('\n🔗 Ссылка для ручной отправки (временно):');
    const encodedMessage = encodeURIComponent(message);
    const whatsappUrl = `https://wa.me/${cleanPhone}?text=${encodedMessage}`;
    console.warn(`   ${whatsappUrl}`);
    console.warn('===============================================\n');
    
    return false;

  } catch (error: any) {
    console.error('❌ Ошибка отправки WhatsApp сообщения:', error);
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

