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
    index(req, res) {
        pool.query('SELECT * FROM customers', (err, customers) => {
            pool.query('SELECT * FROM products', (err, products) => {
                pool.query('SELECT * FROM suppliers', (err, suppliers) => {
                    res.render('home', { customers: customers.rows, products: products.rows, suppliers: suppliers.rows });
                });
            });
        });
    }
// =================== Phần xử lý customers ====================
    // [GET] /customer
    customer(req, res) {
        pool.query('SELECT * FROM customers ORDER BY id DESC', (err, result) => {
            if (err) {
                console.error('Lỗi khi truy vấn dữ liệu:', err);
                return res.status(500).send('Lỗi cơ sở dữ liệu');
            }
            res.render('customer', { allCustomers: result.rows });
        });
    }
    // [POST] /add
    addcustomer(req, res) {
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
    // [POST] /search customer
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
// =================== Phần xử lý products ====================
    // [GET] product
    product(req, res) {
        pool.query('SELECT * FROM products ORDER BY id DESC', (err, result) => {
            if (err) {
                console.error('Lỗi khi truy vấn dữ liệu:', err);
                return res.status(500).send('Lỗi cơ sở dữ liệu');
            }
            res.render('product', { allProduct: result.rows });
        });
    }
    // [GET] json catalog
    getcatalog(req, res, next) {
        pool.query('SELECT DISTINCT catalog FROM products', (err, result) => {
            if (err) {
                console.error('Lỗi khi truy vấn dữ liệu:', err);
                return res.status(500).send('Lỗi cơ sở dữ liệu');
            }
            res.json(result.rows);
        });
    }
    // [GET] json supplier
    getsupplier(req, res, next) {
        pool.query('SELECT name FROM suppliers', (err, result) => {
            if (err) {
                console.error('Lỗi khi truy vấn dữ liệu:', err);
                return res.status(500).send('Lỗi cơ sở dữ liệu');
            }
            res.json(result.rows);
        });
    }
    // Add product
    addproduct(req, res, next) {
        const { name, catalog, supplier, mgf, price, discount, quantity, description, image } = req.body;
        pool.query(
            'INSERT INTO products (name, catalog, supplier_id, mgf, price, discount, quantity, description, image) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)',
            [name, catalog, supplier, mgf, price, discount, quantity, description, image],
            (err) => {
                if (err) {
                    console.error('Lỗi khi chèn dữ liệu:', err);
                    return res.status(500).send('Lỗi cơ sở dữ liệu');
                }
                res.redirect('/product'); // Điều hướng đến trang /product sau khi thêm sản phẩm
            }
        );
    }
    // Search product
    searchproduct(req, res, next) {
        const search_id = req.body.search_id || null;
        const search_name = req.body.search_name || null;
        const search_catalog = req.body.search_catalog || null;
        const search_supplier = req.body.search_supplier || null;
        const search_mgf = req.body.search_mgf || null;
        const search_price = req.body.search_price || null;
        const search_discount = req.body.search_discount || null;
        const search_quantity = req.body.search_quantity || null;
        const search_created_at = req.body.search_created_at || null;
        const search_updated_at = req.body.search_updated_at || null;
    
        const query = `
            SELECT * FROM products 
            WHERE (COALESCE($1, id) = id)
            AND (COALESCE($2, name) = name) 
            AND (COALESCE($3, catalog) = catalog) 
            AND (COALESCE($4, supplier_id) = supplier_id) 
            AND (COALESCE(DATE($5), DATE(mgf)) = DATE(mgf))
            AND (COALESCE($6, price) = price) 
            AND (COALESCE($7, discount) = discount) 
            AND (COALESCE($8, quantity) = quantity)
            AND (COALESCE(DATE($9), DATE(created_at)) = DATE(created_at))
            AND (COALESCE(DATE($10), DATE(updated_at)) = DATE(updated_at))
        `;
        const values = [search_id, search_name, search_catalog, search_supplier, search_mgf, search_price, search_discount, search_quantity, search_created_at, search_updated_at];
    
        pool.query(query, values, (err, result) => {
            if (err) {
                console.error('Lỗi khi truy vấn dữ liệu:', err);
                return res.status(500).send(`Lỗi cơ sở dữ liệu: ${err.message}`);
            }
            res.render('product', { resultSearch: result.rows });
        });
    }
    // Edit product
    editproduct(req, res) {
        pool.query('SELECT * FROM products WHERE id = $1', [req.params.id], (err, result) => {
            if (err) {
                console.error('Lỗi khi truy vấn dữ liệu:', err);
                return res.status(500).send('Lỗi cơ sở dữ liệu');
            }
            res.render('editproduct', { productinfo: result.rows });
        });
    }
    updateproduct(req, res) {
        const { name, catalog, supplier, mgf, price, discount, quantity, description, image } = req.body;
        pool.query('UPDATE products SET name = $1, catalog = $2, supplier_id = $3, mgf = $4, price = $5, discount = $6, quantity = $7, description = $8, image = $9  WHERE id = $10', [name, catalog, supplier, mgf, price, discount, quantity, description, image, req.params.id], (err, result) => {
            if (err) {
                console.error('Lỗi khi update dữ liệu:', err);
                return res.status(500).send('Lỗi cơ sở dữ liệu');
            }
            res.render('product');
        });
    }
    // Delete product 
    deleteproduct(req, res) {
        pool.query('SELECT * FROM products WHERE id = $1', [req.params.id], (err, result) => {
            if (err) {
                console.error('Lỗi khi truy vấn dữ liệu:', err);
                return res.status(500).send('Lỗi cơ sở dữ liệu');
            }
            res.render('deleteproduct', { productinfo: result.rows });
        });
    }
    removeproduct(req, res) {
        pool.query('DELETE FROM products WHERE id = $1', [req.params.id], (err, result) => {
            if (err) {
                console.error('Lỗi khi delete dữ liệu:', err);
                return res.status(500).send('Lỗi cơ sở dữ liệu');
            }
            res.render('product');
        });
    }

// =================== Phần xử lý suppliers ====================
    // [GET] supplier
    supplier(req, res) {
        pool.query('SELECT * FROM suppliers ORDER BY id DESC', (err, result) => {
            if (err) {
                console.error('Lỗi khi truy vấn dữ liệu:', err);
                return res.status(500).send('Lỗi cơ sở dữ liệu');
            }
            res.render('supplier', { allSupplier: result.rows });
        });
    }
    addsupplier(req, res, next) {
        const { name, address, description } = req.body;
        pool.query(
            'INSERT INTO suppliers (name, address, description) VALUES ($1, $2, $3)',
            [name, address, description],
            (err) => {
                if (err) {
                    console.error('Lỗi khi chèn dữ liệu:', err);
                    return res.status(500).send('Lỗi cơ sở dữ liệu');
                }
                res.redirect('/supplier'); // Điều hướng đến trang /supplier sau khi thêm sản phẩm
            }
        );
    }
    // Search supplier
    searchsupplier(req, res, next) {
        const search_id = req.body.search_id || null;
        const search_name = req.body.search_name || null;
        const search_address = req.body.search_address || null;
        const search_created_at = req.body.search_created_at || null;
        const search_updated_at = req.body.search_updated_at || null;
        
        console.log('Search parameters:', {
            search_id,
            search_name,
            search_address,
            search_created_at,
            search_updated_at
        });

        const query = `
            SELECT * FROM suppliers 
            WHERE (COALESCE($1, id) = id)
            AND (COALESCE($2, name) = name) 
            AND (COALESCE($3, address) = address) 
            AND (COALESCE(DATE($4), DATE(created_at)) = DATE(created_at))
            AND (COALESCE(DATE($5), DATE(updated_at)) = DATE(updated_at))
        `;
        const values = [search_id, search_name, search_address, search_created_at, search_updated_at];
    
        pool.query(query, values, (err, result) => {
            if (err) {
                console.error('Lỗi khi truy vấn dữ liệu:', err);
                return res.status(500).send(`Lỗi cơ sở dữ liệu: ${err.message}`);
            }
            res.render('supplier', { resultSearch: result.rows });
        });
    }
    // Edit supplier
    editsupplier(req, res) {
        pool.query('SELECT * FROM suppliers WHERE id = $1', [req.params.id], (err, result) => {
            if (err) {
                console.error('Lỗi khi truy vấn dữ liệu:', err);
                return res.status(500).send('Lỗi cơ sở dữ liệu');
            }
            res.render('editsupplier', { supplierinfo: result.rows });
        });
    }
    updatesupplier(req, res) {
        const { name, address, description } = req.body;
        pool.query('UPDATE suppliers SET name = $1, address = $2, description = $3  WHERE id = $4', [name, address, description, req.params.id], (err, result) => {
            if (err) {
                console.error('Lỗi khi update dữ liệu:', err);
                return res.status(500).send('Lỗi cơ sở dữ liệu');
            }
            res.render('supplier');
        });
    }
    // Delete supplier 
    deletesupplier(req, res) {
        pool.query('SELECT * FROM suppliers WHERE id = $1', [req.params.id], (err, result) => {
            if (err) {
                console.error('Lỗi khi truy vấn dữ liệu:', err);
                return res.status(500).send('Lỗi cơ sở dữ liệu');
            }
            pool.query('SELECT * FROM products WHERE supplier_id = $1', [req.params.id], (err, resultSearch) => {
                if (err) {
                    console.error('Lỗi SELECT * FROM products WHERE supplier_id = $1', err);
                    return res.status(500).send('Lỗi cơ sở dữ liệu 2');
                }
                res.render('deletesupplier', { supplierinfo: result.rows, resultSearch: resultSearch.rows });
            });
        });
    }

    removesupplier(req, res) {
        pool.query('DELETE FROM suppliers WHERE id = $1', [req.params.id], (err, result) => {
            if (err) {
                console.error(req.params.id, err);
                return res.status(500).send('Lỗi cơ sở dữ liệu');
            }
            res.render('supplier');
        });
    }

// =================== Phần xử lý orders ====================
 // [GET] order
 order(req, res) {
    pool.query('SELECT * FROM orders ORDER BY id DESC', (err, result) => {
        if (err) {
            console.error('Lỗi khi truy vấn dữ liệu:', err);
            return res.status(500).send('Lỗi cơ sở dữ liệu');
        }
        res.render('order', { allOrder: result.rows });
    });
}
// Add order
addorder(req, res, next) {
    const { id, customer_id, product_id, quantity, amount, status_payment, status_shipment } = req.body;
    pool.query(
        'INSERT INTO orders (customer_id, product_id, quantity, amount, status_payment, status_shipment) VALUES ($1, $2, $3, $4, $5, $6)',
        [customer_id, product_id, quantity, amount, status_payment, status_shipment],
        (err) => {
            if (err) {
                console.error('Lỗi khi chèn dữ liệu:', err);
                return res.status(500).send('Lỗi cơ sở dữ liệu');
            }
            res.redirect('/order'); // Điều hướng đến trang /order sau khi thêm sản phẩm
        }
    );
}
// Search product
searchorder(req, res, next) {
    const search_id = req.body.search_id || null;
    const search_customer_id = req.body.search_customer_id || null;
    const search_product_id = req.body.search_product_id || null;
    const search_quantity = req.body.search_quantity || null;
    const search_amount = req.body.search_amount || null;
    const search_status_payment = req.body.search_status_payment || null;
    const search_status_shipment = req.body.search_status_shipment || null;
    const search_created_at = req.body.search_created_at || null;
    const search_updated_at = req.body.search_updated_at || null;

    const query = `
        SELECT * FROM orders 
        WHERE (COALESCE($1, id) = id)
        AND (COALESCE($2, customer_id) = customer_id) 
        AND (COALESCE($3, product_id) = product_id) 
        AND (COALESCE($4, quantity) = quantity) 
        AND (COALESCE($5, amount) = amount) 
        AND (COALESCE($6, status_payment) = status_payment) 
        AND (COALESCE($7, status_shipment) = status_shipment)
        AND (COALESCE(DATE($8), DATE(created_at)) = DATE(created_at))
        AND (COALESCE(DATE($9), DATE(updated_at)) = DATE(updated_at))
    `;
    const values = [search_id, search_customer_id, search_product_id, search_quantity, search_amount, search_status_payment, search_status_shipment, search_created_at, search_updated_at];

    pool.query(query, values, (err, result) => {
        if (err) {
            console.error('Lỗi khi truy vấn dữ liệu:', err);
            return res.status(500).send(`Lỗi cơ sở dữ liệu: ${err.message}`);
        }
        res.render('order', { resultSearch: result.rows });
    });
}
// Edit order
editorder(req, res) {
    pool.query('SELECT * FROM orders WHERE id = $1', [req.params.id], (err, result) => {
        if (err) {
            console.error('Lỗi khi truy vấn dữ liệu:', err);
            return res.status(500).send('Lỗi cơ sở dữ liệu');
        }
        res.render('editorder', { orderinfo: result.rows });
    });
}
updateorder(req, res) {
    const { customer_id, product_id, quantity, amount, status_payment, status_shipment } = req.body;
    pool.query('UPDATE orders SET customer_id = $1, product_id = $2, quantity = $3, amount = $4, status_payment = $5, status_shipment = $6 WHERE id = $7', [customer_id, product_id, quantity, amount, status_payment, status_shipment, req.params.id], (err, result) => {
        if (err) {
            console.error('Lỗi khi update dữ liệu:', err);
            return res.status(500).send('Lỗi cơ sở dữ liệu');
        }
        res.render('order');
    });
}
canceleorder(req, res) {
    const { customer_id, product_id, quantity, amount, status_payment, status_shipment } = req.body;
    pool.query('UPDATE orders SET customer_id = $1, product_id = $2, quantity = $3, amount = $4, status_payment = $5, status_shipment = $6 WHERE id = $7', [customer_id, product_id, quantity, amount, status_payment, status_shipment, req.params.id], (err, result) => {
        if (err) {
            console.error('Lỗi khi update dữ liệu:', err);
            return res.status(500).send('Lỗi cơ sở dữ liệu');
        }
        res.render('order');
    });
}


    // [GET] /delete
    test(req, res) {
        pool.query('SELECT * FROM products ORDER BY id DESC', (err, result) => {
            if (err) {
                console.error('Lỗi khi truy vấn dữ liệu:', err);
                return res.status(500).send('Lỗi cơ sở dữ liệu');
            }
            res.render('test', { allProduct: result.rows });
        });
    }

    // [GET] /search
    search(req, res) {
        res.render('search');
    }


}

module.exports = new SiteController();