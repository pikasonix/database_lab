const { Pool } = require('pg');

// Tạo một connection pool
const pool = new Pool({
    user: 'postgres',
    host: 'localhost',
    database: 'database_dev',
    password: 'admin',
    port: 5432,
});

class SiteController {
    // [GET] /home
    index(req, res, next) {
        pool.query('SELECT * FROM customers', (err, result) => {
            if (err) {
                console.error('Lỗi khi truy vấn dữ liệu:', err);
                return res.status(500).send('Lỗi cơ sở dữ liệu');
            }
            res.render('home', { danhsach: result.rows });
        });
    }

    // [GET] /customer
    customer(req, res, next) {
        pool.query('SELECT * FROM customers ORDER BY id DESC', (err, result) => {
            if (err) {
                console.error('Lỗi khi truy vấn dữ liệu:', err);
                return res.status(500).send('Lỗi cơ sở dữ liệu');
            }
            res.render('customer', { allCustomers: result.rows });
        });
    }

    // [POST] /add
    addcustomer(req, res, next) {
        const { name, age, gender, email, address, phone } = req.body;

        pool.query(
            'INSERT INTO customers (name, age, gender, email, address, phone) VALUES ($1, $2, $3, $4, $5, $6)',
            [name, age, gender, email, address, phone],
            (err) => {
                if (err) {
                    console.error('Lỗi khi chèn dữ liệu:', err);
                    return res.status(500).send('Lỗi cơ sở dữ liệu');
                }
                res.redirect('/customer'); // Điều hướng đến trang /customer sau khi thêm khách hàng
            }
        );
    }

    // [POST] /searchcustomer
    searchcustomer(req, res, next) {
        const search_name = req.body.search_name || null;
        const search_age = req.body.search_age !== '' ? parseInt(req.body.search_age) : null;
        const search_gender = req.body.search_gender !== 'Choose Gender' ? req.body.search_gender : null;
        const search_email = req.body.search_email || null;
        const search_address = req.body.search_address || null;
        const search_phone = req.body.search_phone || null;
    
        console.log('Search parameters:', {
            search_name,
            search_age,
            search_gender,
            search_email,
            search_address,
            search_phone,
        });
    
        const query = `
            SELECT * FROM customers 
            WHERE (COALESCE($1, name) = name) 
            AND (COALESCE($2::INTEGER, age) = age) 
            AND (COALESCE($3, gender) = gender) 
            AND (COALESCE($4, email) = email) 
            AND (COALESCE($5, address) = address) 
            AND (COALESCE($6, phone) = phone)
        `;
        const values = [search_name, search_age, search_gender, search_email, search_address, search_phone];
    
        pool.query(query, values, (err, result) => {
            if (err) {
                console.error('Lỗi khi truy vấn dữ liệu:', err);
                return res.status(500).send(`Lỗi cơ sở dữ liệu: ${err.message}`);
            }
            res.render('customer', { resultSearch: result.rows });
        });
    }
    // Edit customer
    editcustomer(req, res) {
        pool.query('SELECT * FROM customers WHERE id = $1', [req.params.id], (err, result) => {
            if (err) {
                console.error('Lỗi khi truy vấn dữ liệu:', err);
                return res.status(500).send('Lỗi cơ sở dữ liệu');
            }
            res.render('editcustomer', { customerinfo: result.rows });
        });
    }
    updatecustomer(req, res) {
        const { update_name, update_age, update_gender, update_email, update_address, update_phone } = req.body;
        pool.query('UPDATE customers SET name = $1, age = $2, gender = $3, email = $4, address = $5, phone = $6 WHERE id = $7', [update_name, update_age, update_gender, update_email, update_address, update_phone, req.params.id], (err, result) => {
            if (err) {
                console.error('Lỗi khi update dữ liệu:', err);
                return res.status(500).send('Lỗi cơ sở dữ liệu');
            }
            res.render('customer');
        });
    }
    // Delete customer
    deletecustomer(req, res) {
        pool.query('SELECT * FROM customers WHERE id = $1', [req.params.id], (err, result) => {
            if (err) {
                console.error('Lỗi khi truy vấn dữ liệu:', err);
                return res.status(500).send('Lỗi cơ sở dữ liệu');
            }
            res.render('deletecustomer', { customerinfo: result.rows });
        });
    }
    removecustomer(req, res) {
        pool.query('DELETE FROM customers WHERE id = $1', [req.params.id], (err, result) => {
            if (err) {
                console.error('Lỗi khi delete dữ liệu:', err);
                return res.status(500).send('Lỗi cơ sở dữ liệu');
            }
            res.render('customer');
        });
    }
    // [GET] /delete
    delete(req, res) {
        const name = req.body.name;

        pool.query('DELETE FROM customers WHERE name = $1', [name], (err) => {
            if (err) {
                console.error('Lỗi khi xóa dữ liệu:', err);
                return res.status(500).send('Lỗi cơ sở dữ liệu');
            }
            res.redirect('/customer'); // Điều hướng đến trang /customer sau khi xóa
        });
    }

    // [GET] /search
    search(req, res) {
        res.render('search');
    }

    // [GET] /order
    order(req, res, next) {
        pool.query('SELECT * FROM "Orders"', (err, result) => {
            if (err) {
                console.error('Lỗi khi truy vấn dữ liệu:', err);
                return res.status(500).send('Lỗi cơ sở dữ liệu');
            }
            res.render('order', { danhsach: result.rows });
        });
    }

    // [GET] /product
    product(req, res) {
        res.render('product');
    }
}

module.exports = new SiteController();