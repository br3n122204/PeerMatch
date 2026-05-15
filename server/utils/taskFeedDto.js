const URGENCY_VALUES = ['low', 'normal', 'high'];

function normalizeUrgency(value) {
  const raw = String(value || 'normal').trim().toLowerCase();
  return URGENCY_VALUES.includes(raw) ? raw : 'normal';
}

function urgencyLabel(value) {
  const normalized = normalizeUrgency(value);
  return normalized.charAt(0).toUpperCase() + normalized.slice(1);
}

function mapTaskToFeedPost(task, client) {
  const clientDoc = client || task.clientId;
  return {
    id: String(task._id),
    authorId: clientDoc?._id ? String(clientDoc._id) : String(task.clientId || ''),
    authorName: clientDoc?.name || 'Client User',
    authorEmail: clientDoc?.email || '',
    authorAccountType: clientDoc?.accountType || 'client',
    authorAvatarDataUrl: clientDoc?.photoDataUrl || undefined,
    title: task.title,
    content: task.description || '',
    category: task.subjectCategory || 'General',
    priority: urgencyLabel(task.urgency),
    budget: typeof task.budget === 'number' ? task.budget : 0,
    status: task.status,
    createdAt: task.createdAt ? new Date(task.createdAt).toISOString() : new Date().toISOString(),
  };
}

module.exports = {
  mapTaskToFeedPost,
  urgencyLabel,
  normalizeUrgency,
};
