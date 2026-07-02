const { contextBridge, ipcRenderer } = require('electron');

/**
 * The single API surface exposed to the renderer as `window.momentum`.
 * Everything is promise-based and forwards to an ipcMain.handle channel.
 */
contextBridge.exposeInMainWorld('momentum', {
  tasks: {
    list: () => ipcRenderer.invoke('tasks:list'),
    create: (input) => ipcRenderer.invoke('tasks:create', input),
    update: (id, updates) => ipcRenderer.invoke('tasks:update', id, updates),
    remove: (id) => ipcRenderer.invoke('tasks:remove', id),
    reorder: (ids) => ipcRenderer.invoke('tasks:reorder', ids),
    setCompleted: (id, isCompleted) =>
      ipcRenderer.invoke('tasks:setCompleted', id, isCompleted),
  },
  projects: {
    list: () => ipcRenderer.invoke('projects:list'),
    create: (input) => ipcRenderer.invoke('projects:create', input),
    update: (id, updates) => ipcRenderer.invoke('projects:update', id, updates),
    remove: (id) => ipcRenderer.invoke('projects:remove', id),
  },
  streak: {
    get: () => ipcRenderer.invoke('streak:get'),
  },
  reflections: {
    getByDate: (date) => ipcRenderer.invoke('reflections:getByDate', date),
    list: (limit) => ipcRenderer.invoke('reflections:list', limit),
    upsert: (input) => ipcRenderer.invoke('reflections:upsert', input),
  },
  analytics: {
    daily: (days) => ipcRenderer.invoke('analytics:daily', days),
    totals: () => ipcRenderer.invoke('analytics:totals'),
  },
  settings: {
    get: (key, fallback) => ipcRenderer.invoke('settings:get', key, fallback),
    set: (key, value) => ipcRenderer.invoke('settings:set', key, value),
    all: () => ipcRenderer.invoke('settings:all'),
  },
});
