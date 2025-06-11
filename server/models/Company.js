const mongoose = require('mongoose');
const CompanySchema = new mongoose.Schema({
  name: String,
  industry: String,
});
module.exports = mongoose.model('Company', CompanySchema);
