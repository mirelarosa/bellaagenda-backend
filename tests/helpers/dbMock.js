const crypto = require('crypto');

const tables = {
  users: [],
  professionals: [],
  services: [],
  professional_services: [],
  availability_slots: [],
  appointments: [],
  payments: [],
  reviews: []
};

function genId() {
  return crypto.randomUUID();
}

function now() {
  return new Date().toISOString();
}

function normalizeSql(text) {
  return text.replace(/\s+/g, ' ').trim();
}

function resetAll() {
  for (const key of Object.keys(tables)) {
    tables[key].length = 0;
  }
}

function findUser(id) {
  return tables.users.find((u) => u.id === id) || null;
}

function findProfessional(id) {
  return tables.professionals.find((p) => p.id === id) || null;
}

function findService(id) {
  return tables.services.find((s) => s.id === id) || null;
}

function joinProfessionalWithUser(professional) {
  const user = findUser(professional.user_id);
  if (!user) return null;
  return {
    ...professional,
    name: user.name,
    email: user.email,
    phone: user.phone,
    firebase_uid: user.firebase_uid
  };
}

function joinAppointment(appointment) {
  const service = findService(appointment.service_id);
  const client = findUser(appointment.client_id);
  const professional = findProfessional(appointment.professional_id);
  const proUser = professional ? findUser(professional.user_id) : null;
  return {
    ...appointment,
    service_name: service?.name,
    price_cents: service?.price_cents,
    client_name: client?.name,
    professional_name: proUser?.name
  };
}

