import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { menuApi } from '../api/menu';
import { ordersApi } from '../api/orders';
import { MenuCategory, MenuItem } from '../types';
import './ClientMenu.css';

interface CartItem {
  id: number;
  name: string;
  price: number;
  quantity: number;
}

const ClientMenu: React.FC = () => {
  const [searchParams] = useSearchParams();
  const restaurantId = parseInt(searchParams.get('restaurant_id') || '1');
  const tableId = parseInt(searchParams.get('table_id') || '1');

  const [loading, setLoading] = useState(true);
  const [menu, setMenu] = useState<Array<{ category: MenuCategory; items: MenuItem[] }>>([]);
  const [restaurantName, setRestaurantName] = useState('Загрузка...');
  const [cart, setCart] = useState<CartItem[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<number | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [showCartModal, setShowCartModal] = useState(false);
  const [placingOrder, setPlacingOrder] = useState(false);
  const [orderType, setOrderType] = useState<'DINE_IN' | 'DELIVERY'>('DINE_IN');
  const [showDeliveryModal, setShowDeliveryModal] = useState(false);
  const [deliveryData, setDeliveryData] = useState({
    address: '',
    phone: '',
  });

  useEffect(() => {
    if (restaurantId) {
      loadMenu();
    }
  }, [restaurantId]);

  const loadMenu = async () => {
    try {
      const res = await menuApi.get(restaurantId);
      if (res.success) {
        setMenu(res.menu);
        if (res.menu.length > 0) {
          setSelectedCategory(res.menu[0].category.id);
        }
        setRestaurantName('Демо Ресторан');
        setLoading(false);
      }
    } catch (error) {
      console.error('Error loading menu:', error);
      setLoading(false);
    }
  };

  const addToCart = (itemId: number, itemName: string, itemPrice: number) => {
    setCart((prev) => {
      const existingItem = prev.find((item) => item.id === itemId);
      if (existingItem) {
        return prev.map((item) =>
          item.id === itemId ? { ...item, quantity: item.quantity + 1 } : item
        );
      }
      return [...prev, { id: itemId, name: itemName, price: parseFloat(itemPrice.toString()), quantity: 1 }];
    });
  };

  const increaseQuantity = (index: number) => {
    setCart((prev) => {
      const newCart = [...prev];
      newCart[index].quantity++;
      return newCart;
    });
  };

  const decreaseQuantity = (index: number) => {
    setCart((prev) => {
      const newCart = [...prev];
      if (newCart[index].quantity > 1) {
        newCart[index].quantity--;
      } else {
        newCart.splice(index, 1);
      }
      return newCart;
    });
  };

  const removeFromCart = (index: number) => {
    setCart((prev) => {
      const newCart = [...prev];
      newCart.splice(index, 1);
      return newCart;
    });
  };

  const getCartTotal = () => {
    return cart.reduce((sum, item) => sum + item.price * item.quantity, 0);
  };

  const getFilteredItems = () => {
    if (!selectedCategory) return [];
    const section = menu.find((s) => s.category.id === selectedCategory);
    if (!section) return [];

    let filtered = section.items;
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(
        (item) =>
          item.name.toLowerCase().includes(query) ||
          (item.description && item.description.toLowerCase().includes(query))
      );
    }
    return filtered;
  };

  const handlePlaceOrder = async () => {
    if (cart.length === 0) return;

    // Если доставка, показываем модалку с адресом и телефоном
    if (orderType === 'DELIVERY') {
      setShowCartModal(false);
      setShowDeliveryModal(true);
      return;
    }

    // Для заказа в ресторане сразу оформляем
    await createOrder();
  };

  const createOrder = async () => {
    if (cart.length === 0) return;

    // Валидация для доставки
    if (orderType === 'DELIVERY') {
      if (!deliveryData.address.trim() || !deliveryData.phone.trim()) {
        alert('Пожалуйста, заполните адрес и телефон для доставки');
        return;
      }
    }

    setPlacingOrder(true);
    try {
      const orderData: any = {
        restaurant_id: restaurantId,
        order_type: orderType,
        items: cart.map((item) => ({
          menu_item_id: item.id,
          quantity: item.quantity,
        })),
      };

      // Добавляем данные в зависимости от типа заказа
      if (orderType === 'DINE_IN') {
        orderData.table_id = tableId;
      } else {
        orderData.customer_phone = deliveryData.phone;
        orderData.delivery_address = deliveryData.address;
      }

      const res = await ordersApi.create(orderData);

      if (res.success) {
        setCart([]);
        setShowCartModal(false);
        setShowDeliveryModal(false);
        setDeliveryData({ address: '', phone: '' });
        
        const message = orderType === 'DELIVERY'
          ? `Заказ №${res.order_id} успешно создан!\n\nСумма: ${parseFloat(res.total_amount.toString()).toLocaleString('ru-RU')} ₸\n\nЗаказ будет доставлен по адресу: ${deliveryData.address}`
          : `Заказ №${res.order_id} успешно создан!\n\nСумма: ${parseFloat(res.total_amount.toString()).toLocaleString('ru-RU')} ₸\n\nОфициант скоро подойдёт к вашему столику.`;
        
        alert(message);
      } else {
        alert('Ошибка: ' + res.message);
      }
    } catch (error: any) {
      alert('Ошибка: ' + (error.response?.data?.message || 'Не удалось создать заказ'));
    } finally {
      setPlacingOrder(false);
    }
  };

  if (loading) {
    return (
      <div className="client-menu">
        <div className="mobile-view">
          <div className="empty-state">Загрузка меню...</div>
        </div>
      </div>
    );
  }

  const filteredItems = getFilteredItems();

  return (
    <div className="client-menu">
      <div className="mobile-view">
        <div className="menu-header">
          <h1 className="restaurant-name">{restaurantName}</h1>
          
          {/* Переключатель типа заказа */}
          <div style={{ display: 'flex', gap: '10px', marginBottom: '15px', justifyContent: 'center' }}>
            <button
              className={`order-type-btn ${orderType === 'DINE_IN' ? 'active' : ''}`}
              onClick={() => {
                setOrderType('DINE_IN');
                setDeliveryData({ address: '', phone: '' });
              }}
              style={{
                padding: '8px 16px',
                borderRadius: '8px',
                border: '2px solid',
                borderColor: orderType === 'DINE_IN' ? 'var(--orange-primary)' : 'var(--border-color)',
                background: orderType === 'DINE_IN' ? 'var(--orange-primary)' : 'white',
                color: orderType === 'DINE_IN' ? 'white' : 'var(--text-dark)',
                fontWeight: 600,
                cursor: 'pointer',
                fontSize: '14px',
              }}
            >
              🍽️ В ресторане
            </button>
            <button
              className={`order-type-btn ${orderType === 'DELIVERY' ? 'active' : ''}`}
              onClick={() => setOrderType('DELIVERY')}
              style={{
                padding: '8px 16px',
                borderRadius: '8px',
                border: '2px solid',
                borderColor: orderType === 'DELIVERY' ? 'var(--orange-primary)' : 'var(--border-color)',
                background: orderType === 'DELIVERY' ? 'var(--orange-primary)' : 'white',
                color: orderType === 'DELIVERY' ? 'white' : 'var(--text-dark)',
                fontWeight: 600,
                cursor: 'pointer',
                fontSize: '14px',
              }}
            >
              🚚 Доставка
            </button>
          </div>

          {orderType === 'DINE_IN' && (
            <p className="table-info">Столик №{tableId}</p>
          )}
          {orderType === 'DELIVERY' && (
            <p style={{ textAlign: 'center', color: 'var(--text-secondary)', marginBottom: '10px' }}>
              📍 Заказ на доставку
            </p>
          )}

          <div className="search-bar">
            <span>🔍</span>
            <input
              type="text"
              placeholder="Поиск по меню"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
        </div>

        <nav className="category-nav">
          {menu.map((section) => (
            <button
              key={section.category.id}
              className={`category-btn ${selectedCategory === section.category.id ? 'active' : ''}`}
              onClick={() => setSelectedCategory(section.category.id)}
            >
              <span>{section.category.name}</span>
              <span className="category-counter">{section.items.length}</span>
            </button>
          ))}
        </nav>

        <div className="dishes-list">
          {filteredItems.length === 0 ? (
            <div className="empty-state">Блюда не найдены</div>
          ) : (
            filteredItems.map((item) => (
              <div key={item.id} className="dish-card">
                {item.image_url ? (
                  <img src={item.image_url} alt={item.name} className="dish-image" />
                ) : (
                  <div className="dish-image" style={{ backgroundColor: '#f0f0f0' }}></div>
                )}
                <div className="dish-content">
                  <h3 className="dish-name">{item.name}</h3>
                  {item.description && <p className="dish-description">{item.description}</p>}
                  <div className="dish-footer">
                    <span className="dish-price">
                      {parseFloat(item.price.toString()).toLocaleString('ru-RU')} ₸
                    </span>
                    <button
                      className="btn-add"
                      onClick={() => addToCart(item.id, item.name, item.price)}
                    >
                      Добавить
                    </button>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>

        <button
          className={`cart-button ${cart.length > 0 ? 'visible' : ''}`}
          onClick={() => setShowCartModal(true)}
        >
          🛒 Корзина • <span>{getCartTotal().toLocaleString('ru-RU')} ₸</span>
        </button>
      </div>

      {/* Модальное окно корзины */}
      {showCartModal && (
        <div
          className={`modal-overlay ${showCartModal ? 'visible' : ''}`}
          onClick={(e) => e.target === e.currentTarget && setShowCartModal(false)}
        >
          <div className="cart-modal">
            <div className="cart-header">
              <h2>Ваш заказ</h2>
              <button className="close-cart" onClick={() => setShowCartModal(false)}>
                ×
              </button>
            </div>
            <div>
              {cart.length === 0 ? (
                <p style={{ textAlign: 'center', color: 'var(--text-secondary)', padding: '40px' }}>
                  Корзина пуста
                </p>
              ) : (
                cart.map((item, index) => (
                  <div key={index} className="cart-item">
                    <div className="cart-item-info">
                      <div className="cart-item-name">{item.name}</div>
                      <div className="cart-item-price">
                        {parseFloat(item.price.toString()).toLocaleString('ru-RU')} ₸
                      </div>
                    </div>
                    <div className="cart-item-controls">
                      <div className="quantity-control">
                        <button onClick={() => decreaseQuantity(index)}>−</button>
                        <span className="quantity-value">{item.quantity}</span>
                        <button onClick={() => increaseQuantity(index)}>+</button>
                      </div>
                      <button className="remove-item" onClick={() => removeFromCart(index)}>
                        🗑️
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
            <div className="cart-total">
              <div className="cart-total-row">
                <span>Итого:</span>
                <span className="cart-total-price">{getCartTotal().toLocaleString('ru-RU')} ₸</span>
              </div>
            </div>
            <button
              className="order-button"
              onClick={handlePlaceOrder}
              disabled={placingOrder || cart.length === 0}
            >
              {placingOrder ? 'Оформляем...' : 'Оформить заказ'}
            </button>
          </div>
        </div>
      )}

      {/* Модальное окно для доставки */}
      {showDeliveryModal && (
        <div
          className={`modal-overlay visible`}
          onClick={(e) => e.target === e.currentTarget && setShowDeliveryModal(false)}
        >
          <div className="cart-modal" style={{ maxWidth: '500px' }}>
            <div className="cart-header">
              <h2>Данные для доставки</h2>
              <button className="close-cart" onClick={() => setShowDeliveryModal(false)}>
                ×
              </button>
            </div>
            <div style={{ padding: '20px' }}>
              <div style={{ marginBottom: '20px' }}>
                <label style={{ display: 'block', marginBottom: '8px', fontWeight: 600, fontSize: '14px' }}>
                  📞 Номер телефона *
                </label>
                <input
                  type="tel"
                  placeholder="+7 777 123-45-67"
                  value={deliveryData.phone}
                  onChange={(e) => setDeliveryData({ ...deliveryData, phone: e.target.value })}
                  style={{
                    width: '100%',
                    padding: '12px',
                    border: '1px solid var(--border-color)',
                    borderRadius: '8px',
                    fontSize: '16px',
                  }}
                  required
                />
              </div>
              <div style={{ marginBottom: '20px' }}>
                <label style={{ display: 'block', marginBottom: '8px', fontWeight: 600, fontSize: '14px' }}>
                  📍 Адрес доставки *
                </label>
                <textarea
                  placeholder="Укажите улицу, дом, квартиру"
                  value={deliveryData.address}
                  onChange={(e) => setDeliveryData({ ...deliveryData, address: e.target.value })}
                  rows={4}
                  style={{
                    width: '100%',
                    padding: '12px',
                    border: '1px solid var(--border-color)',
                    borderRadius: '8px',
                    fontSize: '16px',
                    resize: 'vertical',
                    fontFamily: 'inherit',
                  }}
                  required
                />
              </div>
              <div style={{ 
                padding: '15px', 
                background: 'var(--bg-page)', 
                borderRadius: '8px',
                marginBottom: '20px',
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                  <span>Сумма заказа:</span>
                  <span style={{ fontWeight: 600 }}>{getCartTotal().toLocaleString('ru-RU')} ₸</span>
                </div>
                <div style={{ fontSize: '12px', color: 'var(--text-secondary)', marginTop: '8px' }}>
                  * После оформления заказа с вами свяжется ресторан для подтверждения
                </div>
              </div>
            </div>
            <div style={{ padding: '0 20px 20px' }}>
              <button
                className="order-button"
                onClick={createOrder}
                disabled={placingOrder || !deliveryData.address.trim() || !deliveryData.phone.trim()}
                style={{ width: '100%' }}
              >
                {placingOrder ? 'Оформляем заказ...' : 'Подтвердить заказ'}
              </button>
              <button
                onClick={() => {
                  setShowDeliveryModal(false);
                  setShowCartModal(true);
                }}
                style={{
                  width: '100%',
                  marginTop: '10px',
                  padding: '12px',
                  border: '1px solid var(--border-color)',
                  borderRadius: '8px',
                  background: 'white',
                  color: 'var(--text-dark)',
                  cursor: 'pointer',
                  fontWeight: 600,
                }}
              >
                Назад к корзине
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ClientMenu;
