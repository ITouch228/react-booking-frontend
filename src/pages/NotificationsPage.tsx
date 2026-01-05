import { memo } from 'react';

const NotificationsPage = memo(function NotificationsPage() {
  return (
    <div className='stack-lg'>
      <div>
        <h1 className='page-title'>Ошибки и уведомления</h1>
        <p className='page-subtitle'>
          Каждое сообщение выделено блоком с иконкой и цветом.
        </p>
      </div>

      <section className='stack' aria-label='Сообщения'>
        <div className='alert err' role='alert'>
          <i
            className='fa-solid fa-triangle-exclamation'
            aria-hidden='true'
          ></i>
          <div>
            <h3>Ошибка оплаты</h3>
            <p>
              Не удалось списать средства. Проверьте карту или попробуйте позже.
            </p>
          </div>
        </div>

        <div className='alert warn' role='status' aria-live='polite'>
          <i className='fa-solid fa-clock' aria-hidden='true'></i>
          <div>
            <h3>Слот почти занят</h3>
            <p>
              Этот интервал доступен ограниченное время. Завершите выбор, чтобы
              закрепить бронь.
            </p>
          </div>
        </div>

        <div className='alert ok' role='status' aria-live='polite'>
          <i className='fa-solid fa-circle-check' aria-hidden='true'></i>
          <div>
            <h3>Бронирование создано</h3>
            <p>
              Детали отправлены на email (демо-текст). Можно перейти в профиль и
              увидеть запись.
            </p>
          </div>
        </div>

        <div className='alert info' role='status' aria-live='polite'>
          <i className='fa-solid fa-circle-info' aria-hidden='true'></i>
          <div>
            <h3>Подсказка</h3>
            <p>
              Интерфейс адаптивен: попробуйте изменить ширину окна или открыть
              на смартфоне.
            </p>
          </div>
        </div>
      </section>
    </div>
  );
});

export default NotificationsPage;
