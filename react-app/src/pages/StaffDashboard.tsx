import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { ordersApi } from '../api/orders';
import { Order, OrderStatus } from '../types';
import './StaffDashboard.css';

const StaffDashboard: React.FC = () => {
  const { user, logout } = useAuth();
  const [orders, setOrders] = useState<Order[]>([]);
  const [lastCheck, setLastCheck] = useState<string | null>(null);
  const [isPolling, setIsPolling] = useState(true);
  const [updateTime, setUpdateTime] = useState<string>('--:--:--');
  const pollingIntervalRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    loadOrders();
    return () => {
      if (pollingIntervalRef.current) {
        clearInterval(pollingIntervalRef.current);
      }
    };
  }, []);

  useEffect(() => {
    if (isPolling) {
      startPolling();
    } else {
      stopPolling();
    }
    return () => {
      if (pollingIntervalRef.current) {
        clearInterval(pollingIntervalRef.current);
      }
    };
  }, [isPolling]);

  const formatTime = (dateString: string): string => {
    const date = new Date(dateString);
    const now = new Date();
    const diff = Math.floor((now.getTime() - date.getTime()) / 1000 / 60);

    if (diff < 1) return 'только что';
    if (diff === 1) return '1 мин назад';
    if (diff < 60) return `${diff} мин назад`;

    const hours = Math.floor(diff / 60);
    if (hours === 1) return '1 час назад';
    if (hours < 24) return `${hours} ч назад`;

    const days = Math.floor(hours / 24);
    return `${days} д назад`;
  };

  const loadOrders = async () => {
    try {
      const res = await ordersApi.list();
      if (res.success) {
        setOrders(res.orders);
        setLastCheck(new Date().toISOString());
        const now = new Date();
        const timeStr = now.toLocaleTimeString('ru-RU');
        setUpdateTime(timeStr);
      }
    } catch (error) {
      console.error('Error loading orders:', error);
    }
  };

  const pollOrders = async () => {
    try {
      const res = await ordersApi.poll(lastCheck ? 0 : 0);
      if (res.success && res.orders.length > 0) {
        setOrders((prev) => {
          const updatedOrders = [...prev];
          res.orders.forEach((newOrder: Order) => {
            const index = updatedOrders.findIndex((o) => o.id === newOrder.id);
            if (index >= 0) {
              updatedOrders[index] = newOrder;
            } else {
              updatedOrders.push(newOrder);
            }
          });
          return updatedOrders;
        });
        setLastCheck(new Date().toISOString());
        const now = new Date();
        const timeStr = now.toLocaleTimeString('ru-RU');
        setUpdateTime(timeStr);
      }
    } catch (error) {
      console.error('Error polling orders:', error);
    }
  };

  const startPolling = () => {
    if (pollingIntervalRef.current) return;
    loadOrders();
    pollingIntervalRef.current = setInterval(() => {
      pollOrders();
    }, 5000);
  };

  const stopPolling = () => {
    if (pollingIntervalRef.current) {
      clearInterval(pollingIntervalRef.current);
      pollingIntervalRef.current = null;
    }
  };

  const togglePolling = () => {
    setIsPolling(!isPolling);
  };

  const handleUpdateStatus = async (orderId: number, newStatus: OrderStatus) => {
    try {
      await ordersApi.updateStatus(orderId, { status: newStatus });
      setOrders((prev) =>
        prev.map((order) => (order.id === orderId ? { ...order, status: newStatus } : order))
      );
    } catch (error) {
      alert('Ошибка при обновлении статуса заказа');
    }
  };

  const getOrdersByStatus = (status: OrderStatus) => {
    return orders.filter((order) => order.status === status);
  };

  const newOrders = getOrdersByStatus(OrderStatus.NEW);
  const preparingOrders = getOrdersByStatus(OrderStatus.PREPARING);
  const servedOrders = getOrdersByStatus(OrderStatus.SERVED);

  return (
    <div className="staff-dashboard">
      <header className="main-header">
        <div className="panel-info">
          <div className="logo">🧑‍🍳</div>
          <div>
            <div className="title">Доска заказов</div>
            <div className="subtitle">{user?.first_name} {user?.last_name}</div>
          </div>
        </div>
        <div className="header-actions">
          <div className="update-status">⏱ Обновлено: {updateTime}</div>
          <button className="action-button" onClick={togglePolling}>
            {isPolling ? 'Остановить' : 'Запустить'}
          </button>
          <button className="action-button" onClick={logout}>→ Выйти</button>
        </div>
      </header>

      <div className="board-container">
        <div className="info-banner">
          <span className="icon">🔄</span>
          <div>
            <b>AJAX Polling активен:</b> Новые заказы автоматически обновляются каждые 5 секунд
            <p>Заказы обновляются в фоновом режиме без перезагрузки страницы</p>
          </div>
        </div>

        <div className="kanban-board">
          <div className="board-column new">
            <div className="column-header">
              <span>Новые</span>
              <span className="counter">{newOrders.length}</span>
            </div>
            <div className="cards-wrapper">
              {newOrders.length === 0 ? (
                <div style={{ textAlign: 'center', color: 'var(--text-secondary)', padding: '20px' }}>
                  Нет новых заказов
                </div>
              ) : (
                newOrders.map((order) => (
                  <OrderCard
                    key={order.id}
                    order={order}
                    formatTime={formatTime}
                    onUpdateStatus={handleUpdateStatus}
                  />
                ))
              )}
            </div>
          </div>

          <div className="board-column cooking">
            <div className="column-header">
              <span>Готовятся</span>
              <span className="counter">{preparingOrders.length}</span>
            </div>
            <div className="cards-wrapper">
              {preparingOrders.length === 0 ? (
                <div style={{ textAlign: 'center', color: 'var(--text-secondary)', padding: '20px' }}>
                  Нет заказов в работе
                </div>
              ) : (
                preparingOrders.map((order) => (
                  <OrderCard
                    key={order.id}
                    order={order}
                    formatTime={formatTime}
                    onUpdateStatus={handleUpdateStatus}
                  />
                ))
              )}
            </div>
          </div>

          <div className="board-column done">
            <div className="column-header">
              <span>Поданы</span>
              <span className="counter">{servedOrders.length}</span>
            </div>
            <div className="cards-wrapper">
              {servedOrders.length === 0 ? (
                <div style={{ textAlign: 'center', color: 'var(--text-secondary)', padding: '20px' }}>
                  Нет поданных заказов
                </div>
              ) : (
                servedOrders.map((order) => (
                  <OrderCard
                    key={order.id}
                    order={order}
                    formatTime={formatTime}
                    onUpdateStatus={handleUpdateStatus}
                  />
                ))
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

interface OrderCardProps {
  order: Order;
  formatTime: (dateString: string) => string;
  onUpdateStatus: (orderId: number, status: OrderStatus) => void;
}

const OrderCard: React.FC<OrderCardProps> = ({ order, formatTime, onUpdateStatus }) => {
  let itemsHTML = '';
  if (order.items && order.items.length > 0) {
    itemsHTML = order.items
      .map((item: any) => {
        const itemPrice = parseFloat(item.price?.toString() || '0') * (item.quantity || 1);
        return `
          <div class="item">
            <span>${item.quantity || 1}x ${item.name || 'Блюдо'}</span>
            <span class="price">${itemPrice.toLocaleString('ru-RU')} ₸</span>
          </div>
        `;
      })
      .join('');
  }

  let buttonHTML = '';
  if (order.status === OrderStatus.NEW) {
    buttonHTML = `<button class="btn-action btn-blue" onclick="window.updateOrderStatus(${order.id}, 'PREPARING')">🍳 В работу</button>`;
  } else if (order.status === OrderStatus.PREPARING) {
    buttonHTML = `<button class="btn-action btn-green" onclick="window.updateOrderStatus(${order.id}, 'SERVED')">✓ Подано</button>`;
  } else if (order.status === OrderStatus.SERVED) {
    buttonHTML = `<button class="btn-action btn-white" onclick="window.updateOrderStatus(${order.id}, 'COMPLETED')">Завершить</button>`;
  }

  const handleStatusUpdate = (newStatus: OrderStatus) => {
    onUpdateStatus(order.id, newStatus);
  };

  return (
    <div className="order-card">
      <div className="card-header">
        <span className="table-name">Столик №{order.table_number}</span>
        <span className="time-ago">🕒 {formatTime(order.created_at)}</span>
      </div>
      <div className="order-items-list">
        {order.items && order.items.length > 0 ? (
          order.items.map((item: any, index: number) => {
            const itemPrice = parseFloat(item.price?.toString() || '0') * (item.quantity || 1);
            return (
              <div key={index} className="item">
                <span>{item.quantity || 1}x {item.name || 'Блюдо'}</span>
                <span className="price">{itemPrice.toLocaleString('ru-RU')} ₸</span>
              </div>
            );
          })
        ) : (
          <div className="item">Нет блюд</div>
        )}
      </div>
      <div className="card-footer">
        <span className="total">Итого: {parseFloat(order.total_amount.toString()).toLocaleString('ru-RU')} ₸</span>
        {order.status === OrderStatus.NEW && (
          <button className="btn-action btn-blue" onClick={() => handleStatusUpdate(OrderStatus.PREPARING)}>
            🍳 В работу
          </button>
        )}
        {order.status === OrderStatus.PREPARING && (
          <button className="btn-action btn-green" onClick={() => handleStatusUpdate(OrderStatus.SERVED)}>
            ✓ Подано
          </button>
        )}
        {order.status === OrderStatus.SERVED && (
          <button className="btn-action btn-white" onClick={() => handleStatusUpdate(OrderStatus.COMPLETED)}>
            Завершить
          </button>
        )}
      </div>
    </div>
  );
};

export default StaffDashboard;
