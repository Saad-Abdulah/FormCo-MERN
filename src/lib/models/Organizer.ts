import mongoose, { Document, Schema } from 'mongoose';
import { IOrganization } from './Organization';

export interface IOrganizer extends Document {
  _id: string;
  name: string;
  email: string;
  password?: string; // Optional for Google OAuth users
  phone?: string;
  department?: string;
  position?: string;
  googleId?: string; // For Google OAuth
  isGoogleAuth: boolean;
  profilePicture?: string;
  isApproved: boolean; // Organization admin approval
  organizations: mongoose.Types.ObjectId[] | IOrganization[]; // Organizations the organizer belongs to
  createdAt: Date;
  updatedAt: Date;
}

export type OrganizerWithoutPassword = Omit<IOrganizer, 'password'>;

const OrganizerSchema = new Schema<IOrganizer>({
  name: {
    type: String,
    required: true,
    trim: true,
  },
  email: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
    trim: true,
  },
  password: {
    type: String,
    required: function(this: IOrganizer) {
      return !this.isGoogleAuth; // Password required only for non-Google users
    },
  },
  phone: {
    type: String,
    trim: true,
  },
  department: {
    type: String,
    trim: true,
  },
  position: {
    type: String,
    trim: true,
  },
  googleId: {
    type: String,
    unique: true,
    sparse: true, // Allows null values to be non-unique
  },
  isGoogleAuth: {
    type: Boolean,
    default: false,
  },
  profilePicture: {
    type: String, // URL
  },
  isApproved: {
    type: Boolean,
    default: false, // Requires organization admin approval
  },
  organizations: [{
    type: Schema.Types.ObjectId,
    ref: 'Organization',
  }],
}, {
  timestamps: true,
  toJSON: {
    transform: function(doc, ret) {
      delete ret.password;
      return ret;
    }
  }
});

export default mongoose.models.Organizer || mongoose.model<IOrganizer>('Organizer', OrganizerSchema); 