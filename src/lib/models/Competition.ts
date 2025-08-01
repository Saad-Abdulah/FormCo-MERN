import mongoose, { Document, Schema } from 'mongoose';
import { IOrganizer } from './Organizer';
import { IOrganization } from './Organization';

interface TeamMemberFields {
  name: string;
  email: string;
  institute?: string;
  contact?: string;
  resume?: string;
  qualification?: string;
  isTeamLead?: boolean;
}

export interface ICompetition extends Document {
  _id: string;
  title: string;
  description: string;
  instructions: string;
  organizer?: mongoose.Types.ObjectId | IOrganizer;
  organization: mongoose.Types.ObjectId | IOrganization;
  deadlineToApply: Date;
  startDate: Date;
  endDate: Date;
  registrationFee: number;
  verificationNeeded: boolean;
  accountDetails?: {
    name: string;
    number: string;
    type: string;
  };
  isTeamEvent: boolean;
  teamSize?: {
    min: number;
    max: number;
  };
  teamMemberFields?: {
    name: boolean;
    email: boolean;
    institute: boolean;
    contact: boolean;
    resume: boolean;
    qualification: boolean;
  };
  requiredApplicationFields: string[];
  mode: 'online' | 'onsite' | 'hybrid';
  location?: string;
  event?: string;
  skillsRequired: string[];
  eligibility?: string;
  category: string;
  createdAt: Date;
}

const CompetitionSchema = new Schema<ICompetition>({
  title: {
    type: String,
    required: [true, 'Title is required'],
    trim: true,
  },
  description: {
    type: String,
    required: [true, 'Description is required'],
  },
  instructions: {
    type: String,
    required: [true, 'Instructions are required'],
  },
  organizer: {
    type: Schema.Types.ObjectId,
    ref: 'Organizer',
  },
  organization: {
    type: Schema.Types.ObjectId,
    ref: 'Organization',
    required: [true, 'Organization is required'],
  },
  deadlineToApply: {
    type: Date,
    required: [true, 'Application deadline is required'],
  },
  startDate: {
    type: Date,
    required: [true, 'Start date is required'],
  },
  endDate: {
    type: Date,
    required: [true, 'End date is required'],
  },
  registrationFee: {
    type: Number,
    default: 0,
    min: [0, 'Registration fee cannot be negative'],
  },
  verificationNeeded: {
    type: Boolean,
    default: false,
  },
  accountDetails: {
    name: {
      type: String,
      trim: true,
    },
    number: {
      type: String,
      trim: true,
    },
    type: {
      type: String,
      trim: true,
    },
  },
  isTeamEvent: {
    type: Boolean,
    default: false,
  },
  teamSize: {
    min: {
      type: Number
    },
    max: {
      type: Number
    }
  },
  teamMemberFields: {
    name: { type: Boolean, default: true },
    email: { type: Boolean, default: true },
    institute: { type: Boolean, default: false },
    contact: { type: Boolean, default: false },
    resume: { type: Boolean, default: false },
    qualification: { type: Boolean, default: false }
  },
  requiredApplicationFields: [{
    type: String,
    enum: ['name', 'email', 'institute', 'contact', 'resume', 'qualification'],
  }],
  mode: {
    type: String,
    enum: ['online', 'onsite', 'hybrid'],
    required: [true, 'Mode is required'],
    default: 'online',
  },
  location: {
    type: String,
    required: [
      function(this: ICompetition) {
        return this.mode === 'onsite' || this.mode === 'hybrid';
      },
      'Location is required for onsite or hybrid events'
    ],
  },
  event: {
    type: String,
  },
  skillsRequired: [{
    type: String,
    trim: true,
  }],
  eligibility: {
    type: String,
  },
  category: {
    type: String,
    required: [true, 'Category is required'],
  },
}, {
  timestamps: true,
});

// Ensure title uniqueness within an organization
CompetitionSchema.index({ title: 1, organization: 1 }, { unique: true });

// Clear any cached model to ensure fresh validation
if (mongoose.models.Competition) {
  delete mongoose.models.Competition;
}

export default mongoose.model<ICompetition>('Competition', CompetitionSchema); 