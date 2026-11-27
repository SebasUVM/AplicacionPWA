import { escapeHtml, showToast } from './main.js';

const validators = {
  nombre(value) {
    const clean = value.trim();
    if (!clean) return 'Introduce tu nombre completo.';
    if (clean.length < 3) return 'El nombre debe tener al menos 3 caracteres.';
    if (!/^[a-zA-ZÀ-ÿ\u00f1\u00d1\s.'-]+$/.test(clean)) {
      return 'Usa únicamente letras y espacios válidos.';
    }
    return '';
  },
  correo(value) {
    const clean = value.trim();
    if (!clean) return 'Introduce un correo electrónico de contacto.';
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(clean)) {
      return 'El formato del correo electrónico no es válido.';
    }
    return '';
  },
  telefono(value) {
    const clean = value.trim();
    if (!clean) return '';
    const digits = clean.replace(/[\s+()-]/g, '');
    if (!/^\d{8,15}$/.test(digits)) {
      return 'Si incluyes teléfono, debe contener entre 8 y 15 dígitos.';
    }
    return '';
  },
  asunto(value) {
    if (!value) return 'Selecciona el motivo de tu consulta.';
    return '';
  },
  mensaje(value) {
    const clean = value.trim();
    if (!clean) return 'Escribe los detalles de tu consulta.';
    if (clean.length < 20) return 'El mensaje debe incluir al menos 20 caracteres.';
    if (clean.length > 600) return 'El mensaje no puede superar los 600 caracteres.';
    return '';
  },
  privacidad(checked) {
    if (!checked) return 'Debes aceptar la política de privacidad para enviar el formulario.';
    return '';
  },
};

function setFieldError(fieldWrapper, inputEl, errorEl, errorMessage) {
  const hasError = Boolean(errorMessage);
  fieldWrapper.classList.toggle('field--error', hasError);
  if (inputEl) inputEl.setAttribute('aria-invalid', String(hasError));
  if (errorEl) {
    errorEl.hidden = !hasError;
    errorEl.textContent = errorMessage;
  }
}

function initContactForm() {
  const form = document.querySelector('[data-contact-form]');
  const confirmationCard = document.querySelector('[data-contact-confirmation]');
  const charCounter = document.querySelector('[data-char-count]');
  if (!form) return;

  const touched = new Set();

  const validateSingle = (name) => {
    const input = form.elements[name];
    if (!input) return true;
    const wrapper = input.closest('.field');
    const errorEl = form.querySelector(`[data-error-for="${name}"]`);
    const val = input.type === 'checkbox' ? input.checked : input.value;
    const errorMessage = validators[name] ? validators[name](val) : '';
    if (wrapper) setFieldError(wrapper, input, errorEl, errorMessage);
    return !errorMessage;
  };

  ['nombre', 'correo', 'telefono', 'asunto', 'mensaje', 'privacidad'].forEach((name) => {
    const input = form.elements[name];
    if (!input) return;

    const eventName = input.type === 'checkbox' || input.tagName === 'SELECT' ? 'change' : 'input';

    input.addEventListener('blur', () => {
      touched.add(name);
      validateSingle(name);
    });

    input.addEventListener(eventName, () => {
      if (name === 'mensaje' && charCounter) {
        charCounter.textContent = `${input.value.length} / 600`;
      }
      if (touched.has(name) || input.type === 'checkbox') {
        validateSingle(name);
      }
    });
  });

  form.addEventListener('submit', (event) => {
    event.preventDefault();

    const fieldNames = ['nombre', 'correo', 'telefono', 'asunto', 'mensaje', 'privacidad'];
    let firstInvalid = null;

    fieldNames.forEach((name) => {
      touched.add(name);
      const valid = validateSingle(name);
      if (!valid && !firstInvalid) {
        firstInvalid = form.elements[name];
      }
    });

    if (firstInvalid) {
      firstInvalid.focus();
      showToast('Revisa los campos marcados antes de enviar.');
      return;
    }

    const refCode = `MSG-${Math.floor(1000 + Math.random() * 9000)}`;
    const nombre = form.elements.nombre.value.trim();
    const correo = form.elements.correo.value.trim();
    const asuntoText = form.elements.asunto.options[form.elements.asunto.selectedIndex].text;

    if (confirmationCard) {
      form.hidden = true;
      confirmationCard.hidden = false;
      confirmationCard.innerHTML = `
        <div class="status-banner" role="status">
          <strong>Consulta recibida · Referencia ${refCode}</strong>
          <p>
            Gracias, <strong>${escapeHtml(nombre)}</strong>. Hemos registrado tu mensaje sobre
            <em>${escapeHtml(asuntoText)}</em> y responderemos a <strong>${escapeHtml(correo)}</strong>
            en un plazo máximo de 24 horas hábiles.
          </p>
        </div>
        <div style="margin-top: 18px;">
          <button type="button" class="btn btn--secondary" data-new-message>
            Enviar otra consulta
          </button>
        </div>
      `;

      confirmationCard.querySelector('[data-new-message]').addEventListener('click', () => {
        form.reset();
        touched.clear();
        if (charCounter) charCounter.textContent = '0 / 600';
        confirmationCard.hidden = true;
        form.hidden = false;
      });
    }

    showToast(`Consulta ${refCode} enviada correctamente.`);
  });
}

document.addEventListener('DOMContentLoaded', initContactForm);
