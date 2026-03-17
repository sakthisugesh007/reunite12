const Joi = require('joi');

const imageUrlSchema = Joi.string().custom((value, helpers) => {
  if (
    /^https?:\/\//i.test(value) ||
    /^data:image\/[a-zA-Z0-9.+-]+;base64,/i.test(value)
  ) {
    return value;
  }

  return helpers.error('string.uri');
}, 'image url validation');

const validateRegistration = (req, res, next) => {
  const schema = Joi.object({
    name: Joi.string().min(2).max(100).required(),
    email: Joi.string().email().required(),
    password: Joi.string().min(6).required(),
    phone: Joi.string().optional()
  });

  const { error } = schema.validate(req.body);
  if (error) {
    return res.status(400).json({ error: error.details[0].message });
  }
  next();
};

const validateLogin = (req, res, next) => {
  const schema = Joi.object({
    email: Joi.string().email().required(),
    password: Joi.string().required()
  });

  const { error } = schema.validate(req.body);
  if (error) {
    return res.status(400).json({ error: error.details[0].message });
  }
  next();
};

const validateItem = (req, res, next) => {
  const schema = Joi.object({
    title: Joi.string().min(3).max(100).required(),
    description: Joi.string().min(10).max(500).required(),
    type: Joi.string().valid('lost', 'found').required(),
    category: Joi.string().valid('electronics', 'jewelry', 'documents', 'clothing', 'accessories', 'bags', 'keys', 'pets', 'others').required(),
    tags: Joi.array().items(Joi.string().max(50)).min(1).required(),
    location: Joi.string().min(3).max(200).required(),
    coordinates: Joi.object({
      latitude: Joi.number().min(-90).max(90),
      longitude: Joi.number().min(-180).max(180)
    }).optional(),
    images: Joi.array().items(
      Joi.object({
        url: imageUrlSchema.required(),
        publicId: Joi.string().optional(),
        isPrimary: Joi.boolean().default(false)
      })
    ).optional(),
    reward: Joi.number().min(0).optional(),
    dateLost: Joi.date().optional(),
    dateFound: Joi.date().optional()
  });

  const { error } = schema.validate(req.body);
  if (error) {
    return res.status(400).json({ error: error.details[0].message });
  }
  next();
};

const validateMessage = (req, res, next) => {
  const schema = Joi.object({
    content: Joi.string().min(1).max(1000).required(),
    messageType: Joi.string().valid('text', 'image', 'location').default('text'),
    metadata: Joi.object().optional()
  });

  const { error } = schema.validate(req.body);
  if (error) {
    return res.status(400).json({ error: error.details[0].message });
  }
  next();
};

module.exports = {
  validateRegistration,
  validateLogin,
  validateItem,
  validateMessage
};
