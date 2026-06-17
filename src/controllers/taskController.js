// src/controllers/taskController.js
const TaskModel  = require('../models/taskModel');
const TeamModel  = require('../models/teamModel');
const UserModel  = require('../models/userModel');
const { sendEmail, taskAssignedEmail, taskStatusChangedEmail } = require('../utils/sendEmail');
const path = require('path');
const fs   = require('fs');

// POST /api/teams/:teamId/tasks
// Create a task inside a team
// Any team member can create a task
// Only admin and manager can assign it to someone
const createTask = async (req, res) => {
  try {
    const teamId = parseInt(req.params.teamId);
    const userId = req.user.userId;
    const { title, description, priority, dueDate, assignedTo } = req.body;

    if (!title || title.trim().length < 3) {
      return res.status(400).json({
        error:   'Validation Failed',
        message: 'Title must be at least 3 characters'
      });
    }

    // Check user is a member
    const membership = await TeamModel.getMembership(teamId, userId);
    if (!membership) {
      return res.status(403).json({
        error:   'Forbidden',
        message: 'You are not a member of this team'
      });
    }

    // Only admin and manager can assign tasks to others
    if (assignedTo && !['admin', 'manager'].includes(membership.role)) {
      return res.status(403).json({
        error:   'Forbidden',
        message: 'Only admins and managers can assign tasks to others'
      });
    }

    // Validate assignee is a team member
    if (assignedTo) {
      const assigneeMembership = await TeamModel.getMembership(teamId, assignedTo);
      if (!assigneeMembership) {
        return res.status(400).json({
          error:   'Bad Request',
          message: 'Assigned user is not a member of this team'
        });
      }
    }

    const validPriorities = ['low', 'medium', 'high', 'urgent'];
    if (priority && !validPriorities.includes(priority)) {
      return res.status(400).json({
        error:   'Validation Failed',
        message: 'Priority must be low, medium, high, or urgent'
      });
    }

    const task = await TaskModel.create(
      title.trim(),
      description ? description.trim() : null,
      priority || 'medium',
      dueDate || null,
      teamId,
      userId,
      assignedTo || null
    );

    // Send email notification to assignee
    if (assignedTo && assignedTo !== userId) {
      const assignee = await UserModel.findById(assignedTo);
      const assigner = await UserModel.findById(userId);
      const team     = await TeamModel.getById(teamId);

      if (assignee && assigner && team) {
        const emailHtml = taskAssignedEmail(
          assignee.name,
          assigner.name,
          title,
          team.name,
          dueDate
        );
        // Send email without awaiting — do not block response
        sendEmail(assignee.email, `New task assigned: ${title}`, emailHtml);
      }
    }

    res.status(201).json({
      message: 'Task created successfully',
      task
    });

  } catch (err) {
    console.error('Create task error:', err.message);
    res.status(500).json({ error: 'Could not create task' });
  }
};

// GET /api/teams/:teamId/tasks
// Get all tasks in a team
// Supports filters: status, priority, assignedTo
// Supports cursor-based pagination
const getTasks = async (req, res) => {
  try {
    const teamId = parseInt(req.params.teamId);
    const userId = req.user.userId;

    const membership = await TeamModel.getMembership(teamId, userId);
    if (!membership) {
      return res.status(403).json({
        error:   'Forbidden',
        message: 'You are not a member of this team'
      });
    }

    const filters = {
      status:     req.query.status     || null,
      priority:   req.query.priority   || null,
      assignedTo: req.query.assignedTo ? parseInt(req.query.assignedTo) : null,
      cursor:     req.query.cursor     ? parseInt(req.query.cursor)     : null,
      limit:      req.query.limit      ? parseInt(req.query.limit)      : 20
    };

    const tasks = await TaskModel.getByTeamId(teamId, filters);

    // Determine next cursor for pagination
    // If we got a full page, there might be more
    const nextCursor = tasks.length === filters.limit
      ? tasks[tasks.length - 1].id
      : null;

    res.status(200).json({
      count:      tasks.length,
      nextCursor: nextCursor,
      tasks
    });

  } catch (err) {
    console.error('Get tasks error:', err.message);
    res.status(500).json({ error: 'Could not fetch tasks' });
  }
};

// GET /api/teams/:teamId/tasks/:taskId
// Get one specific task with attachments
const getTask = async (req, res) => {
  try {
    const teamId = parseInt(req.params.teamId);
    const taskId = parseInt(req.params.taskId);
    const userId = req.user.userId;

    const membership = await TeamModel.getMembership(teamId, userId);
    if (!membership) {
      return res.status(403).json({
        error:   'Forbidden',
        message: 'You are not a member of this team'
      });
    }

    const task = await TaskModel.getById(taskId);

    if (!task || task.team_id !== teamId) {
      return res.status(404).json({ error: 'Task not found' });
    }

    res.status(200).json({ task });

  } catch (err) {
    console.error('Get task error:', err.message);
    res.status(500).json({ error: 'Could not fetch task' });
  }
};

