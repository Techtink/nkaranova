import FAQ from '../models/FAQ.js';

// @desc    Get all FAQs (public - for mobile apps)
// @route   GET /api/faqs
// @access  Public
export const getFAQs = async (req, res, next) => {
  try {
    const { category, audience } = req.query;

    const query = { isActive: true };

    if (category) {
      query.category = category;
    }

    if (audience && audience !== 'all') {
      query.targetAudience = { $in: [audience, 'all'] };
    }

    const faqs = await FAQ.find(query)
      .sort({ order: 1, createdAt: -1 })
      .select('-createdBy -updatedBy');

    res.status(200).json({
      success: true,
      data: faqs
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get all FAQs (admin - includes inactive)
// @route   GET /api/faqs/admin
// @access  Private/Admin
export const getAdminFAQs = async (req, res, next) => {
  try {
    const { category, audience, active } = req.query;

    const query = {};

    if (category) {
      query.category = category;
    }

    if (audience) {
      query.targetAudience = audience;
    }

    if (active !== undefined) {
      query.isActive = active === 'true';
    }

    const faqs = await FAQ.find(query)
      .sort({ order: 1, createdAt: -1 })
      .populate('createdBy', 'firstName lastName')
      .populate('updatedBy', 'firstName lastName');

    res.status(200).json({
      success: true,
      data: faqs
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get single FAQ
// @route   GET /api/faqs/:id
// @access  Public
export const getFAQ = async (req, res, next) => {
  try {
    const faq = await FAQ.findById(req.params.id);

    if (!faq) {
      return res.status(404).json({
        success: false,
        message: 'FAQ not found'
      });
    }

    res.status(200).json({
      success: true,
      data: faq
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Create FAQ
// @route   POST /api/faqs
// @access  Private/Admin
export const createFAQ = async (req, res, next) => {
  try {
    const { question, answer, category, targetAudience, order, isActive } = req.body;

    const faq = await FAQ.create({
      question,
      answer,
      category,
      targetAudience,
      order: order || 0,
      isActive: isActive !== undefined ? isActive : true,
      createdBy: req.user._id
    });

    res.status(201).json({
      success: true,
      data: faq
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Update FAQ
// @route   PUT /api/faqs/:id
// @access  Private/Admin
export const updateFAQ = async (req, res, next) => {
  try {
    const { question, answer, category, targetAudience, order, isActive } = req.body;

    let faq = await FAQ.findById(req.params.id);

    if (!faq) {
      return res.status(404).json({
        success: false,
        message: 'FAQ not found'
      });
    }

    faq.question = question || faq.question;
    faq.answer = answer || faq.answer;
    faq.category = category || faq.category;
    faq.targetAudience = targetAudience || faq.targetAudience;
    faq.order = order !== undefined ? order : faq.order;
    faq.isActive = isActive !== undefined ? isActive : faq.isActive;
    faq.updatedBy = req.user._id;

    await faq.save();

    res.status(200).json({
      success: true,
      data: faq
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Delete FAQ
// @route   DELETE /api/faqs/:id
// @access  Private/Admin
export const deleteFAQ = async (req, res, next) => {
  try {
    const faq = await FAQ.findByIdAndDelete(req.params.id);

    if (!faq) {
      return res.status(404).json({
        success: false,
        message: 'FAQ not found'
      });
    }

    res.status(200).json({
      success: true,
      message: 'FAQ deleted successfully'
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Reorder FAQs
// @route   PUT /api/faqs/reorder
// @access  Private/Admin
export const reorderFAQs = async (req, res, next) => {
  try {
    const { items } = req.body; // Array of { id, order }

    if (!items || !Array.isArray(items)) {
      return res.status(400).json({
        success: false,
        message: 'Items array is required'
      });
    }

    const updates = items.map(item => ({
      updateOne: {
        filter: { _id: item.id },
        update: { order: item.order, updatedBy: req.user._id }
      }
    }));

    await FAQ.bulkWrite(updates);

    res.status(200).json({
      success: true,
      message: 'FAQs reordered successfully'
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get FAQ categories
// @route   GET /api/faqs/categories
// @access  Public
export const getFAQCategories = async (req, res, next) => {
  try {
    const categories = [
      { value: 'general', label: 'General' },
      { value: 'account', label: 'Account' },
      { value: 'orders', label: 'Orders' },
      { value: 'payments', label: 'Payments' },
      { value: 'shipping', label: 'Shipping' },
      { value: 'returns', label: 'Returns' },
      { value: 'tailors', label: 'For Tailors' },
      { value: 'customers', label: 'For Customers' }
    ];

    res.status(200).json({
      success: true,
      data: categories
    });
  } catch (error) {
    next(error);
  }
};
