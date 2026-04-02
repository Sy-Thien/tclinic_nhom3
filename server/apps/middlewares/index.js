// Export all middlewares

const auth = require('./auth');
const errorHandler = require('./errorHandler');
const { validate, validationRules, body, param, query } = require('./validate');

module.exports = {
    // Auth middleware
    verifyToken: auth.verifyToken.bind(auth),
    isAdmin: auth.isAdmin.bind(auth),
    isDoctor: auth.isDoctor.bind(auth),
    isPatient: auth.isPatient.bind(auth),
    optionalAuth: auth.optionalAuth.bind(auth),
    checkDoctorRole: auth.checkDoctorRole.bind(auth),
    checkAdminRole: auth.checkAdminRole.bind(auth),

    // Error handler
    errorHandler,

    // Validation
    validate,
    validationRules,
    body,
    param,
    query
};
