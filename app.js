// app.js

import { saveTasks, loadTasks } from './modules/storage.js';
import { renderTaskList } from './modules/render.js';
import { validateTaskInput, clearError } from './modules/validation.js';

// Application State
let tasks = loadTasks();
let currentFilter = 'all';
let editingTaskId = null;

// Undo/Redo Stacks
const undoStack = [];
const redoStack = [];

// Create Task Factory
function createTask(text) {
  return {
    id: Date.now(),
    text: text.trim(),
    completed: false,
    createdAt: new Date().toISOString()
  };
}

// Push State to Undo Stack
function pushState() {
  undoStack.push(JSON.stringify(tasks));
  if (undoStack.length > 50) {
    undoStack.shift();
  }
  // Clear Redo stack on new user action
  redoStack.length = 0;
  updateUndoRedoButtons();
}

// Undo Action
function undo() {
  if (undoStack.length === 0) return;
  redoStack.push(JSON.stringify(tasks));
  tasks = JSON.parse(undoStack.pop());
  saveTasks(tasks);
  updateUndoRedoButtons();
  render();
}

// Redo Action
function redo() {
  if (redoStack.length === 0) return;
  undoStack.push(JSON.stringify(tasks));
  tasks = JSON.parse(redoStack.pop());
  saveTasks(tasks);
  updateUndoRedoButtons();
  render();
}

// Update Undo/Redo Button disabled states
function updateUndoRedoButtons() {
  const undoBtn = document.getElementById('undo-btn');
  const redoBtn = document.getElementById('redo-btn');
  if (undoBtn) undoBtn.disabled = undoStack.length === 0;
  if (redoBtn) redoBtn.disabled = redoStack.length === 0;
}

// Render the entire list based on filters
function render() {
  let filteredTasks = tasks;
  if (currentFilter === 'active') {
    filteredTasks = tasks.filter(t => !t.completed);
  } else if (currentFilter === 'completed') {
    filteredTasks = tasks.filter(t => t.completed);
  }
  
  const taskListEl = document.getElementById('task-list');
  renderTaskList(taskListEl, filteredTasks, editingTaskId);
  updateCounter();
}

// Update Counter Stats
function updateCounter() {
  const activeCount = tasks.filter(t => !t.completed).length;
  const counterEl = document.getElementById('task-counter');
  if (counterEl) {
    counterEl.textContent = `${activeCount} active task${activeCount === 1 ? '' : 's'} left`;
  }
}

// Save Inline Task Editing
function saveInlineEdit(li, idx) {
  const editInput = li.querySelector('.edit-input');
  const val = editInput.value.trim();
  const errorEl = li.querySelector('.edit-error-msg');
  
  if (!val) {
    if (errorEl) {
      errorEl.textContent = 'Task cannot be empty!';
      errorEl.style.display = 'block';
    }
    editInput.setAttribute('aria-invalid', 'true');
    return;
  }
  if (val.length > 200) {
    if (errorEl) {
      errorEl.textContent = 'Task must be under 200 characters.';
      errorEl.style.display = 'block';
    }
    editInput.setAttribute('aria-invalid', 'true');
    return;
  }
  
  pushState();
  tasks[idx].text = val;
  saveTasks(tasks);
  editingTaskId = null;
  render();
}

