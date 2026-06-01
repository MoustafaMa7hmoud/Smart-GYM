const { PAGINATION } = require('./constants');

/**
 * ─────────────────────────────────────────────────────────────────────────────
 *  ApiFeatures — reusable Mongoose query builder.
 *
 *  Usage:
 *    const features = new ApiFeatures(Model.find(), req.query)
 *      .filter()
 *      .search(['name', 'description'])
 *      .sort()
 *      .paginate();
 *
 *    const docs  = await features.query.populate(...);
 *    const total = await features.count();
 * ─────────────────────────────────────────────────────────────────────────────
 */
class ApiFeatures {
  /**
   * @param {mongoose.Query} query       - A Mongoose query object (e.g. Model.find())
   * @param {object}         queryString - req.query
   */
  constructor(query, queryString) {
    this.query       = query;
    this.queryString = queryString;
    this._filterObj  = {};   // stored so count() can reuse it
    this._Model      = query.model; // reference for count()
  }

  // ── 1. FILTER ──────────────────────────────────────────────────────────────
  /**
   * Removes pagination / sorting / search keys, then converts
   * MongoDB comparison operators written as  ?price[gte]=10  into
   * proper Mongoose syntax  { price: { $gte: 10 } }.
   *
   * Also supports exact-match filters:  ?level=beginner&muscle=chest
   */
  filter() {
    const excluded = ['page', 'limit', 'sort', 'fields', 'search'];
    const raw      = { ...this.queryString };
    excluded.forEach((k) => delete raw[k]);

    // Replace  gte / gt / lte / lt  with  $gte / $gt / $lte / $lt
    let str = JSON.stringify(raw);
    str     = str.replace(/\b(gte|gt|lte|lt)\b/g, (m) => `$${m}`);

    this._filterObj = JSON.parse(str);
    this.query      = this.query.find(this._filterObj);
    return this;
  }

  // ── 2. SEARCH ──────────────────────────────────────────────────────────────
  /**
   * Full-text style regex search across specified fields.
   * ?search=bench  → matches any doc whose `name` or `description` contains "bench".
   *
   * @param {string[]} fields - Document fields to search (default: ['name'])
   */
  search(fields = ['name']) {
    if (this.queryString.search) {
      const regex = { $regex: this.queryString.search, $options: 'i' };
      const orConditions = fields.map((f) => ({ [f]: regex }));
      this.query = this.query.find({ $or: orConditions });
    }
    return this;
  }

  // ── 3. SORT ────────────────────────────────────────────────────────────────
  /**
   * ?sort=name          → ascending by name
   * ?sort=-createdAt    → descending by createdAt
   * ?sort=level,-name   → multi-field sort
   *
   * Defaults to newest-first.
   */
  sort() {
    const sortBy = this.queryString.sort
      ? this.queryString.sort.split(',').join(' ')
      : '-createdAt';
    this.query = this.query.sort(sortBy);
    return this;
  }

  // ── 4. FIELD LIMITING ─────────────────────────────────────────────────────
  /**
   * ?fields=name,muscle,level  → only return those fields
   */
  limitFields() {
    if (this.queryString.fields) {
      const fields = this.queryString.fields.split(',').join(' ');
      this.query   = this.query.select(fields);
    } else {
      this.query = this.query.select('-__v');
    }
    return this;
  }

  // ── 5. PAGINATE ───────────────────────────────────────────────────────────
  /**
   * ?page=2&limit=10
   * Returns `this` so the chain continues; also stores pagination meta.
   */
  paginate() {
    const page  = Math.max(1, parseInt(this.queryString.page,  10) || PAGINATION.DEFAULT_PAGE);
    const limit = Math.min(
      parseInt(this.queryString.limit, 10) || PAGINATION.DEFAULT_LIMIT,
      PAGINATION.MAX_LIMIT
    );
    const skip = (page - 1) * limit;

    this.query    = this.query.skip(skip).limit(limit);
    this._page    = page;
    this._limit   = limit;
    return this;
  }

  // ── COUNT (for total) ─────────────────────────────────────────────────────
  /**
   * Run a parallel countDocuments using the same filter.
   * Call after .filter() but before awaiting .query.
   */
  async count() {
    return this._Model.countDocuments(this._filterObj);
  }

  // ── META helper ───────────────────────────────────────────────────────────
  get meta() {
    return { page: this._page, limit: this._limit };
  }
}

module.exports = ApiFeatures;
