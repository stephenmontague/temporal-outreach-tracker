export const TASK_QUEUE = "outreach-tracking";

/**
 * Get the current user ID from environment.
 * In the MVP, this is a single hardcoded user.
 * In production, this would come from authentication.
 */
export const getUserId = (): string => process.env.USER_ID || "default-user";

// Helper to create a URL-safe slug from a name
const slugify = (name: string) =>
     name
          .toLowerCase()
          .replace(/[^a-z0-9]+/g, "-")
          .replace(/(^-|-$)/g, "");

// Helper to format contact name (firstName + lastName) or fallback to slackUsername
export const formatContactName = (
     firstName?: string,
     lastName?: string,
     slackUsername?: string
): string | undefined => {
     if (firstName) {
          const fullName = lastName ? `${firstName} ${lastName}` : firstName;
          return slugify(fullName);
     }
     if (slackUsername) {
          return slugify(slackUsername);
     }
     return undefined;
};
