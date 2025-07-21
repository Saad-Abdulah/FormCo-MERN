import mongoose, { Document, Schema } from 'mongoose';

export interface ITeamMember extends Document {
  name: string;
  email: string;
  institute?: string;
  contact?: string;
  resume?: string;
  qualification?: string;
  isTeamLead: boolean;
  additionalInfo?: Record<string, string>;
}

const TeamMemberSchema = new Schema<ITeamMember>({
  name: {
    type: String,
    required: [true, 'Name is required'],
    trim: true,
  },
  email: {
    type: String,
    required: [true, 'Email is required'],
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
  resume: {
    type: String,
  },
  qualification: {
    type: String,
    trim: true,
  },
  isTeamLead: {
    type: Boolean,
    default: false,
  },
  additionalInfo: {
    type: Map,
    of: String,
    default: {},
  },
});

export default mongoose.models.TeamMember || mongoose.model<ITeamMember>('TeamMember', TeamMemberSchema); 