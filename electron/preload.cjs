const { contextBridge, ipcRenderer } = require('electron')

// Secure bridge: the renderer never touches Node/SQL directly.
// Everything goes through a single typed channel into the main process.
contextBridge.exposeInMainWorld('api', {
  // Generic data call: action is e.g. "employees.list", params is an object.
  call: (action, params) => ipcRenderer.invoke('api', { action, params }),

  // Excel (needs native file dialogs, handled in main):
  importExcel: (table, role) => ipcRenderer.invoke('excel:import', { table, role }),
  exportExcel: (table, title) => ipcRenderer.invoke('excel:export', { table, title }),

  // Open the folder where the database / attachments live:
  revealData: () => ipcRenderer.invoke('app:revealData'),

  // OS-level light/dark sync + window theme:
  setNativeTheme: (mode) => ipcRenderer.invoke('app:setTheme', mode),
})
