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