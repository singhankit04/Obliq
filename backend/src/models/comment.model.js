import mongoose from 'mongoose';

const attachmentSchema = new mongoose.Schema(
  {
    originalName: { type: String, required: true },
    fileUrl: { type: String, required: true },
    publicId: { type: String, default: '' },
    fileType: {
      type: String,
      enum: ['image', 'video', 'pdf', 'raw'],
      required: true,
    },
    mimeType: { type: String, required: true },
    fileSize: { type: Number, default: 0 },
  },
  { _id: true }
);

const commentSchema = new mongoose.Schema(
  {
    task: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Task',
      required: true,
    },
    project: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Project',
      required: true,
    },
    author: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    content: {
      type: String,
      required: true,
      trim: true,
    },
    parentComment: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Comment',
      default: null,
    },
    attachments: [attachmentSchema],
    mentions: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
      },
    ],
    isEdited: {
      type: Boolean,
      default: false,
    },
    isDeleted: {
      type: Boolean,
      default: false,
    },
  },
  { timestamps: true }
);

commentSchema.index({ task: 1, createdAt: 1 });
commentSchema.index({ parentComment: 1 });

const Comment = mongoose.model('Comment', commentSchema);
export default Comment;
