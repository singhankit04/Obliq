import express from 'express';
import { protect } from '../middlewares/auth.middleware.js';
import { commentUpload } from '../middlewares/upload.middleware.js';
import {
  createTaskComment,
  getTaskComments,
  updateComment,
  deleteComment,
} from '../controllers/comment.controller.js';
import {
  validate,
  createCommentSchema,
  updateCommentSchema,
  commentIdSchema,
  taskIdParamsSchema,
} from '../validations/comment.validation.js';

const router = express.Router();


router.use(protect);


// Task comment routes
router.post(
  '/task/:taskId',
  commentUpload.array('attachments', 5),
  validate(createCommentSchema),
  createTaskComment
);

router.get(
  '/task/:taskId',
  validate(taskIdParamsSchema),
  getTaskComments
);

// Individual comment routes
router.put(
  '/:commentId',
  validate(updateCommentSchema),
  updateComment
);

router.delete(
  '/:commentId',
  validate(commentIdSchema),
  deleteComment
);

export default router;
