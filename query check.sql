-- 1
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

INSERT INTO orders (customer_id, product_id,quantity, status_payment, status_shipment)
VALUES
(3, 4, 1, 1, 2);

--2
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

--- 3 
CREATE OR REPLACE FUNCTION get_best_selling_products()
RETURNS TABLE (
    product_id INT,
    product_name VARCHAR(255),
    product_catalog VARCHAR(255),
    product_description TEXT,
    product_price MONEY,
    product_discount INT,
    product_amount MONEY,
    total_quantity_sold BIGINT,
    product_image VARCHAR(255)
)
AS $$
BEGIN
    RETURN QUERY
    WITH top_selling_products AS (
        SELECT
            o.product_id,
            SUM(o.quantity) AS total_quantity_sold,
            RANK() OVER (ORDER BY SUM(o.quantity) DESC) AS product_rank
        FROM
            orders o
        WHERE
            o.status_payment = 1
        GROUP BY
            o.product_id
    )
    SELECT
        p.id AS product_id,
        p.name AS product_name,
        p.catalog AS product_catalog,
        p.description AS product_description,
        p.price AS product_price,
        p.discount AS product_discount,
        SUM(o.amount) AS product_amount,
        tsp.total_quantity_sold AS total_quantity_sold,
        p.image AS product_image
    FROM
        products p
        JOIN top_selling_products tsp ON p.id = tsp.product_id
		INNER JOIN orders o ON o.product_id = p.id
	GROUP BY o.product_id,p.id,tsp.total_quantity_sold
	ORDER BY tsp.total_quantity_sold DESC;
END;
$$ LANGUAGE plpgsql;

SELECT * FROM get_best_selling_products();
-- 4 OK
CREATE FUNCTION get_total_base_price_by_supplier(supplier_name VARCHAR(255))
RETURNS TABLE(name VARCHAR(255), total_base_price MONEY)
AS $$
BEGIN
    RETURN QUERY
    SELECT s.name, SUM(p.base_price * o.quantity) AS total_base_price
    FROM orders o
    INNER JOIN products p ON o.product_id = p.id
    INNER JOIN suppliers s ON p.supplier_id = s.id
    WHERE s.name = get_total_base_price_by_supplier.supplier_name
          AND o.status_payment = 1
    GROUP BY s.name;
END;
$$ LANGUAGE plpgsql;

SELECT * FROM get_total_base_price_by_supplier('Công ty ABC');

-- 5 
CREATE OR REPLACE FUNCTION get_revenue_supplier(name_supplier VARCHAR(255))
RETURNS TABLE(supplier_name VARCHAR(255),total_revenue MONEY)
AS $$
BEGIN
	RETURN QUERY
	SELECT 
		s.name AS supplier_name,
		SUM(o.amount) AS total_revenue
	FROM products p
	INNER JOIN orders o ON o.product_id = p.id
	INNER JOIN suppliers s ON s.id = p.supplier_id
	WHERE name_supplier = s.name
	GROUP BY s.name;
END;
$$ LANGUAGE plpgsql;

SELECT * FROM get_revenue_supplier ('Công ty ABC');

-- 6
OK

-- 7 tạo thêm -- bỏ
CREATE OR REPLACE FUNCTION has_unpaid_orders(customer_phone VARCHAR(255))
RETURNS TABLE (product_id INT,product_name VARCHAR(255),quantity INT,amount MONEY,created_at TIMESTAMP)
AS $$
BEGIN
	RETURN QUERY
  	SELECT o.product_id,p.name,o.quantity,o.amount AS price,o.created_at
  	FROM orders AS o
  	INNER JOIN products AS p ON p.id=o.product_id 
	INNER JOIN customers AS c ON c.id=o.customer_id
  	WHERE o.status_payment = 0 AND has_unpaid_orders.customer_phone = c.phone;
END;
$$ LANGUAGE plpgsql;

SELECT * FROM has_unpaid_orders ('0987654321');

-- 8 OK
-- 9 Tạo thêm 
CREATE OR REPLACE FUNCTION get_product_profit(product_name VARCHAR(255))
RETURNS MONEY
AS $$
  DECLARE total_revenue MONEY;
  DECLARE total_cost MONEY;
  DECLARE profit MONEY;
BEGIN
  SELECT SUM(o.quantity * p.base_price) INTO total_cost
  FROM orders o
  INNER JOIN products p ON o.product_id = p.id
  WHERE p.name = product_name AND o.status_payment = 1;
  
  SELECT SUM(o.amount) INTO total_revenue
  FROM orders o
  INNER JOIN products p ON o.product_id = p.id
  WHERE p.name = product_name;
  profit := total_revenue - total_cost;
  RETURN profit;