async function query(text, params = []) {
  const sql = normalizeSql(text);

  if (sql.startsWith('TRUNCATE') || sql.startsWith('DELETE FROM availability_slots WHERE professional_id')) {
    if (sql.startsWith('TRUNCATE')) {
      resetAll();
    } else {
      const professionalId = params[0];
      tables.availability_slots = tables.availability_slots.filter(
        (s) => s.professional_id !== professionalId
      );
    }
    return { rows: [], rowCount: 0 };
  }

  if (
    sql.includes('CREATE TABLE') ||
    sql.includes('CREATE EXTENSION') ||
    sql.includes('CREATE INDEX') ||
    sql.includes('schema_migrations')
  ) {
    return { rows: [], rowCount: 0 };
  }

  if (sql.includes('FROM users WHERE firebase_uid')) {
    const row = tables.users.find((u) => u.firebase_uid === params[0]) || null;
    return { rows: row ? [row] : [], rowCount: row ? 1 : 0 };
  }

  if (sql.includes('FROM users WHERE id =')) {
    const row = findUser(params[0]);
    return { rows: row ? [row] : [], rowCount: row ? 1 : 0 };
  }

  if (sql.includes('FROM users WHERE LOWER(email)')) {
    const email = String(params[0]).toLowerCase();
    const row = tables.users.find((u) => u.email.toLowerCase() === email) || null;
    return { rows: row ? [row] : [], rowCount: row ? 1 : 0 };
  }

  if (sql.startsWith('INSERT INTO users')) {
    const row = {
      id: genId(),
      firebase_uid: params[0],
      email: params[1],
      name: params[2],
      role: params[3],
      phone: params[4] || null,
      created_at: now()
    };
    tables.users.push(row);
    return { rows: [row], rowCount: 1 };
  }

  if (sql.startsWith('UPDATE users SET')) {
    const user = findUser(params[0]);
    if (!user) return { rows: [], rowCount: 0 };
    if (params[1] != null) user.name = params[1];
    if (params[2] != null) user.phone = params[2];
    if (params[3] != null) user.role = params[3];
    if (params[4] != null) user.firebase_uid = params[4];
    return { rows: [user], rowCount: 1 };
  }

  if (sql.includes('FROM professionals p') && sql.includes('JOIN users u') && sql.includes('WHERE p.id =')) {
    const professional = findProfessional(params[0]);
    const row = professional ? joinProfessionalWithUser(professional) : null;
    return { rows: row ? [row] : [], rowCount: row ? 1 : 0 };
  }

  if (sql.includes('FROM professionals p') && sql.includes('JOIN users u') && sql.includes('WHERE p.active = TRUE')) {
    const rows = tables.professionals
      .filter((p) => p.active)
      .map(joinProfessionalWithUser)
      .filter(Boolean)
      .sort((a, b) => a.name.localeCompare(b.name));
    return { rows, rowCount: rows.length };
  }

  if (sql.includes('FROM professionals WHERE user_id')) {
    const row = tables.professionals.find((p) => p.user_id === params[0]) || null;
    return { rows: row ? [row] : [], rowCount: row ? 1 : 0 };
  }

  if (sql.startsWith('INSERT INTO professionals')) {
    const specialties = typeof params[1] === 'string' ? JSON.parse(params[1]) : params[1];
    const row = {
      id: genId(),
      user_id: params[0],
      specialties,
      active: true
    };
    tables.professionals.push(row);
    return { rows: [row], rowCount: 1 };
  }

  if (sql.includes('FROM availability_slots WHERE professional_id')) {
    const rows = tables.availability_slots
      .filter((s) => s.professional_id === params[0])
      .sort((a, b) => a.weekday - b.weekday || a.start_time.localeCompare(b.start_time));
    return { rows, rowCount: rows.length };
  }

  if (sql.startsWith('INSERT INTO availability_slots')) {
    const row = {
      id: genId(),
      professional_id: params[0],
      weekday: params[1],
      start_time: params[2],
      end_time: params[3]
    };
    tables.availability_slots.push(row);
    return { rows: [], rowCount: 1 };
  }

  if (sql.startsWith('INSERT INTO professional_services')) {
    const exists = tables.professional_services.some(
      (ps) => ps.professional_id === params[0] && ps.service_id === params[1]
    );
    if (!exists) {
      tables.professional_services.push({
        professional_id: params[0],
        service_id: params[1]
      });
    }
    return { rows: [], rowCount: 1 };
  }

  if (sql.includes('FROM services') && sql.includes('WHERE active = TRUE')) {
    const rows = tables.services.filter((s) => s.active).sort((a, b) => a.name.localeCompare(b.name));
    return { rows, rowCount: rows.length };
  }

  if (sql.includes('FROM services WHERE id =')) {
    const row = findService(params[0]);
    return { rows: row ? [row] : [], rowCount: row ? 1 : 0 };
  }

  if (sql.startsWith('INSERT INTO services')) {
    const row = {
      id: genId(),
      name: params[0],
      description: params[1] || null,
      duration_minutes: params[2],
      price_cents: params[3],
      active: true,
      created_at: now()
    };
    tables.services.push(row);
    return { rows: [row], rowCount: 1 };
  }

  if (sql.startsWith('UPDATE services SET') && sql.includes('active = FALSE')) {
    const service = findService(params[0]);
    if (!service) return { rows: [], rowCount: 0 };
    service.active = false;
    return { rows: [service], rowCount: 1 };
  }

  if (sql.startsWith('UPDATE services SET')) {
    const service = findService(params[0]);
    if (!service) return { rows: [], rowCount: 0 };
    if (params[1] != null) service.name = params[1];
    if (params[2] != null) service.description = params[2];
    if (params[3] != null) service.duration_minutes = params[3];
    if (params[4] != null) service.price_cents = params[4];
    if (params[5] != null) service.active = params[5];
    return { rows: [service], rowCount: 1 };
  }

  if (sql.includes('FROM appointments a') && sql.includes('WHERE a.id =')) {
    const appointment = tables.appointments.find((a) => a.id === params[0]);
    const row = appointment ? joinAppointment(appointment) : null;
    return { rows: row ? [row] : [], rowCount: row ? 1 : 0 };
  }

  if (sql.includes('SELECT id FROM appointments') && sql.includes('starts_at <')) {
    const [professionalId, startsAt, endsAt, excludeId] = params;
    const rows = tables.appointments
      .filter((a) => {
        if (a.professional_id !== professionalId) return false;
        if (!['pending_payment', 'confirmed'].includes(a.status)) return false;
        if (excludeId && a.id === excludeId) return false;
        return a.starts_at < endsAt && a.ends_at > startsAt;
      })
      .map((a) => ({ id: a.id }));
    return { rows, rowCount: rows.length };
  }

  if (sql.startsWith('INSERT INTO appointments')) {
    const row = {
      id: genId(),
      client_id: params[0],
      professional_id: params[1],
      service_id: params[2],
      starts_at: params[3],
      ends_at: params[4],
      status: params[5] || 'pending_payment',
      created_at: now()
    };
    tables.appointments.push(row);
    return { rows: [row], rowCount: 1 };
  }

  if (sql.startsWith('UPDATE appointments SET status')) {
    const appointment = tables.appointments.find((a) => a.id === params[0]);
    if (!appointment) return { rows: [], rowCount: 0 };
    appointment.status = params[1];
    return { rows: [appointment], rowCount: 1 };
  }

  if (sql.includes('starts_at, ends_at, status FROM appointments')) {
    const [professionalId, dateStr] = params;
    const rows = tables.appointments
      .filter((a) => {
        if (a.professional_id !== professionalId) return false;
        if (!['pending_payment', 'confirmed'].includes(a.status)) return false;
        const date = a.starts_at.slice(0, 10);
        return date === dateStr;
      })
      .map((a) => ({
        starts_at: a.starts_at,
        ends_at: a.ends_at,
        status: a.status
      }));
    return { rows, rowCount: rows.length };
  }

  if (sql.includes('FROM appointments a') && sql.includes('ORDER BY a.starts_at DESC')) {
    let filtered = tables.appointments.map(joinAppointment);
    const user = params.length >= 1 ? findUser(params[0]) : null;
    let paramIndex = 0;
    if (sql.includes('a.client_id = $')) {
      const clientId = params[paramIndex++];
      filtered = filtered.filter((a) => a.client_id === clientId);
    } else if (sql.includes('p.user_id = $')) {
      const userId = params[paramIndex++];
      const professional = tables.professionals.find((p) => p.user_id === userId);
      if (professional) {
        filtered = filtered.filter((a) => a.professional_id === professional.id);
      } else {
        filtered = [];
      }
    }
    if (sql.includes('a.status = $')) {
      const status = params[paramIndex];
      filtered = filtered.filter((a) => a.status === status);
    }
    filtered.sort((a, b) => new Date(b.starts_at) - new Date(a.starts_at));
    return { rows: filtered, rowCount: filtered.length };
  }

  if (sql.startsWith('INSERT INTO payments')) {
    const row = {
      id: genId(),
      appointment_id: params[0],
      amount_cents: params[1],
      stripe_session_id: params[2] || null,
      stripe_payment_intent_id: null,
      method: null,
      status: 'pending',
      created_at: now()
    };
    tables.payments.push(row);
    return { rows: [row], rowCount: 1 };
  }

  if (sql.includes('FROM payments WHERE appointment_id')) {
    const row = tables.payments.find((p) => p.appointment_id === params[0]) || null;
    return { rows: row ? [row] : [], rowCount: row ? 1 : 0 };
  }

  if (sql.includes('FROM payments WHERE stripe_session_id')) {
    const row = tables.payments.find((p) => p.stripe_session_id === params[0]) || null;
    return { rows: row ? [row] : [], rowCount: row ? 1 : 0 };
  }

  if (sql.includes('UPDATE payments SET status = \'paid\'')) {
    const payment = tables.payments.find((p) => p.id === params[0]);
    if (!payment) return { rows: [], rowCount: 0 };
    payment.status = 'paid';
    payment.stripe_payment_intent_id = params[1] || null;
    return { rows: [payment], rowCount: 1 };
  }

  if (sql.startsWith('INSERT INTO reviews')) {
    const row = {
      id: genId(),
      appointment_id: params[0],
      client_id: params[1],
      rating: params[2],
      comment: params[3] || null,
      created_at: now()
    };
    tables.reviews.push(row);
    return { rows: [row], rowCount: 1 };
  }

  if (sql.includes('FROM reviews WHERE appointment_id')) {
    const row = tables.reviews.find((r) => r.appointment_id === params[0]) || null;
    return { rows: row ? [row] : [], rowCount: row ? 1 : 0 };
  }

  if (sql.includes('FROM payments WHERE status = \'paid\'')) {
    const paid = tables.payments.filter((p) => p.status === 'paid');
    const total = paid.reduce((sum, p) => sum + p.amount_cents, 0);
    return {
      rows: [{ total_revenue_cents: total, paid_count: paid.length }],
      rowCount: 1
    };
  }

  if (sql.includes('FROM appointments GROUP BY status')) {
    const counts = {};
    for (const appointment of tables.appointments) {
      counts[appointment.status] = (counts[appointment.status] || 0) + 1;
    }
    const rows = Object.entries(counts).map(([status, count]) => ({ status, count }));
    return { rows, rowCount: rows.length };
  }

  if (sql.includes('FROM reviews') && sql.includes('AVG(rating)')) {
    const count = tables.reviews.length;
    const average = count === 0
      ? 0
      : tables.reviews.reduce((sum, r) => sum + r.rating, 0) / count;
    return {
      rows: [{ average_rating: average, review_count: count }],
      rowCount: 1
    };
  }

  throw new Error(`Unhandled mock SQL: ${sql}`);
}

function getPool() {
  return { query };
}

async function closePool() {
  resetAll();
}

module.exports = { query, getPool, closePool, resetAll };
