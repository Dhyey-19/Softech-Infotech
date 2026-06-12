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
        SELECT UserName, UserType 
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
    res.status(500).json({ success: false, message: 'Internal server error', error: err.message });
  }
});

// --- Users CRUD ---

// Get all users
app.get('/api/users', async (req, res) => {
  try {
    const pool = await poolPromise;
    const result = await pool.request().query(`
      SELECT UserName, Password, UserType, Mobile, DeviceId, Salary, Rate, ShiftHours, BreakHours
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
      UserName, Password, UserType, Mobile, DeviceId, Salary, Rate, ShiftHours, BreakHours
    } = req.body;

    await pool.request()
      .input('UserName', sql.VarChar, UserName)
      .input('Password', sql.VarChar, Password)
      .input('UserType', sql.VarChar, UserType)
      .input('Mobile', sql.VarChar, Mobile)
      .input('DeviceId', sql.VarChar, DeviceId)
      .input('Salary', sql.Numeric, Salary)
      .input('Rate', sql.Numeric, Rate)
      .input('ShiftHours', sql.Decimal, ShiftHours)
      .input('BreakHours', sql.Decimal, BreakHours)
      .query(`
        INSERT INTO [dbo].[DTUserMaster] 
        (UserName, Password, UserType, Mobile, DeviceId, Salary, Rate, ShiftHours, BreakHours)
        VALUES 
        (@UserName, @Password, @UserType, @Mobile, @DeviceId, @Salary, @Rate, @ShiftHours, @BreakHours)
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
      Password, UserType, Mobile, DeviceId, Salary, Rate, ShiftHours, BreakHours
    } = req.body;

    await pool.request()
      .input('UserName', sql.VarChar, username)
      .input('Password', sql.VarChar, Password)
      .input('UserType', sql.VarChar, UserType)
      .input('Mobile', sql.VarChar, Mobile)
      .input('DeviceId', sql.VarChar, DeviceId)
      .input('Salary', sql.Numeric, Salary)
      .input('Rate', sql.Numeric, Rate)
      .input('ShiftHours', sql.Decimal, ShiftHours)
      .input('BreakHours', sql.Decimal, BreakHours)
      .query(`
        UPDATE [dbo].[DTUserMaster] SET
          Password = @Password,
          UserType = @UserType,
          Mobile = @Mobile,
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

// --- Categories CRUD ---
app.get('/api/categories', async (req, res) => {
  try {
    const pool = await poolPromise;
    const result = await pool.request().query("SELECT Category FROM [dbo].[DTItemCategory] ORDER BY Category ASC");
    res.json({ success: true, data: result.recordset });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: 'Failed to fetch categories' });
  }
});

app.post('/api/categories', async (req, res) => {
  try {
    const { Category } = req.body;
    const pool = await poolPromise;
    await pool.request()
      .input('Category', sql.VarChar, Category)
      .query("INSERT INTO [dbo].[DTItemCategory] (Category) VALUES (@Category)");
    res.json({ success: true, message: 'Category added' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: 'Failed to add category' });
  }
});

app.put('/api/categories/:oldCategory', async (req, res) => {
  try {
    const { oldCategory } = req.params;
    const { Category } = req.body;
    const pool = await poolPromise;
    await pool.request()
      .input('OldCategory', sql.VarChar, oldCategory)
      .input('NewCategory', sql.VarChar, Category)
      .query("UPDATE [dbo].[DTItemCategory] SET Category = @NewCategory WHERE Category = @OldCategory");
    res.json({ success: true, message: 'Category updated' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: 'Failed to update category' });
  }
});

app.delete('/api/categories/:category', async (req, res) => {
  try {
    const { category } = req.params;
    const pool = await poolPromise;
    await pool.request()
      .input('Category', sql.VarChar, category)
      .query("DELETE FROM [dbo].[DTItemCategory] WHERE Category = @Category");
    res.json({ success: true, message: 'Category deleted' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: 'Failed to delete category' });
  }
});

// --- Service Centers CRUD ---
app.get('/api/servicecenters', async (req, res) => {
  try {
    const pool = await poolPromise;
    const result = await pool.request().query("SELECT SendToName, Address, MobileNo, Brand FROM [dbo].[DTItemSendTo] ORDER BY SendToName ASC");
    res.json({ success: true, data: result.recordset });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: 'Failed to fetch service centers' });
  }
});

app.post('/api/servicecenters', async (req, res) => {
  try {
    const { SendToName, Address, MobileNo, Brand } = req.body;
    const pool = await poolPromise;
    await pool.request()
      .input('SendToName', sql.VarChar, SendToName)
      .input('Address', sql.VarChar, Address)
      .input('MobileNo', sql.VarChar, MobileNo)
      .input('Brand', sql.VarChar, Brand)
      .query("INSERT INTO [dbo].[DTItemSendTo] (SendToName, Address, MobileNo, Brand) VALUES (@SendToName, @Address, @MobileNo, @Brand)");
    res.json({ success: true, message: 'Service center registered' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: 'Failed to create service center' });
  }
});

app.put('/api/servicecenters/:oldName', async (req, res) => {
  try {
    const { oldName } = req.params;
    const { SendToName, Address, MobileNo, Brand } = req.body;
    const pool = await poolPromise;
    await pool.request()
      .input('OldName', sql.VarChar, oldName)
      .input('SendToName', sql.VarChar, SendToName)
      .input('Address', sql.VarChar, Address)
      .input('MobileNo', sql.VarChar, MobileNo)
      .input('Brand', sql.VarChar, Brand)
      .query("UPDATE [dbo].[DTItemSendTo] SET SendToName=@SendToName, Address=@Address, MobileNo=@MobileNo, Brand=@Brand WHERE SendToName=@OldName");
    res.json({ success: true, message: 'Service center updated' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: 'Failed to update service center' });
  }
});

app.delete('/api/servicecenters/:name', async (req, res) => {
  try {
    const { name } = req.params;
    const pool = await poolPromise;
    await pool.request()
      .input('SendToName', sql.VarChar, name)
      .query("DELETE FROM [dbo].[DTItemSendTo] WHERE SendToName = @SendToName");
    res.json({ success: true, message: 'Service center removed' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: 'Failed to remove service center' });
  }
});

// --- Customers CRUD ---
app.get('/api/customers', async (req, res) => {
  try {
    const pool = await poolPromise;
    const result = await pool.request().query("SELECT MobileNo, CustomerName, BusinessName, Address, AlternetNo FROM [dbo].[DTCustomer] ORDER BY CustomerName ASC");
    res.json({ success: true, data: result.recordset });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: 'Failed to fetch customers' });
  }
});

app.post('/api/customers', async (req, res) => {
  try {
    const { MobileNo, CustomerName, BusinessName, Address, AlternetNo } = req.body;
    const pool = await poolPromise;
    await pool.request()
      .input('MobileNo', sql.VarChar, MobileNo)
      .input('CustomerName', sql.VarChar, CustomerName)
      .input('BusinessName', sql.VarChar, BusinessName)
      .input('Address', sql.VarChar, Address)
      .input('AlternetNo', sql.VarChar, AlternetNo)
      .query("INSERT INTO [dbo].[DTCustomer] (MobileNo, CustomerName, BusinessName, Address, AlternetNo) VALUES (@MobileNo, @CustomerName, @BusinessName, @Address, @AlternetNo)");
    res.json({ success: true, message: 'Customer added' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: 'Failed to add customer' });
  }
});

app.put('/api/customers/:mobile', async (req, res) => {
  try {
    const { mobile } = req.params;
    const { CustomerName, BusinessName, Address, AlternetNo } = req.body;
    const pool = await poolPromise;
    await pool.request()
      .input('MobileNo', sql.VarChar, mobile)
      .input('CustomerName', sql.VarChar, CustomerName)
      .input('BusinessName', sql.VarChar, BusinessName)
      .input('Address', sql.VarChar, Address)
      .input('AlternetNo', sql.VarChar, AlternetNo)
      .query("UPDATE [dbo].[DTCustomer] SET CustomerName=@CustomerName, BusinessName=@BusinessName, Address=@Address, AlternetNo=@AlternetNo WHERE MobileNo=@MobileNo");
    res.json({ success: true, message: 'Customer profile updated' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: 'Failed to update customer' });
  }
});

app.delete('/api/customers/:mobile', async (req, res) => {
  try {
    const { mobile } = req.params;
    const pool = await poolPromise;
    await pool.request()
      .input('MobileNo', sql.VarChar, mobile)
      .query("DELETE FROM [dbo].[DTCustomer] WHERE MobileNo = @MobileNo");
    res.json({ success: true, message: 'Customer profile deleted' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: 'Failed to delete customer' });
  }
});

// --- Events CRUD ---
app.get('/api/events', async (req, res) => {
  try {
    const pool = await poolPromise;
    const result = await pool.request().query("SELECT Id, EventName, PersonName, EventDate FROM [dbo].[DTEvents] ORDER BY EventDate ASC");
    res.json({ success: true, data: result.recordset });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: 'Failed to fetch events' });
  }
});

app.post('/api/events', async (req, res) => {
  try {
    const { EventName, PersonName, EventDate } = req.body;
    const pool = await poolPromise;
    await pool.request()
      .input('EventName', sql.VarChar, EventName)
      .input('PersonName', sql.VarChar, PersonName)
      .input('EventDate', sql.VarChar, EventDate)
      .query("INSERT INTO [dbo].[DTEvents] (EventName, PersonName, EventDate) VALUES (@EventName, @PersonName, @EventDate)");
    res.json({ success: true, message: 'Event added successfully' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: 'Failed to add event' });
  }
});

app.put('/api/events/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { EventName, PersonName, EventDate } = req.body;
    const pool = await poolPromise;
    await pool.request()
      .input('Id', sql.Int, Number(id))
      .input('EventName', sql.VarChar, EventName)
      .input('PersonName', sql.VarChar, PersonName)
      .input('EventDate', sql.VarChar, EventDate)
      .query("UPDATE [dbo].[DTEvents] SET EventName=@EventName, PersonName=@PersonName, EventDate=@EventDate WHERE Id=@Id");
    res.json({ success: true, message: 'Event updated successfully' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: 'Failed to update event' });
  }
});

app.delete('/api/events/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const pool = await poolPromise;
    await pool.request()
      .input('Id', sql.Int, Number(id))
      .query("DELETE FROM [dbo].[DTEvents] WHERE Id = @Id");
    res.json({ success: true, message: 'Event deleted' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: 'Failed to delete event' });
  }
});

// --- Applications (Apps) CRUD ---
app.get('/api/applications', async (req, res) => {
  try {
    const pool = await poolPromise;
    const result = await pool.request().query("SELECT AppName, ClientName, ClientMNo, SaleDate, AppExpDate, AppStatus, SalePrice, Renewal, Activation, verno, DeviceID, SecretKey FROM [dbo].[DTApplications] ORDER BY AppExpDate ASC");
    res.json({ success: true, data: result.recordset });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: 'Failed to fetch applications' });
  }
});

app.post('/api/applications', async (req, res) => {
  try {
    const { AppName, ClientName, ClientMNo, SaleDate, AppExpDate, AppStatus, SalePrice, Renewal, Activation, verno, DeviceID, SecretKey } = req.body;
    const pool = await poolPromise;
    await pool.request()
      .input('AppName', sql.VarChar, AppName)
      .input('ClientName', sql.VarChar, ClientName)
      .input('ClientMNo', sql.VarChar, ClientMNo)
      .input('SaleDate', sql.VarChar, SaleDate)
      .input('AppExpDate', sql.VarChar, AppExpDate)
      .input('AppStatus', sql.VarChar, AppStatus)
      .input('SalePrice', sql.Numeric, SalePrice)
      .input('Renewal', sql.Numeric, Renewal)
      .input('Activation', sql.Numeric, Activation)
      .input('verno', sql.VarChar, verno)
      .input('DeviceID', sql.VarChar, DeviceID)
      .input('SecretKey', sql.VarChar, SecretKey)
      .query(`
        INSERT INTO [dbo].[DTApplications] 
        (AppName, ClientName, ClientMNo, SaleDate, AppExpDate, AppStatus, SalePrice, Renewal, Activation, verno, DeviceID, SecretKey)
        VALUES 
        (@AppName, @ClientName, @ClientMNo, @SaleDate, @AppExpDate, @AppStatus, @SalePrice, @Renewal, @Activation, @verno, @DeviceID, @SecretKey)
      `);
    res.json({ success: true, message: 'Application registered' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: 'Failed to register application' });
  }
});

app.put('/api/applications/:appName', async (req, res) => {
  try {
    const { appName } = req.params;
    const { ClientName, ClientMNo, SaleDate, AppExpDate, AppStatus, SalePrice, Renewal, Activation, verno, DeviceID, SecretKey } = req.body;
    const pool = await poolPromise;
    await pool.request()
      .input('AppName', sql.VarChar, appName)
      .input('ClientName', sql.VarChar, ClientName)
      .input('ClientMNo', sql.VarChar, ClientMNo)
      .input('SaleDate', sql.VarChar, SaleDate)
      .input('AppExpDate', sql.VarChar, AppExpDate)
      .input('AppStatus', sql.VarChar, AppStatus)
      .input('SalePrice', sql.Numeric, SalePrice)
      .input('Renewal', sql.Numeric, Renewal)
      .input('Activation', sql.Numeric, Activation)
      .input('verno', sql.VarChar, verno)
      .input('DeviceID', sql.VarChar, DeviceID)
      .input('SecretKey', sql.VarChar, SecretKey)
      .query(`
        UPDATE [dbo].[DTApplications] SET
          ClientName=@ClientName,
          ClientMNo=@ClientMNo,
          SaleDate=@SaleDate,
          AppExpDate=@AppExpDate,
          AppStatus=@AppStatus,
          SalePrice=@SalePrice,
          Renewal=@Renewal,
          Activation=@Activation,
          verno=@verno,
          DeviceID=@DeviceID,
          SecretKey=@SecretKey
        WHERE AppName=@AppName
      `);
    res.json({ success: true, message: 'Application updated' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: 'Failed to update application' });
  }
});

app.delete('/api/applications/:appName', async (req, res) => {
  try {
    const { appName } = req.params;
    const pool = await poolPromise;
    await pool.request()
      .input('AppName', sql.VarChar, appName)
      .query("DELETE FROM [dbo].[DTApplications] WHERE AppName = @AppName");
    res.json({ success: true, message: 'Application deleted' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: 'Failed to delete application' });
  }
});

// --- Orders CRUD ---
app.get('/api/orders', async (req, res) => {
  try {
    const pool = await poolPromise;
    const result = await pool.request().query("SELECT Id, ItemName, UserName, Status FROM [dbo].[DTItemOrder] ORDER BY Id DESC");
    res.json({ success: true, data: result.recordset });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: 'Failed to fetch orders' });
  }
});

app.post('/api/orders', async (req, res) => {
  try {
    const { ItemName, UserName, Status } = req.body;
    const pool = await poolPromise;
    await pool.request()
      .input('ItemName', sql.VarChar, ItemName)
      .input('UserName', sql.VarChar, UserName)
      .input('Status', sql.VarChar, Status)
      .query("INSERT INTO [dbo].[DTItemOrder] (ItemName, UserName, Status) VALUES (@ItemName, @UserName, @Status)");
    res.json({ success: true, message: 'Order created' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: 'Failed to create order' });
  }
});

app.put('/api/orders/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { ItemName, UserName, Status } = req.body;
    const pool = await poolPromise;
    await pool.request()
      .input('Id', sql.Int, Number(id))
      .input('ItemName', sql.VarChar, ItemName)
      .input('UserName', sql.VarChar, UserName)
      .input('Status', sql.VarChar, Status)
      .query("UPDATE [dbo].[DTItemOrder] SET ItemName=@ItemName, UserName=@UserName, Status=@Status WHERE Id=@Id");
    res.json({ success: true, message: 'Order updated' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: 'Failed to update order' });
  }
});

app.delete('/api/orders/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const pool = await poolPromise;
    await pool.request()
      .input('Id', sql.Int, Number(id))
      .query("DELETE FROM [dbo].[DTItemOrder] WHERE Id = @Id");
    res.json({ success: true, message: 'Order deleted' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: 'Failed to delete order' });
  }
});

// --- Sales CRUD ---
app.get('/api/sales', async (req, res) => {
  try {
    const pool = await poolPromise;
    const result = await pool.request().query("SELECT Id, SaleDate, ItemName, Qty, Rate, Amount, PayMode, Remark, UserName, Cash, Bank, ChallanNo FROM [dbo].[DTSales] ORDER BY SaleDate DESC");
    res.json({ success: true, data: result.recordset });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: 'Failed to fetch sales' });
  }
});

app.post('/api/sales', async (req, res) => {
  try {
    const { SaleDate, ItemName, Qty, Rate, Amount, PayMode, Remark, UserName, Cash, Bank, ChallanNo } = req.body;
    const pool = await poolPromise;
    await pool.request()
      .input('SaleDate', sql.VarChar, SaleDate)
      .input('ItemName', sql.VarChar, ItemName)
      .input('Qty', sql.Numeric, Qty)
      .input('Rate', sql.Numeric, Rate)
      .input('Amount', sql.Numeric, Amount)
      .input('PayMode', sql.VarChar, PayMode)
      .input('Remark', sql.VarChar, Remark)
      .input('UserName', sql.VarChar, UserName)
      .input('Cash', sql.Numeric, Cash)
      .input('Bank', sql.Numeric, Bank)
      .input('ChallanNo', sql.Numeric, ChallanNo)
      .query(`
        INSERT INTO [dbo].[DTSales] 
        (SaleDate, ItemName, Qty, Rate, Amount, PayMode, Remark, UserName, Cash, Bank, ChallanNo)
        VALUES 
        (@SaleDate, @ItemName, @Qty, @Rate, @Amount, @PayMode, @Remark, @UserName, @Cash, @Bank, @ChallanNo)
      `);
    res.json({ success: true, message: 'Sale logged' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: 'Failed to log sale' });
  }
});

app.post('/api/sales/bulk', async (req, res) => {
  try {
    const { sales } = req.body;
    if (!Array.isArray(sales) || sales.length === 0) {
      return res.status(400).json({ success: false, message: 'Invalid or empty sales list' });
    }

    const pool = await poolPromise;
    const transaction = new sql.Transaction(pool);
    await transaction.begin();

    try {
      for (const sale of sales) {
        const { SaleDate, ItemName, Qty, Rate, Amount, PayMode, Remark, UserName, Cash, Bank, ChallanNo } = sale;
        
        const request = new sql.Request(transaction);
        request.input('SaleDate', sql.DateTime, SaleDate ? new Date(SaleDate) : new Date());
        request.input('ItemName', sql.VarChar, ItemName);
        request.input('Qty', sql.Numeric, Qty);
        request.input('Rate', sql.Numeric, Rate);
        request.input('Amount', sql.Numeric, Amount);
        request.input('PayMode', sql.VarChar, PayMode);
        request.input('Remark', sql.VarChar, Remark);
        request.input('UserName', sql.VarChar, UserName);
        request.input('Cash', sql.Numeric, Cash);
        request.input('Bank', sql.Numeric, Bank);
        request.input('ChallanNo', sql.Numeric, ChallanNo);

        await request.query(`
          INSERT INTO [dbo].[DTSales] 
          (SaleDate, ItemName, Qty, Rate, Amount, PayMode, Remark, UserName, Cash, Bank, ChallanNo)
          VALUES 
          (@SaleDate, @ItemName, @Qty, @Rate, @Amount, @PayMode, @Remark, @UserName, @Cash, @Bank, @ChallanNo)
        `);
      }
      await transaction.commit();
      res.json({ success: true, message: `${sales.length} sales logged successfully` });
    } catch (err) {
      await transaction.rollback();
      throw err;
    }
  } catch (err) {
    console.error('Bulk sales logging error:', err);
    res.status(500).json({ success: false, message: 'Failed to log batch sales', error: err.message });
  }
});

app.put('/api/sales/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { SaleDate, ItemName, Qty, Rate, Amount, PayMode, Remark, UserName, Cash, Bank, ChallanNo } = req.body;
    const pool = await poolPromise;
    await pool.request()
      .input('Id', sql.Int, Number(id))
      .input('SaleDate', sql.VarChar, SaleDate)
      .input('ItemName', sql.VarChar, ItemName)
      .input('Qty', sql.Numeric, Qty)
      .input('Rate', sql.Numeric, Rate)
      .input('Amount', sql.Numeric, Amount)
      .input('PayMode', sql.VarChar, PayMode)
      .input('Remark', sql.VarChar, Remark)
      .input('UserName', sql.VarChar, UserName)
      .input('Cash', sql.Numeric, Cash)
      .input('Bank', sql.Numeric, Bank)
      .input('ChallanNo', sql.Numeric, ChallanNo)
      .query(`
        UPDATE [dbo].[DTSales] SET
          SaleDate=@SaleDate,
          ItemName=@ItemName,
          Qty=@Qty,
          Rate=@Rate,
          Amount=@Amount,
          PayMode=@PayMode,
          Remark=@Remark,
          UserName=@UserName,
          Cash=@Cash,
          Bank=@Bank,
          ChallanNo=@ChallanNo
        WHERE Id=@Id
      `);
    res.json({ success: true, message: 'Sale updated' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: 'Failed to update sale' });
  }
});

app.delete('/api/sales/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const pool = await poolPromise;
    await pool.request()
      .input('Id', sql.Int, Number(id))
      .query("DELETE FROM [dbo].[DTSales] WHERE Id = @Id");
    res.json({ success: true, message: 'Sale record deleted' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: 'Failed to delete sale' });
  }
});

// --- Replacements CRUD ---
app.get('/api/replacements', async (req, res) => {
  try {
    const pool = await poolPromise;
    const result = await pool.request().query("SELECT ID, InwardDate, Category, BrandName, Model, SerialNo, ReturnSerialNo, InvNo, InvDate, CustomerName, CustomerMNo, SendToName, SCAddress, SCMNo, CourierDate, CourierNo, Remark, ReturnDate, RepCharges, DeliveryDate, Status FROM [dbo].[DTItemReplacement] ORDER BY InwardDate DESC");
    res.json({ success: true, data: result.recordset });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: 'Failed to fetch replacements' });
  }
});

app.post('/api/replacements', async (req, res) => {
  try {
    const { InwardDate, Category, BrandName, Model, SerialNo, ReturnSerialNo, InvNo, InvDate, CustomerName, CustomerMNo, SendToName, SCAddress, SCMNo, CourierDate, CourierNo, Remark, ReturnDate, RepCharges, DeliveryDate, Status } = req.body;
    const pool = await poolPromise;
    await pool.request()
      .input('InwardDate', sql.VarChar, InwardDate)
      .input('Category', sql.VarChar, Category)
      .input('BrandName', sql.VarChar, BrandName)
      .input('Model', sql.VarChar, Model)
      .input('SerialNo', sql.VarChar, SerialNo)
      .input('ReturnSerialNo', sql.VarChar, ReturnSerialNo)
      .input('InvNo', sql.VarChar, InvNo)
      .input('InvDate', sql.VarChar, InvDate)
      .input('CustomerName', sql.VarChar, CustomerName)
      .input('CustomerMNo', sql.VarChar, CustomerMNo)
      .input('SendToName', sql.VarChar, SendToName)
      .input('SCAddress', sql.VarChar, SCAddress)
      .input('SCMNo', sql.VarChar, SCMNo)
      .input('CourierDate', sql.VarChar, CourierDate)
      .input('CourierNo', sql.VarChar, CourierNo)
      .input('Remark', sql.VarChar, Remark)
      .input('ReturnDate', sql.VarChar, ReturnDate)
      .input('RepCharges', sql.VarChar, RepCharges)
      .input('DeliveryDate', sql.VarChar, DeliveryDate)
      .input('Status', sql.VarChar, Status)
      .query(`
        INSERT INTO [dbo].[DTItemReplacement]
        (InwardDate, Category, BrandName, Model, SerialNo, ReturnSerialNo, InvNo, InvDate, CustomerName, CustomerMNo, SendToName, SCAddress, SCMNo, CourierDate, CourierNo, Remark, ReturnDate, RepCharges, DeliveryDate, Status)
        VALUES
        (@InwardDate, @Category, @BrandName, @Model, @SerialNo, @ReturnSerialNo, @InvNo, @InvDate, @CustomerName, @CustomerMNo, @SendToName, @SCAddress, @SCMNo, @CourierDate, @CourierNo, @Remark, @ReturnDate, @RepCharges, @DeliveryDate, @Status)
      `);
    res.json({ success: true, message: 'Replacement record registered' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: 'Failed to create replacement' });
  }
});

app.put('/api/replacements/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { InwardDate, Category, BrandName, Model, SerialNo, ReturnSerialNo, InvNo, InvDate, CustomerName, CustomerMNo, SendToName, SCAddress, SCMNo, CourierDate, CourierNo, Remark, ReturnDate, RepCharges, DeliveryDate, Status } = req.body;
    const pool = await poolPromise;
    await pool.request()
      .input('Id', sql.Int, Number(id))
      .input('InwardDate', sql.VarChar, InwardDate)
      .input('Category', sql.VarChar, Category)
      .input('BrandName', sql.VarChar, BrandName)
      .input('Model', sql.VarChar, Model)
      .input('SerialNo', sql.VarChar, SerialNo)
      .input('ReturnSerialNo', sql.VarChar, ReturnSerialNo)
      .input('InvNo', sql.VarChar, InvNo)
      .input('InvDate', sql.VarChar, InvDate)
      .input('CustomerName', sql.VarChar, CustomerName)
      .input('CustomerMNo', sql.VarChar, CustomerMNo)
      .input('SendToName', sql.VarChar, SendToName)
      .input('SCAddress', sql.VarChar, SCAddress)
      .input('SCMNo', sql.VarChar, SCMNo)
      .input('CourierDate', sql.VarChar, CourierDate)
      .input('CourierNo', sql.VarChar, CourierNo)
      .input('Remark', sql.VarChar, Remark)
      .input('ReturnDate', sql.VarChar, ReturnDate)
      .input('RepCharges', sql.VarChar, RepCharges)
      .input('DeliveryDate', sql.VarChar, DeliveryDate)
      .input('Status', sql.VarChar, Status)
      .query(`
        UPDATE [dbo].[DTItemReplacement] SET
          InwardDate=@InwardDate,
          Category=@Category,
          BrandName=@BrandName,
          Model=@Model,
          SerialNo=@SerialNo,
          ReturnSerialNo=@ReturnSerialNo,
          InvNo=@InvNo,
          InvDate=@InvDate,
          CustomerName=@CustomerName,
          CustomerMNo=@CustomerMNo,
          SendToName=@SendToName,
          SCAddress=@SCAddress,
          SCMNo=@SCMNo,
          CourierDate=@CourierDate,
          CourierNo=@CourierNo,
          Remark=@Remark,
          ReturnDate=@ReturnDate,
          RepCharges=@RepCharges,
          DeliveryDate=@DeliveryDate,
          Status=@Status
        WHERE ID=@Id
      `);
    res.json({ success: true, message: 'Replacement updated' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: 'Failed to update replacement' });
  }
});

app.delete('/api/replacements/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const pool = await poolPromise;
    await pool.request()
      .input('Id', sql.Int, Number(id))
      .query("DELETE FROM [dbo].[DTItemReplacement] WHERE ID = @Id");
    res.json({ success: true, message: 'Replacement record deleted' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: 'Failed to delete replacement' });
  }
});

// --- Bank QRs (SmartQRCodes) CRUD ---
app.get('/api/bankqrs', async (req, res) => {
  try {
    const pool = await poolPromise;
    const result = await pool.request().query("SELECT QRID, Mobile, BusinessName, Category, IsActive FROM [dbo].[SmartQRCodes] ORDER BY QRID DESC");
    res.json({ success: true, data: result.recordset });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: 'Failed to fetch Bank QR codes' });
  }
});

app.post('/api/bankqrs', async (req, res) => {
  try {
    const { QRID, Mobile, BusinessName, Category, IsActive } = req.body;
    const pool = await poolPromise;
    await pool.request()
      .input('QRID', sql.Numeric, QRID)
      .input('Mobile', sql.Numeric, Mobile)
      .input('BusinessName', sql.VarChar, BusinessName)
      .input('Category', sql.VarChar, Category)
      .input('IsActive', sql.Bit, IsActive ? 1 : 0)
      .query("INSERT INTO [dbo].[SmartQRCodes] (QRID, Mobile, BusinessName, Category, IsActive) VALUES (@QRID, @Mobile, @BusinessName, @Category, @IsActive)");
    res.json({ success: true, message: 'Bank QR code created' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: 'Failed to create Bank QR code' });
  }
});

app.put('/api/bankqrs/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { Mobile, BusinessName, Category, IsActive } = req.body;
    const pool = await poolPromise;
    await pool.request()
      .input('QRID', sql.Numeric, id)
      .input('Mobile', sql.Numeric, Mobile)
      .input('BusinessName', sql.VarChar, BusinessName)
      .input('Category', sql.VarChar, Category)
      .input('IsActive', sql.Bit, IsActive ? 1 : 0)
      .query("UPDATE [dbo].[SmartQRCodes] SET Mobile=@Mobile, BusinessName=@BusinessName, Category=@Category, IsActive=@IsActive WHERE QRID=@QRID");
    res.json({ success: true, message: 'Bank QR code updated' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: 'Failed to update Bank QR code' });
  }
});

app.delete('/api/bankqrs/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const pool = await poolPromise;
    await pool.request()
      .input('QRID', sql.Numeric, id)
      .query("DELETE FROM [dbo].[SmartQRCodes] WHERE QRID = @QRID");
    res.json({ success: true, message: 'Bank QR code deleted' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: 'Failed to delete Bank QR code' });
  }
});

// --- Advanced Attendance ---

app.post('/api/attendance/checkin', async (req, res) => {
  try {
    const pool = await poolPromise;
    const { username } = req.body;

    // Check if the previous record is not checked out
    const openPunches = await pool.request()
      .input('username', sql.VarChar, username)
      .query(`
        SELECT TOP 1 LogId, LogTime, LogType 
        FROM [dbo].[DTAttendanceLog] 
        WHERE UserName = @username 
        ORDER BY LogTime DESC
      `);

    if (openPunches.recordset.length > 0) {
      const lastPunch = openPunches.recordset[0];
      if (lastPunch.LogType === 'IN') {
        // Previous record is not checked out. 
        // Check if checkin was before 3 PM (15:00)
        const hourQuery = await pool.request()
          .input('lastLogTime', sql.DateTime, lastPunch.LogTime)
          .query(`SELECT DATEPART(hour, @lastLogTime) AS logHour`);
        
        const logHour = hourQuery.recordset[0].logHour;
        const autoTimeStr = logHour < 15 ? '14:00:00' : '20:30:00';

        await pool.request()
          .input('username', sql.VarChar, username)
          .input('lastLogTime', sql.DateTime, lastPunch.LogTime)
          .query(`
            INSERT INTO [dbo].[DTAttendanceLog] (UserName, LogType, LogTime, IsAutoCheckout) 
            VALUES (@username, 'OUT', CAST(CAST(@lastLogTime AS DATE) AS DATETIME) + CAST('${autoTimeStr}' AS DATETIME), 1)
          `);
      }
    }

    // Insert new checkin
    await pool.request()
      .input('username', sql.VarChar, username)
      .query(`INSERT INTO [dbo].[DTAttendanceLog] (UserName, LogType, LogTime) VALUES (@username, 'IN', DATEADD(minute, 330, GETUTCDATE()))`);

    res.json({ success: true, message: 'Checked in successfully' });
  } catch (err) {
    console.error("Error during checkin:", err);
    res.status(500).json({ success: false, message: 'Error checking in' });
  }
});

app.post('/api/attendance/checkout', async (req, res) => {
  try {
    const pool = await poolPromise;
    const { username } = req.body;

    const openPunches = await pool.request()
      .input('username', sql.VarChar, username)
      .query(`
        SELECT TOP 1 LogId, LogTime, LogType 
        FROM [dbo].[DTAttendanceLog] 
        WHERE UserName = @username 
        ORDER BY LogTime DESC
      `);

    if (openPunches.recordset.length === 0 || openPunches.recordset[0].LogType === 'OUT') {
      return res.status(400).json({ success: false, message: 'You are already checked out.' });
    }

    await pool.request()
      .input('username', sql.VarChar, username)
      .query(`INSERT INTO [dbo].[DTAttendanceLog] (UserName, LogType, LogTime) VALUES (@username, 'OUT', DATEADD(minute, 330, GETUTCDATE()))`);

    res.json({ success: true, message: 'Checked out successfully' });
  } catch (err) {
    console.error("Error during checkout:", err);
    res.status(500).json({ success: false, message: 'Error checking out' });
  }
});

app.get('/api/attendance/status/:username', async (req, res) => {
  try {
    const pool = await poolPromise;
    const { username } = req.params;

    // Get today's logs
    const todayLogs = await pool.request()
      .input('username', sql.VarChar, username)
      .query(`
        SELECT LogType, LogTime 
        FROM [dbo].[DTAttendanceLog] 
        WHERE UserName = @username AND CAST(LogTime AS DATE) = CAST(DATEADD(minute, 330, GETUTCDATE()) AS DATE)
        ORDER BY LogTime ASC
      `);

    const logs = todayLogs.recordset;
    let checkedIn = false;
    let lastInTime = null;
    let totalMs = 0;

    for (let log of logs) {
      if (log.LogType === 'IN') {
        checkedIn = true;
        lastInTime = new Date(log.LogTime);
      } else if (log.LogType === 'OUT' && checkedIn) {
        checkedIn = false;
        totalMs += (new Date(log.LogTime) - lastInTime);
      }
    }

    if (checkedIn) {
      // Calculate current active session relative to node's time, but node time might not be IST!
      // To fix this accurately, we should ask SQL for the current IST time
      const istTimeResult = await pool.request().query(`SELECT DATEADD(minute, 330, GETUTCDATE()) as currentIST`);
      const currentIST = new Date(istTimeResult.recordset[0].currentIST);
      totalMs += (currentIST.getTime() - lastInTime.getTime());
    }

    let totalHours = totalMs / (1000 * 60 * 60);

    res.json({ 
      success: true, 
      checkedIn,
      logs,
      totalHours: totalHours.toFixed(2)
    });
  } catch (err) {
    console.error("Error fetching attendance status:", err);
    res.status(500).json({ success: false, message: 'Error fetching attendance' });
  }
});

// Admin endpoint to view all attendance for today
app.get('/api/attendance/admin', async (req, res) => {
  try {
    const pool = await poolPromise;
    const result = await pool.request().query(`
      SELECT u.UserName, u.Rate, a.LogType, a.LogTime, a.IsAutoCheckout
      FROM [dbo].[DTUserMaster] u
      LEFT JOIN [dbo].[DTAttendanceLog] a 
        ON u.UserName = a.UserName AND CAST(a.LogTime AS DATE) = CAST(DATEADD(minute, 330, GETUTCDATE()) AS DATE)
      ORDER BY u.UserName ASC, a.LogTime ASC
    `);

    const usersData = {};
    for (let row of result.recordset) {
      if (!usersData[row.UserName]) {
        usersData[row.UserName] = {
          UserName: row.UserName,
          Rate: row.Rate || 0,
          Logs: [],
          TotalHours: 0,
          CalculatedPay: 0,
          CurrentStatus: 'OUT'
        };
      }
      if (row.LogType) {
        usersData[row.UserName].Logs.push({
          Type: row.LogType,
          Time: row.LogTime,
          Auto: row.IsAutoCheckout
        });
      }
    }

    Object.values(usersData).forEach(user => {
      let checkedIn = false;
      let lastInTime = null;
      let totalMs = 0;

      for (let log of user.Logs) {
        if (log.Type === 'IN') {
          checkedIn = true;
          lastInTime = new Date(log.Time);
          user.CurrentStatus = 'IN';
        } else if (log.Type === 'OUT' && checkedIn) {
          checkedIn = false;
          totalMs += (new Date(log.Time) - lastInTime);
          user.CurrentStatus = 'OUT';
        }
      }

      if (checkedIn) {
        // Calculate current active session relative to node's time, but node time might not be IST!
        // To fix this accurately, we should ask SQL for the current IST time
        // However, for admin, we don't have async calls here easily. 
        // We will just use new Date() as approximation if they are currently working.
        totalMs += (new Date() - lastInTime);
      }

      let totalHours = totalMs / (1000 * 60 * 60);

      user.TotalHours = totalHours.toFixed(2);
      user.CalculatedPay = (totalHours * user.Rate).toFixed(2);
    });

    res.json({ success: true, data: Object.values(usersData) });
  } catch (err) {
    console.error("Error fetching admin attendance:", err);
    res.status(500).json({ success: false, message: 'Failed to fetch attendance' });
  }
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
