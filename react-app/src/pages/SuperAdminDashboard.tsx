import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { restaurantsApi } from '../api/restaurants';
import { ordersApi } from '../api/orders';
import { Restaurant } from '../types';
import './SuperAdminDashboard.css';

interface RestaurantWithOwner extends Restaurant {
  owner_first_name?: string;
  owner_last_name?: string;
  owner_email?: string;
}

interface Stats {
  total_restaurants: number;
  active_restaurants: number;
  total_orders: number;
  premium_restaurants: number;
  total_revenue: number;
}

const SuperAdminDashboard: React.FC = () => {
  const { user, logout } = useAuth();
  const [loading, setLoading] = useState(true);
  const [restaurants, setRestaurants] = useState<RestaurantWithOwner[]>([]);
  const [stats, setStats] = useState<Stats>({
    total_restaurants: 0,
    active_restaurants: 0,
    total_orders: 0,
    premium_restaurants: 0,
    total_revenue: 0,
  });
  const [showModal, setShowModal] = useState(false);
  const [formError, setFormError] = useState('');
  const [formData, setFormData] = useState({
    restaurant_name: '',
    owner_email: '',
    owner_password: '',
    owner_first_name: '',
    owner_last_name: '',
    plan: 'FREE',
    address: '',
    phone: '',
  });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    await Promise.all([loadStats(), loadRestaurants()]);
    setLoading(false);
  };

  const loadStats = async () => {
    try {
      const res = await restaurantsApi.getStats();
      if (res.success) {
        setStats(res.stats);
      } else {
        // Fallback: calculate stats from restaurants and orders
        calculateStatsFromData();
      }
    } catch (error) {
      console.error('Error loading stats:', error);
      // Fallback: calculate stats from restaurants and orders
      calculateStatsFromData();
    }
  };

  const calculateStatsFromData = async () => {
    try {
      const res = await restaurantsApi.list();
      if (res.success) {
        let totalOrders = 0;
        let totalRevenue = 0;

        try {
          const allOrders = await ordersApi.list();
          if (allOrders.success) {
            totalOrders = allOrders.orders.length;
            totalRevenue = allOrders.orders.reduce((sum, order) => sum + parseFloat(order.total_amount.toString()), 0);
          }
        } catch (orderError) {
          console.error('Error loading orders for stats:', orderError);
        }

        setStats({
          total_restaurants: res.restaurants.length,
          active_restaurants: res.restaurants.filter((r) => r.is_active).length,
          total_orders: totalOrders,
          premium_restaurants: res.restaurants.filter((r) => r.plan === 'PREMIUM').length,
          total_revenue: totalRevenue,
        });
      }
    } catch (error) {
      console.error('Error calculating stats:', error);
    }
  };

  const loadRestaurants = async () => {
    try {
      const res = await restaurantsApi.list();
      if (res.success) {
        setRestaurants(res.restaurants);
      }
    } catch (error) {
      console.error('Error loading restaurants:', error);
    }
  };

  const handleCreateRestaurant = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError('');

    try {
      const res = await restaurantsApi.create(formData);
      if (res.success) {
        setShowModal(false);
        setFormData({
          restaurant_name: '',
          owner_email: '',
          owner_password: '',
          owner_first_name: '',
          owner_last_name: '',
          plan: 'FREE',
          address: '',
          phone: '',
        });
        loadData();
      }
    } catch (error: any) {
      console.error('Create restaurant error:', error);
      const errorMessage = error.response?.data?.message || error.response?.data?.error || 'Не удалось создать заведение';
      setFormError(errorMessage);
    }
  };

  const handleToggleRestaurant = async (id: number, isActive: boolean) => {
    if (!confirm(isActive ? 'Активировать заведение?' : 'Заблокировать заведение?')) {
      return;
    }

    try {
      const res = await restaurantsApi.update(id, { is_active: isActive });
      if (res.success) {
        loadData();
      } else {
        alert(res.message);
      }
    } catch (error: any) {
      alert('Ошибка: ' + (error.response?.data?.message || 'Не удалось обновить статус'));
    }
  };

  const handleDeleteRestaurant = async (id: number) => {
    if (!confirm('Удалить заведение? Это действие нельзя отменить.')) {
      return;
    }

    try {
      const res = await restaurantsApi.delete(id);
      if (res.success) {
        loadData();
      } else {
        alert(res.message);
      }
    } catch (error: any) {
      alert('Ошибка: ' + (error.response?.data?.message || 'Не удалось удалить заведение'));
    }
  };

  const openModal = () => {
    setShowModal(true);
    setFormError('');
  };

  const closeModal = () => {
    setShowModal(false);
    setFormError('');
    setFormData({
      restaurant_name: '',
      owner_email: '',
      owner_password: '',
      owner_first_name: '',
      owner_last_name: '',
      plan: 'FREE',
      address: '',
      phone: '',
    });
  };

  if (loading) {
    return (
      <div className="super-admin-dashboard">
        <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '100vh' }}>
          Загрузка...
        </div>
      </div>
    );
  }

  return (
    <div className="super-admin-dashboard">
      <header className="main-header">
        <div className="panel-info">
          <div className="logo">🏢</div>
          <div>
            <div className="title">Панель Супер-Администратора</div>
            <div className="subtitle">{user?.first_name} {user?.last_name}</div>
          </div>
        </div>
        <button className="logout-button" onClick={logout}>
          <span>→</span> Выйти
        </button>
      </header>

      <main className="admin-container">
        <section className="stats-grid">
          <div className="stat-card">
            <div>
              <div className="title">Всего заведений</div>
              <div className="value">{stats.total_restaurants}</div>
              <div className="description">Активных: <span>{stats.active_restaurants}</span></div>
            </div>
            <div className="icon">🏢</div>
          </div>
          <div className="stat-card">
            <div>
              <div className="title">Всего заказов</div>
              <div className="value">{stats.total_orders}</div>
              <div className="description">За все время</div>
            </div>
            <div className="icon">✉️</div>
          </div>
          <div className="stat-card">
            <div>
              <div className="title">Premium аккаунтов</div>
              <div className="value">{stats.premium_restaurants}</div>
              <div className="description">Платных тарифов</div>
            </div>
            <div className="icon">🧑‍🤝‍🧑</div>
          </div>
          <div className="stat-card">
            <div>
              <div className="title">Общий доход</div>
              <div className="value revenue">{stats.total_revenue.toLocaleString('ru-RU')} ₸</div>
              <div className="description">За все время</div>
            </div>
            <div className="icon icon-green">📈</div>
          </div>
        </section>

        <section className="management-card">
          <div className="management-header">
            <div>
              <h2 className="title">Управление заведениями</h2>
              <p className="subtitle">Создание и управление аккаунтами владельцев</p>
            </div>
            <button className="btn-add" onClick={openModal}>+ Добавить заведение</button>
          </div>

          <div className="establishments-table">
            <div className="table-header">
              <div>Заведение</div>
              <div>Владелец</div>
              <div>Контакты</div>
              <div>Тариф</div>
              <div>Статус</div>
              <div>Действия</div>
            </div>
            <div>
              {restaurants.length === 0 ? (
                <div style={{ padding: '40px', textAlign: 'center', color: 'var(--text-secondary)' }}>
                  Нет заведений. Добавьте первое заведение.
                </div>
              ) : (
                restaurants.map((restaurant) => (
                  <div key={restaurant.id} className="table-row">
                    <div className="establishment-cell">
                      <div className="name">{restaurant.name}</div>
                      <div className="address">{restaurant.address || ''}</div>
                    </div>
                    <div>
                      {restaurant.owner_first_name && restaurant.owner_last_name
                        ? `${restaurant.owner_first_name} ${restaurant.owner_last_name}`
                        : 'Не указано'}
                    </div>
                    <div>{restaurant.phone || '-'}</div>
                    <div>
                      <span className={`tag ${restaurant.plan}`}>
                        {restaurant.plan === 'PREMIUM' ? 'Премиум' : 'Бесплатный'}
                      </span>
                    </div>
                    <div>
                      <span className={`tag ${restaurant.is_active ? 'active' : 'inactive'}`}>
                        {restaurant.is_active ? 'Активен' : 'Заблокирован'}
                      </span>
                    </div>
                    <div className="action-buttons">
                      <button
                        className="action-btn"
                        onClick={() => handleToggleRestaurant(restaurant.id, !restaurant.is_active)}
                        title={restaurant.is_active ? 'Заблокировать' : 'Активировать'}
                      >
                        {restaurant.is_active ? '🔒' : '🔓'}
                      </button>
                      <button
                        className="action-btn delete"
                        onClick={() => handleDeleteRestaurant(restaurant.id)}
                        title="Удалить"
                      >
                        🗑️
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </section>
      </main>

      {/* Модальное окно: Добавить заведение */}
      {showModal && (
        <div
          className={`modal-overlay ${showModal ? 'show' : ''}`}
          onClick={(e) => e.target === e.currentTarget && closeModal()}
        >
          <div className="modal-content">
            <button className="modal-close-btn" onClick={closeModal}>&times;</button>

            <div className="modal-header">
              <h2>Создать новое заведение</h2>
              <p>Заполните данные заведения и создайте аккаунт владельца</p>
            </div>

            <form id="createRestaurantForm" onSubmit={handleCreateRestaurant}>
              <div className="form-grid">
                <div className="form-group full-width">
                  <label htmlFor="restaurant_name">Название заведения *</label>
                  <input
                    type="text"
                    id="restaurant_name"
                    name="restaurant_name"
                    placeholder="Ресторан 'Алатау'"
                    value={formData.restaurant_name}
                    onChange={(e) => setFormData({ ...formData, restaurant_name: e.target.value })}
                    required
                  />
                </div>
                <div className="form-group">
                  <label htmlFor="address">Адрес</label>
                  <input
                    type="text"
                    id="address"
                    name="address"
                    placeholder="г. Алматы, ул. Абая 150"
                    value={formData.address}
                    onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                  />
                </div>
                <div className="form-group">
                  <label htmlFor="phone">Телефон</label>
                  <input
                    type="tel"
                    id="phone"
                    name="phone"
                    placeholder="+7 777 123 4567"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  />
                </div>

                <h3 className="form-section-title">Данные владельца</h3>

                <div className="form-group">
                  <label htmlFor="owner_first_name">Имя владельца *</label>
                  <input
                    type="text"
                    id="owner_first_name"
                    name="owner_first_name"
                    placeholder="Асан"
                    value={formData.owner_first_name}
                    onChange={(e) => setFormData({ ...formData, owner_first_name: e.target.value })}
                    required
                  />
                </div>
                <div className="form-group">
                  <label htmlFor="owner_last_name">Фамилия владельца *</label>
                  <input
                    type="text"
                    id="owner_last_name"
                    name="owner_last_name"
                    placeholder="Ибрагимов"
                    value={formData.owner_last_name}
                    onChange={(e) => setFormData({ ...formData, owner_last_name: e.target.value })}
                    required
                  />
                </div>
                <div className="form-group">
                  <label htmlFor="owner_email">Email владельца *</label>
                  <input
                    type="email"
                    id="owner_email"
                    name="owner_email"
                    placeholder="owner@example.kz"
                    value={formData.owner_email}
                    onChange={(e) => setFormData({ ...formData, owner_email: e.target.value })}
                    required
                  />
                </div>
                <div className="form-group">
                  <label htmlFor="owner_password">Пароль *</label>
                  <input
                    type="password"
                    id="owner_password"
                    name="owner_password"
                    placeholder="********"
                    value={formData.owner_password}
                    onChange={(e) => setFormData({ ...formData, owner_password: e.target.value })}
                    required
                  />
                </div>
                <div className="form-group">
                  <label htmlFor="plan">Тариф</label>
                  <select
                    id="plan"
                    name="plan"
                    value={formData.plan}
                    onChange={(e) => setFormData({ ...formData, plan: e.target.value })}
                  >
                    <option value="FREE">Бесплатный</option>
                    <option value="PREMIUM">Премиум</option>
                  </select>
                </div>

                {formError && (
                  <div className="error-message show">{formError}</div>
                )}

                <div className="modal-footer">
                  <button type="button" className="btn btn-secondary" onClick={closeModal}>Отмена</button>
                  <button type="submit" className="btn btn-primary">Создать заведение</button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default SuperAdminDashboard;
