// Extends Express's Request interface to include the authenticated user's ID.
// The auth middleware extracts this value from the access token and attaches it to the request, making it available in all protected route controllers via req.userId.
declare namespace Express {
  interface Request {
    userId: number;
  }
}
