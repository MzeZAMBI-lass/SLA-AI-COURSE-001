import { classifyMessage } from '../src/services/messageParser';

describe('classifyMessage', () => {
  it('extracts coordinates from a native location pin', () => {
    const result = classifyMessage({
      type: 'location',
      location: { latitude: -3.7321, longitude: 36.6858, name: 'Home', address: 'Babati' },
    });
    expect(result.type).toBe('location');
    expect(result.location?.latitude).toBe(-3.7321);
    expect(result.location?.longitude).toBe(36.6858);
    expect(result.location?.source).toBe('pin');
    expect(result.location?.confidence).toBe(1.0);
  });

  it('extracts coordinates from a standard Google Maps URL', () => {
    const result = classifyMessage({
      type: 'text',
      text: { body: 'https://www.google.com/maps?q=-3.7321,36.6858' },
    });
    expect(result.type).toBe('link');
    expect(result.location?.latitude).toBeCloseTo(-3.7321);
    expect(result.location?.longitude).toBeCloseTo(36.6858);
    expect(result.location?.source).toBe('link');
  });

  it('extracts coordinates from a Google Maps @lat,lon URL', () => {
    const result = classifyMessage({
      type: 'text',
      text: { body: 'https://www.google.com/maps/place/Babati/@-3.7321,36.6858,15z' },
    });
    expect(result.type).toBe('link');
    expect(result.location?.latitude).toBeCloseTo(-3.7321);
  });

  it('extracts coordinates from an OSM link', () => {
    const result = classifyMessage({
      type: 'text',
      text: { body: 'https://www.openstreetmap.org/#map=15/-3.7321/36.6858' },
    });
    expect(result.type).toBe('link');
    expect(result.location?.latitude).toBeCloseTo(-3.7321);
    expect(result.location?.source).toBe('link');
  });

  it('flags plain text for geocoding', () => {
    const result = classifyMessage({
      type: 'text',
      text: { body: 'Lot 14, Mwanga Road, Babati' },
    });
    expect(result.type).toBe('text');
    expect(result.needsGeocoding).toBe(true);
    expect(result.rawText).toBe('Lot 14, Mwanga Road, Babati');
  });

  it('flags image messages for manual review', () => {
    const result = classifyMessage({ type: 'image' });
    expect(result.type).toBe('image');
    expect(result.flagReason).toBeDefined();
  });

  it('flags unknown message types', () => {
    const result = classifyMessage({ type: 'sticker' });
    expect(result.type).toBe('unknown');
    expect(result.flagReason).toBeDefined();
  });
});
