// validation.js
export function validateTaskInput(value) {
  const errorEl = document.getElementById('error-msg');
  if (!value.trim()) {
    showError(errorEl, 'Task cannot be empty!');
    return false;
  }
  if (value.trim().length > 200) {
    showError(errorEl, 'Task must be under 200 characters.');
    return false;
  }
  clearError(errorEl);
  return true;
}

export function showError(el, msg) {
  el.textContent = msg;
  el.style.display = 'block';
  const input = document.getElementById('task-input');
  if (input) {
    input.setAttribute('aria-invalid', 'true');
  }
}

export function clearError(el) {
  el.textContent = '';
  el.style.display = 'none';
  const input = document.getElementById('task-input');
  if (input) {
    input.removeAttribute('aria-invalid');
  }
}