END;
$$ LANGUAGE plpgsql;
--Test data:
INSERT INTO products (name, catalog, supplier_id, mgf, price, base_price, discount, quantity, description, image)
VALUES
('Tai nghe bluetooth', 'Phụ kiện', 2, '2023-03-01', 4000000, 2000000, 45, 10, 'Phụ kiện tai nghe cho điện thoại', 'https://cdn2.cellphones.com.vn/insecure/rs:fill:358:358/q:90/plain/https://cellphones.com.vn/media/catalog/product/s/a/samsung-galaxy-buds-2-pro-00.png');
INSERT INTO orders (customer_id,product_id,address,quantity,status_payment)
VALUES
(4,8, '17 Tạ Quang Bửu',2,1);

SELECT get_product_profit('Tai nghe bluetooth');


-- 10 OK
CREATE OR REPLACE FUNCTION update_data_products(
    p_name VARCHAR(255),
    p_catalog VARCHAR(255),
    p_mgf TIMESTAMP,
    p_supplier_name VARCHAR(255),
    p_price MONEY, 
    p_base_price MONEY,
    p_discount INT, 
    p_quantity INT,
    p_description TEXT,
    p_image VARCHAR(255)
)
RETURNS VARCHAR(50)
AS $$
DECLARE
    v_supplier_id INT; -- Khai báo biến v_supplier_id
BEGIN
    -- Kiểm tra xem nhà cung cấp có trong bảng suppliers chưa
    SELECT id INTO v_supplier_id
    FROM suppliers
    WHERE name = p_supplier_name;
    IF v_supplier_id IS NOT NULL THEN
        -- Nếu nhà cung cấp đã tồn tại, chỉ insert vào bảng products
        INSERT INTO products (name, catalog, mgf, price, base_price, discount, quantity, description, image, supplier_id)
        VALUES (p_name, p_catalog, p_mgf, p_price, p_base_price, p_discount, p_quantity, p_description, p_image, v_supplier_id);
    ELSE
        -- Nếu nhà cung cấp chưa tồn tại, insert vào bảng suppliers trước, sau đó insert vào bảng products
        INSERT INTO suppliers ( name)
        VALUES ( p_supplier_name);
		SELECT id INTO v_supplier_id
    	FROM suppliers
   		WHERE name = p_supplier_name;
        INSERT INTO products (name, catalog, mgf, price, base_price, discount, quantity, description, image, supplier_id)
        VALUES (p_name, p_catalog, p_mgf, p_price, p_base_price, p_discount, p_quantity, p_description, p_image, v_supplier_id);
    END IF;

    RETURN 'Success';
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION update_data_products(
    p_name VARCHAR(255),
    p_catalog VARCHAR(255),
    p_mgf TIMESTAMP,
    p_supplier_name VARCHAR(255),
    p_price MONEY, 
    p_base_price MONEY,
    p_discount INT, 
    p_quantity INT,
    p_description TEXT,
    p_image VARCHAR(255)
)
RETURNS VARCHAR(50)
AS $$
DECLARE
    v_supplier_id INT; -- Khai báo biến v_supplier_id
BEGIN
    -- Kiểm tra xem nhà cung cấp có trong bảng suppliers chưa
    SELECT id INTO v_supplier_id
    FROM suppliers
    WHERE name = p_supplier_name;
    IF v_supplier_id IS NOT NULL THEN
        -- Nếu nhà cung cấp đã tồn tại, chỉ insert vào bảng products
        INSERT INTO products (name, catalog, mgf, price, base_price, discount, quantity, description, image, supplier_id)
        VALUES (p_name, p_catalog, p_mgf, p_price, p_base_price, p_discount, p_quantity, p_description, p_image, v_supplier_id);
    ELSE
        -- Nếu nhà cung cấp chưa tồn tại, insert vào bảng suppliers trước, sau đó insert vào bảng products
        INSERT INTO suppliers ( name)
        VALUES ( p_supplier_name);
		SELECT id INTO v_supplier_id
    	FROM suppliers
   		WHERE name = p_supplier_name;
        INSERT INTO products (name, catalog, mgf, price, base_price, discount, quantity, description, image, supplier_id)
        VALUES (p_name, p_catalog, p_mgf, p_price, p_base_price, p_discount, p_quantity, p_description, p_image, v_supplier_id);
    END IF;

    RETURN 'Success';
