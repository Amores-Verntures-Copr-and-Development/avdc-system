// Thrown for expected, user-facing conditions (e.g. "out of stock") - unlike
// an unexpected internal/DB error, its message is safe to show verbatim to
// the end user rather than being collapsed into a generic message.
export class BusinessError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "BusinessError";
  }
}
