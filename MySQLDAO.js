//for the promise-sql package to work with my machine and 
//my version of sql I had to put this into the sql command client
//mysql> ALTER USER 'root'@'localhost' IDENTIFIED WITH mysql_native_password BY 'root';

//NOTE: Server version: 8.0.35 MySQL Community Server - GPL
//the above is from the MySQL 8.0 Command Line Client window

//data access object for mysql
var promiseMySQL = require('promise-mysql')

var pool;

//set up the connection
promiseMySQL.createPool({
    connectionLimit: 3,
    host: 'localhost',
    user: 'root',
    password: 'root',
    database: 'proj2023',
})
    .then(p => {
        pool = p
    })
    .catch(e => {
        console.log("pool error:" + e)
    })

var getStores = function () {
    return new Promise((resolve, reject) => {
        pool.query('select * from store')
            .then((data) => {
                resolve(data)
            })
            .catch((error) => {
                reject(error)
            })
    })
}

//write a method to get a single store details through SID
var getStore = function (sid) {
    return new Promise((resolve, reject) => {
        selectQuery = {
            sql: "select * from store where sid like('" + sid + "')",
            values: [sid]
        }
        pool.query(selectQuery)
            .then((data) => {
                resolve(data)
            })
            .catch((error) => {
                reject(error)
            })
    })
}

//function to make an update query with the details passed in from the form
var editStore = function (formContent, sid) {
    return new Promise((resolve, reject) => {
        editQuery = {
            sql: "update store set location = '" + formContent.location + "', mgrid = '" + formContent.mgrid + "' where sid like('" + sid + "')",
            values: [formContent, sid]
        }
        pool.query(editQuery)
            .then((data) => {
                resolve(data)
            })
            .catch((error) => {
                reject(error)
            })
    })
}

var addStore = function (formContent) {
    return new Promise((resolve, reject) => {
        addQuery = {
            sql: "insert into store values ('" + formContent.sid + "', '" + formContent.location + "', '" + formContent.mgrid + "')",
            values: [formContent]
        }
        pool.query(addQuery)
            .then((data) => {
                resolve(data)
            })
            .catch((error) => {
                reject(error)
            })
    })
}

var getProducts = function () {
    return new Promise((resolve, reject) => {
        //the query gets stuff from other tables aswell
        //stuff like location and productdesc
        pool.query('select p.pid, p.productdesc, ps.sid, ps.price, s.location from product p left join product_store ps on p.pid = ps.pid left join store s on ps.sid = s.sid order by p.pid')
            .then((data) => {
                resolve(data)
            })
            .catch((error) => {
                reject(error)
            })
    })
}

var deleteProduct = function (pid) {
    return new Promise((resolve, reject) => {
        deleteQuery = {
            sql: "delete from product where pid like('" + pid + "')",
            values: [pid]
        }
        pool.query(deleteQuery)
            .then((data) => {
                resolve(data)
            })
            .catch((error) => {
                reject(error)
            })
    })
}

module.exports = { getStores, getStore, editStore, addStore, getProducts, deleteProduct }