import { memo, useCallback, useRef, useState, type FormEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import { useApiClient } from '../api/apiClient';
import { toast } from 'react-toastify';
import type { FormErrors } from '../types';

const SignUpPage = memo(function SignUpPage() {
  const navigate = useNavigate();

  const { apiFetch } = useApiClient();
  const [handleSignUpLoading, setHandleSignUpLoading] =
    useState<boolean>(false);
  const [handleSignUperror, setHandleSignUpError] = useState<string | null>(
    null,
  );
  const [formErrors, setFormErrors] = useState<{
    name?: string;
    email?: string;
    password?: string;
    passwordConfirm?: string;
  }>({
    email: '',
    password: '',
  });
  const nameRef = useRef<HTMLInputElement>(null);
  const emailRef = useRef<HTMLInputElement>(null);
  const passRef = useRef<HTMLInputElement>(null);
  const passconfRef = useRef<HTMLInputElement>(null);

  // валидация формы
  const validateForm = useCallback(() => {
    let isValid = true;
    const errors: FormErrors = {};

    const name = nameRef.current?.value;
    if (!name) {
      errors.name = 'Имя обязательно.';
      isValid = false;
    }

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

    const passwordConfirm = passconfRef.current?.value;
    if (!passwordConfirm) {
      errors.passwordConfirm = 'Повторите пароль.';
      isValid = false;
    } else if (passwordConfirm !== password) {
      errors.passwordConfirm = 'Пароли не совпадают.';
      isValid = false;
    }

    setFormErrors(errors);
    return isValid;
  }, []);

  // запрос на регистрацию
  const handleSignUp = useCallback(
    async (e: FormEvent) => {
      e.preventDefault();
      if (!validateForm()) return;

      try {
        setHandleSignUpLoading(true);
        setHandleSignUpError(null);

        const name = nameRef.current?.value;
        const email = emailRef.current?.value;
        const password = passRef.current?.value;

        await apiFetch(
          '/auth/register',
          {
            method: 'POST',
            body: JSON.stringify({
              first_name: '',
              second_name: '',
              email: email,
              username: name,
              password: password,
            }),
          },
          { auth: false },
        );

        setHandleSignUpLoading(false);
        toast.success('Вы успешно зарегистрировались!');

        navigate('/login');
      } catch (err) {
        setHandleSignUpLoading(false);

        if (err instanceof Error) {
          const message = err.message;

          if (message.includes('Wrong email or password')) {
            setHandleSignUpError(
              'Неверный логин или пароль. Пожалуйста, проверьте введенные данные.',
            );
          } else {
            setHandleSignUpError(message);
          }
        }
      }
    },
    [nameRef, emailRef, passRef, apiFetch, navigate, validateForm],
  );

  return (
    <section className='stack' aria-label='Регистрация'>
      <div>
        <h1 className='page-title'>Регистрация</h1>
        <p className='page-subtitle'>
          Аккуратная форма: имя, email, пароль и подтверждение.
        </p>
      </div>

      <div className='card pad'>
        <form className='form' onSubmit={handleSignUp}>
          <div className='form-row'>
            <div className='field'>
              <label htmlFor='su-name'>Имя</label>
              <input
                ref={nameRef}
                id='su-name'
                className='control'
                type='text'
                placeholder='Мария'
                required
              />
              {formErrors.name && (
                <div className='error'>{formErrors.name}</div>
              )}
            </div>
            <div className='field'>
              <label htmlFor='su-email'>Email</label>
              <input
                ref={emailRef}
                id='su-email'
                className='control'
                type='email'
                placeholder='name@example.com'
                autoComplete='email'
                required
              />
              {formErrors.email && (
                <div className='error'>{formErrors.email}</div>
              )}
            </div>
          </div>
          <div className='form-row'>
            <div className='field'>
              <label htmlFor='su-pass'>Пароль</label>
              <input
                ref={passRef}
                id='su-pass'
                className='control'
                type='password'
                placeholder='••••••••'
                autoComplete='new-password'
                required
              />
              {formErrors.password && (
                <div className='error'>{formErrors.password}</div>
              )}
            </div>
            <div className='field'>
              <label htmlFor='su-pass2'>Подтверждение</label>
              <input
                ref={passconfRef}
                id='su-pass2'
                className='control'
                type='password'
                placeholder='••••••••'
                autoComplete='new-password'
                required
              />
              {formErrors.passwordConfirm && (
                <div className='error'>{formErrors.passwordConfirm}</div>
              )}
            </div>
          </div>

          {handleSignUperror && (
            <div className='error-message'>
              <p>{handleSignUperror}</p>
            </div>
          )}

          <button
            className='btn btn-primary btn-block'
            type='submit'
            disabled={handleSignUpLoading}
          >
            {handleSignUpLoading ? (
              'Загрузка...'
            ) : (
              <>
                <i className='fa-solid fa-check' aria-hidden='true'></i>
                Создать аккаунт
              </>
            )}
          </button>

          <button
            className='btn btn-ghost btn-block'
            type='button'
            onClick={() => navigate('/login')}
          >
            <i className='fa-solid fa-arrow-left' aria-hidden='true'></i>
            Уже есть аккаунт? Войти
          </button>
        </form>
      </div>
    </section>
  );
});

export default SignUpPage;
