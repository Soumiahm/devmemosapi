//T reimplement
const mongoose = require("mongoose");

//For more on user plan visit: http://www.databaseanswers.org/data_models/web_site_user_Plans/index.htm 
// Storage limit: https://help.evernote.com/hc/en-us/articles/209005247-Evernote-system-limits

const accountSchema = new mongoose.Schema(
    //I am planning to use this schema as an embeded document in user or
    //use subscriptions : free, paid and determine if storage uploads/data 
    //or create account model with subdocuments
    //examples: https://stackoverflow.com/questions/50794573/how-can-i-improve-database-design-for-my-subscription-based-billing-system
    //https://stackoverflow.com/questions/42406147/need-better-database-design-approach
);
const Account = mongoose.model("Account", accountSchema);
exports.exports = Account; 