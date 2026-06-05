require('dotenv').config();
const express = require('express');
const cors = require('cors');
const sql = require('mssql');

const app = express();
app.use(cors());
app.use(express.json());

const PORT = process.env.PORT || 5000;

const sqlConfig = {
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  server: process.env.DB_SERVER,
  pool: {
    max: 10,
    min: 0,
    idleTimeoutMillis: 30000
  },
  options: {
    encrypt: true, // for azure
    trustServerCertificate: false // change to true for local dev / self-signed certs
  }
};

// Initialize global connection pool
const poolPromise = new sql.ConnectionPool(sqlConfig)
  .connect()
  .then(pool => {
    console.log('Connected to Azure SQL Database');
    return pool;
  })
  .catch(err => {
    console.error('Database Connection Failed! Bad Config: ', err);
    process.exit(1);
  });

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', message: 'Backend is running smoothly' });
});

app.post('/api/login', async (req, res) => {
  const { username, password } = req.body;
  
  if (!username || !password) {
    return res.status(400).json({ success: false, message: 'Username and password are required' });
  }

  try {
    const pool = await poolPromise;
    
    // Query the DTUserMaster table
    // Using parameterized query to prevent SQL Injection
    const result = await pool.request()
      .input('username', sql.VarChar, username)
      .input('password', sql.VarChar, password)
      .query(`
        SELECT UserName, UserType, Email, BusinessName 
        FROM [dbo].[DTUserMaster] 
        WHERE UserName = @username AND Password = @password
      `);

    if (result.recordset.length > 0) {
      const user = result.recordset[0];
      res.json({ 
        success: true, 
        message: 'Login successful',
        user: user,
        token: 'dummy_jwt_token_for_' + user.UserName 
      });
    } else {
      res.status(401).json({ success: false, message: 'Invalid username or password' });
    }
  } catch (err) {
    console.error("Database error:", err);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
});

// --- Users CRUD ---

// Get all users
app.get('/api/users', async (req, res) => {
  try {
    const pool = await poolPromise;
    const result = await pool.request().query(`
      SELECT UserName, Password, UserType, Email, Mobile, BusinessName, Address, ContactNo, DeviceId, Salary, Rate, ShiftHours, BreakHours
      FROM [dbo].[DTUserMaster]
    `);
    res.json({ success: true, data: result.recordset });
  } catch (err) {
    console.error("Error fetching users:", err);
    res.status(500).json({ success: false, message: 'Failed to fetch users' });
  }
});

// Create user
app.post('/api/users', async (req, res) => {
  try {
    const pool = await poolPromise;
    const {
      UserName, Password, UserType, Email, Mobile, BusinessName, Address, ContactNo, DeviceId, Salary, Rate, ShiftHours, BreakHours
    } = req.body;

    await pool.request()
      .input('UserName', sql.VarChar, UserName)
      .input('Password', sql.VarChar, Password)
      .input('UserType', sql.VarChar, UserType)
      .input('Email', sql.VarChar, Email)
      .input('Mobile', sql.VarChar, Mobile)
      .input('BusinessName', sql.VarChar, BusinessName)
      .input('Address', sql.VarChar, Address)
      .input('ContactNo', sql.VarChar, ContactNo)
      .input('DeviceId', sql.VarChar, DeviceId)
      .input('Salary', sql.Numeric, Salary)
      .input('Rate', sql.Numeric, Rate)
      .input('ShiftHours', sql.Decimal, ShiftHours)
      .input('BreakHours', sql.Decimal, BreakHours)
      .query(`
        INSERT INTO [dbo].[DTUserMaster] 
        (UserName, Password, UserType, Email, Mobile, BusinessName, Address, ContactNo, DeviceId, Salary, Rate, ShiftHours, BreakHours)
        VALUES 
        (@UserName, @Password, @UserType, @Email, @Mobile, @BusinessName, @Address, @ContactNo, @DeviceId, @Salary, @Rate, @ShiftHours, @BreakHours)
      `);
    res.json({ success: true, message: 'User created successfully' });
  } catch (err) {
    console.error("Error creating user:", err);
    res.status(500).json({ success: false, message: 'Failed to create user' });
  }
});

// Update user
app.put('/api/users/:username', async (req, res) => {
  try {
    const pool = await poolPromise;
    const { username } = req.params;
    const {
      Password, UserType, Email, Mobile, BusinessName, Address, ContactNo, DeviceId, Salary, Rate, ShiftHours, BreakHours
    } = req.body;

    await pool.request()
      .input('UserName', sql.VarChar, username)
      .input('Password', sql.VarChar, Password)
      .input('UserType', sql.VarChar, UserType)
      .input('Email', sql.VarChar, Email)
      .input('Mobile', sql.VarChar, Mobile)
      .input('BusinessName', sql.VarChar, BusinessName)
      .input('Address', sql.VarChar, Address)
      .input('ContactNo', sql.VarChar, ContactNo)
      .input('DeviceId', sql.VarChar, DeviceId)
      .input('Salary', sql.Numeric, Salary)
      .input('Rate', sql.Numeric, Rate)
      .input('ShiftHours', sql.Decimal, ShiftHours)
      .input('BreakHours', sql.Decimal, BreakHours)
      .query(`
        UPDATE [dbo].[DTUserMaster] SET
          Password = @Password,
          UserType = @UserType,
          Email = @Email,
          Mobile = @Mobile,
          BusinessName = @BusinessName,
          Address = @Address,
          ContactNo = @ContactNo,
          DeviceId = @DeviceId,
          Salary = @Salary,
          Rate = @Rate,
          ShiftHours = @ShiftHours,
          BreakHours = @BreakHours
        WHERE UserName = @UserName
      `);
    res.json({ success: true, message: 'User updated successfully' });
  } catch (err) {
    console.error("Error updating user:", err);
    res.status(500).json({ success: false, message: 'Failed to update user' });
  }
});

// Delete user
app.delete('/api/users/:username', async (req, res) => {
  try {
    const pool = await poolPromise;
    const { username } = req.params;

    await pool.request()
      .input('UserName', sql.VarChar, username)
      .query(`DELETE FROM [dbo].[DTUserMaster] WHERE UserName = @UserName`);
      
    res.json({ success: true, message: 'User deleted successfully' });
  } catch (err) {
    console.error("Error deleting user:", err);
    res.status(500).json({ success: false, message: 'Failed to delete user' });
  }
});

// --- Brands CRUD ---

// Get all brands
app.get('/api/brands', async (req, res) => {
  try {
    const pool = await poolPromise;
    const result = await pool.request().query(`
      SELECT BrandName
      FROM [dbo].[DTItemBrand]
    `);
    res.json({ success: true, data: result.recordset });
  } catch (err) {
    console.error("Error fetching brands:", err);
    res.status(500).json({ success: false, message: 'Failed to fetch brands' });
  }
});

// Create brand
app.post('/api/brands', async (req, res) => {
  try {
    const pool = await poolPromise;
    const { BrandName } = req.body;

    await pool.request()
      .input('BrandName', sql.VarChar, BrandName)
      .query(`
        INSERT INTO [dbo].[DTItemBrand] (BrandName)
        VALUES (@BrandName)
      `);
    res.json({ success: true, message: 'Brand created successfully' });
  } catch (err) {
    console.error("Error creating brand:", err);
    res.status(500).json({ success: false, message: 'Failed to create brand' });
  }
});

// Update brand
app.put('/api/brands/:oldName', async (req, res) => {
  try {
    const pool = await poolPromise;
    const { oldName } = req.params;
    const { BrandName } = req.body;

    await pool.request()
      .input('OldName', sql.VarChar, oldName)
      .input('NewName', sql.VarChar, BrandName)
      .query(`
        UPDATE [dbo].[DTItemBrand] 
        SET BrandName = @NewName
        WHERE BrandName = @OldName
      `);
    res.json({ success: true, message: 'Brand updated successfully' });
  } catch (err) {
    console.error("Error updating brand:", err);
    res.status(500).json({ success: false, message: 'Failed to update brand' });
  }
});

// Delete brand
app.delete('/api/brands/:brandName', async (req, res) => {
  try {
    const pool = await poolPromise;
    const { brandName } = req.params;

    await pool.request()
      .input('BrandName', sql.VarChar, brandName)
      .query(`DELETE FROM [dbo].[DTItemBrand] WHERE BrandName = @BrandName`);
      
    res.json({ success: true, message: 'Brand deleted successfully' });
  } catch (err) {
    console.error("Error deleting brand:", err);
    res.status(500).json({ success: false, message: 'Failed to delete brand' });
  }
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
