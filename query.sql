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