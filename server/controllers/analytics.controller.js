import prisma from '../config/db.js';

export const getDashboardStats = async (req, res, next) => {
  try {
    // 1. Total count summaries
    const totalReservations = await prisma.reservation.count();
    const pendingReservations = await prisma.reservation.count({ where: { status: 'PENDING' } });
    const completedReservations = await prisma.reservation.count({ where: { status: 'COMPLETED' } });
    
    const totalCustomers = await prisma.user.count({ where: { role: 'CUSTOMER' } });
    const totalDishes = await prisma.menuItem.count();
    const totalTables = await prisma.table.count();

    // 2. Revenue calculation
    // Since this is a reservation system rather than a POS, we mock or calculate revenue based on reservation counts
    // e.g. average check size of ₹1200 per guest booked
    const reservationsList = await prisma.reservation.findMany({
      where: { status: { in: ['CONFIRMED', 'COMPLETED'] } },
      select: { guests: true }
    });
    const estimatedTotalRevenue = reservationsList.reduce((acc, curr) => acc + (curr.guests * 450), 0); // ₹450 average check

    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);
    const todayEnd = new Date();
    todayEnd.setHours(23, 59, 59, 999);

    const todayReservations = await prisma.reservation.count({
      where: {
        date: {
          gte: todayStart,
          lte: todayEnd
        }
      }
    });

    // 3. Activity feed logs (last 10 items)
    const recentLogs = await prisma.activityLog.findMany({
      orderBy: { createdAt: 'desc' },
      take: 10,
      include: {
        user: {
          select: { name: true, email: true, role: true }
        }
      }
    });

    // 4. TimeSlot distributions (popular peak hours)
    const reservationsGrouped = await prisma.reservation.groupBy({
      by: ['timeSlot'],
      _count: { id: true },
      orderBy: { _count: { id: 'desc' } }
    });

    // 5. Popular menu items (featured ones representing popular choice)
    const popularDishes = await prisma.menuItem.findMany({
      where: { isFeatured: true },
      take: 4,
      select: { name: true, price: true, imageUrl: true }
    });

    res.status(200).json({
      success: true,
      stats: {
        totalReservations,
        pendingReservations,
        completedReservations,
        todayReservations,
        totalCustomers,
        totalDishes,
        totalTables,
        estimatedTotalRevenue
      },
      timeSlotsDistribution: reservationsGrouped,
      popularDishes,
      activities: recentLogs
    });
  } catch (error) {
    next(error);
  }
};

// Log viewer for admin logs module
export const getActivityLogs = async (req, res, next) => {
  try {
    const logs = await prisma.activityLog.findMany({
      orderBy: { createdAt: 'desc' },
      take: 50,
      include: {
        user: {
          select: { name: true, email: true, role: true }
        }
      }
    });
    res.status(200).json({ success: true, count: logs.length, logs });
  } catch (error) {
    next(error);
  }
};
