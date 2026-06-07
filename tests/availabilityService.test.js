const { getAvailableSlots, formatSlot } = require('../src/services/availabilityService');
const professionalsRepo = require('../src/repositories/professionalsRepository');
const servicesRepo = require('../src/repositories/servicesRepository');
const appointmentsRepo = require('../src/repositories/appointmentsRepository');

jest.mock('../src/repositories/professionalsRepository');
jest.mock('../src/repositories/servicesRepository');
jest.mock('../src/repositories/appointmentsRepository');

describe('availabilityService', () => {
  beforeEach(() => {
    jest.useFakeTimers();
    jest.setSystemTime(new Date('2026-06-07T21:51:00.000Z'));
    servicesRepo.findById.mockResolvedValue({
      id: 'service-1',
      active: true,
      duration_minutes: 60
    });
    professionalsRepo.getAvailabilitySlots.mockResolvedValue([
      { weekday: 0, start_time: '09:00:00', end_time: '20:00:00' }
    ]);
    appointmentsRepo.listByProfessionalAndDate.mockResolvedValue([]);
  });

  afterEach(() => {
    jest.useRealTimers();
    jest.clearAllMocks();
  });

  it('builds slots using app timezone offset', () => {
    expect(formatSlot('2026-06-07', 19 * 60)).toBe('2026-06-07T19:00:00-03:00');
  });

  it('returns future slots on the same day in Brazil timezone', async () => {
    const slots = await getAvailableSlots('prof-1', 'service-1', '2026-06-07');
    expect(slots.some((slot) => slot.startsAt === '2026-06-07T22:00:00.000Z')).toBe(true);
  });

  it('returns empty when service duration exceeds remaining window', async () => {
    servicesRepo.findById.mockResolvedValue({
      id: 'service-1',
      active: true,
      duration_minutes: 90
    });
    const slots = await getAvailableSlots('prof-1', 'service-1', '2026-06-07');
    expect(slots).toEqual([]);
  });
});
