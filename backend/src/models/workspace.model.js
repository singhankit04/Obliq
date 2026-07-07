import mongoose from 'mongoose';

const workspaceSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },
    description: {
      type: String,
      default: '',
    },
    owner: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    updatedBy:{
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default:null,
    }
  },
  { timestamps: true }
);

const Workspace = mongoose.model('Workspace', workspaceSchema);
export default Workspace;
