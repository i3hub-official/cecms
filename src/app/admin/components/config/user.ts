/**
 * Mask part of an email for privacy
 * e.g. johndoe@example.com -> jo***e@example.com
 */
export const maskEmail = (email: string): string => {
  if (!email || !email.includes("@")) return email;
  const [localPart, domain] = email.split("@");
  const firstChars = localPart.substring(0, 2);
  const lastChar =
    localPart.length > 2 ? localPart.substring(localPart.length - 1) : "";
  return `${firstChars}***${lastChar}@${domain}`;
};

/**
 * Get initials from a user's name
 * e.g. John Doe -> JD
 */
export const getInitials = (name: string): string => {
  if (!name) return "U";
  const names = name.trim().split(/\s+/);
  if (names.length === 1) {
    return names[0].charAt(0).toUpperCase();
  }
  return `${names[0].charAt(0)}${names[names.length - 1].charAt(0)}`.toUpperCase();
};

/**
 * Generate a consistent background color for avatar based on name
 */
export const getAvatarColor = (name: string): string => {
  const colors = [
    "bg-blue-500",
    "bg-green-500",
    "bg-purple-500",
    "bg-pink-500",
    "bg-red-500",
    "bg-yellow-500",
    "bg-indigo-500",
    "bg-teal-500",
  ];
  if (!name) return colors[0];
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash);
  }
  return colors[Math.abs(hash) % colors.length];
};
