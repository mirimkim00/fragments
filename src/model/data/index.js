// Pick the appropriate back-end data strategy

// We currently only have 1, our memory strategy, 
// but we'll add ones for AWS later
module.exports = require('./memory');
