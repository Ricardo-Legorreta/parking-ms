import mongoose, { Schema, Document, Model } from 'mongoose';

export interface ResidentDocument extends Document {
  auth0Id           : string;
  name              : string;
  email             : string;
  unit              : string;
  building          : string;
  vehicle?          : { plate: string; model: string; color: string };
  totalWins         : number;
  role              : 'resident' | 'admin';
  isActive          : boolean;
  registeredAt      : Date;
  updatedAt         : Date;
}

const ResidentSchema = new Schema<ResidentDocument>(
  {
    auth0Id           : { type: String, required: true, unique: true },
    name              : { type: String, required: true, maxlength: 100 },
    email             : { type: String, required: true, unique: true, lowercase: true },
    unit              : { type: String, required: true },
    building          : { type: String, required: true },
    vehicle           : {
      type    : new Schema({ plate: String, model: String, color: String }, { _id: false }),
      required: false,
    },
    totalWins         : { type: Number, default: 0 },
    role              : { type: String, enum: ['resident', 'admin'], default: 'resident' },
    isActive          : { type: Boolean, default: true },
  },
  { timestamps: { createdAt: 'registeredAt', updatedAt: 'updatedAt' } }
);

ResidentSchema.index({ building: 1, isActive: 1 });
ResidentSchema.index({ building: 1, unit: 1 }, { unique: true });

export const ResidentModel: Model<ResidentDocument> =
  mongoose.models.Resident ?? mongoose.model('Resident', ResidentSchema);
