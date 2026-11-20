export type ItemStatus = 'EN_CUSTODIA' | 'ENTREGADO' | 'ADVERTENCIA' | 'BLOQUEADO_POR_SEGURIDAD';

export type ItemCategory =
  | 'electronics'
  | 'wallets_ids'
  | 'jewelry'
  | 'keys'
  | 'luggage'
  | 'documents'
  | 'clothing'
  | 'other';

export type UserRole = 'admin' | 'employee' | 'user';

export interface SessionUser {
  id: string;
  name: string;
  role: UserRole;
  badgeNumber?: string;
  rank?: string;
  email: string;
  password?: string;
  phone?: string;
  idNumber?: string;
  department?: string;
  createdAt?: string;
  status?: 'ACTIVO' | 'INACTIVO';
}

export interface TimelineStep {
  id: string;
  title: string;
  timestamp: string;
  officer: string;
  officerBadge: string;
  status: 'completed' | 'warning' | 'security_hold' | 'pending';
  notes: string;
  hash?: string;
}

export interface EvidencePhoto {
  id: string;
  url: string;
  caption: string;
  timestamp: string;
  sizeKb?: number;
}

export interface LockerLocation {
  zone: string;
  lockerNumber: string;
  binNumber: string;
  isLocked: boolean;
}

export interface ClaimantRecord {
  fullName: string;
  idType: string;
  idNumber: string;
  phone: string;
  email?: string;
  signatureDataUrl?: string;
  verifiedTimestamp: string;
  verifyingOfficer: string;
  officerBadge: string;
  coincidencePercentage: number;
  deliveryCertificateHash: string;
  notes?: string;
}

export interface FailedAttempt {
  id: string;
  timestamp: string;
  userId?: string;
  userEmail?: string;
  claimantName: string;
  idType: string;
  idNumber: string;
  phone: string;
  percentageScore: number;
  reason: string;
  officer: string;
}

export interface SecurityQuestionConfig {
  questionType: 'PIN_PASSWORD' | 'WALLPAPER' | 'INNER_CONTENTS' | 'HIDDEN_SERIAL' | 'OTHER';
  label: string;
  correctHint: string; // Known only to employee/system, hidden from citizen
}

export interface CustodyItem {
  id: string;
  trackingCode: string;
  title: string;
  category: ItemCategory;
  brand: string;
  model?: string;
  color: string;
  distinctMarks: string;
  serialNumber?: string;
  status: ItemStatus;
  registeredAt: string;
  relativeTime: string;
  estimatedValue?: string;
  intakeOfficer: {
    name: string;
    badge: string;
  };
  finder: {
    name: string;
    contact: string;
    surrenderLocation: string;
    incidentRef: string;
  };
  location: LockerLocation;
  timeline: TimelineStep[];
  evidencePhotos: EvidencePhoto[];
  tamperSealNumber: string;
  rfidTagId: string;
  securityQuestion?: SecurityQuestionConfig;
  failedAttempts: FailedAttempt[];
  claimant?: ClaimantRecord;
  securityHoldReason?: string;
  unlockedByAdmin?: {
    adminName: string;
    timestamp: string;
    justification: string;
  };
}

export interface CitizenLostReport {
  id: string;
  reportType: 'LOST' | 'FOUND';
  reportedAt: string;
  fullName: string;
  phone: string;
  email: string;
  category: ItemCategory;
  title: string;
  brand: string;
  color: string;
  estimatedLostPlace: string;
  estimatedLostDate: string;
  distinctMarks: string;
  photoUrl?: string;
  matchedItemId?: string;
  status: 'PENDIENTE_REVISION' | 'COINCIDENCIA_DETECTADA' | 'PROCESADO_A_CUSTODIA' | 'DESCARTADO';
}

export interface AppNotification {
  id: string;
  title: string;
  message: string;
  timestamp: string;
  type: 'MATCH' | 'CLAIM' | 'MESSAGE' | 'SECURITY' | 'INTAKE';
  targetRole: 'all' | 'client' | 'staff';
  targetUserEmail?: string;
  relatedThreadId?: string;
  readByUserIds: string[];
}

export interface DirectMessage {
  id: string;
  threadId: string;
  threadTitle: string;
  senderId: string;
  senderName: string;
  senderRole: UserRole;
  senderEmail: string;
  recipientEmail?: string;
  text: string;
  timestamp: string;
}
