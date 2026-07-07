import mongoose from 'mongoose';

const projectSchema = new mongoose.Schema(
  {
    workspace: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Workspace',
      required: true,
    },
    name: {
      type: String,
      required: true,
      trim: true,
    },
    description: {
      type: String,
      default: '',
    },
    manager: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    status: {
      type: String,
      enum: ['active', 'completed', 'archived'],
      default: 'active',
    },
    updatedBy:{
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default:null,
    }
  },
  { timestamps: true }
);

const Project = mongoose.model('Project', projectSchema);
export default Project;
