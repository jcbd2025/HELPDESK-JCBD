import { getRouteConfig } from '../config/routes';
import { useNavigate } from 'react-router-dom';

export const useSafeNavigate = () => {
  const navigate = useNavigate();
  
  return (path) => {
    if (typeof path === 'string') {
      navigate(path);
    }
  };
};

export const useBreadcrumbs = (pathname) => {
  const paths = pathname.split('/').filter(Boolean);
  
  let currentPath = '';
  const breadcrumbs = paths.map((path, index) => {
    currentPath += `/${path}`;
    const config = getRouteConfig(currentPath) || {};
    
    return {
      path: currentPath,
      name: config.name || `breadcrumbs.${path}`,
      isLast: index === paths.length - 1
    };
  });

  // Siempre empezar con Home
  if (pathname !== '/home') {
    breadcrumbs.unshift({
      path: '/home',
      name: 'breadcrumbs.home',
      isLast: false
    });
  }

  return { breadcrumbs };
};