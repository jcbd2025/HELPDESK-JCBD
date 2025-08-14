import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useBreadcrumbs } from '../../hooks/useBreadcrumbs';
import styles from '../styles/HomePage.module.css';

const Breadcrumbs = () => {
  const { t } = useTranslation();
  const location = useLocation();
  const { breadcrumbs } = useBreadcrumbs(location.pathname);
  const config = getRouteConfig(currentPath);
  const pageTitle = config.title;
  const breadcrumbName = config.name;

  return (
    <div className={styles.breadcrumbs}>
      {breadcrumbs.map((crumb, index) => (
        <div className={styles.crumb} key={crumb.path}>
          {index === breadcrumbs.length - 1 ? (
            <span>{t(crumb.name)}</span>
          ) : (
            <Link to={crumb.path}>{t(crumb.name)}</Link>
          )}
          {index < breadcrumbs.length - 1 && (
            <span className={styles.separator}>/</span>
          )}
        </div>
      ))}
    </div>
  );
};

export default Breadcrumbs;