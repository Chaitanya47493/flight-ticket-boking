// List of administrator email addresses authorized to access the Admin Dashboard
export const ADMIN_EMAILS = [
  'admin@aerospace.com',
  'developer@aerospace.com',
  'rohit@aerospace.com',
  'keertirohit@gmail.com'
  // 👉 Add your admin email address here to unlock the Admin Dashboard in the header
];

/**
 * Check if the given user has administrator privileges
 */
export const isAdminUser = (user) => {
  if (!user || !user.email) return false;
  return ADMIN_EMAILS.some(email => email.toLowerCase() === user.email.toLowerCase());
};

