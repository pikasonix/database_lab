const { Pool, Client } = require('pg');

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
        pool.connect((err, client, done) => {
            if (err) {
                console.error('Lỗi khi kết nối với cơ sở dữ liệu:', err);
                return;
            }

            client.query('SELECT * FROM customers', (err, result) => {
                done(); // Giải phóng client trở lại pool
                if (err) {
                    console.error('Lỗi khi truy vấn dữ liệu:', err);
                    return;
                }

                const danhsach = result.rows; // Gán danh sách từ kết quả truy vấn
                res.render('home', { danhsach: result.rows }); // Truyền danh sách vào giao diện
            });
        });
    }

    // [POST] /add
    customer(req, res, next) {
        // Trích xuất tên và tuổi từ phần thân của yêu cầu
        const name = req.body.name;
        const age = req.body.age;
        const gender = req.body.gender;
        const email = req.body.email;
        const address = req.body.address;
        const phone = req.body.phone;    
        
        // Chèn dữ liệu vào bảng 'customers'
        pool.query(
            'INSERT INTO customers (name, age, gender, email, address, phone) VALUES ($1, $2, $3, $4, $5, $6)',
            [name, age, gender, email, address, phone],
            (err, result) => {
                if (err) {
                    console.error('Lỗi khi chèn dữ liệu:', err);
                }
            },
        );
    
        // Kết nối với cơ sở dữ liệu và truy vấn dữ liệu từ bảng 'customers'
        pool.connect((err, client, done) => {
            if (err) {
                console.error('Lỗi khi kết nối với cơ sở dữ liệu:', err);
                return;
            }
    
            // Thực hiện truy vấn tất cả khách hàng
            client.query('SELECT * FROM customers', (err, resultAll) => {
                if (err) {
                    console.error('Lỗi khi truy vấn tất cả dữ liệu:', err);
                    done(); // Giải phóng kết nối trong trường hợp lỗi
                    return;
                }
    
                // Thực hiện truy vấn khách hàng có tuổi bằng 20
                client.query('SELECT * FROM customers WHERE age = 20', (err, resultAge20) => {
                    done(); // Giải phóng kết nối
    
                    if (err) {
                        console.error('Lỗi khi truy vấn dữ liệu tuổi = 20:', err);
                        return;
                    }
    
                    // Truyền cả hai kết quả vào giao diện
                    res.render('customer', {
                        allCustomers: resultAll.rows,
                        age20Customers: resultAge20.rows
                    });
                });
            });
        });
    }

    // [GET] /delete
    delete(req, res) {
        pool.query(
            'DELETE contact WHERE name = $1',
            [req.body.name],
            (err, result) => {
                res.render('add');
            },
        );
        pool.connect((err, client, done) => {
            if (err) {
                console.error('Lỗi khi kết nối với cơ sở dữ liệu:', err);
                return;
            }

            client.query('SELECT * FROM contact', (err, result) => {
                done(); // Giải phóng client trở lại pool
                if (err) {
                    console.error('Lỗi khi truy vấn dữ liệu:', err);
                    return;
                }

                const danhsach = result.rows; // Gán danh sách từ kết quả truy vấn
                res.render('delete', { danhsach: result.rows }); // Truyền danh sách vào giao diện
            });
        });
    }

    // [GET] /search
    search(req, res) {
        // Hiển thị giao diện 'search'
        res.render('search');
    }

    // [/] /order
    order(req, res, next) {
        pool.connect((err, client, done) => {
            if (err) {
                console.error('Lỗi khi kết nối với cơ sở dữ liệu:', err);
                return;
            }

            client.query('SELECT * FROM "Orders"', (err, result) => {
                done(); // Giải phóng client trở lại pool
                if (err) {
                    console.error('Lỗi khi truy vấn dữ liệu:', err);
                    return;
                }

                const danhsach = result.rows; // Gán danh sách từ kết quả truy vấn
                res.render('order', { danhsach: result.rows }); // Truyền danh sách vào giao diện
            });
        });
    }

    // [/] /product
    product(req, res) {
        // Hiển thị giao diện 'product'
        res.render('product');
    }

}
module.exports = new SiteController();
