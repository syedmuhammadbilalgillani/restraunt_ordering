import { Category, MenuItem, Order } from "@/types";

export const categories: Category[] = [
  { id: "cat-1", name: "Burgers", icon: "🍔", image: "https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=300&h=200&fit=crop", itemCount: 3 },
  { id: "cat-2", name: "Pizza", icon: "🍕", image: "https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?w=300&h=200&fit=crop", itemCount: 3 },
  { id: "cat-3", name: "Sushi", icon: "🍣", image: "https://images.unsplash.com/photo-1579584425555-c3ce17fd4351?w=300&h=200&fit=crop", itemCount: 2 },
  { id: "cat-4", name: "Salads", icon: "🥗", image: "https://images.unsplash.com/photo-1512621776951-a57141f2eefd?w=300&h=200&fit=crop", itemCount: 2 },
  { id: "cat-5", name: "Drinks", icon: "🥤", image: "https://images.unsplash.com/photo-1544145945-f90425340c7e?w=300&h=200&fit=crop", itemCount: 2 },
  { id: "cat-6", name: "Desserts", icon: "🍰", image: "https://images.unsplash.com/photo-1551024601-bec78aea704b?w=300&h=200&fit=crop", itemCount: 2 },
  { id: "cat-7", name: "Chicken", icon: "🍗", image: "https://images.unsplash.com/photo-1626645738196-c2a7c87a8f58?w=300&h=200&fit=crop", itemCount: 2 },
  { id: "cat-8", name: "Pasta", icon: "🍝", image: "https://images.unsplash.com/photo-1621996346565-e3dbc646d9a9?w=300&h=200&fit=crop", itemCount: 2 },
];

