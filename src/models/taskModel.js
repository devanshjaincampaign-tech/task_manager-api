// src/models/taskModel.js
// All database queries for tasks and attachments
const pool = require('../config/db');

// Create a new task in a team
const create = async (title, description, priority, dueDate, teamId, createdBy, assignedTo) => {
  const result = await pool.query(
    `INSERT INTO tasks
       (title, description, priority, due_date, team_id, created_by, assigned_to)
     VALUES ($1, $2, $3, $4, $5, $6, $7)
     RETURNING *`,
    [title, description, priority, dueDate, teamId, createdBy, assignedTo]
  );
  return result.rows[0];
};

// Get all tasks for a team with optional filters
// Supports filtering by status, priority, and assigned user
const getByTeamId = async (teamId, filters = {}) => {
  let query = `
    SELECT
      t.id,
      t.title,
      t.description,
      t.status,
      t.priority,
      t.due_date,
      t.created_at,
      t.updated_at,
      json_build_object('id', creator.id, 'name', creator.name) AS created_by,
      CASE WHEN t.assigned_to IS NOT NULL
        THEN json_build_object('id', assignee.id, 'name', assignee.name)
        ELSE NULL
      END AS assigned_to,
      COUNT(ta.id) AS attachment_count
    FROM      tasks t
    JOIN      users creator  ON t.created_by   = creator.id
    LEFT JOIN users assignee ON t.assigned_to  = assignee.id
    LEFT JOIN task_attachments ta ON t.id       = ta.task_id
    WHERE t.team_id = $1
  `;

  const params = [teamId];
  let paramCount = 1;

  if (filters.status) {
    paramCount++;
    query += ` AND t.status = $${paramCount}`;
    params.push(filters.status);
  }

  if (filters.priority) {
    paramCount++;
    query += ` AND t.priority = $${paramCount}`;
    params.push(filters.priority);
  }

  if (filters.assignedTo) {
    paramCount++;
    query += ` AND t.assigned_to = $${paramCount}`;
    params.push(filters.assignedTo);
  }

  query += ' GROUP BY t.id, creator.id, creator.name, assignee.id, assignee.name';
  query += ' ORDER BY t.created_at DESC';

  // Cursor-based pagination
  // More reliable than offset pagination for live data
  if (filters.cursor) {
    paramCount++;
    query = query.replace(
      'ORDER BY t.created_at DESC',
      `AND t.id < $${paramCount} ORDER BY t.created_at DESC`
    );
    params.push(filters.cursor);
  }

  if (filters.limit) {
    paramCount++;
    query += ` LIMIT $${paramCount}`;
    params.push(filters.limit);
  }

  const result = await pool.query(query, params);
  return result.rows;
};

// Get one task by ID
const getById = async (taskId) => {
  const result = await pool.query(
    `SELECT
       t.*,
       json_build_object('id', creator.id, 'name', creator.name, 'email', creator.email) AS created_by,
       CASE WHEN t.assigned_to IS NOT NULL
         THEN json_build_object('id', assignee.id, 'name', assignee.name, 'email', assignee.email)
         ELSE NULL
       END AS assigned_to,
       COALESCE(
         json_agg(
           json_build_object(
             'id',           ta.id,
             'filename',     ta.filename,
             'originalName', ta.original_name,
             'fileSize',     ta.file_size,
             'uploadedAt',   ta.created_at
           )
         ) FILTER (WHERE ta.id IS NOT NULL),
         '[]'
       ) AS attachments
     FROM      tasks t
     JOIN      users creator  ON t.created_by  = creator.id
     LEFT JOIN users assignee ON t.assigned_to = assignee.id
     LEFT JOIN task_attachments ta ON t.id = ta.task_id
     WHERE t.id = $1
     GROUP BY t.id, creator.id, creator.name, creator.email,
              assignee.id, assignee.name, assignee.email`,
    [taskId]
  );
  return result.rows[0] || null;
};

// Update a task
const update = async (taskId, fields) => {
  const {
    title, description, status,
    priority, dueDate, assignedTo
  } = fields;

  const result = await pool.query(
    `UPDATE tasks
     SET
       title       = COALESCE($1, title),
       description = COALESCE($2, description),
       status      = COALESCE($3, status),
       priority    = COALESCE($4, priority),
       due_date    = COALESCE($5, due_date),
       assigned_to = $6,
       updated_at  = NOW()
     WHERE id = $7
     RETURNING *`,
    [title, description, status, priority, dueDate, assignedTo, taskId]
  );
  return result.rows[0] || null;
};

// Update only the status field
const updateStatus = async (taskId, status) => {
  const result = await pool.query(
    `UPDATE tasks
     SET status = $1, updated_at = NOW()
     WHERE id = $2
     RETURNING *`,
    [status, taskId]
  );
  return result.rows[0] || null;
};

// Delete a task
const remove = async (taskId) => {
  const result = await pool.query(
    'DELETE FROM tasks WHERE id = $1 RETURNING *',
    [taskId]
  );
  return result.rows[0] || null;
};

// Add a file attachment to a task
const addAttachment = async (taskId, filename, originalName, fileSize, mimeType, uploadedBy) => {
  const result = await pool.query(
    `INSERT INTO task_attachments
       (task_id, filename, original_name, file_size, mime_type, uploaded_by)
     VALUES ($1, $2, $3, $4, $5, $6)
     RETURNING *`,
    [taskId, filename, originalName, fileSize, mimeType, uploadedBy]
  );
  return result.rows[0];
};

// Delete an attachment
const deleteAttachment = async (attachmentId) => {
  const result = await pool.query(
    'DELETE FROM task_attachments WHERE id = $1 RETURNING *',
    [attachmentId]
  );
  return result.rows[0] || null;
};

module.exports = {
  create, getByTeamId, getById, update,
  updateStatus, remove, addAttachment, deleteAttachment
};