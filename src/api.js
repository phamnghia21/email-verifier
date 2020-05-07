'use strict';

const EmailValidator = require('email-deep-validator');
const sendMessage = require('./messageBroker');
const { EMAIL_VALIDATION_STATUSES, Emails } = require('./models');
const { debugBase, sendRequest } = require('./utils');

const sendSingleMessage = async (doc, isRest, create) => {
    if (create) {
        var email = new Emails(doc);
        await email.save();
    }

    if (isRest) {
        return doc.status;
    }
    return sendMessage('emailVerifierNotification', { action: 'emailVerify', data: [doc] });
};

const singleTrueMail = async (email) => {
    try {
        const url = `https://truemail.io/api/v1/verify/single?access_token=${TRUE_MAIL_API_KEY}&email=${email}`;

        const response = await sendRequest({
            url,
            method: 'GET',
        });

        return JSON.parse(response);
    } catch (e) {
        debugBase(`Error occured during single true mail validation ${e.message}`);
        throw e;
    }
};

const bulkTrueMail = async (unverifiedEmails) => {
    const url = `https://truemail.io/api/v1/tasks/bulk?access_token=${TRUE_MAIL_API_KEY}`;

    try {
        const result = await sendRequest({
            url,
            method: 'POST',
            body: {
                file: unverifiedEmails,
            },
        });

        sendMessage('emailVerifierBulkEmailNotification', { action: 'bulk', data: result });
    } catch (e) {
        sendMessage('emailVerifierBulkEmailNotification', { action: 'bulk', data: e.message });
    }
};
const single = async (email, isRest) => {
    const emailOnDb = await Emails.findOne({ email });

    if (emailOnDb) {
        return sendSingleMessage({ email, status: emailOnDb.status }, isRest);
    }

    const emailValidator = new EmailValidator();
    const { validDomain, validMailbox } = await emailValidator.verify(email);

    if (validDomain && validMailbox) {
        return sendSingleMessage({ email, status: EMAIL_VALIDATION_STATUSES.VALID }, isRest, true);
    }

    let response = {};

    if (EMAIL_VERIFICATION_TYPE === 'truemail') {
        try {
            response = await singleTrueMail(email);
        } catch (_e) {
            return sendSingleMessage({ email, status: EMAIL_VALIDATION_STATUSES.UNKNOWN }, isRest);
        }
    }

    if (response.status === 'success') {
        return sendSingleMessage({ email, status: response.result }, isRest, true);
    }

    // if status is not success
    return sendSingleMessage({ email, status: EMAIL_VALIDATION_STATUSES.INVALID }, isRest);
};

const bulk = async (emails) => {
    const unverifiedEmails = [];
    const verifiedEmails = [];

    for (const email of emails) {
        const found = await Emails.findOne({ email });

        if (found) {
            verifiedEmails.push({ email: found.email, status: found.status });
        } else {
            unverifiedEmails.push({ email });
        }
    }

    if (verifiedEmails.length > 0) {
        sendMessage('emailVerifierNotification', { action: 'emailVerify', data: verifiedEmails });
    }

    if (unverifiedEmails.length > 0) {
        switch (EMAIL_VERIFICATION_TYPE) {
            case 'truemail': {
                await bulkTrueMail(unverifiedEmails);

                break;
            }
        }
    } else {
        sendMessage('emailVerifierBulkNotification', {
            action: 'bulk',
            data: 'There are no emails to verify on the email verification system',
        });
    }
};

module.exports = {
    single, bulk
}