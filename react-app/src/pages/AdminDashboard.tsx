import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { restaurantsApi } from '../api/restaurants';
import { menuApi, MenuResponse } from '../api/menu';
import { tablesApi, TablesResponse } from '../api/tables';
import { staffApi, Staff } from '../api/staff';
import { ordersApi } from '../api/orders';
import { qrApi } from '../api/qr';
import { Restaurant, MenuCategory, MenuItem, Table, Order } from '../types';
import Loading from '../components/Loading';
import './AdminDashboard.css';

type Tab = 'home' | 'menu' | 'tables' | 'staff' | 'settings';

const AdminDashboard: React.FC = () => {
  const { user, logout } = useAuth();
  const [activeTab, setActiveTab] = useState<Tab>('home');
  const [loading, setLoading] = useState(true);
  const [restaurant, setRestaurant] = useState<Restaurant | null>(null);
  const [menu, setMenu] = useState<Array<{ category: MenuCategory; items: MenuItem[] }>>([]);
  const [menuLimits, setMenuLimits] = useState<{ current_categories: number; max_categories: number; plan: string } | null>(null);
  const [tables, setTables] = useState<Table[]>([]);
  const [tablesLimits, setTablesLimits] = useState<{ current: number; max: number; plan: string } | null>(null);
  const [staff, setStaff] = useState<Staff[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  
  // Stats
  const [todayOrders, setTodayOrders] = useState(0);
  const [todayRevenue, setTodayRevenue] = useState(0);
  const [avgCheck, setAvgCheck] = useState(0);
  const [activeTables, setActiveTables] = useState(0);
  
  // Modals
  const [showCategoryModal, setShowCategoryModal] = useState(false);
  const [showItemModal, setShowItemModal] = useState(false);
  const [showTableModal, setShowTableModal] = useState(false);
  const [showStaffModal, setShowStaffModal] = useState(false);
  const [showPremiumModal, setShowPremiumModal] = useState(false);
  const [premiumModalData, setPremiumModalData] = useState<{ limitType: 'tables' | 'categories'; currentCount: number; limit: number; plan: string } | null>(null);
  
  // Form states
  const [newCategory, setNewCategory] = useState({ name: '' });
  const [newItem, setNewItem] = useState({
    category_id: 0,
    name: '',
    description: '',
    price: '',
    image_url: '',
    is_available: true,
    imageFile: null as File | null,
  });
  const [newTable, setNewTable] = useState({ table_number: '' });
  const [newStaff, setNewStaff] = useState({
    email: '',
    password: '',
    first_name: '',
    last_name: '',
  });
  const [settings, setSettings] = useState({
    name: '',
    address: '',
    phone: '',
    whatsapp_number: '',
    plan: '',
  });
  const [statsPeriod, setStatsPeriod] = useState<'today' | 'week' | 'month'>('today');
  const [statsData, setStatsData] = useState<any>(null);
  const isEditingSettings = useRef(false);
  const settingsLoadedRef = useRef(false);

  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    if (activeTab === 'home') {
      loadDashboardStats();
      loadRecentOrders();
    } else if (activeTab === 'menu') {
      loadMenu();
    } else if (activeTab === 'tables') {
      loadTables();
    } else if (activeTab === 'staff') {
      loadStaff();
    } else if (activeTab === 'settings') {
      // Загружаем данные только при первом открытии вкладки или если не редактируем
      if (!isEditingSettings.current && !settingsLoadedRef.current) {
        loadRestaurant();
        loadStats('today');
        settingsLoadedRef.current = true;
      }
    } else {
      // При переключении на другую вкладку сбрасываем флаг
      settingsLoadedRef.current = false;
    }
  }, [activeTab]);

  const loadData = async () => {
    try {
      const res = await restaurantsApi.getMy();
      setRestaurant(res.restaurant);
      setLoading(false);
    } catch (error) {
      console.error('Error loading data:', error);
      setLoading(false);
    }
  };

  const loadDashboardStats = async () => {
    try {
      const res = await ordersApi.list();
      if (res.success) {
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        
        const todayOrdersList = res.orders.filter((order: Order) => {
          const orderDate = new Date(order.created_at);
          return orderDate >= today;
        });
        
        const todayRevenueCalc = todayOrdersList.reduce((sum: number, order: Order) => sum + parseFloat(order.total_amount.toString()), 0);
        const avgCheckCalc = todayOrdersList.length > 0 ? todayRevenueCalc / todayOrdersList.length : 0;
        
        const activeOrdersCount = res.orders.filter((order: Order) => 
          order.status === 'NEW' || order.status === 'PREPARING'
        ).length;
        
        setTodayOrders(todayOrdersList.length);
        setTodayRevenue(todayRevenueCalc);
        setAvgCheck(avgCheckCalc);
        setActiveTables(activeOrdersCount);
      }
    } catch (error) {
      console.error('Error loading stats:', error);
    }
  };

  const loadRecentOrders = async () => {
    try {
      const res = await ordersApi.list();
      if (res.success) {
        setOrders(res.orders.slice(0, 10));
      }
    } catch (error) {
      console.error('Error loading orders:', error);
    }
  };

  const loadMenu = async () => {
    if (!restaurant) return;
    try {
      const res = await menuApi.get(restaurant.id);
      setMenu(res.menu);
      if (res.limits) {
        setMenuLimits(res.limits);
      }
    } catch (error) {
      console.error('Error loading menu:', error);
    }
  };

  const loadTables = async () => {
    try {
      const res = await tablesApi.list();
      if (res.success) {
        setTables(res.tables);
        if (res.limits) {
          setTablesLimits(res.limits);
        }
      }
    } catch (error) {
      console.error('Error loading tables:', error);
    }
  };

  const loadStaff = async () => {
    try {
      const res = await staffApi.list();
      if (res.success) {
        setStaff(res.staff);
      }
    } catch (error) {
      console.error('Error loading staff:', error);
    }
  };

  const loadRestaurant = async () => {
    // Не загружаем если редактируем форму
    if (isEditingSettings.current) {
      return;
    }
    
    try {
      const res = await restaurantsApi.getMy();
      if (res.success) {
        setRestaurant(res.restaurant);
        // Обновляем settings только если не редактируем
        if (!isEditingSettings.current) {
          setSettings({
            name: res.restaurant.name,
            address: res.restaurant.address || '',
            phone: res.restaurant.phone || '',
            whatsapp_number: res.restaurant.whatsapp_number || '',
            plan: res.restaurant.plan === 'PREMIUM' ? 'Premium' : 'Бесплатный',
          });
        }
      }
    } catch (error) {
      console.error('Error loading restaurant:', error);
    }
  };

  const loadStats = async (period: 'today' | 'week' | 'month') => {
    try {
      const res = await ordersApi.getStats();
      if (res.success) {
        setStatsData(res.stats);
      }
    } catch (error) {
      console.error('Error loading stats:', error);
    }
  };

  const handleCreateCategory = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await menuApi.createCategory(newCategory);
      if (res.success) {
        setShowCategoryModal(false);
        setNewCategory({ name: '' });
        loadMenu();
      }
    } catch (error: any) {
      const errorMsg = error.response?.data?.message || 'Не удалось создать категорию';
      if (errorMsg === 'limit_reached' || error.response?.data?.limit_type) {
        setPremiumModalData({
          limitType: 'categories',
          currentCount: error.response?.data?.current_count || 0,
          limit: error.response?.data?.limit || 5,
          plan: error.response?.data?.plan || 'FREE',
        });
        setShowPremiumModal(true);
      } else {
        alert('Ошибка: ' + errorMsg);
      }
    }
  };

  const handleCreateItem = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      let imageUrl = newItem.image_url;
      
      // Upload image if file selected
      if (newItem.imageFile) {
        const formData = new FormData();
        formData.append('image', newItem.imageFile);
        try {
          const uploadRes = await fetch('/api/upload/image', {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${localStorage.getItem('token')}`,
            },
            body: formData,
          });
          const uploadData = await uploadRes.json();
          if (uploadData.success) {
            imageUrl = uploadData.url;
          }
        } catch (uploadError) {
          console.error('Image upload error:', uploadError);
        }
      }
      
      const res = await menuApi.createItem({
        category_id: newItem.category_id,
        name: newItem.name,
        description: newItem.description,
        price: parseFloat(newItem.price),
        image_url: imageUrl || undefined,
        is_available: newItem.is_available,
      });
      
      if (res.success) {
        setShowItemModal(false);
        setNewItem({
          category_id: 0,
          name: '',
          description: '',
          price: '',
          image_url: '',
          is_available: true,
          imageFile: null,
        });
        loadMenu();
      }
    } catch (error: any) {
      alert('Ошибка: ' + (error.response?.data?.message || 'Не удалось создать блюдо'));
    }
  };

  const handleCreateTable = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await tablesApi.create(newTable);
      if (res.success) {
        setShowTableModal(false);
        setNewTable({ table_number: '' });
        loadTables();
      }
    } catch (error: any) {
      const errorMsg = error.response?.data?.message || 'Не удалось создать столик';
      if (errorMsg === 'limit_reached' || error.response?.data?.limit_type) {
        setPremiumModalData({
          limitType: 'tables',
          currentCount: error.response?.data?.current_count || 0,
          limit: error.response?.data?.limit || 5,
          plan: error.response?.data?.plan || 'FREE',
        });
        setShowPremiumModal(true);
      } else {
        alert('Ошибка: ' + errorMsg);
      }
    }
  };

  const handleCreateStaff = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await staffApi.create(newStaff);
      if (res.success) {
        setShowStaffModal(false);
        setNewStaff({ email: '', password: '', first_name: '', last_name: '' });
        loadStaff();
      }
    } catch (error: any) {
      alert('Ошибка: ' + (error.response?.data?.message || 'Не удалось добавить сотрудника'));
    }
  };

  const handleDeleteCategory = async (id: number) => {
    if (!confirm('Удалить категорию? Все блюда в ней также будут удалены.')) return;
    try {
      await menuApi.deleteCategory(id);
      loadMenu();
    } catch (error) {
      alert('Ошибка при удалении категории');
    }
  };

  const handleDeleteItem = async (id: number) => {
    if (!confirm('Удалить блюдо?')) return;
    try {
      await menuApi.deleteItem(id);
      loadMenu();
    } catch (error) {
      alert('Ошибка при удалении блюда');
    }
  };

  const handleDeleteTable = async (id: number) => {
    if (!confirm('Удалить столик?')) return;
    try {
      await tablesApi.delete(id);
      loadTables();
    } catch (error) {
      alert('Ошибка при удалении столика');
    }
  };

  const handleDeleteStaff = async (id: number) => {
    if (!confirm('Удалить сотрудника?')) return;
    try {
      await staffApi.delete(id);
      loadStaff();
    } catch (error) {
      alert('Ошибка при удалении сотрудника');
    }
  };

  const handleToggleDishAvailability = async (id: number, isAvailable: boolean) => {
    try {
      await menuApi.updateItem(id, { is_available: isAvailable });
      loadMenu();
    } catch (error) {
      alert('Ошибка при изменении статуса блюда');
    }
  };

  const handleDownloadQR = (tableId: number, tableNumber: string) => {
    const url = qrApi.generate(tableId);
    const link = document.createElement('a');
    link.href = url;
    link.download = `qr-table-${tableNumber}.png`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleViewMenu = (tableId: number) => {
    if (!restaurant) return;
    const url = `${window.location.origin}/menu/client?restaurant_id=${restaurant.id}&table_id=${tableId}`;
    window.open(url, '_blank');
  };

  const handleUpdateSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    isEditingSettings.current = false; // Разрешаем обновление после сохранения
    
    try {
      const updateData = {
        name: settings.name,
        address: settings.address || '',
        phone: settings.phone || '',
        whatsapp_number: settings.whatsapp_number || '',
      };
      
      await restaurantsApi.updateMy(updateData);
      alert('Настройки успешно сохранены');
      
      // Перезагружаем данные с сервера после успешного сохранения
      const res = await restaurantsApi.getMy();
      if (res.success) {
        setRestaurant(res.restaurant);
        setSettings({
          name: res.restaurant.name,
          address: res.restaurant.address || '',
          phone: res.restaurant.phone || '',
          whatsapp_number: res.restaurant.whatsapp_number || '',
          plan: res.restaurant.plan === 'PREMIUM' ? 'Premium' : 'Бесплатный',
        });
      }
    } catch (error: any) {
      alert('Ошибка: ' + (error.response?.data?.message || 'Не удалось сохранить настройки'));
      isEditingSettings.current = true; // Возвращаем флаг редактирования при ошибке
    }
  };

  const upgradeToPremium = () => {
    alert('Функция подключения премиум-тарифа будет доступна в следующей версии.\n\nДля тестирования вы можете:\n1. Войти как супер-администратор\n2. Изменить тариф ресторана на PREMIUM');
    setShowPremiumModal(false);
  };

  if (loading) {
    return (
      <div className="admin-dashboard">
        <Loading />
      </div>
    );
  }

  return (
    <div className="admin-dashboard">
      <header className="main-header">
        <div className="restaurant-info">
          <div className="logo">🍽️</div>
          <div>
            <div className="name">{restaurant?.name || 'Загрузка...'}</div>
            <div className="owner">{user?.first_name} {user?.last_name}</div>
          </div>
        </div>
        <button className="logout-button" onClick={logout}>→ Выйти</button>
      </header>

      <main className="dashboard-container">
        <nav className="dashboard-nav">
          <button
            className={`nav-item ${activeTab === 'home' ? 'active' : ''}`}
            onClick={() => setActiveTab('home')}
          >
            🏠 Главная
          </button>
          <button
            className={`nav-item ${activeTab === 'menu' ? 'active' : ''}`}
            onClick={() => setActiveTab('menu')}
          >
            📋 Меню
          </button>
          <button
            className={`nav-item ${activeTab === 'tables' ? 'active' : ''}`}
            onClick={() => setActiveTab('tables')}
          >
            🪑 Столики
          </button>
          <button
            className={`nav-item ${activeTab === 'staff' ? 'active' : ''}`}
            onClick={() => setActiveTab('staff')}
          >
            👥 Сотрудники
          </button>
          <button
            className={`nav-item ${activeTab === 'settings' ? 'active' : ''}`}
            onClick={() => setActiveTab('settings')}
          >
            ⚙️ Настройки
          </button>
        </nav>

        {/* Страница: Главная */}
        {activeTab === 'home' && (
          <div id="home" className="page">
            <section className="stats-grid">
              <div className="stat-card">
                <div className="title">Заказов сегодня</div>
                <div className="value">{todayOrders}</div>
                <div className="description">За последние 24 часа</div>
              </div>
              <div className="stat-card">
                <div className="title">Выручка сегодня</div>
                <div className="value revenue">{todayRevenue.toLocaleString('ru-RU')} ₸</div>
                <div className="description">За последние 24 часа</div>
              </div>
              <div className="stat-card">
                <div className="title">Средний чек</div>
                <div className="value">{avgCheck.toLocaleString('ru-RU')} ₸</div>
                <div className="description">В среднем</div>
              </div>
              <div className="stat-card">
                <div className="title">Активных столиков</div>
                <div className="value">{activeTables}</div>
                <div className="description">Сейчас занято</div>
              </div>
            </section>

            <section className="content-card">
              <div className="card-header">
                <h2 className="title">Последние заказы</h2>
                <p className="subtitle">История заказов за сегодня</p>
              </div>
              <div id="recentOrders">
                {orders.length === 0 ? (
                  <p style={{ color: 'var(--text-secondary)' }}>Заказов пока нет</p>
                ) : (
                  orders.map((order) => {
                    const date = new Date(order.created_at);
                    const timeStr = date.toLocaleString('ru-RU', {
                      hour: '2-digit',
                      minute: '2-digit',
                      day: '2-digit',
                      month: '2-digit',
                    });
                    
                    let dishesText = '';
                    if (order.items && order.items.length > 0) {
                      dishesText = order.items.map((item: any) => `${item.quantity}x ${item.name}`).join(', ');
                    }
                    
                    const statusText: { [key: string]: string } = {
                      'NEW': 'Новый',
                      'PREPARING': 'Готовится',
                      'SERVED': 'Подан',
                      'COMPLETED': 'Завершён',
                      'CANCELLED': 'Отменён',
                    };
                    
                    return (
                      <div key={order.id} className="order-item">
                        <div className="order-details">
                          <div className="timestamp">{timeStr} • Столик №{order.table_number}</div>
                          <div className="dishes">{dishesText}</div>
                        </div>
                        <div className="order-summary">
                          <div className="price">{parseFloat(order.total_amount.toString()).toLocaleString('ru-RU')} ₸</div>
                          <span className={`status-badge ${order.status}`}>
                            {statusText[order.status] || order.status}
                          </span>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </section>
          </div>
        )}

        {/* Страница: Меню */}
        {activeTab === 'menu' && (
          <div id="menu" className="page">
            <section className="content-card">
              <div className="card-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <h2 className="title">Управление меню</h2>
                  <p className="subtitle">Категории и блюда вашего ресторана</p>
                  {menuLimits && (
                    <div id="categoriesLimitInfo" style={{ fontSize: '14px', color: 'var(--text-secondary)', marginTop: '5px' }}>
                      Использовано: {menuLimits.current_categories}/{menuLimits.max_categories} категорий ({menuLimits.plan === 'FREE' ? 'бесплатный тариф' : 'премиум тариф'})
                    </div>
                  )}
                </div>
                <div style={{ display: 'flex', gap: '10px' }}>
                  <button className="btn-primary" onClick={() => setShowCategoryModal(true)}>+ Добавить категорию</button>
                  <button className="btn-primary" onClick={() => setShowItemModal(true)}>+ Добавить блюдо</button>
                </div>
              </div>
              <div id="menuContent">
                {menu.length === 0 ? (
                  <p style={{ color: 'var(--text-secondary)', textAlign: 'center', padding: '40px' }}>
                    Нет категорий. Добавьте первую категорию.
                  </p>
                ) : (
                  menu.map((section) => {
                    const categoryItems = section.items.filter((item) => item.category_id === section.category.id);
                    return (
                      <div key={section.category.id} className="category-section">
                        <div className="category-header">
                          <span>{section.category.name} ({categoryItems.length})</span>
                          <button
                            onClick={() => handleDeleteCategory(section.category.id)}
                            style={{
                              padding: '5px 15px',
                              background: '#E53935',
                              color: 'white',
                              border: 'none',
                              borderRadius: '4px',
                              cursor: 'pointer',
                            }}
                          >
                            Удалить
                          </button>
                        </div>
                        <div className="dishes-grid" id={`category-${section.category.id}`}>
                          {categoryItems.length === 0 ? (
                            <p style={{ gridColumn: '1 / -1', textAlign: 'center', color: 'var(--text-secondary)', padding: '20px' }}>
                              Нет блюд в этой категории
                            </p>
                          ) : (
                            categoryItems.map((item) => (
                              <div key={item.id} className="dish-item">
                                {item.image_url ? (
                                  <img src={item.image_url} alt={item.name} />
                                ) : (
                                  <div style={{ width: '100%', height: '150px', background: 'var(--bg-page)', borderRadius: '8px', marginBottom: '10px' }}></div>
                                )}
                                <div className="dish-name">{item.name}</div>
                                {item.description && (
                                  <div style={{ fontSize: '13px', color: 'var(--text-secondary)', marginBottom: '10px' }}>
                                    {item.description}
                                  </div>
                                )}
                                <div className="dish-price">{parseFloat(item.price.toString()).toLocaleString('ru-RU')} ₸</div>
                                <div className="dish-actions">
                                  <button
                                    onClick={() => handleToggleDishAvailability(item.id, !item.is_available)}
                                  >
                                    {item.is_available ? '✓ Доступно' : '✗ Недоступно'}
                                  </button>
                                  <button onClick={() => handleDeleteItem(item.id)}>🗑️</button>
                                </div>
                              </div>
                            ))
                          )}
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </section>
          </div>
        )}

        {/* Страница: Столики */}
        {activeTab === 'tables' && (
          <div id="tables" className="page">
            <section className="content-card">
              <div className="card-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <h2 className="title">Управление столиками</h2>
                  <p className="subtitle">QR-коды и статусы столиков</p>
                  {tablesLimits && (
                    <div id="tablesLimitInfo" style={{ fontSize: '14px', color: 'var(--text-secondary)', marginTop: '5px' }}>
                      Использовано: {tablesLimits.current}/{tablesLimits.max} столиков ({tablesLimits.plan === 'FREE' ? 'бесплатный тариф' : 'премиум тариф'})
                    </div>
                  )}
                </div>
                <button className="btn-primary" onClick={() => setShowTableModal(true)}>+ Добавить столик</button>
              </div>
              <div id="tablesGrid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '20px', marginTop: '20px' }}>
                {tables.length === 0 ? (
                  <p style={{ gridColumn: '1 / -1', textAlign: 'center', color: 'var(--text-secondary)' }}>
                    Нет столиков. Добавьте первый столик.
                  </p>
                ) : (
                  tables.map((table) => (
                    <TableCard
                      key={table.id}
                      table={table}
                      restaurantName={restaurant?.name || ''}
                      onDownloadQR={() => handleDownloadQR(table.id, table.table_number)}
                      onViewMenu={() => handleViewMenu(table.id)}
                      onDelete={() => handleDeleteTable(table.id)}
                    />
                  ))
                )}
              </div>
            </section>
          </div>
        )}

        {/* Страница: Сотрудники */}
        {activeTab === 'staff' && (
          <div id="staff" className="page">
            <section className="content-card">
              <div className="card-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <h2 className="title">Управление сотрудниками</h2>
                  <p className="subtitle">Команда вашего ресторана</p>
                </div>
                <button className="btn-primary" onClick={() => setShowStaffModal(true)}>+ Добавить сотрудника</button>
              </div>
              <div id="staffList">
                {staff.length === 0 ? (
                  <p style={{ textAlign: 'center', color: 'var(--text-secondary)', padding: '40px' }}>
                    Нет сотрудников. Добавьте первого сотрудника.
                  </p>
                ) : (
                  staff.map((member) => (
                    <div key={member.id} className="staff-item">
                      <div className="staff-info">
                        <div className="name">{member.first_name} {member.last_name}</div>
                        <div className="email">{member.email}</div>
                      </div>
                      <button
                        onClick={() => handleDeleteStaff(member.id)}
                        style={{
                          padding: '8px 16px',
                          background: '#E53935',
                          color: 'white',
                          border: 'none',
                          borderRadius: '4px',
                          cursor: 'pointer',
                        }}
                      >
                        Удалить
                      </button>
                    </div>
                  ))
                )}
              </div>
            </section>
          </div>
        )}

        {/* Страница: Настройки */}
        {activeTab === 'settings' && restaurant && (
          <div id="settings" className="page">
            <section className="content-card">
              <div className="card-header">
                <h2 className="title">Настройки ресторана</h2>
                <p className="subtitle">Управление профилем и параметрами</p>
              </div>
              <form id="settingsForm" onSubmit={handleUpdateSettings} style={{ maxWidth: '600px' }}>
                <div style={{ marginBottom: '20px' }}>
                  <label style={{ display: 'block', marginBottom: '5px', fontWeight: 600 }}>Название ресторана *</label>
                  <input
                    type="text"
                    name="name"
                    value={settings.name}
                    onChange={(e) => setSettings({ ...settings, name: e.target.value })}
                    required
                    style={{ width: '100%', padding: '10px', border: '1px solid var(--border-color)', borderRadius: '8px' }}
                  />
                </div>
                <div style={{ marginBottom: '20px' }}>
                  <label style={{ display: 'block', marginBottom: '5px', fontWeight: 600 }}>Адрес</label>
                  <input
                    type="text"
                    name="address"
                    value={settings.address}
                    onChange={(e) => setSettings({ ...settings, address: e.target.value })}
                    style={{ width: '100%', padding: '10px', border: '1px solid var(--border-color)', borderRadius: '8px' }}
                  />
                </div>
                <div style={{ marginBottom: '20px' }}>
                  <label style={{ display: 'block', marginBottom: '5px', fontWeight: 600 }}>Телефон</label>
                  <input
                    type="tel"
                    name="phone"
                    value={settings.phone}
                    onChange={(e) => setSettings({ ...settings, phone: e.target.value })}
                    style={{ width: '100%', padding: '10px', border: '1px solid var(--border-color)', borderRadius: '8px' }}
                  />
                </div>
                <div style={{ marginBottom: '20px' }}>
                  <label style={{ display: 'block', marginBottom: '5px', fontWeight: 600 }}>
                    WhatsApp номер <span style={{ color: 'var(--text-secondary)', fontSize: '14px', fontWeight: 400 }}>(для уведомлений о заказах)</span>
                  </label>
                  <input
                    type="text"
                    name="whatsapp_number"
                    placeholder="+7 777 123-45-67"
                    value={settings.whatsapp_number || ''}
                    onFocus={() => {
                      isEditingSettings.current = true;
                    }}
                    onChange={(e) => {
                      const value = e.target.value;
                      isEditingSettings.current = true;
                      setSettings((prev) => {
                        // Сохраняем все предыдущие значения и обновляем только whatsapp_number
                        return { ...prev, whatsapp_number: value };
                      });
                    }}
                    onBlur={() => {
                      // Небольшая задержка чтобы не конфликтовать с submit
                      setTimeout(() => {
                        isEditingSettings.current = false;
                      }, 200);
                    }}
                    autoComplete="off"
                    style={{ width: '100%', padding: '10px', border: '1px solid var(--border-color)', borderRadius: '8px' }}
                  />
                  <p style={{ fontSize: '12px', color: 'var(--text-secondary)', marginTop: '5px' }}>
                    На этот номер будут приходить уведомления о новых заказах
                  </p>
                </div>
                <div style={{ marginBottom: '20px' }}>
                  <label style={{ display: 'block', marginBottom: '5px', fontWeight: 600 }}>Тарифный план</label>
                  <input
                    type="text"
                    value={settings.plan}
                    readOnly
                    style={{ width: '100%', padding: '10px', border: '1px solid var(--border-color)', borderRadius: '8px', background: 'var(--bg-page)' }}
                  />
                </div>
                <button type="submit" className="btn-primary">Сохранить изменения</button>
              </form>
            </section>

            <section className="content-card">
              <div className="card-header">
                <h2 className="title">Статистика и аналитика</h2>
                <p className="subtitle">Подробная информация о вашем бизнесе</p>
              </div>
              <div style={{ display: 'flex', gap: '10px', marginBottom: '20px' }}>
                <button
                  onClick={() => { setStatsPeriod('today'); loadStats('today'); }}
                  className={statsPeriod === 'today' ? 'btn-primary' : ''}
                  style={{ padding: '10px 20px', border: '1px solid var(--border-color)', background: statsPeriod === 'today' ? 'var(--orange-primary)' : 'white', color: statsPeriod === 'today' ? 'white' : 'var(--text-dark)', borderRadius: '8px', cursor: 'pointer' }}
                >
                  Сегодня
                </button>
                <button
                  onClick={() => { setStatsPeriod('week'); loadStats('week'); }}
                  className={statsPeriod === 'week' ? 'btn-primary' : ''}
                  style={{ padding: '10px 20px', border: '1px solid var(--border-color)', background: statsPeriod === 'week' ? 'var(--orange-primary)' : 'white', color: statsPeriod === 'week' ? 'white' : 'var(--text-dark)', borderRadius: '8px', cursor: 'pointer' }}
                >
                  Неделя
                </button>
                <button
                  onClick={() => { setStatsPeriod('month'); loadStats('month'); }}
                  className={statsPeriod === 'month' ? 'btn-primary' : ''}
                  style={{ padding: '10px 20px', border: '1px solid var(--border-color)', background: statsPeriod === 'month' ? 'var(--orange-primary)' : 'white', color: statsPeriod === 'month' ? 'white' : 'var(--text-dark)', borderRadius: '8px', cursor: 'pointer' }}
                >
                  Месяц
                </button>
              </div>
              <div id="statsContent">
                {statsData && (
                  <>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '20px', marginBottom: '30px' }}>
                      <div style={{ padding: '20px', background: 'var(--bg-page)', borderRadius: '8px' }}>
                        <div style={{ color: 'var(--text-secondary)', marginBottom: '10px' }}>Всего заказов</div>
                        <div style={{ fontSize: '32px', fontWeight: 700 }}>{statsData.total_orders || 0}</div>
                      </div>
                      <div style={{ padding: '20px', background: 'var(--bg-page)', borderRadius: '8px' }}>
                        <div style={{ color: 'var(--text-secondary)', marginBottom: '10px' }}>Выручка</div>
                        <div style={{ fontSize: '32px', fontWeight: 700, color: 'var(--text-accent)' }}>
                          {parseFloat(statsData.total_revenue || 0).toLocaleString('ru-RU')} ₸
                        </div>
                      </div>
                      <div style={{ padding: '20px', background: 'var(--bg-page)', borderRadius: '8px' }}>
                        <div style={{ color: 'var(--text-secondary)', marginBottom: '10px' }}>Средний чек</div>
                        <div style={{ fontSize: '32px', fontWeight: 700 }}>
                          {parseFloat(statsData.avg_check || 0).toLocaleString('ru-RU')} ₸
                        </div>
                      </div>
                    </div>
                    {statsData.top_dishes && statsData.top_dishes.length > 0 && (
                      <>
                        <h3 style={{ marginBottom: '15px' }}>Топ блюд</h3>
                        <div style={{ border: '1px solid var(--border-color)', borderRadius: '8px', overflow: 'hidden' }}>
                          {statsData.top_dishes.map((dish: any, i: number) => (
                            <div
                              key={i}
                              style={{
                                padding: '15px',
                                borderBottom: '1px solid var(--border-color)',
                                display: 'flex',
                                justifyContent: 'space-between',
                                alignItems: 'center',
                              }}
                            >
                              <div>
                                <span style={{ color: 'var(--text-secondary)', marginRight: '10px' }}>#{i + 1}</span>
                                <span style={{ fontWeight: 600 }}>{dish.name}</span>
                              </div>
                              <div>
                                <span style={{ marginRight: '20px' }}>{dish.total_quantity} шт</span>
                                <span style={{ color: 'var(--text-accent)', fontWeight: 600 }}>
                                  {parseFloat(dish.total_revenue || 0).toLocaleString('ru-RU')} ₸
                                </span>
                              </div>
                            </div>
                          ))}
                        </div>
                      </>
                    )}
                  </>
                )}
              </div>
            </section>
          </div>
        )}
      </main>

      {/* Модальное окно: Добавить категорию */}
      {showCategoryModal && (
        <div id="categoryModal" className="modal" style={{ display: 'flex' }}>
          <div className="modal-content" style={{ maxWidth: '500px' }}>
            <span className="close-modal" onClick={() => setShowCategoryModal(false)}>&times;</span>
            <h2 style={{ marginBottom: '20px' }}>Добавить категорию</h2>
            <form id="categoryForm" onSubmit={handleCreateCategory}>
              <div style={{ marginBottom: '15px' }}>
                <label style={{ display: 'block', marginBottom: '5px', fontWeight: 600 }}>Название категории *</label>
                <input
                  type="text"
                  name="name"
                  value={newCategory.name}
                  onChange={(e) => setNewCategory({ name: e.target.value })}
                  required
                  style={{ width: '100%', padding: '10px', border: '1px solid var(--border-color)', borderRadius: '8px' }}
                />
              </div>
              <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
                <button
                  type="button"
                  onClick={() => setShowCategoryModal(false)}
                  style={{ padding: '10px 20px', background: 'white', border: '1px solid var(--border-color)', borderRadius: '8px', cursor: 'pointer' }}
                >
                  Отмена
                </button>
                <button type="submit" className="btn-primary">Создать</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Модальное окно: Добавить блюдо */}
      {showItemModal && (
        <div id="dishModal" className="modal" style={{ display: 'flex' }}>
          <div className="modal-content" style={{ maxWidth: '600px' }}>
            <span className="close-modal" onClick={() => setShowItemModal(false)}>&times;</span>
            <h2 style={{ marginBottom: '20px' }}>Добавить блюдо</h2>
            <form id="dishForm" onSubmit={handleCreateItem}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px' }}>
                <div style={{ gridColumn: '1 / -1' }}>
                  <label style={{ display: 'block', marginBottom: '5px', fontWeight: 600 }}>Название блюда *</label>
                  <input
                    type="text"
                    name="name"
                    value={newItem.name}
                    onChange={(e) => setNewItem({ ...newItem, name: e.target.value })}
                    required
                    style={{ width: '100%', padding: '10px', border: '1px solid var(--border-color)', borderRadius: '8px' }}
                  />
                </div>
                <div style={{ gridColumn: '1 / -1' }}>
                  <label style={{ display: 'block', marginBottom: '5px', fontWeight: 600 }}>Описание</label>
                  <textarea
                    name="description"
                    rows={3}
                    value={newItem.description}
                    onChange={(e) => setNewItem({ ...newItem, description: e.target.value })}
                    style={{ width: '100%', padding: '10px', border: '1px solid var(--border-color)', borderRadius: '8px' }}
                  />
                </div>
                <div>
                  <label style={{ display: 'block', marginBottom: '5px', fontWeight: 600 }}>Категория *</label>
                  <select
                    name="category_id"
                    value={newItem.category_id}
                    onChange={(e) => setNewItem({ ...newItem, category_id: parseInt(e.target.value) })}
                    required
                    id="dishCategorySelect"
                    style={{ width: '100%', padding: '10px', border: '1px solid var(--border-color)', borderRadius: '8px' }}
                  >
                    <option value={0}>Выберите категорию</option>
                    {menu.map((section) => (
                      <option key={section.category.id} value={section.category.id}>
                        {section.category.name}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label style={{ display: 'block', marginBottom: '5px', fontWeight: 600 }}>Цена (₸) *</label>
                  <input
                    type="number"
                    name="price"
                    value={newItem.price}
                    onChange={(e) => setNewItem({ ...newItem, price: e.target.value })}
                    required
                    min="0"
                    step="0.01"
                    style={{ width: '100%', padding: '10px', border: '1px solid var(--border-color)', borderRadius: '8px' }}
                  />
                </div>
                <div style={{ gridColumn: '1 / -1' }}>
                  <label style={{ display: 'block', marginBottom: '5px', fontWeight: 600 }}>Изображение</label>
                  <input
                    type="file"
                    name="image"
                    accept="image/*"
                    id="dishImageInput"
                    onChange={(e) => {
                      const file = e.target.files?.[0] || null;
                      setNewItem({ ...newItem, imageFile: file });
                    }}
                    style={{ width: '100%', padding: '10px', border: '1px solid var(--border-color)', borderRadius: '8px' }}
                  />
                  <input
                    type="text"
                    placeholder="Или укажите URL изображения"
                    value={newItem.image_url}
                    onChange={(e) => setNewItem({ ...newItem, image_url: e.target.value })}
                    style={{ width: '100%', padding: '10px', border: '1px solid var(--border-color)', borderRadius: '8px', marginTop: '10px' }}
                  />
                  {newItem.imageFile && (
                    <div id="imagePreview" style={{ marginTop: '10px' }}>
                      <img src={URL.createObjectURL(newItem.imageFile)} alt="Preview" style={{ maxWidth: '200px', maxHeight: '200px', borderRadius: '8px' }} />
                    </div>
                  )}
                </div>
              </div>
              <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end', marginTop: '20px' }}>
                <button
                  type="button"
                  onClick={() => setShowItemModal(false)}
                  style={{ padding: '10px 20px', background: 'white', border: '1px solid var(--border-color)', borderRadius: '8px', cursor: 'pointer' }}
                >
                  Отмена
                </button>
                <button type="submit" className="btn-primary">Создать</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Модальное окно: Добавить столик */}
      {showTableModal && (
        <div id="tableModal" className="modal" style={{ display: 'flex' }}>
          <div className="modal-content" style={{ maxWidth: '400px' }}>
            <span className="close-modal" onClick={() => setShowTableModal(false)}>&times;</span>
            <h2 style={{ marginBottom: '20px' }}>Добавить столик</h2>
            <form id="tableForm" onSubmit={handleCreateTable}>
              <div style={{ marginBottom: '15px' }}>
                <label style={{ display: 'block', marginBottom: '5px', fontWeight: 600 }}>Номер столика *</label>
                <input
                  type="text"
                  name="table_number"
                  value={newTable.table_number}
                  onChange={(e) => setNewTable({ table_number: e.target.value })}
                  required
                  style={{ width: '100%', padding: '10px', border: '1px solid var(--border-color)', borderRadius: '8px' }}
                />
              </div>
              <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
                <button
                  type="button"
                  onClick={() => setShowTableModal(false)}
                  style={{ padding: '10px 20px', background: 'white', border: '1px solid var(--border-color)', borderRadius: '8px', cursor: 'pointer' }}
                >
                  Отмена
                </button>
                <button type="submit" className="btn-primary">Создать</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Модальное окно: Добавить сотрудника */}
      {showStaffModal && (
        <div id="staffModal" className="modal" style={{ display: 'flex' }}>
          <div className="modal-content" style={{ maxWidth: '500px' }}>
            <span className="close-modal" onClick={() => setShowStaffModal(false)}>&times;</span>
            <h2 style={{ marginBottom: '20px' }}>Добавить сотрудника</h2>
            <form id="staffForm" onSubmit={handleCreateStaff}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px' }}>
                <div>
                  <label style={{ display: 'block', marginBottom: '5px', fontWeight: 600 }}>Имя *</label>
                  <input
                    type="text"
                    name="first_name"
                    value={newStaff.first_name}
                    onChange={(e) => setNewStaff({ ...newStaff, first_name: e.target.value })}
                    required
                    style={{ width: '100%', padding: '10px', border: '1px solid var(--border-color)', borderRadius: '8px' }}
                  />
                </div>
                <div>
                  <label style={{ display: 'block', marginBottom: '5px', fontWeight: 600 }}>Фамилия *</label>
                  <input
                    type="text"
                    name="last_name"
                    value={newStaff.last_name}
                    onChange={(e) => setNewStaff({ ...newStaff, last_name: e.target.value })}
                    required
                    style={{ width: '100%', padding: '10px', border: '1px solid var(--border-color)', borderRadius: '8px' }}
                  />
                </div>
                <div style={{ gridColumn: '1 / -1' }}>
                  <label style={{ display: 'block', marginBottom: '5px', fontWeight: 600 }}>Email *</label>
                  <input
                    type="email"
                    name="email"
                    value={newStaff.email}
                    onChange={(e) => setNewStaff({ ...newStaff, email: e.target.value })}
                    required
                    style={{ width: '100%', padding: '10px', border: '1px solid var(--border-color)', borderRadius: '8px' }}
                  />
                </div>
                <div style={{ gridColumn: '1 / -1' }}>
                  <label style={{ display: 'block', marginBottom: '5px', fontWeight: 600 }}>Пароль *</label>
                  <input
                    type="password"
                    name="password"
                    value={newStaff.password}
                    onChange={(e) => setNewStaff({ ...newStaff, password: e.target.value })}
                    required
                    style={{ width: '100%', padding: '10px', border: '1px solid var(--border-color)', borderRadius: '8px' }}
                  />
                </div>
              </div>
              <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end', marginTop: '20px' }}>
                <button
                  type="button"
                  onClick={() => setShowStaffModal(false)}
                  style={{ padding: '10px 20px', background: 'white', border: '1px solid var(--border-color)', borderRadius: '8px', cursor: 'pointer' }}
                >
                  Отмена
                </button>
                <button type="submit" className="btn-primary">Создать</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Модальное окно премиум-доступа */}
      {showPremiumModal && premiumModalData && (
        <div id="premiumModal" className="modal-overlay" style={{ display: 'flex' }} onClick={(e) => e.target === e.currentTarget && setShowPremiumModal(false)}>
          <div className="modal">
            <div className="modal-header">
              <h2 id="premiumModalTitle">
                {premiumModalData.limitType === 'tables' ? 'Лимит столиков достигнут' : 'Лимит категорий достигнут'}
              </h2>
              <span className="close" onClick={() => setShowPremiumModal(false)}>×</span>
            </div>
            <div className="modal-body">
              <div id="premiumModalContent">
                {premiumModalData.limitType === 'tables' ? (
                  <>
                    <p>Вы использовали все {premiumModalData.limit} столиков по бесплатному тарифу.</p>
                    <p>Для добавления более {premiumModalData.limit} столиков подключите премиум-доступ.</p>
                    <div className="premium-benefits">
                      <h3>Преимущества премиум-тарифа:</h3>
                      <ul>
                        <li>✅ До 50 столиков</li>
                        <li>✅ Неограниченные категории</li>
                        <li>✅ Расширенная аналитика</li>
                        <li>✅ Сохранение контактов клиентов</li>
                      </ul>
                    </div>
                  </>
                ) : (
                  <>
                    <p>Вы использовали все {premiumModalData.limit} категорий по бесплатному тарифу.</p>
                    <p>Для добавления более {premiumModalData.limit} категорий подключите премиум-доступ.</p>
                    <div className="premium-benefits">
                      <h3>Преимущества премиум-тарифа:</h3>
                      <ul>
                        <li>✅ Неограниченные категории</li>
                        <li>✅ До 50 столиков</li>
                        <li>✅ Расширенная аналитика</li>
                        <li>✅ Сохранение контактов клиентов</li>
                      </ul>
                    </div>
                  </>
                )}
              </div>
              <div className="modal-footer">
                <button onClick={() => setShowPremiumModal(false)} className="btn-secondary">Понятно</button>
                <button onClick={upgradeToPremium} className="btn-primary">Подключить премиум</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

// TableCard component
interface TableCardProps {
  table: Table;
  restaurantName: string;
  onDownloadQR: () => void;
  onViewMenu: () => void;
  onDelete: () => void;
}

const TableCard: React.FC<TableCardProps> = ({ table, restaurantName, onDownloadQR, onViewMenu, onDelete }) => {
  const [qrPreview, setQrPreview] = useState<string | null>(null);
  const [loadingQR, setLoadingQR] = useState(true);

  useEffect(() => {
    const loadQRPreview = async () => {
      try {
        const res = await qrApi.preview(table.id);
        if (res.success && res.qr_code) {
          setQrPreview(res.qr_code);
        }
      } catch (error) {
        console.error('Error loading QR preview:', error);
      } finally {
        setLoadingQR(false);
      }
    };
    loadQRPreview();
  }, [table.id]);

  return (
    <div className="table-card">
      <div className="table-number">№{table.table_number}</div>
      <div className="qr-placeholder" id={`qr-${table.id}`}>
        {loadingQR ? (
          <div style={{ fontSize: '14px', color: 'var(--text-secondary)' }}>Загрузка...</div>
        ) : qrPreview ? (
          <img src={qrPreview} alt="QR Code" />
        ) : (
          <span style={{ fontSize: '48px' }}>📱</span>
        )}
      </div>
      <button className="btn-primary" onClick={onDownloadQR} style={{ width: '100%', marginBottom: '10px' }}>
        📥 Скачать QR
      </button>
      <button
        onClick={onViewMenu}
        style={{
          width: '100%',
          padding: '10px',
          background: 'white',
          border: '1px solid var(--border-color)',
          borderRadius: '8px',
          cursor: 'pointer',
          marginBottom: '10px',
        }}
      >
        👁️ Просмотр меню
      </button>
      <button
        onClick={onDelete}
        style={{
          width: '100%',
          padding: '10px',
          background: '#E53935',
          color: 'white',
          border: 'none',
          borderRadius: '8px',
          cursor: 'pointer',
        }}
      >
        🗑️ Удалить
      </button>
    </div>
  );
};

export default AdminDashboard;
