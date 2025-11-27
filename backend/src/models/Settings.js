import mongoose from 'mongoose';

const settingsSchema = new mongoose.Schema({
  key: {
    type: String,
    required: true,
    unique: true
  },
  value: {
    type: mongoose.Schema.Types.Mixed,
    required: true
  },
  category: {
    type: String,
    enum: ['referral', 'featured', 'general', 'payment', 'landing', 'order'],
    required: true
  },
  description: String,
  lastUpdatedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }
}, {
  timestamps: true
});

// Default settings
const defaultSettings = {
  // Referral settings
  tokens_per_referral: {
    value: 10,
    category: 'referral',
    description: 'Number of tokens awarded per successful referral'
  },
  referral_requires_verification: {
    value: true,
    category: 'referral',
    description: 'Whether referred tailor must be verified for referral to count'
  },

  // Featured spot settings
  tokens_for_featured_spot: {
    value: 100,
    category: 'featured',
    description: 'Tokens required to redeem a featured spot'
  },
  featured_spot_duration_days: {
    value: 7,
    category: 'featured',
    description: 'Duration in days for token-redeemed featured spots'
  },
  max_featured_tailors: {
    value: 8,
    category: 'featured',
    description: 'Maximum number of featured tailors to display'
  },
  featured_spot_price_7_days: {
    value: 2900,
    category: 'featured',
    description: 'Price in cents for 7-day featured spot'
  },
  featured_spot_price_14_days: {
    value: 4900,
    category: 'featured',
    description: 'Price in cents for 14-day featured spot'
  },
  featured_spot_price_30_days: {
    value: 8900,
    category: 'featured',
    description: 'Price in cents for 30-day featured spot'
  },

  // Landing page settings
  landing_hero_image: {
    value: '',
    category: 'landing',
    description: 'Hero section background image URL'
  },
  landing_hero_title_line1: {
    value: 'Clean Lines.',
    category: 'landing',
    description: 'Hero title first line'
  },
  landing_hero_title_line2: {
    value: 'Conscious Living.',
    category: 'landing',
    description: 'Hero title second line'
  },
  landing_hero_subtitle: {
    value: 'Timeless essentials for the modern minimalist. Designed to simplify your wardrobe — and elevate your everyday.',
    category: 'landing',
    description: 'Hero section subtitle text'
  },
  landing_hero_cta_text: {
    value: 'Explore the Collection',
    category: 'landing',
    description: 'Hero call-to-action button text'
  },
  landing_hero_cta_link: {
    value: '/tailors',
    category: 'landing',
    description: 'Hero call-to-action button link'
  },
  landing_testimonial_text: {
    value: 'Timeless, wearable, and truly well made.',
    category: 'landing',
    description: 'Hero section testimonial quote'
  },
  landing_review_count: {
    value: 450,
    category: 'landing',
    description: 'Number of reviews to display'
  },
  landing_review_rating: {
    value: 4.9,
    category: 'landing',
    description: 'Rating score to display'
  },
  landing_brand_name: {
    value: 'AFROTHREAD',
    category: 'landing',
    description: 'Brand name displayed in hero'
  },
  landing_product_tag_1_name: {
    value: 'Beige Blazer',
    category: 'landing',
    description: 'First product tag name'
  },
  landing_product_tag_1_price: {
    value: '80 USD',
    category: 'landing',
    description: 'First product tag price'
  },
  landing_product_tag_2_name: {
    value: 'Beige Trousers',
    category: 'landing',
    description: 'Second product tag name'
  },
  landing_product_tag_2_price: {
    value: '65 USD',
    category: 'landing',
    description: 'Second product tag price'
  },
  landing_featured_tailor: {
    value: '',
    category: 'landing',
    description: 'Username of the featured tailor whose profile the CTA links to'
  },
  landing_background_text: {
    value: 'FASHION',
    category: 'landing',
    description: 'Large background watermark text'
  },
  landing_background_text_size: {
    value: 22,
    category: 'landing',
    description: 'Background text font size in rem'
  },

  // Section 2 - Categories Section settings
  landing_section2_title: {
    value: 'Explore by Categories',
    category: 'landing',
    description: 'Section 2 main title'
  },
  landing_section2_description: {
    value: 'Discover curated pieces designed to elevate everyday elegance. Whether you\'re dressing up, keeping it casual, or making a statement — Velora has you covered.',
    category: 'landing',
    description: 'Section 2 description text'
  },
  landing_section2_stat_1_value: {
    value: '12,000+',
    category: 'landing',
    description: 'Section 2 stat 1 value'
  },
  landing_section2_stat_1_label: {
    value: 'Happy customers',
    category: 'landing',
    description: 'Section 2 stat 1 label'
  },
  landing_section2_stat_2_value: {
    value: '80%',
    category: 'landing',
    description: 'Section 2 stat 2 value'
  },
  landing_section2_stat_2_label: {
    value: 'Customer return rate',
    category: 'landing',
    description: 'Section 2 stat 2 label'
  },
  landing_section2_stat_3_value: {
    value: '5000+',
    category: 'landing',
    description: 'Section 2 stat 3 value'
  },
  landing_section2_stat_3_label: {
    value: 'Five-star reviews',
    category: 'landing',
    description: 'Section 2 stat 3 label'
  },
  landing_section2_stat_4_value: {
    value: 'Weekly',
    category: 'landing',
    description: 'Section 2 stat 4 value'
  },
  landing_section2_stat_4_label: {
    value: 'New styles added',
    category: 'landing',
    description: 'Section 2 stat 4 label'
  },
  landing_section2_category_1_name: {
    value: 'Tops',
    category: 'landing',
    description: 'Section 2 category 1 name'
  },
  landing_section2_category_1_image: {
    value: 'https://images.unsplash.com/photo-1485462537746-965f33f7f6a7?w=600&h=800&fit=crop',
    category: 'landing',
    description: 'Section 2 category 1 image URL'
  },
  landing_section2_category_1_link: {
    value: '/tailors?category=tops',
    category: 'landing',
    description: 'Section 2 category 1 link'
  },
  landing_section2_category_2_name: {
    value: 'Bottoms',
    category: 'landing',
    description: 'Section 2 category 2 name'
  },
  landing_section2_category_2_image: {
    value: 'https://images.unsplash.com/photo-1509631179647-0177331693ae?w=600&h=800&fit=crop',
    category: 'landing',
    description: 'Section 2 category 2 image URL'
  },
  landing_section2_category_2_link: {
    value: '/tailors?category=bottoms',
    category: 'landing',
    description: 'Section 2 category 2 link'
  },
  landing_section2_category_3_name: {
    value: 'Dresses',
    category: 'landing',
    description: 'Section 2 category 3 name'
  },
  landing_section2_category_3_image: {
    value: 'https://images.unsplash.com/photo-1595777457583-95e059d581b8?w=600&h=800&fit=crop',
    category: 'landing',
    description: 'Section 2 category 3 image URL'
  },
  landing_section2_category_3_link: {
    value: '/tailors?category=dresses',
    category: 'landing',
    description: 'Section 2 category 3 link'
  },
  landing_section2_category_4_name: {
    value: 'Accessories',
    category: 'landing',
    description: 'Section 2 category 4 name'
  },
  landing_section2_category_4_image: {
    value: 'https://images.unsplash.com/photo-1492707892479-7bc8d5a4ee93?w=600&h=800&fit=crop',
    category: 'landing',
    description: 'Section 2 category 4 image URL'
  },
  landing_section2_category_4_link: {
    value: '/tailors?category=accessories',
    category: 'landing',
    description: 'Section 2 category 4 link'
  },

  // Section 3 - New Arrivals settings
  landing_section3_title: {
    value: 'New Arrivals',
    category: 'landing',
    description: 'Section 3 main title'
  },
  landing_section3_product_1_name: {
    value: 'Organic Colour Cashmere Top',
    category: 'landing',
    description: 'Section 3 product 1 name'
  },
  landing_section3_product_1_price: {
    value: '149,00',
    category: 'landing',
    description: 'Section 3 product 1 price'
  },
  landing_section3_product_1_currency: {
    value: 'EUR',
    category: 'landing',
    description: 'Section 3 product 1 currency (EUR, USD, GBP)'
  },
  landing_section3_product_1_image: {
    value: 'https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?w=400&h=600&fit=crop',
    category: 'landing',
    description: 'Section 3 product 1 image URL'
  },
  landing_section3_product_1_link: {
    value: '/tailors',
    category: 'landing',
    description: 'Section 3 product 1 link'
  },
  landing_section3_product_1_colors: {
    value: '#D4A574,#8B7355,#2C2C2C,#E8E4DC',
    category: 'landing',
    description: 'Section 3 product 1 colors (comma-separated hex values)'
  },
  landing_section3_product_2_name: {
    value: 'Organic Colour Cashmere Top',
    category: 'landing',
    description: 'Section 3 product 2 name'
  },
  landing_section3_product_2_price: {
    value: '149,00',
    category: 'landing',
    description: 'Section 3 product 2 price'
  },
  landing_section3_product_2_currency: {
    value: 'EUR',
    category: 'landing',
    description: 'Section 3 product 2 currency (EUR, USD, GBP)'
  },
  landing_section3_product_2_image: {
    value: 'https://images.unsplash.com/photo-1496747611176-843222e1e57c?w=400&h=600&fit=crop',
    category: 'landing',
    description: 'Section 3 product 2 image URL'
  },
  landing_section3_product_2_link: {
    value: '/tailors',
    category: 'landing',
    description: 'Section 3 product 2 link'
  },
  landing_section3_product_2_colors: {
    value: '#D4A574,#8B7355,#2C2C2C,#E8E4DC',
    category: 'landing',
    description: 'Section 3 product 2 colors (comma-separated hex values)'
  },
  landing_section3_product_3_name: {
    value: 'Organic Colour Cashmere Top',
    category: 'landing',
    description: 'Section 3 product 3 name'
  },
  landing_section3_product_3_price: {
    value: '149,00',
    category: 'landing',
    description: 'Section 3 product 3 price'
  },
  landing_section3_product_3_currency: {
    value: 'EUR',
    category: 'landing',
    description: 'Section 3 product 3 currency (EUR, USD, GBP)'
  },
  landing_section3_product_3_image: {
    value: 'https://images.unsplash.com/photo-1469334031218-e382a71b716b?w=400&h=600&fit=crop',
    category: 'landing',
    description: 'Section 3 product 3 image URL'
  },
  landing_section3_product_3_link: {
    value: '/tailors',
    category: 'landing',
    description: 'Section 3 product 3 link'
  },
  landing_section3_product_3_colors: {
    value: '#D4A574,#8B7355,#2C2C2C,#E8E4DC',
    category: 'landing',
    description: 'Section 3 product 3 colors (comma-separated hex values)'
  },
  landing_section3_product_4_name: {
    value: 'Organic Colour Cashmere Top',
    category: 'landing',
    description: 'Section 3 product 4 name'
  },
  landing_section3_product_4_price: {
    value: '149,00',
    category: 'landing',
    description: 'Section 3 product 4 price'
  },
  landing_section3_product_4_currency: {
    value: 'EUR',
    category: 'landing',
    description: 'Section 3 product 4 currency (EUR, USD, GBP)'
  },
  landing_section3_product_4_image: {
    value: 'https://images.unsplash.com/photo-1485968579580-b6d095142e6e?w=400&h=600&fit=crop',
    category: 'landing',
    description: 'Section 3 product 4 image URL'
  },
  landing_section3_product_4_link: {
    value: '/tailors',
    category: 'landing',
    description: 'Section 3 product 4 link'
  },
  landing_section3_product_4_colors: {
    value: '#D4A574,#8B7355,#2C2C2C,#E8E4DC',
    category: 'landing',
    description: 'Section 3 product 4 colors (comma-separated hex values)'
  },

  // Section 4 - What Makes Us Different settings
  landing_section4_title: {
    value: 'What Makes Us Different',
    category: 'landing',
    description: 'Section 4 main title'
  },
  landing_section4_image: {
    value: 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=800&h=1000&fit=crop',
    category: 'landing',
    description: 'Section 4 main image URL'
  },
  landing_section4_feature_1_title: {
    value: 'Sustainable Fabrics',
    category: 'landing',
    description: 'Section 4 feature 1 title'
  },
  landing_section4_feature_1_description: {
    value: 'Only organic, recycled, or low-impact materials make the cut.',
    category: 'landing',
    description: 'Section 4 feature 1 description'
  },
  landing_section4_feature_2_title: {
    value: 'Small Batch Production',
    category: 'landing',
    description: 'Section 4 feature 2 title'
  },
  landing_section4_feature_2_description: {
    value: 'Crafted in limited runs to reduce waste and ensure quality.',
    category: 'landing',
    description: 'Section 4 feature 2 description'
  },
  landing_section4_feature_3_title: {
    value: 'Minimal Packaging',
    category: 'landing',
    description: 'Section 4 feature 3 title'
  },
  landing_section4_feature_3_description: {
    value: 'Shipped in recyclable, plastic-free materials.',
    category: 'landing',
    description: 'Section 4 feature 3 description'
  },
  landing_section4_testimonial_subtitle: {
    value: 'Loved by Women Everywhere',
    category: 'landing',
    description: 'Section 4 testimonial subtitle'
  },
  landing_section4_testimonial_text: {
    value: 'Since switching to Velora, I\'ve never felt more confident. The fabrics, the fit, the details - everything feels intentional.',
    category: 'landing',
    description: 'Section 4 testimonial quote'
  },
  landing_section4_testimonial_author: {
    value: 'Amanda R.',
    category: 'landing',
    description: 'Section 4 testimonial author name'
  },
  landing_section4_testimonial_image: {
    value: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=100&h=100&fit=crop',
    category: 'landing',
    description: 'Section 4 testimonial author image URL'
  },

  // Section 5 - Best Sellers settings
  landing_section5_title: {
    value: 'Best Sellers',
    category: 'landing',
    description: 'Section 5 main title'
  },
  landing_section5_product_1_name: {
    value: 'Classic Wool Blend Coat',
    category: 'landing',
    description: 'Section 5 product 1 name'
  },
  landing_section5_product_1_price: {
    value: '289,00',
    category: 'landing',
    description: 'Section 5 product 1 price'
  },
  landing_section5_product_1_currency: {
    value: 'EUR',
    category: 'landing',
    description: 'Section 5 product 1 currency (EUR, USD, GBP)'
  },
  landing_section5_product_1_image: {
    value: 'https://images.unsplash.com/photo-1539109136881-3be0616acf4b?w=400&h=600&fit=crop',
    category: 'landing',
    description: 'Section 5 product 1 image URL'
  },
  landing_section5_product_1_link: {
    value: '/tailors',
    category: 'landing',
    description: 'Section 5 product 1 link'
  },
  landing_section5_product_1_colors: {
    value: '#1a1a1a,#8B7355,#E8E4DC',
    category: 'landing',
    description: 'Section 5 product 1 colors (comma-separated hex values)'
  },
  landing_section5_product_2_name: {
    value: 'Silk Midi Dress',
    category: 'landing',
    description: 'Section 5 product 2 name'
  },
  landing_section5_product_2_price: {
    value: '199,00',
    category: 'landing',
    description: 'Section 5 product 2 price'
  },
  landing_section5_product_2_currency: {
    value: 'EUR',
    category: 'landing',
    description: 'Section 5 product 2 currency (EUR, USD, GBP)'
  },
  landing_section5_product_2_image: {
    value: 'https://images.unsplash.com/photo-1502716119720-b23a93e5fe1b?w=400&h=600&fit=crop',
    category: 'landing',
    description: 'Section 5 product 2 image URL'
  },
  landing_section5_product_2_link: {
    value: '/tailors',
    category: 'landing',
    description: 'Section 5 product 2 link'
  },
  landing_section5_product_2_colors: {
    value: '#D4A574,#2C2C2C,#8B7355',
    category: 'landing',
    description: 'Section 5 product 2 colors (comma-separated hex values)'
  },
  landing_section5_product_3_name: {
    value: 'Linen Wide Leg Pants',
    category: 'landing',
    description: 'Section 5 product 3 name'
  },
  landing_section5_product_3_price: {
    value: '129,00',
    category: 'landing',
    description: 'Section 5 product 3 price'
  },
  landing_section5_product_3_currency: {
    value: 'EUR',
    category: 'landing',
    description: 'Section 5 product 3 currency (EUR, USD, GBP)'
  },
  landing_section5_product_3_image: {
    value: 'https://images.unsplash.com/photo-1594938298603-c8148c4dae35?w=400&h=600&fit=crop',
    category: 'landing',
    description: 'Section 5 product 3 image URL'
  },
  landing_section5_product_3_link: {
    value: '/tailors',
    category: 'landing',
    description: 'Section 5 product 3 link'
  },
  landing_section5_product_3_colors: {
    value: '#E8E4DC,#D4A574,#1a1a1a',
    category: 'landing',
    description: 'Section 5 product 3 colors (comma-separated hex values)'
  },
  landing_section5_product_4_name: {
    value: 'Cashmere Knit Sweater',
    category: 'landing',
    description: 'Section 5 product 4 name'
  },
  landing_section5_product_4_price: {
    value: '179,00',
    category: 'landing',
    description: 'Section 5 product 4 price'
  },
  landing_section5_product_4_currency: {
    value: 'EUR',
    category: 'landing',
    description: 'Section 5 product 4 currency (EUR, USD, GBP)'
  },
  landing_section5_product_4_image: {
    value: 'https://images.unsplash.com/photo-1434389677669-e08b4cac3105?w=400&h=600&fit=crop',
    category: 'landing',
    description: 'Section 5 product 4 image URL'
  },
  landing_section5_product_4_link: {
    value: '/tailors',
    category: 'landing',
    description: 'Section 5 product 4 link'
  },
  landing_section5_product_4_colors: {
    value: '#8B7355,#E8E4DC,#2C2C2C',
    category: 'landing',
    description: 'Section 5 product 4 colors (comma-separated hex values)'
  },

  // Order/Work Plan settings
  order_plan_creation_deadline_hours: {
    value: 48,
    category: 'order',
    description: 'Hours given to tailor to create work plan after payment (default 48 hours)'
  },
  order_plan_reminder_hours_before: {
    value: 12,
    category: 'order',
    description: 'Hours before deadline to send plan creation reminder to tailor'
  },
  order_max_plan_revisions: {
    value: 3,
    category: 'order',
    description: 'Maximum number of plan revisions allowed'
  },
  order_stage_delay_reminder_hours: {
    value: 24,
    category: 'order',
    description: 'Hours after estimated stage completion to send delay reminder'
  },
  order_auto_escalate_after_hours: {
    value: 72,
    category: 'order',
    description: 'Hours of inactivity before auto-escalating to admin'
  },
  order_customer_approval_required: {
    value: true,
    category: 'order',
    description: 'Whether customer must approve work plan before work begins'
  },
  order_allow_stage_modification: {
    value: true,
    category: 'order',
    description: 'Allow tailor to modify plan stages during work (with logging)'
  },
  order_notify_admin_on_completion: {
    value: true,
    category: 'order',
    description: 'Send notification to admin when order is completed'
  },
  order_notify_admin_on_delay: {
    value: true,
    category: 'order',
    description: 'Send notification to admin when tailor requests delay'
  }
};

