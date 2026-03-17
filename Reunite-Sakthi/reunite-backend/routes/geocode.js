const express = require('express');

const router = express.Router();

router.get('/search', async (req, res) => {
  try {
    const query = `${req.query.q || ''}`.trim();

    if (!query) {
      return res.status(400).json({ error: 'Location query is required' });
    }

    const url = new URL('https://nominatim.openstreetmap.org/search');
    url.searchParams.set('q', query);
    url.searchParams.set('format', 'jsonv2');
    url.searchParams.set('limit', '1');

    const response = await fetch(url, {
      headers: {
        'User-Agent': 'Reunite/1.0 (lost-and-found platform)',
        'Accept-Language': 'en',
      },
    });

    const data = await response.json();

    if (!response.ok) {
      return res.status(response.status).json({
        error: data?.error || 'Failed to geocode location',
      });
    }

    const firstResult = Array.isArray(data) ? data[0] : null;

    if (!firstResult) {
      return res.json({ result: null });
    }

    res.json({
      result: {
        latitude: parseFloat(firstResult.lat),
        longitude: parseFloat(firstResult.lon),
        displayName: firstResult.display_name,
      },
    });
  } catch (error) {
    console.error('Geocode search error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router;
