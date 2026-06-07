export interface Region {
  id: string;
  name: string;
  /** Representative weather/species sample point: [lat, lon] */
  centroid: [number, number];
  /** Full state names (matching the GeoJSON properties.name) */
  states: string[];
  /** Map fill color — cool blue/teal/purple to fit the theme */
  color: string;
}

export const REGIONS: Region[] = [
  {
    id: 'pacific-northwest',
    name: 'Pacific Northwest',
    centroid: [46.0, -121.0],
    states: ['Washington', 'Oregon'],
    color: '#2f7d8c',
  },
  {
    id: 'northern-rockies',
    name: 'Northern Rockies',
    centroid: [46.0, -113.5],
    states: ['Idaho', 'Montana'],
    color: '#3f87a6',
  },
  {
    id: 'california',
    name: 'California',
    centroid: [37.5, -120.0],
    states: ['California'],
    color: '#3a64b0',
  },
  {
    id: 'great-basin',
    name: 'Great Basin',
    centroid: [39.5, -116.0],
    states: ['Nevada', 'Utah'],
    color: '#356f9e',
  },
  {
    id: 'southern-rockies',
    name: 'Southern Rockies',
    centroid: [41.0, -106.5],
    states: ['Colorado', 'Wyoming'],
    color: '#5b6fb0',
  },
  {
    id: 'southwest',
    name: 'Southwest',
    centroid: [34.0, -108.5],
    states: ['Arizona', 'New Mexico'],
    color: '#7a5ea8',
  },
  {
    id: 'northern-plains',
    name: 'Northern Plains',
    centroid: [44.0, -100.0],
    states: ['North Dakota', 'South Dakota', 'Nebraska'],
    color: '#4a8fae',
  },
  {
    id: 'upper-midwest',
    name: 'Upper Midwest',
    centroid: [44.5, -92.5],
    states: ['Minnesota', 'Iowa', 'Wisconsin'],
    color: '#3d8a7a',
  },
  {
    id: 'great-lakes',
    name: 'Great Lakes',
    centroid: [41.5, -85.5],
    states: ['Michigan', 'Illinois', 'Indiana', 'Ohio'],
    color: '#5a7fc0',
  },
  {
    id: 'central-plains',
    name: 'Central Plains',
    centroid: [38.5, -95.5],
    states: ['Kansas', 'Missouri'],
    color: '#6b6bc4',
  },
  {
    id: 'south-central',
    name: 'South Central',
    centroid: [35.0, -94.0],
    states: ['Oklahoma', 'Arkansas'],
    color: '#8a5fa0',
  },
  {
    id: 'texas',
    name: 'Texas',
    centroid: [31.0, -99.0],
    states: ['Texas'],
    color: '#9a6ab0',
  },
  {
    id: 'gulf-coast',
    name: 'Gulf Coast',
    centroid: [31.5, -89.5],
    states: ['Louisiana', 'Mississippi', 'Alabama'],
    color: '#7060b0',
  },
  {
    id: 'deep-south',
    name: 'Deep South',
    centroid: [33.0, -82.5],
    states: ['Georgia', 'South Carolina'],
    color: '#4488a0',
  },
  {
    id: 'florida',
    name: 'Florida',
    centroid: [28.3, -81.5],
    states: ['Florida'],
    color: '#2f6f9c',
  },
  {
    id: 'mid-atlantic',
    name: 'Mid-Atlantic',
    centroid: [37.8, -79.0],
    states: ['Virginia', 'North Carolina', 'West Virginia', 'Maryland', 'Delaware', 'District of Columbia'],
    color: '#6f5fa8',
  },
  {
    id: 'tennessee-valley',
    name: 'Tennessee Valley',
    centroid: [36.5, -86.0],
    states: ['Kentucky', 'Tennessee'],
    color: '#8060b8',
  },
  {
    id: 'ny-pa',
    name: 'New York & Pennsylvania',
    centroid: [42.0, -76.5],
    states: ['New York', 'Pennsylvania', 'New Jersey'],
    color: '#4a5fa0',
  },
  {
    id: 'new-england',
    name: 'New England',
    centroid: [44.0, -71.5],
    states: ['Maine', 'New Hampshire', 'Vermont', 'Massachusetts', 'Rhode Island', 'Connecticut'],
    color: '#3f6fb0',
  },
];

/** state name → region id */
export const STATE_TO_REGION: Record<string, string> = REGIONS.reduce(
  (acc, r) => {
    r.states.forEach(s => { acc[s] = r.id; });
    return acc;
  },
  {} as Record<string, string>,
);

export function regionById(id: string): Region | undefined {
  return REGIONS.find(r => r.id === id);
}
