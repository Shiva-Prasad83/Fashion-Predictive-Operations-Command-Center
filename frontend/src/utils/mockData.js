// Realistic mock data for development / empty states

export const mockKPIs = {
  sellThrough: { value: 68.4, change: 3.2 },
  stockCover: { value: 24, change: -2.1 },
  sizeAvailability: { value: 82.3, change: 1.4 },
  leadTime: { value: 38, change: -4.0 },
  margin: { value: 42.1, change: 0.8 },
  markdownRate: { value: 12.7, change: -1.5 },
  returnRate: { value: 5.9, change: -0.3 },
  collectionPerformance: { value: 74.2, change: 5.1 }
};

export const mockTrendData = Array.from({ length: 30 }, (_, i) => {
  const date = new Date();
  date.setDate(date.getDate() - (29 - i));
  return {
    date: date.toISOString().split('T')[0],
    sellThrough: 60 + Math.random() * 20,
    stockCover: 20 + Math.random() * 15,
    margin: 38 + Math.random() * 10,
    returnRate: 4 + Math.random() * 4
  };
});

export const mockWorkflows = [
  {
    queueId: 'wf-001',
    title: 'SS25 Collection Trend Planning',
    type: 'trend_planning',
    status: 'in_progress',
    priority: 'high',
    ownerId: 'u-001',
    ownerName: 'Priya Sharma',
    dueDate: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000).toISOString(),
    slaStatus: 'at_risk'
  },
  {
    queueId: 'wf-002',
    title: 'Denim Range Sourcing — Supplier Shortlist',
    type: 'sourcing',
    status: 'pending',
    priority: 'critical',
    ownerId: 'u-002',
    ownerName: 'Raj Mehta',
    dueDate: new Date(Date.now() + 1 * 24 * 60 * 60 * 1000).toISOString(),
    slaStatus: 'breached'
  },
  {
    queueId: 'wf-003',
    title: 'Evening Wear Sampling — Round 2',
    type: 'sampling',
    status: 'review',
    priority: 'high',
    ownerId: 'u-003',
    ownerName: 'Nina Kapoor',
    dueDate: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000).toISOString(),
    slaStatus: 'on_track'
  },
  {
    queueId: 'wf-004',
    title: 'End-of-Season Markdown Strategy',
    type: 'markdown',
    status: 'pending',
    priority: 'medium',
    ownerId: 'u-004',
    ownerName: 'Arun Iyer',
    dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
    slaStatus: 'on_track'
  },
  {
    queueId: 'wf-005',
    title: 'Festive Allocation — Metro Stores',
    type: 'allocation',
    status: 'completed',
    priority: 'high',
    ownerId: 'u-005',
    ownerName: 'Sanya Gupta',
    dueDate: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
    slaStatus: 'on_track'
  },
  {
    queueId: 'wf-006',
    title: 'Winter Replenishment Order',
    type: 'replenishment',
    status: 'in_progress',
    priority: 'high',
    ownerId: 'u-001',
    ownerName: 'Priya Sharma',
    dueDate: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString(),
    slaStatus: 'at_risk'
  }
];

export const mockAnomalies = [
  {
    anomalyId: 'an-001',
    type: 'return_spike',
    severity: 'high',
    confidence: 0.88,
    detectedAt: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
    affectedMetric: 'returnRate',
    expectedValue: 5.9,
    actualValue: 14.2,
    deviation: 8.3,
    explanation: 'Return rate on Casual T-Shirts (SS25) spiked 140% above baseline. Contributing factors: sizing inconsistency in batch B-403 and customer feedback on fabric quality.',
    status: 'new'
  },
  {
    anomalyId: 'an-002',
    type: 'demand_spike',
    severity: 'medium',
    confidence: 0.76,
    detectedAt: new Date(Date.now() - 5 * 60 * 60 * 1000).toISOString(),
    affectedMetric: 'sellThrough',
    expectedValue: 68,
    actualValue: 89,
    deviation: 21,
    explanation: 'Unexpectedly high demand for Floral Midi Dresses following weekend influencer campaign. Stock cover now at 4 days vs 14-day target.',
    status: 'acknowledged'
  },
  {
    anomalyId: 'an-003',
    type: 'margin_drop',
    severity: 'critical',
    confidence: 0.92,
    detectedAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
    affectedMetric: 'margin',
    expectedValue: 42,
    actualValue: 28,
    deviation: -14,
    explanation: 'Gross margin on Denim Jackets declined sharply following unplanned markdown. Input cost increase of 12% from Supplier INX-203 not reflected in retail pricing.',
    status: 'investigating'
  }
];

