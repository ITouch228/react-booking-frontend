import { memo } from 'react';
import { useNavigate } from 'react-router-dom';

const NotFoundPage = memo(function NotFoundPage() {
  const navigate = useNavigate();

  return (
    <section className='card pad' aria-label='Страница не найдена'>
      <h1 className='page-title'>Страница не найдена</h1>
      <p className='page-subtitle'>Такого раздела нет. Вернитесь на главную.</p>
      <div style={{ marginTop: 14 }}>
        <button
          className='btn btn-primary'
          type='button'
          onClick={() => navigate('/')}
        >
          На главную
        </button>
      </div>
    </section>
  );
});

export default NotFoundPage;
