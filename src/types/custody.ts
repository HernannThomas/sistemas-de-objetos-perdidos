export type ItemStatus = 'EN_CUSTODIA' | 'ENTREGADO' | 'ADVERTENCIA' | 'BLOQUEADO_POR_SEGURIDAD';

export type ItemCategory =
  | 'electronics'
  | 'wallets_ids'
  | 'jewelry'
  | 'keys'
  | 'luggage'
  | 'documents'
  | 'other';

export type UserRole = 'admin' | 'employee' | 'user';

export interface SessionUser {
  id: string;
  name: string;
  role: UserRole;
  badgeNumber?: string;
  rank?: string;
  email: string;
  department?: string;
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
  signatureDataUrl?: string;
  verifiedTimestamp: string;
  verifyingOfficer: string;
  notes?: string;
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
  claimant?: ClaimantRecord;
  securityHoldReason?: string;
  tamperSealNumber: string;
  estimatedValue?: string;
  rfidTagId: string;
}
