import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';

const resources = {
  en: {
    translation: {
      'breadcrumbs': {
        'home': 'Home',
        'createCase': 'Create Case',
        'tickets': 'Tickets',
        'ticketDetail': 'Ticket #{{id}}',
        'survey': 'Satisfaction Survey',
        'ticketSolution': 'Ticket Solution'
      }
    }
  },
  es: {
    translation: {
      'breadcrumbs': {
        'home': 'Inicio',
        'createCase': 'Crear Caso',
        'tickets': 'Tickets',
        'ticketDetail': 'Ticket #{{id}}',
        'survey': 'Encuesta de Satisfacción',
        'ticketSolution': 'Solución de Tickets'
      }
    }
  }
};

i18n
  .use(initReactI18next)
  .init({
    resources,
    lng: 'es', // idioma por defecto
    fallbackLng: 'es',
    interpolation: {
      escapeValue: false
    }
  });

export default i18n;