END;
$$ LANGUAGE plpgsql;

SELECT update_data_products(
    'Acme Wireless Headphones',
    'Electronics',
    '2023-04-15',
    'Tech Suppliers Inc.',
    1000000::MONEY,
	500000::MONEY,
    15,
    50,
    'High-quality wireless headphones with noise cancellation',
    'headphones.jpg'
);

-- 11 OK
--Bảng suppliers
CREATE OR REPLACE FUNCTION auto_update_updated_at_suppliers()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.* IS DISTINCT FROM OLD.* THEN
        NEW.updated_at = NOW();
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_updated_at_trigger_suppliers
BEFORE UPDATE ON suppliers
FOR EACH ROW
EXECUTE FUNCTION auto_update_updated_at_suppliers();

--Bảng customers
CREATE OR REPLACE FUNCTION auto_update_updated_at_customers()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.* IS DISTINCT FROM OLD.* THEN
        NEW.updated_at = NOW();
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_updated_at_trigger_customers
BEFORE UPDATE ON customers
FOR EACH ROW
EXECUTE FUNCTION auto_update_updated_at_customers();

--Bảng products
CREATE OR REPLACE FUNCTION auto_update_updated_at_products()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.* IS DISTINCT FROM OLD.* THEN
        NEW.updated_at = NOW();
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_updated_at_trigger_products
BEFORE UPDATE ON products
FOR EACH ROW
EXECUTE FUNCTION auto_update_updated_at_products();


-- 12

--Tính thu nhập của cửa hàng theo tháng/quý/năm
CREATE OR REPLACE FUNCTION get_store_revenue(start_date DATE,end_date DATE)
RETURNS TABLE (
    month INT,
    quarter INT,
    year INT,
    total_cost MONEY,
    total_revenue MONEY,
    total_profit MONEY
)
AS $$
BEGIN
    RETURN QUERY
    SELECT
        EXTRACT(MONTH FROM o.created_at):: INT AS month,
        EXTRACT(QUARTER FROM o.created_at):: INT AS quarter,
        EXTRACT(YEAR FROM o.created_at):: INT AS year,
        SUM(o.quantity * p.base_price) AS total_cost,
        SUM(o.amount) AS total_revenue,
        SUM(o.quantity * (o.amount - p.base_price)) AS total_profit
    FROM orders o
        INNER JOIN products p ON o.product_id = p.id
    WHERE
        o.created_at BETWEEN start_date AND end_date
    GROUP BY
        month,
        quarter,
        year
    ORDER BY
        year, quarter, month ASC;
END;
$$ LANGUAGE plpgsql;

SELECT * FROM get_store_revenue('2024-01-01', '2024-12-31');

-- 13
CREATE OR REPLACE FUNCTION rank_of_suppliers()
RETURNS TABLE (supplier_name VARCHAR(255), supplier_address VARCHAR(255), total_quantity_sold INT, total_amount MONEY, total_order BIGINT, rank_num BIGINT)
AS $$
BEGIN
	RETURN QUERY
	WITH number_of_purchases AS(
	SELECT
		s.id AS supplier_id,
		s.name AS supplier_name,
		s.address AS supplier_address,
		SUM(o.quantity) :: INT AS total_quantity_sold,
		SUM(o.amount) AS total_amount,
		COUNT(*) AS total_order
	FROM products p
	INNER JOIN suppliers s ON s.id = p.supplier_id
	INNER JOIN orders o ON o.product_id = p.id
	WHERE o.status_payment = 1
	GROUP BY s.id
	)
	SELECT
		number_of_purchases.supplier_name,
		number_of_purchases.supplier_address,
		number_of_purchases.total_quantity_sold,
		number_of_purchases.total_amount,
		number_of_purchases.total_order,
		RANK() OVER (ORDER BY number_of_purchases.total_quantity_sold DESC) AS rank_num
	FROM number_of_purchases;

END;
$$ LANGUAGE plpgsql;

SELECT * FROM rank_of_suppliers()
-- 14

-- 15 OK

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

SELECT insert_order(
    '0985285432',
    '17 Lê Thanh Nghị',
    2,
    2,
    1:: SMALLINT
);  


-- 16 OK
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
        WHERE o.created_at BETWEEN start_date AND end_date AND o.status_payment = 1
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

SELECT * FROM get_top_customers('2024-05-01', '2024-06-11', 5);

