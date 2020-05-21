const { age, date } = require('../../lib/utils');
const db = require('../../config/db');

module.exports = {
  all(callback) {
    db.query(
      `SELECT instructors.*, COUNT(members) AS total_students
              FROM instructors
              LEFT JOIN members ON (members.instructor_id = instructors.id)
              GROUP BY instructors.id ORDER BY total_students  DESC`,
      function (err, results) {
        if (err) throw `Database Error! ${err}`;

        callback(results.rows);
      },
    );
  },

  create(data, callback) {
    const query = `INSERT INTO instructors (
        avatar_url,
        name,
        birth,
        services,
        gender,
        created_at
      ) VALUES ($1, $2, $3, $4, $5, $6) RETURNING id`;

    const values = [
      data.avatar_url,
      data.name,
      date(data.birth).iso,
      data.services,
      data.gender,
      date(Date.now()).iso,
    ];

    db.query(query, values, function (err, results) {
      if (err) throw `Database Error! ${err}`;

      callback(results.rows[0]);
    });
  },

  find(id, callback) {
    db.query(
      `SELECT *
    FROM instructors
    WHERE id = $1`,
      [id],
      function (err, results) {
        if (err) throw `Database Error! ${err}`;

        callback(results.rows[0]);
      },
    );
  },

  findBy(filter, callback) {
    db.query(
      `SELECT instructors.*, COUNT(members) AS total_students
              FROM instructors
              LEFT JOIN members ON (members.instructor_id = instructors.id)
              WHERE instructors.name ILIKE '%${filter}%'
              OR instructors.services ILIKE '%${filter}%'
              GROUP BY instructors.id
              ORDER BY total_students  DESC`,
      function (err, results) {
        if (err) throw `Database Error! ${err}`;

        callback(results.rows);
      },
    );
  },

  update(data, callback) {
    const query = `
    UPDATE instructors SET
        avatar_url=($1),
        name=($2),
        birth=($3),
        services=($4),
        gender=($5)
    WHERE id = $6
    `;
    const values = [
      data.avatar_url,
      data.name,
      date(data.birth).iso,
      data.services,
      data.gender,
      data.id,
    ];

    db.query(query, values, function (err, results) {
      if (err) throw `Database Error! ${err}`;

      callback();
    });
  },

  delete(id, callback) {
    db.query(`DELETE FROM instructors WHERE id = $1`, [id], function (
      err,
      results,
    ) {
      if (err) throw `Database Error! ${err}`;

      return callback();
    });
  },

  paginate(params) {
    const { filter, limit, offset, callback } = params;

    let query = '';
    let filterQuery = '';
    let totalQuery = `(
        SELECT COUNT(*) FROM instructors
        ) AS total`;

    if (filter) {
      filterQuery = `
      WHERE instructors.name ILIKE '%${filter}%'
      OR instructors.services ILIKE '%${filter}%'`;

      totalQuery = `(
        SELECT COUNT(*) FROM instructors
        ${filterQuery}
      ) AS total`;
    }

    query = `
    SELECT instructors.*, ${totalQuery},
    COUNT(members)
    AS total_stutends
    FROM instructors
    LEFT JOIN members
    ON (instructors.id = members.instructor_id)
    ${filterQuery}
    GROUP BY instructors.id LIMIT $1 OFFSET $2`;

    db.query(query, [limit, offset], function (err, results) {
      if (err) throw `Database Error! ${err}`;

      callback(results.rows);
    });
  },
};
