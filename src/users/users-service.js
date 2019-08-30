const xss = require('xss');
const bcrypt = require('bcryptjs');

const REGEX_UPPER_LOWER_NUMBER_SPECIAL = /(?=.*[a-z])(?=.*[A-Z])(?=.*[0-9])(?=.*[!@#\$%\^&])[\S]+/

const UsersService = {
    serializeUser(user) {
        return {
            id: user.id,
            full_name: xss(user.full_name),
            user_name: xss(user.user_name),
            nickname: xss(user.nickname),
            date_created: new Date(user.date_created),
        };
    },

    hashPassword(password) {
        return bcrypt.hash(password, 12);
    },

    validatePassword(passsword) {
        if(passsword.length < 8) {
            return 'Password must be longer than 8 characters';
        }

        if(passsword.length > 72) {
            return 'Password must be shorter than 72 characters';
        }

        if(passsword.startsWith(' ') || passsword.endsWith(' ')) {
            return 'Password must not start or end with spaces';
        }

        if(!REGEX_UPPER_LOWER_NUMBER_SPECIAL.test(passsword)) {
            return 'Password must contain one upper case, lower case, number, and special character';
        }
    },

    hasUserWithUserName(db, user_name) {
        return db('blogful_users')
            .where({ user_name })
            .first()
            .then(user => !!user)
    },

    insertUser(db, newUser) {
        return db
            .insert(newUser)
            .into('blogful_users')
            .returning('*')
            .then(([user]) => user)
    },
};

module.exports = UsersService;
