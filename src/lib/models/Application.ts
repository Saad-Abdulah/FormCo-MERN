import mongoose, { Document, Schema } from 'mongoose';
import { ICompetition } from './Competition';
import { IStudent } from './Student';

export interface IApplication extends Document {
  _id: string;
  competition: mongoose.Types.ObjectId | ICompetition;
  student: mongoose.Types.ObjectId | IStudent;
  teamName?: string;
  teamMembers?: {
    name: string;
    email: string;
    institute?: string;
    contact?: string;
    qualification?: string;
    resume?: string;
    [key: string]: any; // For any additional required fields
  }[];
  // Payment information
  paymentAmount: number;
  paymentDate?: Date;
  paymentReference?: string;
  // Payment verification
  receiptImage?: string;
  transactionId?: string;
  paymentVerified: boolean;
  // Verification
  verificationCode?: string;
  // Timestamps
  submittedAt: Date;
  updatedAt: Date;
  // Additional fields
  additionalInfo?: Record<string, any>;
  notes?: string;
}

const ApplicationSchema = new Schema<IApplication>({
  competition: {
    type: Schema.Types.ObjectId,
    ref: 'Competition',
    required: true,
  },
  student: {
    type: Schema.Types.ObjectId,
    ref: 'Student',
    required: true,
  },
  // Team related fields
  teamName: {
    type: String,
    trim: true,
    validate: {
      validator: async function(this: IApplication) {
        if (!this.competition) return true;
        const competition = await mongoose.model('Competition').findById(this.competition);
        return !competition?.isTeamEvent || (competition?.isTeamEvent && this.teamName);
      },
      message: 'Team name is required for team events',
    },
  },
  teamMembers: [{
    name: {
      type: String,
      trim: true,
    },
    email: {
      type: String,
      trim: true,
      lowercase: true,
    },
    institute: {
      type: String,
      trim: true,
    },
    contact: {
      type: String,
      trim: true,
    },
    qualification: {
      type: String,
      trim: true,
    },
    resume: {
      type: String, // URL to the resume file
    },
  }],
  // Payment fields
  paymentAmount: {
    type: Number,
    default: 0,
  },
  paymentDate: Date,
  paymentReference: String,
  // Payment verification fields
  receiptImage: {
    type: String,
    trim: true,
  },
  transactionId: {
    type: String,
    trim: true,
  },
  paymentVerified: {
    type: Boolean,
    default: false,
  },
  // Verification fields
  verificationCode: String,
  // Additional fields
  additionalInfo: {
    type: Map,
    of: Schema.Types.Mixed,
  },
  notes: {
    type: String,
    trim: true,
  },
}, {
  timestamps: true,
});

// Indexes
ApplicationSchema.index({ competition: 1, student: 1 }, { unique: true });
ApplicationSchema.index({ competition: 1 });
ApplicationSchema.index({ student: 1 });
ApplicationSchema.index({ paymentVerified: 1 });

// Middleware to set payment and verification status
ApplicationSchema.pre('save', async function(next) {
  if (this.isNew) {
    const competition = await mongoose.model('Competition').findById(this.competition);
    
    // Set payment amount
    if (competition?.registrationFee > 0) {
      this.paymentAmount = competition.registrationFee;
    }

    // Always generate verification code for all applications
    this.verificationCode = Math.random().toString(36).substring(2, 8).toUpperCase();
  }
  next();
});

export default mongoose.models.Application || mongoose.model<IApplication>('Application', ApplicationSchema); 