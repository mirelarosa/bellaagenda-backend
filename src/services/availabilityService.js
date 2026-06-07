const professionalsRepo = require('../repositories/professionalsRepository');
const appointmentsRepo = require('../repositories/appointmentsRepository');
const servicesRepo = require('../repositories/servicesRepository');

function parseTime(timeStr) {
  const [h, m] = timeStr.split(':').map(Number);
  return h * 60 + m;
}

function getWeekdayFromDateStr(dateStr) {
  const [year, month, day] = dateStr.split('-').map(Number);
  return new Date(year, month - 1, day).getDay();
}

function formatSlot(dateStr, minutes) {
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  const pad = (n) => String(n).padStart(2, '0');
  return `${dateStr}T${pad(h)}:${pad(m)}:00`;
}

async function getAvailableSlots(professionalId, serviceId, dateStr) {
  const service = await servicesRepo.findById(serviceId);
  if (!service || !service.active) {
    return [];
  }
  const weekday = getWeekdayFromDateStr(dateStr);
  const slots = await professionalsRepo.getAvailabilitySlots(professionalId);
  const daySlots = slots.filter((s) => s.weekday === weekday);
  if (daySlots.length === 0) {
    return [];
  }
  const booked = await appointmentsRepo.listByProfessionalAndDate(professionalId, dateStr);
  const duration = service.duration_minutes;
  const available = [];

  for (const window of daySlots) {
    let cursor = parseTime(window.start_time);
    const end = parseTime(window.end_time);
    while (cursor + duration <= end) {
      const slotStart = new Date(formatSlot(dateStr, cursor));
      const slotEnd = new Date(slotStart.getTime() + duration * 60000);
      const overlaps = booked.some((b) => {
        const bStart = new Date(b.starts_at);
        const bEnd = new Date(b.ends_at);
        return slotStart < bEnd && slotEnd > bStart;
      });
      if (!overlaps && slotStart > new Date()) {
        available.push({
          startsAt: slotStart.toISOString(),
          endsAt: slotEnd.toISOString()
        });
      }
      cursor += 30;
    }
  }
  return available;
}

module.exports = { getAvailableSlots };
