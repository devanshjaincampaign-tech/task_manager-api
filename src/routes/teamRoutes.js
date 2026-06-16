// src/routes/teamRoutes.js
const express    = require('express');
const router     = express.Router();
const controller = require('../controllers/teamController');
const auth       = require('../middleware/auth');

// All team routes require authentication
router.use(auth);

router.post('/',                                    controller.createTeam);
router.get('/',                                     controller.getMyTeams);
router.get('/:teamId',                              controller.getTeam);
router.post('/:teamId/members',                     controller.inviteMember);
router.delete('/:teamId/members/:memberId',         controller.removeMember);
router.patch('/:teamId/members/:memberId/role',     controller.updateMemberRole);
router.delete('/:teamId',                           controller.deleteTeam);

module.exports = router;