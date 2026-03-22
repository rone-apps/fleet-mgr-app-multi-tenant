/**
 * Category Navigation Utility
 * Manages navigation through the dashboard hierarchy
 */

// Store the selected category in localStorage
export const setSelectedCategory = (category) => {
  if (category) {
    localStorage.setItem('dashboardCategory', category);
  } else {
    localStorage.removeItem('dashboardCategory');
  }
};

// Get the currently selected category
export const getSelectedCategory = () => {
  return localStorage.getItem('dashboardCategory');
};

// Get the category title
export const getCategoryTitle = (category) => {
  const titles = {
    account: 'Account & Customers',
    operations: 'Operations',
    financials: 'Financials',
    reports: 'Reports',
    integrations: 'Data & Integrations',
    profiles: 'Shift Profiles'
  };
  return titles[category] || null;
};

// Get breadcrumb items for a page within a category
export const getBreadcrumbs = (category, currentPage) => {
  const breadcrumbs = [
    { label: 'Dashboard', path: '/', isActive: false }
  ];

  if (category) {
    breadcrumbs.push({
      label: getCategoryTitle(category),
      path: `/?category=${category}`,
      category: category,
      isActive: !currentPage
    });
  }

  if (currentPage) {
    breadcrumbs.push({
      label: currentPage,
      path: null,
      isActive: true
    });
  }

  return breadcrumbs;
};

// Map page paths to their display names and categories
export const pageMetadata = {
  '/drivers': { name: 'Drivers', category: 'operations' },
  '/cabs': { name: 'Cabs', category: 'operations' },
  '/shifts': { name: 'Shift Ownership', category: 'operations' },
  '/shift-attributes': { name: 'Shift Attributes', category: 'operations' },
  '/account-management': { name: 'Customers', category: 'account' },
  '/driver-trips': { name: 'Driver Trips', category: 'account' },
  '/expenses': { name: 'Expenses & Revenue', category: 'financials' },
  '/financial-setup': { name: 'Financial Setup', category: 'financials' },
  '/reports': { name: 'Reports', category: 'reports' },
  '/driver-summary': { name: 'Driver Summary', category: 'reports' },
  '/taxicaller-integration': { name: 'Taxi Caller Integration', category: 'integrations' },
  '/data-uploads': { name: 'Data Uploads', category: 'integrations' },
  '/shift-profiles': { name: 'Shift Profiles', category: 'profiles' },
  '/driver-payments': { name: 'Driver & Owner Payments', category: 'payments' },
  '/statement-builder': { name: 'Statement Builder', category: 'reports' },
  '/shift-data': { name: 'Driver Shift Data', category: 'reports' }
};

// Get metadata for a page
export const getPageMetadata = (pathname) => {
  return pageMetadata[pathname];
};
