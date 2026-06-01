/**
 * Standardised API response envelope.
 *
 * Shape:
 * {
 *   success: true | false,
 *   message: "...",
 *   data:    <payload>,
 *   meta:    { page, limit, total }  ← only on paginated lists
 * }
 */
class ApiResponse {
  constructor(statusCode, data, message = 'Success', meta = null) {
    this.success    = statusCode < 400;
    this.message    = message;
    this.data       = data;
    if (meta) this.meta = meta;
  }
}

module.exports = ApiResponse;
