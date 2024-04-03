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

            client.query('SELECT * FROM contact', (err, result) => {
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
    add(req, res, next) {
        // Trích xuất tên và tuổi từ phần thân của yêu cầu
        const name = req.body.name;
        const age = req.body.age;

        // Chèn dữ liệu vào bảng 'contact'
        pool.query(
            'INSERT INTO contact (name, age) VALUES ($1, $2)',
            [name, age],
            (err, result) => {
                if (err) {
                    console.error('Lỗi khi chèn dữ liệu:', err);
                }
            },
        );

        // Kết nối với cơ sở dữ liệu và truy vấn dữ liệu từ bảng 'contact'
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
                res.render('add', { danhsach: result.rows }); // Truyền danh sách vào giao diện
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
