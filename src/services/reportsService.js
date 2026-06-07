const { query } = require('../config/db');

async function getSummary() {
  const { rows: revenueRows } = await query(
    `SELECT COALESCE(SUM(amount_cents), 0)::int AS total_revenue_cents,
            COUNT(*)::int AS paid_count
     FROM payments WHERE status = 'paid'`
  );
  const { rows: appointmentRows } = await query(
    `SELECT status, COUNT(*)::int AS count
     FROM appointments GROUP BY status`
  );
  const { rows: reviewRows } = await query(
    `SELECT COALESCE(AVG(rating), 0)::float AS average_rating,
            COUNT(*)::int AS review_count
     FROM reviews`
  );
  return {
    revenue: revenueRows[0],
    appointmentsByStatus: appointmentRows,
    reviews: reviewRows[0]
  };
}

module.exports = { getSummary };
