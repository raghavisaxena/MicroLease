const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const { Item, User } = require('../models');

// Create item (any authenticated user can list items)
router.post('/', auth, async (req, res) => {
  try {
    const { title, description, category, pricePerDay, imageUrl, location, condition } = req.body;
    console.log('POST /api/items payload:', { userId: req.user && req.user.id, bodySample: { title, pricePerDay, imageUrlLength: (imageUrl||'').toString().length } });
    
    // Validate required fields
    if (!title || !pricePerDay) {
      return res.status(400).json({ message: 'Title and price per day are required' });
    }

    const item = await Item.create({ 
      title, 
      description: description || null, 
      category: category || null, 
      pricePerDay: parseFloat(pricePerDay), 
      imageUrl: imageUrl || null, 
      location: location || null, 
      condition: condition || null, 
      OwnerId: req.user.id 
    });
    console.log(`POST /api/items created item id=${item.id} title='${item.title}' ownerId=${item.OwnerId} imageLength=${(item.imageUrl||'').toString().length}`);
    res.json(item);
  } catch (err) {
    console.error('Error creating item:', err);
    console.error(err.stack);
    // Return detailed error in response for easier debugging in dev
    res.status(500).json({ 
      message: err.message || 'Server error',
      details: err.stack
    });
  }
});

// Get items owned by current user
router.get('/my', auth, async (req, res) => {
  try {
    console.log(`GET /api/items/my - User ID: ${req.user.id}`);
    const items = await Item.findAll({
      where: { OwnerId: req.user.id },
      include: [{ model: User, as: 'owner', attributes: ['id','name','email'] }],
      order: [['createdAt', 'DESC']]
    });

    console.log(`GET /api/items/my - Found ${items.length} items for user ${req.user.id}`);

    // Normalize imageUrl values
    const normalized = items.map((it) => {
      const obj = it.toJSON();
      const raw = obj.imageUrl || "";
      if (raw && typeof raw === 'string') {
        const trimmed = raw.trim();
        if (!trimmed.startsWith('data:') && !trimmed.startsWith('http') && !trimmed.startsWith('/')) {
          const base64pattern = /^[A-Za-z0-9+/=\n\r]+$/;
          const onlyBase64 = base64pattern.test(trimmed.replace(/\s/g, ''));
          if (onlyBase64) {
            obj.imageUrl = `data:image/jpeg;base64,${trimmed}`;
          } else {
            obj.imageUrl = trimmed;
          }
        } else {
          obj.imageUrl = trimmed;
        }
      }
      return obj;
    });

    res.json(normalized);
  } catch (err) {
    console.error('Error in GET /api/items/my:', err);
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

// List all available items
router.get('/', async (req, res) => {
  try {
    // Return all items (including ones that might have availability=false)
    // so the Browse page shows all products. If you want to only show available
    // items, re-add the where: { availability: true } filter.
    const items = await Item.findAll({
      include: [{ model: User, as: 'owner', attributes: ['id','name','email'] }]
    });

    // Normalize imageUrl values so frontend can render them reliably.
    const normalized = items.map((it) => {
      const obj = it.toJSON();
      const raw = obj.imageUrl || "";
      if (raw && typeof raw === 'string') {
        const trimmed = raw.trim();
        if (!trimmed.startsWith('data:') && !trimmed.startsWith('http') && !trimmed.startsWith('/')) {
          // rough base64 check
          const base64pattern = /^[A-Za-z0-9+/=\n\r]+$/;
          const onlyBase64 = base64pattern.test(trimmed.replace(/\s/g, ''));
          if (onlyBase64) {
            obj.imageUrl = `data:image/jpeg;base64,${trimmed}`;
          } else {
            obj.imageUrl = trimmed;
          }
        } else {
          obj.imageUrl = trimmed;
        }
      }
      return obj;
    });

    console.log(`GET /api/items -> returning ${normalized.length} items`);
    res.json(normalized);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
});

// Debug endpoint: returns counts and short metadata to help diagnose missing items/images
router.get('/debug', async (req, res) => {
  try {
    const items = await Item.findAll();
    const rows = items.map((it) => {
      const obj = it.toJSON();
      const raw = obj.imageUrl || '';
      return {
        id: obj.id,
        title: obj.title,
        ownerId: obj.OwnerId,
        hasImage: !!raw,
        imageLength: raw ? raw.length : 0,
        isDataUrl: typeof raw === 'string' && raw.trim().startsWith('data:'),
        isHttpUrl: typeof raw === 'string' && raw.trim().startsWith('http'),
      };
    });
    res.json({ count: rows.length, rows });
  } catch (err) {
    console.error('debug error', err);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get item by id
router.get('/:id', async (req, res) => {
  try {
    // Don't treat 'my' as an ID - this should be caught by the /my route above
    if (req.params.id === 'my') {
      console.warn('WARNING: /:id route caught /my request - route order issue!');
      return res.status(404).json({ message: 'Route not found' });
    }
    
    const item = await Item.findByPk(req.params.id, { include: [{ model: User, as: 'owner', attributes: ['id','name','email'] }] });
    if (!item) return res.status(404).json({ message: 'Not found' });
    res.json(item);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
});

// Update item (owner only)
router.put('/:id', auth, async (req, res) => {
  try {
    const item = await Item.findByPk(req.params.id);
    if (!item) return res.status(404).json({ message: 'Item not found' });
    
    // Check if user is the owner
    if (item.OwnerId !== req.user.id) {
      return res.status(403).json({ message: 'Only owner can update this item' });
    }

    const { title, description, category, pricePerDay, imageUrl, location, condition, availability } = req.body;
    
    // Update only provided fields
    if (title !== undefined) item.title = title;
    if (description !== undefined) item.description = description;
    if (category !== undefined) item.category = category;
    if (pricePerDay !== undefined) item.pricePerDay = parseFloat(pricePerDay);
    if (imageUrl !== undefined) item.imageUrl = imageUrl;
    if (location !== undefined) item.location = location;
    if (condition !== undefined) item.condition = condition;
    if (availability !== undefined) item.availability = availability;

    await item.save();
    res.json(item);
  } catch (err) {
    console.error('Error updating item:', err);
    res.status(500).json({ message: 'Server error' });
  }
});

// Delete item (owner only)
router.delete('/:id', auth, async (req, res) => {
  try {
    const item = await Item.findByPk(req.params.id);
    if (!item) return res.status(404).json({ message: 'Item not found' });
    
    // Check if user is the owner
    if (item.OwnerId !== req.user.id) {
      return res.status(403).json({ message: 'Only owner can delete this item' });
    }

    await item.destroy();
    res.json({ message: 'Item deleted successfully' });
  } catch (err) {
    console.error('Error deleting item:', err);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;
