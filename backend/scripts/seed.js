import mongoose from 'mongoose';
import dotenv from 'dotenv';
import User from '../models/User.js';
import Team from '../models/Team.js';
import Business from '../models/Business.js';
import Lead from '../models/Lead.js';
import logger from '../utils/logger.js';

dotenv.config();

const sampleBusinesses = [
  // Restaurants in Mumbai
  {
    name: "Golden Wok Chinese Restro",
    website: "http://goldenwokmumbai.com",
    email: "info@goldenwokmumbai.com",
    phone: "+91 22 2640 1234",
    address: "Carter Rd, Bandra West, Mumbai",
    city: "Mumbai",
    state: "Maharashtra",
    country: "India",
    industry: "Restaurants",
    rating: 3.8,
    userRatingsTotal: 124,
    googlePlaceId: "place_mumbai_1",
    businessSize: "small"
  },
  {
    name: "The Tandoori Grill",
    website: "", // Missing website
    email: "contact@tandoorigrill.com",
    phone: "+91 22 2899 4321",
    address: "Linking Rd, Santacruz West, Mumbai",
    city: "Mumbai",
    state: "Maharashtra",
    country: "India",
    industry: "Restaurants",
    rating: 4.2,
    userRatingsTotal: 340,
    googlePlaceId: "place_mumbai_2",
    businessSize: "medium"
  },
  {
    name: "Coastal Spices Seafood",
    website: "none", // Invalid website
    email: "booking@coastalspices.com",
    phone: "+91 22 2288 9988",
    address: "Colaba Causeway, Fort, Mumbai",
    city: "Mumbai",
    state: "Maharashtra",
    country: "India",
    industry: "Restaurants",
    rating: 4.5,
    userRatingsTotal: 98,
    googlePlaceId: "place_mumbai_3",
    businessSize: "medium"
  },

  // Dentists in Delhi
  {
    name: "Apex Dental Care & Implant Center",
    website: "https://apexdentalcare.in",
    email: "care@apexdentalcare.in",
    phone: "+91 11 4150 9988",
    address: "Connaught Place, New Delhi",
    city: "Delhi",
    state: "Delhi",
    country: "India",
    industry: "Dentists",
    rating: 4.7,
    userRatingsTotal: 512,
    googlePlaceId: "place_delhi_1",
    businessSize: "medium"
  },
  {
    name: "Dr. Sharma's Family Dental Clinic",
    website: "", // Missing website
    email: "",
    phone: "+91 11 2688 4433",
    address: "Green Park Extension, New Delhi",
    city: "Delhi",
    state: "Delhi",
    country: "India",
    industry: "Dentists",
    rating: 3.5,
    userRatingsTotal: 45,
    googlePlaceId: "place_delhi_2",
    businessSize: "small"
  },

  // Hotels in Jaipur
  {
    name: "Rajputana Palace Resort",
    website: "http://rajputanapalacejaipur.com", // Old outdated site
    email: "reservation@rajputanapalace.com",
    phone: "+91 141 220 9988",
    address: "Amer Road, Jaipur",
    city: "Jaipur",
    state: "Rajasthan",
    country: "India",
    industry: "Hotels",
    rating: 4.1,
    userRatingsTotal: 780,
    googlePlaceId: "place_jaipur_1",
    businessSize: "large"
  },
  {
    name: "Pink City Heritage Stay",
    website: "", // Missing website
    email: "pinkcityheritage@gmail.com",
    phone: "+91 141 236 7744",
    address: "Johari Bazar, Jaipur",
    city: "Jaipur",
    state: "Rajasthan",
    country: "India",
    industry: "Hotels",
    rating: 4.6,
    userRatingsTotal: 290,
    googlePlaceId: "place_jaipur_2",
    businessSize: "medium"
  },

  // Real Estate in Indore
  {
    name: "Indore Heights Realty",
    website: "https://indoreheights.com",
    email: "sales@indoreheights.com",
    phone: "+91 731 405 5566",
    address: "Vijay Nagar, Indore",
    city: "Indore",
    state: "Madhya Pradesh",
    country: "India",
    industry: "Real Estate",
    rating: 4.0,
    userRatingsTotal: 88,
    googlePlaceId: "place_indore_1",
    businessSize: "medium"
  },
  {
    name: "Malwa Builders & Promoters",
    website: "", // Missing website
    email: "",
    phone: "+91 731 253 1122",
    address: "MG Road, Indore",
    city: "Indore",
    state: "Madhya Pradesh",
    country: "India",
    industry: "Real Estate",
    rating: 3.2,
    userRatingsTotal: 19,
    googlePlaceId: "place_indore_2",
    businessSize: "small"
  },

  // Gyms in Pune
  {
    name: "Steel Gym & Fitness Club",
    website: "http://steelgympune.com", // Old non-responsive site
    email: "membership@steelgympune.com",
    phone: "+91 20 2544 3322",
    address: "Kothrud, Pune",
    city: "Pune",
    state: "Maharashtra",
    country: "India",
    industry: "Gyms",
    rating: 4.3,
    userRatingsTotal: 195,
    googlePlaceId: "place_pune_1",
    businessSize: "medium"
  },
  {
    name: "Flex Fit Studio",
    website: "", // Missing website
    email: "flexfitstudio@gmail.com",
    phone: "+91 20 6602 1199",
    address: "Kalyani Nagar, Pune",
    city: "Pune",
    state: "Maharashtra",
    country: "India",
    industry: "Gyms",
    rating: 4.8,
    userRatingsTotal: 310,
    googlePlaceId: "place_pune_2",
    businessSize: "medium"
  }
];

