import mongoose, { Schema, Document, Model } from 'mongoose';

export interface ParkingSpotDocument extends Document {
  spotNumber        : string;
  building          : string;
  floor             : number;
  type              : 'standard' | 'accessible' | 'ev';
  isActive          : boolean;
  currentAssignment : {
    residentId : mongoose.Types.ObjectId;
    assignedAt : Date;
    expiresAt  : Date;
  } | null;
}

const ParkingSpotSchema = new Schema<ParkingSpotDocument>(
  {
    spotNumber        : { type: String, required: true },
    building          : { type: String, required: true },
    floor             : { type: Number, required: true },
    type              : { type: String, enum: ['standard','accessible','ev'], default: 'standard' },
    isActive          : { type: Boolean, default: true },
    currentAssignment : {
      type: new Schema({
        residentId: { type: Schema.Types.ObjectId, ref: 'Resident', required: true },
        assignedAt: { type: Date, required: true },
        expiresAt : { type: Date, required: true },
      }, { _id: false }),
      default: null,
    },
  },
  { timestamps: true }
);

ParkingSpotSchema.index({ building: 1, isActive: 1 });
ParkingSpotSchema.index({ building: 1, spotNumber: 1 }, { unique: true });
ParkingSpotSchema.index({ 'currentAssignment.residentId': 1 });
ParkingSpotSchema.index({ 'currentAssignment.expiresAt': 1 });

export const ParkingSpotModel: Model<ParkingSpotDocument> =
  mongoose.models.ParkingSpot ?? mongoose.model('ParkingSpot', ParkingSpotSchema);
