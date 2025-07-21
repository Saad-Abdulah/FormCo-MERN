import mongoose, { Document, Schema } from 'mongoose';
import { ITeamMember } from './TeamMember';
import { ICompetition } from './Competition';

export interface ITeamRegistration extends Document {
  competition: mongoose.Types.ObjectId | ICompetition;
  teamName: string;
  members: (mongoose.Types.ObjectId | ITeamMember)[];
  teamLead: mongoose.Types.ObjectId | ITeamMember;
  status: 'pending' | 'approved' | 'rejected';
  paymentVerified: boolean;
  registrationDate: Date;
  additionalInfo?: Record<string, string>;
}

const TeamRegistrationSchema = new Schema<ITeamRegistration>({
  competition: {
    type: Schema.Types.ObjectId,
    ref: 'Competition',
    required: [true, 'Competition is required'],
  },
  teamName: {
    type: String,
    required: [true, 'Team name is required'],
    trim: true,
  },
  members: [{
    type: Schema.Types.ObjectId,
    ref: 'TeamMember',
    required: [true, 'At least one team member is required'],
  }],
  teamLead: {
    type: Schema.Types.ObjectId,
    ref: 'TeamMember',
    required: [true, 'Team lead is required'],
  },
  status: {
    type: String,
    enum: ['pending', 'approved', 'rejected'],
    default: 'pending',
  },
  paymentVerified: {
    type: Boolean,
    default: false,
  },
  registrationDate: {
    type: Date,
    default: Date.now,
  },
  additionalInfo: {
    type: Map,
    of: String,
    default: {},
  },
}, {
  timestamps: true,
});

// Validate team size based on competition requirements
TeamRegistrationSchema.pre('save', async function(next) {
  try {
    const competition = await mongoose.model('Competition').findById(this.competition);
    if (!competition) {
      throw new Error('Competition not found');
    }

    if (competition.isTeamEvent) {
      const memberCount = this.members.length;
      if (memberCount < competition.teamSize.min) {
        throw new Error(`Team must have at least ${competition.teamSize.min} members`);
      }
      if (memberCount > competition.teamSize.max) {
        throw new Error(`Team cannot have more than ${competition.teamSize.max} members`);
      }
    }

    next();
  } catch (error) {
    next(error as Error);
  }
});

export default mongoose.models.TeamRegistration || mongoose.model<ITeamRegistration>('TeamRegistration', TeamRegistrationSchema); 