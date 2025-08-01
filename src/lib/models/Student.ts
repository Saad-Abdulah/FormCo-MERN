import mongoose, { Document, Schema } from 'mongoose';
import { IOrganization } from './Organization';

export interface IStudent extends Document {
  _id: string;
  name: string;
  email: string;
  password?: string; // Optional for Google OAuth users
  phone?: string;
  organizationId: mongoose.Types.ObjectId | IOrganization; // Reference to Organization
  educationLevel: 'high-school' | 'college' | 'higher-ed';
  yearOrSemester: string;
  country: string;
  googleId?: string; // For Google OAuth
  isGoogleAuth: boolean;
  profilePicture?: string;
  createdAt: Date;
  updatedAt: Date;
}

export type StudentWithoutPassword = Omit<IStudent, 'password'>;

const StudentSchema = new Schema<IStudent>({
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
    required: function(this: IStudent) {
      return !this.isGoogleAuth; // Password required only for non-Google users
    },
  },
  phone: {
    type: String,
    trim: true,
  },
  organizationId: {
    type: Schema.Types.ObjectId,
    ref: 'Organization',
    // required: true,
  },
  educationLevel: {
    type: String,
    enum: ['high-school', 'college', 'higher-ed'],
    required: true,
  },
  yearOrSemester: {
    type: String,
    required: true,
  },
  country: {
    type: String,
    required: true,
    default: 'Pakistan',
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
}, {
  timestamps: true,
  toJSON: {
    transform: function(doc, ret) {
      delete ret.password;
      return ret;
    }
  }
});

export default mongoose.models.Student || mongoose.model<IStudent>('Student', StudentSchema); 