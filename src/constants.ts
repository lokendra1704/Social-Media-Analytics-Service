export const MYSQL_TIME_FORMAT = 'YYYY-MM-DD HH:mm:ss';

export const POST_STATUS = {
    INACTIVE: 0,
    ACTIVE: 1,
}

export const POPULARITY_THRESHOLD = 5; // Threshold to determine popularity
export const STANDARD_EXPIRY = 3600; // Standard expiry time (e.g., 1 hour)
export const EXTENDED_EXPIRY = 86400; // Extended expiry time for popular items (e.g., 24 hours)
export const EXCLUDED_CHARACTERS = ['.', ',', '!', '?', ';', ':', '"', "'", '(', ')', '[', ']', '{', '}', '<', '>', '/', '\\', '|', '-', '_', '=', '+', '*', '&', '^', '%', '$', '#', '@', '~', '`', ' '];
