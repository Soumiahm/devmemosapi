class APIFeatures {
  constructor(query, queryObject) {
    this.query = query; //storing the initial query
    this.queryObject = queryObject;
  }
  filter() {
    // A) Filtering
    const queryObj = { ...this.queryObject };

    //if the query has other fields that the following, it will just return 0 results
    //These fields are treated separately, we sat a separate filter for search, but maybe we need to set it here
    
    const excludedFields = ["page", "sort", "limit", "fields", "search"];
    excludedFields.forEach((element) => {
      delete queryObj[element];
    });

    // B) Advanced filtering
    let queryStr = JSON.stringify(queryObj);
    queryStr = queryStr.replace(/\b(gte|lte|gt|lt)\b/g, (match) => `$${match}`);

    this.query = this.query.find(JSON.parse(queryStr)); //attach another find to the initial query 
    return this;
  }
  sort() {
    // 2) Sorting
    if (this.queryObject.sort) {
      const sortBy = this.queryObject.sort.split(",").join(" ");
      this.query = this.query.sort(sortBy);
    } else {
      this.query = this.query.sort("-createdAt");
    }
    return this;
  }

  limitFields() {
    // 3) Field limiting
    if (this.queryObject.fields) {
      const selectBy = this.queryObject.fields.split(",").join(" ");
      this.query = this.query.select(selectBy);
    } else {
      this.query = this.query.select("-__v");
    }
    return this;
  }
  paginate() {
    // 4) Pagination
    const limit = this.queryObject.limit * 1 || 100; // return max of 100 results as default
    const page = this.queryObject.page * 1 || 1;
    const skip = (page - 1) * limit;
    this.query = this.query.skip(skip).limit(limit);
    return this;
  }
}

module.exports = APIFeatures;