// PUT /api/teams/:teamId/tasks/:taskId
// Update task details
// Admin and manager can update everything
// Members can only update tasks assigned to them
const updateTask = async (req, res) => {
  try {
    const teamId = parseInt(req.params.teamId);
    const taskId = parseInt(req.params.taskId);
    const userId = req.user.userId;
    const { title, description, status, priority, dueDate, assignedTo } = req.body;

    const membership = await TeamModel.getMembership(teamId, userId);
    if (!membership) {
      return res.status(403).json({
        error:   'Forbidden',
        message: 'You are not a member of this team'
      });
    }

    const task = await TaskModel.getById(taskId);
    if (!task || task.team_id !== teamId) {
      return res.status(404).json({ error: 'Task not found' });
    }

    // Members can only update their own assigned tasks
    const isAdminOrManager = ['admin', 'manager'].includes(membership.role);
    if (!isAdminOrManager && task.assigned_to?.id !== userId) {
      return res.status(403).json({
        error:   'Forbidden',
        message: 'You can only update tasks assigned to you'
      });
    }

    // Only admin/manager can reassign tasks
    if (assignedTo !== undefined && !isAdminOrManager) {
      return res.status(403).json({
        error:   'Forbidden',
        message: 'Only admins and managers can reassign tasks'
      });
    }

    const validStatuses = ['todo', 'in-progress', 'review', 'done'];
    if (status && !validStatuses.includes(status)) {
      return res.status(400).json({
        error:   'Validation Failed',
        message: 'Status must be todo, in-progress, review, or done'
      });
    }

    const updated = await TaskModel.update(taskId, {
      title, description, status, priority, dueDate,
      assignedTo: assignedTo !== undefined ? assignedTo : task.assigned_to?.id
    });

    res.status(200).json({
      message: 'Task updated successfully',
      task:    updated
    });

  } catch (err) {
    console.error('Update task error:', err.message);
    res.status(500).json({ error: 'Could not update task' });
  }
};

// PATCH /api/teams/:teamId/tasks/:taskId/status
// Update only the status field
// Any team member can change status
const updateStatus = async (req, res) => {
  try {
    const teamId = parseInt(req.params.teamId);
    const taskId = parseInt(req.params.taskId);
    const userId = req.user.userId;
    const { status } = req.body;

    const validStatuses = ['todo', 'in-progress', 'review', 'done'];
    if (!status || !validStatuses.includes(status)) {
      return res.status(400).json({
        error:   'Validation Failed',
        message: 'Status must be todo, in-progress, review, or done'
      });
    }

    const membership = await TeamModel.getMembership(teamId, userId);
    if (!membership) {
      return res.status(403).json({
        error:   'Forbidden',
        message: 'You are not a member of this team'
      });
    }

    const task = await TaskModel.getById(taskId);
    if (!task || task.team_id !== teamId) {
      return res.status(404).json({ error: 'Task not found' });
    }

    const oldStatus = task.status;
    const updated   = await TaskModel.updateStatus(taskId, status);

    // Notify task creator if someone else changed status
    if (task.created_by.id !== userId) {
      const creator = await UserModel.findById(task.created_by.id);
      const changer = await UserModel.findById(userId);

      if (creator && changer) {
        const emailHtml = taskStatusChangedEmail(
          creator.name,
          task.title,
          oldStatus,
          status,
          changer.name
        );
        sendEmail(creator.email, `Task status updated: ${task.title}`, emailHtml);
      }
    }

    res.status(200).json({
      message: 'Status updated successfully',
      task:    updated
    });

  } catch (err) {
    console.error('Update status error:', err.message);
    res.status(500).json({ error: 'Could not update status' });
  }
};

// DELETE /api/teams/:teamId/tasks/:taskId
// Delete a task
// Only admin, manager, or task creator can delete
const deleteTask = async (req, res) => {
  try {
    const teamId = parseInt(req.params.teamId);
    const taskId = parseInt(req.params.taskId);
    const userId = req.user.userId;

    const membership = await TeamModel.getMembership(teamId, userId);
    if (!membership) {
      return res.status(403).json({
        error:   'Forbidden',
        message: 'You are not a member of this team'
      });
    }

    const task = await TaskModel.getById(taskId);
    if (!task || task.team_id !== teamId) {
      return res.status(404).json({ error: 'Task not found' });
    }

    const isAdminOrManager = ['admin', 'manager'].includes(membership.role);
    const isCreator        = task.created_by.id === userId;

    if (!isAdminOrManager && !isCreator) {
      return res.status(403).json({
        error:   'Forbidden',
        message: 'Only admins, managers, or task creators can delete tasks'
      });
    }

    await TaskModel.remove(taskId);

    res.status(200).json({ message: 'Task deleted successfully' });

  } catch (err) {
    console.error('Delete task error:', err.message);
    res.status(500).json({ error: 'Could not delete task' });
  }
};

// POST /api/teams/:teamId/tasks/:taskId/attachments
// Upload a file attachment to a task
const uploadAttachment = async (req, res) => {
  try {
    const teamId = parseInt(req.params.teamId);
    const taskId = parseInt(req.params.taskId);
    const userId = req.user.userId;

    const membership = await TeamModel.getMembership(teamId, userId);
    if (!membership) {
      return res.status(403).json({
        error:   'Forbidden',
        message: 'You are not a member of this team'
      });
    }

    if (!req.file) {
      return res.status(400).json({
        error:   'Bad Request',
        message: 'No file uploaded'
      });
    }

    const task = await TaskModel.getById(taskId);
    if (!task || task.team_id !== teamId) {
      return res.status(404).json({ error: 'Task not found' });
    }

    const attachment = await TaskModel.addAttachment(
      taskId,
      req.file.filename,
      req.file.originalname,
      req.file.size,
      req.file.mimetype,
      userId
    );

    res.status(201).json({
      message: 'File uploaded successfully',
      attachment
    });

  } catch (err) {
    console.error('Upload attachment error:', err.message);
    res.status(500).json({ error: 'Could not upload file' });
  }
};

module.exports = {
  createTask, getTasks, getTask,
  updateTask, updateStatus, deleteTask,
  uploadAttachment
};