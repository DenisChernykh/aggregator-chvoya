import Inputmask from 'inputmask';
import { validationConfig, DEV_MOCK_SUBMIT } from './dev.config';
import { Modals } from "./vgmodals/vgmodals";

export function runMasks() {
  if (typeof Inputmask === 'undefined') return;

  document.querySelectorAll('input[type="tel"]').forEach((input) => {
    Inputmask({
      mask: '+7 (999) 999-99-99',
    }).mask(input);
  });

  document.querySelectorAll('.js-digits-mask').forEach((input) => {
    Inputmask({
      alias: 'currency',
      allowMinus: false,
      digits: 0,
      groupSeparator: ' ',
      rightAlign: false,
    }).mask(input);
  });

  document.querySelectorAll('.js-numeric-mask').forEach((input) => {
    Inputmask({
      alias: 'numeric',
      allowMinus: false,
      rightAlign: false,
    }).mask(input);
  });
}

function getFormData(form) {
  const formData = new FormData(form);
  const data = {};

  for (const [key, value] of formData.entries()) {
    const field = form.elements.namedItem(key);
    const fields = field instanceof RadioNodeList ? Array.from(field) : [field];

    if (fields.some((item) => item?.hasAttribute?.('data-vgform-exclude'))) {
      continue;
    }

    if (key in data) {
      if (Array.isArray(data[key])) {
        data[key].push(value);
      } else {
        data[key] = [data[key], value];
      }
    } else {
      data[key] = value;
    }
  }

  form.querySelectorAll('input[type="checkbox"]').forEach((input) => {
    if (!input.name || input.hasAttribute('data-vgform-exclude')) return;

    if (!(input.name in data)) {
      data[input.name] = '';
    }
  });

  return data;
}

function validateForm(form) {
  let isValid = true;
  const validatedRadioNames = new Set();

  validatedRadioNames.clear();

  validationConfig.forEach(({ selector, rules }) => {
    form.querySelectorAll(selector).forEach((field) => {
      if (!shouldValidateField(field)) {
        return;
      }

      if (field.type === 'radio') {
        if (!field.name || validatedRadioNames.has(field.name)) {
          return;
        }

        validatedRadioNames.add(field.name);
      }

      clearFieldError(field);

      for (const rule of rules) {
        const passed = rule.test(field, form);

        if (!passed) {
          setFieldError(field, rule.message);
          isValid = false;
          break;
        }
      }
    });
  });

  return isValid;
}

async function submitForm(formData, form) {
  const action = form.dataset.action || form.getAttribute('action') || '';
  const method = (form.dataset.method || form.getAttribute('method') || 'POST').toUpperCase();
  const csrfToken = getCsrfToken();
  const successModal = form.dataset.successModal || form.dataset.modalSuccess || 'modalSuccess';
  const errorModal = form.dataset.errorModal || form.dataset.modalError || 'modalError';

  form.classList.add('loading');

  try {
    if (DEV_MOCK_SUBMIT) {
      await new Promise((resolve) => setTimeout(resolve, 500));
      console.log('Успех:', { action, method, csrfToken, formData });
      form.reset();
      openModalById(successModal);
      return;
    }

    const response = await fetch(action, {
      method,
      headers: {
        'Content-Type': 'application/json',
        'X-Requested-With': 'XMLHttpRequest',
        ...(csrfToken ? { 'X-CSRF-TOKEN': csrfToken } : {}),
      },
      body: JSON.stringify(formData),
    });

    if (!response.ok) {
      throw new Error(`Request failed with status ${response.status}`);
    }

    form.reset();
    openModalById(successModal);
  } catch (error) {
    console.error(error);
    openModalById(errorModal);
  } finally {
    form.classList.remove('loading');
  }
}

export function initForms() {
  document.querySelectorAll('.js-form-validator, [data-form-validator]').forEach((form) => {
    bindFieldListeners(form);

    form.addEventListener('submit', async (event) => {
      event.preventDefault();

      const isValid = validateForm(form);
      if (!isValid) return;

      const formData = getFormData(form);
      await submitForm(formData, form);
    });
  });
}

//  Helpers //

const openModalById = (id) => {
  const modal = Modals.getModal(id);
  if (modal) modal.open(true);
};

function getCsrfToken() {
  return document.querySelector('meta[name="csrf-token"]')?.getAttribute('content') ?? '';
}

function shouldValidateField(field) {
  return !(
    field.disabled ||
    isHiddenField(field) ||
    field.hasAttribute('data-vgform-novalid') ||
    field.hasAttribute('data-vgform-exclude')
  );
}

function isHiddenField(field) {
  return field.type === 'hidden' || field.hasAttribute('hidden');
}

// Ошибки в инпуты //

function clearFieldError(field) {
  field.classList.remove('error');

  const wrapper = field.closest('.input, .checkbox') || field.parentElement;
  wrapper?.classList.remove('error');

  const error = wrapper?.querySelector(':scope > .error');
  if (error) {
    error.remove();
  }
}

function setFieldError(field, message) {
  clearFieldError(field);

  field.classList.add('error');

  const wrapper = field.closest('.input, .checkbox') || field.parentElement;
  if (!wrapper) return;

  wrapper.classList.add('error');

  if (field.type === 'checkbox') {
    return;
  }

  const error = document.createElement('span');
  error.className = 'error';
  error.textContent = message;

  wrapper.append(error);
}

function bindFieldListeners(form) {
  form.querySelectorAll('input, textarea, select').forEach((field) => {
    if (isHiddenField(field) || field.hasAttribute('data-vgform-exclude')) {
      return;
    }

    const eventName = field.type === 'checkbox' ? 'change' : 'input';

    field.addEventListener(eventName, () => {
      clearFieldError(field);
    });
  });
}

export function initDev() {
  runMasks();
  initForms();
}

/// 1 - Вызвать   runMasks(); initForms(); в index.js
/// 2 - На формы добавить атрибуты:
///     class="js-form-validator"
///     data-action="/ajax/form"
///     data-method="POST"
///     data-success-modal="modalSuccess"
///     data-error-modal="modalError"

// data-vgform-novalid — поле участвует в форме и отправляется, но не валидируется.
// data-vgform-exclude — поле вообще не участвует ни в валидации, ни в payload.
// input[type="hidden"] — не валидируем и не учитываем в пустой форме.
