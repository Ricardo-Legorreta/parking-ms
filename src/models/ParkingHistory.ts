import mongoose, { Schema, Document, Model } from 'mongoose';

export interface ParkingHistoryDocument extends Document {
  residentId  : mongoose.Types.ObjectId;
  spotId      : mongoose.Types.ObjectId;
  roundNumber : number;
  building    : string;
  assignedAt  : Date;
  expiresAt   : Date;
  status      : 'active' | 'expired' | 'released';
}

const ParkingHistorySchema = new Schema<ParkingHistoryDocument>(
  {
    residentId : { type: Schema.Types.ObjectId, ref: 'Resident',    required: true },
    spotId     : { type: Schema.Types.ObjectId, ref: 'ParkingSpot', required: true },
    roundNumber: { type: Number, required: true },
    building   : { type: String, required: true },
    assignedAt : { type: Date,   required: true },
    expiresAt  : { type: Date,   required: true },
    status     : { type: String, enum: ['active','expired','released'], default: 'active' },
  },
  { timestamps: true }
);

ParkingHistorySchema.index({ residentId: 1, roundNumber: -1 });
ParkingHistorySchema.index({ building: 1,   roundNumber: -1 });
ParkingHistorySchema.index({ status: 1,     expiresAt: 1 });
ParkingHistorySchema.index({ residentId: 1, status: 1 });

export const ParkingHistoryModel: Model<ParkingHistoryDocument> =
  mongoose.models.ParkingHistory ?? mongoose.model('ParkingHistory', ParkingHistorySchema);
