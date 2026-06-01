-- Database: SRMS
CREATE DATABASE IF NOT EXISTS SRMS;
USE SRMS;

CREATE TABLE IF NOT EXISTS users (
  id INT AUTO_INCREMENT PRIMARY KEY,
  username VARCHAR(100) UNIQUE NOT NULL,
  password VARCHAR(255) NOT NULL
);
INSERT IGNORE INTO users (username, password) VALUES ('admin', 'admin123');

CREATE TABLE IF NOT EXISTS Customer (
  customerNumber VARCHAR(50) PRIMARY KEY,
  firstName VARCHAR(100) NOT NULL,
  lastName VARCHAR(100) NOT NULL,
  telephone VARCHAR(30),
  address VARCHAR(200)
);

CREATE TABLE IF NOT EXISTS Product (
  productCode VARCHAR(50) PRIMARY KEY,
  productName VARCHAR(150) NOT NULL,
  quantitySold INT DEFAULT 0,
  unitPrice DECIMAL(12,2) DEFAULT 0
);

CREATE TABLE IF NOT EXISTS Sale (
  invoiceNumber VARCHAR(50) PRIMARY KEY,
  customerNumber VARCHAR(50) NOT NULL,
  productCode VARCHAR(50) NOT NULL,
  salesDate DATE NOT NULL,
  paymentMethod VARCHAR(50),
  totalAmountPaid DECIMAL(12,2) DEFAULT 0,
  FOREIGN KEY (customerNumber) REFERENCES Customer(customerNumber),
  FOREIGN KEY (productCode) REFERENCES Product(productCode)
);
