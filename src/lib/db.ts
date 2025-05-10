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

// Enhanced interface for filtering records with support for logical operators
export interface FilterCriteria {
  [key: string]: unknown | { 
    '>=': number | string;
    '<=': number | string;
    '<': number | string;
    '>': number | string;
    '!=': unknown;
    '$like': string;
    [key: string]: unknown; 
  } | FilterCriteria[];
  $or?: FilterCriteria[];
  $and?: FilterCriteria[];
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

// Enhanced helper to build WHERE conditions with operators
function buildWhereConditions(criteria: FilterCriteria, startParamIndex = 1): { 
  conditions: string; 
  values: unknown[];
  paramIndex: number;
} {
  const values: unknown[] = [];
  let paramIndex = startParamIndex;
  
  // Handle special logical operators first
  if ('$or' in criteria && Array.isArray(criteria.$or)) {
    const orConditions = criteria.$or.map(subCriteria => {
      const result = buildWhereConditions(subCriteria, paramIndex);
      paramIndex = result.paramIndex;
      values.push(...result.values);
      return `(${result.conditions})`;
    });
    
    return { 
      conditions: orConditions.join(' OR '), 
      values, 
      paramIndex 
    };
  }
  
  if ('$and' in criteria && Array.isArray(criteria.$and)) {
    const andConditions = criteria.$and.map(subCriteria => {
      const result = buildWhereConditions(subCriteria, paramIndex);
      paramIndex = result.paramIndex;
      values.push(...result.values);
      return `(${result.conditions})`;
    });
    
    return { 
      conditions: andConditions.join(' AND '), 
      values, 
      paramIndex 
    };
  }
  
  // Process regular criteria
  const conditions = Object.entries(criteria)
    .filter(([key]) => key !== '$or' && key !== '$and') // Skip logical operators
    .map(([key, value]) => {
      // Check if the value is an object with operators
      if (value !== null && typeof value === 'object' && !Array.isArray(value)) {
        // It's an object with operators
        const operatorConditions = Object.entries(value as { [key: string]: unknown }).map(([op, opValue]) => {
          values.push(opValue);
          
          // Handle special operators
          if (op === '$like') {
            return `"${key}" ILIKE $${paramIndex++}`;
          }
          
          return `"${key}" ${op} $${paramIndex++}`;
        });
        
        return operatorConditions.join(' AND ');
      } else {
        // It's a regular equality comparison
        values.push(value);
        return `"${key}" = $${paramIndex++}`;
      }
    }).join(' AND ');
  
  return { conditions, values, paramIndex };
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
    
    // Use the enhanced condition builder
    const { conditions, values } = buildWhereConditions(criteria);
    
    const query = `
      SELECT * FROM "${tableName}"
      WHERE ${conditions}
      LIMIT 1
    `;
    
    console.log('Query:', query);
    console.log('Values:', values);
    
    const result = await pool.query(query, values);
    return result.rows[0] || null;
  },
  
  // Find a record by ID
  async findById(tableName: string, id: string | number): Promise<Record | null> {
    return this.findOne(tableName, { id });
  },
  
  // Find multiple records with support for operators
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
    const { limit, offset, orderBy, order } = options;
    
    if (Object.keys(criteria).length === 0) {
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
    
    // Use the enhanced condition builder
    const { conditions, values } = buildWhereConditions(criteria);
    
    let queryStr = `SELECT * FROM "${tableName}" WHERE ${conditions}`;
    
    if (orderBy) {
      queryStr += ` ORDER BY "${orderBy}" ${order === 'DESC' ? 'DESC' : 'ASC'}`;
    }
    
    let paramIndex = values.length + 1;
    
    if (limit) {
      queryStr += ` LIMIT $${paramIndex}`;
      values.push(limit);
      paramIndex++;
    }
    
    if (offset) {
      queryStr += ` OFFSET $${paramIndex}`;
      values.push(offset);
    }
    
    console.log('Query:', queryStr);
    console.log('Values:', values);
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
  
  // Count records with support for operators
  async count(tableName: string, criteria: FilterCriteria = {}): Promise<number> {
    if (Object.keys(criteria).length === 0) {
      const result = await pool.query(`SELECT COUNT(*) as count FROM "${tableName}"`);
      return result.rows[0]?.count ? Number(result.rows[0].count) : 0;
    }
    
    // Use the enhanced condition builder
    const { conditions, values } = buildWhereConditions(criteria);
    
    const query = `
      SELECT COUNT(*) as count FROM "${tableName}"
      WHERE ${conditions}
    `;

    console.log('Query:', query);
    console.log('Values:', values);
    
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
    if (Object.keys(criteria).length === 0) {
      throw new Error('Cannot update without criteria');
    }

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
    const dataKeys = Object.keys(data);
    
    if (dataKeys.length === 0) {
      console.log('No data keys found, skipping update');
      return [0, []];
    }
    
    // Build SET clause for update
    const setClauses = dataKeys.map((key, i) => `"${key}" = $${i + 1}`).join(', ');
    
    // Use the enhanced condition builder for WHERE clause
    // We need to offset the parameter index by the number of data fields
    const { conditions, values: whereValues } = buildWhereConditions(criteria, dataKeys.length + 1);
    
    const query = `
      UPDATE "${tableName}"
      SET ${setClauses}
      WHERE ${conditions}
      RETURNING *
    `;
    
    // Combine data values with where clause values
    const values = [...dataKeys.map(key => data[key]), ...whereValues];
    
    console.log('Query:', query);
    console.log('Values:', values);

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
    if (Object.keys(criteria).length === 0) {
      throw new Error('Cannot delete without criteria');
    }
    
    // Use the enhanced condition builder
    const { conditions, values } = buildWhereConditions(criteria);
    
    const query = `
      DELETE FROM "${tableName}"
      WHERE ${conditions}
      RETURNING *
    `;
    
    console.log('Query:', query);
    console.log('Values:', values);
    
    const result = await pool.query(query, values);
    return result.rowCount || 0;
  },
  
  // Execute raw query
  async query<T = Record[]>(queryText: string, values: unknown[] = []): Promise<T> {
    const result = await pool.query(queryText, values);
    return result.rows as unknown as T;
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
    }
    
    console.log('Database tables initialized');
  }
};
