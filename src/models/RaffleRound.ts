import mongoose, { Schema, Document, Model } from 'mongoose';

export interface RaffleRoundDocument extends Document {
  roundNumber  : number;
  building     : string;
  startDate    : Date;
  endDate      : Date;
  status       : 'pending' | 'active' | 'completed';
  participants : Array<{ residentId: mongoose.Types.ObjectId; registeredAt: Date }>;
  results      : Array<{ residentId: mongoose.Types.ObjectId; spotId: mongoose.Types.ObjectId; assignedAt: Date }>;
  executedAt   : Date | null;
  executedBy   : mongoose.Types.ObjectId | null;
  createdAt    : Date;
}

const RaffleRoundSchema = new Schema<RaffleRoundDocument>(
  {
    roundNumber: { type: Number, required: true },
    building   : { type: String, required: true },
    startDate  : { type: Date,   required: true },
    endDate    : { type: Date,   required: true },
    status     : { type: String, enum: ['pending','active','completed'], default: 'pending' },
    participants: {
      type: [new Schema({ residentId: { type: Schema.Types.ObjectId, ref: 'Resident', required: true }, registeredAt: { type: Date, default: () => new Date() } }, { _id: false })],
      default: [],
    },
    results: {
      type: [new Schema({ residentId: { type: Schema.Types.ObjectId, ref: 'Resident', required: true }, spotId: { type: Schema.Types.ObjectId, ref: 'ParkingSpot', required: true }, assignedAt: { type: Date, default: () => new Date() } }, { _id: false })],
      default: [],
    },
    executedAt: { type: Date,   default: null },
    executedBy: { type: Schema.Types.ObjectId, ref: 'Resident', default: null },
  },
  { timestamps: { createdAt: 'createdAt', updatedAt: false } }
);

RaffleRoundSchema.index({ building: 1, roundNumber: 1 }, { unique: true });
RaffleRoundSchema.index({ building: 1, status: 1 });
RaffleRoundSchema.index({ startDate: 1, endDate: 1 });

export const RaffleRoundModel: Model<RaffleRoundDocument> =
  mongoose.models.RaffleRound ?? mongoose.model('RaffleRound', RaffleRoundSchema);
