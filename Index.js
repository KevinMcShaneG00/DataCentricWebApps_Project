var express = require('express')
var mySQLDAO = require('./MySQLDAO')
var mongoDAO = require('./MongodbDAO')
var bodyParser = require('body-parser');
var ejs = require('ejs')

var app = express()

app.set('view engine', 'ejs')

//Configure body-parser middleware
app.use(bodyParser.urlencoded({ extended: true }));

app.get('/', (req, res) => {
    res.render('Home')
})

//get stores page
app.get('/Stores', (req, res) => {

    //finds all records from the store table
    mySQLDAO.getStores()
        .then((data) => {
            res.render('Stores', { 'data': data })
        })
        .catch((error) => { res.send(error) })
})

//get the edit page
app.get('/stores/edit/:sid', (req, res) => {

    //as there will never be an error at the start of the edit process
    //we must include the error variable because of the bug caused by error variable 
    //not being defined
    //error = null
    const error = null

    //gets one store from sid
    mySQLDAO.getStore(req.params.sid)
        .then((data) => {
            res.render('EditStore', { 'data': data, 'error': error })
        })
        .catch((error) => {
            res.send(error)
        })
})

//get the add store page
app.get('/stores/add', (req, res) => {
    errorString = null

    res.render('AddStore', {'error': errorString})
})

//get the product page
app.get('/products', (req, res) => {
    //get all product records from product table
    mySQLDAO.getProducts()
        .then((data) => {
            res.render('Products', { 'data': data })
        })
        .catch((error) => {
            res.send(error)
        })
})

//get method to get the delete page and delete functionality
app.get('/products/delete/:pid', (req, res) => {
    mySQLDAO.deleteProduct(req.params.pid)
        .then(() => {
            //the delete was successful => no foreign key dependancies
            //=> reload the page
            res.redirect('/products')
        })
        .catch(() => {
            //catch() is triggered if the product deleted was in the product_store table
            //because there is a foriegn key dependency, meaning it has a store
            //because if it is in product_store it must have an sid
            //=> render the cannot delete product page
            res.render('DeleteProduct', { 'pid': req.params.pid })
        })

})

//get method for the Managers page
app.get('/Managers', (req, res) => {
    //return all manager records
    mongoDAO.managersFindAll()
        .then((data) => {
            res.render('Managers', { 'data': data })
        })
        .catch((error) => { res.send(error) })
})

//get method for the add managers page
app.get('/Managers/Add', async (req, res) => {
    //need error string in every render of Managers as it needs to be defined
    var error = null//because there is no error here it is null

    //add manager page
    res.render('AddManager', { 'error': error })
})

//listen for a post method to make an edit store query
app.post('/stores/edit/:sid', async (req, res) => {

    //error catching variables defined here
    var error = null
    var matchedMgrid = true

    //put form info into a neat object to send to the mysqlDAO function
    formContent = {
        //sid is not required in the object as we already got it from the url
        location: req.body.location,
        mgrid: req.body.mgrid
    }

    //check if the mgrid exists in mongodb
    await mongoDAO.findManagerById(formContent.mgrid)
        .then((data) => {
            console.log(data)
            if (data.length == 0) {
                matchedMgrid = false
            }
        })
        .catch((error) => { res.send(error) })

    //if there is a valid query to our standerds do editStore
    if (formContent.location.length > 0 && formContent.mgrid.length == 4 && matchedMgrid == true) {
        console.log(matchedMgrid)
        //send everything required and let the DAO handle the query
        mySQLDAO.editStore(formContent, req.params.sid)
            .then(() => {
                res.redirect('/Stores')
            })
            .catch(() => {
                //when mgrid already exists sql will return to the catch block
                //so we will write and tell the user what happened here
                //make our custom error
                error = 'Manager: ' + formContent.mgrid + ' is already managing another store'

                //send error back to the ejs file
                mySQLDAO.getStore(req.params.sid)
                    .then((data) => {
                        res.render('EditStore', { 'data': data, 'error': error })
                    })
                    .catch((error) => {
                        res.send(error)
                    })
            })
    }
    //location must be at least 1 character
    else if (formContent.location.length == 0) {
        //make our custom error
        error = 'Location must be at least 1 character'

        //send error back to the ejs file
        mySQLDAO.getStore(req.params.sid)
            .then((data) => {
                res.render('EditStore', { 'data': data, 'error': error })
            })
            .catch((error) => {
                res.send(error)
            })
    }
    //mgrid must be 4 characters long
    else if (formContent.mgrid.length != 4) {
        //make our custom error
        error = 'mgrid must be 4 characters'

        //send error back to the ejs file
        mySQLDAO.getStore(req.params.sid)
            .then((data) => {
                res.render('EditStore', { 'data': data, 'error': error })
            })
            .catch((error) => {
                res.send(error)
            })
    }
    else if (matchedMgrid == false) {
        error = "Manager: " + formContent.mgrid + " doesn't exist in MongoDB"

        //send error back to the ejs file
        mySQLDAO.getStore(req.params.sid)
            .then((data) => {
                res.render('EditStore', { 'data': data, 'error': error })
            })
            .catch((error) => {
                res.send(error)
            })
    }
})

