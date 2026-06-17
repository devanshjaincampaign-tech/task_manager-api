// src/routes/taskRoutes.js
const express    = require('express');
const router     = express.Router({ mergeParams: true });
// mergeParams: true allows access to :teamId from parent router
const controller = require('../controllers/taskController');
const auth       = require('../middleware/auth');
const upload     = require('../middleware/upload');

router.use(auth);

router.post('/',                              controller.createTask);
router.get('/',                               controller.getTasks);
router.get('/:taskId',                        controller.getTask);
router.put('/:taskId',                        controller.updateTask);
router.patch('/:taskId/status',               controller.updateStatus);
router.delete('/:taskId',                     controller.deleteTask);
router.post('/:taskId/attachments',
  upload.single('file'),
  controller.uploadAttachment
);

module.exports = router;