export const DEV_MOCK_SUBMIT = false;

export const validationConfig = [
  {
    selector: 'input[type="text"]',
    rules: [
      {
        test: (field) => field.value.trim().length > 0,
        message: 'Поле должно быть заполнено',
      },
      {
        test: (field) => field.value.trim().length >= 2,
        message: 'Минимум 2 символа',
      },
    ],
  },
  {
    selector: 'input[type="email"]',
    rules: [
      {
        test: (field) => field.value.trim().length > 0,
        message: 'Поле должно быть заполнено',
      },
      {
        test: (field) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(field.value.trim()),
        message: 'Введите корректный email',
      },
    ],
  },
  {
    selector: 'input[type="tel"]',
    rules: [
      {
        test: (field) => field.value.trim().length > 0,
        message: 'Поле должно быть заполнено',
      },
      {
        test: (field) => getDigits(field.value).length >= 11,
        message: 'Номер телефона должен содержать 11 цифр',
      },
    ],
  },
  {
    selector: 'input[type="number"]',
    rules: [
      {
        test: (field) => field.value.trim().length > 0,
        message: 'Поле должно быть заполнено',
      },
    ],
  },
  {
    selector: 'input[type="url"]',
    rules: [
      {
        test: (field) => field.value.trim().length > 0,
        message: 'Поле должно быть заполнено',
      },
      {
        test: (field) => {
          try {
            new URL(field.value.trim());
            return true;
          } catch {
            return false;
          }
        },
        message: 'Введите корректную ссылку',
      },
    ],
  },
  {
    selector: 'input[type="date"]',
    rules: [
      {
        test: (field) => field.value.trim().length > 0,
        message: 'Поле должно быть заполнено',
      },
    ],
  },
  {
    selector: 'input[type="time"]',
    rules: [
      {
        test: (field) => field.value.trim().length > 0,
        message: 'Поле должно быть заполнено',
      },
    ],
  },
  {
    selector: 'input[type="checkbox"]',
    rules: [
      {
        test: (field) => field.checked,
        message: 'Поле должно быть заполнено',
      },
    ],
  },
  {
    selector: 'input[type="radio"]',
    rules: [
      {
        test: (field, form) => {
          if (!field.name) return field.checked;
          return !!form.querySelector(`input[type="radio"][name="${field.name}"]:checked`);
        },
        message: 'Поле должно быть заполнено',
      },
    ],
  },
];

function getDigits(value) {
  return String(value || '').replace(/\D/g, '');
}