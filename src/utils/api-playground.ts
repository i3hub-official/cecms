export const formatJson = (obj: any): string => {
  try {
    if (typeof obj === 'string') {
      return JSON.stringify(JSON.parse(obj), null, 2);
    }
    return JSON.stringify(obj, null, 2);
  } catch {
    return String(obj);
  }
};

export const validateJson = (text: string): boolean => {
  try {
    if (text.trim() === '') return true;
    JSON.parse(text);
    return true;
  } catch {
    return false;
  }
};

export const getPresetEndpoints = (baseUrl: string = '') => [
  { value: `${baseUrl}/apis/v1/center-lookup?number=`, label: 'Center Lookup' },
  { value: `${baseUrl}/apis/v1/dispute-center/`, label: 'Get Dispute Center' },
  { value: `${baseUrl}/apis/v1/dispute-center`, label: 'List Dispute Centers' },
  { value: `${baseUrl}/apis/v1/helper/`, label: 'Helper Endpoint' },
];

export const getPresetBodies = () => ({
  'POST /dispute-center': JSON.stringify({
    name: "New Dispute Center",
    address: "123 Main Street",
    state: "Lagos",
    lga: "Ikeja",
    email: "center@example.com",
    phone: "+2348000000000",
    maxCapacity: 50
  }, null, 2),
  'PUT /dispute-center': JSON.stringify({
    name: "Updated Center Name",
    address: "456 Updated Street",
    maxCapacity: 75
  }, null, 2)
});