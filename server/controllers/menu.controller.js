import prisma from '../config/db.js';

// ==========================================================================
// PUBLIC USER ENDPOINTS
// ==========================================================================

// 1. Get All Menu Items (supports search, categories, and dietary tags)
export const getMenu = async (req, res, next) => {
  const { search, category, diet, featured } = req.query;

  try {
    const where = { isAvailable: true };

    if (featured === 'true') {
      where.isFeatured = true;
    }

    if (category) {
      where.category = { slug: category };
    }

    if (diet) {
      if (diet === 'vegan') {
        where.isVegan = true;
      } else if (diet === 'veg') {
        where.isVeg = true;
      } else if (diet === 'gf') {
        where.isGlutenFree = true;
      }
    }

    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } }
      ];
    }

    const list = await prisma.menuItem.findMany({
      where,
      include: { category: true },
      orderBy: { name: 'asc' }
    });

    res.status(200).json({ success: true, count: list.length, menu: list });
  } catch (error) {
    next(error);
  }
};

// 2. Get All Categories
export const getCategories = async (req, res, next) => {
  try {
    const list = await prisma.category.findMany({
      orderBy: { name: 'asc' },
      include: {
        _count: {
          select: { menuItems: true }
        }
      }
    });
    res.status(200).json({ success: true, categories: list });
  } catch (error) {
    next(error);
  }
};

// ==========================================================================
// ADMIN EDITING PANELS
// ==========================================================================

// 3. Create Menu Item
export const createMenuItem = async (req, res, next) => {
  const { name, description, price, discountPrice, categoryId, isVeg, isVegan, isGlutenFree, isFeatured, prepTime, imageUrl } = req.body;

  try {
    const item = await prisma.menuItem.create({
      data: {
        name,
        description,
        price: parseFloat(price),
        discountPrice: discountPrice ? parseFloat(discountPrice) : null,
        categoryId,
        isVeg: isVeg === 'true' || isVeg === true,
        isVegan: isVegan === 'true' || isVegan === true,
        isGlutenFree: isGlutenFree === 'true' || isGlutenFree === true,
        isFeatured: isFeatured === 'true' || isFeatured === true,
        prepTime: parseInt(prepTime || '15'),
        imageUrl
      }
    });

    // Logging action
    await prisma.activityLog.create({
      data: {
        userId: req.user.id,
        action: 'CREATE_MENU_ITEM',
        details: `Created new dish: ${item.name} at Price: ₹${item.price}`,
        ipAddress: req.ip
      }
    });

    res.status(201).json({ success: true, message: 'Menu item created successfully.', item });
  } catch (error) {
    next(error);
  }
};

// 4. Update Menu Item
export const updateMenuItem = async (req, res, next) => {
  const { id } = req.params;
  const { name, description, price, discountPrice, categoryId, isVeg, isVegan, isGlutenFree, isAvailable, isFeatured, prepTime, imageUrl } = req.body;

  try {
    const existing = await prisma.menuItem.findUnique({ where: { id } });
    if (!existing) {
      return res.status(404).json({ success: false, error: 'Menu item not found.' });
    }

    const updated = await prisma.menuItem.update({
      where: { id },
      data: {
        name,
        description,
        price: price ? parseFloat(price) : undefined,
        discountPrice: discountPrice !== undefined ? (discountPrice ? parseFloat(discountPrice) : null) : undefined,
        categoryId,
        isVeg: isVeg !== undefined ? (isVeg === 'true' || isVeg === true) : undefined,
        isVegan: isVegan !== undefined ? (isVegan === 'true' || isVegan === true) : undefined,
        isGlutenFree: isGlutenFree !== undefined ? (isGlutenFree === 'true' || isGlutenFree === true) : undefined,
        isAvailable: isAvailable !== undefined ? (isAvailable === 'true' || isAvailable === true) : undefined,
        isFeatured: isFeatured !== undefined ? (isFeatured === 'true' || isFeatured === true) : undefined,
        prepTime: prepTime ? parseInt(prepTime) : undefined,
        imageUrl
      }
    });

    await prisma.activityLog.create({
      data: {
        userId: req.user.id,
        action: 'UPDATE_MENU_ITEM',
        details: `Updated dish attributes: ${updated.name}`,
        ipAddress: req.ip
      }
    });

    res.status(200).json({ success: true, message: 'Menu item updated successfully.', item: updated });
  } catch (error) {
    next(error);
  }
};

// 5. Delete Menu Item
export const deleteMenuItem = async (req, res, next) => {
  const { id } = req.params;

  try {
    const existing = await prisma.menuItem.findUnique({ where: { id } });
    if (!existing) {
      return res.status(404).json({ success: false, error: 'Menu item not found.' });
    }

    await prisma.menuItem.delete({ where: { id } });

    await prisma.activityLog.create({
      data: {
        userId: req.user.id,
        action: 'DELETE_MENU_ITEM',
        details: `Removed dish: ${existing.name}`,
        ipAddress: req.ip
      }
    });

    res.status(200).json({ success: true, message: 'Menu item removed.' });
  } catch (error) {
    next(error);
  }
};

// 6. Create Category
export const createCategory = async (req, res, next) => {
  const { name, slug, description } = req.body;

  try {
    const category = await prisma.category.create({
      data: { name, slug, description }
    });

    res.status(201).json({ success: true, message: 'Category added.', category });
  } catch (error) {
    next(error);
  }
};

// 7. Delete Category
export const deleteCategory = async (req, res, next) => {
  const { id } = req.params;

  try {
    const existing = await prisma.category.findUnique({ where: { id } });
    if (!existing) {
      return res.status(404).json({ success: false, error: 'Category not found.' });
    }

    // Check if items belong to this category
    const itemsCount = await prisma.menuItem.count({ where: { categoryId: id } });
    if (itemsCount > 0) {
      return res.status(400).json({
        success: false,
        error: 'Cannot delete category containing dishes. Move or delete them first.'
      });
    }

    await prisma.category.delete({ where: { id } });
    res.status(200).json({ success: true, message: 'Category removed.' });
  } catch (error) {
    next(error);
  }
};
