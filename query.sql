CREATE TABLE customers (
	id SERIAL PRIMARY KEY,
	name VARCHAR(255) NOT NULL,
	age INTEGER CHECK (age >= 0), 
  	gender VARCHAR(10) CHECK (gender IN ('Male', 'Female', 'Other')),
	email VARCHAR(255) UNIQUE NOT NULL,
	address VARCHAR(255),
	phone VARCHAR(20),
	created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  	updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE suppliers (
	id VARCHAR(50) PRIMARY KEY,
	name VARCHAR(255) NOT NULL,
	address VARCHAR(255),
	description TEXT,
	created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  	updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE products (
	id SERIAL PRIMARY KEY,
	name VARCHAR(255) NOT NULL,
	catalog VARCHAR(255),
	supplier_id VARCHAR(50) REFERENCES suppliers(id),
	mgf TIMESTAMP,
	price INTEGER NOT NULL,
	discount INTEGER DEFAULT 0,
	quantity INTEGER NOT NULL,
	description TEXT,
	image VARCHAR(255),
	created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
	updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
	
);

CREATE TABLE orders (
  id SERIAL PRIMARY KEY,
  customer_id INTEGER REFERENCES customers(id),
  product_id INTEGER REFERENCES products(id),
  quantity INTEGER NOT NULL,
  amount INTEGER NOT NULL,
  status_payment SMALLINT CHECK (status_payment IN (0, 1, 2)), -- 0: chưa thanh toán 1: đã thanh toán 2: huỷ thanh toán
  status_shipment SMALLINT CHECK (status_shipment IN (0, 1, 2, 3)), -- 
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);



CREATE OR REPLACE FUNCTION update_data_products( 
    p_name VARCHAR(255), 
    p_catalog VARCHAR(255), 
    p_mgf TIMESTAMP, 
    p_supplier_name VARCHAR(255), 
    p_id_supplier VARCHAR,  
    p_price INT,  
    p_discount INT,  
    p_quantity INT, 
    p_description TEXT, 
    p_image VARCHAR(255) 
) 
RETURNS VARCHAR(50) 
AS $$ 
DECLARE 
    v_supplier_id VARCHAR; -- Khai báo biến v_supplier_id 
BEGIN 
    -- Kiểm tra xem nhà cung cấp có trong bảng suppliers chưa 
    SELECT id INTO v_supplier_id 
    FROM suppliers 
    WHERE name = p_supplier_name; 
    IF v_supplier_id IS NOT NULL THEN 
        -- Nếu nhà cung cấp đã tồn tại, chỉ insert vào bảng products 
        INSERT INTO products (name, catalog, mgf, price, discount, quantity, description, image, supplier_id) 
        VALUES (p_name, p_catalog, p_mgf, p_price, p_discount, p_quantity, p_description, p_image, v_supplier_id); 
    ELSE 
        -- Nếu nhà cung cấp chưa tồn tại, insert vào bảng suppliers trước, sau đó insert vào bảng products 
        INSERT INTO suppliers (id, name) 
        VALUES (p_id_supplier, p_supplier_name); 
        INSERT INTO products (name, catalog, mgf, price, discount, quantity, description, image, supplier_id) 
        VALUES (p_name, p_catalog, p_mgf, p_price, p_discount, p_quantity, p_description, p_image, p_id_supplier); 
    END IF; 
    RETURN 'Success'; 
END; 
$$ LANGUAGE plpgsql; 

 






 CREATE FUNCTION get_top_customers(
    start_date DATE,
    end_date DATE,
    top_n INT DEFAULT 10
)
RETURNS TABLE (
    rank_by_spend BIGINT,
    customer_id INT,
    customer_name VARCHAR,
    customer_email VARCHAR(255),
    customer_phone VARCHAR(255),
    total_spend MONEY
)
AS $$
BEGIN
    RETURN QUERY
    WITH customer_spend AS (
        SELECT
            o.customer_id,
            SUM(o.amount) AS total_spend
        FROM orders o
        WHERE o.created_at BETWEEN start_date AND end_date
        GROUP BY o.customer_id
    ),
    ranked_customers AS (
        SELECT
            cs.customer_id,
            cs.total_spend,
            RANK() OVER (ORDER BY cs.total_spend DESC) AS rank_by_spend
        FROM customer_spend cs
    )
    SELECT
        rc.rank_by_spend,
        rc.customer_id,
        c.name AS customer_name,
        c.email AS customer_email,
        c.phone AS customer_phone,
        rc.total_spend
    FROM ranked_customers rc
    INNER JOIN customers c ON c.id = rc.customer_id
    WHERE rc.rank_by_spend <= top_n
    ORDER BY rc.rank_by_spend ASC;
END;
$$ LANGUAGE plpgsql;

SELECT * FROM get_top_customers('2024-05-01', '2024-06-09', 5);

INSERT INTO customers (name, age, gender, email, phone)
VALUES
('Trần Thị Bình', 35, 'Nữ', 'tranthibinh@gmail.com', '0987654321'),
('Lê Hoàng Dương', 22, 'Nam', 'lhoangduong@gmail.com', '0555123456'),
('Phạm Thu Hà', 27, 'Nữ', 'phamthuha@gmail.com', '0321876543'),
('Ngô Minh Khoa', 30, 'Nam', 'ngominhkhoa@gmail.com', '0789456123');

CREATE OR REPLACE FUNCTION update_order_amount()
RETURNS TRIGGER AS $$
DECLARE
    product_price NUMERIC;
    product_discount NUMERIC;
BEGIN
    -- Lấy thông tin sản phẩm từ bảng products
    SELECT p.price, p.discount 
    INTO product_price, product_discount
    FROM products p
    WHERE p.id = NEW.product_id;

    -- Tính toán và cập nhật giá trị amount
    NEW.amount := NEW.quantity * product_price * (1 - product_discount / 100.0);
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_order_amount
BEFORE INSERT OR UPDATE ON orders
FOR EACH ROW
EXECUTE PROCEDURE update_order_amount();

CREATE OR REPLACE FUNCTION update_product_quantity()
RETURNS TRIGGER AS $$
DECLARE
    product_id INT;
    order_quantity INT;
BEGIN
    -- Lấy product_id và quantity từ bảng orders
    product_id := NEW.product_id;
    order_quantity := NEW.quantity;
    -- Cập nhật số lượng sản phẩm còn lại trong bảng products
    UPDATE products
    SET quantity = quantity - order_quantity
    WHERE id = product_id;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;
CREATE TRIGGER update_product_quantity
AFTER INSERT OR UPDATE ON orders
FOR EACH ROW
WHEN (NEW.status_payment = 1)
EXECUTE PROCEDURE update_product_quantity();


CREATE VIEW pending_orders AS
SELECT 
	o.id AS order_id,
	c.name AS customer_name,
	p.name AS product_name,
	o.quantity,
	o.amount
FROM orders o
INNER JOIN customers c ON o.customer_id = c.id
INNER JOIN products p ON o.product_id = p.id
WHERE status_payment=1;
--Tính được doanh thu của cửa hàng thông qua view đó
CREATE FUNCTION get_revenue_supplier_by_view(name VARCHAR(255))
RETURNS TABLE(supplier_name VARCHAR(255),total_revenue MONEY)
AS $$
BEGIN
	RETURN QUERY
	SELECT 
		po.supplier_name AS supplier_name,
		SUM(po.amount) AS total_revenue
	FROM pending_orders po
	WHERE name = po.supplier_name
	GROUP BY po.supplier_name;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION insert_order(
    o_phone VARCHAR(255),
    o_address VARCHAR(255),
    o_quantity INTEGER,
    o_product_id INTEGER,
    o_status_payment SMALLINT
)
RETURNS VARCHAR(20)
AS $$
DECLARE
    o_customer_id INTEGER;
    o_order_id INTEGER;
BEGIN
    -- Check if the customer exists
    SELECT c.id INTO o_customer_id
    FROM customers c
    WHERE c.phone = o_phone;
    IF o_customer_id IS NOT NULL THEN
        INSERT INTO orders (customer_id, product_id, address, quantity, status_payment,status_shipment)
        VALUES (o_customer_id, o_product_id, o_address, o_quantity, o_status_payment,0);
        RETURN 'Success';
    ELSE
        RETURN 'Fail';
    END IF;
END;
$$ LANGUAGE plpgsql;




SELECT update_data_products( 
    'Product A', 
    'Category X', 
    '2023-06-01', 
    'Supplier X', 
    '123', 
    100, 
    10, 
    100, 
    'This is a great product', 
    'product_a.jpg' 