// Static method to get a setting value
settingsSchema.statics.getValue = async function(key) {
  const setting = await this.findOne({ key });
  if (setting) {
    return setting.value;
  }
  // Return default if exists
  if (defaultSettings[key]) {
    return defaultSettings[key].value;
  }
  return null;
};

// Static method to set a setting value
settingsSchema.statics.setValue = async function(key, value, userId) {
  const setting = await this.findOneAndUpdate(
    { key },
    {
      value,
      category: defaultSettings[key]?.category || 'general',
      description: defaultSettings[key]?.description,
      lastUpdatedBy: userId
    },
    { upsert: true, new: true }
  );
  return setting;
};

// Static method to get all settings by category
settingsSchema.statics.getByCategory = async function(category) {
  const settings = await this.find({ category });
  const result = {};

  // Start with defaults for this category
  Object.entries(defaultSettings)
    .filter(([_, v]) => v.category === category)
    .forEach(([key, v]) => {
      result[key] = v.value;
    });

  // Override with saved values
  settings.forEach(s => {
    result[s.key] = s.value;
  });

  return result;
};

// Static method to get all settings
settingsSchema.statics.getAll = async function() {
  const settings = await this.find({});
  const result = {};

  // Start with all defaults
  Object.entries(defaultSettings).forEach(([key, v]) => {
    result[key] = {
      value: v.value,
      category: v.category,
      description: v.description
    };
  });

  // Override with saved values
  settings.forEach(s => {
    result[s.key] = {
      value: s.value,
      category: s.category,
      description: s.description
    };
  });

  return result;
};

// Static method to initialize default settings
settingsSchema.statics.initializeDefaults = async function() {
  for (const [key, data] of Object.entries(defaultSettings)) {
    await this.findOneAndUpdate(
      { key },
      {
        key,
        value: data.value,
        category: data.category,
        description: data.description
      },
      { upsert: true }
    );
  }
};

export default mongoose.model('Settings', settingsSchema);