// Initialize Application
document.addEventListener('DOMContentLoaded', () => {
  const taskForm = document.getElementById('task-form');
  const taskInput = document.getElementById('task-input');
  const errorMsg = document.getElementById('error-msg');
  const taskList = document.getElementById('task-list');
  const filterBtns = document.querySelectorAll('.filter-btn');
  const clearCompletedBtn = document.getElementById('clear-completed');
  const themeToggle = document.getElementById('theme-toggle');
  const undoBtn = document.getElementById('undo-btn');
  const redoBtn = document.getElementById('redo-btn');
  
  // Theme Toggle Logic
  const sunIcon = themeToggle.querySelector('.sun-icon');
  const moonIcon = themeToggle.querySelector('.moon-icon');
  const savedTheme = localStorage.getItem('theme') || 'light';
  document.documentElement.setAttribute('data-theme', savedTheme);
  updateThemeIcons(savedTheme);
  
  themeToggle.addEventListener('click', () => {
    const currentTheme = document.documentElement.getAttribute('data-theme') || 'light';
    const newTheme = currentTheme === 'light' ? 'dark' : 'light';
    document.documentElement.setAttribute('data-theme', newTheme);
    localStorage.setItem('theme', newTheme);
    updateThemeIcons(newTheme);
  });
  
  function updateThemeIcons(theme) {
    if (theme === 'dark') {
      sunIcon.style.display = 'none';
      moonIcon.style.display = 'block';
    } else {
      sunIcon.style.display = 'block';
      moonIcon.style.display = 'none';
    }
  }

  // Form Submit Handler
  taskForm.addEventListener('submit', e => {
    e.preventDefault();
    if (validateTaskInput(taskInput.value)) {
      pushState();
      tasks.push(createTask(taskInput.value));
      saveTasks(tasks);
      taskInput.value = '';
      clearError(errorMsg);
      render();
    }
  });

  // Debounced input validation
  let validationTimeout;
  taskInput.addEventListener('input', e => {
    clearTimeout(validationTimeout);
    validationTimeout = setTimeout(() => {
      validateTaskInput(e.target.value);
    }, 300);
  });

  // Task List Interaction Delegator
  taskList.addEventListener('click', e => {
    const li = e.target.closest('.task');
    if (!li) return;
    const id = Number(li.dataset.id);
    const idx = tasks.findIndex(t => t.id === id);
    
    // Toggle completion checkbox
    if (e.target.classList.contains('task-checkbox')) {
      pushState();
      tasks[idx].completed = e.target.checked;
      saveTasks(tasks);
      li.classList.toggle('completed', e.target.checked);
      updateCounter();
      // If we are currently filtered, we should re-render to make sure tasks move appropriately
      if (currentFilter !== 'all') {
        setTimeout(render, 150); // slight delay for animation visual polish
      }
    }
    
    // Edit task (toggle edit state inline)
    if (e.target.closest('.edit-btn')) {
      editingTaskId = id;
      render();
      // Explicitly focus edit input and place cursor at end
      const activeLi = taskList.querySelector(`[data-id="${id}"]`);
      if (activeLi) {
        const input = activeLi.querySelector('.edit-input');
        if (input) {
          input.focus();
          const len = input.value.length;
          input.setSelectionRange(len, len);
        }
      }
    }
    
    // Delete task
    if (e.target.closest('.delete-btn')) {
      if (confirm('Delete this task?')) {
        pushState();
        tasks.splice(idx, 1);
        saveTasks(tasks);
        render();
      }
    }
    
    // Save inline edit
    if (e.target.closest('.save-btn')) {
      saveInlineEdit(li, idx);
    }
    
    // Cancel inline edit
    if (e.target.closest('.cancel-btn')) {
      editingTaskId = null;
      render();
    }
  });

  // Double click task card for inline editing
  taskList.addEventListener('dblclick', e => {
    const li = e.target.closest('.task');
    if (!li) return;
    // Don't trigger edit mode if double clicking actions, checkbox, or if already editing
    if (e.target.closest('.task-actions') || e.target.closest('.checkbox-container') || li.classList.contains('editing')) {
      return;
    }
    const id = Number(li.dataset.id);
    editingTaskId = id;
    render();
    // Explicitly focus edit input and place cursor at end
    const activeLi = taskList.querySelector(`[data-id="${id}"]`);
    if (activeLi) {
      const input = activeLi.querySelector('.edit-input');
      if (input) {
        input.focus();
        const len = input.value.length;
        input.setSelectionRange(len, len);
      }
    }
  });

  // Key controls inside task list editing inputs
  taskList.addEventListener('keydown', e => {
    if (e.target.classList.contains('edit-input')) {
      const li = e.target.closest('.task');
      if (!li) return;
      const id = Number(li.dataset.id);
      const idx = tasks.findIndex(t => t.id === id);
      
      if (e.key === 'Enter') {
        e.preventDefault();
        saveInlineEdit(li, idx);
      } else if (e.key === 'Escape') {
        e.preventDefault();
        editingTaskId = null;
        render();
      }
    }
  });

  // Filter Buttons
  filterBtns.forEach(btn => {
    btn.addEventListener('click', e => {
      filterBtns.forEach(b => {
        b.classList.remove('active');
        b.removeAttribute('aria-current');
      });
      e.target.classList.add('active');
      e.target.setAttribute('aria-current', 'page');
      currentFilter = e.target.dataset.filter;
      editingTaskId = null; // Exit editing mode when switching filters
      render();
    });
  });

  // Clear Completed Button
  clearCompletedBtn.addEventListener('click', () => {
    const completedTasksCount = tasks.filter(t => t.completed).length;
    if (completedTasksCount === 0) return;
    if (confirm(`Clear all ${completedTasksCount} completed task(s)?`)) {
      pushState();
      tasks = tasks.filter(t => !t.completed);
      saveTasks(tasks);
      render();
    }
  });

  // Undo/Redo Trigger Click handlers
  undoBtn.addEventListener('click', undo);
  redoBtn.addEventListener('click', redo);

  // Global Keyboard shortcuts for Undo (Ctrl+Z) and Redo (Ctrl+Y)
  document.addEventListener('keydown', e => {
    const activeTag = document.activeElement.tagName.toLowerCase();
    const isEditingText = activeTag === 'input' || activeTag === 'textarea';
    
    // Only capture global shortcuts if user is not currently focusing text boxes
    if (!isEditingText) {
      if ((e.ctrlKey || e.metaKey) && !e.shiftKey && e.key.toLowerCase() === 'z') {
        e.preventDefault();
        undo();
      }
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'y') {
        e.preventDefault();
        redo();
      }
    }
  });

  // Initial Load & Render
  render();
});
