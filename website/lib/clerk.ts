export const clerkPublishableKey = process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY;
export const clerkSecretKey = process.env.CLERK_SECRET_KEY;

if (!clerkPublishableKey || !clerkSecretKey) {
  throw new Error('Missing Clerk API keys');
}
