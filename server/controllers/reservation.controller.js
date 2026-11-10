import prisma from '../config/db.js';
import { sendReservationEmail } from '../services/email.service.js';
import logger from '../utils/logger.js';

// 1. Create a Reservation (Public Customer Endpoint)
export const createReservation = async (req, res, next) => {
  const { name, email, phone, guests, date, timeSlot, notes } = req.body;

  try {
    const bookingDate = new Date(date);
    bookingDate.setHours(0, 0, 0, 0);

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    if (bookingDate < today) {
      return res.status(400).json({ success: false, error: 'Booking date must be today or in the future.' });
    }

    const guestCount = parseInt(guests);
    if (isNaN(guestCount) || guestCount <= 0) {
      return res.status(400).json({ success: false, error: 'Please enter a valid guest count.' });
    }

    // Capacity checking algorithm
    // 1. Find all tables that have capacity >= guestCount
    const suitableTables = await prisma.table.findMany({
      where: {
        capacity: { gte: guestCount },
        status: 'AVAILABLE'
      },
      orderBy: { capacity: 'asc' }
    });

    if (suitableTables.length === 0) {
      return res.status(400).json({
        success: false,
        error: 'We apologize, but we do not have tables matching your party size. Please call the restaurant directly.'
      });
    }

    // 2. Find reservations on the same date and time slot
    const activeReservations = await prisma.reservation.findMany({
      where: {
        date: bookingDate,
        timeSlot,
        status: { in: ['PENDING', 'CONFIRMED'] }
      }
    });

    const bookedTableIds = activeReservations.map(res => res.tableId).filter(Boolean);

    // 3. Find first suitable table that is NOT booked
    let assignedTable = suitableTables.find(t => !bookedTableIds.includes(t.id));

    // If all suitable tables are booked, check if there's any available seating remaining
    if (!assignedTable) {
      return res.status(400).json({
        success: false,
        error: 'All tables of suitable size are fully booked for this time slot. Please choose another date or time.'
      });
    }

    // Create reservation record
    const reservation = await prisma.reservation.create({
      data: {
        name,
        email,
        phone,
        guests: guestCount,
        date: bookingDate,
        timeSlot,
        notes,
        tableId: assignedTable.id,
        status: 'PENDING'
      },
      include: { table: true }
    });

    // Send styled confirmation email
    await sendReservationEmail(email, name, reservation);

    res.status(201).json({
      success: true,
      message: 'Table booked successfully. A confirmation email has been sent.',
      reservation
    });
  } catch (error) {
    next(error);
  }
};

// 2. Get All Reservations (Admin / Staff filter list)
export const getReservations = async (req, res, next) => {
  const { status, search, date } = req.query;

  try {
    const where = {};

    if (status) {
      where.status = status;
    }

    if (date) {
      const filterDate = new Date(date);
      filterDate.setHours(0, 0, 0, 0);
      where.date = filterDate;
    }

    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { email: { contains: search, mode: 'insensitive' } },
        { phone: { contains: search, mode: 'insensitive' } }
      ];
    }

    const list = await prisma.reservation.findMany({
      where,
      orderBy: { date: 'desc' },
      include: { table: true }
    });

    res.status(200).json({ success: true, count: list.length, reservations: list });
  } catch (error) {
    next(error);
  }
};

// 3. Update Reservation Status (Admin / Staff approval)
export const updateStatus = async (req, res, next) => {
  const { id } = req.params;
  const { status, tableId, date, timeSlot } = req.body;

  try {
    const existing = await prisma.reservation.findUnique({
      where: { id },
      include: { table: true }
    });

    if (!existing) {
      return res.status(404).json({ success: false, error: 'Reservation not found.' });
    }

    const updateData = {};
    if (status) updateData.status = status;
    if (tableId) updateData.tableId = tableId;
    if (date) {
      const newDate = new Date(date);
      newDate.setHours(0, 0, 0, 0);
      updateData.date = newDate;
    }
    if (timeSlot) updateData.timeSlot = timeSlot;

    const updated = await prisma.reservation.update({
      where: { id },
      data: updateData,
      include: { table: true }
    });

    // Send update email notification
    await sendReservationEmail(updated.email, updated.name, updated);

    // Logging action
    await prisma.activityLog.create({
      data: {
        userId: req.user.id,
        action: 'UPDATE_RESERVATION',
        details: `Updated reservation status of ${updated.name} to ${updated.status} for table ${updated.table?.number || 'Unassigned'}`,
        ipAddress: req.ip
      }
    });

    res.status(200).json({
      success: true,
      message: 'Reservation details updated and email sent.',
      reservation: updated
    });
  } catch (error) {
    next(error);
  }
};

// 4. Delete Reservation (Admin)
export const deleteReservation = async (req, res, next) => {
  const { id } = req.params;

  try {
    const existing = await prisma.reservation.findUnique({ where: { id } });
    if (!existing) {
      return res.status(404).json({ success: false, error: 'Reservation not found.' });
    }

    await prisma.reservation.delete({ where: { id } });

    await prisma.activityLog.create({
      data: {
        userId: req.user.id,
        action: 'DELETE_RESERVATION',
        details: `Deleted reservation of ${existing.name} on date ${existing.date.toISOString().split('T')[0]}`,
        ipAddress: req.ip
      }
    });

    res.status(200).json({ success: true, message: 'Reservation removed successfully.' });
  } catch (error) {
    next(error);
  }
};
