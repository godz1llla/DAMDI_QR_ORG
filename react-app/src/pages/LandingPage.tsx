import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import './LandingPage.css';

// FAQ Item Component
interface FAQItemProps {
  question: string;
  answer: string;
}

const FAQItem: React.FC<FAQItemProps> = ({ question, answer }) => {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className={`faq-item ${isOpen ? 'active' : ''}`} onClick={() => setIsOpen(!isOpen)}>
      <div className="faq-question">
        <span>{question}</span>
        <span className="faq-icon">{isOpen ? '−' : '+'}</span>
      </div>
      {isOpen && (
        <div className="faq-answer">
          <p>{answer}</p>
        </div>
      )}
    </div>
  );
};

function LandingPage() {
  return (
    <div className="landing-page">
      <header className="main-header">
        <div className="container header-content">
          <Link to="/" className="logo">
            <div className="logo-icon">QR</div>
            <span className="logo-text">Dámdi QR</span>
          </Link>
          <div className="header-actions">
            <Link to="/login" className="btn btn-secondary">Войти</Link>
            <Link to="/login" className="btn btn-primary">Начать бесплатно</Link>
          </div>
        </div>
      </header>

      <main>
        {/* Hero Section */}
        <section className="hero">
          <div className="container">
            <div className="special-offer">🎉 Специальное предложение: 3 месяца Premium бесплатно</div>
            <h1>QR-меню нового поколения для вашего ресторана</h1>
            <p>Увеличьте продажи на 30%, сократите время ожидания и порадуйте гостей современным цифровым меню с мгновенным заказом через QR-код</p>
            <div className="hero-buttons">
              <Link to="/login" className="btn btn-primary btn-large">Попробовать бесплатно →</Link>
              <a href="#steps" className="btn btn-secondary btn-large">Как это работает</a>
            </div>
            <div className="social-proof">
              <div className="proof-item"><span className="value">500+</span><br />Ресторанов</div>
              <div className="proof-item"><span className="value">50K+</span><br />Заказов в день</div>
              <div className="proof-item"><span className="value">4.9 ★</span><br />Рейтинг</div>
              <div className="proof-item"><span className="value">24/7</span><br />Поддержка</div>
            </div>
          </div>
        </section>

        {/* Features Section */}
        <section className="features">
          <div className="container">
            <h2>Все что нужно для современного ресторана</h2>
            <p className="section-subtitle">Мощный функционал для управления меню, заказами и аналитикой</p>
            <div className="features-grid">
              <div className="feature-card">
                <div className="feature-icon" style={{ backgroundColor: '#FFF5EB', color: '#F37321' }}>📱</div>
                <h3>QR-меню за 5 минут</h3>
                <p>Создайте цифровое меню и сгенерируйте QR-коды для каждого столика за несколько кликов</p>
              </div>
              <div className="feature-card">
                <div className="feature-icon" style={{ backgroundColor: '#EAF2FE', color: '#3682F4' }}>👍</div>
                <h3>Заказ без регистрации</h3>
                <p>Гости сканируют QR-код и сразу попадают в меню - никаких установок приложений</p>
              </div>
              <div className="feature-card">
                <div className="feature-icon" style={{ backgroundColor: '#E6F6E9', color: '#34A853' }}>⏱</div>
                <h3>Real-time обновления</h3>
                <p>Заказы моментально появляются на доске официантов с автообновлением</p>
              </div>
              <div className="feature-card">
                <div className="feature-icon" style={{ backgroundColor: '#F8E6FE', color: '#8A2BE2' }}>📈</div>
                <h3>Рост продаж</h3>
                <p>Красивые фото блюд и удобный интерфейс увеличивают средний чек на 20-30%</p>
              </div>
              <div className="feature-card">
                <div className="feature-icon" style={{ backgroundColor: '#FEE6E6', color: '#E53935' }}>🛡️</div>
                <h3>Безопасность данных</h3>
                <p>Все данные хранятся на защищенных серверах с регулярным резервным копированием</p>
              </div>
              <div className="feature-card">
                <div className="feature-icon" style={{ backgroundColor: '#E6F0F6', color: '#2D658C' }}>📊</div>
                <h3>Аналитика и отчеты</h3>
                <p>Отслеживайте популярные блюда, выручку и статистику заказов в реальном времени</p>
              </div>
            </div>
          </div>
        </section>

        {/* Steps Section */}
        <section className="steps" id="steps">
          <div className="container">
            <h2>Запустите QR-меню за 4 простых шага</h2>
            <p className="section-subtitle">Никаких сложных настроек - начните принимать заказы уже сегодня</p>
            <div className="steps-container">
              <div className="step-item">
                <div className="icon">1</div>
                <h3>Регистрация</h3>
                <p>Создайте аккаунт и добавьте информацию о вашем заведении</p>
              </div>
              <div className="step-item">
                <div className="icon">2</div>
                <h3>Создайте меню</h3>
                <p>Добавьте категории, блюда, фото и цены за несколько минут</p>
              </div>
              <div className="step-item">
                <div className="icon">3</div>
                <h3>Разместите QR-коды</h3>
                <p>Сгенерируйте и распечатайте QR-коды для каждого столика</p>
              </div>
              <div className="step-item">
                <div className="icon">4</div>
                <h3>Начните принимать заказы</h3>
                <p>Гости сканируют, заказывают, а вы видите все на доске заказов</p>
              </div>
            </div>
          </div>
        </section>

        {/* Pricing Section */}
        <section className="pricing">
          <div className="container">
            <h2>Начните бесплатно, растите вместе с нами</h2>
            <p className="section-subtitle">Выберите тариф, который подходит вашему бизнесу</p>
            <div className="pricing-grid">
              <div className="price-card">
                <div className="tag tag-gray">Навсегда</div>
                <h3>Бесплатный</h3>
                <div className="price">0 ₸ <span>/ месяц</span></div>
                <p className="description">Идеально для небольших кафе и баров</p>
                <Link to="/login" className="btn btn-dark">Начать бесплатно</Link>
                <ul className="features-list">
                  <li><span className="check">✓</span> До 10 столиков</li>
                  <li><span className="check">✓</span> До 5 собственных категорий</li>
                  <li><span className="check">✓</span> Неограниченное количество блюд</li>
                  <li><span className="check">✓</span> Базовая аналитика</li>
                  <li><span className="check">✓</span> QR-коды для столиков</li>
                  <li><span className="check">✓</span> Мобильное меню для гостей</li>
                  <li><span className="check">✓</span> Email поддержка</li>
                  <li style={{ color: '#ccc' }}><span className="cross">✗</span> Расширенная аналитика</li>
                  <li style={{ color: '#ccc' }}><span className="cross">✗</span> До 50+ столиков</li>
                  <li style={{ color: '#ccc' }}><span className="cross">✗</span> Приоритетная поддержка 24/7</li>
                </ul>
              </div>
              <div className="price-card popular">
                <div className="tag tag-orange">Популярный</div>
                <h3>👑 Premium</h3>
                <div className="price">9 990 ₸ <span>/ месяц</span></div>
                <p className="description">Для ресторанов с большим потоком гостей</p>
                <Link to="/login" className="btn btn-primary">Попробовать 3 месяца бесплатно</Link>
                <ul className="features-list">
                  <li><span className="check">✓</span> До 50+ столиков</li>
                  <li><span className="check">✓</span> Неограниченное количество категорий</li>
                  <li><span className="check">✓</span> Неограниченное количество блюд</li>
                  <li><span className="check">✓</span> Расширенная аналитика</li>
                  <li><span className="check">✓</span> QR-коды для столиков</li>
                  <li><span className="check">✓</span> Мобильное меню для гостей</li>
                  <li><span className="check">✓</span> Приоритетная поддержка 24/7</li>
                  <li><span className="check">✓</span> Персональный менеджер</li>
                  <li><span className="check">✓</span> Кастомизация дизайна</li>
                  <li><span className="check">✓</span> API для интеграций</li>
                </ul>
              </div>
            </div>
          </div>
        </section>

        {/* Testimonials Section */}
        <section className="testimonials">
          <div className="container">
            <h2>Что говорят наши клиенты</h2>
            <div className="testimonials-grid">
              <div className="testimonial-card">
                <div className="stars">★★★★★</div>
                <p className="quote">"После внедрения Dámdi QR наш средний чек вырос на 25%, а время ожидания заказов сократилось вдвое!"</p>
                <div className="author">
                  <span className="name">Асан Ибрагимов</span>
                  <span className="company">Ресторан "Алатау"</span>
                </div>
              </div>
              <div className="testimonial-card">
                <div className="stars">★★★★★</div>
                <p className="quote">"Очень удобно! Гости довольны, что могут заказать не дожидаясь официанта. А мы экономим на печати меню."</p>
                <div className="author">
                  <span className="name">Айгуль Нурланова</span>
                  <span className="company">Кафе "Баурсак"</span>
                </div>
              </div>
              <div className="testimonial-card">
                <div className="stars">★★★★★</div>
                <p className="quote">"Простой интерфейс, быстрая настройка, отличная поддержка. Рекомендую всем коллегам по отрасли!"</p>
                <div className="author">
                  <span className="name">Ержан Смагулов</span>
                  <span className="company">Бистро "Самса"</span>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* FAQ Section */}
        <section className="faq" style={{ backgroundColor: 'var(--bg-section-light)' }}>
          <div className="container">
            <h2>Частые вопросы</h2>
            <div className="faq-list">
              <FAQItem 
                question="Нужно ли устанавливать приложение клиентам?"
                answer="Нет, установка приложения не требуется. Ваши гости просто сканируют QR-код на столике и открывают меню прямо в браузере на своем смартфоне. Это работает на любом устройстве — iPhone, Android или планшете."
              />
              <FAQItem 
                question="Как быстро можно запустить систему?"
                answer="Запуск займет всего 10-15 минут! После регистрации вы создаете меню, добавляете категории и блюда, затем генерируете QR-коды для ваших столиков. Готовые QR-коды можно скачать и распечатать."
              />
              <FAQItem 
                question="Можно ли изменить цены и меню в любое время?"
                answer="Да, конечно! Вы можете редактировать меню, изменять цены, добавлять или удалять блюда в любое время через админ-панель. Все изменения применяются моментально и сразу видны вашим гостям."
              />
              <FAQItem 
                question="Что делать, если интернет пропадет?"
                answer="Меню продолжит работать! Гости могут просматривать меню даже без интернета после первой загрузки страницы. Браузер сохраняет данные локально. Заказы будут обработаны, как только интернет вернется."
              />
              <FAQItem 
                question="Как обрабатываются изображения блюд?"
                answer="Все изображения автоматически оптимизируются и конвертируются в современный формат WebP для быстрой загрузки. Это позволяет экономить трафик ваших гостей и обеспечивает быстрое отображение меню даже на медленном интернете."
              />
            </div>
          </div>
        </section>

        {/* Final CTA Section */}
        <section style={{ padding: 0 }}>
          <div className="container">
            <div className="cta">
              <h2>Готовы начать?</h2>
              <p>Присоединяйтесь к сотням ресторанов, которые уже используют Dámdi QR</p>
              <Link to="/login" className="btn btn-light">Начать бесплатно →</Link>
            </div>
          </div>
        </section>
      </main>

      <footer className="main-footer">
        <div className="container">
          <div className="footer-grid">
            <div className="footer-about">
              <Link to="/" className="logo">
                <div className="logo-icon">QR</div>
                <span className="logo-text">Dámdi QR</span>
              </Link>
              <p>Современные цифровые меню для ресторанов Казахстана</p>
            </div>
            <div className="footer-col">
              <h4>Продукт</h4>
              <a href="#">Возможности</a>
              <a href="#">Тарифы</a>
              <a href="#">Отзывы</a>
            </div>
            <div className="footer-col">
              <h4>Компания</h4>
              <a href="#">О нас</a>
              <a href="#">Блог</a>
              <a href="#">Карьера</a>
            </div>
            <div className="footer-col">
              <h4>Поддержка</h4>
              <a href="#">Справка</a>
              <a href="#">Контакты</a>
              <a href="#">+7 777 123 4567</a>
            </div>
          </div>
          <div className="footer-bottom">
            <span>© 2025 Dámdi QR. Все права защищены.</span>
            <div className="footer-bottom-links">
              <a href="#">Политика конфиденциальности</a>
              <a href="#">Условия использования</a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}

export default LandingPage;

