const pg = require("pg");
const path = require("path");
const bcrypt = require("bcryptjs");
require('dotenv').config({ path: path.join(__dirname, "..", ".env") });
const client = new pg.Client(process.env.CONNECTION_STRING);

module.exports = {
    connect: () => {
        client.connect(err => {
            if(err) {
                return ;
            }
        })
    },
    dropblogstable: async() => {
        const query = `DROP TABLE blogs`;
        const result = await client.query(query);
    },
    dropusertable: async()  => {
        const query = `DROP TABLE users`;
        const result = await client.query(query);
    },
    showallusers: async () => {
        const query = `SELECT * FROM users`;
        const result = await client.query(query);
        console.log(result.rows);
    },
    query: queryString => {
        return client.query(queryString);
    },
    createusertable: async () => {
        const query = `
                    CREATE TABLE users (
                        id bigserial primary key,
                        email varchar(64) not null unique,
                        name varchar(64) not null,
                        password varchar(64) not null,
                        isverified boolean not null,
                        dateJoined varchar(64) not null
                    );
                    `;
        return await client.query(query);
    },
    getUserDetails: async id => {
        const query = `SELECT * FROM users WHERE id = ${id}`;
        const tempResults = await client.query(query);
        let result = [];
        for(let tempResult of tempResults.rows) {
            let modifiedTempResult = tempResult;
            const tempDate = new Date(parseInt(tempResult.dateJoined));
            const modifiedTempDate = tempDate.toLocaleDateString("en-AU");
            modifiedTempResult.dateJoined = tempDate;
            result.push(modifiedTempResult);
        }
        return result;
    },
    getUserDetailsFromEmail: async email => {
        const query = `SELECT * FROM users WHERE email = '${email}'`;
        const result = await client.query(query);
        if(result.rows[0] == undefined) {
            return { id: null, email: null};
        }
        return result.rows[0];
    },
    changeUserPassword: async (id, password) => {
        const hashedPassword = await bcrypt.hash(password, 12);
        const query = `UPDATE users SET password = '${hashedPassword}' WHERE id = ${id}`;
        const result = await client.query(query);
        return { info: "Password reset successful", status: "success", title: "Success"};
    },
    getUserDetailsForSearch: async keywords => {
        let result = [];
        for(let keyword of keywords) {
            const query = `SELECT id, name, email FROM users WHERE UPPER(name) LIKE UPPER('%${keyword}%') AND isverified = true`;
            const tempResult = await client.query(query);
            for(let newItem of tempResult.rows) {
                let flag = true;
                for(let res of result) {
                    if(newItem.id === res.id) {
                        flag = false;
                    }
                }
                if(flag === true) {
                    result.push(newItem);
                }
            }
        }
        const mainResult = { data: result, info: "Fetch Successful", status: "success", title: "Success" };
        return mainResult;
    },
    updateUserDetails: async (id, name, password) => {
        let query, hashedPassword;
        if(password) {
            hashedPassword = await bcrypt.hash(password, 12);
        }
        if(name && password) {
            query = `UPDATE users SET name = '${name}', password = '${hashedPassword}' WHERE id = ${id}`;
        } else if(name && !password) {
            query = `UPDATE users SET name = '${name}' WHERE id = ${id}`;
        } else if(!name && password) {
            query = `UPDATE users SET password = '${hashedPassword}' WHERE id = ${id}`;
        }
        const result = client.query(query);
        return { info: "User details successfully updated", status: "success", title: "Success" };
    },
    createblogstable: async () => {
        const query =   `
                        CREATE TABLE blogs (
                            id bigserial primary key,
                            title varchar(30) not null,
                            blogDate varchar(64) not null,
                            content text not null,
                            userId integer not null,
                            tag1 varchar(32),
                            tag2 varchar(32),
                            constraint fk_user_id FOREIGN KEY(userId) REFERENCES users(id)
                        )
                        `;
        return await client.query(query);
    },
    createNewBlog: async (title, content, tag1, tag2, userId) => {
        try {
            const query = `INSERT INTO blogs(title, blogDate, content, userId, tag1, tag2) VALUES ('${title}', '${Date.now()}', '${content}', ${userId}, UPPER('${tag1}'), UPPER('${tag2}'))`;
            const result = await client.query(query);
            return { info: "Blog created successfully", status: "success", title: "Success" };
        } catch(err) {
            throw err;
        }
    },
    getUserDetails: async id => {
        const query1 = `SELECT email, name, dateJoined FROM users WHERE id = ${id};`;
        const query2 = `SELECT COUNT(*) FROM blogs WHERE userId = ${id}`;
        const result1 = await client.query(query1);
        const result2 = await client.query(query2);
        const date = new Date(parseInt(result1.rows[0].datejoined));
        const details = {
            id: result1.rows[0].id,
            name: result1.rows[0].name,
            email: result1.rows[0].email,
            dateJoined: date.toLocaleDateString("en-AU"),
            count: result2.rows[0].count
        };
        return { details: details, info: "Fetch Successful", status: "success", title: "Success" }
    },
    getUserProfile: async id => {
        const query1 =  `
                        SELECT 
                            blogs.id blogId,
                            blogs.title blogTitle,
                            blogs.blogDate blogDate,
                            blogs.content blogContent,
                            blogs.tag1 tag1,
                            blogs.tag2 tag2,
                            blogs.userId userId,
                            users.email email,
                            users.name username
                        FROM
                            blogs INNER JOIN users 
                        ON 
                            blogs.userId = users.id
                        WHERE
                            users.id = ${id}
                        ORDER BY blogDate DESC
                        `;
        //date is in milliseconds first sort it according to time and then truncate the time, leaving only date to display in the frontend
        const tempResults = await client.query(query1);
        let result1 = [];
        for(let tempResult of tempResults.rows) {
            let modifiedTempResult = tempResult;
            const tempDate = new Date(parseInt(tempResult.blogdate));
            modifiedTempResult.blogdate = tempDate;
            result1.push(modifiedTempResult);
        }
        result1 = result1.sort((objA, objB) => Number(objB.date) - Number(objA.date));
        const mainResult = [];
        for(let res of result1) {
            let modifiedTempResult = res;
            const modifiedTempDate = res.blogdate.toLocaleDateString("en-AU");
            modifiedTempResult.blogdate = modifiedTempDate;
            mainResult.push(modifiedTempResult);
        }
        const query2 = `SELECT id, name, email, dateJoined FROM users WHERE id=${id};`;
        const result2 = await client.query(query2);
        const date = new Date(parseInt(result2.rows[0].datejoined));
        const details = {
            id: result2.rows[0].id,
            name: result2.rows[0].name,
            email: result2.rows[0].email,
            dateJoined: date.toLocaleDateString("en-AU"),
            count: mainResult.length
        };
        return { details: details, blogs: mainResult, info: "Fetch Successful", status: "success", title: "Success" }
    },
    loadMoreBlogs: async loadcnt => {
        const query =  `
                        SELECT 
                            blogs.id blogId,
                            blogs.title blogTitle,
                            blogs.blogDate blogDate,
                            blogs.content blogContent,
                            blogs.tag1 tag1,
                            blogs.tag2 tag2,
                            blogs.userId userId,
                            users.email email,
                            users.name username
                        FROM
                            blogs INNER JOIN users 
                        ON 
                            blogs.userId = users.id
                        ORDER BY blogDate DESC
                        OFFSET ${3*loadcnt} ROWS
                        FETCH NEXT 3 ROW ONLY
                        `;
        const tempResults = await client.query(query);
        let result = [];
        for(let tempResult of tempResults.rows) {
            let modifiedTempResult = tempResult;
            const tempDate = new Date(parseInt(tempResult.blogdate));
            modifiedTempResult.blogdate = tempDate;
            result.push(modifiedTempResult);
        }
        result = result.sort((objA, objB) => Number(objB.date) - Number(objA.date));
        const mainResult = [];
        for(let res of result) {
            let modifiedTempResult = res;
            const modifiedTempDate = res.blogdate.toLocaleDateString("en-AU");
            modifiedTempResult.blogdate = modifiedTempDate;
            mainResult.push(modifiedTempResult);
        }
        return { data: mainResult, info: "Fetch Successful", status: "success", title: "Success" }
    },
    getBlogs: async (id, loadcnt) => {
        const query =  `
                        SELECT 
                            blogs.id blogId,
                            blogs.title blogTitle,
                            blogs.blogDate blogDate,
                            blogs.content blogContent,
                            blogs.tag1 tag1,
                            blogs.tag2 tag2,
                            blogs.userId userId,
                            users.email email,
                            users.name username
                        FROM
                            blogs INNER JOIN users 
                        ON 
                            blogs.userId = users.id
                        WHERE
                            blogs.userId = ${id}
                        ORDER BY blogDate DESC
                        OFFSET ${3*loadcnt} ROWS
                        FETCH NEXT 3 ROW ONLY
                        `;
        const tempResults = await client.query(query);
        let result = [];
        for(let tempResult of tempResults.rows) {
            let modifiedTempResult = tempResult;
            const tempDate = new Date(parseInt(tempResult.blogdate));
            modifiedTempResult.blogdate = tempDate;
            result.push(modifiedTempResult);
        }
        result = result.sort((objA, objB) => Number(objB.date) - Number(objA.date));
        const mainResult = [];
        for(let res of result) {
            let modifiedTempResult = res;
            const modifiedTempDate = res.blogdate.toLocaleDateString("en-AU");
            modifiedTempResult.blogdate = modifiedTempDate;
            mainResult.push(modifiedTempResult);
        }
        return { data: mainResult, info: "Fetch Successful", status: "success", title: "Success" }
    }
}