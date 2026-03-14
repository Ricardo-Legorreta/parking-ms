export type SpotType      = 'standard' | 'accessible' | 'ev';
export type RaffleStatus  = 'pending'  | 'active'     | 'completed';
export type HistoryStatus = 'active'   | 'expired'    | 'released';
export type UserRole      = 'resident' | 'admin';

export interface Vehicle {
  plate : string;
  model : string;
  color : string;
}

export interface IResident {
  _id               : string;
  auth0Id           : string;
  name              : string;
  email             : string;
  unit              : string;
  building          : string;
  vehicle?          : Vehicle;
  totalWins         : number;
  role              : UserRole;
  isActive          : boolean;
  registeredAt      : Date;
  updatedAt         : Date;
}

export interface ISpotAssignment {
  residentId : string;
  assignedAt : Date;
  expiresAt  : Date;
}

export interface IParkingSpot {
  _id               : string;
  spotNumber        : string;
  building          : string;
  floor             : number;
  type              : SpotType;
  isActive          : boolean;
  currentAssignment : ISpotAssignment | null;
}

export interface IRaffleParticipant {
  residentId   : string;
  registeredAt : Date;
}

export interface IRaffleResult {
  residentId : string;
  spotId     : string;
  assignedAt : Date;
}

export interface IRaffleRound {
  _id          : string;
  roundNumber  : number;
  building     : string;
  startDate    : Date;
  endDate      : Date;
  status       : RaffleStatus;
  participants : IRaffleParticipant[];
  results      : IRaffleResult[];
  executedAt   : Date | null;
  executedBy   : string | null;
  createdAt    : Date;
}

export interface IParkingHistory {
  _id         : string;
  residentId  : string;
  spotId      : string;
  roundNumber : number;
  building    : string;
  assignedAt  : Date;
  expiresAt   : Date;
  status      : HistoryStatus;
}

export interface ApiResponse<T = unknown> {
  success  : boolean;
  data    ?: T;
  error   ?: string;
  message ?: string;
}

export interface PaginatedResponse<T> {
  data       : T[];
  total      : number;
  page       : number;
  limit      : number;
  totalPages : number;
}

export interface RaffleEngineInput {
  participants          : IResident[];
  spots                 : IParkingSpot[];
  blockedSpotsByResident : Record<string, string[]>;
}

export interface RaffleAssignment {
  resident : IResident;
  spot     : IParkingSpot;
}

export interface RaffleEngineOutput {
  assignments : RaffleAssignment[];
  unassigned  : IResident[];
}

export interface Auth0JwtPayload {
  sub   : string;
  email : string;
  name  : string;
  [key  : string]: unknown;
}

export interface RequestUser {
  auth0Id    : string;
  email      : string;
  name       : string;
  role       : UserRole;
  residentId?: string;
}
