import mongoose, { Document, Schema } from 'mongoose';

export interface IOrganization extends Document {
  _id: string;
  name: string;
  email: string;
  password: string;
  website?: string;
  logo?: string;
  isEmailVerified: boolean;
  emailVerificationCode?: string;
  emailVerificationExpiry?: Date;
  secretCode: string; // For organizers to join
  authorizedOrganizers: mongoose.Types.ObjectId[]; // List of organizer IDs
  createdAt: Date;
  updatedAt: Date;
}

export type OrganizationWithoutPassword = Omit<IOrganization, 'password'>;

const OrganizationSchema = new Schema<IOrganization>({
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
    required: true,
  },
  website: {
    type: String,
    trim: true,
  },
  logo: {
    type: String, // URL or base64
  },
  isEmailVerified: {
    type: Boolean,
    default: false,
  },
  emailVerificationCode: {
    type: String,
  },
  emailVerificationExpiry: {
    type: Date,
  },
  secretCode: {
    type: String,
    required: true,
    unique: true,
  },
  authorizedOrganizers: [{
    type: Schema.Types.ObjectId,
    ref: 'Organizer',
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

// Generate secret code before saving
OrganizationSchema.pre('save', function(next) {
  if (this.isNew && !this.secretCode) {
    this.secretCode = Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
  }
  next();
});

export default mongoose.models.Organization || mongoose.model<IOrganization>('Organization', OrganizationSchema); 