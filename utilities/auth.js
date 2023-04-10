const db = require("../db/postgresql.js");
const mailer = require("./mailer.js");
const bcrypt = require("bcryptjs");

module.exports = {
    createNewUser: async (name, email, password) => {
        try {
            const query1 = `SELECT * FROM users WHERE email = '${email}'`;
            const result1 = await db.query(query1);
            if(result1.rows.length === 1) {
                if(result1.rows[0].isverified === true) {
                    return { info: "Account with this email already exists, please try with another email", status: "info", title: "Account already exists" };
                } else {
                    mailer.sendVerificationLink(result1.rows[0].id, result1.rows[0].email, result1.rows[0].name);
                    return { info: "Account with this email already exists, please click on the verification link sent to your email to continue login", status: "info", title: "Account already exists" };
                }
            }
            const hashedPassword = await bcrypt.hash(password, 12);
            const query2 = `INSERT INTO users(name, email, password, isverified, dateJoined) VALUES('${name}', '${email}', '${hashedPassword}', false,'${Date.now()}')`;
            const result2 = await db.query(query2);
            const query3 = `SELECT id FROM users WHERE email = '${email}'`;
            const result3 = await db.query(query3);
            const id = parseInt(result3.rows[0].id);
            mailer.sendVerificationLink(id, email, name);
            return { info: "Account successfully created, please click on the verification link sent to your email to continue login", status: "success", title: "Account successfully created" };
        } catch(err) {
            throw err;
        }
    },
    verifyUser: async (id) => {
        try {
            const query1 = `SELECT * FROM users WHERE id = ${id}`;
            const result1 = await db.query(query1);
            if(result1.rows[0].isverified === true) {
                return { info: `Hi ${result1.rows[0].name}, you can now use your credentials to login`, status: "info", title: "Account already verified" };
            }
            const query2 = `UPDATE users SET isverified = true WHERE id = ${id}`;
            const result2 = await db.query(query2);
            return { info: `Hi ${result1.rows[0].name}, you can now use your credentials to login`, status: "info", title: "Account verification successful" };
        } catch(err) {
            throw err;
        }
    },
    authenticateUser: async (email, password) => {
        try {
            const query = `SELECT * FROM users WHERE email = '${email}'`;
            const result = await db.query(query);
            if(result.rows.length === 0 || !await bcrypt.compare(password, result.rows[0].password)) {
                return { info: "Invalid credentials", status: "error", title: "Error" };
            } else if(result.rows[0].isverified === false) {
                mailer.sendVerificationLink(result.rows[0].id, result.rows[0].email, result.rows[0].name);
                return { info: "User is not verified, but dont worry we have sent you a verification mail to your email", status: "warning", title: "Not verified" };
            }
            result.rows[0].datejoined = new Date(parseInt(result.rows[0].datejoined));
            result.rows[0].datejoined = result.rows[0].datejoined.toLocaleDateString("en-AU");
            return { info: "Login Successful", status: "success", title: "Login Successful", data: result.rows[0] };
        } catch(err) {
            throw err;
        }
    }
}