
export * from 'react-router-dom';
export const routeConfig = {
  
  '/CrearCasoUse': {
    name: 'breadcrumbs.createCase',
    protected: true,
    roles: ['usuario'],  // Solo usuario normal
    title: 'Crear Caso'
  },
  '/CrearCasoAdmin': {
    name: 'breadcrumbs.createCaseAdmin',
    protected: true,
    roles: ['administrador', 'tecnico'],
    title: 'Crear Caso (Admin)'
  },
  '/Tickets': {
    name: 'breadcrumbs.tickets',
    protected: true,
    roles: ['usuario','administrador', 'tecnico'],
    title: 'Mis Tickets'
  },
 
};