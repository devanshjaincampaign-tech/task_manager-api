// src/models/teamModel.js
// All database queries for teams and team membership
//
// Key concept: team_members is a junction table
// It connects users and teams in a many-to-many relationship
// One user can be in many teams
// One team can have many users
// The role column tells us what each user can do in that team

const pool = require('../config/db');

// Create a new team
// After creating, automatically add the creator as admin
const create = async (name, description, ownerId) => {
  // Use a transaction — both inserts must succeed or neither does
  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    // Create the team
    const teamResult = await client.query(
      `INSERT INTO teams (name, description, owner_id)
       VALUES ($1, $2, $3)
       RETURNING *`,
      [name, description, ownerId]
    );
    const team = teamResult.rows[0];

    // Add creator as admin member automatically
    await client.query(
      `INSERT INTO team_members (team_id, user_id, role)
       VALUES ($1, $2, 'admin')`,
      [team.id, ownerId]
    );

    await client.query('COMMIT');
    return team;

  } catch (err) {
    await client.query('ROLLBACK');
    throw err;
  } finally {
    client.release();
  }
};

// Get all teams a user belongs to
// JOIN shows team info + user's role in each team
const getByUserId = async (userId) => {
  const result = await pool.query(
    `SELECT
       t.id,
       t.name,
       t.description,
       t.owner_id,
       t.created_at,
       tm.role,
       COUNT(tm2.user_id) AS member_count
     FROM     teams t
     JOIN     team_members tm  ON t.id = tm.team_id  AND tm.user_id = $1
     LEFT JOIN team_members tm2 ON t.id = tm2.team_id
     GROUP BY t.id, t.name, t.description, t.owner_id, t.created_at, tm.role
     ORDER BY t.created_at DESC`,
    [userId]
  );
  return result.rows;
};

// Get one team by ID with full member list
const getById = async (teamId) => {
  const result = await pool.query(
    `SELECT
       t.id,
       t.name,
       t.description,
       t.owner_id,
       t.created_at,
       json_agg(
         json_build_object(
           'userId',   u.id,
           'name',     u.name,
           'email',    u.email,
           'role',     tm.role,
           'joinedAt', tm.joined_at
         )
       ) AS members
     FROM  teams t
     JOIN  team_members tm ON t.id = tm.team_id
     JOIN  users u          ON tm.user_id = u.id
     WHERE t.id = $1
     GROUP BY t.id, t.name, t.description, t.owner_id, t.created_at`,
    [teamId]
  );
  return result.rows[0] || null;
};

// Check if a user is a member of a team and what their role is
// Returns null if user is not a member
const getMembership = async (teamId, userId) => {
  const result = await pool.query(
    `SELECT * FROM team_members
     WHERE team_id = $1 AND user_id = $2`,
    [teamId, userId]
  );
  return result.rows[0] || null;
};

// Add a user to a team with a specified role
const addMember = async (teamId, userId, role = 'member') => {
  const result = await pool.query(
    `INSERT INTO team_members (team_id, user_id, role)
     VALUES ($1, $2, $3)
     ON CONFLICT (team_id, user_id) DO NOTHING
     RETURNING *`,
    [teamId, userId, role]
  );
  return result.rows[0] || null;
};

// Remove a user from a team
const removeMember = async (teamId, userId) => {
  const result = await pool.query(
    `DELETE FROM team_members
     WHERE team_id = $1 AND user_id = $2
     RETURNING *`,
    [teamId, userId]
  );
  return result.rows[0] || null;
};

// Update a member's role
const updateMemberRole = async (teamId, userId, role) => {
  const result = await pool.query(
    `UPDATE team_members
     SET role = $1
     WHERE team_id = $2 AND user_id = $3
     RETURNING *`,
    [role, teamId, userId]
  );
  return result.rows[0] || null;
};

// Delete a team entirely
const deleteTeam = async (teamId) => {
  const result = await pool.query(
    'DELETE FROM teams WHERE id = $1 RETURNING *',
    [teamId]
  );
  return result.rows[0] || null;
};

module.exports = {
  create, getByUserId, getById, getMembership,
  addMember, removeMember, updateMemberRole, deleteTeam
};