export const menuItems: MenuItem[] = [
  // Burgers
  { id: "item-1", name: "Classic Smash Burger", description: "Double patty, American cheese, pickles, special sauce on a brioche bun", price: 12.99, image: "https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=500&h=400&fit=crop", categoryId: "cat-1", popular: true, rating: 4.9, calories: 850, tags: ["bestseller"] },
  { id: "item-2", name: "Bacon BBQ Burger", description: "Crispy bacon, cheddar, onion rings, smoky BBQ sauce", price: 14.99, image: "https://images.unsplash.com/photo-1553979459-d2229ba7433b?w=500&h=400&fit=crop", categoryId: "cat-1", popular: true, rating: 4.7, calories: 920, tags: ["spicy"] },
  { id: "item-3", name: "Mushroom Swiss Burger", description: "Sautéed mushrooms, melted Swiss, garlic aioli", price: 13.49, image: "https://images.unsplash.com/photo-1572802419224-296b0aeee0d9?w=500&h=400&fit=crop", categoryId: "cat-1", popular: false, rating: 4.5, calories: 780 },
  // Pizza
  { id: "item-4", name: "Margherita Pizza", description: "San Marzano tomatoes, fresh mozzarella, basil, extra virgin olive oil", price: 15.99, image: "https://images.unsplash.com/photo-1574071318508-1cdbab80d002?w=500&h=400&fit=crop", categoryId: "cat-2", popular: true, rating: 4.8, calories: 720, tags: ["vegetarian"] },
  { id: "item-5", name: "Pepperoni Supreme", description: "Loaded pepperoni, mozzarella blend, oregano, chili flakes", price: 17.99, image: "https://images.unsplash.com/photo-1628840042765-356cda07504e?w=500&h=400&fit=crop", categoryId: "cat-2", popular: true, rating: 4.9, calories: 880, tags: ["bestseller"] },
  { id: "item-6", name: "BBQ Chicken Pizza", description: "Grilled chicken, red onion, cilantro, smoky BBQ sauce", price: 16.99, image: "https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?w=500&h=400&fit=crop", categoryId: "cat-2", popular: false, rating: 4.6, calories: 810 },
  // Sushi
  { id: "item-7", name: "Dragon Roll", description: "Shrimp tempura, avocado, eel sauce, sesame seeds", price: 16.99, image: "https://images.unsplash.com/photo-1579584425555-c3ce17fd4351?w=500&h=400&fit=crop", categoryId: "cat-3", popular: true, rating: 4.8, calories: 420, tags: ["chef's pick"] },
  { id: "item-8", name: "Salmon Nigiri Set", description: "8 pieces of premium Atlantic salmon nigiri", price: 19.99, image: "https://images.unsplash.com/photo-1583623025817-d180a2221d0a?w=500&h=400&fit=crop", categoryId: "cat-3", popular: false, rating: 4.7, calories: 380 },
  // Salads
  { id: "item-9", name: "Caesar Salad", description: "Romaine, parmesan, croutons, house-made Caesar dressing", price: 10.99, image: "https://images.unsplash.com/photo-1550304943-4f24f54ddde9?w=500&h=400&fit=crop", categoryId: "cat-4", popular: false, rating: 4.4, calories: 350, tags: ["healthy"] },
  { id: "item-10", name: "Asian Sesame Salad", description: "Mixed greens, edamame, mandarin, crispy wonton, sesame ginger dressing", price: 12.49, image: "https://images.unsplash.com/photo-1512621776951-a57141f2eefd?w=500&h=400&fit=crop", categoryId: "cat-4", popular: true, rating: 4.6, calories: 290, tags: ["healthy", "vegetarian"] },
  // Drinks
  { id: "item-11", name: "Mango Smoothie", description: "Fresh mango, banana, yogurt, honey", price: 6.99, image: "https://images.unsplash.com/photo-1546173159-315724a31696?w=500&h=400&fit=crop", categoryId: "cat-5", popular: true, rating: 4.7, calories: 220 },
  { id: "item-12", name: "Iced Matcha Latte", description: "Ceremonial grade matcha, oat milk, lightly sweetened", price: 5.99, image: "https://images.unsplash.com/photo-1515823064-d6e0c04616a7?w=500&h=400&fit=crop", categoryId: "cat-5", popular: false, rating: 4.5, calories: 140 },
  // Desserts
  { id: "item-13", name: "Molten Chocolate Cake", description: "Rich dark chocolate cake with a gooey molten center, served with vanilla ice cream", price: 9.99, image: "https://images.unsplash.com/photo-1551024601-bec78aea704b?w=500&h=400&fit=crop", categoryId: "cat-6", popular: true, rating: 4.9, calories: 650, tags: ["bestseller"] },
  { id: "item-14", name: "New York Cheesecake", description: "Creamy classic cheesecake with graham cracker crust", price: 8.99, image: "https://images.unsplash.com/photo-1524351199432-d330df15f4a7?w=500&h=400&fit=crop", categoryId: "cat-6", popular: false, rating: 4.6, calories: 480 },
  // Chicken
  { id: "item-15", name: "Crispy Fried Chicken", description: "Buttermilk-marinated, double-coated, golden fried chicken tenders", price: 11.99, image: "https://images.unsplash.com/photo-1626645738196-c2a7c87a8f58?w=500&h=400&fit=crop", categoryId: "cat-7", popular: true, rating: 4.8, calories: 720, tags: ["bestseller"] },
  { id: "item-16", name: "Grilled Chicken Bowl", description: "Herb-marinated grilled chicken, rice, veggies, tahini sauce", price: 13.49, image: "https://images.unsplash.com/photo-1598515214211-89d3c73ae83b?w=500&h=400&fit=crop", categoryId: "cat-7", popular: false, rating: 4.5, calories: 550, tags: ["healthy"] },
  // Pasta
  { id: "item-17", name: "Truffle Mushroom Pasta", description: "Fettuccine, wild mushrooms, truffle cream sauce, parmesan", price: 15.99, image: "https://images.unsplash.com/photo-1621996346565-e3dbc646d9a9?w=500&h=400&fit=crop", categoryId: "cat-8", popular: true, rating: 4.8, calories: 680, tags: ["vegetarian"] },
  { id: "item-18", name: "Spicy Arrabbiata Penne", description: "Penne in a fiery tomato sauce with garlic and red chili", price: 12.99, image: "https://images.unsplash.com/photo-1563379926898-05f4575a45d8?w=500&h=400&fit=crop", categoryId: "cat-8", popular: false, rating: 4.4, calories: 580, tags: ["spicy", "vegetarian"] },
];

export const mockOrders: Order[] = [
  {
    id: "ord-001",
    items: [
      { menuItem: menuItems[0], quantity: 2 },
      { menuItem: menuItems[10], quantity: 1 },
    ],
    total: 32.97,
    status: "delivered",
    date: "2026-04-05T18:30:00Z",
    deliveryType: "delivery",
  },
  {
    id: "ord-002",
    items: [
      { menuItem: menuItems[3], quantity: 1 },
      { menuItem: menuItems[12], quantity: 2 },
    ],
    total: 35.97,
    status: "preparing",
    date: "2026-04-06T12:00:00Z",
    deliveryType: "pickup",
  },
  {
    id: "ord-003",
    items: [
      { menuItem: menuItems[6], quantity: 3 },
    ],
    total: 50.97,
    status: "pending",
    date: "2026-04-06T14:15:00Z",
    deliveryType: "delivery",
  },
];