export const mockTasks = [
  {
    taskId: 'tk-001',
    title: 'Expedite Denim Supplier Delivery',
    type: 'preventive',
    status: 'pending',
    priority: 'critical',
    assignedTo: 'u-002',
    assigneeName: 'Raj Mehta',
    dueDate: new Date(Date.now() + 1 * 24 * 60 * 60 * 1000).toISOString(),
    aiGenerated: true,
    requiresApproval: true,
    approvalStatus: 'pending',
    expectedImpact: 'Prevent 3-day production delay. Estimated revenue at risk: $85,000.'
  },
  {
    taskId: 'tk-002',
    title: 'Review SS25 T-Shirt Sizing Specification',
    type: 'corrective',
    status: 'assigned',
    priority: 'high',
    assignedTo: 'u-003',
    assigneeName: 'Nina Kapoor',
    dueDate: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000).toISOString(),
    aiGenerated: true,
    requiresApproval: false,
    approvalStatus: 'approved',
    expectedImpact: 'Reduce return rate by ~60% on affected SKUs.'
  },
  {
    taskId: 'tk-003',
    title: 'Approve Emergency Replenishment PO',
    type: 'approval',
    status: 'pending',
    priority: 'critical',
    assignedTo: 'u-004',
    assigneeName: 'Arun Iyer',
    dueDate: new Date(Date.now() + 4 * 60 * 60 * 1000).toISOString(),
    aiGenerated: false,
    requiresApproval: true,
    approvalStatus: 'pending',
    expectedImpact: 'Restore stock cover on Floral Dresses to 14-day target.'
  }
];

export const mockForecastData = Array.from({ length: 14 }, (_, i) => {
  const date = new Date();
  date.setDate(date.getDate() + i + 1);
  const base = 65 + Math.sin(i * 0.5) * 10;
  return {
    date: date.toISOString().split('T')[0],
    value: parseFloat(base.toFixed(1)),
    lowerBound: parseFloat((base * 0.9).toFixed(1)),
    upperBound: parseFloat((base * 1.1).toFixed(1))
  };
});

export const mockUsers = [
  { userId: 'u-001', firstName: 'Priya', lastName: 'Sharma', email: 'priya.sharma@fashionbrand.com', role: 'Operations Admin', status: 'active', lastLogin: new Date(Date.now() - 30 * 60 * 1000).toISOString() },
  { userId: 'u-002', firstName: 'Raj', lastName: 'Mehta', email: 'raj.mehta@fashionbrand.com', role: 'Manager', status: 'active', lastLogin: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString() },
  { userId: 'u-003', firstName: 'Nina', lastName: 'Kapoor', email: 'nina.kapoor@fashionbrand.com', role: 'Analyst', status: 'active', lastLogin: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString() },
  { userId: 'u-004', firstName: 'Arun', lastName: 'Iyer', email: 'arun.iyer@fashionbrand.com', role: 'Analyst', status: 'active', lastLogin: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString() },
  { userId: 'u-005', firstName: 'Sanya', lastName: 'Gupta', email: 'sanya.gupta@fashionbrand.com', role: 'Field Staff', status: 'active', lastLogin: new Date(Date.now() - 5 * 60 * 60 * 1000).toISOString() }
];

export const mockNotifications = [
  { notificationId: 'n-001', title: 'Critical Anomaly Detected', message: 'Return rate spike on SS25 T-Shirts requires immediate review.', type: 'alert', severity: 'critical', status: 'unread', urgent: true, createdAt: new Date(Date.now() - 30 * 60 * 1000).toISOString() },
  { notificationId: 'n-002', title: 'Task Assigned to You', message: 'Review SS25 T-Shirt Sizing Specification has been assigned to you.', type: 'assignment', severity: 'warning', status: 'unread', urgent: false, createdAt: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString() },
  { notificationId: 'n-003', title: 'SLA Breach — Sourcing Workflow', message: 'Denim Range Sourcing is past its SLA deadline.', type: 'alert', severity: 'critical', status: 'unread', urgent: true, createdAt: new Date(Date.now() - 4 * 60 * 60 * 1000).toISOString() },
  { notificationId: 'n-004', title: 'AI Forecast Ready', message: 'Demand forecast for the next 14 days has been generated with 87% confidence.', type: 'ai_result', severity: 'info', status: 'read', urgent: false, createdAt: new Date(Date.now() - 6 * 60 * 60 * 1000).toISOString() },
  { notificationId: 'n-005', title: 'Approval Required', message: 'Emergency Replenishment PO requires your approval.', type: 'approval', severity: 'warning', status: 'unread', urgent: false, createdAt: new Date(Date.now() - 8 * 60 * 60 * 1000).toISOString() }
];