const seedDB = async () => {
  try {
    const connStr = process.env.MONGODB_URI || 'mongodb://localhost:27017/leadbrain';
    await mongoose.connect(connStr);
    logger.info("Connected to MongoDB for seeding...");

    // Clear existing data
    await User.deleteMany({});
    await Team.deleteMany({});
    await Business.deleteMany({});
    await Lead.deleteMany({});

    logger.info("Cleared old database records.");

    // Create Admin User
    const adminUser = new User({
      name: "Admin Leader",
      email: "admin@leadbrain.ai",
      password: "admin123", // Hashes on pre-save
      role: "admin",
      isVerified: true,
      aiCredits: 9999
    });
    await adminUser.save();
    logger.info("Seeded Admin User: admin@leadbrain.ai (pw: admin123)");

    // Create Agency Owner User
    const agencyOwner = new User({
      name: "Agency Owner",
      email: "agency@leadbrain.ai",
      password: "agency123", // Hashes on pre-save
      role: "admin",
      isVerified: true,
      aiCredits: 150
    });
    await agencyOwner.save();

    // Create Team for Agency Owner
    const team = await Team.create({
      name: "Acme Web Studio Workspace",
      owner: agencyOwner._id,
      members: [{ user: agencyOwner._id, role: 'admin' }]
    });

    agencyOwner.teamId = team._id;
    await agencyOwner.save();
    logger.info("Seeded Agency Owner: agency@leadbrain.ai (pw: agency123) and default Team Workspace.");

    // Seed Businesses & Leads
    const businesses = await Business.insertMany(sampleBusinesses);
    logger.info(`Seeded ${businesses.length} sample Businesses.`);

    // Attach Leads to the Agency Owner's Team
    const leadPromises = businesses.map((business, i) => {
      const isMissingWebsite = !business.website || business.website === 'none';
      return Lead.create({
        business: business._id,
        team: team._id,
        status: i % 4 === 0 ? 'new' : i % 4 === 1 ? 'qualified' : i % 4 === 2 ? 'contacted' : 'won',
        opportunityScore: isMissingWebsite ? 95 : Math.floor(Math.random() * 50) + 40,
        isBookmarked: i % 5 === 0,
        tags: isMissingWebsite ? ['Missing Website', 'Cold Pitch'] : ['Has Site', 'SEO Audit Needed']
      });
    });

    const leads = await Promise.all(leadPromises);
    logger.info(`Attached ${leads.length} Leads to Team workspace.`);

    logger.info("Database Seeding Successful! Exiting script.");
    process.exit(0);
  } catch (error) {
    logger.error(`Seeding error: ${error.message}`);
    process.exit(1);
  }
};

seedDB();
