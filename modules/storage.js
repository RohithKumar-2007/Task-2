// storage.js
export const saveTasks = (tasks) => {
  localStorage.setItem('tasks', JSON.stringify(tasks));
};

export const loadTasks = () => {
  try {
    return JSON.parse(localStorage.getItem('tasks')) || [];
  } catch (e) {
    console.error('Error parsing tasks from localStorage', e);
    return [];
  }
};

// Optional: clear all tasks
export const clearTasks = () => {
  localStorage.removeItem('tasks');
};
