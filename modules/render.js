// render.js

export function escapeHTML(str) {
  return str.replace(/[&<>"']/g, tag => ({
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#39;'
  }[tag]));
}

export function renderTaskList(taskListElement, tasks, editingTaskId = null) {
  taskListElement.innerHTML = ''; // clear existing
  
  if (tasks.length === 0) {
    const emptyContainer = document.createElement('div');
    emptyContainer.className = 'empty-state';
    emptyContainer.innerHTML = `
      <svg class="empty-icon" viewBox="0 0 24 24" width="80" height="80" aria-hidden="true">
        <path fill="currentColor" d="M19 3h-4.18C14.4 1.84 13.3 1 12 1c-1.3 0-2.4.84-2.82 2H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm-7 0c.55 0 1 .45 1 1s-.45 1-1 1-1-.45-1-1 .45-1 1-1zm0 15H7v-2h5v2zm4-4H7v-2h9v2zm0-4H7V8h9v2z"/>
      </svg>
      <p class="empty-message">No tasks yet. Add one above!</p>
    `;
    taskListElement.appendChild(emptyContainer);
    return;
  }
  
  const fragment = document.createDocumentFragment();
  
  tasks.forEach(task => {
    const li = document.createElement('li');
    li.className = `task ${task.completed ? 'completed' : ''} ${task.id === editingTaskId ? 'editing' : ''}`;
    li.dataset.id = task.id;
    
    if (task.id === editingTaskId) {
      li.innerHTML = `
        <div class="task-edit-container">
          <input type="text" class="edit-input" value="${escapeHTML(task.text)}" aria-label="Edit task text" maxlength="200" autofocus>
          <div class="edit-actions">
            <button class="save-btn" aria-label="Save changes">
              <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg>
            </button>
            <button class="cancel-btn" aria-label="Cancel editing">
              <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
            </button>
          </div>
        </div>
        <div class="edit-error-msg" id="edit-error-${task.id}" style="display: none;" role="alert"></div>
      `;
    } else {
      li.innerHTML = `
        <label class="checkbox-container">
          <input type="checkbox" class="task-checkbox" ${task.completed ? 'checked' : ''} aria-label="Toggle completed state">
          <span class="custom-checkbox"></span>
        </label>
        <span class="task-text">${escapeHTML(task.text)}</span>
        <div class="task-actions">
          <button class="edit-btn" aria-label="Edit task">
            <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path><path d="M18.5 2.5a2.121 2.121 0 1 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path></svg>
          </button>
          <button class="delete-btn" aria-label="Delete task">
            <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path><line x1="10" y1="11" x2="10" y2="17"></line><line x1="14" y1="11" x2="14" y2="17"></line></svg>
          </button>
        </div>
      `;
    }
    
    fragment.appendChild(li);
  });
  
  taskListElement.appendChild(fragment);
}