app.post('/stores/add', (req, res)=>{
    errorString = null

    //grab details from form
    formContent = {
        sid: req.body.sid,
        location: req.body.location,
        mgrid: req.body.mgrid
    }

    //if the query is valid with our conditions
    if (formContent.sid.length == 5 && formContent.location.length > 0 && formContent.mgrid.length == 4) {
        mySQLDAO.addStore(formContent)
            .then(()=>{
                //if the query is valid with mysql and our conditions 
                res.redirect('/Stores')
            })
            .catch((error)=>{
                //because mysql caught an error such at duplicate entries of primary or unique keys rerender with an error
                errorString = 'Note: Manager ID and Store ID cannot already be in use'

                res.render('AddStore', {'error': errorString})
            })
    }

    else if (formContent.sid.length != 5) {
        errorString = 'Store ID must be 5 characters long'

        res.render('AddStore', {'error': errorString})
    }

    else if (formContent.location.length == 0) {
        errorString = 'Location must be at least 1 characters long'

        res.render('AddStore', {'error': errorString})
    } 

    else if (formContent.mgrid.length != 4) {
        errorString = 'Manager ID must be 4 characters long'

        res.render('AddStore', {'error': errorString})
    }
})

//listen for a post method to make an add manager query
app.post('/managers/add', (req, res) => {
    var error = []
    var errorCount = -1

    //gather info from the forms req.body
    //parse method for salary to keep data consistent
    //https://www.geeksforgeeks.org/convert-a-string-to-an-integer-in-javascript/
    formContent = {
        _id: req.body._id,
        name: req.body.name,
        salary: parseInt(req.body.salary)
    }

    //check if the user input is valid by our standards
    if (formContent._id.length == 4 && formContent.name.length > 5 && formContent.salary > 30000 && formContent.salary < 70000) {
        mongoDAO.managersAddOne(formContent)
            .then(() => {
                res.redirect('/Managers')
            })
            .catch(() => {
                //when a manager id already exists the catch error is set off
                //so we use the catch to tell when the user has done this
                error[0] = 'Error: Manager ' + formContent._id + ' already exists in MongoDB'

                res.render('AddManager', { 'error': error })
            })
    }
    else {
        if (formContent._id.length != 4) {
            errorCount++
            error[errorCount] = 'Manager ID must be 4 characters'
        }

        if (formContent.name.length <= 5) {
            errorCount++
            error[errorCount] = 'Name must be more than 5 characters'
        }

        if (formContent.salary <= 30000 || formContent.salary >= 70000) {
            errorCount++
            error[errorCount] = 'Salary must be between 30,000 and 70,000'
        }

        res.render('AddManager', { 'error': error })
    }
})

//code for express
app.listen(3000, () => {
    console.log("Application Listening on port 3000")
})