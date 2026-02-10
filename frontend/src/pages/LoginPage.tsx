import { memo, useCallback, useRef, useState, type FormEvent } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useApiClient } from '../api/apiClient';
import useAuth from '../hooks/useAuth';
import { toast } from 'react-toastify';
import type { FormErrors, LoginPayload } from '../types';

const LoginPage = memo(function LoginPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const next = searchParams.get('next');

  const { apiFetch } = useApiClient();
  const { login } = useAuth();
  const [handleLoginLoading, setHandleLoginLoading] = useState<boolean>(false);
  const [handleLoginError, setHandleLoginError] = useState<string | null>(null);
  const [formErrors, setFormErrors] = useState<FormErrors>({
    email: '',
    password: '',
  });
  const emailRef = useRef<HTMLInputElement>(null);
  const passRef = useRef<HTMLInputElement>(null);

  // валидация формы
  const validateForm = useCallback(() => {
    let isValid = true;
    const errors: Pick<FormErrors, 'email' | 'password'> = {};

    const email = emailRef.current?.value;
    if (!email) {
      errors.email = 'Email обязателен.';
      isValid = false;
    } else if (!/\S+@\S+\.\S+/.test(email)) {
      errors.email = 'Неверный формат email.';
      isValid = false;
    }

    const password = passRef.current?.value;
    if (!password) {
      errors.password = 'Пароль обязателен.';
      isValid = false;
    } else if (password.length < 6) {
      errors.password = 'Пароль должен содержать хотя бы 6 символов.';
      isValid = false;
    }

    setFormErrors(errors);
    return isValid;
  }, []);

  // логин запрос
  const handleLogin = useCallback(
    async (e: FormEvent) => {
      e.preventDefault();
      if (!validateForm()) return;

      try {
        setHandleLoginLoading(true);
        setHandleLoginError(null);

        const email = emailRef.current?.value;
        const password = passRef.current?.value;

        const data: LoginPayload = await apiFetch(
          '/auth/login',
          {
            method: 'POST',
            body: JSON.stringify({ email: email, password: password }),
          },
          { auth: false },
        );

        login(data);
        setHandleLoginLoading(false);
        toast.success('Вы успешно вошли!');

        const path = next ? next : '/profile';
        console.log(next);
        navigate(path);
      } catch (err) {
        setHandleLoginLoading(false);

        if (err instanceof Error) {
          const message = err.message;

          console.log(message);

          if (message.includes('Wrong email or password')) {
            setHandleLoginError(
              'Неверный логин или пароль. Пожалуйста, проверьте введенные данные.',
            );
          } else if (message.includes('Failed to fetch')) {
            setHandleLoginError(
              'Произошла ошибка. Пожалуйста, попробуйте повторить позже',
            );
          } else {
            setHandleLoginError(message);
          }
        }
      }
    },
    [emailRef, passRef, apiFetch, login, navigate, next, validateForm],
  );

  return (
    <section className='stack' aria-label='Авторизация'>
      <div>
        <h1 className='page-title'>Вход</h1>
        <p className='page-subtitle'>
          Форма с удобными полями, отступами и крупными кнопками.
        </p>
      </div>

      <div className='card pad'>
        <form className='form' onSubmit={handleLogin}>
          <div className='field'>
            <label htmlFor='login-email'>Логин или email</label>
            <input
              ref={emailRef}
              id='login-email'
              className='control'
              type='email'
              placeholder='name@example.com'
              autoComplete='email'
              inputMode='email'
              required
            />
            {formErrors.email && (
              <div className='error'>{formErrors.email}</div>
            )}
          </div>

          <div className='field'>
            <label htmlFor='login-pass'>Пароль</label>
            <input
              ref={passRef}
              id='login-pass'
              className='control'
              type='password'
              placeholder='••••••••'
              autoComplete='current-password'
              required
            />
            {formErrors.password && (
              <div className='error'>{formErrors.password}</div>
            )}
          </div>

          {handleLoginError && (
            <div className='error-message'>
              <p>{handleLoginError}</p>
            </div>
          )}

          <button
            className='btn btn-primary btn-block'
            type='submit'
            disabled={handleLoginLoading}
          >
            {handleLoginLoading ? (
              'Загрузка...'
            ) : (
              <>
                <i
                  className='fa-solid fa-right-to-bracket'
                  aria-hidden='true'
                ></i>{' '}
                Войти
              </>
            )}
          </button>

          <div className='divider'>или</div>

          <button
            className='btn btn-ghost btn-block'
            type='button'
            onClick={() => navigate('/signup')}
          >
            <i className='fa-solid fa-user-plus' aria-hidden='true'></i>
            Перейти к регистрации
          </button>
        </form>
      </div>
    </section>
  );
});

export default LoginPage;
