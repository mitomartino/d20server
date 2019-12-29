/**
 * **********************************************************************************************************
 * mail.js
 *
 * author: William Martino
 *
 * Mailer configuration data
 *
 * Exports: The mail configuration informatoin
 *
 * **********************************************************************************************************
 */

// ----------------------------------------------------------------------------------------------------------
// dependencies
// ----------------------------------------------------------------------------------------------------------


// ----------------------------------------------------------------------------------------------------------
// main script
// ----------------------------------------------------------------------------------------------------------

var config =
{
    email:    "mailer.d20server@gmail.com",
    authType: "xoauth2",
    authData:
    {
        user:              "mailer.d20server@gmail.com",
        displayName:       "D20 Server",
        clientId:          "495012096978-po8ce79mj7q32017m4vjj9p6jbsdjrm8.apps.googleusercontent.com",
        clientSecret:      "0aQB1mttQT2mhZpvWcAPcQTI",
        authorizationCode: "4/s3tfhuKI4sWQtbiVmqCp-Qrf8owrj4tf8q1OgRwIvNU",
        refreshToken:      "1/d6p0qO9ak-BvQatwkM7WRs_G4chv1D1I0QcNQ_jlC94",
        accessToken:       "ya29.Ci-gA83FUJj6G96ig-N9bK0wajwdRuWDTfpjGPJEJX6szbYDPHKFooXFEy7hUsxr5w"
    }
};

module.exports = config;

// ----------------------------------------------------------------------------------------------------------
// end database.js
// ----------------------------------------------------------------------------------------------------------
