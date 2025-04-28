import { neon } from '@neondatabase/serverless';
import { Pool } from '@neondatabase/serverless';


// Use environment variables for database connection
const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
  throw new Error('DATABASE_URL environment variable is not set');
}

// Create SQL query client
const sql = neon(connectionString);

// Create connection pool for more complex operations
const pool = new Pool({ connectionString });

// Interface for filtering records
export interface FilterCriteria {
  [key: string]: unknown;
}

// Interface for database records
export interface Record {
  [key: string]: unknown;
}

// Test database connection
export async function testConnection(): Promise<boolean> {
  try {
    const result = await sql`SELECT NOW()`;
    console.log('Database connection successful:', result);
    return true;
  } catch (error) {
    console.error('Database connection failed:', error);
    return false;
  }
}

// Database utility object
export const db = {
  // Find a single record
  async findOne(tableName: string, criteria: FilterCriteria = {}): Promise<Record | null> {
    const keys = Object.keys(criteria);
    
    if (keys.length === 0) {
      const result = await sql`SELECT * FROM "${tableName}" LIMIT 1`;
      return result[0] || null;
    }
    
    const values = keys.map(key => criteria[key]);
    const conditions = keys.map((key, i) => `${key} = $${i + 1}`).join(' AND ');
    
    const query = `
      SELECT * FROM "${tableName}"
      WHERE ${conditions}
      LIMIT 1
    `;
    
    const result = await pool.query(query, values);
    return result.rows[0] || null;
  },
  
  // Find a record by ID
  async findById(tableName: string, id: string | number): Promise<Record | null> {
    return this.findOne(tableName, { id });
  },
  
  // Find multiple records
  async find(
    tableName: string, 
    criteria: FilterCriteria = {}, 
    options: { 
      limit?: number; 
      offset?: number; 
      orderBy?: string; 
      order?: 'ASC' | 'DESC' 
    } = {}
  ): Promise<Record[]> {
    const keys = Object.keys(criteria);
    const { limit, offset, orderBy, order } = options;
    
    if (keys.length === 0) {
      let query = `SELECT * FROM "${tableName}"`;
      
      const params: unknown[] = [];
      let paramIndex = 1;
      
      if (orderBy) {
        query += ` ORDER BY "${orderBy}" ${order === 'DESC' ? 'DESC' : 'ASC'}`;
      }
      
      if (limit) {
        query += ` LIMIT $${paramIndex}`;
        params.push(limit);
        paramIndex++;
      }
      
      if (offset) {
        query += ` OFFSET $${paramIndex}`;
        params.push(offset);
      }
      
      const result = await pool.query(query, params);
      return result.rows;
    }
    
    const values = keys.map(key => criteria[key]);
    const conditions = keys.map((key, i) => `${key} = $${i + 1}`).join(' AND ');
    
    let paramIndex = keys.length + 1;
    let queryStr = `SELECT * FROM "${tableName}" WHERE ${conditions}`;
    
    if (orderBy) {
      queryStr += ` ORDER BY "${orderBy}" ${order === 'DESC' ? 'DESC' : 'ASC'}`;
    }
    
    if (limit) {
      queryStr += ` LIMIT $${paramIndex}`;
      values.push(limit);
      paramIndex++;
    }
    
    if (offset) {
      queryStr += ` OFFSET $${paramIndex}`;
      values.push(offset);
    }
    
    const result = await pool.query(queryStr, values);
    return result.rows;
  },
  
  // Find all records
  async findAll(
    tableName: string, 
    options: { 
      limit?: number; 
      offset?: number; 
      orderBy?: string; 
      order?: 'ASC' | 'DESC' 
    } = {}
  ): Promise<Record[]> {
    return this.find(tableName, {}, options);
  },
  
  // Count records
  async count(tableName: string, criteria: FilterCriteria = {}): Promise<number> {
    const keys = Object.keys(criteria);
    
    if (keys.length === 0) {
      const result = await pool.query(`SELECT COUNT(*) as count FROM "${tableName}"`);
      return result.rows[0]?.count ? Number(result.rows[0].count) : 0;
    }
    
    const values = keys.map(key => criteria[key]);
    const conditions = keys.map((key, i) => `${key} = $${i + 1}`).join(' AND ');
    
    const query = `
      SELECT COUNT(*) as count FROM "${tableName}"
      WHERE ${conditions}
    `;
    
    const result = await pool.query(query, values);
    return result.rows[0]?.count ? Number(result.rows[0].count) : 0;
  },
  
  // Insert a new record
  async create(tableName: string, data: Record): Promise<Record> {
    
    const keys = Object.keys(data);
    const values = keys.map(key => data[key]);
    
    const columns = keys.join(', ');
    const placeholders = keys.map((_, i) => `$${i + 1}`).join(', ');
    
    const query = `
      INSERT INTO "${tableName}" (${columns})
      VALUES (${placeholders})
      RETURNING *
    `;
    

    const result = await pool.query(query, values);
    return result.rows[0];
  },
  
  // Update records
  async update(
    tableName: string, 
    criteria: FilterCriteria, 
    data: Record
  ): Promise<[number, Record[]]> {
    const criteriaKeys = Object.keys(criteria);
    

    // Special handling for careInstructions and deliveryTime fields
    // Ensure we're using snake_case column names in database operations
    if (tableName === 'products') {
      // Convert camelCase to snake_case if present
      if ('careInstructions' in data) {
        data.care_instructions = data.careInstructions;
        delete data.careInstructions;
      }
      
      if ('deliveryTime' in data) {
        data.delivery_time = data.deliveryTime;
        delete data.deliveryTime;
      }
      
      // Ensure values are not null or undefined
      if ('care_instructions' in data) {
        data.care_instructions = data.care_instructions ?? '';
      }
      
      if ('delivery_time' in data) {
        data.delivery_time = data.delivery_time ?? '';
      }
    }
    
    // Recalculate keys after potential field conversions
    const updatedDataKeys = Object.keys(data);
    
    if (updatedDataKeys.length === 0) {
      console.log('No data keys found, skipping update');
      return [0, []];
    }
    
    const setClauses = updatedDataKeys.map((key, i) => `${key} = $${i + 1}`).join(', ');
    const whereConditions = criteriaKeys.map((key, i) => `${key} = $${i + updatedDataKeys.length + 1}`).join(' AND ');
    
    const query = `
      UPDATE "${tableName}"
      SET ${setClauses}
      WHERE ${whereConditions}
      RETURNING *
    `;
    
    
    const values = [...updatedDataKeys.map(key => data[key]), ...criteriaKeys.map(key => criteria[key])];

    try {
      const result = await pool.query(query, values);

      // Debug the returned data
      if (result.rows && result.rows.length > 0) {
        console.log('First updated row:', result.rows[0]);
      }
      
      return [result.rowCount || 0, result.rows];
    } catch (error) {
      console.error('Error during update operation:', error);
      throw error;
    }
  },
  
  // Delete records
  async destroy(tableName: string, criteria: FilterCriteria): Promise<number> {
    const keys = Object.keys(criteria);
    const values = keys.map(key => criteria[key]);
    
    const conditions = keys.map((key, i) => `${key} = $${i + 1}`).join(' AND ');
    
    const query = `
      DELETE FROM "${tableName}"
      WHERE ${conditions}
      RETURNING *
    `;
    
    const result = await pool.query(query, values);
    return result.rowCount || 0;
  },
  
  // Execute raw query
  async query<T = Record[]>(queryText: string, values: unknown[] = []): Promise<T> {
    const result = await pool.query(queryText, values);
    return result.rows as unknown as T;
  },
  
  // Migrate database fields
  async migrateFields(): Promise<void> {
    try {
      // Check if the careInstructions field exists in the products table
      console.log('Checking if careinstructions field exists in products table...');
      const checkQuery = `
        SELECT column_name 
        FROM information_schema.columns 
        WHERE table_name = 'products' AND column_name = 'careinstructions'
      `;
      
      const result = await pool.query(checkQuery);

      if (result.rows.length > 0) {
        console.log('Migrating product table fields from camelCase to snake_case...');
        
        // Add new snake_case columns if they don't exist
        await pool.query(`
          ALTER TABLE products 
          ADD COLUMN IF NOT EXISTS "care_instructions" TEXT
        `);
        
        await pool.query(`
          ALTER TABLE products 
          ADD COLUMN IF NOT EXISTS "delivery_time" VARCHAR(100)
        `);
        
        // Copy data from camelCase columns to snake_case columns
        await pool.query(`
          UPDATE products 
          SET "care_instructions" = "careinstructions" 
          WHERE "careinstructions" IS NOT NULL
        `);
        
        await pool.query(`
          UPDATE products 
          SET "delivery_time" = "deliverytime" 
          WHERE "deliverytime" IS NOT NULL
        `);
        
        // Drop old camelCase columns
        await pool.query(`
          ALTER TABLE products 
          DROP COLUMN IF EXISTS "careinstructions"
        `);
        
        await pool.query(`
          ALTER TABLE products 
          DROP COLUMN IF EXISTS "deliverytime"
        `);
        
        console.log('Migration completed successfully');
      } else {
        console.log('No migration needed, fields are already in snake_case');
      }
    } catch (error) {
      console.error('Error during field migration:', error);
    }
  },
  
  // Migrate product price from VARCHAR to NUMERIC
  async migratePriceToNumeric(): Promise<void> {
    try {
      // Check if the price column exists and its type
      const checkQuery = `
        SELECT data_type 
        FROM information_schema.columns 
        WHERE table_name = 'products' AND column_name = 'price'
      `;
      
      const result = await pool.query(checkQuery);
      
      if (result.rows.length > 0 && result.rows[0].data_type === 'character varying') {
        console.log('Migrating product prices from VARCHAR to NUMERIC...');
        
        // Add a temporary column to hold numeric values
        await pool.query(`
          ALTER TABLE products 
          ADD COLUMN "price_numeric" NUMERIC(10,2)
        `);
        
        // Get all products to convert prices manually
        const products = await this.findAll('products');
        
        // For each product, extract the numeric part and update the price_numeric column
        for (const product of products) {
          if (product.price) {
            // Extract numbers from price string (remove currency symbols and commas)
            const numericPrice = parseFloat(String(product.price).replace(/[^0-9.]/g, ''));
            
            if (!isNaN(numericPrice)) {
              await this.update('products', { id: product.id }, { price_numeric: numericPrice });
            }
          }
        }
        
        // Rename columns - drop the old price and rename price_numeric to price
        await pool.query(`
          ALTER TABLE products 
          DROP COLUMN "price"
        `);
        
        await pool.query(`
          ALTER TABLE products 
          RENAME COLUMN "price_numeric" TO "price"
        `);
        
        // Set NOT NULL constraint
        await pool.query(`
          ALTER TABLE products 
          ALTER COLUMN "price" SET NOT NULL
        `);
        
        console.log('Price migration completed successfully');
      } else if (result.rows.length > 0 && result.rows[0].data_type === 'numeric') {
        console.log('Price field is already NUMERIC, no migration needed');
      } else {
        console.log('Price column not found or has an unexpected type');
      }
    } catch (error) {
      console.error('Error during price field migration:', error);
    }
  },
  
  // Add featured column to products table
  async migrateFeaturedColumn(): Promise<void> {
    try {
      // Check if the featured column already exists
      const checkQuery = `
        SELECT column_name 
        FROM information_schema.columns 
        WHERE table_name = 'products' AND column_name = 'featured'
      `;
      
      const result = await pool.query(checkQuery);
      
      if (result.rows.length === 0) {
        console.log('Adding featured column to products table...');
        
        // Add the featured column with default false
        await pool.query(`
          ALTER TABLE products 
          ADD COLUMN "featured" BOOLEAN NOT NULL DEFAULT false
        `);
        
        console.log('Featured column added successfully');
      } else {
        console.log('Featured column already exists, no migration needed');
      }
    } catch (error) {
      console.error('Error during featured column migration:', error);
    }
  },
  
  // Initialize database tables
  async initializeTables(): Promise<void> {
    // Check if products table exists
    const tableCheck = await pool.query(`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_name = 'products'
      ) as exists
    `);
    
    const tableExists = tableCheck.rows[0]?.exists;
    
    if (!tableExists) {
      // Create products table if it doesn't exist - with NUMERIC price and featured column
      await sql`
        CREATE TABLE IF NOT EXISTS products (
          id SERIAL PRIMARY KEY,
          name VARCHAR(255) NOT NULL,
          price NUMERIC(10,2) NOT NULL,
          images TEXT[] NOT NULL DEFAULT '{}',
          category VARCHAR(100) NOT NULL,
          description TEXT,
          details TEXT[] DEFAULT '{}',
          care_instructions TEXT,
          delivery_time VARCHAR(100),
          featured BOOLEAN NOT NULL DEFAULT false,
          created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
          updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
        )
      `;
      
      console.log('Products table created with NUMERIC price and featured fields');
    } else {
      // If table exists, run migrations to update schema
      await this.migrateFields();
      await this.migratePriceToNumeric();
      await this.migrateFeaturedColumn();
    }
    
    console.log('Database tables initialized');
  }
};

// Initialize tables when imported
if (process.env.NODE_ENV !== 'test') {
  db.initializeTables()
    .then(() => {
      console.log('Database tables initialized successfully');
      return db.migrateFields();
    })
    .then(() => {
      console.log('Database fields migration completed');
    })
    .catch(err => {
      console.error('Failed to initialize database or migrate fields:', err);
    });
}