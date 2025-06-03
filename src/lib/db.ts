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
  const conditions: string[] = [];

  // Process all criteria including logical operators
  for (const [key, value] of Object.entries(criteria)) {
    if (key === '$or' && Array.isArray(value)) {
      const orConditions = value.map(subCriteria => {
        const result = buildWhereConditions(subCriteria, paramIndex);
        paramIndex = result.paramIndex;
        values.push(...result.values);
        return `(${result.conditions})`;
      });
      if (orConditions.length > 0) {
        conditions.push(`(${orConditions.join(' OR ')})`); 
      }
    } else if (key === '$and' && Array.isArray(value)) {
      const andConditions = value.map(subCriteria => {
        const result = buildWhereConditions(subCriteria, paramIndex);
        paramIndex = result.paramIndex;
        values.push(...result.values);
        return `(${result.conditions})`;
      });
      if (andConditions.length > 0) {
        conditions.push(`(${andConditions.join(' AND ')})`); 
      }
    } else if (value !== null && typeof value === 'object' && !Array.isArray(value)) {
      // Handle operator conditions (>, <, >=, <=, !=, $like, $in)
      const operatorConditions = Object.entries(value as { [key: string]: unknown }).map(([op, opValue]) => {
        if (op === '$in' && Array.isArray(opValue)) {
          // Handle $in operator with array values
          const placeholders = opValue.map(() => `$${paramIndex++}`).join(', ');
          values.push(...opValue);
          return `"${key}" IN (${placeholders})`;
        }
        values.push(opValue);
        if (op === '$like') {
          return `"${key}" ILIKE $${paramIndex++}`;
        }
        return `"${key}" ${op} $${paramIndex++}`;
      });
      if (operatorConditions.length > 0) {
        conditions.push(`(${operatorConditions.join(' AND ')})`); 
      }
    } else {
      // Regular equality comparison
      values.push(value);
      conditions.push(`"${key}" = $${paramIndex++}`);
    }
  }

  return { 
    conditions: conditions.length > 0 ? conditions.join(' AND ') : 'TRUE',
    values, 
    paramIndex 
  };
}

// Database utility object
export const db = {
  // Find a single record
  async findOne<T = Record>(tableName: string, criteria: FilterCriteria = {}): Promise<T | null> {
    const keys = Object.keys(criteria);
    
    if (keys.length === 0) {
      const result = await sql`SELECT * FROM "${tableName}" LIMIT 1`;
      return result[0] as T || null;
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
    return result.rows[0] as T || null;
  },
  
  // Find a record by ID
  async findById<T = Record>(tableName: string, id: string | number): Promise<T | null> {
    return this.findOne<T>(tableName, { id });
  },
  
  // Find multiple records with support for operators
  async find<T = Record>(
    tableName: string, 
    criteria: FilterCriteria = {}, 
    options: { 
      limit?: number; 
      offset?: number; 
      orderBy?: string; 
      order?: 'ASC' | 'DESC';
      join?: {
        table: string;
        on: string;
        type: 'LEFT' | 'INNER' | 'RIGHT';
      };
      select?: string[];
      groupBy?: string;
    } = {}
  ): Promise<T[]> {
    const { limit, offset, orderBy, order, join, select, groupBy } = options;
    
    // Build the base query
    let queryStr = 'SELECT ';
    
    // Add select fields
    if (select && select.length > 0) {
      queryStr += select.join(', ');
    } else {
      queryStr += `${tableName}.*`;
    }
    
    // Add FROM clause
    queryStr += ` FROM ${tableName}`;
    
    // Add JOIN if specified
    if (join) {
      queryStr += ` ${join.type} JOIN ${join.table} ON ${join.on}`;
    }
    
    // Add WHERE clause if criteria exists
    const values: unknown[] = [];
    if (Object.keys(criteria).length > 0) {
      const { conditions } = buildWhereConditions(criteria);
      queryStr += ` WHERE ${conditions}`;
      values.push(...buildWhereConditions(criteria).values);
    }
    
    // Add GROUP BY if specified
    if (groupBy) {
      queryStr += ` GROUP BY ${groupBy}`;
    }
    
    // Add ORDER BY if specified
    if (orderBy) {
      queryStr += ` ORDER BY ${orderBy} ${order === 'DESC' ? 'DESC' : 'ASC'}`;
    }
    
    // Add LIMIT and OFFSET
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
    console.log('Count criteria:', criteria);
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
  async create<T = Record>(tableName: string, data: Partial<T>): Promise<T> {
    const keys = Object.keys(data);
    const values = keys.map(key => data[key as keyof T]);
    
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

  async createMany<T = Record>(tableName: string, data: Partial<T>[]): Promise<T[]> {
    if (!data.length) {
      return [];
    }

    const columns = Object.keys(data[0]).join(', ');
    const values: unknown[] = [];
    const placeholders: string[] = [];
    let paramIndex = 1;

    // Build values array and placeholders
    data.forEach((item) => {
      const rowValues = Object.values(item);
      const rowPlaceholders = rowValues.map(() => `$${paramIndex++}`).join(', ');
      values.push(...rowValues);
      placeholders.push(`(${rowPlaceholders})`);
    });

    const query = `
      INSERT INTO "${tableName}" (${columns})
      VALUES ${placeholders.join(', ')}
      RETURNING *
    `;

    console.log('Query:', query);
    console.log('Values:', values);

    const result = await pool.query(query, values);
    return result.rows;
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
    
    const tableCheckCourses = await pool.query(`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_name = 'courses'
      ) as exists
    `);
    
    const tableExistsCourses = tableCheckCourses.rows[0]?.exists;
    
    if (!tableExistsCourses) {
    // Create courses table
    await sql`
      CREATE TABLE IF NOT EXISTS courses (
        id SERIAL PRIMARY KEY,
        title TEXT NOT NULL,
        max_price DECIMAL NOT NULL,
        discounted_price DECIMAL NOT NULL,
        discount_percentage DECIMAL NOT NULL,
        description TEXT NOT NULL,
        images TEXT[] NOT NULL,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      );
    `;
    }

    const tableCheckSubjects = await pool.query(`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_name = 'subjects'
      ) as exists
    `);

    const tableExistsSubjects = tableCheckSubjects.rows[0]?.exists;

    if (!tableExistsSubjects) {
      // Create subjects table
      await sql`
        CREATE TABLE IF NOT EXISTS subjects (
          id SERIAL PRIMARY KEY,
          title TEXT NOT NULL,
          description TEXT NOT NULL,
          images TEXT[] NOT NULL,
          created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
          updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
        );
      `;

      // Create course_subjects junction table
      await sql`
        CREATE TABLE IF NOT EXISTS course_subjects (
          course_id INTEGER NOT NULL REFERENCES courses(id) ON DELETE CASCADE,
          subject_id INTEGER NOT NULL REFERENCES subjects(id) ON DELETE CASCADE,
          created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
          PRIMARY KEY (course_id, subject_id)
        );
      `;
    }
    
    console.log('Database tables initialized');
  }
};

// db.initializeTables();