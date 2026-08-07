// Format date to readable string
export const formatDate = (dateString) => {
  if (!dateString) return '—';
  const date = new Date(dateString);
  if (isNaN(date)) return '—';
  return date.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric'
  });
};

// Format date with time
export const formatDateTime = (dateString) => {
  if (!dateString) return '—';
  const date = new Date(dateString);
  if (isNaN(date)) return '—';
  return date.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
};

// Format number as currency
export const formatCurrency = (amount, currency = 'USD') => {
  if (amount == null || isNaN(amount)) return '$0.00';
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency
  }).format(amount);
};

// Format number as percentage
export const formatPercent = (value, decimals = 1) => {
  if (value == null || isNaN(value)) return '0%';
  return `${Number(value).toFixed(decimals)}%`;
};

// Format large numbers
export const formatNumber = (num) => {
  if (num == null || isNaN(num)) return '0';
  if (num >= 1_000_000) return `${(num / 1_000_000).toFixed(1)}M`;
  if (num >= 1_000) return `${(num / 1_000).toFixed(1)}K`;
  return num.toLocaleString();
};

// Get relative time
export const getRelativeTime = (dateString) => {
  if (!dateString) return '—';
  const date = new Date(dateString);
  const now = new Date();
  const diff = now - date;
  const minutes = Math.floor(diff / 60_000);
  const hours = Math.floor(diff / 3_600_000);
  const days = Math.floor(diff / 86_400_000);

  if (minutes < 1) return 'Just now';
  if (minutes < 60) return `${minutes}m ago`;
  if (hours < 24) return `${hours}h ago`;
  if (days < 7) return `${days}d ago`;
  return formatDate(dateString);
};

// Get severity color classes
export const getSeverityColor = (severity) => {
  const map = {
    critical: 'bg-red-100 text-red-800 border-red-200',
    high: 'bg-orange-100 text-orange-800 border-orange-200',
    medium: 'bg-yellow-100 text-yellow-800 border-yellow-200',
    low: 'bg-blue-100 text-blue-800 border-blue-200',
    info: 'bg-gray-100 text-gray-800 border-gray-200'
  };
  return map[severity?.toLowerCase()] || 'bg-gray-100 text-gray-800 border-gray-200';
};

// Get status color classes
export const getStatusColor = (status) => {
  const map = {
    active: 'bg-green-100 text-green-800',
    completed: 'bg-green-100 text-green-800',
    approved: 'bg-green-100 text-green-800',
    on_track: 'bg-green-100 text-green-800',
    pending: 'bg-yellow-100 text-yellow-800',
    in_progress: 'bg-blue-100 text-blue-800',
    review: 'bg-purple-100 text-purple-800',
    at_risk: 'bg-orange-100 text-orange-800',
    blocked: 'bg-red-100 text-red-800',
    cancelled: 'bg-gray-100 text-gray-600',
    breached: 'bg-red-100 text-red-800',
    failed: 'bg-red-100 text-red-800',
    rejected: 'bg-red-100 text-red-800',
    new: 'bg-blue-100 text-blue-800',
    investigating: 'bg-purple-100 text-purple-800',
    resolved: 'bg-green-100 text-green-800',
    dismissed: 'bg-gray-100 text-gray-600',
    draft: 'bg-gray-100 text-gray-600',
    assigned: 'bg-blue-100 text-blue-800',
    deferred: 'bg-yellow-100 text-yellow-800',
    inactive: 'bg-gray-100 text-gray-600',
    suspended: 'bg-red-100 text-red-800'
  };
  return map[status?.toLowerCase()] || 'bg-gray-100 text-gray-600';
};

// Get priority color classes
export const getPriorityColor = (priority) => {
  const map = {
    critical: 'bg-red-100 text-red-800',
    high: 'bg-orange-100 text-orange-800',
    medium: 'bg-yellow-100 text-yellow-800',
    low: 'bg-green-100 text-green-800'
  };
  return map[priority?.toLowerCase()] || 'bg-gray-100 text-gray-600';
};

// Get role color classes
export const getRoleColor = (role) => {
  const map = {
    'Operations Admin': 'bg-purple-100 text-purple-800',
    'Manager': 'bg-blue-100 text-blue-800',
    'Analyst': 'bg-cyan-100 text-cyan-800',
    'Field Staff': 'bg-green-100 text-green-800'
  };
  return map[role] || 'bg-gray-100 text-gray-600';
};

// Check if user has role access
export const hasRole = (user, ...roles) => {
  if (!user) return false;
  return roles.includes(user.role);
};

// Check if user has minimum role level
export const hasMinRole = (user, minRole) => {
  if (!user) return false;
  const hierarchy = {
    'Operations Admin': 4,
    'Manager': 3,
    'Analyst': 2,
    'Field Staff': 1
  };
  return (hierarchy[user.role] || 0) >= (hierarchy[minRole] || 0);
};

// Truncate long text
export const truncate = (text, maxLength = 80) => {
  if (!text) return '';
  if (text.length <= maxLength) return text;
  return text.substring(0, maxLength) + '...';
};

// Debounce function
export const debounce = (func, delay) => {
  let timeoutId;
  return (...args) => {
    clearTimeout(timeoutId);
    timeoutId = setTimeout(() => func(...args), delay);
  };
};

// Build query string from params object
export const buildQueryString = (params) => {
  const query = new URLSearchParams();
  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== '') {
      query.append(key, value);
    }
  });
  return query.toString();
};

// Get confidence badge color
export const getConfidenceColor = (confidence) => {
  if (confidence >= 0.8) return 'bg-green-100 text-green-800';
  if (confidence >= 0.6) return 'bg-yellow-100 text-yellow-800';
  if (confidence >= 0.4) return 'bg-orange-100 text-orange-800';
  return 'bg-red-100 text-red-800';
};

// Format confidence as percentage
export const formatConfidence = (confidence) => {
  if (confidence == null) return 'N/A';
  return `${Math.round(confidence * 100)}%`;
};
