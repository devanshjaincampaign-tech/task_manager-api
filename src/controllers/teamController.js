// src/controllers/teamController.js
//
// ROLE-BASED ACCESS CONTROL explained:
//
// admin  → can do everything in the team
// manager → can create/assign tasks, cannot delete team
// member → can update task status, cannot manage team
//
// The getMembership check pattern:
// 1. Verify user is a member of the team at all
// 2. Check their role is sufficient for the action
// This runs on every protected team operation

const TeamModel = require('../models/teamModel');
const UserModel = require('../models/userModel');

// POST /api/teams
// Any logged in user can create a team
// Creator automatically becomes admin
const createTeam = async (req, res) => {
  try {
    const { name, description } = req.body;
    const userId = req.user.userId;

    if (!name || name.trim().length < 2) {
      return res.status(400).json({
        error:   'Validation Failed',
        message: 'Team name must be at least 2 characters'
      });
    }

    const team = await TeamModel.create(
      name.trim(),
      description ? description.trim() : null,
      userId
    );

    res.status(201).json({
      message: 'Team created successfully',
      team
    });

  } catch (err) {
    console.error('Create team error:', err.message);
    res.status(500).json({ error: 'Could not create team' });
  }
};

// GET /api/teams
// Get all teams the logged in user belongs to
const getMyTeams = async (req, res) => {
  try {
    const teams = await TeamModel.getByUserId(req.user.userId);

    res.status(200).json({
      count: teams.length,
      teams
    });

  } catch (err) {
    console.error('Get teams error:', err.message);
    res.status(500).json({ error: 'Could not fetch teams' });
  }
};

// GET /api/teams/:teamId
// Get full team details including member list
// User must be a member to see this
const getTeam = async (req, res) => {
  try {
    const teamId = parseInt(req.params.teamId);
    const userId = req.user.userId;

    if (isNaN(teamId)) {
      return res.status(400).json({ error: 'Team ID must be a number' });
    }

    // Check user is a member
    const membership = await TeamModel.getMembership(teamId, userId);
    if (!membership) {
      return res.status(403).json({
        error:   'Forbidden',
        message: 'You are not a member of this team'
      });
    }

    const team = await TeamModel.getById(teamId);
    if (!team) {
      return res.status(404).json({ error: 'Team not found' });
    }

    res.status(200).json({ team });

  } catch (err) {
    console.error('Get team error:', err.message);
    res.status(500).json({ error: 'Could not fetch team' });
  }
};

// POST /api/teams/:teamId/members
// Invite a user to the team by their email
// Only admin can invite members
const inviteMember = async (req, res) => {
  try {
    const teamId = parseInt(req.params.teamId);
    const userId = req.user.userId;
    const { email, role = 'member' } = req.body;

    if (isNaN(teamId)) {
      return res.status(400).json({ error: 'Team ID must be a number' });
    }

    if (!email) {
      return res.status(400).json({
        error:   'Validation Failed',
        message: 'Email is required'
      });
    }

    // Validate role value
    const validRoles = ['admin', 'manager', 'member'];
    if (!validRoles.includes(role)) {
      return res.status(400).json({
        error:   'Validation Failed',
        message: 'Role must be admin, manager, or member'
      });
    }

    // Check requester is admin
    const membership = await TeamModel.getMembership(teamId, userId);
    if (!membership || membership.role !== 'admin') {
      return res.status(403).json({
        error:   'Forbidden',
        message: 'Only team admins can invite members'
      });
    }

    // Find user to invite
    const userToInvite = await UserModel.findByEmail(email.toLowerCase().trim());
    if (!userToInvite) {
      return res.status(404).json({
        error:   'Not Found',
        message: 'No user found with that email address'
      });
    }

    // Check if already a member
    const existing = await TeamModel.getMembership(teamId, userToInvite.id);
    if (existing) {
      return res.status(409).json({
        error:   'Conflict',
        message: 'This user is already a member of the team'
      });
    }

    await TeamModel.addMember(teamId, userToInvite.id, role);

    res.status(201).json({
      message: `${userToInvite.name} added to team as ${role}`,
      member: {
        id:    userToInvite.id,
        name:  userToInvite.name,
        email: userToInvite.email,
        role
      }
    });

  } catch (err) {
    console.error('Invite member error:', err.message);
    res.status(500).json({ error: 'Could not add member' });
  }
};

// DELETE /api/teams/:teamId/members/:memberId
// Remove a member from the team
// Only admin can remove members
// Admin cannot remove themselves if they are the owner
const removeMember = async (req, res) => {
  try {
    const teamId   = parseInt(req.params.teamId);
    const memberId = parseInt(req.params.memberId);
    const userId   = req.user.userId;

    // Check requester is admin
    const membership = await TeamModel.getMembership(teamId, userId);
    if (!membership || membership.role !== 'admin') {
      return res.status(403).json({
        error:   'Forbidden',
        message: 'Only team admins can remove members'
      });
    }

    // Cannot remove yourself
    if (memberId === userId) {
      return res.status(400).json({
        error:   'Bad Request',
        message: 'You cannot remove yourself from the team'
      });
    }

    const removed = await TeamModel.removeMember(teamId, memberId);
    if (!removed) {
      return res.status(404).json({
        error:   'Not Found',
        message: 'Member not found in this team'
      });
    }

    res.status(200).json({ message: 'Member removed successfully' });

  } catch (err) {
    console.error('Remove member error:', err.message);
    res.status(500).json({ error: 'Could not remove member' });
  }
};

// PATCH /api/teams/:teamId/members/:memberId/role
// Change a member's role
// Only admin can change roles
const updateMemberRole = async (req, res) => {
  try {
    const teamId   = parseInt(req.params.teamId);
    const memberId = parseInt(req.params.memberId);
    const userId   = req.user.userId;
    const { role } = req.body;

    const validRoles = ['admin', 'manager', 'member'];
    if (!role || !validRoles.includes(role)) {
      return res.status(400).json({
        error:   'Validation Failed',
        message: 'Role must be admin, manager, or member'
      });
    }

    // Check requester is admin
    const membership = await TeamModel.getMembership(teamId, userId);
    if (!membership || membership.role !== 'admin') {
      return res.status(403).json({
        error:   'Forbidden',
        message: 'Only team admins can change roles'
      });
    }

    const updated = await TeamModel.updateMemberRole(teamId, memberId, role);
    if (!updated) {
      return res.status(404).json({ error: 'Member not found' });
    }

    res.status(200).json({
      message: 'Role updated successfully',
      member:  updated
    });

  } catch (err) {
    console.error('Update role error:', err.message);
    res.status(500).json({ error: 'Could not update role' });
  }
};

// DELETE /api/teams/:teamId
// Delete the team entirely
// Only the team owner can do this
const deleteTeam = async (req, res) => {
  try {
    const teamId = parseInt(req.params.teamId);
    const userId = req.user.userId;

    const team = await TeamModel.getById(teamId);
    if (!team) {
      return res.status(404).json({ error: 'Team not found' });
    }

    // Only the original owner can delete the team
    if (team.owner_id !== userId) {
      return res.status(403).json({
        error:   'Forbidden',
        message: 'Only the team owner can delete the team'
      });
    }

    await TeamModel.deleteTeam(teamId);

    res.status(200).json({ message: 'Team deleted successfully' });

  } catch (err) {
    console.error('Delete team error:', err.message);
    res.status(500).json({ error: 'Could not delete team' });
  }
};

module.exports = {
  createTeam, getMyTeams, getTeam,
  inviteMember, removeMember, updateMemberRole, deleteTeam
};