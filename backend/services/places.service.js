import logger from '../utils/logger.js';

/**
 * Fetch genuine leads from Google Places API (with fallbacks between New and Legacy endpoints)
 */
export const fetchRealLeadsFromGoogle = async (searchQuery, city) => {
  const apiKey = process.env.GOOGLE_MAP_API_KEY;
  if (!apiKey) {
    logger.warn('GOOGLE_MAP_API_KEY is missing. Skipping Google Places search.');
    return [];
  }

  // 1. Try Places API (New) first
  try {
    logger.info(`Attempting Google Places API (New) for query: "${searchQuery}" in "${city}"`);
    const newApiLeads = await fetchLeadsNewApi(searchQuery, city, apiKey);
    if (newApiLeads && newApiLeads.length > 0) {
      return newApiLeads;
    }
  } catch (newApiError) {
    logger.warn(`Google Places API (New) failed: ${newApiError.message}. Trying Legacy fallback.`);
  }

  // 2. Fallback to Places API (Legacy)
  try {
    logger.info(`Attempting Google Places API (Legacy) for query: "${searchQuery}" in "${city}"`);
    const legacyApiLeads = await fetchLeadsLegacyApi(searchQuery, city, apiKey);
    return legacyApiLeads;
  } catch (legacyApiError) {
    logger.error(`Both Google Places (New and Legacy) APIs failed. Please ensure Places API is enabled and unrestricted in Google Cloud Console.`);
    logger.error(`Legacy API Error: ${legacyApiError.message}`);
    return [];
  }
};

/**
 * Fetch leads using the modern Places API (New)
 */
const fetchLeadsNewApi = async (searchQuery, city, apiKey) => {
  const url = 'https://places.googleapis.com/v1/places:searchText';
  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-Goog-Api-Key': apiKey,
      'X-Goog-FieldMask': 'places.id,places.displayName,places.formattedAddress,places.nationalPhoneNumber,places.rating,places.userRatingCount,places.websiteUri'
    },
    body: JSON.stringify({
      textQuery: `${searchQuery} in ${city}`,
      languageCode: 'en',
      maxResultCount: 5
    })
  });

  if (!response.ok) {
    const errText = await response.text();
    throw new Error(`Places API (New) HTTP error: ${response.status} - ${errText}`);
  }

  const data = await response.json();
  if (data.error) {
    throw new Error(`Places API (New) returned error: ${data.error.message || JSON.stringify(data.error)}`);
  }

  const places = data.places || [];
  return places.map(place => {
    const name = place.displayName?.text || '';
    const address = place.formattedAddress || '';
    const reviewsCount = place.userRatingCount || 0;

    return {
      name,
      website: place.websiteUri || '',
      email: '',
      phone: place.nationalPhoneNumber || '',
      address,
      city: city,
      state: '',
      country: 'India',
      industry: searchQuery,
      rating: place.rating || 0,
      userRatingsTotal: reviewsCount,
      googlePlaceId: place.id,
      businessSize: getBusinessSize(reviewsCount),
      googleMapsUrl: `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(name + ' ' + address + ' ' + city)}`
    };
  });
};

/**
 * Fetch leads using the legacy Places Text Search + Details APIs
 */
const fetchLeadsLegacyApi = async (searchQuery, city, apiKey) => {
  const textSearchUrl = `https://maps.googleapis.com/maps/api/place/textsearch/json?query=${encodeURIComponent(`${searchQuery} in ${city}`)}&key=${apiKey}`;
  const response = await fetch(textSearchUrl);
  if (!response.ok) {
    throw new Error(`Legacy Text Search HTTP error: ${response.status}`);
  }

  const data = await response.json();
  if (data.status !== 'OK' && data.status !== 'ZERO_RESULTS') {
    throw new Error(`Legacy Text Search API returned status: ${data.status} - ${data.error_message || ''}`);
  }

  const results = data.results || [];
  const topResults = results.slice(0, 5);
  const leads = [];

  for (const place of topResults) {
    try {
      const details = await fetchPlaceDetailsLegacy(place.place_id, apiKey);
      if (details) {
        leads.push({
          name: details.name || place.name,
          website: details.website || '',
          email: '',
          phone: details.formatted_phone_number || '',
          address: details.formatted_address || place.formatted_address || '',
          city: details.city || city,
          state: details.state || '',
          country: details.country || 'India',
          industry: searchQuery,
          rating: details.rating || place.rating || 0,
          userRatingsTotal: details.user_ratings_total || place.user_ratings_total || 0,
          googlePlaceId: place.place_id,
          businessSize: getBusinessSize(details.user_ratings_total || place.user_ratings_total || 0),
          googleMapsUrl: `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent((details.name || place.name) + ' ' + (details.formatted_address || place.formatted_address || '') + ' ' + city)}`
        });
      }
    } catch (err) {
      logger.warn(`Failed fetching details for legacy place ${place.place_id}: ${err.message}. Falling back to basic search data.`);
      leads.push({
        name: place.name,
        website: '',
        email: '',
        phone: '',
        address: place.formatted_address || '',
        city: city,
        state: '',
        country: 'India',
        industry: searchQuery,
        rating: place.rating || 0,
        userRatingsTotal: place.user_ratings_total || 0,
        googlePlaceId: place.place_id,
        businessSize: getBusinessSize(place.user_ratings_total || 0),
        googleMapsUrl: `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(place.name + ' ' + (place.formatted_address || '') + ' ' + city)}`
      });
    }
  }

  return leads;
};

const fetchPlaceDetailsLegacy = async (placeId, apiKey) => {
  const url = `https://maps.googleapis.com/maps/api/place/details/json?place_id=${placeId}&fields=name,formatted_address,formatted_phone_number,website,rating,user_ratings_total,address_components&key=${apiKey}`;
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`Legacy Details request failed: ${response.status}`);
  }

  const data = await response.json();
  if (data.status !== 'OK') {
    throw new Error(`Legacy Details returned status: ${data.status} - ${data.error_message || ''}`);
  }

  const result = data.result || {};
  const components = result.address_components || [];

  const getComponent = (types) => {
    const comp = components.find(c => c.types.some(t => types.includes(t)));
    return comp ? comp.long_name : '';
  };

  return {
    name: result.name,
    formatted_address: result.formatted_address,
    formatted_phone_number: result.formatted_phone_number,
    website: result.website,
    rating: result.rating,
    user_ratings_total: result.user_ratings_total,
    city: getComponent(['locality', 'postal_town']),
    state: getComponent(['administrative_area_level_1']),
    country: getComponent(['country'])
  };
};

const getBusinessSize = (reviewsCount) => {
  if (reviewsCount > 300) return 'large';
  if (reviewsCount > 50) return 'medium';
  return 'small';
};
