/**
 * **********************************************************************************************************
 * mutex.js
 *
 * author: William Martino
 *
 * Mutual exclusion.  Node.js is single-threaded and generally does not require mutual exclusion.  However,
 * operations may involve multiple callbacks allowing for partial changes to occur.  This object allows
 * these operations to ensure that these operations complete uninterrupted
 *
 * **********************************************************************************************************
 */

// ----------------------------------------------------------------------------------------------------------
// dependencies
// ----------------------------------------------------------------------------------------------------------



// ----------------------------------------------------------------------------------------------------------
// main script
// ----------------------------------------------------------------------------------------------------------


// ----------------------------------------------------------------------------------------------------------
// exported api
// ----------------------------------------------------------------------------------------------------------

var api = {};

// ----------------------------------------------------------------------------------------------------------

module.exports = api;

// ----------------------------------------------------------------------------------------------------------
// end mutex.js
// ----------------------------------------------------------------------------------------------------------