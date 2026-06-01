export const TRAINER_SPECIALIZATIONS = [
  { value: 'weightLoss', label: 'Weight Loss' },
  { value: 'bodyBuilding', label: 'Body Building' },
  { value: 'cardio', label: 'Cardio' },
  { value: 'yoga', label: 'Yoga' },
  { value: 'crossfit', label: 'CrossFit' },
  { value: 'pilates', label: 'Pilates' },
  { value: 'nutrition', label: 'Nutrition' },
  { value: 'rehabilitation', label: 'Rehabilitation' },
  { value: 'kickboxing', label: 'Kickboxing' },
  { value: 'stretching', label: 'Stretching' },
] as const;

export const DEFAULT_TRAINER_BIO =
  'Certified fitness professional dedicated to safe, effective training and helping every client reach their goals.';

export function formatSpecialization(key: string): string {
  return TRAINER_SPECIALIZATIONS.find(s => s.value === key)?.label ?? key;
}

export function mapTrainerView(t: any) {
  if (!t) return t;
  const u = t.user;
  const ratingAvg = typeof t.rating === 'object'
    ? (t.rating?.average ?? 0)
    : (Number(t.rating) || 0);
  const ratingCount = typeof t.rating === 'object' ? (t.rating?.count ?? 0) : 0;
  const assigned = Array.isArray(t.assignedUsers) ? t.assignedUsers : [];
  const certs = Array.isArray(t.certificates)
    ? t.certificates.map((c: any) => (typeof c === 'string' ? c : c?.name)).filter(Boolean)
    : [];

  return {
    ...t,
    fullName: u?.fullName || t.fullName || '—',
    email: u?.email || t.email || '',
    userId: u?._id || t.user,
    rating: ratingAvg,
    ratingCount,
    specializations: Array.isArray(t.specializations) ? t.specializations : [],
    assignedUsers: assigned,
    clientCount: assigned.length || t.totalClients || 0,
    certificateLabels: certs,
  };
}
