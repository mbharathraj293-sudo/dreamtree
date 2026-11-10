import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('Seeding database initial records...');

  // 1. Initial Admin User
  const adminEmail = 'admin@thedreamingtree.in';
  const existingAdmin = await prisma.user.findUnique({
    where: { email: adminEmail }
  });

  if (!existingAdmin) {
    const passwordHash = await bcrypt.hash('AdminPass123!', 10);
    await prisma.user.create({
      data: {
        email: adminEmail,
        name: 'The Dreaming Tree Administrator',
        passwordHash,
        role: 'SUPERADMIN',
        isVerified: true
      }
    });
    console.log(`- Seeded superadmin user: ${adminEmail}`);
  }

  // 2. Tables seeding
  const tablesToSeed = [
    { number: 1, capacity: 2, status: 'AVAILABLE' },
    { number: 2, capacity: 2, status: 'AVAILABLE' },
    { number: 3, capacity: 4, status: 'AVAILABLE' },
    { number: 4, capacity: 4, status: 'AVAILABLE' },
    { number: 5, capacity: 6, status: 'AVAILABLE' },
    { number: 6, capacity: 8, status: 'AVAILABLE' }
  ];

  for (const table of tablesToSeed) {
    await prisma.table.upsert({
      where: { number: table.number },
      update: {},
      create: table
    });
  }
  console.log('- Seeded 6 dining tables');

  // 3. Categories seeding
  const categories = [
    { name: 'Asian Fusion', slug: 'asian', description: 'Curries, stir-fries, and oriental noodles' },
    { name: 'Western Mains', slug: 'western', description: 'Artisanal pizzas, pasta, and paninis' },
    { name: 'Healthy & Bowls', slug: 'healthy', description: 'Salads, hummus plates, and wellness wraps' },
    { name: 'Beverages', slug: 'beverages', description: 'Fermented kombuchas, smooth coffees, and refreshers' },
    { name: 'Desserts', slug: 'desserts', description: 'Guilt-free cakes and smoothie bowls' }
  ];

  const dbCategories = {};
  for (const category of categories) {
    const saved = await prisma.category.upsert({
      where: { slug: category.slug },
      update: { name: category.name, description: category.description },
      create: category
    });
    dbCategories[category.slug] = saved.id;
  }
  console.log('- Seeded menu categories');

  // 4. Menu Items Seeding
  const menuItems = [
    // Asian Fusion
    {
      name: 'Pad Thai',
      description: 'Classic flat rice noodles stir-fried in sweet-savory tamarind sauce, crushed peanuts, organic tofu, and fresh bean sprouts.',
      price: 450,
      categoryId: dbCategories['asian'],
      isVeg: true,
      isVegan: false,
      isGlutenFree: true,
      isAvailable: true,
      isFeatured: true,
      prepTime: 12,
      imageUrl: 'https://images.unsplash.com/photo-1559314809-0d155014e29e?q=80&w=800'
    },
    {
      name: 'Special Fried Rice',
      description: 'Wok-tossed premium basmati rice infused with sesame oil, organic ginger-garlic, garden peas, scallions, and signature house soy.',
      price: 400,
      categoryId: dbCategories['asian'],
      isVeg: true,
      isVegan: true,
      isGlutenFree: true,
      isAvailable: true,
      prepTime: 10,
      imageUrl: 'https://thumbs.dreamstime.com/b/delicious-spicy-chicken-fried-rice-homemade-cast-iron-wok-94297571.jpg'
    },
    // Western Mains
    {
      name: 'Alfredo Pasta',
      description: 'Rich, creamy Alfredo sauce crafted from artisan parmesan and real butter, tossed with al dente fettuccine and wild forest mushrooms.',
      price: 490,
      categoryId: dbCategories['western'],
      isVeg: true,
      isVegan: false,
      isGlutenFree: false,
      isAvailable: true,
      prepTime: 15,
      imageUrl: 'https://images.unsplash.com/photo-1645112411341-6c4fd023714a?q=80&w=800'
    },
    {
      name: 'Earth Pizza',
      description: 'Artisanal sourdough crust topped with wild rocket, sun-dried tomatoes, local goat cheese, baby spinach, and a drizzle of truffle oil.',
      price: 520,
      categoryId: dbCategories['western'],
      isVeg: true,
      isVegan: false,
      isGlutenFree: false,
      isAvailable: true,
      isFeatured: true,
      prepTime: 18,
      imageUrl: 'https://images.unsplash.com/photo-1513104890138-7c749659a591?q=80&w=800'
    },
    {
      name: 'Italian Panini',
      description: 'Pressed ciabatta with homemade basil pesto, heirloom tomatoes, fresh mozzarella buffalo, roasted red peppers, and balsamic reduction.',
      price: 420,
      categoryId: dbCategories['western'],
      isVeg: true,
      isVegan: false,
      isGlutenFree: false,
      isAvailable: true,
      prepTime: 8,
      imageUrl: 'https://images.unsplash.com/photo-1509722747041-616f39b57569?q=80&w=800'
    },
    // Healthy & Bowls
    {
      name: 'Falafel Wrap',
      description: 'Crispy golden chickpea falafels, wrapped in a warm flatbread with creamy tahini, pickled turnip, crunch cucumber, and mint leaves.',
      price: 410,
      categoryId: dbCategories['healthy'],
      isVeg: true,
      isVegan: true,
      isGlutenFree: false,
      isAvailable: true,
      prepTime: 10,
      imageUrl: 'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcSsSfepTCsTexSZJznk3cOxhqgnG2CDvcy0fgiMmy-wZXHPI5LrqLb8XsVY&s=10'
    },
    {
      name: 'Mediterranean Plate',
      description: 'A vibrant selection of olive tapenade, house-crafted hummus, grilled artichoke hearts, feta cubes, quinoa salad, and wood-fired pita bread.',
      price: 550,
      categoryId: dbCategories['healthy'],
      isVeg: true,
      isVegan: false,
      isGlutenFree: false,
      isAvailable: true,
      prepTime: 12,
      imageUrl: 'https://images.unsplash.com/photo-1540189549336-e6e99c3679fe?q=80&w=800'
    },
    {
      name: 'Coconut Veg Curry',
      description: 'Rich coconut milk stewed with exotic green vegetables and lemongrass herbs. Served alongside aromatic cumin-infused basmati rice.',
      price: 480,
      categoryId: dbCategories['healthy'],
      isVeg: true,
      isVegan: true,
      isGlutenFree: true,
      isAvailable: true,
      prepTime: 15,
      imageUrl: 'https://images.unsplash.com/photo-1631452180519-c014fe946bc7?q=80&w=800'
    },
    // Beverages
    {
      name: 'Kombucha',
      description: 'Naturally carbonated, raw fermented tea infused with local organic ginger, hibiscus leaves, and raw honey.',
      price: 280,
      categoryId: dbCategories['beverages'],
      isVeg: true,
      isVegan: false,
      isGlutenFree: true,
      isAvailable: true,
      prepTime: 3,
      imageUrl: 'https://images.unsplash.com/photo-1579954115545-a95591f28bfc?q=80&w=600'
    },
    {
      name: 'Organic Coffee',
      description: 'Ethically sourced single-origin Arabica beans roasted locally, manually brewed to release clean, floral undertones.',
      price: 180,
      categoryId: dbCategories['beverages'],
      isVeg: true,
      isVegan: true,
      isGlutenFree: true,
      isAvailable: true,
      prepTime: 5,
      imageUrl: 'https://images.unsplash.com/photo-1507133750040-4a8f57021571?q=80&w=600'
    },
    // Desserts
    {
      name: 'Sunshine Smoothie Bowl',
      description: 'Creamy blended mango, pineapple, and banana, topped with pumpkin seeds, chia, goji berries, and fresh kiwi.',
      price: 380,
      categoryId: dbCategories['desserts'],
      isVeg: true,
      isVegan: true,
      isGlutenFree: true,
      isAvailable: true,
      prepTime: 6,
      imageUrl: 'https://images.unsplash.com/photo-1511690656952-34342bb7c2f2?q=80&w=600'
    },
    {
      name: 'Chocolate Fudge Cake',
      description: 'Guilt-free dark chocolate cake layers covered in silky plant-based avocado ganache. Rich, moist, and 100% vegan.',
      price: 350,
      categoryId: dbCategories['desserts'],
      isVeg: true,
      isVegan: true,
      isGlutenFree: true,
      isAvailable: true,
      prepTime: 5,
      imageUrl: 'https://images.unsplash.com/photo-1578985545062-69928b1d9587?q=80&w=600'
    }
  ];

  for (const item of menuItems) {
    await prisma.menuItem.create({
      data: item
    });
  }
  console.log('- Seeded menu items details');

  // 5. Testimonials Seeding
  const testimonials = [
    { name: 'Sarah Miller', role: 'International Traveler', text: 'Good vibes, good music, delicious coffee, food and friendly owners. The treehouse aesthetic is beautiful.', rating: 5, isApproved: true },
    { name: 'Arjun Mehta', role: 'Regular Patron', text: 'Peaceful atmosphere with excellent healthy food and welcoming service. Highly recommend the Kombucha and Bowls.', rating: 5, isApproved: true },
    { name: 'Emily Watson', role: 'Wellness Advocate', text: 'One of the best places in Tiruvannamalai for healthy international cuisine. Tucked away beautifully in VIP garden.', rating: 5, isApproved: true }
  ];

  for (const t of testimonials) {
    await prisma.testimonial.create({
      data: t
    });
  }
  console.log('- Seeded testimonials');

  // 6. Settings Seeding
  const settings = [
    { key: 'restaurant_name', value: 'The Dreaming Tree' },
    { key: 'contact_phone', value: '+91 95859 46599' },
    { key: 'contact_email', value: 'info@thedreamingtree.in' },
    { key: 'business_hours', value: '8:00 AM – 11:00 PM Daily' },
    { key: 'address', value: 'Plot No 11, 12, Chengam Rd 4th St, VIP Garden, Tiruvannamalai, Tamil Nadu 606603' },
    { key: 'google_maps_src', value: 'https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3890.312940250917!2d79.05273767598822!3d12.22709668802264!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x3bab07e155555555%3A0xc48c08ec2284cf4f!2sThe%20Dreaming%20Tree!5e0!3m2!1sen!2sin!4v1719149021000!5m2!1sen!2sin' }
  ];

  for (const s of settings) {
    await prisma.setting.upsert({
      where: { key: s.key },
      update: { value: s.value },
      create: s
    });
  }
  console.log('- Seeded system settings key-value pairs');
  console.log('Database seeding completed successfully!');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
